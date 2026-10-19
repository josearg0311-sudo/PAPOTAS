/* MÁS (Agenda 6): lo que no va en las cuatro secciones. Lo de todos los días
   primero; con «Mostrar todo», también los espacios y el seguimiento. */
import { ico } from '../util/dom.js';

export const SECCIONES_MAS = [
  ['notas', 'Notas', 'i-notas', 'Tus apuntes y tu diario. También desde el +: «nota: …».', 0],
  ['habitos', 'Hábitos', 'i-habitos', 'Lo que haces seguido, con tu racha.', 0],
  ['ajustes', 'Ajustes y respaldo', 'i-ajustes', 'PIN, respaldo, nube y cómo se ve la agenda.', 0],
  ['agenda', 'Agenda avanzada', 'i-cal', 'Vista de año, lista de 60 días, filtros por espacio y .ics.', 0],
  ['finanzas', 'Cuentas avanzadas', 'i-grafica', 'Informe de meses, gastos por espacio y repetidos.', 0],
  ['areas', 'Espacios', 'i-espacios', 'Personal, Estudios, Oficina y Deporte con sus herramientas.', 0],
  ['seguimiento', 'Seguimiento', 'i-diana', 'Tu semana área por área y la revisión semanal.', 0],
  ['papelera', 'Papelera', 'i-basura', 'Lo que borres se recupera durante 30 días.', 0],
  ['datos', 'Tus datos', 'i-buscar', 'Todo lo que tienes guardado, también lo migrado.', 0]
];

import { preferencias } from '../datos/preferencias.js';

/* En modo simple: solo lo de todos los días */
const SIMPLE = ['notas', 'habitos', 'ajustes', 'papelera'];   /* los espacios solo con «Mostrar todo» */
export function vistaMas() {
  return '<div class="mas">' + SECCIONES_MAS.filter((s) => preferencias().completo || SIMPLE.includes(s[0])).map((s) =>
      '<a class="mas-btn" href="#' + s[0] + '"><span class="ic">' + ico(s[2]) + '</span><b>' + s[1] + '</b><small>' + s[3] + '</small>' +
      '</a>').join('') + '</div>';
}
