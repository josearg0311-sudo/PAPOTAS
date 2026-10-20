/* SECCIONES (Agenda 7): el programa ordenado por LO QUE HACES.
   Cinco lugares fijos —Hoy, Calendario, Tareas, Cuentas y Notas— más «Tú».
   Personal, Estudios, Oficina y Deporte ya no son pantallas: son un FILTRO
   que se elige arriba de cada sección (se recuerda en agenda5_filtro).
   Cada herramienta de los antiguos espacios vive en la sección que le toca
   (los cobros en Cuentas, los exámenes en Calendario, las fichas en Notas…)
   y lleva el color de su espacio. Las direcciones viejas (#areas/oficina/cobros,
   #plata, #listas…) siguen funcionando: se traducen con rutaNueva(). */
import { AREAS, area } from '../datos/areas.js';
import { filtro, ponerFiltro } from '../datos/filtro.js';
import { esc, ico } from '../util/dom.js';
import * as personal from './area-personal.js';
import * as estudios from './area-estudios.js';
import * as oficina from './area-oficina.js';
import * as deporte from './area-deporte.js';
import { vistaConstancia, TEMAS } from './area-constancia.js';
import { vistaHabitos } from './habitos.js';
import { vistaSeguimiento } from './seguimiento.js';
import { vistaFinanzas } from './finanzas.js';
import { vistaAgenda } from './agenda.js';

/* Se busca al usarla (no al cargar), así no importa el orden en que cargan los módulos */
const de = (mod, id) => (p) => mod.HERRAMIENTAS.find((h) => h.id === id).vista(p);

export { filtro, ponerFiltro, pasa } from '../datos/filtro.js';

/* ---------- Las secciones ---------- */
export const SECCIONES = {
  hoy: { nombre: 'Hoy', ico: 'i-hoy', sub: 'Lo que toca ahora, tus pendientes y tu horario de hoy' },
  calendario: { nombre: 'Calendario', ico: 'i-cal', sub: 'Todo lo que tiene fecha u hora: tu semana, tu día y tu mes' },
  tareas: { nombre: 'Tareas', ico: 'i-listas', sub: 'Lo que tienes que hacer y tus listas para marcar' },
  cuentas: { nombre: 'Cuentas', ico: 'i-dinero', sub: 'Tu plata personal y la de la oficina, siempre separadas' },
  notas: { nombre: 'Notas', ico: 'i-notas', sub: 'Tus apuntes, tu diario y tus fichas de repaso' },
  tu: { nombre: 'Tú', ico: 'i-estrella', sub: 'Tus hábitos, tu progreso y tus ajustes' }
};

/* ---------- Las herramientas, repartidas por sección ----------
   area '' = de todos los espacios (sale siempre); si no, solo sale con
   «Todo» o con su espacio elegido en el filtro. */
