"""Clasificacion de lugares y extraccion de direcciones y horarios (solo reglas, sin inventar)."""
from __future__ import annotations

import re

from .textutil import norm

CATEGORIAS = [
    ("parrilla", "Parrilla"),
    ("bodegon", "Bodegón"),
    ("cafe", "Café"),
    ("panaderia", "Panadería y dulces"),
    ("helado", "Helado"),
    ("bar", "Bar y vermut"),
    ("pizza", "Pizza y empanadas"),
    ("otro", "Otros"),
]

RULES = [
    ("helado", r"helader|gelato"),
    ("parrilla", r"parrill|asado|lechon|lechonera"),
    ("bodegon", r"bodegon"),
    ("panaderia", r"panader|pasteler|patisser|chocolater|churro|bakery|mousse|confiter|alfajor"),
    ("cafe", r"\bcafe|cafeter|merienda|casa de te|\btea\b"),
    ("pizza", r"pizz|empanada|pizzeria"),
    ("bar", r"\bbar\b|cervecer|vermut|vermu|coctel|wine|vinoteca|pulperia|birreria|bar notable"),
]
FOOD_KEYWORDS = re.compile(
    r"\bcafe\b|cafeter|\bbar\b|pizza|vermut|wine|bakery|cerve|beer|parrilla|comedor|\btea\b|restaur|empanada|deli|rotiser|vineria|panader",
    re.I)


def categoria(*texts: str | None) -> str:
    hay = norm(" ".join(t for t in texts if t))
    for cat, pat in RULES:
        if re.search(pat, hay):
            return cat
    return "otro"


def is_food_text(*texts: str | None) -> bool:
    hay = norm(" ".join(t for t in texts if t))
    return bool(FOOD_KEYWORDS.search(hay))


ADDR_RE = re.compile(
    r"^((?:Av\. |Pje\. |Gral\. |Dr\. |Cnel\. |Ing\. )?[A-ZÁÉÍÓÚÑ0-9][^.;:()]{2,50}?\s\d{1,5})(?=[.,;]|\s*$)")


def direccion(*texts: str | None) -> str | None:
    for t in texts:
        if not t:
            continue
        t = t.strip()
        m = ADDR_RE.match(t)
        if m and not re.search(r"\b(piso|terraza|desde|hasta)\b", m.group(1), re.I):
            return m.group(1).strip()
    return None


HOURS_RE = re.compile(
    r"cerrad|\babre\b|abierto|abierta|horario|desde las? \d|\b(lun|mar|mi[eé]|jue|vie|s[aá]b|dom)\b[a-zé]*[-–\s]|"
    r"\d{1,2}\s?[-–]\s?\d{1,2}\s?h|\d{1,2}:\d{2}|reserv|\b24 h\b", re.I)


def horarios(*texts: str | None) -> str | None:
    out = []
    for t in texts:
        if not t:
            continue
        for s in re.split(r"(?<=[a-záéíóúñ0-9)])\.\s+(?=[A-ZÁÉÍÓÚ0-9])", t):
            s = s.strip().rstrip(".")
            if s and HOURS_RE.search(s) and not re.search(r'sin verificar', s, re.I) and s not in out and len(s) < 220:
                out.append(s)
    return ". ".join(out) if out else None
