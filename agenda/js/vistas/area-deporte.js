/* DEPORTE: entrenamientos como hábito (meta semanal, racha y aviso si pasan
   días sin entrenar), rutinas y récords, partidos (y la pichanga), y peso */
import { elementos, buscarElemento, aPapelera } from '../datos/datos.js';
import { preferencias, cambiarPref } from '../datos/preferencias.js';
import { val, lista, rachaEntrenos, avisoEntreno, records, resumenPartidos, pichanga, tendenciaPeso, ordenDias } from '../datos/herramientas.js';
import { hoy, fmtCorta, fmtHora, sumarDias, inicioSemana, diasEntre, DIAS3 } from '../util/fechas.js';
import { fmtSoles } from '../util/dinero.js';
import { esc, ico, vacio, plural } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { fila, filas, emoji, mini, pildora, cifra, cifras, cambiarExtra, nuevo, borrar, boton, pie } from './area-comun.js';
import { editar } from '../piezas/formulario.js';
import { nuevoEvento } from '../piezas/eventos-ui.js';
import { aviso } from '../piezas/aviso.js';
import { vistaConstancia, senalesConstancia, TEMAS } from './area-constancia.js';

export const DEPORTES = [['gym', '🏋️', 'Gym'], ['correr', '🏃', 'Correr'], ['futbol', '⚽', 'Fútbol'], ['bici', '🚴', 'Bici'], ['nadar', '🏊', 'Nadar'], ['otro', '💪', 'Otro']];
const INTENS = [['1', 'Suave'], ['2', 'Medio'], ['3', 'Duro']];
const dep = (k) => DEPORTES.find((d) => d[0] === k) || DEPORTES[5];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hora = (h) => fmtHora(h, preferencias().formatoHora);

/* ---------- Entrenamientos ---------- */
const entrenos = () => elementos((x) => x.tipo === 'entreno').sort((a, b) => (b.fechas.inicio || '').localeCompare(a.fechas.inicio || ''));
export const deporteDe = (e) => (e.extra && e.extra.deporte) || (e.datos && e.datos.tipo) || 'otro';
export function estadoEntrenos() {
  const p = preferencias();
  return rachaEntrenos(entrenos().map((e) => e.fechas.inicio), hoy(), { meta: p.deporte.meta, lunes: p.semanaLunes });
}
export function avisoDeporte() { const d = preferencias().deporte.avisoDias; return d ? avisoEntreno(estadoEntrenos(), d) : null; }

