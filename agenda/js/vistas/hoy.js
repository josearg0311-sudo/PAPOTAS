/* HOY: lo urgente (plazo legal primero), tus recordatorios de hoy, tus 3
   prioridades, tu día en bloques, el Pomodoro y el balance de horas. */
import { hoy, sumarDias, inicioSemana, diaSemana, DIAS3, MESES, fmtLarga, saludo, horaAhora, minutosAhora, fmtHora, fmtCorta } from '../util/fechas.js';
import { vacio, ico, esc } from '../util/dom.js';
import { preferencias, minutosVigilia } from '../datos/preferencias.js';
import { leer, ANTIGUAS } from '../datos/almacen.js';
import { documento, elementos, buscarElemento, poner, cambiarPerfil } from '../datos/datos.js';
import { modeloVacio } from '../datos/modelo.js';
import { tocaRespaldar, diasSinRespaldo } from '../datos/respaldo.js';
import { urgentes, delDia, hechosHoy, ordenar, grupo, marcar, pendientesVisibles, paraCerrarDia } from '../datos/pendientes.js';
import { bloquesDelDia, todoElDia, minutosPorArea, proximoBloque } from '../datos/calendario.js';
import { AREAS, area } from '../datos/areas.js';
import { filaPendiente } from '../piezas/pendientes-ui.js';
import { estadoPomo, restante, totalMs, mmss, corriendo, alternar, reiniciar, vincular, minutosHoy, MODOS, modoRapido } from '../piezas/pomodoro.js';
import { abrirHoja, cerrarHoja } from '../piezas/hoja.js';
import { aviso } from '../piezas/aviso.js';
import { tarjeta } from './comun.js';
import { feriado } from '../datos/feriados.js';
import { avisoDeporte } from './area-deporte.js';
import { habitosDeHoy } from './area-constancia.js';
import { marcasHabito, rachaHabito } from '../datos/seguimiento.js';
import { tarjetaQueHacer, tarjetaManana, tarjetaNumeros } from './hoy-extra.js';
import { tarjetaEspacios } from './espacios.js';
import { listas, esChecklist, pendientesDe } from '../datos/pendientes.js';
import { esDelLibro, esIngreso, resumenMes } from '../datos/finanzas.js';
import { fmtSoles } from '../util/dinero.js';

/* Una frase por día (las de tu versión anterior) */
const FRASES = ['Lo que se agenda, se hace.', 'Hecho es mejor que perfecto.', 'Un paso pequeño cada día llega lejos.', 'Primero lo importante; lo urgente sabe esperar un poco.', 'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.', 'No tienes que verlo todo: solo el siguiente paso.', 'Tu futuro se construye con lo que haces hoy, no mañana.', 'Empieza donde estás, usa lo que tienes, haz lo que puedas.', 'Menos pendientes en la cabeza, más espacio para vivir.', 'La constancia vence al talento cuando el talento no es constante.', 'Cuida los céntimos y los soles se cuidarán solos.', 'Si toma menos de dos minutos, hazlo ya.', 'Descansar también es parte del plan.', 'Celebra lo que ya lograste antes de ir por lo siguiente.', 'Un buen día empieza con tres prioridades claras.', 'Lo que no se mide, no se mejora.', 'Cada tarea tachada es una promesa cumplida contigo.', 'Enfócate en el progreso, no en la perfección.', 'Organizarse es regalarle tiempo a tu yo de mañana.', 'Hoy es un buen día para empezar eso que vienes posponiendo.', 'Ahorra primero, gasta después.', 'Tu energía es limitada: ponla donde importa.', 'Pequeños hábitos, grandes cambios.', 'La motivación te arranca; el hábito te mantiene.', 'Mejor un plan sencillo que se cumple que uno perfecto que no.', 'Termina lo que empiezas y empezarás menos cosas que no terminas.', 'El mejor momento fue ayer; el segundo mejor, ahora.', 'Di que sí a pocas cosas y hazlas muy bien.', 'Anota, suelta y confía en tu agenda.', 'Paso a paso también se llega.'];
export function fraseDelDia(d) { const n = Math.round((Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8)) - Date.UTC(+d.slice(0, 4), 0, 0)) / 864e5); return FRASES[n % FRASES.length]; }

