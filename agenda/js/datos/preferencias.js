/* Preferencias de este aparato (tema, formato de hora, semana, vigilia…).
   La primera vez se toman de la v4.5 lo que ya habías elegido (tema y día de
   inicio de semana); desde ahí viven en «agenda5_pref». */
import { leer, escribir, CLAVES, ANTIGUAS } from './almacen.js';
import { esHora } from '../util/fechas.js';

export const PANTALLAS_INICIO = [['hoy', 'Hoy'], ['recordatorios', 'Recordatorios'], ['agenda', 'Agenda'], ['areas', 'Áreas']];
export const OPCIONES_BLOQUEO = [[0, 'Solo al abrir'], [1, 'Tras 1 minuto'], [5, 'Tras 5 minutos'], [15, 'Tras 15 minutos'], [30, 'Tras 30 minutos']];

const BASE = {
  v: 1,
  tema: 'auto',            // 'auto' | 'oscuro' | 'claro'
  formatoHora: '24',       // '24' | '12'
  semanaLunes: true,
  vigilia: { ini: '06:00', fin: '22:00' },
  inicio: 'hoy',
  bloqueoMin: 1,           // minutos de inactividad antes de pedir el PIN
  guia: false,
  tourVisto: false
};

function desdeAntiguas() {
  const p = Object.assign({}, BASE, { vigilia: Object.assign({}, BASE.vigilia) });
  const viejaPref = leer(ANTIGUAS.pref, {}) || {};
  let tema = null;
  try { tema = localStorage.getItem(ANTIGUAS.tema); } catch (e) { tema = null; }
  if (viejaPref.temaAuto) p.tema = 'auto';
  else if (tema === 'claro' || tema === 'oscuro') p.tema = tema;
  if (typeof viejaPref.lunes === 'boolean') p.semanaLunes = viejaPref.lunes;
  return p;
}

/* Corrige lo que venga mal (a mano, de otra versión…) sin perder lo bueno */
export function normalizarPref(x) {
  const p = Object.assign({}, BASE, x && typeof x === 'object' ? x : {});
  if (!['auto', 'oscuro', 'claro'].includes(p.tema)) p.tema = 'auto';
  if (!['24', '12'].includes(String(p.formatoHora))) p.formatoHora = '24';
  p.formatoHora = String(p.formatoHora);
  p.semanaLunes = p.semanaLunes !== false;
  const v = p.vigilia && typeof p.vigilia === 'object' ? p.vigilia : {};
  p.vigilia = { ini: esHora(v.ini) ? v.ini : BASE.vigilia.ini, fin: esHora(v.fin) ? v.fin : BASE.vigilia.fin };
  if (!PANTALLAS_INICIO.some((o) => o[0] === p.inicio)) p.inicio = 'hoy';
  if (!OPCIONES_BLOQUEO.some((o) => o[0] === +p.bloqueoMin)) p.bloqueoMin = 1;
  p.bloqueoMin = +p.bloqueoMin;
  p.guia = !!p.guia; p.tourVisto = !!p.tourVisto;
  return p;
}

let pref = normalizarPref(leer(CLAVES.pref, null) || desdeAntiguas());
const oyentes = [];

export function preferencias() { return pref; }
export function cambiarPref(cambios) {
  pref = normalizarPref(Object.assign({}, pref, cambios));
  escribir(CLAVES.pref, pref);
  oyentes.forEach((f) => f(pref));
  return pref;
}
export function alCambiarPref(fn) { oyentes.push(fn); }

/* Minutos despierto (para el balance y el aviso de sobrecarga) */
export function minutosVigilia(p = pref) {
  const a = p.vigilia.ini.split(':').map(Number), b = p.vigilia.fin.split(':').map(Number);
  let m = (b[0] * 60 + b[1]) - (a[0] * 60 + a[1]);
  if (m <= 0) m += 1440;
  return m;
}
