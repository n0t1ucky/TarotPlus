const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCurrentTime: () => ipcRenderer.invoke('get-current-time'),
  onOmenReset: (callback) => {
    ipcRenderer.on('omen-reset', () => callback());
  }
});
