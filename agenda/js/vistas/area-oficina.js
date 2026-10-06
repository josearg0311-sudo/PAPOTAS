/* OFICINA: plazos legales (siempre primero), clientes, cobros, horas
   trabajadas con cronómetro, actas de reunión y tablero de trabajo */
import { elementos, buscarElemento, poner } from '../datos/datos.js';
import { leer, escribir } from '../datos/almacen.js';
import { preferencias } from '../datos/preferencias.js';
import { modeloVacio, LISTA_TAREAS } from '../datos/modelo.js';
import { val, tarifa, montoHoras, resumenHoras } from '../datos/herramientas.js';
import { ocurre } from '../datos/calendario.js';
import { marcar, hechoEn, esChecklist } from '../datos/pendientes.js';
import { hoy, fmtCorta, fmtFecha, fmtHora, horaAhora, sumarDias, plazo, MESES } from '../util/fechas.js';
import { fmtSoles, solesCorto } from '../util/dinero.js';
import { tareasDe } from './espacio-comun.js';
import { esc, ico, vacio, plural } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { fila, filas, casilla, mini, pildora, pildoraFecha, cifra, cifras, cambiarExtra, nuevo, borrar, boton, pie, anotarMovimiento, quitarMovimiento } from './area-comun.js';
import { editar } from '../piezas/formulario.js';
import { editarPendiente } from '../piezas/pendientes-ui.js';
import { nuevoEvento } from '../piezas/eventos-ui.js';
import { aviso } from '../piezas/aviso.js';
import { enlaceWhatsApp } from '../piezas/compartir.js';
import { vistaConstancia, senalesConstancia, TEMAS } from './area-constancia.js';
import { avisoPresupuesto } from './finanzas.js';
import { irALista } from './recordatorios.js';

