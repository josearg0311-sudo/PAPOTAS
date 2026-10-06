/* ÁREAS: un panel por área de tu vida, cada una con su color. */
import { AREAS, area } from '../datos/areas.js';
import { ico, vacio, explica } from '../util/dom.js';
import { tarjeta, enFase } from './comun.js';
import { elementos } from '../datos/datos.js';
import { filaElemento } from './datos.js';
import { filaPendiente } from '../piezas/pendientes-ui.js';
import { ordenar } from '../datos/pendientes.js';

const pendientesDe = (id) => elementos((x) => x.area === id && x.tipo === 'pendiente' && x.estado !== 'hecho' && x.estado !== 'cancelado');
const deArea = (id) => elementos((x) => x.area === id && !(x.extra && x.extra.sistema));

const HERRAMIENTAS = {
  personal: ['Casa (tareas que se repiten)', 'Menú de la semana', 'Documentos y vencimientos', 'Cumpleaños', 'Préstamos'],
  estudios: ['Cursos y horario', 'Exámenes y sesiones de estudio', 'Notas del curso', 'Fichas de repaso'],
  oficina: ['Plazos legales', 'Clientes', 'Cobros', 'Horas trabajadas', 'Actas de reunión', 'Tablero de trabajo'],
  deporte: ['Entrenamientos y racha', 'Rutinas de gym y récords', 'Partidos', 'Peso y medidas']
};

function pct(id) { const t = elementos((x) => x.area === id && x.tipo === 'pendiente'); return t.length ? Math.round(t.filter((x) => x.estado === 'hecho').length / t.length * 100) : 0; }

export function vistaAreas() {
  return explica('<b>Tus 4 áreas de vida.</b> Cada una tiene su color, sus recordatorios, metas, hábitos y notas, y sus herramientas propias. Toca una para entrar.') +
    '<div class="areas">' + AREAS.map((a) =>
      '<a class="area-tarjeta area-' + a.id + '" href="#areas/' + a.id + '"><span class="ic">' + ico(a.icono) + '</span><b>' + a.nombre + '</b>' +
      '<span class="num">' + pendientesDe(a.id).length + ' pendientes · ' + deArea(a.id).length + ' cosas</span><span class="progreso"><i style="width:' + pct(a.id) + '%"></i></span><small>' + a.lema + '</small></a>').join('') + '</div>' +
    enFase(5, 'cada panel con todas sus herramientas. Tus datos ya están asignados a su área.');
}

function bloque(eti, titulo, a, filtro, siVacio) {
  const l = elementos((x) => x.area === a.id && filtro(x));
  return tarjeta({ eti, titulo, n: l.length, clase: 'area-' + a.id, cuerpo: l.length ? '<div class="filas-datos">' + l.slice(0, 6).map(filaElemento).join('') + '</div>' : siVacio });
}

export function vistaArea(id) {
  const a = area(id);
  return '<a class="btn volver" href="#areas">' + ico('i-izq') + 'Todas las áreas</a>' +
    '<div class="area-cab area-' + a.id + '"><span class="ic">' + ico(a.icono) + '</span><div><h2>' + a.nombre + '</h2><p>' + a.lema + '</p></div></div>' +
    '<div class="columnas"><div>' +
    tarjeta({ eti: 'RECORDATORIOS', titulo: 'Pendientes de ' + a.nombre, n: pendientesDe(a.id).length, clase: 'area-' + a.id, cuerpo: pendientesDe(a.id).length ? '<div class="pends">' + pendientesDe(a.id).sort(ordenar).slice(0, 8).map((x) => filaPendiente(x, { verLista: true })).join('') + '</div>' + (pendientesDe(a.id).length > 8 ? '<p class="pie-ajuste">Y ' + (pendientesDe(a.id).length - 8) + ' más en <a href="#recordatorios">Recordatorios</a>.</p>' : '') : vacio('Nada pendiente', 'Lo que agregues en ' + a.nombre + ' aparecerá aquí.') }) +
    bloque('METAS Y HÁBITOS', 'Constancia', a, (x) => x.tipo === 'meta' || x.tipo === 'habito', vacio('Sin metas ni hábitos aún', a.id === 'deporte' ? 'Tus entrenamientos contarán como hábito, con racha y aviso si pasan días sin entrenar.' : 'Ponte una meta o un hábito para esta área.')) +
    '</div><div>' +
    tarjeta({ eti: 'HERRAMIENTAS', titulo: 'Solo de ' + a.nombre, clase: 'area-' + a.id,
      cuerpo: '<ul class="herramientas">' + HERRAMIENTAS[a.id].map((h) => '<li>' + ico('i-check') + h + '</li>').join('') + '</ul>' }) +
    bloque('NOTAS', 'Notas de ' + a.nombre, a, (x) => x.tipo === 'nota', vacio('Sin notas', 'Las notas de esta área aparecerán aquí.')) +
    '</div></div>' + enFase(5, 'el panel completo de ' + a.nombre + ' con tus datos.');
}
