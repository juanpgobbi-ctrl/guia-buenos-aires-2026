"""Suma los RECOMENDADOS (scripts/lib/extras.py) a site/data.json sin necesitar fuentes/.

Uso: python -I -X utf8 scripts/agregar_recomendados.py
Es idempotente: reemplaza los lugares con el mismo id. Calcula "cerca de la ruta" (<= 400 m de la
traza) con las trazas ya publicadas en data.json (caminatas y alternativas; no running ni bici).
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from lib.extras import RECOMENDADOS, lugar_recomendado  # noqa: E402
from lib.textutil import slug  # noqa: E402

DATA = ROOT / "site" / "data.json"
R = 6371000.0


def _xy(lat, lon, lat0):
    return (math.radians(lon) * R * math.cos(math.radians(lat0)), math.radians(lat) * R)


def _seg(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = 0 if dx == dy == 0 else max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
    return math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))


def cerca(lat, lon, rutas):
    best = None
    for r in rutas:
        if r["tipo"] not in ("caminata", "alternativa"):
            continue
        for tz in r["trazas"]:
            pr = [_xy(a, b, lat) for a, b in tz["puntos"]]
            me = _xy(lat, lon, lat)
            if len(pr) < 2:
                continue
            dm = min(_seg(me, pr[i], pr[i + 1]) for i in range(len(pr) - 1))
            if best is None or dm < best[1]:
                best = (r["id"], dm)
    return best


def main() -> int:
    d = json.loads(DATA.read_text(encoding="utf-8"))
    ids = {slug(ex["nombre"]) for ex in RECOMENDADOS}
    d["lugares"] = [l for l in d["lugares"] if l["id"] not in ids]
    for ex in RECOMENDADOS:
        lid = slug(ex["nombre"])
        l = lugar_recomendado(ex, lid)
        b = cerca(l["lat"], l["lon"], d["rutas"])
        if b and b[1] <= 400:
            l["relaciones"].append({"ruta": b[0], "tipo": "cerca", "n": None, "dist_m": int(round(b[1] / 10.0) * 10) or 10, "rol": None})
        d["lugares"].append(l)
        print(lid, "->", l["relaciones"] or "sin ruta cercana (<= 400 m)")
    d["lugares"].sort(key=lambda l: l["id"])
    DATA.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
