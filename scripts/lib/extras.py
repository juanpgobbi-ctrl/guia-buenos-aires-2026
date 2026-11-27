"""Lugares agregados a mano, con fuente (no vienen de la lista ni de los mapas oficiales).
Cada dato indica de dónde sale; lo que no se pudo confirmar queda como sin verificar."""
from __future__ import annotations

TIMEOUT_HELADERIAS = "https://www.timeout.com/es/buenos-aires/comer-y-beber/mejores-heladerias"


def _f(etiqueta: str, url: str, tipo: str = "prensa") -> dict:
    return {"etiqueta": etiqueta, "url": url, "tipo": tipo}


HELADERIAS = [
    {
        "id": "gruta",
        "nombre": "Gruta (heladería artesanal)",
        "direccion": "Sucre 2356",
        "barrio": "Belgrano",
        "lat": -34.5636943,
        "lon": -58.4545148,
        "coord_fuente": "OpenStreetMap (nodo Helados Gruta)",
        "dato": {
            "texto": "Heladería familiar de Belgrano con unos 50 gustos. El sambayón es lo más celebrado y preparan almendras "
                     "caramelizadas todos los días. El año de inicio cambia según la fuente: 1977 (Time Out) o 1976 (El Cronista).",
            "fuentes": [
                _f("Time Out Buenos Aires, mejores heladerías", TIMEOUT_HELADERIAS),
                _f("El Cronista, sambayón de CABA", "https://www.cronista.com/clase/gourmet/la-historica-heladeria-portena-que-tiene-el-mejor-sambayon-de-caba-y-le-compite-a-las-grandes-cadenas/"),
                _f("Ámbito, las tres heladerías más recomendadas", "https://www.ambito.com/las-tres-heladerias-mas-recomendadas-la-ciudad-buenos-aires-n5668855"),
            ],
        },
        "rating": {"valor": 4.7, "fuente": "Resumen de un agregador (tabiji) sobre Google Maps, sin verificar", "fecha": "N/A"},
        "por_que_probar": "Aparece en Time Out y en notas de El Cronista y Ámbito, y el sambayón es su sabor de culto.",
    },
    {
        "id": "scannapieco",
        "nombre": "Scannapieco (heladería)",
        "direccion": "Av. Álvarez Thomas 10",
        "barrio": "Chacarita",
        "lat": -34.583219,
        "lon": -58.444726,
        "coord_fuente": "Mapbox (dirección con precisión de azotea)",
        "dato": {
            "texto": "Heladería de una familia de la Costa Amalfitana. Recomiendan el chocolate de la casa con dulce de leche casero, "
                     "las castañas, los merengues y el cucurucho bañado. Los años de fundación cambian según la fuente "
                     "(1915 o 1938): sin verificar. Hay otro local en Paseo La Plaza.",
            "fuentes": [
                _f("Time Out Buenos Aires, mejores heladerías", TIMEOUT_HELADERIAS),
                _f("El Cronista, heladería con más de 85 años", "https://www.cronista.com/clase/gourmet/la-legendaria-heladeria-portena-que-abrio-hace-mas-de-85-anos-y-es-de-las-mejores-de-caba"),
            ],
        },
        "rating": {"valor": 4.6, "fuente": "Resumen de un agregador (tabiji) sobre Google Maps, sin verificar", "fecha": "N/A"},
        "por_que_probar": "Una de las heladerías tradicionales más nombradas de la ciudad; queda sobre Álvarez Thomas, cerca de Chacarita.",
    },
    {
        "id": "finde",
        "nombre": "Finde (heladería artesanal)",
        "direccion": "Dr. Emilio Ravignani 1949",
        "barrio": "Palermo",
        "lat": -34.5799105,
        "lon": -58.4371708,
        "coord_fuente": "OpenStreetMap (nodo Finde)",
        "dato": {
            "texto": "Heladería artesanal que nació durante la pandemia, en una casona de Palermo. Time Out recomienda el gusto Flat White, "
                     "con el espíritu de un affogato pero en textura de helado. Hay otro local en Colegiales (Cap. Gral. Ramón Freire 1424).",
            "fuentes": [_f("Time Out Buenos Aires, mejores heladerías", TIMEOUT_HELADERIAS)],
        },
        "rating": None,
        "por_que_probar": "Es la propuesta nueva de la lista de Time Out. No encontré un puntaje de reseñas para citar.",
    },
]


