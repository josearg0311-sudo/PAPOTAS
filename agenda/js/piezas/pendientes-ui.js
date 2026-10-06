/* Cómo se ve y se usa un PENDIENTE en cualquier pantalla (Hoy, Recordatorios,
   Áreas): casilla para marcar, «Más tarde», «Mañana», «Día…», deslizar con el
   dedo (derecha = hecho, izquierda = mañana) y su editor completo. */
import { buscarElemento, poner, aPapelera, restaurar } from '../datos/datos.js';
import { grupo, marcar, mover, masTarde, restaurarVersion, nivelPlazo, listas, esChecklist, REPETIR, cerrarDia, paraCerrarDia, crearLista } from '../datos/pendientes.js';
import { AREAS, chipArea, area } from '../datos/areas.js';
import { preferencias } from '../datos/preferencias.js';
import { hoy, sumarDias, diaSemana, fmtCorta, fmtHora, relativo } from '../util/fechas.js';
import { ico, esc, vibrar } from '../util/dom.js';
import { abrirHoja, cerrarHoja } from './hoja.js';
import { aviso } from './aviso.js';
import { confirmar } from './confirmar.js';

function cuando(x) {
  const f = x.fechas, p = preferencias();
  if (x.estado === 'hecho') return 'hecho';
  if (!f.inicio) return 'algún día';
  return (f.inicio === hoy() ? 'hoy' : relativo(f.inicio).toLowerCase()) + (f.hora ? ' ' + fmtHora(f.hora, p.formatoHora) : '');
}
function estadoPills(x) {
  if (x.estado === 'hecho') return '';
  let s = x.plazoLegal ? '<span class="pill legal">PLAZO LEGAL</span>' : '';
  const n = nivelPlazo(x);
  if (n.nivel === 'vencido') s += '<span class="pill venc">🔴 ' + (x.fechas.vence ? 'vencido · ' + fmtCorta(x.fechas.vence) : 'atrasado · ' + fmtCorta(x.fechas.inicio)) + '</span>';
  else if (n.nivel === 'pronto') s += '<span class="pill pronto">⚠️ ' + esc(n.texto) + '</span>';
  else if (x.fechas.vence) s += '<span class="pill">vence ' + fmtCorta(x.fechas.vence) + '</span>';
  return s;
}

/* opciones: acciones (true/false), lista (mostrar el nombre de la lista) */
export function filaPendiente(x, { acciones = true, verLista = false } = {}) {
  const g = grupo(x), a = area(x.area).id, hecho = x.estado === 'hecho';
  const lista = verLista && x.lista ? buscarElemento(x.lista) : null;
  const subs = (x.extra.subtareas || []).filter((s) => s && s.t);
  const meta = [chipArea(a), '<span class="mono">' + esc(cuando(x)) + '</span>',
    lista ? '<span>' + esc(lista.titulo) + '</span>' : '', subs.length ? '<span>' + ico('i-rec') + subs.filter((s) => s.ok).length + '/' + subs.length + '</span>' : '',
    x.repetir ? '<span>' + ico('i-repetir') + esc((REPETIR.find((r) => r[0] === x.repetir) || ['', ''])[1].toLowerCase()) + '</span>' : '',
    (x.etiquetas || []).map((e) => '<span class="etiqueta">#' + esc(e) + '</span>').join(''), estadoPills(x)].filter(Boolean).join('');
  const botones = acciones && !hecho ? '<div class="pend-acc">' +
    (g === 'hoy' ? '<button type="button" class="mini-btn" data-acc="p-tarde" data-id="' + esc(x.id) + '">Más tarde</button>' : '') +
    (g !== 'manana' ? '<button type="button" class="mini-btn" data-acc="p-manana" data-id="' + esc(x.id) + '">Mañana</button>' : '') +
    '<button type="button" class="mini-btn" data-acc="p-dia" data-id="' + esc(x.id) + '">Día…</button></div>' : '';
  return '<div class="pend-env"><div class="desliz" aria-hidden="true"><span class="izq">' + ico('i-check') + 'HECHO</span><span class="der">MAÑANA' + ico('i-der') + '</span></div>' +
    '<div class="pend area-' + a + (hecho ? ' hecho' : '') + (x.prioridad === 'alta' && !hecho ? ' alta' : '') + '" data-desliza="' + esc(x.id) + '">' +
    '<button type="button" class="casilla" role="checkbox" aria-checked="' + hecho + '" data-acc="p-marcar" data-id="' + esc(x.id) + '" aria-label="' + (hecho ? 'Marcar pendiente' : 'Marcar como hecho') + ': ' + esc(x.titulo) + '"><span></span></button>' +
    '<button type="button" class="pend-txt" data-acc="p-editar" data-id="' + esc(x.id) + '"><b>' + esc(x.titulo || '(sin título)') + '</b><span class="pend-meta">' + meta + '</span></button>' +
    botones + '</div></div>';
}