function vistaEntrenos() {
  const p = preferencias(), r = estadoEntrenos(), av = avisoDeporte(), l = entrenos(), h = hoy();
  const ini = inicioSemana(h, p.semanaLunes), dias = Array.from({ length: 7 }, (_, i) => sumarDias(ini, i));
  const fechas = new Set(l.map((e) => e.fechas.inicio));
  const semMin = l.filter((e) => e.fechas.inicio >= ini).reduce((s, e) => s + (+val(e, 'minutos', 0) || 0), 0);
  return tarjeta({ eti: 'HÁBITO', titulo: 'Entrenar ' + plural(p.deporte.meta, 'vez', 'veces') + ' por semana', clase: 'area-deporte',
    guia: 'Tus entrenos cuentan como hábito: cada semana que llegas a tu meta suma a la <b>racha</b>. Si pasan ' + p.deporte.avisoDias + ' días sin entrenar, te aviso en Hoy.',
    cuerpo: cifras([cifra('🔥 ' + r.semanas, r.semanas === 1 ? 'semana de racha' : 'semanas de racha', r.semanas ? 'ok' : ''), cifra(r.estaSemana + '/' + r.meta, 'esta semana', r.estaSemana >= r.meta ? 'ok' : ''), cifra(Math.round(semMin / 6) / 10 + ' h', 'esta semana')]) +
      '<div class="semana-puntos" role="img" aria-label="Días entrenados esta semana: ' + r.estaSemana + '">' + dias.map((d) => '<span class="' + (fechas.has(d) ? 'si' : '') + (d === h ? ' es-hoy' : '') + (d > h ? ' futuro' : '') + '"><i></i><small>' + DIAS3[new Date(d + 'T12:00:00Z').getUTCDay()] + '</small></span>').join('') + '</div>' +
      (av ? '<div class="nota-fase aviso-carga">' + ico('i-fuego') + '<span><b>' + esc(av) + '.</b> Un entreno corto también cuenta.</span></div>' : r.diasSin === 0 ? '<p class="texto-tarjeta txt-ok">✓ Hoy ya entrenaste.</p>' : '') +
      '<div class="rapidos">' + DEPORTES.map((d) => '<button type="button" class="mini-btn" data-acc="ent-nuevo" data-v="' + d[0] + '">' + d[1] + ' ' + d[2] + '</button>').join('') + '</div>' +
      pie('<button type="button" class="btn" data-acc="ent-meta">' + ico('i-meta') + 'Cambiar meta y aviso</button>') }) +
    tarjeta({ eti: 'REGISTRO', titulo: 'Tus entrenamientos', n: l.length, clase: 'area-deporte',
      cuerpo: l.length ? filas(l.slice(0, 12).map((e) => { const d = dep(deporteDe(e)), km = val(e, 'km', ''), it = val(e, 'int', '');
        return fila({ inicio: emoji(d[1]), titulo: e.titulo || d[2], acc: 'ent-editar', id: e.id,
          meta: cap(fmtCorta(e.fechas.inicio)) + ' · ' + (+val(e, 'minutos', 0) || 0) + ' min' + (km ? ' · ' + km + ' km' : '') + (it ? ' · ' + (INTENS[+it - 1] || ['', ''])[1].toLowerCase() : '') + (e.notas ? ' · ' + esc(e.notas) : '') }); })) : vacio('Aún no hay entrenos', 'Toca un deporte de arriba para anotar el primero.') });
}
function editarEntreno(id, repintar, pre = {}) {
  const e = id ? buscarElemento(id) : null, ruts = rutinas();
  const ejs = e ? lista(e, 'ejercicios', 'ejs') : pre.ejercicios || [];
  editar({ titulo: e ? 'Entrenamiento' : 'Nuevo entrenamiento', campos: [
    { n: 'deporte', t: 'botones', etq: 'Qué hiciste', v: e ? deporteDe(e) : pre.deporte || 'gym', ops: DEPORTES.map((d) => [d[0], d[1] + ' ' + d[2]]) },
    { n: 'fecha', t: 'fecha', etq: 'Día', v: e ? e.fechas.inicio : pre.fecha || hoy(), mitad: true },
    { n: 'minutos', t: 'num', etq: 'Minutos', v: e ? val(e, 'minutos', 60) : pre.minutos || 60, mitad: true },
    { n: 'km', t: 'dec', etq: 'Km (opcional)', v: e ? val(e, 'km', '') : '', mitad: true },
    { n: 'rutina', t: 'sel', etq: 'Rutina', v: e ? val(e, 'rutina', '') : pre.rutina || '', ops: [['', 'Ninguna']].concat(ruts.map((r) => [r.id, r.titulo])), mitad: true },
    { n: 'int', t: 'botones', etq: 'Intensidad', v: String(e ? val(e, 'int', 2) : 2), ops: INTENS },
    { n: 'ejs', t: 'filas', etq: 'Ejercicios (opcional)', boton: 'Agregar ejercicio', v: ejs, nuevo: () => ({ n: '', s: 3, r: 10, p: '' }),
      cols: [{ n: 'n', t: 'texto', etq: 'Ejercicio', ancho: '2.2fr' }, { n: 's', t: 'num', etq: 'Series', ancho: '1fr' }, { n: 'r', t: 'num', etq: 'Reps', ancho: '1fr' }, { n: 'p', t: 'dec', etq: 'Kg', ancho: '1fr' }], vale: (j) => j.n },
    { n: 'notas', t: 'texto', etq: 'Notas', v: e ? e.notas : '', max: 200, ph: 'Ej. Pecho y tríceps' }],
  alGuardar: (v) => {
    const d = dep(v.deporte), rid = ruts.some((r) => r.id === v.rutina) ? v.rutina : '';
    const extra = { deporte: v.deporte, minutos: Math.max(1, +v.minutos || 0), km: v.km, int: +v.int || 2, rutina: rid, ejercicios: v.ejs };
    const fechas = Object.assign({}, e ? e.fechas : {}, { inicio: v.fecha || hoy() });
    if (e) cambiarExtra(id, extra, { titulo: d[2], notas: v.notas, fechas }); else nuevo('entreno', 'deporte', { titulo: d[2], notas: v.notas, fechas, estado: 'hecho', extra });
    repintar();
    const r = estadoEntrenos(); aviso(d[1] + ' Entreno anotado · ' + r.estaSemana + '/' + r.meta + ' esta semana' + (r.estaSemana === r.meta ? ' 🎉 ¡meta cumplida!' : ''));
  }, alBorrar: e ? () => borrar(id, repintar) : null });
}
function editarMeta(repintar) {
  const p = preferencias().deporte;
  editar({ titulo: 'Tu meta de entrenamiento', campos: [
    { n: 'meta', t: 'botones', etq: 'Veces por semana', v: String(p.meta), ops: [1, 2, 3, 4, 5, 6, 7].map((n) => [String(n), String(n)]) },
    { n: 'aviso', t: 'botones', etq: 'Avisarme si pasan sin entrenar', v: String(p.avisoDias), ops: [['2', '2 días'], ['3', '3 días'], ['4', '4 días'], ['5', '5 días'], ['7', '1 semana'], ['0', 'No avisar']] }],
  alGuardar: (v) => { cambiarPref({ deporte: { meta: +v.meta || 3, avisoDias: +v.aviso } }); repintar(); aviso('Meta guardada'); } });
}

