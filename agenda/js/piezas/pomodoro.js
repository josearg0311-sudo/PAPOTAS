/* POMODORO: 25 min de foco y 5 de descanso (cada 4, uno largo de 15).
   Se vincula a un pendiente y, al terminar, suma los minutos a ese
   pendiente y a su área en el «enfoque» del día. Sigue corriendo aunque
   cierres la app (se guarda la hora de fin, no un contador). */
import { leer, escribir } from '../datos/almacen.js';
import { buscarElemento, poner } from '../datos/datos.js';
import { modeloVacio } from '../datos/modelo.js';
import { hoy } from '../util/fechas.js';
import { aviso } from './aviso.js';
import { sonar, notificar } from './avisos.js';

const CLAVE = 'agenda5_foco';
export const MODOS = { foco: { nombre: 'Foco', min: 25 }, corto: { nombre: 'Descanso', min: 5 }, largo: { nombre: 'Descanso largo', min: 15 } };
let st = Object.assign({ modo: 'foco', fin: 0, resta: 0, item: '', ciclo: 0, rapido: false }, leer(CLAVE, {}) || {});
const guardar = () => escribir(CLAVE, st);

export function estadoPomo() { return st; }
export function totalMs() { return MODOS[st.modo].min * 60000 / (st.rapido ? 150 : 1); }
export function restante() { return st.fin ? Math.max(0, st.fin - Date.now()) : (st.resta || totalMs()); }
export function corriendo() { return !!st.fin; }
export function vincular(id) { st.item = id || ''; guardar(); }
export function alternar() {
  if (st.fin) { st.resta = restante(); st.fin = 0; }
  else { st.fin = Date.now() + restante(); st.resta = 0; }
  guardar();
}
export function reiniciar() { st.fin = 0; st.resta = 0; guardar(); }
export function modoRapido(on) { st.rapido = on; st.fin = 0; st.resta = 0; guardar(); }
export function mmss(ms) { const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }

/* Minutos de foco de hoy por área (y de días anteriores, de la v4.5) */
export function enfoqueDe(dia = hoy()) {
  const id = 'enfoque_' + dia;
  return buscarElemento(id);
}
export function minutosHoy() {
  const e = enfoqueDe();
  if (!e) return {};
  const r = Object.assign({}, e.extra.minutosArea || {});
  /* lo que traía la v4.5: pomodoros por espacio (25 min cada uno) */
  const viejo = e.datos && e.datos.pomosEsp;
  if (viejo && !e.extra.minutosArea) Object.keys(viejo).forEach((k) => { r[k] = (r[k] || 0) + viejo[k] * 25; });
  return r;
}

function terminar() {
  const era = st.modo;
  st.fin = 0; st.resta = 0;
  if (era === 'foco') {
    const it = st.item ? buscarElemento(st.item) : null, area = it ? it.area : 'personal', min = MODOS.foco.min;
    const id = 'enfoque_' + hoy(), e = buscarElemento(id);
    const y = e ? JSON.parse(JSON.stringify(e)) : Object.assign(modeloVacio(), { id, tipo: 'enfoque', titulo: 'Enfoque del día', fechas: Object.assign(modeloVacio().fechas, { inicio: hoy() }) });
    y.borrado = null;
    y.extra.minutosArea = Object.assign({}, y.extra.minutosArea || (y.datos && y.datos.pomosEsp ? Object.fromEntries(Object.entries(y.datos.pomosEsp).map(([k, v]) => [k, v * 25])) : {}));
    y.extra.minutosArea[area] = (y.extra.minutosArea[area] || 0) + min;
    y.extra.pomos = (y.extra.pomos || (y.datos && y.datos.pomos) || 0) + 1;
    poner(y);
    if (it) { const z = JSON.parse(JSON.stringify(it)); z.extra.minutos = (z.extra.minutos || 0) + min; poner(z); }
    st.ciclo = (st.ciclo || 0) + 1;
    st.modo = st.ciclo % 4 === 0 ? 'largo' : 'corto';
    aviso('🍅 ¡Sesión terminada! +' + min + ' min' + (it ? ' a «' + it.titulo + '»' : '') + '. Ahora descansa.');
    notificar('¡Sesión de foco terminada!', 'Toca descansar ' + MODOS[st.modo].min + ' minutos.', 'hoy');
  } else {
    st.modo = 'foco';
    aviso('Se acabó el descanso. A concentrarse otra vez.');
    notificar('Se acabó el descanso', 'A concentrarse otra vez.', 'hoy');
  }
  sonar();
  guardar();
  return true;
}
/* Se llama cada segundo: devuelve true si terminó una sesión (para repintar) */
export function tic() { return st.fin && Date.now() >= st.fin ? terminar() : false; }
