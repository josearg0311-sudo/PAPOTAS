/* Agenda · trabajador de servicio
   Sirve para que la app se pueda INSTALAR, abra AL INSTANTE, funcione SIN
   CONEXIÓN y, al tocar un aviso, te lleve a la Agenda.

   Abre con la copia guardada y a la vez pide la del servidor por detrás. Si
   llegó una versión nueva, la guarda y avisa a la app, que ofrece «Actualizar».

   ESTO NO GUARDA TUS DATOS: viven en el navegador (y en la nube si la
   conectas). Esto solo guarda el programa.

   Cada vez que se publica: subir CACHE (y VERSION en js/version.js). */

const CACHE = 'agenda-v35';
const ARCHIVOS = [
  './', './index.html', './manifest.webmanifest',
  './css/tokens.css', './css/base.css', './css/componentes.css', './css/vistas.css',
  './js/app.js', './js/version.js',
  './js/util/fechas.js', './js/util/dinero.js', './js/util/dom.js', './js/util/interpretar.js', './js/util/ics.js',
  './js/datos/almacen.js', './js/datos/preferencias.js', './js/datos/areas.js',
  './js/datos/modelo.js', './js/datos/migracion.js', './js/datos/datos.js', './js/datos/copias.js', './js/datos/respaldo.js', './js/datos/pendientes.js', './js/datos/calendario.js', './js/datos/feriados.js',
  './js/piezas/aviso.js', './js/piezas/hoja.js', './js/piezas/tema.js', './js/piezas/candado.js', './js/piezas/guia.js', './js/piezas/agregar-rapido.js', './js/piezas/migracion-ui.js', './js/piezas/confirmar.js', './js/piezas/pendientes-ui.js', './js/piezas/pomodoro.js', './js/piezas/avisos.js', './js/piezas/eventos-ui.js',
  './js/vistas/comun.js', './js/vistas/hoy.js', './js/vistas/recordatorios.js', './js/vistas/agenda.js', './js/vistas/areas.js', './js/vistas/mas.js', './js/vistas/ajustes.js', './js/vistas/datos.js', './js/vistas/papelera.js',
  './js/vistas/area-comun.js', './js/vistas/area-personal.js', './js/vistas/area-estudios.js', './js/vistas/area-oficina.js', './js/vistas/area-deporte.js', './js/vistas/area-constancia.js', './js/vistas/seguimiento.js', './js/vistas/finanzas.js', './js/vistas/notas.js', './js/datos/finanzas.js', './js/datos/nube.js', './js/vistas/admin.js', './js/datos/corrector.js', './js/piezas/teclado.js', './diccionario/palabras-es.txt', './js/datos/seguimiento.js', './js/datos/herramientas.js', './js/piezas/formulario.js',
  './fuentes/plus-jakarta.woff2', './fuentes/martian-mono.woff2',
  './iconos/icono.svg', './iconos/icon-192.png', './iconos/icon-512.png', './iconos/icon-maskable-192.png', './iconos/icon-maskable-512.png', './iconos/apple-touch-icon.png'
];

self.addEventListener('install', (ev) => {
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then((c) => Promise.all(ARCHIVOS.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('agenda-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function huella(res) {
  return res ? (res.headers.get('etag') || res.headers.get('last-modified') || res.headers.get('content-length') || '') : '';
}
async function avisarNueva() {
  (await self.clients.matchAll({ type: 'window' })).forEach((c) => c.postMessage({ nuevaVersion: true }));
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // la nube nunca se responde con copias
  if (/\/pruebas\//.test(url.pathname)) return;               // las pruebas, siempre frescas

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
    if (guardada) { ev.waitUntil(deRed); return guardada; }
    const res = await deRed;
    return res || (esPagina ? (await cache.match('./index.html')) || Response.error() : Response.error());
  })());
});

/* Tocar un aviso: abre la Agenda (o la trae al frente) en la sección que toca */
self.addEventListener('notificationclick', (ev) => {
  ev.notification.close();
  const vista = (ev.notification.data && ev.notification.data.vista) || 'hoy';
  ev.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => new URL(x.url).pathname.replace(/index\.html$/, '') === new URL(self.registration.scope).pathname);
    if (c) { c.navigate('./index.html#' + vista).catch(() => {}); return c.focus(); }
    return self.clients.openWindow('./index.html#' + vista);
  }));
});
