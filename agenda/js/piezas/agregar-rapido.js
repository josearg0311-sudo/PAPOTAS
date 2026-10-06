/* AGREGAR RÁPIDO en 2 toques: 1) qué es, 2) de qué área. Luego se escribe
   como se diría («pagar la luz el viernes 6pm !!») y se ve, antes de guardar,
   cómo se va a guardar. Recuerda tu última área. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { AREAS, area, chipArea } from '../datos/areas.js';
import { ico, esc } from '../util/dom.js';
import { aviso } from './aviso.js';
import { leer, escribir } from '../datos/almacen.js';
import { poner, aPapelera } from '../datos/datos.js';
import { modeloVacio, nuevoId, LISTA_RECORDATORIOS } from '../datos/modelo.js';
import { interpretar } from '../util/interpretar.js';
import { leerMonto, fmtSoles } from '../util/dinero.js';
import { categoriaDe } from '../datos/finanzas.js';
import { hoy, fmtCorta, fmtHora, sumarDias } from '../util/fechas.js';
import { preferencias } from '../datos/preferencias.js';
import { puedeDictar, dictar, separarMonto } from './dictado.js';

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
let alGuardar = () => {};
export function cuandoSeGuarde(fn) { alGuardar = fn; }

const PH = {
  recordatorio: 'Ej. llamar al notario mañana 10am',
  evento: 'Ej. reunión con el equipo el jueves a las 9',
  nota: 'Título en la primera línea…',
  habito: 'Ej. Leer 20 minutos',
  meta: 'Ej. Ahorrar para el viaje'
};

function pasos() { return '<div class="pasos" aria-hidden="true">' + [1, 2, 3].map((n) => '<i class="' + (n <= estado.paso ? 'si' : '') + '"></i>').join('') + '</div>'; }

function campos() {
  const t = estado.tipo;
  if (t === 'gasto') return '<div class="dos-col"><label class="campo"><span>Monto (S/)</span><input id="qaMonto" class="entrada" inputmode="decimal" autocomplete="off" placeholder="0.00"></label>' +
    '<label class="campo"><span>En qué</span><input id="qaTexto" class="entrada" maxlength="160" autocomplete="off" placeholder="Ej. almuerzo, taxi"></label></div>';
  if (t === 'nota') return '<label class="campo"><span>Escribe</span><textarea id="qaTexto" class="entrada" rows="4" maxlength="8000" placeholder="' + PH.nota + '"></textarea></label>';
  if (t === 'meta') return '<label class="campo"><span>Tu meta</span><input id="qaTexto" class="entrada" maxlength="120" autocomplete="off" placeholder="' + PH.meta + '"></label>' +
    '<div class="dos-col"><label class="campo"><span>Llegar a</span><input id="qaObjetivo" class="entrada" inputmode="decimal" placeholder="Ej. 2000"></label><label class="campo"><span>Unidad</span><input id="qaUnidad" class="entrada" maxlength="20" placeholder="soles, libros, km…"></label></div>';
  return '<label class="campo"><span>Escríbelo como lo dirías</span><input id="qaTexto" class="entrada" autocomplete="off" enterkeyhint="done" maxlength="200" placeholder="' + (PH[t] || '') + '"></label>';
}

function pintar() {
  let html = pasos();
  if (estado.paso === 1) {
    html += '<p class="ayuda">' + (estado.fija ? '¿Qué quieres agregar en <b>' + esc(area(estado.fija).nombre) + '</b>?' : '<b>Paso 1 de 2 ·</b> ¿Qué quieres agregar?') + '</p><div class="opciones">' +
      TIPOS.filter((t) => preferencias().completo || !['habito', 'meta'].includes(t[0])).map((t) => '<button type="button" class="opcion" data-qa-tipo="' + t[0] + '">' + ico(t[2]) + '<b>' + t[1] + '</b><small>' + t[3] + '</small></button>').join('') + '</div>';
  } else if (estado.paso === 2) {
    const ult = leer(CLAVE_ULT, '');
    const t = TIPOS.find((x) => x[0] === estado.tipo);
    html += '<p class="ayuda"><b>Paso 2 de 2 ·</b> ' + t[1] + ' de qué área?</p><div class="opciones dos">' +
      AREAS.map((a) => '<button type="button" class="opcion area-op area-' + a.id + (a.id === ult ? ' ultima' : '') + '" data-qa-area="' + a.id + '">' + ico(a.icono) + '<b>' + a.nombre + '</b>' + (a.id === ult ? '<small>La última que usaste</small>' : '<small>' + esc(a.lema) + '</small>') + '</button>').join('') +
      '</div><div class="fila-botones"><button type="button" class="btn" data-qa-atras="1">' + ico('i-izq') + 'Atrás</button></div>';
  } else {
    const t = TIPOS.find((x) => x[0] === estado.tipo);
    html += '<p class="ayuda">' + t[1] + ' en ' + chipArea(estado.area) + '</p>' + campos() +
      (puedeDictar() ? '<div class="fila-botones izq"><button type="button" class="btn" id="qaDictar" aria-pressed="false">🎤 Dictar</button></div>' : '') +
      '<div class="vista-previa" id="qaPrevia" aria-live="polite">Escribe y verás aquí cómo se guardará.</div>' +
      '<div class="fila-botones"><button type="button" class="btn" data-qa-atras="1">' + ico('i-izq') + 'Atrás</button><button type="button" class="btn pri" data-qa-guardar="1">' + ico('i-check') + 'Guardar</button></div>';
  }
  const cont = document.querySelector('#capaHoja [data-qa]');
  if (cont) cont.innerHTML = html; else abrirHoja('Agregar rápido', '<div data-qa="1">' + html + '</div>');
  const f = document.querySelector('#qaMonto, #qaTexto') || document.querySelector('#capaHoja [data-qa-tipo], #capaHoja [data-qa-area]');
  if (f) setTimeout(() => f.focus(), 30);
}

function previa() {
  const el = document.getElementById('qaPrevia'), txt = document.getElementById('qaTexto');
  if (!el || !txt) return;
  const p = preferencias(), v = txt.value.trim(), t = estado.tipo;
  if (t === 'gasto') {
    const m = leerMonto(document.getElementById('qaMonto').value);
    el.innerHTML = m == null ? (document.getElementById('qaMonto').value ? '⚠️ No entiendo ese monto. Ej. 25.50 o 1,250' : 'Escribe el monto.') : 'Se guardará: gasto de <b>' + fmtSoles(m) + '</b>' + (v ? ' · ' + esc(v) : '') + ' · hoy · libro ' + (estado.area === 'oficina' ? 'de la oficina' : 'personal');
    return;
  }
  if (!v) { el.textContent = 'Escribe y verás aquí cómo se guardará.'; return; }
  if (t === 'nota' || t === 'habito' || t === 'meta') { el.innerHTML = 'Se guardará: <b>' + esc(v.split('\n')[0]) + '</b>'; return; }
  const r = interpretar(v), bits = [];
  const fecha = r.algunDia ? null : (r.fecha || hoy());
  bits.push(fecha ? (fecha === hoy() ? 'hoy' : fecha === sumarDias(hoy(), 1) ? 'mañana' : fmtCorta(fecha)) : 'algún día');
  if (r.hora) bits.push(fmtHora(r.hora, p.formatoHora)); else if (t === 'evento') bits.push('todo el día');
  if (r.prioridad) bits.push('prioridad ' + r.prioridad); if (r.plazoLegal) bits.push('plazo legal'); r.etiquetas.forEach((e) => bits.push('#' + e));
  if (r.area && r.area !== estado.area) bits.push('área ' + area(r.area).nombre);
  el.innerHTML = 'Se guardará: <b>' + esc(r.titulo || '…') + '</b> · ' + esc(bits.join(' · '));
}

function guardar() {
  const txt = document.getElementById('qaTexto'), v = txt ? txt.value.trim() : '', t = estado.tipo, ar = estado.area;
  const base = () => Object.assign(modeloVacio(), { area: ar });
  let nuevo = null, msj = '';
  if (t === 'gasto') {
    const m = leerMonto(document.getElementById('qaMonto').value);
    if (m == null || m <= 0) { aviso('Falta el monto (ej. 25.50).'); document.getElementById('qaMonto').focus(); return; }
    nuevo = poner(Object.assign(base(), { id: nuevoId('mov'), tipo: 'movimiento', titulo: v || 'Gasto', estado: 'hecho', monto: m, fechas: Object.assign(modeloVacio().fechas, { inicio: hoy() }), extra: { libro: ar === 'oficina' ? 'oficina' : 'personal', ingreso: false, categoria: categoriaDe(v, ar === 'oficina' ? 'oficina' : 'personal') } }));
    msj = '💸 ' + fmtSoles(m) + (v ? ' · ' + v : '');
  } else {
    if (!v) { aviso('Escribe algo primero.'); txt.focus(); return; }
    if (t === 'recordatorio' || t === 'evento') {
      const r = interpretar(v), fecha = r.algunDia ? null : (r.fecha || hoy());
      if (t === 'recordatorio') {
        nuevo = poner(Object.assign(base(), { id: nuevoId('pend'), tipo: 'pendiente', titulo: r.titulo || v, area: r.area || ar, prioridad: r.prioridad || 'baja', plazoLegal: r.plazoLegal, etiquetas: r.etiquetas, aviso: !!r.hora, lista: LISTA_RECORDATORIOS, fechas: Object.assign(modeloVacio().fechas, { inicio: fecha, hora: r.hora }) }));
      } else {
        const fin = r.hora ? String((+r.hora.slice(0, 2) + 1) % 24).padStart(2, '0') + r.hora.slice(2) : null;
        nuevo = poner(Object.assign(base(), { id: nuevoId('ev'), tipo: 'evento', titulo: r.titulo || v, area: r.area || ar, todoElDia: !r.hora, aviso: r.hora ? 15 : null, etiquetas: r.etiquetas, fechas: Object.assign(modeloVacio().fechas, { inicio: fecha || hoy(), hora: r.hora, horaFin: fin }), extra: { tipoEvento: 'evento', lugar: '' } }));
      }
      msj = (t === 'evento' ? 'Evento' : 'Recordatorio') + ' guardado' + (nuevo.fechas.inicio ? ' · ' + fmtCorta(nuevo.fechas.inicio) : '');
    } else if (t === 'nota') {
      const [tit, ...resto] = v.split('\n');
      nuevo = poner(Object.assign(base(), { id: nuevoId('nota'), tipo: 'nota', titulo: tit.trim().slice(0, 120), notas: resto.join('\n').trim(), extra: { fija: false } }));
      msj = 'Nota guardada';
    } else if (t === 'habito') {
      nuevo = poner(Object.assign(base(), { id: nuevoId('hab'), tipo: 'habito', titulo: v.slice(0, 80), extra: { dias: [0, 1, 2, 3, 4, 5, 6], marcas: {} } }));
      msj = 'Hábito creado: ' + nuevo.titulo;
    } else if (t === 'meta') {
      const obj = parseFloat(String(document.getElementById('qaObjetivo').value).replace(/,/g, '')) || 0;
      nuevo = poner(Object.assign(base(), { id: nuevoId('meta'), tipo: 'meta', titulo: v.slice(0, 120), extra: { actual: 0, objetivo: obj, unidad: document.getElementById('qaUnidad').value.trim() } }));
      msj = 'Meta creada: ' + nuevo.titulo;
    }
  }
  escribir(CLAVE_ULT, ar);
  cerrarHoja();
  alGuardar(nuevo);
  const id = nuevo.id;
  aviso(msj, () => { aPapelera(id); alGuardar(null); }, 'Deshacer');
}

/* «Añadir en Personal…»: con el espacio ya elegido, solo se pregunta qué es */
export function abrirAgregar(tipo, areaFija = '') {
  estado = { paso: tipo ? (areaFija ? 3 : 2) : 1, tipo: tipo || '', area: areaFija || '', fija: areaFija || '' };
  pintar();
}

