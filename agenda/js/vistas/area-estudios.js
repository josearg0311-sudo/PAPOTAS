/* ESTUDIOS: cursos (horario, notas y faltas), exámenes con sesiones de
   estudio, y fichas de repaso */
import { elementos, buscarElemento, poner, aPapelera, restaurar } from '../datos/datos.js';
import { preferencias } from '../datos/preferencias.js';
import { modeloVacio, LISTA_TAREAS } from '../datos/modelo.js';
import { val, lista, promedio, APRUEBA, faltas, planSesiones, responderFicha, fichaToca, ordenDias } from '../datos/herramientas.js';
import { hoy, fmtCorta, fmtHora, diasEntre, DIAS3, esHora, diaSemana } from '../util/fechas.js';
import { esc, ico, vacio, plural } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { fila, filas, casilla, mini, pildora, cifra, cifras, cambiarExtra, nuevo, borrar, boton, pie } from './area-comun.js';
import { editar } from '../piezas/formulario.js';
import { nuevoEvento } from '../piezas/eventos-ui.js';
import { abrirHoja, cerrarHoja } from '../piezas/hoja.js';
import { aviso } from '../piezas/aviso.js';
import { vistaConstancia, senalesConstancia, TEMAS } from './area-constancia.js';
import { vincular, alternar, corriendo } from '../piezas/pomodoro.js';

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hora = (h) => fmtHora(h, preferencias().formatoHora);

/* ---------- Cursos ---------- */
const cursos = () => elementos((x) => x.tipo === 'curso').sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
const clasesDe = (c) => lista(c, 'clases').filter((k) => esHora(k.ini));
const evalsDe = (c) => lista(c, 'evaluaciones', 'notas');
function chipNota(p) { return p == null ? '<span class="pill">sin notas</span>' : '<span class="pill nota ' + (p >= APRUEBA ? 'aprueba' : 'jala') + '">' + p.toFixed(1) + '</span>'; }
function horarioTxt(c) { return clasesDe(c).sort((a, b) => ordenDias(preferencias().semanaLunes).indexOf(+a.d) - ordenDias(preferencias().semanaLunes).indexOf(+b.d)).map((k) => DIAS3[+k.d] + ' ' + hora(k.ini)).join(', '); }

