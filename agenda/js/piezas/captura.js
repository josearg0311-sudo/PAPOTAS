/* EL + DE LA AGENDA 6: un solo campo que entiende lo que escribes.
   Se ve antes de guardar qué va a ser (gasto, ingreso, lista, evento, nota o
   recordatorio) y, si no acertó, se cambia con un toque. Enter guarda.
   6.1: varias cosas a la vez («almuerzo 25; taxi 10»), gastos de ayer, lo que
   se repite («gym cada lunes 7am»), «lo de siempre» (tus gastos frecuentes) y
   dictar con la voz. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { esc, ico } from '../util/dom.js';
import { aviso } from './aviso.js';
import { poner, aPapelera, elementos } from '../datos/datos.js';
import { modeloVacio, nuevoId, LISTA_RECORDATORIOS } from '../datos/modelo.js';
import { crearLista, crearDesdeTexto, esChecklist, REPETIR } from '../datos/pendientes.js';
import { entenderVarios } from '../datos/entender.js';
import { interpretar } from '../util/interpretar.js';
import { categoriaDe, esIngreso } from '../datos/finanzas.js';
import { leerMonto, fmtSoles } from '../util/dinero.js';
import { hoy, fmtCorta, fmtHora, sumarDias } from '../util/fechas.js';
import { preferencias } from '../datos/preferencias.js';
import { area } from '../datos/areas.js';
import { puedeDictar, dictar } from './dictado.js';

const EJEMPLOS = ['almuerzo 25; taxi 10', 'llamar a Ana mañana 10am', 'compras: leche, pan, café', 'gym cada lunes 7am', 'taxi 15 ayer', 'cobré 1200 oficina'];
const NOMBRES = { recordatorio: 'Recordatorio', gasto: 'Gasto', ingreso: 'Ingreso', lista: 'Lista para marcar', evento: 'Evento', nota: 'Nota' };
const SIGNO = { recordatorio: '✓', gasto: 'S/', ingreso: '+S/', lista: '☰', evento: '◷', nota: '✎' };
let forzado = '', pararDictado = null;

const cuando = (f, h) => {
  const p = preferencias(), d = !f ? 'algún día' : f === hoy() ? 'hoy' : f === sumarDias(hoy(), 1) ? 'mañana' : f === sumarDias(hoy(), -1) ? 'ayer' : fmtCorta(f);
  return d + (h ? ' · ' + fmtHora(h, p.formatoHora) : '');
};
const rep = (r) => (r ? ' · ' + (REPETIR.find((x) => x[0] === r) || ['', ''])[1].toLowerCase() : '');
const listaLlamada = (t) => elementos((x) => x.tipo === 'lista' && esChecklist(x) && x.titulo.toLowerCase() === String(t).toLowerCase())[0];

/* Qué se va a guardar (respetando el tipo que elijas a mano: entonces es una sola cosa) */
function planes(texto) {
  const t = String(texto || '').trim();
  if (!t) return [];
  if (!forzado) return entenderVarios(t);
  let e;
  if (forzado === 'gasto' || forzado === 'ingreso') {
    const m = t.match(/(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)/), monto = m ? leerMonto(m[1]) : null;   // «1,250» = mil doscientos cincuenta
    const titulo = (m ? t.replace(m[0], ' ') : t).replace(/\s+/g, ' ').trim() || NOMBRES[forzado];
    e = { tipo: forzado, monto, titulo, libro: /oficina|chamba|trabajo/i.test(t) ? 'oficina' : 'personal', fecha: hoy() };
    e.categoria = categoriaDe(e.titulo, e.libro, forzado === 'ingreso');
  } else if (forzado === 'lista') {
    const [a, b] = t.includes(':') ? t.split(/:(.*)/s) : [t, ''];
    e = { tipo: 'lista', titulo: a.trim(), cosas: String(b || '').split(/[,\n;]+/).map((x) => x.trim()).filter(Boolean) };
  } else if (forzado === 'nota') e = { tipo: 'nota', titulo: t.split('\n')[0], notas: t.split('\n').slice(1).join('\n') };
  else {
    const r = interpretar(t);
    e = { tipo: forzado, titulo: r.titulo || t, fecha: r.algunDia ? null : (r.fecha || hoy()), hora: r.hora, area: r.area, prioridad: r.prioridad, plazoLegal: r.plazoLegal, etiquetas: r.etiquetas, algunDia: r.algunDia };
  }
  return [e];
}

