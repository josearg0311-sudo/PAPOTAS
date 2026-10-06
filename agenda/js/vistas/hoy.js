/* HOY: lo urgente (plazo legal primero), tus recordatorios de hoy, tus 3
   prioridades, tu día en bloques, el Pomodoro y el balance de horas. */
import { hoy, sumarDias, inicioSemana, diaSemana, DIAS3, fmtLarga, saludo, horaAhora, minutosAhora, fmtHora, fmtCorta } from '../util/fechas.js';
import { vacio, ico, esc } from '../util/dom.js';
import { preferencias, minutosVigilia } from '../datos/preferencias.js';
import { leer, ANTIGUAS } from '../datos/almacen.js';
import { documento, elementos, buscarElemento, poner, cambiarPerfil } from '../datos/datos.js';
import { modeloVacio } from '../datos/modelo.js';
import { tocaRespaldar, diasSinRespaldo } from '../datos/respaldo.js';
import { urgentes, delDia, hechosHoy, ordenar, grupo, marcar, pendientesVisibles } from '../datos/pendientes.js';
import { bloquesDelDia, todoElDia, minutosPorArea } from '../datos/calendario.js';
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
import { tarjetaQueHacer, tarjetaSiguiente, tarjetaManana, tarjetaNumeros } from './hoy-extra.js';
import { tarjetaEspacios } from './espacios.js';

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