/* ---------- Acciones con «Deshacer» ---------- */
function deshacible(r, texto, repintar) { if (r) aviso(texto, () => { restaurarVersion(r.antes); repintar(); }); }

export const acciones = {
  'p-marcar'(b, ev, repintar) {
    const r = marcar(b.dataset.id); vibrar(12);
    b.setAttribute('aria-checked', 'true'); b.classList.add('pop');
    setTimeout(repintar, 220);
    if (r) deshacible(r, r.repetido ? '¡Hecho! Vuelve ' + relativo(r.repetido).toLowerCase() : r.hecho ? '✓ Hecho' : 'Vuelve a pendiente', repintar);
  },
  'p-tarde'(b, ev, repintar) { const r = masTarde(b.dataset.id); repintar(); const x = buscarElemento(b.dataset.id); deshacible(r, 'Más tarde · ' + (x.fechas.inicio === hoy() ? 'hoy ' : 'mañana ') + fmtHora(x.fechas.hora, preferencias().formatoHora), repintar); },
  'p-manana'(b, ev, repintar) { const x = buscarElemento(b.dataset.id); const r = mover(b.dataset.id, sumarDias(hoy(), 1), x.fechas.hora); repintar(); deshacible(r, 'Pasado a mañana · ' + fmtCorta(sumarDias(hoy(), 1)), repintar); },
  'p-dia'(b, ev, repintar) { elegirDia(b.dataset.id, repintar); },
  'p-editar'(b, ev, repintar) { editarPendiente(b.dataset.id, repintar); },
  async 'cerrar-dia'(b, ev, repintar) {
    const l = paraCerrarDia();
    if (!l.length) { aviso('No queda nada pendiente de hoy. ¡Buen día!'); return; }
    if (!(await confirmar({ titulo: 'Cerrar el día', texto: 'Pasar a mañana ' + (l.length === 1 ? 'el pendiente' : 'los ' + l.length + ' pendientes') + ' que quedaron de hoy (y lo atrasado). Lo que se repite no se mueve.', si: 'Pasar a mañana' }))) return;
    const antes = cerrarDia(); repintar();
    aviso(antes.length + ' pasados a mañana. Buen descanso.', () => { antes.forEach(restaurarVersion); repintar(); });
  }
};

/* ---------- Elegir día ---------- */
export function elegirDia(id, repintar) {
  const h = hoy(), x = buscarElemento(id);
  const proxSab = sumarDias(h, ((6 - diaSemana(h) + 7) % 7) || 7), proxLun = sumarDias(h, ((1 - diaSemana(h) + 7) % 7) || 7);
  const ops = [[h, 'Hoy'], [sumarDias(h, 1), 'Mañana'], [sumarDias(h, 2), 'Pasado mañana'], [proxSab, 'El sábado'], [proxLun, 'El lunes'], [sumarDias(h, 7), 'En una semana']];
  const hoja = abrirHoja('¿Para cuándo?', '<p class="ayuda">' + esc(x.titulo) + '</p><div class="opciones dias">' +
    ops.map(([f, n]) => '<button type="button" class="opcion" data-f="' + f + '"><b>' + n + '</b><small>' + fmtCorta(f) + '</small></button>').join('') +
    '<button type="button" class="opcion" data-f=""><b>Algún día</b><small>sin fecha</small></button></div>' +
    '<label class="campo"><span>Otra fecha</span><input type="date" class="entrada" id="otraFecha" value="' + (x.fechas.inicio || '') + '"></label>' +
    '<div class="fila-botones"><button type="button" class="btn pri" id="usarFecha">Usar esa fecha</button></div>');
  const aplicar = (f) => { const r = mover(id, f, f ? x.fechas.hora : null); cerrarHoja(); repintar(); deshacible(r, f ? 'Movido a ' + fmtCorta(f) : 'Guardado para algún día', repintar); };
  hoja.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => aplicar(b.dataset.f)));
  hoja.querySelector('#usarFecha').addEventListener('click', () => { const v = hoja.querySelector('#otraFecha').value; if (v) aplicar(v); });
}

