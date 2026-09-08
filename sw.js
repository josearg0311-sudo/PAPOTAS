/* PAPOTAS · trabajador de servicio
   Sirve para dos cosas: que el programa se pueda INSTALAR como una aplicación
   y que ABRA SIN CONEXIÓN.

   La regla es "primero la red, pero sin esperar eternamente": si hay internet
   se usa la versión del servidor, así una actualización llega en cuanto la
   subes. Si la red no contesta en unos segundos -sin cobertura, datos que van
   y vienen- se abre al instante con la copia guardada y la descarga sigue por
   detrás, de modo que la próxima vez ya tendrás la versión nueva.

   Antes no había ese plazo: sin señal el navegador se pasaba TRECE SEGUNDOS
   intentándolo antes de rendirse, y hasta entonces la pantalla estaba en
   blanco. Medido.

   Ojo: esto NO guarda tus datos. Tus datos viven en el propio navegador y, si
   configuras la nube, en Supabase. Esto solo guarda el programa. */

const CACHE = 'papotas-v2';
const BASICOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

/* Cuánto se espera a la red antes de tirar de la copia guardada. */
const PACIENCIA = 3500;

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

  /* El respaldo de arranque tampoco se guarda: si algún día lo quitas del
     sitio, no queremos que siga vivo en una copia vieja. */
  if (mismoOrigen && /\/respaldo\.json$/i.test(url.pathname)) return;

  const guardada = () =>
    caches.match(req).then((hit) =>
      hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
    );

  const deLaRed = fetch(req).then((res) => {
    if (mismoOrigen && res && res.ok) {
      const copia = res.clone();
      /* Guardar la copia. `waitUntil` mantiene vivo al trabajador hasta que
         la escritura termine; sin eso el navegador puede matarlo a mitad y
         `put`, que borra antes de insertar, te deja SIN copia.
         Ojo: si ya hemos contestado con la copia guardada (se acabó el
         plazo), el evento puede estar cerrado y `waitUntil` lanzaría. En ese
         caso se guarda a pelo, que es lo que se hacía antes. */
      const guardar = caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
      try { ev.waitUntil(guardar); } catch (_e) { /* evento ya cerrado */ }
    }
    return res;
  });

  /* Se corre la red contra el reloj. Gane quien gane, la descarga sigue viva
     por detrás para dejar la copia al día. */
  ev.respondWith(
    new Promise((listo) => {
      let resuelto = false;
      const responder = (r) => { if (!resuelto && r) { resuelto = true; listo(r); } };

      const reloj = setTimeout(() => {
        guardada().then(responder).catch(() => {});
      }, PACIENCIA);

      deLaRed
        .then((res) => { clearTimeout(reloj); responder(res); })
        .catch(() => {
          clearTimeout(reloj);
          guardada()
            .then((hit) => responder(hit || Response.error()))
            .catch(() => responder(Response.error()));
        });
    })
  );
});
