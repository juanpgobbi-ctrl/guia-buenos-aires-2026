import { h, icon, fmtKm, copyText, link } from '../lib/util.js';
import { db, etiquetaRuta } from '../data.js';
import { getPlan } from '../lib/store.js';
import { planText, whatsapp } from '../lib/links.js';
import { lugarRow, topbar, datoBlock, emptyBox } from './parts.js';
import { mapaView } from './mapa.js';

const GRUPOS = [
  ['estilo_de_vida', 'Desde el punto de partida, a pie', 'Estilo de vida primero: bares, cafés, bodegones, barrios para caminar.'],
  ['transporte', 'Con transporte', 'Hay que llegar al inicio en subte, tren, taxi o Uber.'],
  ['turistico', 'Alternativas turísticas', 'Última prioridad: para cuando haya amigos o si pasan cerca.'],
];

export function recorridosView() {
  const sec = ([prio, titulo, desc]) => {
    const rs = db.rutas.filter((r) => r.prioridad === prio);
    return h('section', null, h('h3', { class: 'sec' }, titulo), h('p', { class: 'muted small' }, desc),
      h('ul', { class: 'list' }, rs.map((r) => h('li', null, h('a', { class: 'row', href: `#/ruta/${r.id}/plan` },
        h('span', { class: 'num' }, h('span', null, r.etiqueta)),
        h('div', { class: 'main' }, h('p', { class: 'name' }, r.nombre),
          h('div', { class: 'meta' }, `${r.km_texto || fmtKm(r.km)} · ${r.n_paradas} paradas · ${r.n_comida} para comer`)))))));
  };
  return h('div', { 'data-title': 'Recorridos' }, topbar('Recorridos'),
    h('h2', { class: 'display' }, 'Elegí por barrio, no por distancia'),
    GRUPOS.map(sec),
    h('p', { class: 'small muted', style: 'margin-top:18px' }, h('a', { href: '#/correr' }, 'Correr y bici'), ' tienen su propia pantalla.'));
}

