// Mapa por recorrido: Leaflet + OpenStreetMap, cargado solo cuando se abre la pestaña.
import { h, icon } from '../lib/util.js';
import { db } from '../data.js';
import { MYMAPS_URL, TILE_URL, TILE_ATTRIBUTION } from '../config.js';
import { MAP_KINDS, getMaps, myMapsViewerUrl, parseMid, setMap } from '../lib/store.js';

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
  const kind = r.tipo === 'bici' || r.tipo === 'running' ? 'bici' : 'calles';
  const myMaps = h('div', null);
  const paintMaps = () => {
    const mid = getMaps()[kind];
    const url = MYMAPS_URL || (mid ? myMapsViewerUrl(mid) : '');
    if (url) {
      myMaps.replaceChildren(
        h('a', { class: 'btn dark', href: url, target: '_blank', rel: 'noopener noreferrer' }, icon('map'), 'Abrir en mi My Maps'),
        mid ? h('button', { class: 'btn', type: 'button', style: 'margin-left:8px', onclick: () => { setMap(kind, null); paintMaps(); } }, 'Quitar link') : null);
      return;
    }
    const input = h('input', { type: 'url', placeholder: 'https://www.google.com/maps/d/...', 'aria-label': 'URL de My Maps', style: 'width:100%;min-height:46px;border-radius:10px;border:1.5px solid var(--line);background:var(--paper);color:var(--ink);padding:0 12px;font:inherit' });
    const msg = h('p', { class: 'small muted', 'aria-live': 'polite' });
    const save = h('button', { class: 'btn primary', type: 'button' }, 'Guardar link');
    save.addEventListener('click', () => {
      const m = parseMid(input.value);
      if (!m) { msg.textContent = 'Eso no parece un link de Google My Maps.'; return; }
      setMap(kind, m);
      paintMaps();
    });
    myMaps.replaceChildren(h('div', { class: 'todo' },
      h('b', null, 'TODO: '), `falta el link de ${MAP_KINDS.find(([k]) => k === kind)[1].toLowerCase()} en My Maps. Pegalo acá: se guarda solo en este teléfono y no se publica.`,
      h('div', { style: 'margin:8px 0' }, input), save, msg));
  };
  paintMaps();
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
