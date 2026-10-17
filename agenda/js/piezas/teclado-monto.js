/* TECLADO DE MONTO (Agenda 6), como en Yape: el monto grande arriba, los
   números abajo, en qué fue (la categoría se elige sola por la descripción) y
   a qué libro va. Para gastos e ingresos, personal u oficina. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { esc } from '../util/dom.js';
import { aviso } from './aviso.js';
import { poner, aPapelera } from '../datos/datos.js';
import { modeloVacio, nuevoId } from '../datos/modelo.js';
import { CATEGORIAS, categoriaDe, areaDeCategoria } from '../datos/finanzas.js';
import { fmtSoles } from '../util/dinero.js';
import { hoy, sumarDias } from '../util/fechas.js';

let st = null;
/* 4×4 con «+» para sumar varias cosas («12.50 + 8») y C para empezar de nuevo */
const TECLAS = ['1', '2', '3', '⌫', '4', '5', '6', '+', '7', '8', '9', 'C', '.', '0', '00'];

/* «1250.5» → céntimos; vacío o raro → 0 */
const parte = (s) => { const n = parseFloat(s || '0'); return isFinite(n) ? Math.round(n * 100) : 0; };
export const centimos = (s) => String(s || '').split('+').reduce((t, x) => t + parte(x), 0);
const unaParte = (s) => { if (!s) return '0'; const [e, d] = s.split('.'); return Number(e || 0).toLocaleString('es-PE') + (d != null ? '.' + d : ''); };
const visible = (s) => { const p = String(s || '').split('+'); return p.length > 1 ? p.map(unaParte).join(' + ') + ' = ' + fmtSoles(centimos(s)).replace('S/ ', '') : unaParte(s); };
/* Pulsar una tecla sobre el texto del monto (puro, para probarlo) */
export function teclear(m, t) {
  const partes = m.split('+'), ult = partes[partes.length - 1];
  if (t === 'C') return '';
  if (t === '⌫') return m.slice(0, -1);
  if (t === '+') return ult && centimos(ult) > 0 && partes.length < 10 ? m + '+' : m;
  if (t === '.') return ult.includes('.') ? m : m + (ult ? '.' : '0.');
  const dec = ult.includes('.') ? ult.split('.')[1].length : -1;
  const add = t === '00' ? (dec >= 0 ? '0'.repeat(Math.max(0, Math.min(2, 2 - dec))) : '00') : t;
  if (!add || dec >= 2 || ult.replace('.', '').length + add.length > 8) return m;
  if (t === '00' && (!ult || ult === '0')) return m;
  return ult === '0' && dec < 0 ? m.slice(0, -1) + add : m + add;
}

export function abrirMonto({ libro = 'personal', ingreso = false } = {}) {
  st = { libro, ingreso, monto: '', cat: '', catAMano: false, dia: hoy() };
  abrirHoja(ingreso ? 'Ingreso' : 'Gasto', '<div class="tm" id="tm"></div>');
  pintar();
}

function pintar() {
  const el = document.getElementById('tm'); if (!el || !st) return;
  const cats = CATEGORIAS[st.libro][st.ingreso ? 'ingreso' : 'gasto'], desc = (document.getElementById('tmDesc') || {}).value || '';
  const cat = st.catAMano ? st.cat : categoriaDe(desc, st.libro, st.ingreso);
  const sug = [cat].concat(cats.filter((c) => c !== cat)).slice(0, 6);
  el.innerHTML =
    '<div class="seg6 tm-libro" role="group" aria-label="Libro">' + [['personal', 'Personal'], ['oficina', 'Oficina']].map(([k, n]) => '<button type="button" data-tm-libro="' + k + '" aria-pressed="' + (st.libro === k) + '">' + n + '</button>').join('') + '</div>' +
    '<output class="tm-monto' + (st.ingreso ? ' ingreso' : '') + '" id="tmMonto" aria-live="polite">S/ ' + visible(st.monto) + '</output>' +
    '<label class="solo-lector" for="tmDesc">En qué</label><input id="tmDesc" class="entrada tm-desc" maxlength="80" autocomplete="off" placeholder="' + (st.ingreso ? 'De qué (ej. sueldo, cobro caso López)' : 'En qué (ej. almuerzo, taxi)') + '" value="' + esc(desc) + '">' +
    '<div class="tm-cats" role="group" aria-label="Categoría">' + sug.map((c) => '<button type="button" data-tm-cat="' + esc(c) + '" aria-pressed="' + (c === cat) + '">' + esc(c) + '</button>').join('') + '</div>' +
    '<div class="tm-teclas">' + TECLAS.map((t) => '<button type="button" data-tm-tecla="' + t + '"' + (t === '+' ? ' class="tm-op"' : t === 'C' ? ' class="tm-op"' : t === '00' ? ' class="tm-ancha"' : '') + ' aria-label="' + ({ '⌫': 'Borrar', '.': 'Punto', '+': 'Sumar otro monto', C: 'Borrar todo' }[t] || t) + '">' + t + '</button>').join('') + '</div>' +
    '<div class="tm-pie"><div class="seg6 tm-dia" role="group" aria-label="Día">' + [[hoy(), 'Hoy'], [sumarDias(hoy(), -1), 'Ayer']].map(([d, n]) => '<button type="button" data-tm-dia="' + d + '" aria-pressed="' + (st.dia === d) + '">' + n + '</button>').join('') + '</div>' +
    '<button type="button" class="btn pri tm-guardar" data-tm-guardar="1">Guardar ' + (st.ingreso ? 'ingreso' : 'gasto') + '</button></div>';
}
function soloMonto() { const o = document.getElementById('tmMonto'); if (o) o.textContent = 'S/ ' + visible(st.monto); }

