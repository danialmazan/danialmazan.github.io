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
 *
 * Without a slot, the band is inserted just before the page's last <footer>, or at the end of <body>.
 * Fonts and colours are inherited from the host page, so it looks native everywhere.
 * Language follows <html lang>, and updates live when the page switches language.
 */
(() => {
  const KOFI = "https://ko-fi.com/danialmazan";
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
    },
    en: {
      question: (p) => (p ? `Enjoyed ${p}?` : "Enjoyed this project?"),
      body: "If you found it useful or interesting, you can support new projects by buying me a coffee.",
      button: "Buy me a coffee",
      compact: "Buy me a coffee",
      lead: "Enjoyed it?",
      label: "Buy me a coffee on Ko-fi (opens in a new tab)",
    },
  };
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
.dsf:has(>.dsf-compact){display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}
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
  const refreshAll = () => document.querySelectorAll("[data-dani-support]").forEach(refresh);

  function mount() {
    if (!document.getElementById("dsf-style")) {
      const style = document.createElement("style");
      style.id = "dsf-style";
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    refreshAll();
    // Single-page apps may draw (or redraw) their slot after this script runs.
    let queued = false;
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; refreshAll(); });
    };
    new MutationObserver(queue).observe(document.documentElement, {
      attributes: true, attributeFilter: ["lang", "data-theme", "class"], childList: true, subtree: true,
    });
    // No slot at all once the page has loaded: insert one before the last <footer>.
    const autoInsert = () => setTimeout(() => {
      if (document.querySelector("[data-dani-support]")) return;
      const slot = document.createElement("div");
      slot.setAttribute("data-dani-support", "");
      const footers = document.querySelectorAll("footer");
      const anchor = footers[footers.length - 1];
      anchor ? anchor.before(slot) : document.body.appendChild(slot);
      refresh(slot);
    }, 0);
    document.readyState === "complete" ? autoInsert() : addEventListener("load", autoInsert, { once: true });
  }

  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", mount) : mount();
})();