function vistaCursos() {
  const l = cursos(), ps = l.map((c) => promedio(evalsDe(c))).filter((p) => p != null);
  const general = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null;
  const h = hoy(), orden = ordenDias(preferencias().semanaLunes), hoyD = diaSemana(h);
  const horario = orden.map((d) => ({ d, cl: l.flatMap((c) => clasesDe(c).filter((k) => +k.d === d).map((k) => ({ c, k }))).sort((a, b) => a.k.ini.localeCompare(b.k.ini)) })).filter((x) => x.cl.length);
  return tarjeta({ eti: 'CURSOS', titulo: 'Cursos y notas', n: l.length, clase: 'area-estudios',
    guia: 'Cada curso con su horario, sus notas (promedio vigesimal: <b>apruebas con 10.5</b>) y sus faltas. Toca <b>+ Falta</b> si no fuiste.',
    cuerpo: (l.length ? cifras([cifra(general == null ? '—' : general.toFixed(1), 'promedio general', general == null ? '' : general >= APRUEBA ? 'ok' : 'aviso'), cifra(l.length, l.length === 1 ? 'curso' : 'cursos')]) +
      filas(l.map((c) => { const f = faltas(c), p = promedio(evalsDe(c));
        return fila({ titulo: c.titulo, acc: 'curso-editar', id: c.id,
          meta: [val(c, 'prof', ''), val(c, 'aula', ''), horarioTxt(c)].filter(Boolean).map(esc).join(' · ') + ' ' + chipNota(p) +
            (f.max ? ' ' + (f.nivel === 'ok' ? '<span class="pill">' + f.f + '/' + f.max + ' faltas</span>' : pildora(f.nivel, f.f + '/' + f.max + ' faltas')) : f.f ? ' <span class="pill">' + plural(f.f, 'falta', 'faltas') + '</span>' : ''),
          final: mini('+ Falta', 'curso-falta', c.id, '', 'Anotar una falta en ' + c.titulo) }); })) : vacio('Sin cursos', 'Agrega tus cursos con su horario: aparecerán en Hoy y en la Agenda.')) +
      pie(boton('Nuevo curso', 'curso-nuevo')) }) +
    (horario.length ? tarjeta({ eti: 'HORARIO', titulo: 'Tu semana de clases', clase: 'area-estudios',
      cuerpo: '<div class="horario">' + horario.map((x) => '<div class="hor-dia' + (x.d === hoyD ? ' es-hoy' : '') + '"><b>' + cap(DIAS3[x.d]) + '</b><div>' +
        x.cl.map(({ c, k }) => '<button type="button" class="hor-clase" data-acc="curso-editar" data-id="' + esc(c.id) + '"><span class="mono">' + hora(k.ini) + (esHora(k.fin) ? '–' + hora(k.fin) : '') + '</span>' + esc(c.titulo) + '</button>').join('') + '</div></div>').join('') + '</div>' }) : '');
}
function editarCurso(id, repintar) {
  const c = id ? buscarElemento(id) : null, orden = ordenDias(preferencias().semanaLunes);
  editar({ titulo: c ? c.titulo : 'Nuevo curso', campos: [
    { n: 'titulo', t: 'texto', etq: 'Curso', v: c ? c.titulo : '', req: true, max: 80, ph: 'Ej. Matemática II' },
    { n: 'prof', t: 'texto', etq: 'Profesor(a)', v: c ? val(c, 'prof', '') : '', max: 60, mitad: true },
    { n: 'aula', t: 'texto', etq: 'Aula o enlace', v: c ? val(c, 'aula', '') : '', max: 60, mitad: true },
    { n: 'clases', t: 'filas', etq: 'Horario de clases', boton: 'Agregar clase', v: c ? clasesDe(c) : [], nuevo: () => ({ d: 1, ini: '08:00', fin: '10:00' }),
      cols: [{ n: 'd', t: 'sel', etq: 'Día', ops: orden.map((d) => [d, cap(DIAS3[d])]), ancho: '0.8fr' }, { n: 'ini', t: 'hora', etq: 'Empieza', ancho: '1.3fr' }, { n: 'fin', t: 'hora', etq: 'Termina', ancho: '1.3fr' }],
      vale: (k) => esHora(k.ini) },
    { n: 'evals', t: 'filas', etq: 'Notas (de 0 a 20) y su peso en %', boton: 'Agregar evaluación', v: c ? evalsDe(c) : [], nuevo: () => ({ n: '', v: '', p: '' }),
      cols: [{ n: 'n', t: 'texto', etq: 'Evaluación', ph: 'Ej. Parcial', ancho: '2fr' }, { n: 'v', t: 'dec', etq: 'Nota', ancho: '1fr' }, { n: 'p', t: 'num', etq: 'Peso %', ancho: '1fr' }],
      vale: (k) => k.n || k.v !== '', ayuda: 'Si pones el peso de todas, el promedio es ponderado; si no, es simple.' },
    { n: 'faltas', t: 'num', etq: 'Faltas', v: c ? val(c, 'faltas', 0) : 0, mitad: true },
    { n: 'maxFaltas', t: 'num', etq: 'Máximo permitido', v: c ? val(c, 'maxFaltas', '') : '', ph: 'Ej. 6 (30 %)', mitad: true },
    { n: 'inicio', t: 'fecha', etq: 'Empieza el ciclo', v: c ? c.fechas.inicio : '', mitad: true },
    { n: 'fin', t: 'fecha', etq: 'Termina el ciclo', v: c ? c.fechas.fin : '', mitad: true }],
  alGuardar: (v) => {
    const extra = { prof: v.prof, aula: v.aula, clases: v.clases.map((k) => ({ d: +k.d, ini: k.ini, fin: esHora(k.fin) ? k.fin : '' })), evaluaciones: v.evals.map((k) => ({ n: k.n, v: k.v, p: k.p })), faltas: +v.faltas || 0, maxFaltas: +v.maxFaltas || 0 };
    const fechas = Object.assign({}, c ? c.fechas : {}, { inicio: v.inicio || null, fin: v.fin || null });
    if (c) cambiarExtra(id, extra, { titulo: v.titulo, fechas }); else nuevo('curso', 'estudios', { titulo: v.titulo, fechas, extra });
    repintar(); aviso('Curso guardado');
  }, alBorrar: c ? () => borrar(id, repintar) : null });
}

