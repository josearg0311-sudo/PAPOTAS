/* Balanza y Plato · trabajador de servicio
   Guarda el programa para que se instale y abra sin conexión. Primero la red
   (así las actualizaciones llegan en cuanto se publican) y, si no contesta,
   la copia guardada. Los datos y las fotos NO van aquí: viven en el navegador. */
const CACHE = 'balanza-v3';
const BASICOS = ['./', './index.html', './manifest.webmanifest', './icono.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (ev) => {
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS).catch(() => {})));
});
self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('balanza-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  ev.respondWith(fetch(req).then((res) => {
    if (propio && res && res.ok) {
      const copia = res.clone();
      ev.waitUntil(caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {}));
    }
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
