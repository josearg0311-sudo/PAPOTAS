/* PENDIENTES (tareas y recordatorios, ya unidos) y sus LISTAS.
   Las funciones «puras» (grupo, ordenar, siguiente…) reciben hoy y la hora
   para poder probarlas; las acciones cambian datos a través de datos.js. */
import { hoy as hoyLima, sumarDias, minutosAhora, diaSemana, diasEntre, esFecha, plazo } from '../util/fechas.js';
import { elementos, buscarElemento, poner } from './datos.js';
import { LISTA_RECORDATORIOS, nuevoId, modeloVacio } from './modelo.js';
import { interpretar } from '../util/interpretar.js';

export const GRUPOS = [
  ['hoy', 'Para hoy'], ['tarde', 'Más tarde'], ['manana', 'Mañana'], ['prox', 'Próximos días'], ['algun', 'Algún día'], ['hecho', 'Hecho']
];
const minDe = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b; };

/* ---------- Puras ---------- */
export function grupo(x, hoy = hoyLima(), ahoraMin = minutosAhora()) {
  if (x.estado === 'hecho' || x.estado === 'cancelado') return 'hecho';
  const f = x.fechas && x.fechas.inicio;
  if (!f) return 'algun';
  if (f < hoy) return 'hoy';
  if (f === hoy) return x.fechas.hora && minDe(x.fechas.hora) > ahoraMin ? 'tarde' : 'hoy';
  if (f === sumarDias(hoy, 1)) return 'manana';
  return 'prox';
}
export function atrasado(x, hoy = hoyLima()) { return x.estado !== 'hecho' && !!(x.fechas && x.fechas.inicio && x.fechas.inicio < hoy); }

const PESO_PRIO = { alta: 0, media: 1, baja: 2 };
export function ordenar(a, b) {
  return (b.plazoLegal ? 1 : 0) - (a.plazoLegal ? 1 : 0) ||
    String(a.fechas.inicio || '9999').localeCompare(String(b.fechas.inicio || '9999')) ||
    (PESO_PRIO[a.prioridad] - PESO_PRIO[b.prioridad]) ||
    String(a.fechas.hora || '99').localeCompare(String(b.fechas.hora || '99')) ||
    a.titulo.localeCompare(b.titulo, 'es');
}

/* Próxima vez que toca algo que se repite (desde una fecha, sin incluirla) */
export function siguiente(fecha, rep) {
  if (!esFecha(fecha)) return fecha;
  let d = fecha;
  switch (rep) {
    case 'dia': return sumarDias(d, 1);
    case 'lab': do { d = sumarDias(d, 1); } while (diaSemana(d) === 0 || diaSemana(d) === 6); return d;
    case 'sem': return sumarDias(d, 7);
    case 'mes': {
      const [y, m, dia] = d.split('-').map(Number);
      const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1;
      const fin = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
      return ny + '-' + String(nm).padStart(2, '0') + '-' + String(Math.min(dia, fin)).padStart(2, '0');
    }
    case 'ano': { const [y, m, dia] = d.split('-').map(Number); const ny = y + 1; const fin = new Date(Date.UTC(ny, m, 0)).getUTCDate(); return ny + '-' + String(m).padStart(2, '0') + '-' + String(Math.min(dia, fin)).padStart(2, '0'); }
    default: return fecha;
  }
}
export const REPETIR = [['', 'No se repite'], ['dia', 'Cada día'], ['lab', 'De lunes a viernes'], ['sem', 'Cada semana'], ['mes', 'Cada mes'], ['ano', 'Cada año']];

/* Vence pronto o vencido (para Urgente): fecha de «vence» o, si no tiene, la de hacer */
export function nivelPlazo(x, hoy = hoyLima()) {
  if (x.estado === 'hecho') return { nivel: 'sin' };
  if (x.fechas.vence) return plazo(x.fechas.vence, hoy);
  if (x.fechas.inicio && x.fechas.inicio < hoy) return { nivel: 'vencido', dias: diasEntre(hoy, x.fechas.inicio), texto: 'atrasado desde ' + x.fechas.inicio };
  return { nivel: 'sin' };
}

/* ---------- Listas ---------- */
export function listas() {
  return elementos((x) => x.tipo === 'lista').sort((a, b) => {
    const k = (l) => (l.id === LISTA_RECORDATORIOS ? 0 : l.extra.clase === 'recordatorios' ? 1 : l.extra.clase === 'proyecto' ? 2 : 3);
    return k(a) - k(b) || a.titulo.localeCompare(b.titulo, 'es');
  });
}
export const esChecklist = (l) => !!(l && l.extra && l.extra.clase === 'checklist');
export function pendientesDe(idLista) {
  return elementos((x) => x.tipo === 'pendiente' && (idLista ? x.lista === idLista : true));
}
/* En «Todos» no entran las listas de compras (sus cosas no tienen día), salvo que tengan fecha */
export function pendientesVisibles(idLista) {
  if (idLista) return pendientesDe(idLista);
  const check = new Set(listas().filter(esChecklist).map((l) => l.id));
  return pendientesDe().filter((x) => !check.has(x.lista) || (x.fechas && x.fechas.inicio));
}
export function hechoEn(x) { return (x.extra && x.extra.hechoEn) || (x.datos && x.datos.hechaEn) || 0; }

