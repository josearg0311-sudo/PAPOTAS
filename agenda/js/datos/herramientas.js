/* HERRAMIENTAS DE CADA ÁREA: cálculos puros (sin pantalla) para que se
   puedan probar. Lo que vino de la v4.5 sigue en «datos» tal cual; lo que
   se edita en la v5 se guarda en «extra». val() lee primero lo nuevo. */
import { sumarDias, diasEntre, inicioSemana, diaSemana, esFecha } from '../util/fechas.js';
import { aCentimos } from '../util/dinero.js';

export function val(x, k, def) {
  if (x && x.extra && x.extra[k] !== undefined) return x.extra[k];
  if (x && x.datos && x.datos[k] !== undefined) return x.datos[k];
  return def;
}
/* Lista (arreglo) guardada con otro nombre en la v4.5: p. ej. las notas de
   un curso estaban en datos.notas y en la v5 son extra.evaluaciones */
export function lista(x, nuevo, viejo = nuevo) {
  const a = x && x.extra && Array.isArray(x.extra[nuevo]) ? x.extra[nuevo] : x && x.datos && Array.isArray(x.datos[viejo]) ? x.datos[viejo] : [];
  return a;
}

/* ---------- PERSONAL ---------- */
/* Casa: cada cuántos días toca y cuándo fue la última vez */
export function casaEstado(c, hoy) {
  const cada = Math.max(1, +val(c, 'cada', 7) || 7), ult = esFecha(val(c, 'ult', '')) ? val(c, 'ult', '') : '';
  const prox = ult ? sumarDias(ult, cada) : hoy, dias = diasEntre(hoy, prox);
  return { cada, ult, prox, dias, nivel: dias < 0 ? 'vencido' : dias === 0 ? 'hoy' : dias <= 2 ? 'pronto' : 'ok' };
}

/* Cumpleaños: la próxima fecha y cuántos cumple */
export function proximoCumple(e, hoy) {
  const f = e.fechas && e.fechas.inicio;
  if (!esFecha(f)) return null;
  const [y0, m, d] = f.split('-').map(Number), y = +hoy.slice(0, 4);
  const en = (yy) => { const fin = new Date(Date.UTC(yy, m, 0)).getUTCDate(); return yy + '-' + String(m).padStart(2, '0') + '-' + String(Math.min(d, fin)).padStart(2, '0'); };
  let prox = en(y); if (prox < hoy) prox = en(y + 1);
  const nacio = +val(e, 'nacio', 0) || (y0 < +String(new Date(e.creado || Date.now()).getUTCFullYear()) ? y0 : 0);
  return { fecha: prox, dias: diasEntre(hoy, prox), edad: nacio ? +prox.slice(0, 4) - nacio : null };
}

/* Préstamos: cuánto te deben y cuánto debes (céntimos) */
export function resumenPrestamos(l) {
  const r = { meDeben: 0, debo: 0, nMe: 0, nYo: 0 };
  l.filter((x) => x.estado !== 'hecho').forEach((x) => { if (val(x, 'meDeben', false)) { r.meDeben += +x.monto || 0; r.nMe++; } else { r.debo += +x.monto || 0; r.nYo++; } });
  return r;
}

/* ---------- ESTUDIOS ---------- */
/* Notas vigesimales: con pesos si todas los tienen; aprueba con 10.5 */
export function promedio(evals) {
  const ns = (evals || []).filter((x) => x && x.v !== '' && x.v != null && isFinite(+x.v));
  if (!ns.length) return null;
  const conPeso = ns.every((x) => +x.p > 0);
  let s = 0, p = 0;
  ns.forEach((x) => { const w = conPeso ? +x.p : 1; s += +x.v * w; p += w; });
  return p ? s / p : null;
}
export const APRUEBA = 10.5;
export function faltas(c) {
  const f = +val(c, 'faltas', 0) || 0, max = +val(c, 'maxFaltas', 0) || 0;
  return { f, max, quedan: max ? max - f : null, nivel: !max ? 'ok' : f >= max ? 'vencido' : max - f <= 1 ? 'pronto' : 'ok' };
}

/* Sesiones de estudio para un examen: reparte los temas que faltan entre
   los días que quedan (desde «desde» hasta la víspera) y deja la víspera
   para repaso general. Devuelve [{ fecha, temas:[…], repaso }] */
export function planSesiones({ desde, examen, temas, maxDias = 14 }) {
  if (!esFecha(desde) || !esFecha(examen) || examen <= desde) return [];
  const total = Math.min(diasEntre(desde, examen), maxDias), dias = [];
  for (let i = 0; i < total; i++) dias.push(sumarDias(examen, -total + i));
  const faltan = (temas || []).filter(Boolean);
  if (!faltan.length) return dias.slice(-1).map((f) => ({ fecha: f, temas: [], repaso: true }));
  const paraTemas = dias.length > 1 ? dias.slice(0, -1) : dias;
  const plan = paraTemas.map((f) => ({ fecha: f, temas: [], repaso: false }));
  /* reparto parejo (si hay más días que temas, quedan días libres entre medio) */
  const n = plan.length, k = faltan.length;
  faltan.forEach((t, i) => plan[k > n ? Math.floor(i * n / k) : k === 1 ? 0 : Math.round(i * (n - 1) / (k - 1))].temas.push(t));
  const out = plan.filter((p) => p.temas.length);
  if (dias.length > 1) out.push({ fecha: dias[dias.length - 1], temas: [], repaso: true });
  return out;
}

