/* ARRANQUE de la Agenda 5.
   La navegación usa la dirección (#hoy, #recordatorios, #areas/estudios…),
   así el botón «atrás» del celular funciona como se espera. */
import { $, ico, esc } from './util/dom.js';
import { hoy, fmtCorta, fmtFecha, horaAhora, fmtHora, relativo } from './util/fechas.js';
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
import { vistaRecordatorios, vistaListas, acciones as accRec, alEscribir as alEscribirRec, alEnviar as alEnviarRec } from './vistas/recordatorios.js';
import { acciones as accPend, iniciarDeslizar } from './piezas/pendientes-ui.js';
import { tic as ticPomo } from './piezas/pomodoro.js';
import { revisarAvisos } from './piezas/avisos.js';
import { marcar, delDia as pendientesDeHoy, crearDesdeTexto } from './datos/pendientes.js';
import { aPapelera } from './datos/datos.js';
import { editarEvento } from './piezas/eventos-ui.js';
import { vistaAgenda, vistaHorario, irADia, alElegirIcs, acciones as accAgenda } from './vistas/agenda.js';
import { vistaAreas, vistaArea, acciones as accAreas } from './vistas/areas.js';
import { vistaMas } from './vistas/mas.js';
import { vistaHabitos, acciones as accHabitos } from './vistas/habitos.js';
import { vistaSeguimiento, acciones as accSeg } from './vistas/seguimiento.js';
import { vistaFinanzas, acciones as accFin } from './vistas/finanzas.js';
import { vistaNotasSeccion, acciones as accNotas, alEscribirNotas, alCambiarNotas } from './vistas/notas.js';
import { acciones as accAdmin } from './vistas/admin.js';
import { iniciarNube, config as nubeConfig, estadoNube } from './datos/nube.js';
import { aplicarAreas } from './datos/areas.js';
import { iniciarTeclado } from './piezas/teclado.js';
import { abrirBuscar } from './piezas/buscar.js';
import { revisarNovedades } from './piezas/novedades.js';
import { acciones as accHoyExtra } from './vistas/hoy-extra.js';
import { documento } from './datos/datos.js';
import { vistaAjustes, acciones as accAjustes, alCambiarCampo, alElegirArchivo, despuesDePintar } from './vistas/ajustes.js';
import { vistaDatos, acciones as accDatos, alEscribir } from './vistas/datos.js';
import { vistaPapelera, acciones as accPapelera } from './vistas/papelera.js';
import { cargar, empezarVacio } from './datos/datos.js';
import { resumenAntiguo } from './datos/almacen.js';
import { mostrarMigracion } from './piezas/migracion-ui.js';

/* ---------- Secciones ----------
   Celular: Hoy · Recordatorios · Agenda · Cuentas · Más (barra flotante).
   Laptop: «archivador», pestañas de carpeta arriba con lo esencial, tus
   espacios (su emoji) y Más; tu perfil arriba a la derecha. */
/* Lo que más usas va primero: recordatorios, listas para marcar, agenda,
   horario y las cuentas (personal y oficina). */
