/* Avisos cortos abajo de la pantalla, con «Deshacer» opcional */
import { esc } from '../util/dom.js';

let reloj = null;
export function aviso(texto, deshacer, etiqueta = 'Deshacer') {
  const capa = document.getElementById('avisos');
  if (!capa) return;
  capa.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'aviso';
  el.setAttribute('role', 'status');
  el.innerHTML = '<span>' + esc(texto) + '</span>' + (deshacer ? '<button type="button">' + esc(etiqueta) + '</button>' : '');
  if (deshacer) el.querySelector('button').addEventListener('click', () => { el.remove(); deshacer(); });
  capa.appendChild(el);
  clearTimeout(reloj);
  reloj = setTimeout(() => el.remove(), deshacer ? 6000 : 3500);
}
