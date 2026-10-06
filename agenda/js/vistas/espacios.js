/* TUS ESPACIOS (como la v4.5): una tarjeta por espacio con su emoji, su
   color, lo que te toca hoy, lo próximo y sus propias cifras. */
import { AREAS, area } from '../datos/areas.js';
import { esc, ico } from '../util/dom.js';
import { solesCorto } from '../util/dinero.js';
import { hoy, sumarDias, minutosAhora, fmtHora, relativo } from '../util/fechas.js';
import { preferencias } from '../datos/preferencias.js';
import { delDia, hechosHoy } from '../datos/pendientes.js';
import { bloquesDelDia, todoElDia } from '../datos/calendario.js';
import * as personal from './area-personal.js';
import * as estudios from './area-estudios.js';
import * as oficina from './area-oficina.js';
import * as deporte from './area-deporte.js';
import { tareasDe } from './espacio-comun.js';
import { elementos } from '../datos/datos.js';
import { ordenar, pendientesVisibles, listas, esChecklist, pendientesDe } from '../datos/pendientes.js';
import { proximos } from '../datos/calendario.js';
import { esIngreso, delMes } from '../datos/finanzas.js';
import { fmtSoles } from '../util/dinero.js';
import { fmtCorta, DIAS3, diaSemana } from '../util/fechas.js';
import { vacio, plural } from '../util/dom.js';
import { filaPendiente } from '../piezas/pendientes-ui.js';
import { tarjeta } from './comun.js';
import { tarjetaNota } from './notas.js';

export const PANELES = { personal, estudios, oficina, deporte };

export function resumenDe(id) { try { return PANELES[id].resumen(); } catch (e) { return { datos: [], chips: [] }; } }

/* Lo próximo de un espacio: lo que sigue hoy o en los próximos 7 días */
export function proximoDe(id) {
  const h = hoy(), ahora = minutosAhora(), fh = (x) => fmtHora(x, preferencias().formatoHora);
  const deHoy = bloquesDelDia(h).filter((b) => b.area === id && b.fin > ahora);
  if (deHoy.length) return { titulo: deHoy[0].titulo, cuando: (deHoy[0].ini <= ahora ? 'ahora' : 'hoy ' + fh(deHoy[0].hIni)), b: deHoy[0] };
  for (let i = 1; i <= 7; i++) {
    const d = sumarDias(h, i), l = bloquesDelDia(d).filter((b) => b.area === id && b.tipo !== 'pendiente');
    if (l.length) return { titulo: l[0].titulo, cuando: relativo(d).toLowerCase() + ' ' + fh(l[0].hIni), b: l[0] };
  }
  return null;
}

export function infoHoy(id) {
  const h = hoy(), pend = delDia(h).filter((x) => x.area === id), hechos = hechosHoy(h).filter((x) => x.area === id);
  const evs = bloquesDelDia(h).filter((b) => b.area === id && b.tipo !== 'pendiente').length + todoElDia(h).filter((t) => t.area === id).length;
  const tot = pend.length + hechos.length;
  return { n: pend.length + evs, pct: tot ? Math.round(hechos.length / tot * 100) : 0, tareas: tareasDe(id) };
}

