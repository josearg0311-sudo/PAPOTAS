/* LO QUE OCUPA CADA DÍA: eventos (con sus repeticiones y los de varios
   días), clases de los cursos y pendientes con hora. Lo usan Hoy (tu día en
   bloques y el balance) y, en la Fase 4, el calendario. */
import { elementos } from './datos.js';
import { diaSemana, esFecha, esHora, plazo, sumarDias } from '../util/fechas.js';

const minDe = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const aHora = (m) => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

/* ¿Un evento que empieza en «base» y se repite con «rep» cae en «dia»? */
export function ocurre(base, rep, dia, hasta) {
  if (!esFecha(base) || dia < base) return false;
  if (dia === base) return true;
  if (!rep) return !!hasta && dia <= hasta;           // varios días seguidos
  const [, bm, bd] = base.split('-').map(Number), [, m, d] = dia.split('-').map(Number);
  switch (rep) {
    case 'dia': return true;
    case 'lab': return diaSemana(dia) > 0 && diaSemana(dia) < 6;
    case 'sem': return diaSemana(dia) === diaSemana(base);
    case 'mes': return d === bd;
    case 'ano': return d === bd && m === bm;
    default: return false;
  }
}

/* Bloques con hora de un día: [{ ini, fin, titulo, area, tipo, id, item }] */
export function bloquesDelDia(dia) {
  const out = [];
  elementos((x) => x.tipo === 'evento').forEach((e) => {
    const f = e.fechas;
    if (e.todoElDia || !esHora(f.hora) || !ocurre(f.inicio, e.repetir, dia, f.fin)) return;
    const ini = minDe(f.hora), fin = esHora(f.horaFin) && minDe(f.horaFin) > ini ? minDe(f.horaFin) : ini + 60;
    out.push({ ini, fin, titulo: e.titulo, area: e.area, tipo: 'evento', subtipo: e.extra.tipoEvento || 'evento', lugar: e.extra.lugar || '', id: e.id });
  });
  elementos((x) => x.tipo === 'curso').forEach((c) => {
    const clases = (c.extra && c.extra.clases) || (c.datos && c.datos.clases) || [];
    if ((c.fechas.inicio && dia < c.fechas.inicio) || (c.fechas.fin && dia > c.fechas.fin)) return;
    clases.forEach((k) => {
      if (+k.d !== diaSemana(dia) || !esHora(k.ini)) return;
      const ini = minDe(k.ini), fin = esHora(k.fin) && minDe(k.fin) > ini ? minDe(k.fin) : ini + 90;
      out.push({ ini, fin, titulo: c.titulo, area: c.area, tipo: 'clase', lugar: (c.datos && c.datos.aula) || '', id: c.id });
    });
  });
  elementos((x) => x.tipo === 'pendiente' && x.estado !== 'hecho' && x.fechas.inicio === dia && esHora(x.fechas.hora)).forEach((p) => {
    const ini = minDe(p.fechas.hora), dur = +(p.extra && p.extra.duracion) || 30;
    out.push({ ini, fin: ini + dur, titulo: p.titulo, area: p.area, tipo: 'pendiente', id: p.id });
  });
  return out.sort((a, b) => a.ini - b.ini || a.fin - b.fin).map((b) => Object.assign(b, { hIni: aHora(b.ini), hFin: aHora(b.fin) }));
}

/* Lo de todo el día (cumpleaños, viajes, feriados propios…) */
export function todoElDia(dia) {
  return elementos((x) => x.tipo === 'evento' && (x.todoElDia || !esHora(x.fechas.hora)) && ocurre(x.fechas.inicio, x.repetir, dia, x.fechas.fin))
    .map((e) => ({ titulo: e.titulo, area: e.area, id: e.id, cumple: e.extra.tipoEvento === 'cumple' }));
}

/* Minutos planificados por área (los bloques que se pisan no se cuentan dos veces) */
export function minutosPorArea(bloques) {
  const r = { total: 0 };
  let finPrevio = -1;
  bloques.forEach((b) => {
    const ini = Math.max(b.ini, finPrevio), dur = Math.max(0, b.fin - ini);
    r[b.area] = (r[b.area] || 0) + dur; r.total += dur;
    finPrevio = Math.max(finPrevio, b.fin);
  });
  return r;
}

/* ---------- Vencimientos de un día (Fase 4) ----------
   Pagos fijos (el día del mes; el 31 en febrero es el 28), cobros,
   documentos y pendientes con «vence». */
export function diaDePago(p, ym) {
  const [y, m] = ym.split('-').map(Number), fin = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const dia = Math.min(+(p.extra && p.extra.dia) || +(p.datos && p.datos.dia) || 1, fin);
  return ym + '-' + String(dia).padStart(2, '0');
}
export function pagado(p, ym) { return !!((p.extra && p.extra.pagados && p.extra.pagados[ym]) || (p.datos && p.datos.pagados && p.datos.pagados[ym])); }

export function vencenEl(dia) {
  const out = [], ym = dia.slice(0, 7);
  elementos((x) => x.tipo === 'pago' && (x.extra.activo !== false)).forEach((p) => {
    const desde = (p.datos && p.datos.desde) || '';
    if (desde && ym < desde) return;
    if (diaDePago(p, ym) === dia) out.push({ id: p.id, tipo: 'pago', titulo: p.titulo, area: p.area, monto: p.monto, hecho: pagado(p, ym), ym });
  });
  elementos((x) => (x.tipo === 'cobro' || x.tipo === 'documento' || x.tipo === 'prestamo' || x.tipo === 'pendiente') && x.fechas.vence === dia)
    .forEach((x) => out.push({ id: x.id, tipo: x.tipo, titulo: x.titulo, area: x.area, monto: x.monto, hecho: x.estado === 'hecho', plazoLegal: !!x.plazoLegal }));
  return out.sort((a, b) => (b.plazoLegal ? 1 : 0) - (a.plazoLegal ? 1 : 0) || (a.hecho ? 1 : 0) - (b.hecho ? 1 : 0));
}

