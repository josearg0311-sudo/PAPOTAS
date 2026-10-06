/* FINANZAS: tus dos libros de cuentas dentro de la app, cada uno con su
   temática y su color: el PERSONAL (con lo de Estudios y Deporte, cada uno
   en su área) y el de la OFICINA. Nunca se mezclan.
   Direcciones: #finanzas (personal) y #finanzas/oficina */
import { elementos, buscarElemento, documento, cambiarPerfil, aPapelera } from '../datos/datos.js';
import { AREAS, area } from '../datos/areas.js';
import { LIBROS, CATEGORIAS, areaDeCategoria, esDelLibro, esIngreso, delMes, resumenMes, historial, estadoPresupuesto, csv, analisisMes, repetidos } from '../datos/finanzas.js';
import { diaDePago, pagado } from '../datos/calendario.js';
import { val, resumenPrestamos } from '../datos/herramientas.js';
import { hoy, fmtCorta, fmtFecha, MESES, diasEntre, inicioSemana } from '../util/fechas.js';
import { preferencias } from '../datos/preferencias.js';
import { fmtSoles, solesCorto } from '../util/dinero.js';
import { esc, ico, vacio, plural, explica } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { fila, filas, emoji, casilla, pildora, cifra, cifras, cambiarExtra, nuevo, borrar, boton, pie } from './area-comun.js';
import { editar } from '../piezas/formulario.js';
import { guardarArchivo } from '../datos/respaldo.js';
import { aviso } from '../piezas/aviso.js';
import { cerrarHoja } from '../piezas/hoja.js';

const ui = { mes: '', cat: '', ver: 30 };
const COLOR = { personal: 'personal', oficina: 'oficina' };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const nombreMes = (ym) => cap(MESES[+ym.slice(5) - 1]) + ' ' + ym.slice(0, 4);
const sumarMes = (ym, n) => { let [y, m] = ym.split('-').map(Number); m += n; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + '-' + String(m).padStart(2, '0'); };
const movs = (libro) => elementos((x) => esDelLibro(x, libro));
const libroDePago = (p) => (p.area === 'oficina' ? 'oficina' : 'personal');
const presupuestoDe = (libro) => { const d = documento(); return d && d.perfil && d.perfil.presupuesto ? +d.perfil.presupuesto[libro] || 0 : 0; };
const categoriasUsadas = (libro, ingreso) => [...new Set(CATEGORIAS[libro][ingreso ? 'ingreso' : 'gasto'].concat(movs(libro).filter((x) => esIngreso(x) === ingreso).map((x) => x.extra.categoria).filter(Boolean)))];

function pestanas(libro) {
  return '<nav class="fichas pestanas libros" aria-label="Libros de cuentas">' + Object.keys(LIBROS).map((l) =>
    '<a href="#finanzas' + (l === 'oficina' ? '/oficina' : '') + '" class="ficha-area area-' + COLOR[l] + '"' + (l === libro ? ' aria-current="page"' : '') + '>' + LIBROS[l] + '</a>').join('') + '</nav>';
}
function navMes(ym) {
  const act = hoy().slice(0, 7);
  return '<div class="cal-nav"><button type="button" class="icono-btn" data-acc="fin-mes" data-n="-1" aria-label="Mes anterior">' + ico('i-izq') + '</button><b>' + nombreMes(ym) + '</b>' +
    '<button type="button" class="icono-btn" data-acc="fin-mes" data-n="1" aria-label="Mes siguiente"' + (ym >= act ? ' disabled' : '') + '>' + ico('i-der') + '</button>' + (ym !== act ? '<button type="button" class="btn chico" data-acc="fin-mes" data-n="0">Hoy</button>' : '') + '</div>';
}

/* Barras horizontales: un solo color (el del libro), valores escritos en texto */
function barras(lista, max, acc) {
  return '<div class="barras">' + lista.map((c) => '<button type="button" class="barra-fila' + (ui.cat === c.cat ? ' activa' : '') + '" data-acc="' + acc + '" data-v="' + esc(c.cat) + '" aria-pressed="' + (ui.cat === c.cat) + '">' +
    '<span class="bf-nom">' + esc(c.cat) + '</span><span class="bf-barra" aria-hidden="true"><i style="width:' + Math.max(2, c.monto / max * 100).toFixed(1) + '%"></i></span><span class="bf-val mono">' + fmtSoles(c.monto) + ' · ' + c.pct + ' %</span></button>').join('') + '</div>';
}

