import json
import re
from collections import Counter
from urllib.parse import urlparse

import jsonschema

BBOX = {
    "caba": (-34.705, -34.52, -58.54, -58.33),
    "gba": (-35.05, -34.35, -58.80, -58.20),
    "campo": (-35.30, -33.50, -60.00, -58.60),
}


def test_schema(data, root):
    schema = json.loads((root / "schema" / "data.schema.json").read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(schema).validate(data)


def test_77_lugares_de_la_lista(data):
    lista = [l for l in data["lugares"] if l["origen"] == "lista-mia"]
    assert len(lista) == 77
    assert len({l["id"] for l in lista}) == 77
    assert Counter(l["zona"] for l in lista) == {"caba": 48, "gba": 19, "campo": 10}


def test_cada_lugar_de_la_lista_tiene_plan_o_figura_fuera_del_plan(data):
    lista = [l for l in data["lugares"] if l["origen"] == "lista-mia"]
    assert len([l for l in lista if l["relaciones"]]) == 19
    for l in lista:
        for r in l["relaciones"]:
            if r["tipo"] == "parada":
                assert isinstance(r["n"], int)
            if r["tipo"] == "cerca":
                assert r["dist_m"] > 0


def test_paradas_unicas_y_ordenadas_por_recorrido(data):
    por_ruta = {}
    for p in data["paradas"]:
        if p["rol"] == "parada":
            por_ruta.setdefault(p["ruta"], []).append(p["n"])
    assert set(por_ruta) >= {"a", "b", "c", "d", "e", "f", "g", "h", "m1", "m2", "m3"}
    for ruta, ns in por_ruta.items():
        assert ns == sorted(ns), ruta
        assert len(ns) == len(set(ns)), ruta
        assert ns == list(range(1, len(ns) + 1)), f"{ruta}: numeracion con huecos {ns}"
    ids = [p["id"] for p in data["paradas"]]
    assert len(ids) == len(set(ids))


def test_n_paradas_coincide_con_el_encabezado(data):
    for r in data["rutas"]:
        n = sum(1 for p in data["paradas"] if p["ruta"] == r["id"] and p["rol"] == "parada")
        assert n == r["n_paradas"], r["id"]


def test_coordenadas_en_su_zona(data):
    for l in data["lugares"]:
        la0, la1, lo0, lo1 = BBOX[l["zona"]]
        assert la0 <= l["lat"] <= la1 and lo0 <= l["lon"] <= lo1, (l["nombre"], l["lat"], l["lon"])
    for p in data["paradas"]:
        la0, la1, lo0, lo1 = BBOX["gba"]
        assert la0 <= p["lat"] <= la1 and lo0 <= p["lon"] <= lo1, p["id"]


def test_referencias_cruzadas(data):
    ids = {l["id"] for l in data["lugares"]}
    rutas = {r["id"] for r in data["rutas"]}
    for p in data["paradas"]:
        assert p["ruta"] in rutas
        if p["lugar_id"]:
            assert p["lugar_id"] in ids, p["id"]
    for l in data["lugares"]:
        for r in l["relaciones"]:
            assert r["ruta"] in rutas
        assert l["origen"] != "lista-mia" or l["rating"]["valor"] is not None
    for e in data["experiencias"]:
        for lid in e["lugares"]:
            assert lid in ids, (e["id"], lid)


def _urls(obj):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "url" and isinstance(v, str):
                yield v
            else:
                yield from _urls(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from _urls(v)


def test_links_validos(data):
    urls = list(_urls(data))
    assert urls
    for u in urls:
        p = urlparse(u)
        assert p.scheme == "https" and "." in p.netloc, u
        assert not p.query, f"sin parametros de tracking: {u}"
        assert " " not in u


def test_sin_cadenas_prohibidas(data, root):
    blob = json.dumps(data, ensure_ascii=False)
    for bad in [r"\{[A-Za-z_]+\}", r"\bNone\b", r"\bnan\b", r"\bundefined\b", r"\bNaN\b"]:
        assert not re.search(bad, blob), bad
    for f in (root / "site").rglob("*"):
        if f.suffix in {".html", ".css", ".webmanifest"} or (f.suffix == ".js" and "vendor" not in f.parts):
            assert "{D}" not in f.read_text(encoding="utf-8"), f


def test_todo_dato_tiene_fuente_o_esta_sin_verificar(data):
    for l in data["lugares"]:
        d = l["dato_curioso"]
        if d:
            assert d["fuentes"] or d["estado"] == "sin_verificar", l["id"]
        assert l["horarios"]["estado"] == "sin_verificar" or l["horarios"]["fuente"], l["id"]
    for p in data["paradas"]:
        d = p["dato_curioso"]
        if d:
            assert d["fuentes"] or d["estado"] == "sin_verificar", p["id"]


def test_experiencias_estructura(data):
    cats = {c["id"] for c in data["experiencias_categorias"]}
    rutas = {r["id"] for r in data["rutas"]}
    for e in data["experiencias"]:
        assert e["categoria"] in cats
        assert e["fuentes"]
        for ruta in e["se_acopla"]:
            assert ruta.lower() in rutas, (e["id"], ruta)
