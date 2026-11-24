# Auditoría de fuentes (Fase 1)

Fecha: 2026-11-24. Alcance: guía v6 (Google Doc), KML caminatas v5, KML running/bici v4, links_google_maps_v5.txt y la planilla de 77 lugares. No se modificó nada en Drive. Las fuentes originales están en `fuentes/` (ignorada por git).

La planilla de la lista es "Restaurantes Buenos Aires (importar a My Maps)": 77 filas, confirmada. El Doc v6 lista los mismos 77 (48 CABA, 19 GBA, 10 escapadas de campo).

## 1. Qué cruzó bien

| Chequeo | Resultado |
|---|---|
| Orden y n° de parada, doc vs KML (A, B, C+, D, E, F, G, H, M1, M2, M3) | Coinciden en las 11 rutas: mismos números, mismos nombres, sin duplicados, orden creciente |
| "Paradas: N numeradas; M para comer" del encabezado vs KML | Coinciden en las 11 rutas |
| 77 lugares: CSV vs tabla del doc (nombre, dirección, auto km) | 77 de 77 presentes en ambos |
| Coordenadas de los ★ en el KML vs planilla | Difieren 0 a 5 m en los 19 casos |
| "A ~X m de la traza" de los 10 ★ cercanos y de los opcionales, recalculado sobre la traza del KML | Coinciden (±5 m) |
| Los 19 ★ con lugar en el plan (9 son parada, 10 son cercanos) y 58 sin lugar | Doc y KML consistentes. Los 58 se marcarán "no está en el plan" |

## 2. Inconsistencias encontradas

| # | Dónde | Problema | Qué se hace | Fuente |
|---|---|---|---|---|
| 1 | KML v5, A·26 La Sanguchería | Placeholder `{D}` en "A ~{D} de la traza" | Corregido a ~60 m (el doc ya decía ~60 m; recalculado sobre la traza: 63 m) | Cálculo sobre el KML + doc v6 |
| 2 | Planilla vs doc | Ratings "4" (planilla) y "4,0" (doc) en 3 lugares | Normalizar a 4,0. Es formato, no dato | Planilla |
| 3 | KML B·1 y C+·5 | "Atelier Fuerza" aparece en dos barrios (Belgrano y Villa Devoto) con coordenadas distintas | Abierto: puede ser una cadena con dos locales. Se muestra como dos lugares y queda en "Qué no verifiqué" | Sin fuente aún |
| 4 | KML H·10 Los Inmortales | Está a 303 m de la traza de H, pero figura como parada numerada | Se muestra como parada con aviso "a ~300 m de la traza". Lo decide el usuario (ver duda 3) | Cálculo sobre el KML |
| 5 | Otras paradas numeradas a más de 120 m de la traza | A·25 Antro (124 m), A·31 Churros El Topo Malabia (126 m), G·10 León Bakery (130 m), H·7 Buller (139 m), M3·4 Puente Transbordador (197 m) | Se conservan como paradas; se guarda la distancia en el dato | Cálculo sobre el KML |
| 6 | Doc, "Morris Mousse" | Figura como "cerca de H (~269 m)" | Distancia correcta (269 m calculado). Se mantiene como cercano, no parada | Cálculo sobre el KML |
| 7 | Bounding box | 13 lugares de la planilla caen fuera de una caja CABA/GBA estricta | No es error: son Temperley, Alejandro Korn y las 10 escapadas de campo (Luján, Carlos Keen, Uribelarrea, Mercedes, Giles, San Pedro). El test de coordenadas usará una caja por categoría (CABA / GBA / campo) | Planilla |
| 8 | Coordenadas aproximadas declaradas | Entre Vías ("centro de Mercedes"), Zaffratelli ("sin calle"), Bartola Rooftop ("ubicación aproximada") | Se marcan `coord_aproximada: true` y el mapa lo avisa | Doc v6 |
| 9 | Planilla, columna "Km desde CABA" vs "Auto" | Los Abraham: 165 vs 175; otros del campo con la misma brecha | Son magnitudes distintas (km desde el límite de CABA vs auto desde el punto de partida). Se etiquetan las dos | Planilla |
| 10 | Doc, "Qué ver" | Varias paradas con "Lo que sé" de una línea y sin fuente (Plaza Gurruchaga, Plaza Armenia, Central Newbery, etc.) | Se muestran como "sin dato verificado" | Doc v6 |

## 3. Discrepancias entre fuentes: qué dice la web