export const SOBRECARGA = 0.85;
const C38 = 2 * Math.PI * 38, C46 = 2 * Math.PI * 46;

function nombre() {
  const doc = documento();
  if (doc && doc.perfil && doc.perfil.nombre) return String(doc.perfil.nombre).trim().split(/\s+/)[0];
  const d = leer(ANTIGUAS.datos, null);
  const n = d && d.perfil && typeof d.perfil.nombre === 'string' ? d.perfil.nombre.trim() : '';
  return n ? n.split(/\s+/)[0] : '';
}

export function franjaSemana(diaSel, accion = 'ir-dia') {
  const p = preferencias(), h = hoy(), ini = inicioSemana(diaSel || h, p.semanaLunes);
  const pend = pendientesVisibles().filter((x) => x.estado !== 'hecho' && x.fechas.inicio);
  return '<div class="franja" role="group" aria-label="Días de esta semana">' + [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = sumarDias(ini, i), n = pend.filter((x) => x.fechas.inicio === d).length + bloquesDelDia(d).filter((b) => b.tipo !== 'pendiente').length;
    return '<button type="button" data-acc="' + accion + '" data-dia="' + d + '" aria-pressed="' + (d === (diaSel || h)) + '" class="' + (d === h ? 'es-hoy' : d < h ? 'pasado' : '') + '"' +
      ' aria-label="' + fmtLarga(d) + ': ' + n + ' cosas"><small>' + DIAS3[diaSemana(d)] + '</small><b>' + +d.slice(8) + '</b><span class="pts">' + '<i></i>'.repeat(Math.min(n, 4)) + '</span></button>';
  }).join('') + '</div>';
}

/* ---------- Tus 3 prioridades (en el «enfoque» del día) ---------- */
function enfoqueHoy() { return buscarElemento('enfoque_' + hoy()); }
function prioridades() {
  const e = enfoqueHoy();
  const l = e ? (e.extra.prioridades || (e.datos && e.datos.items) || []) : [];
  return [0, 1, 2].map((i) => Object.assign({ t: '', ok: false, ref: '' }, l[i] || {}));
}
function guardarPrioridades(l) {
  const id = 'enfoque_' + hoy(), e = buscarElemento(id);
  const y = e ? JSON.parse(JSON.stringify(e)) : Object.assign(modeloVacio(), { id, tipo: 'enfoque', titulo: 'Enfoque del día', fechas: Object.assign(modeloVacio().fechas, { inicio: hoy() }) });
  y.borrado = null; y.extra.prioridades = l; poner(y);
}

function lineaDia(bloques) {
  const p = preferencias(), ahora = minutosAhora();
  if (!bloques.length) return vacio('Sin nada agendado', 'Los eventos, clases y recordatorios con hora de hoy aparecen aquí como bloques.');
  let puesto = false, html = '<div class="bloques">';
  bloques.forEach((b) => {
    if (!puesto && b.ini > ahora) { puesto = true; html += '<div class="ahora"><span>' + fmtHora(horaAhora(), p.formatoHora) + '</span><i></i></div>'; }
    const pasado = b.fin <= ahora;
    html += '<div class="bloque area-' + area(b.area).id + (pasado ? ' pasado' : '') + '"><span class="h">' + fmtHora(b.hIni, p.formatoHora) + '</span>' +
      '<button type="button" class="b" data-acc="' + (b.tipo === 'pendiente' ? 'p-editar' : b.tipo === 'evento' ? 'ev-editar' : 'dato-ver') + '" data-id="' + esc(b.id) + '"><b>' + esc(b.titulo) + '</b><small>' +
      fmtHora(b.hIni, p.formatoHora) + '–' + fmtHora(b.hFin, p.formatoHora) + (b.tipo === 'clase' ? ' · clase' : b.tipo === 'pendiente' ? ' · recordatorio' : '') + (b.lugar ? ' · ' + esc(b.lugar) : '') + '</small></button></div>';
  });
  if (!puesto) html += '<div class="ahora"><span>' + fmtHora(horaAhora(), p.formatoHora) + '</span><i></i></div>';
  return html + '</div>';
}

