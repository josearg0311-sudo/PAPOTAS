/* Candado con PIN.
   Es una cerradura de puerta, no una caja fuerte: tapa la pantalla para que
   nadie vea tu agenda si coge tu celular, pero los datos no se cifran.

   Compatible con la v4.5: usa la misma clave («agenda_pin») y el mismo
   «triturado» (SHA-256 de «sal:pin»), así que tu PIN de antes sigue valiendo.
   Arregla el fallo de la v4.5: allí el PIN se guardaba pero nunca se volvía a
   leer al abrir, de modo que tras cerrar la app no se pedía. */
import { leer, escribir, borrar, ANTIGUAS, CLAVES } from '../datos/almacen.js';
import { preferencias } from '../datos/preferencias.js';
import { $, vibrar } from '../util/dom.js';

const INTENTOS = 5, ESPERA_MS = 30000;

export function hashPIN(pin, sal) {
  const txt = sal + ':' + pin;
  if (window.crypto && crypto.subtle && window.TextEncoder) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then((b) =>
      Array.prototype.map.call(new Uint8Array(b), (x) => ('0' + x.toString(16)).slice(-2)).join(''));
  }
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return Promise.resolve('f' + h.toString(16));
}

function config() {
  const c = leer(ANTIGUAS.pin, null);
  return c && c.sal && c.hash && c.largo >= 4 && c.largo <= 6 ? c : null;
}
export function hayPIN() { return !!config(); }

/* ---------- Estado del teclado ---------- */
let modo = 'abrir';          // abrir | verificar | nuevo | repetir
let escrito = '', nuevo = '', fallos = 0, alTerminar = null, alCancelar = null;
let bloqueado = false;

function esperaHasta() { return +(leer(CLAVES.pinEspera, 0) || 0); }

function pintar(titulo, nota) {
  if (titulo != null) $('candadoTitulo').textContent = titulo;
  if (nota != null) $('candadoNota').textContent = nota;
  const c = config();
  const largo = modo === 'abrir' || modo === 'verificar' ? (c ? c.largo : 4) : modo === 'repetir' ? nuevo.length : Math.max(4, escrito.length);
  let h = '';
  for (let i = 0; i < largo; i++) h += '<i class="' + (i < escrito.length ? 'lleno' : '') + '"></i>';
  $('puntosPin').innerHTML = h;
  const extra = $('teclado').querySelector('[data-pin="ok"], [data-pin="x"]');
  if (extra) {
    const listo = modo === 'nuevo' && escrito.length >= 4;
    extra.dataset.pin = listo ? 'ok' : 'x';
    extra.textContent = listo ? 'Listo' : (modo === 'abrir' ? '' : 'Cancelar');
    extra.disabled = modo === 'abrir' && !listo;
  }
}

function mostrar(m, titulo, nota) {
  modo = m; escrito = ''; nuevo = '';
  $('teclado').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => '<button type="button" data-pin="' + n + '">' + n + '</button>').join('') +
    '<button type="button" class="fantasma" data-pin="x"></button><button type="button" data-pin="0">0</button>' +
    '<button type="button" class="fantasma" data-pin="b" aria-label="Borrar">Borrar</button>';
  $('candado').hidden = false;
  document.body.classList.add('con-candado');
  pintar(titulo, nota || '');
  const b = $('teclado').querySelector('[data-pin="5"]'); if (b) b.focus();
}
function ocultar() {
  $('candado').hidden = true;
  document.body.classList.remove('con-candado');
  escrito = ''; nuevo = '';
}

/* Pide el PIN para entrar */
export function bloquear() {
  if (!config() || bloqueado) return;
  bloqueado = true;
  mostrar('abrir', 'Escribe tu PIN', Date.now() < esperaHasta() ? 'Demasiados intentos. Espera unos segundos.' : '');
}
export function estaBloqueado() { return bloqueado; }
const alAbrir = [];
/* Para lo que debe esperar a que se escriba el PIN (p. ej. el recorrido) */
export function despuesDeAbrir(fn) { if (!bloqueado) fn(); else alAbrir.push(fn); }

/* Poner o cambiar el PIN: si ya hay uno, primero se pide el actual */
export function configurarPIN(listo) {
  alTerminar = listo || null; alCancelar = null;
  if (config()) mostrar('verificar', 'Escribe tu PIN actual', 'Para cambiarlo, primero confirma el que tienes.');
  else mostrar('nuevo', 'Elige un PIN de 4 a 6 números', 'Apúntalo en un lugar seguro: si lo olvidas no se puede recuperar.');
  pendiente = 'cambiar';
}
export function quitarPIN(listo) {
  alTerminar = listo || null;
  mostrar('verificar', 'Escribe tu PIN para quitarlo', '');
  pendiente = 'quitar';
}
let pendiente = '';

