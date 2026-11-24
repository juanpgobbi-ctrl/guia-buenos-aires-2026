// Mapa por recorrido: Leaflet + OpenStreetMap, cargado solo cuando se abre la pestaña.
import { h, icon } from '../lib/util.js';
import { db } from '../data.js';
import { MYMAPS_URL, TILE_URL, TILE_ATTRIBUTION } from '../config.js';

let leafletPromise = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = h('link', { rel: 'stylesheet', href: './vendor/leaflet/leaflet.css' });
    document.head.append(css);
    const s = h('script', { src: './vendor/leaflet/leaflet.js' });
    s.onload = () => resolve(window.L);
    s.onerror = () => { leafletPromise = null; reject(new Error('No se pudo cargar el mapa.')); };
    document.head.append(s);
  });
  return leafletPromise;
}

function pinIcon(L, p) {
  const cls = ['pin', p.estrella ? 'star' : p.es_comida ? 'food' : '', p.rol === 'opcional' ? 'opt' : ''].filter(Boolean).join(' ');
  const txt = p.n ?? (p.rol === 'inicio' ? 'I' : p.rol === 'fin' ? 'F' : '');
  return L.divIcon({ className: '', html: `<div class="${cls}"><span>${txt}</span></div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
}

function legend() {
  const sw = (cls, t) => h('span', null, h('i', { class: `pin ${cls}`, style: 'width:18px;height:18px;font-size:0' }), t);
  return h('div', { class: 'legend' }, sw('', 'Para ver'), sw('food', 'Para comer'), sw('star', '★ de mi lista'), sw('opt', 'Opcional'));
}

export function mapaView(r) {
  const box = h('div', { id: 'map', role: 'application', 'aria-label': `Mapa del recorrido ${r.etiqueta}` });
  const status = h('p', { class: 'muted small', 'aria-live': 'polite' }, 'Cargando mapa...');
  const myMaps = MYMAPS_URL
    ? h('a', { class: 'btn dark', href: MYMAPS_URL, target: '_blank', rel: 'noopener noreferrer' }, icon('map'), 'Abrir en mi My Maps')
    : h('div', { class: 'todo' }, h('b', null, 'TODO: '), 'falta la URL de My Maps. Se carga en ', h('code', null, 'js/config.js'), ' (variable MYMAPS_URL).');
  const wrap = h('div', null, legend(), box, status, myMaps);

  const paradas = (db.paradasByRuta.get(r.id) || []);
  queueMicrotask(async () => {
    try {
      const L = await loadLeaflet();
      const map = L.map(box, { zoomControl: true, attributionControl: true });
      let fallos = 0;
      const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION, crossOrigin: false });
      tiles.on('tileerror', () => {
        fallos += 1;
        if (fallos === 3) status.textContent = 'Sin conexión: se ven las paradas y la traza, sin el mapa de fondo.';
      });
      tiles.addTo(map);
      const bounds = [];
      for (const t of r.trazas) {
        const line = L.polyline(t.puntos, { color: '#a83e1e', weight: 4, opacity: .85, dashArray: t.id.includes('TIGRE') ? '6 8' : null }).addTo(map);
        line.bindTooltip(t.nombre);
        bounds.push(...t.puntos);
      }
      for (const p of paradas) {
        const m = L.marker([p.lat, p.lon], { icon: pinIcon(L, p), title: p.nombre, keyboard: true }).addTo(map);
        m.on('click', () => { location.hash = p.lugar_id ? `#/lugar/${p.lugar_id}` : `#/parada/${p.id}`; });
        if (p.rol !== 'opcional') bounds.push([p.lat, p.lon]);
      }
      map.setView([-34.6, -58.42], 12);
      const fit = () => { map.invalidateSize(); if (bounds.length) map.fitBounds(bounds, { padding: [24, 24] }); };
      requestAnimationFrame(fit);
      setTimeout(fit, 250);
      status.textContent = navigator.onLine ? 'Mapa © OpenStreetMap. Tocá un marcador para ver la ficha.' : 'Sin conexión: se ven las paradas y la traza, sin el mapa de fondo.';
    } catch (e) {
      box.replaceChildren(h('div', { class: 'empty' }, 'El mapa no está disponible sin conexión. El resto de la guía sigue funcionando.'));
      status.textContent = '';
    }
  });
  return wrap;
}
