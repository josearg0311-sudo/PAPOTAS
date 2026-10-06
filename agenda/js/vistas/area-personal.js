/* PERSONAL: casa, menú de la semana, documentos, cumpleaños y préstamos */
import { elementos, buscarElemento } from '../datos/datos.js';
import { preferencias } from '../datos/preferencias.js';
import { val, casaEstado, proximoCumple, resumenPrestamos } from '../datos/herramientas.js';
import { hoy, fmtCorta, fmtFecha, sumarDias, inicioSemana, diasEntre, relativo } from '../util/fechas.js';
import { fmtSoles, solesCorto } from '../util/dinero.js';
import { listas, esChecklist } from '../datos/pendientes.js';
import { tareasDe } from './espacio-comun.js';
import { esc, ico, vacio, plural } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { fila, filas, emoji, casilla, mini, pildora, pildoraFecha, cifra, cifras, cambiarExtra, nuevo, borrar, boton, pie, anotarMovimiento, quitarMovimiento } from './area-comun.js';
import { editar } from '../piezas/formulario.js';
import { nuevoEvento } from '../piezas/eventos-ui.js';
import { aviso } from '../piezas/aviso.js';
import { compartir } from '../piezas/compartir.js';
import { poner } from '../datos/datos.js';
import { modeloVacio, LISTA_RECORDATORIOS } from '../datos/modelo.js';
import { vistaConstancia, senalesConstancia, TEMAS } from './area-constancia.js';
import { vistaDiario } from './notas.js';
import { avisoPresupuesto } from './finanzas.js';

const ui = { semana: 0 };
const AVISO_DOC = 30;   // los documentos avisan con un mes de anticipación

/* ---------- Casa ---------- */
const casas = () => elementos((x) => x.tipo === 'casa').map((c) => ({ c, e: casaEstado(c, hoy()) })).sort((a, b) => a.e.prox.localeCompare(b.e.prox));
function textoCasa(e) {
  if (e.nivel === 'vencido') return pildora('vencido', 'tocaba ' + fmtCorta(e.prox));
  if (e.nivel === 'hoy') return pildora('hoy', 'toca hoy');
  if (e.nivel === 'pronto') return pildora('pronto', 'en ' + plural(e.dias, 'día', 'días'));
  return '<span class="pill">' + fmtCorta(e.prox) + '</span>';
}
function vistaCasa() {
  const l = casas();
  return tarjeta({ eti: 'CASA', titulo: 'Lo que se repite en casa', n: l.length, clase: 'area-personal',
    guia: 'Cada cosa tiene su frecuencia («cada 7 días»). Al tocar <b>Hecho</b> se anota hoy como la última vez y se calcula la próxima.',
    cuerpo: (l.length ? filas(l.map(({ c, e }) => fila({ inicio: emoji(val(c, 'em', '🧹')), titulo: c.titulo, acc: 'casa-editar', id: c.id,
      meta: 'cada ' + plural(e.cada, 'día', 'días') + (e.ult ? ' · última: ' + fmtCorta(e.ult) : ' · nunca anotada') + ' ' + textoCasa(e),
      final: mini('Hecho', 'casa-hecho', c.id, '', 'Hecho hoy: ' + c.titulo), clase: e.nivel === 'vencido' || e.nivel === 'hoy' ? 'toca' : '' }))) : vacio('Nada anotado', 'Agrega cosas como «cambiar sábanas cada 7 días».')) +
      pie(boton('Nueva cosa de la casa', 'casa-nueva')) });
}
function editarCasa(id, repintar) {
  const c = id ? buscarElemento(id) : null;
  editar({ titulo: c ? 'Cosa de la casa' : 'Nueva cosa de la casa', campos: [
    { n: 'em', t: 'texto', etq: 'Emoji', v: c ? val(c, 'em', '🧹') : '🧹', max: 4, mitad: true },
    { n: 'titulo', t: 'texto', etq: 'Qué', v: c ? c.titulo : '', req: true, max: 60, ph: 'Ej. Cambiar el filtro del agua', mitad: true },
    { n: 'cada', t: 'num', etq: 'Cada cuántos días', v: c ? val(c, 'cada', 7) : 7, mitad: true },
    { n: 'ult', t: 'fecha', etq: 'La última vez', v: c ? val(c, 'ult', '') : '', mitad: true }],
  alGuardar: (v) => {
    const extra = { em: v.em || '🧹', cada: Math.max(1, +v.cada || 7), ult: v.ult || '' };
    if (c) cambiarExtra(id, extra, { titulo: v.titulo }); else nuevo('casa', 'personal', { titulo: v.titulo, extra });
    repintar(); aviso('Guardado');
  }, alBorrar: c ? () => borrar(id, repintar) : null });
}