function detalle(e) {
  const libro = e.libro === 'oficina' ? 'Oficina' : 'Personal';
  if (e.tipo === 'gasto' || e.tipo === 'ingreso') return [SIGNO[e.tipo], NOMBRES[e.tipo] + (e.monto ? ' · ' + fmtSoles(e.monto) : ''), e.monto ? esc(e.titulo) + ' · ' + esc(e.categoria || 'Otros') + ' · ' + libro + (e.fecha && e.fecha !== hoy() ? ' · ' + cuando(e.fecha) : '') : 'Falta el monto (ej. «almuerzo 25»)'];
  if (e.tipo === 'lista') return [SIGNO.lista, (listaLlamada(e.titulo) ? 'Sumar a la lista · ' : 'Lista · ') + esc(e.titulo), e.cosas.length ? e.cosas.length + (e.cosas.length === 1 ? ' cosa: ' : ' cosas: ') + esc(e.cosas.join(', ')) : 'Escribe sus cosas después de «:», separadas por comas'];
  if (e.tipo === 'nota') return [SIGNO.nota, 'Nota', esc(e.titulo)];
  return [SIGNO[e.tipo], NOMBRES[e.tipo] + ' · ' + cuando(e.fecha || (e.tipo === 'evento' ? hoy() : null), e.hora) + esc(rep(e.repetir)), esc(e.titulo) + (e.area && e.area !== 'personal' ? ' · ' + esc(area(e.area).nombre) : '')];
}

