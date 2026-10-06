/* LO QUE OCUPA CADA DÍA: eventos (con sus repeticiones y los de varios
   días), clases de los cursos y pendientes con hora. Lo usan Hoy (tu día en
   bloques y el balance) y, en la Fase 4, el calendario. */
import { elementos } from './datos.js';
import { diaSemana, esFecha, esHora } from '../util/fechas.js';

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