/* ---------- Editor ---------- */
const sel = (nombre, opciones, actual) => '<select class="entrada" name="' + nombre + '">' + opciones.map(([v, t]) => '<option value="' + esc(v) + '"' + (String(v) === String(actual || '') ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>';
const selector = (nombre, opciones, actual) => '<div class="selector" data-sel="' + nombre + '">' + opciones.map(([v, t]) => '<button type="button" data-v="' + v + '" aria-pressed="' + (v === actual) + '">' + t + '</button>').join('') + '</div>';

export function editarPendiente(id, repintar, base = null) {
  const x = id ? JSON.parse(JSON.stringify(buscarElemento(id))) : base;
  if (!x) return;
  const p = preferencias(), subs = (x.extra.subtareas || []);
  const ls = listas().map((l) => [l.id, l.titulo + (esChecklist(l) ? ' (compras/lista)' : '')]);
  const fila = (s) => '<div class="sub"><button type="button" class="casilla chica" role="checkbox" aria-checked="' + !!s.ok + '" data-sub-ok="1" aria-label="Marcar paso"><span></span></button><input class="entrada" value="' + esc(s.t || '') + '" placeholder="Paso" maxlength="160"><button type="button" class="icono-btn" data-sub-x="1" aria-label="Quitar paso">' + ico('i-x') + '</button></div>';
  const hoja = abrirHoja(id ? 'Editar' : 'Nuevo recordatorio', '<form id="formPend" class="form" autocomplete="off">' +
    '<label class="campo"><span>Qué hay que hacer</span><input class="entrada" name="titulo" required maxlength="200" value="' + esc(x.titulo) + '"></label>' +
    '<div class="campo"><span>Área</span>' + selector('area', AREAS.map((a) => [a.id, a.nombre]), x.area) + '</div>' +
    '<div class="dos-col"><label class="campo"><span>Día</span><input type="date" class="entrada" name="inicio" value="' + (x.fechas.inicio || '') + '"></label>' +
    '<label class="campo"><span>Hora (opcional)</span><input type="time" class="entrada" name="hora" value="' + (x.fechas.hora || '') + '"></label></div>' +
    '<label class="interruptor"><input type="checkbox" name="aviso"' + (x.aviso ? ' checked' : '') + '><span>Avisarme a esa hora</span></label>' +
    '<div class="campo"><span>Prioridad</span>' + selector('prioridad', [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], x.prioridad) + '</div>' +
    '<div class="dos-col"><label class="campo"><span>Vence (plazo)</span><input type="date" class="entrada" name="vence" value="' + (x.fechas.vence || '') + '"></label>' +
    '<label class="campo"><span>Se repite</span>' + sel('repetir', REPETIR, x.repetir) + '</label></div>' +
    '<label class="interruptor"><input type="checkbox" name="plazoLegal"' + (x.plazoLegal ? ' checked' : '') + '><span><b>Plazo legal</b> · siempre aparece primero en Urgente</span></label>' +
    '<label class="campo"><span>Lista</span>' + sel('lista', ls, x.lista) + '</label>' +
    '<label class="campo"><span>Etiquetas (separadas por coma)</span><input class="entrada" name="etiquetas" value="' + esc((x.etiquetas || []).join(', ')) + '" placeholder="ej. banco, trámite"></label>' +
    '<div class="campo"><span>Pasos</span><div id="subs" class="subs">' + subs.map(fila).join('') + '</div><button type="button" class="btn chico" id="subAdd">' + ico('i-plus') + 'Agregar paso</button></div>' +
    '<label class="campo"><span>Notas</span><textarea class="entrada" name="notas" maxlength="4000">' + esc(x.notas) + '</textarea></label>' +
    (x.extra.minutos ? '<p class="ayuda">🍅 ' + x.extra.minutos + ' min de foco dedicados.</p>' : '') +
    '<div class="fila-botones">' + (id ? '<button type="button" class="btn peligro" id="pBorrar">' + ico('i-basura') + 'Borrar</button>' : '') +
    '<button type="submit" class="btn pri">' + ico('i-check') + 'Guardar</button></div></form>');
  const f = hoja.querySelector('#formPend');
  hoja.querySelectorAll('[data-sel] button').forEach((b) => b.addEventListener('click', () => b.parentNode.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(y === b)))));
  hoja.querySelector('#subAdd').addEventListener('click', () => { hoja.querySelector('#subs').insertAdjacentHTML('beforeend', fila({ t: '', ok: false })); const i = hoja.querySelectorAll('#subs input'); i[i.length - 1].focus(); });
  hoja.querySelector('#subs').addEventListener('click', (ev) => {
    const ok = ev.target.closest('[data-sub-ok]'); if (ok) ok.setAttribute('aria-checked', String(ok.getAttribute('aria-checked') !== 'true'));
    const q = ev.target.closest('[data-sub-x]'); if (q) q.parentNode.remove();
  });
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const leer = (n) => (hoja.querySelector('[data-sel="' + n + '"] [aria-pressed="true"]') || {}).dataset;
    x.titulo = f.titulo.value.trim(); if (!x.titulo) return;
    x.area = (leer('area') || {}).v || x.area; x.prioridad = (leer('prioridad') || {}).v || x.prioridad;
    x.fechas.inicio = f.inicio.value || null; x.fechas.hora = f.hora.value || null; x.fechas.vence = f.vence.value || null;
    x.aviso = f.aviso.checked && !!x.fechas.hora; x.plazoLegal = f.plazoLegal.checked; x.repetir = f.repetir.value || null;
    if (x.repetir && !x.fechas.inicio) x.fechas.inicio = hoy();
    x.lista = f.lista.value; x.notas = f.notas.value.trim();
    x.etiquetas = f.etiquetas.value.split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean).slice(0, 12);
    x.extra.subtareas = [...hoja.querySelectorAll('#subs .sub')].map((r) => ({ t: r.querySelector('input').value.trim(), ok: r.querySelector('[data-sub-ok]').getAttribute('aria-checked') === 'true' })).filter((s) => s.t);
    poner(x); cerrarHoja(); repintar(); aviso(id ? 'Guardado' : 'Recordatorio creado');
  });
  const borrar = hoja.querySelector('#pBorrar');
  if (borrar) borrar.addEventListener('click', () => { aPapelera(id); cerrarHoja(); repintar(); aviso('Enviado a la papelera', () => { restaurar(id); repintar(); }); });
  if (!id) setTimeout(() => f.titulo.focus(), 50);
}