/* ---------- Exámenes y sesiones de estudio ---------- */
const temasDe = (e) => lista(e, 'temas').map((t) => ({ t: String(t.t || ''), ok: !!t.ok })).filter((t) => t.t);
const examenes = (futuros = true) => elementos((x) => x.tipo === 'evento' && x.extra.tipoEvento === 'examen' && (futuros ? x.fechas.inicio >= hoy() : x.fechas.inicio < hoy()))
  .sort((a, b) => (futuros ? 1 : -1) * a.fechas.inicio.localeCompare(b.fechas.inicio));
const sesionesDe = (id) => elementos((x) => x.tipo === 'pendiente' && x.extra.examen === id).sort((a, b) => (a.fechas.inicio || '').localeCompare(b.fechas.inicio || ''));

function tarjetaExamen(e) {
  const d = diasEntre(hoy(), e.fechas.inicio), ts = temasDe(e), ok = ts.filter((t) => t.ok).length, ses = sesionesDe(e.id), hechas = ses.filter((s) => s.estado === 'hecho').length;
  const prox = ses.find((s) => s.estado !== 'hecho');
  return '<section class="tarjeta area-estudios examen"><header class="t-cab"><span class="eti">EXAMEN</span><h2>' + esc(e.titulo) + '</h2>' +
    (d === 0 ? pildora('hoy', '¡hoy!') : d <= 3 ? pildora('pronto', d === 1 ? 'mañana' : 'en ' + d + ' días') : '<span class="pill">en ' + d + ' días</span>') + '</header>' +
    '<p class="ex-meta">' + cap(fmtCorta(e.fechas.inicio)) + (e.fechas.hora ? ' · ' + hora(e.fechas.hora) : '') + (e.extra.lugar ? ' · ' + esc(e.extra.lugar) : '') + '</p>' +
    (ts.length ? '<div class="ex-avance"><span class="progreso"><i style="width:' + Math.round(ok / ts.length * 100) + '%"></i></span><small class="mono">' + ok + '/' + ts.length + ' temas</small></div>' +
      '<div class="temas">' + ts.map((t, i) => '<button type="button" class="tema" role="checkbox" aria-checked="' + t.ok + '" data-acc="ex-tema" data-id="' + esc(e.id) + '" data-i="' + i + '"><span class="casilla chica" aria-hidden="true"><span></span></span>' + esc(t.t) + '</button>').join('') + '</div>'
      : '<p class="ex-vacio">Anota los temas que vienen para repartirlos en sesiones de estudio.</p>') +
    (ses.length ? '<div class="ex-ses"><b>Sesiones de estudio: ' + hechas + '/' + ses.length + '</b>' + (prox ? '<small>Próxima: ' + esc(relativoCorto(prox.fechas.inicio)) + (prox.fechas.hora ? ' ' + hora(prox.fechas.hora) : '') + ' · ' + esc(prox.titulo.replace(/ · .*$/, '')) + '</small>' : '<small>¡Todas hechas! 💪</small>') + '</div>' : '') +
    '<div class="pie-tarjeta">' + mini(ico('i-lapiz') + 'Temas', 'ex-temas', e.id) + mini(ico('i-agenda') + (ses.length ? 'Replanificar' : 'Planificar sesiones'), 'ex-plan', e.id) +
      (prox ? mini(ico('i-play') + 'Estudiar ahora', 'ex-foco', prox.id) : '') + mini('Editar examen', 'ev-editar', e.id) + '</div></section>';
}
function relativoCorto(f) { const n = diasEntre(hoy(), f); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : fmtCorta(f); }
function vistaExamenes() {
  const l = examenes(true), pasados = examenes(false).slice(0, 4);
  return (l.length ? l.map(tarjetaExamen).join('') : tarjeta({ eti: 'EXÁMENES', titulo: 'Exámenes', clase: 'area-estudios', cuerpo: vacio('No tienes exámenes próximos', 'Cuando agendes uno, aquí podrás anotar sus temas y repartirlos en sesiones de estudio.') })) +
    tarjeta({ eti: 'CÓMO FUNCIONA', titulo: 'Sesiones de estudio', clase: 'area-estudios',
      cuerpo: '<p class="texto-tarjeta">Anota los temas del examen y toca <b>Planificar sesiones</b>: se reparten entre los días que faltan, la víspera queda para repaso general, y cada sesión aparece en Hoy y en Recordatorios con su aviso. <b>Estudiar ahora</b> arranca el Pomodoro ligado a la sesión.</p>' +
        (pasados.length ? '<div class="grupo-tit"><span>Exámenes pasados</span><span class="linea"></span></div>' + filas(pasados.map((e) => fila({ titulo: e.titulo, acc: 'ev-editar', id: e.id, meta: fmtCorta(e.fechas.inicio) }))) : '') +
        pie(boton('Nuevo examen', 'ex-nuevo')) });
}
function editarTemas(id, repintar) {
  const e = buscarElemento(id);
  editar({ titulo: 'Temas · ' + e.titulo, campos: [
    { n: 'temas', t: 'filas', etq: 'Temas que vienen', boton: 'Agregar tema', v: temasDe(e), nuevo: () => ({ t: '', ok: false }),
      cols: [{ n: 't', t: 'texto', etq: 'Tema', ph: 'Ej. Regla de la cadena', ancho: '1fr' }, { n: 'ok', t: 'si', etq: 'Ya lo domino', ancho: '44px' }], vale: (k) => k.t,
      ayuda: 'Marca la casilla de los que ya dominas: no se reparten en sesiones.' }],
  alGuardar: (v) => { cambiarExtra(id, { temas: v.temas }); repintar(); } });
}
function planificar(id, repintar) {
  const e = buscarElemento(id), faltan = temasDe(e).filter((t) => !t.ok).map((t) => t.t), h = hoy();
  const previas = sesionesDe(id).filter((s) => s.estado !== 'hecho');
  const ver = (horaS, dur) => {
    const plan = planSesiones({ desde: h, examen: e.fechas.inicio, temas: faltan });
    return plan.length ? '<ol class="plan">' + plan.map((p) => '<li><b>' + cap(relativoCorto(p.fecha)) + ' · ' + hora(horaS) + '</b><span>' + (p.repaso ? 'Repaso general' : esc(p.temas.join(', '))) + ' · ' + dur + ' min</span></li>').join('') + '</ol>' : '<p class="ayuda">El examen es hoy: ya no hay días para repartir. ¡Repasa lo que puedas!</p>';
  };
  const hoja = abrirHoja('Sesiones · ' + esc(e.titulo), '<form class="form" id="formPlan">' +
    '<p class="ayuda">' + (faltan.length ? 'Faltan <b>' + plural(faltan.length, 'tema', 'temas') + '</b>' : 'No hay temas pendientes') + ' y quedan <b>' + plural(Math.max(0, diasEntre(h, e.fechas.inicio)), 'día', 'días') + '</b> hasta el examen.' + (previas.length ? ' Se reemplazarán las ' + previas.length + ' sesiones que aún no hiciste.' : '') + '</p>' +
    '<div class="dos-col"><label class="campo"><span>A qué hora estudias</span><input type="time" class="entrada" name="hora" value="19:00"></label>' +
    '<label class="campo"><span>Minutos por sesión</span><select class="entrada" name="dur"><option>25</option><option selected>50</option><option>75</option><option>100</option></select></label></div>' +
    '<div id="planVer">' + ver('19:00', 50) + '</div>' +
    '<div class="fila-botones"><button type="submit" class="btn pri">' + ico('i-check') + 'Crear sesiones</button></div></form>');
  const f = hoja.querySelector('#formPlan');
  f.addEventListener('change', () => { hoja.querySelector('#planVer').innerHTML = ver(f.hora.value || '19:00', f.dur.value); });
  f.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const plan = planSesiones({ desde: h, examen: e.fechas.inicio, temas: faltan });
    if (!plan.length) { cerrarHoja(); return; }
    previas.forEach((s) => aPapelera(s.id));
    const creadas = plan.map((p) => { const b = modeloVacio();
      return poner(Object.assign(b, { tipo: 'pendiente', area: e.area || 'estudios', lista: LISTA_TAREAS, prioridad: 'media', aviso: true,
        titulo: (p.repaso ? 'Repaso general' : 'Estudiar: ' + p.temas.join(', ')) + ' · ' + e.titulo,
        fechas: Object.assign(b.fechas, { inicio: p.fecha, hora: f.hora.value || '19:00' }), extra: { examen: id, duracion: +f.dur.value || 50, temas: p.temas } })).id; });
    cerrarHoja(); repintar();
    aviso(plural(creadas.length, 'sesión creada', 'sesiones creadas') + ' · aparecen en Hoy', () => { creadas.forEach((c) => aPapelera(c)); previas.forEach((s) => restaurar(s.id)); repintar(); });
  });
}

