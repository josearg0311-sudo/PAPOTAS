/* HOY: lo urgente, tus 3 prioridades, recordatorios de hoy, el día en
   bloques, el Pomodoro y el balance. En la Fase 1 la estructura está
   completa y vacía; los datos llegan en las Fases 2 y 3. */
import { hoy, sumarDias, inicioSemana, diaSemana, DIAS3, fmtLarga, saludo, horaAhora, minutosAhora, fmtHora } from '../util/fechas.js';
import { vacio, ico, esc } from '../util/dom.js';
import { preferencias, minutosVigilia } from '../datos/preferencias.js';
import { leer, ANTIGUAS } from '../datos/almacen.js';
import { documento, elementos } from '../datos/datos.js';
import { tocaRespaldar, diasSinRespaldo } from '../datos/respaldo.js';
import { tarjeta, enFase } from './comun.js';

function nombre() {
  const doc = documento();
  if (doc && doc.perfil && doc.perfil.nombre) return String(doc.perfil.nombre).trim().split(/\s+/)[0];
  const d = leer(ANTIGUAS.datos, null);
  const n = d && d.perfil && typeof d.perfil.nombre === 'string' ? d.perfil.nombre.trim() : '';
  return n ? n.split(/\s+/)[0] : '';
}

export function franjaSemana(diaSel, accion = 'ir-dia') {
  const p = preferencias(), h = hoy(), ini = inicioSemana(diaSel || h, p.semanaLunes);
  return '<div class="franja" role="group" aria-label="Días de esta semana">' + [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = sumarDias(ini, i);
    return '<button type="button" data-acc="' + accion + '" data-dia="' + d + '"' + (d === (diaSel || h) ? ' aria-pressed="true"' : ' aria-pressed="false"') +
      (d === h ? ' class="es-hoy"' : '') + '><small>' + DIAS3[diaSemana(d)] + '</small><b>' + +d.slice(8) + '</b></button>';
  }).join('') + '</div>';
}

/* Línea de horas de la vigilia con la marca de «ahora» */
function lineaVigilia() {
  const p = preferencias(), ini = +p.vigilia.ini.slice(0, 2), fin = +p.vigilia.fin.slice(0, 2) || 24, ahora = minutosAhora();
  const horas = [];
  for (let h = ini; h < (fin > ini ? fin : fin + 24) && horas.length < 24; h += 2) horas.push(h % 24);
  let html = '<div class="linea-dia">';
  let puesto = false;
  horas.forEach((h) => {
    if (!puesto && h * 60 > ahora) { puesto = true; html += '<div class="ahora"><span>' + fmtHora(horaAhora(), p.formatoHora) + '</span><i></i></div>'; }
    html += '<div class="hora-fila"><span>' + fmtHora((h < 10 ? '0' : '') + h + ':00', p.formatoHora) + '</span><i></i></div>';
  });
  if (!puesto) html += '<div class="ahora"><span>' + fmtHora(horaAhora(), p.formatoHora) + '</span><i></i></div>';
  return html + '</div>';
}

