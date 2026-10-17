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
import { hoy as hoyLima, sumarDias } from '../util/fechas.js';

const sinTildes = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const RE_INGRESO = /\b(cobre|cobro|me pagaron|me depositaron|recibi|ingreso|sueldo|honorarios|me yapearon)\b/;
const RE_EVENTO = /\b(reunion|cita|clase|audiencia|cumple|cumpleanos|partido|examen|almuerzo con|cena con|junta|entrevista|vuelo)\b/;
const RE_FECHA = /\b(hoy|manana|pasado manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|en \d+ (dia|dias|semana|semanas)|\d{1,2}\/\d{1,2}|\d{1,2} de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre))\b/;
const RE_HORA = /(\d{1,2}:\d{2}|\b\d{1,2}\s?(am|pm)\b|\ba las \d|\bmediodia\b)/;
const RE_OFICINA = /\b(oficina|chamba|trabajo)\b/;
/* Empieza con una acción: «llamar a mamá 8» no es plata (salvo que diga S/ o soles) */
const RE_GASTE = /^(pague|gaste|compre|me cobraron)\b/;
const RE_ACCION = /^(llamar|escribir|enviar|mandar|revisar|visitar|recoger|ir|ver|hablar|estudiar|leer|terminar|hacer|avisar|preguntar|regar|limpiar|sacar|preparar)\b/;
/* Lo que se repite: «todos los días», «de lunes a viernes», «cada lunes», «cada mes»… */
const REPETIR = [
  [/\b(todos los dias|todas las mananas|todas las noches|cada dia|diariamente|a diario)\b/, 'dia'],
  [/\b(de lunes a viernes|dias de semana|dias laborables|dias utiles)\b/, 'lab'],
  [/\b(?:cada|todos los|todas los) (lunes|martes|miercoles|jueves|viernes|sabados?|domingos?)\b/, 'sem', true],
  [/\b(cada semana|semanal|semanalmente|todas las semanas)\b/, 'sem'],
  [/\b(cada mes|mensual|mensualmente|todos los meses)\b/, 'mes'],
  [/\b(cada ano|anual|anualmente|todos los anos)\b/, 'ano']
];
/* Un monto suelto: «25», «25.50», «S/ 1,250», «s/.30» (no una hora ni una fecha) */
const RE_MONTO = /(^|\s)(?:s\/\.?\s*)?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s*(?:soles|lucas|sol))?(?=\s|$)/i;

/* Quita un trozo de los dos textos (el original y el sin tildes, del mismo largo) */
function quitar(t, b, m, poner = '') {
  const rel = poner ? ' ' + poner + ' ' : ' ';
  return [t.slice(0, m.index) + rel + t.slice(m.index + m[0].length), b.slice(0, m.index) + rel + b.slice(m.index + m[0].length)];
}

/* Varias cosas de una vez: una por línea o separadas por «;» (una lista «nombre: …» va entera) */
export function entenderVarios(texto, opciones = {}) {
  const t = String(texto || '').trim();
  if (!t) return [];
  const uno = entender(t, opciones);
  if (uno && (uno.tipo === 'lista' || uno.tipo === 'nota')) return [uno];
  const partes = t.split(/\n|;/).map((x) => x.trim()).filter(Boolean);
  return partes.length > 1 ? partes.map((x) => entender(x, opciones)).filter(Boolean) : (uno ? [uno] : []);
}

