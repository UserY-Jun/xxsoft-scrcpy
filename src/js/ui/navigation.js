export function initNavigation({ navEl, viewEls, onViewChanged } = {}) {
  if (!navEl) return () => {};

  const setActiveView = (viewKey) => {
    navEl.querySelectorAll('[data-view]').forEach((btn) => {
      const isActive = btn.getAttribute('data-view') === viewKey;
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    for (const viewEl of viewEls) {
      const key = viewEl.getAttribute('data-active-view');
      viewEl.hidden = key !== viewKey;
    }

    if (onViewChanged) onViewChanged(viewKey);
  };

  const onClick = (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-view]') : null;
    if (!btn) return;
    setActiveView(btn.getAttribute('data-view'));
  };

  navEl.addEventListener('click', onClick);
  setActiveView(navEl.querySelector('[data-view][aria-current="page"]')?.getAttribute('data-view') || 'devices');

  return () => navEl.removeEventListener('click', onClick);
}

