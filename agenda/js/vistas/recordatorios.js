/* RECORDATORIOS: listas con casillas, ordenadas por cuándo.
   Grupos: Para hoy · Más tarde · Mañana · Próximos días · Algún día · Hecho. */
import { hoy, sumarDias, fmtCorta } from '../util/fechas.js';
import { vacio, ico } from '../util/dom.js';
import { tarjeta, enFase } from './comun.js';

export const GRUPOS = [
  ['hoy', 'Para hoy', 'Nada pendiente para hoy.'],
  ['tarde', 'Más tarde', 'Lo que pases a «Más tarde» aparece aquí.'],
  ['manana', 'Mañana', 'Mañana lo tienes libre.'],
  ['prox', 'Próximos días', 'Nada programado para los próximos días.'],
  ['algun', 'Algún día', 'Ideas sin fecha: guárdalas aquí para no olvidarlas.'],
  ['hecho', 'Hecho', 'Lo que marques como hecho baja aquí.']
];

export function vistaRecordatorios() {
  const h = hoy();
  let html = '<div class="listas" role="group" aria-label="Tus listas">' +
    '<button type="button" class="lista-btn" aria-pressed="true">Todos <span class="n">0</span></button>' +
    '<button type="button" class="lista-btn nueva" data-acc="fase" data-n="3">' + ico('i-plus') + 'Nueva lista</button></div>' +
    tarjeta({ eti: 'TODAS LAS LISTAS', titulo: 'Todos mis recordatorios',
      guia: '<b>Cómo funciona:</b> cada lista (Trámites, Llamadas, Exp. 04521…) ordena sus recordatorios por <b>cuándo</b>. Toca la casilla cuando lo hagas. Si hoy no da, usa <b>Más tarde</b>, <b>Mañana</b> o <b>Día…</b>. Al final del día, <b>Cerrar el día</b> pasa lo pendiente a mañana.',
      cuerpo: '<div class="medidor" role="group" aria-label="Resumen por momento">' + GRUPOS.map((g) =>
        '<a class="medidor-btn" href="#recordatorios" data-acc="saltar" data-v="' + g[0] + '"><b>0</b><small>' + g[1] + '</small></a>').join('') + '</div>' +
        '<form class="anadir" data-acc="fase-form"><label for="nuevoRec" class="solo-lector">Nuevo recordatorio</label>' +
        '<textarea id="nuevoRec" rows="1" placeholder="Nuevo… ej. «llamar al notario mañana 10am». Pega varias líneas para crear varios."></textarea>' +
        '<button type="submit" class="btn pri" aria-label="Agregar">' + ico('i-plus') + '</button></form>' +
        enFase(3, 'crear listas, marcar, pasar a más tarde o mañana, deslizar con el dedo y cerrar el día. En la Fase 2 se migran tus recordatorios, tareas y listas actuales.') });
  GRUPOS.forEach((g) => {
    const sub = g[0] === 'hoy' ? ' · ' + fmtCorta(h) : g[0] === 'manana' ? ' · ' + fmtCorta(sumarDias(h, 1)) : '';
    html += '<section class="tarjeta grupo" id="g-' + g[0] + '"><div class="grupo-tit"><span>' + g[1] + sub + '</span><span class="linea"></span><span class="mono">0</span></div>' + vacio('', g[2]) + '</section>';
  });
  html += '<div class="fila-botones izq"><button type="button" class="btn" data-acc="fase" data-n="3">' + ico('i-luna2') + 'Cerrar el día: pasar lo pendiente a mañana</button></div>';
  return html;
}

export const acciones = {
  saltar(b, ev) { ev.preventDefault(); const g = document.getElementById('g-' + b.dataset.v); if (g) g.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
};