function guardar() {
  const m = centimos(st.monto);
  if (m <= 0) { aviso('Escribe el monto con los números.'); return; }
  const desc = ((document.getElementById('tmDesc') || {}).value || '').trim();
  const cat = st.catAMano ? st.cat : categoriaDe(desc, st.libro, st.ingreso);
  const area = st.libro === 'oficina' ? 'oficina' : areaDeCategoria(cat);
  const it = poner(Object.assign(modeloVacio(), { id: nuevoId('mov'), tipo: 'movimiento', area, titulo: desc || (cat && cat !== 'Otros' ? cat : (st.ingreso ? 'Ingreso' : 'Gasto')), estado: 'hecho', monto: m,
    fechas: Object.assign(modeloVacio().fechas, { inicio: st.dia }), extra: { libro: st.libro, ingreso: st.ingreso, categoria: cat || 'Otros' } }));
  const txt = (st.ingreso ? '+' : '−') + fmtSoles(m) + ' · ' + it.titulo + (st.libro === 'oficina' ? ' · Oficina' : '');
  st = null; cerrarHoja();
  window.dispatchEvent(new Event('agenda:repintar'));
  aviso(txt, () => { aPapelera(it.id); window.dispatchEvent(new Event('agenda:repintar')); });
}

document.addEventListener('click', (ev) => {
  if (!st || !ev.target.closest) return;
  const b = ev.target.closest('[data-tm-tecla],[data-tm-cat],[data-tm-libro],[data-tm-dia],[data-tm-guardar]');
  if (!b) return;
  if (b.dataset.tmTecla) {
    const t = b.dataset.tmTecla; let m = st.monto;
    m = teclear(m, t);
    st.monto = m; soloMonto(); if (navigator.vibrate) try { navigator.vibrate(8); } catch (e) { /* nada */ }
  } else if (b.dataset.tmCat) { st.cat = b.dataset.tmCat; st.catAMano = true; pintar(); }
  else if (b.dataset.tmLibro) { st.libro = b.dataset.tmLibro; st.catAMano = false; pintar(); }
  else if (b.dataset.tmDia) { st.dia = b.dataset.tmDia; pintar(); }
  else if (b.dataset.tmGuardar) guardar();
});
/* La categoría se elige sola mientras escribes (si no la cambiaste a mano) */
document.addEventListener('input', (ev) => {
  if (!st || ev.target.id !== 'tmDesc' || st.catAMano) return;
  const cat = categoriaDe(ev.target.value, st.libro, st.ingreso);
  document.querySelectorAll('[data-tm-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.tmCat === cat)));
  if (!document.querySelector('[data-tm-cat][aria-pressed="true"]')) { const pos = ev.target.selectionStart; pintar(); const i = document.getElementById('tmDesc'); i.focus(); i.setSelectionRange(pos, pos); }
});
/* Con teclado físico también: números, punto, borrar y Enter */
document.addEventListener('keydown', (ev) => {
  if (!st || !document.getElementById('tm') || ev.target.id === 'tmDesc') return;
  const k = ev.key === 'Backspace' ? '⌫' : ev.key === ',' ? '.' : ev.key === 'Escape' ? '' : ev.key === 'Delete' ? 'C' : ev.key;
  if (TECLAS.includes(k)) { ev.preventDefault(); const b = document.querySelector('[data-tm-tecla="' + k + '"]'); if (b) b.click(); }
  else if (ev.key === 'Enter') { ev.preventDefault(); guardar(); }
});
