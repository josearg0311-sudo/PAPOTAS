/* EL + DE LA AGENDA 6: un solo campo que entiende lo que escribes.
   Se ve antes de guardar qué va a ser (gasto, ingreso, lista, evento, nota o
   recordatorio) y, si no acertó, se cambia con un toque. Enter guarda. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { esc } from '../util/dom.js';
import { aviso } from './aviso.js';
import { poner, aPapelera, elementos } from '../datos/datos.js';
import { modeloVacio, nuevoId, LISTA_RECORDATORIOS } from '../datos/modelo.js';
import { crearLista, crearDesdeTexto, esChecklist } from '../datos/pendientes.js';
import { entender } from '../datos/entender.js';
import { interpretar } from '../util/interpretar.js';
import { categoriaDe } from '../datos/finanzas.js';
import { leerMonto, fmtSoles } from '../util/dinero.js';
import { hoy, fmtCorta, fmtHora, sumarDias } from '../util/fechas.js';
import { preferencias } from '../datos/preferencias.js';
import { area } from '../datos/areas.js';

const EJEMPLOS = ['almuerzo 25', 'llamar a Ana mañana 10am', 'compras: leche, pan, café', 'reunión viernes 4pm', 'cobré 1200 oficina'];
const NOMBRES = { recordatorio: 'Recordatorio', gasto: 'Gasto', ingreso: 'Ingreso', lista: 'Lista para marcar', evento: 'Evento', nota: 'Nota' };
const SIGNO = { recordatorio: '✓', gasto: 'S/', ingreso: '+S/', lista: '☰', evento: '◷', nota: '✎' };
let forzado = '';

const cuando = (f, h) => {
  const p = preferencias(), d = !f ? 'algún día' : f === hoy() ? 'hoy' : f === sumarDias(hoy(), 1) ? 'mañana' : fmtCorta(f);
  return d + (h ? ' · ' + fmtHora(h, p.formatoHora) : '');
};

/* Qué se va a guardar (respetando el tipo que elijas a mano) */
function plan(texto) {
  let e = entender(texto);
  if (!e) return null;
  if (forzado && forzado !== e.tipo) {
    const t = String(texto).trim();
    if (forzado === 'gasto' || forzado === 'ingreso') {
      const m = t.match(/(\d+(?:[.,]\d{1,2})?)/), monto = m ? leerMonto(m[1]) : null;
      const titulo = (m ? t.replace(m[0], ' ') : t).replace(/\s+/g, ' ').trim() || NOMBRES[forzado];
      e = { tipo: forzado, monto, titulo, libro: /oficina|chamba|trabajo/i.test(t) ? 'oficina' : 'personal' };
      e.categoria = categoriaDe(e.titulo, e.libro, forzado === 'ingreso');
    } else if (forzado === 'lista') {
      const [a, b] = t.includes(':') ? t.split(/:(.*)/s) : [t, ''];
      e = { tipo: 'lista', titulo: a.trim(), cosas: String(b || '').split(/[,\n;]+/).map((x) => x.trim()).filter(Boolean) };
    } else if (forzado === 'nota') e = { tipo: 'nota', titulo: t.split('\n')[0], notas: t.split('\n').slice(1).join('\n') };
    else {
      const r = interpretar(t);
      e = { tipo: forzado, titulo: r.titulo || t, fecha: r.algunDia ? null : (r.fecha || hoy()), hora: r.hora, area: r.area, prioridad: r.prioridad, plazoLegal: r.plazoLegal, etiquetas: r.etiquetas, algunDia: r.algunDia };
    }
  }
  return e;
}

function detalle(e) {
  if (!e) return ['?', 'Escribe algo', 'La Agenda entiende si es un gasto, una lista, un evento o un recordatorio'];
  const libro = e.libro === 'oficina' ? 'Oficina' : 'Personal';
  if (e.tipo === 'gasto' || e.tipo === 'ingreso') return [SIGNO[e.tipo], NOMBRES[e.tipo] + (e.monto ? ' · ' + fmtSoles(e.monto) : ''), e.monto ? esc(e.titulo) + ' · ' + esc(e.categoria || 'Otros') + ' · ' + libro : 'Falta el monto (ej. «almuerzo 25»)'];
  if (e.tipo === 'lista') {
    const ya = elementos((x) => x.tipo === 'lista' && esChecklist(x) && x.titulo.toLowerCase() === String(e.titulo).toLowerCase())[0];
    return [SIGNO.lista, (ya ? 'Sumar a la lista · ' : 'Lista · ') + esc(e.titulo), e.cosas.length ? e.cosas.length + (e.cosas.length === 1 ? ' cosa: ' : ' cosas: ') + esc(e.cosas.join(', ')) : 'Escribe sus cosas después de «:», separadas por comas'];
  }
  if (e.tipo === 'nota') return [SIGNO.nota, 'Nota', esc(e.titulo)];
  return [SIGNO[e.tipo], NOMBRES[e.tipo] + ' · ' + cuando(e.fecha || (e.tipo === 'evento' ? hoy() : null), e.hora), esc(e.titulo) + (e.area && e.area !== 'personal' ? ' · ' + esc(area(e.area).nombre) : '')];
}