export function tarjetaEspacios() {
  return '<section class="esp-hoy" aria-labelledby="tusEsp"><h2 class="seccion-t" id="tusEsp">Tus espacios</h2><div class="eh-rejilla">' + AREAS.map((a) => {
    const r = resumenDe(a.id), i = infoHoy(a.id), p = proximoDe(a.id);
    return '<a class="eh area-' + a.id + '" href="#areas/' + a.id + '">' +
      '<span class="eh-cab"><span class="eh-em" aria-hidden="true">' + esc(a.emoji) + '</span><b>' + esc(a.nombre) + '</b>' + ico('i-der') + '</span>' +
      '<span class="eh-num"><strong>' + i.n + '</strong><em>' + (i.n === 1 ? 'cosa para hoy' : 'cosas para hoy') + '</em></span>' +
      '<span class="eh-prox"><i>' + (p ? 'Próximo' : 'Libre') + '</i>' + (p ? esc(p.titulo) + ' · ' + esc(p.cuando) : esc(a.lema)) + '</span>' +
      (r.chips.length ? '<span class="eh-datos">' + r.chips.slice(0, 4).map((c) => '<span class="eh-dato' + (c[3] === 'vencido' ? ' rojo' : '') + '"><b>' + esc(String(c[0])) + '</b> ' + esc(c[1]) + '</span>').join('') + '</span>' : '') +
      '<span class="eh-barra" aria-hidden="true"><i style="width:' + i.pct + '%"></i></span>' +
      '<span class="eh-pie">' + (i.tareas ? i.tareas + (i.tareas === 1 ? ' tarea pendiente' : ' tareas pendientes') : 'Al día ✓') + '</span></a>';
  }).join('') + '</div></section>';
}

/* ---------- La página de cada espacio (como la v4.5) ---------- */

