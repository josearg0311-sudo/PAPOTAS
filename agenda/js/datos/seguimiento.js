/* SEGUIMIENTO: cálculos puros de hábitos, metas y la semana (se prueban
   sin pantalla). Los hábitos guardan sus días hechos en extra.marcas
   { 'AAAA-MM-DD': 1 }, igual que la v4.5. */
import { sumarDias, diasEntre, diaSemana, esFecha } from '../util/fechas.js';

const DIAS_TODOS = [0, 1, 2, 3, 4, 5, 6];
export const diasHabito = (h) => (h.extra && Array.isArray(h.extra.dias) && h.extra.dias.length ? h.extra.dias.map(Number) : DIAS_TODOS);
export const marcasHabito = (h) => (h.extra && h.extra.marcas) || (h.datos && h.datos.marcas) || {};
export const tocaHabito = (h, dia) => diasHabito(h).includes(diaSemana(dia));

/* Racha: días seguidos (de los que tocan) en que lo hiciste. Hoy no rompe
   la racha mientras aún se pueda hacer. */
export function rachaHabito(h, hoy) {
  const m = marcasHabito(h);
  let n = 0, d = tocaHabito(h, hoy) && !m[hoy] ? sumarDias(hoy, -1) : hoy;
  for (let i = 0; i < 1000; i++) {
    if (tocaHabito(h, d)) { if (m[d]) n++; else break; }
    d = sumarDias(d, -1);
  }
  return n;
}
/* % de cumplimiento en los últimos «dias» (sin contar antes de crearlo) */
export function cumplimiento(h, hoy, dias = 30, creado = '') {
  const m = marcasHabito(h);
  let toca = 0, hechos = 0;
  for (let i = 0; i < dias; i++) {
    const d = sumarDias(hoy, -i);
    if (creado && d < creado) break;
    if (d === hoy && !m[d]) continue;            // hoy aún no cuenta en contra
    if (tocaHabito(h, d)) { toca++; if (m[d]) hechos++; }
  }
  return toca ? Math.round(hechos / toca * 100) : null;
}
/* Los 7 días de una semana: 'si' | 'no' | 'libre' (no toca) | 'futuro' */
export function semanaHabito(h, ini, hoy) {
  const m = marcasHabito(h);
  return Array.from({ length: 7 }, (_, i) => { const d = sumarDias(ini, i);
    return !tocaHabito(h, d) ? 'libre' : m[d] ? 'si' : d > hoy ? 'futuro' : d === hoy ? 'hoy' : 'no'; });
}

/* ---------- Metas ----------
   Manual: extra.actual. Automáticas (cada área la suya): se suman los
   registros desde extra.desde. registros = [{ fecha, valor }] */
export function sumaDesde(registros, desde) { return registros.filter((r) => esFecha(r.fecha) && (!desde || r.fecha >= desde)).reduce((s, r) => s + (+r.valor || 0), 0); }
export function progresoMeta({ actual, objetivo, inicial = 0, baja = false }) {
  const obj = +objetivo || 0, act = +actual || 0;
  if (baja) {   // metas que bajan (peso): de «inicial» hacia «objetivo»
    const total = inicial - obj, hecho = inicial - act;
    return { actual: act, objetivo: obj, pct: total > 0 ? Math.max(0, Math.min(100, Math.round(hecho / total * 100))) : act <= obj ? 100 : 0, logrado: act <= obj };
  }
  return { actual: act, objetivo: obj, pct: obj > 0 ? Math.max(0, Math.min(100, Math.round(act / obj * 100))) : 0, logrado: obj > 0 && act >= obj };
}
/* Cuánto falta por semana para llegar a tiempo */
export function ritmoMeta(p, vence, hoy, baja = false) {
  if (!esFecha(vence) || p.logrado) return null;
  const dias = diasEntre(hoy, vence), falta = baja ? p.actual - p.objetivo : p.objetivo - p.actual;
  if (dias < 0) return { vencida: true, falta };
  const semanas = Math.max(1, dias / 7);
  return { vencida: false, falta, porSemana: falta / semanas, dias };
}

/* ---------- Semana ---------- */
export const diasDeSemana = (ini) => Array.from({ length: 7 }, (_, i) => sumarDias(ini, i));
/* Área descuidada: la que no tuvo ni tiempo planificado, ni foco, ni nada hecho */
export function descuidadas(porArea) {
  return Object.entries(porArea).filter(([, v]) => !v.min && !v.foco && !v.hechos && !v.habitosHechos).map(([k]) => k);
}
/* Semana que toca revisar: del viernes al cierre de la semana, la actual; si
   la semana recién empieza, la anterior */
export function semanaARevisar(hoy, iniActual, lunes = true) {
  const d = diaSemana(hoy), cierre = d >= 5 || (lunes && d === 0);
  return cierre ? iniActual : sumarDias(iniActual, -7);
}