/* ---------- Rutinas y récords ---------- */
const rutinas = () => elementos((x) => x.tipo === 'rutina').sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
const ejsRutina = (r) => lista(r, 'ejercicios');
function vistaRutinas() {
  const l = rutinas(), rec = records(entrenos()), orden = ordenDias(preferencias().semanaLunes), hoyD = new Date(hoy() + 'T12:00:00Z').getUTCDay();
  return tarjeta({ eti: 'RUTINAS', titulo: 'Rutinas de gym', n: l.length, clase: 'area-deporte',
    guia: 'Arma tus rutinas una vez. Con <b>Hacer hoy</b> se anota el entreno con sus ejercicios listos para ajustar los kilos.',
    cuerpo: (l.length ? filas(l.map((r) => { const ds = (val(r, 'dias', []) || []).map(Number), ej = ejsRutina(r);
      return fila({ titulo: r.titulo, acc: 'rut-editar', id: r.id, clase: ds.includes(hoyD) ? 'toca' : '',
        meta: (ds.length ? orden.filter((d) => ds.includes(d)).map((d) => DIAS3[d]).join(', ') : 'cualquier día') + ' · ' + plural(ej.length, 'ejercicio', 'ejercicios') + (ds.includes(hoyD) ? ' <span class="pill pronto">toca hoy</span>' : ''),
        final: mini(ico('i-play') + 'Hacer hoy', 'rut-hoy', r.id) }); })) : vacio('Sin rutinas', 'Crea una rutina con sus ejercicios, series, repeticiones y kilos.')) +
      pie(boton('Nueva rutina', 'rut-nueva')) }) +
    tarjeta({ eti: 'RÉCORDS', titulo: 'Tus récords', n: rec.length, clase: 'area-deporte',
      guia: 'El mayor peso que levantaste en cada ejercicio, sacado de tus entrenos.',
      cuerpo: rec.length ? filas(rec.map((x) => fila({ inicio: emoji('🏆'), titulo: x.n, meta: '<b class="mono">' + x.p + ' kg</b>' + (x.reps ? ' × ' + x.reps : '') + ' · ' + fmtCorta(x.fecha) }))) : vacio('', 'Anota los kilos en tus entrenos y aquí verás tus récords.') });
}
function editarRutina(id, repintar) {
  const r = id ? buscarElemento(id) : null, orden = ordenDias(preferencias().semanaLunes);
  editar({ titulo: r ? r.titulo : 'Nueva rutina', campos: [
    { n: 'titulo', t: 'texto', etq: 'Nombre', v: r ? r.titulo : '', req: true, max: 50, ph: 'Ej. Pecho y tríceps' },
    { n: 'dias', t: 'multi', etq: 'Qué días toca (opcional)', v: r ? (val(r, 'dias', []) || []).map(String) : [], ops: orden.map((d) => [String(d), cap(DIAS3[d])]) },
    { n: 'ejs', t: 'filas', etq: 'Ejercicios', boton: 'Agregar ejercicio', v: r ? ejsRutina(r) : [{ n: '', s: 4, r: 10, p: '' }], nuevo: () => ({ n: '', s: 3, r: 10, p: '' }),
      cols: [{ n: 'n', t: 'texto', etq: 'Ejercicio', ancho: '2.2fr' }, { n: 's', t: 'num', etq: 'Series', ancho: '1fr' }, { n: 'r', t: 'num', etq: 'Reps', ancho: '1fr' }, { n: 'p', t: 'dec', etq: 'Kg', ancho: '1fr' }], vale: (j) => j.n }],
  alGuardar: (v) => {
    const extra = { dias: v.dias.map(Number), ejercicios: v.ejs };
    if (r) cambiarExtra(id, extra, { titulo: v.titulo }); else nuevo('rutina', 'deporte', { titulo: v.titulo, extra });
    repintar(); aviso('Rutina guardada');
  }, alBorrar: r ? () => borrar(id, repintar) : null });
}

