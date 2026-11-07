"""Build the approved Cobalt homepage, Games page, and versioned static assets."""
from datetime import date
from hashlib import sha256
from html import escape
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "portfolio"
OUTPUT = ROOT / "html"
ASSET_OUTPUT = OUTPUT / "assets" / "portfolio"
CATALOG = json.loads(subprocess.check_output(
    ["Rscript", str(ROOT / "scripts" / "export_catalogue.R")], text=True
))
PROJECTS = {
    project["id"]: project
    for section in CATALOG["sections"]
    for project in section["projects"]
}
GAME_ORDER = [
    project["id"] for section in CATALOG["sections"] if section["id"] == "games"
    for project in section["projects"]
]
FEATURED = CATALOG["homepage"]["featured"]
TOPICS = CATALOG["topics"]
ORDERED = sorted(PROJECTS.values(), key=lambda p: (
    -date.fromisoformat(p["last_published"]).toordinal(), p["title"]["en"].casefold()
))
assert len(FEATURED) == len(set(FEATURED)) == 3
assert all("games" not in PROJECTS[pid]["topics"] for pid in FEATURED)
for project in PROJECTS.values():
    assert project["topics"] and set(project["topics"]) <= TOPICS.keys()
    for field in ("format", "summary"):
        assert set(project[field]) == {"en", "es"}
        assert all(project[field].values())

ASSET_OUTPUT.mkdir(parents=True, exist_ok=True)
ASSETS = {}
MANIFEST = []

def asset(filename):
    """Copy only referenced files, with content hashes for safe cache upgrades."""
    if filename in ASSETS:
        return ASSETS[filename]
    source = SOURCE / "media" / filename
    content = source.read_bytes()
    stem, suffix = source.stem, source.suffix
    target = f"{stem}-{sha256(content).hexdigest()[:12]}{suffix}"
    (ASSET_OUTPUT / target).write_bytes(content)
    url = "/assets/portfolio/" + target
    ASSETS[filename] = url
    MANIFEST.append("assets/portfolio/" + target)
    return url

def compiled_asset(filename, content):
    digest = sha256(content.encode()).hexdigest()[:12]
    source = Path(filename)
    target = f"{source.stem}-{digest}{source.suffix}"
    (ASSET_OUTPUT / target).write_text(content)
    MANIFEST.append("assets/portfolio/" + target)
    return "/assets/portfolio/" + target

css = (SOURCE / "site.css").read_text()
css = css.replace("__ASSET_geist.woff2__", asset("geist.woff2"))
css = css.replace("__ASSET_jakarta.woff2__", asset("jakarta.woff2"))
CSS_URL = compiled_asset("site.css", css)
JS_URL = compiled_asset("site.js", (SOURCE / "site.js").read_text())

def attributes(name, en, es):
    return f'data-{name}-en="{escape(en)}" data-{name}-es="{escape(es)}"'

def text(en, es, tag="span", extra=""):
    return f'<{tag} {attributes("text", en, es)} {extra}>{escape(en)}</{tag}>'

def badge(value):
    deployed = date.fromisoformat(value)
    month = deployed.month - 1
    en_months = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    es_months = ("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")
    full_es = ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre")
    en = "Page last uploaded / updated: " + deployed.strftime("%-d %B %Y")
    es = f"Última publicación / actualización de la página: {deployed.day} de {full_es[month]} de {deployed.year}"
    short_en = f"{en_months[month]}-{deployed.year % 100:02d}"
    short_es = f"{es_months[month]}-{deployed.year % 100:02d}"
    return (
        f'<time class="date" datetime="{value}" aria-label="{en}" title="{en}" '
        f'{attributes("label", en, es)} {attributes("text", short_en, short_es)}>{short_en}</time>'
    )

