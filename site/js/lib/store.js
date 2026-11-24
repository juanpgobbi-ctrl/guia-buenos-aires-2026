// Estado local del dispositivo (localStorage). Nada sale del teléfono.
const safe = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
};

const PLAN_KEY = 'ba26.plan';

export function getPlan() {
  try { return JSON.parse(safe.get(PLAN_KEY) || '{}'); } catch { return {}; }
}

export function isCandidate(rutaId, lugarId) {
  return (getPlan()[rutaId] || []).includes(lugarId);
}

export function togglePlan(rutaId, lugarId) {
  const plan = getPlan();
  const cur = plan[rutaId] || [];
  const next = cur.includes(lugarId) ? cur.filter((x) => x !== lugarId) : [...cur, lugarId];
  const out = { ...plan, [rutaId]: next };
  if (!next.length) delete out[rutaId];
  safe.set(PLAN_KEY, JSON.stringify(out));
  document.dispatchEvent(new CustomEvent('plan-changed'));
  return next.includes(lugarId);
}

export function getTema() { return safe.get('ba26.tema') || 'auto'; }

export function setTema(t) {
  safe.set('ba26.tema', t);
  if (t === 'auto') delete document.documentElement.dataset.tema;
  else document.documentElement.dataset.tema = t;
}

// My Maps: el link vive solo en cada teléfono (nunca en el repositorio).
const MAPS_KEY = 'ba26.mymaps';
export const MAP_KINDS = [
  ['calles', 'Mapa de caminatas'],
  ['bici', 'Mapa de bici y running'],
];

/** Acepta un link de My Maps (edición o lectura) o el id suelto y devuelve el id, o null. */
export function parseMid(input) {
  const txt = String(input || '').trim();
  const m = txt.match(/[?&]mid=([A-Za-z0-9_-]{10,})/) || txt.match(/^([A-Za-z0-9_-]{20,})$/);
  if (!m) return null;
  if (/^https?:/i.test(txt) && !/^https:\/\/(www\.)?google\.com\/maps\/d\//i.test(txt)) return null;
  return m[1];
}

export function myMapsViewerUrl(mid) {
  return `https://www.google.com/maps/d/viewer?mid=${mid}`;
}

export function getMaps() {
  try { return JSON.parse(safe.get(MAPS_KEY) || '{}'); } catch { return {}; }
}

export function setMap(kind, mid) {
  const cur = getMaps();
  if (mid) cur[kind] = mid; else delete cur[kind];
  safe.set(MAPS_KEY, JSON.stringify(cur));
  document.dispatchEvent(new CustomEvent('maps-changed'));
}