document.addEventListener('click', (ev) => {
  const t = ev.target.closest && ev.target.closest('[data-qa-tipo],[data-qa-area],[data-qa-atras],[data-qa-guardar]');
  if (!t) return;
  if (t.dataset.qaTipo) { estado.tipo = t.dataset.qaTipo; estado.paso = estado.fija ? 3 : 2; pintar(); }
  else if (t.dataset.qaArea) { estado.area = t.dataset.qaArea; estado.paso = 3; pintar(); }
  else if (t.dataset.qaAtras) { estado.paso = estado.fija && estado.paso === 3 ? 1 : Math.max(1, estado.paso - 1); pintar(); }
  else if (t.dataset.qaGuardar) guardar();
});
/* Dictado: toca 🎤, habla y se escribe; en un gasto, el número va al monto */
let pararDictado = null;
document.addEventListener('click', (ev) => {
  const b = ev.target.closest && ev.target.closest('#qaDictar'); if (!b) return;
  if (pararDictado) { pararDictado(); return; }
  const txt = document.getElementById('qaTexto'); if (!txt) return;
  b.setAttribute('aria-pressed', 'true'); b.textContent = '⏺ Escuchando… (toca para parar)';
  pararDictado = dictar(txt, {
    alCambiar: (v, final) => {
      const m = document.getElementById('qaMonto');
      if (final && m && estado.tipo === 'gasto' && !m.value) { const r = separarMonto(v); if (r.monto) { m.value = r.monto; txt.value = r.texto; } }
      previa();
    },
    alTerminar: (error) => { pararDictado = null; const x = document.getElementById('qaDictar'); if (x) { x.setAttribute('aria-pressed', 'false'); x.textContent = '🎤 Dictar'; } if (error) aviso(error); }
  });
});
document.addEventListener('input', (ev) => { if (ev.target.id === 'qaTexto' || ev.target.id === 'qaMonto') previa(); });
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && !ev.shiftKey && (ev.target.id === 'qaMonto' || (ev.target.id === 'qaTexto' && ev.target.tagName === 'INPUT'))) { ev.preventDefault(); guardar(); }
});
