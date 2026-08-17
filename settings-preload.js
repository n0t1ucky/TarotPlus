const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCurrentTime: () => ipcRenderer.invoke('get-current-time'),
  resetOmen: () => ipcRenderer.send('reset-omen'),
  historyGetAll: () => ipcRenderer.invoke('history-get-all'),
  historyUpdateInterpretation: (payload) => ipcRenderer.invoke('history-update-interpretation', payload)
});
