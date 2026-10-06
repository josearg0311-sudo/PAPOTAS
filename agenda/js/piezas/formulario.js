/* FORMULARIO GENÉRICO para las herramientas de las áreas: se describe con
   una lista de campos y devuelve los valores ya leídos. Incluye «filas»
   repetibles (clases de un curso, ejercicios, acuerdos de un acta…).

   Campo: { n, t, etq, v, req, ph, max, ops, ayuda, mitad, cols, boton }
   t: texto | largo | num | dec | fecha | hora | sel | botones | multi | si | monto | filas | html */
import { esc, ico } from '../util/dom.js';
import { leerMonto, fmtSoles } from '../util/dinero.js';
import { abrirHoja, cerrarHoja } from './hoja.js';

const attrs = (c) => (c.req ? ' required' : '') + (c.ph ? ' placeholder="' + esc(c.ph) + '"' : '') + ' maxlength="' + (c.max || 200) + '"';
const montoTxt = (v) => (v == null || v === '' ? '' : fmtSoles(v).replace(/^S\/\s*/, ''));

function control(c, v, enFila) {
  const n = ' name="' + c.n + '"', lbl = enFila && c.etq ? ' aria-label="' + esc(c.etq) + '"' : '';
  switch (c.t) {
    case 'largo': return '<textarea class="entrada"' + n + lbl + attrs(Object.assign({ max: 4000 }, c)) + '>' + esc(v || '') + '</textarea>';
    case 'num': return '<input class="entrada" inputmode="numeric"' + n + lbl + ' value="' + esc(v == null ? '' : v) + '"' + attrs(Object.assign({ max: 8 }, c)) + '>';
    case 'dec': return '<input class="entrada" inputmode="decimal"' + n + lbl + ' value="' + esc(v == null ? '' : String(v)) + '"' + attrs(Object.assign({ max: 10 }, c)) + '>';
    case 'monto': return '<input class="entrada" inputmode="decimal"' + n + lbl + ' value="' + esc(montoTxt(v)) + '"' + attrs(Object.assign({ max: 16, ph: '0.00' }, c)) + '>';
    case 'fecha': return '<input type="date" class="entrada"' + n + lbl + ' value="' + esc(v || '') + '"' + (c.req ? ' required' : '') + '>';
    case 'hora': return '<input type="time" class="entrada"' + n + lbl + ' value="' + esc(v || '') + '"' + (c.req ? ' required' : '') + '>';
    case 'sel': return '<select class="entrada"' + n + lbl + '>' + c.ops.map(([a, t]) => '<option value="' + esc(a) + '"' + (String(a) === String(v) ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select>';
    case 'si': return enFila ? '<button type="button" class="casilla chica" role="checkbox" data-si="' + c.n + '" aria-checked="' + !!v + '"' + lbl + '><span></span></button>' : '';
    case 'botones': case 'multi': {
      const sel = c.t === 'multi' ? (v || []).map(String) : [String(v)];
      return '<div class="selector envuelve" data-sel="' + c.n + '"' + (c.t === 'multi' ? ' data-multi="1"' : '') + ' role="group" aria-label="' + esc(c.etq || '') + '">' + c.ops.map(([a, t]) => '<button type="button" data-v="' + esc(a) + '" aria-pressed="' + sel.includes(String(a)) + '">' + esc(t) + '</button>').join('') + '</div>';
    }
    default: return '<input class="entrada"' + n + lbl + ' value="' + esc(v == null ? '' : v) + '"' + attrs(c) + '>';
  }
}

function filaHTML(c, valores) {
  return '<div class="fila-rep" style="grid-template-columns:' + c.cols.map((k) => k.ancho || '1fr').join(' ') + ' 40px">' +
    c.cols.map((k) => control(k, valores ? valores[k.n] : k.v, true)).join('') +
    '<button type="button" class="icono-btn" data-quitar-fila="1" aria-label="Quitar">' + ico('i-x') + '</button></div>';
}

function campoHTML(c) {
  if (c.t === 'html') return c.html;
  if (c.t === 'si') return '<label class="interruptor"><input type="checkbox" name="' + c.n + '"' + (c.v ? ' checked' : '') + '><span>' + c.etq + '</span></label>';
  if (c.t === 'filas') return '<div class="campo"><span>' + esc(c.etq) + '</span>' +
    '<div class="filas-rep" data-filas="' + c.n + '"><div class="fila-rep encab" style="grid-template-columns:' + c.cols.map((k) => k.ancho || '1fr').join(' ') + ' 40px" aria-hidden="true">' + c.cols.map((k) => '<small>' + esc(k.etq || '') + '</small>').join('') + '<i></i></div>' +
    (c.v || []).map((v) => filaHTML(c, v)).join('') + '</div>' +
    '<button type="button" class="btn chico" data-agregar-fila="' + c.n + '">' + ico('i-plus') + esc(c.boton || 'Agregar') + '</button>' + (c.ayuda ? '<small class="ayuda-campo">' + c.ayuda + '</small>' : '') + '</div>';
  const tag = c.t === 'botones' || c.t === 'multi' ? 'div' : 'label';
  return '<' + tag + ' class="campo"><span>' + esc(c.etq) + '</span>' + control(c, c.v) + (c.ayuda ? '<small class="ayuda-campo">' + c.ayuda + '</small>' : '') + '</' + tag + '>';
}

export function formularioHTML(campos) {
  let html = '', mitad = null;
  campos.forEach((c) => {
    if (c.mitad) { if (mitad == null) mitad = campoHTML(c); else { html += '<div class="dos-col">' + mitad + campoHTML(c) + '</div>'; mitad = null; } return; }
    if (mitad != null) { html += mitad; mitad = null; }
    html += campoHTML(c);
  });
  if (mitad != null) html += mitad;
  return html;
}

function leerControl(k, el) {
  if (!el) return null;
  if (k.t === 'si') return el.getAttribute('aria-checked') === 'true';
  const s = el.value.trim();
  if (k.t === 'num') return s === '' ? '' : (isFinite(parseInt(s, 10)) ? parseInt(s, 10) : '');
  if (k.t === 'dec') { const x = parseFloat(s.replace(',', '.')); return s === '' || !isFinite(x) ? '' : x; }
  if (k.t === 'monto') return leerMonto(s);
  return s;
}

export function leerFormulario(raiz, campos) {
  const out = {};
  campos.forEach((c) => {
    if (c.t === 'html' || !c.n) return;
    if (c.t === 'si') { out[c.n] = !!raiz.querySelector('[name="' + c.n + '"]').checked; return; }
    if (c.t === 'botones' || c.t === 'multi') {
      const sel = [...raiz.querySelectorAll('[data-sel="' + c.n + '"] [aria-pressed="true"]')].map((b) => b.dataset.v);
      out[c.n] = c.t === 'multi' ? sel : (sel[0] != null ? sel[0] : c.v);
      return;
    }
    if (c.t === 'filas') {
      out[c.n] = [...raiz.querySelectorAll('[data-filas="' + c.n + '"] .fila-rep:not(.encab)')].map((f) => {
        const o = {}; c.cols.forEach((k) => { o[k.n] = leerControl(k, f.querySelector(k.t === 'si' ? '[data-si="' + k.n + '"]' : '[name="' + k.n + '"]')); });
        return o;
      }).filter((o) => c.vale ? c.vale(o) : true);
      return;
    }
    out[c.n] = leerControl(c, raiz.querySelector('[name="' + c.n + '"]'));
  });
  return out;
}

/* Activa selectores, casillas y filas dentro de «raiz» */
export function activarFormulario(raiz, campos) {
  raiz.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-sel] button');
    if (b) {
      const g = b.parentNode;
      if (g.dataset.multi) b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
      else g.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(y === b)));
      return;
    }
    const si = ev.target.closest('[data-si]'); if (si) { si.setAttribute('aria-checked', String(si.getAttribute('aria-checked') !== 'true')); return; }
    const q = ev.target.closest('[data-quitar-fila]'); if (q) { q.parentNode.remove(); return; }
    const a = ev.target.closest('[data-agregar-fila]');
    if (a) {
      const c = campos.find((k) => k.n === a.dataset.agregarFila), cont = raiz.querySelector('[data-filas="' + c.n + '"]');
      cont.insertAdjacentHTML('beforeend', filaHTML(c, c.nuevo ? c.nuevo() : null));
      const f = cont.lastElementChild.querySelector('input, select'); if (f) f.focus();
    }
  });
}

