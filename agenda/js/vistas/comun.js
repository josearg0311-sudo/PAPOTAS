/* Bloques que repiten todas las pantallas */
import { ico, explica } from '../util/dom.js';

/* Tarjeta con su etiqueta técnica (01, 02…), título, contador y explicación */
export function tarjeta({ eti = '', titulo, n = null, cuerpo = '', guia = '', clase = '', id = '' }) {
  return '<section class="tarjeta ' + clase + '"' + (id ? ' id="' + id + '"' : '') + '>' +
    '<header class="t-cab">' + (eti ? '<span class="eti">' + eti + '</span>' : '') + '<h2>' + titulo + '</h2>' +
    (n != null ? '<span class="n">' + n + '</span>' : '') + '</header>' +
    (guia ? explica(guia) : '') + cuerpo + '</section>';
}

export function encabezado(titulo, sub) {
  return '<header class="encabezado"><h1>' + titulo + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>';
}
