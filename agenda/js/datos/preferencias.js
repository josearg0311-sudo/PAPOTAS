/* Preferencias de este aparato (tema, formato de hora, semana, vigilia…).
   La primera vez se toman de la v4.5 lo que ya habías elegido (tema y día de
   inicio de semana); desde ahí viven en «agenda5_pref». */
import { leer, escribir, CLAVES, ANTIGUAS } from './almacen.js';
import { esHora } from '../util/fechas.js';

export const PANTALLAS_INICIO = [['hoy', 'Hoy'], ['calendario', 'Calendario'], ['tareas', 'Tareas'], ['cuentas', 'Cuentas']];
/* Lo que se elegía antes (Agenda 6 y anteriores) → su lugar nuevo */
const INICIO_VIEJO = { recordatorios: 'tareas', listas: 'tareas', agenda: 'calendario', plan: 'calendario', plata: 'cuentas', finanzas: 'cuentas', areas: 'hoy' };
export const OPCIONES_BLOQUEO = [[0, 'Solo al abrir'], [1, 'Tras 1 minuto'], [5, 'Tras 5 minutos'], [15, 'Tras 15 minutos'], [30, 'Tras 30 minutos']];

const BASE = {
  v: 1,
  tema: 'oscuro',          // 'auto' | 'oscuro' | 'claro' · oscuro siempre por defecto (preferencia del usuario)
  formatoHora: '24',       // '24' | '12'
  semanaLunes: true,
  vigilia: { ini: '06:00', fin: '22:00' },
  inicio: 'hoy',
  bloqueoMin: 1,           // minutos de inactividad antes de pedir el PIN
  guia: false,
  completo: false,         // false = modo simple (solo lo esencial); true = todo
  sonido: true,
  feriados: true,
  deporte: { meta: 3, avisoDias: 3 },   // entrenos por semana y días sin entrenar antes de avisar
  teclado: { activo: true, corrector: true, signos: true, grande: false, vibrar: true },   // teclado propio (Fase 9)
  tourVisto: false
};

function desdeAntiguas() {
  const p = Object.assign({}, BASE, { vigilia: Object.assign({}, BASE.vigilia) });
  const viejaPref = leer(ANTIGUAS.pref, {}) || {};
  /* El tema NO se toma de la v4.5: el usuario quiere la Agenda oscura siempre (claro solo si lo elige en Ajustes) */
  if (typeof viejaPref.lunes === 'boolean') p.semanaLunes = viejaPref.lunes;
  return p;
}

/* Corrige lo que venga mal (a mano, de otra versión…) sin perder lo bueno */
export function normalizarPref(x) {
  const p = Object.assign({}, BASE, x && typeof x === 'object' ? x : {});
  if (!['auto', 'oscuro', 'claro'].includes(p.tema)) p.tema = 'oscuro';
  if (!['24', '12'].includes(String(p.formatoHora))) p.formatoHora = '24';
  p.formatoHora = String(p.formatoHora);
  p.semanaLunes = p.semanaLunes !== false;
  const v = p.vigilia && typeof p.vigilia === 'object' ? p.vigilia : {};
  p.vigilia = { ini: esHora(v.ini) ? v.ini : BASE.vigilia.ini, fin: esHora(v.fin) ? v.fin : BASE.vigilia.fin };
  if (INICIO_VIEJO[p.inicio]) p.inicio = INICIO_VIEJO[p.inicio];
  if (!PANTALLAS_INICIO.some((o) => o[0] === p.inicio)) p.inicio = 'hoy';
  if (!OPCIONES_BLOQUEO.some((o) => o[0] === +p.bloqueoMin)) p.bloqueoMin = 1;
  p.bloqueoMin = +p.bloqueoMin;
  p.guia = !!p.guia; p.completo = false;   // Agenda 7: ya no hay «Mostrar todo»; lo avanzado vive como herramienta en su sección
  p.tourVisto = !!p.tourVisto; p.sonido = p.sonido !== false; p.feriados = p.feriados !== false;
  const dp = p.deporte && typeof p.deporte === 'object' ? p.deporte : {};
  /* Teclado: si no estaba, se toma lo que tenías en la v4.5 (teclado y autocorrector) */
  const tk = x && x.teclado && typeof x.teclado === 'object' ? x.teclado : (() => { const v = leer(ANTIGUAS.pref, {}) || {}; return { activo: v.teclado !== false, corrector: v.autocorr !== false }; })();
  p.teclado = { activo: tk.activo !== false, corrector: tk.corrector !== false, signos: tk.signos !== false, grande: !!tk.grande, vibrar: tk.vibrar !== false };
  p.deporte = { meta: Math.min(7, Math.max(1, +dp.meta || 3)), avisoDias: [0, 2, 3, 4, 5, 7].includes(+dp.avisoDias) ? +dp.avisoDias : 3, talla: +dp.talla >= 100 && +dp.talla <= 230 ? +dp.talla : 0 };
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
