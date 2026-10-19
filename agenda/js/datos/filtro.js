/* FILTRO POR ESPACIO (Agenda 7): Todo, Personal, Estudios, Oficina o Deporte.
   Se elige arriba de cada sección y se recuerda (agenda5_filtro). */
import { AREAS, area } from './areas.js';
import { leer, escribir } from './almacen.js';

const CLAVE = 'agenda5_filtro';
export function filtro() { const f = leer(CLAVE, ''); return AREAS.some((a) => a.id === f) ? f : ''; }
export function ponerFiltro(id) { escribir(CLAVE, AREAS.some((a) => a.id === id) ? id : ''); }
/* ¿Este elemento pasa el filtro? (sin filtro, todo pasa) */
export const pasa = (x, f = filtro()) => !f || (!!x && area(x.area).id === f);
