import { h } from '../lib/util.js';
import { db, estadoPlan } from '../data.js';
import { lugarRow, topbar, emptyBox } from './parts.js';

export function listaView({ query }) {
  const f = query.get('f') || 'todos';
  const lista = db.lugares.filter((l) => l.origen === 'lista-mia');
  const enPlan = lista.filter((l) => estadoPlan(l).enPlan);
  const fuera = lista.filter((l) => !estadoPlan(l).enPlan);
  const sel = f === 'plan' ? enPlan : f === 'fuera' ? fuera : lista;
  const ord = [...sel].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const tab = (k, t) => h('a', { href: `#/lista?f=${k}`, 'aria-current': f === k ? 'page' : null }, t);
  return h('div', { 'data-title': 'Mi lista' }, topbar('Mi lista (77)'),
    h('p', { class: 'lead' }, `${enPlan.length} están en algún recorrido (parada o cerca) y ${fuera.length} no están en el plan. Los ratings de Google son del momento en que se armó la lista; fecha exacta: N/A.`),
    h('nav', { class: 'segs' }, tab('todos', `Todos ${lista.length}`), tab('plan', `En el plan ${enPlan.length}`), tab('fuera', `Fuera ${fuera.length}`)),
    ord.length ? h('ul', { class: 'list' }, ord.map((l) => h('li', null, lugarRow(l, { showPlan: true })))) : emptyBox('Nada para mostrar.'));
}
