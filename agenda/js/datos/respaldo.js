/* RESPALDO: todo en un solo archivo .json.
   Exportar: el documento entero de la v5.
   Importar: acepta respaldos de la v5 Y de la v4.5 (el completo de la agenda,
   el de solo la agenda y el de un libro de cuentas). Lo antiguo pasa por la
   misma migración verificada. Nunca reemplaza: JUNTA, ganando el cambio más
   reciente de cada cosa, y antes guarda una copia automática de lo que había. */
import { documento, juntarDocumento } from './datos.js';
import { normalizarDoc, TIPOS_PLURAL } from './modelo.js';
import { migrar, verificar } from './migracion.js';
import { guardarCopia } from './copias.js';
import { leer, escribir, CLAVES } from './almacen.js';
import { hoy, diasEntre } from '../util/fechas.js';

export function crearRespaldo() {
  return { app: 'agenda', formato: 'agenda5', version: 1, exportadoEn: new Date().toISOString(), datos: documento() };
}

export function guardarArchivo(texto, nombre, tipo = 'application/json') {
  const blob = new Blob([texto], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function descargarRespaldo() {
  guardarArchivo(JSON.stringify(crearRespaldo(), null, 1), 'agenda_respaldo_' + hoy() + '.json');
  escribir(CLAVES.respaldoUlt, Date.now());
}

export function diasSinRespaldo() {
  const ult = +leer(CLAVES.respaldoUlt, 0);
  const d = documento();
  const desde = ult || (d && d.creado) || Date.now();
  const iso = hoy(new Date(desde));   // la fecha de Lima de ese momento
  return { dias: Math.max(0, diasEntre(iso, hoy())), nunca: !ult, ult };
}
export const DIAS_AVISO_RESPALDO = 7;
export function tocaRespaldar() { const r = diasSinRespaldo(); return r.dias > DIAS_AVISO_RESPALDO || (r.nunca && r.dias >= 1); }

/* Lee un archivo y dice qué es, sin cambiar nada todavía */
export function analizarArchivo(texto, nombre = '') {
  let j;
  try { j = JSON.parse(texto); } catch (e) { return { ok: false, error: 'El archivo no es un respaldo válido (no se pudo leer).' }; }
  if (!j || typeof j !== 'object') return { ok: false, error: 'El archivo está vacío o no es un respaldo.' };

  if (j.formato === 'agenda5') {
    const doc = normalizarDoc(j.datos);
    if (!doc) return { ok: false, error: 'El respaldo de la v5 está dañado.' };
    return { ok: true, tipo: 'Respaldo de la Agenda 5', fecha: j.exportadoEn, doc, conteo: contar(doc) };
  }
  let antiguo = null, tipo = '';
  if (j.app === 'agenda' && (j.agenda || j.cuentas || j.oficina)) { antiguo = { datos: j.agenda || null, libroPersonal: j.cuentas || null, libroOficina: j.oficina || null }; tipo = 'Respaldo completo de la versión anterior (v4.5)'; }
  else if (Array.isArray(j.tareas) || Array.isArray(j.notas) || Array.isArray(j.eventos)) { antiguo = { datos: j, libroPersonal: null, libroOficina: null }; tipo = 'Respaldo de la agenda anterior (sin cuentas)'; }
  else if (Array.isArray(j) || Array.isArray(j.transactions)) {
    const ofi = /oficina/i.test(nombre);
    antiguo = { datos: null, libroPersonal: ofi ? null : j, libroOficina: ofi ? j : null };
    tipo = 'Libro de cuentas ' + (ofi ? 'de la oficina' : 'personal') + ' (versión anterior)';
  }
  if (!antiguo) return { ok: false, error: 'No reconozco este archivo. Debe ser un respaldo de la Agenda (nuevo o anterior).' };
  const doc = migrar(antiguo);
  const v = verificar(antiguo, doc);
  if (!v.ok) return { ok: false, error: 'El respaldo antiguo no se pudo convertir sin pérdidas, así que no se importó.', problemas: v.problemas };
  doc.migracion.verificacion = v;
  return { ok: true, tipo, fecha: j.exportadoEn || null, doc, conteo: contar(doc) };
}

function contar(doc) {
  const c = {};
  doc.items.forEach((x) => { if (!x.borrado && !(x.extra && x.extra.sistema)) c[x.tipo] = (c[x.tipo] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a]).map((k) => [TIPOS_PLURAL[k] || k, c[k]]);
}

/* Importa lo analizado: copia de seguridad primero, luego junta */
export async function importar(analisis) {
  let copia = null;
  try { copia = await guardarCopia('antes-de-importar', crearRespaldo(), analisis.tipo); }
  catch (e) { return { ok: false, error: 'No se pudo guardar la copia previa, así que no importé nada. (' + (e.message || e) + ')' }; }
  const r = juntarDocumento(analisis.doc);
  return { ok: true, nuevos: r.nuevos, actualizados: r.actualizados, copia };
}
