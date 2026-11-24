import { h, icon, copyText } from '../lib/util.js';
import { MAP_KINDS, getMaps, getTema, myMapsViewerUrl, parseMid, setMap, setTema } from '../lib/store.js';
import { topbar } from './parts.js';
import { db } from '../data.js';

function mapasSection() {
  const box = h('div', null);
  const paint = () => {
    const cur = getMaps();
    const rows = MAP_KINDS.map(([kind, label]) => {
      const input = h('input', { type: 'url', value: cur[kind] ? myMapsViewerUrl(cur[kind]) : '', placeholder: 'Pegá el link de My Maps', 'aria-label': label,
        style: 'width:100%;min-height:46px;border-radius:10px;border:1.5px solid var(--line);background:var(--paper);color:var(--ink);padding:0 12px;font:inherit' });
      const msg = h('span', { class: 'small muted', 'aria-live': 'polite' });
      const save = h('button', { class: 'btn', type: 'button' }, 'Guardar');
      save.addEventListener('click', () => {
        if (!input.value.trim()) { setMap(kind, null); paint(); return; }
        const m = parseMid(input.value);
        if (!m) { msg.textContent = 'No parece un link de Google My Maps.'; return; }
        setMap(kind, m); paint();
      });
      return h('div', { style: 'margin:10px 0' }, h('label', { class: 'small', style: 'font-weight:700;display:block;margin-bottom:4px' }, label), input,
        h('div', { class: 'btns', style: 'margin:6px 0 0' }, save, msg));
    });
    const mids = getMaps();
    const share = Object.keys(mids).length
      ? h('button', { class: 'btn dark', type: 'button', onclick: () => {
        const q = new URLSearchParams(mids).toString();
        copyText(`${location.href.split('#')[0]}#/mas?${q}`, 'Link con tus mapas copiado');
      } }, icon('link'), 'Copiar link de la guía con mis mapas') : null;
    box.replaceChildren(...rows, share, share ? h('p', { class: 'small muted' }, 'Ese link guarda los mapas en el teléfono de quien lo abra. Mandalo solo a quien quieras que vea tus mapas.') : null);
  };
  paint();
  return box;
}

export function masView({ query } = {}) {
  let aviso = null;
  for (const [kind] of MAP_KINDS) {
    const m = query?.get(kind) && parseMid(query.get(kind));
    if (m) { setMap(kind, m); aviso = 'Guardé los mapas de My Maps en este teléfono.'; }
  }
  if (aviso) history.replaceState(null, '', location.href.split('?')[0]);
  const temas = [['auto', 'Automático'], ['claro', 'Claro'], ['oscuro', 'Oscuro']];
  const grupo = h('div', { class: 'segs', role: 'group', 'aria-label': 'Tema' });
  const paint = () => grupo.replaceChildren(...temas.map(([k, t]) => {
    const b = h('button', { type: 'button', 'aria-pressed': String(getTema() === k) }, t);
    b.addEventListener('click', () => { setTema(k); paint(); });
    return b;
  }));
  paint();
  const row = (href, titulo, desc, ico) => h('a', { class: 'row', href }, icon(ico), h('div', { class: 'main' }, h('p', { class: 'name' }, titulo), h('div', { class: 'meta' }, desc)));
  return h('div', { 'data-title': 'Más' }, topbar('Más', { back: false }),
    h('ul', { class: 'list' },
      h('li', null, row('#/lista', `Mi lista (${db.lugares.filter((l) => l.origen === 'lista-mia').length})`, 'Los lugares guardados, con su lugar en el plan', 'star')),
      h('li', null, row('#/correr', 'Correr y bici', 'Entrenamiento de 12,7 km y bici de 26 a 42 km', 'run')),
      h('li', null, row('#/noverif', 'Qué no verifiqué', 'Lo que hay que chequear antes de salir', 'alert')),
      h('li', null, row('#/buscar', 'Buscar', 'Lugares, paradas, recorridos y experiencias', 'search'))),
    aviso ? h('div', { class: 'note' }, aviso) : null,
    h('h3', { class: 'sec' }, 'Mis mapas (My Maps)'),
    h('p', { class: 'small muted' }, 'Los links se guardan solo en este teléfono. No están en el repositorio ni en el sitio.'),
    mapasSection(),
    h('h3', { class: 'sec' }, 'Tema'), grupo,
    h('h3', { class: 'sec' }, 'Compartir esta guía'),
    h('p', { class: 'small muted' }, 'Cualquier pantalla tiene su propio link. Copiá el de esta guía para mandarlo.'),
    h('button', { class: 'btn', type: 'button', onclick: () => copyText(location.href.split('#')[0], 'Link copiado') }, icon('link'), 'Copiar link de la guía'),
    h('h3', { class: 'sec' }, 'Sobre los datos'),
    h('p', { class: 'small muted' }, 'Sin cuentas, sin rastreo y sin claves. Tu plan de comida y el tema se guardan solo en este teléfono. La ubicación, si la activás en Comer, se usa en el momento y no se guarda. Mapa de fondo: © OpenStreetMap contributors.'));
}
