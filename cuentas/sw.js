/* Cuentas Claras · guarda el programa para abrirlo sin conexión.
   Primero la red (así siempre llega la versión nueva) y, si no hay, la copia.
   Nunca toca las peticiones a JSONBin: esas tienen que ir siempre a la red. */
const CACHE = 'cuentas-claras-v12';
const FUENTES = 'cuentas-claras-fuentes';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icono.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('cuentas-claras-') && k !== CACHE && k !== FUENTES).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  /* Las letras de Google Fonts se guardan la primera vez y ya no se piden más */
  if(e.request.method === 'GET' && /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open(FUENTES).then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { if(n.ok || n.type === 'opaque') c.put(e.request, n.clone()); return n; }))));
    return;
  }
  if(e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if(r.ok){ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