const H = [
  // Calendario
  { id: 'clases', sec: 'calendario', area: 'estudios', nombre: 'Clases y notas', ico: 'i-birrete', desc: 'Horario, notas, promedio y faltas', vista: de(estudios, 'cursos') },
  { id: 'examenes', sec: 'calendario', area: 'estudios', nombre: 'Exámenes', ico: 'i-diana', desc: 'Temas y plan de estudio hasta el día', vista: de(estudios, 'examenes') },
  { id: 'partidos', sec: 'calendario', area: 'deporte', nombre: 'Partidos', ico: 'i-balon', desc: 'Resultados y la cuota de la pichanga', vista: de(deporte, 'partidos') },
  { id: 'cumpleanos', sec: 'calendario', area: 'personal', nombre: 'Cumpleaños', ico: 'i-regalo', desc: 'Quién cumple y cuántos años', vista: de(personal, 'cumpleanos') },
  { id: 'documentos', sec: 'calendario', area: 'personal', nombre: 'Documentos que vencen', ico: 'i-recibo', desc: 'DNI, SOAT, brevete… con aviso', vista: de(personal, 'documentos') },
  { id: 'menu', sec: 'calendario', area: 'personal', nombre: 'Menú de la semana', ico: 'i-casa', desc: 'Qué cocinar cada día', vista: de(personal, 'menu') },
  { id: 'ano', sec: 'calendario', area: '', nombre: 'Año, lista e importar', ico: 'i-agenda', desc: 'Todo el año, los próximos 60 días y archivos .ics', vista: () => vistaAgenda() },
  // Tareas
  { id: 'plazos', sec: 'tareas', area: 'oficina', nombre: 'Plazos legales', ico: 'i-bandera', desc: 'Lo que vence en la oficina, primero lo legal', vista: de(oficina, 'plazos') },
  { id: 'tablero', sec: 'tareas', area: 'oficina', nombre: 'Tablero de la oficina', ico: 'i-tareas', desc: 'Por hacer, en curso y hecho; proyectos', vista: de(oficina, 'tablero') },
  { id: 'casa', sec: 'tareas', area: 'personal', nombre: 'Tareas de la casa', ico: 'i-casa', desc: 'Lo que toca cada cierto tiempo', vista: de(personal, 'casa') },
  // Cuentas
  { id: 'cobros', sec: 'cuentas', area: 'oficina', nombre: 'Cobros', ico: 'i-dinero', desc: 'Lo que te deben en la oficina', vista: de(oficina, 'cobros') },
  { id: 'horas', sec: 'cuentas', area: 'oficina', nombre: 'Horas trabajadas', ico: 'i-reloj', desc: 'Cronómetro, horas y tarifa', vista: de(oficina, 'horas') },
  { id: 'clientes', sec: 'cuentas', area: 'oficina', nombre: 'Clientes', ico: 'i-maletin', desc: 'Llamar, WhatsApp o correo', vista: de(oficina, 'clientes') },
  { id: 'prestamos', sec: 'cuentas', area: 'personal', nombre: 'Préstamos', ico: 'i-rep', desc: 'Lo que prestaste y lo que debes', vista: de(personal, 'prestamos') },
  { id: 'informe', sec: 'cuentas', area: '', nombre: 'Informe y detalle', ico: 'i-grafica', desc: 'Meses, categorías y gastos que se repiten', vista: (p) => vistaFinanzas(p === 'oficina' || filtro() === 'oficina' ? 'oficina' : '') },
  // Notas
  { id: 'diario', sec: 'notas', area: 'personal', nombre: 'Diario', ico: 'i-diario', desc: 'Cómo te fue hoy, agua y sueño', vista: de(personal, 'diario') },
  { id: 'fichas', sec: 'notas', area: 'estudios', nombre: 'Fichas de repaso', ico: 'i-copiar', desc: 'Pregunta y respuesta, repaso espaciado', vista: de(estudios, 'fichas') },
  { id: 'actas', sec: 'notas', area: 'oficina', nombre: 'Actas de reunión', ico: 'i-nota', desc: 'Acuerdos que se vuelven tareas', vista: de(oficina, 'actas') },
  // Tú
  { id: 'habitos', sec: 'tu', area: '', nombre: 'Hábitos', ico: 'i-habitos', desc: 'Lo que haces seguido, con tu racha', vista: () => vistaHabitos() },
  { id: 'metas', sec: 'tu', area: '', nombre: 'Metas', ico: 'i-meta', desc: 'Metas que se llenan solas con tus datos', vista: (p) => vistaMetas(p) },
  { id: 'entrenos', sec: 'tu', area: 'deporte', nombre: 'Entrenos y racha', ico: 'i-fuego', desc: 'Tu meta de la semana', vista: de(deporte, 'entrenos') },
  { id: 'rutinas', sec: 'tu', area: 'deporte', nombre: 'Rutinas y récords', ico: 'i-pesa', desc: 'Lo que entrenas y tus mejores marcas', vista: de(deporte, 'rutinas') },
  { id: 'peso', sec: 'tu', area: 'deporte', nombre: 'Peso', ico: 'i-grafica', desc: 'Tu peso en un gráfico e IMC', vista: de(deporte, 'peso') },
  { id: 'seguimiento', sec: 'tu', area: '', nombre: 'Cómo vas por espacio', ico: 'i-seg', desc: 'Tu tiempo y tus hábitos, espacio por espacio', vista: () => vistaSeguimiento('') },
  { id: 'revision', sec: 'tu', area: '', nombre: 'Revisión semanal', ico: 'i-repetir', desc: 'Cierra la semana en 5 pasos', vista: () => vistaSeguimiento('revision') }
];
export const HERRAMIENTAS = H;
export const herramienta = (sec, id) => H.find((h) => h.sec === sec && h.id === id) || null;
export const herramientasDe = (sec, f = filtro()) => H.filter((h) => h.sec === sec && (!h.area || !f || h.area === f));

/* Metas: las de un espacio, o elegir el espacio */
function vistaMetas(p) {
  const id = AREAS.some((a) => a.id === p) ? p : filtro();
  if (id) return '<nav class="seg6 seg-esp" aria-label="Espacio">' + AREAS.map((a) => '<a href="#tu/metas/' + a.id + '"' + (a.id === id ? ' aria-current="page"' : '') + '>' + esc(a.emoji) + ' ' + esc(a.nombre) + '</a>').join('') + '</nav>' + vistaConstancia(id);
  return '<div class="herr6">' + AREAS.map((a) => '<a class="herr6-btn area-' + a.id + '" href="#tu/metas/' + a.id + '"><span class="herr6-ico" aria-hidden="true">' + esc(a.emoji) + '</span><span><b>' + esc(TEMAS[a.id].tab) + '</b><small>' + esc(a.nombre) + '</small></span>' + ico('i-der') + '</a>').join('') + '</div>';
}

