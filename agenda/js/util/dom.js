/* Ayudas pequeñas para pintar pantallas. Todo texto que viene de la persona
   pasa por esc() antes de ir al HTML. */

export const $ = (id) => document.getElementById(id);

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* Ícono del sprite de index.html */
export function ico(id, clase = '') {
  return '<svg class="i' + (clase ? ' ' + clase : '') + '" aria-hidden="true"><use href="#' + id + '"/></svg>';
}

/* Mensaje para cuando no hay nada: nunca una pantalla en blanco */
export function vacio(titulo, texto, extra = '') {
  return '<div class="vacio"><b>' + titulo + '</b><span>' + texto + '</span>' + extra + '</div>';
}

/* Explicación del modo guía (solo se ve con el botón ? activado) */
export function explica(html) { return '<p class="explica">' + html + '</p>'; }

export function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

export function vibrar(ms = 10) {
  try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* sin vibración */ }
}
