/* BUSCADOR (puro, se puede probar): encuentra tus cosas y lo que quieres
   hacer escribiendo como hablas («gasto», «luz», «examen de mate»).
   Sin tildes ni mayúsculas; todas las palabras tienen que aparecer. */

export const sinTildes = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function coincide(texto, q) {
  const t = sinTildes(texto), ps = sinTildes(q).split(/\s+/).filter(Boolean);
  if (!ps.length) return false;
  return ps.every((p) => t.includes(p) || (p.length > 4 && t.includes(p.replace(/(es|s)$/, ''))));
}

/* Dónde vive cada tipo: [área fija o null (la del elemento), herramienta] */
export const DONDE = {
  casa: ['personal', 'casa'], menu: ['personal', 'menu'], documento: ['personal', 'documentos'], prestamo: ['personal', 'prestamos'],
  curso: ['estudios', 'cursos'], ficha: ['estudios', 'fichas'],
  cobro: ['oficina', 'cobros'], horas: ['oficina', 'horas'], cliente: ['oficina', 'clientes'],
  entreno: ['deporte', 'entrenos'], rutina: ['deporte', 'rutinas'], medida: ['deporte', 'peso'],
  habito: [null, 'constancia'], meta: [null, 'constancia']
};

/* Texto en el que se busca: título, notas, etiquetas y los textos cortos de extra */
export function textoDe(x) {
  const ex = x.extra ? Object.values(x.extra).filter((v) => typeof v === 'string' && v.length < 300).join(' ') : '';
  return [x.titulo, x.notas, (x.etiquetas || []).join(' '), ex].join(' ');
}

const PESO = { pendiente: 0, evento: 1, nota: 2 };
export function buscarElementos(items, q, max = 40) {
  if (sinTildes(q).trim().length < 2) return [];
  return items.filter((x) => !x.borrado && x.tipo !== 'enfoque' && coincide(textoDe(x), q))
    .sort((a, b) => (coincide(a.titulo, q) ? 0 : 1) - (coincide(b.titulo, q) ? 0 : 1) || (PESO[a.tipo] ?? 9) - (PESO[b.tipo] ?? 9) || (b.actualizado || 0) - (a.actualizado || 0))
    .slice(0, max);
}
