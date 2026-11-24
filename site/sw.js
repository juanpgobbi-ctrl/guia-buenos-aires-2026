/* Service worker: la app funciona sin conexion despues de la primera carga.
   Solo cachea archivos propios; los mosaicos de OpenStreetMap NO se guardan (politica de uso de tiles). */
const CACHE = 'ba26-v1';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './data.json', './css/styles.css',
  './js/main.js', './js/config.js', './js/data.js',
  './js/lib/util.js', './js/lib/store.js', './js/lib/geo.js', './js/lib/links.js',
  './js/views/parts.js', './js/views/sheet.js', './js/views/home.js', './js/views/comer.js', './js/views/lugar.js',
  './js/views/rutas.js', './js/views/mapa.js', './js/views/correr.js', './js/views/ver.js', './js/views/lista.js',
  './js/views/noverif.js', './js/views/mas.js', './js/views/buscar.js',
  './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/layers.png', './vendor/leaflet/images/layers-2x.png',
  './vendor/leaflet/images/marker-icon.png', './vendor/leaflet/images/marker-icon-2x.png', './vendor/leaflet/images/marker-shadow.png',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // tiles y otros dominios: directo a la red

  // Datos: red primero (para tomar actualizaciones), cache si no hay conexion.
  if (url.pathname.endsWith('/data.json')) {
    event.respondWith(
      fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req)),
    );
    return;
  }
  // Resto: cache primero y actualizacion en segundo plano.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      return hit || net;
    }),
  );
});