export function vistaHoy() {
  const p = preferencias(), h = hoy(), n = nombre(), doc = documento(), rs = diasSinRespaldo();
  const delDiaL = delDia(h).sort(ordenar), hechos = hechosHoy(h), urg = urgentes(h);
  const tot = delDiaL.length + hechos.length, pct = tot ? hechos.length / tot : 0;
  const bloques = bloquesDelDia(h), tde = todoElDia(h), mins = minutosPorArea(bloques), vig = minutosVigilia(p), carga = mins.total / vig;
  const fer = p.feriados === false ? '' : feriado(h);
  const pr = prioridades(), hechasPr = pr.filter((x) => x.ok && x.t).length;
  const hh = (m) => (m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) : ''));

  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  return '<div class="hoy">' +
    '<header class="hoy-cab"><div class="hc-txt"><small>' + cap(fmtLarga(h)) + '</small><h1 class="ph-saludo">' + saludo() + (n ? ', ' + esc(n) : '') + '</h1><p class="hc-frase">' + esc(fraseDelDia(h)) + '</p></div>' +
      '<div class="anillo-hoy" role="img" aria-label="' + hechos.length + ' de ' + tot + ' hechas hoy"><svg viewBox="0 0 74 74" aria-hidden="true"><circle class="fondo" cx="37" cy="37" r="32"/><circle class="valor" cx="37" cy="37" r="32" stroke-dasharray="' + (2 * Math.PI * 32).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 32 * (1 - pct)).toFixed(1) + '"/></svg><span><b>' + hechos.length + '/' + tot + '</b>hechas</span></div></header>' +
    franjaSemana() +
    (fer || tde.length ? '<p class="hoy-extra">' + (fer ? '<span class="feriado">' + ico('i-bandera') + 'Feriado: <b>' + esc(fer) + '</b></span>' : '') + tde.map((t) => '<button type="button" class="chip area-' + area(t.area).id + '" data-acc="ev-editar" data-id="' + esc(t.id) + '">' + (t.cumple ? '🎂 ' : '') + esc(t.titulo) + '</button>').join('') + '</p>' : '') +
    (n ? '' : '<section class="pide-nombre"><b>¿Cómo te llamas?</b><span>Para saludarte por tu nombre cada día.</span><form class="pn-form"><label class="solo-lector" for="pnNombre">Tu nombre</label><input id="pnNombre" class="entrada" maxlength="40" autocomplete="given-name" placeholder="Tu nombre, ej. José"><button type="button" class="btn pri" data-acc="nombre-listo">Listo</button></form></section>') +
    tarjetaEspacios() +
    tarjetaQueHacer() + tarjetaSiguiente() +
    (tocaRespaldar() ? '<div class="nota-fase aviso-respaldo">' + ico('i-escudo') + '<span><b>' + (rs.nunca ? 'Aún no tienes un respaldo.' : 'Último respaldo: hace ' + rs.dias + ' días.') + '</b> Guarda uno para no perder nada.</span><button type="button" class="btn chico pri" data-acc="respaldo-bajar">Respaldar</button></div>' : '') +
    (avisoDeporte() ? '<a class="nota-fase aviso-carga" href="#areas/deporte/entrenos">' + ico('i-fuego') + '<span><b>Deporte:</b> ' + esc(avisoDeporte()) + '. Un entreno corto también cuenta: toca para anotarlo.</span></a>' : '') +
    (carga > SOBRECARGA ? '<div class="nota-fase aviso-carga">' + ico('i-info') + '<span><b>Día sobrecargado:</b> tienes ' + hh(mins.total) + ' planificadas de ' + hh(vig) + ' despierto (' + Math.round(carga * 100) + ' %). Considera mover algo a mañana.</span></div>' : '') +
    (!urg.length ? '' : tarjeta({ eti: 'URGENTE', clase: 'w-rojo', titulo: 'Urgente', n: urg.length, guia: '<b>Lo que no puede esperar.</b> Primero el <b>plazo legal</b>, luego lo vencido 🔴 y lo que vence en 3 días o menos ⚠️.',
      cuerpo: urg.length ? '<div class="pends">' + urg.slice(0, 6).map((x) => filaPendiente(x, { verLista: true })).join('') + '</div>' + (urg.length > 6 ? '<p class="pie-ajuste">Y ' + (urg.length - 6) + ' más en Recordatorios.</p>' : '') : vacio('Nada urgente', 'Cuando algo venza pronto o tenga plazo legal, aparecerá aquí primero.') })) +
    tarjeta({ eti: 'PENDIENTES', clase: 'w-rojo', titulo: 'Pendientes <a class="ver-link" href="#recordatorios">Ver todo' + ico('i-der') + '</a>', n: delDiaL.length, guia: '<b>Marca lo que ya hiciste</b> con la casilla, o pásalo a <b>Más tarde</b> o a <b>Mañana</b>. También puedes deslizarlo con el dedo.',
      cuerpo: (delDiaL.length ? '<div class="pends">' + delDiaL.slice(0, 8).map((x) => filaPendiente(x, { verLista: true })).join('') + '</div>' : vacio(tot ? 'Todo listo por hoy' : 'Nada para hoy', tot ? 'Hiciste ' + hechos.length + (hechos.length === 1 ? ' cosa' : ' cosas') + '. 👏' : 'Agrega uno con el botón +.')) +
        '<div class="pie-tarjeta"><a class="btn" href="#recordatorios">' + ico('i-rec') + 'Ver todas mis listas' + (delDiaL.length > 8 ? ' (' + (delDiaL.length - 8) + ' más)' : '') + '</a><button type="button" class="btn" data-acc="cerrar-dia">' + ico('i-luna2') + 'Cerrar el día</button></div>' }) +
    tarjeta({ eti: 'PRIORIDADES', clase: 'w-ambar', titulo: 'Tus 3 prioridades', n: hechasPr + ' de 3', guia: '<b>Solo tres.</b> Si todo es prioridad, nada lo es. Escríbelas o elígelas de tus recordatorios.',
      cuerpo: '<div class="prioridades">' + pr.map((x, i) => '<div class="prio-fila' + (x.ok ? ' hecho' : '') + '"><span class="prio-n">' + (i + 1) + '</span>' +
        '<label class="solo-lector" for="prio' + i + '">Prioridad ' + (i + 1) + '</label><input id="prio' + i + '" class="entrada" data-prio="' + i + '" maxlength="120" value="' + esc(x.t) + '" placeholder="' + ['Lo más importante de hoy', 'Lo segundo', 'Lo tercero'][i] + '">' +
        '<button type="button" class="casilla" role="checkbox" aria-checked="' + !!x.ok + '" data-acc="prio-ok" data-i="' + i + '" aria-label="Marcar prioridad ' + (i + 1) + '"' + (x.t ? '' : ' disabled') + '><span></span></button></div>').join('') + '</div>' +
        '<div class="pie-tarjeta"><button type="button" class="btn chico" data-acc="prio-elegir">' + ico('i-rec') + 'Elegir de mis recordatorios</button></div>' }) +
    tarjeta({ eti: 'TU DÍA', clase: 'w-morado', titulo: 'Tu día', n: bloques.length, guia: '<b>Tu día como una línea de tiempo.</b> Eventos, clases de tus cursos y recordatorios con hora, con el color de su área. La línea brillante es la hora actual en Lima.',
      cuerpo: lineaDia(bloques) }) +
    tarjetaNumeros() + tarjetaManana() + tarjetaHabitos() +
    tarjeta({ eti: 'FOCO', clase: 'w-rojo', titulo: 'Pomodoro', id: 'tarjetaPomo', guia: '<b>25 minutos de foco y 5 de descanso</b> (cada 4, uno de 15). Elige en qué te concentras: al terminar, los minutos se suman a ese recordatorio y a su área.',
      cuerpo: pomoHTML() }) +
    tarjeta({ eti: 'BALANCE', clase: 'w-verde', titulo: 'Balance del día', n: fmtHora(p.vigilia.ini, p.formatoHora) + '–' + fmtHora(p.vigilia.fin, p.formatoHora), guia: '<b>¿Te sobrecargaste?</b> Suma las horas planificadas (eventos, clases y recordatorios con hora) y las compara con tus horas despierto. Pasando el ' + Math.round(SOBRECARGA * 100) + ' %, te avisa.',
      cuerpo: '<div class="balance"><div class="tot"><b>' + hh(mins.total) + '</b><span>planificadas de ' + hh(vig) + ' despierto · ' + Math.round(carga * 100) + ' %</span></div>' +
        '<div class="barra-area" role="img" aria-label="' + AREAS.map((a) => a.nombre + ' ' + hh(mins[a.id] || 0)).join(', ') + '">' + AREAS.map((a) => mins[a.id] ? '<i class="area-' + a.id + '" style="width:' + Math.min(100, (mins[a.id] / vig) * 100).toFixed(1) + '%"></i>' : '').join('') + '</div>' +
        '<div class="leyenda">' + AREAS.map((a) => '<span class="area-' + a.id + '">' + a.nombre + ' ' + hh(mins[a.id] || 0) + '</span>').join('') + '</div>' +
        '<span class="' + (carga > SOBRECARGA ? 'txt-aviso' : 'txt-ok') + '">' + (carga > SOBRECARGA ? 'Día sobrecargado.' : 'Día equilibrado: te quedan ' + hh(Math.max(0, vig - mins.total)) + ' libres.') + '</span></div>' }) +
  '</div>';
}

/* Cada segundo, solo el reloj del Pomodoro (sin repintar la pantalla) */
export function actualizarPomo() {
  const t = document.getElementById('pomoTxt'), a = document.getElementById('pomoAro');
  const r = restante(), tot = totalMs();
  if (t) t.textContent = mmss(r);
  if (a) a.setAttribute('stroke-dashoffset', (C46 * (1 - r / tot)).toFixed(1));
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
