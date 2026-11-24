import { h, link, icon } from '../lib/util.js';
import { db, etiquetaRuta } from '../data.js';
import { topbar } from './parts.js';

const RESERVA = { si: 'Con reserva', opcional: 'Reserva opcional', no: 'Sin reserva', sin_verificar: 'Reserva sin verificar' };
const TIPO_FUENTE = { oficial: 'oficial', agregador: 'agregador de reservas', prensa: 'prensa', guia: 'guía v6', lista: 'mi lista', dominio_citado: 'dominio citado' };

function expCard(e) {
  const rutas = e.se_acopla.map((rid) => rid.toLowerCase());
  return h('article', { class: 'exp' },
    h('h4', null, e.titulo),
    h('p', null, e.resumen),
    h('div', { class: 'chips' },
      h('span', { class: 'chip static' }, icon('clock'), e.duracion_texto),
      h('span', { class: 'chip static' }, RESERVA[e.reserva]),
      rutas.map((rid) => h('a', { class: 'chip', href: `#/ruta/${rid}/plan`, style: 'min-height:34px' }, `Recorrido ${etiquetaRuta(rid)}`))),
    e.lugares.length ? h('p', { class: 'small' }, e.lugares.length > 4 ? `${e.lugares.length} lugares de mi lista: ` : 'Lugares: ',
      e.lugares.slice(0, 10).map((id, i) => { const l = db.lugarById.get(id); return [i ? ', ' : '', h('a', { href: `#/lugar/${id}` }, l ? l.nombre : id)]; })) : null,
    h('p', { class: 'src' }, 'Fuentes: ', e.fuentes.map((f, i) => [i ? ' · ' : '', f.url ? link(f.url, f.etiqueta) : f.etiqueta, ` (${TIPO_FUENTE[f.tipo] || f.tipo})`])),
    h('p', { class: 'note', style: 'margin-bottom:0' }, h('b', null, 'Sin verificar: '), e.nota));
}

export function verView({ query }) {
  const tab = query.get('t') || 'exp';
  const exp = h('div', null,
    h('p', { class: 'lead' }, 'Ordenadas por esfuerzo: primero lo que podés hacer esta noche, después lo que pide reserva y al final las salidas largas. Los precios no se muestran: se ven en el sitio de cada fuente.'),
    db.raw.experiencias_categorias.map((c) => {
      const items = db.experiencias.filter((e) => e.categoria === c.id);
      return items.length ? h('section', null, h('h3', { class: 'sec' }, c.titulo), h('div', { class: 'list' }, items.map(expCard))) : null;
    }));

  const ver = h('div', null,
    h('p', { class: 'lead' }, 'Lo que hay para ver en cada recorrido, parada por parada.'),
    h('ul', { class: 'list' }, db.rutas.map((r) => {
      const n = (db.paradasByRuta.get(r.id) || []).filter((p) => !p.es_comida && p.rol !== 'inicio').length;
      return h('li', null, h('a', { class: 'row', href: `#/ruta/${r.id}/ver` }, h('span', { class: 'num' }, h('span', null, r.etiqueta)),
        h('div', { class: 'main' }, h('p', { class: 'name' }, r.nombre), h('div', { class: 'meta' }, `${n} para ver`))));
    })));

  return h('div', { 'data-title': 'Qué ver' }, topbar('Qué ver', { back: false }),
    h('nav', { class: 'segs', 'aria-label': 'Qué ver' },
      h('a', { href: '#/ver', 'aria-current': tab === 'exp' ? 'page' : null }, 'Experiencias'),
      h('a', { href: '#/ver?t=rutas', 'aria-current': tab === 'rutas' ? 'page' : null }, 'Por recorrido')),
    tab === 'exp' ? exp : ver);
}