function filaMov(x) {
  const ing = esIngreso(x);
  return fila({ titulo: x.titulo || (ing ? 'Ingreso' : 'Gasto'), acc: 'fin-editar', id: x.id,
    meta: fmtCorta(x.fechas.inicio) + (x.extra.categoria ? ' · ' + esc(x.extra.categoria) : '') + (x.area !== 'personal' && x.area !== 'oficina' ? ' <span class="chip area-' + area(x.area).id + '">' + area(x.area).nombre + '</span>' : '') + (x.extra.desde ? ' <span class="pill">automático</span>' : ''),
    final: '<b class="mono monto ' + (ing ? 'ingreso' : 'gasto') + '">' + (ing ? '+' : '−') + fmtSoles(Math.abs(+x.monto || 0)) + '</b>' });
}

function vistaLibro(libro) {
  const ym = ui.mes || hoy().slice(0, 7), todos = movs(libro), r = resumenMes(todos, ym), pres = estadoPresupuesto(r.gastos, presupuestoDe(libro));
  const delM = todos.filter((x) => delMes(x, ym) && (!ui.cat || (!esIngreso(x) && ((x.extra.categoria || 'Sin categoría') === ui.cat) ))).sort((a, b) => (b.fechas.inicio || '').localeCompare(a.fechas.inicio || '') || b.actualizado - a.actualizado);
  const pagos = elementos((x) => x.tipo === 'pago' && libroDePago(x) === libro && x.extra.activo !== false).map((p) => ({ p, dia: diaDePago(p, ym), ok: pagado(p, ym) })).filter((x) => !(val(x.p, 'desde', '') > ym)).sort((a, b) => a.dia.localeCompare(b.dia));
  const hist0 = historial(todos, ym, 6), primero = hist0.findIndex((h) => h.n), hist = primero < 0 ? hist0.slice(-1) : hist0.slice(primero), maxH = Math.max(1, ...hist.map((h) => Math.max(h.ingresos, h.gastos)));
  const a = COLOR[libro], h = hoy().slice(0, 7), ant = resumenMes(todos, sumarMes(ym, -1)), gastoHoy = todos.filter((x) => !esIngreso(x) && x.fechas.inicio === hoy()).reduce((s2, x) => s2 + Math.abs(+x.monto || 0), 0);
  return pestanas(libro) +
    '<section class="tarjeta din-heroe area-' + a + '">' + navMes(ym) +
      '<h2 class="solo-lector">' + LIBROS[libro] + '</h2>' +
      '<div class="din-cols"><div class="din-col"><b class="din-num gasto">' + fmtSoles(r.gastos) + '</b><small>gastado ' + (ym === h ? 'este mes' : 'en ' + MESES[+ym.slice(5) - 1]) + '</small>' +
        '<span class="din-barra rojo" aria-hidden="true"><i style="width:' + Math.min(100, presupuestoDe(libro) ? r.gastos / presupuestoDe(libro) * 100 : r.ingresos ? r.gastos / r.ingresos * 100 : 0).toFixed(0) + '%"></i></span>' +
        '<small>' + (ym === h ? fmtSoles(gastoHoy) + ' hoy' : r.n + ' movimientos') + '</small>' +
        '<button type="button" class="btn pri ancho" data-acc="fin-nuevo" data-libro="' + libro + '" data-ing="0">' + ico('i-plus') + 'Gasto</button></div>' +
      '<div class="din-col"><b class="din-num ingreso">' + fmtSoles(r.ingresos) + '</b><small>ingresó ' + (ym === h ? 'este mes' : 'en ' + MESES[+ym.slice(5) - 1]) + '</small>' +
        '<span class="din-barra verde" aria-hidden="true"><i style="width:' + Math.min(100, ant.ingresos ? r.ingresos / ant.ingresos * 100 : r.ingresos ? 100 : 0).toFixed(0) + '%"></i></span>' +
        '<small>Mes pasado: ' + solesCorto(ant.ingresos) + '</small>' +
        '<button type="button" class="btn ancho btn-ingreso" data-acc="fin-nuevo" data-libro="' + libro + '" data-ing="1">' + ico('i-plus') + 'Ingreso</button></div></div>' +
      '<div class="din-queda"><span>' + (r.saldo < 0 ? 'Gastaste más de lo que entró' : 'Te queda ' + (ym === h ? 'este mes' : 'de ese mes')) + '</span><b class="' + (r.saldo < 0 ? 'txt-aviso' : '') + '">' + (r.saldo < 0 ? '−' : '') + fmtSoles(Math.abs(r.saldo)) + '</b></div>' +
      (pres ? '<div class="presupuesto ' + pres.nivel + '"><div class="pr-txt"><b>Presupuesto: ' + pres.pct + ' %</b><small>' + fmtSoles(r.gastos) + ' de ' + fmtSoles(presupuestoDe(libro)) + (pres.queda >= 0 ? ' · te quedan ' + fmtSoles(pres.queda) : ' · te pasaste por ' + fmtSoles(-pres.queda)) + '</small></div><span class="progreso"><i style="width:' + Math.min(100, pres.pct) + '%"></i></span></div>' : '') +
      '<div class="pie-tarjeta"><button type="button" class="btn" data-acc="fin-presupuesto" data-libro="' + libro + '">' + ico('i-meta') + (pres ? 'Presupuesto' : 'Poner presupuesto') + '</button></div>' +
    '</section>' + tarjetaComoVas(libro, todos, ym, r) +
    '<div class="columnas"><div>' +
    tarjeta({ eti: 'PAGOS FIJOS', titulo: 'Pagos fijos de ' + MESES[+ym.slice(5) - 1], n: pagos.filter((x) => x.ok).length + '/' + pagos.length, clase: 'area-' + a,
      guia: 'Lo que pagas cada mes. Al marcarlo pagado se anota el gasto en este libro.',
      cuerpo: (pagos.length ? filas(pagos.map(({ p, dia, ok }) => { const n = diasEntre(hoy(), dia);
        return fila({ inicio: casilla(ok, 'cal-pago', p.id, (ok ? 'Desmarcar: ' : 'Pagado: ') + p.titulo, ' data-ym="' + ym + '"'), titulo: (val(p, 'em', '') ? val(p, 'em', '') + ' ' : '') + p.titulo, acc: 'pago-editar', id: p.id, clase: ok ? 'hecha' : '',
          meta: '<b class="mono">' + fmtSoles(p.monto || 0) + '</b> · día ' + +dia.slice(8) + ' ' + (ok ? '<span class="pill">pagado</span>' : n < 0 ? pildora('vencido', 'venció ' + fmtCorta(dia)) : n <= 3 ? pildora('pronto', n === 0 ? 'vence hoy' : 'en ' + plural(n, 'día', 'días')) : '') }); })) : vacio('Sin pagos fijos', 'Agrega la luz, el internet, el alquiler… y te avisaré antes de que venzan.')) +
        pie(boton('Nuevo pago fijo', 'pago-nuevo', '', ' data-libro="' + libro + '"')) }) +
    tarjeta({ eti: 'EN QUÉ SE VA', titulo: 'Gastos por categoría', clase: 'area-' + a,
      guia: 'Toca una categoría para ver solo sus movimientos.',
      cuerpo: r.porCategoria.length ? barras(r.porCategoria, r.porCategoria[0].monto, 'fin-cat') + (ui.cat ? '<div class="pie-tarjeta"><button type="button" class="btn chico" data-acc="fin-cat" data-v="">Ver todas</button></div>' : '') : vacio('', 'Sin gastos este mes.') }) +
    (libro === 'personal' && Object.keys(r.porArea).length > 1 ? tarjeta({ eti: 'POR ÁREA', titulo: 'Cada área con sus gastos', clase: 'area-personal',
      guia: 'Lo de Estudios y Deporte se cuenta en su área, aunque salga de tu libro personal.',
      cuerpo: '<div class="barras">' + AREAS.filter((ar) => r.porArea[ar.id]).map((ar) => '<a class="barra-fila area-' + ar.id + '" href="#areas/' + ar.id + '"><span class="bf-nom">' + ar.nombre + '</span><span class="bf-barra" aria-hidden="true"><i style="width:' + (r.porArea[ar.id] / r.gastos * 100).toFixed(1) + '%"></i></span><span class="bf-val mono">' + fmtSoles(r.porArea[ar.id]) + '</span></a>').join('') + '</div>' }) : '') +
    tarjetaRepetidos(libro, todos, ym) + enlaceTematico(libro) +
    '</div><div>' +
    tarjeta({ eti: 'MOVIMIENTOS', titulo: ui.cat ? esc(ui.cat) : 'Movimientos de ' + MESES[+ym.slice(5) - 1], n: delM.length, clase: 'area-' + a,
      cuerpo: (delM.length ? filas(delM.slice(0, ui.ver).map(filaMov)) + (delM.length > ui.ver ? '<div class="pie-tarjeta"><button type="button" class="btn" data-acc="fin-mas">Ver más (' + (delM.length - ui.ver) + ')</button></div>' : '') : vacio('Sin movimientos', 'Anota un gasto o un ingreso con los botones de arriba.')) +
        pie('<button type="button" class="btn" data-acc="fin-csv" data-libro="' + libro + '">' + ico('i-bajar') + 'Bajar el libro (Excel)</button>') }) +
    tarjeta({ eti: 'INFORME', titulo: hist.length > 1 ? 'Últimos ' + hist.length + ' meses' : 'Este mes', clase: 'area-' + a,
      cuerpo: '<table class="informe"><thead><tr><th scope="col">Mes</th><th scope="col">Ingresos</th><th scope="col">Gastos</th><th scope="col">Saldo</th></tr></thead><tbody>' +
        hist.map((h) => '<tr' + (h.ym === ym ? ' class="actual"' : '') + '><th scope="row"><button type="button" class="enlace" data-acc="fin-ir-mes" data-v="' + h.ym + '">' + cap(MESES[+h.ym.slice(5) - 1]).slice(0, 3) + (h.ym.slice(0, 4) !== hoy().slice(0, 4) ? ' ' + h.ym.slice(2, 4) : '') + '</button></th>' +
          '<td class="mono">' + fmtSoles(h.ingresos) + '</td><td class="mono"><span class="mini-barra" aria-hidden="true"><i style="width:' + (h.gastos / maxH * 100).toFixed(0) + '%"></i></span>' + fmtSoles(h.gastos) + '</td><td class="mono ' + (h.saldo < 0 ? 'txt-aviso' : 'txt-ok') + '">' + (h.saldo < 0 ? '−' : '+') + fmtSoles(Math.abs(h.saldo)) + '</td></tr>').join('') + '</tbody></table>' +
        pie('<button type="button" class="btn" data-acc="fin-imprimir" data-libro="' + libro + '">' + ico('i-bajar') + 'Imprimir o guardar en PDF</button>') }) +
    '</div></div>';
}
/* Cómo vas: comparado con el mes pasado al mismo día, mayor gasto, proyección,
   cuánto puedes gastar por día y lo de esta semana */
