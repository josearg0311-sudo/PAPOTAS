/* Las áreas de tu vida: las cuatro de siempre, con los colores de tus
   espacios de la v4.5. Desde Ajustes se les cambia nombre, lema, color e
   ícono (se guarda en el perfil y viaja por la nube). Cada área tiene su
   clase CSS «area-<id>», que define --a (color), --as (fondo) y --at (texto). */

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

/* Colores para elegir: [oscuro: color, fondo, texto] y [claro: …] (contraste revisado) */
export const COLORES = {
  azul: ['Azul', ['#5AA9FF', '#0B1E33', '#A9D1FF'], ['#1F6FEB', '#E3EEFF', '#144FB0']],
  turquesa: ['Turquesa', ['#2DD4BF', '#0A2925', '#8BEDE0'], ['#0F8F80', '#DDF5F1', '#0A665E']],
  pizarra: ['Gris pizarra', ['#94A3B8', '#1A1F27', '#CBD5E1'], ['#56606B', '#E9ECF0', '#3B434C']],
  verde: ['Verde', ['#4ADE80', '#0C2616', '#9EF0B8'], ['#1E8A4C', '#E2F4E9', '#146637']],
  morado: ['Morado', ['#A78BFA', '#1E1638', '#D4C6FF'], ['#6D3FD8', '#EEE8FF', '#5128A8']],
  naranja: ['Naranja', ['#FB923C', '#2E1A0A', '#FDC79A'], ['#C2560C', '#FDEBDD', '#8F3F08']],
  rosa: ['Rosa', ['#F472B6', '#2E0F20', '#F9B8D9'], ['#C0267A', '#FBE3EF', '#8E1A59']],
  ambar: ['Ámbar', ['#FBBF24', '#2B2008', '#FCDC86'], ['#A16207', '#FBF0D6', '#7A4A05']],
  rojo: ['Rojo', ['#F87171', '#2E1010', '#FCB4B4'], ['#C2302E', '#FBE3E3', '#902220']]
};
export const COLOR_ORIGINAL = { personal: 'azul', estudios: 'turquesa', oficina: 'pizarra', deporte: 'verde' };
export const ICONOS = [['i-casa', 'Casa'], ['i-birrete', 'Birrete'], ['i-maletin', 'Maletín'], ['i-pesa', 'Pesa'], ['i-nota', 'Nota'], ['i-fuego', 'Fuego'], ['i-meta', 'Meta'], ['i-dinero', 'Dinero'], ['i-agenda', 'Calendario'], ['i-bandera', 'Bandera'], ['i-campana', 'Campana'], ['i-escudo', 'Escudo']];
const ORIGINAL = AREAS.map((a) => Object.assign({}, a));

/* Aplica lo que elegiste (nombres en la app y colores en la hoja de estilos) */
let firmaAplicada = '';
export function aplicarAreas(conf) {
  const c = conf && typeof conf === 'object' ? conf : {}, f = JSON.stringify(c);
  if (f === firmaAplicada) return;
  firmaAplicada = f;
  AREAS.forEach((a, i) => {
    const o = ORIGINAL[i], x = c[a.id] || {};
    a.nombre = String(x.nombre || o.nombre).slice(0, 24); a.lema = String(x.lema || o.lema).slice(0, 60);
    a.icono = ICONOS.some((k) => k[0] === x.icono) ? x.icono : o.icono;
    a.color = COLORES[x.color] ? x.color : COLOR_ORIGINAL[a.id];
  });
  if (typeof document === 'undefined') return;
  let st = document.getElementById('estiloAreas');
  if (!st) { st = document.createElement('style'); st.id = 'estiloAreas'; document.head.appendChild(st); }
  const vars = (modo) => AREAS.filter((a) => a.color !== COLOR_ORIGINAL[a.id]).map((a) => { const [x, s2, t] = COLORES[a.color][modo]; return '--a-' + a.id + ':' + x + ';--a-' + a.id + '-s:' + s2 + ';--a-' + a.id + '-t:' + t + ';'; }).join('');
  const os = vars(1), cl = vars(2);
  st.textContent = os ? ':root{' + os + '}:root[data-tema="claro"]{' + cl + '}' : '';
}
