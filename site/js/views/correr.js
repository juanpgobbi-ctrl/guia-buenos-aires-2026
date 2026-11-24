import { h, fmtKm } from '../lib/util.js';
import { db } from '../data.js';
import { topbar } from './parts.js';

export function correrView() {
  const rs = db.rutas.filter((r) => r.tipo === 'running' || r.tipo === 'bici');
  const card = (r) => {
    const pts = (db.paradasByRuta.get(r.id) || []).filter((p) => p.rol !== 'inicio');
    return h('section', { class: 'exp', style: 'margin-bottom:14px' },
      h('p', { class: 'kicker' }, r.tipo === 'running' ? 'Correr' : 'Bici'),
      h('div', { class: 'bignum' }, r.tipo === 'bici' ? '26 a 42' : r.km_texto.replace(/^~/, '').replace(' (traza Mapbox, a pie)', ''), h('small', null, r.tipo === 'bici' ? ' km' : '')),
      h('dl', { class: 'facts' },
        h('dt', null, 'Salida'), h('dd', null, r.sale),
        h('dt', null, 'Llegada'), h('dd', null, r.tipo === 'bici' ? 'Mismo punto (ida y vuelta)' : r.termina),
        ...r.ficha.filter((f) => !['Distancia', 'Salida', 'Salida y llegada'].includes(f.clave)).flatMap((f) => [h('dt', null, f.clave), h('dd', null, f.valor)])),
      h('p', null, r.descripcion),
      pts.length ? [h('h4', { style: 'margin:.8rem 0 .2rem' }, 'Puntos que figuran en las fuentes'),
        h('ul', null, pts.map((p) => h('li', null, h('a', { href: `#/parada/${p.id}` }, p.nombre))))] : null,
      h('div', { class: 'btns' }, h('a', { class: 'btn primary', href: `#/ruta/${r.id}/mapa` }, 'Ver mapa'),
        h('a', { class: 'btn', href: `#/ruta/${r.id}/ver` }, 'Detalle de puntos')));
  };
  return h('div', { 'data-title': 'Correr y bici' }, topbar('Correr y bici'),
    h('h2', { class: 'display' }, 'Entrenamiento y bici'),
    h('p', { class: 'lead' }, 'Solo figura lo que está en las fuentes: km, salida, llegada y los puntos del KML. La calidad de la ciclovía no está verificada.'),
    rs.map(card));
}
