/* NOVEDADES: qué trae esta versión, con un enlace a cada cosa.
   Se abre sola UNA vez al actualizar de una 5.x anterior (la primera vez que
   se usa la app no: para eso está el recorrido) y siempre desde Ajustes → Ayuda. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { leer, escribir } from '../datos/almacen.js';
import { VERSION } from '../version.js';
import { esc } from '../util/dom.js';

const CLAVE = 'agenda5_version';
export const NOVEDADES = [
  ['Se ve como tu Agenda de siempre', '🏠', 'Barra lateral con tus espacios, «Tus espacios» en Hoy, cada espacio con sus emojis, cifras y mosaicos, y Hábitos y Dinero como antes.', '#hoy'],
  ['Hábitos', '🔥', 'Tus hábitos de hoy en anillos y los últimos 14 días, separados por espacio.', '#habitos'],
  ['Buscar', '🔎', 'Toca la lupa (o la tecla /) y escribe lo que buscas o lo que quieres hacer.', 'buscar'],
  ['Hoy', '☀️', '«Qué hacer ahora» por área, lo siguiente de tu día, cómo viene mañana y tus números al final del día.', '#hoy'],
  ['Recordatorios', '✅', 'Ordena los atrasados uno por uno, elige varios a la vez, comparte y duplica listas.', '#recordatorios'],
  ['Agenda', '📅', 'Vistas Año y Lista, huecos libres del día y traer eventos de otro calendario (.ics).', '#agenda'],
  ['Finanzas', '💰', '«Cómo vas» frente al mes pasado, cuánto puedes gastar por día, gastos que se repiten e informe en PDF.', '#finanzas'],
  ['Notas y diario', '📝', 'Pasa una nota a lista para marcar, compártela; el diario trae una pregunta del día y «Un día como hoy».', '#notas/diario'],
  ['Personal', '🏠', 'Menú con ideas peruanas 🎲, saludar por cumpleaños y recordatorio del regalo.', '#areas/personal/menu'],
  ['Oficina', '💼', 'Recuerda un cobro por WhatsApp con el mensaje ya escrito.', '#areas/oficina/cobros'],
  ['Deporte', '🏃', 'Tu IMC con tu talla y un cronómetro de descanso entre series.', '#areas/deporte/peso'],
  ['Agregar rápido', '🎤', 'Dicta con tu voz (en los teléfonos que lo permiten).', 'agregar']
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