function comprobar(intento) {
  const c = config();
  if (!c) { ocultar(); bloqueado = false; return; }
  hashPIN(intento, c.sal).then((h) => {
    if (h === c.hash) {
      fallos = 0;
      if (modo === 'abrir') { ocultar(); bloqueado = false; alAbrir.splice(0).forEach((f) => f()); return; }
      if (pendiente === 'quitar') { borrar(ANTIGUAS.pin); ocultar(); if (alTerminar) alTerminar('quitado'); return; }
      modo = 'nuevo'; escrito = '';
      pintar('Elige tu PIN nuevo', 'De 4 a 6 números.');
      return;
    }
    fallos++; escrito = ''; vibrar([60, 40, 60]);
    const p = $('puntosPin'); p.classList.remove('mal'); void p.offsetWidth; p.classList.add('mal');
    if (fallos >= INTENTOS) { escribir(CLAVES.pinEspera, Date.now() + ESPERA_MS); fallos = 0; pintar(null, 'Demasiados intentos. Espera 30 segundos.'); }
    else pintar(null, 'PIN incorrecto · te quedan ' + (INTENTOS - fallos) + (INTENTOS - fallos === 1 ? ' intento' : ' intentos'));
  });
}

function confirmar() {
  if (modo === 'nuevo') {
    if (escrito.length < 4) return;
    nuevo = escrito; escrito = ''; modo = 'repetir';
    pintar('Repítelo para confirmar', '');
    return;
  }
  if (modo === 'repetir') {
    if (escrito !== nuevo) { modo = 'nuevo'; escrito = ''; nuevo = ''; pintar('No coinciden. Elige un PIN', 'De 4 a 6 números.'); return; }
    const sal = Math.random().toString(36).slice(2) + Date.now().toString(36), pin = nuevo;
    hashPIN(pin, sal).then((h) => {
      escribir(ANTIGUAS.pin, { sal, hash: h, largo: pin.length });
      ocultar();
      if (alTerminar) alTerminar('puesto');
    });
  }
}

export function tecla(k) {
  if (Date.now() < esperaHasta()) { pintar(null, 'Demasiados intentos. Espera unos segundos.'); return; }
  if (k === 'b') { escrito = escrito.slice(0, -1); pintar(); return; }
  if (k === 'x') { if (modo !== 'abrir') { ocultar(); if (alCancelar) alCancelar(); } return; }
  if (k === 'ok') { confirmar(); return; }
  if (!/^\d$/.test(k) || escrito.length >= 6) return;
  escrito += k; vibrar(6); pintar();
  const c = config();
  if ((modo === 'abrir' || modo === 'verificar') && c && escrito.length === c.largo) comprobar(escrito);
  else if (modo === 'repetir' && escrito.length === nuevo.length) confirmar();
  else if (modo === 'nuevo' && escrito.length === 6) confirmar();
}

/* ---------- Bloqueo automático ---------- */
let ultimoToque = Date.now(), ocultoDesde = 0;
export function iniciarCandado() {
  $('teclado').addEventListener('click', (ev) => { const b = ev.target.closest('[data-pin]'); if (b) tecla(b.dataset.pin); });
  document.addEventListener('keydown', (ev) => {
    if ($('candado').hidden) return;
    if (/^\d$/.test(ev.key)) tecla(ev.key);
    else if (ev.key === 'Backspace') tecla('b');
    else if (ev.key === 'Enter') tecla('ok');
    else if (ev.key === 'Escape') tecla('x');
    ev.preventDefault();
  }, true);
  ['pointerdown', 'keydown', 'scroll'].forEach((e) => document.addEventListener(e, () => { ultimoToque = Date.now(); }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { ocultoDesde = Date.now(); return; }
    const min = preferencias().bloqueoMin;
    if (ocultoDesde && min > 0 && Date.now() - ocultoDesde >= min * 60000) bloquear();
    ocultoDesde = 0; ultimoToque = Date.now();
  });
  setInterval(() => {
    const min = preferencias().bloqueoMin;
    if (min > 0 && !document.hidden && Date.now() - ultimoToque >= min * 60000) bloquear();
  }, 15000);
  if (config()) bloquear();
}
