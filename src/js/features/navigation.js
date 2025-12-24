export function initNavigation({ navRootEl, viewEls, onViewChanged }) {
  const views = new Map();
  for (const viewEl of viewEls) {
    const key = viewEl.getAttribute('data-active-view');
    if (!key) continue;
    views.set(key, viewEl);
  }

  const setView = (nextView) => {
    for (const [key, el] of views.entries()) {
      el.hidden = key !== nextView;
    }

    navRootEl.querySelectorAll('[data-view]').forEach((btn) => {
      const isActive = btn.getAttribute('data-view') === nextView;
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });

    if (onViewChanged) onViewChanged(nextView);
  };

  navRootEl.addEventListener('click', (e) => {
    const target = e.target && e.target.closest ? e.target.closest('[data-view]') : null;
    if (!target) return;
    setView(target.getAttribute('data-view'));
  });

  document.addEventListener('click', (e) => {
    const jump = e.target && e.target.closest ? e.target.closest('[data-jump-view]') : null;
    if (!jump) return;
    setView(jump.getAttribute('data-jump-view'));
  });

  const active = navRootEl.querySelector('[aria-current="page"]');
  setView(active ? active.getAttribute('data-view') : 'devices');

  return { setView };
}