export function vistaHoy() {
  const p = preferencias(), n = nombre(), doc = documento(), C = 2 * Math.PI * 38;
  const total = elementos((x) => !(x.extra && x.extra.sistema)).length, rs = diasSinRespaldo();
  const vig = minutosVigilia(p), hv = Math.floor(vig / 60), mv = vig % 60;
  return '<div class="columnas"><div>' +
    '<section class="tarjeta heroe">' +
      '<div class="heroe-fila"><div class="anillo" role="img" aria-label="0 de 0 hechos hoy"><svg viewBox="0 0 92 92"><circle class="fondo" cx="46" cy="46" r="38"/><circle class="valor" cx="46" cy="46" r="38" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + C.toFixed(1) + '"/></svg><div><b>0/0</b><small>de hoy</small></div></div>' +
      '<div><small class="fecha-larga">' + fmtLarga(hoy()) + '</small><h2>' + saludo() + (n ? ', ' + esc(n) : '') + '</h2><p>' + (total ? 'Tienes ' + total + ' cosas guardadas. Tu día con ellas llega en la Fase 3.' : 'Tu Agenda nueva está lista para empezar.') + '</p></div></div>' +
      franjaSemana() +
      '<p class="explica"><b>Tu avance del día.</b> El anillo se llenará con cada recordatorio que marques como hecho. Toca un día de la franja para verlo en la Agenda.</p>' +
    '</section>' +
    (tocaRespaldar() ? '<div class="nota-fase aviso-respaldo">' + ico('i-escudo') + '<span><b>' + (rs.nunca ? 'Aún no tienes un respaldo.' : 'Último respaldo: hace ' + rs.dias + ' días.') + '</b> Guarda uno para no perder nada.</span><button type="button" class="btn chico pri" data-acc="respaldo-bajar">Respaldar</button></div>' : '') +
    (doc && doc.migracion && doc.migracion.verificacion && doc.migracion.verificacion.ok && Date.now() - doc.migracion.fecha < 3 * 864e5 ? '<a class="nota-fase segura" href="#datos">' + ico('i-escudo') + '<span><b>Tus datos de la versión anterior ya están aquí,</b> verificados uno por uno. Toca para verlos.</span></a>' : '') +
    tarjeta({ eti: '01', titulo: 'Urgente', n: 0, guia: '<b>Lo que no puede esperar.</b> Primero el <b>plazo legal</b>, luego lo vencido 🔴 y lo que vence en 3 días o menos ⚠️.',
      cuerpo: vacio('Nada urgente', 'Cuando algo venza pronto, aparecerá aquí primero.') }) +
    tarjeta({ eti: '02', titulo: 'Recordatorios de hoy', n: 0, guia: '<b>Marca lo que ya hiciste</b> con la casilla, o pásalo a <b>Más tarde</b> o a <b>Mañana</b>.',
      cuerpo: vacio('Todo listo por hoy', 'Agrega uno con el botón +.') + enFase(3, 'tus recordatorios con casillas, «Más tarde», «Mañana» y «Cerrar el día».') }) +
    tarjeta({ eti: '03', titulo: 'Tus 3 prioridades', n: '0 de 3', guia: '<b>Solo tres.</b> Si todo es prioridad, nada lo es. Elige cada mañana las tres cosas que harán que el día valga la pena.',
      cuerpo: vacio('Elige tus 3 prioridades', 'Podrás escogerlas de tus recordatorios o escribirlas aquí.') }) +
  '</div><div>' +
    tarjeta({ eti: '04', titulo: 'Tu día en bloques', n: 0, guia: '<b>Tu día como una línea de tiempo</b>, de ' + fmtHora(p.vigilia.ini, p.formatoHora) + ' a ' + fmtHora(p.vigilia.fin, p.formatoHora) + ' (tu horario despierto, se cambia en Ajustes). La línea brillante marca la hora actual en Lima.',
      cuerpo: lineaVigilia() }) +
    tarjeta({ eti: '05', titulo: 'Pomodoro', id: 'tarjetaPomo', guia: '<b>25 minutos de foco y 5 de descanso.</b> Lo vincularás a un recordatorio y el tiempo se sumará a su área.',
      cuerpo: '<div class="pomo"><div class="anillo grande" role="img" aria-label="25 minutos"><svg viewBox="0 0 112 112"><circle class="fondo" cx="56" cy="56" r="46"/></svg><div><b>25:00</b><small>foco</small></div></div>' +
        '<div class="pomo-ctl"><button type="button" class="btn pri" data-acc="fase" data-n="3">' + ico('i-play') + 'Empezar</button><small>Hoy: aún nada</small></div></div>' + enFase(3, 'el Pomodoro funcionando y sumando minutos a cada área.') }) +
    tarjeta({ eti: '06', titulo: 'Balance del día', n: fmtHora(p.vigilia.ini, p.formatoHora) + '–' + fmtHora(p.vigilia.fin, p.formatoHora), guia: '<b>¿Te sobrecargaste?</b> Suma las horas planificadas de cada área y las compara con tus horas despierto. Si pasas del 85 %, te avisa.',
      cuerpo: '<div class="balance"><div class="tot"><b>0 h</b><span>planificadas de ' + hv + ' h' + (mv ? ' ' + mv : '') + ' despierto</span></div><div class="barra-area" aria-hidden="true"></div>' +
        '<div class="leyenda"><span class="area-personal">Personal</span><span class="area-estudios">Estudios</span><span class="area-oficina">Oficina</span><span class="area-deporte">Deporte</span></div></div>' }) +
  '</div></div>';
}
