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
import { portadaEspacio, GENERICAS, resumenDe, proximoDe } from './espacios.js';
import { vacio } from '../util/dom.js';
import { preferencias } from '../datos/preferencias.js';
import { inicioSemana, sumarDias, fmtHora, DIAS3, diaSemana } from '../util/fechas.js';
import { bloquesDelDia, minutosPorArea, proximos } from '../datos/calendario.js';
import { abrirAgregar } from '../piezas/agregar-rapido.js';
import { nuevoEvento } from '../piezas/eventos-ui.js';

const PANELES = { personal, estudios, oficina, deporte };

const ORDEN_NIVEL = { vencido: 0, pronto: 1, hoy: 1, ok: 2 };
function senalesDe(id) {
  try { return PANELES[id].senales().sort((a, b) => (b.legal ? 1 : 0) - (a.legal ? 1 : 0) || ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]); }
  catch (e) { return []; }
}
const icoNivel = (n) => n === 'vencido' ? '🔴' : n === 'pronto' || n === 'hoy' ? '⚠️' : '•';

/* Agenda 8: los cuatro espacios en UNA pantalla («Tu equipo»). Arriba se
   elige Todos o un espacio; con uno elegido se ve su portada aquí mismo. */
function chipsEquipo(sel) {
  return '<nav class="c8-chips" aria-label="Elegir espacio"><a href="#areas"' + (!sel ? ' aria-current="page"' : '') + '>Todos</a>' +
    AREAS.map((a) => '<a class="area-' + a.id + '" href="#areas/' + a.id + '"' + (sel === a.id ? ' aria-current="page"' : '') + '><i aria-hidden="true"></i>' + esc(a.nombre) + '</a>').join('') + '</nav>';
}
function cabEquipo() {
  return '<header class="c8-tit"><h1>Tu equipo</h1><p>Personal, Estudios, Oficina y Deporte, juntos en una pantalla.</p></header>';
}
const hh = (m) => (m < 60 ? m + ' min' : Math.round(m / 60) + ' h');
function semanaEquipo() {
  const p = preferencias(), ini = inicioSemana(hoy(), p.semanaLunes), mins = {};
  AREAS.forEach((a) => { mins[a.id] = 0; });
  for (let i = 0; i < 7; i++) { const m = minutosPorArea(bloquesDelDia(sumarDias(ini, i))); AREAS.forEach((a) => { mins[a.id] += m[a.id] || 0; }); }
  const tot = AREAS.reduce((s, a) => s + mins[a.id], 0);
  const menos = tot ? AREAS.slice().sort((x, y) => mins[x.id] - mins[y.id])[0] : null;
  return tarjeta({ eti: 'SEMANA', titulo: 'Tu semana', n: tot ? hh(tot) + ' agendadas' : null,
    cuerpo: '<div class="c8-sem">' + (tot ? '<div class="c8-sem-barra" role="img" aria-label="' + AREAS.map((a) => a.nombre + ' ' + hh(mins[a.id])).join(', ') + '">' + AREAS.map((a) => mins[a.id] ? '<i class="area-' + a.id + '" style="flex:' + mins[a.id] + '"></i>' : '').join('') + '</div>' : '') +
      '<div class="c8-sem-ley">' + AREAS.map((a) => '<span class="area-' + a.id + '"><i aria-hidden="true"></i>' + esc(a.nombre) + ' <b>' + hh(mins[a.id]) + '</b></span>').join('') + '</div>' +
      '<p class="c8-sem-nota">' + (!tot ? 'Aún no hay nada con hora esta semana. Lo que agendes se reparte aquí por espacio.' : menos && mins[menos.id] < tot * 0.12 ? '<b>' + esc(menos.nombre) + '</b> se va quedando atrás esta semana.' : 'Semana pareja entre tus espacios. 💪') + '</p></div>' });
}
function fichasEquipo() {
  return '<div class="c8-fichas">' + AREAS.map((a) => {
    const r = resumenDe(a.id), d = r.datos[0], pr = proximoDe(a.id);
    return '<a class="c8-ficha area-' + a.id + '" href="#areas/' + a.id + '"><span class="cf-nom">' + esc(a.nombre) + '</span>' +
      '<b>' + esc(d ? String(d[0]) : '—') + '</b><small>' + esc(d ? d[1] : a.lema) + '</small>' +
      (pr ? '<span class="cf-prox">' + esc(pr.titulo) + ' · ' + esc(pr.cuando) + '</span>' : '') + '</a>';
  }).join('') + '</div>';
}
function importanteEquipo() {
  const l = [];
  AREAS.forEach((a) => senalesDe(a.id).filter((x) => x.nivel !== 'ok').forEach((x) => l.push(Object.assign({ area: a.id }, x))));
  l.sort((a, b) => (b.legal ? 1 : 0) - (a.legal ? 1 : 0) || ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel]);
  if (!l.length) return '';
  return tarjeta({ eti: 'SEÑALES', titulo: 'Lo importante de los cuatro', n: l.length,
    cuerpo: '<div class="senales">' + l.slice(0, 6).map((x) => '<a class="senal ' + x.nivel + ' area-' + x.area + '" href="' + (x.link || '#areas/' + x.area + '/' + x.ir) + '"><span aria-hidden="true">' + icoNivel(x.nivel) + '</span><span>' + esc(x.txt) + '</span>' + ico('i-der') + '</a>').join('') + '</div>' });
}
function proximosEquipo() {
  const p = preferencias(), fh = (x) => fmtHora(x, p.formatoHora), filas = [];
  proximos(hoy(), 8).forEach((d) => {
    d.vencen.forEach((v) => filas.push([d.dia, (v.plazoLegal ? '⚖️ ' : 'Vence: ') + v.titulo, v.area, v.tipo === 'pendiente' ? 'p-editar' : 'dato-ver', v.id]));
    d.todoDia.forEach((t) => filas.push([d.dia, t.titulo, t.area, 'ev-editar', t.id]));
    d.bloques.filter((b) => b.tipo !== 'pendiente').forEach((b) => filas.push([d.dia, fh(b.hIni) + ' · ' + b.titulo, b.area, b.tipo === 'evento' ? 'ev-editar' : 'dato-ver', b.id]));
  });
  return tarjeta({ eti: 'PRÓXIMOS', titulo: 'Lo que viene, mezclado', n: filas.length || null,
    cuerpo: filas.length ? '<div class="c8-prox">' + filas.slice(0, 8).map((f) => '<button type="button" class="c8-pf area-' + area(f[2]).id + '" data-acc="' + f[3] + '" data-id="' + esc(f[4]) + '"><span class="c8-pf-d">' + esc(f[0] === hoy() ? 'hoy' : DIAS3[diaSemana(f[0])]) + '</span><i aria-hidden="true"></i><b>' + esc(f[1]) + '</b></button>').join('') + '</div>'
      : vacio('Semana tranquila', 'Nada agendado en tus cuatro espacios para los próximos días.') });
}
function herramientasEquipo() {
  return tarjeta({ eti: 'HERRAMIENTAS', titulo: 'Todas tus herramientas',
    cuerpo: '<div class="c8-herrs">' + AREAS.map((a) => '<div class="c8-herr-g area-' + a.id + '"><span class="c8-herr-t"><i aria-hidden="true"></i>' + esc(a.nombre) + '</span><div>' +
      PANELES[a.id].HERRAMIENTAS.map((h) => '<a href="#areas/' + a.id + '/' + h.id + '">' + esc(h.nombre) + '</a>').join('') + '</div></div>').join('') + '</div>' });
}
export function vistaAreas(sel = '') {
  const s = AREAS.some((a) => a.id === sel) ? sel : '';
  return '<div class="c8-equipo">' + cabEquipo() + chipsEquipo(s) +
    (s ? portadaArea(s) : semanaEquipo() + fichasEquipo() + importanteEquipo() + proximosEquipo() + herramientasEquipo()) + '</div>';
}
function portadaArea(id) {
  const a = area(id), hs = PANELES[a.id].HERRAMIENTAS;
  const s = senalesDe(a.id).filter((x) => x.nivel !== 'ok');
  const senales = s.length ? tarjeta({ eti: 'SEÑALES', titulo: 'Lo importante ahora', n: s.length, clase: 'area-' + a.id,
    cuerpo: '<div class="senales">' + s.slice(0, 5).map((x) => '<a class="senal ' + x.nivel + '" href="' + (x.link || '#areas/' + a.id + '/' + x.ir) + '"><span aria-hidden="true">' + icoNivel(x.nivel) + '</span><span>' + esc(x.txt) + '</span>' + ico('i-der') + '</a>').join('') + '</div>' }) : '';
  return portadaEspacio(a, hs, senales).replace(/<nav class="pe-cambia"[\s\S]*?<\/nav>/, '');
}

