/* ENTENDER CUALQUIER COSA (Agenda 6): un solo campo para todo.
   «almuerzo 25»              → gasto de S/ 25.00 (Comida, libro personal)
   «taxi oficina 18»          → gasto en el libro de la oficina
   «cobré 1200 empresa ABC»   → ingreso
   «compras: leche, pan»      → lista para marcar con sus cosas
   «reunión viernes 4pm»      → evento
   «nota: ideas para el viaje»→ nota
   lo demás                   → recordatorio (con fecha y hora si las dice)
   Puro: no guarda nada, solo dice qué es. */
import { interpretar } from '../util/interpretar.js';
import { leerMonto } from '../util/dinero.js';
import { categoriaDe } from './finanzas.js';
import { hoy as hoyLima } from '../util/fechas.js';

const sinTildes = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const RE_INGRESO = /\b(cobre|cobro|me pagaron|me depositaron|recibi|ingreso|sueldo|honorarios|me yapearon)\b/;
const RE_EVENTO = /\b(reunion|cita|clase|audiencia|cumple|cumpleanos|partido|examen|almuerzo con|cena con|junta|entrevista|vuelo)\b/;
const RE_FECHA = /\b(hoy|manana|pasado manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|en \d+ (dia|dias|semana|semanas)|\d{1,2}\/\d{1,2}|\d{1,2} de [a-z]+)\b/;
const RE_HORA = /(\d{1,2}:\d{2}|\b\d{1,2}\s?(am|pm)\b|\ba las \d|\bmediodia\b)/;
const RE_OFICINA = /\b(oficina|chamba|trabajo)\b/;
/* Un monto suelto: «25», «25.50», «S/ 1,250», «s/.30» (no una hora ni una fecha) */
const RE_MONTO = /(^|\s)(?:s\/\.?\s*)?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s*(?:soles|lucas|sol))?(?=\s|$)/i;

export function entender(texto, opciones = {}) {
  const t = String(texto || '').trim();
  if (!t) return null;
  const b = sinTildes(t);

  /* Nota: «nota: …» o «idea: …» */
  const n = t.match(/^\s*(nota|idea|apunte)\s*:\s*(.*)$/is);
  if (n) return { tipo: 'nota', titulo: n[2].trim().split('\n')[0] || 'Nota', notas: n[2].trim().split('\n').slice(1).join('\n') };

  /* Lista: «nombre: cosa, cosa, cosa» (los dos puntos no son de una hora) */
  const l = t.match(/^([^:\d][^:]{0,40}?)\s*:\s*(.+)$/s);
  if (l && !/\d:\d/.test(t.slice(0, l[1].length + 2))) {
    const cosas = l[2].split(/[,\n;]+| y (?=\S)/).map((x) => x.trim()).filter(Boolean);
    if (cosas.length) return { tipo: 'lista', titulo: l[1].trim().replace(/^./, (c) => c.toUpperCase()), cosas };
  }

  const tieneFecha = RE_FECHA.test(b), tieneHora = RE_HORA.test(b);

  /* Plata: un monto suelto y nada de fecha u hora → gasto o ingreso */
  const m = !tieneHora && !tieneFecha ? t.match(RE_MONTO) : null;
  /* «comprar 3 panes» no es plata: el número tiene que ir al inicio o al final,
     o llevar «S/» o «soles», o ser un cobro */
  const claro = m && (/s\/|soles|lucas/i.test(m[0]) || RE_INGRESO.test(b) || m.index === 0 || m.index + m[0].length >= t.length);
  if (m && claro) {
    const monto = leerMonto(m[2]);
    if (monto != null && monto > 0) {
      const ingreso = RE_INGRESO.test(b), libro = RE_OFICINA.test(b) ? 'oficina' : 'personal';
      let desc = (t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length)).replace(/\b(s\/\.?|soles|lucas)\b/gi, ' ');
      if (libro === 'oficina') desc = desc.replace(/\b(de la |en la |la )?(oficina|chamba|trabajo)\b/gi, ' ');
      desc = desc.replace(/\s+/g, ' ').trim().replace(/^(en|de|por)\s+/i, '');
      if (ingreso) desc = desc.replace(/^(cobr[eé]|me pagaron|me depositaron|recib[ií]|me yapearon)(?=\s|$)\s*/i, '').replace(/^(de|por)\s+/i, '');
      desc = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : (ingreso ? (libro === 'oficina' ? 'Cobro' : 'Ingreso') : 'Gasto');
      return { tipo: ingreso ? 'ingreso' : 'gasto', monto, titulo: desc, libro, categoria: categoriaDe(desc, libro, ingreso) };
    }
  }

  /* Evento o recordatorio: fecha y hora con el intérprete de siempre */
  const r = interpretar(t, opciones);
  const fecha = r.algunDia ? null : (r.fecha || opciones.hoy || hoyLima());
  if (RE_EVENTO.test(b) && (tieneFecha || tieneHora)) return { tipo: 'evento', titulo: r.titulo || t, fecha: r.fecha, hora: r.hora, area: r.area };
  return { tipo: 'recordatorio', titulo: r.titulo || t, fecha, hora: r.hora, area: r.area, prioridad: r.prioridad, plazoLegal: r.plazoLegal, etiquetas: r.etiquetas, algunDia: r.algunDia };
}
