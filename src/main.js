const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const scrcpyManager = require('./js/scrcpy-manager');

// 保持对窗口对象的全局引用，避免 JavaScript 垃圾回收时窗口被关闭
let mainWindow;
let scrcpyProcess = null;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#121212',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'js', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 加载应用的入口 HTML 文件
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // 开发环境打开 DevTools
  // mainWindow.webContents.openDevTools();

  // 当窗口关闭时进行的操作
  mainWindow.on('closed', () => {
    // 清理进程和引用
    if (scrcpyProcess) {
      scrcpyProcess.kill();
      scrcpyProcess = null;
    }
    mainWindow = null;
  });
}

// 应用初始化完成时创建窗口
app.whenReady().then(() => {
  createWindow();

  // 设置 IPC 处理
  setupIpcHandlers();

  // macOS 中点击 Dock 图标时, 如果没有其他窗口打开, 则重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  // 在 macOS 中, 用户通过 Cmd + Q 显式退出之前,
  // 应用和菜单栏通常会保持活跃状态
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前的清理工作
app.on('will-quit', () => {
  // 终止任何运行中的进程
  if (scrcpyProcess) {
    scrcpyProcess.kill();
  }
  
  // 清理临时文件
  scrcpyManager.cleanup();
});

function setupIpcHandlers() {
  ipcMain.handle('window-minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
    return { success: true };
  });

  ipcMain.handle('window-toggle-maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      return { success: true, isMaximized: mainWindow.isMaximized() };
    }
    return { success: false, isMaximized: false };
  });

  ipcMain.handle('window-is-maximized', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      return { success: true, isMaximized: mainWindow.isMaximized() };
    }
    return { success: false, isMaximized: false };
  });

  ipcMain.handle('window-close', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    return { success: true };
  });

  // 列出USB设备
  ipcMain.handle('list-usb-devices', async () => {
    try {
      return await scrcpyManager.listUsbDevices();
    } catch (error) {
      console.error('Error listing USB devices:', error);
      return { success: false, error: error.message };
    }
  });

  // 获取设备IP地址
  ipcMain.handle('get-device-ip', async (event, deviceId) => {
    try {
      const ip = await scrcpyManager.getDeviceIpAddress(deviceId);
      return { success: true, ip };
    } catch (error) {
      console.error('Error getting device IP:', error);
      return { success: false, error: error.message };
    }
  });

  // 初始化无线连接
  ipcMain.handle('init-wireless', async (event, deviceId) => {
    try {
      await scrcpyManager.enableTcpipMode(deviceId);
      const ip = await scrcpyManager.getDeviceIpAddress(deviceId);
      return { success: true, ip };
    } catch (error) {
      console.error('Error initializing wireless connection:', error);
      return { success: false, error: error.message };
    }
  });

  // 连接到无线设备
  ipcMain.handle('connect-wireless', async (event, ip) => {
    try {
      const result = await scrcpyManager.connectOverWifi(ip);
      return { success: true, result };
    } catch (error) {
      console.error('Error connecting to wireless device:', error);
      return { success: false, error: error.message };
    }
  });

  // 列出无线设备
  ipcMain.handle('list-wireless-devices', async () => {
    try {
      return await scrcpyManager.listWirelessDevices();
    } catch (error) {
      console.error('Error listing wireless devices:', error);
      return { success: false, error: error.message };
    }
  });

  // 断开无线设备
  ipcMain.handle('disconnect-wireless', async (event, deviceId) => {
    try {
      await scrcpyManager.disconnectDevice(deviceId);
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting wireless device:', error);
      return { success: false, error: error.message };
    }
  });

  // 启动 scrcpy
  ipcMain.handle('start-scrcpy', async (event, { deviceId, options = [] }) => {
    try {
      // 关闭现有进程
      if (scrcpyProcess) {
        scrcpyProcess.kill();
        scrcpyProcess = null;
      }
      
      // 准备参数
      const args = deviceId ? ['-s', deviceId, ...options] : options;
      
      // 启动 scrcpy
      scrcpyProcess = await scrcpyManager.runScrcpy(args);
      
      return { success: true };
    } catch (error) {
      console.error('Error starting scrcpy:', error);
      return { success: false, error: error.message };
    }
  });

  // 启动无线 scrcpy
  ipcMain.handle('start-scrcpy-wireless', async (event, { deviceIp, options = [] }) => {
    try {
      // 关闭现有进程
      if (scrcpyProcess) {
        scrcpyProcess.kill();
        scrcpyProcess = null;
      }
      
      // 启动无线 scrcpy
      scrcpyProcess = await scrcpyManager.runScrcpyWireless(deviceIp, options);
      
      return { success: true };
    } catch (error) {
      console.error('Error starting wireless scrcpy:', error);
      return { success: false, error: error.message };
    }
  });

  // 停止 scrcpy
  ipcMain.handle('stop-scrcpy', () => {
    if (scrcpyProcess) {
      scrcpyProcess.kill();
      scrcpyProcess = null;
      return { success: true };
    }
    return { success: false, message: 'No running scrcpy process' };
  });

  // 检查设备是否锁定
  ipcMain.handle('is-device-locked', async (event, deviceId) => {
    try {
      const isLocked = await scrcpyManager.isDeviceLocked(deviceId);
      return { success: true, isLocked };
    } catch (error) {
      console.error('Error checking device lock status:', error);
      return { success: false, error: error.message };
    }
  });

  // 解锁设备
  ipcMain.handle('unlock-device', async (event, deviceId, password) => {
    try {
      const unlocked = await scrcpyManager.unlockDevice(deviceId, password);
      return { success: unlocked, message: unlocked ? '设备解锁成功' : '设备解锁失败' };
    } catch (error) {
      console.error('Error unlocking device:', error);
      return { success: false, error: error.message };
    }
  });
}
