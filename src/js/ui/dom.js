export function getRequiredElementById(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}

export function setHidden(el, hidden) {
  if (!el) return;
  el.hidden = Boolean(hidden);
}

export function clearElement(el) {
  while (el && el.firstChild) el.removeChild(el.firstChild);
}

export function createElement(tag, { className, text, html, attrs } = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (typeof text === 'string') el.textContent = text;
  if (typeof html === 'string') el.innerHTML = html;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null) continue;
      el.setAttribute(key, String(value));
    }
  }
  return el;
}

