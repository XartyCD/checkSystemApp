const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
    getCpuLoad: () => ipcRenderer.invoke('get-cpu-load'),
    getMemoryUsage: () => ipcRenderer.invoke('get-memory-usage'),
    getApplications: () => ipcRenderer.invoke('get-applications'),
    send: (channel, data) => ipcRenderer.send(channel, data),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});

