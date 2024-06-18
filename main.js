const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const si = require('systeminformation');
const osu = require('os-utils');
const regedit = require('regedit');
const { exec } = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


ipcMain.on('open-auth-window', () => {
  createWindow();
})

// Создание нового окна при получении сообщения от рендерера
ipcMain.on('open-register-window', () => {
  const registerWindow = new BrowserWindow({
    width: 430,
    height: 360,
    modal: true, // Делаем новое окно модальным
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  registerWindow.loadFile(path.join(__dirname, 'interface', 'register.html'));
});

ipcMain.on('open-account-window', () => {
  const accountWindow = new BrowserWindow({
    width: 870,
    height: 640,
    modal: false, // Делаем новое окно модальным
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  accountWindow.loadFile(path.join(__dirname, 'interface', 'account.html'));
});




ipcMain.handle('get-system-info', async () => {
  try {
    const motherboard = await si.baseboard();
    const cpu = await si.cpu();
    const gpu = await si.graphics();
    const memory = await si.mem();
    const disk = await si.diskLayout();
    const osInfo = await si.osInfo();
    const currentLoad = await si.currentLoad();
    const cpuTemp = await si.cpuTemperature();

    return {
      motherboard,
      cpu,
      gpu,
      memory,
      disk,
      osInfo,
      currentLoad,
      cpuTemp,
    };
  } catch (error) {
    console.error('Error fetching system information:', error);
    throw error;
  }
});

// Handle IPC call for getting memory usage
ipcMain.handle('get-memory-usage', async () => {
  try {
    const mem = await si.mem();
    return mem;
  } catch (error) {
    console.error('Error fetching memory usage:', error);
    throw error;
  }
});

ipcMain.handle('get-cpu-load', () => {
  return new Promise((resolve) => {
    osu.cpuUsage((v) => {
      resolve(v);
    });
  });
});


ipcMain.handle('get-registry-info', async () => {
  try {
    const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    const regData = await regedit.promisified.list(regKey);

    // Извлекаем нужные данные
    const registryEntries = regData[regKey].values;

    // Преобразуем данные в нужный формат, если требуется
    return registryEntries;
  } catch (error) {
    console.error('Error fetching registry info:', error);
    throw error;
  }
});

ipcMain.handle('get-installed-apps', async () => {
  const platform = process.platform;

  if (platform === 'win32') {
    return getInstalledAppsWindows();
  } else if (platform === 'darwin') {
    return getInstalledAppsMac();
  } else if (platform === 'linux') {
    return getInstalledAppsLinux();
  } else {
    throw new Error('Unsupported platform');
  }
});

function getInstalledAppsWindows() {
  return new Promise((resolve, reject) => {
    exec('wmic product get name,version', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      const lines = stdout.split('\n').slice(1);
      const apps = lines.map(line => {
        const parts = line.trim().split(/\s{2,}/);
        return { name: parts[0], version: parts[1] };
      }).filter(app => app.name);
      resolve(apps);
    });
  });
}

function getInstalledAppsMac() {
  return new Promise((resolve, reject) => {
    exec('system_profiler SPApplicationsDataType -json', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      const apps = JSON.parse(stdout).SPApplicationsDataType;
      resolve(apps.map(app => ({ name: app._name, version: app.version })));
    });
  });
}

function getInstalledAppsLinux() {
  return new Promise((resolve, reject) => {
    exec('dpkg-query -W -f=\'${Package} ${Version}\n\'', (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      const lines = stdout.split('\n');
      const apps = lines.map(line => {
        const parts = line.trim().split(' ');
        return { name: parts[0], version: parts[1] };
      }).filter(app => app.name);
      resolve(apps);
    });
  });
}
