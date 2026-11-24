import { h, icon, copyText, fmtRating, toast } from '../lib/util.js';
import { db, ORIGEN, estadoPlan, etiquetaRuta } from '../data.js';
import { mapsPlace, mapsRoute } from '../lib/links.js';
import { badgeOrigen, datoBlock, fuenteLinks, horarioBadge } from './parts.js';
import { isCandidate, togglePlan } from '../lib/store.js';

function section(titulo, ...children) {
  return h('div', { class: 'block' }, h('h4', null, titulo), children);
}

function mapButtons(item) {
  const hasAddr = Boolean(item.direccion);
  return h('div', { class: 'btns' },
    h('a', { class: 'btn primary', href: mapsPlace(item), target: '_blank', rel: 'noopener noreferrer' }, icon('map'), 'Abrir en Google Maps'),
    h('a', { class: 'btn', href: mapsRoute(item), target: '_blank', rel: 'noopener noreferrer' }, icon('nav'), 'Cómo llegar'),
    h('button', { class: 'btn', type: 'button', disabled: hasAddr ? null : true,
      onclick: () => copyText(item.direccion, 'Dirección copiada') }, icon('copy'), hasAddr ? 'Copiar dirección' : 'Dirección sin verificar'));
}

export async function lugarSheet(id) {
  const l = db.lugarById.get(id);
  if (!l) return h('div', { 'data-title': 'No encontrado' }, h('p', null, 'Ese lugar no existe en la guía.'));
  const plan = estadoPlan(l);
  const cats = db.categorias.get(l.categoria);

  const rutas = [...new Set(l.relaciones.map((r) => r.ruta))];
  const planBtns = rutas.map((rid) => {
    const btn = h('button', { class: 'btn', type: 'button', 'aria-pressed': String(isCandidate(rid, l.id)) });
    const paint = () => { const on = isCandidate(rid, l.id); btn.replaceChildren(icon('bookmark'), on ? `Quitar del plan (${etiquetaRuta(rid)})` : `Sumar al plan (${etiquetaRuta(rid)})`); btn.setAttribute('aria-pressed', String(on)); };
    paint();
    btn.addEventListener('click', () => { const on = togglePlan(rid, l.id); paint(); toast(on ? 'Sumado a tu plan de comida' : 'Quitado del plan'); });
    return btn;
  });

  const horario = l.horarios.texto
    ? h('p', null, `Según la guía: ${l.horarios.texto}.`, h('br'), h('span', { class: 'muted small' }, 'Sin fuente primaria. Confirmalo antes de ir.'))
    : h('p', { class: 'muted' }, 'Sin dato de horarios.');

  return h('div', { 'data-title': l.nombre },
    h('div', { class: 'tags', style: 'display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 8px' },
      badgeOrigen(l), h('span', { class: 'badge soft' }, cats), l.barrio ? h('span', { class: 'badge soft' }, l.barrio) : null,
      l.coord_aproximada ? h('span', { class: 'badge warn' }, 'Ubicación aproximada') : null),
    l.direccion ? h('p', null, l.direccion) : h('p', { class: 'muted' }, 'Dirección: sin verificar'),
    mapButtons(l),
    l.por_que_en_mi_lista ? section('Por qué está en mi lista', h('p', null, l.por_que_en_mi_lista)) : null,
    section('En el plan', h('p', null, plan.texto,
      l.relaciones.length ? [' · ', ...l.relaciones.filter((r, i, a) => a.findIndex((x) => x.ruta === r.ruta) === i).map((r, i) =>
        [i ? ', ' : '', h('a', { href: `#/ruta/${r.ruta}/plan` }, `ver recorrido ${etiquetaRuta(r.ruta)}`)])] : null),
      planBtns.length ? h('div', { class: 'btns' }, planBtns) : null),
    section('Dato curioso', datoBlock(l.dato_curioso)),
    section('Horarios', horarioBadge(l), horario),
    l.rating ? section('Calificación', h('p', null, `Google Maps: ${fmtRating(l.rating.valor)}`, h('br'),
      h('span', { class: 'muted small' }, `Del momento en que se armó la lista. Fecha exacta: ${l.rating.fecha.startsWith('N/A') ? 'N/A' : l.rating.fecha}.`))) : null,
    l.sin_confirmar ? h('div', { class: 'note' }, h('b', null, 'Sin confirmar: '), 'la sucursal o la coincidencia de este lugar no está confirmada. Mirá las notas.') : null,
    l.notas && l.origen !== 'lista-mia' ? section('Notas', h('p', null, l.notas)) : null,
    section('De dónde sale', h('p', null, ORIGEN[l.origen].label === 'Mi lista' ? 'Mi lista guardada. ' : ORIGEN[l.origen].label + '. ', fuenteLinks(l.fuentes))));
}

export async function paradaSheet(id) {
  const p = db.paradaById.get(id);
  if (!p) return h('div', { 'data-title': 'No encontrado' }, h('p', null, 'Esa parada no existe en la guía.'));
  if (p.lugar_id) return lugarSheet(p.lugar_id);
  const r = db.rutaById.get(p.ruta);
  const rol = { parada: `Parada ${p.n}`, inicio: 'Inicio', fin: 'Final', opcional: 'Opcional', punto: 'Punto del recorrido' }[p.rol];
  return h('div', { 'data-title': p.nombre },
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;margin:2px 0 8px' },
      h('span', { class: 'badge soft' }, `${rol} · ${r.etiqueta}`), p.coord_aproximada ? h('span', { class: 'badge warn' }, 'Ubicación aproximada') : null),
    mapButtons({ ...p, direccion: null }),
    p.detalle ? h('p', null, p.detalle) : null,
    p.dist_traza_m ? h('p', { class: 'muted' }, `Queda a ~${p.dist_traza_m} m de la traza.`) : null,
    section('Dato curioso', datoBlock(p.dato_curioso)),
    p.practico ? section('Práctico', h('p', null, p.practico)) : null,
    section('De dónde sale', h('p', null, 'Guía v6; coordenadas y orden: KML. ', h('a', { href: `#/ruta/${r.id}/ver` }, `Ver recorrido ${r.etiqueta}`))));
}
