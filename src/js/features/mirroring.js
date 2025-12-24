import { getState, setState } from '../state/appState.js';
import { clearElement, createElement, setHidden } from '../ui/dom.js';
import { createLoading, createAlert } from '../ui/components.js';

export function buildScrcpyOptions({
  maxResolutionEl,
  bitRateEl,
  maxFpsEl,
  rotationEl,
  stayAwakeEl,
  showTouchesEl
}) {
  const options = [];

  const maxRes = maxResolutionEl ? maxResolutionEl.value : '';
  if (maxRes) options.push('--max-size', maxRes);

  const bitRate = bitRateEl ? bitRateEl.value : '';
  if (bitRate) options.push('--video-bit-rate', bitRate);

  const maxFps = maxFpsEl ? maxFpsEl.value : '';
  if (maxFps) options.push('--max-fps', maxFps);

  const rotation = rotationEl ? rotationEl.value : '0';
  if (rotation !== '0') options.push('--rotation', rotation);

  if (stayAwakeEl && stayAwakeEl.checked) options.push('--stay-awake');
  if (showTouchesEl && showTouchesEl.checked) options.push('--show-touches');

  options.push('--window-title', 'Android 设备投屏');
  return options;
}

export async function loadDeviceInfo({ deviceInfoContentEl, deviceId, type }) {
  clearElement(deviceInfoContentEl);
  deviceInfoContentEl.appendChild(createLoading());

  try {
    clearElement(deviceInfoContentEl);
    const list = createElement('div', { className: 'kv-list' });

    const addRow = (k, v) => {
      const row = createElement('div', { className: 'kv-row' });
      row.appendChild(createElement('div', { className: 'kv-key', text: k }));
      row.appendChild(createElement('div', { className: 'kv-val', text: v }));
      list.appendChild(row);
    };

    addRow('设备 ID', deviceId);
    addRow('连接类型', type === 'usb' ? 'USB' : '无线');

    deviceInfoContentEl.appendChild(list);
  } catch (error) {
    clearElement(deviceInfoContentEl);
    deviceInfoContentEl.appendChild(createAlert({ variant: 'error', message: `获取设备信息失败: ${error.message || String(error)}` }));
  }
}

export function syncMirroringView({
  currentDeviceTitleEl,
  noDeviceMsgEl,
  mirroringOptionsEl,
  deviceInfoEl,
  mirroringEmptyEl
}) {
  const { selectedDevice } = getState();
  const viewEl = document.getElementById('viewMirroring');

  if (!selectedDevice) {
    if (currentDeviceTitleEl) currentDeviceTitleEl.textContent = '未连接设备';
    setHidden(noDeviceMsgEl, false);
    setHidden(mirroringOptionsEl, true);
    setHidden(deviceInfoEl, true);
    setHidden(mirroringEmptyEl, false);
    if (viewEl) viewEl.classList.remove('has-device');
    return;
  }

  if (currentDeviceTitleEl) currentDeviceTitleEl.textContent = `设备: ${selectedDevice.id}`;
  setHidden(noDeviceMsgEl, true);
  setHidden(mirroringOptionsEl, false);
  setHidden(deviceInfoEl, false);
  setHidden(mirroringEmptyEl, true);
  if (viewEl) viewEl.classList.add('has-device');
}