function pintarPrevia() {
  const i = document.getElementById('capTexto'), el = document.getElementById('capPrevia');
  if (!i || !el) return;
  const l = planes(i.value);
  if (!l.length) el.innerHTML = '<span class="cap-signo" aria-hidden="true">?</span><span class="cap-que"><b>Escribe algo</b><small>Un gasto, una lista, un evento o un recordatorio. Varias cosas: sepáralas con «;».</small></span>';
  else el.innerHTML = (l.length > 1 ? '<p class="cap-varias">' + l.length + ' cosas a la vez</p>' : '') + l.slice(0, 6).map((e) => { const [s, t, d] = detalle(e);
    return '<div class="cap-una"><span class="cap-signo" aria-hidden="true">' + s + '</span><span class="cap-que"><b>' + t + '</b><small>' + d + '</small></span></div>'; }).join('') + (l.length > 6 ? '<p class="cap-varias">y ' + (l.length - 6) + ' más</p>' : '');
  el.classList.toggle('varias', l.length > 1);
  document.querySelectorAll('[data-cap-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(l.length === 1 && l[0].tipo === b.dataset.capTipo)));
}

/* «Lo de siempre»: los gastos que más repites (últimos 90 días), con su último monto */
function frecuentes() {
  const desde = sumarDias(hoy(), -90), g = {};
  elementos((x) => x.tipo === 'movimiento' && !esIngreso(x) && x.fechas.inicio >= desde && x.titulo).forEach((x) => {
    const lb = (x.extra && x.extra.libro) || 'personal', k = x.titulo.trim().toLowerCase() + '|' + lb;
    const v = g[k] || (g[k] = { titulo: x.titulo.trim(), libro: lb, n: 0, f: '', monto: 0 });
    v.n++; if (x.fechas.inicio >= v.f) { v.f = x.fechas.inicio; v.monto = Math.abs(+x.monto || 0); }
  });
  return Object.values(g).filter((v) => v.n >= 2 && v.monto > 0).sort((a, b) => b.n - a.n || b.f.localeCompare(a.f)).slice(0, 5)
    .map((v) => v.titulo.toLowerCase() + ' ' + (v.monto / 100).toFixed(v.monto % 100 ? 2 : 0) + (v.libro === 'oficina' ? ' oficina' : ''));
}

export function abrirCaptura(texto = '') {
  forzado = '';
  const fr = frecuentes();
  abrirHoja('Escribe lo que sea',
    '<form class="cap" id="capForm">' +
    '<div class="cap-fila"><label class="solo-lector" for="capTexto">Qué quieres anotar</label>' +
    '<input id="capTexto" class="entrada cap-entrada" autocomplete="off" enterkeyhint="done" maxlength="500" placeholder="almuerzo 25 · llamar a Ana mañana 10am" value="' + esc(texto) + '">' +
    (puedeDictar() ? '<button type="button" class="icono-btn cap-mic" id="capMic" aria-pressed="false" aria-label="Dictar con la voz">' + ico('i-mic') + '</button>' : '') + '</div>' +
    '<div class="cap-previa" id="capPrevia" aria-live="polite"></div>' +
    '<div class="cap-tipos" role="group" aria-label="¿No es eso? Guardar como">' + Object.keys(NOMBRES).map((k) => '<button type="button" class="cap-tipo" data-cap-tipo="' + k + '" aria-pressed="false">' + NOMBRES[k].replace(' para marcar', '') + '</button>').join('') + '</div>' +
    (fr.length ? '<p class="cap-ej-tit">Lo de siempre:</p><div class="cap-ejemplos">' + fr.map((x) => '<button type="button" class="cap-ej siempre" data-cap-ej="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' : '') +
    '<p class="cap-ej-tit">Prueba:</p><div class="cap-ejemplos">' + EJEMPLOS.slice(0, fr.length ? 3 : 6).map((x) => '<button type="button" class="cap-ej" data-cap-ej="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
    '<button type="submit" class="btn pri cap-guardar">Guardar</button></form>', { alCerrar: () => { if (pararDictado) { pararDictado(); pararDictado = null; } } });
  pintarPrevia();
}

/* Crea una cosa; devuelve [ids creados, texto corto] */
function crear(e) {
  const base = (extra) => Object.assign(modeloVacio(), extra);
  if (e.tipo === 'gasto' || e.tipo === 'ingreso') {
    const ing = e.tipo === 'ingreso';
    const it = poner(base({ id: nuevoId('mov'), tipo: 'movimiento', area: e.libro === 'oficina' ? 'oficina' : 'personal', titulo: e.titulo, estado: 'hecho', monto: e.monto, fechas: Object.assign(modeloVacio().fechas, { inicio: e.fecha || hoy() }), extra: { libro: e.libro, ingreso: ing, categoria: e.categoria || 'Otros' } }));
    return [[it.id], (ing ? '+' : '−') + fmtSoles(e.monto) + ' ' + e.titulo];
  }
  if (e.tipo === 'lista') {
    let l = listaLlamada(e.titulo); const ids = [];
    if (!l) { l = crearLista({ titulo: e.titulo || 'Lista', clase: 'checklist' }); ids.push(l.id); }
    const c = e.cosas.length ? crearDesdeTexto(e.cosas.join('\n'), { lista: l.id }) : [];
    return [ids.concat(c.map((x) => x.id)), 'Lista ' + l.titulo + (c.length ? ' (+' + c.length + ')' : '')];
  }
  if (e.tipo === 'nota') {
    const it = poner(base({ id: nuevoId('nota'), tipo: 'nota', area: 'personal', titulo: String(e.titulo).slice(0, 120), notas: e.notas || '', extra: { fija: false } }));
    return [[it.id], 'Nota'];
  }
  if (e.tipo === 'evento') {
    const fin = e.hora ? (+e.hora.slice(0, 2) >= 23 ? '23:59' : String(+e.hora.slice(0, 2) + 1).padStart(2, '0') + e.hora.slice(2)) : null;
    const it = poner(base({ id: nuevoId('ev'), tipo: 'evento', area: e.area || 'personal', titulo: e.titulo, todoElDia: !e.hora, aviso: e.hora ? 15 : null, repetir: e.repetir || '', fechas: Object.assign(modeloVacio().fechas, { inicio: e.fecha || hoy(), hora: e.hora, horaFin: fin }), extra: { tipoEvento: /reuni/i.test(e.titulo) ? 'reunion' : /cita/i.test(e.titulo) ? 'cita' : 'evento', lugar: '' } }));
    return [[it.id], 'Evento ' + cuando(it.fechas.inicio, it.fechas.hora)];
  }
  const it = poner(base({ id: nuevoId('pend'), tipo: 'pendiente', area: e.area || 'personal', titulo: e.titulo, prioridad: e.prioridad || 'baja', plazoLegal: !!e.plazoLegal, etiquetas: e.etiquetas || [], aviso: !!e.hora, repetir: e.repetir || '', lista: LISTA_RECORDATORIOS, fechas: Object.assign(modeloVacio().fechas, { inicio: e.algunDia ? null : (e.fecha || hoy()), hora: e.hora }) }));
  return [[it.id], 'Recordatorio ' + cuando(it.fechas.inicio, it.fechas.hora)];
}

function guardar() {
  const i = document.getElementById('capTexto'); if (!i) return;
  const l = planes(i.value);
  if (!l.length) { aviso('Escribe algo primero.'); i.focus(); return; }
  const sinMonto = l.find((e) => (e.tipo === 'gasto' || e.tipo === 'ingreso') && !(e.monto > 0));
  if (sinMonto) { aviso('Falta el monto, ej. «almuerzo 25».'); i.focus(); return; }
  let ids = []; const textos = [];
  l.forEach((e) => { const [d, t] = crear(e); ids = ids.concat(d); textos.push(t); });
  cerrarHoja();
  window.dispatchEvent(new Event('agenda:repintar'));
  aviso(l.length === 1 ? textos[0] : l.length + ' cosas guardadas: ' + textos.join(' · '), () => { ids.slice().reverse().forEach((id) => aPapelera(id)); window.dispatchEvent(new Event('agenda:repintar')); });
}

document.addEventListener('input', (ev) => { if (ev.target.id === 'capTexto') pintarPrevia(); });
document.addEventListener('submit', (ev) => { if (ev.target.id === 'capForm') { ev.preventDefault(); ev.stopPropagation(); guardar(); } }, true);
document.addEventListener('click', (ev) => {
  if (!ev.target.closest) return;
  const ej = ev.target.closest('[data-cap-ej]');
  if (ej) { const i = document.getElementById('capTexto'); i.value = ej.dataset.capEj; forzado = ''; pintarPrevia(); i.focus(); return; }
  const tp = ev.target.closest('[data-cap-tipo]');
  if (tp) { forzado = forzado === tp.dataset.capTipo ? '' : tp.dataset.capTipo; pintarPrevia(); document.getElementById('capTexto').focus(); return; }
  const mic = ev.target.closest('#capMic');
  if (mic) {
    if (pararDictado) { pararDictado(); pararDictado = null; mic.setAttribute('aria-pressed', 'false'); return; }
    mic.setAttribute('aria-pressed', 'true');
    pararDictado = dictar(document.getElementById('capTexto'), { alCambiar: () => pintarPrevia(), alTerminar: (err) => { pararDictado = null; const b = document.getElementById('capMic'); if (b) b.setAttribute('aria-pressed', 'false'); if (err) aviso(err); } });
  }
});
