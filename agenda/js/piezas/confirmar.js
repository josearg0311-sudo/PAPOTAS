/* Pregunta antes de algo que no se puede deshacer (dentro de la app, sin las
   ventanitas del navegador) */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { esc } from '../util/dom.js';

export function confirmar({ titulo, texto, si = 'Sí', no = 'Cancelar', peligro = false }) {
  return new Promise((listo) => {
    let respondido = false;
    const hoja = abrirHoja(esc(titulo), '<p class="ayuda">' + texto + '</p><div class="fila-botones"><button type="button" class="btn" data-conf="no">' + esc(no) + '</button>' +
      '<button type="button" class="btn ' + (peligro ? 'peligro-lleno' : 'pri') + '" data-conf="si">' + esc(si) + '</button></div>', { alCerrar: () => { if (!respondido) listo(false); } });
    hoja.querySelectorAll('[data-conf]').forEach((b) => b.addEventListener('click', () => { respondido = true; cerrarHoja(); listo(b.dataset.conf === 'si'); }));
  });
}
