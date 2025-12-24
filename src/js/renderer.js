/**
 * Android投屏助手 - 渲染进程脚本
 */

// 应用状态管理
const AppState = {
  // 当前选中的设备信息
  selectedDevice: null,
  // 是否正在投屏
  isMirroring: false,
  // 是否正在刷新设备列表
  isRefreshingDevices: false,
  // 是否正在设置无线连接
  isSettingUpWireless: false
};

// DOM 元素引用
const UI = {
  titleBar: document.getElementById('titleBar'),
  windowMinimizeBtn: document.getElementById('windowMinimizeBtn'),
  windowMaximizeBtn: document.getElementById('windowMaximizeBtn'),
  windowCloseBtn: document.getElementById('windowCloseBtn'),

  // 设备列表相关
  usbDeviceList: document.getElementById('usbDeviceList'),
  wirelessDeviceList: document.getElementById('wirelessDeviceList'),
  refreshUsbBtn: document.getElementById('refreshUsbBtn'),
  refreshWirelessBtn: document.getElementById('refreshWirelessBtn'),
  refreshDevicesBtn: document.getElementById('refreshDevicesBtn'),
  
  // 无线连接相关
  deviceIpInput: document.getElementById('deviceIp'),
  connectWifiBtn: document.getElementById('connectWifiBtn'),
  
  // 设备信息和控制
  currentDeviceTitle: document.getElementById('currentDeviceTitle'),
  noDeviceMsg: document.getElementById('noDeviceMsg'),
  mirroringOptions: document.getElementById('mirroringOptions'),
  deviceInfo: document.getElementById('deviceInfo'),
  deviceInfoContent: document.getElementById('deviceInfoContent'),
  connectionHelp: document.getElementById('connectionHelp'),
  
  // 设备解锁相关
  unlockPassword: document.getElementById('unlockPassword'),
  unlockDeviceBtn: document.getElementById('unlockDeviceBtn'),

  // 投屏选项相关
  maxResolution: document.getElementById('maxResolution'),
  bitRate: document.getElementById('bitRate'),
  maxFps: document.getElementById('maxFps'),
  rotation: document.getElementById('rotation'),
  stayAwake: document.getElementById('stayAwake'),
  showTouches: document.getElementById('showTouches'),
  
  // 控制按钮
  startMirroringBtn: document.getElementById('startMirroringBtn'),
  stopMirroringBtn: document.getElementById('stopMirroringBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  
  // 状态栏
  statusMessage: document.getElementById('statusMessage')
};

// ------------------------------------------------------------------------
// 初始化
// ------------------------------------------------------------------------

// 初始化应用
function initApp() {
  // 绑定事件处理
  bindEventHandlers();
  
  // 首次加载刷新设备列表
  refreshAllDevices();
  
  // 显示加载界面
  showStatus('应用已启动，正在搜索设备...');
}

// 绑定 UI 事件处理器
function bindEventHandlers() {
  // 设备刷新按钮
  UI.refreshUsbBtn.addEventListener('click', refreshUsbDevices);
  UI.refreshWirelessBtn.addEventListener('click', refreshWirelessDevices);
  UI.refreshDevicesBtn.addEventListener('click', refreshAllDevices);
  
  // WiFi 连接按钮
  UI.connectWifiBtn.addEventListener('click', connectToWirelessDevice);
  
  // 投屏控制按钮
  UI.startMirroringBtn.addEventListener('click', startMirroring);
  UI.stopMirroringBtn.addEventListener('click', stopMirroring);
  
  // 设备解锁按钮
  const unlockDeviceBtn = document.getElementById('unlockDeviceBtn');
  if (unlockDeviceBtn) {
    unlockDeviceBtn.addEventListener('click', unlockDevice);
  }

  const setMaximizeIcon = (isMaximized) => {
    if (!UI.windowMaximizeBtn) return;
    const icon = UI.windowMaximizeBtn.querySelector('i');
    if (!icon) return;
    icon.className = isMaximized ? 'ri-checkbox-multiple-blank-line' : 'ri-checkbox-blank-line';
  };

  if (window.windowControls) {
    if (UI.windowMinimizeBtn) {
      UI.windowMinimizeBtn.addEventListener('click', () => window.windowControls.minimize());
    }

    if (UI.windowCloseBtn) {
      UI.windowCloseBtn.addEventListener('click', () => window.windowControls.close());
    }

    if (UI.windowMaximizeBtn) {
      UI.windowMaximizeBtn.addEventListener('click', async () => {
        const result = await window.windowControls.toggleMaximize();
        if (result && result.success) setMaximizeIcon(result.isMaximized);
      });
    }

    if (UI.titleBar) {
      UI.titleBar.addEventListener('dblclick', async (event) => {
        if (event.target && event.target.closest && event.target.closest('.titlebar-interactive')) return;
        const result = await window.windowControls.toggleMaximize();
        if (result && result.success) setMaximizeIcon(result.isMaximized);
      });
    }

    window.windowControls.isMaximized().then((result) => {
      if (result && result.success) setMaximizeIcon(result.isMaximized);
    });
  }
}

// ------------------------------------------------------------------------
// 设备列表管理
// ------------------------------------------------------------------------

// 刷新所有设备列表
async function refreshAllDevices() {
  if (AppState.isRefreshingDevices) return;
  
  try {
    AppState.isRefreshingDevices = true;
    showStatus('正在搜索设备...');
    
    // 并行刷新 USB 和无线设备
    await Promise.all([
      refreshUsbDevices(),
      refreshWirelessDevices()
    ]);
    
    showStatus('设备刷新完成');
  } catch (error) {
    showStatus(`刷新设备失败: ${error.message}`, 'error');
    console.error('Error refreshing devices:', error);
  } finally {
    AppState.isRefreshingDevices = false;
  }
}

// 刷新 USB 设备列表
async function refreshUsbDevices() {
  try {
    UI.usbDeviceList.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
      </div>
    `;
    
    // 调用主进程 API 获取设备列表
    const devices = await window.androidController.listUsbDevices();
    
    // 更新 UI
    renderDeviceList(devices, UI.usbDeviceList, 'usb');
  } catch (error) {
    console.error('Error refreshing USB devices:', error);
    UI.usbDeviceList.innerHTML = `
      <div class="alert alert-error">
        <div class="alert-content">获取设备列表失败: ${error.message}</div>
      </div>
    `;
  }
}

// 刷新无线设备列表
async function refreshWirelessDevices() {
  try {
    UI.wirelessDeviceList.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
      </div>
    `;
    
    // 调用主进程 API 获取无线设备列表
    const devices = await window.androidController.listWirelessDevices();
    
    // 更新 UI
    renderDeviceList(devices, UI.wirelessDeviceList, 'wireless');
  } catch (error) {
    console.error('Error refreshing wireless devices:', error);
    UI.wirelessDeviceList.innerHTML = `
      <div class="alert alert-error">
        <div class="alert-content">获取无线设备列表失败: ${error.message}</div>
      </div>
    `;
  }
}

// 在 UI 中渲染设备列表
function renderDeviceList(devices, container, type) {
  if (!Array.isArray(devices) || devices.length === 0) {
    container.innerHTML = `
      <div class="alert">
        <div class="alert-content">未检测到${type === 'usb' ? 'USB' : '无线'}设备</div>
      </div>
    `;
    return;
  }
  
  // 生成设备列表 HTML
  const html = devices.map(device => {
    const isOnline = device.status === 'device';
    const statusClass = isOnline ? 'status-online' : '';
    const deviceTitle = `${device.id}${device.info && device.info.model ? ` (${device.info.model})` : ''}`;
    
    return `
      <div class="device-item" data-id="${device.id}" data-type="${type}">
        <div class="device-info">
          <div class="device-name">${deviceTitle}</div>
          <div class="device-status ${statusClass}">
            ${isOnline ? '已连接' : '未授权或离线'}
          </div>
        </div>
        <div class="device-actions">
          ${type === 'usb' && isOnline ? `
            <button class="btn btn-accent enable-wifi-btn" data-id="${device.id}">
              启用WiFi
            </button>
          ` : ''}
          <button class="btn btn-primary select-device-btn" data-id="${device.id}" ${!isOnline ? 'disabled' : ''}>
            选择
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // 更新容器内容
  container.innerHTML = html;
  
  // 绑定设备按钮事件
  container.querySelectorAll('.select-device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const deviceId = btn.getAttribute('data-id');
      selectDevice(deviceId, type);
    });
  });
  
  // 绑定启用WiFi按钮事件
  container.querySelectorAll('.enable-wifi-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const deviceId = btn.getAttribute('data-id');
      setupWirelessConnection(deviceId);
    });
  });
}

// 选择设备
async function selectDevice(deviceId, type) {
  try {
    // 更新选中状态
    const prevDevice = AppState.selectedDevice;
    AppState.selectedDevice = { id: deviceId, type };
    
    // 更新 UI
    UI.currentDeviceTitle.textContent = `设备: ${deviceId}`;
    UI.noDeviceMsg.style.display = 'none';
    UI.mirroringOptions.style.display = 'block';
    UI.deviceInfo.style.display = 'block';
    UI.connectionHelp.style.display = 'none';
    
    // 高亮选中设备
    document.querySelectorAll('.device-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    const selectedItem = document.querySelector(`.device-item[data-id="${deviceId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }
    
    // 获取并显示设备信息
    await loadDeviceInfo(deviceId);
    
    showStatus(`已选择设备: ${deviceId}`);
  } catch (error) {
    console.error('Error selecting device:', error);
    showStatus(`选择设备失败: ${error.message}`, 'error');
  }
}

// 加载设备信息
async function loadDeviceInfo(deviceId) {
  // 设备信息可以通过 adb 命令获取，这里简化处理
  UI.deviceInfoContent.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
    </div>
  `;
  
  try {
    // 在实际应用中，这里应该调用 IPC 来获取详细设备信息
    // 简化示例，仅显示设备 ID
    UI.deviceInfoContent.innerHTML = `
      <div class="device-info-item">
        <div class="device-info-label">设备 ID:</div>
        <div class="device-info-value">${deviceId}</div>
      </div>
      <div class="device-info-item">
        <div class="device-info-label">连接类型:</div>
        <div class="device-info-value">${AppState.selectedDevice.type === 'usb' ? 'USB' : '无线'}</div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading device info:', error);
    UI.deviceInfoContent.innerHTML = `
      <div class="alert alert-error">
        <div class="alert-content">获取设备信息失败: ${error.message}</div>
      </div>
    `;
  }
}

// ------------------------------------------------------------------------
// 无线连接管理
// ------------------------------------------------------------------------

// 设置无线连接
async function setupWirelessConnection(deviceId) {
  if (AppState.isSettingUpWireless) return;
  
  try {
    AppState.isSettingUpWireless = true;
    showStatus(`正在为设备 ${deviceId} 启用无线连接...`);
    
    // 禁用相关按钮
    const enableWifiBtn = document.querySelector(`.enable-wifi-btn[data-id="${deviceId}"]`);
    if (enableWifiBtn) {
      enableWifiBtn.disabled = true;
      enableWifiBtn.textContent = '正在设置...';
    }
    
    // 调用 IPC 启用 TCP/IP 模式
    const result = await window.androidController.initWireless(deviceId);
    
    if (result.success) {
      // 设置成功，显示 IP 地址
      UI.deviceIpInput.value = result.ip;
      showStatus(`无线连接已启用! 设备 IP: ${result.ip}`, 'success');
      
      // 提示用户可以断开 USB 线
      alert(`无线连接已启用!\n\n设备 IP: ${result.ip}\n\n您现在可以断开 USB 线，然后点击"连接"按钮建立无线连接。`);
    } else {
      showStatus(`启用无线连接失败: ${result.error || '未知错误'}`, 'error');
    }
  } catch (error) {
    console.error('Error setting up wireless connection:', error);
    showStatus(`启用无线连接失败: ${error.message}`, 'error');
  } finally {
    AppState.isSettingUpWireless = false;
    
    // 恢复按钮状态
    const enableWifiBtn = document.querySelector(`.enable-wifi-btn[data-id="${deviceId}"]`);
    if (enableWifiBtn) {
      enableWifiBtn.disabled = false;
      enableWifiBtn.textContent = '启用WiFi';
    }
  }
}

// 连接到无线设备
async function connectToWirelessDevice() {
  const deviceIp = UI.deviceIpInput.value.trim();
  
  if (!deviceIp) {
    showStatus('请输入设备 IP 地址', 'error');
    return;
  }
  
  try {
    showStatus(`正在连接到设备 ${deviceIp}...`);
    UI.connectWifiBtn.disabled = true;
    UI.connectWifiBtn.textContent = '连接中...';
    
    // 调用 IPC 连接到无线设备
    const result = await window.androidController.connectWireless(deviceIp);
    
    if (result.success) {
      showStatus(`成功连接到设备 ${deviceIp}`, 'success');
      
      // 刷新无线设备列表
      await refreshWirelessDevices();
    } else {
      showStatus(`连接失败: ${result.error || '未知错误'}`, 'error');
    }
  } catch (error) {
    console.error('Error connecting to wireless device:', error);
    showStatus(`连接错误: ${error.message}`, 'error');
  } finally {
    UI.connectWifiBtn.disabled = false;
    UI.connectWifiBtn.textContent = '连接';
  }
}

// ------------------------------------------------------------------------
// 设备解锁功能
// ------------------------------------------------------------------------

// 解锁设备
async function unlockDevice() {
  if (!AppState.selectedDevice) {
    showStatus('请先选择一个设备', 'error');
    return;
  }
  
  const password = UI.unlockPassword.value;
  
  try {
    UI.unlockDeviceBtn.disabled = true;
    UI.unlockDeviceBtn.innerHTML = '<i class="ri-loader-2-line ri-spin"></i> 解锁中...';
    showStatus('正在解锁设备...');
    
    // 检查设备是否锁定
    const lockStatus = await window.androidController.isDeviceLocked(AppState.selectedDevice.id);
    
    if (!lockStatus.success) {
      showStatus(`检查锁屏状态失败: ${lockStatus.error || '未知错误'}`, 'error');
      return;
    }
    
    if (!lockStatus.isLocked) {
      showStatus('设备未锁定，无需解锁', 'info');
      return;
    }
    
    // 解锁设备
    const result = await window.androidController.unlockDevice(AppState.selectedDevice.id, password);
    
    if (result.success) {
      showStatus('设备解锁成功', 'success');
    } else {
      showStatus(`设备解锁失败: ${result.error || result.message || '密码可能不正确'}`, 'error');
    }
  } catch (error) {
    console.error('Error unlocking device:', error);
    showStatus(`解锁错误: ${error.message}`, 'error');
  } finally {
    UI.unlockDeviceBtn.disabled = false;
    UI.unlockDeviceBtn.innerHTML = '<i class="ri-lock-unlock-line"></i> 解锁设备';
  }
}

// ------------------------------------------------------------------------
// 投屏控制
// ------------------------------------------------------------------------

// 开始投屏
async function startMirroring() {
  if (!AppState.selectedDevice) {
    showStatus('请先选择一个设备', 'error');
    return;
  }
  
  try {
    showStatus('正在启动投屏...');
    UI.startMirroringBtn.disabled = true;
    
    // 准备投屏选项
    const options = buildScrcpyOptions();
    
    // 调用 IPC 启动 scrcpy
    let result;
    if (AppState.selectedDevice.type === 'wireless') {
      // 无线投屏
      result = await window.androidController.startScrcpyWireless({
        deviceIp: AppState.selectedDevice.id,
        options
      });
    } else {
      // USB 投屏
      result = await window.androidController.startScrcpy({
        deviceId: AppState.selectedDevice.id,
        options
      });
    }
    
    if (result.success) {
      AppState.isMirroring = true;
      UI.stopMirroringBtn.disabled = false;
      showStatus('投屏已启动', 'success');
    } else {
      showStatus(`启动投屏失败: ${result.error || '未知错误'}`, 'error');
    }
  } catch (error) {
    console.error('Error starting mirroring:', error);
    showStatus(`投屏错误: ${error.message}`, 'error');
  } finally {
    UI.startMirroringBtn.disabled = false;
  }
}

// 停止投屏
async function stopMirroring() {
  try {
    showStatus('正在停止投屏...');
    UI.stopMirroringBtn.disabled = true;
    
    // 调用 IPC 停止 scrcpy
    const result = await window.androidController.stopScrcpy();
    
    if (result.success) {
      AppState.isMirroring = false;
      UI.stopMirroringBtn.disabled = true;
      showStatus('投屏已停止', 'success');
    } else {
      showStatus(`停止投屏失败: ${result.message || '未知错误'}`, 'error');
    }
  } catch (error) {
    console.error('Error stopping mirroring:', error);
    showStatus(`停止投屏错误: ${error.message}`, 'error');
  } finally {
    UI.stopMirroringBtn.disabled = !AppState.isMirroring;
  }
}

// 构建 scrcpy 命令行选项
function buildScrcpyOptions() {
  const options = [];
  
  // 分辨率
  const maxRes = UI.maxResolution.value;
  if (maxRes) {
    options.push('--max-size', maxRes);
  }
  
  // 视频比特率
  const bitRate = UI.bitRate.value;
  if (bitRate) {
    options.push('--video-bit-rate', bitRate);
  }
  
  // 帧率
  const maxFps = UI.maxFps.value;
  if (maxFps) {
    options.push('--max-fps', maxFps);
  }
  
  // 屏幕方向
  const rotation = UI.rotation.value;
  if (rotation !== '0') {
    options.push('--rotation', rotation);
  }
  
  // 保持常亮
  if (UI.stayAwake.checked) {
    options.push('--stay-awake');
  }
  
  // 显示触摸点
  if (UI.showTouches.checked) {
    options.push('--show-touches');
  }
  
  // 窗口标题
  options.push('--window-title', 'Android 设备投屏');
  
  return options;
}

// ------------------------------------------------------------------------
// 辅助函数
// ------------------------------------------------------------------------

// 显示状态信息
function showStatus(message, type = 'info') {
  UI.statusMessage.textContent = message;
  UI.statusMessage.className = 'status-message';
  
  // 根据类型设置不同的样式
  if (type === 'error') {
    UI.statusMessage.classList.add('status-error');
  } else if (type === 'success') {
    UI.statusMessage.classList.add('status-success');
  } else if (type === 'warning') {
    UI.statusMessage.classList.add('status-warning');
  }
  
  // 添加短暂的高亮动画
  UI.statusMessage.classList.add('status-highlight');
  setTimeout(() => {
    UI.statusMessage.classList.remove('status-highlight');
  }, 300);
  
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// ------------------------------------------------------------------------
// 启动应用
// ------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', initApp);
