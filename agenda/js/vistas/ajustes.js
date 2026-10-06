/* AJUSTES: preferencias, avisos, seguridad, nube, tus áreas, etiquetas y
   categorías, ayuda y tus datos (respaldo, copias, papelera, migración). */
import { preferencias, cambiarPref, PANTALLAS_INICIO, OPCIONES_BLOQUEO } from '../datos/preferencias.js';
import { hayPIN, configurarPIN, quitarPIN } from '../piezas/candado.js';
import { resumenAntiguo, leer, CLAVES } from '../datos/almacen.js';
import { ico, esc, plural } from '../util/dom.js';
import { fmtHora, fmtFecha, hoy } from '../util/fechas.js';
import { documento, elementos, enPapelera, DIAS_PAPELERA, migrarDesdeV45 } from '../datos/datos.js';
import { descargarRespaldo, diasSinRespaldo, tocaRespaldar, DIAS_AVISO_RESPALDO, analizarArchivo, importar, guardarArchivo } from '../datos/respaldo.js';
import { listarCopias, leerCopia } from '../datos/copias.js';
import { abrirHoja, cerrarHoja } from '../piezas/hoja.js';
import { confirmar } from '../piezas/confirmar.js';
import { permisoAvisos, pedirPermiso, notificar, sonar } from '../piezas/avisos.js';
import { aviso } from '../piezas/aviso.js';
import { iniciarRecorrido, alternarGuia } from '../piezas/guia.js';
import { VERSION } from '../version.js';
import { abrirNovedades } from '../piezas/novedades.js';
import { grupoNube, grupoAreas, grupoEtiquetas, grupoTeclado } from './admin.js';

