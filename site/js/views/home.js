import { h, icon } from '../lib/util.js';
import { db } from '../data.js';

export function homeView() {
  const lista = db.lugares.filter((l) => l.origen === 'lista-mia').length;
  const comer = db.lugares.length;
  const rutas = db.rutas.filter((r) => r.tipo === 'caminata' || r.tipo === 'alternativa').length;
  const sinVerif = db.raw.discrepancias.filter((d) => d.estado !== 'resuelto_con_fuente').length + db.raw.no_verificado.length;

  const input = h('input', { type: 'search', placeholder: 'Buscar lugar, recorrido o parada', 'aria-label': 'Buscar', enterkeyhint: 'search', autocomplete: 'off' });
  const form = h('form', { class: 'searchbox', role: 'search' }, icon('search'), input);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) location.hash = `#/buscar?q=${encodeURIComponent(q)}`;
  });

  const tile = (href, titulo, n, cls = '', ico = null) => h('a', { class: `tile ${cls}`, href },
    ico ? icon(ico) : null, h('div', null, h('span', { class: 't' }, titulo), h('span', { class: 'n' }, n)));

  const node = h('div', { 'data-title': 'Inicio' },
    h('section', { class: 'hero' },
      h('p', { class: 'kicker' }, 'Guía de recorridos'),
      h('h2', null, 'Buenos Aires', h('span', null, '2026'))),
    form,
    h('div', { class: 'tiles' },
      tile('#/comer', 'Comer', `${comer} lugares, filtrables`, 'big', 'food'),
      tile('#/recorridos', 'Recorridos', `${rutas} caminatas`, '', 'route'),
      tile('#/correr', 'Correr y bici', '12,7 km y 26 a 42 km', '', 'run'),
      tile('#/ver', 'Qué ver', 'Paradas y experiencias', '', 'eye'),
      tile('#/lista', 'Mi lista', `${lista} lugares ★`, '', 'star'),
      tile('#/noverif', 'Qué no verifiqué', `${sinVerif} puntos para chequear`, 'warn', 'alert')),
    h('p', { class: 'muted small', style: 'margin-top:18px' },
      'Los datos viajan en el teléfono: después de abrirla una vez con conexión, funciona sin internet. El mapa de fondo necesita conexión.'));
  return node;
}
