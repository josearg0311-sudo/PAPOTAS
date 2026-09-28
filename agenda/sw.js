/* Agenda · trabajador de servicio
   Tres cosas: que se pueda INSTALAR, que ABRA SIN CONEXIÓN y que al tocar
   un aviso te lleve a la agenda.

   Primero la red: con internet siempre gana la versión del servidor, así una
   actualización llega en cuanto la subes. La copia guardada solo entra cuando
   no hay red.

   Esto NO guarda tus datos: viven en el navegador (y en jsonbin.io si
   conectas la nube). Esto solo guarda el programa. */

const CACHE = 'agenda-v4';
/* El programa es un solo archivo: con eso basta para abrir sin red */
const BASICOS = ['./', './index.html'];

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
  /* A jsonbin.io nunca se le contesta con una copia: los datos, los de verdad. */
  if (!mismoOrigen) return;

  ev.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
        )
      )
  );
});

/* Tocar un aviso: abre la agenda (o la trae al frente) en la sección que toca */
self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const vista = (ev.notification.data && ev.notification.data.vista) || 'hoy';
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const c = cs.find((x) => new URL(x.url).pathname.replace(/index\.html$/, '') === new URL(self.registration.scope).pathname);
      if (c) { c.postMessage({ vista }); return c.focus(); }
      return self.clients.openWindow('./index.html#' + vista);
    })
  );
});
