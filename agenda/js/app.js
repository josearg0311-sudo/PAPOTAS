/* ARRANQUE de la Agenda 5.
   La navegación usa la dirección (#hoy, #calendario, #tareas/compras, #cuentas/cobros…),
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
import { cuandoSeGuarde } from './piezas/agregar-rapido.js';
import { abrirCaptura } from './piezas/captura.js';
import { abrirMonto } from './piezas/teclado-monto.js';
import { vistaHoy, acciones as accHoy, alCambiarPrioridad, actualizarPomo } from './vistas/hoy.js';
import { vistaListas6, acciones as accRec, alEscribir as alEscribirRec, alEnviar as alEnviarRec } from './vistas/recordatorios.js';
import { acciones as accPend, iniciarDeslizar } from './piezas/pendientes-ui.js';
import { tic as ticPomo, corriendo as pomoCorre, restante as pomoResta, mmss } from './piezas/pomodoro.js';
import { revisarAvisos } from './piezas/avisos.js';
import { marcar, delDia as pendientesDeHoy, crearDesdeTexto } from './datos/pendientes.js';
import { aPapelera } from './datos/datos.js';
import { editarEvento } from './piezas/eventos-ui.js';
import { vistaPlan, irADia, alElegirIcs, acciones as accAgenda } from './vistas/agenda.js';
import { acciones as accAreas } from './vistas/areas.js';
import { SECCIONES, herramienta, rutaNueva, barraFiltro, barraHerramientas, vistaHerramienta, vistaTu, ponerFiltro } from './vistas/secciones.js';
import { acciones as accHabitos } from './vistas/habitos.js';
import { acciones as accSeg } from './vistas/seguimiento.js';
import { vistaPlata, acciones as accFin } from './vistas/finanzas.js';
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

/* ---------- Secciones (Agenda 7) ----------
   Ordenado por lo que haces: Hoy · Calendario · [Agregar] · Tareas · Cuentas
   abajo (celular), y Notas, Buscar y Tú arriba. Personal, Estudios, Oficina y
   Deporte son un filtro dentro de cada sección (vistas/secciones.js); sus
   herramientas viven en la sección que les toca. Ya no hay «Más» ni «Mostrar todo». */
const PRINCIPALES = [['hoy', 'Hoy', 'i-hoy'], ['calendario', 'Calendario', 'i-cal'], ['tareas', 'Tareas', 'i-listas'], ['cuentas', 'Cuentas', 'i-dinero']];
const TITULOS = { hoy: 'Hoy', calendario: 'Calendario', tareas: 'Tareas', cuentas: 'Cuentas', notas: 'Notas', tu: 'Tú', ajustes: 'Ajustes', papelera: 'Papelera', datos: 'Tus datos' };
const SUBTITULOS = { ajustes: 'Tu agenda, tu nube y tus datos', papelera: 'Lo que borraste, por 30 días', datos: 'Todo lo que tienes guardado' };
Object.keys(SECCIONES).forEach((k) => { SUBTITULOS[k] = SECCIONES[k].sub; });
/* Secciones con filtro por espacio arriba */
const CON_FILTRO = ['calendario', 'tareas', 'cuentas', 'notas'];

function leerRuta() {
  let h = decodeURIComponent((location.hash || '').slice(1));
  /* Las direcciones viejas (#plan, #listas, #plata, #areas/oficina/cobros…) se traducen */
  const nueva = rutaNueva(h);
  if (nueva != null && nueva !== h) { h = nueva; try { history.replaceState(null, '', '#' + h); } catch (e) { /* nada */ } }
  const [sec, param = '', sub = ''] = h.split('/');
  if (!TITULOS[sec]) return null;
  const herr = herramienta(sec, param) ? param : '';
  return { sec, param, sub, herr };
}
/* Atajos del ícono instalado de la v4.5 (mantener pulsado el ícono):
   #gasto, #ingreso, #anadir siguen funcionando en la versión nueva */
