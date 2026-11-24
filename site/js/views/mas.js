import { h, icon, copyText } from '../lib/util.js';
import { getTema, setTema } from '../lib/store.js';
import { topbar } from './parts.js';

export function masView() {
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
      h('li', null, row('#/lista', 'Mi lista (77)', 'Los lugares guardados, con su lugar en el plan', 'star')),
      h('li', null, row('#/correr', 'Correr y bici', 'Entrenamiento de 12,7 km y bici de 26 a 42 km', 'run')),
      h('li', null, row('#/noverif', 'Qué no verifiqué', 'Lo que hay que chequear antes de salir', 'alert')),
      h('li', null, row('#/buscar', 'Buscar', 'Lugares, paradas, recorridos y experiencias', 'search'))),
    h('h3', { class: 'sec' }, 'Tema'), grupo,
    h('h3', { class: 'sec' }, 'Compartir esta guía'),
    h('p', { class: 'small muted' }, 'Cualquier pantalla tiene su propio link. Copiá el de esta guía para mandarlo.'),
    h('button', { class: 'btn', type: 'button', onclick: () => copyText(location.href.split('#')[0], 'Link copiado') }, icon('link'), 'Copiar link de la guía'),
    h('h3', { class: 'sec' }, 'Sobre los datos'),
    h('p', { class: 'small muted' }, 'Sin cuentas, sin rastreo y sin claves. Tu plan de comida y el tema se guardan solo en este teléfono. La ubicación, si la activás en Comer, se usa en el momento y no se guarda. Mapa de fondo: © OpenStreetMap contributors.'));
}
