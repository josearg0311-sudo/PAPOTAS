/* AGENDA: tu tiempo. Día (línea de tiempo con bloques a escala), Semana y
   Mes, con filtro por área, feriados del Perú y vencimientos (plazo legal
   primero, ⚠️ vence pronto, 🔴 vencido). Toca un hueco para crear un evento. */
import { hoy, sumarDias, inicioSemana, diaSemana, DIAS3, MESES, fmtFecha, fmtCorta, fmtLarga, fmtHora, horaAhora, minutosAhora, relativo, plazo } from '../util/fechas.js';
import { ico, vacio, esc } from '../util/dom.js';
import { fmtSoles } from '../util/dinero.js';
import { preferencias } from '../datos/preferencias.js';
import { AREAS, area, chipArea } from '../datos/areas.js';
import { delDia, resumenDia } from '../datos/calendario.js';
import { feriado } from '../datos/feriados.js';
import { ordenar } from '../datos/pendientes.js';
import { filaPendiente } from '../piezas/pendientes-ui.js';
import { editarEvento, nuevoEvento, alternarPago, exportarTodo } from '../piezas/eventos-ui.js';
import { aviso } from '../piezas/aviso.js';
import { tarjeta } from './comun.js';

const ui = { modo: 'dia', dia: null, area: '' };
export function irADia(d) { ui.dia = d; ui.modo = 'dia'; }
const PX_MIN = 0.8;   // 48 px por hora
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ETQ = { pago: 'Pago fijo', cobro: 'Cobro', documento: 'Documento', prestamo: 'Préstamo', pendiente: 'Plazo' };

function cabecera(titulo) {
  return '<div class="cal-nav"><button type="button" class="icono-btn" data-acc="cal-paso" data-n="-1" aria-label="Anterior">' + ico('i-izq') + '</button>' +
    '<b>' + titulo + '</b><button type="button" class="icono-btn" data-acc="cal-paso" data-n="1" aria-label="Siguiente">' + ico('i-der') + '</button>' +
    '<button type="button" class="btn chico" data-acc="cal-hoy">Hoy</button></div>';
}
function filtroAreas() {
  return '<div class="fichas" role="group" aria-label="Área"><button type="button" data-acc="cal-area" data-v="" aria-pressed="' + !ui.area + '">Todas</button>' +
    AREAS.map((a) => '<button type="button" class="ficha-area area-' + a.id + '" data-acc="cal-area" data-v="' + a.id + '" aria-pressed="' + (ui.area === a.id) + '">' + a.nombre + '</button>').join('') + '</div>';
}
function filaVence(v, dia) {
  const h = hoy(), n = v.hecho ? { nivel: 'sin' } : plazo(dia, h);
  const pill = v.plazoLegal ? '<span class="pill legal">PLAZO LEGAL</span>' : '';
  const est = v.hecho ? '<span class="pill">' + (v.tipo === 'pago' ? 'pagado' : 'hecho') + '</span>' : n.nivel === 'vencido' ? '<span class="pill venc">🔴 vencido</span>' : n.nivel === 'pronto' ? '<span class="pill pronto">⚠️ ' + esc(n.texto) + '</span>' : '';
  return '<div class="vence-fila area-' + area(v.area).id + (v.hecho ? ' hecho' : '') + '">' +
    (v.tipo === 'pago' ? '<button type="button" class="casilla" role="checkbox" aria-checked="' + v.hecho + '" data-acc="cal-pago" data-id="' + esc(v.id) + '" data-ym="' + v.ym + '" aria-label="Marcar pagado: ' + esc(v.titulo) + '"><span></span></button>' : '<span class="vence-ico">' + ico('i-campana') + '</span>') +
    '<button type="button" class="vence-txt" data-acc="' + (v.tipo === 'pendiente' ? 'p-editar' : 'dato-ver') + '" data-id="' + esc(v.id) + '"><b>' + esc(v.titulo) + '</b><span class="pend-meta">' + chipArea(v.area) + '<span>' + ETQ[v.tipo] + (v.monto ? ' · ' + fmtSoles(v.monto) : '') + '</span>' + pill + est + '</span></button></div>';
}