/* ---------- Menú de la semana ---------- */
const idMenu = (f) => 'menu_' + f;
/* Ideas peruanas para cuando no sabes qué cocinar (🎲) */
export const IDEAS_MENU = {
  alm: ['Ají de gallina', 'Lomo saltado', 'Arroz con pollo', 'Seco de res con frejoles', 'Ceviche', 'Tallarines verdes con bistec', 'Estofado de pollo', 'Arroz chaufa', 'Causa limeña', 'Carapulcra', 'Pollo al horno con papas', 'Olluquito con charqui', 'Tacu tacu con huevo', 'Pescado a lo macho', 'Adobo de cerdo', 'Lentejas con arroz y pescado frito', 'Ajiaco de papas', 'Escabeche de pollo', 'Tallarines rojos', 'Papa a la huancaína y pollo a la plancha', 'Arroz tapado', 'Cau cau', 'Sudado de pescado', 'Pallares con seco'],
  cena: ['Sopa criolla', 'Caldo de gallina', 'Pan con palta y huevo', 'Ensalada de quinua', 'Triple de palta, huevo y tomate', 'Sánguche de pollo', 'Aguadito', 'Tortilla de verduras', 'Quinua con leche', 'Crema de zapallo', 'Choclo con queso', 'Pan con chicharrón', 'Ensalada de pollo', 'Saltado de verduras', 'Avena con manzana', 'Sopa de verduras']
};
const azar = (l, evitar = []) => { const ok = l.filter((x) => !evitar.includes(x)); const de = ok.length ? ok : l; return de[Math.floor(Math.random() * de.length)]; };
function menuDe(f) { return elementos((x) => x.tipo === 'menu' && x.fechas.inicio === f)[0] || null; }
function vistaMenu() {
  const ini = sumarDias(inicioSemana(hoy(), preferencias().semanaLunes), ui.semana * 7), h = hoy();
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(ini, i));
  return tarjeta({ eti: 'MENÚ', titulo: 'Menú de la semana', clase: 'area-personal',
    guia: 'Planifica almuerzo y cena. Toca un día para escribirlo.',
    cuerpo: '<div class="cal-nav chica"><button type="button" class="icono-btn" data-acc="menu-semana" data-n="-1" aria-label="Semana anterior">‹</button><b>' + fmtCorta(dias[0]) + ' – ' + fmtCorta(dias[6]) + '</b><button type="button" class="icono-btn" data-acc="menu-semana" data-n="1" aria-label="Semana siguiente">›</button></div>' +
      filas(dias.map((d) => { const m = menuDe(d), alm = m ? val(m, 'alm', '') : '', cena = m ? val(m, 'cena', '') : '';
        return fila({ inicio: '<span class="hf-dia' + (d === h ? ' es-hoy' : '') + '">' + fmtCorta(d).split(' ').slice(0, 2).join(' ') + '</span>', titulo: alm || (cena ? '—' : 'Sin planificar'), acc: 'menu-editar', id: d,
          meta: cena ? 'Cena: ' + esc(cena) : '', clase: alm || cena ? '' : 'apagada' }); })) +
      pie('<button type="button" class="btn" data-acc="menu-llenar">🎲 Llenar los días vacíos</button><button type="button" class="btn" data-acc="menu-repetir">' + ico('i-repetir') + 'Repetir la semana pasada</button>') });
}
const diasMenu = () => { const ini = sumarDias(inicioSemana(hoy(), preferencias().semanaLunes), ui.semana * 7); return Array.from({ length: 7 }, (_, i) => sumarDias(ini, i)); };
/* Pone el menú de varios días y devuelve cómo estaban, para deshacer */
function ponerMenus(cambios) {
  const antes = cambios.map(([f]) => [f, menuDe(f) ? JSON.parse(JSON.stringify(menuDe(f))) : null]);
  cambios.forEach(([f, alm, cena]) => { const m = menuDe(f); if (m) cambiarExtra(m.id, { alm, cena }); else nuevo('menu', 'personal', { id: idMenu(f), titulo: 'Menú', fechas: { inicio: f }, extra: { alm, cena } }); });
  return () => antes.forEach(([f, x]) => { if (x) poner(x); else { const m = menuDe(f); if (m) cambiarExtra(m.id, { alm: '', cena: '' }); } });
}
function editarMenu(f, repintar) {
  const m = menuDe(f);
  editar({ titulo: 'Menú · ' + fmtCorta(f), campos: [
    { n: 'alm', t: 'texto', etq: 'Almuerzo', v: m ? val(m, 'alm', '') : '', max: 80, ph: 'Ej. Ají de gallina' },
    { n: 'cena', t: 'texto', etq: 'Cena', v: m ? val(m, 'cena', '') : '', max: 80, ph: 'Ej. Sopa criolla' }],
  despues: '<div class="fila-botones izq"><button type="button" class="btn" data-idea="alm">🎲 Idea de almuerzo</button><button type="button" class="btn" data-idea="cena">🎲 Idea de cena</button></div>',
  alGuardar: (v) => {
    if (m) cambiarExtra(m.id, { alm: v.alm, cena: v.cena });
    else if (v.alm || v.cena) nuevo('menu', 'personal', { id: idMenu(f), titulo: 'Menú', fechas: { inicio: f }, extra: { alm: v.alm, cena: v.cena } });
    repintar();
  } });
  document.querySelectorAll('#formHerr [data-idea]').forEach((b) => b.addEventListener('click', () => { const i = document.querySelector('#formHerr [name="' + b.dataset.idea + '"]'); i.value = azar(IDEAS_MENU[b.dataset.idea], [i.value]); }));
}

