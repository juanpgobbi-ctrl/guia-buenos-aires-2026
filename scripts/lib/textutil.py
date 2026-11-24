from __future__ import annotations

import re
import unicodedata


def unescape_md(s: str) -> str:
    s = re.sub(r"\\+([^\w\s])", r"\1", s)
    return s.replace("\u00a0", " ")


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def norm(s: str) -> str:
    return slug(s).replace("-", " ")


def num_es(s: str) -> float | None:
    m = re.search(r"\d+(?:[.,]\d+)?", s or "")
    return float(m.group(0).replace(",", ".")) if m else None


def split_top(s: str, sep: str = ",") -> list[str]:
    """Separa por sep ignorando lo que esta entre parentesis."""
    out, depth, cur = [], 0, ""
    for ch in s:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == sep and depth == 0:
            out.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


DOMAIN_RE = re.compile(r"\b([a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,})\b", re.I)


def parse_fuentes(s: str) -> list[dict]:
    """'canal26.com, es.scribd.com (carta Pippo, 21/04/2026)' -> [{dominio, nota}]"""
    out = []
    for item in split_top(s):
        m = DOMAIN_RE.search(item)
        if not m:
            continue
        note = re.search(r"\((.*)\)", item)
        out.append({"dominio": m.group(1).lower(), "nota": note.group(1) if note else None})
    return out