/* ---------- Día ---------- */
function lineaTiempo(dia, bloques) {
  const p = preferencias(), h = hoy();
  let ini = +p.vigilia.ini.slice(0, 2) * 60, fin = (+p.vigilia.fin.slice(0, 2) || 24) * 60;
  if (fin <= ini) fin = 24 * 60;
  bloques.forEach((b) => { ini = Math.min(ini, Math.floor(b.ini / 60) * 60); fin = Math.max(fin, Math.min(24 * 60, Math.ceil(b.fin / 60) * 60)); });
  /* carriles para lo que se pisa (por grupo: lo que no choca con nada usa todo el ancho) */
  let grupo = [], carriles = [], finGrupo = -1;
  const cerrar = () => { grupo.forEach((b) => { b.n = Math.max(1, carriles.length); }); grupo = []; carriles = []; };
  bloques.forEach((b) => {
    if (b.ini >= finGrupo) cerrar();
    let c = carriles.findIndex((f) => f <= b.ini); if (c < 0) { c = carriles.length; carriles.push(0); }
    carriles[c] = b.fin; b.carril = c; grupo.push(b); finGrupo = Math.max(finGrupo, b.fin);
  });
  cerrar();
  let html = '<div class="linea-tiempo" style="height:' + Math.round((fin - ini) * PX_MIN) + 'px">';
  for (let m = ini; m < fin; m += 60) {
    const hh = String(m / 60).padStart(2, '0') + ':00';
    html += '<button type="button" class="hueco" style="top:' + Math.round((m - ini) * PX_MIN) + 'px" data-acc="cal-hueco" data-h="' + hh + '" aria-label="Crear evento a las ' + fmtHora(hh, p.formatoHora) + '"><span>' + fmtHora(hh, p.formatoHora) + '</span></button>';
  }
  bloques.forEach((b) => {
    const top = Math.round((b.ini - ini) * PX_MIN), alto = Math.max(26, Math.round((b.fin - b.ini) * PX_MIN) - 2);
    const acc = b.tipo === 'pendiente' ? 'p-editar' : b.tipo === 'evento' ? 'ev-editar' : 'dato-ver';
    html += '<button type="button" class="ev-bloque area-' + area(b.area).id + (alto < 44 ? ' corto' : '') + '" style="top:' + top + 'px;height:' + alto + 'px;left:calc(64px + (100% - 64px) * ' + (b.carril / b.n).toFixed(3) + ');width:calc((100% - 64px) / ' + b.n + ' - 4px)" data-acc="' + acc + '" data-id="' + esc(b.id) + '">' +
      '<b>' + esc(b.titulo) + '</b><small>' + fmtHora(b.hIni, p.formatoHora) + '–' + fmtHora(b.hFin, p.formatoHora) + (b.tipo === 'clase' ? ' · clase' : b.tipo === 'pendiente' ? ' · recordatorio' : '') + (b.lugar ? ' · ' + esc(b.lugar) : '') + '</small></button>';
  });
  if (dia === h) { const a = minutosAhora(); if (a >= ini && a <= fin) html += '<div class="ahora-linea" style="top:' + Math.round((a - ini) * PX_MIN) + 'px"><span>' + fmtHora(horaAhora(), p.formatoHora) + '</span><i></i></div>'; }
  return html + '</div>';
}

function panelDia(d, conLinea) {
  const x = delDia(d, ui.area), fer = preferencias().feriados === false ? '' : feriado(d);
  const sinHora = x.sinHora.sort(ordenar);
  let html = '';
  if (fer) html += '<p class="feriado">' + ico('i-bandera') + 'Feriado nacional: <b>' + esc(fer) + '</b></p>';
  if (x.todoDia.length) html += '<div class="todo-dia">' + x.todoDia.map((t) => '<button type="button" class="chip area-' + area(t.area).id + '" data-acc="ev-editar" data-id="' + esc(t.id) + '">' + (t.cumple ? '🎂 ' : '') + esc(t.titulo) + '</button>').join('') + '</div>';
  if (x.vencen.length) html += '<div class="grupo-tit"><span>Vence este día</span><span class="linea"></span><span class="mono">' + x.vencen.length + '</span></div><div class="vencen">' + x.vencen.map((v) => filaVence(v, d)).join('') + '</div>';
  if (conLinea) html += '<div class="grupo-tit"><span>Con hora</span><span class="linea"></span><span class="mono">' + x.bloques.length + '</span></div>' + lineaTiempo(d, x.bloques);
  else if (x.bloques.length) html += '<div class="grupo-tit"><span>Con hora</span><span class="linea"></span><span class="mono">' + x.bloques.length + '</span></div><div class="mini-bloques">' + x.bloques.map((b) => '<button type="button" class="mini-bloque area-' + area(b.area).id + '" data-acc="' + (b.tipo === 'pendiente' ? 'p-editar' : b.tipo === 'evento' ? 'ev-editar' : 'dato-ver') + '" data-id="' + esc(b.id) + '"><span class="mono">' + fmtHora(b.hIni, preferencias().formatoHora) + '</span><b>' + esc(b.titulo) + '</b></button>').join('') + '</div>';
  html += '<div class="grupo-tit"><span>Recordatorios sin hora</span><span class="linea"></span><span class="mono">' + sinHora.length + '</span></div>' +
    (sinHora.length ? '<div class="pends">' + sinHora.map((p) => filaPendiente(p, { verLista: true })).join('') + '</div>' : vacio('', 'Nada sin hora este día.'));
  html += '<div class="pie-tarjeta"><button type="button" class="btn pri" data-acc="cal-nuevo" data-d="' + d + '">' + ico('i-plus') + 'Evento este día</button></div>';
  return html;
}