export function pomoHTML() {
  const st = estadoPomo(), r = restante(), tot = totalMs(), corre = corriendo();
  const op = pendientesVisibles().filter((x) => x.estado !== 'hecho').sort(ordenar).slice(0, 60);
  const mins = minutosHoy(), hoyTxt = AREAS.filter((a) => mins[a.id]).map((a) => a.nombre + ' ' + mins[a.id] + ' min').join(' · ') || 'aún nada';
  return '<div class="pomo"><div class="anillo grande" role="timer" aria-live="off"><svg viewBox="0 0 112 112"><circle class="fondo" cx="56" cy="56" r="46"/><circle class="valor" id="pomoAro" cx="56" cy="56" r="46" stroke-dasharray="' + C46.toFixed(1) + '" stroke-dashoffset="' + (C46 * (1 - r / tot)).toFixed(1) + '"/></svg>' +
    '<div><b id="pomoTxt">' + mmss(r) + '</b><small>' + MODOS[st.modo].nombre.toLowerCase() + '</small></div></div>' +
    '<div class="pomo-ctl"><label class="solo-lector" for="pomoItem">¿En qué te concentras?</label><select id="pomoItem" class="entrada"><option value="">— ¿En qué te concentras? —</option>' +
      op.map((x) => '<option value="' + esc(x.id) + '"' + (st.item === x.id ? ' selected' : '') + '>' + esc(x.titulo) + '</option>').join('') + '</select>' +
    '<div class="fila-botones izq"><button type="button" class="btn pri" data-acc="pomo">' + ico(corre ? 'i-pausa' : 'i-play') + (corre ? 'Pausar' : 'Empezar') + '</button>' +
    (r < tot ? '<button type="button" class="icono-btn" data-acc="pomo-reiniciar" aria-label="Reiniciar">' + ico('i-repetir') + '</button>' : '') +
    '<button type="button" class="btn chico" data-acc="pomo-rapido" aria-pressed="' + !!st.rapido + '" title="Para probar: el reloj va 150 veces más rápido">' + (st.rapido ? 'Modo prueba ✓' : 'Probar en 10 s') + '</button></div>' +
    '<small>Hoy: <span class="mono">' + esc(hoyTxt) + '</span></small></div></div>';
}

/* Hábitos de hoy, cada uno en su área (con su color) */
function tarjetaHabitos() {
  const h = hoy(), l = habitosDeHoy();
  if (!l.length) return '';
  const ok = l.filter((x) => marcasHabito(x)[h]).length;
  return tarjeta({ eti: 'HÁBITOS', titulo: 'Hábitos de hoy', n: ok + '/' + l.length, guia: '<b>Cada hábito vive en su área</b> y lleva su color. Tócalo cuando lo cumplas: suma a su racha 🔥.',
    cuerpo: AREAS.map((a) => { const de = l.filter((x) => x.area === a.id); if (!de.length) return '';
      return '<div class="habs-area area-' + a.id + '"><a class="habs-area-tit" href="#areas/' + a.id + '/constancia">' + a.nombre + '</a><div class="habs-hoy">' + de.map((x) => { const hecho = !!marcasHabito(x)[h], r = rachaHabito(x, h);
        return '<button type="button" class="hab-chip area-' + a.id + '" role="checkbox" aria-checked="' + hecho + '" data-acc="hab-marcar" data-id="' + esc(x.id) + '"><span class="em">' + esc((x.extra && x.extra.em) || (x.datos && x.datos.em) || '⭐') + '</span><span>' + esc(x.titulo) + '</span>' + (r ? '<small>🔥 ' + r + '</small>' : '') + '</button>'; }).join('') + '</div></div>'; }).join('') });
}


/* Modo simple: Hoy solo con lo esencial (como la v4.5): tu día, tus espacios,
   lo pendiente y tus horas. Lo demás vuelve con «Mostrar todo» en Ajustes. */
const simple = () => !preferencias().completo;


