/* La fila «Todo · Personal · Estudios · Oficina · Deporte» de arriba de cada
   sección (acción «filtro» en app.js). */
import { AREAS } from '../datos/areas.js';
import { filtro } from '../datos/filtro.js';
import { esc } from '../util/dom.js';

export function barraFiltro() {
  const f = filtro();
  return '<nav class="filtro6" aria-label="Filtrar por espacio">' +
    '<button type="button" data-acc="filtro" data-v="" aria-pressed="' + !f + '">Todo</button>' +
    AREAS.map((a) => '<button type="button" class="area-' + a.id + '" data-acc="filtro" data-v="' + a.id + '" aria-pressed="' + (f === a.id) + '"><i aria-hidden="true"></i>' + esc(a.nombre) + '</button>').join('') + '</nav>';
}
