// Hoja inferior (bottom sheet) con URL propia.
import { h, icon } from '../lib/util.js';

let current = null;

export const sheetIsOpen = () => current !== null;

export function openSheet(content, onClose) {
  const root = document.getElementById('sheet-root');
  if (current) closeSheet(true);
  const backdrop = h('div', { class: 'backdrop' });
  const close = h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Cerrar' }, icon('close'));
  const head = h('div', { class: 'head' }, h('h2', { id: 'sheet-title' }, content.dataset.title || ''), close);
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sheet-title' },
    h('div', { class: 'grab' }), head, h('div', { class: 'scroll' }, content));
  root.replaceChildren(backdrop, sheet);
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => { backdrop.classList.add('in'); sheet.classList.add('in'); });

  const requestClose = () => onClose();
  backdrop.addEventListener('click', requestClose);
  close.addEventListener('click', requestClose);
  const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
  document.addEventListener('keydown', onKey);

  let y0 = null;
  head.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
  head.addEventListener('touchend', (e) => {
    if (y0 != null && e.changedTouches[0].clientY - y0 > 70) requestClose();
    y0 = null;
  });

  current = { root, onKey };
  close.focus({ preventScroll: true });
}

export function closeSheet() {
  if (!current) return;
  document.removeEventListener('keydown', current.onKey);
  current.root.replaceChildren();
  document.body.classList.remove('sheet-open');
  current = null;
}
