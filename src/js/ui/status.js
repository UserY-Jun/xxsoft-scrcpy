export function showStatus(statusEl, message, type = 'info') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = 'status-message';
  if (type === 'error') statusEl.classList.add('status-error');
  if (type === 'success') statusEl.classList.add('status-success');
  if (type === 'warning') statusEl.classList.add('status-warning');
  statusEl.classList.add('status-highlight');
  window.setTimeout(() => statusEl.classList.remove('status-highlight'), 280);
}