/* Hoja completa: título, campos, Guardar y (si se puede) Borrar.
   alGuardar(valores) devuelve false para no cerrar (p. ej. falta algo). */
export function editar({ titulo, campos, alGuardar, alBorrar, textoGuardar = 'Guardar', antes = '', despues = '' }) {
  const hoja = abrirHoja(esc(titulo), '<form class="form" id="formHerr" autocomplete="off" novalidate>' + antes + formularioHTML(campos) + despues +
    '<div class="fila-botones">' + (alBorrar ? '<button type="button" class="btn peligro" id="herrBorrar">' + ico('i-basura') + 'Borrar</button>' : '') +
    '<button type="submit" class="btn pri">' + ico('i-check') + esc(textoGuardar) + '</button></div></form>');
  const f = hoja.querySelector('#formHerr');
  activarFormulario(f, campos);
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const falta = campos.find((c) => c.req && !String((f.querySelector('[name="' + c.n + '"]') || {}).value || '').trim());
    if (falta) { const el = f.querySelector('[name="' + falta.n + '"]'); el.setAttribute('aria-invalid', 'true'); el.focus(); return; }
    const v = leerFormulario(f, campos);
    if (alGuardar(v) !== false) cerrarHoja();
  });
  const bb = hoja.querySelector('#herrBorrar');
  if (bb) bb.addEventListener('click', () => { cerrarHoja(); alBorrar(); });
  return hoja;
}
