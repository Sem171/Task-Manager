// Electron main process: wraps the Vite build in a native desktop window.
const { app, BrowserWindow, ipcMain, Menu, nativeImage, nativeTheme, Notification, shell, Tray } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const APP_ID = 'app.nova.tasks';
const ICON = path.join(__dirname, '..', 'build', 'icon.png');
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
// Launched by "Start with Windows": stay in the tray until opened.
const START_HIDDEN = process.argv.includes('--hidden');

let win = null;
let tray = null;
// Closing the window only hides it; this flips when the user really means to quit.
let quitting = false;

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(patch) {
  try {
    fs.writeFileSync(settingsFile(), JSON.stringify({ ...readSettings(), ...patch }));
  } catch {
    // Non-fatal: worst case the tray hint shows again.
  }
}

function readWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
  } catch {
    return { width: 1280, height: 860 };
  }
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return;
  const state = { ...win.getNormalBounds(), maximized: win.isMaximized() };
  try {
    fs.writeFileSync(stateFile(), JSON.stringify(state));
  } catch {
    // Non-fatal: the window just opens at the default size next time.
  }
}

function createWindow() {
  const state = readWindowState();

  win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 420,
    minHeight: 560,
    show: false,
    title: 'Nova Tasks',
    icon: fs.existsSync(ICON) ? ICON : undefined,
    // Matches body bg (zinc-50 / zinc-950) so there is no white flash on launch.
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#09090b' : '#fafafa',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
      // Alarms must ring on time and with sound even while minimized or untouched.
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  if (state.maximized) win.maximize();
  win.once('ready-to-show', () => {
    if (!START_HIDDEN) win.show();
  });

  // Closing hides to the tray so reminders and alarms keep running in the background.
  win.on('close', (event) => {
    saveWindowState();
    if (quitting) return;
    event.preventDefault();
    win.hide();
    showTrayHintOnce();
  });
  // Windows is shutting down or logging off: let the window actually close.
  win.on('session-end', () => {
    quitting = true;
  });

  // Links open in the user's browser; the app window never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (DEV_URL && url.startsWith(DEV_URL)) return;
    event.preventDefault();
    if (/^https?:/.test(url)) shell.openExternal(url);
  });

  if (DEV_URL) win.loadURL(DEV_URL);
  else win.loadFile(path.join(__dirname, '..', 'dist-desktop', 'index.html'));
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function showTrayHintOnce() {
  if (readSettings().trayHintShown || !Notification.isSupported()) return;
  writeSettings({ trayHintShown: true });
  const note = new Notification({
    title: 'Nova Tasks is still running',
    body: 'Reminders and alarms stay on in the background. Right-click the tray icon to quit.',
    icon: ICON,
  });
  note.on('click', showWindow);
  note.show();
}

function createTray() {
  const image = nativeImage.createFromPath(ICON).resize({ width: 32, height: 32 });
  tray = new Tray(image);
  tray.setToolTip('Nova Tasks · reminders on');
  tray.on('click', showWindow);
  tray.on('double-click', showWindow);

  const buildMenu = () =>
    Menu.buildFromTemplate([
      { label: 'Open Nova Tasks', click: showWindow },
      { type: 'separator' },
      // Login items point at the installed exe, so this only makes sense in a packaged build.
      ...(app.isPackaged
        ? [
            {
              label: 'Start with Windows',
              type: 'checkbox',
              checked: app.getLoginItemSettings().openAtLogin,
              click: (item) => {
                app.setLoginItemSettings({ openAtLogin: item.checked, args: ['--hidden'] });
                tray.setContextMenu(buildMenu());
              },
            },
            { type: 'separator' },
          ]
        : []),
      {
        label: 'Quit Nova Tasks',
        click: () => {
          quitting = true;
          app.quit();
        },
      },
    ]);
  tray.setContextMenu(buildMenu());
}

// One window only: a second launch focuses the existing one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.on('before-quit', () => {
    quitting = true;
  });

  // Required for reminder notifications to show on Windows.
  if (process.platform === 'win32') app.setAppUserModelId(APP_ID);

  // While an alarm rings, pull the window in front of everything and flash the taskbar.
  ipcMain.on('alarm', (event, active) => {
    const target = BrowserWindow.fromWebContents(event.sender);
    if (!target) return;
    if (active) {
      if (target.isMinimized()) target.restore();
      target.show();
      target.setAlwaysOnTop(true, 'screen-saver');
      target.focus();
      target.flashFrame(true);
    } else {
      target.setAlwaysOnTop(false);
      target.flashFrame(false);
    }
  });

  app.whenReady().then(() => {
    if (!DEV_URL) Menu.setApplicationMenu(null);
    createWindow();
    createTray();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else showWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
