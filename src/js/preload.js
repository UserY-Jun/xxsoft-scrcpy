const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('androidController', {
  // 设备管理
  listUsbDevices: () => ipcRenderer.invoke('list-usb-devices'),
  listWirelessDevices: () => ipcRenderer.invoke('list-wireless-devices'),
  getDeviceIp: (deviceId) => ipcRenderer.invoke('get-device-ip', deviceId),
  
  // 无线连接功能
  initWireless: (deviceId) => ipcRenderer.invoke('init-wireless', deviceId),
  connectWireless: (ip) => ipcRenderer.invoke('connect-wireless', ip),
  disconnectWireless: (deviceId) => ipcRenderer.invoke('disconnect-wireless', deviceId),
  
  // scrcpy 控制
  startScrcpy: (config) => ipcRenderer.invoke('start-scrcpy', config),
  startScrcpyWireless: (config) => ipcRenderer.invoke('start-scrcpy-wireless', config),
  stopScrcpy: () => ipcRenderer.invoke('stop-scrcpy'),
  
  // 设备解锁功能
  isDeviceLocked: (deviceId) => ipcRenderer.invoke('is-device-locked', deviceId),
  unlockDevice: (deviceId, password) => ipcRenderer.invoke('unlock-device', deviceId, password)
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window-toggle-maximize'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  close: () => ipcRenderer.invoke('window-close')
});
