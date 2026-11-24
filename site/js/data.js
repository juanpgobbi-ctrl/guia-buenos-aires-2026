// Carga de data.json e índices.
export const ORIGEN = {
  'lista-mia': { label: 'Mi lista', cls: 'lista' },
  'mapa-oficial': { label: 'Mapa oficial', cls: 'oficial' },
  'busqueda-propia': { label: 'Búsqueda propia', cls: 'propia' },
};

export const DIA_LABEL = { lun: 'lunes', mar: 'martes', mie: 'miércoles', jue: 'jueves', vie: 'viernes', sab: 'sábado', dom: 'domingo' };

export const db = { ready: false };

export async function loadData() {
  const res = await fetch('./data.json');
  if (!res.ok) throw new Error(`data.json: ${res.status}`);
  const data = await res.json();
  db.raw = data;
  db.rutas = data.rutas;
  db.rutaById = new Map(data.rutas.map((r) => [r.id, r]));
  db.lugares = data.lugares;
  db.lugarById = new Map(data.lugares.map((l) => [l.id, l]));
  db.paradas = data.paradas;
  db.paradaById = new Map(data.paradas.map((p) => [p.id, p]));
  db.paradasByRuta = new Map();
  for (const p of data.paradas) {
    if (!db.paradasByRuta.has(p.ruta)) db.paradasByRuta.set(p.ruta, []);
    db.paradasByRuta.get(p.ruta).push(p);
  }
  db.categorias = new Map(data.categorias.map((c) => [c.id, c.titulo]));
  db.experiencias = data.experiencias;
  db.ready = true;
  return db;
}

export const etiquetaRuta = (id) => db.rutaById.get(id)?.etiqueta || id.toUpperCase();

/** Texto corto de dónde está el lugar en el plan. */
export function estadoPlan(l) {
  const rels = l.relaciones || [];
  if (!rels.length) return { texto: 'No está en el plan', enPlan: false };
  const r = rels.find((x) => x.tipo === 'parada') || rels[0];
  const et = etiquetaRuta(r.ruta);
  if (r.tipo === 'parada') return { texto: `Parada ${r.n} · ${et}`, enPlan: true, rel: r };
  if (r.tipo === 'cerca') return { texto: `Cerca de ${et} (~${r.dist_m} m)`, enPlan: true, rel: r };
  if (r.tipo === 'opcional') return { texto: `Opcional · ${et}${r.dist_m ? ` (~${r.dist_m} m)` : ''}`, enPlan: true, rel: r };
  return { texto: `${r.rol === 'fin' ? 'Final' : 'Inicio'} · ${et}`, enPlan: true, rel: r };
}
