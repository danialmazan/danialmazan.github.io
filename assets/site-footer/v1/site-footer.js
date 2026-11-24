/*
 * danielalmazan.com shared support footer (drop-in).
 *
 * One line per project page:
 *   <div data-dani-support></div>  ← where it renders (optional; see below)
 *   <script src="https://danielalmazan.com/assets/site-footer/v1/site-footer.js" defer
 *           data-project-es="Di mi nombre" data-project-en="Say my name"></script>
 *
 * Options (attributes on the script tag or on the [data-dani-support] slot; slot wins):
 *   data-variant      "band" (default) — invitation band for scrolling pages
 *                     "compact"        — "Enjoyed it?" + small pill, for app panels and game screens
 *                                        (give it its own row; it is ~230 px wide)
 *   data-project-es / data-project-en  — project name used in the question
 *   data-credit-es / data-credit-en    — optional credit line; when present a standard
 *                                        credit strip (danielalmazan.com · credit · project) is drawn
 *   data-accent       — optional CSS colour for the cup and hover state
 *   data-gap          — compact only: space above the pill (CSS length, default 14px)
 *                       (GAPS below sets it by page path, for pages whose HTML may be cached offline)
 *
 * Placement: either declare a [data-dani-support] slot, or put data-placement="auto" on the script tag.
 * Single-page apps and games should declare the slot in their own markup, only on the screens that
 * should show it (home, final results), so it never appears mid-game.
 * Auto places the band just before the page's last visible <footer> (matching its width and side padding),
 * and follows it if an app draws the footer late. Tune with data-anchor="<css selector>" and
 * data-position="before|prepend|append". A declared slot always wins over auto placement.
 * Fonts and colours are inherited from the host page, so it looks native everywhere.
 * Language follows <html lang>, and updates live when the page switches language.
 *
 * Home link: a small "◧ Daniel Almazán /" crumb next to the project's own title, so visitors can get back
 * to danielalmazan.com without scrolling to the footer. Where it goes on each page is in HOME_PAGES below
 * (keyed by path), so it can be tuned here without touching the project repos. Per-page overrides on the
 * script tag: data-home="off", data-home-anchor="<css selector>", data-home-mode="inline|above",
 * data-home-label="off" (mark only).
 */
