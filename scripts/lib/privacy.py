"""Reglas de privacidad. Los datos sensibles viven en archivos privados
(fuentes/privacy_rules.txt y fuentes/privacy_denylist.txt, ignorados por git);
este modulo no contiene ninguno."""
from __future__ import annotations

import math
import re
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FUENTES = ROOT / "fuentes"
RULES_FILE = FUENTES / "privacy_rules.txt"
DENY_FILE = FUENTES / "privacy_denylist.txt"


def haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    r = 6371000.0
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


@dataclass(frozen=True)
class Denylist:
    home: tuple[float, float] | None
    literals: tuple[str, ...]
    patterns: tuple[re.Pattern, ...]

    def hits(self, text: str) -> list[str]:
        low = text.lower()
        found = [s for s in self.literals if s.lower() in low]
        found += [p.pattern for p in self.patterns if p.search(text)]
        return found


def load_denylist() -> Denylist | None:
    if not DENY_FILE.exists():
        return None
    home, lits, pats = None, [], []
    for raw in DENY_FILE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("home="):
            la, lo = line[5:].split(",")
            home = (float(la), float(lo))
        elif line.startswith("str:"):
            lits.append(line[4:])
        elif line.startswith("re:"):
            pats.append(re.compile(line[3:], re.I))
    return Denylist(home, tuple(lits), tuple(pats))


def load_rules() -> list[tuple[re.Pattern, str]]:
    if not RULES_FILE.exists():
        raise SystemExit("Falta fuentes/privacy_rules.txt (privado). No se puede construir.")
    rules = []
    for raw in RULES_FILE.read_text(encoding="utf-8").splitlines():
        if not raw.strip() or raw.startswith("#") or "==>" not in raw:
            continue
        pat, rep = raw.split("==>", 1)
        rules.append((re.compile(pat.strip(), re.I), rep.strip()))
    return rules


_RULES = None


def scrub(text: str | None) -> str | None:
    global _RULES
    if text is None:
        return None
    if _RULES is None:
        _RULES = load_rules()
    for pat, rep in _RULES:
        text = pat.sub(rep, text)
    return re.sub(r"\s{2,}", " ", text).strip()