/* ---------- Documentos ---------- */
function nivelDoc(f) { if (!f) return 'ok'; const n = diasEntre(hoy(), f); return n < 0 ? 'vencido' : n <= AVISO_DOC ? 'pronto' : 'ok'; }
function pillDoc(f) {
  if (!f) return '<span class="pill">sin vencimiento</span>';
  const n = diasEntre(hoy(), f);
  return n < 0 ? pildora('vencido', 'venció ' + fmtCorta(f)) : n <= AVISO_DOC ? pildora('pronto', n === 0 ? 'vence hoy' : 'vence en ' + plural(n, 'día', 'días')) : '<span class="pill">vence ' + fmtFecha(f) + '</span>';
}
const docs = () => elementos((x) => x.tipo === 'documento').sort((a, b) => (a.fechas.vence || '9999').localeCompare(b.fechas.vence || '9999'));
function vistaDocs() {
  const l = docs();
  return tarjeta({ eti: 'DOCUMENTOS', titulo: 'Documentos y vencimientos', n: l.length, clase: 'area-personal',
    guia: 'DNI, SOAT, pasaporte, licencia… Te avisa <b>un mes antes</b> de que venzan.',
    cuerpo: (l.length ? filas(l.map((d) => fila({ inicio: emoji(val(d, 'em', '📄')), titulo: d.titulo, acc: 'doc-editar', id: d.id,
      meta: (val(d, 'num', '') ? 'N.º ' + esc(val(d, 'num', '')) + ' ' : '') + pillDoc(d.fechas.vence) }))) : vacio('Sin documentos', 'Anota tu DNI, SOAT o pasaporte para que te avise antes de que venzan.')) +
      pie(boton('Nuevo documento', 'doc-nuevo')) });
}
function editarDoc(id, repintar) {
  const d = id ? buscarElemento(id) : null;
  editar({ titulo: d ? 'Documento' : 'Nuevo documento', campos: [
    { n: 'em', t: 'texto', etq: 'Emoji', v: d ? val(d, 'em', '📄') : '📄', max: 4, mitad: true },
    { n: 'titulo', t: 'texto', etq: 'Documento', v: d ? d.titulo : '', req: true, max: 60, ph: 'Ej. Pasaporte', mitad: true },
    { n: 'vence', t: 'fecha', etq: 'Vence el', v: d ? d.fechas.vence : '', mitad: true },
    { n: 'num', t: 'texto', etq: 'Número (opcional)', v: d ? val(d, 'num', '') : '', max: 30, mitad: true },
    { n: 'notas', t: 'largo', etq: 'Notas', v: d ? d.notas : '', ph: 'Dónde se renueva, qué llevar…', max: 600 }],
  alGuardar: (v) => {
    const fechas = Object.assign({}, d ? d.fechas : {}, { vence: v.vence || null });
    if (d) cambiarExtra(id, { em: v.em || '📄', num: v.num }, { titulo: v.titulo, notas: v.notas, fechas });
    else nuevo('documento', 'personal', { titulo: v.titulo, notas: v.notas, fechas, extra: { em: v.em || '📄', num: v.num } });
    repintar(); aviso('Guardado');
  }, alBorrar: d ? () => borrar(id, repintar) : null });
}

