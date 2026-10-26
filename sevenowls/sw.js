// This worker never receives passwords, keys, decrypted assets or answers.
const root = new URL("./", self.location),
  PREFIX = "sevenowls-encrypted-" + root.pathname + "-",
  CACHE = PREFIX + "65c108c4d977a6918943",
  FILES = ["index.html","gate.js","game.65c108c4d977a6918943.bin"];
self.addEventListener("install", (e) =>
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      try {
        for (const f of FILES) {
          const r = await fetch(new URL(f, root), { cache: "reload" });
          if (!r.ok) throw Error(f);
          await c.put(new URL(f, root), r);
        }
      } catch (e) {
        await caches.delete(CACHE);
        throw e;
      }
    })(),
  ),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (
    e.request.method !== "GET" ||
    u.origin !== root.origin ||
    !u.pathname.startsWith(root.pathname)
  )
    return;
  const name = u.pathname.slice(root.pathname.length) || "index.html";
  if (!FILES.includes(name)) return;
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(new URL(name, root))) || fetch(e.request);
    })(),
  );
});
