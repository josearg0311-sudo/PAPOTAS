/* TECLADO PROPIO (solo en celulares y tablets; en la laptop se usa el de
   siempre). Viene de la v4.5 y está muy mejorado:
   - Letras con ñ; mantén pulsada una vocal para sus tildes (á à ä…), «?» → «¿».
   - Burbuja con la letra que tocas. Vibración corta (se apaga en Ajustes).
   - Barra de arriba: lo que vas escribiendo (sugerencias), la palabra que
     suele seguir (aprende de tus textos), atajos de fecha en «Nuevo…» y tildes.
   - Autocorrector al poner espacio o un signo. Si borras justo después,
     vuelve tu palabra y la aprende. Las palabras que repites, también.
   - «¿» y «¡» automáticos al cerrar una pregunta o exclamación.
   - Doble espacio = punto. Mayúscula sola al empezar una frase.
   - Barra espaciadora: desliza el dedo para mover el cursor.
   - ⌫ mantenido borra letras y, pasado un segundo, palabras enteras.
   - Números, símbolos, emojis (los que más usas primero) y una calculadora
     para los montos (+ − × ÷, con el resultado en vivo).
   - ⌨ vuelve al teclado del celular para ese campo; ▾ lo esconde. */
import { preferencias } from '../datos/preferencias.js';
import { leer, escribir as guardarClave, ANTIGUAS } from '../datos/almacen.js';
import { elementos } from '../datos/datos.js';
import { crearCorrector, contexto, abrirSigno, tildeInterrogativo } from '../datos/corrector.js';
import { esc } from '../util/dom.js';

const CLAVE_PALABRAS = 'agenda5_palabras', CLAVE_EMOJIS = 'agenda5_emojis';
const tactil = typeof window !== 'undefined' && window.matchMedia && matchMedia('(pointer: coarse)').matches;
export const tecladoDisponible = () => tactil;
const activo = () => tactil && preferencias().teclado.activo;

/* ---------- Diccionario (se baja la primera vez que lo usas) ---------- */
let C = null, cargando = null;
export function palabrasAprendidas() {
  const nuevas = leer(CLAVE_PALABRAS, {}) || {}, viejas = leer(ANTIGUAS.palabras, []) || [];
  const m = Object.assign({}, nuevas);
  (Array.isArray(viejas) ? viejas : []).forEach((w) => { if (typeof w === 'string' && !(w in m)) m[w] = 2; });
  return m;
}
function guardarPalabra(w, n) { const m = leer(CLAVE_PALABRAS, {}) || {}; m[w] = n; const ks = Object.keys(m); if (ks.length > 800) ks.sort((a, b) => m[a] - m[b]).slice(0, ks.length - 800).forEach((k) => delete m[k]); guardarClave(CLAVE_PALABRAS, m); }
export function olvidarPalabra(w) { const m = leer(CLAVE_PALABRAS, {}) || {}; m[w] = 0; guardarClave(CLAVE_PALABRAS, m); if (C) C.olvidar(w); }
export function agregarPalabra(w) { const l = String(w || '').trim().toLowerCase(); if (!/^[a-záéíóúüñ]{2,30}$/.test(l)) return false; guardarPalabra(l, 5); if (C) C.aprender(l, 5); return true; }
export function cargarCorrector() {
  if (C) return Promise.resolve(C);
  if (cargando) return cargando;
  /* En la versión de un solo archivo el diccionario viene adentro del index.html */
  const incluido = document.getElementById('diccionario-incluido');
  cargando = (incluido ? Promise.resolve(incluido.textContent) : fetch('diccionario/palabras-es.txt').then((r) => (r.ok ? r.text() : '')).catch(() => '')).then((t) => {
    const propias = palabrasAprendidas();
    Object.keys(propias).forEach((k) => { if (!propias[k]) delete propias[k]; });
    const textos = elementos((x) => x.titulo || x.notas).slice(-4000).flatMap((x) => [x.titulo, String(x.notas || '').slice(0, 400)]);
    C = crearCorrector(t, { propias, textos });
    return C;
  });
  return cargando;
}

