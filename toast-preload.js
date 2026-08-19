const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onToastShow: (cb) => ipcRenderer.on('toast-show', (_e, message) => cb(message)),
  dismiss: () => ipcRenderer.send('toast-dismiss'),
  resize: (contentWidth) => ipcRenderer.send('toast-resize', contentWidth)
});
