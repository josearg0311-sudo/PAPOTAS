/* Cálculos compartidos por los espacios (sin vistas, para no enredar imports) */
import { elementos } from '../datos/datos.js';
import { listas, esChecklist } from '../datos/pendientes.js';

/* Tareas pendientes de un espacio (sin contar lo de las listas para marcar) */
export function tareasDe(area) {
  const check = new Set(listas().filter(esChecklist).map((l) => l.id));
  return elementos((x) => x.tipo === 'pendiente' && x.area === area && x.estado !== 'hecho' && x.estado !== 'cancelado' && !check.has(x.lista)).length;
}