/* ---------- Fichas de repaso ---------- */
const fichas = () => elementos((x) => x.tipo === 'ficha');
const cursoDeFicha = (f) => val(f, 'curso', '') || '';
function vistaFichas() {
  const l = fichas(), h = hoy(), cs = cursos();
  const grupos = [...cs.map((c) => ({ id: c.id, nombre: c.titulo })), { id: '_g', nombre: 'General' }].map((g) => {
    const fs = l.filter((f) => g.id === '_g' ? !cs.some((c) => c.id === cursoDeFicha(f) || c.origen && c.origen.id === cursoDeFicha(f)) : cursoDeFicha(f) === g.id || (buscarElemento(g.id).origen || {}).id === cursoDeFicha(f));
    return Object.assign(g, { fs, toca: fs.filter((f) => fichaToca(f, h)).length });
  }).filter((g) => g.fs.length);
  const toca = l.filter((f) => fichaToca(f, h)).length;
  return tarjeta({ eti: 'FICHAS', titulo: 'Fichas de repaso', n: l.length, clase: 'area-estudios',
    guia: 'Pregunta por un lado, respuesta por el otro. Si la sabías, vuelve en más días (1, 2, 4, 8, 16); si no, mañana. Así repasas justo lo que se te olvida.',
    cuerpo: (l.length ? cifras([cifra(toca, 'para repasar hoy', toca ? 'aviso' : 'ok'), cifra(l.length, 'fichas')]) +
      filas(grupos.map((g) => fila({ titulo: g.nombre, meta: plural(g.fs.length, 'ficha', 'fichas') + (g.toca ? ' · <b>' + g.toca + ' para hoy</b>' : ' · al día ✓'), acc: 'fichas-ver', id: g.id,
        final: g.toca ? mini(ico('i-play') + 'Repasar', 'fichas-repasar', g.id) : '' }))) : vacio('Sin fichas', 'Crea fichas con preguntas de tus cursos para repasar con el método de cajas.')) +
      pie(boton('Nueva ficha', 'ficha-nueva'), toca ? '<button type="button" class="btn pri" data-acc="fichas-repasar" data-id="">' + ico('i-play') + 'Repasar todo (' + toca + ')</button>' : '') });
}
function delGrupo(g) {
  const cs = cursos();
  if (!g) return fichas();
  if (g === '_g') return fichas().filter((f) => !cs.some((c) => c.id === cursoDeFicha(f) || (c.origen && c.origen.id === cursoDeFicha(f))));
  const c = buscarElemento(g); return fichas().filter((f) => cursoDeFicha(f) === g || (c.origen && c.origen.id === cursoDeFicha(f)));
}
function verFichas(g, repintar) {
  const l = delGrupo(g), h = hoy();
  abrirHoja(g === '_g' ? 'Fichas · General' : 'Fichas · ' + esc(buscarElemento(g).titulo), filas(l.map((f) => fila({ titulo: f.titulo, acc: 'ficha-editar', id: f.id,
    meta: '<span class="pill">caja ' + (+val(f, 'caja', 1) || 1) + '</span> ' + (fichaToca(f, h) ? '<b>toca hoy</b>' : 'vuelve ' + fmtCorta(val(f, 'prox', h))) }))) +
    '<div class="fila-botones"><button type="button" class="btn" data-acc="ficha-nueva" data-curso="' + esc(g === '_g' ? '' : g) + '">' + ico('i-plus') + 'Nueva ficha</button></div>');
}
function editarFicha(id, repintar, cursoPre = '') {
  const f = id ? buscarElemento(id) : null, cs = cursos();
  let actual = f ? cursoDeFicha(f) : cursoPre;
  const c = cs.find((k) => k.id === actual || (k.origen && k.origen.id === actual)); actual = c ? c.id : '';
  editar({ titulo: f ? 'Ficha' : 'Nueva ficha', campos: [
    { n: 'q', t: 'largo', etq: 'Pregunta', v: f ? f.titulo : '', req: true, max: 400, ph: 'Ej. ¿Derivada de sen x?' },
    { n: 'a', t: 'largo', etq: 'Respuesta', v: f ? val(f, 'a', '') : '', max: 1000, ph: 'Ej. cos x' },
    { n: 'curso', t: 'sel', etq: 'Curso', v: actual, ops: [['', 'General']].concat(cs.map((k) => [k.id, k.titulo])) }],
  alGuardar: (v) => {
    if (f) cambiarExtra(id, { a: v.a, curso: v.curso }, { titulo: v.q });
    else nuevo('ficha', 'estudios', { titulo: v.q, extra: { a: v.a, curso: v.curso, caja: 1, prox: '' } });
    repintar(); aviso(f ? 'Ficha guardada' : 'Ficha creada · toca repasarla hoy');
  }, alBorrar: f ? () => borrar(id, repintar) : null });
}
let repaso = null;
function repasar(g, repintar) {
  const cola = delGrupo(g).filter((f) => fichaToca(f, hoy())).sort(() => Math.random() - 0.5).map((f) => f.id);
  if (!cola.length) { aviso('Nada que repasar hoy. ¡Al día!'); return; }
  repaso = { cola, i: 0, bien: 0, vista: false };
  /* La hoja se abre una vez; cada ficha solo cambia su contenido */
  const hoja = abrirHoja('Repaso', '<div id="repaso"></div>', { alCerrar: () => { repaso = null; repintar(); } });
  hoja.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-rep]'); if (!b || !repaso) return;
    const r = repaso, f = buscarElemento(r.cola[r.i]);
    if (b.dataset.rep === 'ver') r.vista = true;
    else if (b.dataset.rep === 'fin') { cerrarHoja(); return; }
    else { const sabia = b.dataset.rep === 'si'; cambiarExtra(f.id, responderFicha(f, sabia, hoy())); if (sabia) r.bien++; r.i++; r.vista = false; }
    pintarRepaso(hoja);
  });
  pintarRepaso(hoja);
}
function pintarRepaso(hoja) {
  const r = repaso, tit = hoja.querySelector('#hojaTit'), cont = hoja.querySelector('#repaso');
  if (r.i >= r.cola.length) {
    tit.textContent = 'Repaso terminado';
    cont.innerHTML = '<div class="repaso-fin"><b>' + r.bien + ' de ' + r.cola.length + '</b><span>las sabías</span><p>Las que no, vuelven mañana. Las demás, en unos días.</p></div><div class="fila-botones"><button type="button" class="btn pri" data-rep="fin">Listo</button></div>';
    return;
  }
  const f = buscarElemento(r.cola[r.i]);
  tit.textContent = 'Repaso · ' + (r.i + 1) + ' de ' + r.cola.length;
  cont.innerHTML = '<div class="repaso"><span class="pill">caja ' + (+val(f, 'caja', 1) || 1) + '</span><p class="rep-q">' + esc(f.titulo) + '</p>' +
    (r.vista ? '<p class="rep-a">' + esc(val(f, 'a', '') || '(sin respuesta)') + '</p><div class="fila-botones rep-btns"><button type="button" class="btn" data-rep="no">✗ No la sabía</button><button type="button" class="btn pri" data-rep="si">✓ La sabía</button></div>'
      : '<div class="fila-botones rep-btns"><button type="button" class="btn pri" data-rep="ver">Ver respuesta</button></div>') + '</div>';
  const b = cont.querySelector('.rep-btns .pri'); if (b) b.focus();
}