/* ---------- Estado ---------- */
let el = null, caja = null, capa = 'abc', mayus = 0, ultMayus = 0, ultCorr = null, ultEspacio = 0, ocultarReloj = null;
let largo = null, repetir = null, saltar = false, cursorX = null, cursorUsado = false, pendientes = {};
const LETRAS = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const FILAS = {
  abc: ['qwertyuiop', 'asdfghjklñ', ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'], ['123', '😊', ',', ' ', '.', '↵']],
  num: ['1234567890', ['-', '/', ':', ';', '(', ')', 'S/', '&', '@', '"'], ['#+=', '.', ',', '?', '!', "'", '%', '⌫'], ['abc', '😊', ',', ' ', '.', '↵']],
  sim: [['[', ']', '{', '}', '#', '%', '^', '*', '+', '='], ['_', '\\', '|', '~', '<', '>', '€', '$', '£', '•'], ['123', '°', '…', '¿', '¡', '«', '»', '⌫'], ['abc', '😊', ',', ' ', '.', '↵']],
  numpad: [['7', '8', '9', '÷'], ['4', '5', '6', '×'], ['1', '2', '3', '−'], ['.', '0', '⌫', '+'], ['C', '=', '↵']]
};
const EMOJIS = ['😀', '😂', '😅', '😍', '😎', '🤔', '😴', '😢', '😡', '🙌', '👍', '👎', '💪', '🙏', '👏', '❤️', '🔥', '✅', '❌', '⭐', '⚽', '🏋️', '🏃', '📚', '💼', '⚖️', '🏠', '💰', '🎉', '🎂', '🍕', '☕', '📅', '⏰', '📌', '📞', '🚗', '✈️', '🛒', '💊'];
const TILDES = { a: 'áàä', e: 'éèë', i: 'íìï', o: 'óòö', u: 'úüù', n: 'ñ', A: 'ÁÀÄ', E: 'ÉÈË', I: 'ÍÌÏ', O: 'ÓÒÖ', U: 'ÚÜÙ', N: 'Ñ', '?': '¿', '!': '¡', '.': '…', '-': '—' };
const ATAJOS = ['hoy', 'mañana', 'pasado mañana', 'el lunes', 'el viernes', 'el sábado', 'a las 9am', 'a las 6pm', '!!', 'plazo legal', '#personal', '#estudios', '#oficina', '#deporte'];
const NOMBRE = { '⇧': 'Mayúsculas', '⌫': 'Borrar', '↵': 'Aceptar', ' ': 'Espacio', '123': 'Números', abc: 'Letras', '#+=': 'Símbolos', '😊': 'Emojis', '=': 'Calcular', C: 'Limpiar', '÷': 'Dividir', '×': 'Multiplicar', '−': 'Restar', '+': 'Sumar' };

function vib(ms) { if (preferencias().teclado.vibrar) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* nada */ } } }
function valido(x) {
  if (!x || !x.matches || x.closest('#candado, #capaMigracion')) return false;
  if (x.tagName === 'TEXTAREA') return !x.readOnly && !x.disabled;
  if (x.tagName !== 'INPUT' || x.readOnly || x.disabled) return false;
  return ['text', 'search', 'email', 'url', 'tel', ''].includes((x.getAttribute('type') || 'text').toLowerCase());
}
const esNum = (x) => ['decimal', 'numeric', 'tel'].includes(x.getAttribute('data-im') || x.getAttribute('inputmode') || '');
function corrigeAqui() {
  if (!el || !preferencias().teclado.corrector || esNum(el) || /email|url|tel/.test(el.type || '')) return false;
  if (el.getAttribute('autocorrect') === 'off' || el.getAttribute('spellcheck') === 'false') return false;
  return !/llave|codigo|clave|key|mail|ruc|tel|monto|buscar|q$/i.test((el.id || '') + ' ' + (el.name || ''));
}
const lenguajeNatural = () => el && /^(nuevoRec|qaTexto)$/.test(el.id);

