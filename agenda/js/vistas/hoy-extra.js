/* Lo que Hoy trae de la v4.5, respetando la temática de cada área:
   «Qué hacer ahora» (una sugerencia por área, con su color y su enlace),
   «Lo siguiente», «Mañana» y, desde las 6 p. m., «Tu día en números». */
import { diasEntre, hoy, sumarDias, minutosAhora, fmtHora, fmtCorta, relativo, horaAhora } from '../util/fechas.js';
import { esc, ico, plural } from '../util/dom.js';
import { leer, escribir } from '../datos/almacen.js';
import { elementos, buscarElemento } from '../datos/datos.js';
import { AREAS, area, chipArea } from '../datos/areas.js';
import { preferencias } from '../datos/preferencias.js';
import { proximoBloque, bloquesDelDia, todoElDia, diaDePago, pagado } from '../datos/calendario.js';
import { pendientesVisibles, hechosHoy } from '../datos/pendientes.js';
import { esDelLibro, esIngreso } from '../datos/finanzas.js';
import { fmtSoles } from '../util/dinero.js';
import { tarjeta } from './comun.js';
import { atrasados } from '../piezas/pendientes-ui.js';
import { habitosDeHoy } from './area-constancia.js';
import { marcasHabito } from '../datos/seguimiento.js';
import { senales as senPersonal } from './area-personal.js';
import { senales as senEstudios } from './area-estudios.js';
import { senales as senOficina } from './area-oficina.js';
import { senales as senDeporte } from './area-deporte.js';

const SENALES = { personal: senPersonal, estudios: senEstudios, oficina: senOficina, deporte: senDeporte };
const CLAVE_QH = 'agenda5_qh';
const PESO = { vencido: 0, pronto: 1, hoy: 1 };

function ocultas() { const o = leer(CLAVE_QH, null); return o && o.dia === hoy() && Array.isArray(o.k) ? o.k : []; }

/* Las sugerencias, de la más urgente a la menos */
export function sugerencias(ahoraMin = minutosAhora()) {
  const out = [], h = hoy();
  const atr = atrasados().length;
  if (atr) out.push({ k: 'atrasados', area: '', nivel: 'vencido', txt: '<b>' + plural(atr, 'pendiente atrasado', 'pendientes atrasados') + '</b>: decide qué hacer con cada uno', btn: 'Ordenar', acc: 'data-acc="ordenar"' });
  AREAS.forEach((a) => {
    let s = [];
    try { s = (SENALES[a.id] ? SENALES[a.id]() : []).filter((x) => PESO[x.nivel] != null); } catch (e) { s = []; }
    s.sort((x, y) => (y.legal ? 1 : 0) - (x.legal ? 1 : 0) || PESO[x.nivel] - PESO[y.nivel]);
    if (s[0]) out.push({ k: 'area-' + a.id + '-' + s[0].txt, area: a.id, nivel: s[0].nivel, txt: esc(s[0].txt) + (s.length > 1 ? ' <small>y ' + (s.length - 1) + ' más</small>' : ''), btn: 'Ver', acc: 'href="' + (s[0].link || '#areas/' + a.id + (s[0].ir ? '/' + s[0].ir : '')) + '"' });
  });
  const ym = h.slice(0, 7), venc = elementos((x) => x.tipo === 'pago' && x.extra.activo !== false && !pagado(x, ym)).map((p) => ({ p, d: diaDePago(p, ym) })).filter((x) => x.d && diasEntre(h, x.d) <= 2).sort((a, b) => a.d.localeCompare(b.d));
  if (venc.length) { const x = venc[0], dd = diasEntre(h, x.d), li = area(x.p.area).id === 'oficina' ? 'oficina' : 'personal';
    out.push({ k: 'pago-' + x.p.id + ym, area: li, nivel: dd < 0 ? 'vencido' : 'pronto', txt: 'Pago de <b>' + esc(x.p.titulo) + '</b> ' + (dd < 0 ? 'vencido' : dd === 0 ? 'vence hoy' : dd === 1 ? 'vence mañana' : 'vence en 2 días') + (venc.length > 1 ? ' <small>y ' + (venc.length - 1) + ' más</small>' : ''), btn: 'Pagar', acc: 'href="#finanzas' + (li === 'oficina' ? '/oficina' : '') + '"' }); }
  const gastoHoy = elementos((x) => esDelLibro(x, 'personal') && !esIngreso(x) && x.fechas.inicio === h).length;
  if (!gastoHoy && ahoraMin >= 13 * 60) out.push({ k: 'gasto', area: 'personal', nivel: 'ok', txt: '¿Gastaste algo hoy? <b>Anótalo</b> en segundos', btn: 'Anotar', acc: 'data-acc="hoy-gasto"' });
  const dia = elementos((x) => x.tipo === 'diario' && x.fechas.inicio === h)[0];
  if (ahoraMin >= 20 * 60 && !(dia && dia.notas)) out.push({ k: 'diario', area: 'personal', nivel: 'ok', txt: 'Cierra el día: <b>cuenta cómo te fue</b>', btn: 'Escribir', acc: 'href="#notas/diario"' });
  return out;
}

