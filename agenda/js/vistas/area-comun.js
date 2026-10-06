/* Piezas comunes de los paneles de área: filas, píldoras de plazo y
   guardar/borrar con deshacer. */
import { esc, ico } from '../util/dom.js';
import { buscarElemento, poner, aPapelera, restaurar } from '../datos/datos.js';
import { modeloVacio } from '../datos/modelo.js';
import { plazo, hoy } from '../util/fechas.js';
import { aviso } from '../piezas/aviso.js';

/* Fila de herramienta: [inicio] título + detalle [final]. Tocar el texto abre su editor. */
export function fila({ inicio = '', titulo, meta = '', acc = '', id = '', datos = '', final = '', clase = '' }) {
  const txt = '<b>' + esc(titulo) + '</b>' + (meta ? '<small>' + meta + '</small>' : '');
  return '<div class="hf ' + clase + '">' + (inicio ? '<span class="hf-ini">' + inicio + '</span>' : '') +
    (acc ? '<button type="button" class="hf-txt" data-acc="' + acc + '" data-id="' + esc(id) + '"' + datos + '>' + txt + '</button>' : '<div class="hf-txt">' + txt + '</div>') +
    (final ? '<span class="hf-fin">' + final + '</span>' : '') + '</div>';
}
export const filas = (l) => '<div class="hfs">' + l.join('') + '</div>';
export const emoji = (e) => '<span class="hf-em" aria-hidden="true">' + esc(e || '•') + '</span>';
export const casilla = (on, acc, id, etq, datos = '') => '<button type="button" class="casilla" role="checkbox" aria-checked="' + !!on + '" data-acc="' + acc + '" data-id="' + esc(id) + '"' + datos + ' aria-label="' + esc(etq) + '"><span></span></button>';
export const mini = (txt, acc, id, datos = '', etq = '') => '<button type="button" class="mini-btn" data-acc="' + acc + '" data-id="' + esc(id) + '"' + datos + (etq ? ' aria-label="' + esc(etq) + '"' : '') + '>' + txt + '</button>';

/* Píldora según un nivel o según una fecha de vencimiento */
export function pildora(nivel, texto) {
  const c = nivel === 'vencido' ? 'venc' : nivel === 'pronto' || nivel === 'hoy' ? 'pronto' : '';
  return '<span class="pill ' + c + '">' + (nivel === 'vencido' ? '🔴 ' : c ? '⚠️ ' : '') + esc(texto) + '</span>';
}
export function pildoraFecha(f) { if (!f) return ''; const p = plazo(f, hoy()); return pildora(p.nivel === 'vencido' ? 'vencido' : p.nivel === 'pronto' ? 'pronto' : 'ok', p.texto); }

/* Cifra grande de un resumen */
export const cifra = (n, etq, clase = '') => '<div class="cifra ' + clase + '"><b>' + n + '</b><small>' + esc(etq) + '</small></div>';
export const cifras = (l) => '<div class="cifras">' + l.join('') + '</div>';

/* Guardar cambios en «extra» de un elemento (sin tocar lo original de la v4.5) */
export function cambiarExtra(id, cambios, otros = {}) {
  const x = JSON.parse(JSON.stringify(buscarElemento(id)));
  x.extra = Object.assign({}, x.extra, cambios);
  Object.assign(x, otros);
  return poner(x);
}
export function nuevo(tipo, area, campos) {
  const base = modeloVacio();
  return poner(Object.assign(base, { tipo, area }, campos, { fechas: Object.assign(base.fechas, campos.fechas || {}), extra: Object.assign({}, campos.extra || {}) }));
}
export function borrar(id, repintar, texto = 'Enviado a la papelera') {
  aPapelera(id); repintar();
  aviso(texto, () => { restaurar(id); repintar(); });
}
export const boton = (txt, acc, clase = '', datos = '') => '<button type="button" class="btn ' + clase + '" data-acc="' + acc + '"' + datos + '>' + ico('i-plus') + esc(txt) + '</button>';
export const pie = (...b) => '<div class="pie-tarjeta">' + b.join('') + '</div>';

/* Anotar (o quitar) un movimiento en un libro, con id fijo para no duplicar */
export function anotarMovimiento(idMov, { titulo, area, monto, libro, ingreso, categoria, origen }) {
  if (!(+monto > 0)) return null;
  const b = modeloVacio();
  return poner(Object.assign(b, { id: idMov, tipo: 'movimiento', titulo, area, estado: 'hecho', monto: +monto, borrado: null,
    fechas: Object.assign(b.fechas, { inicio: hoy() }), extra: { libro, ingreso: !!ingreso, categoria, desde: origen || '' } }));
}
export function quitarMovimiento(idMov) { const m = buscarElemento(idMov); if (m && !m.borrado) aPapelera(idMov); }
