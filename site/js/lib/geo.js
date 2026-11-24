// Distancias, geolocalización opcional y "abierto ahora" (hora de Buenos Aires).
export function haversine(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

let lastPos = null;
export const getLastPos = () => lastPos;

export function locate() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Este navegador no tiene geolocalización.'));
    navigator.geolocation.getCurrentPosition(
      (p) => { lastPos = [p.coords.latitude, p.coords.longitude]; resolve(lastPos); },
      (e) => reject(new Error(e.code === 1 ? 'Permiso de ubicación denegado.' : 'No se pudo obtener la ubicación.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}

const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

/** Hora actual en Buenos Aires: { dia: 'lun', min: minutos desde 0:00 }. */
export function ahoraBA(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  const wd = { Sun: 'dom', Mon: 'lun', Tue: 'mar', Wed: 'mie', Thu: 'jue', Fri: 'vie', Sat: 'sab' }[get('weekday')];
  return { dia: wd, min: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

/**
 * true/false solo si el horario está verificado y trae `semana` estructurada
 * ({ lun: [[540, 1200]], ... } en minutos). En cualquier otro caso devuelve null:
 * nunca se asume que está abierto.
 */
export function abiertoAhora(lugar, date = new Date()) {
  const hs = lugar.horarios;
  if (!hs || hs.estado !== 'verificado' || !hs.semana) return null;
  const { dia, min } = ahoraBA(date);
  const tramos = hs.semana[dia] || [];
  return tramos.some(([a, b]) => (a <= b ? min >= a && min < b : min >= a || min < b));
}

export { DIAS };
