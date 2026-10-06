/* COPIAS DE SEGURIDAD automáticas, dentro del navegador (IndexedDB, que
   tiene mucho más espacio que el almacén normal). Se hace una:
   - antes de migrar (copia LITERAL de todas las claves de la v4.5),
   - antes de importar un respaldo,
   La de «antes de migrar» nunca se borra sola; de las demás se guardan 10. */

const BD = 'agenda5', ALMACEN = 'copias', MAX_OTRAS = 10;

function abrir() {
  return new Promise((ok, mal) => {
    if (!('indexedDB' in window)) { mal(new Error('Este navegador no tiene IndexedDB')); return; }
    const r = indexedDB.open(BD, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(ALMACEN)) r.result.createObjectStore(ALMACEN, { keyPath: 'id' }); };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error || new Error('No se pudo abrir IndexedDB'));
    r.onblocked = () => mal(new Error('IndexedDB bloqueado'));
  });
}
function tx(modo, fn) {
  return abrir().then((db) => new Promise((ok, mal) => {
    const t = db.transaction(ALMACEN, modo), s = t.objectStore(ALMACEN);
    let res;
    Promise.resolve(fn(s)).then((v) => { res = v; });
    t.oncomplete = () => { db.close(); ok(res); };
    t.onerror = () => { db.close(); mal(t.error); };
    t.onabort = () => { db.close(); mal(t.error || new Error('Copia cancelada (¿sin espacio?)')); };
  }));
}
const pedir = (r) => new Promise((ok, mal) => { r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); });

/* Guarda una copia y la vuelve a leer para comprobar que quedó entera */
export async function guardarCopia(tipo, contenido, nota = '') {
  const texto = JSON.stringify(contenido);
  const copia = { id: tipo + '_' + Date.now(), tipo, fecha: Date.now(), nota, tamano: texto.length, texto };
  await tx('readwrite', (s) => pedir(s.put(copia)));
  const leida = await leerCopia(copia.id);
  if (!leida || leida.texto !== texto) throw new Error('La copia no se guardó completa');
  await podar();
  return { id: copia.id, tamano: copia.tamano };
}
export function leerCopia(id) { return tx('readonly', (s) => pedir(s.get(id))); }
export async function listarCopias() {
  const todas = await tx('readonly', (s) => pedir(s.getAll()));
  return (todas || []).map(({ texto, ...r }) => r).sort((a, b) => b.fecha - a.fecha);
}
async function podar() {
  const l = (await listarCopias()).filter((c) => c.tipo !== 'antes-de-migrar');
  const sobran = l.slice(MAX_OTRAS);
  if (sobran.length) await tx('readwrite', (s) => Promise.all(sobran.map((c) => pedir(s.delete(c.id)))));
}

/* Todas las claves de la v4.5 tal cual (texto exacto, sin interpretar) */
export function clavesAntiguas() {
  const o = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k.startsWith('agenda5_')) o[k] = localStorage.getItem(k);
    }
  } catch (e) { /* sin acceso */ }
  return o;
}