function tarjetaComoVas(libro, todos, ym, r) {
  const h = hoy(), an = analisisMes(todos, ym, h, presupuestoDe(libro), inicioSemana(h, preferencias().semanaLunes !== false));
  if (!r.gastos && !an.antes) return '';
  const mesAnt = MESES[(+ym.slice(5) + 10) % 12], l = [];
  if (an.antes || an.ahora) {
    const mas = an.dif > 0, igual = Math.abs(an.dif) < 100;
    l.push(['📊', igual ? 'Gastas casi lo mismo que en ' + mesAnt : 'Llevas <b>' + fmtSoles(Math.abs(an.dif)) + (mas ? ' más' : ' menos') + '</b> que en ' + mesAnt + (an.pct != null ? ' (' + (mas ? '+' : '−') + Math.abs(an.pct) + ' %)' : ''),
      an.actual ? 'Del 1 al ' + an.dia + ': ' + fmtSoles(an.ahora) + ' ahora · ' + fmtSoles(an.antes) + ' en ' + mesAnt : fmtSoles(an.ahora) + ' en el mes · ' + fmtSoles(an.antes) + ' en ' + mesAnt, mas && !igual ? 'aviso' : 'ok']);
  }
  if (an.mayor) l.push(['🔝', 'Tu mayor gasto: <b>' + esc(an.mayor.titulo || 'Gasto') + '</b>', fmtSoles(Math.abs(+an.mayor.monto || 0)) + ' · ' + fmtCorta(an.mayor.fechas.inicio) + (an.mayor.extra.categoria ? ' · ' + esc(an.mayor.extra.categoria) : ''), '']);
  if (an.proyeccion != null) { const pr = presupuestoDe(libro), pasa = pr && an.proyeccion > pr;
    l.push(['🔮', 'Si sigues así, cerrarás el mes en <b>' + fmtSoles(an.proyeccion) + '</b>', pr ? (pasa ? 'Te pasarías del presupuesto por ' + fmtSoles(an.proyeccion - pr) : 'Dentro de tu presupuesto (' + fmtSoles(pr) + ')') : 'Según lo que gastas por día (los pagos fijos y gastos grandes se cuentan una vez)', pasa ? 'aviso' : '']); }
  if (an.porDia != null) l.push(['🗓️', an.porDia > 0 ? 'Puedes gastar <b>' + fmtSoles(an.porDia) + ' por día</b>' : '<b>Ya no te queda presupuesto</b> este mes', 'Para no pasarte en los ' + an.quedan + ' días que quedan (con hoy)', an.porDia > 0 ? 'ok' : 'aviso']);
  if (an.semana != null) l.push(['📅', 'Esta semana: <b>' + fmtSoles(an.semana) + '</b>', 'Desde el ' + fmtCorta(inicioSemana(h, preferencias().semanaLunes !== false)), '']);
  return tarjeta({ eti: 'CÓMO VAS', titulo: an.actual ? 'Tu mes hasta hoy' : 'Cómo te fue en ' + MESES[+ym.slice(5) - 1], clase: 'area-' + COLOR[libro],
    guia: 'Se compara con el mes pasado <b>hasta el mismo día</b>, para que sea justo. La proyección cuenta una sola vez los pagos fijos y los gastos grandes (como el alquiler).',
    cuerpo: '<ul class="como-vas">' + l.map(([e, t, s, c]) => '<li' + (c ? ' class="cv-' + c + '"' : '') + '><span class="cv-em" aria-hidden="true">' + e + '</span><span><b class="cv-t">' + t + '</b><small>' + s + '</small></span></li>').join('') + '</ul>' });
}
/* Gastos que se repiten cada mes → pasarlos a pago fijo con un toque */
function tarjetaRepetidos(libro, todos, ym) {
  if (ym !== hoy().slice(0, 7)) return '';
  const pagos = elementos((x) => x.tipo === 'pago' && libroDePago(x) === libro).map((p) => p.titulo);
  const l = repetidos(todos, ym, pagos).slice(0, 4);
  if (!l.length) return '';
  return tarjeta({ eti: 'SE REPITEN', titulo: 'Gastos de todos los meses', n: l.length, clase: 'area-' + COLOR[libro],
    guia: 'Gastos con el mismo nombre en varios meses. Si los vuelves <b>pago fijo</b>, te aviso antes de que venzan y se anotan con una casilla.',
    cuerpo: filas(l.map((x) => fila({ titulo: x.titulo, meta: '<b class="mono">' + fmtSoles(x.monto) + '</b> · en ' + x.meses + ' meses · el día ' + x.dia,
      final: '<button type="button" class="btn chico" data-acc="fin-a-pago" data-libro="' + libro + '" data-t="' + esc(x.titulo) + '" data-m="' + x.monto + '" data-d="' + x.dia + '" data-c="' + esc(x.cat) + '">Volver pago fijo</button>' }))) });
}
/* Informe para imprimir o guardar en PDF (se arma aparte y se imprime) */
function imprimirInforme(libro) {
  const ym = ui.mes || hoy().slice(0, 7), todos = movs(libro), r = resumenMes(todos, ym), hist = historial(todos, ym, 6).filter((h) => h.n);
  const delM = todos.filter((x) => delMes(x, ym)).sort((a, b) => (a.fechas.inicio || '').localeCompare(b.fechas.inicio || ''));
  const p = presupuestoDe(libro), nombre = (documento().perfil && documento().perfil.nombre) || '';
  const fila2 = (c) => '<tr>' + c.map((v, i) => '<td' + (i >= c.length - 1 ? ' class="num"' : '') + '>' + v + '</td>').join('') + '</tr>';
  const html = '<h1>' + LIBROS[libro] + ' · ' + nombreMes(ym) + '</h1><p>' + (nombre ? esc(nombre) + ' · ' : '') + 'Impreso el ' + fmtFecha(hoy()) + '</p>' +
    '<table><tbody>' + fila2(['Ingresos', fmtSoles(r.ingresos)]) + fila2(['Gastos', fmtSoles(r.gastos)]) + fila2(['<b>Saldo</b>', '<b>' + (r.saldo < 0 ? '−' : '') + fmtSoles(Math.abs(r.saldo)) + '</b>']) + (p ? fila2(['Presupuesto', fmtSoles(p) + ' (' + Math.round(r.gastos / p * 100) + ' % usado)']) : '') + '</tbody></table>' +
    (r.porCategoria.length ? '<h2>Gastos por categoría</h2><table><thead><tr><th>Categoría</th><th>%</th><th class="num">Monto</th></tr></thead><tbody>' + r.porCategoria.map((c) => fila2([esc(c.cat), c.pct + ' %', fmtSoles(c.monto)])).join('') + '</tbody></table>' : '') +
    '<h2>Movimientos (' + delM.length + ')</h2>' + (delM.length ? '<table><thead><tr><th>Día</th><th>Descripción</th><th>Categoría</th><th class="num">Monto</th></tr></thead><tbody>' + delM.map((x) => fila2([fmtFecha(x.fechas.inicio), esc(x.titulo || ''), esc(x.extra.categoria || ''), (esIngreso(x) ? '+' : '−') + fmtSoles(Math.abs(+x.monto || 0))])).join('') + '</tbody></table>' : '<p>Sin movimientos.</p>') +
    (hist.length > 1 ? '<h2>Últimos meses</h2><table><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th class="num">Saldo</th></tr></thead><tbody>' + hist.map((h) => fila2([nombreMes(h.ym), fmtSoles(h.ingresos), fmtSoles(h.gastos), (h.saldo < 0 ? '−' : '+') + fmtSoles(Math.abs(h.saldo))])).join('') + '</tbody></table>' : '');
  let caja = document.getElementById('impresion');
  if (!caja) { caja = document.createElement('div'); caja.id = 'impresion'; document.body.appendChild(caja); }
  caja.innerHTML = html;
  document.body.classList.add('imprimiendo');
  const fin = () => { document.body.classList.remove('imprimiendo'); caja.innerHTML = ''; window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  setTimeout(() => { try { window.print(); } catch (e) { fin(); } }, 50);
}

/* Lo propio de cada libro, sin repetir lo que vive en su área */
function enlaceTematico(libro) {
  if (libro === 'oficina') {
    const c = elementos((x) => x.tipo === 'cobro' && x.estado !== 'hecho'), t = c.reduce((s, x) => s + (+x.monto || 0), 0);
    return t ? '<a class="nota-fase" href="#areas/oficina/cobros">' + ico('i-dinero') + '<span><b>Por cobrar: ' + fmtSoles(t) + '</b> en ' + plural(c.length, 'cobro', 'cobros') + '. Al cobrarlos en Oficina → Cobros se anotan aquí solos.</span></a>' : '';
  }
  const r = resumenPrestamos(elementos((x) => x.tipo === 'prestamo'));
  return r.meDeben || r.debo ? '<a class="nota-fase" href="#areas/personal/prestamos">' + ico('i-dinero') + '<span><b>Préstamos:</b> te deben ' + fmtSoles(r.meDeben) + (r.debo ? ' y debes ' + fmtSoles(r.debo) : '') + '. Al saldarlos en Personal → Préstamos se anotan aquí solos.</span></a>' : '';
}

/* ---------- Editores ---------- */
function editarMov(id, repintar, pre = {}) {
  const x = id ? buscarElemento(id) : null, libro = x ? (x.extra.libro || 'personal') : pre.libro, ing = x ? esIngreso(x) : !!pre.ingreso;
  const areasLibro = libro === 'oficina' ? [['oficina', 'Oficina']] : AREAS.filter((a) => a.id !== 'oficina').map((a) => [a.id, a.nombre]);
  const h = editar({ titulo: (x ? 'Editar ' : 'Nuevo ') + (ing ? 'ingreso' : 'gasto') + ' · ' + (libro === 'oficina' ? 'oficina' : 'personal'), campos: [
    { n: 'tipo', t: 'botones', etq: 'Tipo', v: ing ? 'ing' : 'gas', ops: [['gas', '💸 Gasto'], ['ing', '💰 Ingreso']] },
    { n: 'monto', t: 'monto', etq: 'Monto (S/)', v: x ? Math.abs(+x.monto || 0) : null, req: true, mitad: true },
    { n: 'fecha', t: 'fecha', etq: 'Día', v: x ? x.fechas.inicio : hoy(), mitad: true },
    { n: 'titulo', t: 'texto', etq: 'Descripción', v: x ? x.titulo : '', max: 120, ph: ing ? 'Ej. Sueldo de octubre' : 'Ej. Supermercado' },
    { n: 'cat', t: 'texto', etq: 'Categoría', v: x ? x.extra.categoria : '', max: 40, ph: 'Ej. Comida' },
    ...(libro === 'oficina' ? [] : [{ n: 'area', t: 'botones', etq: 'De qué área', v: x ? x.area : 'personal', ops: areasLibro, ayuda: 'Lo de Estudios o Deporte se suma en su área.' }]),
    { n: 'notas', t: 'largo', etq: 'Notas', v: x ? x.notas : '', max: 1000 }],
  despues: '<datalist id="dlCats">' + categoriasUsadas(libro, ing).concat(categoriasUsadas(libro, !ing)).map((c) => '<option value="' + esc(c) + '">').join('') + '</datalist>',
  alGuardar: (v) => {
    if (!(v.monto > 0)) { aviso('Escribe el monto (ej. 25.50 o 1,250)'); return false; }
    const ingreso = v.tipo === 'ing', area = libro === 'oficina' ? 'oficina' : (v.area || areaDeCategoria(v.cat));
    const fechas = Object.assign({}, x ? x.fechas : {}, { inicio: v.fecha || hoy() }), titulo = v.titulo || v.cat || (ingreso ? 'Ingreso' : 'Gasto');
    if (x) cambiarExtra(id, { libro, ingreso, categoria: v.cat }, { titulo, monto: v.monto, fechas, area, notas: v.notas });
    else nuevo('movimiento', area, { titulo, monto: v.monto, estado: 'hecho', notas: v.notas, fechas, extra: { libro, ingreso, categoria: v.cat } });
    repintar(); aviso((ingreso ? '💰 +' : '💸 −') + fmtSoles(v.monto) + ' · ' + (libro === 'oficina' ? 'oficina' : 'personal'));
  }, alBorrar: x ? () => borrar(id, repintar) : null });
  const c = h.querySelector('[name="cat"]'); if (c) c.setAttribute('list', 'dlCats');
  /* Anotar otra vez hoy (el mismo gasto o ingreso) */
  if (x) {
    const fb = h.querySelector('.fila-botones'), otra = document.createElement('button');
    otra.type = 'button'; otra.className = 'btn'; otra.innerHTML = ico('i-repetir') + 'Anotar otra vez hoy';
    otra.addEventListener('click', () => {
      const n = nuevo('movimiento', x.area, { titulo: x.titulo, monto: Math.abs(+x.monto || 0), estado: 'hecho', notas: x.notas, fechas: { inicio: hoy() }, extra: { libro, ingreso: ing, categoria: x.extra.categoria } });
      cerrarHoja(); repintar();
      aviso((ing ? '💰 +' : '💸 −') + fmtSoles(Math.abs(+x.monto || 0)) + ' anotado hoy', () => { aPapelera(n.id); repintar(); });
    });
    fb.insertBefore(otra, fb.firstChild);
  }
  /* Categoría de Estudios o Deporte → sugiere su área */
  if (c && libro !== 'oficina') c.addEventListener('change', () => { const ar = areaDeCategoria(c.value); if (ar !== 'personal') { const b = h.querySelector('[data-sel="area"] [data-v="' + ar + '"]'); if (b) b.click(); } });
}
function editarPago(id, repintar, libro, pre = {}) {
  const p = id ? buscarElemento(id) : null;
  editar({ titulo: p ? 'Pago fijo' : 'Nuevo pago fijo', campos: [
    { n: 'em', t: 'texto', etq: 'Emoji', v: p ? val(p, 'em', '🧾') : '🧾', max: 4, mitad: true },
    { n: 'titulo', t: 'texto', etq: 'Qué pagas', v: p ? p.titulo : pre.titulo || '', req: true, max: 60, ph: 'Ej. Luz', mitad: true },
    { n: 'monto', t: 'monto', etq: 'Monto (S/)', v: p ? p.monto : pre.monto || null, mitad: true },
    { n: 'dia', t: 'num', etq: 'Día del mes', v: p ? val(p, 'dia', 1) : pre.dia || 1, mitad: true, ayuda: 'Si pones 31, en meses más cortos vence el último día.' },
    { n: 'cat', t: 'texto', etq: 'Categoría', v: p ? val(p, 'cat', 'Servicios') : pre.cat || 'Servicios', max: 40 },
    { n: 'activo', t: 'si', etq: 'Activo (desmárcalo si ya no lo pagas)', v: p ? p.extra.activo !== false : true }],
  alGuardar: (v) => {
    const extra = { em: v.em || '🧾', dia: Math.min(31, Math.max(1, +v.dia || 1)), cat: v.cat, activo: v.activo };
    if (p) cambiarExtra(id, extra, { titulo: v.titulo, monto: v.monto || 0 });
    else nuevo('pago', libro === 'oficina' ? 'oficina' : 'personal', { titulo: v.titulo, monto: v.monto || 0, extra: Object.assign(extra, { pagados: {}, desde: hoy().slice(0, 7) }) });
    repintar(); aviso('Pago fijo guardado');
  }, alBorrar: p ? () => borrar(id, repintar) : null });
}
function editarPresupuesto(libro, repintar) {
  editar({ titulo: 'Presupuesto mensual · ' + (libro === 'oficina' ? 'oficina' : 'personal'), textoGuardar: 'Guardar', campos: [
    { n: 'monto', t: 'monto', etq: 'Cuánto quieres gastar como máximo al mes (S/)', v: presupuestoDe(libro) || null, ayuda: 'Te aviso al llegar al 85 %. Déjalo vacío para no usar presupuesto.' }],
  alGuardar: (v) => {
    cambiarPerfil({ presupuesto: Object.assign({}, documento().perfil.presupuesto, { [libro]: v.monto || 0 }) });
    repintar(); aviso(v.monto ? 'Presupuesto: ' + fmtSoles(v.monto) + ' al mes' : 'Sin presupuesto');
  } });
}

export function vistaFinanzas(param) {
  const libro = param === 'oficina' ? 'oficina' : 'personal';
  return explica('<b>Tus dos libros de cuentas, cada uno por su lado.</b> El personal (con lo de Estudios y Deporte en su área) y el de la oficina. Los pagos fijos, cobros y préstamos se anotan aquí solos.') + vistaLibro(libro);
}
/* Señal de presupuesto para Hoy y para las áreas */
export function avisoPresupuesto(libro) {
  const r = resumenMes(movs(libro), hoy().slice(0, 7)), p = estadoPresupuesto(r.gastos, presupuestoDe(libro));
  return p && p.nivel !== 'ok' ? { nivel: p.nivel, txt: (libro === 'oficina' ? 'Oficina' : 'Personal') + ': llevas el ' + p.pct + ' % del presupuesto del mes' } : null;
}

export const acciones = {
  'fin-mes'(b) { const n = +b.dataset.n, act = hoy().slice(0, 7); ui.mes = n === 0 ? '' : sumarMes(ui.mes || act, n) >= act ? '' : sumarMes(ui.mes || act, n); ui.cat = ''; ui.ver = 30; return true; },
  'fin-ir-mes'(b) { ui.mes = b.dataset.v === hoy().slice(0, 7) ? '' : b.dataset.v; ui.cat = ''; return true; },
  'fin-cat'(b) { ui.cat = ui.cat === b.dataset.v ? '' : b.dataset.v; return true; },
  'fin-mas'() { ui.ver += 30; return true; },
  'fin-nuevo'(b, ev, rp) { editarMov(null, rp, { libro: b.dataset.libro, ingreso: b.dataset.ing === '1' }); },
  'fin-editar'(b, ev, rp) { editarMov(b.dataset.id, rp); },
  'fin-presupuesto'(b, ev, rp) { editarPresupuesto(b.dataset.libro, rp); },
  'fin-csv'(b) { const l = b.dataset.libro; guardarArchivo(csv(movs(l)), 'libro_' + l + '_' + hoy() + '.csv', 'text/csv'); aviso('Se bajó el libro ' + l + '. Ábrelo con Excel o Google Sheets.'); },
  'pago-nuevo'(b, ev, rp) { editarPago(null, rp, b.dataset.libro); },
  'fin-a-pago'(b, ev, rp) { editarPago(null, rp, b.dataset.libro, { titulo: b.dataset.t, monto: +b.dataset.m, dia: +b.dataset.d, cat: b.dataset.c }); },
  'fin-imprimir'(b) { imprimirInforme(b.dataset.libro); },
  'pago-editar'(b, ev, rp) { editarPago(b.dataset.id, rp); }
};
