"""Genera site/data.json desde fuentes/ (guia v6, KML, planilla).

Uso: python -I -X utf8 scripts/build_data.py
Requiere fuentes/ completo (ignorado por git) y las reglas de privacidad privadas.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from lib import categorize, docparse, kml as kmllib  # noqa: E402
from lib.experiencias import CATEGORIAS as EXP_CATS, EXPERIENCIAS  # noqa: E402
from lib.privacy import haversine_m, load_denylist, scrub  # noqa: E402
from lib.textutil import norm, num_es, slug  # noqa: E402

F = ROOT / "fuentes"
OUT = ROOT / "site" / "data.json"
SCHEMA = ROOT / "schema" / "data.schema.json"

ROUTES = [  # id, clave en KML, titulo en el doc, tipo, prioridad, acceso
    ("a", "A", "A", "caminata", "estilo_de_vida", "a_pie"),
    ("b", "B", "B", "caminata", "estilo_de_vida", "a_pie"),
    ("c", "C+", "C+", "caminata", "transporte", "transporte"),
    ("d", "D", "D", "caminata", "transporte", "transporte"),
    ("e", "E", "E", "caminata", "transporte", "transporte"),
    ("f", "F", "F", "caminata", "transporte", "transporte"),
    ("g", "G", "G", "caminata", "transporte", "transporte"),
    ("h", "H", "H", "caminata", "transporte", "transporte"),
    ("correr", "RUN", "Correr: Lagos de Palermo y Plaza Francia", "running", "deporte", "transporte"),
    ("bici", "BICI", "Bici: Costanera, Olivos, San Isidro y Tigre", "bici", "deporte", "a_pie"),
    ("m1", "M1", "M1", "alternativa", "turistico", "transporte"),
    ("m2", "M2", "M2", "alternativa", "turistico", "transporte"),
    ("m3", "M3", "M3", "alternativa", "turistico", "transporte"),
]
HOME_ROUTES_CLIP = {"a": "stops", "b": "stops", "bici": "radius"}
CLIP_RADIUS_M = 1500
ETIQUETAS = {"c": "C+", "correr": "Correr", "bici": "Bici"}
SIN_VERIF = "sin_verificar"


def r5(v: float) -> float:
    return round(v, 5)


def guia_fuente(extra: str = "") -> dict:
    return {"etiqueta": "Guía v6" + extra, "url": None, "tipo": "guia"}


def fuentes_dominio(items: list[dict]) -> list[dict]:
    return [{"etiqueta": i["dominio"] + (f" ({i['nota']})" if i.get("nota") else ""),
             "url": "https://" + i["dominio"], "tipo": "dominio_citado"} for i in items]


def dato_obj(info: dict) -> dict | None:
    texto = info.get("dato")
    if not texto:
        return None
    fu = fuentes_dominio(info.get("fuentes", []))
    return {"texto": scrub(texto), "fuentes": fu,
            "estado": "fuente_citada" if fu else SIN_VERIF}


def clip_trace(pts, first, last, after_idx=0):
    def nearest(p, lo=0):
        return min(range(lo, len(pts)), key=lambda i: haversine_m(pts[i], p))
    i0 = nearest(first)
    i1 = nearest(last, i0) if last else len(pts) - 1
    return pts[i0:i1 + 1]


def clip_radius(pts, home, radius, lead=True, trail=True):
    i0, i1 = 0, len(pts) - 1
    while lead and i0 < i1 and haversine_m(pts[i0], home) < radius:
        i0 += 1
    while trail and i1 > i0 and haversine_m(pts[i1], home) < radius:
        i1 -= 1
    return pts[i0:i1 + 1]


def main() -> int:
    deny = load_denylist()
    if deny is None or deny.home is None:
        raise SystemExit("Falta fuentes/privacy_denylist.txt (con home=lat,lon).")
    home = deny.home
    md = (F / "guia_v6.md").read_text(encoding="utf-8")
    kml_walk = kmllib.load(F / "caminatas_v5.kml")
    kml_run = kmllib.load(F / "running_bici_v4.kml")
    kml_all = {**kml_walk, **kml_run}
    doc = docparse.split_routes(md)
    zonas = docparse.lista_zonas(md)
    rows = list(csv.DictReader(open(F / "lista_restaurantes.csv", encoding="utf-8-sig")))

    # ---------- lista: 77 lugares
    lugares: dict[str, dict] = {}
    by_norm: dict[str, str] = {}
    for r in rows:
        nm = r["Nombre"].strip()
        lat = float(r["Latitud"].replace(",", "."))
        lon = float(r["Longitud"].replace(",", "."))
        notas = (r["Notas"] or "").strip()
        reco = (r["Recomendado"] or "").strip().rstrip(".")
        por_que = scrub(reco + (". " + notas if notas else ""))
        lid = slug(nm)
        zona = zonas.get(norm(nm)) or ("caba" if r["Km desde CABA"].startswith("En CABA") else "gba")
        horario = categorize.horarios(por_que)
        txt_coord = (por_que or "")
        lugares[lid] = {
            "id": lid, "nombre": nm, "categoria": categorize.categoria(r["Tipo"], nm),
            "tipo_texto": r["Tipo"].strip(), "direccion": r["Dirección"].strip(), "barrio": r["Barrio / pueblo"].strip(),
            "zona": zona, "lat": r5(lat), "lon": r5(lon),
            "coord_aproximada": bool(re.search(r"coordenadas (aproximadas|del viñedo)", txt_coord, re.I)),
            "origen": "lista-mia", "por_que_en_mi_lista": por_que,
            "dato_curioso": None,
            "horarios": {"estado": SIN_VERIF, "texto": horario,
                         "fuente": "Notas de la lista y reseñas de Google (sin fuente primaria)" if horario else None},
            "rating": {"valor": num_es(r["Google"]), "fuente": "Google Maps",
                       "fecha": "N/A (valor del momento en que se armó la lista)"},
            "mejor_sucursal": (r["Mejor sucursal de la cadena"] or "").strip().startswith("Sí"),
            "sin_confirmar": bool(re.search(r"sin confirmar", por_que or "", re.I)),
            "notas": None,
            "fuentes": [{"etiqueta": "Mi lista guardada (planilla); rating de Google Maps", "url": None, "tipo": "lista"}],
            "relaciones": [],
        }
        by_norm[norm(nm)] = lid
    assert len(lugares) == 77, len(lugares)
    lista_pts = {lid: (l["lat"], l["lon"]) for lid, l in lugares.items()}

    def find_lista(name: str) -> str | None:
        """Busca el lugar de la lista por nombre (exacto o mayor solapamiento de palabras)."""
        n = norm(name)
        if n in by_norm:
            return by_norm[n]
        toks = set(n.split())
        best, score = None, 0.0
        for k, lid in by_norm.items():
            kt = set(k.split())
            j = len(toks & kt) / max(1, len(toks | kt))
            if j > score:
                best, score = lid, j
        return best if score >= 0.5 else None

    rutas, paradas, discrepancias_dist = [], [], []
    no_verif: list[dict] = []

    def add_rel(lid, ruta, tipo, n=None, dist=None, rol=None):
        lugares[lid]["relaciones"].append({"ruta": ruta, "tipo": tipo, "n": n, "dist_m": dist, "rol": rol})

    for rid, key, title_key, tipo, prioridad, acceso in ROUTES:
        sec = doc[title_key if title_key in doc else key]
        title, fi = docparse.ficha(sec)
        subs = docparse.subsections(sec)
        kd = kml_all[key]
        walk = docparse.walk_order(subs["La caminata en orden"]) if "La caminata en orden" in subs else []
        food = docparse.food_tables(subs.get("Para planear la comida antes de salir", "")) if tipo != "running" and "Para planear la comida antes de salir" in subs else {"parada": [], "cerca": [], "otros": [], "horarios": []}
        qv = docparse.info_blocks(subs.get("Qué ver, parada por parada") or subs.get("Qué vas pasando") or "")
        opc = docparse.info_blocks(subs.get("Opcionales", ""))
        info_n = {}
        for b in qv:
            if b["n"] is not None:
                info_n[b["n"]] = b["info"]
        info_name = {norm(b["titulo"]): b["info"] for b in qv + opc}
        parada_rows = {x["n"]: x for x in food["parada"]}
        otros_by_n = {x["n"]: x for x in food["otros"] if x["n"] is not None}
        otros_by_rol = {x["rol"]: x for x in food["otros"] if x["n"] is None}
        walk_food = {(w["rol"], w["n"]): w for w in walk}

        pts = kd["points"]
        route_paradas = []
        order = 0
        for p in pts:
            if p["rol"] == "salida" and haversine_m((p["lat"], p["lon"]), home) < 80:
                continue
            order += 1
            rol, n = p["rol"], p["n"]
            label = scrub(p["label"])
            w = walk_food.get((rol, n))
            es_food = bool(w["comida"]) if w else (categorize.is_food_text(label, p["desc"]) if rol == "opcional" else False)
            if rol == "salida":
                rol = "inicio"
            info = None
            if rol == "parada":
                info = (parada_rows.get(n) or {}).get("info") or (otros_by_n.get(n) or {}).get("info")
                if not info or not (info["dato"] or info["lo_que_se"]):
                    info = info_n.get(n) or info
            elif rol in ("inicio", "fin"):
                info = (otros_by_rol.get(rol) or {}).get("info")
            if not info:
                info = info_name.get(norm(p["label"]))
            info = info or {"dato": None, "lo_que_se": None, "fuentes": [], "practico": None, "sin_dato": False}
            raw_desc = p["desc"]
            if "{D}" in raw_desc:  # marcador sin completar en el KML v5: se toma la distancia de la guia
                dm = re.search(r"~(\d+) m", info.get("lo_que_se") or "")
                if not dm:
                    raise SystemExit(f"Marcador sin completar sin dato en la guia: {p['name']}")
                raw_desc = raw_desc.replace("{D}", dm.group(1) + " m")
            desc = scrub(re.sub(r"^★ LISTA DRIVE \|[^|]*\|?\s*", "", raw_desc)) if p["star"] else scrub(raw_desc)
            dist_traza = None
            m = re.search(r"a ~(\d+) m de la traza", p["desc"])
            if m and rol == "opcional":
                dist_traza = int(m.group(1))
            pid = f"{rid}-{n if n is not None else (rol + str(order))}"
            star_lid = None
            if p["star"]:
                star_lid = min(lista_pts, key=lambda k: haversine_m(lista_pts[k], (p["lat"], p["lon"])))
                if haversine_m(lista_pts[star_lid], (p["lat"], p["lon"])) > 40:
                    raise SystemExit(f"★ sin match en la lista: {p['name']}")
            entry = {
                "id": pid, "ruta": rid, "n": n, "rol": rol, "orden": order, "nombre": label, "lat": r5(p["lat"]),
                "lon": r5(p["lon"]), "es_comida": es_food, "estrella": p["star"], "lugar_id": star_lid,
                "detalle": desc or None,
                "dato_curioso": dato_obj(info), "practico": scrub(info.get("practico")),
                "sin_dato_verificado": bool(info.get("sin_dato")) or not (info.get("dato") or info.get("lo_que_se") or p["desc"]),
                "dist_traza_m": dist_traza,
                "coord_aproximada": bool(re.search(r"aproximada", p["desc"], re.I)),
            }
            lo_que_se = scrub(info.get("lo_que_se"))
            entry["lo_que_se"] = lo_que_se
            route_paradas.append((entry, p, info))

        # lugares nuevos (comida que no es de la lista)
        for entry, p, info in route_paradas:
            if not entry["es_comida"]:
                continue
            if entry["estrella"]:
                lid = entry["lugar_id"]
                add_rel(lid, rid, "parada" if entry["rol"] == "parada" else "inicio_fin", entry["n"], rol=entry["rol"])
                continue
            base = slug(entry["nombre"])
            lid = base if base not in lugares else f"{base}-{rid}"
            m_oficial = re.search(r"Mapa oficial Turismo en Barrios ([A-Za-zÁÉÍÓÚáéíóúñ ]+?)(?:\s\d)?(?=[.\[]|$)", p["desc"])
            origen = "mapa-oficial" if m_oficial or "mapa oficial" in p["desc"].lower() else "busqueda-propia"
            barrio = m_oficial.group(1).strip() if m_oficial else None
            lo = entry["lo_que_se"]
            addr = categorize.direccion(lo, entry["practico"], scrub(re.sub(r"Mapa oficial.*", "", p["desc"])))
            nm_tipo = re.search(r"\((.*?)\)", entry["nombre"])
            horario = categorize.horarios(lo, entry["practico"], entry["detalle"])
            lugares[lid] = {
                "id": lid, "nombre": entry["nombre"], "categoria": categorize.categoria(entry["nombre"], lo, p["desc"]),
                "tipo_texto": nm_tipo.group(1) if nm_tipo else None, "direccion": addr, "barrio": barrio, "zona": "caba",
                "lat": entry["lat"], "lon": entry["lon"], "coord_aproximada": entry["coord_aproximada"], "origen": origen,
                "por_que_en_mi_lista": None, "dato_curioso": entry["dato_curioso"],
                "horarios": {"estado": SIN_VERIF, "texto": horario, "fuente": "Guía v6 (sin fuente primaria)" if horario else None},
                "rating": None, "mejor_sucursal": False, "sin_confirmar": False, "notas": lo or entry["detalle"],
                "fuentes": ([{"etiqueta": "Mapa oficial de Turismo en Barrios (Gobierno de la Ciudad)", "url": "https://turismo.buenosaires.gob.ar", "tipo": "oficial"}]
                            if origen == "mapa-oficial" else
                            [{"etiqueta": "Búsqueda propia (Google, prensa), según la guía v6", "url": None, "tipo": "guia"}]),
                "relaciones": [],
            }
            entry["lugar_id"] = lid
            add_rel(lid, rid, "opcional" if entry["rol"] == "opcional" else ("parada" if entry["rol"] == "parada" else "inicio_fin"),
                    entry["n"], entry["dist_traza_m"], entry["rol"])

        # ★ cerca de la ruta
        for c in food["cerca"]:
            lid = find_lista(c["nombre"])
            if not lid:
                raise SystemExit(f"Cerca sin lugar: {c['nombre']}")
            add_rel(lid, rid, "cerca", dist=c["dist_m"])

        # info de lista (dato curioso, por que)
        for x in food["parada"] + food["cerca"]:
            lid = find_lista(x["nombre"])
            if lid:
                lugares[lid]["dato_curioso"] = lugares[lid]["dato_curioso"] or dato_obj(x["info"])
        for entry, p, info in route_paradas:
            if entry["estrella"] and entry["lugar_id"]:
                l = lugares[entry["lugar_id"]]
                l["dato_curioso"] = l["dato_curioso"] or dato_obj(info) or entry["dato_curioso"]
            paradas.append(entry)

        # trazas
        trazas = []
        stops_pub = [e for e, _, _ in route_paradas if e["rol"] == "parada"]
        for ln in kd["lines"]:
            pts_l = ln["pts"]
            if rid in ("a", "b") and ln["id"].startswith("l"):
                first = (stops_pub[0]["lat"], stops_pub[0]["lon"])
                last = (stops_pub[-1]["lat"], stops_pub[-1]["lon"]) if rid == "b" else None
                pts_l = clip_trace(pts_l, first, last)
            elif rid == "bici":
                pts_l = clip_radius(pts_l, home, CLIP_RADIUS_M, lead=ln["id"] == "lBIKE", trail=ln["id"] == "lBIKE2")
            trazas.append({"id": ln["id"], "nombre": scrub(ln["name"]), "puntos": [[r5(a), r5(b)] for a, b in pts_l]})

        km_txt = fi.get("Distancia") or fi.get("Versión corta") or ""
        n_par = len(stops_pub)
        n_comida = sum(1 for e, _, _ in route_paradas if e["es_comida"] and e["rol"] == "parada")
        sale = fi.get("Sale de") or fi.get("Salida y llegada") or fi.get("Salida")
        termina = fi.get("Termina en") or fi.get("Salida y llegada") or (sale if rid == "bici" else None)
        km_nums = [float(x.replace(",", ".")) for x in re.findall(r"\d+(?:,\d+)?(?=\s*km)", fi.get("Distancia", "") or km_txt)]
        if rid == "bici":
            km_nums = [26.0, 42.0]
        descripcion = (subs.get("El recorrido y el barrio") or subs.get("La ruta") or "").split("\n\n")[0]
        rutas.append({
            "id": rid, "etiqueta": ETIQUETAS.get(rid, key), "nombre": scrub(re.sub(r"^[A-Z]\+? · ", "", title)),
            "tipo": tipo, "prioridad": prioridad, "acceso": acceso, "orden": len(rutas) + 1,
            "km": km_nums[0] if km_nums else None, "km_max": km_nums[-1] if len(km_nums) > 1 else None,
            "km_texto": scrub(re.sub(r"\s+", " ", km_txt)) or None,
            "sale": scrub(sale), "termina": scrub(termina),
            "como_llegar": scrub(fi.get("Cómo llegar / volver")),
            "descripcion": scrub(docparse.unescape_md(descripcion)),
            "ficha": [{"clave": k, "valor": scrub(v)} for k, v in fi.items()],
            "n_paradas": n_par, "n_comida": n_comida,
            "horarios_notas": [scrub(h) for h in food["horarios"]],
            "trazas": trazas,
            "fuentes": [guia_fuente(), {"etiqueta": "Coordenadas y orden: KML", "url": None, "tipo": "kml"}],
        })

    # ---------- correcciones con fuente (AUDITORIA.md)
    patios_src = [{"etiqueta": "buenosaires.gob.ar, ficha del hotel Patios de San Telmo",
                   "url": "https://buenosaires.gob.ar/gcaba_historico/hotel-patios-de-san-telmo", "tipo": "oficial"}]
    for e in paradas:
        if e["ruta"] == "d" and e["n"] == 16:
            e["dato_curioso"] = {"texto": "Antiguo conventillo de tres patios, reformado en 2012 y hoy hotel, según la ficha del "
                                 "Gobierno de la Ciudad. El mapa oficial de Turismo lo anota como ex convento jesuita del siglo XVIII; "
                                 "no encontré una fuente que lo respalde.", "fuentes": patios_src, "estado": "fuente_oficial"}
            e["detalle"] = "Pasaje San Lorenzo 319 (dirección sin confirmar). Antiguo conventillo reformado en 2012."
            e["practico"] = None

    discrepancias = [
        {"id": "patios", "tema": "Los Patios de San Telmo: qué fue el edificio",
         "en_la_guia": "El mapa oficial de Turismo lo anota como ex convento jesuita del siglo XVIII; la ficha del Gobierno de la Ciudad dice antiguo conventillo reformado en 2012.",
         "hallazgo": "No encontré fuente que hable de convento. La dirección Pasaje San Lorenzo 319 no está confirmada.",
         "decision": "Se muestra como antiguo conventillo reformado en 2012. Dirección: sin verificar.",
         "estado": "resuelto_con_fuente", "fuentes": patios_src},
        {"id": "pippo", "tema": "Pippo: año de fundación (1936 o 1937)",
         "en_la_guia": "1936 según la carta del local y Canal 26; otras notas dicen 1937. Paraná 356 desde 1967 coincide en todas.",
         "hallazgo": "La mayoría de las fuentes dice 1936; solo una nota (C5N) da 1937.",
         "decision": "Se muestra 1936 y se aclara que una fuente da 1937.", "estado": "resuelto_con_fuente",
         "fuentes": [{"etiqueta": "canal26.com", "url": "https://www.canal26.com/turismo/2026/06/13/pastas-caseras-parrilla-y-postres-abundantes-el-bodegon-de-buenos-aires-que-hace-historia-desde-hace-casi-90-anos/", "tipo": "prensa"}]},
        {"id": "cadore", "tema": "Cadore: Olivotti u Olivetti",
         "en_la_guia": "El fundador figura con las dos grafías según la fuente.",
         "hallazgo": "Las fuentes consultadas dicen Olivotti (nombre de pila Silvestre o Silvio según la nota). No apareció Olivetti.",
         "decision": "Se usa Olivotti. Nombre de pila: sin verificar.", "estado": "resuelto_con_fuente",
         "fuentes": [{"etiqueta": "lanacion.com.ar", "url": "https://www.lanacion.com.ar/sociedad/5-heladerias-iconicas-de-5-barrios-portenos-nid2076150/", "tipo": "prensa"},
                     {"etiqueta": "buenosaires.gob.ar", "url": "https://www.buenosaires.gob.ar/sites/default/files/media/document/2014/07/09/ceb49e074dc4e269d897819f60f95677d3b6c302.pdf", "tipo": "oficial"}]},
        {"id": "pinpun", "tema": "Pin Pun: 1927 o 1932",
         "en_la_guia": "La Asociación de Pizzerías lo da como el más antiguo de la Ciudad desde 1927; la guía menciona una nota que dice \"desde 1932\".",
         "hallazgo": "Las fuentes consultadas dan 1927. No encontré el 1932 atribuido a Pin Pun.",
         "decision": "Se muestra 1927 según la Asociación de Pizzerías y Empanadas. 1932: sin verificar.", "estado": "parcial",
         "fuentes": [{"etiqueta": "turismo.buenosaires.gob.ar, Pin Pun", "url": "https://turismo.buenosaires.gob.ar/es/gastronomico/pin-pun", "tipo": "oficial"}]},
        {"id": "atelier", "tema": "Atelier Fuerza aparece en Belgrano (B·1) y en Villa Devoto (C+·5)",
         "en_la_guia": "Mismo nombre, coordenadas distintas.", "hallazgo": "Puede ser una cadena con dos locales. No lo verifiqué.",
         "decision": "Se muestran como dos lugares.", "estado": "abierto", "fuentes": []},
        {"id": "inmortales", "tema": "Los Inmortales (H·10) está a unos 300 m de la traza de H",
         "en_la_guia": "Figura como parada numerada.", "hallazgo": "Distancia calculada sobre la traza del KML: 303 m.",
         "decision": "Se conserva como parada con el aviso de distancia.", "estado": "abierto", "fuentes": []},
        {"id": "sanguchería", "tema": "La Sanguchería 10-25: distancia a la traza",
         "en_la_guia": "El KML v5 tenía un marcador sin completar en lugar de la distancia.", "hallazgo": "Distancia calculada sobre la traza: 63 m (la guía dice ~60 m).",
         "decision": "Se usa ~60 m.", "estado": "resuelto_con_fuente", "fuentes": []},
    ]
    for e in paradas:
        if e["ruta"] == "h" and e["n"] == 10:
            e["dist_traza_m"] = 303

    # ---------- experiencias
    experiencias = []
    campo = sorted(l["id"] for l in lugares.values() if l["zona"] == "campo")
    for ex in EXPERIENCIAS:
        ex = dict(ex)
        if ex["lugares"] == "__zona:campo__":
            ex["lugares"] = campo
        experiencias.append(ex)

    # ---------- no verificado (generado)
    bullets = docparse.no_verificado_bullets(md)
    for grupo, items in bullets.items():
        if grupo.startswith("Datos en discrepancia") or grupo.startswith("De dónde"):
            continue
        for it in items:
            no_verif.append({"tipo": "horario_o_acceso" if grupo.startswith("Horarios") else "sin_dato_curioso",
                             "titulo": scrub(it), "ref": None, "fuente": "Guía v6, sección 'Qué no pude verificar'"})
    for l in lugares.values():
        if l["sin_confirmar"]:
            no_verif.append({"tipo": "sucursal_sin_confirmar", "titulo": f"{l['nombre']}: sucursal o coincidencia sin confirmar",
                             "ref": l["id"], "fuente": "Mi lista (planilla)"})
        if l["coord_aproximada"]:
            no_verif.append({"tipo": "coordenada_aproximada", "titulo": f"{l['nombre']}: coordenada aproximada",
                             "ref": l["id"], "fuente": "Guía v6"})

    data = {
        "meta": {"titulo": "Buenos Aires 2026", "version": "1", "generado_desde": ["guía v6", "KML caminatas v5", "KML running/bici v4", "planilla de 77 lugares"],
                 "nota_ratings": "Los ratings de Google son del momento en que se armó la lista. Fecha exacta: N/A.",
                 "mymaps_url_pendiente": True},
        "rutas": rutas, "paradas": paradas, "lugares": sorted(lugares.values(), key=lambda l: l["id"]),
        "experiencias": experiencias, "experiencias_categorias": EXP_CATS,
        "categorias": [{"id": i, "titulo": t} for i, t in categorize.CATEGORIAS],
        "discrepancias": discrepancias, "no_verificado": no_verif,
    }
    out = json.dumps(data, ensure_ascii=False, indent=1)
    if deny:
        hits = deny.hits(out)
        if hits:
            raise SystemExit(f"Privacidad: quedaron coincidencias en data.json: {hits}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(out + "\n", encoding="utf-8")

    try:
        import jsonschema
        schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        jsonschema.Draft202012Validator(schema).validate(json.loads(out))
        print("schema OK")
    except FileNotFoundError:
        print("AVISO: falta schema/data.schema.json")
    print(f"rutas={len(rutas)} paradas={len(paradas)} lugares={len(lugares)} experiencias={len(experiencias)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
