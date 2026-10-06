/* TUS DATOS: un explorador para ver TODO lo que tienes (incluido lo migrado
   de la v4.5), buscar y abrir cada cosa con todos sus campos. Es la forma de
   comprobar con tus ojos que la migración no perdió nada. */
import { elementos, buscarElemento, aPapelera, conteoPorTipo, documento } from '../datos/datos.js';
import { TIPOS, TIPOS_PLURAL } from '../datos/modelo.js';
import { AREAS, chipArea, area } from '../datos/areas.js';
import { ico, esc, vacio, explica } from '../util/dom.js';
import { fmtCorta, fmtFecha, fmtHora } from '../util/fechas.js';
import { fmtSoles } from '../util/dinero.js';
import { preferencias } from '../datos/preferencias.js';
import { abrirHoja, cerrarHoja } from '../piezas/hoja.js';
import { aviso } from '../piezas/aviso.js';
import { confirmar } from '../piezas/confirmar.js';
import { tarjeta } from './comun.js';

const ui = { tipo: '', area: '', q: '', limite: 60 };
const sinTildes = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const ESTADO = { pendiente: 'Pendiente', en_curso: 'En curso', hecho: 'Hecho', cancelado: 'Cancelado' };

function cuando(x) {
  const f = x.fechas || {}, p = preferencias();
  const d = f.inicio || f.vence;
  return d ? fmtCorta(d) + (f.hora ? ' · ' + fmtHora(f.hora, p.formatoHora) : '') : '';
}
function nombreDe(x) {
  if (x.tipo === 'lista' && x.extra && x.extra.clase === 'proyecto') return 'Proyecto';
  return TIPOS[x.tipo] || x.tipo;
}

export function filaElemento(x) {
  const meta = [nombreDe(x), cuando(x), x.monto != null ? fmtSoles(x.monto) : '', x.tipo === 'pendiente' || x.tipo === 'cobro' || x.tipo === 'prestamo' ? ESTADO[x.estado] : ''].filter(Boolean);
  return '<button type="button" class="fila-dato area-' + area(x.area).id + (x.estado === 'hecho' ? ' hecha' : '') + '" data-acc="dato-ver" data-id="' + esc(x.id) + '">' +
    '<span class="fd-barra" aria-hidden="true"></span><span class="fd-txt"><b>' + esc(x.titulo || '(sin título)') + '</b><small>' + chipArea(x.area) + '<span>' + esc(meta.join(' · ')) + '</span></small></span>' + ico('i-der') + '</button>';
}

export function vistaDatos() {
  const doc = documento();
  if (!doc) return '<a class="btn volver" href="#ajustes">' + ico('i-izq') + 'Ajustes</a>' + tarjeta({ titulo: 'Tus datos', cuerpo: vacio('Todavía no hay datos', 'Si tenías la versión anterior en este aparato, vuelve a abrir la app para migrarla.') });
  const c = conteoPorTipo();
  const q = sinTildes(ui.q.trim());
  let lista = elementos((x) => !(x.extra && x.extra.sistema) && (!ui.tipo || x.tipo === ui.tipo) && (!ui.area || x.area === ui.area) &&
    (!q || sinTildes(x.titulo + ' ' + x.notas + ' ' + (x.etiquetas || []).join(' ')).includes(q)));
  lista.sort((a, b) => ((b.fechas.inicio || b.fechas.vence || '') + b.actualizado).localeCompare((a.fechas.inicio || a.fechas.vence || '') + a.actualizado));
  const total = lista.length;
  lista = lista.slice(0, ui.limite);
  const tipos = Object.keys(c).filter((t) => c[t]).sort((a, b) => c[b] - c[a]);
  return '<a class="btn volver" href="#ajustes">' + ico('i-izq') + 'Ajustes</a>' +
    explica('<b>Todo lo que tienes guardado</b>, también lo que vino de la versión anterior. Filtra por tipo o área, busca por palabras y toca una cosa para ver todos sus campos.') +
    '<section class="tarjeta"><header class="t-cab"><span class="eti">TUS DATOS</span><h2>' + (total === 1 ? '1 cosa' : total + ' cosas') + '</h2></header>' +
    '<div class="buscador"><label class="solo-lector" for="datosQ">Buscar</label>' + ico('i-buscar') + '<input id="datosQ" class="entrada" type="search" placeholder="Buscar en tus datos…" value="' + esc(ui.q) + '" autocomplete="off"></div>' +
    '<div class="fichas" role="group" aria-label="Tipo"><button type="button" data-acc="dato-tipo" data-v="" aria-pressed="' + !ui.tipo + '">Todo</button>' +
      tipos.map((t) => '<button type="button" data-acc="dato-tipo" data-v="' + t + '" aria-pressed="' + (ui.tipo === t) + '">' + (TIPOS_PLURAL[t] || t) + ' <span class="mono">' + c[t] + '</span></button>').join('') + '</div>' +
    '<div class="fichas" role="group" aria-label="Área"><button type="button" data-acc="dato-area" data-v="" aria-pressed="' + !ui.area + '">Todas las áreas</button>' +
      AREAS.map((a) => '<button type="button" class="area-' + a.id + ' ficha-area" data-acc="dato-area" data-v="' + a.id + '" aria-pressed="' + (ui.area === a.id) + '">' + a.nombre + '</button>').join('') + '</div>' +
    (lista.length ? '<div class="filas-datos">' + lista.map(filaElemento).join('') + '</div>' : vacio('Nada por aquí', q ? 'No hay nada con «' + esc(ui.q) + '». Prueba otra palabra.' : 'No hay cosas con estos filtros.')) +
    (total > lista.length ? '<div class="fila-botones izq" style="padding:0 16px 16px"><button type="button" class="btn" data-acc="dato-mas">Mostrar más (' + (total - lista.length) + ' restantes)</button></div>' : '') +
    '</section>';
}

