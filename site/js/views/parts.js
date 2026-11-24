// Piezas de UI compartidas por las pantallas.
import { h, icon, fmtDist, fmtRating, link } from '../lib/util.js';
import { ORIGEN, db, estadoPlan } from '../data.js';
import { abiertoAhora, getLastPos, haversine } from '../lib/geo.js';
import { isCandidate, togglePlan } from '../lib/store.js';

export function topbar(title, { back = true, right = null } = {}) {
  return h('header', { class: 'topbar' },
    back ? h('a', { class: 'iconbtn', href: '#/', 'aria-label': 'Volver al inicio', onclick: (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } } }, icon('back')) : null,
    h('h1', null, title), right);
}

export function badgeOrigen(l) {
  const o = ORIGEN[l.origen];
  return h('span', { class: `badge ${o.cls}` }, l.origen === 'lista-mia' ? icon('star') : null, o.label);
}

export function horarioBadge(l) {
  const ab = abiertoAhora(l);
  if (ab === true) return h('span', { class: 'badge soft' }, icon('check'), 'Abierto ahora (verificado)');
  if (ab === false) return h('span', { class: 'badge soft' }, 'Cerrado ahora (verificado)');
  return h('span', { class: 'badge warn' }, icon('clock'), 'Horario sin verificar');
}

export function lugarRow(l, { rutaId = null, numero = null, dist = null, showPlan = false } = {}) {
  const plan = estadoPlan(l);
  const pos = getLastPos();
  const d = dist ?? (pos ? haversine(pos, [l.lat, l.lon]) : null);
  const lead = numero != null
    ? h('span', { class: `num ${typeof numero === 'string' && numero.endsWith(' m') ? 'dist' : l.origen === 'lista-mia' ? 'star' : ''}` }, h('span', null, numero))
    : null;
  const ab = abiertoAhora(l);
  const meta = [db.categorias.get(l.categoria), l.barrio, ab === true ? 'abierto ahora (verificado)' : ab === false ? 'cerrado ahora (verificado)' : 'horario sin verificar']
    .filter(Boolean).join(' · ');
  const row = h('a', { class: 'row', href: `#/lugar/${l.id}` },
    lead,
    h('div', { class: 'main' },
      h('p', { class: 'name' }, l.nombre),
      h('div', { class: 'meta' }, meta),
      h('div', { class: 'tags' },
        badgeOrigen(l),
        l.rating?.valor != null ? h('span', { class: 'badge soft' }, `${l.rating.fuente === 'Google Maps' ? 'Google' : 'Reseñas'} ${fmtRating(l.rating.valor)}`) : null,
        plan.enPlan ? h('span', { class: 'badge soft' }, plan.texto) : (showPlan ? h('span', { class: 'badge soft' }, plan.texto) : null),
        d != null ? h('span', { class: 'badge soft' }, icon('pin'), fmtDist(d)) : null)));
  if (!rutaId) return row;
  return h('div', { class: 'rowwrap' }, row, candidateButton(rutaId, l.id));
}

export function candidateButton(rutaId, lugarId) {
  const btn = h('button', { class: 'cand', type: 'button', 'aria-pressed': String(isCandidate(rutaId, lugarId)),
    'aria-label': 'Marcar como candidato para mi plan de comida' }, icon('bookmark'));
  btn.addEventListener('click', () => btn.setAttribute('aria-pressed', String(togglePlan(rutaId, lugarId))));
  return btn;
}

export function fuenteLinks(fuentes) {
  return fuentes.map((f, i) => [i ? ', ' : '', f.url ? link(f.url, f.etiqueta) : f.etiqueta]);
}

export function datoBlock(dato) {
  if (!dato) return h('p', { class: 'muted small' }, 'Sin dato curioso verificado.');
  const fu = dato.fuentes || [];
  return h('div', null,
    h('p', null, dato.texto),
    fu.length
      ? h('div', { class: 'src' }, 'Fuente (', fu.some((f) => f.tipo === 'dominio_citado') ? 'sitios citados en la guía, no el artículo exacto' : 'enlace', '): ', fuenteLinks(fu))
      : h('div', { class: 'src' }, 'Fuente: sin verificar'));
}

export function emptyBox(text) {
  return h('div', { class: 'empty' }, text);
}
