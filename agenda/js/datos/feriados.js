/* FERIADOS NACIONALES DEL PERÚ (calendario oficial vigente).
   Fijos + Jueves y Viernes Santo, que dependen de la Pascua de cada año.
   Si el Gobierno declara un feriado nuevo o un día no laborable, se agrega aquí. */
import { sumarDias } from '../util/fechas.js';

const FIJOS = {
  '01-01': 'Año Nuevo',
  '05-01': 'Día del Trabajo',
  '06-07': 'Batalla de Arica y Día de la Bandera',
  '06-29': 'San Pedro y San Pablo',
  '07-23': 'Día de la Fuerza Aérea del Perú',
  '07-28': 'Fiestas Patrias',
  '07-29': 'Fiestas Patrias',
  '08-06': 'Batalla de Junín',
  '08-30': 'Santa Rosa de Lima',
  '10-08': 'Combate de Angamos',
  '11-01': 'Día de Todos los Santos',
  '12-08': 'Inmaculada Concepción',
  '12-09': 'Batalla de Ayacucho',
  '12-25': 'Navidad'
};

/* Domingo de Pascua (algoritmo de Gauss/Butcher) */
export function pascua(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return y + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}

const cache = {};
function delAnio(y) {
  if (cache[y]) return cache[y];
  const r = {};
  Object.keys(FIJOS).forEach((k) => { r[y + '-' + k] = FIJOS[k]; });
  const p = pascua(y);
  r[sumarDias(p, -3)] = 'Jueves Santo';
  r[sumarDias(p, -2)] = 'Viernes Santo';
  return (cache[y] = r);
}
export function feriado(dia) { return delAnio(+String(dia).slice(0, 4))[dia] || ''; }
