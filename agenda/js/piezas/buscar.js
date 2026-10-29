/* BUSCAR (lupa de la cabecera o tecla /): escribe lo que buscas o lo que
   quieres hacer. Muestra 1) qué puedes hacer, 2) a dónde ir y 3) tus cosas,
   cada una con el color de su área. Recuerda tus últimas búsquedas. */
import { abrirHoja, cerrarHoja } from './hoja.js';
import { abrirAgregar } from './agregar-rapido.js';
import { esc, ico } from '../util/dom.js';
import { leer, escribir } from '../datos/almacen.js';
import { elementos } from '../datos/datos.js';
import { AREAS, area, chipArea } from '../datos/areas.js';
import { TIPOS } from '../datos/modelo.js';
import { coincide, buscarElementos, DONDE } from '../datos/buscador.js';
import { fmtCorta } from '../util/fechas.js';

const CLAVE = 'agenda5_busq';

/* Lo que puedes hacer (palabras con las que se encuentra) */
const HACER = [
  ['recordatorio', 'Crear un recordatorio', 'Algo que hacer, con o sin hora', 'tarea pendiente recordar hacer aviso alarma'],
  ['evento', 'Agendar un evento', 'Cita, reunión, examen o partido', 'evento cita reunion examen partido calendario agendar'],
  ['gasto', 'Anotar un gasto', 'Lo que acabas de gastar', 'gasto gaste pagar compra plata dinero soles'],
  ['nota', 'Escribir una nota', 'Ideas, datos y apuntes', 'nota apunte idea escribir'],
  ['habito', 'Crear un hábito', 'Algo que quieres hacer seguido', 'habito racha rutina'],
  ['meta', 'Ponerte una meta', 'Un número al que quieres llegar', 'meta objetivo ahorrar leer']
];
/* A dónde ir */
const IR = [
  ['#hoy', 'Hoy', 'Tu día de un vistazo', 'hoy dia resumen'],
  ['#recordatorios', 'Recordatorios', 'Tus listas y pendientes', 'recordatorios tareas pendientes listas compras'],
  ['#agenda', 'Agenda', 'Día, semana y mes', 'agenda calendario semana mes dia'],
  ['#seguimiento', 'Seguimiento', 'Cómo vas en cada área', 'seguimiento progreso estadisticas habitos metas'],
  ['#seguimiento/revision', 'Revisión semanal', 'Mira tu semana y planea la próxima', 'revision semanal semana planear'],
  ['#finanzas', 'Finanzas · libro personal', 'Gastos, ingresos y presupuesto', 'finanzas dinero gastos ingresos presupuesto libro personal'],
  ['#finanzas/oficina', 'Finanzas · libro de la oficina', 'Las cuentas de la oficina', 'finanzas oficina libro cuentas facturas'],
  ['#notas', 'Notas', 'Tus apuntes por área', 'notas apuntes'],
  ['#notas/diario', 'Diario', 'Ánimo, agua y sueño', 'diario animo agua sueno'],
  ['#ajustes', 'Ajustes', 'Nube, respaldo, PIN, teclado', 'ajustes configuracion nube respaldo pin tema teclado'],
  ['#datos', 'Tus datos', 'Todo lo que tienes guardado', 'datos explorador todo'],
  ['#papelera', 'Papelera', 'Lo que borraste (30 días)', 'papelera borrado recuperar']
];
const HERR = {
  personal: [['casa', 'Casa', 'limpieza sabanas plantas hogar'], ['menu', 'Menú de la semana', 'menu comida almuerzo cena'], ['documentos', 'Documentos', 'dni pasaporte soat vence'], ['cumpleanos', 'Cumpleaños', 'cumpleanos aniversario regalo'], ['prestamos', 'Préstamos', 'prestamo deuda debe']],
  estudios: [['cursos', 'Cursos y notas', 'cursos notas promedio faltas horario clases'], ['examenes', 'Exámenes', 'examen parcial final repaso'], ['fichas', 'Fichas de repaso', 'fichas repaso memorizar']],
  oficina: [['plazos', 'Plazos legales', 'plazo legal vence'], ['tablero', 'Tablero', 'tablero proyectos trabajo'], ['cobros', 'Cobros', 'cobrar facturas cliente debe'], ['horas', 'Horas trabajadas', 'horas cronometro tarifa'], ['clientes', 'Clientes', 'clientes contacto whatsapp'], ['actas', 'Actas de reunión', 'actas reunion acuerdos']],
  deporte: [['entrenos', 'Entrenos y racha', 'entreno gym correr racha'], ['rutinas', 'Rutinas y récords', 'rutina gym records pesas'], ['partidos', 'Partidos', 'partido pichanga futbol cancha'], ['peso', 'Peso', 'peso kilos imc']]
};

function recientes() { const l = leer(CLAVE, []); return Array.isArray(l) ? l.filter((x) => typeof x === 'string').slice(0, 6) : []; }
function recordar(q) {
  q = q.trim(); if (q.length < 3) return;
  escribir(CLAVE, [q].concat(recientes().filter((x) => x.toLowerCase() !== q.toLowerCase() && !q.toLowerCase().startsWith(x.toLowerCase()))).slice(0, 6));
}

