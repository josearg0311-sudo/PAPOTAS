/* RECORDATORIOS: tus listas con casillas, ordenadas por CUÁNDO.
   Grupos: Para hoy · Más tarde · Mañana · Próximos días · Algún día · Hecho.
   Las listas «para marcar» (compras, maleta) se ven como checklist simple. */
import { filtro, pasa } from '../datos/filtro.js';
import { hoy, sumarDias, fmtCorta } from '../util/fechas.js';
import { vacio, ico, esc, explica } from '../util/dom.js';
import { buscarElemento } from '../datos/datos.js';
import { GRUPOS, grupo, ordenar, listas, pendientesVisibles, pendientesDe, esChecklist, crearDesdeTexto, hechoEn, atrasado } from '../datos/pendientes.js';
import { LISTA_RECORDATORIOS } from '../datos/modelo.js';
import { filaPendiente, editarLista, editarPendiente } from '../piezas/pendientes-ui.js';
import { AREAS, chipArea, area } from '../datos/areas.js';
import { mover, marcar, restaurarVersion } from '../datos/pendientes.js';
import { aPapelera, restaurar, poner } from '../datos/datos.js';
import { abrirHoja, cerrarHoja } from '../piezas/hoja.js';
import { diaSemana } from '../util/fechas.js';
import { interpretar } from '../util/interpretar.js';
import { aviso } from '../piezas/aviso.js';
import { tarjeta } from './comun.js';
import { preferencias } from '../datos/preferencias.js';
import { modeloVacio, nuevoId } from '../datos/modelo.js';
import { crearLista } from '../datos/pendientes.js';
import { compartir } from '../piezas/compartir.js';

/* Con muchos pendientes se muestran por tandas (pintar mil filas traba el celular) */
const TANDA = { hecho: 8, otro: 40 };
const ui = { lista: '', ver: {}, sel: null };
const simple = () => !preferencias().completo;   // modo simple: sin medidor, sin botones extra y sin grupos vacíos
const cuantos = (k) => ui.ver[k] || (k === 'hecho' ? TANDA.hecho : TANDA.otro);
const VACIOS = { hoy: 'Nada pendiente para hoy. 👌', tarde: 'Lo que pases a «Más tarde» aparece aquí.', manana: 'Mañana lo tienes libre.', prox: 'Nada programado para los próximos días.', algun: 'Ideas sin fecha: guárdalas aquí para no olvidarlas.', hecho: 'Lo que marques como hecho baja aquí.' };

export function irALista(id) { ui.lista = id || ''; }
/* Ir a una lista: en Listas (#tareas/<id>) la dirección manda, así que se cambia la dirección */
function irLista(id) { ui.lista = id || ''; ui.ver = {}; if (location.hash.startsWith('#tareas/')) location.hash = '#tareas/' + (id || 'todos'); }

function masBoton(k, total, vistos) {
  if (total <= vistos) return '';
  return '<div class="fila-botones izq pie-grupo"><button type="button" class="btn chico" data-acc="r-mas" data-v="' + k + '">Ver ' + Math.min(k === 'hecho' ? 30 : 100, total - vistos) + ' más <span class="mono">(' + vistos + ' de ' + total + ')</span></button></div>';
}

