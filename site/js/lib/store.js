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