function vistaDia(d) {
  return '<div class="franja-cal">' + franjaCal(d) + '</div>' + cabecera(cap(relativo(d)) + ' · ' + fmtFecha(d)) + panelDia(d, true);
}
function franjaCal(diaSel) {
  const p = preferencias(), h = hoy(), ini = inicioSemana(diaSel, p.semanaLunes);
  return '<div class="franja" role="group" aria-label="Días de la semana">' + [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = sumarDias(ini, i), r = resumenDia(d, ui.area, h);
    return '<button type="button" data-acc="cal-dia" data-dia="' + d + '" aria-pressed="' + (d === diaSel) + '"' + (d === h ? ' class="es-hoy"' : '') + ' aria-label="' + fmtLarga(d) + '"><small>' + DIAS3[diaSemana(d)] + '</small><b>' + +d.slice(8) + '</b><span class="pts">' + r.areas.slice(0, 4).map((a) => '<i class="area-' + a + '"></i>').join('') + '</span></button>';
  }).join('') + '</div>';
}

/* ---------- Semana ---------- */
function vistaSemana(d) {
  const p = preferencias(), ini = inicioSemana(d, p.semanaLunes), h = hoy();
  return cabecera(fmtCorta(ini, false) + ' – ' + fmtCorta(sumarDias(ini, 6), false)) + '<div class="semana-lista">' + [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const x = sumarDias(ini, i), dd = delDia(x, ui.area), fer = p.feriados === false ? '' : feriado(x);
    const cosas = [].concat(
      dd.vencen.filter((v) => !v.hecho).map((v) => ({ h: '', t: (v.plazoLegal ? '⚖️ ' : '⏳ ') + v.titulo, a: v.area, alerta: true })),
      dd.todoDia.map((t) => ({ h: '', t: (t.cumple ? '🎂 ' : '') + t.titulo, a: t.area })),
      dd.bloques.map((b) => ({ h: fmtHora(b.hIni, p.formatoHora), t: b.titulo, a: b.area })),
      dd.sinHora.filter((s) => s.estado !== 'hecho').map((s) => ({ h: '', t: s.titulo, a: s.area })));
    return '<button type="button" class="semana-dia' + (x === h ? ' es-hoy' : '') + '" data-acc="cal-dia-ir" data-dia="' + x + '"><span class="sd-fecha"><small>' + DIAS3[diaSemana(x)] + '</small><b>' + +x.slice(8) + '</b></span>' +
      '<span class="sd-lista">' + (fer ? '<span class="sd-fer">' + esc(fer) + '</span>' : '') + (cosas.length ? cosas.slice(0, 4).map((c) => '<span class="sd-cosa area-' + area(c.a).id + (c.alerta ? ' alerta' : '') + '"><i></i>' + (c.h ? '<span class="mono">' + c.h + '</span> ' : '') + esc(c.t) + '</span>').join('') + (cosas.length > 4 ? '<span class="sd-mas">+' + (cosas.length - 4) + ' más</span>' : '') : '<span class="sd-libre">Libre</span>') + '</span>' + ico('i-der') + '</button>';
  }).join('') + '</div>';
}

