/* EVENTOS: crear y editar (reunión, examen, partido, cita, cumpleaños…),
   pasarlos al calendario del teléfono y marcar pagos fijos del calendario. */
import { buscarElemento, poner, aPapelera, restaurar, elementos } from '../datos/datos.js';
import { modeloVacio, nuevoId } from '../datos/modelo.js';
import { AREAS } from '../datos/areas.js';
import { REPETIR } from '../datos/pendientes.js';
import { pagado } from '../datos/calendario.js';
import { hoy, fmtCorta } from '../util/fechas.js';
import { fmtSoles } from '../util/dinero.js';
import { ico, esc } from '../util/dom.js';
import { enlaceGoogle, textoICS } from '../util/ics.js';
import { guardarArchivo } from '../datos/respaldo.js';
import { abrirHoja, cerrarHoja } from './hoja.js';
import { aviso } from './aviso.js';

export const TIPOS_EVENTO = [['evento', 'Evento'], ['reunion', 'Reunión'], ['examen', 'Examen'], ['partido', 'Partido'], ['cita', 'Cita'], ['cumple', 'Cumpleaños']];
const AVISOS = [['-1', 'Sin aviso'], ['0', 'A la hora'], ['10', '10 min antes'], ['15', '15 min antes'], ['30', '30 min antes'], ['60', '1 hora antes'], ['120', '2 horas antes'], ['1440', '1 día antes']];
const sel = (n, ops, v) => '<select class="entrada" name="' + n + '">' + ops.map(([a, t]) => '<option value="' + a + '"' + (String(a) === String(v) ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>';
const selector = (n, ops, v) => '<div class="selector envuelve" data-sel="' + n + '">' + ops.map(([a, t]) => '<button type="button" data-v="' + a + '" aria-pressed="' + (a === v) + '">' + t + '</button>').join('') + '</div>';

export function nuevoEvento(repintar, preset = {}) {
  const base = Object.assign(modeloVacio(), { id: '', tipo: 'evento', area: preset.area || 'personal', fechas: Object.assign(modeloVacio().fechas, { inicio: preset.fecha || hoy(), hora: preset.hora || null, horaFin: preset.horaFin || null }), todoElDia: !preset.hora, aviso: preset.hora ? 15 : null, extra: { tipoEvento: 'evento', lugar: '' } });
  editarEvento(null, repintar, base);
}

export function editarEvento(id, repintar, base = null) {
  const x = id ? JSON.parse(JSON.stringify(buscarElemento(id))) : base;
  if (!x) return;
  const f = x.fechas, te = x.extra.tipoEvento || 'evento';
  const hoja = abrirHoja(id ? 'Editar evento' : 'Nuevo evento', '<form id="formEv" class="form" autocomplete="off">' +
    '<label class="campo"><span>Título</span><input class="entrada" name="titulo" required maxlength="200" value="' + esc(x.titulo) + '" placeholder="Ej. Audiencia, parcial de Estadística, pichanga"></label>' +
    '<div class="campo"><span>Tipo</span>' + selector('tipoEvento', TIPOS_EVENTO, te) + '</div>' +
    '<div class="campo"><span>Área</span>' + selector('area', AREAS.map((a) => [a.id, a.nombre]), x.area) + '</div>' +
    '<div class="dos-col"><label class="campo"><span>Día</span><input type="date" class="entrada" name="inicio" required value="' + (f.inicio || hoy()) + '"></label>' +
    '<label class="campo"><span>Hasta (varios días)</span><input type="date" class="entrada" name="fin" value="' + (f.fin || '') + '"></label></div>' +
    '<label class="interruptor"><input type="checkbox" name="todoElDia"' + (x.todoElDia || !f.hora ? ' checked' : '') + '><span>Todo el día</span></label>' +
    '<div class="dos-col" id="evHoras"' + (x.todoElDia || !f.hora ? ' hidden' : '') + '><label class="campo"><span>Empieza</span><input type="time" class="entrada" name="hora" value="' + (f.hora || '') + '"></label>' +
    '<label class="campo"><span>Termina</span><input type="time" class="entrada" name="horaFin" value="' + (f.horaFin || '') + '"></label></div>' +
    '<label class="campo"><span>Lugar</span><input class="entrada" name="lugar" maxlength="120" value="' + esc(x.extra.lugar || (x.datos && x.datos.lugar) || '') + '" placeholder="Opcional · ej. Av. Abancay, Zoom"></label>' +
    '<div class="dos-col"><label class="campo"><span>Se repite</span>' + sel('repetir', REPETIR, x.repetir || '') + '</label>' +
    '<label class="campo"><span>Aviso</span>' + sel('aviso', AVISOS, x.aviso == null ? '-1' : x.aviso) + '</label></div>' +
    '<label class="campo"><span>Notas</span><textarea class="entrada" name="notas" maxlength="4000">' + esc(x.notas) + '</textarea></label>' +
    (id ? '<div class="fila-botones izq"><a class="btn chico" href="' + esc(enlaceGoogle(x)) + '" target="_blank" rel="noopener">' + ico('i-agenda') + 'Google Calendar</a><button type="button" class="btn chico" id="evIcs">' + ico('i-bajar') + 'Archivo .ics</button></div>' : '') +
    '<div class="fila-botones">' + (id ? '<button type="button" class="btn peligro" id="evBorrar">' + ico('i-basura') + 'Borrar</button>' : '') + '<button type="submit" class="btn pri">' + ico('i-check') + 'Guardar</button></div></form>');
  const fm = hoja.querySelector('#formEv');
  hoja.querySelectorAll('[data-sel] button').forEach((b) => b.addEventListener('click', () => {
    b.parentNode.querySelectorAll('button').forEach((y) => y.setAttribute('aria-pressed', String(y === b)));
    if (b.parentNode.dataset.sel === 'tipoEvento' && b.dataset.v === 'cumple') { fm.repetir.value = 'ano'; fm.todoElDia.checked = true; hoja.querySelector('#evHoras').hidden = true; fm.aviso.value = '1440'; }
  }));
  fm.todoElDia.addEventListener('change', () => { hoja.querySelector('#evHoras').hidden = fm.todoElDia.checked; if (!fm.todoElDia.checked && !fm.hora.value) fm.hora.value = '09:00'; });
  fm.hora.addEventListener('change', () => { if (fm.hora.value && (!fm.horaFin.value || fm.horaFin.value <= fm.hora.value)) { const [a, b] = fm.hora.value.split(':').map(Number); fm.horaFin.value = String((a + 1) % 24).padStart(2, '0') + ':' + String(b).padStart(2, '0'); } });
  fm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const leer = (n) => ((hoja.querySelector('[data-sel="' + n + '"] [aria-pressed="true"]') || {}).dataset || {}).v;
    x.titulo = fm.titulo.value.trim(); if (!x.titulo) return;
    x.extra.tipoEvento = leer('tipoEvento') || 'evento'; x.area = leer('area') || x.area;
    x.fechas.inicio = fm.inicio.value || hoy(); x.fechas.fin = fm.fin.value && fm.fin.value > x.fechas.inicio ? fm.fin.value : null;
    x.todoElDia = fm.todoElDia.checked || !fm.hora.value;
    x.fechas.hora = x.todoElDia ? null : fm.hora.value; x.fechas.horaFin = x.todoElDia ? null : (fm.horaFin.value || null);
    x.extra.lugar = fm.lugar.value.trim(); x.repetir = fm.repetir.value || null;
    const av = +fm.aviso.value; x.aviso = av >= 0 ? av : null; x.notas = fm.notas.value.trim();
    if (!x.id) x.id = nuevoId('ev');
    poner(x); cerrarHoja(); repintar(); aviso(id ? 'Evento guardado' : 'Evento creado · ' + fmtCorta(x.fechas.inicio));
  });
  const ics = hoja.querySelector('#evIcs');
  if (ics) ics.addEventListener('click', () => { guardarArchivo(textoICS([buscarElemento(id)]), (x.titulo || 'evento').replace(/[^\wáéíóúñ -]/gi, '').slice(0, 40) + '.ics', 'text/calendar'); aviso('Abre el archivo para agregarlo a tu calendario.'); });
  const bb = hoja.querySelector('#evBorrar');
  if (bb) bb.addEventListener('click', () => { aPapelera(id); cerrarHoja(); repintar(); aviso('Evento enviado a la papelera', () => { restaurar(id); repintar(); }); });
  if (!id) setTimeout(() => fm.titulo.focus(), 50);
}

