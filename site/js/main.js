import { loadData, db } from './data.js';
import { h, icon } from './lib/util.js';
import { getTema } from './lib/store.js';
import { openSheet, closeSheet, sheetIsOpen } from './views/sheet.js';
import { homeView } from './views/home.js';
import { comerView } from './views/comer.js';
import { recorridosView, rutaView } from './views/rutas.js';
import { verView } from './views/ver.js';
import { listaView } from './views/lista.js';
import { noVerificadoView } from './views/noverif.js';
import { masView } from './views/mas.js';
import { buscarView } from './views/buscar.js';
import { lugarSheet, paradaSheet } from './views/lugar.js';
import { correrView } from './views/correr.js';

const app = document.getElementById('app');
app.tabIndex = -1;

const TABS = [
  { href: '#/', ico: 'home', label: 'Inicio', keys: [''] },
  { href: '#/comer', ico: 'food', label: 'Comer', keys: ['comer', 'lista'] },
  { href: '#/recorridos', ico: 'route', label: 'Recorridos', keys: ['recorridos', 'ruta', 'correr'] },
  { href: '#/ver', ico: 'eye', label: 'Qué ver', keys: ['ver'] },
  { href: '#/mas', ico: 'more', label: 'Más', keys: ['mas', 'noverif', 'buscar'] },
];

const VIEWS = {
  '': homeView, comer: comerView, recorridos: recorridosView, ruta: rutaView, correr: correrView,
  ver: verView, lista: listaView, noverif: noVerificadoView, mas: masView, buscar: buscarView,
};
const SHEETS = { lugar: lugarSheet, parada: paradaSheet };

let baseHash = null;
let navDepth = 0;

function parse(hash) {
  const raw = (hash || '#/').replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { segs: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs || '') };
}

function renderTabs(active) {
  const nav = document.getElementById('tabbar');
  nav.replaceChildren(h('div', { class: 'inner' }, TABS.map((t) => h('a', {
    href: t.href, 'aria-current': t.keys.includes(active) ? 'page' : null,
  }, icon(t.ico), t.label))));
}

function errorView(msg) {
  return h('div', { class: 'pad' }, h('h2', { class: 'display' }, 'No se pudo cargar'), h('p', { class: 'lead' }, msg),
    h('a', { class: 'btn primary', href: '#/' }, 'Ir al inicio'));
}

async function renderBase(hash) {
  const { segs, query } = parse(hash);
  const key = segs[0] || '';
  const view = VIEWS[key];
  let node;
  try {
    node = view ? await view({ segs: segs.slice(1), query }) : errorView('Esa pantalla no existe.');
  } catch (e) {
    node = errorView(e.message);
  }
  app.replaceChildren(node);
  document.title = `${node.dataset?.title ? node.dataset.title + ' · ' : ''}Buenos Aires 2026`;
  renderTabs(key);
  baseHash = hash;
}

async function route() {
  navDepth += 1;
  const hash = location.hash || '#/';
  const { segs } = parse(hash);
  const sheet = SHEETS[segs[0]];
  if (sheet) {
    if (baseHash === null) await renderBase('#/comer');
    const node = await sheet(segs[1]);
    openSheet(node, () => {
      if (navDepth > 1) history.back(); else location.replace(baseHash || '#/');
    });
    return;
  }
  const wasOpen = sheetIsOpen();
  if (wasOpen) closeSheet();
  if (wasOpen && hash === baseHash) return; // volver desde la hoja conserva la pantalla y el scroll
  await renderBase(hash);
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
}

async function boot() {
  document.documentElement.dataset.cargando = '1';
  getTema();
  try {
    await loadData();
  } catch (e) {
    app.replaceChildren(errorView('No se pudieron cargar los datos. Probá con conexión una vez para guardarlos en el teléfono.'));
    return;
  }
  window.addEventListener('hashchange', route);
  await route();
  delete document.documentElement.dataset.cargando;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* sin SW la app sigue funcionando */ });
  }
}

boot();
export { db };