export function vistaHoy() {
  const p = preferencias(), h = hoy(), n = nombre(), doc = documento(), rs = diasSinRespaldo();
  const delDiaL = delDia(h).sort(ordenar), hechos = hechosHoy(h), urg = urgentes(h);
  const tot = delDiaL.length + hechos.length, pct = tot ? hechos.length / tot : 0;
  const bloques = bloquesDelDia(h), tde = todoElDia(h), mins = minutosPorArea(bloques), vig = minutosVigilia(p), carga = mins.total / vig;
  const fer = p.feriados === false ? '' : feriado(h);
  /* En modo simple lo urgente (plazo legal, vencido, vence pronto) va dentro de Pendientes, primero */
  const ids = new Set(delDiaL.map((x) => x.id)), pend = urg.filter((x) => !ids.has(x.id)).concat(delDiaL).sort((a, b) => (b.plazoLegal ? 1 : 0) - (a.plazoLegal ? 1 : 0));   // lo urgente siempre adentro, el plazo legal primero
  const fila = (x) => filaPendiente(x, { verLista: !simple(), acciones: !simple() });
  const pr = prioridades(), hechasPr = pr.filter((x) => x.ok && x.t).length;
  const hh = (m) => (m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) : ''));

  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  /* Por hacer = lo de hoy sin hora (lo que tiene hora ya está en «Tu día»), lo atrasado y lo urgente */
  const porHacer = pend.filter((x) => !(x.fechas.hora && x.fechas.inicio === h));
  return '<div class="hoy hoy6">' +
    '<header class="hoy-cab"><div class="hc-fecha" aria-hidden="true"><b>' + (+h.slice(8, 10)) + '</b></div><div class="hc-txt"><small>' + cap(fmtLarga(h).split(' ')[0]) + ' · ' + MESES[+h.slice(5, 7) - 1] + '</small><h1 class="ph-saludo">' + (n ? 'Hola, ' + esc(n.split(/\s+/)[0]) : saludo()) + '</h1></div></header>' +
    (tot ? '<div class="hc-avance" role="img" aria-label="' + hechos.length + ' de ' + tot + ' hechas hoy"><i style="--p:' + Math.round(pct * 100) + '%"></i><span><b>' + hechos.length + ' de ' + tot + '</b> ' + (hechos.length === tot ? '¡todo hecho! 🎉' : 'listas hoy') + '</span></div>' : '') +
    (fer || tde.length ? '<p class="hoy-extra">' + (fer ? '<span class="feriado">' + ico('i-bandera') + 'Feriado: <b>' + esc(fer) + '</b></span>' : '') + tde.map((t) => '<button type="button" class="chip area-' + area(t.area).id + '" data-acc="ev-editar" data-id="' + esc(t.id) + '">' + (t.cumple ? '🎂 ' : '') + esc(t.titulo) + '</button>').join('') + '</p>' : '') +
    (n ? '' : '<section class="pide-nombre"><b>¿Cómo te llamas?</b><form class="pn-form"><label class="solo-lector" for="pnNombre">Tu nombre</label><input id="pnNombre" class="entrada" maxlength="40" autocomplete="given-name" placeholder="Tu nombre, ej. José"><button type="button" class="btn pri" data-acc="nombre-listo">Listo</button></form></section>') +
    (tocaRespaldar() ? '<div class="nota-fase aviso-respaldo">' + ico('i-escudo') + '<span><b>' + (rs.nunca ? 'Aún no tienes un respaldo.' : 'Último respaldo: hace ' + rs.dias + ' días.') + '</b> Guarda uno para no perder nada.</span><button type="button" class="btn chico pri" data-acc="respaldo-bajar">Respaldar</button></div>' : '') +
    (simple() ? '' : tarjetaEspacios()) +
    '<div class="hoy-col">' +
      ahoraHTML(h, porHacer) +
      (!porHacer.length ? '' : tarjeta({ eti: 'PENDIENTES', titulo: 'Pendientes de hoy', n: porHacer.length || null, sub: 'Sin hora fija. Marca el círculo cuando lo hagas o toca ⋯ para moverlo.',
        cuerpo: (porHacer.length ? '<div class="pends">' + porHacer.slice(0, 10).map(fila).join('') + '</div>' + (porHacer.length > 10 ? '<div class="pie-tarjeta"><a class="btn" href="#listas">Ver ' + (porHacer.length - 10) + ' más</a></div>' : '') : vacio(tot ? 'Todo listo por hoy' : 'Nada pendiente', 'Toca + y escribe lo que tengas que hacer.')) })) +
      cierreDia(h, porHacer) +
    '</div><div class="hoy-col">' +
      tarjeta({ eti: 'HORARIO', titulo: 'Horario de hoy', n: bloques.length || null, sub: 'Lo que tiene hora: clases, citas y recordatorios.', cuerpo: lineaDia(bloques) }) +
      minis(h) +
      (simple() ? '' : tarjetaHabitos() + tarjetaManana() + tarjetaNumeros() + (corriendo() ? '' : tarjeta({ eti: 'FOCO', titulo: 'Pomodoro', id: 'tarjetaPomo', cuerpo: pomoHTML() }))) +
    '</div>' +
  '</div>';
}