export function tarjetaQueHacer() {
  const oc = ocultas(), todas = sugerencias(), l = todas.filter((x) => !oc.includes(x.k)), escondidas = todas.length - l.length;
  return tarjeta({ eti: 'AHORA', titulo: 'Qué hacer ahora', n: l.length || null, clase: 'qh',
    guia: '<b>Una sugerencia por área</b>, con su color, y lo que conviene hacer a esta hora. Toca la ✕ para no verla más hoy.',
    cuerpo: (l.length ? '<div class="qh-lista">' + l.slice(0, 6).map((x) => '<div class="qh-fila' + (x.area ? ' area-' + area(x.area).id : '') + (x.nivel === 'vencido' ? ' venc' : '') + '">' +
      '<i class="qh-punto" aria-hidden="true"></i><span class="qh-txt">' + (x.area ? chipArea(x.area) + ' ' : '') + x.txt + '</span>' +
      (x.acc.startsWith('href') ? '<a class="btn chico" ' + x.acc + '>' + x.btn + '</a>' : '<button type="button" class="btn chico" ' + x.acc + '>' + x.btn + '</button>') +
      '<button type="button" class="icono-btn qh-x" data-acc="qh-ocultar" data-k="' + esc(x.k) + '" aria-label="Ahora no (vuelve mañana)">' + ico('i-x') + '</button></div>').join('') + '</div>'
      : '<p class="qh-ok">Todo al día. 👌</p>') +
      (escondidas ? '<div class="fila-botones izq"><button type="button" class="btn chico" data-acc="qh-mostrar">Mostrar ' + (escondidas === 1 ? 'la oculta' : 'las ' + escondidas + ' ocultas') + '</button></div>' : '') });
}

function enCuanto(m) { return m <= 0 ? 'ahora' : m < 60 ? 'en ' + m + ' min' : 'en ' + Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : ''); }
export function tarjetaSiguiente() {
  const p = preferencias(), h = hoy(), s = proximoBloque(h, minutosAhora());
  if (!s) return '';
  const b = s.b, acc = b.tipo === 'pendiente' ? 'p-editar' : b.tipo === 'evento' ? 'ev-editar' : 'dato-ver';
  const cuando = s.dia === h ? (s.enCurso ? 'En curso · hasta las ' + fmtHora(b.hFin, p.formatoHora) : enCuanto(s.faltan)) : relativo(s.dia) + ' · ' + fmtHora(b.hIni, p.formatoHora);
  return '<button type="button" class="tarjeta siguiente area-' + area(b.area).id + (s.enCurso ? ' en-curso' : '') + '" data-acc="' + acc + '" data-id="' + esc(b.id) + '">' +
    '<small class="eti">' + (s.enCurso ? '● AHORA MISMO' : 'LO SIGUIENTE') + '</small><b>' + esc(b.titulo) + '</b>' +
    '<span class="sig-cuando">' + esc(cuando) + '</span><span class="pend-meta">' + chipArea(b.area) + '<span class="mono">' + fmtHora(b.hIni, p.formatoHora) + '–' + fmtHora(b.hFin, p.formatoHora) + '</span>' +
    (b.tipo === 'clase' ? '<span>clase</span>' : '') + (b.lugar ? '<span>' + esc(b.lugar) + '</span>' : '') + '</span></button>';
}

