# Buenos Aires 2026: guía de recorridos

Web app para el celular (PWA) para decidir rápido dónde comer, de dónde sale cada recomendación y qué ver, en la calle o un rato antes de salir. Reemplaza a la guía larga en Google Docs.

- Sin backend, sin cuentas, sin analytics y sin claves de API.
- Funciona sin internet después de la primera carga. El mapa de fondo (OpenStreetMap) necesita conexión; las paradas y la traza se ven igual.
- Cada pantalla tiene su propio link (`#/comer`, `#/ruta/a/plan`, `#/lugar/<id>`, ...), así que se puede mandar por WhatsApp.
- Vanilla JavaScript con módulos nativos, sin paso de build. Leaflet 1.9.4 está incluido en `site/vendor/`.

URL pública: se completa al terminar el primer deploy (`https://<usuario>.github.io/<repo>/`).

## Agregar la guía a la pantalla de inicio

**iPhone (Safari)**
1. Abrí el link en Safari (tiene que ser Safari, no el navegador de otra app).
2. Tocá el botón Compartir (el cuadrado con la flecha hacia arriba).
3. Elegí "Agregar a pantalla de inicio" y confirmá con "Agregar".
4. Abrila una vez con conexión desde el ícono: así se guardan los datos para usarla sin internet.

**Android (Chrome)**
1. Abrí el link en Chrome.
2. Tocá el menú de los tres puntos.
3. Elegí "Instalar app" (o "Agregar a la pantalla principal").
4. Abrila una vez con conexión desde el ícono para guardar los datos.

## Cómo actualizar los datos

Los datos salen de las fuentes originales y se generan con un script. Las fuentes no están en el repositorio (contienen datos privados): viven en la carpeta local `fuentes/`, ignorada por git.

1. Dejá en `fuentes/` los archivos actualizados:
   - `guia_v6.md`: la guía exportada desde Google Docs a Markdown.
   - `caminatas_v5.kml` y `running_bici_v4.kml`: coordenadas y orden de las paradas.
   - `lista_restaurantes.csv`: la planilla de los 77 lugares (Google Sheets, descargada como CSV).
   - `privacy_rules.txt` y `privacy_denylist.txt`: reglas privadas de limpieza (reemplazos y términos prohibidos).
2. Generá `site/data.json` y corré los tests:

   ```powershell
   pip install -r requirements-dev.txt
   python -I -X utf8 scripts/build_data.py
   python -I -m pytest -q tests
   ```

3. Revisá el sitio en local (opcional):

   ```powershell
   python -m http.server 8123 --directory site
   ```

4. Hacé commit de `site/data.json` y de lo que haya cambiado, y push a `main`. El workflow de GitHub Actions corre los tests y redespliega el sitio solo.

Para cambiar texto o ajustes sin tocar las fuentes se puede editar `site/data.json` a mano, pero el próximo `build_data.py` lo va a sobrescribir.

### Mapas de My Maps

Los mapas de My Maps tienen datos personales, así que **no se publican en el repositorio**. Hay dos formas de usarlos:

- En la pestaña Mapa de cada recorrido (o en Más, "Mis mapas") se pega el link de My Maps; sirve el link de edición o el de lectura. Queda guardado solo en ese teléfono. Mientras falte, la pestaña muestra un aviso TODO visible.
- En Más, el botón "Copiar link de la guía con mis mapas" arma un link que, al abrirlo, guarda los mapas en el teléfono de quien lo recibe. Conviene mandarlo solo a quien quieras que vea tus mapas, y que los mapas estén compartidos como "cualquiera con el enlace".

`MYMAPS_URL` en `site/js/config.js` queda vacía (sirve para fijar un mapa público, si algún día hace falta).

## Estructura

```
site/                 lo que se publica (HTML, JS, CSS, data.json, service worker, manifest)
scripts/build_data.py genera site/data.json desde fuentes/
scripts/lib/          lectura de KML y de la guía, reglas de privacidad, clasificación
schema/               JSON Schema de data.json
tests/                datos (schema, 77 lugares, paradas, coordenadas, links) y privacidad
scripts/e2e.py        capturas a 390 y 360 px y prueba offline con Playwright (local)
AUDITORIA.md          cruce de fuentes: qué se encontró, qué se corrigió y qué quedó abierto
```

## Modelo de datos

`data.json` tiene `rutas`, `paradas`, `lugares`, `experiencias`, `discrepancias` y `no_verificado`.

- **rutas**: id, nombre, tipo (`caminata`, `running`, `bici`, `alternativa`), prioridad (`estilo_de_vida`, `transporte`, `turistico`, `deporte`), km, sale, termina, cómo llegar, descripción del barrio y trazas.
- **paradas**: n° de parada (único y ordenado por recorrido), coordenadas, `es_comida`, `estrella`. Los inicios, finales y opcionales van con un `rol` aparte y no cuentan en la numeración.
- **lugares**: id, nombre, tipo, dirección, barrio, coordenadas, `origen` (`lista-mia`, `mapa-oficial`, `busqueda-propia`), por qué está en mi lista, dato curioso con fuentes, horarios con estado de verificación, rating con fuente.
- **relaciones lugar-ruta**: dentro de cada lugar (`relaciones`): parada n°, cerca de la ruta a ~N m, opcional o inicio/final.

Cada dato lleva su fuente o el estado "sin verificar". Los horarios figuran como "sin verificar" mientras no haya una fuente primaria, y el filtro "Abierto ahora" solo usa horarios verificados.

## Privacidad

El repositorio es público (GitHub Pages gratis lo exige). El punto de partida figura siempre como "Punto de partida (Belgrano)", sin la esquina ni coordenadas. Las trazas que arrancan o terminan ahí se recortan en la primera parada pública. La columna de distancias en auto desde ese punto no se publica.

Los tests de privacidad (`tests/test_privacy.py`) leen una lista privada y fallan si algo del repo o del sitio la contiene, o si alguna coordenada pública queda a menos de 400 m del punto de partida. En CI se omiten porque la lista no está en el repo: se corren a mano antes de cada push.

## Fuentes de los datos

La guía v6, los KML, la planilla de la lista y búsquedas en la web (Turismo CABA, buenosaires.gob.ar y prensa). Los ratings de Google son del momento en que se armó la lista (fecha exacta: N/A). Mapa de fondo: © OpenStreetMap contributors.
