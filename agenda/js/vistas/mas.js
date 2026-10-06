/* MÁS y las secciones que viven dentro: Seguimiento, Finanzas, Notas y
   Papelera (en esta fase muestran qué traerán y en qué fase). */
import { ico, vacio, explica } from '../util/dom.js';
import { tarjeta, enFase } from './comun.js';

export const SECCIONES_MAS = [
  ['seguimiento', 'Seguimiento', 'i-seg', 'Hábitos, metas, rachas, revisión semanal y balance por área.', 6],
  ['finanzas', 'Finanzas', 'i-dinero', 'Pagos fijos, movimientos personales y de oficina, cobros y préstamos.', 7],
  ['notas', 'Notas', 'i-nota', 'Notas, listas de compras y diario.', 7],
  ['ajustes', 'Ajustes', 'i-ajustes', 'Preferencias, seguridad, áreas, respaldo, nube y papelera.', 0],
  ['papelera', 'Papelera', 'i-basura', 'Lo que borres se recupera durante 30 días.', 2]
];

export function vistaMas() {
  return explica('<b>Lo que no cabe abajo.</b> En la laptop todo esto se ve en la barra lateral.') +
    '<div class="mas">' + SECCIONES_MAS.map((s) =>
      '<a class="mas-btn" href="#' + s[0] + '"><span class="ic">' + ico(s[2]) + '</span><b>' + s[1] + '</b><small>' + s[3] + '</small>' +
      (s[4] ? '<span class="fase-chip">Fase ' + s[4] + '</span>' : '<span class="fase-chip lista">Listo</span>') + '</a>').join('') + '</div>';
}

const DETALLE = {
  seguimiento: ['Hábitos y metas', 'Tus hábitos con racha, tus metas con su avance, la revisión semanal (lo completado y el tiempo por área, el área descuidada y los plazos de la próxima semana) y el balance de horas por área.', 'Aún no hay nada que seguir', 'Cuando tengas hábitos y metas, verás aquí tus rachas.'],
  finanzas: ['Tu dinero', 'Pagos fijos con aviso antes de vencer, tus movimientos personales y de la oficina en soles, cobros y préstamos. Los dos libros de cuentas dejan de ser una app aparte.', 'Sin movimientos todavía', 'Tus movimientos actuales se migran en la Fase 2.'],
  notas: ['Notas, listas y diario', 'Tus notas (con casillas), listas de compras y el diario de cada día, organizados por área.', 'Sin notas todavía', 'Tus notas actuales se migran en la Fase 2.'],
  papelera: ['Papelera', 'Lo que borres queda aquí 30 días y puedes devolverlo a su sitio con un toque.', 'La papelera está vacía', 'Cuando borres algo, lo encontrarás aquí.']
};

export function vistaSeccion(id) {
  const s = SECCIONES_MAS.find((x) => x[0] === id), d = DETALLE[id];
  return '<a class="btn volver" href="#mas">' + ico('i-izq') + 'Más</a>' +
    tarjeta({ titulo: d[0], guia: '<b>Qué tendrá:</b> ' + d[1], cuerpo: vacio(d[2], d[3]) + enFase(s[4], 'esta sección completa.') });
}