# ---------------------------------------------------------------------------
# Recomendaciones nuevas (nov 2026). Entran a "Mi lista" (origen lista-mia) con la misma forma
# que el resto de la lista. La planilla es la fuente de nombre/dirección/coordenadas; acá van los
# datos con fuente. Lo que no se pudo confirmar queda marcado como sin verificar.
# ---------------------------------------------------------------------------
_MICHELIN_MN = "https://guide.michelin.com/en/ciudad-autonoma-de-buenos-aires/buenos-aires_777009/restaurant/mn-santa-ines"

RECOMENDADOS = [
    {
        "nombre": "Frank's", "categoria": "bar", "tipo": "Bar speakeasy, cócteles",
        "direccion": "Arévalo 1445, CABA", "barrio": "Palermo Hollywood", "lat": -34.58322, "lon": -58.44304,
        "coord_aproximada": True,
        "por_que": "Recomendación que me pasaron (nov 2026). Dirección: Arévalo 1445 según la mayoría de las fuentes; un listado dice 1443.",
        "dato": {"texto": "Uno de los primeros speakeasy porteños: según Turismo de la Ciudad, se entra con una clave que cambia cada semana "
                          "y se da como pista en redes. Una reseña lo ubica en el puesto 36 de The World's 50 Best Bars de 2012 (sin verificar).",
                 "fuentes": [_f("Turismo Ciudad de Buenos Aires, Frank's", "https://turismo.buenosaires.gob.ar/es/otros-establecimientos/frank%C2%B4s", "oficial")]},
        "horarios": "Desde las 20 h según una guía japonesa (shift.jp.org); sin fuente primaria",
    },
    {
        "nombre": "Burdo", "categoria": "otro", "tipo": "Restaurante en casa histórica",
        "direccion": "Delgado 1199, CABA", "barrio": "Colegiales", "lat": -34.57698, "lon": -58.45850,
        "coord_aproximada": False,
        "por_que": "Recomendación que me pasaron (nov 2026).",
        "dato": {"texto": "Restaurante en una casa histórica de Colegiales. Infogastronómica destaca el ojo de bife, los buñuelos y un pan relleno "
                          "de queso fundido; Bloomberg Línea coincide en la dirección. Instagram: @burdo.resto.",
                 "fuentes": [_f("Infogastronómica, nuevo restaurante en Colegiales", "https://www.infogastronomica.com.ar/en-colegiales-nuevo-restaurante-en-una-casa-historica-desde-ojo-de-bife-y-bunuelos-hasta-un-irresistible-pan-relleno-de-queso-fundido/"),
                             _f("Bloomberg Línea, dónde comer en Buenos Aires", "https://www.bloomberglinea.com/estilo-de-vida/donde-comer-en-buenos-aires-cinco-restaurantes-imprescindibles/")]},
        "horarios": "Mar a sáb desde las 19:30 según Infogastronómica (nota anterior, sin confirmar hoy)",
    },
    {
        "nombre": "Catalino", "categoria": "otro", "tipo": "Restaurante de cocina de autor",
        "direccion": "Maure 3126, CABA", "barrio": "Colegiales", "lat": -34.57814, "lon": -58.44722,
        "coord_aproximada": False, "sin_confirmar": True,
        "por_que": "Recomendación que me pasaron (nov 2026). SIN CONFIRMAR la dirección: Maure 3126 sale de un solo listado (Sluurpy); otras fuentes solo confirman el barrio.",
        "dato": {"texto": "Empezó como puerta cerrada, lo llevan dos hermanas y hoy abre el portón del patio a la calle (Thatch y Perfil). "
                          "No confirmé si sigue abierto ni su horario.",
                 "fuentes": [_f("Thatch, Catalino", "https://thatch.co/places/142964/catalino", "agregador"),
                             _f("Perfil, Catalino", "https://noticias.perfil.com/noticias/restaurante/catalino.phtml"),
                             _f("Sluurpy, Catalino (dirección)", "https://www.sluurpy.fr/buenos-aires/restaurant/2283567/catalino-restaurant", "agregador")]},
        "horarios": None,
    },
    {
        "nombre": "MN Santa Inés", "categoria": "otro", "tipo": "Cocina fusión contemporánea (Bib Gourmand)",
        "direccion": "Ávalos 360, CABA", "barrio": "La Paternal", "lat": -34.59297, "lon": -58.46790,
        "coord_aproximada": False,
        "por_que": "Recomendación que me pasaron (nov 2026). Reservar directamente con el restaurante.",
        "dato": {"texto": "Bib Gourmand de la Guía Michelin (buena relación calidad-precio). Queda en \"la isla\" de La Paternal, rodeada en parte "
                          "por las vías del tren y el cementerio de Chacarita. Atiende solo al mediodía.",
                 "fuentes": [_f("Guía Michelin, MN Santa Inés", _MICHELIN_MN, "oficial"),
                             _f("Ámbito, una joya oculta en La Paternal", "https://www.ambito.com/uruguay/mn-santa-ines-una-joya-oculta-la-paternal-saborear-la-buenos-aires-mas-autentica-n6198332")]},
        "horarios": "Mar a vie 12:30-15:00; sáb y dom hasta 15:30; lunes cerrado (Michelin; confirmar antes de ir)",
    },
    {
        "nombre": "Mutsuhito Omakase", "categoria": "otro", "tipo": "Omakase japonés (speakeasy)",
        "direccion": "Honduras 5908, CABA", "barrio": "Palermo Hollywood", "lat": -34.58168, "lon": -58.43945,
        "coord_aproximada": True,
        "por_que": "Recomendación que me pasaron (nov 2026). Dirección: Honduras 5908 según dos fuentes (Saltshaker y una más); El Cronista lo ubica en el 5902, junto a Emperador Meiji (probablemente el mismo edificio). Confirmar el número al reservar.",
        "dato": {"texto": "Barra de sushi omakase estilo speakeasy, en el piso superior del edificio. Se entra con un código individual que llega al reservar "
                          "(Infogastronómica; Saltshaker da la misma descripción).",
                 "fuentes": [_f("Infogastronómica, restaurante japonés de Palermo con contraseña", "https://www.infogastronomica.com.ar/como-es-el-exclusivo-restaurante-japones-de-palermo-al-que-se-entra-solo-con-contrasena-y-tiene-17-pasos/"),
                             _f("El Cronista, restaurantes omakase", "https://www.cronista.com/clase/gourmet/los-restaurantes-omakase-se-expanden-9-que-se-destacan-en-buenos-aires-y-alrededores/")]},
        "horarios": None,
    },
    {
        "nombre": "Ladobueno (Colegiales)", "categoria": "helado", "tipo": "Heladería y pastelería",
        "direccion": "Av. Jorge Newbery y Ciudad de la Paz, CABA (esquina; número sin verificar)", "barrio": "Colegiales",
        "lat": -34.57420, "lon": -58.44283, "coord_aproximada": True,
        "por_que": "Recomendación que me pasaron (nov 2026). Es una cadena: elegí la sucursal de Colegiales por cercanía al corredor Newbery. Coordenada aproximada (punto sobre la calle, no sobre el local).",
        "dato": {"texto": "Cadena de helados y pastelería porteña (el nombre juega con \"helado bueno\"). Sucursal de Colegiales en la esquina de Jorge Newbery y "
                          "Ciudad de la Paz, con mesas adentro y en la vereda. Otras: Villa del Parque (Navarro 3190), Villa Urquiza (Av. Congreso 5249) y "
                          "Almagro (Muñiz 100). Las reseñas son mixtas: sabores bien valorados, precio y atención criticados.",
                 "fuentes": [_f("Buenos Aires Connect, Ladobueno", "https://buenosairesconnect.com/ladobueno-cafe-villadelparque/"),
                             _f("Tripadvisor, Ladobueno Colegiales", "https://www.tripadvisor.com/Restaurant_Review-g312741-d3194802-Reviews-LadobuenO-Buenos_Aires_Capital_Federal_District.html", "agregador")]},
        "horarios": None,
    },
]


def lugar_recomendado(ex: dict, lid: str) -> dict:
    """Arma el lugar completo (misma forma que los de la lista) a partir de un RECOMENDADO."""
    d = ex["dato"]
    return {
        "id": lid, "nombre": ex["nombre"], "categoria": ex["categoria"], "tipo_texto": ex["tipo"],
        "direccion": ex["direccion"], "barrio": ex["barrio"], "zona": "caba",
        "lat": round(ex["lat"], 5), "lon": round(ex["lon"], 5), "coord_aproximada": bool(ex.get("coord_aproximada")),
        "origen": "lista-mia", "por_que_en_mi_lista": ex["por_que"],
        "dato_curioso": {"texto": d["texto"], "fuentes": d["fuentes"], "estado": "fuente_citada"},
        "horarios": {"estado": "sin_verificar", "texto": ex["horarios"],
                     "fuente": "Fuente citada arriba (sin verificar con el local)" if ex["horarios"] else None},
        "rating": None, "mejor_sucursal": False, "sin_confirmar": bool(ex.get("sin_confirmar")), "notas": None,
        "fuentes": [{"etiqueta": "Mi lista guardada (planilla)", "url": None, "tipo": "lista"}, *d["fuentes"]],
        "relaciones": [],
    }