const cuenta = (f) => elementos(f).length;
/* Cada mosaico: [ícono, color, descripción, () => [cifra, texto]] */
const MOSAICO = {
  pendientes: ['i-tareas', 'rojo', 'Lo que tienes pendiente', (a) => [tareasDe(a), 'pendientes']],
  eventos: ['i-cal', 'morado', 'Citas, salidas y todo lo que viene', (a) => [proximos(hoy(), 60, a).reduce((s, d) => s + d.bloques.filter((b) => b.tipo === 'evento').length + d.todoDia.length, 0), 'en 60 días']],
  notas: ['i-notas', 'ambar', 'Tus apuntes y listas para marcar', (a) => { const ids = new Set(listas().filter((l) => esChecklist(l) && l.area === a).map((l) => l.id)); return [cuenta((x) => x.tipo === 'nota' && x.area === a), 'notas · ' + cuenta((x) => x.tipo === 'pendiente' && ids.has(x.lista) && x.estado !== 'hecho') + ' por marcar']; }],
  dinero: ['i-grafica', 'verde', 'Lo que gastas en este espacio este mes', (a) => [solesCorto(gastosMes(a)), 'gastado']],
  casa: ['i-casa', 'naranja', 'Lo de la casa, cada cuántos días', () => [cuenta((x) => x.tipo === 'casa'), 'tareas de casa']],
  menu: ['i-recibo', 'naranja', 'Almuerzo y cena de la semana', () => ['🎲', 'ideas peruanas']],
  documentos: ['i-carpeta', 'ambar', 'DNI, pasaporte, SOAT… y cuándo vencen', () => [cuenta((x) => x.tipo === 'documento'), 'documentos']],
  cumpleanos: ['i-regalo', 'rosa', 'Cumpleaños y aniversarios, con regalo', () => [cuenta((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'cumple'), 'fechas']],
  prestamos: ['i-cuentas', 'ambar', 'Quién te debe y a quién le debes', () => [cuenta((x) => x.tipo === 'prestamo' && x.estado !== 'hecho'), 'activos']],
  diario: ['i-diario', 'morado', 'Cómo te fue, agua y sueño', () => [cuenta((x) => x.tipo === 'diario'), 'días escritos']],
  cursos: ['i-birrete', 'turquesa', 'Tus clases, notas, promedio y faltas', () => [cuenta((x) => x.tipo === 'curso'), 'cursos']],
  examenes: ['i-diana', 'rojo', 'Cuenta atrás y plan de repaso', () => [cuenta((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'examen' && x.fechas.inicio >= hoy()), 'próximos']],
  fichas: ['i-listas', 'azul', 'Repaso espaciado para memorizar', () => [cuenta((x) => x.tipo === 'ficha'), 'fichas']],
  plazos: ['i-bandera', 'rojo', 'Plazos legales, siempre primero', () => [cuenta((x) => x.tipo === 'pendiente' && x.plazoLegal && x.estado !== 'hecho'), 'por cumplir']],
  tablero: ['i-tareas', 'azul', 'Por hacer, en curso y hecho', () => [cuenta((x) => x.tipo === 'pendiente' && x.area === 'oficina' && x.estado === 'en_curso'), 'en curso']],
  cobros: ['i-subir', 'verde', 'Lo que te deben tus clientes', () => [solesCorto(elementos((x) => x.tipo === 'cobro' && x.estado !== 'hecho').reduce((s, x) => s + (+x.monto || 0), 0)), 'por cobrar']],
  horas: ['i-reloj', 'morado', 'Cronómetro y horas por tarifa', () => [cuenta((x) => x.tipo === 'horas' && (x.fechas.inicio || '').startsWith(hoy().slice(0, 7))), 'registros este mes']],
  clientes: ['i-maletin', 'pizarra', 'Contacto, lo que deben y sus horas', () => [cuenta((x) => x.tipo === 'cliente'), 'clientes']],
  actas: ['i-notas', 'ambar', 'Acuerdos de reunión → recordatorios', () => [cuenta((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'reunion'), 'reuniones']],
  entrenos: ['i-fuego', 'verde', 'Anota con un toque y mira tu racha', () => [cuenta((x) => x.tipo === 'entreno' && x.fechas.inicio >= sumarDias(hoy(), -6)), 'en 7 días']],
  rutinas: ['i-estrella', 'naranja', 'Tus ejercicios y tus mejores marcas', () => [cuenta((x) => x.tipo === 'rutina'), 'rutinas']],
  partidos: ['i-balon', 'verde', 'Resultados, pichanga y quién pagó', () => [cuenta((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'partido' && x.fechas.inicio >= hoy()), 'próximos']],
  peso: ['i-gota', 'azul', 'Peso, gráfico e IMC', () => ['', '']],
  constancia: ['i-habitos', 'naranja', 'Hábitos y metas de este espacio', (a) => [cuenta((x) => x.tipo === 'habito' && x.area === a), 'hábitos']]
};
function gastosMes(a) { const ym = hoy().slice(0, 7); return elementos((x) => x.tipo === 'movimiento' && x.area === a && !esIngreso(x) && delMes(x, ym)).reduce((s, x) => s + Math.abs(+x.monto || 0), 0); }

/* Herramientas comunes a todos los espacios (lo de ese espacio, dentro de él) */
export const GENERICAS = [
  { id: 'pendientes', nombre: 'Tareas', vista: (a) => vistaPendientes(a) },
  { id: 'eventos', nombre: 'Eventos', vista: (a) => vistaEventos(a) },
  { id: 'notas', nombre: 'Notas y listas', vista: (a) => vistaNotasEsp(a) },
  { id: 'dinero', nombre: 'Tu dinero', vista: (a) => vistaDinero(a) },
  { id: 'semana', nombre: 'Tu semana', vista: (a) => vistaSemana(a) }
];

function mosaico(a, h) {
  const m = MOSAICO[h.id] || ['i-der', 'azul', '', () => ['', '']], [n, t] = (() => { try { return m[3](a.id); } catch (e) { return ['', '']; } })();
  return '<a class="mosaico mo-' + m[1] + '" href="#areas/' + a.id + '/' + h.id + '"><span class="mo-ico" aria-hidden="true">' + ico(m[0]) + '</span>' +
    '<span class="mo-txt"><b>' + esc(h.nombre) + '</b><small>' + esc(m[2]) + '</small></span>' +
    (n !== '' ? '<span class="mo-dato"><strong>' + esc(String(n)) + '</strong> <em>' + esc(t) + '</em></span>' : '') + '<span class="mo-flecha" aria-hidden="true">' + ico('i-der') + '</span></a>';
}
function mosaicoSemana(a) {
  const h = hoy(), dias = Array.from({ length: 7 }, (_, i) => sumarDias(h, i)), l = proximos(h, 7, a.id), por = {};
  l.forEach((d) => { por[d.dia] = d.bloques.length + d.todoDia.length + d.sinHora.length + d.vencen.length; });
  const tot = Object.values(por).reduce((s, n) => s + n, 0), max = Math.max(1, ...Object.values(por));
  return '<a class="mosaico ancho" href="#areas/' + a.id + '/semana"><span class="mo-ico" aria-hidden="true">' + ico('i-cal') + '</span>' +
    '<span class="mo-txt"><b>Tu semana</b><small>Lo que viene y lo pendiente de ' + esc(a.nombre.toLowerCase()) + '</small></span>' +
    '<span class="mo-dato"><strong>' + tot + '</strong> <em>' + (tot === 1 ? 'cosa' : 'cosas') + ' en 7 días</em></span>' +
    '<span class="mo-mini" aria-hidden="true">' + dias.map((d) => '<i' + (d === h ? ' class="m"' : '') + ' style="height:' + Math.max(6, Math.round((por[d] || 0) / max * 36)) + 'px" title="' + DIAS3[diaSemana(d)] + '"></i>').join('') + '</span>' +
    '<span class="mo-flecha" aria-hidden="true">' + ico('i-der') + '</span></a>';
}

export function portadaEspacio(a, herramientas, senales) {
  const r = resumenDe(a.id), p = proximoDe(a.id);
  return '<header class="portada-esp area-' + a.id + '">' +
    '<nav class="pe-cambia" aria-label="Cambiar de espacio">' + AREAS.map((x) => '<a href="#areas/' + x.id + '" class="area-' + x.id + '"' + (x.id === a.id ? ' aria-current="page"' : '') + ' aria-label="' + esc(x.nombre) + '"><span aria-hidden="true">' + esc(x.emoji) + '</span></a>').join('') + '</nav>' +
    '<div class="pe-tit"><span class="pe-em" aria-hidden="true">' + esc(a.emoji) + '</span><div><h1 class="pe-nom">' + esc(a.nombre) + '</h1><p class="pe-lema">' + (p ? 'Lo próximo: <b>' + esc(p.titulo) + '</b> · ' + esc(p.cuando) : esc(a.lema)) + '</p></div></div>' +
    '<div class="pe-datos">' + r.datos.map((d) => '<a class="dato' + (d[3] === 'aviso' ? ' aviso' : '') + '" href="#areas/' + a.id + '/' + d[2] + '"><b>' + esc(String(d[0])) + '</b><span>' + esc(d[1]) + '</span></a>').join('') + '</div></header>' +
    '<button type="button" class="anadir-rapido" data-acc="esp-anadir" data-area="' + a.id + '">' + ico('i-plus') + '<span>Añadir en ' + esc(a.nombre) + '…</span></button>' +
    (senales || '') +
    '<div class="mosaicos area-' + a.id + '">' + mosaicoSemana(a) + GENERICAS.filter((g) => g.id !== 'semana').concat(herramientas).map((h) => mosaico(a, h)).join('') + '</div>';
}

/* ---------- Las herramientas comunes ---------- */
function vistaPendientes(a) {
  const l = pendientesVisibles().filter((x) => x.area === a.id && x.estado !== 'hecho').sort(ordenar), h = hoy();
  const grupos = [['Atrasado', (x) => x.fechas.inicio && x.fechas.inicio < h], ['Hoy', (x) => x.fechas.inicio === h], ['Próximos', (x) => x.fechas.inicio > h], ['Sin fecha', (x) => !x.fechas.inicio]];
  return tarjeta({ eti: 'TAREAS', titulo: 'Tareas de ' + esc(a.nombre), n: l.length, clase: 'area-' + a.id,
    cuerpo: (l.length ? grupos.map(([t, f]) => { const g = l.filter(f); return g.length ? '<div class="pend-grupo">' + t + '</div><div class="pends">' + g.map((x) => filaPendiente(x, { verLista: true })).join('') + '</div>' : ''; }).join('') : vacio('Nada pendiente', 'Lo que agregues en ' + esc(a.nombre) + ' aparecerá aquí.')) +
      '<div class="pie-tarjeta"><button type="button" class="btn pri" data-acc="esp-anadir-tipo" data-area="' + a.id + '" data-tipo="recordatorio">' + ico('i-plus') + 'Tarea en ' + esc(a.nombre) + '</button><a class="btn" href="#recordatorios">' + ico('i-tareas') + 'Todas mis listas</a></div>' });
}
function vistaEventos(a) {
  const l = proximos(hoy(), 60, a.id).filter((d) => d.bloques.some((b) => b.tipo === 'evento') || d.todoDia.length);
  return tarjeta({ eti: 'EVENTOS', titulo: 'Eventos de ' + esc(a.nombre), n: l.length ? plural(l.length, 'día', 'días') : null, clase: 'area-' + a.id,
    cuerpo: (l.length ? '<div class="prox-lista">' + l.map((d) => '<section class="prox-dia"><button type="button" class="prox-fecha" data-acc="ir-dia" data-dia="' + d.dia + '"><b>' + fmtCorta(d.dia) + '</b><small>' + relativo(d.dia) + '</small></button><div class="mini-bloques">' +
      d.todoDia.map((t) => '<button type="button" class="mini-bloque area-' + a.id + '" data-acc="ev-editar" data-id="' + esc(t.id) + '"><span class="mono">' + (t.cumple ? '🎂' : 'día') + '</span><b>' + esc(t.titulo) + '</b></button>').join('') +
      d.bloques.filter((b) => b.tipo === 'evento').map((b) => '<button type="button" class="mini-bloque area-' + a.id + '" data-acc="ev-editar" data-id="' + esc(b.id) + '"><span class="mono">' + fmtHora(b.hIni, preferencias().formatoHora) + '</span><b>' + esc(b.titulo) + '</b></button>').join('') + '</div></section>').join('') + '</div>'
      : vacio('Sin eventos', 'Nada agendado en ' + esc(a.nombre) + ' para los próximos 60 días.')) +
      '<div class="pie-tarjeta"><button type="button" class="btn pri" data-acc="esp-evento" data-area="' + a.id + '">' + ico('i-plus') + 'Evento en ' + esc(a.nombre) + '</button><a class="btn" href="#agenda">' + ico('i-cal') + 'Ver la Agenda</a></div>' });
}
function vistaNotasEsp(a) {
  const ns = elementos((x) => x.tipo === 'nota' && x.area === a.id).sort((x, y) => y.actualizado - x.actualizado), ls = listas().filter((l) => esChecklist(l) && l.area === a.id);
  return tarjeta({ eti: 'NOTAS', titulo: 'Notas de ' + esc(a.nombre), n: ns.length, clase: 'area-' + a.id,
    cuerpo: (ns.length ? '<div class="notas" style="padding:0 16px 12px">' + ns.slice(0, 24).map(tarjetaNota).join('') + '</div>' : vacio('Sin notas', 'Las notas de ' + esc(a.nombre) + ' aparecerán aquí.')) +
      '<div class="pie-tarjeta"><button type="button" class="btn pri" data-acc="nota-nueva" data-area="' + a.id + '">' + ico('i-plus') + 'Nota en ' + esc(a.nombre) + '</button></div>' }) +
    tarjeta({ eti: 'LISTAS', titulo: 'Listas para marcar', n: ls.length, clase: 'area-' + a.id,
      cuerpo: ls.length ? '<div class="herr-botones">' + ls.map((l) => { const p = pendientesDe(l.id), ok = p.filter((x) => x.estado === 'hecho').length;
        return '<button type="button" class="herr-btn area-' + a.id + '" data-acc="r-lista-ir" data-id="' + esc(l.id) + '"><b>' + esc(l.titulo) + '</b><small class="mono">' + ok + '/' + p.length + '</small></button>'; }).join('') + '</div>' : vacio('', 'Crea listas para marcar (compras, maleta…) desde Recordatorios.') });
}
function vistaDinero(a) {
  const ym = hoy().slice(0, 7), l = elementos((x) => x.tipo === 'movimiento' && x.area === a.id && delMes(x, ym)).sort((x, y) => (y.fechas.inicio || '').localeCompare(x.fechas.inicio || ''));
  const g = l.filter((x) => !esIngreso(x)).reduce((s, x) => s + Math.abs(+x.monto || 0), 0), libro = a.id === 'oficina' ? 'oficina' : 'personal';
  return tarjeta({ eti: 'DINERO', titulo: 'Tu dinero en ' + esc(a.nombre), n: fmtSoles(g) + ' gastado', clase: 'area-' + a.id,
    cuerpo: (l.length ? '<div class="hfs">' + l.slice(0, 30).map((x) => '<div class="hf"><button type="button" class="hf-txt" data-acc="fin-editar" data-id="' + esc(x.id) + '"><b>' + esc(x.titulo || 'Movimiento') + '</b><small>' + fmtCorta(x.fechas.inicio) + (x.extra.categoria ? ' · ' + esc(x.extra.categoria) : '') + '</small></button><span class="hf-fin"><b class="mono monto ' + (esIngreso(x) ? 'ingreso' : 'gasto') + '">' + (esIngreso(x) ? '+' : '−') + fmtSoles(Math.abs(+x.monto || 0)) + '</b></span></div>').join('') + '</div>'
      : vacio('Sin movimientos este mes', 'Lo que gastes en ' + esc(a.nombre) + ' aparecerá aquí.')) +
      '<div class="pie-tarjeta"><button type="button" class="btn pri" data-acc="fin-nuevo" data-libro="' + libro + '" data-ing="0">' + ico('i-plus') + 'Gasto</button><a class="btn" href="#finanzas' + (libro === 'oficina' ? '/oficina' : '') + '">' + ico('i-grafica') + 'Ver el libro ' + libro + '</a></div>' });
}
function vistaSemana(a) {
  const l = proximos(hoy(), 7, a.id), fh = (x) => fmtHora(x, preferencias().formatoHora);
  return tarjeta({ eti: 'SEMANA', titulo: 'Tu semana en ' + esc(a.nombre), n: l.length ? plural(l.length, 'día', 'días') + ' con algo' : null, clase: 'area-' + a.id,
    cuerpo: l.length ? '<div class="prox-lista">' + l.map((d) => '<section class="prox-dia"><button type="button" class="prox-fecha" data-acc="ir-dia" data-dia="' + d.dia + '"><b>' + fmtCorta(d.dia) + '</b><small>' + relativo(d.dia) + '</small></button><div class="mini-bloques">' +
      d.vencen.map((v) => '<button type="button" class="mini-bloque area-' + a.id + '" data-acc="' + (v.tipo === 'pendiente' ? 'p-editar' : 'dato-ver') + '" data-id="' + esc(v.id) + '"><span class="mono">' + (v.plazoLegal ? '⚖️' : '⏳') + '</span><b>' + esc(v.titulo) + '</b></button>').join('') +
      d.todoDia.map((t) => '<button type="button" class="mini-bloque area-' + a.id + '" data-acc="ev-editar" data-id="' + esc(t.id) + '"><span class="mono">día</span><b>' + esc(t.titulo) + '</b></button>').join('') +
      d.bloques.map((b) => '<button type="button" class="mini-bloque area-' + a.id + '" data-acc="' + (b.tipo === 'pendiente' ? 'p-editar' : b.tipo === 'evento' ? 'ev-editar' : 'dato-ver') + '" data-id="' + esc(b.id) + '"><span class="mono">' + fh(b.hIni) + '</span><b>' + esc(b.titulo) + '</b></button>').join('') +
      d.sinHora.map((s) => '<button type="button" class="mini-bloque area-' + a.id + '" data-acc="p-editar" data-id="' + esc(s.id) + '"><span class="mono">•</span><b>' + esc(s.titulo) + '</b></button>').join('') + '</div></section>').join('') + '</div>'
      : vacio('Semana libre', 'Nada de ' + esc(a.nombre) + ' en los próximos 7 días.') });
}
