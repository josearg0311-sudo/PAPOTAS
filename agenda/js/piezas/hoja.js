/* Hoja que sube desde abajo (en la laptop, ventana centrada). Se cierra con
   la X, tocando fuera, con Esc o con el botón «atrás» del celular. */
import { ico } from '../util/dom.js';

let alCerrar = null, enHistorial = false;

export function abrirHoja(titulo, html, opciones = {}) {
  cerrarHoja(true);
  const capa = document.getElementById('capaHoja');
  capa.innerHTML = '<div class="velo" data-velo="1"><div class="hoja" role="dialog" aria-modal="true" aria-labelledby="hojaTit">' +
    '<div class="asa" aria-hidden="true"></div>' +
    '<header class="hoja-cab"><h2 id="hojaTit">' + titulo + '</h2><button type="button" class="icono-btn" data-cerrar-hoja="1" aria-label="Cerrar">' + ico('i-x') + '</button></header>' +
    '<div class="hoja-cuerpo">' + html + '</div></div></div>';
  document.body.classList.add('con-hoja');
  alCerrar = opciones.alCerrar || null;
  if (!enHistorial) { try { history.pushState({ hoja: 1 }, '', location.href); enHistorial = true; } catch (e) { enHistorial = false; } }
  const primero = capa.querySelector('[autofocus], input, button:not([data-cerrar-hoja])');
  if (primero) setTimeout(() => primero.focus(), 30);
  return capa.querySelector('.hoja');
}

export function hojaAbierta() { return !!document.querySelector('#capaHoja .velo'); }

export function cerrarHoja(interno) {
  const capa = document.getElementById('capaHoja');
  if (!capa || !capa.innerHTML) return;
  capa.innerHTML = '';
  document.body.classList.remove('con-hoja');
  const f = alCerrar; alCerrar = null;
  if (f) f();
  /* Cerrada con la X: se deshace el paso que dejó en el historial */
  if (enHistorial && !interno) { enHistorial = false; ignorarPop = true; try { history.back(); } catch (e) { ignorarPop = false; } }
}

/* Lo llama la navegación en cada «atrás»: true si ese «atrás» era de la hoja
   (el celular la cierra en vez de cambiar de pantalla) */
let ignorarPop = false;
export function atrasEsDeHoja() {
  if (ignorarPop) { ignorarPop = false; return true; }
  if (enHistorial && hojaAbierta()) { enHistorial = false; cerrarHoja(true); return true; }
  enHistorial = false;
  return false;
}

document.addEventListener('click', (ev) => {
  const t = ev.target;
  if (t.matches && t.matches('[data-velo]')) cerrarHoja();
  else if (t.closest && t.closest('[data-cerrar-hoja]')) cerrarHoja();
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && hojaAbierta()) { ev.preventDefault(); cerrarHoja(); } });
