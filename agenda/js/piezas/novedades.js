/* NOVEDADES: qué trae esta versión, con un enlace a cada cosa.
   Se abre sola UNA vez al actualizar de una 5.x anterior (la primera vez que
   se usa la app no: para eso está el recorrido) y siempre desde Ajustes → Ayuda. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { leer, escribir } from '../datos/almacen.js';
import { VERSION } from '../version.js';
import { esc } from '../util/dom.js';

const CLAVE = 'agenda5_version';
export const NOVEDADES = [
  ['Ordenada por lo que haces', '🧭', 'Abajo: Hoy, Calendario, Agregar, Tareas y Cuentas. Arriba: Notas, Buscar y Tú. Ya no hay «Más» ni «Mostrar todo».', '#hoy'],
  ['Tus espacios, como filtro', '🎯', 'Arriba de cada sección eliges Personal, Estudios, Oficina o Deporte y ves solo lo de ese espacio. Se recuerda.', '#tareas'],
  ['Cada herramienta en su lugar', '🧰', 'Cobros, horas y préstamos en Cuentas; clases, exámenes y cumpleaños en Calendario; plazos legales y la casa en Tareas; diario, fichas y actas en Notas.', '#cuentas'],
  ['Tú', '⭐', 'Tus hábitos, metas, entrenos, peso, la revisión semanal y los ajustes, juntos.', '#tu'],
  ['Más fino', '✨', 'Lo atrasado dice hace cuántos días, el menú ⋯ dice cuándo toca, el horario no se encima, gastos de otro día y plantillas para tu primera lista.', '#calendario']
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