/* Lo único grande de Hoy: lo que toca AHORA (o lo siguiente, o lo más importante) */
function ahoraHTML(h, porHacer) {
  const f = preferencias().formatoHora, ahora = minutosAhora(), s = proximoBloque(h, ahora);
  const bt = (acc, id, txt, pri) => '<button type="button" class="btn' + (pri ? ' pri' : '') + '" data-acc="' + acc + '" data-id="' + esc(id) + '">' + txt + '</button>';
  /* Con el foco en marcha, Ahora ES el foco: la cuenta regresiva grande (se mueve sola cada segundo) */
  const stp = estadoPomo(), pausado = !corriendo() && stp.resta > 0 && stp.resta < totalMs();
  if (corriendo() || pausado) {
    const st = stp, it = st.item ? buscarElemento(st.item) : null, r = restante(), tot = totalMs();
    return '<section class="ahora6 foco6' + (pausado ? ' pausa' : '') + '" aria-label="Foco"><p class="a6-cuando"><i aria-hidden="true"></i>' + (pausado ? 'Foco en pausa' : st.modo === 'foco' ? 'Foco en marcha' : 'Descanso') + '</p>' +
      '<div class="f6-reloj"><b id="pomoTxt" class="a6-tit" role="timer">' + mmss(r) + '</b><span class="f6-barra" aria-hidden="true"><i id="pomoBarra" style="width:' + (100 * (1 - r / tot)).toFixed(1) + '%"></i></span></div>' +
      (it ? '<p class="a6-desp">En: <b>' + esc(it.titulo) + '</b></p>' : '') +
      '<div class="a6-btns"><button type="button" class="btn pri" data-acc="pomo">' + ico(pausado ? 'i-play' : 'i-pausa') + (pausado ? 'Seguir' : 'Pausar') + '</button><button type="button" class="btn" data-acc="pomo-reiniciar">Terminar</button></div></section>';
  }
  if (s && s.dia === h) {
    const b = s.b, acc = b.tipo === 'pendiente' ? 'p-editar' : b.tipo === 'evento' ? 'ev-editar' : 'dato-ver';
    const desp = bloquesDelDia(h).filter((x) => x.ini > b.ini && x.id !== b.id)[0];
    const falta = b.fin - ahora, cuando = s.enCurso ? 'Ahora · ' + (falta < 60 ? 'quedan ' + falta + ' min' : 'hasta las ' + fmtHora(b.hFin, f)) : s.faltan < 60 ? 'En ' + s.faltan + ' min · ' + fmtHora(b.hIni, f) : 'Lo siguiente · ' + fmtHora(b.hIni, f);
    const prog = s.enCurso ? Math.min(100, Math.max(0, (ahora - b.ini) / Math.max(1, b.fin - b.ini) * 100)) : 0;
    return '<section class="ahora6 area-' + area(b.area).id + (s.enCurso ? ' en-curso' : '') + '" aria-label="Lo que toca ahora">' +
      '<p class="a6-cuando"><i aria-hidden="true"></i>' + cuando + '</p><h2 class="a6-tit">' + esc(b.titulo) + '</h2>' +
      (s.enCurso ? '<span class="f6-barra" role="img" aria-label="Va ' + Math.round(prog) + ' %"><i style="width:' + prog.toFixed(1) + '%"></i></span>' : '') +
      '<p class="a6-chips"><span class="chip area-' + area(b.area).id + '">' + (b.tipo === 'clase' ? 'Clase' : b.tipo === 'pendiente' ? 'Recordatorio' : 'Evento') + '</span>' + (b.lugar ? '<span class="chip-n">' + esc(b.lugar) + '</span>' : '') + '</p>' +
      '<div class="a6-btns">' + (b.tipo === 'pendiente' ? bt('p-marcar', b.id, ico('i-check') + 'Marcar hecho', true) : bt('h6-foco', b.tipo === 'clase' ? '' : b.id, ico('i-play') + 'Concentrarme 25 min', true)) + bt(acc, b.id, 'Abrir') + '</div>' +
      (desp ? '<p class="a6-desp">Después: <b>' + esc(desp.titulo) + '</b> a las ' + fmtHora(desp.hIni, f) + '</p>' : '') + '</section>';
  }
  const x = porHacer[0];
  if (x) return '<section class="ahora6 area-' + area(x.area).id + '" aria-label="Lo más importante"><p class="a6-cuando"><i aria-hidden="true"></i>Lo primero de tus pendientes</p><h2 class="a6-tit">' + esc(x.titulo) + '</h2>' +
    '<div class="a6-btns">' + bt('p-marcar', x.id, ico('i-check') + 'Marcar hecho', true) + bt('h6-foco', x.id, ico('i-play') + 'Concentrarme 25 min') + '</div>' +
    (porHacer.length > 1 ? '<p class="a6-desp">Y ' + (porHacer.length - 1) + ' cosa' + (porHacer.length > 2 ? 's' : '') + ' más abajo.</p>' : '') + '</section>';
  return '<section class="ahora6 libre" aria-label="Día libre"><p class="a6-cuando"><i aria-hidden="true"></i>Nada más por hoy</p><h2 class="a6-tit">Día libre 🌿</h2><div class="a6-btns"><button type="button" class="btn pri" data-acc="captura">' + ico('i-plus') + 'Anotar algo</button></div></section>';
}