/* ---------- Herramientas y señales ---------- */
export const HERRAMIENTAS = [
  { id: 'cursos', nombre: 'Cursos y notas', vista: vistaCursos },
  { id: 'examenes', nombre: 'Exámenes', vista: vistaExamenes },
  { id: 'fichas', nombre: 'Fichas', vista: vistaFichas },
  { id: 'constancia', nombre: TEMAS.estudios.tab, vista: () => vistaConstancia('estudios') }
];
export function senales() {
  const s = [], h = hoy();
  examenes(true).filter((e) => diasEntre(h, e.fechas.inicio) <= 14).forEach((e) => {
    const d = diasEntre(h, e.fechas.inicio), falta = temasDe(e).filter((t) => !t.ok).length;
    s.push({ nivel: d <= 3 ? 'pronto' : 'ok', txt: '📝 ' + e.titulo + ' · ' + (d === 0 ? 'hoy' : d === 1 ? 'mañana' : 'en ' + d + ' días') + (falta ? ' · ' + plural(falta, 'tema', 'temas') + ' por estudiar' : ''), ir: 'examenes' });
  });
  cursos().forEach((c) => { const f = faltas(c); if (f.nivel !== 'ok') s.push({ nivel: f.nivel, txt: c.titulo + ': ' + f.f + ' de ' + f.max + ' faltas', ir: 'cursos' });
    const p = promedio(evalsDe(c)); if (p != null && p < APRUEBA) s.push({ nivel: 'pronto', txt: c.titulo + ': promedio ' + p.toFixed(1), ir: 'cursos' }); });
  const toca = fichas().filter((f) => fichaToca(f, h)).length;
  if (toca) s.push({ nivel: 'ok', txt: plural(toca, 'ficha', 'fichas') + ' para repasar hoy', ir: 'fichas' });
  s.push(...senalesConstancia('estudios'));
  return s;
}

