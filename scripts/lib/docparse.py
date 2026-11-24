"""Lectura de la guia v6 exportada a Markdown."""
from __future__ import annotations

import re

from .textutil import parse_fuentes, unescape_md


def split_routes(md: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for sec in re.split(r"\n(?=# \*\*)", md):
        m = re.match(r"# \*\*(.+?)\*\*", sec)
        if not m:
            continue
        title = m.group(1)
        rid = title.split(" · ")[0] if " · " in title else title
        out[rid] = sec
    return out


def subsections(sec: str, level: str = "## ") -> dict[str, str]:
    parts = re.split(rf"\n(?={re.escape(level)}\*\*)", sec)
    out = {}
    for p in parts[1:]:
        m = re.match(rf"{re.escape(level)}\*\*(.+?)\*\*\n?(.*)", p, re.S)
        if m:
            out[m.group(1).strip()] = m.group(2).strip()
    return out


def table_rows(text: str) -> list[list[str]]:
    rows = []
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = [unescape_md(c.strip()) for c in line.strip().strip("|").split("|")]
        if all(re.fullmatch(r":?-+:?", c) or c == "" for c in cells):
            continue
        rows.append(cells)
    return rows


def ficha(sec: str) -> tuple[str, dict[str, str]]:
    """Titulo y tabla de datos del encabezado (clave -> valor)."""
    title = re.match(r"# \*\*(.+?)\*\*", sec).group(1)
    head = sec.split("\n## ", 1)[0]
    out = {}
    for row in table_rows(head):
        if len(row) == 2:
            out[re.sub(r"\*", "", row[0]).strip()] = row[1].strip()
    return title, out


def parse_info(cell: str) -> dict:
    """Interpreta 'Dato curioso / Lo que sé / Fuente / Práctico'."""
    cell = unescape_md(cell).replace("\n", " ").strip()
    info = {"dato": None, "lo_que_se": None, "fuentes": [], "practico": None, "sin_dato": False}
    m = re.search(r"\*\*Práctico:\*\*\s*(.*)$", cell)
    if m:
        info["practico"] = m.group(1).strip()
        cell = cell[: m.start()]
    m = re.search(r"Fuente:\s*(.*)$", cell)
    if m:
        info["fuentes"] = parse_fuentes(m.group(1))
        cell = cell[: m.start()]
    m = re.search(r"\*\*Dato curioso:\*\*\s*(.*)$", cell)
    if m:
        info["dato"] = m.group(1).strip()
    m = re.search(r"\*\*Lo que sé:\*\*\s*(.*)$", cell)
    if m:
        info["lo_que_se"] = m.group(1).strip()
    if re.search(r"Sin dato (curioso|adicional) verificado", cell):
        info["sin_dato"] = True
    return info


def walk_order(sec_body: str) -> list[dict]:
    """'La caminata en orden' -> [{n, nombre, comida, star, rol}]"""
    line = sec_body.strip().split("\n\n")[0]
    out = []
    for tok in re.split(r" · ", unescape_md(line)):
        tok = tok.strip()
        italic = tok.startswith("*") and not tok.startswith("**") and tok.endswith("*")
        star = tok.startswith("**")
        txt = tok.strip("*").strip()
        txt = re.sub(r"^★\s*", "", txt)
        m = re.match(r"(\d+)\s+(.*)", txt)
        if m:
            out.append({"n": int(m.group(1)), "nombre": m.group(2).strip(), "comida": italic or star,
                        "star": star, "rol": "parada"})
            continue
        m = re.match(r"(Inicio|Fin)\s+(.*)", txt)
        if m:
            out.append({"n": None, "nombre": m.group(2).strip(), "comida": italic or star, "star": star,
                        "rol": m.group(1).lower()})
    return out


HEADER_RE = re.compile(r"^\*\*([^*]+?)\*\*(?: · (.*))?$")


def info_blocks(body: str) -> list[dict]:
    """Bloques 'Qué ver' / 'Opcionales': [{titulo, n, origen, info}]"""
    blocks, cur = [], None
    for para in re.split(r"\n\s*\n", unescape_md(body)):
        para = para.strip()
        if not para or para.startswith("Fuera de la traza") or para.startswith("Cursiva"):
            continue
        m = HEADER_RE.match(para)
        if m and not m.group(1).strip().endswith(":"):
            title = m.group(1).strip()
            mm = re.match(r"(\d+)\.\s+(.*)", title)
            cur = {"titulo": mm.group(2) if mm else title, "n": int(mm.group(1)) if mm else None,
                   "origen": m.group(2), "texto": ""}
            blocks.append(cur)
        elif cur is not None:
            cur["texto"] += " " + para
    for b in blocks:
        b["info"] = parse_info(b["texto"])
        if b["info"]["sin_dato"] is False and not b["info"]["dato"] and not b["info"]["lo_que_se"]:
            b["info"]["sin_dato"] = "Sin dato" in b["texto"]
    return blocks


def food_tables(body: str) -> dict:
    """Subsecciones de 'Para planear la comida antes de salir'."""
    subs = subsections("\n" + body, "### ")
    res = {"parada": [], "cerca": [], "otros": [], "horarios": []}
    for title, txt in subs.items():
        if title.startswith("De tu lista ★ (son parada"):
            for row in table_rows(txt)[1:]:
                m = re.match(r"★\s*(\d+)", row[0])
                nm = re.match(r"\*\*(.+?)\*\*(.*)", row[1])
                res["parada"].append({"n": int(m.group(1)), "nombre": nm.group(1), "resto": nm.group(2),
                                      "por_que": row[2], "info": parse_info(row[3])})
        elif title.startswith("De tu lista ★, cerca"):
            for row in table_rows(txt)[1:]:
                m = re.search(r"(\d+)\s*m", row[0])
                nm = re.match(r"\*\*(.+?)\*\*(.*)", row[1])
                res["cerca"].append({"dist_m": int(m.group(1)), "nombre": nm.group(1), "resto": nm.group(2),
                                     "por_que": row[2], "info": parse_info(row[3])})
        elif title.startswith("Otros lugares"):
            for row in table_rows(txt)[1:]:
                nm = re.match(r"\*\*(.+?)\*\*(.*)", row[1], re.S)
                if not nm:
                    continue
                n = int(row[0]) if row[0].isdigit() else None
                res["otros"].append({"n": n, "rol": row[0].lower() if n is None else "parada",
                                     "nombre": nm.group(1), "origen_txt": nm.group(2).strip(),
                                     "info": parse_info(row[2])})
        elif title.startswith("Horarios"):
            for line in txt.splitlines():
                line = unescape_md(line).strip()
                if line.startswith("-"):
                    res["horarios"].append(re.sub(r"\*\*", "", line.lstrip("- ").strip()))
    return res


def lista_zonas(md: str) -> dict[str, str]:
    """nombre normalizado -> 'caba' | 'gba' | 'campo' segun la seccion de 'Tu lista completa'."""
    from .textutil import norm

    sec = split_routes(md).get("Tu lista completa (77 lugares)", "")
    out = {}
    for title, txt in subsections(sec).items():
        zona = "caba" if "CABA" in title else "gba" if "Gran" in title else "campo" if "campo" in title else None
        if not zona:
            continue
        for row in table_rows(txt)[1:]:
            nm = re.match(r"\*\*(.+?)\*\*", row[0])
            if nm:
                out[norm(nm.group(1))] = zona
    return out


def no_verificado_bullets(md: str) -> dict[str, list[str]]:
    sec = split_routes(md).get("Qué no pude verificar", "")
    out = {}
    for title, txt in subsections(sec).items():
        items = [re.sub(r"\*\*", "", unescape_md(l)).lstrip("- ").strip() for l in txt.splitlines() if l.strip().startswith("-")]
        if items:
            out[title] = items
    return out