/* ---------- Listas: crear y editar ---------- */
export function editarLista(id, repintar, alCrear) {
  const l = id ? buscarElemento(id) : null, sistema = l && l.extra.sistema;
  const hoja = abrirHoja(l ? 'Editar lista' : 'Nueva lista', '<form id="formLista" class="form" autocomplete="off">' +
    '<label class="campo"><span>Nombre</span><input class="entrada" name="titulo" required maxlength="60" value="' + esc(l ? l.titulo : '') + '" placeholder="ej. Trámites, Llamadas, Exp. 04521"></label>' +
    '<div class="campo"><span>Área</span>' + selector('area', AREAS.map((a) => [a.id, a.nombre]), l ? l.area : 'personal') + '</div>' +
    (l ? '' : '<div class="campo"><span>Tipo de lista</span>' + selector('clase', [['recordatorios', 'Recordatorios (con días)'], ['checklist', 'Para marcar (compras, maleta)']], 'recordatorios') + '</div>') +
    '<div class="fila-botones">' + (l && !sistema ? '<button type="button" class="btn peligro" id="lBorrar">' + ico('i-basura') + 'Borrar lista</button>' : '') +
    '<button type="submit" class="btn pri">' + ico('i-check') + 'Guardar</button></div></form>');
  hoja.querySelectorAll('[data-sel] button').forEach((b) => b.addEventListener('click', () => b.parentNode.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(y === b)))));
  const f = hoja.querySelector('#formLista');
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const t = f.titulo.value.trim(); if (!t) return;
    const leer = (n) => ((hoja.querySelector('[data-sel="' + n + '"] [aria-pressed="true"]') || {}).dataset || {}).v;
    if (l) { const y = JSON.parse(JSON.stringify(l)); y.titulo = t; y.area = leer('area') || y.area; poner(y); cerrarHoja(); repintar(); aviso('Lista guardada'); }
    else { const n = crearLista({ titulo: t, area: leer('area'), clase: leer('clase') }); cerrarHoja(); if (alCrear) alCrear(n.id); repintar(); aviso('Lista creada: ' + t); }
  });
  const bb = hoja.querySelector('#lBorrar');
  if (bb) bb.addEventListener('click', async () => {
    cerrarHoja();
    if (!(await confirmar({ titulo: '¿Borrar la lista?', texto: '«' + esc(l.titulo) + '» y todo lo que contiene irán a la papelera 30 días.', si: 'A la papelera' }))) return;
    aPapelera(l.id); if (alCrear) alCrear(''); repintar(); aviso('Lista enviada a la papelera', () => { restaurar(l.id); repintar(); });
  });
}

