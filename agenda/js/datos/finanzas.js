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

/* Días que tiene un mes «aaaa-mm» */
export const diasDelMes = (ym) => new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate();
const gastosEntre = (movs, desde, hasta) => movs.filter((x) => !esIngreso(x) && esFecha(x.fechas && x.fechas.inicio) && x.fechas.inicio >= desde && x.fechas.inicio <= hasta).reduce((s, x) => s + Math.abs(+x.monto || 0), 0);

/* Cómo vas en el mes: comparado con el mes pasado AL MISMO DÍA, el gasto más
   grande, a cuánto llegarías si sigues así, cuánto puedes gastar por día para
   no pasarte del presupuesto y lo gastado en la semana (desde «lunes»).
   Si «ym» ya pasó, compara meses completos y no proyecta. */
export function analisisMes(movs, ym, hoyStr, presupuesto = 0, lunes = null) {
  const actual = hoyStr.slice(0, 7) === ym, total = diasDelMes(ym);
  const dia = actual ? +hoyStr.slice(8) : total;
  const [y, m] = ym.split('-').map(Number), ant = (m === 1 ? y - 1 : y) + '-' + String(m === 1 ? 12 : m - 1).padStart(2, '0');
  const diaAnt = Math.min(dia, diasDelMes(ant));
  const ahora = gastosEntre(movs, ym + '-01', ym + '-' + String(dia).padStart(2, '0'));
  const antes = gastosEntre(movs, ant + '-01', ant + '-' + String(diaAnt).padStart(2, '0'));
  const gastos = movs.filter((x) => delMes(x, ym) && !esIngreso(x));
  const mayor = gastos.reduce((a, x) => (!a || Math.abs(+x.monto || 0) > Math.abs(+a.monto || 0) ? x : a), null);
  const r = { dia, total, ahora, antes, dif: ahora - antes, pct: antes ? Math.round((ahora - antes) / antes * 100) : null, mayor, actual, proyeccion: null, porDia: null, semana: null, quedan: total - dia + 1 };
  if (actual) {
    /* los pagos fijos y los gastos grandes (S/ 300 o más y al menos el 30 % de
       lo gastado) se cuentan una vez: solo se proyecta lo del día a día */
    const unaVez = gastos.filter((x) => x.fechas.inicio <= hoyStr && ((x.extra && x.extra.pago) || (Math.abs(+x.monto || 0) >= 30000 && Math.abs(+x.monto || 0) >= ahora * 0.3))).reduce((s, x) => s + Math.abs(+x.monto || 0), 0);
    const fijos = Math.min(ahora, unaVez);
    r.proyeccion = dia >= 5 ? fijos + Math.round((ahora - fijos) / dia * total) : null;
    if (+presupuesto > 0) r.porDia = Math.max(0, Math.floor((presupuesto - ahora) / r.quedan));
    if (lunes) r.semana = gastosEntre(movs, lunes, hoyStr);
  }
  return r;
}

/* Gastos que se repiten cada mes (mismo nombre en 2 de los últimos 3 meses)
   y que aún no son pago fijo: candidatos a «pago fijo» */
const clave = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
export function repetidos(movs, ym, titulosPagos = []) {
  const meses = mesesAtras(ym, 3), ya = new Set(titulosPagos.map(clave)), g = {};
  movs.filter((x) => !esIngreso(x) && !(x.extra && (x.extra.pago || x.extra.desde)) && meses.some((k) => delMes(x, k))).forEach((x) => {
    const k = clave(x.titulo); if (k.length < 3 || ya.has(k)) return;
    const e = g[k] || (g[k] = { titulo: x.titulo, meses: new Set(), ultimo: x });
    e.meses.add(x.fechas.inicio.slice(0, 7));
    if (x.fechas.inicio >= e.ultimo.fechas.inicio) e.ultimo = x;
  });
  return Object.values(g).filter((e) => e.meses.size >= 2 && (e.meses.has(meses[2]) || e.meses.has(meses[1])))
    .map((e) => ({ titulo: e.ultimo.titulo, monto: Math.abs(+e.ultimo.monto || 0), cat: (e.ultimo.extra && e.ultimo.extra.categoria) || '', dia: +e.ultimo.fechas.inicio.slice(8), meses: e.meses.size, area: e.ultimo.area }))
    .sort((a, b) => b.monto - a.monto);
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