/* El pulso de Estudios: próximo examen, promedio, fichas y foco de la semana */
export function pulso() {
  const ex = examenes(true)[0], ps = cursos().map((c) => promedio(evalsDe(c))).filter((p) => p != null), pg = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : null;
  const toca = fichas().filter((f) => fichaToca(f, hoy())).length, d = ex ? diasEntre(hoy(), ex.fechas.inicio) : null;
  return cifras([cifra(ex ? '📝 ' + (d === 0 ? 'hoy' : d + ' d') : '—', ex ? ex.titulo : 'sin exámenes próximos', ex && d <= 3 ? 'aviso' : ''),
    cifra(pg == null ? '—' : pg.toFixed(1), 'promedio general', pg == null ? '' : pg >= APRUEBA ? 'ok' : 'aviso'),
    cifra('🃏 ' + toca, 'fichas para hoy', toca ? 'aviso' : 'ok')]);
}

/* Su semana, para la revisión semanal */
export function semana(ini, fin) {
  const ses = elementos((x) => x.tipo === 'pendiente' && x.extra.examen && x.fechas.inicio >= ini && x.fechas.inicio <= fin), ok = ses.filter((x) => x.estado === 'hecho').length;
  const foco = elementos((x) => x.tipo === 'enfoque' && x.fechas.inicio >= ini && x.fechas.inicio <= fin).reduce((s, e) => s + ((e.extra.minutosArea && e.extra.minutosArea.estudios) || (!e.extra.minutosArea && e.datos && e.datos.pomosEsp && e.datos.pomosEsp.estudios * 25) || 0), 0);
  const prox = examenes(true).filter((e) => diasEntre(fin, e.fechas.inicio) <= 14);
  return { pregunta: '¿Qué temas avanzaste y cuáles todavía te cuestan?',
    cifras: [[ok + '/' + ses.length, 'sesiones de estudio hechas', ses.length && ok < ses.length ? 'aviso' : 'ok'], [Math.round(foco / 6) / 10 + ' h', 'de foco en Estudios', '']],
    notas: prox.map((e) => '📝 ' + e.titulo + ' · ' + fmtCorta(e.fechas.inicio) + ' (' + temasDe(e).filter((t) => !t.ok).length + ' temas por estudiar)')
      .concat(cursos().filter((c) => faltas(c).nivel !== 'ok').map((c) => '⚠️ ' + c.titulo + ': ' + faltas(c).f + ' de ' + faltas(c).max + ' faltas')) };
}