/* Todo lo que viene (eventos y recordatorios con fecha desde hoy) en un .ics */
export function exportarTodo() {
  const h = hoy();
  const l = elementos((x) => (x.tipo === 'evento' && (x.repetir || (x.fechas.fin || x.fechas.inicio) >= h)) || (x.tipo === 'pendiente' && x.estado !== 'hecho' && x.fechas.inicio && x.fechas.inicio >= h));
  guardarArchivo(textoICS(l), 'agenda_' + h + '.ics', 'text/calendar');
  return l.length;
}

/* Pago fijo: marcarlo pagado ese mes (y anotar el gasto en su libro) */
export function alternarPago(id, ym) {
  const p = buscarElemento(id); if (!p) return null;
  const y = JSON.parse(JSON.stringify(p)), on = !pagado(p, ym);
  y.extra.pagados = Object.assign({}, (p.datos && p.datos.pagados) || {}, y.extra.pagados || {});
  if (on) y.extra.pagados[ym] = Date.now(); else { delete y.extra.pagados[ym]; if (y.datos && y.datos.pagados) delete y.datos.pagados[ym]; }
  poner(y);
  const idMov = 'mov_pago_' + id + '_' + ym, mov = buscarElemento(idMov);
  if (on && +p.monto > 0) poner(Object.assign(modeloVacio(), { id: idMov, tipo: 'movimiento', titulo: p.titulo, area: p.area, estado: 'hecho', monto: p.monto, borrado: null, fechas: Object.assign(modeloVacio().fechas, { inicio: hoy() }), extra: { libro: p.area === 'oficina' ? 'oficina' : 'personal', ingreso: false, categoria: (p.datos && p.datos.cat) || 'Servicios', pago: id } }));
  else if (!on && mov && !mov.borrado) aPapelera(idMov);
  return { on, texto: on ? 'Pagado ✓ ' + p.titulo + (p.monto ? ' · ' + fmtSoles(p.monto) + ' anotado en tu libro' : '') : 'Pago desmarcado' };
}
