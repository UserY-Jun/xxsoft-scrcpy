import { injectAppStyles } from './ui/styles.js';
import { getRequiredElementById, setHidden } from './ui/dom.js';
import { showToast } from './ui/toast.js';
import { showStatus } from './ui/status.js';
import { refreshAllDevices, refreshUsbDevices, refreshWirelessDevices, selectDevice, setupWirelessConnection, connectToWirelessDevice } from './features/devices.js';
import { initNavigation } from './features/navigation.js';
import { getState, subscribe } from './state/appState.js';
import { loadDeviceInfo, startMirroring, stopMirroring, unlockDevice, syncMirroringView } from './features/mirroring.js';

function initWindowControls({ titleBarEl, minimizeBtnEl, maximizeBtnEl, closeBtnEl }) {
  const setMaximizeIcon = (isMaximized) => {
    if (!maximizeBtnEl) return;
    const icon = maximizeBtnEl.querySelector('i');
    if (!icon) return;
    icon.className = isMaximized ? 'ri-checkbox-multiple-blank-line' : 'ri-checkbox-blank-line';
  };

  if (!window.windowControls) return;

  if (minimizeBtnEl) minimizeBtnEl.addEventListener('click', () => window.windowControls.minimize());
  if (closeBtnEl) closeBtnEl.addEventListener('click', () => window.windowControls.close());
  if (maximizeBtnEl) {
    maximizeBtnEl.addEventListener('click', async () => {
      const result = await window.windowControls.toggleMaximize();
      if (result && result.success) setMaximizeIcon(result.isMaximized);
    });
  }

  if (titleBarEl) {
    titleBarEl.addEventListener('dblclick', async (event) => {
      if (event.target && event.target.closest && event.target.closest('.titlebar-interactive')) return;
      const result = await window.windowControls.toggleMaximize();
      if (result && result.success) setMaximizeIcon(result.isMaximized);
    });
  }

  window.windowControls.isMaximized().then((result) => {
    if (result && result.success) setMaximizeIcon(result.isMaximized);
  });
}

