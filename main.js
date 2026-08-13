const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let win = null;
let tray = null;
let settingsWin = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workArea;

  const winWidth = 360;
  const winHeight = 176;

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
    width: 320,
    height: 240,
    resizable: false,
    maximizable: false,
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
