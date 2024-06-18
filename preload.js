const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getRegistryInfo: () => ipcRenderer.invoke('get-registry-info'),
    getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
    getCpuLoad: () => ipcRenderer.invoke('get-cpu-load'),
    getMemoryUsage: () => ipcRenderer.invoke('get-memory-usage'),
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});

