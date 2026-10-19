/* Lo didáctico: el modo guía (explicaciones en cada bloque) y el recorrido
   de bienvenida, que resalta cada parte de la app. */
import { preferencias, cambiarPref } from '../datos/preferencias.js';
import { aviso } from './aviso.js';

export function aplicarGuia() {
  const on = preferencias().guia;
  document.body.classList.toggle('guia', on);
  const b = document.getElementById('btnGuia');
  if (b) b.setAttribute('aria-pressed', String(on));
}
export function alternarGuia() {
  cambiarPref({ guia: !preferencias().guia });
  aplicarGuia();
  aviso(preferencias().guia ? 'Modo guía activado: cada bloque explica cómo funciona.' : 'Modo guía apagado.');
}

/* [título, texto, elemento a resaltar (varios por si uno está oculto)] */
const PASOS = [
  ['Bienvenido a tu Agenda', 'Está ordenada por lo que haces: Hoy, Calendario, Tareas y Cuentas abajo; Notas y Tú arriba. En 5 pasos te la muestro. Puedes repetirlo desde Ajustes.', []],
  ['Agregar lo que sea', 'Toca «Agregar» y escribe como hablas: «almuerzo 25», «llamar a Ana mañana 10am», «compras: leche, pan». Yo entiendo qué es.', ['.barra-mas', '.cap-barra']],
  ['Calendario y Tareas', 'Lo que tiene fecha u hora está en Calendario; lo que tienes que hacer y tus listas para marcar, en Tareas.', ['.barra [data-ir="calendario"]', '.lateral [data-ir="calendario"]']],
  ['Tus espacios, como filtro', 'Arriba de cada sección eliges Personal, Estudios, Oficina o Deporte para ver solo lo de ese espacio, con sus herramientas propias.', ['.filtro6', '.barra [data-ir="tareas"]', '.lateral [data-ir="tareas"]']],
  ['Tú', 'Tus hábitos, tus metas, tu progreso deportivo, tu PIN, la nube y el respaldo.', ['#btnTu', '.lateral .perfil']]
];
let paso = 0;

function visible(el) { return el && (el.offsetParent !== null || getComputedStyle(el).position === 'fixed') && getComputedStyle(el).display !== 'none'; }

function pintar() {
  document.querySelectorAll('.resalta').forEach((x) => x.classList.remove('resalta'));
  const [tit, txt, sels] = PASOS[paso];
  for (const s of sels) { const el = [...document.querySelectorAll(s)].find(visible); if (el) { el.classList.add('resalta'); break; } }
  document.body.classList.add('en-tour');
  const capa = document.getElementById('capaTour');
  capa.innerHTML = '<div class="tour"><div class="tour-caja" role="dialog" aria-modal="true" aria-labelledby="tourTit">' +
    '<div class="tour-paso">Paso ' + (paso + 1) + ' de ' + PASOS.length + '</div>' +
    '<div class="tour-puntos" aria-hidden="true">' + PASOS.map((_, i) => '<i class="' + (i <= paso ? 'si' : '') + '"></i>').join('') + '</div>' +
    '<h2 id="tourTit">' + tit + '</h2><p>' + txt + '</p>' +
    '<div class="fila-botones"><button type="button" class="btn" data-tour="fin">Saltar</button>' +
    '<button type="button" class="btn pri" data-tour="sig">' + (paso === PASOS.length - 1 ? 'Empezar' : 'Siguiente') + '</button></div></div></div>';
  capa.querySelector('[data-tour="sig"]').focus();
}
export function iniciarRecorrido() { paso = 0; pintar(); }
function terminar() {
  document.querySelectorAll('.resalta').forEach((x) => x.classList.remove('resalta'));
  document.body.classList.remove('en-tour');
  document.getElementById('capaTour').innerHTML = '';
  if (!preferencias().tourVisto) cambiarPref({ tourVisto: true });
}
export function recorridoAbierto() { return !!document.getElementById('capaTour').innerHTML; }

document.addEventListener('click', (ev) => {
  const b = ev.target.closest && ev.target.closest('[data-tour]');
  if (!b) return;
  if (b.dataset.tour === 'sig' && paso < PASOS.length - 1) { paso++; pintar(); } else terminar();
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && recorridoAbierto()) terminar(); });
