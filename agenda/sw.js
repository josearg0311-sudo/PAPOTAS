/* Apuntes · abre sin conexión. Primero la red (así llega la versión nueva) y,
   si no hay, la copia. No toca JSONBin ni ntfy: van siempre a la red. */
const CACHE = 'apuntes-v1', FUENTES = 'apuntes-fuentes';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icono.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-32.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('apuntes-') && k !== CACHE && k !== FUENTES).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method === 'GET' && /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open(FUENTES).then(c => c.match(e.request).then(r => r || fetch(e.request).then(n => { if(n.ok || n.type === 'opaque') c.put(e.request, n.clone()); return n; }))));
    return;
  }
  if(e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if(r.ok){ const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch:true }).then(r => r || caches.match('./index.html'))));
});
/* Al tocar una notificación, abre (o enfoca) la app */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type:'window' }).then(cs => { for(const c of cs){ if('focus' in c) return c.focus(); } return self.clients.openWindow('./'); }));
});
