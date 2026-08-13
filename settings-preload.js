const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCurrentTime: () => ipcRenderer.invoke('get-current-time'),
  resetOmen: () => ipcRenderer.send('reset-omen')
});
