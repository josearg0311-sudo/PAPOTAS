/* NOTAS (separadas por área, cada una con su color) y DIARIO (de Personal:
   ánimo del día, unas líneas, agua y sueño, como en la v4.5).
   Direcciones: #notas y #notas/diario (también en Personal → Diario). */
import { elementos, buscarElemento } from '../datos/datos.js';
import { AREAS, area } from '../datos/areas.js';
import { lineasNota, alternarCasilla, rachaDiario } from '../datos/finanzas.js';
import { listas, esChecklist, pendientesDe } from '../datos/pendientes.js';
import { val } from '../datos/herramientas.js';
import { hoy, sumarDias, fmtCorta, fmtLarga } from '../util/fechas.js';
import { esc, ico, vacio, explica } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { cambiarExtra, nuevo, borrar } from './area-comun.js';
import { editar } from '../piezas/formulario.js';
import { irALista } from './recordatorios.js';
import { aviso } from '../piezas/aviso.js';

const ui = { area: '', q: '' };
const sinTildes = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- Notas ---------- */
function tarjetaNota(n) {
  const ls = lineasNota(n.notas), fija = !!val(n, 'fija', false), muchas = ls.length > 8;
  return '<article class="nota area-' + area(n.area).id + (fija ? ' fija' : '') + '">' +
    '<button type="button" class="nota-tit" data-acc="nota-editar" data-id="' + esc(n.id) + '"><b>' + (fija ? '📌 ' : '') + esc(n.titulo || 'Sin título') + '</b>' + ico('i-lapiz') + '</button>' +
    '<div class="nota-cuerpo">' + ls.slice(0, 8).map((l, i) => l.casilla
      ? '<button type="button" class="nota-check" role="checkbox" aria-checked="' + l.ok + '" data-acc="nota-check" data-id="' + esc(n.id) + '" data-i="' + i + '"><span class="casilla chica" aria-hidden="true"><span></span></span>' + esc(l.t) + '</button>'
      : '<p>' + (esc(l.t) || '&nbsp;') + '</p>').join('') + (muchas ? '<p class="tenue">… y ' + (ls.length - 8) + ' líneas más</p>' : '') + '</div>' +
    '<small class="nota-pie">' + (n.actualizado ? 'editada ' + fmtCorta(hoy(new Date(n.actualizado))) : '') + '</small></article>';
}
function vistaNotas() {
  const q = sinTildes(ui.q.trim());
  const todas = elementos((x) => x.tipo === 'nota' && (!ui.area || x.area === ui.area) && (!q || sinTildes(x.titulo + ' ' + x.notas).includes(q)))
    .sort((a, b) => (+!!val(b, 'fija', false)) - (+!!val(a, 'fija', false)) || b.actualizado - a.actualizado);
  const checks = listas().filter(esChecklist);
  return explica('<b>Tus notas, cada una en su área.</b> Escribe «[ ] algo» en una línea y se vuelve una casilla que marcas con un toque. 📌 Las fijadas van primero.') +
    '<section class="tarjeta"><div class="buscador"><label class="solo-lector" for="notasQ">Buscar en notas</label>' + ico('i-buscar') + '<input id="notasQ" class="entrada" type="search" placeholder="Buscar en tus notas…" value="' + esc(ui.q) + '" autocomplete="off"></div>' +
      '<div class="fichas" role="group" aria-label="Área"><button type="button" data-acc="notas-area" data-v="" aria-pressed="' + !ui.area + '">Todas las áreas</button>' +
      AREAS.map((a) => '<button type="button" class="area-' + a.id + ' ficha-area" data-acc="notas-area" data-v="' + a.id + '" aria-pressed="' + (ui.area === a.id) + '">' + a.nombre + '</button>').join('') + '</div>' +
      '<div class="pie-tarjeta"><button type="button" class="btn pri" data-acc="nota-nueva" data-area="' + (ui.area || 'personal') + '">' + ico('i-plus') + 'Nueva nota' + (ui.area ? ' de ' + area(ui.area).nombre : '') + '</button>' +
      '<a class="btn" href="#notas/diario">' + ico('i-nota') + 'Diario</a></div></section>' +
    (todas.length ? AREAS.filter((a) => todas.some((n) => n.area === a.id)).map((a) => { const de = todas.filter((n) => n.area === a.id);
      return '<section class="grupo-notas area-' + a.id + '"><h2 class="grupo-notas-tit"><a href="#areas/' + a.id + '">' + a.nombre + '</a><span class="mono">' + de.length + '</span></h2><div class="notas">' + de.map(tarjetaNota).join('') + '</div></section>'; }).join('')
      : tarjeta({ cuerpo: vacio(q ? 'Nada con «' + esc(ui.q) + '»' : 'Sin notas', q ? 'Prueba otra palabra.' : 'Crea una nota para guardar datos, ideas o listas.') })) +
    (checks.length ? tarjeta({ eti: 'LISTAS', titulo: 'Listas para marcar', n: checks.length, guia: 'Tus listas de compras y checklists viven en Recordatorios.',
      cuerpo: '<div class="herr-botones">' + checks.map((l) => { const p = pendientesDe(l.id), ok = p.filter((x) => x.estado === 'hecho').length;
        return '<button type="button" class="herr-btn area-' + area(l.area).id + '" data-acc="notas-lista" data-id="' + esc(l.id) + '"><b>' + esc(l.titulo) + '</b><small class="mono">' + ok + '/' + p.length + '</small></button>'; }).join('') + '</div>' }) : '');
}
function editarNota(id, idArea, repintar) {
  const n = id ? buscarElemento(id) : null;
  editar({ titulo: n ? 'Nota' : 'Nueva nota', campos: [
    { n: 'titulo', t: 'texto', etq: 'Título', v: n ? n.titulo : '', max: 100, ph: 'Ej. Wifi de casa' },
    { n: 'cuerpo', t: 'largo', etq: 'Nota', v: n ? n.notas : '', max: 20000, ph: 'Escribe… «[ ] algo» crea una casilla' },
    { n: 'area', t: 'botones', etq: 'Área', v: n ? n.area : idArea || 'personal', ops: AREAS.map((a) => [a.id, a.nombre]) },
    { n: 'fija', t: 'si', etq: '📌 Fijarla arriba', v: n ? !!val(n, 'fija', false) : false }],
  alGuardar: (v) => {
    if (!v.titulo && !v.cuerpo) { aviso('La nota está vacía'); return false; }
    if (n) cambiarExtra(id, { fija: v.fija }, { titulo: v.titulo, notas: v.cuerpo, area: v.area });
    else nuevo('nota', v.area, { titulo: v.titulo, notas: v.cuerpo, extra: { fija: v.fija } });
    repintar(); aviso('Nota guardada en ' + area(v.area).nombre);
  }, alBorrar: n ? () => borrar(id, repintar) : null });
  const t = document.querySelector('#formHerr [name="cuerpo"]'); if (t) t.rows = 10;
}