def artwork(pid, lead=False):
    normal = asset(pid + ".webp")
    if lead:
        large = asset(pid + "-lead.webp")
        sources = f'{normal} 480w, {large} 1000w'
        sizes = '(max-width: 720px) 94vw, 56vw'
        priority = 'fetchpriority="high"'
    else:
        small = asset(pid + "-small.webp")
        width = 640 if pid in GAME_ORDER else 480
        small_width = 320 if pid in GAME_ORDER else 200
        sources = f'{small} {small_width}w, {normal} {width}w'
        sizes = 'auto, (max-width: 720px) 45vw, 30vw'
        priority = 'loading="lazy"'
    return (
        f'<div class="art"><img src="{normal}" srcset="{sources}" sizes="{sizes}" '
        f'width="640" height="384" alt="" {priority} decoding="async"></div>'
    )

def card(pid, kind="project"):
    project = PROJECTS[pid]
    game = pid in GAME_ORDER
    search = " ".join([
        pid, *project["title"].values(), *project["description"].values(),
        *project["format"].values(), *project["summary"].values(),
        *(label for topic in project["topics"] for label in TOPICS[topic].values()),
    ])
    format_label = "" if game else text(
        project["format"]["en"], project["format"]["es"], extra='class="item-format"'
    )
    order = f' style="--game-order:{GAME_ORDER.index(pid)}"' if game else ""
    heading = "h2" if kind in ("lead", "game") else "h3"
    en_url = project.get("url_en", project["url"])
    es_url = project.get("url_es", project["url"])
    return f'''<article class="{kind}" data-id="{pid}" data-topics="{" ".join(project["topics"])}" data-search="{escape(search)}"{order}>
<a class="item-link" href="{escape(en_url)}" {attributes("link", en_url, es_url)}>
{artwork(pid, lead=kind == "lead")}
<div class="item-copy"><div class="item-meta">{format_label}{badge(project["last_published"])}</div>
{text(project["title"]["en"], project["title"]["es"], heading)}
{text(project["summary"]["en"], project["summary"]["es"], "p")}
{text("Play", "Jugar", extra='class="play"') if kind == "game" else ""}
</div><span class="item-arrow" aria-hidden="true">↗</span></a></article>'''

def header(games):
    destination = "/" if games else "/games/"
    label = ("Projects", "Proyectos") if games else ("Games", "Juegos")
    return f'''<header class="site-header"><div class="shell header-inner">
<a class="brand" href="/" data-local-link><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Daniel Almazan</a>
<nav aria-label="Sections" {attributes("label", "Sections", "Secciones")}><a class="nav-games" href="{destination}" data-local-link>{text(*label)} <span aria-hidden="true">↗</span></a></nav>
<div class="preferences"><div class="languages" role="group" aria-label="Language / Idioma"><button type="button" data-language="en" aria-label="English" aria-pressed="true">EN</button><button type="button" data-language="es" aria-label="Español" aria-pressed="false">ES</button></div>
<button type="button" class="theme-button" aria-pressed="false" aria-label="Dark mode" {attributes("label", "Dark mode", "Modo oscuro")}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.65" aria-hidden="true"><path d="M21 13.5A9.2 9.2 0 0 1 10.5 3 9.1 9.1 0 1 0 21 13.5Z"/></svg></button></div>
</div></header>'''

def homepage():
    search_label = attributes("label", "Search projects", "Buscar proyectos")
    placeholder = attributes("placeholder", "Search projects", "Buscar proyectos")
    filters = "".join(
        f'<button type="button" data-filter="{key}" aria-pressed="{str(key == "all").lower()}">{text(labels["en"], labels["es"])}</button>'
        for key, labels in TOPICS.items()
    )
    return f'''<div class="intro">
{text("Interactive projects, visual stories and games.", "Proyectos interactivos, historias visuales y juegos.", "h1", 'id="main-title"')}
<div class="search-wrap"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>
<input type="search" id="search" autocomplete="off" placeholder="Search projects" aria-label="Search projects" {placeholder} {search_label}><kbd aria-hidden="true">/</kbd></div></div>
<section class="features" aria-label="Featured projects" {attributes("label", "Featured projects", "Proyectos destacados")}>
<div class="section-marker"><span aria-hidden="true">01</span>{text("Featured", "Destacado")}</div>
{card(FEATURED[0], "lead")}<div class="supporting">{"".join(card(pid, "support") for pid in FEATURED[1:])}</div></section>
<section class="catalogue" id="catalogue" aria-labelledby="catalogue-title">
<div class="catalogue-top">{text("All projects", "Todos los proyectos", "h2", 'id="catalogue-title"')}<div class="result-count" role="status" aria-live="polite">{text(f"{len(PROJECTS)} projects", f"{len(PROJECTS)} proyectos")}</div></div>
<div class="filters" role="group" aria-label="Filter by topic" {attributes("label", "Filter by topic", "Filtrar por tema")}>{filters}</div>
<div class="empty" hidden>{text("No projects found.", "No se han encontrado proyectos.", "p")}<button type="button" data-reset>{text("Clear search and filters", "Borrar búsqueda y filtros")}</button></div>
<div class="collection">{"".join(card(p["id"]) for p in ORDERED)}</div></section>'''

