/* AJUSTES. En la Fase 1: preferencias, seguridad (PIN y bloqueo automático),
   ayuda y el estado de tus datos. Áreas, etiquetas, respaldo, papelera y
   nube se suman en sus fases. */
import { preferencias, cambiarPref, PANTALLAS_INICIO, OPCIONES_BLOQUEO } from '../datos/preferencias.js';
import { hayPIN, configurarPIN, quitarPIN } from '../piezas/candado.js';
import { resumenAntiguo, leer, CLAVES } from '../datos/almacen.js';
import { ico, esc, plural } from '../util/dom.js';
import { fmtHora } from '../util/fechas.js';
import { aviso } from '../piezas/aviso.js';
import { iniciarRecorrido, alternarGuia } from '../piezas/guia.js';
import { encabezado, enFase } from './comun.js';
import { VERSION } from '../version.js';

function selector(acc, opciones, actual, etiqueta) {
  return '<div class="selector" role="group" aria-label="' + etiqueta + '">' + opciones.map((o) =>
    '<button type="button" data-acc="' + acc + '" data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(actual)) + '">' + o[1] + '</button>').join('') + '</div>';
}
function ajuste(titulo, texto, control, id = '') {
  return '<div class="ajuste"' + (id ? ' id="' + id + '"' : '') + '><div class="ajuste-txt"><b>' + titulo + '</b>' + (texto ? '<small>' + texto + '</small>' : '') + '</div><div class="ajuste-ctl">' + control + '</div></div>';
}
function grupo(titulo, html) { return '<h2 class="grupo-ajustes">' + titulo + '</h2><section class="tarjeta lista-ajustes">' + html + '</section>'; }

const NOMBRES_COL = { tareas: 'tareas', eventos: 'eventos', recordatorios: 'recordatorios', notas: 'notas', listas: 'listas', habitos: 'hábitos', metas: 'metas', pagos: 'pagos fijos', diario: 'días de diario', cursos: 'cursos', entrenos: 'entrenamientos', proyectos: 'proyectos', cobros: 'cobros', deudas: 'préstamos', clientes: 'clientes', horas: 'registros de horas', rutinas: 'rutinas', medidas: 'medidas', bienestar: 'días de bienestar', casa: 'tareas de casa', menu: 'menús', docs: 'documentos', fichas: 'fichas', enfoque: 'días de enfoque', revisiones: 'revisiones' };

export function vistaAjustes() {
  const p = preferencias(), ant = resumenAntiguo(), pin = hayPIN(), errores = leer(CLAVES.errores, []);
  const hora = fmtHora('14:30', p.formatoHora);
  let html = encabezado('Ajustes', 'Preferencias, seguridad y tus datos');

  html += grupo('Preferencias',
    ajuste('Tema', 'Oscuro, claro o según tu celular.', selector('pref-tema', [['oscuro', 'Oscuro'], ['claro', 'Claro'], ['auto', 'Automático']], p.tema, 'Tema')) +
    ajuste('Formato de hora', 'Así se verá: <b class="mono">' + hora + '</b>', selector('pref-hora', [['24', '24 h'], ['12', '12 h']], p.formatoHora, 'Formato de hora')) +
    ajuste('La semana empieza', '', selector('pref-semana', [['1', 'Lunes'], ['0', 'Domingo']], p.semanaLunes ? '1' : '0', 'Inicio de semana')) +
    ajuste('Horario despierto', 'Sirve para calcular si un día está sobrecargado.',
      '<div class="horas-par"><label><span>Desde</span><input type="time" class="entrada" data-pref-vigilia="ini" value="' + p.vigilia.ini + '"></label>' +
      '<label><span>Hasta</span><input type="time" class="entrada" data-pref-vigilia="fin" value="' + p.vigilia.fin + '"></label></div>') +
    ajuste('Pantalla de inicio', 'Lo primero que ves al abrir la app.', selector('pref-inicio', PANTALLAS_INICIO, p.inicio, 'Pantalla de inicio')));

  html += grupo('Seguridad',
    ajuste('PIN', pin ? 'Activado. Se pide al abrir la app y tras el tiempo que elijas abajo.' : 'Sin PIN: cualquiera que tome tu celular puede ver tu agenda.',
      pin ? '<button type="button" class="btn" data-acc="pin-cambiar">' + ico('i-candado') + 'Cambiar</button><button type="button" class="btn peligro" data-acc="pin-quitar">Quitar</button>'
          : '<button type="button" class="btn pri" data-acc="pin-poner">' + ico('i-candado') + 'Poner PIN</button>') +
    ajuste('Bloqueo automático', 'Si no usas la app ese tiempo (o la dejas en segundo plano), vuelve a pedir el PIN.' + (pin ? '' : ' Necesita un PIN.'),
      '<select class="entrada" data-pref-bloqueo="1" aria-label="Bloqueo automático"' + (pin ? '' : ' disabled') + '>' + OPCIONES_BLOQUEO.map((o) => '<option value="' + o[0] + '"' + (o[0] === p.bloqueoMin ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>') +
    '<p class="pie-ajuste">' + ico('i-info') + 'El PIN tapa la pantalla, pero no cifra tus datos. Si lo olvidas, no se puede recuperar.</p>');

  html += grupo('Ayuda',
    ajuste('Modo guía', 'Muestra una explicación corta en cada bloque.', '<button type="button" class="btn" data-acc="guia" aria-pressed="' + p.guia + '">' + ico('i-guia') + (p.guia ? 'Apagar' : 'Activar') + '</button>') +
    ajuste('Recorrido de bienvenida', 'Te muestra en 5 pasos cómo se usa la app.', '<button type="button" class="btn" data-acc="recorrido">' + ico('i-play') + 'Ver recorrido</button>'));

  const cols = Object.keys(ant.colecciones).sort((a, b) => ant.colecciones[b] - ant.colecciones[a]);
  html += grupo('Tus datos',
    (ant.hay
      ? '<div class="datos-antiguos"><p><b>Tu agenda anterior (v4.5) sigue intacta en este aparato.</b> La versión nueva todavía no la toca: solo la cuenta.</p><ul>' +
        cols.map((c) => '<li><span class="mono">' + ant.colecciones[c] + '</span> ' + esc(NOMBRES_COL[c] || c) + '</li>').join('') +
        (ant.libros.personal ? '<li><span class="mono">' + ant.libros.personal + '</span> movimientos del libro personal</li>' : '') +
        (ant.libros.oficina ? '<li><span class="mono">' + ant.libros.oficina + '</span> movimientos del libro de la oficina</li>' : '') +
        '</ul>' + (ant.nube ? '<p class="pie-ajuste">' + ico('i-nube') + 'Este aparato tiene la nube conectada en la versión anterior. La nueva no se conectará sin tu permiso.</p>' : '') + '</div>'
      : '<div class="datos-antiguos"><p>No encontré datos de la versión anterior en este aparato. Si tu agenda está en otro celular o en otra dirección web, en la Fase 2 podrás traerla con un respaldo.</p></div>') +
    enFase(2, 'migrar todo esto al formato nuevo (con una copia del formato antiguo guardada antes), exportar e importar respaldos —también los antiguos— y el aviso si pasan más de 7 días sin respaldar.'));

  html += grupo('Acerca de',
    ajuste('Versión', 'Agenda ' + VERSION + ' · hora de Lima (America/Lima) · soles', '') +
    (errores.length ? ajuste('Registro de fallos', plural(errores.length, 'fallo anotado', 'fallos anotados') + '. Si notas algo raro, cópialo y envíamelo.', '<button type="button" class="btn" data-acc="errores">Ver</button>') : ''));
  return html;
}

export const acciones = {
  'pref-tema'(b) { cambiarPref({ tema: b.dataset.v }); return true; },
  'pref-hora'(b) { cambiarPref({ formatoHora: b.dataset.v }); return true; },
  'pref-semana'(b) { cambiarPref({ semanaLunes: b.dataset.v === '1' }); return true; },
  'pref-inicio'(b) { cambiarPref({ inicio: b.dataset.v }); aviso('Al abrir verás ' + PANTALLAS_INICIO.find((o) => o[0] === b.dataset.v)[1] + '.'); return true; },
  'pin-poner'(b, ev, repintar) { configurarPIN((r) => { aviso(r === 'puesto' ? 'PIN activado.' : 'Listo.'); repintar(); }); },
  'pin-cambiar'(b, ev, repintar) { configurarPIN(() => { aviso('PIN cambiado.'); repintar(); }); },
  'pin-quitar'(b, ev, repintar) { quitarPIN(() => { aviso('PIN quitado.'); repintar(); }); },
  guia() { alternarGuia(); return true; },
  recorrido() { iniciarRecorrido(); },
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
