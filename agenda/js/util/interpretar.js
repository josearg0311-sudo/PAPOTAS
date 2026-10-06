/* ENTENDER LO QUE ESCRIBES
   «Llamar al banco mañana a las 5» → «Llamar al banco», mañana, 17:00.
   Entiende: hoy, mañana, pasado mañana, lunes…domingo, «en 3 días», «en 2
   semanas», «15 de octubre», 15/10, 15/10/2026, «algún día»; horas «a las 5»,
   «5pm», «17:30», «9:15 de la mañana», «mediodía»; prioridad con ! (baja),
   !! (media), !!! (alta); área con #estudios/#oficina/#deporte/#personal (otras
   palabras con # son etiquetas); «plazo legal» o «legal» marca plazo legal.
   Busca sobre una copia sin tildes del MISMO largo, para recortar lo
   encontrado del texto original sin perder mayúsculas ni tildes. */
import { hoy as hoyLima, sumarDias, diaSemana, minutosAhora, esFecha } from './fechas.js';

const DIAS_N = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6 };
const MESES_N = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };
const AREAS = { personal: 'personal', casa: 'personal', estudios: 'estudios', estudio: 'estudios', uni: 'estudios', oficina: 'oficina', trabajo: 'oficina', chamba: 'oficina', deporte: 'deporte', gym: 'deporte', futbol: 'deporte' };
const PRIO = { 1: 'baja', 2: 'media', 3: 'alta' };

function sinTildes(s) {
  return s.toLowerCase().replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
}
const dos = (n) => (n < 10 ? '0' : '') + n;

export function interpretar(texto, opciones = {}) {
  const hoy = opciones.hoy || hoyLima();
  const ahoraMin = opciones.ahoraMin != null ? opciones.ahoraMin : minutosAhora();
  let orig = ' ' + String(texto || '') + ' ';
  let bajo = sinTildes(orig);
  let fecha = null, hora = null, prioridad = null, area = null, plazoLegal = false, algunDia = false, parte = '';
  const etiquetas = [];

  function cortar(m) {
    const i = m.index, n = m[0].length;
    orig = orig.slice(0, i) + ' '.repeat(n) + orig.slice(i + n);
    bajo = bajo.slice(0, i) + ' '.repeat(n) + bajo.slice(i + n);
  }
  function buscar(re) { const m = re.exec(bajo); if (m) cortar(m); return m; }
  function armarFecha(d, mes, an) {
    if (mes < 1 || mes > 12 || d < 1 || d > 31) return null;
    const y = an || +hoy.slice(0, 4);
    let f = y + '-' + dos(mes) + '-' + dos(d);
    if (!esFecha(f)) return null;
    if (!an && f < hoy) f = (y + 1) + '-' + dos(mes) + '-' + dos(d);
    return esFecha(f) ? f : null;
  }
  let m;

  if (buscar(/\s(?:con )?plazo legal(?=\s)/) || buscar(/\slegal(?=\s)/)) plazoLegal = true;
  if ((m = buscar(/\s(?:de la|por la|en la) (manana|tarde|noche)(?=\s)/))) parte = m[1];
  if (buscar(/\s(?:al )?mediodia(?=\s)/)) hora = '12:00';

  if (buscar(/\salgun dia(?=\s)/)) algunDia = true;
  else if (buscar(/\spasado manana(?=\s)/)) fecha = sumarDias(hoy, 2);
  else if (buscar(/\smanana(?=\s)/)) fecha = sumarDias(hoy, 1);
  else if (buscar(/\shoy(?=\s)/)) fecha = hoy;
  else if ((m = buscar(/\sen (\d{1,3}) (dia|dias|semana|semanas)(?=\s)/))) fecha = sumarDias(hoy, (m[2].startsWith('semana') ? 7 : 1) * +m[1]);
  else if (buscar(/\sen una semana(?=\s)/)) fecha = sumarDias(hoy, 7);
  else if ((m = buscar(/\s(?:el |este |esta |el proximo |proximo |la proxima )?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?=\s)/))) {
    const falta = (DIAS_N[m[1]] - diaSemana(hoy) + 7) % 7 || 7;
    fecha = sumarDias(hoy, falta);
  }
  else if ((m = buscar(/\s(?:el )?(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?: de(?:l)? (\d{4}))?(?=\s)/))) fecha = armarFecha(+m[1], MESES_N[m[2]], m[3] ? +m[3] : 0);
  else if ((m = buscar(/\s(?:el )?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s)/))) { let an = m[3] ? +m[3] : 0; if (an && an < 100) an += 2000; fecha = armarFecha(+m[1], +m[2], an); }

  function armarHora(h, mi, suf, adivinar) {
    suf = (suf || '').replace(/\./g, '').replace(/\s/g, '');
    if (h > 23 || mi > 59) return null;
    if (suf === 'pm' && h < 12) h += 12;
    else if (suf === 'am' && h === 12) h = 0;
    else if (!suf || suf[0] === 'h') {
      if (parte === 'tarde' || parte === 'noche') { if (h < 12) h += 12; }
      else if (parte !== 'manana' && adivinar && h >= 1 && h <= 7) h += 12;   // «a las 5» casi siempre es de la tarde
    }
    return dos(h) + ':' + dos(mi);
  }
  if (!hora) {
    if ((m = buscar(/\s(?:a las?|alas|sobre las) (\d{1,2})(?::(\d{2}))?\s?(am|pm|a\.\s?m\.|p\.\s?m\.|h|hs|hrs)?(?=\s)/))) hora = armarHora(+m[1], m[2] ? +m[2] : 0, m[3], true);
    else if ((m = buscar(/\s(\d{1,2}):(\d{2})\s?(am|pm|a\.\s?m\.|p\.\s?m\.|h|hs|hrs)?(?=\s)/))) hora = armarHora(+m[1], +m[2], m[3], false);
    else if ((m = buscar(/\s(\d{1,2})\s?(am|pm|a\.\s?m\.|p\.\s?m\.|hrs|hs|h)(?=\s)/))) hora = armarHora(+m[1], 0, m[2], false);
  }

  if ((m = buscar(/\s(!{1,3})(?=\s)/))) prioridad = PRIO[m[1].length];
  const reTag = /\s#([a-z0-9_]+)(?=\s)/;
  while ((m = reTag.exec(bajo))) {
    const palabra = orig.slice(m.index + 2, m.index + m[0].length).trim();
    if (!area && AREAS[m[1]]) area = AREAS[m[1]]; else etiquetas.push(palabra);
    cortar(m);
  }

  /* Solo la hora: hoy si aún no pasó; si ya pasó, mañana */
  if (hora && !fecha && !algunDia) {
    const [hh, mm] = hora.split(':').map(Number);
    fecha = hh * 60 + mm > ahoraMin ? hoy : sumarDias(hoy, 1);
  }
  /* Conectores sueltos («… mañana a», «el … lunes») solo se quitan si quedaron
     pegados a algo que se recortó (eso deja 2+ espacios); si son parte real
     del texto («aparato A», «La reunión») se respetan */
  let titulo = orig.replace(/\s(el|la|a|para|de|en|y|con|las)\s{2,}$/i, ' ').replace(/^\s{2,}(el|la|para)\s/i, ' ').replace(/^\s(el|la|para)\s{2,}/i, ' ').replace(/\s+/g, ' ').trim();
  if (titulo) titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  return { titulo, fecha, hora, prioridad, area, etiquetas, plazoLegal, algunDia };
}
