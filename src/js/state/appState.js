const listeners = new Set();

const state = {
  selectedDevice: null,
  isMirroring: false,
  isRefreshingDevices: false,
  isSettingUpWireless: false,
  usbDevicesSnapshot: null,
  wirelessDevicesSnapshot: null
};

export function getState() {
  return state;
}

export function setState(partial) {
  Object.assign(state, partial);
  for (const listener of listeners) listener(state);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