/* ---------- Barra de arriba de cada sección: filtro + herramientas ---------- */
export { barraFiltro } from './filtro-ui.js';
export function barraHerramientas(sec) {
  const l = herramientasDe(sec), f = filtro();
  if (!l.length) return '';
  return '<section class="herr6-sec" aria-label="Herramientas"><h2 class="seccion-t">También en ' + SECCIONES[sec].nombre + (f ? ' · ' + esc(area(f).nombre) : '') + '</h2><div class="herr6">' +
    l.map((h) => '<a class="herr6-btn' + (h.area ? ' area-' + h.area : '') + '" href="#' + sec + '/' + h.id + '"><span class="herr6-ico" aria-hidden="true">' + ico(h.ico) + '</span><span><b>' + esc(h.nombre) + '</b><small>' + esc(h.desc) + '</small></span>' + ico('i-der') + '</a>').join('') + '</div></section>';
}

/* Si la primera tarjeta se llama igual que la herramienta («Cobros» / «Cobros»), su título sobra */
const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
function sinTituloRepetido(html, nombre) {
  return html.replace(/<header class="t-cab">(?:<span class="eti">[^<]*<\/span>)?<h2>([^<]*)<\/h2>(?:<span class="n">[^<]*<\/span>)?<\/header>/, (m, t) =>
    norm(t) === norm(nombre) || norm(nombre).startsWith(norm(t)) ? '' : m);
}
/* Una herramienta a pantalla completa, con «‹ Sección» y de qué espacio es */
export function vistaHerramienta(sec, id, param) {
  const h = herramienta(sec, id); if (!h) return '';
  const a = h.area ? area(h.area) : null;
  return '<a class="volver-panel" href="#' + sec + '">' + ico('i-izq') + SECCIONES[sec].nombre + '</a>' +
    '<header class="pag-cab herr6-cab' + (a ? ' area-' + a.id : '') + '"><h1>' + esc(h.nombre) + '</h1><p>' + (a ? '<span class="chip area-' + a.id + '">' + esc(a.nombre) + '</span> ' : '') + esc(h.desc) + '</p></header>' +
    '<div class="herramienta">' + sinTituloRepetido(h.vista(param), h.nombre) + '</div>';
}

/* ---------- Tú: tu constancia, tu progreso y lo de la app ---------- */
export function vistaTu(nombre) {
  const grupo = (tit, l) => '<h2 class="seccion-t">' + tit + '</h2><div class="herr6">' + l.join('') + '</div>';
  const btn = (href, icono, t, d, ar) => '<a class="herr6-btn' + (ar ? ' area-' + ar : '') + '" href="' + href + '"><span class="herr6-ico" aria-hidden="true">' + ico(icono) + '</span><span><b>' + t + '</b><small>' + d + '</small></span>' + ico('i-der') + '</a>';
  const hs = (ids) => ids.map((id) => herramienta('tu', id)).filter(Boolean).map((h) => btn('#tu/' + h.id, h.ico, esc(h.nombre), esc(h.desc), h.area));
  return '<div class="tu6">' +
    grupo('Tu constancia', hs(['habitos', 'metas', 'revision', 'seguimiento'])) +
    grupo('Tu progreso deportivo', hs(['entrenos', 'rutinas', 'peso'])) +
    grupo('Tu agenda', [btn('#ajustes', 'i-ajustes', 'Ajustes y respaldo', 'PIN, respaldo, nube, tema y teclado'), btn('#papelera', 'i-basura', 'Papelera', 'Lo que borres se recupera durante 30 días'), btn('#datos', 'i-buscar', 'Tus datos', 'Todo lo que tienes guardado, también lo de la versión anterior')]) +
    '</div>';
}

/* ---------- Direcciones viejas → nuevas ----------
   Devuelve el hash nuevo (sin «#») o null si ya es nuevo. Puede elegir el
   filtro (p. ej. #areas/oficina → Hoy con Oficina elegido). */
const GENERICA = { pendientes: 'tareas', eventos: 'calendario', semana: 'calendario', notas: 'notas', dinero: 'cuentas' };
const VIEJA_HERR = { cursos: 'clases' };
export function rutaNueva(h) {
  const [s, p, q] = h.split('/');
  const conP = (sec) => sec + (p ? '/' + p : '');
  switch (s) {
    case 'plan': case 'agenda': case 'horario': return 'calendario';
    case 'listas': return conP('tareas');
    case 'recordatorios': return 'tareas/' + (p || 'todos');
    case 'plata': case 'dinero': return conP('cuentas');
    case 'finanzas': return 'cuentas/informe' + (p === 'oficina' ? '/oficina' : '');
    case 'habitos': return 'tu/habitos';
    case 'seguimiento': return p === 'revision' ? 'tu/revision' : 'tu/seguimiento';
    case 'mas': return 'tu';
    case 'areas': {
      const a = AREAS.find((x) => x.id === p);
      if (!a) return 'hoy';
      ponerFiltro(a.id);
      if (!q) return 'hoy';
      if (q === 'constancia') return 'tu/metas/' + a.id;
      if (GENERICA[q]) return GENERICA[q];
      const id = VIEJA_HERR[q] || q, hh = H.find((x) => x.id === id);
      return hh ? hh.sec + '/' + hh.id : 'hoy';
    }
    case 'notas': return p === 'diario' ? 'notas/diario' : null;
    default: return null;
  }
}
