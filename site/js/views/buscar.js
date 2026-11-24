import { h, icon, norm } from '../lib/util.js';
import { db } from '../data.js';
import { topbar, lugarRow, emptyBox } from './parts.js';

export function buscarView({ query }) {
  const q = (query.get('q') || '').trim();
  const nq = norm(q);
  const input = h('input', { type: 'search', value: q, placeholder: 'Lugar, recorrido, parada o experiencia', 'aria-label': 'Buscar', autocomplete: 'off', enterkeyhint: 'search' });
  const form = h('form', { class: 'searchbox', role: 'search' }, icon('search'), input);
  form.addEventListener('submit', (e) => { e.preventDefault(); location.hash = `#/buscar?q=${encodeURIComponent(input.value.trim())}`; });

  let body = h('p', { class: 'muted' }, 'Escribí al menos dos letras. Se ignoran los acentos.');
  if (nq.length >= 2) {
    const lugares = db.lugares.filter((l) => norm(`${l.nombre} ${l.barrio || ''} ${l.direccion || ''} ${l.tipo_texto || ''}`).includes(nq)).slice(0, 40);
    const rutas = db.rutas.filter((r) => norm(`${r.etiqueta} ${r.nombre}`).includes(nq));
    const paradas = db.paradas.filter((p) => !p.es_comida && p.rol !== 'inicio' && norm(p.nombre).includes(nq)).slice(0, 30);
    const exps = db.experiencias.filter((e) => norm(`${e.titulo} ${e.resumen}`).includes(nq));
    const total = lugares.length + rutas.length + paradas.length + exps.length;
    body = total ? h('div', null,
      rutas.length ? [h('h3', { class: 'sec' }, 'Recorridos'), h('ul', { class: 'list' }, rutas.map((r) => h('li', null, h('a', { class: 'row', href: `#/ruta/${r.id}/plan` }, h('span', { class: 'num' }, h('span', null, r.etiqueta)), h('div', { class: 'main' }, h('p', { class: 'name' }, r.nombre))))))] : null,
      lugares.length ? [h('h3', { class: 'sec' }, 'Lugares para comer', h('small', null, `${lugares.length}`)), h('ul', { class: 'list' }, lugares.map((l) => h('li', null, lugarRow(l))))] : null,
      paradas.length ? [h('h3', { class: 'sec' }, 'Para ver'), h('ul', { class: 'list' }, paradas.map((p) => h('li', null, h('a', { class: 'row', href: `#/parada/${p.id}` }, h('span', { class: 'num' }, h('span', null, p.n ?? '·')), h('div', { class: 'main' }, h('p', { class: 'name' }, p.nombre), h('div', { class: 'meta' }, `Recorrido ${db.rutaById.get(p.ruta).etiqueta}`))))))] : null,
      exps.length ? [h('h3', { class: 'sec' }, 'Experiencias'), h('ul', { class: 'list' }, exps.map((e) => h('li', null, h('a', { class: 'row', href: '#/ver' }, h('div', { class: 'main' }, h('p', { class: 'name' }, e.titulo), h('div', { class: 'meta' }, e.duracion_texto))))))] : null)
      : emptyBox(`Sin resultados para "${q}".`);
  }
  return h('div', { 'data-title': 'Buscar' }, topbar('Buscar'), form, body);
}