/* Fichas (sistema Leitner, igual que la v4.5): caja 1 a 5 */
export const CAJAS = [1, 2, 4, 8, 16];
export function responderFicha(f, sabia, hoy) {
  const caja = sabia ? Math.min(5, (+val(f, 'caja', 1) || 1) + 1) : 1;
  return { caja, prox: sumarDias(hoy, sabia ? CAJAS[caja - 1] : 1) };
}
export function fichaToca(f, hoy) { const p = val(f, 'prox', ''); return !p || p <= hoy; }

/* ---------- OFICINA ---------- */
/* Tarifa por hora en céntimos (la v4.5 la guardaba en soles) */
export function tarifa(h) { return h.extra && h.extra.tarifa !== undefined ? +h.extra.tarifa || 0 : aCentimos(+(h.datos && h.datos.tarifa) || 0); }
export function montoHoras(h) { return Math.round((+val(h, 'minutos', 0) || +val(h, 'min', 0) || 0) / 60 * tarifa(h)); }
export function resumenHoras(l, ym) {
  const r = { min: 0, monto: 0, porCliente: {} };
  l.filter((h) => !ym || String(h.fechas.inicio || '').startsWith(ym)).forEach((h) => {
    const m = +val(h, 'minutos', 0) || 0, c = val(h, 'cliente', '') || 'Sin cliente', $ = montoHoras(h);
    r.min += m; r.monto += $;
    const pc = r.porCliente[c] || (r.porCliente[c] = { min: 0, monto: 0 });
    pc.min += m; pc.monto += $;
  });
  return r;
}

/* ---------- DEPORTE ---------- */
/* Entrenos como hábito: meta de veces por semana, racha de semanas que la
   cumplen (la semana en curso cuenta si ya se cumplió) y días sin entrenar */
export function rachaEntrenos(fechas, hoy, { meta = 3, lunes = true } = {}) {
  const dias = new Set(fechas.filter(esFecha));
  const ini = inicioSemana(hoy, lunes);
  const enSemana = (s) => { let n = 0; for (let i = 0; i < 7; i++) if (dias.has(sumarDias(s, i))) n++; return n; };
  const estaSemana = enSemana(ini);
  let n = 0, s = estaSemana >= meta ? ini : sumarDias(ini, -7);
  while (n < 520 && enSemana(s) >= meta) { n++; s = sumarDias(s, -7); }
  const pasadas = [...dias].filter((d) => d <= hoy).sort();
  const ultimo = pasadas.length ? pasadas[pasadas.length - 1] : null;
  return { semanas: n, estaSemana, meta, ultimo, diasSin: ultimo ? diasEntre(ultimo, hoy) : null };
}
export function avisoEntreno(r, umbral = 3) {
  if (r.diasSin == null) return null;
  return r.diasSin >= umbral ? 'Llevas ' + r.diasSin + ' días sin entrenar' : null;
}

/* Récords: el mayor peso de cada ejercicio */
export function records(entrenos) {
  const r = {};
  entrenos.forEach((e) => lista(e, 'ejercicios', 'ejs').forEach((j) => {
    const n = String(j.n || '').trim(), p = +j.p;
    if (!n || !(p > 0)) return;
    const k = n.toLowerCase();
    if (!r[k] || p > r[k].p) r[k] = { n, p, fecha: e.fechas.inicio, reps: +j.r || 0 };
  }));
  return Object.values(r).sort((a, b) => a.n.localeCompare(b.n, 'es'));
}

/* Partidos jugados: ganados, empatados, perdidos, goles y asistencias */
export function resumenPartidos(l) {
  const r = { v: 0, e: 0, d: 0, goles: 0, asist: 0, jugados: 0 };
  l.filter((x) => val(x, 'jugado', false)).forEach((x) => {
    const res = val(x, 'res', ''); if (r[res] !== undefined && ['v', 'e', 'd'].includes(res)) r[res]++;
    r.goles += +val(x, 'goles', 0) || 0; r.asist += +val(x, 'asist', 0) || 0; r.jugados++;
  });
  return r;
}
/* Pichanga: cuánto pone cada uno (costo en soles de la v4.5 o céntimos en la v5) */
export function pichanga(x) {
  const p = val(x, 'pich', null);
  if (!p || typeof p !== 'object') return null;
  const costo = x.extra && x.extra.pich && x.extra.pich.costoC !== undefined ? +x.extra.pich.costoC || 0 : aCentimos(+p.costo || 0);
  const jug = Array.isArray(p.jug) ? p.jug : [];
  const cuota = jug.length ? Math.ceil(costo / jug.length) : 0;
  return { costo, jug, cuota, pagaron: jug.filter((j) => j.p).length, falta: jug.filter((j) => !j.p).length * cuota };
}

/* Peso: último, cambio en 30 días y puntos para el gráfico */
export function tendenciaPeso(medidas, hoy) {
  const l = medidas.map((m) => ({ f: m.fechas.inicio, p: +val(m, 'peso', 0) })).filter((m) => esFecha(m.f) && m.p > 0).sort((a, b) => a.f.localeCompare(b.f));
  if (!l.length) return null;
  const u = l[l.length - 1], hace = l.filter((m) => m.f >= sumarDias(hoy, -30));
  return { ultimo: u.p, fecha: u.f, cambio30: hace.length > 1 ? Math.round((u.p - hace[0].p) * 10) / 10 : null, puntos: l.slice(-20) };
}

/* Día de la semana de una clase en el orden del usuario */
export function ordenDias(lunes = true) { return lunes ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]; }
export { diaSemana };