const PRINCIPALES = [
  ['hoy', 'Hoy', 'i-hoy'],
  ['recordatorios', 'Recordatorios', 'i-tareas'],
  ['agenda', 'Agenda', 'i-cal'],
  ['finanzas', 'Cuentas', 'i-grafica'],
  ['mas', 'Más', 'i-mas']
];
const ESENCIAL = [['recordatorios', 'Recordatorios', 'i-tareas'], ['listas', 'Listas para marcar', 'i-listas'], ['agenda', 'Agenda', 'i-cal'], ['horario', 'Horario', 'i-reloj'], ['finanzas', 'Cuentas', 'i-grafica']];
const TITULOS = { datos: 'Tus datos', hoy: 'Hoy', recordatorios: 'Recordatorios', listas: 'Listas para marcar', agenda: 'Agenda', horario: 'Horario', areas: 'Espacios', mas: 'Más', ajustes: 'Ajustes', seguimiento: 'Seguimiento', finanzas: 'Cuentas', notas: 'Notas', papelera: 'Papelera', habitos: 'Hábitos' };
const SUBTITULOS = { recordatorios: 'Lo que tienes que hacer, por día', listas: 'Compras, maleta, mochila… marca lo que ya tienes', agenda: 'Tu tiempo: día, semana y mes', horario: 'Tu semana hora por hora: clases, trabajo y lo que se repite', finanzas: 'Personal y oficina, cada una por su lado', notas: 'Tus apuntes, cada uno en su espacio', habitos: 'Lo que haces seguido, espacio por espacio', seguimiento: 'Cómo vas en cada espacio', ajustes: 'Tu agenda, tu nube y tus datos', papelera: 'Lo que borraste, por 30 días', datos: 'Todo lo que tienes guardado', mas: 'Todo lo demás', areas: 'Tus cuatro espacios' };

function leerRuta() {
  const h = decodeURIComponent((location.hash || '').slice(1));
  const [sec0, param, sub] = h.split('/'), sec = sec0 === 'dinero' || sec0 === 'cuentas' ? 'finanzas' : sec0;
  if (sec === 'areas' && param && AREAS.some((a) => a.id === param)) return { sec, param, sub: sub || '' };
  if ((sec === 'seguimiento' && param === 'revision') || (sec === 'finanzas' && param === 'oficina') || (sec === 'notas' && param === 'diario')) return { sec, param };
  if (TITULOS[sec]) return { sec, param: '' };
  return null;
}
/* Atajos del ícono instalado de la v4.5 (mantener pulsado el ícono):
   #gasto, #ingreso, #anadir siguen funcionando en la versión nueva */
const ATAJO_V45 = { gasto: 'gasto', ingreso: 'ingreso', anadir: 'recordatorio', tarea: 'recordatorio' };
const atajoInicial = ATAJO_V45[(location.hash || '').slice(1)] || '';
if (atajoInicial) { try { history.replaceState(null, '', atajoInicial === 'ingreso' ? '#finanzas' : '#hoy'); } catch (e) { /* nada */ } }
let ruta = leerRuta() || { sec: preferencias().inicio, param: '' };
function padre(sec) { return sec === 'listas' ? 'recordatorios' : sec === 'horario' ? 'agenda' : ['notas', 'areas', 'seguimiento', 'habitos', 'ajustes', 'papelera', 'datos'].includes(sec) ? 'mas' : sec; }

/* ---------- Indicador de la nube (solo si la conectaste) ---------- */
function haceCuanto(t) {
  const m = Math.round((Date.now() - t) / 60000);
  return !t ? 'sin sincronizar' : m < 1 ? 'ahora mismo' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : 'hace ' + Math.round(m / 1440) + ' d';
}
function pintarNube() {
  const b = $('btnNube'); if (!b) return;
  const c = nubeConfig(), e = estadoNube();
  b.hidden = !c;
  if (!c) return;
  const est = e.ocupado ? 'ocupada' : e.ok ? 'ok' : 'error';
  b.className = 'chip-nube nube-' + est;
  $('nubeTxt').textContent = est === 'ocupada' ? 'sincronizando…' : est === 'ok' ? haceCuanto(e.fecha) : 'sin conexión';
  b.setAttribute('aria-label', 'Nube: ' + (est === 'ok' ? 'sincronizada ' + haceCuanto(e.fecha) : est === 'ocupada' ? 'sincronizando' : 'con problema') + '. Abrir ajustes de la nube');
}
window.addEventListener('agenda:nube', pintarNube);