/* ---------- Escribir en el campo ---------- */
function avisar() {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  /* Si la pantalla se repintó y el campo cambió, se sigue escribiendo en el nuevo */
  if (!el.isConnected && document.activeElement && valido(document.activeElement)) el = document.activeElement;
}
function escribir(t) {
  if (!el) return;
  const s = el.selectionStart, e = el.selectionEnd;
  if (s == null) el.value += t; else el.setRangeText(t, s, e, 'end');
  avisar();
}
function borrarUno() {
  const s = el.selectionStart, e = el.selectionEnd;
  if (s == null) { el.value = el.value.slice(0, -1); avisar(); return; }
  if (s !== e) { el.setRangeText('', s, e, 'end'); avisar(); return; }
  if (!s) return;
  const cp = el.value.codePointAt(s - 2), n = cp && cp > 0xffff ? 2 : 1;
  el.setRangeText('', s - n, s, 'end'); avisar();
}
function borrarPalabra() {
  const s = el.selectionStart; if (!s) return;
  const antes = el.value.slice(0, s), m = antes.match(/(\S+\s*|\s+)$/);
  el.setRangeText('', s - (m ? m[0].length : 1), s, 'end'); avisar();
}
function palabraActual() {
  if (!el || el.selectionStart == null) return null;
  const antes = el.value.slice(0, el.selectionStart), m = antes.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/);
  if (!m) return null;
  const ini = antes.length - m[0].length;
  if (/[#@\d]$/.test(antes.slice(0, ini))) return null;
  return Object.assign({ w: m[0], ini, fin: antes.length }, contexto(el.value, ini));
}
/* Antes de un espacio o un signo: corrige la palabra; si no la conoce y la
   escribes por segunda vez, la aprende */
function autocorregir() {
  ultCorr = null;
  if (capa !== 'abc' || !corrigeAqui() || !C) return;
  const p = palabraActual(); if (!p) return;
  const c = C.corregir(p.w, p);
  if (c && c !== p.w) {
    el.setRangeText(c, p.ini, p.fin, 'end'); avisar();
    ultCorr = { ini: p.ini, orig: p.w, nuevo: c };
    return;
  }
  const l = p.w.toLowerCase();
  if (!C.conocida(l) && l.length >= 3) {
    pendientes[l] = (pendientes[l] || 0) + 1;
    if (pendientes[l] >= 2) { C.aprender(l, 2); guardarPalabra(l, 2); }
  }
}
function usarPalabra(w) {
  const p = palabraActual();
  if (p) el.setRangeText(w, p.ini, p.fin, 'end'); else { const antes = el.value.slice(0, el.selectionStart || 0); if (/\S$/.test(antes)) escribir(' '); escribir(w); return escribir(' '); }
  avisar(); escribir(' '); ultCorr = null;
}
function autoMayus() {
  if (!el || capa !== 'abc' || esNum(el) || /email|url/.test(el.type || '') || mayus === 2) return;
  const v = el.value.slice(0, el.selectionStart || 0);
  mayus = !v.trim() || /[.!?¡¿]\s+$/.test(v) || /\n\s*$/.test(v) || /[¿¡]$/.test(v) ? 1 : 0;
}
/* Calculadora de montos: + − × ÷ con números (sin eval) */
export function calcular(texto) {
  const t = String(texto || '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '').replace(/\s/g, '');
  if (!/^-?[\d.]+([+\-*/]-?[\d.]+)+$/.test(t)) return null;
  const toks = t.match(/(\d+\.?\d*|\.\d+)|[+\-*/]/g);
  const nums = [], ops = [];
  let neg = t.startsWith('-');
  toks.forEach((k, i) => { if (/[+\-*/]/.test(k)) { if (i === 0) return; ops.push(k); } else { nums.push((neg ? -1 : 1) * parseFloat(k)); neg = false; } });
  if (nums.length !== ops.length + 1 || nums.some((n) => !isFinite(n))) return null;
  /* primero × ÷, luego + − */
  for (let i = 0; i < ops.length;) {
    if (ops[i] === '*' || ops[i] === '/') { if (ops[i] === '/' && nums[i + 1] === 0) return null; nums.splice(i, 2, ops[i] === '*' ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1]); ops.splice(i, 1); } else i++;
  }
  let r = nums[0]; ops.forEach((o, i) => { r = o === '+' ? r + nums[i + 1] : r - nums[i + 1]; });
  return Math.round(r * 100) / 100;
}

/* ---------- Pintar ---------- */
function tecla(k) {
  const fn = ['⇧', '⌫', '↵', '123', 'abc', '#+=', '😊', 'C', '='].includes(k) || (capa === 'numpad' && /[÷×−+]/.test(k));
  const txt = k === ' ' ? 'espacio' : k === '⇧' ? (mayus === 2 ? '⇪' : '⇧') : capa === 'abc' && k.length === 1 && mayus ? k.toUpperCase() : k;
  return '<button type="button" class="tk' + (k === ' ' ? ' tk-esp' : '') + (fn ? ' tk-fn' : '') + (k === '↵' ? ' tk-ok' : '') + (k === '⇧' && mayus ? ' tk-on' : '') + '" data-k="' + esc(k) + '" aria-label="' + esc(NOMBRE[k] || k) + '">' + esc(txt) + '</button>';
}
function emojis() {
  const rec = (leer(CLAVE_EMOJIS, []) || []).filter((e) => typeof e === 'string');
  const lista = [...new Set(rec.concat(EMOJIS))].slice(0, 40);
  const filas = []; for (let i = 0; i < 40; i += 10) filas.push(lista.slice(i, i + 10));
  filas[3] = filas[3].slice(0, 8).concat(['⌫']);
  return filas.concat([['abc', '123', ' ', '↵']]);
}
function cabHTML() {
  let barra = '';
  const pw = capa === 'abc' && corrigeAqui() && C ? palabraActual() : null;
  if (capa === 'numpad') {
    const r = calcular(el.value);
    barra = '<div class="tk-barra tk-calc">' + (r != null ? '<span class="tk-res">= ' + r.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + '</span>' : '<span class="tk-ayuda">Puedes sumar y restar: 120+35.50−10</span>') + '</div>';
  } else if (pw) {
    const corr = C.corregir(pw.w, pw), sug = C.sugerir(pw.w, 3).filter((x) => x !== corr && x !== pw.w);
    const lista = (corr && corr !== pw.w ? [corr] : []).concat(sug).slice(0, 3);
    barra = '<div class="tk-barra tk-sugs">' + (corr && corr !== pw.w ? '<button type="button" class="tk-sug tk-tal" data-s="' + esc(pw.w) + '" aria-label="Dejar «' + esc(pw.w) + '» y aprenderla">«' + esc(pw.w) + '»</button>' : '') +
      lista.map((x, i) => '<button type="button" class="tk-sug' + (i === 0 && corr ? ' tk-mejor' : '') + '" data-s="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>';
  } else if (capa === 'abc' && corrigeAqui() && C && /\s$/.test(el.value.slice(0, el.selectionStart || 0))) {
    const prev = contexto(el.value, el.selectionStart).previa, pred = C.predecir(prev, 3);
    barra = '<div class="tk-barra tk-sugs">' + (pred.length ? pred.map((x) => '<button type="button" class="tk-sug tk-pred" data-s="' + esc(x) + '">' + esc(x) + '</button>').join('') : '') +
      (lenguajeNatural() ? ATAJOS.map((a) => '<button type="button" class="tk-atajo" data-t="' + esc(a) + '">' + esc(a) + '</button>').join('') : '') + '</div>';
  } else {
    barra = '<div class="tk-barra">' + (lenguajeNatural() ? ATAJOS.map((a) => '<button type="button" class="tk-atajo" data-t="' + esc(a) + '">' + esc(a) + '</button>').join('') : '') +
      ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'].map((a) => '<button type="button" class="tk-atajo tk-acento" data-t="' + a + '">' + a + '</button>').join('') + '</div>';
  }
  return '<div class="tk-cab">' + barra + '<span class="tk-cab-acc">' +
    '<button type="button" class="tk-mini" data-k="⌨" aria-label="Usar el teclado del celular">⌨︎</button>' +
    '<button type="button" class="tk-mini" data-k="▾" aria-label="Ocultar teclado">▾</button></span></div>';
}
function pintar() {
  if (!el) return;
  const filas = capa === 'emo' ? emojis() : FILAS[capa];
  crear().innerHTML = cabHTML() + '<div class="tk-teclas' + (capa === 'numpad' ? ' tk-numpad' : '') + (capa === 'emo' ? ' tk-emo' : '') + '">' + filas.map((f) =>
    '<div class="tk-fila">' + (typeof f === 'string' ? [...f] : f).map(tecla).join('') + '</div>').join('') + '</div>';
  caja.classList.toggle('grande', !!preferencias().teclado.grande);
}
function refrescarCab() { const c = caja && caja.querySelector('.tk-cab'); if (!c || !el) return; const t = document.createElement('div'); t.innerHTML = cabHTML(); c.replaceWith(t.firstChild); }
function crear() {
  if (caja) return caja;
  caja = document.createElement('div'); caja.id = 'tecladoApp'; caja.className = 'tkb oculto';
  caja.setAttribute('role', 'group'); caja.setAttribute('aria-label', 'Teclado');
  document.body.appendChild(caja);
  caja.addEventListener('pointerdown', (ev) => { ev.preventDefault(); pulsar(ev); });
  caja.addEventListener('pointermove', mover);
  caja.addEventListener('pointerup', soltar);
  caja.addEventListener('pointercancel', (ev) => { if (!caja.querySelector('.tk-pop')) soltar(ev); });
  caja.addEventListener('mousedown', (ev) => ev.preventDefault());
  caja.addEventListener('contextmenu', (ev) => ev.preventDefault());
  return caja;
}
function mostrar(x) {
  clearTimeout(ocultarReloj);
  if (!C) cargarCorrector().then(() => { if (el) pintar(); });
  const cambio = el !== x; el = x;
  if (cambio) { capa = esNum(x) ? 'numpad' : 'abc'; mayus = 0; autoMayus(); pendientes = {}; }
  pintar();
  caja.classList.remove('oculto');
  document.body.classList.add('con-teclado');
  document.documentElement.style.setProperty('--kb', caja.offsetHeight + 'px');
  setTimeout(() => { if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
}
export function ocultarTeclado() {
  el = null;
  if (caja) caja.classList.add('oculto');
  document.body.classList.remove('con-teclado');
  document.documentElement.style.setProperty('--kb', '0px');
}

/* ---------- Teclas ---------- */
function aceptar() {
  if (capa === 'numpad') { const r = calcular(el.value); if (r != null) { el.value = String(r); avisar(); } }
  /* Primero se le pregunta a la app (en «Nuevo…» Enter guarda); si no lo usa,
     en un texto largo es un salto de línea */
  const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  const siguio = el.dispatchEvent(ev);
  if (!el) return;
  if (el.tagName === 'TEXTAREA') { if (siguio) { escribir('\n'); autoMayus(); pintar(); } else { autoMayus(); pintar(); } return; }
  if (siguio && el.form) { if (el.form.requestSubmit) el.form.requestSubmit(); else el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); }
  else if (siguio) el.blur();
}
function accion(k) {
  vib(5);
  if (k === '⌫') {
    /* Borrar justo después de una corrección devuelve tu palabra y la aprende */
    if (ultCorr && el.selectionStart === el.selectionEnd) {
      const u = ultCorr, fin = u.ini + u.nuevo.length, pos = el.selectionStart;
      if (el.value.slice(u.ini, fin) === u.nuevo && pos > fin && pos <= fin + 1) {
        el.setRangeText(u.orig, u.ini, pos, 'end'); avisar(); if (C) C.aprender(u.orig, 3); guardarPalabra(u.orig.toLowerCase(), 3); ultCorr = null; refrescarCab(); return;
      }
    }
    ultCorr = null; borrarUno(); autoMayus(); refrescarCab(); return;
  }
  if (k === '↵') { autocorregir(); ultCorr = null; aceptar(); return; }
  if (k === '⇧') { const ahora = Date.now(); mayus = mayus === 0 ? 1 : (mayus === 1 && ahora - ultMayus < 400) ? 2 : 0; ultMayus = ahora; pintar(); return; }
  if (['123', 'abc', '#+=', '😊'].includes(k)) { capa = { 123: 'num', abc: 'abc', '#+=': 'sim', '😊': 'emo' }[k]; pintar(); return; }
  if (k === '▾') { const x = el; ocultarTeclado(); if (x) x.blur(); return; }
  if (k === '⌨') {
    const y = el; ocultarTeclado();
    y.dataset.nativo = '1'; y.dataset.cambiando = '1'; y.setAttribute('inputmode', y.getAttribute('data-im') || 'text');
    y.blur(); setTimeout(() => { y.focus(); delete y.dataset.cambiando; }, 30);
    return;
  }
  if (k === '=') { const r = calcular(el.value); if (r != null) { el.value = String(r); avisar(); } pintar(); return; }
  if (k === 'C') { el.value = ''; avisar(); pintar(); return; }
  if (k === '−') { escribir('-'); pintar(); return; }
  if (k === '×' || k === '÷') { escribir(k); pintar(); return; }
  /* Doble espacio → punto */
  if (k === ' ' && capa === 'abc' && Date.now() - ultEspacio < 500 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9] $/.test(el.value.slice(0, el.selectionStart))) {
    const s = el.selectionStart; el.setRangeText('. ', s - 1, s, 'end'); avisar(); ultEspacio = 0; mayus = 1; pintar(); return;
  }
  if (k === ' ' || k === ',' || k === '.' || k === '?' || k === '!' || k === ';' || k === ':') autocorregir(); else ultCorr = null;
  /* Al cerrar una pregunta sin abrirla, se abre sola («¿…?») */
  if ((k === '?' || k === '!') && preferencias().teclado.signos) {
    const a = abrirSigno(el.value, el.selectionStart, k);
    if (a) {
      const s = el.selectionStart; el.setRangeText(a.texto, a.pos, a.pos, 'preserve'); el.setSelectionRange(s + 1, s + 1); if (ultCorr && ultCorr.ini >= a.pos) ultCorr.ini++;
      /* y la palabra que abre la pregunta lleva tilde: «¿cuando…?» → «¿cuándo…?» */
      const m = el.value.slice(a.pos + 1).match(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/), t = m && preferencias().teclado.corrector ? tildeInterrogativo(m[0]) : null;
      if (t) { const c = el.selectionStart; el.setRangeText(t, a.pos + 1, a.pos + 1 + m[0].length, 'preserve'); el.setSelectionRange(c + t.length - m[0].length, c + t.length - m[0].length); ultCorr = null; }
      avisar();
    }
  }
  if (capa === 'emo' && !['abc', '123', ' ', '↵', '⌫'].includes(k)) {
    const rec = (leer(CLAVE_EMOJIS, []) || []).filter((e) => e !== k); rec.unshift(k);
    guardarClave(CLAVE_EMOJIS, rec.slice(0, 16)); escribir(k); return;   // la lista se reordena al volver a abrir los emojis
  }
  const t = capa === 'abc' && mayus && k.length === 1 ? k.toUpperCase() : k;
  if (k === ' ') ultEspacio = Date.now();
  if (k === ' ' && capa !== 'abc' && capa !== 'numpad') capa = 'abc';
  escribir(t);
  if (capa === 'abc' && mayus === 1) mayus = 0;
  autoMayus(); pintar();
}

function parar() { clearTimeout(largo); clearInterval(repetir); largo = repetir = null; }
function burbuja(b, txt) {
  quitarBurbuja();
  const r = b.getBoundingClientRect(), rc = caja.getBoundingClientRect(), d = document.createElement('span');
  d.className = 'tk-burbuja'; d.textContent = txt; d.setAttribute('aria-hidden', 'true');
  d.style.left = (r.left - rc.left + r.width / 2) + 'px'; d.style.top = (r.top - rc.top) + 'px';
  caja.appendChild(d);
}
function quitarBurbuja() { const d = caja && caja.querySelector('.tk-burbuja'); if (d) d.remove(); }
function pulsar(ev) {
  const b = ev.target.closest('button'); if (!b || !el) return;
  const pop = caja.querySelector('.tk-pop');
  if (pop) {
    if (b.closest('.tk-pop')) { escribir(b.dataset.t); if (mayus === 1) mayus = 0; autoMayus(); pintar(); saltar = true; return; }
    pop.remove();
  }
  parar(); b.classList.add('tk-pulsada');
  const su = b.dataset.s;
  if (su) {
    if (b.classList.contains('tk-tal')) { if (C) C.aprender(su, 3); guardarPalabra(su.toLowerCase(), 3); }
    usarPalabra(su); if (mayus === 1) mayus = 0; autoMayus(); pintar(); vib(5); saltar = true; return;
  }
  const at = b.dataset.t;
  if (at) { const antes = el.value.slice(0, el.selectionStart || 0); escribir((/\S$/.test(antes) && at.length > 1 ? ' ' : '') + at + (at.length > 1 ? ' ' : '')); vib(5); autoMayus(); pintar(); saltar = true; return; }
  const k = b.dataset.k;
  if (k === '⌫') {
    accion(k);
    const t0 = Date.now();
    largo = setTimeout(() => { repetir = setInterval(() => { if (!el) return parar(); if (Date.now() - t0 > 1400) borrarPalabra(); else borrarUno(); refrescarCab(); }, 90); }, 400);
    saltar = true; return;
  }
  if (k === ' ' && capa === 'abc') { cursorX = ev.clientX; cursorUsado = false; }
  if (k && k.length === 1 && capa !== 'numpad' && k !== ' ') burbuja(b, capa === 'abc' && mayus ? k.toUpperCase() : k);
  const base = capa === 'abc' && mayus ? k.toUpperCase() : k;
  if (TILDES[base]) {
    largo = setTimeout(() => {
      largo = null; saltar = true; quitarBurbuja();
      const p = document.createElement('div'); p.className = 'tk-pop';
      p.innerHTML = [...TILDES[base]].map((c) => '<button type="button" data-t="' + c + '" aria-label="' + c + '">' + c + '</button>').join('');
      const r = b.getBoundingClientRect(), rc = caja.getBoundingClientRect();
      p.style.left = Math.max(4, Math.min(rc.width - 48 * TILDES[base].length - 4, r.left - rc.left - 10)) + 'px';
      p.style.top = (r.top - rc.top - 56) + 'px';
      caja.appendChild(p); vib(12);
    }, 380);
  }
  b.dataset.pend = '1';
}
/* Deslizar: elegir tilde en la ventanita, o mover el cursor con el espacio */
function mover(ev) {
  const pop = caja.querySelector('.tk-pop');
  if (pop) {
    const sobre = document.elementFromPoint(ev.clientX, ev.clientY);
    pop.querySelectorAll('button').forEach((x) => x.classList.toggle('tk-sobre', x === (sobre && sobre.closest && sobre.closest('.tk-pop button'))));
    return;
  }
  if (cursorX != null && el && el.selectionStart != null) {
    const pasos = Math.trunc((ev.clientX - cursorX) / 11);
    if (pasos) {
      cursorUsado = true; cursorX += pasos * 11;
      const p = Math.max(0, Math.min(el.value.length, el.selectionStart + pasos));
      el.setSelectionRange(p, p); ultCorr = null; vib(2);
    }
  }
}
function soltar(ev) {
  const b = ev.target.closest && ev.target.closest('button');
  caja.querySelectorAll('.tk-pulsada').forEach((x) => x.classList.remove('tk-pulsada'));
  quitarBurbuja();
  const pop = caja.querySelector('.tk-pop');
  if (pop) {
    const sobre = document.elementFromPoint(ev.clientX, ev.clientY);
    const elegido = (sobre && sobre.closest && sobre.closest('.tk-pop button')) || pop.querySelector('.tk-sobre');
    if (elegido) { escribir(elegido.dataset.t); if (mayus === 1) mayus = 0; autoMayus(); pintar(); }
    parar(); saltar = false; return;
  }
  const usoCursor = cursorUsado; cursorX = null; cursorUsado = false;
  if (largo) parar();
  if (repetir) { parar(); return; }
  if (saltar) { saltar = false; return; }
  if (usoCursor) { if (b) delete b.dataset.pend; autoMayus(); refrescarCab(); return; }
  if (b && b.dataset.pend) { delete b.dataset.pend; accion(b.dataset.k); }
}

/* ---------- Encender ---------- */
export function iniciarTeclado() {
  if (!tactil) return;
  const preparar = (x) => {
    if (!activo() || !valido(x) || x.dataset.nativo) return;
    if (!x.hasAttribute('data-im')) x.setAttribute('data-im', x.getAttribute('inputmode') || '');
    x.setAttribute('inputmode', 'none');
  };
  /* Antes de que el sistema abra su teclado */
  document.addEventListener('touchstart', (ev) => { if (ev.target && valido(ev.target)) preparar(ev.target); }, { passive: true, capture: true });
  document.addEventListener('focusin', (ev) => { const x = ev.target; if (!activo() || !valido(x) || x.dataset.nativo) return; preparar(x); mostrar(x); });
  document.addEventListener('focusout', (ev) => {
    const x = ev.target;
    if (x.dataset && x.dataset.nativo && !x.dataset.cambiando) { delete x.dataset.nativo; x.setAttribute('inputmode', x.getAttribute('data-im') || ''); x.removeAttribute('data-im'); }
    if (x !== el) return;
    clearTimeout(ocultarReloj);
    ocultarReloj = setTimeout(() => { const a = document.activeElement; if (!(a && valido(a) && activo())) ocultarTeclado(); else if (a !== el) mostrar(a); }, 120);
  });
  /* Tocar dentro del campo (mover el cursor) recalcula la mayúscula y las sugerencias */
  document.addEventListener('click', (ev) => { if (el && ev.target === el) { autoMayus(); pintar(); } });
  /* Escribir con la laptop o con un teclado físico conectado no abre el nuestro */
  document.addEventListener('keydown', (ev) => { if (el && ev.isTrusted && ev.key.length === 1) ocultarTeclado(); });
}
