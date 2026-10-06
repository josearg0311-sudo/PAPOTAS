/* MODELO DE DATOS v5: un solo formato para todo.
   Cada cosa (pendiente, evento, nota, pago, movimiento…) es un «elemento»:

   { id, tipo, area, titulo,
     prioridad: 'alta'|'media'|'baja', estado: 'pendiente'|'en_curso'|'hecho'|'cancelado',
     fechas: { inicio, fin, vence, hora, horaFin },   // 'AAAA-MM-DD' y 'HH:MM' (hora de Lima)
     todoElDia, etiquetas: [], plazoLegal, repetir, aviso, lista, notas,
     monto,                  // céntimos enteros (S/ 1,250.00 = 125000)
     extra: {…},             // valores propios del tipo, ya en formato nuevo
     creado, actualizado,    // milisegundos
     borrado,                // null o cuándo se borró (papelera 30 días)
     datos: {…},             // lo que vino de la v4.5 y el modelo no usa: intacto
     origen: { coleccion, id, indice, quitados } }   // de dónde vino (null si es nuevo)

   Tareas y recordatorios son «pendiente»; se agrupan en «lista». */

export const TIPOS = {
  pendiente: 'Pendiente', lista: 'Lista', evento: 'Evento', nota: 'Nota', habito: 'Hábito', meta: 'Meta',
  pago: 'Pago fijo', movimiento: 'Movimiento', diario: 'Diario', enfoque: 'Enfoque', curso: 'Curso',
  entreno: 'Entrenamiento', rutina: 'Rutina', medida: 'Medida', bienestar: 'Bienestar', cobro: 'Cobro',
  prestamo: 'Préstamo', horas: 'Horas', cliente: 'Cliente', casa: 'Casa', menu: 'Menú', documento: 'Documento',
  ficha: 'Ficha', revision: 'Revisión', otro: 'Otro'
};
export const TIPOS_PLURAL = {
  pendiente: 'Pendientes', lista: 'Listas', evento: 'Eventos', nota: 'Notas', habito: 'Hábitos', meta: 'Metas',
  pago: 'Pagos fijos', movimiento: 'Movimientos', diario: 'Días de diario', enfoque: 'Días de enfoque', curso: 'Cursos',
  entreno: 'Entrenamientos', rutina: 'Rutinas', medida: 'Medidas', bienestar: 'Bienestar', cobro: 'Cobros',
  prestamo: 'Préstamos', horas: 'Horas trabajadas', cliente: 'Clientes', casa: 'Tareas de casa', menu: 'Menús', documento: 'Documentos',
  ficha: 'Fichas de repaso', revision: 'Revisiones', otro: 'Otros'
};
export const ESTADOS = ['pendiente', 'en_curso', 'hecho', 'cancelado'];
export const PRIORIDADES = ['alta', 'media', 'baja'];

/* Listas que trae el sistema (no se pueden borrar) */
export const LISTA_RECORDATORIOS = 'lista_recordatorios';
export const LISTA_TAREAS = 'lista_tareas';

export function modeloVacio() {
  return {
    id: '', tipo: 'pendiente', area: 'personal', titulo: '',
    prioridad: 'baja', estado: 'pendiente',
    fechas: { inicio: null, fin: null, vence: null, hora: null, horaFin: null },
    todoElDia: false, etiquetas: [], plazoLegal: false, repetir: null, aviso: null, lista: null, notas: '',
    monto: null, extra: {}, creado: 0, actualizado: 0, borrado: null, datos: {}, origen: null
  };
}

export function nuevoId(prefijo = 'x') {
  return prefijo + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* Revisa un elemento que llega de fuera (un respaldo, otra versión):
   corrige lo que se puede y dice si es aceptable. Nunca inventa datos. */
export function normalizarElemento(x) {
  if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !x.id) return null;
  const it = Object.assign(modeloVacio(), x);
  if (!TIPOS[it.tipo]) it.tipo = 'otro';
  if (!PRIORIDADES.includes(it.prioridad)) it.prioridad = 'baja';
  if (!ESTADOS.includes(it.estado)) it.estado = 'pendiente';
  it.fechas = Object.assign(modeloVacio().fechas, x.fechas && typeof x.fechas === 'object' ? x.fechas : {});
  if (!Array.isArray(it.etiquetas)) it.etiquetas = [];
  if (!it.extra || typeof it.extra !== 'object') it.extra = {};
  if (!it.datos || typeof it.datos !== 'object') it.datos = {};
  it.titulo = String(it.titulo == null ? '' : it.titulo);
  it.notas = String(it.notas == null ? '' : it.notas);
  it.actualizado = +it.actualizado || 0;
  it.creado = +it.creado || 0;
  it.borrado = it.borrado ? +it.borrado : null;
  if (it.monto != null) it.monto = Math.round(+it.monto) || 0;
  return it;
}

/* El documento entero de la v5 (lo que se guarda en «agenda5_datos») */
export function docVacio(ahora = Date.now()) {
  return {
    v: 1, creado: ahora, perfil: { nombre: '', presupuesto: {}, antiguo: null },
    items: [
      Object.assign(modeloVacio(), { id: LISTA_RECORDATORIOS, tipo: 'lista', titulo: 'Recordatorios', creado: ahora, actualizado: 0, extra: { clase: 'recordatorios', sistema: true } }),
      Object.assign(modeloVacio(), { id: LISTA_TAREAS, tipo: 'lista', titulo: 'Tareas', creado: ahora, actualizado: 0, extra: { clase: 'recordatorios', sistema: true } })
    ],
    migracion: null
  };
}

export function normalizarDoc(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.items)) return null;
  const vistos = new Set(), items = [];
  d.items.forEach((x) => { const it = normalizarElemento(x); if (it && !vistos.has(it.id)) { vistos.add(it.id); items.push(it); } });
  return { v: 1, creado: +d.creado || Date.now(), perfil: Object.assign({ nombre: '', presupuesto: {}, antiguo: null }, d.perfil || {}), items, migracion: d.migracion || null };
}

/* Junta dos documentos elemento por elemento: gana el cambio más reciente.
   Un borrado es un cambio más (no resucita lo que se borró después). */
export function fusionar(a, b) {
  const m = new Map();
  a.items.forEach((x) => m.set(x.id, x));
  let nuevos = 0, actualizados = 0;
  b.items.forEach((x) => {
    const y = m.get(x.id);
    if (!y) { m.set(x.id, x); nuevos++; }
    else if ((x.actualizado || 0) > (y.actualizado || 0) || ((x.borrado || 0) > (y.borrado || 0) && (x.actualizado || 0) >= (y.actualizado || 0))) { m.set(x.id, x); actualizados++; }
  });
  const perfil = a.perfil && (a.perfil.nombre || a.perfil.antiguo) ? a.perfil : b.perfil;
  return { doc: Object.assign({}, a, { perfil, items: [...m.values()] }), nuevos, actualizados };
}