const ATAJO_V45 = { gasto: 'gasto', ingreso: 'ingreso', anadir: 'recordatorio', tarea: 'recordatorio' };
const atajoInicial = ATAJO_V45[(location.hash || '').slice(1)] || '';
if (atajoInicial) { try { history.replaceState(null, '', atajoInicial === 'ingreso' || atajoInicial === 'gasto' ? '#cuentas' : '#hoy'); } catch (e) { /* nada */ } }
function rutaInicial() { const n = rutaNueva(preferencias().inicio || 'hoy'); const sec = (n || preferencias().inicio || 'hoy').split('/')[0]; return { sec: TITULOS[sec] ? sec : 'hoy', param: '', sub: '', herr: '' }; }
let ruta = leerRuta() || rutaInicial();
function padre(sec) { return ['ajustes', 'papelera', 'datos'].includes(sec) ? 'tu' : sec; }

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
  const ln = document.getElementById('latNube');
  if (ln) { ln.hidden = false; ln.className = 'lat-nube nube-' + est; ln.querySelector('span').textContent = $('nubeTxt').textContent; ln.setAttribute('aria-label', b.getAttribute('aria-label') || 'Nube'); }
  b.setAttribute('aria-label', 'Nube: ' + (est === 'ok' ? 'sincronizada ' + haceCuanto(e.fecha) : est === 'ocupada' ? 'sincronizando' : 'con problema') + '. Abrir ajustes de la nube');
}
window.addEventListener('agenda:nube', pintarNube);

/* ---------- Pintar ---------- */
function cuentaHtml(n, alerta) { return n ? '<span class="cuenta' + (alerta ? ' alerta' : '') + '">' + n + '</span>' : ''; }
function pintarNav() {
  const p = padre(ruta.sec), h = hoy();
  const enlace = (x) => '<a href="#' + x[0] + '" data-ir="' + x[0] + '"' + (p === x[0] ? ' aria-current="page"' : '') + '>' + ico(x[2]) + '<span>' + x[1] + '</span></a>';
  $('barra').innerHTML = PRINCIPALES.slice(0, 2).map(enlace).join('') +
    '<button type="button" class="barra-mas" data-acc="captura"><span class="bm-circ" aria-hidden="true">' + ico('i-plus') + '</span><span>Agregar</span></button>' + PRINCIPALES.slice(2).map(enlace).join('');
  const pend = documento() ? pendientesDeHoy() : [];
  const atras = pend.filter((x) => x.fechas.inicio < h).length;
  const d = documento(), nombre = d && d.perfil && d.perfil.nombre ? String(d.perfil.nombre).trim() : '';
  const actual = (sec, param) => (ruta.sec === sec && (param === undefined || ruta.param === param) ? ' aria-current="page"' : '');
  const pest = (x, extra) => '<a href="#' + x[0] + '" class="pest" data-ir="' + x[0] + '"' + (p === x[0] ? ' aria-current="page"' : '') + '>' + ico(x[2]) + '<span>' + x[1] + '</span>' + (extra || '') + '</a>';
  $('lateral').innerHTML =
    '<a class="marca" href="#hoy"><i class="logo" aria-hidden="true"></i><div><b>Agenda</b>' + (nombre ? '<small>de ' + esc(nombre.split(/\s+/)[0]) + '</small>' : '') + '</div></a>' +
    '<nav class="archivador" aria-label="Secciones">' + PRINCIPALES.concat([['notas', 'Notas', 'i-notas']]).map((x) => pest(x, x[0] === 'tareas' && atras ? cuentaHtml(atras, true) : '')).join('') + '</nav>' +
    '<button type="button" class="cap-barra" data-acc="captura">' + ico('i-plus') + '<span><b>Agregar</b> · escribe «almuerzo 25», «llamar a Ana mañana 10am»…</span><kbd>N</kbd></button>' +
    /* A la derecha, en la misma fila (nada se encima): foco en marcha, nube, buscar y tú */
    '<div class="lat-der"><a class="lat-pomo" id="latPomo" href="#hoy"' + (pomoCorre() ? '' : ' hidden') + ' aria-label="Foco en marcha"><i aria-hidden="true"></i><span>' + mmss(pomoResta()) + '</span></a>' +
    '<button type="button" class="lat-nube" id="latNube" hidden data-acc="nube-ir"><i aria-hidden="true"></i><span></span></button>' +
    '<button type="button" class="btn lat-buscar" data-acc="buscar" title="Buscar (tecla /)">' + ico('i-buscar') + 'Buscar</button>' +
    '<a class="perfil" href="#tu"' + (p === 'tu' ? ' aria-current="page"' : '') + ' aria-label="Tú: hábitos, progreso y ajustes" title="Tú: hábitos, progreso y ajustes"><span class="avatar" aria-hidden="true">' + (nombre ? esc(nombre.charAt(0).toUpperCase()) : ico('i-estrella')) + '</span></a></div>';
  /* Celular, arriba: Notas y Tú (marcados si estás ahí) */
  const cn = document.getElementById('btnNotas'), ct = document.getElementById('btnTu');
  if (cn) cn.toggleAttribute('aria-current', p === 'notas');
  if (ct) { ct.toggleAttribute('aria-current', p === 'tu'); ct.querySelector('.avatar').innerHTML = nombre ? esc(nombre.charAt(0).toUpperCase()) : ico('i-estrella'); }
}

