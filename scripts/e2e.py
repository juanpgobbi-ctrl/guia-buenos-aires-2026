"""Capturas a 390 y 360 px de cada pantalla + prueba offline + chequeos basicos.
Uso: python -I -X utf8 scripts/e2e.py [URL_BASE]   (por defecto http://127.0.0.1:8123/)
Requiere Chrome instalado y `pip install playwright`."""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "capturas"
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8123/").rstrip("/") + "/"

PANTALLAS = [
    ("inicio", "#/"), ("comer", "#/comer"), ("comer-filtrado", "#/comer?o=lista-mia&t=parrilla"),
    ("comer-abierto", "#/comer?open=1"), ("recorridos", "#/recorridos"), ("ruta-a-plan", "#/ruta/a/plan"),
    ("ruta-a-ver", "#/ruta/a/ver"), ("ruta-a-mapa", "#/ruta/a/mapa"), ("ruta-d-plan", "#/ruta/d/plan"),
    ("ruta-m1-plan", "#/ruta/m1/plan"), ("correr", "#/correr"), ("ruta-bici-mapa", "#/ruta/bici/mapa"),
    ("ver-experiencias", "#/ver"), ("ver-recorridos", "#/ver?t=rutas"), ("lista", "#/lista"),
    ("noverif", "#/noverif"), ("mas", "#/mas"), ("buscar", "#/buscar?q=pizza"),
    ("ficha-sangucheria", "#/lugar/la-sangucheria-10-25"), ("ficha-cadore", "#/lugar/cadore-gelato-artigianale"),
    ("parada-patios", "#/parada/d-16"),
]


def main() -> int:
    OUT.mkdir(exist_ok=True)
    problemas = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        for width in (390, 360):
            ctx = browser.new_context(viewport={"width": width, "height": 780}, device_scale_factor=2, service_workers="allow",
                                      locale="es-AR", timezone_id="America/Argentina/Buenos_Aires")
            page = ctx.new_page()
            errores = []
            page.on("console", lambda m: errores.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errores.append(str(e)))
            for nombre, h in PANTALLAS:
                page.goto(BASE + h)
                page.wait_for_selector("#app > *", timeout=8000)
                page.wait_for_timeout(500 if "mapa" in nombre else 150)
                ancho = page.evaluate("document.documentElement.scrollWidth")
                if ancho > width + 1:
                    problemas.append(f"[{width}] {nombre}: scroll horizontal ({ancho}px)")
                if width == 390:
                    page.screenshot(path=str(OUT / f"{nombre}.png"), full_page=nombre not in ("ficha-sangucheria", "ficha-cadore", "parada-patios"))
            for e in errores:
                if "tile.openstreetmap" in e or "ERR_INTERNET" in e or "Failed to load resource" in e:
                    continue
                problemas.append(f"[{width}] consola: {e}")
            ctx.close()

        # offline
        ctx = browser.new_context(viewport={"width": 390, "height": 780}, service_workers="allow", locale="es-AR")
        page = ctx.new_page()
        page.goto(BASE)
        page.wait_for_selector(".tiles")
        page.evaluate("navigator.serviceWorker.ready.then(() => true)")
        page.wait_for_timeout(1500)
        page.reload()
        page.wait_for_timeout(800)
        controlado = page.evaluate("!!navigator.serviceWorker.controller")
        if not controlado:
            problemas.append("offline: la pagina no esta controlada por el service worker")
        ctx.set_offline(True)
        page.reload()
        page.wait_for_selector(".tiles", timeout=8000)
        page.goto(BASE + "#/ruta/a/plan")
        page.wait_for_selector(".facts", timeout=8000)
        page.goto(BASE + "#/lugar/la-sangucheria-10-25")
        page.wait_for_selector(".sheet", timeout=8000)
        page.screenshot(path=str(OUT / "offline-ficha.png"))
        page.goto(BASE + "#/ruta/a/mapa")
        page.wait_for_selector("#map", timeout=8000)
        page.wait_for_timeout(1200)
        page.evaluate("document.querySelector('#map').scrollIntoView()")
        page.screenshot(path=str(OUT / "offline-mapa.png"))
        hay_mapa = page.evaluate("!!document.querySelector('.leaflet-container')")
        if not hay_mapa:
            problemas.append("offline: el mapa no se inicializa (Leaflet no esta en cache)")
        ctx.close()
        browser.close()

    print("\n".join(problemas) if problemas else "e2e OK")
    return 1 if problemas else 0


if __name__ == "__main__":
    sys.exit(main())