export async function startMirroring({
  onStatus,
  onToast,
  startMirroringBtnEl,
  stopMirroringBtnEl,
  scrcpyOptionEls
}) {
  const { selectedDevice } = getState();
  if (!selectedDevice) {
    onStatus('请先选择一个设备', 'error');
    onToast({ variant: 'warning', title: '未选择设备', message: '请先在“设备”页选择设备' });
    return;
  }

  try {
    onStatus('正在启动投屏...');
    if (startMirroringBtnEl) startMirroringBtnEl.disabled = true;

    const options = buildScrcpyOptions(scrcpyOptionEls);

    let result;
    if (selectedDevice.type === 'wireless') {
      result = await window.androidController.startScrcpyWireless({ deviceIp: selectedDevice.id, options });
    } else {
      result = await window.androidController.startScrcpy({ deviceId: selectedDevice.id, options });
    }

    if (result && result.success) {
      setState({ isMirroring: true });
      if (stopMirroringBtnEl) stopMirroringBtnEl.disabled = false;
      onStatus('投屏已启动', 'success');
      onToast({ variant: 'success', title: '投屏已启动', message: selectedDevice.id });
      return;
    }

    onStatus(`启动投屏失败: ${result && result.error ? result.error : '未知错误'}`, 'error');
    onToast({ variant: 'error', title: '启动失败', message: result && result.error ? result.error : '未知错误' });
  } catch (error) {
    onStatus(`投屏错误: ${error.message || String(error)}`, 'error');
    onToast({ variant: 'error', title: '投屏错误', message: error.message || String(error) });
  } finally {
    if (startMirroringBtnEl) startMirroringBtnEl.disabled = false;
  }
}

export async function stopMirroring({ onStatus, onToast, stopMirroringBtnEl }) {
  try {
    onStatus('正在停止投屏...');
    if (stopMirroringBtnEl) stopMirroringBtnEl.disabled = true;

    const result = await window.androidController.stopScrcpy();
    if (result && result.success) {
      setState({ isMirroring: false });
      onStatus('投屏已停止', 'success');
      onToast({ variant: 'success', title: '投屏已停止' });
      return;
    }

    onStatus(`停止投屏失败: ${result && result.message ? result.message : '未知错误'}`, 'error');
    onToast({ variant: 'error', title: '停止失败', message: result && result.message ? result.message : '未知错误' });
  } catch (error) {
    onStatus(`停止投屏错误: ${error.message || String(error)}`, 'error');
    onToast({ variant: 'error', title: '停止错误', message: error.message || String(error) });
  } finally {
    const { isMirroring } = getState();
    if (stopMirroringBtnEl) stopMirroringBtnEl.disabled = !isMirroring;
  }
}

export async function unlockDevice({ password, onStatus, onToast, unlockBtnEl }) {
  const { selectedDevice } = getState();
  if (!selectedDevice) {
    onStatus('请先选择一个设备', 'error');
    onToast({ variant: 'warning', title: '未选择设备', message: '请先在“设备”页选择设备' });
    return;
  }

  try {
    if (unlockBtnEl) unlockBtnEl.disabled = true;
    onStatus('正在解锁设备...');

    const lockStatus = await window.androidController.isDeviceLocked(selectedDevice.id);
    if (!lockStatus || !lockStatus.success) {
      onStatus(`检查锁屏状态失败: ${lockStatus && lockStatus.error ? lockStatus.error : '未知错误'}`, 'error');
      onToast({ variant: 'error', title: '检查失败', message: lockStatus && lockStatus.error ? lockStatus.error : '未知错误' });
      return;
    }

    if (!lockStatus.isLocked) {
      onStatus('设备未锁定，无需解锁', 'success');
      onToast({ variant: 'success', title: '无需解锁', message: '设备当前为解锁状态' });
      return;
    }

    const result = await window.androidController.unlockDevice(selectedDevice.id, password || '');
    if (result && result.success) {
      onStatus('设备解锁成功', 'success');
      onToast({ variant: 'success', title: '解锁成功' });
      return;
    }

    onStatus(`设备解锁失败: ${result && (result.error || result.message) ? (result.error || result.message) : '密码可能不正确'}`, 'error');
    onToast({ variant: 'error', title: '解锁失败', message: result && (result.error || result.message) ? (result.error || result.message) : '密码可能不正确' });
  } catch (error) {
    onStatus(`解锁错误: ${error.message || String(error)}`, 'error');
    onToast({ variant: 'error', title: '解锁错误', message: error.message || String(error) });
  } finally {
    if (unlockBtnEl) unlockBtnEl.disabled = false;
  }
}
