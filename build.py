"""Copy each project's reveal.js deck into decks/<slug>/, pull in files it references outside its folder,
and inject the shell bridge. Rerun after a source deck changes. The source decks are never modified."""
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
DEV = Path(r"A:\Devstation")
PINTORESCO = Path(r"C:\Users\dodo-\AppData\Local\Temp\claude\A--Devstation-pintoresco"
                  r"\f6699420-d33b-4e58-8244-a00f72a571df\scratchpad\deck")

DECKS = {
    "fabula": DEV / "fabula/docs/apresentacao/index.html",
    "garaki": DEV / "GARAKI/docs/presentation/garaki-deck.html",
    "kamui": DEV / "kamUI/presentation/index.html",
    "forja": DEV / "forja/presentation/index.html",
    "fox-wizard": DEV / "fox_wizard_25d/apresentacao/index.html",
    "fast-props": DEV / "3d_vibes/fast-props/showcase/deck/index.html",
    "marionete": DEV / "3d_vibes/marionete/presentation/index.html",
    "effekseer-fx": DEV / "3d_vibes/effekseer_fx/presentation/index.html",
    "spritecam": DEV / "3d_vibes/spritecam/presentation/index.html",
    "shiki": DEV / "shiki_summon/presentation/index.html",
    "shortboard": DEV / "shortboard_creator/presentation/shortboard-creator.html",
}
SKIP = shutil.ignore_patterns("*.py", "*.src.html", "src.html", "deck.html", "__pycache__")
BRIDGE = '<script src="../../shell/bridge.js"></script>\n'
REF = re.compile(r'((?:src|href|poster|data-src|data-background-image|data-background-video)=")(\.\./[^"#?]+)(")')

# Pintoresco slides point at artifact blobs; these are the local files behind them (matched by alt text).
BLOBS = {
    "ae34208a59cb5400c5866fd2d1f9ddfc": "lava-map.jpg",
    "6b851af82daa757c060f2e3f3d184ef9": "cult-ref.jpg",
    "c4582b7141d6f53505983d90502edb9d": "cult-map.jpg",
    "affb848977568f4db20d47351f495517": "lava-mold.jpg",
    "e802d165d93ffab5c9dcd87a7bdd21a1": "lava-ai.jpg",
    "486d5777bd6e28ed0529acf0c4036733": "dc-mold.jpg",
    "fa55813453ff233738d2f19e1a8f8f83": "dc-ai.jpg",
    "985f57120e704a2943b976eb39202bd7": "hk-maps.jpg",
    "4c7faafa82565d350cbf8b279119a2f3": "sd-px.png",
    "17b5b815c3955f7ad2fc8968774e3116": "sd-paint.jpg",
}
PINTORESCO_HEAD = """<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pintoresco</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reset.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=DM+Sans:wght@400;600&display=swap">
<style>
  html, body { background: #16161d; }
  .reveal .slides > section { box-sizing: border-box; width: 1920px; height: 1080px; text-align: left; }
  .reveal .slides > section > * { position: relative; }
  .reveal .slides > section > aside { display: none; }
  .reveal p, .reveal h1, .reveal h2 { margin: 0; }
  x-shape[kind="arrow-right"] { display: block; flex: none;
    clip-path: polygon(0 35%, 65% 35%, 65% 0, 100% 50%, 65% 100%, 65% 65%, 0 65%); }
</style>
</head>
<body>
<div class="reveal"><div class="slides">
"""
PINTORESCO_TAIL = """
</div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.1.0/reveal.min.js"></script>
<script>
  Reveal.initialize({ width: 1920, height: 1080, margin: 0, center: false, hash: false,
    display: 'flex', transition: 'fade', backgroundTransition: 'fade' });
</script>
</body>
</html>
"""


def inject(html):
    i = html.rfind("</body>")
    return html + BRIDGE if i < 0 else html[:i] + BRIDGE + html[i:]


def copy_deck(slug, entry):
    src_dir, out = entry.parent, ROOT / "decks" / slug
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(src_dir, out, ignore=SKIP)
    html = entry.read_text("utf-8")

    def pull(m):
        target = (src_dir / m.group(2)).resolve()
        rel = Path("_ext") / target.relative_to(DEV)
        (out / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target, out / rel)
        return m.group(1) + rel.as_posix() + m.group(3)

    html = REF.sub(pull, html)
    cover = re.search(r'data-background-image="data:image/(\w+);base64,([^"]+)"', html)
    if cover:  # decks with inlined images: the master's opener card needs the cover as a file
        import base64
        (out / f"cover.{cover.group(1)}").write_bytes(base64.b64decode(cover.group(2)))
    if entry.name != "index.html":
        (out / entry.name).unlink(missing_ok=True)
    (out / "index.html").write_text(inject(html), "utf-8")


def build_pintoresco():
    out = ROOT / "decks" / "pintoresco"
    if out.exists():
        shutil.rmtree(out)
    (out / "img").mkdir(parents=True)
    for name in set(BLOBS.values()):
        shutil.copy2(PINTORESCO / "img" / name, out / "img" / name)
    import json
    project = PINTORESCO / "root" / "project"
    order = json.loads((project / "deck.json").read_text("utf-8"))["order"]
    slides = "\n".join((project / "slides" / f"{s}.html").read_text("utf-8") for s in order)
    slides = re.sub(r"/_blob/([0-9a-f]{32})", lambda m: "img/" + BLOBS[m.group(1)], slides)
    html = PINTORESCO_HEAD + slides + PINTORESCO_TAIL
    (out / "index.html").write_text(inject(html), "utf-8")


if __name__ == "__main__":
    for slug, entry in DECKS.items():
        copy_deck(slug, entry)
        print("ok", slug)
    build_pintoresco()
    print("ok pintoresco")
