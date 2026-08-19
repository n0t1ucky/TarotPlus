const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getCurrentTime: () => ipcRenderer.invoke('get-current-time'),
  onOmenReset: (callback) => {
    ipcRenderer.on('omen-reset', () => callback());
  },
  historyAdd: (entry) => ipcRenderer.invoke('history-add', entry),
  historyGetAll: () => ipcRenderer.invoke('history-get-all'),
  windowGetCurrentPreset: () => ipcRenderer.invoke('window-get-presets'),
  onWindowPresetChanged: (callback) => {
    ipcRenderer.on('window-preset-changed', (_e, name) => callback(name));
  },
  showToast: (message, durationMs) => ipcRenderer.send('show-toast', message, durationMs)
});
