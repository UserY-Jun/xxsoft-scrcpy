import { createElement } from './dom.js';

export function createLoading() {
  const root = createElement('div', { className: 'loading' });
  root.appendChild(createElement('div', { className: 'loading-spinner' }));
  return root;
}

export function createAlert({ variant = 'info', title, message, html } = {}) {
  const root = createElement('div', { className: `alert alert-${variant}` });
  const iconName =
    variant === 'success'
      ? 'ri-checkbox-circle-line'
      : variant === 'warning'
        ? 'ri-error-warning-line'
        : variant === 'error'
          ? 'ri-close-circle-line'
          : 'ri-information-line';

  root.appendChild(createElement('div', { className: 'alert-icon', html: `<i class="${iconName}"></i>` }));

  const content = createElement('div', { className: 'alert-content' });
  if (title) content.appendChild(createElement('strong', { text: title }));
  if (message) content.appendChild(createElement('div', { text: message }));
  if (html) content.appendChild(createElement('div', { html }));
  root.appendChild(content);
  return root;
}

