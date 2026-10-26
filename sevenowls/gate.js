const PAYLOAD = "game.765e3f8dcc9432b33b7c.bin";
const FORMAT = "seven-owls-encrypted-v1";
const root = new URL("./", location.href);
const spanish = navigator.language.toLowerCase().startsWith("es");
const t = spanish
  ? {
      eyebrow: "Vista privada",
      heading: "La contraseña, por favor.",
      intro: "Introduce la contraseña para abrir el juego.",
      label: "Contraseña",
      submit: "Abrir Seven Owls ↗",
      privacy:
        "El juego se desbloquea en este dispositivo. La contraseña no se guarda.",
      busy: "Abriendo…",
      wrong: "Contraseña incorrecta. Inténtalo de nuevo.",
      network:
        "No se ha podido descargar el juego. Comprueba la conexión e inténtalo de nuevo.",
      unsupported:
        "Este navegador no permite abrir el juego cifrado. Prueba con un navegador actualizado.",
      open: "Juego Seven Owls",
    }
  : {
      busy: "Opening…",
      wrong: "Incorrect password. Try again.",
      network:
        "The game could not be downloaded. Check your connection and try again.",
      unsupported:
        "This browser cannot open the encrypted game. Try an updated browser.",
      open: "Seven Owls game",
    };
if (spanish) {
  document.documentElement.lang = "es";
  for (const id of [
    "eyebrow",
    "heading",
    "intro",
    "label",
    "submit",
    "privacy",
  ])
    document.getElementById(id).textContent = t[id];
}
const form = document.getElementById("unlock"),
  input = document.getElementById("password"),
  button = document.getElementById("submit"),
  message = document.getElementById("message");
const buttonLabel = button.textContent;
const decode = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
const text = (value) => new TextDecoder().decode(value);
const mime = (path) =>
  ({
    js: "text/javascript",
    css: "text/css",
    html: "text/html",
    json: "application/json",
    svg: "image/svg+xml",
    woff2: "font/woff2",
    png: "image/png",
    webmanifest: "application/manifest+json",
    txt: "text/plain",
  })[path.split(".").at(-1)] || "application/octet-stream";
let payloadPromise;
const getPayload = () =>
  (payloadPromise ||= fetch(new URL(PAYLOAD, root))
    .then((r) => {
      if (!r.ok) throw Error("network");
      return r.json();
    })
    .catch((e) => {
      payloadPromise = null;
      throw e;
    }));
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register(new URL("sw.js", root), {
      scope: root.pathname,
      updateViaCache: "none",
    })
    .catch(() => {});
async function openGame(files) {
  const urls = {},
    bytes = {};
  for (const [path, value] of Object.entries(files)) {
    bytes[path] = decode(value);
    urls[path] = URL.createObjectURL(
      new Blob([bytes[path]], { type: mime(path) }),
    );
  }
  const resolveResource = (value, path) => {
    if (/^(data:|blob:|https?:)/.test(value)) return value;
    const name = new URL(
      value,
      new URL(path, "https://archive.invalid/"),
    ).pathname.slice(1);
    if (!urls[name]) throw Error("Missing encrypted resource");
    return urls[name];
  };
  for (const path of Object.keys(files).filter((p) => p.endsWith(".css"))) {
    const css = text(bytes[path]).replace(
      /url\(["']?([^"')]+)["']?\)/g,
      (_, value) => `url("${resolveResource(value, path)}")`,
    );
    URL.revokeObjectURL(urls[path]);
    urls[path] = URL.createObjectURL(new Blob([css], { type: "text/css" }));
  }
  for (const path of Object.keys(files).filter(
    (p) => p.startsWith("assets/") && p.endsWith(".js"),
  )) {
    const js = text(bytes[path]).replaceAll("./owl.svg", urls["owl.svg"]);
    URL.revokeObjectURL(urls[path]);
    urls[path] = URL.createObjectURL(
      new Blob([js], { type: "text/javascript" }),
    );
  }
  const doc = new DOMParser().parseFromString(
    text(bytes["index.html"]),
    "text/html",
  );
  doc.documentElement.setAttribute("data-encrypted-release", "");
  doc.querySelector('link[rel="manifest"]')?.remove();
  for (const el of doc.querySelectorAll("script[src],link[href]")) {
    const attr = el.tagName === "SCRIPT" ? "src" : "href";
    el.setAttribute(attr, resolveResource(el.getAttribute(attr), "index.html"));
  }
  const base = doc.createElement("base");
  base.href = root.href;
  doc.head.prepend(base);
  // Only data is exposed to the application's fetch API, from memory. No
  // decrypted response is sent to a service worker, cache or public endpoint.
  const data = Object.fromEntries(
    Object.entries(files).filter(
      ([p]) => p.startsWith("data/") || p === "release.json",
    ),
  );
  const boot = doc.createElement("script");
  boot.textContent = `{const files=${JSON.stringify(data)},root=${JSON.stringify(root.href)},nativeFetch=window.fetch.bind(window);window.fetch=async(input,init)=>{const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,document.baseURI),r=new URL(root);if(u.origin===r.origin&&u.pathname.startsWith(r.pathname)){const path=u.pathname.slice(r.pathname.length);if(!Object.hasOwn(files,path))return new Response('',{status:404});const bytes=Uint8Array.from(atob(files[path]),c=>c.charCodeAt(0));return new Response(bytes,{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}return nativeFetch(input,init);};}`;
  // A base URL is needed for application data. Keep fragment links inside the
  // srcdoc document rather than navigating the frame back to the password page.
  boot.textContent += `document.addEventListener('click',event=>{const anchor=event.target instanceof Element?event.target.closest('a[href^="#"]'):null;if(!anchor)return;const target=document.getElementById(decodeURIComponent(anchor.getAttribute('href').slice(1)));if(target){event.preventDefault();target.focus();target.scrollIntoView();}});`;
  doc.head.insertBefore(boot, base.nextSibling);
  const frame = document.createElement("iframe");
  frame.title = t.open;
  frame.allow = "clipboard-write; web-share";
  frame.srcdoc = "<!doctype html>" + doc.documentElement.outerHTML;
  frame.addEventListener(
    "load",
    () => {
      document.getElementById("gate").hidden = true;
      frame.focus();
    },
    { once: true },
  );
  document.body.append(frame);
}
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  button.disabled = true;
  message.textContent = "";
  button.textContent = t.busy;
  let stage = "download";
  try {
    if (!crypto.subtle || !globalThis.DecompressionStream)
      throw Error("unsupported");
    const envelope = await getPayload();
    if (envelope.format !== FORMAT || envelope.iterations !== 600000)
      throw Error("unsupported");
    const salt = decode(envelope.salt),
      iv = decode(envelope.iv);
    if (salt.length !== 16 || iv.length !== 12) throw Error("unsupported");
    stage = "decrypt";
    const material = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(input.value),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    input.value = "";
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
    const clear = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(FORMAT) },
      key,
      decode(envelope.ciphertext),
    );
    stage = "open";
    const stream = new Blob([clear])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    await openGame(JSON.parse(await new Response(stream).text()));
  } catch (error) {
    message.textContent =
      error.message === "unsupported"
        ? t.unsupported
        : stage === "decrypt"
          ? t.wrong
          : stage === "download"
            ? t.network
            : t.unsupported;
    input.focus();
  } finally {
    button.disabled = false;
    button.textContent = buttonLabel;
  }
});