/* ---------- Cumpleaños ---------- */
const cumples = () => elementos((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'cumple').map((e) => ({ e, p: proximoCumple(e, hoy()) })).filter((x) => x.p).sort((a, b) => a.p.dias - b.p.dias);
function vistaCumples() {
  const l = cumples();
  return tarjeta({ eti: 'CUMPLEAÑOS', titulo: 'Cumpleaños', n: l.length, clase: 'area-personal',
    guia: 'Si pones el año en que nació, te dice cuántos cumple. Te avisa un día antes.',
    cuerpo: (l.length ? filas(l.map(({ e, p }) => fila({ inicio: emoji('🎂'), titulo: e.titulo, acc: 'ev-editar', id: e.id,
      meta: (p.dias === 0 ? pildora('hoy', '¡hoy!') : p.dias <= 7 ? pildora('pronto', relativo(p.fecha).toLowerCase() === 'mañana' ? 'mañana' : 'en ' + p.dias + ' días') : '<span class="pill">' + fmtCorta(p.fecha) + '</span>') + (p.edad ? ' cumple ' + p.edad : ''), clase: p.dias <= 7 ? 'toca' : '',
      final: p.dias === 0 ? mini('🎉 Saludar', 'cumple-saludar', e.id, '', 'Saludar a ' + e.titulo) : p.dias <= 30 ? mini('🎁 Regalo', 'cumple-regalo', e.id, ' data-f="' + p.fecha + '"', 'Recordarme el regalo de ' + e.titulo) : '' }))) : vacio('Sin cumpleaños', 'Agrega los de tu familia y amigos para no olvidarlos.')) +
      pie(boton('Nuevo cumpleaños', 'cumple-nuevo')) });
}

/* ---------- Préstamos ---------- */
const prestamos = () => elementos((x) => x.tipo === 'prestamo').sort((a, b) => (a.estado === 'hecho') - (b.estado === 'hecho') || (a.fechas.vence || '9999').localeCompare(b.fechas.vence || '9999'));
function vistaPrestamos() {
  const l = prestamos(), r = resumenPrestamos(l), act = l.filter((x) => x.estado !== 'hecho'), hechos = l.filter((x) => x.estado === 'hecho').slice(0, 5);
  const f = (x) => { const me = !!val(x, 'meDeben', false);
    return fila({ inicio: casilla(x.estado === 'hecho', 'prest-saldar', x.id, (me ? 'Ya me pagó: ' : 'Ya pagué: ') + x.titulo), titulo: x.titulo, acc: 'prest-editar', id: x.id,
      meta: '<span class="' + (me ? 'txt-ok' : 'txt-aviso') + '">' + (me ? 'Te debe' : 'Le debes') + ' ' + fmtSoles(x.monto || 0) + '</span> ' + (x.estado === 'hecho' ? '<span class="pill">saldado</span>' : pildoraFecha(x.fechas.vence)), clase: x.estado === 'hecho' ? 'hecha' : '' }); };
  return tarjeta({ eti: 'PRÉSTAMOS', titulo: 'Préstamos', clase: 'area-personal',
    guia: 'Lo que te deben y lo que debes. Al marcarlo como pagado se anota en tu libro personal.',
    cuerpo: cifras([cifra(fmtSoles(r.meDeben), 'te deben', 'ok'), cifra(fmtSoles(r.debo), 'debes', r.debo ? 'aviso' : '')]) +
      (act.length ? filas(act.map(f)) : vacio('', 'Nada pendiente. 🙌')) + (hechos.length ? '<div class="grupo-tit"><span>Saldados</span><span class="linea"></span></div>' + filas(hechos.map(f)) : '') +
      pie(boton('Nuevo préstamo', 'prest-nuevo')) });
}
function editarPrestamo(id, repintar) {
  const x = id ? buscarElemento(id) : null;
  editar({ titulo: x ? 'Préstamo' : 'Nuevo préstamo', campos: [
    { n: 'quien', t: 'botones', etq: 'Quién debe', v: x && !val(x, 'meDeben', false) ? 'yo' : 'me', ops: [['me', 'Me deben a mí'], ['yo', 'Yo debo']] },
    { n: 'titulo', t: 'texto', etq: 'Persona y motivo', v: x ? x.titulo : '', req: true, max: 80, ph: 'Ej. Carlos · entradas del concierto' },
    { n: 'monto', t: 'monto', etq: 'Monto (S/)', v: x ? x.monto : null, mitad: true },
    { n: 'vence', t: 'fecha', etq: 'Para cuándo (opcional)', v: x ? x.fechas.vence : '', mitad: true },
    { n: 'notas', t: 'largo', etq: 'Notas', v: x ? x.notas : '', max: 600 }],
  alGuardar: (v) => {
    const fechas = Object.assign({}, x ? x.fechas : {}, { vence: v.vence || null });
    if (x) cambiarExtra(id, { meDeben: v.quien === 'me' }, { titulo: v.titulo, monto: v.monto || 0, notas: v.notas, fechas });
    else nuevo('prestamo', 'personal', { titulo: v.titulo, monto: v.monto || 0, notas: v.notas, fechas, extra: { meDeben: v.quien === 'me' } });
    repintar(); aviso('Guardado');
  }, alBorrar: x ? () => borrar(id, repintar) : null });
}
function saldar(id, repintar) {
  const x = buscarElemento(id); if (!x) return;
  const on = x.estado !== 'hecho', me = !!val(x, 'meDeben', false), idMov = 'mov_prestamo_' + id;
  cambiarExtra(id, { saldadoEn: on ? Date.now() : 0 }, { estado: on ? 'hecho' : 'pendiente' });
  if (on) anotarMovimiento(idMov, { titulo: (me ? 'Me pagó: ' : 'Pagué: ') + x.titulo, area: x.area, monto: x.monto, libro: 'personal', ingreso: me, categoria: 'Préstamos', origen: id });
  else quitarMovimiento(idMov);
  repintar();
  aviso(on ? (me ? '💚 Te pagó · ' : '🧡 Pagaste · ') + fmtSoles(x.monto || 0) + (+x.monto > 0 ? ' anotado en tu libro' : '') : 'Marcado como pendiente', on ? () => saldar(id, repintar) : null);
}

/* ---------- Herramientas y señales ---------- */
export const HERRAMIENTAS = [
  { id: 'casa', nombre: 'Casa', vista: vistaCasa },
  { id: 'menu', nombre: 'Menú', vista: vistaMenu },
  { id: 'documentos', nombre: 'Documentos', vista: vistaDocs },
  { id: 'cumpleanos', nombre: 'Cumpleaños', vista: vistaCumples },
  { id: 'prestamos', nombre: 'Préstamos', vista: vistaPrestamos },
  { id: 'diario', nombre: 'Diario', vista: () => vistaDiario(true) },
  { id: 'constancia', nombre: TEMAS.personal.tab, vista: () => vistaConstancia('personal') }
];
export function senales() {
  const s = [], c = casas().filter((x) => x.e.nivel === 'vencido' || x.e.nivel === 'hoy');
  if (c.length) s.push({ nivel: c.some((x) => x.e.nivel === 'vencido') ? 'vencido' : 'pronto', txt: 'Casa: ' + c.slice(0, 2).map((x) => x.c.titulo).join(', ') + (c.length > 2 ? ' y ' + (c.length - 2) + ' más' : ''), ir: 'casa' });
  docs().filter((d) => nivelDoc(d.fechas.vence) !== 'ok').forEach((d) => s.push({ nivel: nivelDoc(d.fechas.vence), txt: d.titulo + (diasEntre(hoy(), d.fechas.vence) < 0 ? ' venció' : ' vence ' + fmtCorta(d.fechas.vence)), ir: 'documentos' }));
  cumples().filter((x) => x.p.dias <= 7).forEach((x) => s.push({ nivel: x.p.dias <= 1 ? 'pronto' : 'ok', txt: '🎂 ' + x.e.titulo + ' · ' + (x.p.dias === 0 ? 'hoy' : relativo(x.p.fecha).toLowerCase()), ir: 'cumpleanos' }));
  const r = resumenPrestamos(prestamos());
  if (r.meDeben) s.push({ nivel: 'ok', txt: 'Te deben ' + fmtSoles(r.meDeben), ir: 'prestamos' });
  s.push(...senalesConstancia('personal'));
  const pp = avisoPresupuesto('personal'); if (pp) s.push(Object.assign(pp, { ir: 'prestamos', link: '#finanzas' }));
  return s;
}

/* El pulso de Personal: tu casa, tu gente y tus cuentas con otros */
export function pulso() {
  const c = casas(), toca = c.filter((x) => x.e.nivel === 'vencido' || x.e.nivel === 'hoy').length, cu = cumples()[0], r = resumenPrestamos(prestamos());
  const d = docs().filter((x) => nivelDoc(x.fechas.vence) !== 'ok').length;
  return cifras([cifra(toca ? '🧹 ' + toca : '✓', toca ? 'en casa por hacer' : 'casa al día', toca ? 'aviso' : 'ok'),
    cifra(cu ? '🎂 ' + (cu.p.dias === 0 ? 'hoy' : cu.p.dias + ' d') : '—', cu ? 'cumple ' + cu.e.titulo : 'sin cumpleaños'),
    cifra(fmtSoles(r.meDeben), 'te deben', r.meDeben ? 'ok' : ''), cifra(d ? '📄 ' + d : '✓', d ? 'documentos por renovar' : 'documentos al día', d ? 'aviso' : 'ok')]);
}

/* Su semana, para la revisión semanal */
export function semana(ini, fin) {
  const casaHecha = elementos((x) => x.tipo === 'casa').filter((c) => { const u = val(c, 'ult', ''); return u >= ini && u <= fin; }).length;
  const toca = casas().filter((x) => x.e.nivel === 'vencido').length, prox = sumarDias(fin, 7);
  const cu = cumples().filter((x) => x.p.fecha > fin && x.p.fecha <= prox), dv = docs().filter((d) => nivelDoc(d.fechas.vence) !== 'ok');
  return { pregunta: '¿Cómo estuvo tu casa y tu gente esta semana? ¿A quién deberías llamar?',
    cifras: [[casaHecha, casaHecha === 1 ? 'cosa de la casa hecha' : 'cosas de la casa hechas', 'ok'], [toca, 'atrasadas en casa', toca ? 'aviso' : 'ok'], [fmtSoles(resumenPrestamos(prestamos()).meDeben), 'te deben', '']],
    notas: cu.map((x) => '🎂 La próxima semana: ' + x.e.titulo + ' (' + fmtCorta(x.p.fecha) + ')').concat(dv.map((d) => '📄 ' + d.titulo + ': ' + (diasEntre(hoy(), d.fechas.vence) < 0 ? 'vencido' : 'vence ' + fmtCorta(d.fechas.vence)))) };
}

export const acciones = {
  'casa-nueva'(b, ev, rp) { editarCasa(null, rp); },
  'casa-editar'(b, ev, rp) { editarCasa(b.dataset.id, rp); },
  'casa-hecho'(b, ev, rp) {
    const c = buscarElemento(b.dataset.id), antes = val(c, 'ult', '');
    cambiarExtra(c.id, { ult: hoy() }); rp();
    aviso('✓ ' + c.titulo + ' · la próxima: ' + fmtCorta(casaEstado(buscarElemento(c.id), hoy()).prox), () => { cambiarExtra(c.id, { ult: antes }); rp(); });
  },
  'menu-semana'(b) { ui.semana += +b.dataset.n; return true; },
  'menu-editar'(b, ev, rp) { editarMenu(b.dataset.id, rp); },
  'doc-nuevo'(b, ev, rp) { editarDoc(null, rp); },
  'doc-editar'(b, ev, rp) { editarDoc(b.dataset.id, rp); },
  'menu-llenar'(b, ev, rp) {
    const dias = diasMenu(), usados = dias.map((d) => menuDe(d)).filter(Boolean).flatMap((m) => [val(m, 'alm', ''), val(m, 'cena', '')]), c = [];
    dias.forEach((d) => { const m = menuDe(d); if (m && (val(m, 'alm', '') || val(m, 'cena', ''))) return;
      const a = azar(IDEAS_MENU.alm, usados), k = azar(IDEAS_MENU.cena, usados); usados.push(a, k); c.push([d, a, k]); });
    if (!c.length) { aviso('Esta semana ya está completa'); return; }
    const deshacer = ponerMenus(c); rp(); aviso('🎲 ' + c.length + (c.length === 1 ? ' día llenado' : ' días llenados') + '. Toca un día para cambiarlo.', () => { deshacer(); rp(); });
  },
  'menu-repetir'(b, ev, rp) {
    const c = diasMenu().map((d) => { const m = menuDe(sumarDias(d, -7)), y = menuDe(d); return m && !(y && (val(y, 'alm', '') || val(y, 'cena', ''))) && (val(m, 'alm', '') || val(m, 'cena', '')) ? [d, val(m, 'alm', ''), val(m, 'cena', '')] : null; }).filter(Boolean);
    if (!c.length) { aviso('No hay nada que copiar a los días vacíos'); return; }
    const deshacer = ponerMenus(c); rp(); aviso('Se copió la semana pasada en ' + plural(c.length, 'día', 'días'), () => { deshacer(); rp(); });
  },
  'cumple-saludar'(b) { const e = buscarElemento(b.dataset.id); compartir({ titulo: 'Feliz cumpleaños', texto: '¡Feliz cumpleaños, ' + e.titulo.replace(/^(cumple(años)?( de)?\s*)/i, '') + '! 🎂🎉 Que pases un día increíble.' }); },
  'cumple-regalo'(b, ev, rp) {
    const e = buscarElemento(b.dataset.id), f = b.dataset.f, cuando = sumarDias(f, -3) > hoy() ? sumarDias(f, -3) : hoy(), nom = e.titulo.replace(/^(cumple(años)?( de)?\s*)/i, '');
    const id = 'regalo_' + e.id + '_' + f.slice(0, 4);
    if (buscarElemento(id) && !buscarElemento(id).borrado) { aviso('Ya tienes el recordatorio del regalo'); return; }
    poner(Object.assign(modeloVacio(), { id, tipo: 'pendiente', titulo: '🎁 Regalo para ' + nom, area: 'personal', lista: LISTA_RECORDATORIOS, borrado: null, fechas: Object.assign(modeloVacio().fechas, { inicio: cuando, vence: f }) }));
    rp(); aviso('🎁 Te lo recuerdo el ' + fmtCorta(cuando));
  },
  'cumple-nuevo'(b, ev, rp) { nuevoEvento(rp, { fecha: hoy(), tipoEvento: 'cumple', area: 'personal' }); },
  'prest-nuevo'(b, ev, rp) { editarPrestamo(null, rp); },
  'prest-editar'(b, ev, rp) { editarPrestamo(b.dataset.id, rp); },
  'prest-saldar'(b, ev, rp) { saldar(b.dataset.id, rp); }
};

/* Resumen para «Tus espacios» y la portada del espacio (como la v4.5) */
export function resumen() {
  const cu = cumples()[0], r = resumenPrestamos(prestamos()), tareas = tareasDe('personal');
  const ids = new Set(listas().filter((l) => esChecklist(l) && l.area === 'personal').map((l) => l.id));
  const porComprar = elementos((x) => x.tipo === 'pendiente' && ids.has(x.lista) && x.estado !== 'hecho').length;
  const toca = casas().filter((x) => x.e.nivel === 'vencido' || x.e.nivel === 'hoy').length;
  return {
    datos: [[porComprar, 'por comprar', 'notas'], cu ? [cu.p.dias === 0 ? '🎂' : cu.p.dias, cu.p.dias === 0 ? 'cumple hoy ' + cu.e.titulo : 'días al próximo cumple', 'cumpleanos'] : ['—', 'sin cumpleaños cerca', 'cumpleanos'], [solesCorto(r.meDeben), 'te deben', 'prestamos']],
    chips: [[tareas, tareas === 1 ? 'tarea' : 'tareas', 'pendientes'], toca ? [toca, 'en casa', 'casa', 'aviso'] : null, cu ? [cu.p.dias === 0 ? 'hoy' : cu.p.dias + ' d', 'al cumple', 'cumpleanos'] : null, r.meDeben ? [solesCorto(r.meDeben), 'te deben', 'prestamos'] : null].filter(Boolean)
  };
}
