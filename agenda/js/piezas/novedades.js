/* NOVEDADES: qué trae esta versión, con un enlace a cada cosa.
   Se abre sola UNA vez al actualizar de una 5.x anterior (la primera vez que
   se usa la app no: para eso está el recorrido) y siempre desde Ajustes → Ayuda. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { leer, escribir } from '../datos/almacen.js';
import { VERSION } from '../version.js';
import { esc } from '../util/dom.js';

const CLAVE = 'agenda5_version';
export const NOVEDADES = [
  ['Cara nueva, propia', '📒', 'Logo nuevo y cara de libreta: tinta verde (o papel crema en claro), títulos con serifa y un marcatextos amarillo para lo de hoy.', '#hoy'],
  ['Recordatorios', '✅', 'Abajo, a un toque. Desliza una fila para moverla o terminarla.', '#recordatorios'],
  ['Listas para marcar', '☑️', 'Compras, maleta, mochila… cada lista con su avance y lo que falta.', '#listas'],
  ['Agenda y Horario', '📅', 'Tu día, semana y mes; y el Horario con tus clases y eventos de la semana por hora.', '#horario'],
  ['Cuentas', '💰', 'Personal y Oficina separadas, con lo gastado y lo que ingresó; también en Hoy.', '#cuentas'],
  ['Añadir rápido en Hoy', '⚡', 'Escribe «llamar a Ana mañana 10am» y queda con fecha y hora.', '#hoy']
];

export function abrirNovedades() {
  const hoja = abrirHoja('Novedades de la versión ' + esc(VERSION), '<p class="ayuda">Lo nuevo, cada cosa en su sección. Toca una para verla.</p><div class="bus-grupo">' +
    NOVEDADES.map(([t, e, d, ir]) => (ir.startsWith('#') ? '<a class="bus-fila" href="' + ir + '"' : '<button type="button" class="bus-fila" data-nov="' + ir + '"') +
      '><span class="bus-ico" aria-hidden="true">' + e + '</span><span><b>' + t + '</b><small>' + d + '</small></span>' + (ir.startsWith('#') ? '</a>' : '</button>')).join('') + '</div>');
  hoja.addEventListener('click', (ev) => {
    const a = ev.target.closest('a.bus-fila'); if (a) { cerrarHoja(true); return; }
    const b = ev.target.closest('[data-nov]'); if (!b) return;
    cerrarHoja(true);
    setTimeout(() => document.querySelector(b.dataset.nov === 'buscar' ? '#btnBuscar' : '#fab')?.click(), 50);
  });
}

/* Al abrir: si venías de otra 5.x, las muestra una vez; si es la primera vez, solo anota la versión */
export function revisarNovedades(primeraVez) {
  const antes = leer(CLAVE, '');
  if (antes === VERSION) return false;
  escribir(CLAVE, VERSION);
  if (!antes || primeraVez) return false;
  setTimeout(abrirNovedades, 500);
  return true;
}