/* ---------- Diario (Personal) ---------- */
const ANIMOS = [[1, '😞', 'Mal'], [2, '🙁', 'Regular'], [3, '😐', 'Normal'], [4, '🙂', 'Bien'], [5, '😄', 'Genial']];
const diarioDe = (d) => buscarElemento('diario_' + d) && !buscarElemento('diario_' + d).borrado ? buscarElemento('diario_' + d) : elementos((x) => x.tipo === 'diario' && x.fechas.inicio === d)[0] || null;
const bienestarDe = (d) => buscarElemento('bienestar_' + d) && !buscarElemento('bienestar_' + d).borrado ? buscarElemento('bienestar_' + d) : elementos((x) => x.tipo === 'bienestar' && x.fechas.inicio === d)[0] || null;
const animoDe = (x) => +val(x, 'animo', 0) || 0;
function ponerDiario(d, cambios, otros = {}) {
  const x = diarioDe(d);
  if (x) return cambiarExtra(x.id, cambios, otros);
  return nuevo('diario', 'personal', Object.assign({ id: 'diario_' + d, titulo: 'Diario', fechas: { inicio: d }, extra: cambios }, otros));
}
function ponerBienestar(d, cambios) {
  const x = bienestarDe(d);
  if (x) return cambiarExtra(x.id, cambios);
  return nuevo('bienestar', 'personal', { id: 'bienestar_' + d, titulo: 'Bienestar', fechas: { inicio: d }, extra: cambios });
}
export function vistaDiario(dentroDeArea = false) {
  const h = hoy(), x = diarioDe(h), b = bienestarDe(h), an = x ? animoDe(x) : 0, agua = b ? +val(b, 'agua', 0) || 0 : 0, sueno = b ? val(b, 'sueno', '') : '';
  const dias = elementos((y) => y.tipo === 'diario' && (animoDe(y) || (y.notas || '').trim())).map((y) => y.fechas.inicio), racha = rachaDiario(dias, h, sumarDias);
  const ult = Array.from({ length: 14 }, (_, i) => sumarDias(h, i - 13));
  const pasadas = elementos((y) => y.tipo === 'diario' && y.fechas.inicio < h && (animoDe(y) || (y.notas || '').trim())).sort((a, c) => c.fechas.inicio.localeCompare(a.fechas.inicio)).slice(0, 10);
  return (dentroDeArea ? '' : '<a class="btn volver" href="#notas">' + ico('i-izq') + 'Notas</a>' + explica('<b>Tu diario es parte de Personal.</b> Cómo te sentiste, unas líneas, y cuánta agua y sueño. Solo para ti.')) +
    tarjeta({ eti: 'HOY', titulo: fmtLarga(h).replace(/^./, (c) => c.toUpperCase()), n: racha ? '🔥 ' + racha + (racha === 1 ? ' día' : ' días') : null, clase: 'area-personal diario',
      cuerpo: '<div class="animos" role="radiogroup" aria-label="¿Cómo te sientes hoy?">' + ANIMOS.map(([v, e, t]) => '<button type="button" role="radio" aria-checked="' + (an === v) + '" data-acc="dia-animo" data-v="' + v + '"><span>' + e + '</span><small>' + t + '</small></button>').join('') + '</div>' +
        '<div class="form diario-form"><label class="campo"><span>Unas líneas de tu día</span><textarea class="entrada" id="diarioTxt" maxlength="4000" placeholder="¿Qué pasó hoy? ¿Qué agradeces?">' + esc(x ? x.notas : '') + '</textarea></label>' +
        '<div class="fila-botones"><button type="button" class="btn pri" data-acc="dia-guardar">' + ico('i-check') + 'Guardar</button></div></div>' +
        '<div class="bienestar"><div class="agua"><span>💧 Agua</span><button type="button" class="icono-btn" data-acc="dia-agua" data-n="-1" aria-label="Un vaso menos">−</button><b class="mono">' + agua + '/8</b><button type="button" class="icono-btn" data-acc="dia-agua" data-n="1" aria-label="Un vaso más">+</button></div>' +
        '<label class="sueno"><span>😴 Dormí</span><input class="entrada" id="diarioSueno" inputmode="decimal" maxlength="4" value="' + esc(sueno) + '" placeholder="h"><small>horas</small></label></div>' }) +
    tarjeta({ eti: 'ÁNIMO', titulo: 'Tus últimas 2 semanas', clase: 'area-personal',
      cuerpo: '<div class="animo-tira">' + ult.map((d) => { const y = diarioDe(d), a = y ? animoDe(y) : 0; return '<span title="' + fmtCorta(d) + (a ? ': ' + ANIMOS[a - 1][2] : '') + '"><b>' + (a ? ANIMOS[a - 1][1] : '·') + '</b><small>' + +d.slice(8) + '</small></span>'; }).join('') + '</div>' +
        (pasadas.length ? '<div class="hfs">' + pasadas.map((y) => '<div class="hf"><span class="hf-em">' + (animoDe(y) ? ANIMOS[animoDe(y) - 1][1] : '📝') + '</span><div class="hf-txt"><b>' + fmtCorta(y.fechas.inicio).replace(/^./, (c) => c.toUpperCase()) + '</b><small>' + esc((y.notas || '').slice(0, 160) || 'Sin texto') + '</small></div></div>').join('') + '</div>' : vacio('', 'Aquí verás tus días anteriores.')) });
}