/* Mañana, separado por área */
export function tarjetaManana() {
  const m = sumarDias(hoy(), 1), p = preferencias();
  const bl = bloquesDelDia(m), td = todoElDia(m);
  const pend = pendientesVisibles().filter((x) => x.estado !== 'hecho' && x.fechas.inicio === m && !x.fechas.hora);
  const total = bl.length + td.length + pend.length;
  const porArea = AREAS.map((a) => {
    const cosas = td.filter((x) => area(x.area).id === a.id).map((x) => esc(x.titulo))
      .concat(bl.filter((x) => area(x.area).id === a.id).map((x) => '<span class="mono">' + fmtHora(x.hIni, p.formatoHora) + '</span> ' + esc(x.titulo)))
      .concat(pend.filter((x) => area(x.area).id === a.id).map((x) => esc(x.titulo)));
    return cosas.length ? '<div class="man-area area-' + a.id + '"><a class="man-tit" href="#areas/' + a.id + '">' + a.nombre + ' <span class="mono">' + cosas.length + '</span></a><ul>' + cosas.slice(0, 3).map((c) => '<li>' + c + '</li>').join('') + (cosas.length > 3 ? '<li class="tenue">y ' + (cosas.length - 3) + ' más</li>' : '') + '</ul></div>' : '';
  }).join('');
  return tarjeta({ eti: 'MAÑANA', titulo: 'Mañana · ' + fmtCorta(m), n: total,
    guia: '<b>Prepárate desde hoy.</b> Lo de mañana, separado por área. Toca «Ver el día» para planearlo en la Agenda.',
    cuerpo: (total ? (bl[0] ? '<p class="man-res">Empiezas a las <b>' + fmtHora(bl[0].hIni, p.formatoHora) + '</b>.</p>' : '') + '<div class="man-areas">' + porArea + '</div>' : '<p class="qh-ok">Mañana lo tienes libre. 🌿</p>') +
      '<div class="pie-tarjeta"><button type="button" class="btn chico" data-acc="ir-dia" data-dia="' + m + '">' + ico('i-agenda') + 'Ver el día</button></div>' });
}

/* Desde las 6 p. m.: tu día en números, por área */
export function tarjetaNumeros(ahoraMin = minutosAhora()) {
  if (ahoraMin < 18 * 60) return '';
  const h = hoy(), hechos = hechosHoy(h);
  const habs = habitosDeHoy(), habOk = habs.filter((x) => marcasHabito(x)[h]).length;
  const gasto = elementos((x) => x.tipo === 'movimiento' && !esIngreso(x) && x.fechas.inicio === h).reduce((s, x) => s + (x.monto || 0), 0);
  const ent = elementos((x) => x.tipo === 'entreno' && x.fechas.inicio === h);
  const cifra = (v, t, a) => '<div class="' + (a ? 'area-' + a : '') + '"><b>' + v + '</b><small>' + t + '</small></div>';
  return tarjeta({ eti: 'CIERRE', titulo: 'Tu día en números', guia: '<b>Un vistazo antes de dormir.</b> Si quieres, escribe cómo te fue en el diario.',
    cuerpo: '<div class="num-dia">' + cifra(hechos.length, 'hechos hoy') + (habs.length ? cifra(habOk + '/' + habs.length, 'hábitos') : '') + cifra(fmtSoles(gasto), 'gastado', 'personal') +
      (ent.length ? cifra(ent.length, ent.length === 1 ? 'entreno' : 'entrenos', 'deporte') : '') + '</div>' +
      '<div class="pie-tarjeta"><a class="btn chico" href="#notas/diario">' + ico('i-nota') + 'Contar cómo te fue</a></div>' });
}

export const acciones = {
  'qh-ocultar'(b) { escribir(CLAVE_QH, { dia: hoy(), k: ocultas().concat([b.dataset.k]) }); return true; },
  'qh-mostrar'() { escribir(CLAVE_QH, { dia: hoy(), k: [] }); return true; },
  'hoy-gasto'() { import('../piezas/agregar-rapido.js').then((m) => m.abrirAgregar('gasto')); }
};
