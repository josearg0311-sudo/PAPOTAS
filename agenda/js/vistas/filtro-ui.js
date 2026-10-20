/* El filtro por espacio (Agenda 7.1): un solo botón «Todo ▾» arriba de cada
   sección que abre las opciones (acciones «filtro-abrir» y «filtro» en app.js).
   Antes era una fila de cinco botones repetida en todas las pantallas. */
import { AREAS, area } from '../datos/areas.js';
import { filtro } from '../datos/filtro.js';
import { esc, ico } from '../util/dom.js';

export function barraFiltro() {
  const f = filtro(), a = f ? area(f) : null;
  return '<div class="filtro6-fila"><button type="button" class="filtro6-btn' + (a ? ' area-' + a.id + ' puesto' : '') + '" data-acc="filtro-abrir" aria-haspopup="dialog" aria-label="Espacio: ' + (a ? esc(a.nombre) : 'Todo') + '. Cambiar">' +
    (a ? '<i aria-hidden="true"></i>' : '') + '<span>' + (a ? esc(a.nombre) : 'Todo') + '</span>' + ico('i-abajo') + '</button></div>';
}

/* Lo que va en la hoja que se abre */
export function opcionesFiltro() {
  const f = filtro();
  return '<p class="ayuda">Elige un espacio para ver solo lo suyo en todas las secciones. Se recuerda.</p><div class="menu6 filtro6-ops">' +
    '<button type="button" class="opcion-fila" data-acc="filtro" data-v="" aria-pressed="' + !f + '"><span>Todo</span>' + (!f ? ico('i-check') : '') + '</button>' +
    AREAS.map((a) => '<button type="button" class="opcion-fila area-' + a.id + '" data-acc="filtro" data-v="' + a.id + '" aria-pressed="' + (f === a.id) + '"><i aria-hidden="true"></i><span>' + esc(a.nombre) + '</span>' + (f === a.id ? ico('i-check') : '') + '</button>').join('') + '</div>';
}
