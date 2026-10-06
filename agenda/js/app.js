/* ARRANQUE de la Agenda 5.
   La navegación usa la dirección (#hoy, #recordatorios, #areas/estudios…),
   así el botón «atrás» del celular funciona como se espera. */
import { $, ico } from './util/dom.js';
import { hoy, fmtCorta, fmtFecha, horaAhora, fmtHora } from './util/fechas.js';
import { preferencias, alCambiarPref } from './datos/preferencias.js';
import { anotarError, cuandoFalleGuardar } from './datos/almacen.js';
import { AREAS, area } from './datos/areas.js';
import { aplicarTema } from './piezas/tema.js';
import { iniciarCandado, despuesDeAbrir } from './piezas/candado.js';
import { aviso } from './piezas/aviso.js';
import { cerrarHoja, atrasEsDeHoja } from './piezas/hoja.js';
import { aplicarGuia, alternarGuia, iniciarRecorrido } from './piezas/guia.js';
import { abrirAgregar, cuandoSeGuarde } from './piezas/agregar-rapido.js';
import { vistaHoy, acciones as accHoy, alCambiarPrioridad, actualizarPomo } from './vistas/hoy.js';
import { vistaRecordatorios, acciones as accRec, alEscribir as alEscribirRec, alEnviar as alEnviarRec } from './vistas/recordatorios.js';
import { acciones as accPend, iniciarDeslizar } from './piezas/pendientes-ui.js';
import { tic as ticPomo } from './piezas/pomodoro.js';
import { revisarAvisos } from './piezas/avisos.js';
import { marcar } from './datos/pendientes.js';
import { editarEvento } from './piezas/eventos-ui.js';
import { vistaAgenda, irADia, acciones as accAgenda } from './vistas/agenda.js';
import { vistaAreas, vistaArea, acciones as accAreas } from './vistas/areas.js';
import { vistaMas, vistaSeccion } from './vistas/mas.js';
import { vistaSeguimiento, acciones as accSeg } from './vistas/seguimiento.js';
import { vistaFinanzas, acciones as accFin } from './vistas/finanzas.js';
import { vistaNotasSeccion, acciones as accNotas, alEscribirNotas, alCambiarNotas } from './vistas/notas.js';
import { vistaAjustes, acciones as accAjustes, alCambiarCampo, alElegirArchivo, despuesDePintar } from './vistas/ajustes.js';
import { vistaDatos, acciones as accDatos, alEscribir } from './vistas/datos.js';
import { vistaPapelera, acciones as accPapelera } from './vistas/papelera.js';
import { cargar, empezarVacio } from './datos/datos.js';
import { resumenAntiguo } from './datos/almacen.js';
import { mostrarMigracion } from './piezas/migracion-ui.js';

/* ---------- Secciones ---------- */
const PRINCIPALES = [
  ['hoy', 'Hoy', 'i-hoy'],
  ['recordatorios', 'Recordatorios', 'i-rec', 'Record.'],
  ['agenda', 'Agenda', 'i-agenda'],
  ['areas', 'Áreas', 'i-areas'],
  ['mas', 'Más', 'i-mas']
];
const EN_MAS = [['seguimiento', 'Seguimiento', 'i-seg'], ['finanzas', 'Finanzas', 'i-dinero'], ['notas', 'Notas', 'i-nota'], ['ajustes', 'Ajustes', 'i-ajustes']];
const TITULOS = { datos: 'Tus datos', hoy: 'Hoy', recordatorios: 'Recordatorios', agenda: 'Agenda', areas: 'Áreas', mas: 'Más', ajustes: 'Ajustes', seguimiento: 'Seguimiento', finanzas: 'Finanzas', notas: 'Notas', papelera: 'Papelera' };

function leerRuta() {
  const h = decodeURIComponent((location.hash || '').slice(1));
  const [sec, param, sub] = h.split('/');
  if (sec === 'areas' && param && AREAS.some((a) => a.id === param)) return { sec, param, sub: sub || '' };
  if ((sec === 'seguimiento' && param === 'revision') || (sec === 'finanzas' && param === 'oficina') || (sec === 'notas' && param === 'diario')) return { sec, param };
  if (TITULOS[sec]) return { sec, param: '' };
  return null;
}
let ruta = leerRuta() || { sec: preferencias().inicio, param: '' };
function padre(sec) { return ['seguimiento', 'finanzas', 'notas', 'ajustes', 'papelera', 'datos'].includes(sec) ? 'mas' : sec; }

