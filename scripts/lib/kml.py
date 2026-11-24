"""Lectura de los KML (fuente de verdad de coordenadas y numeracion)."""
from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"k": "http://www.opengis.net/kml/2.2"}
NUM_RE = re.compile(r"^(★\s*)?(\d+)\.\s+(.*)$")


def route_id(folder_name: str) -> str:
    return folder_name.split()[0]


def _point(pm: ET.Element) -> dict:
    coords = pm.find(".//k:coordinates", NS).text.strip()
    lon, lat = map(float, coords.split(",")[:2])
    name = (pm.findtext("k:name", namespaces=NS) or "").strip()
    desc = (pm.findtext("k:description", namespaces=NS) or "").strip()
    style = (pm.findtext("k:styleUrl", namespaces=NS) or "").lstrip("#")
    m = NUM_RE.match(name)
    point = {"name": name, "desc": desc, "style": style, "lat": lat, "lon": lon,
             "n": None, "star": False, "rol": "punto", "label": name}
    if m:
        point.update(n=int(m.group(2)), star=bool(m.group(1)), rol="parada", label=m.group(3).strip())
    elif name.startswith("(opcional)"):
        point.update(rol="opcional", label=name[len("(opcional)"):].strip())
    elif re.match(r"^Inicio:\s", name):
        point.update(rol="inicio", label=name.split(":", 1)[1].strip())
    elif re.match(r"^Fin:\s", name):
        point.update(rol="fin", label=name.split(":", 1)[1].strip())
    elif re.match(r"^(Salida|Llegada)\b", name):
        point.update(rol="salida", label=name.split(":", 1)[-1].strip())
    return point


def load(path: Path) -> dict[str, dict]:
    """{route_id: {name, points[], lines[{name, pts}]}}; carpetas contenedoras sin puntos se omiten."""
    root = ET.fromstring(path.read_bytes())
    out: dict[str, dict] = {}

    def walk(el: ET.Element) -> None:
        for folder in el.findall("k:Folder", NS):
            fname = (folder.findtext("k:name", namespaces=NS) or "").strip()
            points, lines = [], []
            for pm in folder.findall("k:Placemark", NS):
                if pm.find("k:LineString", NS) is not None:
                    raw = pm.find(".//k:coordinates", NS).text.split()
                    pts = [(float(c.split(",")[1]), float(c.split(",")[0])) for c in raw]
                    lines.append({"name": (pm.findtext("k:name", namespaces=NS) or "").strip(),
                                  "id": (pm.findtext("k:styleUrl", namespaces=NS) or "").lstrip("#"),
                                  "pts": pts})
                else:
                    points.append(_point(pm))
            if points or lines:
                out[route_id(fname)] = {"name": fname, "points": points, "lines": lines}
            walk(folder)

    walk(root.find("k:Document", NS))
    return out
