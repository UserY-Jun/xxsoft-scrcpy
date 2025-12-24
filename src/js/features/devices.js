import { getState, setState } from '../state/appState.js';
import { clearElement, createElement } from '../ui/dom.js';
import { createAlert, createLoading } from '../ui/components.js';

function normalizeDevices(devices) {
  if (!Array.isArray(devices)) return [];
  return [...devices]
    .map((d) => ({
      id: String(d.id || ''),
      status: String(d.status || ''),
      model: d && d.info && d.info.model ? String(d.info.model) : ''
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function devicesEqual(a, b) {
  const na = normalizeDevices(a);
  const nb = normalizeDevices(b);
  if (na.length !== nb.length) return false;
  for (let i = 0; i < na.length; i++) {
    const xa = na[i];
    const xb = nb[i];
    if (xa.id !== xb.id || xa.status !== xb.status || xa.model !== xb.model) return false;
  }
  return true;
}

function renderDeviceRow(device, type, { onSelect, onEnableWifi }) {
  const isOnline = device.status === 'device';
  const deviceTitle = `${device.id}${device.info && device.info.model ? ` (${device.info.model})` : ''}`;

  const row = createElement('div', {
    className: 'device-item',
    attrs: { 'data-id': device.id, 'data-type': type }
  });

  const info = createElement('div', { className: 'device-info' });
  info.appendChild(createElement('div', { className: 'device-name', text: deviceTitle }));

  const status = createElement('div', {
    className: `device-status ${isOnline ? 'status-online' : ''}`,
    text: isOnline ? '已连接' : '未授权或离线'
  });
  info.appendChild(status);
  row.appendChild(info);

  const actions = createElement('div', { className: 'device-actions' });

  if (type === 'usb' && isOnline) {
    const enableWifiBtn = createElement('button', { className: 'btn btn-accent', text: '启用WiFi' });
    enableWifiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onEnableWifi(device.id, enableWifiBtn);
    });
    actions.appendChild(enableWifiBtn);
  }

  const selectBtn = createElement('button', {
    className: 'btn btn-primary',
    text: '选择',
    attrs: { disabled: !isOnline ? 'true' : undefined }
  });

  selectBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isOnline) return;
    onSelect(device.id, type);
  });

  actions.appendChild(selectBtn);
  row.appendChild(actions);

  row.addEventListener('click', () => {
    if (!isOnline) return;
    onSelect(device.id, type);
  });

  return row;
}

function highlightSelectedDevice(deviceId) {
  document.querySelectorAll('.device-item').forEach((item) => item.classList.remove('selected'));
  if (!deviceId) return;
  document.querySelectorAll(`.device-item[data-id="${CSS.escape(deviceId)}"]`).forEach((item) => item.classList.add('selected'));
}

export async function refreshUsbDevices({ usbDeviceListEl, onSelectDevice, onEnableWifi, showLoading = true }) {
  const { usbDevicesSnapshot } = getState();
  if (showLoading) {
    clearElement(usbDeviceListEl);
    usbDeviceListEl.appendChild(createLoading());
  }

  try {
    const devices = await window.androidController.listUsbDevices();
    const changed = !devicesEqual(usbDevicesSnapshot, devices);
    if (changed || showLoading) {
      renderDeviceList({ devices, containerEl: usbDeviceListEl, type: 'usb', onSelectDevice, onEnableWifi });
    }
    setState({ usbDevicesSnapshot: devices });
  } catch (error) {
    clearElement(usbDeviceListEl);
    usbDeviceListEl.appendChild(createAlert({ variant: 'error', message: `获取设备列表失败: ${error.message || String(error)}` }));
  }
}

export async function refreshWirelessDevices({ wirelessDeviceListEl, onSelectDevice, onEnableWifi, showLoading = true }) {
  const { wirelessDevicesSnapshot } = getState();
  if (showLoading) {
    clearElement(wirelessDeviceListEl);
    wirelessDeviceListEl.appendChild(createLoading());
  }

  try {
    const devices = await window.androidController.listWirelessDevices();
    const changed = !devicesEqual(wirelessDevicesSnapshot, devices);
    if (changed || showLoading) {
      renderDeviceList({ devices, containerEl: wirelessDeviceListEl, type: 'wireless', onSelectDevice, onEnableWifi });
    }
    setState({ wirelessDevicesSnapshot: devices });
  } catch (error) {
    clearElement(wirelessDeviceListEl);
    wirelessDeviceListEl.appendChild(createAlert({ variant: 'error', message: `获取无线设备列表失败: ${error.message || String(error)}` }));
  }
}