/* ---------- Mes ---------- */
function vistaMes(d) {
  const p = preferencias(), h = hoy(), primero = d.slice(0, 8) + '01', ini = inicioSemana(primero, p.semanaLunes);
  const cab = (p.semanaLunes ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]).map((w) => '<span>' + DIAS3[w] + '</span>').join('');
  let celdas = '';
  for (let i = 0; i < 42; i++) {
    const x = sumarDias(ini, i);
    if (i === 35 && x.slice(0, 7) !== d.slice(0, 7)) break;
    const r = resumenDia(x, ui.area, h), fer = p.feriados === false ? '' : feriado(x);
    celdas += '<button type="button" class="mes-dia' + (x.slice(0, 7) !== d.slice(0, 7) ? ' fuera' : '') + (x === h ? ' es-hoy' : '') + (x === d ? ' sel' : '') + (fer ? ' feriado-dia' : '') + '" data-acc="cal-dia" data-dia="' + x + '" aria-label="' + fmtLarga(x) + (fer ? ', feriado: ' + fer : '') + (r.total ? ', ' + r.total + ' cosas' : '') + '">' +
      '<b>' + +x.slice(8) + '</b><span class="pts">' + (r.legal ? '<i class="legal"></i>' : r.alerta ? '<i class="alerta"></i>' : '') + r.areas.slice(0, 3).map((a) => '<i class="area-' + a + '"></i>').join('') + '</span></button>';
  }
  const [y, m] = d.split('-');
  return cabecera(cap(MESES[+m - 1]) + ' ' + y) + '<div class="mes"><div class="mes-cab">' + cab + '</div><div class="mes-grilla">' + celdas + '</div></div>' +
    '<div class="t-cab"><span class="eti">' + fmtFecha(d) + '</span><h2>' + cap(fmtLarga(d)) + '</h2></div>' + panelDia(d, false);
}

export function vistaAgenda() {
  const d = ui.dia || hoy();
  const cuerpo = ui.modo === 'semana' ? vistaSemana(d) : ui.modo === 'mes' ? vistaMes(d) : vistaDia(d);
  return tarjeta({ titulo: 'Tu tiempo', clase: 'agenda',
    guia: '<b>Agenda = tu tiempo.</b> Eventos, clases, recordatorios y vencimientos (pagos, cobros, documentos y plazos) en vista de día, semana o mes. En la vista Día, <b>toca una hora vacía</b> para crear un evento ahí. Filtra por área con los botones de colores.',
    cuerpo: '<div class="segmento" role="group" aria-label="Vista">' + [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map((o) =>
      '<button type="button" data-acc="cal-modo" data-v="' + o[0] + '" aria-pressed="' + (ui.modo === o[0]) + '">' + o[1] + '</button>').join('') + '</div>' + filtroAreas() + cuerpo }) +
    '<div class="fila-botones izq"><button type="button" class="btn" data-acc="cal-exportar">' + ico('i-bajar') + 'Pasar lo que viene al calendario del teléfono (.ics)</button></div>';
}

export const acciones = {
  'cal-modo'(b) { ui.modo = b.dataset.v; return true; },
  'cal-area'(b) { ui.area = b.dataset.v; return true; },
  'cal-dia'(b) { ui.dia = b.dataset.dia; return true; },
  'cal-dia-ir'(b) { ui.dia = b.dataset.dia; ui.modo = 'dia'; return true; },
  'cal-hoy'() { ui.dia = hoy(); return true; },
  'cal-paso'(b) {
    const n = +b.dataset.n, d = ui.dia || hoy();
    if (ui.modo === 'dia') ui.dia = sumarDias(d, n);
    else if (ui.modo === 'semana') ui.dia = sumarDias(d, 7 * n);
    else { let [y, m] = d.split('-').map(Number); m += n; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } ui.dia = y + '-' + String(m).padStart(2, '0') + '-01'; }
    return true;
  },
  'cal-hueco'(b, ev, repintar) { const [hh] = b.dataset.h.split(':'); nuevoEvento(repintar, { fecha: ui.dia || hoy(), hora: b.dataset.h, horaFin: String((+hh + 1) % 24).padStart(2, '0') + ':00', area: ui.area || 'personal' }); },
  'cal-nuevo'(b, ev, repintar) { nuevoEvento(repintar, { fecha: b.dataset.d, area: ui.area || 'personal' }); },
  'ev-editar'(b, ev, repintar) { editarEvento(b.dataset.id, repintar); },
  'cal-pago'(b, ev, repintar) { const r = alternarPago(b.dataset.id, b.dataset.ym); repintar(); if (r) aviso(r.texto, () => { alternarPago(b.dataset.id, b.dataset.ym); repintar(); }); },
  'cal-exportar'() { const n = exportarTodo(); aviso(n ? 'Archivo con ' + n + ' cosas. Ábrelo para agregarlas a tu calendario.' : 'No hay nada próximo para pasar.'); }
};
