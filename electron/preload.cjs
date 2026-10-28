// Exposes a minimal, typed bridge to the renderer (see src/desktop.d.ts).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaDesktop', {
  setAlarm: (active) => ipcRenderer.send('alarm', Boolean(active)),
});