/* Desde las 6 p. m.: cerrar el día (lo que quedó pasa a mañana) y cómo viene mañana */
function cierreDia(h, porHacer) {
  if (minutosAhora() < 18 * 60) return '';
  const f = preferencias().formatoHora, m = sumarDias(h, 1), bm = bloquesDelDia(m), pm = pendientesVisibles().filter((x) => x.estado !== 'hecho' && x.fechas.inicio === m);
  const quedan = paraCerrarDia(h).length, nm = bm.length + pm.length;   // lo mismo que pasará el botón
  if (!quedan && !nm) return '';
  return '<section class="cierre6" aria-label="Cierre del día"><div class="c6-txt"><b>' + (quedan ? 'Te ' + (quedan === 1 ? 'queda 1 cosa' : 'quedan ' + quedan + ' cosas') + ' de hoy' : 'Hoy, todo listo ✓') + '</b>' +
    '<small>Mañana: ' + (nm ? nm + (nm === 1 ? ' cosa' : ' cosas') + (bm[0] ? ' · empiezas a las ' + fmtHora(bm[0].hIni, f) : '') : 'libre 🌿') + '</small></div>' +
    (quedan ? '<button type="button" class="btn" data-acc="cerrar-dia">' + ico('i-luna2') + 'Pasar a mañana</button>' : '') + '</section>';
}

/* Dos cuadros chicos: la plata de hoy y la lista que tienes a medias (sin repetir sus pantallas) */
function minis(h) {
  const ym = h.slice(0, 7), mov = elementos((x) => x.tipo === 'movimiento');
  const per = mov.filter((x) => esDelLibro(x, 'personal')), r = resumenMes(per, ym);
  const gHoy = per.filter((x) => !esIngreso(x) && x.fechas.inicio === h).reduce((t, x) => t + Math.abs(+x.monto || 0), 0);   // solo el libro personal, como «te quedan»
  const ls = listas().filter(esChecklist).map((l) => { const p = pendientesDe(l.id); return { l, p, ok: p.filter((x) => x.estado === 'hecho').length }; }).filter((x) => x.p.length && x.ok < x.p.length);
  const l = ls[0];
  return '<div class="minis6">' +
    '<a class="mini6" href="#plata"><small>Cuenta personal · gastaste hoy</small><b>' + fmtSoles(gHoy) + '</b><small>te quedan ' + fmtSoles(r.ingresos - r.gastos) + ' este mes</small></a>' +
    (l ? '<a class="mini6" href="#listas/' + esc(l.l.id) + '"><small>Lista a medias · ' + esc(l.l.titulo) + '</small><b>' + l.ok + '/' + l.p.length + '</b><small>' + esc(l.p.filter((x) => x.estado !== 'hecho').slice(0, 3).map((x) => x.titulo).join(', ')) + '</small></a>'
      : '<a class="mini6" href="#listas"><small>Listas</small><b>' + listas().filter(esChecklist).length + '</b><small>todo marcado</small></a>') +
    '</div>';
}