/* ---------- Pintar ---------- */
function cuentaHtml(n, alerta) { return n ? '<span class="cuenta' + (alerta ? ' alerta' : '') + '">' + n + '</span>' : ''; }
function pintarNav() {
  const p = padre(ruta.sec), h = hoy();
  $('barra').innerHTML = PRINCIPALES.map((x) =>
    '<a href="#' + x[0] + '" data-ir="' + x[0] + '"' + (p === x[0] ? ' aria-current="page"' : '') + '>' + ico(x[2]) + '<span>' + x[1] + '</span></a>').join('');
  const pend = documento() ? pendientesDeHoy() : [];
  const porArea = (a) => pend.filter((x) => x.area === a).length;
  const atras = pend.filter((x) => x.fechas.inicio < h).length;
  const d = documento(), nombre = d && d.perfil && d.perfil.nombre ? String(d.perfil.nombre).trim() : '';
  const actual = (sec, param) => (ruta.sec === sec && (param === undefined || ruta.param === param) ? ' aria-current="page"' : '');
  /* Laptop: «archivador», pestañas de carpeta arriba (nada de barra lateral) */
  const pest = (href, ir, txt, icono, extra, clase) => '<a href="#' + href + '" class="pest' + (clase ? ' ' + clase : '') + '"' + (ir ? ' data-ir="' + ir + '"' : '') + extra + '>' + icono + '<span>' + txt + '</span>';
  $('lateral').innerHTML =
    '<a class="marca" href="#hoy"><i class="logo" aria-hidden="true"></i><div><b>Agenda</b><small>' + (nombre ? 'de ' + esc(nombre.split(/\s+/)[0]) : 'Mi organización') + '</small></div></a>' +
    '<nav class="archivador" aria-label="Secciones">' +
    pest('hoy', 'hoy', 'Hoy', ico('i-hoy'), actual('hoy')) + '</a>' +
    ESENCIAL.map((x) => pest(x[0], x[0], x[0] === 'listas' ? 'Listas' : x[1], ico(x[2]), actual(x[0])) +
      (x[0] === 'recordatorios' ? cuentaHtml(pend.length, atras > 0) : '') + '</a>').join('') +
    /* Tus espacios: solo con «Mostrar todo»; solo su emoji (el nombre se ve en el que está abierto) */
    (preferencias().completo ? '<span class="pest-sep" aria-hidden="true"></span>' + AREAS.map((a) => pest('areas/' + a.id, '', esc(a.nombre), '<i class="pest-emoji" aria-hidden="true">' + esc(a.emoji || '') + '</i>', actual('areas', a.id) + ' title="' + esc(a.nombre) + '" aria-label="' + esc(a.nombre) + (porArea(a.id) ? ', ' + porArea(a.id) + ' para hoy' : '') + '"', 'pest-esp area-' + a.id) + '</a>').join('') : '') +
    '<span class="pest-sep" aria-hidden="true"></span>' +
    pest('mas', 'mas', 'Más', ico('i-mas'), padre(ruta.sec) === 'mas' && !(ruta.sec === 'areas' && ruta.param) ? ' aria-current="page"' : '', 'pest-chica') + '</a>' +
    '</nav>' +
    '<a class="perfil" href="#ajustes"' + actual('ajustes') + ' aria-label="Ajustes y respaldo" title="Ajustes y respaldo"><span class="avatar" aria-hidden="true">' + (nombre ? esc(nombre.charAt(0).toUpperCase()) : '✦') + '</span></a>';
}

function pintarCab() {
  $('cabTitulo').textContent = ruta.sec === 'areas' && ruta.param ? area(ruta.param).nombre : TITULOS[ruta.sec];
  $('cabFecha').textContent = fmtCorta(hoy(), false) + ' · ' + fmtFecha(hoy());
  $('relojTxt').textContent = fmtHora(horaAhora(), preferencias().formatoHora);
  pintarNube();
}