function facts(r) {
  const rows = [['Distancia', r.km_texto || fmtKm(r.km)], ['Sale', r.sale], ['Termina', r.termina], ['Cómo llegar', r.como_llegar]];
  const extra = (r.ficha || []).filter((f) => !['Distancia', 'Sale de', 'Termina en', 'Paradas', 'Cómo llegar / volver', 'Salida'].includes(f.clave));
  return h('dl', { class: 'facts' }, [...rows, ...extra.map((f) => [f.clave, f.valor])].filter(([, v]) => v).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
}

function planPanel(r) {
  const ids = getPlan()[r.id] || [];
  if (!ids.length) {
    return h('div', { class: 'note' }, 'Tocá el marcador de cada lugar para armar tu plan de comida de este recorrido. Queda guardado en este teléfono.');
  }
  const lugares = ids.map((id) => db.lugarById.get(id)).filter(Boolean);
  const text = planText(r.etiqueta, lugares);
  const nav = typeof navigator.share === 'function' ? h('button', { class: 'btn', type: 'button', onclick: () => navigator.share({ text }).catch(() => {}) }, icon('share'), 'Compartir') : null;
  return h('div', { class: 'plan' }, h('h4', null, `Mi plan de comida, ${r.etiqueta}`),
    h('ol', null, lugares.map((l) => h('li', null, h('a', { href: `#/lugar/${l.id}` }, l.nombre)))),
    h('div', { class: 'btns', style: 'margin:6px 0 0' },
      h('a', { class: 'btn dark', href: whatsapp(text), target: '_blank', rel: 'noopener noreferrer' }, icon('share'), 'WhatsApp'),
      h('button', { class: 'btn', type: 'button', onclick: () => copyText(text, 'Plan copiado') }, icon('copy'), 'Copiar texto'), nav));
}

function tabPlan(r) {
  const paradas = (db.paradasByRuta.get(r.id) || []);
  const rels = (l) => l.relaciones.filter((x) => x.ruta === r.id);
  const star = db.lugares.filter((l) => l.origen === 'lista-mia');
  const starParada = star.filter((l) => rels(l).some((x) => x.tipo === 'parada' || x.tipo === 'inicio_fin'))
    .sort((a, b) => (rels(a)[0].n || 0) - (rels(b)[0].n || 0));
  const starCerca = star.filter((l) => rels(l).some((x) => x.tipo === 'cerca')).sort((a, b) => rels(a)[0].dist_m - rels(b)[0].dist_m);
  const otros = paradas.filter((p) => p.es_comida && !p.estrella && p.rol !== 'opcional' && p.lugar_id);
  const opcionales = paradas.filter((p) => p.es_comida && p.rol === 'opcional' && p.lugar_id);

  const grupo = (titulo, sub, items) => (items.length ? h('section', null,
    h('h3', { class: 'sec' }, titulo, h('small', null, sub)), h('ul', { class: 'list' }, items.map((x) => h('li', null, x)))) : null);

  return h('div', null, planPanel(r),
    grupo('De mi lista ★ que son parada', `${starParada.length}`, starParada.map((l) => {
      const rel = rels(l)[0];
      return lugarRow(l, { rutaId: r.id, numero: rel.n ?? (rel.rol === 'fin' ? 'F' : 'I') });
    })),
    grupo('De mi lista ★ cerca de la ruta', 'no son parada', starCerca.map((l) => {
      const rel = rels(l).find((x) => x.tipo === 'cerca');
      return lugarRow(l, { rutaId: r.id, numero: `${rel.dist_m} m` });
    })),
    grupo('Otros lugares para comer o tomar algo', 'no son de mi lista', otros.map((p) => lugarRow(db.lugarById.get(p.lugar_id), { rutaId: r.id, numero: p.n ?? (p.rol === 'fin' ? 'F' : 'I') }))),
    grupo('Opcionales, fuera de la traza', '', opcionales.map((p) => lugarRow(db.lugarById.get(p.lugar_id), { rutaId: r.id }))),
    !starParada.length && !starCerca.length && !otros.length && !opcionales.length ? emptyBox('Este recorrido no tiene paradas para comer marcadas.') : null,
    r.horarios_notas?.length ? h('section', null, h('h3', { class: 'sec' }, 'Horarios y detalles que condicionan la comida'),
      h('p', { class: 'muted small' }, 'Según la guía; sin fuente primaria.'),
      h('ul', null, r.horarios_notas.map((t) => h('li', null, t)))) : null);
}

function tabVer(r) {
  const ps = (db.paradasByRuta.get(r.id) || []).filter((p) => !p.es_comida);
  const principales = ps.filter((p) => p.rol !== 'opcional');
  const opc = ps.filter((p) => p.rol === 'opcional');
  const item = (p) => h('details', { class: 'dato' },
    h('summary', null, h('span', { class: 'num' }, h('span', null, p.n ?? '·')), h('span', { class: 'name' }, p.nombre), icon('back', 'chev')),
    h('div', { class: 'body' }, datoBlock(p.dato_curioso),
      p.lo_que_se ? h('p', { class: 'small' }, p.lo_que_se) : null,
      p.detalle && !p.dato_curioso ? h('p', { class: 'small' }, p.detalle) : null,
      p.dist_traza_m ? h('p', { class: 'small muted' }, `A ~${p.dist_traza_m} m de la traza.`) : null,
      p.practico ? h('p', { class: 'small' }, h('b', null, 'Práctico: '), p.practico) : null,
      h('a', { class: 'btn', href: `#/parada/${p.id}` }, icon('pin'), 'Ficha y mapa')));
  return h('div', null,
    principales.length ? [h('h3', { class: 'sec' }, 'Qué ver, parada por parada'), principales.map(item)] : emptyBox('No hay paradas para ver cargadas.'),
    opc.length ? [h('h3', { class: 'sec' }, 'Opcionales', h('small', null, 'fuera de la traza')), opc.map(item)] : null);
}

export function rutaView({ segs }) {
  const r = db.rutaById.get(segs[0]);
  if (!r) return h('div', { 'data-title': 'Recorrido' }, topbar('Recorrido'), emptyBox('Ese recorrido no existe.'));
  const tab = segs[1] || (r.n_comida ? 'plan' : 'ver');
  const tabs = [...(r.n_comida || db.lugares.some((l) => l.relaciones.some((x) => x.ruta === r.id)) ? [['plan', 'Planear comida']] : []), ['ver', r.tipo === 'running' || r.tipo === 'bici' ? 'Puntos' : 'Qué ver'], ['mapa', 'Mapa']];
  const cur = tabs.some(([k]) => k === tab) ? tab : tabs[0][0];
  const body = cur === 'plan' ? tabPlan(r) : cur === 'ver' ? tabVer(r) : mapaView(r);
  return h('div', { 'data-title': `${r.etiqueta} · ${r.nombre}` },
    topbar(`${r.etiqueta} · ${r.nombre}`),
    h('div', { class: 'bignum' }, r.tipo === 'bici' ? '26 a 42 km' : `${fmtKm(r.km)}`),
    facts(r),
    h('h3', { class: 'sec', style: 'margin-top:.6rem' }, 'El recorrido y el barrio'),
    h('p', null, r.descripcion),
    h('nav', { class: 'segs', 'aria-label': 'Secciones del recorrido' }, tabs.map(([k, t]) =>
      h('a', { href: `#/ruta/${r.id}/${k}`, 'aria-current': k === cur ? 'page' : null }, t))),
    body);
}