/* ---------- Pintar ---------- */
function pintarNav() {
  const p = padre(ruta.sec);
  $('barra').innerHTML = PRINCIPALES.map((x) =>
    '<a href="#' + x[0] + '" data-ir="' + x[0] + '"' + (p === x[0] ? ' aria-current="page"' : '') + '>' + ico(x[2]) + '<span>' + (x[3] || x[1]) + '</span></a>').join('');
  $('lateral').innerHTML =
    '<div class="marca"><i class="logo" aria-hidden="true"></i><div><b>Agenda</b><small>Lima · ' + fmtCorta(hoy(), false) + '</small></div></div>' +
    PRINCIPALES.slice(0, 4).map((x) => '<a href="#' + x[0] + '" data-ir="' + x[0] + '"' + (p === x[0] && !ruta.param ? ' aria-current="page"' : '') + '>' + ico(x[2]) + x[1] + '</a>').join('') +
    '<div class="sep">Áreas</div>' + AREAS.map((a) => '<a href="#areas/' + a.id + '" class="area-nav area-' + a.id + '"' + (ruta.sec === 'areas' && ruta.param === a.id ? ' aria-current="page"' : '') + '><i aria-hidden="true"></i>' + a.nombre + '</a>').join('') +
    '<div class="sep">Más</div>' + EN_MAS.map((x) => '<a href="#' + x[0] + '"' + (ruta.sec === x[0] ? ' aria-current="page"' : '') + '>' + ico(x[2]) + x[1] + '</a>').join('') +
    '<button type="button" class="btn pri agregar" data-acc="agregar">' + ico('i-plus') + 'Agregar</button>';
}

function pintarCab() {
  $('cabTitulo').textContent = ruta.sec === 'areas' && ruta.param ? area(ruta.param).nombre : TITULOS[ruta.sec];
  $('cabFecha').textContent = fmtCorta(hoy(), false) + ' · ' + fmtFecha(hoy());
  $('relojTxt').textContent = fmtHora(horaAhora(), preferencias().formatoHora);
}

function contenido() {
  switch (ruta.sec) {
    case 'hoy': return vistaHoy();
    case 'recordatorios': return vistaRecordatorios();
    case 'agenda': return vistaAgenda();
    case 'areas': return ruta.param ? vistaArea(ruta.param, ruta.sub) : vistaAreas();
    case 'mas': return vistaMas();
    case 'ajustes': return vistaAjustes();
    case 'datos': return vistaDatos();
    case 'papelera': return vistaPapelera();
    case 'seguimiento': return vistaSeguimiento(ruta.param);
    case 'finanzas': return vistaFinanzas(ruta.param);
    case 'notas': return vistaNotasSeccion(ruta.param);
    default: return vistaSeccion(ruta.sec);
  }
}

export function pintar() {
  try {
    pintarNav(); pintarCab();
    document.title = ruta.sec === 'hoy' ? 'Agenda' : $('cabTitulo').textContent + ' · Agenda';
    document.body.dataset.seccion = ruta.sec;
    $('pantalla').innerHTML = contenido();
    if (ruta.sec === 'ajustes') despuesDePintar();
  } catch (e) {
    anotarError(e, 'pintar ' + ruta.sec);
    $('pantalla').innerHTML = '<section class="tarjeta"><div class="vacio"><b>Algo falló al mostrar esta sección</b><span>Tus datos están bien. Prueba otra vez o vuelve a Hoy.</span>' +
      '<div class="fila-botones"><button type="button" class="btn" data-acc="reintentar">Reintentar</button><a class="btn pri" href="#hoy">Ir a Hoy</a></div></div></section>';
  }
}

function ir(sec, param = '') {
  ruta = { sec, param };
  const h = '#' + sec + (param ? '/' + param : '');
  if (location.hash !== h) { try { history.pushState(null, '', h); } catch (e) { location.hash = h; } }
  cerrarHoja(true);
  pintar();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', () => {
  if (atrasEsDeHoja()) return;
  const r = leerRuta();
  ruta = r || { sec: 'hoy', param: '' };
  pintar();
});
window.addEventListener('hashchange', () => {
  const r = leerRuta();
  if (r && (r.sec !== ruta.sec || r.param !== ruta.param || (r.sub || '') !== (ruta.sub || ''))) {
    const mismaArea = r.sec === 'areas' && r.sec === ruta.sec && r.param === ruta.param;
    ruta = r; cerrarHoja(true); pintar();
    if (!mismaArea) window.scrollTo(0, 0);
  }
});

/* ---------- Acciones (un solo lugar que escucha los toques) ---------- */
const ACCIONES = Object.assign({}, accPend, accHoy, accRec, accAgenda, accAjustes, accDatos, accPapelera, accAreas, accSeg, accFin, accNotas, {
  agregar() { abrirAgregar(); },
  'ev-editar'(b) { editarEvento(b.dataset.id, pintar); },
  reintentar() { return true; },
  fase(b) { aviso('Esto llega en la Fase ' + b.dataset.n + '.'); },
  'ir-dia'(b) { irADia(b.dataset.dia); ir('agenda'); }
});

