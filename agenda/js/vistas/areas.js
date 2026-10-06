/* ÁREAS: un panel por área de tu vida, cada una con su color, un resumen
   con lo importante («señales») y sus herramientas propias en pestañas.
   Dirección: #areas/estudios (resumen) o #areas/estudios/examenes. */
import { AREAS, area } from '../datos/areas.js';
import { ico, esc, vacio, explica } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { elementos } from '../datos/datos.js';
import { filaElemento } from './datos.js';
import { filaPendiente } from '../piezas/pendientes-ui.js';
import { ordenar } from '../datos/pendientes.js';
import * as personal from './area-personal.js';
import * as estudios from './area-estudios.js';
import * as oficina from './area-oficina.js';
import * as deporte from './area-deporte.js';

const PANELES = { personal, estudios, oficina, deporte };
const pendientesDe = (id) => elementos((x) => x.area === id && x.tipo === 'pendiente' && x.estado !== 'hecho' && x.estado !== 'cancelado');
function pct(id) { const t = elementos((x) => x.area === id && x.tipo === 'pendiente'); return t.length ? Math.round(t.filter((x) => x.estado === 'hecho').length / t.length * 100) : 0; }

const ORDEN_NIVEL = { vencido: 0, pronto: 1, hoy: 1, ok: 2 };
function senalesDe(id) {
  try { return PANELES[id].senales().sort((a, b) => (b.legal ? 1 : 0) - (a.legal ? 1 : 0) || ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]); }
  catch (e) { return []; }
}
const icoNivel = (n) => n === 'vencido' ? '🔴' : n === 'pronto' || n === 'hoy' ? '⚠️' : '•';

export function vistaAreas() {
  return explica('<b>Tus 4 áreas de vida.</b> Cada una tiene su resumen y sus herramientas propias. Toca una para entrar.') +
    '<div class="areas">' + AREAS.map((a) => {
      const s = senalesDe(a.id)[0];
      return '<a class="area-tarjeta area-' + a.id + '" href="#areas/' + a.id + '"><span class="ic">' + ico(a.icono) + '</span><b>' + a.nombre + '</b>' +
        '<span class="num">' + pendientesDe(a.id).length + ' pendientes</span><span class="progreso"><i style="width:' + pct(a.id) + '%"></i></span>' +
        '<small class="' + (s && s.nivel !== 'ok' ? 'senal-' + s.nivel : '') + '">' + (s ? icoNivel(s.nivel) + ' ' + esc(s.txt) : a.lema) + '</small></a>';
    }).join('') + '</div>';
}

function pestanas(a, sub) {
  const hs = PANELES[a.id].HERRAMIENTAS;
  return '<nav class="fichas pestanas area-' + a.id + '" aria-label="Herramientas de ' + a.nombre + '">' +
    '<a href="#areas/' + a.id + '" class="ficha-area"' + (!sub ? ' aria-current="page"' : '') + '>Resumen</a>' +
    hs.map((h) => '<a href="#areas/' + a.id + '/' + h.id + '" class="ficha-area"' + (sub === h.id ? ' aria-current="page"' : '') + '>' + h.nombre + '</a>').join('') + '</nav>';
}

function resumen(a) {
  const s = senalesDe(a.id), p = pendientesDe(a.id).sort(ordenar), hs = PANELES[a.id].HERRAMIENTAS;
  const bloque = (eti, titulo, filtro, siVacio) => { const l = elementos((x) => x.area === a.id && filtro(x)); return tarjeta({ eti, titulo, n: l.length, clase: 'area-' + a.id, cuerpo: l.length ? '<div class="filas-datos">' + l.slice(0, 6).map(filaElemento).join('') + '</div>' : siVacio }); };
  return '<div class="columnas"><div>' +
    tarjeta({ eti: 'SEÑALES', titulo: 'Lo importante ahora', n: s.length || null, clase: 'area-' + a.id,
      guia: 'Lo que pide tu atención en ' + a.nombre + ': vencimientos, avisos y avances. Toca uno para ir a su herramienta.',
      cuerpo: s.length ? '<div class="senales">' + s.slice(0, 8).map((x) => '<a class="senal ' + x.nivel + '" href="#areas/' + a.id + '/' + x.ir + '"><span aria-hidden="true">' + icoNivel(x.nivel) + '</span><span>' + esc(x.txt) + '</span>' + ico('i-der') + '</a>').join('') + '</div>' : vacio('Todo en calma', 'No hay nada urgente en ' + a.nombre + '.') }) +
    tarjeta({ eti: 'RECORDATORIOS', titulo: 'Pendientes de ' + a.nombre, n: p.length, clase: 'area-' + a.id,
      cuerpo: p.length ? '<div class="pends">' + p.slice(0, 6).map((x) => filaPendiente(x, { verLista: true })).join('') + '</div>' + (p.length > 6 ? '<p class="pie-ajuste">Y ' + (p.length - 6) + ' más en <a href="#recordatorios">Recordatorios</a>.</p>' : '') : vacio('Nada pendiente', 'Lo que agregues en ' + a.nombre + ' aparecerá aquí.') }) +
    '</div><div>' +
    tarjeta({ eti: 'HERRAMIENTAS', titulo: 'Solo de ' + a.nombre, clase: 'area-' + a.id,
      cuerpo: '<div class="herr-botones">' + hs.map((h) => '<a class="herr-btn" href="#areas/' + a.id + '/' + h.id + '"><b>' + h.nombre + '</b>' + ico('i-der') + '</a>').join('') + '</div>' }) +
    bloque('METAS Y HÁBITOS', 'Constancia', (x) => x.tipo === 'meta' || x.tipo === 'habito', vacio('Sin metas ni hábitos aún', 'En la Fase 6 tendrás aquí tus hábitos y metas con rachas.')) +
    bloque('NOTAS', 'Notas de ' + a.nombre, (x) => x.tipo === 'nota', vacio('Sin notas', 'Las notas de esta área aparecerán aquí.')) +
    '</div></div>';
}

export function vistaArea(id, sub = '') {
  const a = area(id), h = PANELES[a.id].HERRAMIENTAS.find((x) => x.id === sub);
  return '<a class="btn volver" href="#areas">' + ico('i-izq') + 'Todas las áreas</a>' +
    '<div class="area-cab area-' + a.id + '"><span class="ic">' + ico(a.icono) + '</span><div><h2>' + a.nombre + '</h2><p>' + a.lema + '</p></div></div>' +
    pestanas(a, h ? h.id : '') +
    (h ? '<div class="herramienta">' + h.vista() + '</div>' : resumen(a));
}

export const acciones = Object.assign({}, personal.acciones, estudios.acciones, oficina.acciones, deporte.acciones);
export { PANELES };