export function renderDeviceList({ devices, containerEl, type, onSelectDevice, onEnableWifi }) {
  clearElement(containerEl);

  if (!Array.isArray(devices) || devices.length === 0) {
    containerEl.appendChild(
      createAlert({
        variant: 'info',
        message: `未检测到${type === 'usb' ? 'USB' : '无线'}设备`
      })
    );
    return;
  }

  const list = createElement('div', { className: 'device-list' });
  for (const device of devices) {
    list.appendChild(
      renderDeviceRow(device, type, {
        onSelect: onSelectDevice,
        onEnableWifi
      })
    );
  }
  containerEl.appendChild(list);

  const { selectedDevice } = getState();
  highlightSelectedDevice(selectedDevice ? selectedDevice.id : null);
  if (selectedDevice && selectedDevice.type === type) {
    const existsOnline = Array.isArray(devices) && devices.some((d) => d.id === selectedDevice.id && d.status === 'device');
    if (!existsOnline) setState({ selectedDevice: null });
  }
}

export async function refreshAllDevices({ usbDeviceListEl, wirelessDeviceListEl, onSelectDevice, onEnableWifi, onStatus, showLoading = true }) {
  const { isRefreshingDevices } = getState();
  if (isRefreshingDevices) return;

  try {
    setState({ isRefreshingDevices: true });
    onStatus('正在搜索设备...');

    await Promise.all([
      refreshUsbDevices({ usbDeviceListEl, onSelectDevice, onEnableWifi, showLoading }),
      refreshWirelessDevices({ wirelessDeviceListEl, onSelectDevice, onEnableWifi, showLoading })
    ]);

    onStatus('设备刷新完成', 'success');
  } catch (error) {
    onStatus(`刷新设备失败: ${error.message || String(error)}`, 'error');
  } finally {
    setState({ isRefreshingDevices: false });
  }
}

export async function selectDevice({ deviceId, type, onSelected }) {
  setState({ selectedDevice: { id: deviceId, type } });
  highlightSelectedDevice(deviceId);
  await onSelected({ deviceId, type });
}

export async function setupWirelessConnection({ deviceId, onStatus, onToast, setIpValue, setButtonLoading }) {
  const { isSettingUpWireless } = getState();
  if (isSettingUpWireless) return;

  try {
    setState({ isSettingUpWireless: true });
    onStatus(`正在为设备 ${deviceId} 启用无线连接...`);
    setButtonLoading(true, '正在设置...');

    const result = await window.androidController.initWireless(deviceId);
    if (result && result.success) {
      if (result.ip) setIpValue(result.ip);
      onStatus(`无线连接已启用! 设备 IP: ${result.ip}`, 'success');
      onToast({ variant: 'success', title: '已启用无线连接', message: `设备 IP: ${result.ip}（可断开USB后点击“连接”）` });
      return;
    }

    onStatus(`启用无线连接失败: ${result && result.error ? result.error : '未知错误'}`, 'error');
    onToast({ variant: 'error', title: '启用失败', message: result && result.error ? result.error : '未知错误' });
  } catch (error) {
    onStatus(`启用无线连接失败: ${error.message || String(error)}`, 'error');
    onToast({ variant: 'error', title: '启用失败', message: error.message || String(error) });
  } finally {
    setState({ isSettingUpWireless: false });
    setButtonLoading(false, '启用WiFi');
  }
}

export async function connectToWirelessDevice({ deviceIp, onStatus, onToast, setConnectButtonLoading, refreshWireless }) {
  const ip = (deviceIp || '').trim();
  if (!ip) {
    onStatus('请输入设备 IP 地址', 'error');
    onToast({ variant: 'warning', title: '需要IP地址', message: '请输入例如 192.168.1.100' });
    return;
  }

  try {
    onStatus(`正在连接到设备 ${ip}...`);
    setConnectButtonLoading(true, '连接中...');

    const result = await window.androidController.connectWireless(ip);
    if (result && result.success) {
      onStatus(`成功连接到设备 ${ip}`, 'success');
      onToast({ variant: 'success', title: '连接成功', message: ip });
      await refreshWireless();
      return;
    }

    onStatus(`连接失败: ${result && result.error ? result.error : '未知错误'}`, 'error');
    onToast({ variant: 'error', title: '连接失败', message: result && result.error ? result.error : '未知错误' });
  } catch (error) {
    onStatus(`连接错误: ${error.message || String(error)}`, 'error');
    onToast({ variant: 'error', title: '连接错误', message: error.message || String(error) });
  } finally {
    setConnectButtonLoading(false, '连接');
  }
}
