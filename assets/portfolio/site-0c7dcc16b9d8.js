(() => {
  const root = document.documentElement;
  const search = document.querySelector("#search");
  const cards = [...document.querySelectorAll(".collection .project")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const languages = [...document.querySelectorAll("[data-language]")];
  const themeButton = document.querySelector(".theme-button");
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const normalize = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const searchable = cards.map((card) => ({
    card,
    text: normalize(card.dataset.search),
    topics: card.dataset.topics.split(" "),
  }));
  let topic = "all";
  let language = "en";

  function preferredLanguage() {
    const requested = new URLSearchParams(location.search).get("lang");
    if (requested === "en" || requested === "es") return requested;
    try {
      const saved = localStorage.getItem("dani-language");
      if (saved === "en" || saved === "es") return saved;
    } catch { /* Device language still works when storage is unavailable. */ }
    const device = (navigator.language || navigator.languages?.[0] || "en").toLowerCase().split(/[-_]/)[0];
    return device === "es" ? "es" : "en";
  }

  function updateCatalogue() {
    if (!search) return;
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const item of searchable) {
      const match = (topic === "all" || item.topics.includes(topic))
        && terms.every((term) => item.text.includes(term));
      item.card.hidden = !match;
      count += Number(match);
    }
    const active = terms.length > 0 || topic !== "all";
    document.body.classList.toggle("is-filtering", active);
    document.body.classList.toggle("is-games-filter", topic === "games");
    for (const filter of filters) filter.setAttribute("aria-pressed", String(filter.dataset.filter === topic));
    const labels = language === "es"
      ? { all: "Todos los proyectos", results: "Resultados", one: "proyecto", many: "proyectos" }
      : { all: "All projects", results: "Results", one: "project", many: "projects" };
    document.querySelector("#catalogue-title").textContent = active ? labels.results : labels.all;
    const countNode = document.querySelector(".result-count");
    const nextCount = `${count} ${count === 1 ? labels.one : labels.many}`;
    if (countNode.textContent !== nextCount) countNode.textContent = nextCount;
    document.querySelector(".empty").hidden = count !== 0;
  }

  function syncLocalLinks() {
    for (const link of document.querySelectorAll("[data-local-link]")) {
      const destination = new URL(link.getAttribute("href"), location.href);
      destination.searchParams.delete("lang");
      destination.searchParams.delete("theme");
      destination.searchParams.set("lang", language);
      if (root.dataset.theme) destination.searchParams.set("theme", root.dataset.theme);
      link.href = destination.href;
    }
  }

  function writeState() {
    const url = new URL(location.href);
    url.searchParams.set("lang", language);
    if (root.dataset.theme) url.searchParams.set("theme", root.dataset.theme);
    try { history.replaceState(null, "", url); } catch { /* File URLs can restrict history. */ }
  }

  function setLanguage(value) {
    language = value === "es" ? "es" : "en";
    root.lang = language;
    document.title = root.getAttribute("data-title-" + language);
    for (const node of document.querySelectorAll("[data-text-en]")) {
      node.textContent = node.getAttribute("data-text-" + language);
    }
    for (const node of document.querySelectorAll("[data-label-en]")) {
      const label = node.getAttribute("data-label-" + language);
      node.setAttribute("aria-label", label);
      if (node.matches("time")) node.title = label;
    }
    for (const node of document.querySelectorAll("[data-link-en]")) {
      node.href = node.getAttribute("data-link-" + language);
    }
    for (const button of languages) button.setAttribute("aria-pressed", String(button.dataset.language === language));
    if (search) search.placeholder = search.getAttribute("data-placeholder-" + language);
    syncLocalLinks();
    updateCatalogue();
  }

  function updateThemeControl() {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : systemTheme.matches;
    themeButton.setAttribute("aria-pressed", String(dark));
  }

  function updateFreshness() {
    const now = new Date();
    for (const time of document.querySelectorAll(".date")) {
      const [year, month] = time.dateTime.split("-").map(Number);
      const age = (now.getFullYear() - year) * 12 + now.getMonth() + 1 - month;
      time.dataset.age = age <= 3 ? "recent" : age <= 12 ? "year" : age <= 24 ? "older" : "archive";
    }
  }

  for (const button of languages) button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
    try { localStorage.setItem("dani-language", language); } catch { /* The URL also carries the preference. */ }
    writeState();
  });
  themeButton.addEventListener("click", () => {
    const dark = themeButton.getAttribute("aria-pressed") === "true";
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("dani-theme", root.dataset.theme); } catch { /* The URL also carries the preference. */ }
    updateThemeControl();
    syncLocalLinks();
    writeState();
  });
  systemTheme.addEventListener("change", () => {
    let savedTheme;
    try { savedTheme = localStorage.getItem("dani-theme"); } catch {}
    if (!new URLSearchParams(location.search).has("theme") && !savedTheme) {
      root.dataset.theme = systemTheme.matches ? "dark" : "light";
    }
    updateThemeControl();
  });
  window.addEventListener("popstate", () => {
    setLanguage(preferredLanguage());
    const theme = new URLSearchParams(location.search).get("theme");
    if (theme === "light" || theme === "dark") root.dataset.theme = theme;
    updateThemeControl();
    syncLocalLinks();
  });

  if (search) {
    search.addEventListener("input", updateCatalogue);
    for (const button of filters) button.addEventListener("click", () => {
      topic = button.dataset.filter;
      updateCatalogue();
      button.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    document.querySelector("[data-reset]").addEventListener("click", () => {
      topic = "all";
      search.value = "";
      updateCatalogue();
      search.focus();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey
        || event.target.closest("input, textarea, [contenteditable]")) return;
      event.preventDefault();
      search.focus();
    });
  }

  // Floating Ko-fi prompt: visible after the page title scrolls under the header,
  // hidden again as the footer pill comes into view (with a one-off glow handoff).
  const floatButton = document.querySelector(".support-float");
  const pageTitle = document.querySelector("main h1");
  const footerSupport = document.querySelector(".site-footer .support-button");
  if (floatButton && pageTitle && footerSupport && "IntersectionObserver" in window) {
    const headerHeight = document.querySelector(".site-header")?.offsetHeight || 0;
    let pastTitle = false;
    let nearFooter = false;
    let typing = false;
    let shown = false;
    const updateFloat = () => {
      const visible = pastTitle && !nearFooter && !typing;
      if (visible === shown) return;
      if (shown && nearFooter) {
        footerSupport.classList.remove("is-handoff");
        void footerSupport.offsetWidth; // Restart the glow if it is already mid-animation.
        footerSupport.classList.add("is-handoff");
      }
      shown = visible;
      floatButton.classList.toggle("is-visible", visible);
      floatButton.setAttribute("aria-hidden", String(!visible));
      floatButton.tabIndex = visible ? 0 : -1;
    };
    footerSupport.addEventListener("animationend", () => footerSupport.classList.remove("is-handoff"));
    new IntersectionObserver(([entry]) => {
      pastTitle = !entry.isIntersecting && entry.boundingClientRect.top < headerHeight;
      updateFloat();
    }, { rootMargin: `-${headerHeight}px 0px 0px 0px` }).observe(pageTitle);
    new IntersectionObserver(([entry]) => {
      nearFooter = entry.isIntersecting || entry.boundingClientRect.top < 0;
      updateFloat();
    }, { rootMargin: "0px 0px 80px 0px" }).observe(footerSupport);
    if (search) {
      search.addEventListener("focus", () => { typing = matchMedia("(max-width: 560px)").matches; updateFloat(); });
      search.addEventListener("blur", () => { typing = false; updateFloat(); });
    }
  }

  setLanguage(preferredLanguage());
  updateThemeControl();
  updateFreshness();
})();