def page(games):
    title_en = "Games — Daniel Almazan" if games else "Daniel Almazan — Interactive projects"
    title_es = "Juegos — Daniel Almazan" if games else "Daniel Almazan — Proyectos interactivos"
    description = "Football, geography, trade and flag games by Daniel Almazan." if games else "Interactive maps, visual stories, tools and games by Daniel Almazan."
    url = "https://danielalmazan.com/" + ("games/" if games else "")
    content = (
        f'<div class="games-intro">{text("Games", "Juegos", "h1")}</div>'
        f'<section class="game-collection" aria-label="Games" {attributes("label", "Games", "Juegos")}>'
        + "".join(card(pid, "game") for pid in GAME_ORDER) + "</section>"
    ) if games else homepage()
    sharing = ""
    if not games:
        image = "https://danielalmazan.com" + asset("share.png")
        alt = "Daniel Almazan — blue site icon on a white background"
        sharing = (
            f'<meta property="og:image" content="{image}">\n'
            f'<meta property="og:image:secure_url" content="{image}">\n'
            '<meta property="og:image:type" content="image/png">\n'
            '<meta property="og:image:width" content="1200">\n'
            '<meta property="og:image:height" content="630">\n'
            f'<meta property="og:image:alt" content="{alt}">\n'
            '<meta name="twitter:card" content="summary_large_image">\n'
            f'<meta name="twitter:image" content="{image}">\n'
            f'<meta name="twitter:image:alt" content="{alt}">\n'
        )
    html = f'''<!doctype html>
<html lang="en" {attributes("title", title_en, title_es)}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title_en}</title><meta name="description" content="{description}"><link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:title" content="{title_en}"><meta property="og:description" content="{description}"><meta property="og:url" content="{url}">
{sharing}<link rel="icon" href="{asset("mark.svg")}" type="image/svg+xml">
<script>(() => {{ let theme = new URLSearchParams(location.search).get('theme'); try {{ theme ||= localStorage.getItem('dani-theme') }} catch {{}} document.documentElement.dataset.theme = theme === 'light' || theme === 'dark' ? theme : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }})()</script>
<link rel="preload" href="{asset("geist.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="{asset("jakarta.woff2")}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="{CSS_URL}"><script src="{JS_URL}" defer></script>
</head><body class="editorial identity identity-cobalt{' games-page' if games else ''}">
<a class="skip" href="#main">{text("Skip to content", "Saltar al contenido")}</a>
{header(games)}<main id="main" class="shell">{content}</main>
<footer class="site-footer shell"><span>Daniel Almazan</span><div><a href="https://twitter.com/danialmazan_">X / Twitter</a><span aria-hidden="true"> · </span><a href="https://uk.linkedin.com/in/danielalmazan">LinkedIn</a></div></footer>
</body></html>'''
    (OUTPUT / ("games.html" if games else "index.html")).write_text(html)

if __name__ == "__main__":
    page(games=False)
    page(games=True)
    for license_file in SOURCE.joinpath("media").glob("*LICENSE.txt"):
        (ASSET_OUTPUT / license_file.name).write_bytes(license_file.read_bytes())
        MANIFEST.append("assets/portfolio/" + license_file.name)
    (OUTPUT / "catalogue-assets.json").write_text(json.dumps(sorted(MANIFEST), indent=2) + "\n")
    print(f"Built Cobalt homepage and Games with {len(PROJECTS)} projects and {len(MANIFEST)} assets.")
