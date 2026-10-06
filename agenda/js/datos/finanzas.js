/* FINANZAS: cálculos puros de los dos libros (personal y oficina), que
   nunca se mezclan. Todo en céntimos enteros. */
import { esFecha } from '../util/fechas.js';

export const LIBROS = { personal: 'Libro personal', oficina: 'Libro de la oficina' };
export const CATEGORIAS = {
  personal: { gasto: ['Comida', 'Casa', 'Servicios', 'Transporte', 'Salud', 'Estudios', 'Deporte', 'Ropa', 'Ocio', 'Préstamos', 'Otros'], ingreso: ['Sueldo', 'Extra', 'Préstamos', 'Regalo', 'Otros'] },
  oficina: { gasto: ['Insumos', 'Servicios', 'Alquiler', 'Personal', 'Impuestos', 'Transporte', 'Otros'], ingreso: ['Ventas', 'Honorarios', 'Otros'] }
};
/* Área de un gasto personal según su categoría (Estudios → Estudios…) */
export function areaDeCategoria(cat) {
  const c = String(cat || '').toLowerCase();
  if (/estudi|curso|univers|libro|matr[ií]cula|pensi[oó]n/.test(c)) return 'estudios';
  if (/deport|gym|gimnas|f[uú]tbol|cancha|pichanga/.test(c)) return 'deporte';
  return 'personal';
}

export const esDelLibro = (x, libro) => x.tipo === 'movimiento' && ((x.extra && x.extra.libro) || 'personal') === libro;
export const esIngreso = (x) => !!(x.extra && x.extra.ingreso);
export const delMes = (x, ym) => esFecha(x.fechas && x.fechas.inicio) && x.fechas.inicio.startsWith(ym);

/* Un mes de un libro: ingresos, gastos, saldo, por categoría y por área */
export function resumenMes(movs, ym) {
  const r = { ingresos: 0, gastos: 0, saldo: 0, n: 0, porCategoria: [], porArea: {} }, cats = {};
  movs.filter((x) => delMes(x, ym)).forEach((x) => {
    const m = Math.abs(+x.monto || 0); r.n++;
    if (esIngreso(x)) { r.ingresos += m; return; }
    r.gastos += m;
    const c = (x.extra && x.extra.categoria) || 'Sin categoría';
    cats[c] = (cats[c] || 0) + m;
    r.porArea[x.area] = (r.porArea[x.area] || 0) + m;
  });
  r.saldo = r.ingresos - r.gastos;
  r.porCategoria = Object.entries(cats).map(([cat, monto]) => ({ cat, monto, pct: r.gastos ? Math.round(monto / r.gastos * 100) : 0 })).sort((a, b) => b.monto - a.monto);
  return r;
}
/* Los últimos n meses hasta «ym» (incluido), del más antiguo al más nuevo */
export function mesesAtras(ym, n) {
  let [y, m] = ym.split('-').map(Number); const out = [];
  for (let i = 0; i < n; i++) { out.unshift(y + '-' + String(m).padStart(2, '0')); m--; if (m < 1) { m = 12; y--; } }
  return out;
}
export function historial(movs, ym, n = 6) { return mesesAtras(ym, n).map((k) => Object.assign({ ym: k }, resumenMes(movs, k))); }
/* Presupuesto mensual de gastos: nivel ok / pronto (≥ 85 %) / vencido (pasado) */
export function estadoPresupuesto(gastos, presupuesto) {
  if (!(+presupuesto > 0)) return null;
  const pct = Math.round(gastos / presupuesto * 100);
  return { pct, queda: presupuesto - gastos, nivel: pct > 100 ? 'vencido' : pct >= 85 ? 'pronto' : 'ok' };
}
/* CSV para Excel/Sheets: fecha, tipo, descripción, categoría, área, monto en soles */
export function csv(movs) {
  const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const filas = movs.slice().sort((a, b) => (a.fechas.inicio || '').localeCompare(b.fechas.inicio || '')).map((x) =>
    [x.fechas.inicio || '', esIngreso(x) ? 'Ingreso' : 'Gasto', x.titulo, (x.extra && x.extra.categoria) || '', x.area, ((esIngreso(x) ? 1 : -1) * Math.abs(+x.monto || 0) / 100).toFixed(2)].map(q).join(','));
  return '﻿' + ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Área', 'Monto (S/)'].map(q).join(',') + '\r\n' + filas.join('\r\n') + '\r\n';
}

/* ---------- Notas con casillas ----------
   Una línea «[ ] algo» o «- [x] algo» es una casilla que se marca tocándola. */
const RE_CASILLA = /^(\s*(?:[-*•]\s*)?)\[( |x|X)\]\s?(.*)$/;
export function lineasNota(texto) {
  return String(texto || '').split('\n').map((l) => { const m = l.match(RE_CASILLA); return m ? { casilla: true, ok: m[2].toLowerCase() === 'x', t: m[3] } : { casilla: false, t: l }; });
}
export function alternarCasilla(texto, i) {
  const ls = String(texto || '').split('\n'), m = ls[i] && ls[i].match(RE_CASILLA);
  if (!m) return texto;
  ls[i] = m[1] + '[' + (m[2] === ' ' ? 'x' : ' ') + '] ' + m[3];
  return ls.join('\n');
}
/* Racha del diario: días seguidos con algo escrito o un ánimo */
export function rachaDiario(dias, hoy, sumarDias) {
  const s = new Set(dias); let n = 0, d = s.has(hoy) ? hoy : sumarDias(hoy, -1);
  while (s.has(d) && n < 3650) { n++; d = sumarDias(d, -1); }
  return n;
}