/* Elegir varios (de la v4.5): cada fila se vuelve una casilla para elegir */
function filaSel(x) {
  const on = ui.sel.includes(x.id);
  return '<button type="button" class="pend sel-fila area-' + area(x.area).id + (on ? ' elegida' : '') + '" role="checkbox" aria-checked="' + on + '" data-acc="r-sel" data-id="' + esc(x.id) + '">' +
    '<span class="casilla cuadrada" aria-hidden="true"><span></span></span><span class="pend-txt"><b>' + esc(x.titulo || '(sin título)') + '</b><span class="pend-meta">' + chipArea(x.area) + (x.fechas.inicio ? '<span class="mono">' + fmtCorta(x.fechas.inicio) + '</span>' : '<span>algún día</span>') + '</span></span></button>';
}
function barraSel() {
  const n = ui.sel.length, d = n ? '' : ' disabled';
  return '<div class="barra-sel" role="toolbar" aria-label="Qué hacer con lo elegido"><div class="barra-sel-cab"><b>' + (n ? n + (n === 1 ? ' elegido' : ' elegidos') : 'Toca para elegir') + '</b>' +
    '<button type="button" class="btn chico" data-acc="r-sel-todos">Todos</button><button type="button" class="icono-btn" data-acc="r-sel-fin" aria-label="Terminar">' + ico('i-x') + '</button></div>' +
    '<div class="barra-sel-acc"><button type="button" class="btn" data-acc="r-sel-hecho"' + d + '>' + ico('i-check') + 'Hechos</button><button type="button" class="btn" data-acc="r-sel-dia"' + d + '>' + ico('i-agenda') + 'Fecha</button>' +
    '<button type="button" class="btn" data-acc="r-sel-area"' + d + '>' + ico('i-areas') + 'Área</button><button type="button" class="btn peligro" data-acc="r-sel-borrar"' + d + '>' + ico('i-basura') + 'Papelera</button></div></div>';
}
function aplicarSel(fn, texto, repintar) {
  const antes = ui.sel.map((id) => buscarElemento(id)).filter(Boolean).map((x) => JSON.parse(JSON.stringify(x)));
  antes.forEach((x) => fn(x.id));
  const n = antes.length; ui.sel = null; cerrarHoja(true); repintar();
  aviso(texto + ' · ' + n + (n === 1 ? ' recordatorio' : ' recordatorios'), () => { antes.forEach((x) => { if (buscarElemento(x.id) && buscarElemento(x.id).borrado) restaurar(x.id); poner(x); }); repintar(); });
}

/* LISTAS PARA MARCAR (#tareas): todas tus listas de compras, maleta,
   mochila… a la vista, con cuánto llevas marcado. */
export function vistaListas() {
  const ls = listas().filter(esChecklist);
  return (ls.length ? '<div class="listas-grilla">' + ls.map((l) => {
    const p = pendientesDe(l.id), ok = p.filter((x) => x.estado === 'hecho').length, faltan = p.filter((x) => x.estado !== 'hecho');
    return '<button type="button" class="lista-tarj area-' + l.area + '" data-acc="r-lista-ir" data-id="' + esc(l.id) + '">' +
      '<span class="lt-cab"><b>' + esc(l.titulo) + '</b><small>' + ok + '/' + p.length + '</small></span>' +
      '<span class="lt-barra" aria-hidden="true"><i style="width:' + (p.length ? Math.round(ok / p.length * 100) : 0) + '%"></i></span>' +
      '<span class="lt-items">' + (faltan.length ? faltan.slice(0, 3).map((x) => '<span>○ ' + esc(x.titulo) + '</span>').join('') + (faltan.length > 3 ? '<span class="tenue">y ' + (faltan.length - 3) + ' más</span>' : '') : '<span>✓ Todo marcado</span>') + '</span></button>';
  }).join('') + '</div>' : vacio('Aún no tienes listas para marcar', 'Crea una para las compras, la maleta o la mochila del gym.')) +
    '<div class="fila-botones izq"><button type="button" class="btn pri" data-acc="r-nueva-checklist">' + ico('i-plus') + 'Nueva lista para marcar</button></div>';
}

/* LISTAS (Agenda 6, #tareas): todas tus listas juntas —las de recordatorios y
   las para marcar— cada una con su anillo de avance. Tocar una la abre
   (#tareas/<id>); «Todo lo pendiente» las junta por día. */
