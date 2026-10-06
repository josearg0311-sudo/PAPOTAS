/* MÁS: lo que no cabe en la barra de abajo (Seguimiento, Finanzas, Notas,
   Ajustes, Papelera y Tus datos). */
import { ico } from '../util/dom.js';

export const SECCIONES_MAS = [
  ['recordatorios', 'Recordatorios', 'i-tareas', 'Tus listas: lo de hoy, más tarde, mañana y algún día.', 0],
  ['areas', 'Espacios', 'i-espacios', 'Personal, Estudios, Oficina y Deporte, cada uno con sus herramientas.', 0],
  ['habitos', 'Hábitos', 'i-habitos', 'Lo que haces seguido, con tu racha, espacio por espacio.', 0],
  ['seguimiento', 'Seguimiento', 'i-diana', 'Tu semana área por área, metas y la revisión semanal.', 0],
  ['finanzas', 'Dinero', 'i-grafica', 'Tus dos libros (personal y oficina), pagos fijos, presupuesto e informes.', 0],
  ['notas', 'Notas', 'i-notas', 'Notas por espacio con casillas, y tu diario.', 0],
  ['ajustes', 'Ajustes y respaldo', 'i-ajustes', 'Preferencias, PIN, espacios, respaldo y nube.', 0],
  ['papelera', 'Papelera', 'i-basura', 'Lo que borres se recupera durante 30 días.', 0],
  ['datos', 'Tus datos', 'i-buscar', 'Todo lo que tienes guardado, también lo migrado.', 0]
];

export function vistaMas() {
  return '<div class="mas">' + SECCIONES_MAS.map((s) =>
      '<a class="mas-btn" href="#' + s[0] + '"><span class="ic">' + ico(s[2]) + '</span><b>' + s[1] + '</b><small>' + s[3] + '</small>' +
      '</a>').join('') + '</div>';
}