function selector(acc, opciones, actual, etiqueta) {
  return '<div class="selector" role="group" aria-label="' + etiqueta + '">' + opciones.map((o) =>
    '<button type="button" data-acc="' + acc + '" data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(actual)) + '">' + o[1] + '</button>').join('') + '</div>';
}
function ajuste(titulo, texto, control, id = '') {
  return '<div class="ajuste"' + (id ? ' id="' + id + '"' : '') + '><div class="ajuste-txt"><b>' + titulo + '</b>' + (texto ? '<small>' + texto + '</small>' : '') + '</div><div class="ajuste-ctl">' + control + '</div></div>';
}
function grupo(titulo, html) { return '<h2 class="grupo-ajustes">' + titulo + '</h2><section class="tarjeta lista-ajustes">' + html + '</section>'; }


export function vistaAjustes() {
  const p = preferencias(), ant = resumenAntiguo(), pin = hayPIN(), errores = leer(CLAVES.errores, []);
  const hora = fmtHora('14:30', p.formatoHora);
  const todo = p.completo;
  let html = grupo('Cómo se ve la agenda',
    ajuste('Modo', todo ? 'Ves <b>todo</b>: prioridades, Pomodoro, balance, metas, informes y más.' : '<b>Modo simple</b>: solo lo esencial. Nada se borra: con «Mostrar todo» vuelve lo demás.',
      selector('pref-completo', [['0', 'Simple'], ['1', 'Mostrar todo']], todo ? '1' : '0', 'Modo')));

  html += grupo('Preferencias',
    ajuste('Tema', 'Oscuro, claro o según tu celular.', selector('pref-tema', [['oscuro', 'Oscuro'], ['claro', 'Claro'], ['auto', 'Automático']], p.tema, 'Tema')) +
    ajuste('Formato de hora', 'Así se verá: <b class="mono">' + hora + '</b>', selector('pref-hora', [['24', '24 h'], ['12', '12 h']], p.formatoHora, 'Formato de hora')) +
    ajuste('La semana empieza', '', selector('pref-semana', [['1', 'Lunes'], ['0', 'Domingo']], p.semanaLunes ? '1' : '0', 'Inicio de semana')) +
    (!todo ? '' : ajuste('Horario despierto', 'Sirve para calcular si un día está sobrecargado.',
      '<div class="horas-par"><label><span>Desde</span><input type="time" class="entrada" data-pref-vigilia="ini" value="' + p.vigilia.ini + '"></label>' +
      '<label><span>Hasta</span><input type="time" class="entrada" data-pref-vigilia="fin" value="' + p.vigilia.fin + '"></label></div>')) +
    ajuste('Feriados del Perú', 'Mostrarlos en Hoy y en la Agenda.', selector('pref-feriados', [['1', 'Mostrar'], ['0', 'Ocultar']], p.feriados ? '1' : '0', 'Feriados')) +
    ajuste('Pantalla de inicio', 'Lo primero que ves al abrir la app.', selector('pref-inicio', PANTALLAS_INICIO, p.inicio, 'Pantalla de inicio')));

  const perm = permisoAvisos();
  html += grupo('Avisos',
    ajuste('Avisos del sistema', perm === 'granted' ? 'Activados: los recordatorios con hora te avisan aunque estés en otra app (mientras el navegador la mantenga viva).' : perm === 'denied' ? 'Bloqueados. Actívalos desde el candado de la barra de direcciones → Notificaciones.' : perm === 'no' ? 'Este navegador no los tiene: sonarán dentro de la app.' : 'Aún sin activar. Sin ellos, los avisos solo suenan con la app abierta.',
      (perm === 'default' ? '<button type="button" class="btn pri" data-acc="avisos-permiso">' + ico('i-campana') + 'Activar</button>' : '') + '<button type="button" class="btn" data-acc="avisos-probar">Probar</button>') +
    ajuste('Sonido al avisar', '', selector('pref-sonido', [['1', 'Con sonido'], ['0', 'Silencio']], p.sonido ? '1' : '0', 'Sonido')) +
    '<p class="pie-ajuste">' + ico('i-info') + 'Una página web solo puede avisar mientras está abierta o en segundo plano reciente. Para lo que no puede fallar (citas, audiencias), pásalo al calendario de tu teléfono: suena aunque la Agenda esté cerrada.</p>' +
    ajuste('Pasar al calendario del teléfono', 'Un archivo .ics con tus eventos y recordatorios que vienen. Cada evento también tiene su botón «Google Calendar».', '<button type="button" class="btn" data-acc="ics-todo">' + ico('i-bajar') + 'Todo en .ics</button>'));

  html += grupo('Seguridad',
    ajuste('PIN', pin ? 'Activado. Se pide al abrir la app y tras el tiempo que elijas abajo.' : 'Sin PIN: cualquiera que tome tu celular puede ver tu agenda.',
      pin ? '<button type="button" class="btn" data-acc="pin-cambiar">' + ico('i-candado') + 'Cambiar</button><button type="button" class="btn peligro" data-acc="pin-quitar">Quitar</button>'
          : '<button type="button" class="btn pri" data-acc="pin-poner">' + ico('i-candado') + 'Poner PIN</button>') +
    ajuste('Bloqueo automático', 'Si no usas la app ese tiempo (o la dejas en segundo plano), vuelve a pedir el PIN.' + (pin ? '' : ' Necesita un PIN.'),
      '<select class="entrada" data-pref-bloqueo="1" aria-label="Bloqueo automático"' + (pin ? '' : ' disabled') + '>' + OPCIONES_BLOQUEO.map((o) => '<option value="' + o[0] + '"' + (o[0] === p.bloqueoMin ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>') +
    '<p class="pie-ajuste">' + ico('i-info') + 'El PIN tapa la pantalla, pero no cifra tus datos. Si lo olvidas, no se puede recuperar.</p>');

  html += '<div id="nube"></div>' + grupo('Nube', grupoNube());
  html += grupo('Teclado', grupoTeclado());
  html += grupo('Tus áreas', grupoAreas());
  if (todo) html += grupo('Etiquetas y categorías', grupoEtiquetas());

  html += grupo('Ayuda',
    ajuste('Modo guía', 'Muestra una explicación corta en cada bloque.', '<button type="button" class="btn" data-acc="guia" aria-pressed="' + p.guia + '">' + ico('i-guia') + (p.guia ? 'Apagar' : 'Activar') + '</button>') +
    ajuste('Recorrido de bienvenida', 'Te muestra en 5 pasos cómo se usa la app.', '<button type="button" class="btn" data-acc="recorrido">' + ico('i-play') + 'Ver recorrido</button>') +
    ajuste('Novedades', 'Lo que trae la versión ' + VERSION + ', cada cosa en su sección.', '<button type="button" class="btn" data-acc="novedades">' + ico('i-info') + 'Ver novedades</button>'));

  const doc = documento(), mig = doc && doc.migracion, rs = diasSinRespaldo(), total = doc ? elementos((x) => !(x.extra && x.extra.sistema)).length : 0;
  const nPap = enPapelera().length;
  html += grupo('Tus datos',
    ajuste('Ver tus datos', doc ? 'Tienes <b>' + total + '</b> cosas guardadas. Busca, filtra y abre cada una con todos sus campos.' : 'Todavía no hay datos.',
      '<a class="btn" href="#datos">' + ico('i-buscar') + 'Ver</a>') +
    ajuste('Respaldo', (rs.nunca ? 'Aún no guardaste ninguno.' : 'El último fue ' + (rs.dias === 0 ? 'hoy' : rs.dias === 1 ? 'ayer' : 'hace ' + rs.dias + ' días') + '.') +
      (tocaRespaldar() ? ' <b class="txt-aviso">Han pasado más de ' + DIAS_AVISO_RESPALDO + ' días: guarda uno.</b>' : '') +
      ' Un solo archivo con todo. Para cargar acepta también respaldos de la versión anterior, y <b>junta</b> en vez de reemplazar.',
      '<button type="button" class="btn pri" data-acc="respaldo-bajar">' + ico('i-bajar') + 'Descargar</button>' +
      '<label class="btn" for="archivoRespaldo">' + ico('i-subir') + 'Cargar</label><input type="file" id="archivoRespaldo" accept=".json,application/json" class="solo-lector">', 'ajusteRespaldo') +
    ajuste('Copias automáticas', 'Se guardan solas en este aparato antes de migrar y antes de cargar un respaldo.', '<div id="copiasLista" class="copias-lista"><span class="mono">Cargando…</span></div>') +
    ajuste('Papelera', 'Lo que borras queda ' + DIAS_PAPELERA + ' días y puedes devolverlo.', '<a class="btn" href="#papelera">' + ico('i-basura') + 'Abrir' + (nPap ? ' (' + nPap + ')' : '') + '</a>') +
    (mig ? ajuste('Migración desde la versión anterior', 'Hecha el ' + fmtFecha(hoy(new Date(mig.fecha))) + (mig.verificacion && mig.verificacion.ok ? ' · <span class="txt-ok">verificada sin pérdidas</span>' : '') + (mig.ultimaReimportacion ? ' · traída de nuevo el ' + fmtFecha(hoy(new Date(mig.ultimaReimportacion))) : '') + '.',
      '<button type="button" class="btn" data-acc="mig-informe">Ver informe</button>') : '') +
    (ant.hay ? ajuste('Tu versión anterior', 'Sigue intacta en este aparato (' + ant.total + ' cosas y ' + (ant.libros.personal + ant.libros.oficina) + ' movimientos). La nueva nunca la modifica. Si seguiste usándola, puedes traer sus cambios: se juntan sin duplicar.',
      '<button type="button" class="btn" data-acc="mig-otra-vez">' + ico('i-subir') + 'Traer de nuevo</button>') : '') +
    '');

  html += grupo('Acerca de',
    ajuste('Versión', 'Agenda ' + VERSION + ' · hora de Lima (America/Lima) · soles', '') +
    (errores.length ? ajuste('Registro de fallos', plural(errores.length, 'fallo anotado', 'fallos anotados') + '. Si notas algo raro, cópialo y envíamelo.', '<button type="button" class="btn" data-acc="errores">Ver</button>') : ''));
  return html;
}

const TIPO_COPIA = { 'antes-de-migrar': 'Antes de migrar (versión anterior, tal cual)', 'antes-de-importar': 'Antes de cargar un respaldo' };
/* La lista de copias se llena después de pintar (IndexedDB responde aparte) */
export function despuesDePintar() {
  const el = document.getElementById('copiasLista');
  if (!el) return;
  listarCopias().then((l) => {
    el.innerHTML = l.length ? l.map((c) => '<div class="copia"><span><b>' + esc(TIPO_COPIA[c.tipo] || c.tipo) + '</b><small class="mono">' + fmtFecha(hoy(new Date(c.fecha))) + ' · ' + fmtHora(new Date(c.fecha).toLocaleTimeString('en-GB', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }), preferencias().formatoHora) + ' · ' + Math.max(1, Math.round(c.tamano / 1024)) + ' KB</small></span>' +
      '<button type="button" class="btn chico" data-acc="copia-bajar" data-id="' + esc(c.id) + '">' + ico('i-bajar') + 'Descargar</button></div>').join('') : '<small>Aún no hay copias.</small>';
  }).catch((e) => { el.innerHTML = '<small>Este navegador no permite copias automáticas (' + esc(e.message || e) + '). Usa «Descargar» respaldo.</small>'; });
}

function informeMigracion() {
  const m = documento() && documento().migracion, v = m && m.verificacion;
  if (!v) return;
  const filas = Object.keys(v.porCol).filter((c) => v.porCol[c].antes || v.porCol[c].despues);
  abrirHoja('Informe de la migración', '<p class="ayuda">Cada cosa de la versión anterior se reconstruyó desde el formato nuevo y se comparó campo por campo con la original.</p>' +
    '<div class="mig-tabla"><div class="mig-fila cab"><span>Qué</span><span>Antes</span><span>Ahora</span><span></span></div>' +
    filas.map((c) => '<div class="mig-fila"><span>' + esc(c) + '</span><span class="mono">' + v.porCol[c].antes + '</span><span class="mono">' + v.porCol[c].despues + '</span><span class="' + (v.porCol[c].ok ? 'ok' : 'mal') + '">' + ico(v.porCol[c].ok ? 'i-check' : 'i-x') + '</span></div>').join('') + '</div>' +
    (m.informe && (m.informe.ignorados.vacios || m.informe.ignorados.purgados) ? '<p class="ayuda">No se pasaron ' + (m.informe.ignorados.vacios + m.informe.ignorados.purgados) + ' marcas vacías o de cosas ya borradas para siempre en la versión anterior (no tenían contenido).</p>' : '') +
    '<div class="fila-botones"><button type="button" class="btn pri" data-cerrar-hoja="1">Listo</button></div>');
}

function previaImportar(an) {
  if (!an.ok) {
    abrirHoja('No se pudo cargar', '<p class="ayuda">' + esc(an.error) + '</p>' + (an.problemas ? '<details class="mig-detalle"><summary>Detalle</summary><pre>' + esc(an.problemas.slice(0, 8).join('\n')) + '</pre></details>' : '') +
      '<div class="fila-botones"><button type="button" class="btn pri" data-cerrar-hoja="1">Entendido</button></div>');
    return;
  }
  const h = abrirHoja('Cargar respaldo', '<p class="ayuda"><b>' + esc(an.tipo) + '</b>' + (an.fecha ? ' · del ' + fmtFecha(String(an.fecha).slice(0, 10)) : '') + '</p>' +
    '<ul class="lista-conteo">' + an.conteo.map(([n, c]) => '<li><span class="mono">' + c + '</span> ' + esc(n) + '</li>').join('') + '</ul>' +
    '<p class="ayuda">Se <b>junta</b> con lo que ya tienes: lo que no tengas se agrega y, si algo existe en los dos, queda el cambio más reciente. Antes se guarda una copia automática de lo actual.</p>' +
    '<div class="fila-botones"><button type="button" class="btn" data-cerrar-hoja="1">Cancelar</button><button type="button" class="btn pri" id="btnImportar">' + ico('i-subir') + 'Cargar y juntar</button></div>');
  h.querySelector('#btnImportar').onclick = async () => {
    const r = await importar(an);
    cerrarHoja();
    aviso(r.ok ? 'Respaldo cargado: ' + r.nuevos + ' nuevas y ' + r.actualizados + ' actualizadas.' : r.error);
    window.dispatchEvent(new Event('agenda:repintar'));
  };
}

export function alElegirArchivo(t) {
  if (t.id !== 'archivoRespaldo' || !t.files || !t.files[0]) return false;
  const f = t.files[0], lector = new FileReader();
  lector.onload = () => previaImportar(analizarArchivo(String(lector.result), f.name));
  lector.onerror = () => aviso('No se pudo leer el archivo.');
  lector.readAsText(f);
  t.value = '';
  return true;
}

export const acciones = {
  'pref-completo'(b) { cambiarPref({ completo: b.dataset.v === '1' }); aviso(b.dataset.v === '1' ? 'Ahora ves todo.' : 'Modo simple: solo lo esencial.'); return true; },
  'pref-feriados'(b) { cambiarPref({ feriados: b.dataset.v === '1' }); return true; },
  'ics-todo'() { import('../piezas/eventos-ui.js').then((m) => { const n = m.exportarTodo(); aviso(n ? 'Archivo con ' + n + ' cosas. Ábrelo para agregarlas a tu calendario.' : 'No hay nada próximo para pasar.'); }); },
  'pref-sonido'(b) { cambiarPref({ sonido: b.dataset.v === '1' }); return true; },
  'avisos-permiso'() { pedirPermiso().then((r) => { aviso(r === 'granted' ? 'Avisos activados.' : 'Avisos sin activar.'); window.dispatchEvent(new Event('agenda:repintar')); }); },
  'avisos-probar'() { sonar(); aviso('⏰ Así suena un aviso'); notificar('⏰ Prueba de aviso', 'Así te avisará la Agenda.', 'ajustes', 'prueba'); },
  'respaldo-bajar'() { descargarRespaldo(); aviso('Respaldo descargado. Guárdalo en Drive o en tu correo.'); return true; },
  async 'copia-bajar'(b) { const c = await leerCopia(b.dataset.id); if (c) guardarArchivo(c.texto, 'agenda_copia_' + c.tipo + '_' + hoy(new Date(c.fecha)) + '.json'); },
  'mig-informe'() { informeMigracion(); },
  async 'mig-otra-vez'(b, ev, repintar) {
    if (!(await confirmar({ titulo: '¿Traer de nuevo la versión anterior?', texto: 'Se guarda otra copia exacta, se convierte y se verifica igual que la primera vez. Lo que ya tienes se junta: no se duplica nada y gana el cambio más reciente.', si: 'Traer y juntar' }))) return;
    const r = await migrarDesdeV45();
    aviso(r.ok ? 'Listo: se trajo y verificó sin pérdidas.' : 'No se trajo nada: ' + (r.paso === 'verificacion' ? 'la verificación encontró diferencias' : (r.error && r.error.message) || r.paso));
    repintar();
  },
  'pref-tema'(b) { cambiarPref({ tema: b.dataset.v }); return true; },
  'pref-hora'(b) { cambiarPref({ formatoHora: b.dataset.v }); return true; },
  'pref-semana'(b) { cambiarPref({ semanaLunes: b.dataset.v === '1' }); return true; },
  'pref-inicio'(b) { cambiarPref({ inicio: b.dataset.v }); aviso('Al abrir verás ' + PANTALLAS_INICIO.find((o) => o[0] === b.dataset.v)[1] + '.'); return true; },
  'pin-poner'(b, ev, repintar) { configurarPIN((r) => { aviso(r === 'puesto' ? 'PIN activado.' : 'Listo.'); repintar(); }); },
  'pin-cambiar'(b, ev, repintar) { configurarPIN(() => { aviso('PIN cambiado.'); repintar(); }); },
  'pin-quitar'(b, ev, repintar) { quitarPIN(() => { aviso('PIN quitado.'); repintar(); }); },
  guia() { alternarGuia(); return true; },
  recorrido() { iniciarRecorrido(); },
  novedades() { abrirNovedades(); },
  errores() {
    const l = leer(CLAVES.errores, []);
    const txt = l.map((x) => new Date(x.t).toLocaleString('es-PE', { timeZone: 'America/Lima' }) + ' · ' + x.donde + '\n' + x.msj + '\n' + x.pila).join('\n\n');
    import('../piezas/hoja.js').then((h) => h.abrirHoja('Registro de fallos', '<textarea class="entrada registro" readonly>' + esc(txt) + '</textarea>'));
  }
};

/* Campos que cambian al soltar (hora de vigilia, bloqueo) */
export function alCambiarCampo(t) {
  if (t.dataset.prefVigilia) {
    const v = Object.assign({}, preferencias().vigilia, { [t.dataset.prefVigilia]: t.value });
    cambiarPref({ vigilia: v });
    return true;
  }
  if (t.dataset.prefBloqueo) { cambiarPref({ bloqueoMin: +t.value }); aviso('Bloqueo automático: ' + OPCIONES_BLOQUEO.find((o) => o[0] === +t.value)[1].toLowerCase() + '.'); return false; }
  return false;
}
