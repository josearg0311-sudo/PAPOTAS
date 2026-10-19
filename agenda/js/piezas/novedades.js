/* NOVEDADES: qué trae esta versión, con un enlace a cada cosa.
   Se abre sola UNA vez al actualizar de una 5.x anterior (la primera vez que
   se usa la app no: para eso está el recorrido) y siempre desde Ajustes → Ayuda. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { leer, escribir } from '../datos/almacen.js';
import { VERSION } from '../version.js';
import { esc } from '../util/dom.js';

const CLAVE = 'agenda5_version';
export const NOVEDADES = [
  ['Nombres claros', '🧭', 'Las cuatro secciones se llaman por lo que son: Hoy, Calendario, Listas y Cuentas. Cada una dice arriba para qué sirve.', '#plan'],
  ['Botones que dicen lo que hacen', '👆', '«Agregar» en la barra, «Anotar gasto», «Concentrarme 25 min», «Marcar hecho». Y cada pendiente tiene ⋯ con sus opciones escritas.', '#hoy'],
  ['Agregar, explicado', '⚡', 'La hoja de Agregar te dice qué entiende, empieza en «Automático» y te deja elegir qué guardar con un toque.', 'agregar'],
  ['Cuentas más completas', '💰', 'Presupuesto, Excel e informe en PDF ahí mismo. Toca una categoría de «Cómo vas» para ver solo esos gastos.', '#plata'],
  ['Sin repetidos', '🧹', 'Cada cosa está en un solo lugar: Recordatorios ahora vive dentro de Listas y Agenda dentro de Calendario.', '#listas'],
  ['Diseño parejo', '✨', 'Todas las tarjetas con la misma forma, sin bordes punteados y con títulos del mismo tamaño.', '#hoy']
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
