/* ÁREAS: un panel por área de tu vida, cada una con su color. */
import { AREAS, area } from '../datos/areas.js';
import { ico, vacio, explica } from '../util/dom.js';
import { tarjeta, enFase } from './comun.js';

const HERRAMIENTAS = {
  personal: ['Casa (tareas que se repiten)', 'Menú de la semana', 'Documentos y vencimientos', 'Cumpleaños', 'Préstamos'],
  estudios: ['Cursos y horario', 'Exámenes y sesiones de estudio', 'Notas del curso', 'Fichas de repaso'],
  oficina: ['Plazos legales', 'Clientes', 'Cobros', 'Horas trabajadas', 'Actas de reunión', 'Tablero de trabajo'],
  deporte: ['Entrenamientos y racha', 'Rutinas de gym y récords', 'Partidos', 'Peso y medidas']
};

export function vistaAreas() {
  return explica('<b>Tus 4 áreas de vida.</b> Cada una tiene su color, sus recordatorios, metas, hábitos y notas, y sus herramientas propias. Toca una para entrar.') +
    '<div class="areas">' + AREAS.map((a) =>
      '<a class="area-tarjeta area-' + a.id + '" href="#areas/' + a.id + '"><span class="ic">' + ico(a.icono) + '</span><b>' + a.nombre + '</b>' +
      '<span class="num">0 pendientes · 0 min de foco hoy</span><span class="progreso"><i style="width:0%"></i></span><small>' + a.lema + '</small></a>').join('') + '</div>' +
    enFase(5, 'cada panel con sus datos y herramientas. En la Fase 2 todo lo que ya tienes queda asignado a su área.');
}

export function vistaArea(id) {
  const a = area(id);
  return '<a class="btn volver" href="#areas">' + ico('i-izq') + 'Todas las áreas</a>' +
    '<div class="area-cab area-' + a.id + '"><span class="ic">' + ico(a.icono) + '</span><div><h2>' + a.nombre + '</h2><p>' + a.lema + '</p></div></div>' +
    '<div class="columnas"><div>' +
    tarjeta({ eti: 'RECORDATORIOS', titulo: 'Pendientes de ' + a.nombre, n: 0, clase: 'area-' + a.id, cuerpo: vacio('Nada pendiente', 'Lo que agregues en ' + a.nombre + ' aparecerá aquí.') }) +
    tarjeta({ eti: 'METAS Y HÁBITOS', titulo: 'Constancia', clase: 'area-' + a.id, cuerpo: vacio('Sin metas ni hábitos aún', a.id === 'deporte' ? 'Tus entrenamientos contarán como hábito, con racha y aviso si pasan días sin entrenar.' : 'Ponte una meta o un hábito para esta área.') }) +
    '</div><div>' +
    tarjeta({ eti: 'HERRAMIENTAS', titulo: 'Solo de ' + a.nombre, clase: 'area-' + a.id,
      cuerpo: '<ul class="herramientas">' + HERRAMIENTAS[a.id].map((h) => '<li>' + ico('i-check') + h + '</li>').join('') + '</ul>' }) +
    tarjeta({ eti: 'NOTAS', titulo: 'Notas de ' + a.nombre, clase: 'area-' + a.id, cuerpo: vacio('Sin notas', 'Las notas de esta área aparecerán aquí.') }) +
    '</div></div>' + enFase(5, 'el panel completo de ' + a.nombre + ' con tus datos.');
}
