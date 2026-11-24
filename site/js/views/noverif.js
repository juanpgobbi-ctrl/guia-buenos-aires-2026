import { h } from '../lib/util.js';
import { db } from '../data.js';
import { topbar, fuenteLinks } from './parts.js';

const ESTADO = { resuelto_con_fuente: 'Resuelto con fuente', parcial: 'Resuelto en parte', abierto: 'Abierto' };

function discrepancia(d) {
  return h('article', { class: 'exp' },
    h('span', { class: `badge ${d.estado === 'abierto' ? 'warn' : 'soft'}` }, ESTADO[d.estado]),
    h('h4', { style: 'margin-top:8px' }, d.tema),
    h('p', { class: 'small' }, h('b', null, 'En la guía: '), d.en_la_guia),
    h('p', { class: 'small' }, h('b', null, 'Lo que encontré: '), d.hallazgo),
    h('p', { class: 'small' }, h('b', null, 'Qué muestra la app: '), d.decision),
    d.fuentes.length ? h('p', { class: 'src' }, 'Fuentes: ', fuenteLinks(d.fuentes)) : null);
}

export function noVerificadoView() {
  const lugares = db.lugares;
  const conHorario = lugares.filter((l) => l.horarios.texto).length;
  const sinDato = lugares.filter((l) => l.origen === 'lista-mia' && !l.dato_curioso);
  const paradasSinDato = db.paradas.filter((p) => !p.es_comida && p.sin_dato_verificado && p.rol !== 'inicio' && !p.dato_curioso);
  const grupos = {};
  for (const n of db.raw.no_verificado) (grupos[n.tipo] ||= []).push(n);
  const titulos = { horario_o_acceso: 'Horarios, reservas y transporte', sin_dato_curioso: 'Sin dato curioso verificado', sucursal_sin_confirmar: 'Sucursal o coincidencia sin confirmar', coordenada_aproximada: 'Coordenadas aproximadas' };
  const item = (n) => h('li', null, n.ref ? h('a', { href: `#/lugar/${n.ref}` }, n.titulo) : n.titulo);

  return h('div', { 'data-title': 'Qué no verifiqué' }, topbar('Qué no verifiqué'),
    h('h2', { class: 'display' }, 'Chequealo antes de salir'),
    h('p', { class: 'lead' }, 'Todo lo que figura como sin verificar, N/A o en discrepancia. Lo que no pude confirmar con una fuente queda acá y no se completa de memoria.'),
    h('div', { class: 'note' }, h('b', null, 'Horarios: '), `ningún horario tiene fuente primaria. ${conHorario} lugares traen un horario escrito en la guía o en la lista; el resto no tiene dato. Por eso el filtro "Abierto ahora" no muestra nada hasta que un horario esté verificado.`),
    h('h3', { class: 'sec' }, 'Datos en discrepancia', h('small', null, `${db.raw.discrepancias.length}`)),
    h('div', { class: 'list' }, db.raw.discrepancias.map(discrepancia)),
    Object.entries(grupos).map(([tipo, items]) => h('section', null,
      h('h3', { class: 'sec' }, titulos[tipo] || tipo, h('small', null, `${items.length}`)), h('ul', null, items.map(item)))),
    h('h3', { class: 'sec' }, 'Sin dato curioso verificado'),
    h('details', { class: 'filters' }, h('summary', { style: 'font-weight:700;min-height:44px;display:flex;align-items:center;cursor:pointer' }, `Lugares de mi lista (${sinDato.length})`),
      h('ul', null, sinDato.map((l) => h('li', null, h('a', { href: `#/lugar/${l.id}` }, l.nombre))))),
    h('details', { class: 'filters' }, h('summary', { style: 'font-weight:700;min-height:44px;display:flex;align-items:center;cursor:pointer' }, `Paradas para ver (${paradasSinDato.length})`),
      h('ul', null, paradasSinDato.map((p) => h('li', null, h('a', { href: `#/parada/${p.id}` }, `${db.rutaById.get(p.ruta).etiqueta}${p.n ? ' · ' + p.n : ''} ${p.nombre}`))))),
    h('p', { class: 'small muted' }, 'Detalle del cruce de fuentes y de lo corregido: AUDITORIA.md, en el repositorio del proyecto.'));
}