| Tema | Doc v6 | Lo que encontré | Decisión | Fuente |
|---|---|---|---|---|
| Los Patios de San Telmo | ex convento jesuita (mapa oficial) vs conventillo reformado en 2012 (ficha GCBA) | La ficha del Gobierno de la Ciudad lo describe como antiguo conventillo convertido en hotel, con tres patios y reforma en 2012. No encontré fuente que hable de convento. Una nota de Página/12 habla de casona de tres patios con planta alta hacia 1830, pero la asocia a otra dirección. El número 319 no está confirmado | Se corrige el KML ("ex convento jesuita") a "antiguo conventillo reformado (2012)". Dirección 319: sin verificar | [buenosaires.gob.ar](https://buenosaires.gob.ar/gcaba_historico/hotel-patios-de-san-telmo) |
| Pippo, año de fundación | 1936 vs 1937 | La mayoría de las fuentes dice 1936, incluida la carta del local; solo una nota (C5N) da 1937. Paraná 356 desde 1967 coincide | Se muestra 1936 con nota "una fuente da 1937" | [Canal 26](https://www.canal26.com/turismo/2026/06/13/pastas-caseras-parrilla-y-postres-abundantes-el-bodegon-de-buenos-aires-que-hace-historia-desde-hace-casi-90-anos/) |
| Cadore, fundador | Olivotti vs Olivetti | Las fuentes encontradas dicen Olivotti (nombre de pila Silvestre o Silvio según la nota; Olivetti no apareció). Abrió en 1957 | Se usa "Olivotti". Nombre de pila: sin verificar | [La Nación](https://www.lanacion.com.ar/sociedad/5-heladerias-iconicas-de-5-barrios-portenos-nid2076150/), [buenosaires.gob.ar](https://www.buenosaires.gob.ar/sites/default/files/media/document/2014/07/09/ceb49e074dc4e269d897819f60f95677d3b6c302.pdf) |
| Pin Pun, año | 1927 (Asociación de Pizzerías) vs 1932 (el local) | Las fuentes encontradas dan 1927 como "la más antigua de la Ciudad" según la Asociación de Pizzerías y Empanadas. No encontré el 1932 atribuido a Pin Pun | Se muestra "desde 1927 según la Asociación de Pizzerías"; 1932 queda abierto | [Turismo CABA](https://turismo.buenosaires.gob.ar/es/gastronomico/pin-pun), [El Cronista](https://www.cronista.com/clase/gourmet/la-pizzeria-tradicional-portena-que-es-la-mas-antigua-de-caba-y-gano-el-premio-a-la-mejor-de-la-ciudad-en-varias-oportunidades) |

Nota: estas verificaciones son de búsqueda web de resumen. Antes de publicar, el script guarda la URL de cada fuente y marca como "verificado (secundaria)" o "verificado (oficial)".

## 4. Sin dato curioso verificado (se mantiene así, no se inventa)

Gobs Café, Museo "Che" Guevara, Casa del Bandoneón, Mishiguene, Buller, Bar Sur, El Viejo Almacén, Espacio Moebius y casi todo el Barrio Coreano (G). Aparecerán en "Qué no verifiqué".

## 5. Privacidad: lo que hay que limpiar antes de publicar

| Archivo | Qué contiene |
|---|---|
| KML caminatas v5 | Coordenadas exactas de la casa y la esquina, en 3 placemarks + 3 inicios de traza |
| KML running/bici v4 | Idem, en 2 placemarks |
| links_google_maps_v5.txt | Coordenadas de la casa como origen/destino de A y B |
| Doc v6 | La esquina exacta en 5 lugares y referencias familiares en 4 |
| Planilla | La esquina en el nombre de una columna de distancias y referencias familiares en 2 notas |

Plan: `fuentes/` queda en `.gitignore`. El script reemplaza la esquina por "Punto de partida (Belgrano)", elimina las coordenadas de la casa y recorta las primeras celdas de la traza de A, B y bici dentro de un radio de 150 m, para que no se reconstruya la casa por la traza. Un test falla si aparece la esquina, las coordenadas o referencias familiares en `data.json`, `app/` o `README`.

## 6. Auditoría de lo que sugirió Claude en el doc, y alternativas para turistas

### 6.1 Lo que el doc agregó por su cuenta

| Bloque | Estado | Hallazgo |
|---|---|---|
| "Opcionales" de A, B, C+, D, F, H | Distancias ok (±5 m) | Muchos opcionales son lugares del mapa oficial con "Sin dato adicional verificado". Se muestran como candidatos, no como recomendación |
| H: Bartola Rooftop, Alvear Roof Bar, Tegui | Débil | Bartola con dirección "N/A" y ubicación aproximada; Alvear con horarios de una nota de prensa de julio de 2026 ("verificar"); el doc ya dice "Sigue abierto: N/A" para Buller. Van a "Qué no verifiqué" |
| C+: Palacio Ceci | Pendiente | "Reabrió en 2026 con visitas guiadas" según nota; reserva y fines de semana sin verificar |
| M1, M2, M3 (alternativas turísticas) | Parcial | M1: Teatro Colón y Palacio Barolo con "visita guiada: verificar". M2: Reserva Ecológica "martes a domingo; cerrada lunes y días de lluvia (GCBA)", salida sur sin verificar. M3: el propio doc advierte "entorno poco seguro", pero los ★ de La Boca (Parrilla Romar, El Gran Paraíso) están fuera de todo recorrido |
| Escapadas de campo (10 ★) | Sin ruta | Ninguna está en un plan; todas piden reserva y abren sáb-dom. Son la base natural de una sección de excursiones |
| Falta | Hueco | No hay un solo "plan de experiencia" de turista: show de tango fuera de San Telmo, visita al Colón con horarios, delta de Tigre como excursión (solo está como extensión en bici), estancia, fútbol, comida guiada |

### 6.2 Experiencias recomendadas para turistas (propuesta para sumar)

Criterio: fuente oficial primero; los agregadores (Viator) solo aportan "existe, duración y rango de precio al momento de la búsqueda" y se marcan como "precio sin verificar". Ratings de Viator del 2026-11-24, por lo que no se muestran como dato de la guía sino como "reseñas en Viator".

| Experiencia | Qué es | Duración | Reserva | Encaja con | Fuente |
|---|---|---|---|---|---|
| Show de tango (con o sin cena) | Señor Tango, Tango Porteño, La Ventana, Café de los Angelitos, Rojo Tango. Para una opción de barrio: Bar Sur, El Viejo Almacén y Pista Urbana ya están en la ruta D | 2 a 4 h | Sí | D (San Telmo) o noche libre | [Viator](https://www.viator.com/tours/Buenos-Aires/Senor-Tango-Buenos-Aires/d901-7532P22), guías de turismo |
| Visita guiada al Teatro Colón | Recorrido de 1 hora por el hall, Sala de los Bustos y Salón Dorado. Es arancelada | 1 h | Sí | M1 (ya figura como "verificar") | Turismo CABA (horarios sin confirmar para esa semana) |
| Delta de Tigre | Excursión en lancha con Puerto de Frutos. Hoy solo figura como extensión en bici | 5 a 5,5 h | Opcional | Bici o día libre | [Viator](https://www.viator.com/tours/Buenos-Aires/San-Isidro-and-Tigre-Delta-Small-Group-Tour/d901-11143P2) |
| Día de campo en San Antonio de Areco | Estancia con asado, show y jineteada | 9 h | Sí | Día completo; alternativa cercana a las "escapadas" de la lista | [Viator](https://www.viator.com/tours/Buenos-Aires/Small-Group-Day-at-a-Farm-in-San-Antonio-de-Areco/d901-11143P3) |
| Excursión a pueblos de campo de tu lista | Uribelarrea, Carlos Keen, Mercedes, Giles: ya están en la planilla (10 ★) | Día completo | Sí, solo sáb-dom | Sin ruta propia | Planilla |
| Comida guiada | Recorrido gastronómico por Palermo; cata de vinos y carne | 3 a 3,5 h | Sí | Alternativa a A | [Viator](https://www.viator.com/tours/Buenos-Aires/Palermo-Food-Tour/d901-208148P1) |
| Cementerio de la Recoleta | Está al lado de la ruta H. Turismo CABA lo incluye en sus recorridos guiados gratuitos con inscripción; el paseo gratuito por el barrio que aparece publicado es de martes de julio y agosto, o sea no aplica a diciembre. Horarios de la visita: sin verificar | 1 a 1,5 h | Sin verificar | H | [Turismo CABA](https://turismo.buenosaires.gob.ar/es/article/visitas-guiadas) |
| Partido de fútbol o estadio | La Bombonera (M3) y el Museo River (B·15) ya son paradas; el partido no se puede verificar sin fixture | Variable | Sí | M3, B | Sin verificar |

### 6.3 Cómo presentarlo en la web

Una sección "Experiencias" nueva, ordenada por qué tan fácil es hacerla con lo que ya tenés:

1. Esta noche (tango, milonga, bar con música)
2. Con reserva (Colón, comida guiada)
3. Medio día (Tigre)
4. Día completo (Areco, escapadas de campo)

Cada tarjeta lleva: duración, si necesita reserva, a qué recorrido se acopla y link a la fuente. Tienen filtro por duración y por día de la semana. Los precios no se muestran fijos: "ver en el sitio". Todo lo que no tenga fuente oficial se marca "sin verificar" y entra en "Qué no verifiqué".

## 7. Abierto

- Horarios de casi todos los lugares (el doc los tiene sin fecha ni fuente primaria).
- Tranvía Histórico, ferias, Museo Che, Museo River, reservas de El Viejo Almacén y Mishiguene.
- Si Buller y Bartola siguen abiertos.
- Dirección exacta de Los Patios de San Telmo.
- Atelier Fuerza (¿dos locales?).
- Año de Pin Pun según el local.
- Fixture de fútbol y horarios de visitas guiadas de la semana del viaje.
