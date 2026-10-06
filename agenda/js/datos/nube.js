/* NUBE (jsonbin.io) de la Agenda 5.
   - Usa un bin NUEVO («agenda5») en tu cuenta. NUNCA escribe en los 3 bins
     de la v4.5: esos solo se LEEN, una vez y si tú lo pides, para traer lo
     que tenían.
   - Nada se conecta solo: la primera vez tú eliges «Crear» o «Unir» y lo
     confirmas.
   - Antes de subir se revisa que los datos estén sanos; si algo no cuadra,
     no se sube nada y se avisa.
   - Se sube comprimido (gzip) para ocupar poco; se entiende también sin
     comprimir. Al bajar se JUNTA con lo de este aparato (gana el cambio más
     reciente de cada cosa), igual que la v4.5. */
import { leer, escribir, CLAVES, ANTIGUAS } from './almacen.js';
import { documento, reemplazarDocumento, alCambiarDatos } from './datos.js';
import { normalizarDoc, fusionar, docVacio } from './modelo.js';
import { migrar, verificar, antiguoDesdeTextos } from './migracion.js';
import { guardarCopia } from './copias.js';

const API_REAL = 'https://api.jsonbin.io/v3/b';
/* Solo para las pruebas automáticas (una nube de mentira en este aparato) */
const api = () => leer('agenda5_nube_api', null) || API_REAL;
export const PREFIJO_CODIGO = 'AGENDA5:';
/* En la vista previa (copia de prueba) la nube no se ofrece */
export const nubeDisponible = () => !(typeof window !== 'undefined' && window.__SIN_NUBE__);

/* ---------- Partes puras (se prueban sin internet) ---------- */
export function codigoDe(cfg) { return PREFIJO_CODIGO + btoa(JSON.stringify({ k: cfg.key, b: cfg.bin })); }
export function leerCodigo(texto) {
  try {
    const t = String(texto || '').replace(/\s+/g, '');
    if (!t.startsWith(PREFIJO_CODIGO)) return null;
    const j = JSON.parse(atob(t.slice(PREFIJO_CODIGO.length)));
    return j && typeof j.k === 'string' && typeof j.b === 'string' && j.k && j.b ? { key: j.k, bin: j.b } : null;
  } catch (e) { return null; }
}
/* Firma corta de un documento: si dos firmas son iguales, no hay nada nuevo que subir */
export function firma(d) {
  if (!d) return '';
  let s = d.items.length + ':' + ((d.perfil && d.perfil.actualizado) || 0) + ':' + Object.keys(d.purgados || {}).length;
  let h = 0;
  d.items.map((x) => x.id + '@' + (x.actualizado || 0) + (x.borrado ? 'b' : '')).sort().forEach((t) => { for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; });
  return s + ':' + h;
}
/* ¿Se puede subir? Nunca datos rotos, y nunca algo que borre la mitad de lo que hay arriba */
export function revisarAntesDeSubir(local, remoto) {
  if (!local || !Array.isArray(local.items)) return 'Los datos de este aparato no se pueden leer bien.';
  const n = normalizarDoc(JSON.parse(JSON.stringify(local)));
  if (!n || n.items.length !== local.items.length) return 'Hay elementos dañados en este aparato.';
  if (local.items.some((x) => !x.id || !x.tipo)) return 'Hay elementos sin identificador.';
  const vivosR = remoto ? remoto.items.filter((x) => !x.borrado).length : 0, vivosL = local.items.filter((x) => !x.borrado).length;
  if (vivosR >= 20 && vivosL < vivosR * 0.5) return 'Aquí hay muchas menos cosas (' + vivosL + ') que en la nube (' + vivosR + '). Por seguridad no se sube.';
  return null;
}

