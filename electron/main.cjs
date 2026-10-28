// Electron main process: wraps the Vite build in a native desktop window.
const { app, BrowserWindow, ipcMain, Menu, nativeTheme, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const DEV_URL = process.env.VITE_DEV_SERVER_URL;
const APP_ID = 'app.nova.tasks';
const ICON = path.join(__dirname, '..', 'build', 'icon.png');
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');

let win = null;

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
  win.once('ready-to-show', () => win.show());
  win.on('close', saveWindowState);

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

// One window only: a second launch focuses the existing one.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
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
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