/* Título grande de cada sección (Hoy y los espacios traen su propia portada) */
function cabeceraSeccion() {
  if (ruta.sec === 'hoy' || (ruta.sec === 'areas' && ruta.param)) return '';
  const V = { listas: ['#recordatorios', 'Recordatorios'], horario: ['#agenda', 'Agenda'] }[ruta.sec];
  const volver = V ? '<a class="volver-panel" href="' + V[0] + '">' + ico('i-izq') + V[1] + '</a>' : padre(ruta.sec) === 'mas' && ruta.sec !== 'mas' ? '<a class="volver-panel" href="#mas">' + ico('i-izq') + 'Más</a>' : '';
  return volver + '<header class="pag-cab"><h1>' + TITULOS[ruta.sec] + '</h1>' + (SUBTITULOS[ruta.sec] ? '<p>' + SUBTITULOS[ruta.sec] + '</p>' : '') + '</header>';
}

function contenido() {
  switch (ruta.sec) {
    case 'hoy': return vistaHoy();
    case 'recordatorios': return vistaRecordatorios();
    case 'agenda': return vistaAgenda();
    case 'areas': return ruta.param ? vistaArea(ruta.param, ruta.sub) : vistaAreas();
    case 'mas': return vistaMas();
    case 'habitos': return vistaHabitos();
    case 'listas': return vistaListas();
    case 'horario': return vistaHorario();
    case 'ajustes': return vistaAjustes();
    case 'datos': return vistaDatos();
    case 'papelera': return vistaPapelera();
    case 'seguimiento': return vistaSeguimiento(ruta.param);
    case 'finanzas': return vistaFinanzas(ruta.param);
    case 'notas': return vistaNotasSeccion(ruta.param);
    default: return vistaMas();
  }
}

/* Número en el ícono de la app instalada: lo que te queda para hoy (y lo atrasado) */
let insignia = -1;
function pintarInsignia() {
  if (!('setAppBadge' in navigator) || !documento()) return;
  const n = pendientesDeHoy().length;
  if (n === insignia) return;
  insignia = n;
  (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => { /* no disponible */ });
}

let ultimaPantalla = '';
export function pintar() {
  try {
    const d = documento(); aplicarAreas(d && d.perfil && d.perfil.areas);
    pintarNube();
    pintarNav(); pintarCab();
    document.title = ruta.sec === 'hoy' ? 'Agenda' : $('cabTitulo').textContent + ' · Agenda';
    document.body.dataset.seccion = ruta.sec;
    const pan = $('pantalla'), clave = ruta.sec + '/' + (ruta.param || '') + '/' + (ruta.sub || '');
    pan.innerHTML = cabeceraSeccion() + contenido();
    /* Al cambiar de pantalla, una entrada suave (solo entonces, no en cada repintado) */
    if (clave !== ultimaPantalla) { ultimaPantalla = clave; pan.classList.remove('entra'); void pan.offsetWidth; pan.classList.add('entra'); }
    if (ruta.sec === 'ajustes') despuesDePintar();
    pintarInsignia();
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
const ACCIONES = Object.assign({}, accPend, accHoy, accHoyExtra, accRec, accAgenda, accAjustes, accDatos, accPapelera, accAreas, accSeg, accFin, accNotas, accAdmin, accHabitos, {
  agregar() { abrirAgregar(); },
  buscar() { abrirBuscar(); },
  'ev-editar'(b) { editarEvento(b.dataset.id, pintar); },
  reintentar() { return true; },
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
  else if (f.classList.contains('pn-form')) { ev.preventDefault(); f.querySelector('[data-acc]').click(); }
  else if (f.classList.contains('hoy-rapida')) {
    /* Anotar desde Hoy: se entiende la fecha y la hora como en Recordatorios (sin fecha = hoy) */
    ev.preventDefault();
    const i = f.querySelector('input'), t = i.value.trim(); if (!t) { i.focus(); return; }
    const c = crearDesdeTexto(t); pintar();
    const n = document.getElementById('hoyRapida'); if (n) n.focus();
    const f0 = c[0] && c[0].fechas.inicio;
    aviso('Agregado: ' + c.map((x) => x.titulo).join(', ') + (f0 && f0 !== hoy() ? ' · ' + relativo(f0).toLowerCase() : !f0 ? ' · algún día' : ''), () => { c.forEach((x) => aPapelera(x.id)); pintar(); });
  }
});
document.addEventListener('change', (ev) => { if (alElegirArchivo(ev.target) || alElegirIcs(ev.target) || alCambiarNotas(ev.target)) return; if (alCambiarPrioridad(ev.target) || alCambiarCampo(ev.target)) pintar(); });
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
  else if (ev.key === '/') { ev.preventDefault(); abrirBuscar(); }
});