function aBase64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function deBase64(t) { const s = atob(t), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
async function pasar(bytes, flujo) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(flujo)).arrayBuffer()); }
export async function empaquetar(d, aparato = '') {
  const json = JSON.stringify(d), base = { app: 'agenda5', formato: 1, guardado: Date.now(), aparato, n: d.items.length };
  if (typeof CompressionStream === 'function') {
    try { return Object.assign(base, { enc: 'gz64', datos: aBase64(await pasar(new TextEncoder().encode(json), new CompressionStream('gzip'))) }); } catch (e) { /* sin compresión */ }
  }
  return Object.assign(base, { enc: 'json', datos: d });
}
export async function desempaquetar(p) {
  const r = p && p.record && !p.app ? p.record : p;
  if (!r || typeof r !== 'object' || r.app !== 'agenda5') return null;   // bin vacío o de otra app
  if (r.enc === 'gz64') return normalizarDoc(JSON.parse(new TextDecoder().decode(await pasar(deBase64(r.datos), new DecompressionStream('gzip')))));
  return normalizarDoc(r.datos);
}
export function mensajeError(e) {
  const m = String((e && e.message) || e || '');
  if (/401|403/.test(m)) return 'La llave (X-Master-Key) no es válida o no tiene permiso.';
  if (/404/.test(m)) return 'No encuentro tu bin en jsonbin. ¿Lo borraste?';
  if (/413|size|limit/i.test(m)) return 'Tus datos pasan el tamaño que permite tu plan de jsonbin.';
  if (/429/.test(m)) return 'jsonbin pide esperar un poco (demasiadas sincronizaciones). Se reintenta sola.';
  if (/Failed to fetch|NetworkError|network|offline/i.test(m)) return 'Sin internet. Se sincroniza sola cuando vuelva la conexión.';
  return m.slice(0, 160) || 'Error desconocido';
}

/* ---------- Estado ---------- */
export const config = () => { if (!nubeDisponible()) return null; const c = leer(CLAVES.nube, null); return c && c.key && c.bin ? c : null; };
export const estadoNube = () => leer('agenda5_nube_estado', {}) || {};
function ponerEstado(c) { const e = Object.assign({}, estadoNube(), c); escribir('agenda5_nube_estado', e); window.dispatchEvent(new CustomEvent('agenda:nube', { detail: e })); return e; }
function aparato() { let a = leer('agenda5_aparato', null); if (!a) { a = 'ap_' + Math.random().toString(36).slice(2, 10); escribir('agenda5_aparato', a); } return a; }
/* Lo que la v4.5 tenía configurado en ESTE aparato (solo para leerlo) */
export function nubeAntigua() {
  const a = leer(ANTIGUAS.nube, null), p = leer(ANTIGUAS.nubeLibroPersonal, null), o = leer(ANTIGUAS.nubeLibroOficina, null);
  const ok = (c) => c && c.key && c.bin ? c : null;
  return ok(a) || ok(p) || ok(o) ? { agenda: ok(a), personal: ok(p), oficina: ok(o), llave: (ok(a) || ok(p) || ok(o)).key } : null;
}

async function pedir(url, op = {}) {
  const r = await fetch(url, Object.assign({ cache: 'no-store' }, op));
  if (!r.ok) { let msj = ''; try { msj = (await r.json()).message || ''; } catch (e) { /* nada */ } throw new Error('http ' + r.status + (msj ? ' ' + msj : '')); }
  return r.json();
}
const cab = (key, extra = {}) => Object.assign({ 'Content-Type': 'application/json', 'X-Master-Key': key }, extra);

/* ---------- Crear, unir, desconectar ---------- */
export async function crearNube(llave) {
  if (!nubeDisponible()) throw new Error('La nube no está disponible en la vista previa');
  const key = String(llave || '').trim(); if (!key) throw new Error('Falta la llave');
  const d = documento() || docVacio(), aviso = revisarAntesDeSubir(d, null);
  if (aviso) throw new Error(aviso);
  const j = await pedir(api(), { method: 'POST', headers: cab(key, { 'X-Bin-Name': 'agenda5', 'X-Bin-Private': 'true' }), body: JSON.stringify(await empaquetar(d, aparato())) });
  const bin = j && j.metadata && j.metadata.id; if (!bin) throw new Error('jsonbin no devolvió el bin');
  escribir(CLAVES.nube, { key, bin, creado: Date.now() });
  ponerEstado({ ok: true, fecha: Date.now(), error: '', subido: Date.now(), n: d.items.length });
  return bin;
}
export async function unirNube(codigo) {
  if (!nubeDisponible()) throw new Error('La nube no está disponible en la vista previa');
  const c = leerCodigo(codigo); if (!c) throw new Error('Código no válido. Cópialo entero desde el otro aparato (empieza con AGENDA5:).');
  await pedir(api() + '/' + c.bin + '/latest', { headers: { 'X-Master-Key': c.key, 'X-Bin-Meta': 'false' } });   // comprueba antes de guardar
  escribir(CLAVES.nube, { key: c.key, bin: c.bin, creado: Date.now() });
  return sincronizar('unir');
}
export function desconectar() { escribir(CLAVES.nube, null); ponerEstado({ ok: false, fecha: 0, error: '', subido: 0 }); }