export const acciones = {
  'curso-nuevo'(b, ev, rp) { editarCurso(null, rp); },
  'curso-editar'(b, ev, rp) { editarCurso(b.dataset.id, rp); },
  'curso-falta'(b, ev, rp) {
    const c = buscarElemento(b.dataset.id), antes = +val(c, 'faltas', 0) || 0;
    cambiarExtra(c.id, { faltas: antes + 1 }); rp();
    const f = faltas(buscarElemento(c.id));
    aviso('Falta anotada en ' + c.titulo + (f.max ? ' · ' + f.f + '/' + f.max : ''), () => { cambiarExtra(c.id, { faltas: antes }); rp(); });
  },
  'ex-nuevo'(b, ev, rp) { nuevoEvento(rp, { fecha: hoy(), hora: '08:00', horaFin: '10:00', tipoEvento: 'examen', area: 'estudios' }); },
  'ex-tema'(b, ev, rp) {
    const e = buscarElemento(b.dataset.id), ts = temasDe(e), i = +b.dataset.i;
    if (!ts[i]) return;
    ts[i].ok = !ts[i].ok; cambiarExtra(e.id, { temas: ts }); return true;
  },
  'ex-temas'(b, ev, rp) { editarTemas(b.dataset.id, rp); },
  'ex-plan'(b, ev, rp) { planificar(b.dataset.id, rp); },
  'ex-foco'(b) { vincular(b.dataset.id); if (!corriendo()) alternar(); location.hash = '#hoy'; aviso('🍅 Pomodoro en marcha para esta sesión'); },
  'ficha-nueva'(b, ev, rp) { editarFicha(null, rp, b.dataset.curso || ''); },
  'ficha-editar'(b, ev, rp) { editarFicha(b.dataset.id, rp); },
  'fichas-ver'(b, ev, rp) { verFichas(b.dataset.id, rp); },
  'fichas-repasar'(b, ev, rp) { repasar(b.dataset.id, rp); }
};