export function vistaArea(id, sub = '') {
  const a = area(id), hs = PANELES[a.id].HERRAMIENTAS, h = hs.find((x) => x.id === sub) || GENERICAS.find((x) => x.id === sub);
  if (h) {
    return '<a class="volver-panel" href="#areas/' + a.id + '">' + ico('i-izq') + 'Tu equipo · ' + esc(a.nombre) + '</a>' +
      '<header class="herr-cab area-' + a.id + '"><span class="pe-em" aria-hidden="true">' + esc(a.emoji) + '</span><div><h1>' + esc(h.nombre) + '</h1><p>' + esc(a.nombre) + '</p></div></header>' +
      '<div class="herramienta">' + (GENERICAS.includes(h) ? h.vista(a) : h.vista()) + '</div>';
  }
  return vistaAreas(a.id);
}

export const acciones = Object.assign({
  'esp-anadir'(b) { abrirAgregar('', b.dataset.area); },
  'esp-anadir-tipo'(b) { abrirAgregar(b.dataset.tipo, b.dataset.area); },
  'esp-evento'(b, ev, rp) { nuevoEvento(rp, { fecha: hoy(), area: b.dataset.area }); }
}, personal.acciones, estudios.acciones, oficina.acciones, deporte.acciones, constancia.acciones);
export { PANELES };