/* ---------- Sincronizar ---------- */
let corriendo = false, otraVez = false, aplicando = false;
export async function sincronizar(motivo = '') {
  const cfg = config(); if (!cfg) return null;
  if (corriendo) { otraVez = true; return null; }
  corriendo = true; ponerEstado({ ocupado: true });
  try {
    const remoto = await desempaquetar(await pedir(api() + '/' + cfg.bin + '/latest', { headers: { 'X-Master-Key': cfg.key, 'X-Bin-Meta': 'false' } }));
    const local = documento() || docVacio();
    const r = remoto ? fusionar(local, remoto) : { doc: local, nuevos: 0, actualizados: 0 };
    const junto = r.doc;
    if (firma(junto) !== firma(local)) { aplicando = true; reemplazarDocumento(junto); aplicando = false; window.dispatchEvent(new Event('agenda:repintar')); }
    let subido = false;
    if (!remoto || firma(junto) !== firma(remoto)) {
      const problema = revisarAntesDeSubir(junto, remoto);
      if (problema) throw new Error(problema);
      await pedir(api() + '/' + cfg.bin, { method: 'PUT', headers: cab(cfg.key), body: JSON.stringify(await empaquetar(junto, aparato())) });
      subido = true;
    }
    return ponerEstado({ ok: true, ocupado: false, fecha: Date.now(), error: '', bajados: r.nuevos + r.actualizados, subido: subido ? Date.now() : estadoNube().subido || 0, n: junto.items.length, motivo });
  } catch (e) {
    ponerEstado({ ok: false, ocupado: false, error: mensajeError(e), fechaError: Date.now() });
    throw e;
  } finally {
    corriendo = false;
    if (otraVez) { otraVez = false; setTimeout(() => sincronizar('otra vez').catch(() => {}), 500); }
  }
}

/* ---------- Traer lo de la nube de la v4.5 (SOLO LEER) ---------- */
export async function traerNubeAntigua() {
  if (!nubeDisponible()) throw new Error('La nube no está disponible en la vista previa');
  const n = nubeAntigua(); if (!n) throw new Error('Este aparato no tiene la nube de la versión anterior.');
  const leerBin = async (c) => (c ? (await pedir(api() + '/' + c.bin + '/latest', { headers: { 'X-Master-Key': c.key, 'X-Bin-Meta': 'false' } })) : null);
  const [a, p, o] = await Promise.all([leerBin(n.agenda), leerBin(n.personal), leerBin(n.oficina)]);
  const rec = (x) => (x && x.record && !x.transactions && !x.tareas ? x.record : x);
  const textos = { [ANTIGUAS.datos]: a ? JSON.stringify(rec(a)) : null, [ANTIGUAS.libroPersonal]: p ? JSON.stringify(rec(p)) : null, [ANTIGUAS.libroOficina]: o ? JSON.stringify(rec(o)) : null };
  try { await guardarCopia('nube-antigua', textos, 'Lo que había en los 3 bins de la versión anterior, tal cual'); } catch (e) { /* la copia es extra: igual se verifica todo */ }
  const antiguo = antiguoDesdeTextos(textos), nuevo = migrar(antiguo), v = verificar(antiguo, nuevo);
  if (!v.ok) throw new Error('Lo de la nube anterior no pasó la verificación: no se trajo nada.');
  const r = fusionar(documento() || docVacio(), nuevo);
  aplicando = true; reemplazarDocumento(r.doc); aplicando = false;
  window.dispatchEvent(new Event('agenda:repintar'));
  return { nuevos: r.nuevos, actualizados: r.actualizados, total: nuevo.items.length };
}

/* ---------- Automático (solo si ya conectaste) ---------- */
let reloj = null, ultimoToque = Date.now();
export function iniciarNube() {
  alCambiarDatos(() => { if (aplicando || !config()) return; clearTimeout(reloj); reloj = setTimeout(() => sincronizar('cambio').catch(() => {}), 2500); });
  ['click', 'keydown', 'touchstart'].forEach((t) => document.addEventListener(t, () => { ultimoToque = Date.now(); }, { passive: true }));
  /* Mientras la usas: cada minuto. Si la dejas quieta 5 minutos, descansa. */
  setInterval(() => { if (config() && !document.hidden && Date.now() - ultimoToque < 5 * 60e3) sincronizar('latido').catch(() => {}); }, 60e3);
  window.addEventListener('online', () => { if (config()) sincronizar('volvió internet').catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && config()) sincronizar('al volver').catch(() => {}); });
  if (config()) setTimeout(() => sincronizar('al abrir').catch(() => {}), 1500);
}
