/* MÁS: lo que no cabe en la barra de abajo (Seguimiento, Finanzas, Notas,
   Ajustes, Papelera y Tus datos). */
import { ico, explica } from '../util/dom.js';

export const SECCIONES_MAS = [
  ['seguimiento', 'Seguimiento', 'i-seg', 'Tu semana área por área, hábitos, metas y la revisión semanal.', 0],
  ['finanzas', 'Finanzas', 'i-dinero', 'Tus dos libros de cuentas (personal y oficina), pagos fijos, presupuesto e informes.', 0],
  ['notas', 'Notas', 'i-nota', 'Notas por área con casillas, y tu diario.', 0],
  ['ajustes', 'Ajustes', 'i-ajustes', 'Preferencias, seguridad, áreas, respaldo, nube y papelera.', 0],
  ['papelera', 'Papelera', 'i-basura', 'Lo que borres se recupera durante 30 días.', 0],
  ['datos', 'Tus datos', 'i-buscar', 'Todo lo que tienes guardado, también lo migrado. Respaldo en Ajustes.', 0]
];

export function vistaMas() {
  return explica('<b>Lo que no cabe abajo.</b> En la laptop todo esto se ve en la barra lateral.') +
    '<div class="mas">' + SECCIONES_MAS.map((s) =>
      '<a class="mas-btn" href="#' + s[0] + '"><span class="ic">' + ico(s[2]) + '</span><b>' + s[1] + '</b><small>' + s[3] + '</small>' +
      '</a>').join('') + '</div>';
}