export function vistaListas6(param) {
  if (param) {
    ui.lista = param === 'todos' ? '' : param;
    const l = ui.lista ? buscarElemento(ui.lista) : null;
    if (ui.lista && (!l || l.borrado)) ui.lista = '';
    return '<div class="lista6-det"><a class="volver-panel" href="#tareas">' + ico('i-izq') + 'Tareas</a>' + vistaRecordatorios() + '</div>';
  }
  const anillo = (ok, tot) => { const c = 113.1, f = tot ? ok / tot : 0; return '<svg class="l6-anillo" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18"/><circle class="v" cx="22" cy="22" r="18" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - f)).toFixed(1) + '"/></svg>'; };
  const f = filtro();   // con un espacio elegido: solo lo de ese espacio
  const todos = pendientesVisibles().filter((x) => x.estado !== 'hecho' && pasa(x, f)), hoyN = todos.filter((x) => x.fechas.inicio && x.fechas.inicio <= hoy()).length;
  const tarj = listas().map((l) => {
    const p = pendientesDe(l.id).filter((x) => !f || l.area === f || pasa(x, f)), ok = p.filter((x) => x.estado === 'hecho').length, faltan = p.filter((x) => x.estado !== 'hecho');
    return { l, p, ok, faltan, check: esChecklist(l) };
  }).filter((x) => (x.p.length || !x.l.extra.sistema) && (!f || x.l.area === f || x.p.length))
    .sort((a, b) => (b.faltan.length ? 1 : 0) - (a.faltan.length ? 1 : 0));
  return (tarj.length > 6 ? '<label class="l6-buscar"><span class="solo-lector">Buscar una lista</span>' + ico('i-buscar') + '<input id="l6Buscar" class="entrada" type="search" placeholder="Buscar una lista o algo de adentro…" autocomplete="off"></label>' : '') +
    '<div class="listas6">' +
    '<a class="l6 l6-todo" href="#tareas/todos"><span class="l6-n">' + todos.length + '</span><b>Todo lo pendiente</b><small>' + (hoyN ? hoyN + ' para hoy' : 'nada para hoy') + ' · ordenado por día</small></a>' +
    tarj.map(({ l, p, ok, faltan, check }) => '<a class="l6" href="#tareas/' + esc(l.id) + '" data-busca="' + esc((l.titulo + ' ' + p.map((x) => x.titulo).join(' ')).toLowerCase()) + '">' + anillo(ok, p.length) +
      '<b>' + esc(nombreLista(l)) + '</b><small>' + (p.length ? ok + ' de ' + p.length + (faltan.length ? ' · ' + esc(faltan.slice(0, 2).map((x) => x.titulo).join(', ')) + (faltan.length > 2 ? '…' : '') : ' · todo listo ✓') : (check ? 'vacía' : 'sin recordatorios')) + '</small></a>').join('') +
    (tarj.some((x) => !x.l.extra.sistema) ? '' : '<section class="l6-empieza"><h2 class="seccion-t">Empieza con una plantilla</h2><div class="l6-plantillas">' + PLANTILLAS.map((x, i) => '<button type="button" class="cap-ej siempre" data-acc="l6-plantilla" data-v="' + i + '"><b>' + esc(x[0]) + '</b><small>' + x[1].length + ' cosas</small></button>').join('') + '</div></section>') +
    '<button type="button" class="l6 l6-nueva" data-acc="l6-nueva">' + ico('i-plus') + '<b>Nueva lista</b><small>o en Agregar escribe «compras: leche, pan»</small></button>' +
    '</div>';
}

/* La lista «Tareas» de la versión anterior se ve como «Por hacer» (dentro de la sección Tareas confundía); el dato no cambia */
const nombreLista = (l) => (l.id === 'lista_tareas' && l.titulo === 'Tareas' ? 'Por hacer' : l.titulo);

/* Plantillas para empezar una lista para marcar en un toque */
const PLANTILLAS = [
  ['Compras del mes', ['Arroz', 'Aceite', 'Azúcar', 'Leche', 'Huevos', 'Pan', 'Fideos', 'Atún', 'Papel higiénico', 'Detergente', 'Jabón', 'Fruta']],
  ['Maleta de viaje', ['DNI', 'Cargador', 'Audífonos', 'Ropa', 'Casaca', 'Cepillo de dientes', 'Bloqueador', 'Medicinas', 'Pasajes', 'Efectivo']],
  ['Mochila del gym', ['Toalla', 'Tomatodo', 'Polo de cambio', 'Zapatillas', 'Candado', 'Sandalias', 'Audífonos']],
  ['Mudanza', ['Cajas', 'Cinta de embalaje', 'Plumón', 'Bolsas', 'Movilidad', 'Cambiar dirección en el banco', 'Luz y agua a mi nombre']],
  ['Cumpleaños / reunión', ['Invitaciones', 'Torta', 'Bebidas', 'Piqueos', 'Vasos y platos', 'Velas', 'Música', 'Hielo']]
];
/* Crea una lista para marcar (con sus cosas) y la abre; se puede deshacer */
function crearListaDe(titulo, cosas, repintar) {
  const t = String(titulo || '').trim();
  const l = crearLista({ titulo: t, clase: 'checklist', area: filtro() || undefined });
  if (cosas && cosas.length) crearDesdeTexto(cosas.join('\n'), { lista: l.id });
  location.hash = '#tareas/' + l.id; repintar();
  aviso('Lista ' + t + (cosas && cosas.length ? ' con ' + cosas.length + ' cosas' : ''), () => { aPapelera(l.id); location.hash = '#tareas'; repintar(); });
}
function abrirNuevaLista(repintar) {
  const hoja = abrirHoja('Nueva lista para marcar', '<form class="cap" id="l6Form"><label class="campo"><span>Nombre</span><input id="l6Nombre" class="entrada" maxlength="60" placeholder="Ej. Compras, Maleta, Útiles" autocomplete="off"></label>' +
    '<p class="cap-ej-tit">O empieza con una plantilla:</p><div class="l6-plantillas">' + PLANTILLAS.map((x, i) => '<button type="button" class="cap-ej siempre" data-l6-p="' + i + '"><b>' + esc(x[0]) + '</b><small>' + x[1].length + ' cosas</small></button>').join('') + '</div>' +
    '<button type="submit" class="btn pri cap-guardar">Crear lista vacía</button></form>');
  const crear = (titulo, cosas) => {
    if (!String(titulo || '').trim()) { aviso('Ponle un nombre.'); hoja.querySelector('#l6Nombre').focus(); return; }
    cerrarHoja(true); crearListaDe(titulo, cosas, repintar);
  };
  hoja.querySelector('#l6Form').addEventListener('submit', (ev) => { ev.preventDefault(); crear(hoja.querySelector('#l6Nombre').value, []); });
  hoja.querySelectorAll('[data-l6-p]').forEach((b) => b.addEventListener('click', () => { const p = PLANTILLAS[+b.dataset.l6P], n = hoja.querySelector('#l6Nombre').value.trim(); crear(n || p[0], p[1]); }));
}
/* Buscar entre tus listas (por su nombre o lo que tienen adentro) */
document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'l6Buscar') return;
  const q = ev.target.value.trim().toLowerCase();
  document.querySelectorAll('.listas6 .l6[data-busca]').forEach((el) => { el.hidden = !!q && !el.dataset.busca.includes(q); });
});