function pintarCab() {
  const hh = ruta.herr && herramienta(ruta.sec, ruta.herr);
  $('cabTitulo').textContent = hh ? hh.nombre : TITULOS[ruta.sec];
  $('cabFecha').textContent = fmtCorta(hoy(), false) + ' · ' + fmtFecha(hoy());
  $('relojTxt').textContent = fmtHora(horaAhora(), preferencias().formatoHora);
  pintarNube();
}

/* Título grande de cada sección + el filtro por espacio y sus herramientas
   (Hoy trae su propia portada; una herramienta o una lista, su propia cabecera) */
function cabeceraSeccion() {
  if (ruta.sec === 'hoy' || ruta.herr || (ruta.sec === 'tareas' && ruta.param)) return '';
  const volver = padre(ruta.sec) === 'tu' && ruta.sec !== 'tu' ? '<a class="volver-panel" href="#tu">' + ico('i-izq') + 'Tú</a>' : '';
  return volver + '<header class="pag-cab"><h1>' + TITULOS[ruta.sec] + '</h1>' + (SUBTITULOS[ruta.sec] ? '<p>' + SUBTITULOS[ruta.sec] + '</p>' : '') + '</header>' +
    (CON_FILTRO.includes(ruta.sec) ? barraFiltro(ruta.sec) : '');
}

function contenido() {
  if (ruta.herr) return vistaHerramienta(ruta.sec, ruta.herr, ruta.sub);
  switch (ruta.sec) {
    case 'hoy': return vistaHoy();
    case 'calendario': return vistaPlan();
    case 'tareas': return vistaListas6(ruta.param);
    case 'cuentas': return vistaPlata(ruta.param);
    case 'notas': return vistaNotasSeccion('');
    case 'tu': return vistaTu();
    case 'ajustes': return vistaAjustes();
    case 'datos': return vistaDatos();
    case 'papelera': return vistaPapelera();
    default: return vistaHoy();
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
    pan.innerHTML = cabeceraSeccion() + contenido() + (CON_FILTRO.includes(ruta.sec) && !ruta.herr && !(ruta.sec === 'tareas' && ruta.param) ? barraHerramientas(ruta.sec) : '');
    /* Al cambiar de pantalla, una entrada suave (solo entonces, no en cada repintado) */
    if (clave !== ultimaPantalla) {
      ultimaPantalla = clave; pan.classList.remove('entra'); void pan.offsetWidth; pan.classList.add('entra');
      clearTimeout(pintar.t); pintar.t = setTimeout(() => pan.classList.remove('entra'), 900);   // la entrada solo al llegar, no en cada repintado
    } else pan.classList.remove('entra');
    if (ruta.sec === 'ajustes') despuesDePintar();
    pintarInsignia();
  } catch (e) {
    anotarError(e, 'pintar ' + ruta.sec);
    $('pantalla').innerHTML = '<section class="tarjeta"><div class="vacio"><b>Algo falló al mostrar esta sección</b><span>Tus datos están bien. Prueba otra vez o vuelve a Hoy.</span>' +
      '<div class="fila-botones"><button type="button" class="btn" data-acc="reintentar">Reintentar</button><a class="btn pri" href="#hoy">Ir a Hoy</a></div></div></section>';
  }
}

function ir(sec, param = '') {
  ruta = { sec, param, sub: '', herr: herramienta(sec, param) ? param : '' };
  const h = '#' + sec + (param ? '/' + param : '');
  if (location.hash !== h) { try { history.pushState(null, '', h); } catch (e) { location.hash = h; } }
  cerrarHoja(true);
  pintar();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', () => {
  if (atrasEsDeHoja()) return;
  const r = leerRuta();
  ruta = r || rutaInicial();
  pintar();
});
window.addEventListener('hashchange', () => {
  const r = leerRuta();
  if (r && (r.sec !== ruta.sec || r.param !== ruta.param || (r.sub || '') !== (ruta.sub || ''))) {
    const misma = r.sec === ruta.sec && r.herr === 'metas' && ruta.herr === 'metas';
    ruta = r; cerrarHoja(true); pintar();
    if (!misma) window.scrollTo(0, 0);
  }
});

