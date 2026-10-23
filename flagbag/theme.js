// Shared pre-paint preference handling for the game and standalone reference pages.
(() => {
  const system = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    let preference;
    try {
      preference = JSON.parse(
        localStorage.getItem("flagbag:state:v1") || "null",
      );
    } catch {}
    const theme =
      preference?.themeSource === "manual" &&
      ["light", "dark"].includes(preference.theme)
        ? preference.theme
        : system.matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
    const language = ["en", "es"].includes(preference?.language)
      ? preference.language
      : (navigator.languages || [navigator.language]).some(
            (language) => language?.toLowerCase().split("-")[0] === "es",
          )
        ? "es"
        : "en";
    document.documentElement.lang = language;
    if (document.documentElement.hasAttribute("data-methodology")) {
      document.title = `Flag Bag — ${language === "es" ? "Banderas y metodología" : "Flags & methodology"}`;
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#141a17" : "#f3f4e9");
  };
  apply();
  system.addEventListener("change", apply);
  addEventListener("pageshow", apply);
  addEventListener("languagechange", apply);
  addEventListener("storage", (event) => {
    if (event.key === "flagbag:state:v1") apply();
  });
})();
