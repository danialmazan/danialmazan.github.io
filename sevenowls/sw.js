// Replace older offline-capable workers and remove their encrypted caches.
const root = new URL("./", self.location);
const payload = "game.4cb8eabea554f7c44197.bin";
const prefix = "sevenowls-encrypted-" + root.pathname + "-";
self.addEventListener("install", (event) => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", (event) =>
  event.waitUntil((async () => {
    for (const key of await caches.keys())
      if (key.startsWith(prefix)) await caches.delete(key);
    await self.clients.claim();
  })()),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== root.origin || !url.pathname.startsWith(root.pathname))
    return;
  const path = url.pathname.slice(root.pathname.length);
  // A returning player's cached gate can still name a retired encrypted bundle
  // after this worker takes over. Redirect to the current encrypted release;
  // never restore offline caches or persist decrypted files.
  event.respondWith((async () => {
    const response = await fetch(new Request(event.request, { cache: "no-store" }));
    // A worker from the previous release may still control a new loader. Keep
    // existing archives usable and recover only a genuinely retired request.
    if ((response.status === 404 || response.status === 410) &&
        /^game\.[a-f0-9]{20}\.bin$/.test(path) && path !== payload)
      return new Response(null, {
        status: 307,
        headers: {
          Location: new URL(payload, root).href,
          "Cache-Control": "no-store",
        },
      });
    return response;
  })());
});