export function vistaRecordatorios() {
  const h = hoy(), l = ui.lista ? buscarElemento(ui.lista) : null;
  if (ui.lista && (!l || l.borrado)) ui.lista = '';
  const lsts = listas(), check = esChecklist(l);
  const todos = pendientesVisibles(ui.lista).filter((x) => ui.lista || pasa(x));   // en «Todo lo pendiente» manda el filtro; dentro de una lista se ve entera
  const pend = (id) => (id ? pendientesDe(id) : pendientesVisibles()).filter((x) => x.estado !== 'hecho').length;

  let html = '<div class="listas" role="group" aria-label="Tus listas">' +
    '<button type="button" class="lista-btn" data-acc="r-lista" data-v="" aria-pressed="' + !ui.lista + '">Todos <span class="n">' + pend('') + '</span></button>' +
    lsts.filter((x) => !simple() || !esChecklist(x) || x.id === ui.lista).map((x) => '<button type="button" class="lista-btn area-' + x.area + (esChecklist(x) ? ' check' : '') + '" data-acc="r-lista" data-v="' + esc(x.id) + '" aria-pressed="' + (ui.lista === x.id) + '"><i aria-hidden="true"></i>' + esc(x.titulo) + ' <span class="n">' + pend(x.id) + '</span></button>').join('') +
    (simple() ? '<a class="lista-btn" href="#tareas">' + ico('i-listas') + 'Listas para marcar</a>' : '') +
    '<button type="button" class="lista-btn nueva" data-acc="r-nueva-lista">' + ico('i-plus') + 'Nueva lista</button></div>';

  const cuenta = {}; GRUPOS.forEach((g) => { cuenta[g[0]] = 0; });
  todos.forEach((x) => { cuenta[grupo(x)]++; });
  const vencidos = todos.filter((x) => atrasado(x)).length;

  html += tarjeta({
    eti: l ? (check ? 'LISTA PARA MARCAR' : 'LISTA') : 'TODAS LAS LISTAS',
    titulo: l ? esc(nombreLista(l)) + (l.extra.sistema ? '' : ' <button type="button" class="icono-btn mini" data-acc="r-editar-lista" aria-label="Editar lista">' + ico('i-lapiz') + '</button>') : 'Todo lo pendiente' + (filtro() ? ' · ' + esc(area(filtro()).nombre) : ''),
    clase: l ? 'area-' + l.area : '',
    guia: check ? '<b>Lista para marcar:</b> toca la casilla de lo que ya tienes o ya hiciste. No usa días.' : '<b>Cómo funciona:</b> toca la casilla cuando lo hagas. Si hoy no da, usa <b>Más tarde</b>, <b>Mañana</b> o <b>Día…</b>, o desliza con el dedo: a la derecha lo marcas, a la izquierda pasa a mañana. Al final del día, <b>Cerrar el día</b> pasa lo pendiente a mañana.',
    cuerpo: (check || simple() ? '' : '<div class="medidor" role="group" aria-label="Cuántos hay en cada momento">' + GRUPOS.map((g) =>
        '<a class="medidor-btn' + (g[0] === 'hoy' && vencidos ? ' rojo' : g[0] === 'hecho' ? ' verde' : '') + '" href="#tareas/todos" data-acc="saltar" data-v="' + g[0] + '"><b>' + cuenta[g[0]] + '</b><small>' + g[1] + '</small></a>').join('') + '</div>') +
      '<form class="anadir" data-form="r-anadir"><label for="nuevoRec" class="solo-lector">Nuevo recordatorio</label>' +
      '<textarea id="nuevoRec" rows="1" placeholder="' + (check ? 'Agregar… (una cosa por línea)' : (simple() ? 'Escribe y pulsa Enter · ej. llamar mañana 10am' : 'Nuevo… ej. «llamar al notario mañana 10am». Pega varias líneas para crear varios.')) + '" enterkeyhint="done"></textarea>' +
      '<button type="submit" class="btn pri" aria-label="Agregar">' + ico('i-plus') + '</button></form><p class="pista" id="pistaRec" aria-live="polite"></p>'
  });

  if (check) {
    const p = todos.filter((x) => x.estado !== 'hecho').sort((a, b) => (a.origen && b.origen ? a.origen.indice - b.origen.indice : a.creado - b.creado));
    const hechos = todos.filter((x) => x.estado === 'hecho');
    html += '<section class="tarjeta grupo"><div class="grupo-tit"><span>Por marcar</span><span class="linea"></span><span class="mono">' + p.length + '</span></div>' + (p.length ? '<div class="pends">' + p.slice(0, cuantos('marcar')).map((x) => filaPendiente(x, { acciones: false })).join('') + '</div>' + masBoton('marcar', p.length, Math.min(p.length, cuantos('marcar'))) : vacio('', '¡Todo marcado! 🎉')) + '</section>' +
      '<section class="tarjeta grupo"><div class="grupo-tit"><span>Hecho</span><span class="linea"></span><span class="mono">' + hechos.length + '</span></div>' + (hechos.length ? '<div class="pends">' + hechos.slice(0, cuantos('hecho')).map((x) => filaPendiente(x, { acciones: false })).join('') + '</div>' + masBoton('hecho', hechos.length, Math.min(hechos.length, cuantos('hecho'))) + '<div class="fila-botones izq pie-grupo"><button type="button" class="btn chico" data-acc="r-desmarcar-todo">' + ico('i-deshacer') + 'Desmarcar todo para volver a usarla</button></div>' : vacio('', VACIOS.hecho)) + '</section>' +
      '<div class="fila-botones izq"><button type="button" class="btn" data-acc="r-compartir">' + ico('i-subir') + 'Compartir la lista</button><button type="button" class="btn" data-acc="r-duplicar">' + ico('i-repetir') + 'Duplicar (ej. otra maleta)</button></div>';
    return html;
  }

  GRUPOS.forEach(([k, nom]) => {
    let g = todos.filter((x) => grupo(x) === k);
    if (k === 'hecho') g.sort((a, b) => hechoEn(b) - hechoEn(a)); else g.sort(ordenar);
    const total = g.length;
    if (simple() && !total && k !== 'hoy') return;   // en modo simple no se muestran grupos vacíos
    g = g.slice(0, cuantos(k));
    const sub = k === 'hoy' ? ' · ' + fmtCorta(h) : k === 'manana' ? ' · ' + fmtCorta(sumarDias(h, 1)) : '';
    html += '<section class="tarjeta grupo" id="g-' + k + '"><div class="grupo-tit' + (k === 'hoy' && vencidos ? ' rojo' : '') + '"><span>' + nom + sub + '</span><span class="linea"></span><span class="mono">' + total + '</span></div>' +
      (k === 'hoy' && vencidos && !ui.sel ? '<div class="ordenar-cta"><span>🧹 <b>' + vencidos + (vencidos === 1 ? ' atrasado' : ' atrasados') + '</b>: decide qué hacer con cada uno</span><button type="button" class="btn chico pri" data-acc="ordenar">Ordenar</button></div>' : '') +
      (g.length ? '<div class="pends">' + g.map((x) => (ui.sel && k !== 'hecho' ? filaSel(x) : filaPendiente(x, { verLista: !ui.lista && !simple(), acciones: !simple() }))).join('') + '</div>' : vacio('', VACIOS[k])) +
      masBoton(k, total, g.length) + '</section>';
  });
  /* Elegir varios y Cerrar el día (ya no dependen de «Mostrar todo») */
  html += '<div class="fila-botones izq">' + (ui.sel ? '' : '<button type="button" class="btn" data-acc="r-sel-ini">' + ico('i-check') + 'Elegir varios</button>' +
    (cuenta.hoy ? '<button type="button" class="btn" data-acc="cerrar-dia">' + ico('i-luna2') + 'Cerrar el día: pasar lo de hoy a mañana</button>' : '')) +
    (l && ui.lista ? '<button type="button" class="btn" data-acc="r-compartir">' + ico('i-subir') + 'Compartir la lista</button>' : '') + '</div>';
  if (ui.sel) html += barraSel();
  return html;
}