document.addEventListener('click', (ev) => {
  const b = ev.target.closest && ev.target.closest('[data-acc]');
  if (!b || b.tagName === 'FORM') return;
  const f = ACCIONES[b.dataset.acc];
  if (!f) return;
  try { const r = f(b, ev, pintar); if (r === true) pintar(); else if (r && r.catch) r.catch((e) => { anotarError(e, 'acción ' + b.dataset.acc); aviso('Algo falló. Quedó anotado en Ajustes.'); }); }
  catch (e) { anotarError(e, 'acción ' + b.dataset.acc); aviso('Algo falló. Quedó anotado en Ajustes.'); }
});
document.addEventListener('submit', (ev) => {
  const f = ev.target;
  if (f.dataset.form) { ev.preventDefault(); alEnviarRec(f, pintar); }
});
document.addEventListener('change', (ev) => { if (alElegirArchivo(ev.target) || alCambiarNotas(ev.target)) return; if (alCambiarPrioridad(ev.target) || alCambiarCampo(ev.target)) pintar(); });
document.addEventListener('input', (ev) => { if (!alEscribirRec(ev.target) && !alEscribirNotas(ev.target, pintar)) alEscribir(ev.target, pintar); });
/* En «Nuevo recordatorio», Enter guarda (Shift+Enter, otra línea) */
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && !ev.shiftKey && ev.target.id === 'nuevoRec') { ev.preventDefault(); ev.target.form.requestSubmit(); }
  if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.prio != null) { ev.preventDefault(); ev.target.blur(); }
});
window.addEventListener('agenda:repintar', () => pintar());
document.addEventListener('keydown', (ev) => {
  const enCampo = /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName || '') || ev.target.isContentEditable;
  if (enCampo || document.getElementById('capaMigracion') || ev.ctrlKey || ev.metaKey || ev.altKey || document.body.classList.contains('con-candado') || document.body.classList.contains('con-hoja') || document.body.classList.contains('en-tour')) return;
  if (ev.key === 'n' || ev.key === '+') { ev.preventDefault(); abrirAgregar(); }
  else if (/^[1-5]$/.test(ev.key)) ir(PRINCIPALES[+ev.key - 1][0]);
  else if (ev.key === '?') alternarGuia();
});

/* ---------- Arranque ---------- */
window.addEventListener('error', (ev) => anotarError(ev.error || ev.message, 'global'));
window.addEventListener('unhandledrejection', (ev) => anotarError(ev.reason, 'promesa'));
cuandoFalleGuardar(() => aviso('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado.'));

aplicarTema();
aplicarGuia();
alCambiarPref(() => { aplicarGuia(); });
$('btnGuia').addEventListener('click', alternarGuia);
$('btnTema').addEventListener('click', () => {
  const ahora = document.documentElement.getAttribute('data-tema');
  import('./datos/preferencias.js').then((m) => { m.cambiarPref({ tema: ahora === 'claro' ? 'oscuro' : 'claro' }); if (ruta.sec === 'ajustes') pintar(); });
});
$('fab').addEventListener('click', () => abrirAgregar());

if (!location.hash) { try { history.replaceState(null, '', '#' + ruta.sec); } catch (e) { /* nada */ } }
/* Tus datos: si ya existen los de la v5 se cargan; si no, y hay de la v4.5,
   se migran (después del PIN, para que nadie vea nada sin escribirlo). */
const yaHabia = cargar();
pintar();
iniciarCandado();
let migrando = false;
if (!yaHabia) {
  if (resumenAntiguo().hay) {
    migrando = true;
    despuesDeAbrir(() => mostrarMigracion().then((ok) => { migrando = false; if (ok) { ruta = { sec: 'datos', param: '' }; try { history.replaceState(null, '', '#datos'); } catch (e) { /* nada */ } } pintar(); arrancarRecorrido(); }));
  } else { empezarVacio(); pintar(); }
}
document.getElementById('portada')?.remove();
setInterval(() => { pintarCab(); }, 15000);
/* Cada segundo: el reloj del Pomodoro (sin repintar) */
setInterval(() => { if (ticPomo()) pintar(); else actualizarPomo(); }, 1000);
/* Cada 30 s: ¿toca algún recordatorio? (Hecho desde el aviso lo marca) */
const alPulsarAviso = (x) => { marcar(x.id); pintar(); };
setInterval(() => { if (revisarAvisos(alPulsarAviso).length) pintar(); }, 30000);
despuesDeAbrir(() => { if (revisarAvisos(alPulsarAviso).length) pintar(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (revisarAvisos(alPulsarAviso).length || ticPomo()) pintar(); } });
iniciarDeslizar(pintar);
cuandoSeGuarde(() => pintar());

/* A medianoche (hora de Lima) cambia el día: todo se repinta */
let dia = hoy();
setInterval(() => { if (hoy() !== dia) { dia = hoy(); pintar(); } }, 60000);

/* Primera vez: el recorrido de bienvenida */
function arrancarRecorrido() { if (!preferencias().tourVisto) setTimeout(iniciarRecorrido, 400); }
despuesDeAbrir(() => { if (!migrando) arrancarRecorrido(); });

/* Para instalarla y abrirla sin internet. Solo en https o en el servidor local. */
const hospedado = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
if (hospedado && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch((e) => anotarError(e, 'sw'));
  navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data && ev.data.nuevaVersion) aviso('Hay una versión nueva de la Agenda.', () => location.reload(), 'Actualizar');
  });
}
