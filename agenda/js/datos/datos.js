/* TUS DATOS en la v5: se guardan en «agenda5_datos» (un documento con todos
   los elementos). Aquí está todo lo que lee o cambia datos: nadie más toca
   el almacén. Incluye la migración desde la v4.5 y la papelera.            */
import { leer, escribir, CLAVES } from './almacen.js';
import { docVacio, normalizarDoc, fusionar, nuevoId, modeloVacio } from './modelo.js';
import { migrar, verificar, antiguoDesdeTextos } from './migracion.js';
import { guardarCopia, clavesAntiguas } from './copias.js';

export const DIAS_PAPELERA = 30;
let doc = null;
const oyentes = [];
export function alCambiarDatos(fn) { oyentes.push(fn); }
function avisar() { oyentes.forEach((f) => { try { f(); } catch (e) { /* una vista que falla no tumba las demás */ } }); }

export function hayDatosNuevos() { return !!leer(CLAVES.datos, null); }
export function cargar() {
  doc = normalizarDoc(leer(CLAVES.datos, null));
  if (doc) purgarPapelera();
  return doc;
}
export function documento() { return doc; }

/* Guarda y comprueba que se pudo; si el almacén está lleno, no se pierde lo que
   había: se avisa y se mantiene en memoria hasta que se libere espacio. */
export function guardar() {
  if (!doc) return false;
  const ok = escribir(CLAVES.datos, doc);
  avisar();
  return ok;
}

/* ---------- Leer ---------- */
export function elementos(filtro) {
  if (!doc) return [];
  return doc.items.filter((x) => !x.borrado && (!filtro || filtro(x)));
}
export function buscarElemento(id) { return doc ? doc.items.find((x) => x.id === id) || null : null; }

/* ---------- Cambiar ---------- */
export function poner(it) {
  const ahora = Date.now();
  const x = Object.assign(modeloVacio(), it, { actualizado: ahora });
  if (!x.id) x.id = nuevoId(x.tipo);
  if (!x.creado) x.creado = ahora;
  const i = doc.items.findIndex((y) => y.id === x.id);
  if (i < 0) doc.items.push(x); else doc.items[i] = x;
  guardar();
  return x;
}

/* ---------- Papelera ---------- */
export function aPapelera(id) {
  const x = buscarElemento(id);
  if (!x || (x.extra && x.extra.sistema)) return false;
  x.borrado = x.actualizado = Date.now();
  /* Lo que cuelga de una lista se va con ella (y vuelve con ella) */
  if (x.tipo === 'lista') doc.items.forEach((y) => { if (y.lista === id && !y.borrado) { y.borrado = x.borrado; y.actualizado = x.borrado; y.extra = Object.assign({}, y.extra, { conLista: id }); } });
  guardar();
  return true;
}
export function restaurar(id) {
  const x = buscarElemento(id);
  if (!x) return false;
  const ahora = Date.now();
  x.borrado = null; x.actualizado = ahora;
  if (x.tipo === 'lista') doc.items.forEach((y) => { if (y.extra && y.extra.conLista === id) { y.borrado = null; y.actualizado = ahora; delete y.extra.conLista; } });
  /* Si su lista está en la papelera, vuelve también la lista */
  if (x.lista) { const l = buscarElemento(x.lista); if (l && l.borrado) { l.borrado = null; l.actualizado = ahora; } }
  guardar();
  return true;
}
export function enPapelera() {
  if (!doc) return [];
  const limite = Date.now() - DIAS_PAPELERA * 864e5;
  return doc.items.filter((x) => x.borrado && x.borrado >= limite && !(x.extra && x.extra.conLista)).sort((a, b) => b.borrado - a.borrado);
}
export function hijosBorradosCon(id) { return doc ? doc.items.filter((y) => y.extra && y.extra.conLista === id).length : 0; }
export function borrarDefinitivo(id) {
  const x = buscarElemento(id);
  if (!x || !x.borrado) return false;
  doc.items = doc.items.filter((y) => y.id !== id && !(y.extra && y.extra.conLista === id));
  guardar();
  return true;
}
/* Pasados 30 días, lo de la papelera se borra solo */
export function purgarPapelera() {
  if (!doc) return 0;
  const limite = Date.now() - DIAS_PAPELERA * 864e5, antes = doc.items.length;
  doc.items = doc.items.filter((x) => !x.borrado || x.borrado >= limite);
  const n = antes - doc.items.length;
  if (n) escribir(CLAVES.datos, doc);
  return n;
}

/* ---------- Migración desde la v4.5 ----------
   1) copia literal de las claves antiguas (IndexedDB, comprobada),
   2) conversión, 3) verificación completa, 4) recién ahí se guarda.
   Si algo falla en cualquier paso, NO se guarda nada y la v4.5 sigue igual. */
export async function migrarDesdeV45({ copiaObligatoria = true } = {}) {
  const textos = clavesAntiguas();
  let copia = null, errorCopia = null;
  try { copia = await guardarCopia('antes-de-migrar', textos, 'Todas las claves de la v4.5, tal cual'); }
  catch (e) { errorCopia = e; }
  if (!copia && copiaObligatoria) return { ok: false, paso: 'copia', error: errorCopia, textos };

  const antiguo = antiguoDesdeTextos(textos);
  const nuevo = migrar(antiguo);
  const v = verificar(antiguo, nuevo);
  if (!v.ok) return { ok: false, paso: 'verificacion', verificacion: v, textos };
  nuevo.migracion.verificacion = v;
  nuevo.migracion.copia = copia ? copia.id : null;

  /* Si ya había datos nuevos (volver a traer de la v4.5), se juntan */
  const previo = doc || normalizarDoc(leer(CLAVES.datos, null));
  const final = previo ? fusionar(previo, nuevo).doc : nuevo;
  if (previo) final.migracion = Object.assign({}, previo.migracion, { ultimaReimportacion: Date.now(), verificacion: v });
  if (!escribir(CLAVES.datos, final)) return { ok: false, paso: 'guardar', error: new Error('No hay espacio en el navegador'), textos };
  const releido = normalizarDoc(leer(CLAVES.datos, null));
  if (!releido || releido.items.length !== final.items.length) return { ok: false, paso: 'guardar', error: new Error('Lo guardado no coincide al releerlo'), textos };
  doc = releido;
  avisar();
  return { ok: true, verificacion: v, copia, total: nuevo.items.length };
}

/* Sin datos de la v4.5: se empieza con el documento vacío */
export function empezarVacio() {
  doc = docVacio();
  guardar();
  return doc;
}

/* Reemplaza o junta el documento entero (lo usa el respaldo) */
export function juntarDocumento(otro) {
  const r = fusionar(doc || docVacio(), otro);
  doc = r.doc;
  guardar();
  return r;
}

/* Cuántos hay de cada tipo (para la pantalla Tus datos) */
export function conteoPorTipo() {
  const c = {};
  elementos().forEach((x) => { c[x.tipo] = (c[x.tipo] || 0) + 1; });
  return c;
}
