/* PAPOTAS · trabajador de servicio
   Sirve para dos cosas: que el programa se pueda INSTALAR como una aplicación
   y que ABRA SIN CONEXIÓN.

   La regla es "primero la red": si hay internet siempre se usa la versión del
   servidor, así una actualización llega en cuanto la subes. Solo cuando no hay
   red se echa mano de la copia guardada. Nunca al revés, para no dejarte con
   una versión vieja pegada.

   Ojo: esto NO guarda tus datos. Tus datos viven en el propio navegador y, si
   configuras la nube, en Supabase. Esto solo guarda el programa. */

const CACHE = 'papotas-v1';
const BASICOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (ev) => {
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(BASICOS).catch(() => {}))
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const mismoOrigen = url.origin === self.location.origin;

  /* A Supabase nunca se le contesta con una copia guardada: los datos han de
     ser los de verdad. */
  if (!mismoOrigen && /supabase/i.test(url.hostname)) return;

  ev.respondWith(
    fetch(req)
      .then((res) => {
        if (mismoOrigen && res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
        )
      )
  );
});
