const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let tray = null;
let settingsWin = null;

const HISTORY_FILE = path.join(app.getPath('userData'), 'tarot-history.json');
const CONFIG_FILE = path.join(app.getPath('userData'), 'window-config.json');

const WINDOW_PRESETS = {
  standard: { width: 360, height: 176, label: '標準' },
  compact: { width: 180, height: 90, label: '緊湊' }
};

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

function writeConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function readHistory() {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function writeHistory(records) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(records, null, 2), 'utf8');
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workArea;

  const config = readConfig();
  const presetName = WINDOW_PRESETS[config.windowPreset] ? config.windowPreset : 'standard';
  const preset = WINDOW_PRESETS[presetName];

  const winWidth = preset.width;
  const winHeight = preset.height;

  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: width - winWidth - 12,
    y: height - winHeight - 12,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');

  win.on('closed', () => {
    win = null;
  });
}

function createSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }

  settingsWin = new BrowserWindow({
    width: 340,
    height: 520,
    resizable: true,
    maximizable: true,
    minimizable: false,
    title: '設置',
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWin.setMenu(null);
  settingsWin.loadFile('settings.html');

  settingsWin.on('closed', () => {
    settingsWin = null;
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray-32.png'));
  tray = new Tray(icon);
  tray.setToolTip('番茄鐘');

  const menu = Menu.buildFromTemplate([
    {
      label: '設置',
      click: () => {
        createSettingsWindow();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('get-current-time', () => {
  const now = new Date();
  return {
    iso: now.toISOString(),
    local: now.toString(),
    timezoneOffsetMinutes: now.getTimezoneOffset()
  };
});

// 設定視窗請求：重置當天塔羅抽牌機會
ipcMain.on('reset-omen', () => {
  if (win && !win.isDestroyed()) {
    win.webContents.send('omen-reset');
  }
});

// 窗口尺寸
ipcMain.handle('window-get-presets', () => {
  const config = readConfig();
  const current = WINDOW_PRESETS[config.windowPreset] ? config.windowPreset : 'standard';
  return { presets: WINDOW_PRESETS, current };
});

ipcMain.handle('window-set-preset', (_e, presetName) => {
  const preset = WINDOW_PRESETS[presetName];
  if (!preset) return false;
  const config = readConfig();
  config.windowPreset = presetName;
  writeConfig(config);

  if (win && !win.isDestroyed()) {
    const { width, height } = screen.getPrimaryDisplay().workArea;
    // resizable:false 時 setSize 縮小常被忽略，暫時開啟 resize 強制套用
    win.setResizable(true);
    win.setBounds({
      width: preset.width,
      height: preset.height,
      x: width - preset.width - 12,
      y: height - preset.height - 12
    });
    win.setResizable(false);
    win.webContents.send('window-preset-changed', presetName);
  }
  return true;
});

// 塔羅歷史記錄
ipcMain.handle('history-get-all', () => {
  return readHistory();
});

ipcMain.handle('history-add', (_e, entry) => {
  const records = readHistory();
  const item = {
    timestamp: entry.timestamp || new Date().toISOString(),
    cards: entry.cards || '',
    interpretation: entry.interpretation || ''
  };
  records.push(item);
  writeHistory(records);
  return item;
});

ipcMain.handle('history-update-interpretation', (_e, { cards, interpretation }) => {
  const records = readHistory();
  // 找最近的、尚未有解讀、且牌面相符的記錄
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    if (r.cards === cards && !r.interpretation) {
      r.interpretation = interpretation;
      writeHistory(records);
      return true;
    }
  }
  return false;
});
