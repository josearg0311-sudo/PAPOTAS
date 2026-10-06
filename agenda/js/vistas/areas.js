/* ESPACIOS (como la v4.5): cada espacio con su portada (emojis para cambiar,
   lo próximo y sus 3 cifras), «Añadir en…», lo importante y sus mosaicos.
   Dirección: #areas/estudios (portada) o #areas/estudios/examenes. */
import { AREAS, area } from '../datos/areas.js';
import { ico, esc } from '../util/dom.js';
import { tarjeta } from './comun.js';
import * as personal from './area-personal.js';
import * as estudios from './area-estudios.js';
import * as oficina from './area-oficina.js';
import * as deporte from './area-deporte.js';
import * as constancia from './area-constancia.js';
import { hoy } from '../util/fechas.js';
import { portadaEspacio, GENERICAS, tarjetaEspacios } from './espacios.js';
import { abrirAgregar } from '../piezas/agregar-rapido.js';
import { nuevoEvento } from '../piezas/eventos-ui.js';

const PANELES = { personal, estudios, oficina, deporte };

const ORDEN_NIVEL = { vencido: 0, pronto: 1, hoy: 1, ok: 2 };
function senalesDe(id) {
  try { return PANELES[id].senales().sort((a, b) => (b.legal ? 1 : 0) - (a.legal ? 1 : 0) || ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]); }
  catch (e) { return []; }
}
const icoNivel = (n) => n === 'vencido' ? '🔴' : n === 'pronto' || n === 'hoy' ? '⚠️' : '•';

export function vistaAreas() {
  return tarjetaEspacios();
}

export function vistaArea(id, sub = '') {
  const a = area(id), hs = PANELES[a.id].HERRAMIENTAS, h = hs.find((x) => x.id === sub) || GENERICAS.find((x) => x.id === sub);
  if (h) {
    return '<a class="volver-panel" href="#areas/' + a.id + '">' + ico('i-izq') + esc(a.nombre) + '</a>' +
      '<header class="herr-cab area-' + a.id + '"><span class="pe-em" aria-hidden="true">' + esc(a.emoji) + '</span><div><h1>' + esc(h.nombre) + '</h1><p>' + esc(a.nombre) + '</p></div></header>' +
      '<div class="herramienta">' + (GENERICAS.includes(h) ? h.vista(a) : h.vista()) + '</div>';
  }
  const s = senalesDe(a.id).filter((x) => x.nivel !== 'ok');
  const senales = s.length ? tarjeta({ eti: 'SEÑALES', titulo: 'Lo importante ahora', n: s.length, clase: 'area-' + a.id,
    cuerpo: '<div class="senales">' + s.slice(0, 5).map((x) => '<a class="senal ' + x.nivel + '" href="' + (x.link || '#areas/' + a.id + '/' + x.ir) + '"><span aria-hidden="true">' + icoNivel(x.nivel) + '</span><span>' + esc(x.txt) + '</span>' + ico('i-der') + '</a>').join('') + '</div>' }) : '';
  return '<a class="volver-panel" href="#areas">' + ico('i-izq') + 'Espacios</a>' + portadaEspacio(a, hs, senales);
}

export const acciones = Object.assign({
  'esp-anadir'(b) { abrirAgregar('', b.dataset.area); },
  'esp-anadir-tipo'(b) { abrirAgregar(b.dataset.tipo, b.dataset.area); },
  'esp-evento'(b, ev, rp) { nuevoEvento(rp, { fecha: hoy(), area: b.dataset.area }); }
}, personal.acciones, estudios.acciones, oficina.acciones, deporte.acciones, constancia.acciones);
export { PANELES };
