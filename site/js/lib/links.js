// Links a Google Maps y texto para compartir.
const q = encodeURIComponent;

export function mapsPlace(l) {
  const query = l.coord_aproximada && l.direccion ? `${l.nombre}, ${l.direccion}` : `${l.lat},${l.lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${q(query)}`;
}

export function mapsRoute(l) {
  return `https://www.google.com/maps/dir/?api=1&destination=${q(`${l.lat},${l.lon}`)}&travelmode=walking`;
}

export function planText(rutaNombre, lugares) {
  const lines = [`Plan de comida, recorrido ${rutaNombre}:`];
  lugares.forEach((l, i) => {
    const dir = l.direccion ? `, ${l.direccion}` : '';
    lines.push(`${i + 1}. ${l.nombre}${dir} ${mapsPlace(l)}`);
  });
  return lines.join('\n');
}

export function whatsapp(text) {
  return `https://wa.me/?text=${q(text)}`;
}
