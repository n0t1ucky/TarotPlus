const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCurrentTime: () => ipcRenderer.invoke('get-current-time'),
  onOmenReset: (callback) => {
    ipcRenderer.on('omen-reset', () => callback());
  },
  historyAdd: (entry) => ipcRenderer.invoke('history-add', entry),
  historyGetAll: () => ipcRenderer.invoke('history-get-all')
});
