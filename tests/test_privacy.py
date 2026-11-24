"""Privacidad. Las reglas sensibles viven en fuentes/privacy_denylist.txt (ignorado por git).
En CI ese archivo no existe y estos tests se omiten; se ejecutan localmente antes de cada push."""
import json

import pytest

from lib.privacy import haversine_m, load_denylist

SKIP_DIRS = {".git", "fuentes", "capturas", "node_modules", "__pycache__", ".pytest_cache", "_lh"}
TEXT_EXT = {".md", ".json", ".html", ".js", ".css", ".py", ".yml", ".yaml", ".txt", ".webmanifest", ".svg", ".toml"}
MIN_DIST_M = 400


@pytest.fixture(scope="module")
def deny():
    d = load_denylist()
    if d is None:
        pytest.skip("sin lista privada (CI)")
    return d


def _files(root):
    for f in root.rglob("*"):
        if f.is_file() and not (set(f.relative_to(root).parts) & SKIP_DIRS) and f.suffix in TEXT_EXT:
            yield f


def test_ningun_archivo_del_repo_nombra_la_casa(deny, root):
    malos = {}
    for f in _files(root):
        hits = deny.hits(f.read_text(encoding="utf-8", errors="ignore"))
        if hits:
            malos[str(f.relative_to(root))] = hits
    assert not malos, malos


def test_ninguna_coordenada_publica_cerca_del_punto_de_partida(deny, data):
    assert deny.home
    puntos = [(haversine_m(deny.home, (l["lat"], l["lon"])), "lugar " + l["id"]) for l in data["lugares"]]
    puntos += [(haversine_m(deny.home, (p["lat"], p["lon"])), "parada " + p["id"]) for p in data["paradas"]]
    for r in data["rutas"]:
        for t in r["trazas"]:
            puntos += [(haversine_m(deny.home, (a, b)), f"traza {r['id']}/{t['id']}") for a, b in t["puntos"]]
    d, que = min(puntos)
    assert d >= MIN_DIST_M, f"{que} esta a {d:.0f} m"


def test_data_json_no_expone_distancias_al_punto_de_partida(data):
    blob = json.dumps(data, ensure_ascii=False)
    assert "Auto desde" not in blob and "auto_km" not in blob