/* ---------- Acciones (un solo lugar que escucha los toques) ---------- */
const ACCIONES = Object.assign({}, accPend, accHoy, accHoyExtra, accRec, accAgenda, accAjustes, accDatos, accPapelera, accAreas, accSeg, accFin, accNotas, accAdmin, accHabitos, {
  agregar() { abrirCaptura(); },
  captura() { abrirCaptura(); },
  'nube-ir'() { $('btnNube').click(); },
  monto(b) { abrirMonto({ libro: b.dataset.libro || 'personal', ingreso: b.dataset.ing === '1' }); },
  buscar() { abrirBuscar(); },
  'ev-editar'(b) { editarEvento(b.dataset.id, pintar); },
  reintentar() { return true; },
  'ir-dia'(b) { irADia(b.dataset.dia); ir('calendario'); },
  /* Filtro por espacio: se recuerda y se aplica en todas las secciones */
  filtro(b) { ponerFiltro(b.dataset.v); return true; }
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
  if (ev.key === 'n' || ev.key === '+') { ev.preventDefault(); abrirCaptura(); }
  else if (/^[1-4]$/.test(ev.key)) ir(PRINCIPALES[+ev.key - 1][0]);
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
$('fab').addEventListener('click', () => abrirCaptura());
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
    despuesDeAbrir(() => mostrarMigracion().then((ok) => { migrando = false; if (ok) { const sec = 'hoy'; ruta = { sec, param: '', sub: '', herr: '' }; try { history.replaceState(null, '', '#' + sec); } catch (e) { /* nada */ } } pintar(); arrancarRecorrido(); }));
  } else { empezarVacio(); pintar(); }
}
document.getElementById('portada')?.remove();
setInterval(() => { pintarCab(); }, 15000);
/* Cada segundo: el reloj del Pomodoro (sin repintar) */
setInterval(() => {
  if (ticPomo()) { pintar(); return; }
  actualizarPomo();
  const lp = document.getElementById('latPomo');
  if (lp) { lp.hidden = !pomoCorre() || ruta.sec === 'hoy'; lp.querySelector('span').textContent = mmss(pomoResta()); }
}, 1000);
/* Cada 30 s: ¿toca algún recordatorio? (Hecho desde el aviso lo marca) */
const alPulsarAviso = (x) => { marcar(x.id); pintar(); };
setInterval(() => { if (revisarAvisos(alPulsarAviso).length) pintar(); }, 30000);
despuesDeAbrir(() => { if (revisarAvisos(alPulsarAviso).length) pintar(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (revisarAvisos(alPulsarAviso).length || ticPomo()) pintar(); } });
iniciarDeslizar(pintar);
cuandoSeGuarde(() => pintar());

/* A medianoche (hora de Lima) cambia el día: todo se repinta */
let dia = hoy();
/* Hoy se mueve solo: cada minuto se repinta (lo de «Ahora», cuánto falta), si no estás escribiendo */
setInterval(() => {
  if (hoy() !== dia) { dia = hoy(); pintar(); return; }
  const escribiendo = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
  if (ruta.sec === 'hoy' && !document.hidden && !escribiendo && !document.body.classList.contains('con-hoja')) pintar();
}, 60000);

/* Primera vez: el recorrido de bienvenida */
function arrancarRecorrido() { if (!preferencias().tourVisto) setTimeout(iniciarRecorrido, 400); }
despuesDeAbrir(() => { if (!migrando) arrancarRecorrido(); });
/* Al actualizar desde otra 5.x: novedades una vez (no tapa el recorrido, la migración ni un atajo) */
despuesDeAbrir(() => revisarNovedades(migrando || !preferencias().tourVisto || !!atajoInicial));
/* El atajo del ícono, una vez abierta la app (después del PIN) */
if (atajoInicial) despuesDeAbrir(() => setTimeout(() => {
  if (migrando) return;
  if (atajoInicial === 'ingreso' || atajoInicial === 'gasto') abrirMonto({ ingreso: atajoInicial === 'ingreso' });
  else abrirCaptura();
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