export const acciones = {
  saltar(b, ev) { ev.preventDefault(); const g = document.getElementById('g-' + b.dataset.v); if (g) g.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); },
  'l6-nueva'(b, ev, repintar) { abrirNuevaLista(repintar); },
  'l6-plantilla'(b, ev, repintar) { const p = PLANTILLAS[+b.dataset.v]; if (p) crearListaDe(p[0], p[1], repintar); },
  'r-nueva-checklist'(b, ev, repintar) { editarLista(null, repintar, (id) => { ui.lista = id; ui.ver = {}; location.hash = '#tareas/' + id; }, 'checklist'); },
  'r-lista-ir'(b) { ui.lista = b.dataset.id; ui.ver = {}; if (location.hash === '#tareas/' + b.dataset.id) return true; location.hash = '#tareas/' + b.dataset.id; },
  'r-lista'(b) { ui.lista = b.dataset.v; ui.ver = {}; ui.sel = null; return true; },
  'r-sel-ini'() { ui.sel = []; return true; },
  'r-sel-fin'() { ui.sel = null; return true; },
  'r-sel'(b) { if (!ui.sel) return; const i = ui.sel.indexOf(b.dataset.id); if (i < 0) ui.sel.push(b.dataset.id); else ui.sel.splice(i, 1); return true; },
  'r-sel-todos'() { const vis = pendientesVisibles(ui.lista).filter((x) => x.estado !== 'hecho').map((x) => x.id); ui.sel = ui.sel.length === vis.length ? [] : vis; return true; },
  'r-sel-hecho'(b, ev, repintar) { aplicarSel((id) => { const x = buscarElemento(id); if (x && x.estado !== 'hecho') marcar(id); }, '✓ Hechos', repintar); },
  'r-sel-borrar'(b, ev, repintar) { aplicarSel((id) => aPapelera(id), 'A la papelera', repintar); },
  'r-sel-dia'(b, ev, repintar) {
    const h = hoy(), lun = sumarDias(h, ((1 - diaSemana(h) + 7) % 7) || 7);
    const hoja = abrirHoja('Mover ' + ui.sel.length + (ui.sel.length === 1 ? ' recordatorio' : ' recordatorios'), '<div class="opciones dias">' +
      [[h, 'Hoy'], [sumarDias(h, 1), 'Mañana'], [sumarDias(h, 2), 'Pasado mañana'], [lun, 'El lunes'], [sumarDias(h, 7), 'En una semana']].map(([f, n]) => '<button type="button" class="opcion" data-f="' + f + '"><b>' + n + '</b><small>' + fmtCorta(f) + '</small></button>').join('') +
      '<button type="button" class="opcion" data-f=""><b>Algún día</b><small>sin fecha</small></button></div>');
    hoja.querySelectorAll('[data-f]').forEach((o) => o.addEventListener('click', () => aplicarSel((id) => mover(id, o.dataset.f || null), o.dataset.f ? 'Movidos a ' + fmtCorta(o.dataset.f) : 'A algún día', repintar)));
  },
  'r-sel-area'(b, ev, repintar) {
    const hoja = abrirHoja('¿A qué área?', '<div class="opciones">' + AREAS.map((a) => '<button type="button" class="opcion area-' + a.id + '" data-a="' + a.id + '"><b>' + esc(a.nombre) + '</b></button>').join('') + '</div>');
    hoja.querySelectorAll('[data-a]').forEach((o) => o.addEventListener('click', () => aplicarSel((id) => { const x = JSON.parse(JSON.stringify(buscarElemento(id))); x.area = o.dataset.a; poner(x); }, 'Pasados a ' + area(o.dataset.a).nombre, repintar)));
  },
  'r-nueva-lista'(b, ev, repintar) { editarLista(null, repintar, (id) => { irLista(id); }); },
  'r-editar-lista'(b, ev, repintar) { editarLista(ui.lista, repintar, (id) => { irLista(id); }); },
  'r-mas'(b) { const k = b.dataset.v; ui.ver[k] = cuantos(k) + (k === 'hecho' ? 30 : 100); return true; },
  'r-compartir'() {
    const l = buscarElemento(ui.lista); if (!l) return;
    const p = pendientesDe(l.id), check = esChecklist(l);
    const linea = (x) => (x.estado === 'hecho' ? '☑ ' : '☐ ') + x.titulo + (!check && x.fechas.inicio ? ' (' + fmtCorta(x.fechas.inicio) + ')' : '');
    compartir({ titulo: l.titulo, texto: l.titulo + '\n' + p.filter((x) => x.estado !== 'hecho').concat(check ? p.filter((x) => x.estado === 'hecho') : []).map(linea).join('\n') });
  },
  'r-duplicar'(b, ev, repintar) {
    const l = buscarElemento(ui.lista); if (!l) return;
    const n = crearLista({ titulo: l.titulo + ' (copia)', area: l.area, clase: l.extra.clase || 'checklist' }), t0 = Date.now();
    pendientesDe(l.id).sort((a, c) => (a.origen && c.origen ? a.origen.indice - c.origen.indice : a.creado - c.creado)).forEach((x, i) => poner(Object.assign(modeloVacio(), { id: nuevoId('pend'), tipo: 'pendiente', titulo: x.titulo, area: x.area, prioridad: x.prioridad, notas: x.notas, etiquetas: (x.etiquetas || []).slice(), lista: n.id, fechas: Object.assign(modeloVacio().fechas, { inicio: null }), creado: t0 + i })));
    irLista(n.id); repintar();
    aviso('Lista duplicada, todo sin marcar', () => { aPapelera(n.id); irLista(l.id); repintar(); });
  },
  'r-desmarcar-todo'(b, ev, repintar) {
    import('../datos/datos.js').then(({ poner }) => {
      pendientesDe(ui.lista).filter((x) => x.estado === 'hecho').forEach((x) => { const y = JSON.parse(JSON.stringify(x)); y.estado = 'pendiente'; y.extra.hechoEn = 0; poner(y); });
      repintar(); aviso('Lista lista para usar de nuevo');
    });
  }
};