/* A dónde lleva tocar cada cosa */
function enlace(x) {
  const a = area(x.area).id;
  if (x.tipo === 'pendiente') return 'data-acc="p-editar" data-id="' + esc(x.id) + '"';
  if (x.tipo === 'evento') return 'data-acc="ev-editar" data-id="' + esc(x.id) + '"';
  if (x.tipo === 'nota') return 'data-acc="nota-editar" data-id="' + esc(x.id) + '"';
  if (x.tipo === 'lista') return 'data-acc="r-lista-ir" data-id="' + esc(x.id) + '"';
  if (x.tipo === 'diario' || x.tipo === 'bienestar') return 'href="#notas/diario"';
  if (x.tipo === 'movimiento' || x.tipo === 'pago') return 'href="#finanzas' + ((x.extra && x.extra.libro) === 'oficina' || a === 'oficina' ? '/oficina' : '') + '"';
  if (x.tipo === 'revision') return 'href="#seguimiento/revision"';
  const d = DONDE[x.tipo];
  if (d) return 'href="#areas/' + (d[0] || a) + '/' + d[1] + '"';
  return 'data-acc="dato-ver" data-id="' + esc(x.id) + '"';
}
function fila(attrs, icono, titulo, sub, tag = 'a') {
  const t = attrs.startsWith('href') ? 'a' : 'button';
  return '<' + t + ' class="bus-fila" ' + (t === 'button' ? 'type="button" ' : '') + attrs + '>' + icono + '<span><b>' + titulo + '</b><small>' + sub + '</small></span>' + ico('i-der') + '</' + t + '>';
}

export function resultadosHTML(q) {
  q = String(q || '').trim();
  if (q.length < 2) {
    const r = recientes();
    return '<p class="ayuda">Escribe lo que buscas («luz», «examen») o lo que quieres hacer («gasto», «cita»).</p>' +
      (r.length ? '<div class="bus-recientes"><small>Recientes</small>' + r.map((x) => '<button type="button" class="chip" data-busq="' + esc(x) + '">' + ico('i-buscar') + esc(x) + '</button>').join('') + '</div>' : '');
  }
  const hacer = HACER.filter((h) => coincide(h[1] + ' ' + h[3], q)).slice(0, 3);
  const ir = IR.filter((x) => coincide(x[1] + ' ' + x[3], q)).slice(0, 3);
  const herr = [];
  AREAS.forEach((a) => (HERR[a.id] || []).forEach((h) => { if (coincide(a.nombre + ' ' + h[1] + ' ' + h[2], q)) herr.push([a, h]); }));
  AREAS.forEach((a) => { if (coincide(a.nombre + ' ' + (a.lema || ''), q)) herr.unshift([a, null]); });
  const cosas = buscarElementos(elementos(), q);
  let html = '';
  if (hacer.length || ir.length || herr.length) html += '<div class="bus-grupo"><small>Hacer o ir a</small>' +
    hacer.map((h) => fila('data-bus-hacer="' + h[0] + '"', '<span class="bus-ico">' + ico('i-plus') + '</span>', h[1], h[2])).join('') +
    herr.slice(0, 4).map(([a, h]) => fila('href="#areas/' + a.id + (h ? '/' + h[0] : '') + '"', '<span class="bus-ico area-' + a.id + '"><i class="punto"></i></span>', h ? h[1] : a.nombre, a.nombre + (h ? '' : ' · resumen del área'))).join('') +
    ir.map((x) => fila('href="' + x[0] + '"', '<span class="bus-ico">' + ico('i-der') + '</span>', x[1], x[2])).join('') + '</div>';
  html += '<div class="bus-grupo"><small>Tus cosas' + (cosas.length ? ' · ' + cosas.length + (cosas.length === 40 ? '+' : '') : '') + '</small>' +
    (cosas.length ? cosas.map((x) => fila(enlace(x), '<span class="bus-ico area-' + area(x.area).id + '"><i class="punto"></i></span>', esc(x.titulo || TIPOS[x.tipo]),
      chipArea(x.area) + ' ' + esc(TIPOS[x.tipo] || x.tipo) + (x.fechas && x.fechas.inicio ? ' · ' + fmtCorta(x.fechas.inicio) : '') + (x.estado === 'hecho' ? ' · hecho' : ''))).join('')
      : '<p class="ayuda">Nada guardado con «' + esc(q) + '».</p>') + '</div>';
  return html;
}

export function abrirBuscar() {
  const hoja = abrirHoja('Buscar', '<div class="buscador"><label class="solo-lector" for="busQ">Qué buscas o qué quieres hacer</label>' + ico('i-buscar') +
    '<input id="busQ" class="entrada" type="search" autocomplete="off" enterkeyhint="search" placeholder="Busca o di qué quieres hacer…" autofocus></div><div id="busRes" aria-live="polite">' + resultadosHTML('') + '</div>');
  const inp = hoja.querySelector('#busQ'), res = hoja.querySelector('#busRes');
  let t = null;
  const pintar = () => { res.innerHTML = resultadosHTML(inp.value); clearTimeout(t); t = setTimeout(() => recordar(inp.value), 1500); };
  inp.addEventListener('input', pintar);
  hoja.addEventListener('click', (ev) => {
    const r = ev.target.closest('[data-busq]');
    if (r) { inp.value = r.dataset.busq; pintar(); inp.focus(); return; }
    const h = ev.target.closest('[data-bus-hacer]');
    if (h) { recordar(inp.value); cerrarHoja(true); abrirAgregar(h.dataset.busHacer); return; }
    if (ev.target.closest('.bus-fila')) recordar(inp.value);
  });
}
