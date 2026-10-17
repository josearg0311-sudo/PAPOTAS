/* NOVEDADES: qué trae esta versión, con un enlace a cada cosa.
   Se abre sola UNA vez al actualizar de una 5.x anterior (la primera vez que
   se usa la app no: para eso está el recorrido) y siempre desde Ajustes → Ayuda. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { leer, escribir } from '../datos/almacen.js';
import { VERSION } from '../version.js';
import { esc } from '../util/dom.js';

const CLAVE = 'agenda5_version';
export const NOVEDADES = [
  ['El + más listo', '⚡', 'Varias cosas a la vez («almuerzo 25; taxi 10»), gastos de ayer («taxi 15 ayer»), lo que se repite («gym cada lunes 7am»), tus gastos de siempre en un toque y dictar con la voz.', 'agregar'],
  ['Foco dentro de Hoy', '⏱️', '«Empezar foco» convierte «Ahora» en una cuenta regresiva; puedes pausar y seguir. De noche, cierra el día y mira cómo viene mañana.', '#hoy'],
  ['Plata: cómo vas', '💰', 'Tus últimos 7 días en barras, cuánto puedes gastar por día y en qué se te va más. El teclado ahora suma (12.50 + 8).', '#plata'],
  ['Plan', '📅', 'Tu semana en números y, en la laptop, toca una hora libre del horario para crear un evento.', '#plan'],
  ['Listas', '☑️', 'Plantillas (súper, maleta, gym, mudanza, fiesta) y buscador cuando tienes muchas.', '#listas'],
  ['Arreglos', '🔧', 'Lo urgente siempre aparece en Hoy, «1,250» siempre es mil doscientos cincuenta y Plata ya no se sale de la pantalla.', '#hoy']
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