/* ---------- Arranque ---------- */
window.addEventListener('error', (ev) => anotarError(ev.error || ev.message, 'global'));
window.addEventListener('unhandledrejection', (ev) => anotarError(ev.reason, 'promesa'));
cuandoFalleGuardar(() => aviso('No se pudo guardar: el almacenamiento del navegador está lleno o bloqueado.'));

aplicarTema();
aplicarGuia();
alCambiarPref(() => { aplicarGuia(); });
$('btnAtras').addEventListener('click', () => history.back());
$('btnAdelante').addEventListener('click', () => history.forward());
$('btnTema').addEventListener('click', () => {
  const ahora = document.documentElement.getAttribute('data-tema');
  import('./datos/preferencias.js').then((m) => { m.cambiarPref({ tema: ahora === 'claro' ? 'oscuro' : 'claro' }); if (ruta.sec === 'ajustes') pintar(); });
});
$('fab').addEventListener('click', () => abrirAgregar());
$('btnBuscar').addEventListener('click', () => abrirBuscar());

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
    despuesDeAbrir(() => mostrarMigracion().then((ok) => { migrando = false; if (ok) { const sec = preferencias().completo ? 'datos' : 'hoy'; ruta = { sec, param: '' }; try { history.replaceState(null, '', '#' + sec); } catch (e) { /* nada */ } } pintar(); arrancarRecorrido(); }));
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
/* Al actualizar desde otra 5.x: novedades una vez (no tapa el recorrido, la migración ni un atajo) */
despuesDeAbrir(() => revisarNovedades(migrando || !preferencias().tourVisto || !!atajoInicial));
/* El atajo del ícono, una vez abierta la app (después del PIN) */
if (atajoInicial) despuesDeAbrir(() => setTimeout(() => {
  if (migrando) return;
  if (atajoInicial === 'ingreso') { const b = document.querySelector('[data-acc="fin-nuevo"][data-ing="1"]'); if (b) b.click(); }
  else abrirAgregar(atajoInicial);
}, 300));
/* La nube: solo si tú la conectaste en Ajustes (nunca sola) */
despuesDeAbrir(() => iniciarNube());
/* El teclado propio (solo en pantallas táctiles) */
iniciarTeclado();
$('btnNube').addEventListener('click', () => { ir('ajustes'); setTimeout(() => { const n = document.getElementById('nube'); if (n) n.scrollIntoView({ block: 'start' }); }, 60); });

/* Para instalarla y abrirla sin internet. Solo en https o en el servidor local. */
const hospedado = location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname);
if (hospedado && 'serviceWorker' in navigator) {
  /* Si se subió solo el index.html (sin sw.js), no se intenta: la app funciona igual */
  fetch('sw.js', { method: 'HEAD', cache: 'no-store' }).then((r) => r.ok, () => true)
    .then((hay) => { if (hay) navigator.serviceWorker.register('sw.js').catch((e) => anotarError(e, 'sw')); });
  navigator.serviceWorker.addEventListener('message', (ev) => {
    if (ev.data && ev.data.nuevaVersion) aviso('Hay una versión nueva de la Agenda.', () => location.reload(), 'Actualizar');
  });
}
