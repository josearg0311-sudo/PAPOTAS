/* AGENDA: tu tiempo. Vistas Día, Semana y Mes con su navegación.
   En la Fase 1 el calendario ya se mueve (y respeta el día de inicio de
   semana y la hora de Lima); los eventos y recordatorios llegan en la Fase 4. */
import { hoy, sumarDias, inicioSemana, diaSemana, DIAS, DIAS3, MESES, fmtFecha, fmtCorta, fmtLarga, fmtHora, horaAhora, minutosAhora, relativo } from '../util/fechas.js';
import { ico, vacio } from '../util/dom.js';
import { preferencias } from '../datos/preferencias.js';
import { tarjeta, enFase } from './comun.js';
import { franjaSemana } from './hoy.js';

const ui = { modo: 'dia', dia: null };
export function irADia(d) { ui.dia = d; ui.modo = 'dia'; }

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function cabecera(titulo) {
  return '<div class="cal-nav"><button type="button" class="icono-btn" data-acc="cal-paso" data-n="-1" aria-label="Anterior">' + ico('i-izq') + '</button>' +
    '<b>' + titulo + '</b><button type="button" class="icono-btn" data-acc="cal-paso" data-n="1" aria-label="Siguiente">' + ico('i-der') + '</button>' +
    '<button type="button" class="btn chico" data-acc="cal-hoy">Hoy</button></div>';
}

function vistaDia(d) {
  const p = preferencias(), h = hoy(), ini = +p.vigilia.ini.slice(0, 2), fin = +p.vigilia.fin.slice(0, 2) || 24;
  let filas = '';
  for (let x = ini; x < (fin > ini ? fin : fin + 24); x++) {
    const hh = (x % 24 < 10 ? '0' : '') + (x % 24) + ':00';
    filas += '<div class="hora-fila"><span>' + fmtHora(hh, p.formatoHora) + '</span><i></i></div>';
    if (d === h && Math.floor(minutosAhora() / 60) === x % 24) filas += '<div class="ahora"><span>' + fmtHora(horaAhora(), p.formatoHora) + '</span><i></i></div>';
  }
  return franjaSemana(d, 'cal-dia') + cabecera(cap(relativo(d)) + ' · ' + fmtFecha(d)) +
    '<div class="linea-dia">' + filas + '</div>';
}

function vistaSemana(d) {
  const p = preferencias(), ini = inicioSemana(d, p.semanaLunes), h = hoy();
  const fin = sumarDias(ini, 6);
  return cabecera(fmtCorta(ini, false) + ' – ' + fmtCorta(fin, false)) +
    '<div class="semana-lista">' + [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const x = sumarDias(ini, i);
      return '<button type="button" class="semana-dia' + (x === h ? ' es-hoy' : '') + '" data-acc="cal-dia" data-dia="' + x + '"><span class="sd-fecha"><small>' + DIAS3[diaSemana(x)] + '</small><b>' + +x.slice(8) + '</b></span><span class="sd-txt">Sin nada agendado</span>' + ico('i-der') + '</button>';
    }).join('') + '</div>';
}

function vistaMes(d) {
  const p = preferencias(), h = hoy(), primero = d.slice(0, 8) + '01';
  const ini = inicioSemana(primero, p.semanaLunes);
  const cab = (p.semanaLunes ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]).map((w) => '<span>' + DIAS3[w] + '</span>').join('');
  let celdas = '';
  for (let i = 0; i < 42; i++) {
    const x = sumarDias(ini, i);
    if (i === 35 && x.slice(0, 7) !== d.slice(0, 7)) break;
    celdas += '<button type="button" class="mes-dia' + (x.slice(0, 7) !== d.slice(0, 7) ? ' fuera' : '') + (x === h ? ' es-hoy' : '') + (x === d ? ' sel' : '') + '" data-acc="cal-dia" data-dia="' + x + '" aria-label="' + fmtLarga(x) + '">' + +x.slice(8) + '</button>';
  }
  const [y, m] = d.split('-');
  return cabecera(cap(MESES[+m - 1]) + ' ' + y) + '<div class="mes"><div class="mes-cab">' + cab + '</div><div class="mes-grilla">' + celdas + '</div></div>' +
    '<div class="t-cab"><span class="eti">' + fmtFecha(d) + '</span><h2>' + cap(fmtLarga(d)) + '</h2></div>' + vacio('Día libre', 'Toca + para agendar algo este día.');
}

export function vistaAgenda() {
  const d = ui.dia || hoy();
  const cuerpo = ui.modo === 'semana' ? vistaSemana(d) : ui.modo === 'mes' ? vistaMes(d) : vistaDia(d);
  return tarjeta({ titulo: 'Tu tiempo', guia: '<b>Agenda = tu tiempo.</b> Aquí verás los eventos con hora y los recordatorios de cada día, en vista de día, semana o mes. Las flechas avanzan o retroceden; «Hoy» te trae de vuelta.',
    cuerpo: '<div class="segmento" role="group" aria-label="Vista">' + [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']].map((o) =>
      '<button type="button" data-acc="cal-modo" data-v="' + o[0] + '" aria-pressed="' + (ui.modo === o[0]) + '">' + o[1] + '</button>').join('') + '</div>' + cuerpo +
      enFase(4, 'tus eventos, clases, pagos y recordatorios en el calendario, con plazos ⚠️ y 🔴 y el plazo legal siempre primero.') });
}

export const acciones = {
  'cal-modo'(b) { ui.modo = b.dataset.v; return true; },
  'cal-dia'(b) { ui.dia = b.dataset.dia; if (ui.modo === 'semana') ui.modo = 'dia'; return true; },
  'cal-hoy'() { ui.dia = hoy(); return true; },
  'cal-paso'(b) {
    const n = +b.dataset.n, d = ui.dia || hoy();
    if (ui.modo === 'dia') ui.dia = sumarDias(d, n);
    else if (ui.modo === 'semana') ui.dia = sumarDias(d, 7 * n);
    else { let [y, m] = d.split('-').map(Number); m += n; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } ui.dia = y + '-' + (m < 10 ? '0' : '') + m + '-01'; }
    return true;
  }
};
