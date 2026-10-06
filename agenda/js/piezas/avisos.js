/* AVISOS DE RECORDATORIOS: cada 30 segundos se mira si algo toca. Suena
   dentro de la app y, si diste permiso, como aviso del sistema. Lo que ya
   sonó se apunta en este aparato para no repetirlo. Si abres la app y algo
   pasó hace horas, no te llueven alarmas: queda en «Para hoy».

   Límite honesto: una página web solo avisa mientras está abierta o en
   segundo plano reciente. Para lo que no puede fallar, mejor también
   pasarlo al calendario del teléfono (Agenda → .ics o Google Calendar). */
import { leer, escribir } from '../datos/almacen.js';
import { elementos } from '../datos/datos.js';
import { preferencias } from '../datos/preferencias.js';
import { hoy, minutosAhora, sumarDias } from '../util/fechas.js';
import { ocurre } from '../datos/calendario.js';
import { aviso } from './aviso.js';
import { avisoDeporte } from '../vistas/area-deporte.js';

const CLAVE = 'agenda5_avisados', MARGEN_MIN = 120;
let avisados = leer(CLAVE, {}) || {};

let audio = null;
export function sonar() {
  if (preferencias().sonido === false) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    [0, 0.28, 0.56].forEach((t) => {
      const o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + t;
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + 0.24);
    });
  } catch (e) { /* sin sonido */ }
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) { /* nada */ }
}

export function permisoAvisos() { return 'Notification' in window ? Notification.permission : 'no'; }
export function pedirPermiso() { return 'Notification' in window ? Notification.requestPermission() : Promise.resolve('no'); }
export function notificar(titulo, cuerpo, vista = 'recordatorios', etiqueta = '') {
  if (permisoAvisos() !== 'granted') return;
  const op = { body: cuerpo, tag: etiqueta || titulo, icon: 'iconos/icon-192.png', badge: 'iconos/icon-192.png', data: { vista } };
  const sw = navigator.serviceWorker;
  if (sw && sw.controller) sw.ready.then((r) => r.showNotification(titulo, op)).catch(() => { try { new Notification(titulo, op); } catch (e) { /* nada */ } });
  else { try { new Notification(titulo, op); } catch (e) { /* nada */ } }
}

/* Devuelve lo que acaba de sonar (para repintar si hace falta) */
export function revisarAvisos(alPulsar) {
  const h = hoy(), ahora = minutosAhora(), sonaron = [];
  elementos((x) => x.tipo === 'pendiente' && x.aviso && x.estado !== 'hecho' && x.fechas.inicio === h && x.fechas.hora).forEach((x) => {
    const [a, b] = x.fechas.hora.split(':').map(Number), m = a * 60 + b, k = x.id + '@' + h + 'T' + x.fechas.hora;
    if (m > ahora || avisados[k]) return;
    avisados[k] = Date.now();
    if (ahora - m <= MARGEN_MIN) sonaron.push(x);
  });
  /* Eventos con aviso «X minutos antes» (hoy y mañana, por los de 1 día antes) */
  [h, sumarDias(h, 1)].forEach((dia, k) => {
    elementos((x) => x.tipo === 'evento' && !x.todoElDia && x.fechas.hora && typeof x.aviso === 'number' && x.aviso >= 0 && ocurre(x.fechas.inicio, x.repetir, dia, x.fechas.fin)).forEach((e) => {
      const [a, b] = e.fechas.hora.split(':').map(Number), ini = a * 60 + b + k * 1440, cuando = ini - e.aviso, clave = 'ev:' + e.id + '@' + dia;
      if (ahora < cuando || ahora > ini + 30 || avisados[clave]) return;
      avisados[clave] = Date.now();
      sonaron.push(Object.assign({}, e, { esEvento: true }));
    });
  });
  /* Deporte: si pasan días sin entrenar, un aviso al día desde las 6 p. m. */
  const kd = 'deporte@' + h, ad = ahora >= 18 * 60 && !avisados[kd] ? avisoDeporte() : null;
  if (ahora >= 18 * 60 && !avisados[kd]) avisados[kd] = Date.now();
  if (ad) { escribir(CLAVE, avisados); aviso('🔥 ' + ad); notificar('🔥 ' + ad, 'Un entreno corto también cuenta. Anótalo en Deporte.', 'areas/deporte/entrenos', 'deporte'); }
  if (!Object.keys(avisados).length) return sonaron;
  const limite = Date.now() - 7 * 864e5;
  Object.keys(avisados).forEach((k) => { if (avisados[k] < limite) delete avisados[k]; });
  escribir(CLAVE, avisados);
  sonaron.forEach((x) => {
    sonar();
    if (x.esEvento) {
      const falta = x.aviso >= 1440 ? 'mañana a las ' + x.fechas.hora : x.aviso ? 'en ' + x.aviso + ' min (' + x.fechas.hora + ')' : 'ahora';
      aviso('📅 ' + x.titulo + ' · ' + falta);
      notificar('📅 ' + x.titulo, 'Empieza ' + falta + (x.extra && x.extra.lugar ? ' · ' + x.extra.lugar : ''), 'agenda', x.id);
      return;
    }
    aviso('⏰ ' + x.titulo, alPulsar ? () => alPulsar(x) : null, 'Hecho');
    notificar('⏰ ' + x.titulo, 'Recordatorio · ' + x.fechas.hora, 'recordatorios', x.id);
  });
  return sonaron;
}
