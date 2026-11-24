import { h, icon, norm, toast } from '../lib/util.js';
import { db, ORIGEN } from '../data.js';
import { abiertoAhora, haversine, locate, getLastPos } from '../lib/geo.js';
import { lugarRow, topbar, emptyBox } from './parts.js';

const PAGE = 60;

function setQuery(query, key, value) {
  const q = new URLSearchParams(query);
  if (value == null || value === '' || value === false) q.delete(key); else q.set(key, value);
  const s = q.toString();
  location.hash = `#/comer${s ? '?' + s : ''}`;
}

export function filtrar(query) {
  const o = query.get('o'), t = query.get('t'), r = query.get('r'), b = query.get('b'), q = norm(query.get('q') || '');
  const open = query.get('open') === '1', near = query.get('near') === '1';
  const pos = getLastPos();
  let out = db.lugares.filter((l) => {
    if (o && l.origen !== o) return false;
    if (t && l.categoria !== t) return false;
    if (r && !l.relaciones.some((x) => x.ruta === r)) return false;
    if (b && l.barrio !== b) return false;
    if (q && !norm(`${l.nombre} ${l.barrio || ''} ${l.direccion || ''}`).includes(q)) return false;
    if (open && abiertoAhora(l) !== true) return false;
    return true;
  });
  if (near && pos) {
    out = out.map((l) => [l, haversine(pos, [l.lat, l.lon])]).sort((a, c) => a[1] - c[1]).map(([l, d]) => Object.assign({}, l, { _dist: d }));
  } else {
    const ord = { 'lista-mia': 0, 'mapa-oficial': 1, 'busqueda-propia': 2 };
    out = [...out].sort((a, c) => ord[a.origen] - ord[c.origen] || a.nombre.localeCompare(c.nombre, 'es'));
  }
  return out;
}

function chipGroup(label, items, current, onPick) {
  return h('div', null, h('label', null, label),
    h('div', { class: 'chips' }, items.map(([val, text]) =>
      h('button', { class: 'chip', type: 'button', 'aria-pressed': String((current || '') === val), onclick: () => onPick(val) }, text))));
}

export function comerView({ query }) {
  const cur = (k) => query.get(k) || '';
  const barrios = [...new Set(db.lugares.map((l) => l.barrio).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const rutas = db.rutas.filter((r) => r.n_comida > 0 || db.lugares.some((l) => l.relaciones.some((x) => x.ruta === r.id)));
  const verificados = db.lugares.filter((l) => l.horarios.estado === 'verificado').length;
  const pos = getLastPos();

  const select = (label, key, options) => {
    const sel = h('select', { 'aria-label': label }, h('option', { value: '' }, 'Todos'),
      options.map(([v, t]) => h('option', { value: v, selected: v === cur(key) }, t)));
    sel.addEventListener('change', () => setQuery(query, key, sel.value));
    return h('div', null, h('label', null, label), sel);
  };

  const search = h('input', { type: 'search', value: cur('q'), placeholder: 'Nombre, barrio o calle', 'aria-label': 'Buscar en Comer', enterkeyhint: 'search' });
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') setQuery(query, 'q', search.value.trim()); });
  search.addEventListener('change', () => setQuery(query, 'q', search.value.trim()));

  const nearBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(cur('near') === '1' && !!pos) }, icon('pin'), 'Cerca de mí');
  nearBtn.addEventListener('click', async () => {
    if (cur('near') === '1') return setQuery(query, 'near', false);
    try { await locate(); setQuery(query, 'near', '1'); } catch (e) { toast(e.message); }
  });
  const openBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(cur('open') === '1') }, icon('clock'), 'Abierto ahora');
  openBtn.addEventListener('click', () => setQuery(query, 'open', cur('open') === '1' ? false : '1'));

  const lista = filtrar(query);
  const hay = Object.fromEntries([...query.entries()]);
  const filtrosActivos = Object.keys(hay).length > 0;

  const filters = h('details', { class: 'filters', open: filtrosActivos || null },
    h('summary', { style: 'font-weight:700;min-height:44px;display:flex;align-items:center;cursor:pointer' }, 'Filtros'),
    h('div', null, h('label', null, 'Buscar'), h('div', { class: 'searchbox', style: 'box-shadow:none;margin:0 0 6px;min-height:46px' }, icon('search'), search)),
    chipGroup('Origen', [['', 'Todos'], ...Object.entries(ORIGEN).map(([k, v]) => [k, k === 'lista-mia' ? '★ Mi lista' : v.label])], cur('o'), (v) => setQuery(query, 'o', v)),
    chipGroup('Tipo', [['', 'Todos'], ...[...db.categorias].filter(([id]) => id !== 'otro').map(([id, t]) => [id, t]), ['otro', 'Otros']], cur('t'), (v) => setQuery(query, 't', v)),
    select('Recorrido', 'r', rutas.map((r) => [r.id, `${r.etiqueta} · ${r.nombre}`])),
    select('Barrio', 'b', barrios.map((b) => [b, b])),
    h('div', { class: 'chips', style: 'margin-top:12px' }, nearBtn, openBtn),
    filtrosActivos ? h('a', { class: 'chip', href: '#/comer' }, icon('close'), 'Limpiar filtros') : null);

  const openNote = cur('open') === '1' && !lista.length
    ? h('div', { class: 'note' }, h('b', null, 'Sin resultados. '), `Ningún horario está verificado todavía (${verificados} de ${db.lugares.length}), así que no se puede asegurar que algo esté abierto. Mirá el horario de cada ficha y confirmá en el lugar.`)
    : null;

  const body = h('ul', { class: 'list' });
  const draw = (n) => {
    body.replaceChildren(...lista.slice(0, n).map((l) => h('li', null, lugarRow(l, { dist: l._dist }))));
    if (lista.length > n) {
      const more = h('button', { class: 'btn', type: 'button' }, `Ver más (${lista.length - n})`);
      more.addEventListener('click', () => draw(n + PAGE));
      body.append(h('li', { style: 'text-align:center' }, more));
    }
  };
  draw(PAGE);

  return h('div', { 'data-title': 'Comer' },
    topbar('Comer'),
    h('p', { class: 'lead' }, `${lista.length} de ${db.lugares.length} lugares. "Horario sin verificar" quiere decir que no hay una fuente primaria: confirmalo antes de ir.`),
    filters, openNote, lista.length ? body : emptyBox('No hay lugares con esos filtros.'));
}