/* Escribir: vista previa de lo que se entiende; Enter guarda (Shift+Enter, otra línea) */
export function alEscribir(t) {
  if (t.id !== 'nuevoRec') return false;
  const p = document.getElementById('pistaRec'), v = t.value.trim();
  if (!p) return true;
  const lineas = v.split('\n').filter((s) => s.trim());
  if (!v) { p.textContent = ''; return true; }
  if (lineas.length > 1) { p.textContent = 'Se crearán ' + lineas.length + ' recordatorios (uno por línea).'; return true; }
  const r = interpretar(v), bits = [];
  if (r.fecha) bits.push(fmtCorta(r.fecha)); if (r.algunDia) bits.push('algún día'); if (r.hora) bits.push(r.hora);
  if (r.prioridad) bits.push('prioridad ' + r.prioridad); if (r.area) bits.push(r.area); if (r.plazoLegal) bits.push('plazo legal'); r.etiquetas.forEach((e) => bits.push('#' + e));
  p.innerHTML = bits.length ? 'Se guardará: <b>' + esc(r.titulo || '…') + '</b> · ' + esc(bits.join(' · ')) : '';
  return true;
}
export function alEnviar(f, repintar) {
  if (f.dataset.form !== 'r-anadir') return false;
  const t = document.getElementById('nuevoRec'), v = t.value.trim();
  if (!v) { t.focus(); return true; }
  const l = ui.lista ? buscarElemento(ui.lista) : buscarElemento(LISTA_RECORDATORIOS);
  const c = crearDesdeTexto(v, { lista: l ? l.id : LISTA_RECORDATORIOS });
  repintar();
  aviso(c.length === 1 ? 'Agregado: ' + c[0].titulo : c.length + ' recordatorios agregados');
  const n = document.getElementById('nuevoRec'); if (n) n.focus();
  return true;
}
export function nuevoConEditor(repintar) {
  const l = ui.lista ? buscarElemento(ui.lista) : null;
  editarPendiente(null, repintar, Object.assign(modeloVacio(), { id: nuevoId('pend'), tipo: 'pendiente', area: l ? l.area : 'personal', lista: l ? l.id : LISTA_RECORDATORIOS, fechas: Object.assign(modeloVacio().fechas, { inicio: hoy() }) }));
}