function pintarPrevia() {
  const i = document.getElementById('capTexto'), el = document.getElementById('capPrevia');
  if (!i || !el) return;
  const e = plan(i.value), [s, t, d] = detalle(e);
  el.innerHTML = '<span class="cap-signo" aria-hidden="true">' + s + '</span><span class="cap-que"><b>' + t + '</b><small>' + d + '</small></span>';
  document.querySelectorAll('[data-cap-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(!!e && e.tipo === b.dataset.capTipo)));
}

export function abrirCaptura(texto = '') {
  forzado = '';
  abrirHoja('Escribe lo que sea',
    '<form class="cap" id="capForm">' +
    '<label class="solo-lector" for="capTexto">Qué quieres anotar</label>' +
    '<input id="capTexto" class="entrada cap-entrada" autocomplete="off" enterkeyhint="done" maxlength="300" placeholder="almuerzo 25 · llamar a Ana mañana 10am" value="' + esc(texto) + '">' +
    '<div class="cap-previa" id="capPrevia" aria-live="polite"></div>' +
    '<div class="cap-tipos" role="group" aria-label="¿No es eso? Guardar como">' + Object.keys(NOMBRES).map((k) => '<button type="button" class="cap-tipo" data-cap-tipo="' + k + '" aria-pressed="false">' + NOMBRES[k].replace(' para marcar', '') + '</button>').join('') + '</div>' +
    '<p class="cap-ej-tit">Prueba:</p><div class="cap-ejemplos">' + EJEMPLOS.map((x) => '<button type="button" class="cap-ej" data-cap-ej="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' +
    '<button type="submit" class="btn pri cap-guardar">Guardar</button></form>');
  pintarPrevia();
}

function guardar() {
  const i = document.getElementById('capTexto'); if (!i) return;
  const e = plan(i.value);
  if (!e) { aviso('Escribe algo primero.'); i.focus(); return; }
  const base = (extra) => Object.assign(modeloVacio(), extra);
  let ids = [], msj = '';
  if (e.tipo === 'gasto' || e.tipo === 'ingreso') {
    if (!e.monto || e.monto <= 0) { aviso('Falta el monto, ej. «almuerzo 25».'); i.focus(); return; }
    const ing = e.tipo === 'ingreso';
    const it = poner(base({ id: nuevoId('mov'), tipo: 'movimiento', area: e.libro === 'oficina' ? 'oficina' : 'personal', titulo: e.titulo, estado: 'hecho', monto: e.monto, fechas: Object.assign(modeloVacio().fechas, { inicio: hoy() }), extra: { libro: e.libro, ingreso: ing, categoria: e.categoria || 'Otros' } }));
    ids = [it.id]; msj = (ing ? '+' : '−') + fmtSoles(e.monto) + ' · ' + e.titulo + (e.libro === 'oficina' ? ' · Oficina' : '');
  } else if (e.tipo === 'lista') {
    let l = elementos((x) => x.tipo === 'lista' && esChecklist(x) && x.titulo.toLowerCase() === String(e.titulo).toLowerCase())[0];
    if (!l) { l = crearLista({ titulo: e.titulo || 'Lista', clase: 'checklist' }); ids.push(l.id); }
    const c = e.cosas.length ? crearDesdeTexto(e.cosas.join('\n'), { lista: l.id }) : [];
    ids = ids.concat(c.map((x) => x.id)); msj = 'Lista ' + l.titulo + (c.length ? ' · ' + c.length + (c.length === 1 ? ' cosa' : ' cosas') : '');
  } else if (e.tipo === 'nota') {
    const it = poner(base({ id: nuevoId('nota'), tipo: 'nota', area: 'personal', titulo: String(e.titulo).slice(0, 120), notas: e.notas || '', extra: { fija: false } }));
    ids = [it.id]; msj = 'Nota guardada';
  } else if (e.tipo === 'evento') {
    const fin = e.hora ? String((+e.hora.slice(0, 2) + 1) % 24).padStart(2, '0') + e.hora.slice(2) : null;
    const it = poner(base({ id: nuevoId('ev'), tipo: 'evento', area: e.area || 'personal', titulo: e.titulo, todoElDia: !e.hora, aviso: e.hora ? 15 : null, fechas: Object.assign(modeloVacio().fechas, { inicio: e.fecha || hoy(), hora: e.hora, horaFin: fin }), extra: { tipoEvento: /reuni/i.test(e.titulo) ? 'reunion' : /cita/i.test(e.titulo) ? 'cita' : 'evento', lugar: '' } }));
    ids = [it.id]; msj = 'Evento · ' + cuando(it.fechas.inicio, it.fechas.hora);
  } else {
    const it = poner(base({ id: nuevoId('pend'), tipo: 'pendiente', area: e.area || 'personal', titulo: e.titulo, prioridad: e.prioridad || 'baja', plazoLegal: !!e.plazoLegal, etiquetas: e.etiquetas || [], aviso: !!e.hora, lista: LISTA_RECORDATORIOS, fechas: Object.assign(modeloVacio().fechas, { inicio: e.algunDia ? null : (e.fecha || hoy()), hora: e.hora }) }));
    ids = [it.id]; msj = 'Recordatorio · ' + cuando(it.fechas.inicio, it.fechas.hora);
  }
  cerrarHoja();
  window.dispatchEvent(new Event('agenda:repintar'));
  aviso(msj, () => { ids.slice().reverse().forEach((id) => aPapelera(id)); window.dispatchEvent(new Event('agenda:repintar')); });
}

document.addEventListener('input', (ev) => { if (ev.target.id === 'capTexto') pintarPrevia(); });
document.addEventListener('submit', (ev) => { if (ev.target.id === 'capForm') { ev.preventDefault(); ev.stopPropagation(); guardar(); } }, true);
document.addEventListener('click', (ev) => {
  const ej = ev.target.closest && ev.target.closest('[data-cap-ej]');
  if (ej) { const i = document.getElementById('capTexto'); i.value = ej.dataset.capEj; forzado = ''; pintarPrevia(); i.focus(); return; }
  const tp = ev.target.closest && ev.target.closest('[data-cap-tipo]');
  if (tp) { forzado = tp.dataset.capTipo; pintarPrevia(); document.getElementById('capTexto').focus(); }
});