const hora = (h) => fmtHora(h, preferencias().formatoHora);
const durTxt = (m) => (m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min');
const CLAVE_RELOJ = 'agenda5_reloj';

/* ---------- Plazos legales ---------- */
const conPlazo = () => elementos((x) => x.tipo === 'pendiente' && x.estado !== 'hecho' && (x.plazoLegal || (x.area === 'oficina' && x.fechas.vence)))
  .sort((a, b) => (b.plazoLegal ? 1 : 0) - (a.plazoLegal ? 1 : 0) || (a.fechas.vence || '9999').localeCompare(b.fechas.vence || '9999'));
function vistaPlazos() {
  const l = conPlazo(), legales = l.filter((x) => x.plazoLegal), otros = l.filter((x) => !x.plazoLegal);
  const f = (x) => fila({ inicio: casilla(false, 'p-marcar', x.id, 'Marcar hecho: ' + x.titulo), titulo: x.titulo, acc: 'p-editar', id: x.id,
    meta: (x.plazoLegal ? '<span class="pill legal">PLAZO LEGAL</span> ' : '') + (x.fechas.vence ? pildoraFecha(x.fechas.vence) : '<span class="pill">sin fecha de vencimiento</span>'),
    clase: x.fechas.vence && plazo(x.fechas.vence).nivel !== 'ok' ? 'toca' : '' });
  return tarjeta({ eti: 'PLAZOS', titulo: 'Plazos legales', n: legales.length, clase: 'area-oficina',
    guia: 'Lo que tiene <b>plazo legal</b> va siempre arriba, en Hoy y aquí. 🔴 vencido · ⚠️ vence en 3 días o menos.',
    cuerpo: (legales.length ? filas(legales.map(f)) : vacio('Sin plazos legales', 'Marca «Plazo legal» en un recordatorio para que nunca se pierda.')) +
      (otros.length ? '<div class="grupo-tit"><span>Otros vencimientos de oficina</span><span class="linea"></span><span class="mono">' + otros.length + '</span></div>' + filas(otros.map(f)) : '') +
      pie('<button type="button" class="btn pri" data-acc="plazo-nuevo">' + ico('i-plus') + 'Nuevo plazo legal</button>') });
}
function nuevoPlazo(repintar) {
  const b = modeloVacio();
  editarPendiente(null, repintar, Object.assign(b, { id: '', tipo: 'pendiente', area: 'oficina', plazoLegal: true, prioridad: 'alta', lista: LISTA_TAREAS, fechas: Object.assign(b.fechas, { vence: sumarDias(hoy(), 3) }), extra: {} }));
}

/* ---------- Clientes ---------- */
const clientes = () => elementos((x) => x.tipo === 'cliente').sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
const nombresClientes = () => clientes().map((c) => c.titulo);
const cobros = () => elementos((x) => x.tipo === 'cobro');
const clienteDeCobro = (x) => val(x, 'cliente', '') || x.titulo.split(' · ')[0];
const soloDigitos = (t) => String(t || '').replace(/\D/g, '');
function vistaClientes() {
  const l = clientes(), ym = hoy().slice(0, 7), hs = resumenHoras(elementos((x) => x.tipo === 'horas'), ym);
  return tarjeta({ eti: 'CLIENTES', titulo: 'Clientes', n: l.length, clase: 'area-oficina',
    guia: 'Sus datos de contacto, lo que te deben y las horas de este mes. Toca el teléfono para llamar o escribir por WhatsApp.',
    cuerpo: (l.length ? filas(l.map((c) => {
      const debe = cobros().filter((x) => x.estado !== 'hecho' && clienteDeCobro(x) === c.titulo).reduce((s, x) => s + (+x.monto || 0), 0), h = hs.porCliente[c.titulo];
      const tel = val(c, 'tel', ''), mail = val(c, 'email', '');
      return fila({ titulo: c.titulo, acc: 'cli-editar', id: c.id,
        meta: [val(c, 'contacto', ''), val(c, 'ruc', '') ? 'RUC ' + val(c, 'ruc', '') : ''].filter(Boolean).map(esc).join(' · ') + (debe ? ' <span class="pill pronto">te debe ' + fmtSoles(debe) + '</span>' : '') + (h ? ' <span class="pill">' + durTxt(h.min) + ' este mes</span>' : ''),
        final: (tel ? '<a class="mini-btn" href="tel:' + esc(soloDigitos(tel)) + '" aria-label="Llamar a ' + esc(c.titulo) + '">Llamar</a><a class="mini-btn" href="' + esc(enlaceWhatsApp('', tel)) + '" target="_blank" rel="noopener" aria-label="WhatsApp a ' + esc(c.titulo) + '">WhatsApp</a>' : '') + (mail ? '<a class="mini-btn" href="mailto:' + esc(mail) + '">Correo</a>' : '') });
    })) : vacio('Sin clientes', 'Agrega a tus clientes para ligar cobros y horas.')) + pie(boton('Nuevo cliente', 'cli-nuevo')) });
}
function editarCliente(id, repintar) {
  const c = id ? buscarElemento(id) : null;
  editar({ titulo: c ? c.titulo : 'Nuevo cliente', campos: [
    { n: 'titulo', t: 'texto', etq: 'Nombre o empresa', v: c ? c.titulo : '', req: true, max: 80 },
    { n: 'contacto', t: 'texto', etq: 'Persona de contacto', v: c ? val(c, 'contacto', '') : '', max: 60, mitad: true },
    { n: 'ruc', t: 'texto', etq: 'RUC o DNI', v: c ? val(c, 'ruc', '') : '', max: 11, mitad: true },
    { n: 'tel', t: 'texto', etq: 'Teléfono', v: c ? val(c, 'tel', '') : '', max: 20, ph: '+51 999 999 999', mitad: true },
    { n: 'email', t: 'texto', etq: 'Correo', v: c ? val(c, 'email', '') : '', max: 80, mitad: true },
    { n: 'notas', t: 'largo', etq: 'Notas', v: c ? c.notas : '', max: 2000 }],
  alGuardar: (v) => {
    const extra = { contacto: v.contacto, ruc: v.ruc, tel: v.tel, email: v.email };
    if (c) cambiarExtra(id, extra, { titulo: v.titulo, notas: v.notas }); else nuevo('cliente', 'oficina', { titulo: v.titulo, notas: v.notas, extra });
    repintar(); aviso('Cliente guardado');
  }, alBorrar: c ? () => borrar(id, repintar) : null });
}

/* ---------- Cobros ---------- */
/* Mensaje amable para recordar un pago, al WhatsApp del cliente si lo tienes */
function recordatorioCobro(x) {
  const nom = clienteDeCobro(x), c = elementos((y) => y.tipo === 'cliente' && y.titulo === nom)[0], conc = val(x, 'concepto', '');
  const venc = x.fechas.vence ? (x.fechas.vence < hoy() ? ', que venció el ' : ', que vence el ') + fmtFecha(x.fechas.vence) : '';
  return enlaceWhatsApp('Hola, ' + nom + '. Te escribo para recordarte el pago pendiente de ' + fmtSoles(x.monto || 0) + (conc ? ' por ' + conc : '') + venc + '. ¡Muchas gracias!', c ? val(c, 'tel', '') : '');
}
function vistaCobros() {
  const l = cobros().sort((a, b) => (a.estado === 'hecho') - (b.estado === 'hecho') || (a.fechas.vence || '9999').localeCompare(b.fechas.vence || '9999'));
  const act = l.filter((x) => x.estado !== 'hecho'), h = hoy();
  const total = act.reduce((s, x) => s + (+x.monto || 0), 0), venc = act.filter((x) => x.fechas.vence && x.fechas.vence < h).reduce((s, x) => s + (+x.monto || 0), 0);
  const f = (x) => fila({ inicio: casilla(x.estado === 'hecho', 'cobro-cobrar', x.id, 'Cobrado: ' + x.titulo), titulo: x.titulo, acc: 'cobro-editar', id: x.id,
    meta: '<b class="mono">' + fmtSoles(x.monto || 0) + '</b> ' + (x.estado === 'hecho' ? '<span class="pill">cobrado</span>' : pildoraFecha(x.fechas.vence)), clase: x.estado === 'hecho' ? 'hecha' : '',
    final: x.estado !== 'hecho' && +x.monto > 0 ? '<a class="mini-btn" href="' + esc(recordatorioCobro(x)) + '" target="_blank" rel="noopener" aria-label="Recordar el pago a ' + esc(clienteDeCobro(x)) + ' por WhatsApp">Recordar</a>' : '' });
  return tarjeta({ eti: 'COBROS', titulo: 'Cobros', clase: 'area-oficina',
    guia: 'Lo que te deben tus clientes. Al marcarlo cobrado se anota como ingreso en el libro de la oficina.',
    cuerpo: cifras([cifra(fmtSoles(total), 'por cobrar'), cifra(fmtSoles(venc), 'vencido', venc ? 'aviso' : '')]) +
      (act.length ? filas(act.map(f)) : vacio('', 'Todo cobrado. 🙌')) +
      (l.length > act.length ? '<div class="grupo-tit"><span>Cobrados</span><span class="linea"></span></div>' + filas(l.filter((x) => x.estado === 'hecho').slice(0, 5).map(f)) : '') +
      pie(boton('Nuevo cobro', 'cobro-nuevo')) });
}
function editarCobro(id, repintar) {
  const x = id ? buscarElemento(id) : null, nombres = nombresClientes();
  editar({ titulo: x ? 'Cobro' : 'Nuevo cobro', campos: [
    { n: 'cliente', t: 'texto', etq: 'Cliente', v: x ? clienteDeCobro(x) : '', req: true, max: 60 },
    { n: 'concepto', t: 'texto', etq: 'Concepto', v: x ? (val(x, 'concepto', '') || x.titulo.split(' · ').slice(1).join(' · ')) : '', max: 80, ph: 'Ej. Factura F001-245' },
    { n: 'monto', t: 'monto', etq: 'Monto (S/)', v: x ? x.monto : null, mitad: true },
    { n: 'vence', t: 'fecha', etq: 'Vence', v: x ? x.fechas.vence : '', mitad: true },
    { n: 'notas', t: 'largo', etq: 'Notas', v: x ? x.notas : '', max: 1000 }],
  despues: nombres.length ? '<datalist id="dlClientes">' + nombres.map((n) => '<option value="' + esc(n) + '">').join('') + '</datalist>' : '',
  alGuardar: (v) => {
    const titulo = [v.cliente, v.concepto].filter(Boolean).join(' · '), fechas = Object.assign({}, x ? x.fechas : {}, { vence: v.vence || null });
    if (x) cambiarExtra(id, { cliente: v.cliente, concepto: v.concepto }, { titulo, monto: v.monto || 0, notas: v.notas, fechas });
    else nuevo('cobro', 'oficina', { titulo, monto: v.monto || 0, notas: v.notas, fechas, extra: { cliente: v.cliente, concepto: v.concepto } });
    repintar(); aviso('Cobro guardado');
  }, alBorrar: x ? () => borrar(id, repintar) : null });
  const i = document.querySelector('#formHerr [name="cliente"]'); if (i && nombres.length) i.setAttribute('list', 'dlClientes');
}
function cobrar(id, repintar) {
  const x = buscarElemento(id); if (!x) return;
  const on = x.estado !== 'hecho', idMov = 'mov_cobro_' + id;
  cambiarExtra(id, { cobradoEn: on ? Date.now() : 0 }, { estado: on ? 'hecho' : 'pendiente' });
  if (on) anotarMovimiento(idMov, { titulo: 'Cobro: ' + x.titulo, area: 'oficina', monto: x.monto, libro: 'oficina', ingreso: true, categoria: 'Ventas', origen: id });
  else quitarMovimiento(idMov);
  repintar();
  aviso(on ? '💰 Cobrado · ' + fmtSoles(x.monto || 0) + (+x.monto > 0 ? ' anotado en la oficina' : '') : 'Marcado como pendiente', on ? () => cobrar(id, repintar) : null);
}

/* ---------- Horas trabajadas ---------- */
const horas = () => elementos((x) => x.tipo === 'horas').sort((a, b) => ((b.fechas.inicio || '') + (b.fechas.hora || '')).localeCompare((a.fechas.inicio || '') + (a.fechas.hora || '')));
export function reloj() { return leer(CLAVE_RELOJ, null); }
function ultimaTarifa(cliente) { const h = horas().find((x) => val(x, 'cliente', '') === cliente); return h ? tarifa(h) : 0; }
function vistaHoras() {
  const ym = hoy().slice(0, 7), l = horas(), r = resumenHoras(l, ym), rj = reloj();
  const corre = rj && rj.inicio ? Math.max(0, Math.round((Date.now() - rj.inicio) / 60000)) : 0;
  return tarjeta({ eti: 'CRONÓMETRO', titulo: rj ? 'Trabajando' + (rj.cliente ? ' para ' + esc(rj.cliente) : '') : 'Cronómetro de trabajo', clase: 'area-oficina',
    guia: 'Dale <b>Empezar</b> cuando trabajes para un cliente y <b>Parar</b> al terminar: se guardan las horas con su tarifa.',
    cuerpo: rj ? '<div class="reloj-trabajo"><b class="mono" id="relojTrabajo">' + durTxt(corre) + '</b><small>desde las ' + hora(rj.hora || '00:00') + '</small></div>' + pie('<button type="button" class="btn pri" data-acc="reloj-parar">' + ico('i-pausa') + 'Parar y guardar</button><button type="button" class="btn" data-acc="reloj-cancelar">Descartar</button>')
      : '<div class="form reloj-form"><label class="campo"><span>Cliente</span><select class="entrada" id="relojCliente"><option value="">Sin cliente</option>' + nombresClientes().map((n) => '<option>' + esc(n) + '</option>').join('') + '</select></label></div>' + pie('<button type="button" class="btn pri" data-acc="reloj-empezar">' + ico('i-play') + 'Empezar</button>') }) +
    tarjeta({ eti: 'HORAS', titulo: 'Horas de ' + MESES[+ym.slice(5) - 1], clase: 'area-oficina',
      cuerpo: cifras([cifra(durTxt(r.min), 'trabajadas'), cifra(fmtSoles(r.monto), 'a facturar', 'ok')]) +
        (Object.keys(r.porCliente).length ? filas(Object.entries(r.porCliente).sort((a, b) => b[1].min - a[1].min).map(([c, v]) => fila({ titulo: c, meta: durTxt(v.min) + ' · ' + fmtSoles(v.monto) }))) : '') +
        (l.length ? '<div class="grupo-tit"><span>Últimos registros</span><span class="linea"></span></div>' + filas(l.slice(0, 8).map((h) => fila({ titulo: val(h, 'cliente', '') || 'Sin cliente', acc: 'horas-editar', id: h.id,
          meta: fmtCorta(h.fechas.inicio) + (h.fechas.hora ? ' ' + hora(h.fechas.hora) : '') + ' · ' + durTxt(+val(h, 'minutos', 0) || 0) + (tarifa(h) ? ' · ' + fmtSoles(montoHoras(h)) : '') + (h.notas ? ' · ' + esc(h.notas) : '') }))) : vacio('', 'Aún no registras horas.')) +
        pie(boton('Anotar horas a mano', 'horas-nueva')) });
}
function editarHoras(id, repintar, pre = {}) {
  const h = id ? buscarElemento(id) : null;
  editar({ titulo: h ? 'Horas trabajadas' : 'Anotar horas', campos: [
    { n: 'cliente', t: 'sel', etq: 'Cliente', v: h ? val(h, 'cliente', '') : pre.cliente || '', ops: [['', 'Sin cliente']].concat([...new Set(nombresClientes().concat(h && val(h, 'cliente', '') ? [val(h, 'cliente', '')] : []))].map((n) => [n, n])) },
    { n: 'fecha', t: 'fecha', etq: 'Día', v: h ? h.fechas.inicio : pre.fecha || hoy(), mitad: true },
    { n: 'ini', t: 'hora', etq: 'Desde', v: h ? h.fechas.hora : pre.hora || '', mitad: true },
    { n: 'minutos', t: 'num', etq: 'Minutos', v: h ? val(h, 'minutos', 0) : pre.minutos || 60, mitad: true },
    { n: 'tarifa', t: 'monto', etq: 'Tarifa por hora (S/)', v: h ? tarifa(h) : pre.tarifa || null, mitad: true },
    { n: 'notas', t: 'texto', etq: 'Qué hiciste', v: h ? h.notas : '', max: 200, ph: 'Ej. Revisión de contrato' }],
  alGuardar: (v) => {
    const extra = { cliente: v.cliente, minutos: Math.max(1, +v.minutos || 0), tarifa: v.tarifa || 0 }, fechas = Object.assign({}, h ? h.fechas : {}, { inicio: v.fecha || hoy(), hora: v.ini || null });
    const titulo = v.cliente ? 'Horas · ' + v.cliente : 'Horas trabajadas';
    if (h) cambiarExtra(id, extra, { titulo, notas: v.notas, fechas }); else nuevo('horas', 'oficina', { titulo, notas: v.notas, fechas, extra });
    repintar(); aviso('Horas guardadas · ' + durTxt(extra.minutos));
  }, alBorrar: h ? () => borrar(id, repintar) : null });
}

/* ---------- Actas de reunión ---------- */
function reunionesRecientes() {
  const h = hoy(), out = [];
  elementos((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'reunion').forEach((e) => {
    const actas = val(e, 'actas', {}) || {};
    for (let i = -21; i <= 7; i++) { const d = sumarDias(h, i); if (ocurre(e.fechas.inicio, e.repetir, d, e.fechas.fin) || actas[d]) out.push({ e, d, acta: actas[d] || null }); }
    Object.keys(actas).filter((d) => d < sumarDias(h, -21)).forEach((d) => out.push({ e, d, acta: actas[d] }));
  });
  return out.sort((a, b) => b.d.localeCompare(a.d));
}
function vistaActas() {
  const l = reunionesRecientes(), h = hoy(), prox = l.filter((x) => x.d > h).reverse(), pas = l.filter((x) => x.d <= h);
  const f = (x) => { const ac = x.acta ? x.acta.acuerdos || [] : [], ok = ac.filter((a) => a.ok).length;
    return fila({ titulo: x.e.titulo, acc: 'acta-editar', id: x.e.id, datos: ' data-dia="' + x.d + '"',
      meta: fmtCorta(x.d) + (x.e.fechas.hora ? ' ' + hora(x.e.fechas.hora) : '') + ' ' + (x.acta ? '<span class="pill">acta · ' + ok + '/' + ac.length + ' acuerdos</span>' : x.d <= h ? '<span class="pill pronto">sin acta</span>' : ''), clase: x.acta ? '' : 'apagada' }); };
  return tarjeta({ eti: 'ACTAS', titulo: 'Actas de reunión', clase: 'area-oficina',
    guia: 'Después de cada reunión anota quiénes fueron, qué se habló y los acuerdos. Un acuerdo tuyo puede volverse recordatorio con un toque.',
    cuerpo: (pas.length ? filas(pas.slice(0, 12).map(f)) : vacio('Sin reuniones recientes', 'Crea eventos de tipo «Reunión» en la Agenda y aquí podrás escribir su acta.')) +
      (prox.length ? '<div class="grupo-tit"><span>Próximas</span><span class="linea"></span></div>' + filas(prox.slice(0, 5).map(f)) : '') +
      pie(boton('Nueva reunión', 'reunion-nueva')) });
}
function editarActa(id, dia, repintar) {
  const e = buscarElemento(id), actas = JSON.parse(JSON.stringify(val(e, 'actas', {}) || {})), acta = actas[dia] || { asist: '', notas: '', acuerdos: [] };
  editar({ titulo: 'Acta · ' + e.titulo + ' · ' + fmtCorta(dia), campos: [
    { n: 'asist', t: 'texto', etq: 'Asistentes', v: acta.asist, max: 200, ph: 'Ej. Ana, Luis, cliente' },
    { n: 'notas', t: 'largo', etq: 'Qué se habló', v: acta.notas, max: 4000 },
    { n: 'acuerdos', t: 'filas', etq: 'Acuerdos', boton: 'Agregar acuerdo', v: (acta.acuerdos || []).map((a) => Object.assign({ tarea: !!a.tareaId }, a)), nuevo: () => ({ t: '', quien: 'Yo', ok: false, tarea: false }),
      cols: [{ n: 't', t: 'texto', etq: 'Acuerdo', ancho: '2fr' }, { n: 'quien', t: 'texto', etq: 'Quién', ancho: '1fr', max: 40 }, { n: 'ok', t: 'si', etq: 'Hecho', ancho: '40px' }, { n: 'tarea', t: 'si', etq: 'Recordármelo', ancho: '40px' }],
      vale: (a) => a.t, ayuda: 'Columnas de casillas: <b>Hecho</b> y <b>Recordármelo</b> (lo crea como recordatorio de Oficina).' }],
  alGuardar: (v) => {
    const viejos = acta.acuerdos || []; let nuevas = 0;
    const acuerdos = v.acuerdos.map((a, i) => {
      const previo = viejos.find((y) => y.t === a.t) || viejos[i] || {}, out = { t: a.t, quien: a.quien, ok: a.ok };
      if (previo.tareaId) out.tareaId = previo.tareaId;
      else if (a.tarea) { const b = modeloVacio(); out.tareaId = poner(Object.assign(b, { tipo: 'pendiente', area: 'oficina', lista: LISTA_TAREAS, titulo: a.t, notas: 'De la reunión «' + e.titulo + '» del ' + fmtCorta(dia), extra: { acta: id + '@' + dia } })).id; nuevas++; }
      return out;
    });
    actas[dia] = { asist: v.asist, notas: v.notas, acuerdos };
    cambiarExtra(id, { actas });
    repintar(); aviso('Acta guardada' + (nuevas ? ' · ' + plural(nuevas, 'recordatorio creado', 'recordatorios creados') : ''));
  } });
}

/* ---------- Tablero de trabajo ---------- */
const COLS = [['pendiente', 'Por hacer'], ['en_curso', 'En curso'], ['hecho', 'Hecho']];
function vistaTablero() {
  const h = hoy(), limite = Date.now() - 7 * 864e5;
  const enChecklist = (x) => { const l = x.lista && buscarElemento(x.lista); return esChecklist(l); };
  const l = elementos((x) => x.tipo === 'pendiente' && x.area === 'oficina' && !enChecklist(x) && x.estado !== 'cancelado' && (x.estado !== 'hecho' || hechoEn(x) >= limite));
  const proyectos = elementos((x) => x.tipo === 'lista' && x.extra.clase === 'proyecto' && x.area === 'oficina');
  const tarj = (x, i) => '<div class="kb-tarjeta' + (x.plazoLegal ? ' legal' : '') + '"><button type="button" class="kb-txt" data-acc="p-editar" data-id="' + esc(x.id) + '"><b>' + esc(x.titulo) + '</b>' +
    '<small>' + (x.plazoLegal ? '<span class="pill legal">LEGAL</span> ' : '') + (x.fechas.vence ? pildoraFecha(x.fechas.vence) : x.fechas.inicio ? '<span class="pill">' + fmtCorta(x.fechas.inicio) + '</span>' : '') + '</small></button>' +
    '<span class="kb-mover">' + (i > 0 ? '<button type="button" class="icono-btn" data-acc="tab-mover" data-id="' + esc(x.id) + '" data-v="' + COLS[i - 1][0] + '" aria-label="Mover a ' + COLS[i - 1][1] + '">' + ico('i-izq') + '</button>' : '') +
    (i < 2 ? '<button type="button" class="icono-btn" data-acc="tab-mover" data-id="' + esc(x.id) + '" data-v="' + COLS[i + 1][0] + '" aria-label="Mover a ' + COLS[i + 1][1] + '">' + ico('i-der') + '</button>' : '') + '</span></div>';
  const orden = (a, b) => (b.plazoLegal ? 1 : 0) - (a.plazoLegal ? 1 : 0) || (a.fechas.vence || a.fechas.inicio || '9999').localeCompare(b.fechas.vence || b.fechas.inicio || '9999');
  return tarjeta({ eti: 'TABLERO', titulo: 'Tablero de trabajo', clase: 'area-oficina',
    guia: 'Tus pendientes de Oficina en tres columnas. Muévelos con las flechas; lo hecho se queda una semana a la vista.',
    cuerpo: '<div class="tablero">' + COLS.map(([e, n], i) => { const c = l.filter((x) => x.estado === e).sort(orden);
      return '<div class="kb-col"><div class="kb-cab"><b>' + n + '</b><span class="mono">' + c.length + '</span></div>' + (c.length ? c.map((x) => tarj(x, i)).join('') : '<p class="kb-vacio">' + (i === 0 ? 'Nada por hacer' : i === 1 ? 'Muévelo aquí cuando empieces' : 'Lo que termines') + '</p>') + '</div>'; }).join('') + '</div>' }) +
    (proyectos.length ? tarjeta({ eti: 'PROYECTOS', titulo: 'Proyectos', n: proyectos.length, clase: 'area-oficina',
      cuerpo: filas(proyectos.map((p) => { const ts = elementos((x) => x.tipo === 'pendiente' && x.lista === p.id), ok = ts.filter((x) => x.estado === 'hecho').length;
        return fila({ titulo: p.titulo, acc: 'ir-lista', id: p.id, meta: '<span class="progreso"><i style="width:' + (ts.length ? Math.round(ok / ts.length * 100) : 0) + '%"></i></span> ' + ok + '/' + ts.length + ' pasos ' + (p.fechas.vence ? pildoraFecha(p.fechas.vence) : '') }); })) }) : '');
}

/* ---------- Herramientas y señales ---------- */
export const HERRAMIENTAS = [
  { id: 'plazos', nombre: 'Plazos legales', vista: vistaPlazos },
  { id: 'tablero', nombre: 'Tablero', vista: vistaTablero },
  { id: 'cobros', nombre: 'Cobros', vista: vistaCobros },
  { id: 'horas', nombre: 'Horas', vista: vistaHoras },
  { id: 'clientes', nombre: 'Clientes', vista: vistaClientes },
  { id: 'actas', nombre: 'Actas', vista: vistaActas },
  { id: 'constancia', nombre: TEMAS.oficina.tab, vista: () => vistaConstancia('oficina') }
];
export function senales() {
  const s = [], h = hoy();
  conPlazo().filter((x) => x.plazoLegal || plazo(x.fechas.vence).nivel !== 'ok').forEach((x) => { const p = plazo(x.fechas.vence);
    s.push({ nivel: p.nivel === 'vencido' ? 'vencido' : p.nivel === 'pronto' ? 'pronto' : 'ok', txt: (x.plazoLegal ? '⚖️ ' : '') + x.titulo + (p.texto ? ' · ' + p.texto : ''), ir: 'plazos', legal: x.plazoLegal }); });
  const venc = cobros().filter((x) => x.estado !== 'hecho' && x.fechas.vence && x.fechas.vence < h);
  if (venc.length) s.push({ nivel: 'vencido', txt: plural(venc.length, 'cobro vencido', 'cobros vencidos') + ' · ' + fmtSoles(venc.reduce((a, x) => a + (+x.monto || 0), 0)), ir: 'cobros' });
  const sin = reunionesRecientes().filter((x) => !x.acta && x.d <= h && x.d >= sumarDias(h, -3));
  if (sin.length) s.push({ nivel: 'ok', txt: 'Reunión sin acta: ' + sin[0].e.titulo + ' (' + fmtCorta(sin[0].d) + ')', ir: 'actas' });
  if (reloj()) s.push({ nivel: 'ok', txt: '⏱ Cronómetro de trabajo en marcha', ir: 'horas' });
  s.push(...senalesConstancia('oficina'));
  const po = avisoPresupuesto('oficina'); if (po) s.push(Object.assign(po, { ir: 'cobros', link: '#finanzas/oficina' }));
  return s;
}

/* El pulso de Oficina: plazos legales, lo que te deben y las horas del mes */
export function pulso() {
  const legales = conPlazo().filter((x) => x.plazoLegal), prox = legales[0], venc = legales.filter((x) => x.fechas.vence && x.fechas.vence < hoy()).length;
  const porCobrar = cobros().filter((x) => x.estado !== 'hecho').reduce((s, x) => s + (+x.monto || 0), 0), r = resumenHoras(horas(), hoy().slice(0, 7));
  return cifras([cifra('⚖️ ' + legales.length, venc ? plural(venc, 'plazo vencido', 'plazos vencidos') : prox && prox.fechas.vence ? 'próximo: ' + fmtCorta(prox.fechas.vence) : 'plazos legales', venc ? 'aviso' : ''),
    cifra(fmtSoles(porCobrar), 'por cobrar'), cifra(durTxt(r.min), 'trabajadas este mes')]);
}

/* Su semana, para la revisión semanal */
const fechaMs = (ms) => (+ms > 0 ? hoy(new Date(+ms)) : '');
export function semana(ini, fin) {
  const legal = elementos((x) => x.tipo === 'pendiente' && x.plazoLegal), cumplidos = legal.filter((x) => x.estado === 'hecho' && fechaMs(hechoEn(x)) >= ini && fechaMs(hechoEn(x)) <= fin).length;
  const vencidos = legal.filter((x) => x.estado !== 'hecho' && x.fechas.vence && x.fechas.vence <= fin).length;
  const cobrado = cobros().filter((x) => x.estado === 'hecho').filter((x) => { const f = fechaMs(val(x, 'cobradoEn', 0) || (x.datos && x.datos.cobrado)); return f >= ini && f <= fin; }).reduce((s, x) => s + (+x.monto || 0), 0);
  const min = horas().filter((h) => h.fechas.inicio >= ini && h.fechas.inicio <= fin).reduce((s, h) => s + (+val(h, 'minutos', 0) || 0), 0);
  const sinActa = reunionesRecientes().filter((x) => !x.acta && x.d >= ini && x.d <= fin && x.d <= hoy());
  const proxLegal = legal.filter((x) => x.estado !== 'hecho' && x.fechas.vence > fin && x.fechas.vence <= sumarDias(fin, 7));
  return { pregunta: '¿Qué quedó pendiente con tus clientes o tus plazos?',
    cifras: [[cumplidos, 'plazos legales cumplidos', 'ok'], [vencidos, 'plazos vencidos', vencidos ? 'aviso' : 'ok'], [fmtSoles(cobrado), 'cobrado', ''], [durTxt(min), 'trabajadas', '']],
    notas: proxLegal.map((x) => '⚖️ La próxima semana vence: ' + x.titulo + ' (' + fmtCorta(x.fechas.vence) + ')').concat(sinActa.map((x) => '📝 Sin acta: ' + x.e.titulo + ' del ' + fmtCorta(x.d))) };
}

export const acciones = {
  'plazo-nuevo'(b, ev, rp) { nuevoPlazo(rp); },
  'cli-nuevo'(b, ev, rp) { editarCliente(null, rp); },
  'cli-editar'(b, ev, rp) { editarCliente(b.dataset.id, rp); },
  'cobro-nuevo'(b, ev, rp) { editarCobro(null, rp); },
  'cobro-editar'(b, ev, rp) { editarCobro(b.dataset.id, rp); },
  'cobro-cobrar'(b, ev, rp) { cobrar(b.dataset.id, rp); },
  'reloj-empezar'() { const c = (document.getElementById('relojCliente') || {}).value || ''; escribir(CLAVE_RELOJ, { inicio: Date.now(), hora: horaAhora(), fecha: hoy(), cliente: c }); aviso('⏱ Cronómetro en marcha'); return true; },
  'reloj-cancelar'() { escribir(CLAVE_RELOJ, null); return true; },
  'reloj-parar'(b, ev, rp) {
    const r = reloj(); if (!r) return true;
    const min = Math.max(1, Math.round((Date.now() - r.inicio) / 60000));
    escribir(CLAVE_RELOJ, null); rp();
    editarHoras(null, rp, { cliente: r.cliente, fecha: r.fecha || hoy(), hora: r.hora, minutos: min, tarifa: r.cliente ? ultimaTarifa(r.cliente) : 0 });
  },
  'horas-nueva'(b, ev, rp) { editarHoras(null, rp); },
  'horas-editar'(b, ev, rp) { editarHoras(b.dataset.id, rp); },
  'acta-editar'(b, ev, rp) { editarActa(b.dataset.id, b.dataset.dia, rp); },
  'reunion-nueva'(b, ev, rp) { nuevoEvento(rp, { fecha: hoy(), hora: '10:00', horaFin: '11:00', tipoEvento: 'reunion', area: 'oficina' }); },
  'tab-mover'(b, ev, rp) {
    const x = buscarElemento(b.dataset.id), a = b.dataset.v;
    if (a === 'hecho') marcar(x.id);
    else { const y = JSON.parse(JSON.stringify(x)); y.estado = a; if (x.estado === 'hecho') y.extra.hechoEn = 0; poner(y); }
    return true;
  },
  'ir-lista'(b) { irALista(b.dataset.id); location.hash = '#recordatorios'; }
};

/* Resumen para «Tus espacios» y la portada del espacio (como la v4.5) */
export function resumen() {
  const h = hoy(), act = cobros().filter((x) => x.estado !== 'hecho'), porCobrar = act.reduce((s, x) => s + (+x.monto || 0), 0), venc = act.some((x) => x.fechas.vence && x.fechas.vence < h);
  const enCurso = elementos((x) => x.tipo === 'pendiente' && x.area === 'oficina' && x.estado === 'en_curso').length, fin = sumarDias(h, 7);
  const reus = elementos((x) => x.tipo === 'evento' && x.area === 'oficina' && (x.extra.tipoEvento === 'reunion' || x.extra.tipoEvento === 'cita') && x.fechas.inicio >= h && x.fechas.inicio <= fin).length;
  const ym = h.slice(0, 7), cobrado = cobros().filter((x) => x.estado === 'hecho' && fechaMs(val(x, 'cobradoEn', 0) || (x.datos && x.datos.cobrado)).startsWith(ym)).reduce((s, x) => s + (+x.monto || 0), 0);
  const tareas = tareasDe('oficina'), legales = conPlazo().filter((x) => x.plazoLegal).length;
  return {
    datos: [[solesCorto(porCobrar), 'por cobrar', 'cobros', venc ? 'aviso' : ''], [enCurso, 'en curso', 'tablero'], [reus, 'reuniones en 7 días', 'actas']],
    chips: [[tareas, tareas === 1 ? 'tarea' : 'tareas', 'pendientes'], legales ? [legales, legales === 1 ? 'plazo legal' : 'plazos legales', 'plazos', 'aviso'] : null, porCobrar ? [solesCorto(porCobrar), 'por cobrar', 'cobros', venc ? 'vencido' : ''] : null, reus ? [reus, reus === 1 ? 'reunión' : 'reuniones', 'actas'] : null, cobrado ? [solesCorto(cobrado), 'cobrado', 'cobros'] : null].filter(Boolean)
  };
}