/* ---------- Acciones ---------- */
function clon(x) { return JSON.parse(JSON.stringify(x)); }
export function marcar(id) {
  const x = buscarElemento(id); if (!x) return null;
  const antes = clon(x), y = clon(x), h = hoyLima();
  if (y.estado !== 'hecho' && y.repetir && y.fechas.inicio) {
    /* Lo que se repite no se tacha: salta a la próxima vez (después de hoy) */
    let f = y.fechas.inicio;
    do { f = siguiente(f, y.repetir); } while (f <= h);
    y.fechas.inicio = f;
    y.extra.historial = (y.extra.historial || []).concat([h]).slice(-90);
    (y.extra.subtareas || []).forEach((s) => { s.ok = false; });
    poner(y);
    return { antes, repetido: f };
  }
  y.estado = y.estado === 'hecho' ? 'pendiente' : 'hecho';
  y.extra.hechoEn = y.estado === 'hecho' ? Date.now() : 0;
  poner(y);
  return { antes, hecho: y.estado === 'hecho' };
}
export function mover(id, fecha, hora) {
  const x = buscarElemento(id); if (!x) return null;
  const antes = clon(x), y = clon(x);
  y.fechas.inicio = fecha || null;
  if (hora !== undefined) y.fechas.hora = hora;
  if (!fecha) y.fechas.hora = null;
  if (y.estado === 'hecho' && fecha) y.estado = 'pendiente';
  poner(y);
  return { antes };
}
/* «Más tarde»: hoy, dentro de 3 horas (redondeado a 15 min). Si ya es de
   noche, mañana a las 9:00. */
export function masTarde(id, ahoraMin = minutosAhora()) {
  let m = Math.ceil((ahoraMin + 180) / 15) * 15;
  if (m >= 23 * 60) return mover(id, sumarDias(hoyLima(), 1), '09:00');
  return mover(id, hoyLima(), String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
}
export function restaurarVersion(antes) { if (antes) poner(antes); }

/* Cerrar el día: lo que quedó pendiente de hoy (y lo atrasado) pasa a mañana */
export function paraCerrarDia(hoy = hoyLima()) {
  return pendientesVisibles().filter((x) => x.estado !== 'hecho' && x.fechas.inicio && x.fechas.inicio <= hoy && !x.repetir);
}
export function cerrarDia() {
  const l = paraCerrarDia(), man = sumarDias(hoyLima(), 1), antes = l.map(clon);
  l.forEach((x) => { const y = clon(x); y.fechas.inicio = man; poner(y); });
  return antes;
}

/* Crear desde texto (una línea = un pendiente) */
export function crearDesdeTexto(texto, { lista = LISTA_RECORDATORIOS, area = null } = {}) {
  const l = buscarElemento(lista) || buscarElemento(LISTA_RECORDATORIOS);
  const creados = [];
  String(texto).split('\n').map((s) => s.trim()).filter(Boolean).forEach((linea) => {
    const p = interpretar(linea);
    creados.push(poner(Object.assign(modeloVacio(), {
      id: nuevoId('pend'), tipo: 'pendiente', titulo: p.titulo || linea, area: p.area || area || (l ? l.area : 'personal'),
      prioridad: p.prioridad || 'baja', plazoLegal: p.plazoLegal, etiquetas: p.etiquetas,
      fechas: Object.assign(modeloVacio().fechas, { inicio: p.algunDia ? null : (p.fecha || (esChecklist(l) ? null : hoyLima())), hora: p.hora }),
      aviso: !!p.hora, lista: l ? l.id : LISTA_RECORDATORIOS
    })));
  });
  return creados;
}

export function crearLista({ titulo, area = 'personal', clase = 'recordatorios' }) {
  return poner(Object.assign(modeloVacio(), { id: nuevoId('lista'), tipo: 'lista', titulo, area, extra: { clase } }));
}

/* ---------- Para Hoy ---------- */
export function urgentes(hoy = hoyLima()) {
  const out = [];
  pendientesVisibles().forEach((x) => {
    if (x.estado === 'hecho') return;
    const n = nivelPlazo(x, hoy);
    if (x.plazoLegal && (n.nivel === 'vencido' || n.nivel === 'pronto' || (x.fechas.vence && diasEntre(hoy, x.fechas.vence) <= 7) || (!x.fechas.vence && x.fechas.inicio && diasEntre(hoy, x.fechas.inicio) <= 7))) out.push(x);
    else if (n.nivel === 'vencido' || n.nivel === 'pronto') out.push(x);
  });
  return out.sort((a, b) => (b.plazoLegal ? 1 : 0) - (a.plazoLegal ? 1 : 0) || String(a.fechas.vence || a.fechas.inicio).localeCompare(String(b.fechas.vence || b.fechas.inicio)));
}
export function delDia(hoy = hoyLima()) {
  return pendientesVisibles().filter((x) => x.estado !== 'hecho' && x.fechas.inicio && x.fechas.inicio <= hoy);
}
export function hechosHoy(hoy = hoyLima()) {
  const ini = Date.parse(hoy + 'T00:00:00-05:00');
  return pendientesVisibles().filter((x) => (x.estado === 'hecho' && hechoEn(x) >= ini) || (x.extra.historial || []).includes(hoy));
}