/* Todo lo de un día, filtrable por área */
export function delDia(dia, area = '') {
  const f = (x) => !area || x.area === area;
  const sinHora = elementos((x) => x.tipo === 'pendiente' && x.fechas.inicio === dia && !x.fechas.hora && f(x));
  return {
    bloques: bloquesDelDia(dia).filter(f),
    todoDia: todoElDia(dia).filter(f),
    sinHora,
    vencen: vencenEl(dia).filter(f)
  };
}
/* Para el mes: áreas con algo ese día (puntos de color) y si hay algo vencido/urgente */
export function resumenDia(dia, area = '', hoy = '') {
  const d = delDia(dia, area), areas = new Set();
  d.bloques.forEach((b) => areas.add(b.area)); d.todoDia.forEach((b) => areas.add(b.area));
  d.sinHora.filter((x) => x.estado !== 'hecho').forEach((x) => areas.add(x.area)); d.vencen.filter((v) => !v.hecho).forEach((v) => areas.add(v.area));
  const total = d.bloques.length + d.todoDia.length + d.sinHora.filter((x) => x.estado !== 'hecho').length + d.vencen.filter((v) => !v.hecho).length;
  const alerta = d.vencen.some((v) => !v.hecho && (v.plazoLegal || (hoy && plazo(dia, hoy).nivel !== 'ok')));
  return { areas: [...areas], total, alerta, legal: d.vencen.some((v) => v.plazoLegal && !v.hecho) };
}

/* Lo siguiente: el bloque en curso o el próximo de hoy; si no hay, el primero
   de los próximos 7 días. { b, dia, enCurso, faltan (min, solo hoy) } */
export function proximoBloque(hoy, ahoraMin) {
  const deHoy = bloquesDelDia(hoy).filter((b) => b.fin > ahoraMin);
  if (deHoy.length) { const b = deHoy[0]; return { b, dia: hoy, enCurso: b.ini <= ahoraMin, faltan: Math.max(0, b.ini - ahoraMin) }; }
  for (let i = 1; i <= 7; i++) {
    const d = sumarDias(hoy, i), l = bloquesDelDia(d).filter((b) => b.tipo !== 'pendiente');
    if (l.length) return { b: l[0], dia: d, enCurso: false, faltan: null };
  }
  return null;
}

/* Huecos libres de un día entre «ini» y «fin» (minutos), de al menos «minimo» */
export function huecosLibres(bloques, ini, fin, minimo = 30) {
  const out = []; let t = ini;
  bloques.slice().sort((a, b) => a.ini - b.ini).forEach((b) => {
    if (b.ini - t >= minimo) out.push({ ini: t, fin: Math.min(b.ini, fin) });
    t = Math.max(t, b.fin);
  });
  if (fin - t >= minimo) out.push({ ini: t, fin });
  return out.filter((h) => h.fin - h.ini >= minimo && h.ini < fin).map((h) => Object.assign(h, { hIni: aHora(h.ini), hFin: aHora(h.fin) }));
}

/* Lo que viene en los próximos «n» días, día por día (solo días con algo) */
export function proximos(desde, n = 60, area = '') {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = sumarDias(desde, i), x = delDia(d, area);
    const sinHora = x.sinHora.filter((s) => s.estado !== 'hecho'), vencen = x.vencen.filter((v) => !v.hecho);
    if (x.bloques.length || x.todoDia.length || sinHora.length || vencen.length) out.push({ dia: d, bloques: x.bloques, todoDia: x.todoDia, sinHora, vencen });
  }
  return out;
}

/* Un año de un vistazo, en UNA pasada: por mes, cuántas cosas, cumpleaños
   y plazos legales; por día, cuántas cosas (para el mapa de calor) */
export function resumenAnio(anio, area = '') {
  const meses = Array.from({ length: 12 }, () => ({ n: 0, cumples: [], legales: [], dias: {} }));
  const sumar = (f, x, extra) => {
    if (!esFecha(f) || f.slice(0, 4) !== String(anio)) return;
    const m = meses[+f.slice(5, 7) - 1]; m.n++; m.dias[f] = (m.dias[f] || 0) + 1;
    if (extra) extra(m);
  };
  elementos((x) => !area || x.area === area).forEach((x) => {
    const f = x.fechas || {};
    if (x.tipo === 'evento') {
      const cumple = x.repetir === 'ano' && (x.extra.tipoEvento === 'cumple' || /cumple/i.test(x.titulo));
      if (x.repetir === 'ano' && esFecha(f.inicio) && f.inicio.slice(0, 4) <= String(anio)) sumar(anio + f.inicio.slice(4), x, cumple ? (m) => m.cumples.push({ t: x.titulo, d: anio + f.inicio.slice(4), area: x.area }) : null);
      else if (!x.repetir) sumar(f.inicio, x);
    } else if (x.tipo === 'pendiente' && x.estado !== 'hecho') {
      if (f.inicio) sumar(f.inicio, x);
      if (f.vence && x.plazoLegal) sumar(f.vence, x, (m) => m.legales.push({ t: x.titulo, d: f.vence, area: x.area }));
    } else if ((x.tipo === 'cobro' || x.tipo === 'documento' || x.tipo === 'prestamo') && x.estado !== 'hecho' && f.vence) sumar(f.vence, x);
  });
  meses.forEach((m) => { m.cumples.sort((a, b) => a.d.localeCompare(b.d)); m.legales.sort((a, b) => a.d.localeCompare(b.d)); });
  return meses;
}
