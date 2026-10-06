/* Claro, oscuro o automático (según el celular). Se aplica antes de pintar
   para que no haya parpadeo (ver el guion corto en index.html). */
import { preferencias, alCambiarPref } from '../datos/preferencias.js';

const medio = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

export function temaEfectivo(p = preferencias()) {
  if (p.tema === 'auto') return medio && medio.matches ? 'claro' : 'oscuro';
  return p.tema;
}
export function aplicarTema() {
  const t = temaEfectivo();
  document.documentElement.setAttribute('data-tema', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t === 'claro' ? '#FFFFFF' : '#000000');
}
if (medio && medio.addEventListener) medio.addEventListener('change', () => { if (preferencias().tema === 'auto') aplicarTema(); });
alCambiarPref(aplicarTema);
