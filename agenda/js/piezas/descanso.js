/* CRONÓMETRO DE DESCANSO entre series: eliges los segundos, cuenta hacia
   atrás en grande y suena/vibra al terminar. Sigue bien aunque el teléfono
   se apague un rato (se calcula con la hora, no contando ticks). */
import { abrirHoja } from './hoja.js';
import { sonar } from './avisos.js';
import { leer, escribir } from '../datos/almacen.js';

const CLAVE = 'agenda5_descanso';
const OPCIONES = [30, 45, 60, 90, 120, 180];
const fmt = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

export function abrirDescanso() {
  let seg = +leer(CLAVE, 60) || 60, fin = 0, timer = null, series = 0;
  const hoja = abrirHoja('Descanso', '<div class="descanso"><div class="selector envuelve" id="dsOps" role="group" aria-label="Segundos de descanso">' +
    OPCIONES.map((s) => '<button type="button" data-s="' + s + '" aria-pressed="' + (s === seg) + '">' + (s < 60 ? s + ' s' : fmt(s)) + '</button>').join('') + '</div>' +
    '<p class="ds-reloj mono" id="dsReloj" aria-live="off">' + fmt(seg) + '</p><p class="ds-estado" id="dsEstado" aria-live="polite">Listo para descansar</p>' +
    '<div class="fila-botones"><button type="button" class="btn" id="dsMas">+15 s</button><button type="button" class="btn pri" id="dsIr">Empezar descanso</button></div>' +
    '<p class="ayuda" id="dsSeries">Series hechas: 0</p></div>', { alCerrar: () => clearInterval(timer) });
  const reloj = hoja.querySelector('#dsReloj'), estado = hoja.querySelector('#dsEstado'), ir = hoja.querySelector('#dsIr');
  const pintar = () => { const q = Math.max(0, Math.ceil((fin - Date.now()) / 1000)); reloj.textContent = fmt(fin ? q : seg); return q; };
  const parar = (txt) => { clearInterval(timer); timer = null; fin = 0; ir.textContent = 'Empezar descanso'; estado.textContent = txt; pintar(); };
  const tick = () => { if (pintar() <= 0) { sonar(); series++; hoja.querySelector('#dsSeries').textContent = 'Series hechas: ' + series; parar('¡A la siguiente serie! 💪'); } };
  hoja.querySelector('#dsOps').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-s]'); if (!b) return;
    seg = +b.dataset.s; escribir(CLAVE, seg);
    hoja.querySelectorAll('#dsOps button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (!timer) pintar();
  });
  hoja.querySelector('#dsMas').addEventListener('click', () => { if (timer) fin += 15000; else seg = Math.min(600, seg + 15); pintar(); });
  ir.addEventListener('click', () => {
    if (timer) { parar('Descanso detenido'); return; }
    fin = Date.now() + seg * 1000; ir.textContent = 'Detener'; estado.textContent = 'Descansando…';
    timer = setInterval(tick, 250); pintar();
  });
}