/* ---------- Deslizar con el dedo ---------- */
export function iniciarDeslizar(repintar) {
  let fila = null, x0 = 0, y0 = 0, dx = 0, activo = false;
  document.addEventListener('pointerdown', (ev) => {
    const f = ev.target.closest && ev.target.closest('[data-desliza]');
    if (!f || ev.pointerType === 'mouse' || ev.target.closest('.pend-acc, .casilla, input, select, textarea')) return;
    fila = f; x0 = ev.clientX; y0 = ev.clientY; dx = 0; activo = false;
  }, { passive: true });
  document.addEventListener('pointermove', (ev) => {
    if (!fila) return;
    dx = ev.clientX - x0; const dy = ev.clientY - y0;
    if (!activo && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { fila = null; return; }
    if (Math.abs(dx) > 14) activo = true;
    if (activo) { fila.style.transition = 'none'; fila.style.transform = 'translateX(' + Math.max(-130, Math.min(130, dx)) + 'px)'; fila.parentNode.classList.toggle('a-hecho', dx > 0); }
  }, { passive: true });
  const soltar = () => {
    if (!fila) return;
    const f = fila, id = f.dataset.desliza; fila = null;
    f.style.transition = ''; f.style.transform = '';
    if (!activo) return;
    /* Evita que el «click» de soltar abra el editor */
    const tragar = (e) => { e.stopPropagation(); e.preventDefault(); }; window.addEventListener('click', tragar, { capture: true, once: true }); setTimeout(() => window.removeEventListener('click', tragar, true), 300);
    const x = buscarElemento(id); if (!x) return;
    if (dx > 90 && x.estado !== 'hecho') { vibrar(15); const r = marcar(id); repintar(); deshacible(r, r.repetido ? '¡Hecho! Vuelve ' + relativo(r.repetido).toLowerCase() : '✓ Hecho', repintar); }
    else if (dx < -90 && x.estado !== 'hecho') { vibrar(15); const r = mover(id, sumarDias(hoy(), 1), x.fechas.hora); repintar(); deshacible(r, 'Pasado a mañana', repintar); }
  };
  document.addEventListener('pointerup', soltar);
  document.addEventListener('pointercancel', () => { if (fila) { fila.style.transform = ''; fila = null; } });
}
