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
