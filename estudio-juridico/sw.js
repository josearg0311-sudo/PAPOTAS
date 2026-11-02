/* Estudio Rodríguez y Rodríguez · trabajador de servicio
   Guarda el PROGRAMA para que abra sin internet. Los datos no pasan por
   aquí: viven en el navegador (localStorage).
   Primero la red, así una versión nueva llega en cuanto se publica. */
const CACHE = 'rodriguez-v2';
const BASICOS = ['./', './index.html', './manifest.webmanifest', './icono.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (ev) => {
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS).catch(() => {})));
});
self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  ev.respondWith(
    fetch(req)
      .then((res) => { if (res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); } return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
