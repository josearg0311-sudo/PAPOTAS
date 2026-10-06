/* Fechas y horas, siempre en la hora de Lima (America/Lima).
   Internamente una fecha es el texto 'AAAA-MM-DD' y una hora 'HH:MM' (24 h):
   se comparan como texto y no hay zonas horarias que se cuelen. Lo que ve la
   persona sale de las funciones fmt*: dd/mm/aaaa, «lun 5 oct» y 24 h o 12 h. */

export const ZONA = 'America/Lima';
export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const DIAS3 = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
export const MESES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];

const dos = (n) => (n < 10 ? '0' : '') + n;
let lector = null;
try {
  lector = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  });
} catch (e) { lector = null; }

/* Las partes de un instante en la hora de Lima. Sin soporte de zonas
   (navegadores muy viejos) se usa la del aparato. */
export function partesLima(instante = new Date()) {
  if (lector) {
    const p = {};
    lector.formatToParts(instante).forEach((x) => { p[x.type] = x.value; });
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second };
  }
  const d = instante;
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes(), s: d.getSeconds() };
}

export function hoy(instante) { const p = partesLima(instante); return p.y + '-' + dos(p.m) + '-' + dos(p.d); }
export function horaAhora(instante) { const p = partesLima(instante); return dos(p.h) + ':' + dos(p.mi); }
export function minutosAhora(instante) { const p = partesLima(instante); return p.h * 60 + p.mi; }

export function esFecha(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false;
  const [y, m, d] = s.split('-').map(Number);
  const f = new Date(Date.UTC(y, m - 1, d));
  return f.getUTCFullYear() === y && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}
export function esHora(s) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s || '')); }

/* Aritmética de calendario en UTC al mediodía: inmune a cambios de hora */
function aUTC(s) { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); }
function deUTC(f) { return f.getUTCFullYear() + '-' + dos(f.getUTCMonth() + 1) + '-' + dos(f.getUTCDate()); }
export function sumarDias(s, n) { const f = aUTC(s); f.setUTCDate(f.getUTCDate() + n); return deUTC(f); }
export function diasEntre(a, b) { return Math.round((aUTC(b) - aUTC(a)) / 864e5); }
export function diaSemana(s) { return aUTC(s).getUTCDay(); }
export function inicioSemana(s, empiezaLunes = true) {
  const w = diaSemana(s);
  return sumarDias(s, -(empiezaLunes ? (w + 6) % 7 : w));
}

/* ---------- Para mostrar ---------- */
export function fmtFecha(s) {           // 06/10/2026
  if (!esFecha(s)) return '';
  const [y, m, d] = s.split('-');
  return d + '/' + m + '/' + y;
}
export function fmtCorta(s, conAnio) {  // lun 5 oct  (y el año si no es este)
  if (!esFecha(s)) return '';
  const f = aUTC(s);
  let t = DIAS3[f.getUTCDay()] + ' ' + f.getUTCDate() + ' ' + MESES3[f.getUTCMonth()];
  if (conAnio === true || (conAnio !== false && f.getUTCFullYear() !== partesLima().y)) t += ' ' + f.getUTCFullYear();
  return t;
}
export function fmtLarga(s) {           // lunes 5 de octubre
  if (!esFecha(s)) return '';
  const f = aUTC(s);
  return DIAS[f.getUTCDay()] + ' ' + f.getUTCDate() + ' de ' + MESES[f.getUTCMonth()];
}
export function fmtHora(h, formato = '24') {   // '14:30' → 14:30 o 2:30 p. m.
  if (!esHora(h)) return '';
  if (formato !== '12') return h;
  let [hh, mm] = h.split(':').map(Number);
  const suf = hh < 12 ? 'a. m.' : 'p. m.';
  hh = hh % 12 || 12;
  return hh + ':' + dos(mm) + ' ' + suf;
}
/* «Hoy», «Mañana», «Ayer», «Jueves» (dentro de la semana) o «lun 5 oct» */
export function relativo(s, desde = hoy()) {
  if (!esFecha(s)) return '';
  const n = diasEntre(desde, s);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  if (n > 1 && n < 7) return DIAS[diaSemana(s)].replace(/^./, (c) => c.toUpperCase());
  return fmtCorta(s);
}

/* Plazos: 🔴 vencido, ⚠️ vence en 3 días o menos */
export const DIAS_AVISO_PLAZO = 3;
export function plazo(vence, desde = hoy()) {
  if (!esFecha(vence)) return { nivel: 'sin', dias: null, texto: '' };
  const n = diasEntre(desde, vence);
  if (n < 0) return { nivel: 'vencido', dias: n, texto: 'vencido · ' + fmtCorta(vence) };
  if (n === 0) return { nivel: 'pronto', dias: 0, texto: 'vence hoy' };
  if (n <= DIAS_AVISO_PLAZO) return { nivel: 'pronto', dias: n, texto: 'vence en ' + n + (n === 1 ? ' día' : ' días') };
  return { nivel: 'ok', dias: n, texto: fmtCorta(vence) };
}

export function saludo(instante) {
  const h = partesLima(instante).h;
  return h < 5 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}
