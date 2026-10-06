/* PASAR AL CALENDARIO DEL TELÉFONO
   - Enlace a Google Calendar (abre el evento ya escrito para guardarlo).
   - Archivo .ics (estándar: lo abren Google Calendar, el Calendario del
     iPhone y Outlook), con la zona America/Lima y la alarma de aviso.
   El calendario del teléfono suena aunque la Agenda esté cerrada. */
import { sumarDias } from './fechas.js';

const RRULE = { dia: 'FREQ=DAILY', lab: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', sem: 'FREQ=WEEKLY', mes: 'FREQ=MONTHLY', ano: 'FREQ=YEARLY' };
const sinGuiones = (f) => f.replace(/-/g, '');
const horaICS = (h) => h.replace(':', '') + '00';
function masUnaHora(h) { const [a, b] = h.split(':').map(Number); const t = (a * 60 + b + 60) % 1440; return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }

/* Normaliza un elemento (evento o pendiente) a lo que necesita un calendario */
export function aCita(x) {
  const f = x.fechas || {};
  const conHora = !!f.hora && !x.todoElDia;
  return {
    uid: x.id + '@agenda-lima', titulo: x.titulo || 'Sin título', notas: x.notas || '', lugar: (x.extra && x.extra.lugar) || '',
    fecha: f.inicio, hasta: f.fin && f.fin > f.inicio ? f.fin : null, hora: conHora ? f.hora : null,
    fin: conHora ? (f.horaFin && f.horaFin > f.hora ? f.horaFin : (x.tipo === 'pendiente' ? null : masUnaHora(f.hora))) : null,
    repetir: x.repetir || null,
    aviso: x.tipo === 'pendiente' ? (x.aviso && conHora ? 0 : null) : (typeof x.aviso === 'number' && x.aviso >= 0 ? x.aviso : null)
  };
}

export function enlaceGoogle(x) {
  const c = aCita(x);
  let fechas;
  if (c.hora) {
    const fin = c.fin || masUnaHora(c.hora);
    fechas = sinGuiones(c.fecha) + 'T' + horaICS(c.hora) + '/' + sinGuiones(c.hasta || c.fecha) + 'T' + horaICS(fin);
  } else fechas = sinGuiones(c.fecha) + '/' + sinGuiones(sumarDias(c.hasta || c.fecha, 1));
  const q = new URLSearchParams({ action: 'TEMPLATE', text: c.titulo, dates: fechas, ctz: 'America/Lima' });
  if (c.notas) q.set('details', c.notas);
  if (c.lugar) q.set('location', c.lugar);
  if (c.repetir && RRULE[c.repetir]) q.set('recur', 'RRULE:' + RRULE[c.repetir]);
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}

function escapar(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
/* Las líneas de un .ics no deben pasar de 75 bytes: se doblan */
function doblar(linea) {
  const bytes = new TextEncoder().encode(linea);
  if (bytes.length <= 75) return linea;
  const out = []; let actual = '', largo = 0;
  for (const ch of linea) {
    const n = new TextEncoder().encode(ch).length;
    if (largo + n > (out.length ? 74 : 75)) { out.push(actual); actual = ''; largo = 0; }
    actual += ch; largo += n;
  }
  out.push(actual);
  return out.join('\r\n ');
}
function sello(ms) { const d = new Date(ms); return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }

export function textoICS(elementos, ahora = Date.now()) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Agenda Lima//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE', 'TZID:America/Lima', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:-0500', 'TZOFFSETTO:-0500', 'TZNAME:-05', 'END:STANDARD', 'END:VTIMEZONE'];
  elementos.forEach((x) => {
    const c = aCita(x);
    if (!c.fecha) return;
    L.push('BEGIN:VEVENT', 'UID:' + c.uid, 'DTSTAMP:' + sello(ahora));
    if (c.hora) {
      L.push('DTSTART;TZID=America/Lima:' + sinGuiones(c.fecha) + 'T' + horaICS(c.hora));
      L.push('DTEND;TZID=America/Lima:' + sinGuiones(c.hasta || c.fecha) + 'T' + horaICS(c.fin || masUnaHora(c.hora)));
    } else {
      L.push('DTSTART;VALUE=DATE:' + sinGuiones(c.fecha), 'DTEND;VALUE=DATE:' + sinGuiones(sumarDias(c.hasta || c.fecha, 1)));
    }
    L.push('SUMMARY:' + escapar(c.titulo));
    if (c.notas) L.push('DESCRIPTION:' + escapar(c.notas));
    if (c.lugar) L.push('LOCATION:' + escapar(c.lugar));
    if (c.repetir && RRULE[c.repetir]) L.push('RRULE:' + RRULE[c.repetir]);
    if (c.aviso != null) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + escapar(c.titulo), 'TRIGGER:-PT' + c.aviso + 'M', 'END:VALARM');
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(doblar).join('\r\n') + '\r\n';
}
