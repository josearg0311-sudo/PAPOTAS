/* Las áreas de tu vida. En la Fase 8 se podrán editar (nombre, color,
   ícono) y agregar más desde Ajustes; por ahora son las cuatro de siempre,
   con los colores de tus espacios de la v4.5. Cada área tiene su clase CSS
   «area-<id>», que define --a (color), --as (fondo suave) y --at (texto). */

export const AREAS = [
  { id: 'personal', nombre: 'Personal', icono: 'i-casa', lema: 'Tu casa, tu gente y tus cosas' },
  { id: 'estudios', nombre: 'Estudios', icono: 'i-birrete', lema: 'Cursos, clases y exámenes' },
  { id: 'oficina', nombre: 'Oficina', icono: 'i-maletin', lema: 'Trabajo, plazos y clientes' },
  { id: 'deporte', nombre: 'Deporte', icono: 'i-pesa', lema: 'Entrenos, rachas y partidos' }
];

export function area(id) { return AREAS.find((a) => a.id === id) || AREAS[0]; }
export function chipArea(id) {
  const a = area(id);
  return '<span class="chip area-' + a.id + '">' + a.nombre + '</span>';
}
