/* Agregar rápido en 2 toques: 1) qué es, 2) de qué área. Después se escribe.
   En la Fase 1 la hoja ya funciona y recuerda tu última área; guardar llega
   con los datos nuevos (Fase 2) y la pantalla de Recordatorios (Fase 3). */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { AREAS, area } from '../datos/areas.js';
import { ico, esc } from '../util/dom.js';
import { aviso } from './aviso.js';
import { leer, escribir } from '../datos/almacen.js';

export const TIPOS = [
  ['recordatorio', 'Recordatorio', 'i-rec', 'Algo que hacer, con o sin hora'],
  ['evento', 'Evento', 'i-agenda', 'Ocupa un bloque de tu día'],
  ['gasto', 'Gasto', 'i-dinero', 'Lo que acabas de gastar'],
  ['nota', 'Nota', 'i-nota', 'Una idea o un apunte'],
  ['habito', 'Hábito', 'i-fuego', 'Algo que quieres hacer seguido'],
  ['meta', 'Meta', 'i-meta', 'Un número al que quieres llegar']
];
const CLAVE_ULT = 'agenda5_ultima_area';
let estado = { paso: 1, tipo: '', area: '' };

function pasos() { return '<div class="pasos" aria-hidden="true">' + [1, 2, 3].map((n) => '<i class="' + (n <= estado.paso ? 'si' : '') + '"></i>').join('') + '</div>'; }

function pintar() {
  let html = pasos();
  if (estado.paso === 1) {
    html += '<p class="ayuda"><b>Paso 1 de 2 ·</b> ¿Qué quieres agregar?</p><div class="opciones">' +
      TIPOS.map((t) => '<button type="button" class="opcion" data-qa-tipo="' + t[0] + '">' + ico(t[2]) + '<b>' + t[1] + '</b><small>' + t[3] + '</small></button>').join('') + '</div>';
  } else if (estado.paso === 2) {
    const ult = leer(CLAVE_ULT, '');
    const t = TIPOS.find((x) => x[0] === estado.tipo);
    html += '<p class="ayuda"><b>Paso 2 de 2 ·</b> ' + t[1] + ' de qué área?</p><div class="opciones dos">' +
      AREAS.map((a) => '<button type="button" class="opcion area-op area-' + a.id + (a.id === ult ? ' ultima' : '') + '" data-qa-area="' + a.id + '">' + ico(a.icono) + '<b>' + a.nombre + '</b>' + (a.id === ult ? '<small>La última que usaste</small>' : '<small>' + esc(a.lema) + '</small>') + '</button>').join('') +
      '</div><div class="fila-botones"><button type="button" class="btn" data-qa-atras="1">' + ico('i-izq') + 'Atrás</button></div>';
  } else {
    const t = TIPOS.find((x) => x[0] === estado.tipo), a = area(estado.area);
    html += '<p class="ayuda">' + t[1] + ' en <span class="chip area-' + a.id + '">' + a.nombre + '</span></p>' +
      '<label class="campo"><span>Escríbelo como lo dirías</span><input id="qaTexto" class="entrada" autocomplete="off" enterkeyhint="done" maxlength="200" placeholder="Ej. llamar al notario mañana 10am"></label>' +
      '<div class="nota-fase">' + ico('i-info') + '<span>En esta primera fase la hoja ya funciona, pero <b>guardar llega en la Fase 3</b>, cuando estén listos los datos nuevos y la pantalla de Recordatorios.</span></div>' +
      '<div class="fila-botones"><button type="button" class="btn" data-qa-atras="1">' + ico('i-izq') + 'Atrás</button><button type="button" class="btn pri" data-qa-guardar="1">' + ico('i-check') + 'Guardar</button></div>';
  }
  const hoja = document.querySelector('#capaHoja .hoja-cuerpo');
  if (hoja) { hoja.innerHTML = html; const f = hoja.querySelector('#qaTexto, button'); if (f) f.focus(); }
  else abrirHoja('Agregar rápido', html);
}

export function abrirAgregar() { estado = { paso: 1, tipo: '', area: '' }; pintar(); }

document.addEventListener('click', (ev) => {
  const t = ev.target.closest && ev.target.closest('[data-qa-tipo],[data-qa-area],[data-qa-atras],[data-qa-guardar]');
  if (!t) return;
  if (t.dataset.qaTipo) { estado.tipo = t.dataset.qaTipo; estado.paso = 2; pintar(); }
  else if (t.dataset.qaArea) { estado.area = t.dataset.qaArea; escribir(CLAVE_ULT, estado.area); estado.paso = 3; pintar(); }
  else if (t.dataset.qaAtras) { estado.paso = Math.max(1, estado.paso - 1); pintar(); }
  else if (t.dataset.qaGuardar) { cerrarHoja(); aviso('Guardar llega en la Fase 3. Por ahora es una vista previa.'); }
});
