// Guarda la app en el teléfono para que abra sin internet.
// Cambia VERSION cuando publiques una versión nueva.
const VERSION = "personal-v1";
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icono.svg", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  if (r.mode === "navigate") {
    // La página: primero la red (para recibir versiones nuevas), y si no hay, la guardada.
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(k => k.put("./", c)); return res; })
      .catch(() => caches.match("./").then(x => x || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(r).then(x => x || fetch(r)));
});
