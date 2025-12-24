import { createElement } from './dom.js';

const ICON_BY_VARIANT = {
  info: 'ri-information-line',
  success: 'ri-checkbox-circle-line',
  warning: 'ri-error-warning-line',
  error: 'ri-close-circle-line'
};

export function showToast(regionEl, { title, message, variant = 'info', timeoutMs = 3200 } = {}) {
  if (!regionEl) return;

  const toast = createElement('div', { className: `toast ${variant}` });
  const icon = createElement('div', { className: 'toast-icon' });
  icon.appendChild(createElement('i', { attrs: { class: ICON_BY_VARIANT[variant] || ICON_BY_VARIANT.info, 'aria-hidden': 'true' } }));

  const body = createElement('div', { className: 'toast-body' });
  if (title) body.appendChild(createElement('p', { className: 'toast-title', text: title }));
  if (message) body.appendChild(createElement('p', { className: 'toast-desc', text: message }));

  toast.appendChild(icon);
  toast.appendChild(body);
  regionEl.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(6px)';
    toast.style.transition = 'opacity .18s ease, transform .18s ease';
    window.setTimeout(() => toast.remove(), 220);
  }, timeoutMs);
}