export function vistaNotasSeccion(param) { return param === 'diario' ? vistaDiario() : vistaNotas(); }
export function alEscribirNotas(t, repintar) {
  if (t.id !== 'notasQ') return false;
  ui.q = t.value; const pos = t.selectionStart; repintar();
  const n = document.getElementById('notasQ'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* nada */ } }
  return true;
}
export function alCambiarNotas(t) {
  if (t.id !== 'diarioSueno') return false;
  const v = parseFloat(String(t.value).replace(',', '.'));
  ponerBienestar(hoy(), { sueno: isFinite(v) && v >= 0 && v <= 24 ? v : '' }); aviso('😴 Sueño anotado');
  return false;
}

export const acciones = {
  'notas-area'(b) { ui.area = b.dataset.v; return true; },
  'nota-nueva'(b, ev, rp) { editarNota(null, b.dataset.area, rp); },
  'nota-editar'(b, ev, rp) { editarNota(b.dataset.id, null, rp); },
  'nota-check'(b) { const n = buscarElemento(b.dataset.id); cambiarExtra(n.id, {}, { notas: alternarCasilla(n.notas, +b.dataset.i) }); return true; },
  'notas-lista'(b) { irALista(b.dataset.id); location.hash = '#recordatorios'; },
  'dia-animo'(b) {
    const v = +b.dataset.v, x = diarioDe(hoy()), t = document.getElementById('diarioTxt');
    ponerDiario(hoy(), { animo: x && animoDe(x) === v ? 0 : v }, t ? { notas: t.value.replace(/\s+$/, '') } : {}); return true;
  },
  'dia-guardar'(b, ev, rp) { const t = document.getElementById('diarioTxt'); ponerDiario(hoy(), {}, { notas: t.value.replace(/\s+$/, '') }); rp(); aviso('📔 Diario guardado'); },
  'dia-agua'(b) { const x = bienestarDe(hoy()), a = x ? +val(x, 'agua', 0) || 0 : 0; ponerBienestar(hoy(), { agua: Math.max(0, Math.min(20, a + +b.dataset.n)) }); return true; }
};