/* ---------- Partidos ---------- */
const partidos = () => elementos((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'partido');
function vistaPartidos() {
  const h = hoy(), l = partidos(), prox = l.filter((x) => x.fechas.inicio >= h && !val(x, 'jugado', false)).sort((a, b) => a.fechas.inicio.localeCompare(b.fechas.inicio));
  const jug = l.filter((x) => val(x, 'jugado', false)).sort((a, b) => b.fechas.inicio.localeCompare(a.fechas.inicio)), falta = l.filter((x) => x.fechas.inicio < h && !val(x, 'jugado', false));
  const r = resumenPartidos(l), RES = { v: '✅ Ganado', e: '🤝 Empate', d: '❌ Perdido' };
  return prox.map((x) => { const p = pichanga(x), d = diasEntre(h, x.fechas.inicio);
    return '<section class="tarjeta area-deporte"><header class="t-cab"><span class="eti">PARTIDO</span><h2>' + esc(x.titulo) + '</h2>' + (d === 0 ? pildora('hoy', '¡hoy!') : d === 1 ? pildora('pronto', 'mañana') : '<span class="pill">' + fmtCorta(x.fechas.inicio) + '</span>') + '</header>' +
      '<p class="ex-meta">' + cap(fmtCorta(x.fechas.inicio)) + (x.fechas.hora ? ' · ' + hora(x.fechas.hora) : '') + (x.extra.lugar ? ' · ' + esc(x.extra.lugar) : '') + '</p>' +
      (p ? cifras([cifra(fmtSoles(p.costo), 'cancha'), cifra(fmtSoles(p.cuota), 'por jugador'), cifra(p.pagaron + '/' + p.jug.length, 'pagaron', p.falta ? 'aviso' : 'ok')]) +
        '<div class="jugadores">' + p.jug.map((j, i) => '<button type="button" class="jugador" role="checkbox" aria-checked="' + !!j.p + '" data-acc="pich-pago" data-id="' + esc(x.id) + '" data-i="' + i + '"><span class="casilla chica" aria-hidden="true"><span></span></span>' + esc(j.n) + '</button>').join('') + '</div>' : '') +
      '<div class="pie-tarjeta">' + mini('⚽ ' + (p ? 'Editar pichanga' : 'Organizar pichanga'), 'pich-editar', x.id) + mini('Resultado', 'par-resultado', x.id) + mini('Editar partido', 'ev-editar', x.id) + '</div></section>'; }).join('') +
    tarjeta({ eti: 'PARTIDOS', titulo: 'Tus partidos', clase: 'area-deporte',
      guia: 'Anota cómo quedó cada partido: llevas tu récord, goles y asistencias. Un partido también puede contar como entreno.',
      cuerpo: (r.jugados ? cifras([cifra(r.v + '-' + r.e + '-' + r.d, 'ganados · empates · perdidos'), cifra('⚽ ' + r.goles, 'goles'), cifra('🅰️ ' + r.asist, 'asistencias')]) : '') +
        (falta.length ? '<div class="grupo-tit"><span>¿Cómo quedaron?</span><span class="linea"></span></div>' + filas(falta.slice(0, 4).map((x) => fila({ titulo: x.titulo, meta: fmtCorta(x.fechas.inicio), acc: 'par-resultado', id: x.id, final: mini('Anotar', 'par-resultado', x.id) }))) : '') +
        (jug.length ? '<div class="grupo-tit"><span>Jugados</span><span class="linea"></span></div>' + filas(jug.slice(0, 10).map((x) => fila({ titulo: x.titulo, acc: 'par-resultado', id: x.id,
          meta: fmtCorta(x.fechas.inicio) + ' · ' + (RES[val(x, 'res', '')] || '') + (val(x, 'resultado', '') ? ' ' + esc(val(x, 'resultado', '')) : '') + (+val(x, 'goles', 0) ? ' · ' + plural(+val(x, 'goles', 0), 'gol', 'goles') : '') }))) : (!prox.length && !falta.length ? vacio('Sin partidos', 'Agenda tu próxima pichanga o partido de liga.') : '')) +
        pie(boton('Nuevo partido', 'par-nuevo')) });
}
function editarResultado(id, repintar) {
  const x = buscarElemento(id), idEnt = 'entreno_partido_' + id, ya = buscarElemento(idEnt);
  editar({ titulo: 'Resultado · ' + x.titulo, campos: [
    { n: 'res', t: 'botones', etq: 'Cómo quedó', v: val(x, 'res', 'v'), ops: [['v', '✅ Ganamos'], ['e', '🤝 Empate'], ['d', '❌ Perdimos']] },
    { n: 'resultado', t: 'texto', etq: 'Marcador', v: val(x, 'resultado', ''), max: 12, ph: 'Ej. 5-3', mitad: true },
    { n: 'goles', t: 'num', etq: 'Tus goles', v: val(x, 'goles', 0), mitad: true },
    { n: 'asist', t: 'num', etq: 'Tus asistencias', v: val(x, 'asist', 0), mitad: true },
    { n: 'min', t: 'num', etq: 'Minutos jugados', v: ya ? val(ya, 'minutos', 90) : 90, mitad: true },
    { n: 'entreno', t: 'si', etq: 'Contar como entreno (suma a tu racha)', v: !ya || !ya.borrado }],
  alGuardar: (v) => {
    cambiarExtra(id, { jugado: true, res: v.res, resultado: v.resultado, goles: +v.goles || 0, asist: +v.asist || 0 });
    if (v.entreno) nuevo('entreno', 'deporte', { id: idEnt, titulo: 'Fútbol', estado: 'hecho', borrado: null, notas: x.titulo + (v.resultado ? ' · ' + v.resultado : ''), fechas: { inicio: x.fechas.inicio }, extra: { deporte: 'futbol', minutos: Math.max(1, +v.min || 90), int: 3, partido: id } });
    else if (ya && !ya.borrado) aPapelera(idEnt);
    repintar(); aviso('Resultado guardado' + (v.entreno ? ' · cuenta como entreno ⚽' : ''));
  } });
}
function editarPichanga(id, repintar) {
  const x = buscarElemento(id), p = pichanga(x);
  editar({ titulo: 'Pichanga · ' + x.titulo, campos: [
    { n: 'costo', t: 'monto', etq: 'Costo de la cancha (S/)', v: p ? p.costo : null },
    { n: 'jug', t: 'filas', etq: 'Jugadores', boton: 'Agregar jugador', v: p ? p.jug : [], nuevo: () => ({ n: '', p: false }),
      cols: [{ n: 'n', t: 'texto', etq: 'Nombre', ancho: '1fr', max: 30 }, { n: 'p', t: 'si', etq: 'Ya pagó', ancho: '44px' }], vale: (j) => j.n, ayuda: 'La casilla marca a los que ya pagaron su parte.' }],
  alGuardar: (v) => { cambiarExtra(id, { pich: { costoC: v.costo || 0, jug: v.jug.map((j) => ({ n: j.n, p: !!j.p })) } }); repintar(); } });
}

/* ---------- Peso ---------- */
const medidas = () => elementos((x) => x.tipo === 'medida');
function grafico(t) {
  const ps = t.puntos; if (ps.length < 2) return '';
  const W = 320, H = 96, m = 14, min = Math.min(...ps.map((x) => x.p)), max = Math.max(...ps.map((x) => x.p)), rango = Math.max(0.5, max - min);
  const X = (i) => m + i * (W - 2 * m - 58) / (ps.length - 1), Y = (p) => m + (1 - (p - min) / rango) * (H - 2 * m);
  const linea = ps.map((x, i) => X(i).toFixed(1) + ',' + Y(x.p).toFixed(1)).join(' '), u = ps[ps.length - 1];
  return '<svg class="grafico-peso" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Peso: de ' + ps[0].p + ' kg (' + fmtCorta(ps[0].f) + ') a ' + u.p + ' kg (' + fmtCorta(u.f) + ')">' +
    '<line class="gp-base" x1="' + m + '" x2="' + (W - m - 58) + '" y1="' + (H - m) + '" y2="' + (H - m) + '"/>' +
    '<polyline class="gp-linea" points="' + linea + '"/>' +
    ps.map((x, i) => '<circle class="gp-hit" cx="' + X(i).toFixed(1) + '" cy="' + Y(x.p).toFixed(1) + '" r="10"><title>' + fmtCorta(x.f) + ': ' + x.p + ' kg</title></circle>').join('') +
    '<circle class="gp-punto" cx="' + X(ps.length - 1).toFixed(1) + '" cy="' + Y(u.p).toFixed(1) + '" r="5"/>' +
    '<text class="gp-txt" x="' + (X(ps.length - 1) + 10).toFixed(1) + '" y="' + (Y(u.p) + 4).toFixed(1) + '">' + u.p + ' kg</text></svg>';
}
function vistaPeso() {
  const l = medidas().sort((a, b) => (b.fechas.inicio || '').localeCompare(a.fechas.inicio || '')), t = tendenciaPeso(l, hoy());
  return tarjeta({ eti: 'PESO', titulo: 'Peso y medidas', n: l.length, clase: 'area-deporte',
    guia: 'Pésate una vez por semana, a la misma hora, y mira la tendencia más que el número del día.',
    cuerpo: (t ? cifras([cifra(t.ultimo + ' kg', 'último · ' + fmtCorta(t.fecha)), cifra(t.cambio30 == null ? '—' : (t.cambio30 > 0 ? '+' : '') + t.cambio30 + ' kg', 'en 30 días')]) + grafico(t) +
      filas(l.slice(0, 8).map((m) => fila({ titulo: (+val(m, 'peso', 0) || '—') + ' kg', acc: 'peso-editar', id: m.id, meta: cap(fmtCorta(m.fechas.inicio)) + (val(m, 'cintura', '') ? ' · cintura ' + val(m, 'cintura', '') + ' cm' : '') })))
      : vacio('Sin registros', 'Anota tu peso para ver cómo va.')) + pie(boton('Anotar peso', 'peso-nuevo')) });
}
function editarPeso(id, repintar) {
  const m = id ? buscarElemento(id) : null;
  editar({ titulo: m ? 'Peso' : 'Anotar peso', campos: [
    { n: 'fecha', t: 'fecha', etq: 'Día', v: m ? m.fechas.inicio : hoy(), mitad: true },
    { n: 'peso', t: 'dec', etq: 'Peso (kg)', v: m ? val(m, 'peso', '') : '', req: true, mitad: true, ph: 'Ej. 74.8' },
    { n: 'cintura', t: 'dec', etq: 'Cintura (cm, opcional)', v: m ? val(m, 'cintura', '') : '' }],
  alGuardar: (v) => {
    if (!(+v.peso > 0)) { aviso('Escribe tu peso en kilos'); return false; }
    const f = v.fecha || hoy(), otro = medidas().find((x) => x.fechas.inicio === f && (!m || x.id !== m.id));
    const extra = { peso: +v.peso, cintura: v.cintura };
    if (m) cambiarExtra(id, extra, { fechas: Object.assign({}, m.fechas, { inicio: f }) });
    else if (otro) cambiarExtra(otro.id, extra);
    else nuevo('medida', 'deporte', { id: 'medidas_' + f, titulo: 'Peso', fechas: { inicio: f }, extra });
    repintar(); aviso('Peso anotado · ' + v.peso + ' kg');
  }, alBorrar: m ? () => borrar(id, repintar) : null });
}

/* ---------- Herramientas y señales ---------- */
export const HERRAMIENTAS = [
  { id: 'entrenos', nombre: 'Entrenos y racha', vista: vistaEntrenos },
  { id: 'rutinas', nombre: 'Rutinas y récords', vista: vistaRutinas },
  { id: 'partidos', nombre: 'Partidos', vista: vistaPartidos },
  { id: 'peso', nombre: 'Peso', vista: vistaPeso },
  { id: 'constancia', nombre: TEMAS.deporte.tab, vista: () => vistaConstancia('deporte') }
];
export function senales() {
  const s = [], r = estadoEntrenos(), av = avisoDeporte(), h = hoy();
  if (av) s.push({ nivel: 'pronto', txt: '🔥 ' + av, ir: 'entrenos' });
  s.push({ nivel: 'ok', txt: 'Esta semana: ' + r.estaSemana + '/' + r.meta + ' entrenos' + (r.semanas ? ' · racha de ' + plural(r.semanas, 'semana', 'semanas') : ''), ir: 'entrenos' });
  partidos().filter((x) => x.fechas.inicio >= h && diasEntre(h, x.fechas.inicio) <= 3 && !val(x, 'jugado', false)).forEach((x) => { const p = pichanga(x);
    s.push({ nivel: 'ok', txt: '⚽ ' + x.titulo + ' · ' + (x.fechas.inicio === h ? 'hoy' : fmtCorta(x.fechas.inicio)) + (p && p.falta ? ' · faltan pagar ' + fmtSoles(p.falta) : ''), ir: 'partidos' }); });
  s.push(...senalesConstancia('deporte'));
  return s;
}

/* El pulso de Deporte: racha, semana, último entreno y peso */
export function pulso() {
  const r = estadoEntrenos(), t = tendenciaPeso(medidas(), hoy());
  return cifras([cifra('🔥 ' + r.semanas, r.semanas === 1 ? 'semana de racha' : 'semanas de racha', r.semanas ? 'ok' : ''),
    cifra(r.estaSemana + '/' + r.meta, 'entrenos esta semana', r.estaSemana >= r.meta ? 'ok' : ''),
    cifra(r.diasSin == null ? '—' : r.diasSin === 0 ? 'hoy' : 'hace ' + r.diasSin + ' d', 'último entreno', avisoDeporte() ? 'aviso' : ''),
    cifra(t ? t.ultimo + ' kg' : '—', 'peso')]);
}

/* Su semana, para la revisión semanal */
export function semana(ini, fin) {
  const es = entrenos().filter((e) => e.fechas.inicio >= ini && e.fechas.inicio <= fin), meta = preferencias().deporte.meta;
  const min = es.reduce((s, e) => s + (+val(e, 'minutos', 0) || 0), 0), km = es.reduce((s, e) => s + (+String(val(e, 'km', 0) || 0).replace(',', '.') || 0), 0);
  const pj = partidos().filter((x) => val(x, 'jugado', false) && x.fechas.inicio >= ini && x.fechas.inicio <= fin), t = tendenciaPeso(medidas(), fin);
  return { pregunta: '¿Cómo respondió tu cuerpo? ¿Descansaste lo suficiente?',
    cifras: [[es.length + '/' + meta, 'entrenos (tu meta)', es.length >= meta ? 'ok' : 'aviso'], [Math.round(min / 6) / 10 + ' h', 'entrenando', ''], [Math.round(km * 10) / 10 + ' km', 'recorridos', '']],
    notas: (es.length >= meta ? ['🔥 ¡Cumpliste tu meta de la semana!'] : ['Te faltaron ' + plural(meta - es.length, 'entreno', 'entrenos') + ' para tu meta.'])
      .concat(pj.map((x) => '⚽ ' + x.titulo + (val(x, 'resultado', '') ? ' · ' + val(x, 'resultado', '') : ''))).concat(t && t.cambio30 != null ? ['⚖️ Peso: ' + t.ultimo + ' kg (' + (t.cambio30 > 0 ? '+' : '') + t.cambio30 + ' kg en 30 días)'] : []) };
}

export const acciones = {
  'ent-nuevo'(b, ev, rp) { const k = b.dataset.v; editarEntreno(null, rp, { deporte: k, minutos: k === 'futbol' ? 90 : k === 'correr' ? 30 : 60 }); },
  'ent-editar'(b, ev, rp) { editarEntreno(b.dataset.id, rp); },
  'ent-meta'(b, ev, rp) { editarMeta(rp); },
  'rut-nueva'(b, ev, rp) { editarRutina(null, rp); },
  'rut-editar'(b, ev, rp) { editarRutina(b.dataset.id, rp); },
  'rut-hoy'(b, ev, rp) { const r = buscarElemento(b.dataset.id); editarEntreno(null, rp, { deporte: 'gym', rutina: r.id, ejercicios: JSON.parse(JSON.stringify(ejsRutina(r))), minutos: 60 }); },
  'par-nuevo'(b, ev, rp) { nuevoEvento(rp, { fecha: sumarDias(hoy(), 1), hora: '19:00', horaFin: '21:00', tipoEvento: 'partido', area: 'deporte' }); },
  'par-resultado'(b, ev, rp) { editarResultado(b.dataset.id, rp); },
  'pich-editar'(b, ev, rp) { editarPichanga(b.dataset.id, rp); },
  'pich-pago'(b) {
    const x = buscarElemento(b.dataset.id), p = pichanga(x); if (!p) return;
    const jug = p.jug.map((j, i) => ({ n: j.n, p: i === +b.dataset.i ? !j.p : !!j.p }));
    cambiarExtra(x.id, { pich: { costoC: p.costo, jug } }); return true;
  },
  'peso-nuevo'(b, ev, rp) { editarPeso(null, rp); },
  'peso-editar'(b, ev, rp) { editarPeso(b.dataset.id, rp); }
};