/* Cada segundo, solo el reloj del Pomodoro (sin repintar la pantalla) */
export function actualizarPomo() {
  const t = document.getElementById('pomoTxt'), a = document.getElementById('pomoAro');
  const r = restante(), tot = totalMs();
  if (t) t.textContent = mmss(r);
  if (a) a.setAttribute('stroke-dashoffset', (C46 * (1 - r / tot)).toFixed(1));
  const br = document.getElementById('pomoBarra'); if (br) br.style.width = (100 * (1 - r / tot)).toFixed(1) + '%';
  const pill = document.getElementById('pildoraPomo');
  if (pill) { pill.hidden = !corriendo() || !!t; const s = pill.querySelector('span'); if (s) s.textContent = mmss(r); }
}

export const acciones = {
  'nombre-listo'() {
    const i = document.getElementById('pnNombre'), v = i ? i.value.trim().slice(0, 40) : '';
    if (!v) { if (i) i.focus(); return false; }
    cambiarPerfil({ nombre: v }); aviso('¡Hola, ' + v.split(/\s+/)[0] + '!'); return true;
  },
  pomo() { const s = document.getElementById('pomoItem'); if (s) vincular(s.value); alternar(); return true; },
  'h6-foco'(b) { if (!corriendo()) { vincular(b.dataset.id || ''); alternar(); aviso('Foco de 25 minutos. ¡Tú puedes!'); } return true; },
  'pomo-reiniciar'() { reiniciar(); return true; },
  'pomo-rapido'() { modoRapido(!estadoPomo().rapido); aviso(estadoPomo().rapido ? 'Modo prueba: 25 minutos duran 10 segundos.' : 'Pomodoro normal de 25 minutos.'); return true; },
  'prio-ok'(b) {
    const l = prioridades(), i = +b.dataset.i;
    if (!l[i].t) return false;
    l[i].ok = !l[i].ok; guardarPrioridades(l);
    if (l[i].ref) { const x = buscarElemento(l[i].ref); if (x && (x.estado === 'hecho') !== l[i].ok) marcar(x.id); }
    if (l.every((x) => x.ok && x.t)) aviso('🎯 ¡Tus 3 prioridades de hoy están hechas!');
    return true;
  },
  'prio-elegir'(b, ev, repintar) {
    const cand = pendientesVisibles().filter((x) => x.estado !== 'hecho' && (grupo(x) === 'hoy' || grupo(x) === 'tarde' || grupo(x) === 'manana')).sort(ordenar).slice(0, 30);
    const hoja = abrirHoja('Elegir prioridades', cand.length ? '<p class="ayuda">Toca hasta 3. Se ponen en los espacios libres.</p><div class="opciones-lista">' +
      cand.map((x) => '<button type="button" class="opcion-fila area-' + area(x.area).id + '" data-id="' + esc(x.id) + '"><i></i><span>' + esc(x.titulo) + '<small>' + (x.fechas.inicio ? fmtCorta(x.fechas.inicio) : '') + '</small></span></button>').join('') + '</div>'
      : '<p class="ayuda">No tienes recordatorios para hoy o mañana. Escribe tus prioridades directamente.</p>');
    hoja.querySelectorAll('[data-id]').forEach((el) => el.addEventListener('click', () => {
      const l = prioridades(), libre = l.findIndex((x) => !x.t);
      if (libre < 0) { aviso('Ya tienes 3 prioridades. Borra una para cambiarla.'); cerrarHoja(); return; }
      const x = buscarElemento(el.dataset.id); l[libre] = { t: x.titulo, ok: false, ref: x.id }; guardarPrioridades(l);
      el.remove(); repintar();
      if (libre === 2) cerrarHoja();
    }));
  }
};
/* Escribir una prioridad: se guarda al salir del campo */
export function alCambiarPrioridad(t) {
  if (!t.dataset || t.dataset.prio == null) return false;
  const l = prioridades(), i = +t.dataset.prio, v = t.value.trim();
  if (l[i].t === v) return false;
  l[i] = { t: v, ok: v ? l[i].ok : false, ref: v === l[i].t ? l[i].ref : '' };
  guardarPrioridades(l);
  return true;
}