/* Ficha con todos los campos */
function campo(n, v) { return v === '' || v == null ? '' : '<div class="campo-dato"><dt>' + n + '</dt><dd>' + v + '</dd></div>'; }
export function verElemento(id) {
  const x = buscarElemento(id);
  if (!x) return;
  const p = preferencias(), f = x.fechas || {};
  const html = '<dl class="ficha-dato">' +
    campo('Tipo', esc(nombreDe(x))) + campo('Área', chipArea(x.area)) +
    campo('Estado', ESTADO[x.estado]) + (x.tipo === 'pendiente' ? campo('Prioridad', x.prioridad.charAt(0).toUpperCase() + x.prioridad.slice(1)) : '') +
    campo('Fecha', f.inicio ? fmtFecha(f.inicio) + (f.fin ? ' – ' + fmtFecha(f.fin) : '') : '') + campo('Hora', f.hora ? fmtHora(f.hora, p.formatoHora) + (f.horaFin ? ' – ' + fmtHora(f.horaFin, p.formatoHora) : '') : '') +
    campo('Vence', f.vence ? fmtFecha(f.vence) : '') + campo('Monto', x.monto != null ? fmtSoles(x.monto) : '') +
    campo('Se repite', x.repetir ? esc(x.repetir) : '') + campo('Etiquetas', (x.etiquetas || []).map(esc).join(', ')) +
    campo('Notas', x.notas ? '<span class="pre">' + esc(x.notas) + '</span>' : '') +
    '</dl>' +
    (x.origen ? '<details class="mig-detalle"><summary>Datos originales de la versión anterior (' + esc(x.origen.coleccion) + ')</summary><pre>' + esc(JSON.stringify(x.datos, null, 1)) + '</pre></details>' : '') +
    '<div class="fila-botones">' + (x.extra && x.extra.sistema ? '' : '<button type="button" class="btn peligro" data-acc="dato-borrar" data-id="' + esc(x.id) + '">' + ico('i-basura') + 'A la papelera</button>') +
    '<button type="button" class="btn pri" data-cerrar-hoja="1">Listo</button></div>';
  abrirHoja(esc(x.titulo || nombreDe(x)), html);
}

export const acciones = {
  'dato-tipo'(b) { ui.tipo = b.dataset.v; ui.limite = 60; return true; },
  'dato-area'(b) { ui.area = b.dataset.v; ui.limite = 60; return true; },
  'dato-mas'() { ui.limite += 120; return true; },
  'dato-ver'(b) { verElemento(b.dataset.id); },
  async 'dato-borrar'(b, ev, repintar) {
    const x = buscarElemento(b.dataset.id);
    const extra = x && x.tipo === 'lista' ? ' Lo que contiene la lista se va con ella.' : '';
    if (!(await confirmar({ titulo: '¿Enviar a la papelera?', texto: '«' + esc(x.titulo) + '» quedará 30 días en la papelera; puedes devolverlo cuando quieras.' + extra, si: 'A la papelera' }))) return;
    aPapelera(x.id); cerrarHoja(); repintar();
    aviso('Enviado a la papelera', () => { import('../datos/datos.js').then((m) => { m.restaurar(x.id); repintar(); }); });
  }
};

/* El buscador filtra mientras escribes, sin perder el foco */
let reloj = null;
export function alEscribir(t, repintar) {
  if (t.id !== 'datosQ') return false;
  clearTimeout(reloj);
  reloj = setTimeout(() => {
    ui.q = t.value; ui.limite = 60;
    const pos = t.selectionStart; repintar();
    const n = document.getElementById('datosQ'); if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  }, 200);
  return true;
}
