/* Cuentas · trabajador de servicio
   Dos cosas: que se pueda INSTALAR y que ABRA SIN CONEXIÓN.

   Primero la red: con internet siempre gana la versión del servidor, así una
   actualización llega en cuanto la subes. La copia guardada solo entra cuando
   no hay red, para no dejarte con una versión vieja pegada.

   Ojo: esto NO guarda tus datos. Tus datos viven en el navegador y, si
   conectas la nube, en jsonbin.io. Esto solo guarda el programa. */

const CACHE = 'cuentas-v1';
const BASICOS = ['./', './index.html', './manifest.webmanifest',
                 './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (ev) => {
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS).catch(() => {})));
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

  /* A jsonbin.io nunca se le contesta con una copia: los datos han de ser
     los de verdad, no los de ayer. */
  if (!mismoOrigen && /jsonbin\.io/i.test(url.hostname)) return;

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
