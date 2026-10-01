/* Agenda · trabajador de servicio
   Cuatro cosas: que se pueda INSTALAR, que ABRA AL INSTANTE, que funcione
   SIN CONEXIÓN y que al tocar un aviso te lleve a la agenda.

   Abre con la copia guardada (al instante, aunque no haya red) y a la vez
   pide la versión del servidor por detrás. Si llegó una versión nueva, la
   guarda y le avisa a la agenda, que ofrece «Actualizar».

   Esto NO guarda tus datos: viven en el navegador (y en jsonbin.io si
   conectas la nube). Esto solo guarda el programa. */

const CACHE = 'agenda-v17';
const BASICOS = ['./', './index.html', './icono.svg', './jakarta.woff2', './barlow-600.woff2', './barlow-700.woff2', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (ev) => {
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASICOS.map((u) => c.add(u).catch(() => {})))));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('agenda-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Una "huella" de la respuesta para saber si cambió */
function huella(res) {
  return res ? (res.headers.get('etag') || res.headers.get('last-modified') || res.headers.get('content-length') || '') : '';
}

async function avisarNueva() {
  const cs = await self.clients.matchAll({ type: 'window' });
  cs.forEach((c) => c.postMessage({ nuevaVersion: true }));
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* A jsonbin.io nunca se le contesta con una copia: los datos, los de verdad. */
  if (url.origin !== self.location.origin) return;

  const esPagina = req.mode === 'navigate';
  const clave = esPagina ? './index.html' : req;

  ev.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const guardada = await cache.match(clave, { ignoreSearch: true });
    const deRed = fetch(req, { cache: 'no-cache' }).then(async (res) => {
      if (res && res.ok && res.type === 'basic') {
        const cambio = esPagina && guardada && huella(guardada) && huella(res) !== huella(guardada);
        await cache.put(clave, res.clone());
        if (cambio) avisarNueva();
      }
      return res;
    }).catch(() => null);

    if (guardada) {
      ev.waitUntil(deRed);
      return guardada;
    }
    const res = await deRed;
    return res || (esPagina ? (await cache.match('./index.html')) || Response.error() : Response.error());
  })());
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
