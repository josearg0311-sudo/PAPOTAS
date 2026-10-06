/* RECORDATORIOS: tus listas con casillas, ordenadas por CUÁNDO.
   Grupos: Para hoy · Más tarde · Mañana · Próximos días · Algún día · Hecho.
   Las listas «para marcar» (compras, maleta) se ven como checklist simple. */
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
import { modeloVacio, nuevoId } from '../datos/modelo.js';

/* Con muchos pendientes se muestran por tandas (pintar mil filas traba el celular) */
const TANDA = { hecho: 8, otro: 40 };
const ui = { lista: '', ver: {}, sel: null };
const cuantos = (k) => ui.ver[k] || (k === 'hecho' ? TANDA.hecho : TANDA.otro);
const VACIOS = { hoy: 'Nada pendiente para hoy. 👌', tarde: 'Lo que pases a «Más tarde» aparece aquí.', manana: 'Mañana lo tienes libre.', prox: 'Nada programado para los próximos días.', algun: 'Ideas sin fecha: guárdalas aquí para no olvidarlas.', hecho: 'Lo que marques como hecho baja aquí.' };

export function irALista(id) { ui.lista = id || ''; }

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

export function vistaRecordatorios() {
  const h = hoy(), l = ui.lista ? buscarElemento(ui.lista) : null;
  if (ui.lista && (!l || l.borrado)) ui.lista = '';
  const lsts = listas(), check = esChecklist(l);
  const todos = pendientesVisibles(ui.lista);
  const pend = (id) => (id ? pendientesDe(id) : pendientesVisibles()).filter((x) => x.estado !== 'hecho').length;

  let html = '<div class="listas" role="group" aria-label="Tus listas">' +
    '<button type="button" class="lista-btn" data-acc="r-lista" data-v="" aria-pressed="' + !ui.lista + '">Todos <span class="n">' + pend('') + '</span></button>' +
    lsts.map((x) => '<button type="button" class="lista-btn area-' + x.area + (esChecklist(x) ? ' check' : '') + '" data-acc="r-lista" data-v="' + esc(x.id) + '" aria-pressed="' + (ui.lista === x.id) + '"><i aria-hidden="true"></i>' + esc(x.titulo) + ' <span class="n">' + pend(x.id) + '</span></button>').join('') +
    '<button type="button" class="lista-btn nueva" data-acc="r-nueva-lista">' + ico('i-plus') + 'Nueva lista</button></div>';

  const cuenta = {}; GRUPOS.forEach((g) => { cuenta[g[0]] = 0; });
  todos.forEach((x) => { cuenta[grupo(x)]++; });
  const vencidos = todos.filter((x) => atrasado(x)).length;

  html += tarjeta({
    eti: l ? (check ? 'LISTA PARA MARCAR' : 'LISTA') : 'TODAS LAS LISTAS',
    titulo: l ? esc(l.titulo) + (l.extra.sistema ? '' : ' <button type="button" class="icono-btn mini" data-acc="r-editar-lista" aria-label="Editar lista">' + ico('i-lapiz') + '</button>') : 'Todos mis recordatorios',
    clase: l ? 'area-' + l.area : '',
    guia: check ? '<b>Lista para marcar:</b> toca la casilla de lo que ya tienes o ya hiciste. No usa días.' : '<b>Cómo funciona:</b> toca la casilla cuando lo hagas. Si hoy no da, usa <b>Más tarde</b>, <b>Mañana</b> o <b>Día…</b>, o desliza con el dedo: a la derecha lo marcas, a la izquierda pasa a mañana. Al final del día, <b>Cerrar el día</b> pasa lo pendiente a mañana.',
    cuerpo: (check ? '' : '<div class="medidor" role="group" aria-label="Cuántos hay en cada momento">' + GRUPOS.map((g) =>
        '<a class="medidor-btn' + (g[0] === 'hoy' && vencidos ? ' rojo' : g[0] === 'hecho' ? ' verde' : '') + '" href="#recordatorios" data-acc="saltar" data-v="' + g[0] + '"><b>' + cuenta[g[0]] + '</b><small>' + g[1] + '</small></a>').join('') + '</div>') +
      '<form class="anadir" data-form="r-anadir"><label for="nuevoRec" class="solo-lector">Nuevo recordatorio</label>' +
      '<textarea id="nuevoRec" rows="1" placeholder="' + (check ? 'Agregar… (una cosa por línea)' : 'Nuevo… ej. «llamar al notario mañana 10am». Pega varias líneas para crear varios.') + '" enterkeyhint="done"></textarea>' +
      '<button type="submit" class="btn pri" aria-label="Agregar">' + ico('i-plus') + '</button></form><p class="pista" id="pistaRec" aria-live="polite"></p>'
  });

  if (check) {
    const p = todos.filter((x) => x.estado !== 'hecho').sort((a, b) => (a.origen && b.origen ? a.origen.indice - b.origen.indice : a.creado - b.creado));
    const hechos = todos.filter((x) => x.estado === 'hecho');
    html += '<section class="tarjeta grupo"><div class="grupo-tit"><span>Por marcar</span><span class="linea"></span><span class="mono">' + p.length + '</span></div>' + (p.length ? '<div class="pends">' + p.slice(0, cuantos('marcar')).map((x) => filaPendiente(x, { acciones: false })).join('') + '</div>' + masBoton('marcar', p.length, Math.min(p.length, cuantos('marcar'))) : vacio('', '¡Todo marcado! 🎉')) + '</section>' +
      '<section class="tarjeta grupo"><div class="grupo-tit"><span>Hecho</span><span class="linea"></span><span class="mono">' + hechos.length + '</span></div>' + (hechos.length ? '<div class="pends">' + hechos.slice(0, cuantos('hecho')).map((x) => filaPendiente(x, { acciones: false })).join('') + '</div>' + masBoton('hecho', hechos.length, Math.min(hechos.length, cuantos('hecho'))) + '<div class="fila-botones izq pie-grupo"><button type="button" class="btn chico" data-acc="r-desmarcar-todo">' + ico('i-deshacer') + 'Desmarcar todo para volver a usarla</button></div>' : vacio('', VACIOS.hecho)) + '</section>';
    return html;
  }

  GRUPOS.forEach(([k, nom]) => {
    let g = todos.filter((x) => grupo(x) === k);
    if (k === 'hecho') g.sort((a, b) => hechoEn(b) - hechoEn(a)); else g.sort(ordenar);
    const total = g.length;
    g = g.slice(0, cuantos(k));
    const sub = k === 'hoy' ? ' · ' + fmtCorta(h) : k === 'manana' ? ' · ' + fmtCorta(sumarDias(h, 1)) : '';
    html += '<section class="tarjeta grupo" id="g-' + k + '"><div class="grupo-tit' + (k === 'hoy' && vencidos ? ' rojo' : '') + '"><span>' + nom + sub + '</span><span class="linea"></span><span class="mono">' + total + '</span></div>' +
      (k === 'hoy' && vencidos && !ui.sel ? '<div class="ordenar-cta"><span>🧹 <b>' + vencidos + (vencidos === 1 ? ' atrasado' : ' atrasados') + '</b>: decide qué hacer con cada uno</span><button type="button" class="btn chico pri" data-acc="ordenar">Ordenar</button></div>' : '') +
      (g.length ? '<div class="pends">' + g.map((x) => (ui.sel && k !== 'hecho' ? filaSel(x) : filaPendiente(x, { verLista: !ui.lista }))).join('') + '</div>' : vacio('', VACIOS[k])) +
      masBoton(k, total, g.length) + '</section>';
  });
  html += '<div class="fila-botones izq"><button type="button" class="btn" data-acc="cerrar-dia">' + ico('i-luna2') + 'Cerrar el día: pasar lo pendiente a mañana</button>' +
    '<button type="button" class="btn" data-acc="r-sel-ini">' + ico('i-check') + 'Elegir varios</button></div>';
  if (ui.sel) html += barraSel();
  return html;
}

export const acciones = {
  saltar(b, ev) { ev.preventDefault(); const g = document.getElementById('g-' + b.dataset.v); if (g) g.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); },
  'r-lista-ir'(b) { ui.lista = b.dataset.id; ui.ver = {}; if (location.hash !== '#recordatorios') location.hash = '#recordatorios'; else return true; },
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
  'r-nueva-lista'(b, ev, repintar) { editarLista(null, repintar, (id) => { ui.lista = id; }); },
  'r-editar-lista'(b, ev, repintar) { editarLista(ui.lista, repintar, (id) => { ui.lista = id; }); },
  'r-mas'(b) { const k = b.dataset.v; ui.ver[k] = cuantos(k) + (k === 'hecho' ? 30 : 100); return true; },
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