(() => {
  const KOFI = "https://ko-fi.com/danialmazan";
  // Compact-pill gap by page path. Lives here (not only in each page's data-gap) because offline games
  // serve their saved index.html first, so returning players can keep an old tag for a long time.
  const GAPS = { "/flagbag/": "22px", "/mapfather/": "22px" };
  const HOME = "https://danielalmazan.com/";
  const script = document.currentScript;
  const COPY = {
    es: {
      question: (p) => (p ? `¿Te ha gustado ${p}?` : "¿Te ha gustado este proyecto?"),
      body: "Si te ha resultado útil o interesante, puedes apoyar nuevos proyectos invitándome a un café.",
      button: "Invítame a un café",
      compact: "Invítame a un café",
      lead: "¿Te ha gustado?",
      label: "Invítame a un café en Ko-fi (se abre en una pestaña nueva)",
      home: "Daniel Almazán: todos los proyectos",
    },
    en: {
      question: (p) => (p ? `Enjoyed ${p}?` : "Enjoyed this project?"),
      body: "If you found it useful or interesting, you can support new projects by buying me a coffee.",
      button: "Buy me a coffee",
      compact: "Buy me a coffee",
      lead: "Enjoyed it?",
      label: "Buy me a coffee on Ko-fi (opens in a new tab)",
      home: "Daniel Almazán: all projects",
    },
  };
  // Where the home crumb goes on each project page (longest matching path prefix wins).
  //   inline — before the project's brand in its header row; label hides on narrow screens
  //   above  — a small line above a large hero title
  //   false  — no crumb (the page already links home in its header, or has no header to join)
  // A list means "the first of these that is showing" (the crumb moves when a sticky bar appears).
  const HOME_PAGES = {
    "/de-aqui-para-alla/": [
      { anchor: "nav.compact-bar[data-shown='true'] > a.cb-home", mode: "inline" },
      { anchor: ".hero-head > .hero-title", mode: "above" },
    ],
    "/apretados/": { anchor: "main#top > header h1", mode: "above" },
    "/kilometro-cero/": { anchor: "header.masthead > a.brand", mode: "inline" },
    "/density-madrid-london/": { anchor: "header.masthead > .masthead-meta", mode: "inline" },
    "/density-europe/": false,
    "/madrid-rail-density/": false,
    "/madrid-income-rail-access/": false,
    "/espana-desde-2018/": { anchor: "header#top > a.wordmark", mode: "inline" },
    "/asi-somos/": { anchor: "section.opening > .opening-title-row", mode: "above" },
    "/ocupados/": { anchor: "header.masthead .identity > .brand-heading", mode: "inline" },
    "/tu-rincon/": { anchor: "header.site-header > .brand-button", mode: "inline" },
    "/di-mi-nombre/": { anchor: "header.hero > .hero-row", mode: "above" },
    "/riesgo-laboral/": { anchor: "header.topbar > a.brand", mode: "inline" },
    "/where-do-you-fit-spain/": false,
    "/metromadrid/": { anchor: ".hero-intro > div > .eyebrow", mode: "above" },
    "/transport/londoncyclepulse": { anchor: "header.site-header > a.wordmark", mode: "inline", label: false },
    // Full-screen map: the crumb tops whichever panel is open (Layers, or the full control panel).
    "/transport/madrid_public_transport": [
      { anchor: ".quick-panel__header > div > .eyebrow", mode: "above" },
      { anchor: "aside#control-panel > header.panel-header > div > .eyebrow", mode: "above" },
    ],
    "/airport-to-tower/": { anchor: "nav.top-nav > a.wordmark", mode: "inline" },
    "/debisacarmasvotos/": { anchor: "header.site-header > a.brand", mode: "inline" },
    "/elections/madrid_elections_2023": false,
    "/elections/general-elections-hex/": { anchor: "main > header > div:first-child > :first-child", mode: "above" },
    "/football_trivia_game/": { anchor: "section.hero > .hero__kicker", mode: "above" },
    "/mapfather/": { anchor: "header.site-header > button.wordmark", mode: "inline", label: false },
    "/flagbag/": { anchor: "header.site-header > button.wordmark", mode: "inline", label: false },
    "/guessports/": { anchor: "header.site-header > button.wordmark", mode: "inline", label: false },
    // The brand only fades in after the opening screen, so no "/" pointing at an empty space.
    "/chip-happens/": { anchor: "header.site-header > a.brand", mode: "inline", sep: false },
    "/bochorno-historico/": { anchor: ".hero-title", mode: "above" },
    // The header row has no side padding of its own (the title link carries it).
    "/e-spain/": { anchor: "header.topbar > a.identity", mode: "inline", indent: true },
    "/salary-calculator-2026/": { anchor: ".title-block > .brand-kicker", mode: "above" },
  };
  const MARK =
    '<svg class="dsf-mark" viewBox="0 0 32 32" width="16" height="16" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M6 6h9v20H6zM17 6a9 9 0 0 1 9 9h-9z"/>' +
    '<path fill="currentColor" fill-opacity=".42" d="M17 17h9a9 9 0 0 1-9 9z"/></svg>';
  const CUP =
    '<svg class="dsf-cup" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<g class="dsf-steam"><path d="M8 2.8c-.7.8.7 1.5 0 2.4"/><path d="M11.5 2.8c-.7.8.7 1.5 0 2.4"/></g>' +
    '<g class="dsf-mug"><path d="M4 8.5h11v5.2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/>' +
    '<path d="M15 10h1.6a2.4 2.4 0 0 1 0 4.8H15"/><path d="M3.5 21h12"/></g></svg>';

  const CSS = `
.dsf{--dsf-line:color-mix(in srgb,currentColor 16%,transparent);--dsf-muted:color-mix(in srgb,currentColor 68%,transparent);
  --dsf-tint:color-mix(in srgb,var(--dsf-accent) 9%,transparent);font:inherit;color:inherit;box-sizing:border-box;text-align:left}
.dsf *{box-sizing:border-box}
.dsf a{color:inherit}
.dsf-band{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px 22px;
  margin:0 auto;padding:clamp(22px,3.2vw,34px) 0;border-top:1px solid var(--dsf-line)}
.dsf-badge{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;
  color:var(--dsf-accent);background:var(--dsf-tint);border:1px solid color-mix(in srgb,var(--dsf-accent) 28%,transparent)}
.dsf-badge .dsf-cup{width:22px;height:22px;overflow:visible}
.dsf-text{min-width:0}
.dsf .dsf-q{margin:0;color:var(--dsf-ink);font-weight:650;font-size:clamp(1.02rem,1.5vw,1.16rem);line-height:1.25;letter-spacing:-.005em}
.dsf .dsf-p{margin:4px 0 0;max-width:56ch;color:var(--dsf-muted);font-size:.9rem;line-height:1.45}
.dsf .dsf-button{color:var(--dsf-ink);display:inline-flex;align-items:center;gap:9px;min-height:42px;padding:0 18px 0 15px;border-radius:999px;
  border:1px solid color-mix(in srgb,currentColor 26%,transparent);text-decoration:none!important;white-space:nowrap;
  font-weight:600;font-size:.9rem;line-height:1;transition:background-color .2s ease,border-color .2s ease,color .2s ease}
.dsf-button .dsf-cup{width:18px;height:18px;overflow:visible;transition:color .2s ease}
.dsf-arrow{opacity:.55;font-size:.85em;transition:transform .2s ease,opacity .2s ease}
.dsf-button:hover,.dsf-button:focus-visible{border-color:var(--dsf-accent);background:var(--dsf-tint)}
.dsf-button:hover .dsf-cup,.dsf-button:focus-visible .dsf-cup{color:var(--dsf-accent)}
.dsf-button:hover .dsf-arrow{opacity:1;transform:translate(1.5px,-1.5px)}
.dsf-mug,.dsf-steam{transform-box:fill-box;transition:transform .22s ease,opacity .22s ease}
.dsf-mug{transform-origin:50% 100%}.dsf-steam{opacity:.55}
.dsf-button:hover .dsf-mug{transform:rotate(-7deg)}
.dsf-button:hover .dsf-steam,.dsf-band:hover .dsf-badge .dsf-steam{opacity:1;transform:translateY(-1.5px)}
.dsf a:focus-visible{outline:2px solid var(--dsf-accent);outline-offset:3px}
.dsf-credit{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 24px;
  padding:16px 0 calc(18px + env(safe-area-inset-bottom));border-top:1px solid var(--dsf-line);font-size:.8rem;color:var(--dsf-muted)}
.dsf-credit a{text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px;color:inherit}
.dsf-credit .dsf-home{font-weight:600;color:var(--dsf-ink)}
.dsf-project{font-weight:650;letter-spacing:.02em}
.dsf-compact{display:inline-flex;align-items:center;gap:5px;text-decoration:none!important;font-size:.76rem;line-height:1.2;font-weight:600;color:var(--dsf-ink)!important;
  white-space:nowrap;border-radius:999px;padding:2px 9px 2px 7px;border:1px solid color-mix(in srgb,currentColor 22%,transparent);
  transition:background-color .2s ease,border-color .2s ease}
.dsf:has(>.dsf-compact){display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:var(--dsf-gap,14px)}
.dsf-lead{font-size:.76rem;color:var(--dsf-muted)}
.dsf-compact .dsf-cup{width:15px;height:15px;color:var(--dsf-accent);overflow:visible}
.dsf-compact:hover,.dsf-compact:focus-visible{border-color:var(--dsf-accent);background:var(--dsf-tint)}
.dsf-compact:hover .dsf-mug{transform:rotate(-7deg)}
@media (max-width:640px){
  .dsf-band{grid-template-columns:auto 1fr;gap:14px 14px;padding:24px 0}
  .dsf-badge{width:40px;height:40px}.dsf-badge .dsf-cup{width:19px;height:19px}
  .dsf .dsf-q{font-size:1rem}.dsf .dsf-p{font-size:.86rem}
  .dsf-button{grid-column:1/-1;justify-self:start;min-height:44px}
  .dsf-credit{flex-direction:column;align-items:flex-start;gap:6px}
}
@media (prefers-reduced-motion:reduce){.dsf *{transition:none!important}.dsf .dsf-mug,.dsf .dsf-steam,.dsf .dsf-arrow{transform:none!important}}
.dsf-crumb{display:inline-flex;align-items:center;gap:7px;flex:0 0 auto;align-self:center;min-height:32px;box-sizing:border-box;
  color:inherit!important;background:none!important;text-decoration:none!important;font-family:inherit;font-style:normal;font-weight:600;font-size:13px;line-height:1;
  letter-spacing:0;text-transform:none;white-space:nowrap;opacity:.72;transition:opacity .2s ease}
.dsf-crumb:hover,.dsf-crumb:focus-visible{opacity:1}
.dsf-crumb:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:3px}
.dsf-crumb .dsf-mark{width:16px;height:16px;flex:0 0 auto;display:block}
.dsf-crumb .dsf-sep{opacity:.45;font-weight:400;margin-left:2px}
.dsf-crumb[data-mode="above"]{display:flex;width:max-content;align-self:flex-start;justify-self:start;min-height:24px;margin:0 0 10px;font-size:12px;gap:6px}
.dsf-crumb[data-mode="above"] .dsf-mark{width:14px;height:14px}
@media (max-width:600px){.dsf-crumb[data-mode="inline"]:not([data-wrapped]) .dsf-name{display:none}}
.dsf-crumb[data-wrapped]{min-height:24px;font-size:12px;gap:6px}
.dsf-crumb[data-wrapped] .dsf-sep{display:none}
.dsf-crumb[data-wrapped] .dsf-mark{width:14px;height:14px}
@media (prefers-reduced-motion:reduce){.dsf-crumb{transition:none}}
`;

  const read = (node, name) => node?.getAttribute?.("data-" + name) ?? null;
  const option = (slot, name) => read(slot, name) ?? read(script, name);
  const language = () => ((document.documentElement.lang || "es").toLowerCase().startsWith("en") ? "en" : "es");
  const escape = (value) => String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function luminance(color) {
    const m = color.match(/[\d.]+/g);
    if (!m) return 0;
    const [r, g, b] = m.slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function render(slot) {
    const lang = language();
    const t = COPY[lang];
    const project = option(slot, "project-" + lang) || option(slot, "project-es") || "";
    // A name that is itself a question ("¿País vacío, país denso?") reads badly inside our question.
    const asked = /[?!]\s*$/.test(project) ? "" : project;
    const credit = option(slot, "credit-" + lang) || option(slot, "credit-es");
    const variant = option(slot, "variant") || "band";
    const link = (cls, inner) =>
      `<a class="${cls}" href="${KOFI}" target="_blank" rel="noopener noreferrer" aria-label="${escape(t.label)}">${inner}</a>`;
    if (variant === "compact") {
      slot.innerHTML = `<span class="dsf-lead">${escape(t.lead)}</span>` + link("dsf-compact", CUP + `<span>${escape(t.compact)}</span>`);
    } else {
      slot.innerHTML =
        `<section class="dsf-band" aria-label="${escape(t.button)}">` +
        `<span class="dsf-badge" aria-hidden="true">${CUP}</span>` +
        `<div class="dsf-text"><div class="dsf-q" role="heading" aria-level="2">${escape(t.question(asked))}</div><div class="dsf-p">${escape(t.body)}</div></div>` +
        link("dsf-button", CUP + `<span>${escape(t.button)}</span><span class="dsf-arrow" aria-hidden="true">↗</span>`) +
        `</section>` +
        (credit
          ? `<div class="dsf-credit"><a class="dsf-home" href="${HOME}">danielalmazan.com</a>` +
            `<span>${escape(credit)}</span>${project ? `<span class="dsf-project">${escape(project)}</span>` : ""}</div>`
          : "");
    }
    // Pick a warm accent that reads on the host background (dark text → light page, and vice versa).
    const ink = getComputedStyle(slot).color;
    const dark = luminance(ink) > 0.4;
    slot.style.setProperty("--dsf-ink", ink);
    slot.style.setProperty("--dsf-accent", option(slot, "accent") || (dark ? "#e2a877" : "#a8642f"));
    const gap = option(slot, "gap") || GAPS[location.pathname.replace(/index\.html$/, "")];
    if (gap) slot.style.setProperty("--dsf-gap", gap);
    else slot.style.removeProperty("--dsf-gap");
  }

  // Re-render only when something visible changed (language, colours, options), so host re-renders
  // never rebuild the link under the visitor's cursor or keyboard focus.
  function refresh(slot) {
    if (!slot.isConnected) return;
    slot.classList.add("dsf");
    const key = [language(), getComputedStyle(slot).color, slot.getAttribute("data-project-es"), slot.getAttribute("data-project-en"), slot.getAttribute("data-variant")].join("|");
    if (slot.__dsfKey === key && slot.firstChild) return;
    slot.__dsfKey = key;
    render(slot);
  }
  // ---- Home crumb -------------------------------------------------------------------------------
  function homeConfig() {
    if (read(script, "home") === "off") return null;
    let config = null;
    let best = -1;
    for (const [prefix, value] of Object.entries(HOME_PAGES)) {
      if (location.pathname.startsWith(prefix) && prefix.length > best) { best = prefix.length; config = value; }
    }
    const anchor = read(script, "home-anchor");
    if (anchor) config = { mode: "inline", anchor };
    if (!config) return null;
    const mode = read(script, "home-mode");
    const label = read(script, "home-label") === "off" ? { label: false } : {};
    return [].concat(config).map((c) => ({ ...c, ...(mode ? { mode } : {}), ...label }));
  }

  let crumb = null;
  let nudged = null;
  const showing = (el) => el.getClientRects().length && !el.closest("dialog,[hidden],[aria-hidden='true'],[inert]");
  function placeHome(configs) {
    let config = null;
    let anchor = null;
    for (const c of configs) {
      anchor = [...document.querySelectorAll(c.anchor)].find(showing);
      if (anchor) { config = c; break; }
    }
    if (!anchor) return;
    const t = COPY[language()];
    const mode = config.mode === "above" ? "above" : "inline";
    if (!crumb) {
      crumb = document.createElement("a");
      crumb.className = "dsf-crumb";
      crumb.href = HOME;
    }
    const sep = mode === "inline" && config.sep !== false;
    const key = [language(), mode, config.label !== false, sep].join("|");
    if (crumb.__dsfKey !== key) {
      crumb.__dsfKey = key;
      crumb.dataset.mode = mode;
      crumb.setAttribute("aria-label", t.home);
      crumb.title = t.home;
      crumb.innerHTML = MARK + (config.label === false ? "" : '<span class="dsf-name">Daniel Almazán</span>') +
        (sep ? '<span class="dsf-sep" aria-hidden="true">/</span>' : "");
    }
    if (crumb.nextElementSibling !== anchor) anchor.before(crumb);
    if (nudged && nudged !== anchor) { nudged.style.marginRight = nudged.style.marginLeft = nudged.style.gridRow = ""; nudged = null; }
    for (const p of ["marginLeft", "marginRight", "gridColumn", "gridRow", "justifySelf"]) crumb.style[p] = "";
    delete crumb.dataset.wrapped;
    if (mode !== "inline") return;
    const row = getComputedStyle(anchor.parentElement);
    // Line up with the brand's own inner padding (for rows that leave the side padding to the brand).
    if (config.indent) crumb.style.marginLeft = getComputedStyle(anchor).paddingLeft;
    if (row.display.includes("grid")) {
      // Share the brand's grid cell and move the brand along by our width, so no new row appears.
      const cell = getComputedStyle(anchor);
      const gridRow = cell.gridRowStart === "auto" ? "1" : cell.gridRowStart;
      Object.assign(crumb.style, { gridColumn: cell.gridColumnStart, gridRow, justifySelf: "start" });
      // Two items may only share a cell when both are placed explicitly.
      if (cell.gridRowStart === "auto") anchor.style.gridRow = "1";
      const r = crumb.getBoundingClientRect();
      anchor.style.marginLeft = Math.ceil(r.width + (parseFloat(crumb.style.marginLeft) || 0)) + (config.indent ? 0 : 10) + "px";
      nudged = anchor;
      return;
    }
    // Sit 10px from the project brand whatever gap the host row already uses.
    const gap = parseFloat(row.columnGap) || 0;
    crumb.style.marginRight = config.indent ? "0px" : Math.max(0, 10 - gap) + "px";
    // In a two-item space-between row (brand … controls) a third item would push the brand to the
    // middle. An auto margin on the brand reproduces the original layout with us beside it.
    const others = [...anchor.parentElement.children].filter((el) => el !== crumb && showing(el));
    if (!nudged && others.length === 2 && /flex/.test(row.display) && /space-(between|around|evenly)/.test(row.justifyContent)) {
      anchor.style.marginRight = "auto";
      nudged = anchor;
    }
    // A row that wraps on small screens leaves us on a line of our own: read as a label above the title.
    const a = anchor.getBoundingClientRect();
    const c = crumb.getBoundingClientRect();
    if (c.bottom <= a.top + 2 || c.top >= a.bottom - 2) crumb.dataset.wrapped = "";
  }

  const refreshAll = () => {
    // A declared slot always wins over one this script inserted on its own.
    if (document.querySelector("[data-dani-support]:not([data-dsf-auto])")) {
      document.querySelectorAll("[data-dani-support][data-dsf-auto]").forEach((slot) => slot.remove());
    }
    document.querySelectorAll("[data-dani-support]").forEach(refresh);
  };

  function mount() {
    if (!document.getElementById("dsf-style")) {
      const style = document.createElement("style");
      style.id = "dsf-style";
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    const home = homeConfig();
    const update = () => { if (home) placeHome(home); refreshAll(); };
    update();
    // Single-page apps may draw (or redraw) their slot and header after this script runs.
    let queued = false;
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; update(); });
    };
    addEventListener("resize", queue, { passive: true });
    new MutationObserver(queue).observe(document.documentElement, {
      attributes: true, childList: true, subtree: true,
      attributeFilter: ["lang", "data-theme", "class", "hidden", "aria-hidden", "inert", "data-shown"],
    });
    // Opt-in only (data-placement="auto" on the script tag): place the band next to the page footer,
    // matching its width and side padding. It keeps tracking the footer, so apps that draw (or redraw)
    // their footer late still get the band in the right place. Pages that declare a slot never get one.
    if (read(script, "placement") !== "auto") return;
    let auto = null;
    const place = () => {
      if (document.querySelector("[data-dani-support]:not([data-dsf-auto])")) return;
      const selector = read(script, "anchor");
      const candidates = [...document.querySelectorAll(selector || "footer")]
        .filter((el) => el.getClientRects().length && !el.closest("dialog,[hidden],[aria-hidden='true']"));
      const anchor = candidates[candidates.length - 1];
      // No anchor on this screen (an app switched views): take the band away rather than leave it
      // stranded where the old anchor was. Frameworks that reuse the parent element would otherwise
      // keep it on screens it was never meant for (e.g. on top of a game board).
      if (!anchor) { auto?.remove(); return; }
      const where = read(script, "position") || "before"; // before | prepend | append
      if (!auto) {
        auto = document.createElement("div");
        auto.setAttribute("data-dani-support", "");
        auto.setAttribute("data-dsf-auto", "");
      }
      const placed = where === "prepend" ? anchor.firstElementChild === auto
        : where === "append" ? anchor.lastElementChild === auto
        : auto.nextElementSibling === anchor;
      if (!placed) {
        if (where === "prepend") anchor.prepend(auto);
        else if (where === "append") anchor.append(auto);
        else anchor.before(auto);
      }
      if (where === "before") {
        // Line the band up with the footer's own content edges.
        const cs = getComputedStyle(anchor);
        Object.assign(auto.style, {
          maxWidth: cs.maxWidth, marginLeft: cs.marginLeft, marginRight: cs.marginRight,
          paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight, boxSizing: cs.boxSizing,
        });
      }
      refresh(auto);
    };
    const settle = () => { place(); new MutationObserver(() => requestAnimationFrame(place)).observe(document.body, { childList: true, subtree: true }); };
    document.readyState === "complete" ? settle() : addEventListener("load", settle, { once: true });
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", mount) : mount();
})();
