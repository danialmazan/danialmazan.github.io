// Replace older offline-capable workers and remove their encrypted caches.
const root = new URL("./", self.location);
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
  if (event.request.method === "GET" && url.origin === root.origin && url.pathname.startsWith(root.pathname))
    event.respondWith(fetch(new Request(event.request, { cache: "no-store" })));
});