export function entender(texto, opciones = {}) {
  let t = String(texto || '').trim();
  if (!t) return null;
  let b = sinTildes(t);
  const hoyD = opciones.hoy || hoyLima();

  /* Nota: «nota: …» o «idea: …» */
  const n = t.match(/^\s*(nota|idea|apunte)\s*:\s*(.*)$/is);
  if (n) return { tipo: 'nota', titulo: n[2].trim().split('\n')[0] || 'Nota', notas: n[2].trim().split('\n').slice(1).join('\n') };

  /* Lista: «nombre: cosa, cosa, cosa» (los dos puntos no son de una hora) */
  const l = t.match(/^([^:\d][^:]{0,40}?)\s*:\s*(.+)$/s);
  /* …pero no «Reunión con Ana: viernes 4pm», «ojo: llamar mañana» ni un enlace */
  const tras = l ? sinTildes(l[2]) : '';
  if (l && !/\d:\d/.test(t.slice(0, l[1].length + 2)) && !/https?|www\./i.test(t) && !RE_FECHA.test(tras) && !RE_HORA.test(tras)) {
    const cosas = l[2].split(/[,\n;]+| y (?=\S)/).map((x) => x.trim()).filter(Boolean);
    if (cosas.length) return { tipo: 'lista', titulo: l[1].trim().replace(/^./, (c) => c.toUpperCase()), cosas };
  }

  /* ¿Se repite? (se quita del texto; «cada lunes» deja «lunes» para la fecha) */
  let repetir = '';
  for (const [re, rep, dejarDia] of REPETIR) {
    const r = re.exec(b);
    if (r) { [t, b] = quitar(t, b, r, dejarDia ? r[1].replace(/(sabado|domingo)s$/, '$1') : ''); repetir = rep; break; }
  }

  /* Plata de ayer u hoy: «taxi 15 ayer» (el día no impide que sea un gasto) */
  let fechaPlata = hoyD, sinDia = b;
  const dp = /\b(anteayer|antier|ayer|hoy)\b/.exec(b);
  if (dp) { fechaPlata = dp[1] === 'hoy' ? hoyD : sumarDias(hoyD, dp[1] === 'ayer' ? -1 : -2); sinDia = quitar(t, b, dp)[1]; }

  const tieneFecha = RE_FECHA.test(b), tieneHora = RE_HORA.test(b);

  /* Plata: un monto suelto y nada de fecha u hora → gasto o ingreso */
  const tp = dp ? quitar(t, b, dp)[0].replace(/\s+/g, ' ').trim() : t;
  const m = !repetir && !tieneHora && !RE_FECHA.test(sinDia) ? tp.match(RE_MONTO) : null;
  /* «comprar 3 panes» no es plata: el número tiene que ir al inicio o al final,
     o llevar «S/» o «soles», o ser un cobro */
  const fin = tp.replace(/\s+(de la |en la |la |de |en )?(oficina|chamba|trabajo)\s*$/i, '').length;   // «taxi 18 oficina»
  /* también «pagué 15 de luz», «taxi 20 de ida»: un gasto dicho o un monto seguido de «de/en/por/para» */
  const trasM = m ? tp.slice(m.index + m[0].length) : '';
  const claro = m && (/s\/|soles|lucas/i.test(m[0]) || (!RE_ACCION.test(b) && (RE_INGRESO.test(b) || RE_GASTE.test(b) || /^\s*(de|en|por|para)\s/i.test(trasM) || m.index === 0 || m.index + m[0].length >= fin)));
  if (m && claro) {
    const monto = leerMonto(m[2]);
    if (monto != null && monto > 0) {
      const ingreso = RE_INGRESO.test(b), libro = RE_OFICINA.test(b) ? 'oficina' : 'personal';
      let desc = (tp.slice(0, m.index) + ' ' + tp.slice(m.index + m[0].length)).replace(/\b(s\/\.?|soles|lucas)\b/gi, ' ');
      if (libro === 'oficina') desc = desc.replace(/\b(de la |en la |la )?(oficina|chamba|trabajo)\b/gi, ' ');
      desc = desc.replace(/\s+/g, ' ').trim().replace(/^(en|de|por)\s+/i, '');
      desc = desc.replace(/^(pagu[eé]|gast[eé]|compr[eé]|me cobraron)(?=\s|$)\s*/i, '').replace(/^(de|en|por|para)\s+/i, '');
      if (ingreso) desc = desc.replace(/^(cobr[eé]|me pagaron|me depositaron|recib[ií]|me yapearon)(?=\s|$)\s*/i, '').replace(/^(de|por)\s+/i, '');
      desc = desc ? desc.charAt(0).toUpperCase() + desc.slice(1) : (ingreso ? (libro === 'oficina' ? 'Cobro' : 'Ingreso') : 'Gasto');
      return { tipo: ingreso ? 'ingreso' : 'gasto', monto, titulo: desc, libro, categoria: categoriaDe(desc, libro, ingreso), fecha: fechaPlata };
    }
  }

  /* Evento o recordatorio: fecha y hora con el intérprete de siempre */
  const r = interpretar(t, Object.assign({}, opciones, { hoy: hoyD }));
  const fecha = r.algunDia ? null : (r.fecha || hoyD);
  if (RE_EVENTO.test(b) && (tieneFecha || tieneHora)) return { tipo: 'evento', titulo: r.titulo || t, fecha: r.fecha || hoyD, hora: r.hora, area: r.area, repetir };
  return { tipo: 'recordatorio', titulo: r.titulo || t, fecha, hora: r.hora, area: r.area, prioridad: r.prioridad, plazoLegal: r.plazoLegal, etiquetas: r.etiquetas, algunDia: r.algunDia, repetir };
}