function initApp() {
  injectAppStyles();

  const ui = {
    titleBar: getRequiredElementById('titleBar'),
    refreshDevicesBtn: getRequiredElementById('refreshDevicesBtn'),
    windowMinimizeBtn: getRequiredElementById('windowMinimizeBtn'),
    windowMaximizeBtn: getRequiredElementById('windowMaximizeBtn'),
    windowCloseBtn: getRequiredElementById('windowCloseBtn'),

    nav: document.querySelector('.app-nav'),
    viewDevices: getRequiredElementById('viewDevices'),
    viewMirroring: getRequiredElementById('viewMirroring'),
    viewHelp: getRequiredElementById('viewHelp'),

    usbDeviceList: getRequiredElementById('usbDeviceList'),
    wirelessDeviceList: getRequiredElementById('wirelessDeviceList'),
    refreshUsbBtn: getRequiredElementById('refreshUsbBtn'),
    refreshWirelessBtn: getRequiredElementById('refreshWirelessBtn'),

    deviceIpInput: getRequiredElementById('deviceIp'),
    connectWifiBtn: getRequiredElementById('connectWifiBtn'),

    currentDeviceTitle: getRequiredElementById('currentDeviceTitle'),
    noDeviceMsg: getRequiredElementById('noDeviceMsg'),
    mirroringOptions: getRequiredElementById('mirroringOptions'),
    deviceInfo: getRequiredElementById('deviceInfo'),
    deviceInfoContent: getRequiredElementById('deviceInfoContent'),
    mirroringEmpty: getRequiredElementById('mirroringEmpty'),

    unlockPassword: getRequiredElementById('unlockPassword'),
    unlockDeviceBtn: getRequiredElementById('unlockDeviceBtn'),
    startMirroringBtn: getRequiredElementById('startMirroringBtn'),
    stopMirroringBtn: getRequiredElementById('stopMirroringBtn'),

    maxResolution: getRequiredElementById('maxResolution'),
    bitRate: getRequiredElementById('bitRate'),
    maxFps: getRequiredElementById('maxFps'),
    rotation: getRequiredElementById('rotation'),
    stayAwake: getRequiredElementById('stayAwake'),
    showTouches: getRequiredElementById('showTouches'),

    statusMessage: getRequiredElementById('statusMessage'),
    toastRegion: getRequiredElementById('toastRegion')
  };

  initWindowControls({
    titleBarEl: ui.titleBar,
    minimizeBtnEl: ui.windowMinimizeBtn,
    maximizeBtnEl: ui.windowMaximizeBtn,
    closeBtnEl: ui.windowCloseBtn
  });

  const onToast = ({ variant, title, message }) => showToast(ui.toastRegion, { variant, title, message });
  const onStatus = (message, type = 'info') => showStatus(ui.statusMessage, message, type);

  const { setView } = initNavigation({
    navRootEl: ui.nav,
    viewEls: [ui.viewDevices, ui.viewMirroring, ui.viewHelp],
    onViewChanged: (view) => {
      if (view === 'mirroring') {
        syncMirroringView({
          currentDeviceTitleEl: ui.currentDeviceTitle,
          noDeviceMsgEl: ui.noDeviceMsg,
          mirroringOptionsEl: ui.mirroringOptions,
          deviceInfoEl: ui.deviceInfo,
          mirroringEmptyEl: ui.mirroringEmpty
        });
      }
    }
  });

  if (!window.androidController) {
    onStatus('渲染进程未获取到安全API（androidController）', 'error');
    onToast({ variant: 'error', title: '初始化失败', message: '请检查 preload.js 与 webPreferences 配置' });
  }

  const onSelected = async ({ deviceId, type }) => {
    syncMirroringView({
      currentDeviceTitleEl: ui.currentDeviceTitle,
      noDeviceMsgEl: ui.noDeviceMsg,
      mirroringOptionsEl: ui.mirroringOptions,
      deviceInfoEl: ui.deviceInfo,
      mirroringEmptyEl: ui.mirroringEmpty
    });

    setView('mirroring');
    await loadDeviceInfo({ deviceInfoContentEl: ui.deviceInfoContent, deviceId, type });
    onStatus(`已选择设备: ${deviceId}`, 'success');
  };

  const onSelectDevice = async (deviceId, type) => {
    await selectDevice({ deviceId, type, onSelected });
  };

  const onEnableWifi = async (deviceId, btnEl) => {
    await setupWirelessConnection({
      deviceId,
      onStatus,
      onToast,
      setIpValue: (ip) => (ui.deviceIpInput.value = ip),
      setButtonLoading: (loading, text) => {
        if (!btnEl) return;
        btnEl.disabled = loading;
        btnEl.textContent = text;
      }
    });
  };

  ui.refreshUsbBtn.addEventListener('click', () =>
    refreshUsbDevices({ usbDeviceListEl: ui.usbDeviceList, onSelectDevice, onEnableWifi })
  );
  ui.refreshWirelessBtn.addEventListener('click', () =>
    refreshWirelessDevices({ wirelessDeviceListEl: ui.wirelessDeviceList, onSelectDevice, onEnableWifi })
  );
  ui.refreshDevicesBtn.addEventListener('click', () =>
    refreshAllDevices({
      usbDeviceListEl: ui.usbDeviceList,
      wirelessDeviceListEl: ui.wirelessDeviceList,
      onSelectDevice,
      onEnableWifi,
      onStatus
    })
  );

  ui.connectWifiBtn.addEventListener('click', () =>
    connectToWirelessDevice({
      deviceIp: ui.deviceIpInput.value,
      onStatus,
      onToast,
      setConnectButtonLoading: (loading, text) => {
        ui.connectWifiBtn.disabled = loading;
        ui.connectWifiBtn.textContent = text;
      },
      refreshWireless: () =>
        refreshWirelessDevices({ wirelessDeviceListEl: ui.wirelessDeviceList, onSelectDevice, onEnableWifi })
    })
  );

  ui.deviceIpInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    ui.connectWifiBtn.click();
  });

  ui.startMirroringBtn.addEventListener('click', () =>
    startMirroring({
      onStatus,
      onToast,
      startMirroringBtnEl: ui.startMirroringBtn,
      stopMirroringBtnEl: ui.stopMirroringBtn,
      scrcpyOptionEls: {
        maxResolutionEl: ui.maxResolution,
        bitRateEl: ui.bitRate,
        maxFpsEl: ui.maxFps,
        rotationEl: ui.rotation,
        stayAwakeEl: ui.stayAwake,
        showTouchesEl: ui.showTouches
      }
    })
  );

  ui.stopMirroringBtn.addEventListener('click', () =>
    stopMirroring({
      onStatus,
      onToast,
      stopMirroringBtnEl: ui.stopMirroringBtn
    })
  );

  ui.unlockDeviceBtn.addEventListener('click', () =>
    unlockDevice({
      password: ui.unlockPassword.value,
      unlockBtnEl: ui.unlockDeviceBtn,
      onStatus,
      onToast
    })
  );

  subscribe(() => {
    const { isMirroring } = getState();
    ui.stopMirroringBtn.disabled = !isMirroring;
    if (!ui.viewMirroring.hidden) {
      syncMirroringView({
        currentDeviceTitleEl: ui.currentDeviceTitle,
        noDeviceMsgEl: ui.noDeviceMsg,
        mirroringOptionsEl: ui.mirroringOptions,
        deviceInfoEl: ui.deviceInfo,
        mirroringEmptyEl: ui.mirroringEmpty
      });
    }
  });

  ui.stopMirroringBtn.disabled = !getState().isMirroring;
  setHidden(ui.mirroringOptions, true);
  setHidden(ui.deviceInfo, true);
  setHidden(ui.mirroringEmpty, false);

  refreshAllDevices({
    usbDeviceListEl: ui.usbDeviceList,
    wirelessDeviceListEl: ui.wirelessDeviceList,
    onSelectDevice,
    onEnableWifi,
    onStatus
  });
  onStatus('应用已启动，正在搜索设备...');
  const refreshFn = () =>
    refreshAllDevices({
      usbDeviceListEl: ui.usbDeviceList,
      wirelessDeviceListEl: ui.wirelessDeviceList,
      onSelectDevice,
      onEnableWifi,
      onStatus,
      showLoading: false
    });
  const refreshTimer = window.setInterval(refreshFn, 5000);
  window.addEventListener('beforeunload', () => {
    if (refreshTimer) window.clearInterval(refreshTimer);
  });

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
      e.preventDefault();
      ui.refreshDevicesBtn.click();
    }
    if (e.key === 'Escape') {
      if (ui.toastRegion.childElementCount > 0) ui.toastRegion.replaceChildren();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '1') setView('devices');
    if ((e.ctrlKey || e.metaKey) && e.key === '2') setView('mirroring');
    if ((e.ctrlKey || e.metaKey) && e.key === '3') setView('help');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
