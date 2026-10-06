/* MIGRACIÓN v4.5 → v5
   Convierte cada cosa guardada por la versión anterior al formato nuevo sin
   perder NADA: lo que el formato nuevo no usa se guarda tal cual en «datos»
   y en «origen» queda de dónde vino. Con eso se puede RECONSTRUIR el original
   exacto, y la verificación lo comprueba elemento por elemento: si un solo
   campo no cuadra, la migración se cancela.

   Funciones puras: no leen ni escriben el almacén (eso lo hace datos.js). */
import { esFecha, esHora } from '../util/fechas.js';
import { modeloVacio, LISTA_RECORDATORIOS, LISTA_TAREAS } from './modelo.js';

export const AREAS_IDS = ['personal', 'estudios', 'oficina', 'deporte'];

/* ---------- Área: la misma regla que usaba la v4.5 ---------- */
function sinTildes(s) {
  return String(s || '').toLowerCase().replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
}
export function areaDeTexto(t) {
  t = sinTildes(t || '');
  if (!t) return '';
  if (/^(estudio|estudios|uni|universidad|cole|colegio|clase|clases|curso|cursos|examen|tesis)$/.test(t)) return 'estudios';
  if (/^(oficina|trabajo|chamba|work|empresa|clientes?|negocio)$/.test(t)) return 'oficina';
  if (/^(deporte|deportes|gym|gimnasio|futbol|fulbito|pichanga|correr|entreno|ejercicio|salud)$/.test(t)) return 'deporte';
  if (/^(personal|casa|hogar|familia|dinero)$/.test(t)) return 'personal';
  return '';
}
function areaDe(x, porDefecto = 'personal') {
  if (x && AREAS_IDS.includes(x.esp)) return x.esp;
  return areaDeTexto(x && (x.area || x.cat || '')) || porDefecto;
}

const PRIO = { 3: 'alta', 2: 'media', 1: 'baja', 0: 'baja' };
const prioridad = (p) => PRIO[+p] || 'baja';
const fecha = (s) => (esFecha(s) ? s : null);
const hora = (s) => (esHora(s) ? s : null);
const rep = (r) => (r && r !== 'no' && typeof r === 'string' ? r : null);
const centimos = (v) => {
  if (typeof v === 'number' && isFinite(v)) return Math.round(v * 100);
  const s = String(v == null ? '' : v).replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  const n = /,\d{3}(\D|$)/.test(s) && !/\./.test(s) ? Number(s.replace(/,/g, '')) : Number(s.replace(/,/g, '.'));
  return isFinite(n) ? Math.round(n * 100) : 0;
};
const DEPORTES = { futbol: 'Fútbol', gym: 'Gym', correr: 'Correr', bici: 'Bici', nadar: 'Nadar', otro: 'Entrenamiento' };

/* ---------- Cómo se convierte cada colección ----------
   tit: campo que pasa a «titulo»; not: campo que pasa a «notas»;
   area: área por defecto si no tenía; fn: lo que se deduce para el modelo
   nuevo (fechas, estado…). Lo deducido NO borra el original de «datos». */
const COL = {
  tareas: { tipo: 'pendiente', tit: 't', not: 'notas', fn: (x) => ({
    prioridad: prioridad(x.prio), estado: x.hecha ? 'hecho' : x.estado === 'curso' ? 'en_curso' : 'pendiente',
    fechas: { inicio: fecha(x.fecha), hora: hora(x.hora) }, repetir: rep(x.rep), aviso: !!hora(x.hora),
    lista: x.proy ? 'proyectos_' + x.proy : LISTA_TAREAS, etiquetas: x.area && !areaDeTexto(x.area) ? [String(x.area)] : [],
    extra: { subtareas: Array.isArray(x.sub) ? x.sub : [] } }) },
  recordatorios: { tipo: 'pendiente', tit: 't', not: 'notas', fn: (x) => {
    const pos = typeof x.pospuesto === 'string' ? x.pospuesto.split('T') : null;
    return { estado: x.hecho ? 'hecho' : 'pendiente', fechas: { inicio: fecha(pos ? pos[0] : x.fecha), hora: hora(pos ? pos[1] : x.hora) || '09:00' },
      repetir: rep(x.rep), aviso: true, lista: LISTA_RECORDATORIOS };
  } },
  eventos: { tipo: 'evento', tit: 't', not: 'notas', fn: (x) => ({
    fechas: { inicio: fecha(x.fecha), fin: fecha(x.hasta), hora: x.todo ? null : hora(x.ini), horaFin: x.todo ? null : hora(x.fin) },
    todoElDia: !!x.todo || !hora(x.ini), repetir: x.cumple ? 'ano' : rep(x.rep), aviso: typeof x.aviso === 'number' && x.aviso >= 0 ? x.aviso : null,
    extra: { tipoEvento: x.cumple ? 'cumple' : (x.tipo || 'evento'), lugar: x.lugar || '' } }) },
  notas: { tipo: 'nota', tit: 't', not: 'cuerpo', fn: (x) => ({ extra: { fija: !!x.fija, color: x.color || '' } }) },
  listas: { tipo: 'lista', tit: 'nombre', fn: () => ({ extra: { clase: 'checklist' } }) },
  habitos: { tipo: 'habito', tit: 'nombre', fn: (x) => ({ fechas: { hora: hora(x.hora) }, extra: { dias: Array.isArray(x.dias) ? x.dias : [0, 1, 2, 3, 4, 5, 6], marcas: x.marcas && typeof x.marcas === 'object' ? x.marcas : {} } }) },
  metas: { tipo: 'meta', tit: 't', fn: (x) => ({ fechas: { vence: fecha(x.fecha) }, estado: +x.actual >= +x.objetivo && +x.objetivo > 0 ? 'hecho' : x.archivada ? 'cancelado' : 'pendiente', extra: { actual: +x.actual || 0, objetivo: +x.objetivo || 0, unidad: x.unidad || '' } }) },
  pagos: { tipo: 'pago', tit: 't', fn: (x) => ({ monto: centimos(x.monto), extra: { dia: Math.min(31, Math.max(1, +x.dia || 1)), pagados: x.pagados && typeof x.pagados === 'object' ? x.pagados : {}, activo: x.activo !== false } }) },
  diario: { tipo: 'diario', not: 'texto', titulo: (x) => 'Diario', fn: (x) => ({ fechas: { inicio: fecha(x.id) } }) },
  enfoque: { tipo: 'enfoque', titulo: () => 'Enfoque del día', fn: (x) => ({ fechas: { inicio: fecha(x.id) } }) },
  cursos: { tipo: 'curso', tit: 'nombre', area: 'estudios', fn: (x) => ({ fechas: { inicio: fecha(x.inicio), fin: fecha(x.fin) } }) },
  entrenos: { tipo: 'entreno', not: 'notas', area: 'deporte', titulo: (x) => DEPORTES[x.tipo] || 'Entrenamiento', fn: (x) => ({ estado: 'hecho', fechas: { inicio: fecha(x.fecha) }, extra: { minutos: +x.min || 0 } }) },
  rutinas: { tipo: 'rutina', tit: 'nombre', area: 'deporte' },
  medidas: { tipo: 'medida', area: 'deporte', titulo: () => 'Peso', fn: (x) => ({ fechas: { inicio: fecha(x.id) } }) },
  bienestar: { tipo: 'bienestar', titulo: () => 'Bienestar', fn: (x) => ({ fechas: { inicio: fecha(x.id) } }) },
  cobros: { tipo: 'cobro', area: 'oficina', titulo: (x) => [x.cliente, x.concepto].filter(Boolean).join(' · ') || 'Cobro', fn: (x) => ({ monto: centimos(x.monto), estado: x.cobrado ? 'hecho' : 'pendiente', fechas: { vence: fecha(x.vence) } }) },
  deudas: { tipo: 'prestamo', titulo: (x) => [x.persona, x.concepto].filter(Boolean).join(' · ') || 'Préstamo', fn: (x) => ({ monto: centimos(x.monto), estado: x.saldada ? 'hecho' : 'pendiente', fechas: { vence: fecha(x.fecha) }, extra: { meDeben: x.tipo === 'me' } }) },
  proyectos: { tipo: 'lista', tit: 'nombre', not: 'desc', idNuevo: (x) => 'proyectos_' + x.id, fn: (x) => ({ estado: x.estado === 'hecho' ? 'hecho' : 'pendiente', fechas: { vence: fecha(x.limite) }, extra: { clase: 'proyecto' } }) },
  horas: { tipo: 'horas', not: 'nota', area: 'oficina', titulo: (x) => x.cliente ? 'Horas · ' + x.cliente : 'Horas trabajadas', fn: (x) => ({ fechas: { inicio: fecha(x.fecha), hora: hora(x.ini) }, extra: { minutos: +x.min || 0 } }) },
  clientes: { tipo: 'cliente', tit: 'nombre', not: 'notas', area: 'oficina' },
  casa: { tipo: 'casa', tit: 't' },
  menu: { tipo: 'menu', titulo: () => 'Menú', fn: (x) => ({ fechas: { inicio: fecha(x.id) } }) },
  docs: { tipo: 'documento', tit: 't', not: 'notas', fn: (x) => ({ fechas: { vence: fecha(x.vence) } }) },
  fichas: { tipo: 'ficha', tit: 'q', area: 'estudios' },
  revisiones: { tipo: 'revision', titulo: () => 'Revisión semanal', fn: (x) => ({ fechas: { inicio: fecha(x.id) } }) }
};

function clon(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

/* Crea el elemento nuevo y anota en origen.quitados lo que se movió fuera
   de «datos» (para poder reconstruirlo) */
function elemento(col, x, indice, idNuevo, ahora, conf, extraOrigen) {
  const datos = clon(x), quitados = [];
  const it = Object.assign(modeloVacio(), { id: idNuevo, tipo: conf.tipo, origen: Object.assign({ coleccion: col, indice }, extraOrigen || {}) });
  if ('id' in datos) { it.origen.id = datos.id; delete datos.id; quitados.push('id'); }
  if (typeof datos.upd === 'number') { it.actualizado = datos.upd; delete datos.upd; quitados.push('upd'); }
  if (conf.tit && typeof datos[conf.tit] === 'string') { it.titulo = datos[conf.tit]; delete datos[conf.tit]; quitados.push(conf.tit + '>titulo'); }
  else it.titulo = conf.tit && datos[conf.tit] != null ? String(datos[conf.tit]) : (conf.titulo ? conf.titulo(x) : '');
  if (conf.not && typeof datos[conf.not] === 'string') { it.notas = datos[conf.not]; delete datos[conf.not]; quitados.push(conf.not + '>notas'); }
  it.area = areaDe(x, conf.area || 'personal');
  it.creado = +x.creada || +x.upd || ahora;
  if (!it.actualizado) it.actualizado = it.creado;
  if (x.del) it.borrado = +x.delEn || +x.upd || ahora;
  if (conf.fn) {
    const d = conf.fn(x);
    if (d.fechas) { it.fechas = Object.assign(it.fechas, d.fechas); delete d.fechas; }
    if (d.extra) { it.extra = Object.assign(it.extra, clon(d.extra)); delete d.extra; }
    Object.assign(it, d);
  }
  it.datos = datos;
  it.origen.quitados = quitados;
  return it;
}

/* ---------- Leer lo antiguo ---------- */
function parse(t) { try { return t == null ? null : JSON.parse(t); } catch (e) { return { __roto: String(t).slice(0, 200) }; } }
export function antiguoDesdeTextos(textos) {
  return {
    datos: parse(textos.agenda_datos_v1),
    libroPersonal: parse(textos.ledger_finanzas_simple_v1),
    libroOficina: parse(textos.ledger_oficina_v1)
  };
}
function movsDe(raw) { return Array.isArray(raw) ? raw : raw && Array.isArray(raw.transactions) ? raw.transactions : []; }

/* ---------- Migrar ---------- */
export function migrar(antiguo, ahora = Date.now()) {
  const doc = { v: 1, creado: ahora, perfil: { nombre: '', presupuesto: {}, antiguo: null }, items: [], migracion: null };
  const usados = new Set(), informe = { colecciones: {}, ignorados: { vacios: 0, purgados: 0, roto: false } };
  function idUnico(base) { let id = base, n = 2; while (usados.has(id)) id = base + '~' + n++; usados.add(id); return id; }

  const d = antiguo.datos && typeof antiguo.datos === 'object' && !antiguo.datos.__roto ? antiguo.datos : {};
  if (antiguo.datos && antiguo.datos.__roto) informe.ignorados.roto = true;

  if (d.perfil && typeof d.perfil === 'object') {
    doc.perfil.antiguo = clon(d.perfil);
    doc.perfil.nombre = String(d.perfil.nombre || '').slice(0, 40);
    if (d.perfil.presu) doc.perfil.presupuesto = { personal: centimos(d.perfil.presu.personal), oficina: centimos(d.perfil.presu.oficina) };
  }

  /* Listas que da el modelo nuevo (vacías si no hay nada que poner) */
  [[LISTA_RECORDATORIOS, 'Recordatorios'], [LISTA_TAREAS, 'Tareas']].forEach(([id, nom]) => {
    usados.add(id);
    /* actualizado 0: al juntar nunca pisan una lista del sistema que ya exista */
    doc.items.push(Object.assign(modeloVacio(), { id, tipo: 'lista', titulo: nom, area: 'personal', creado: ahora, actualizado: 0, extra: { clase: 'recordatorios', sistema: true } }));
  });

  Object.keys(d).forEach((col) => {
    if (col === 'perfil' || !Array.isArray(d[col])) return;
    const conf = COL[col] || { tipo: 'otro', titulo: () => col };
    const st = informe.colecciones[col] = { antes: 0, despues: 0 };
    d[col].forEach((x, i) => {
      if (!x || typeof x !== 'object') { informe.ignorados.vacios++; return; }
      if (x.purga) { informe.ignorados.purgados++; return; }
      st.antes++;
      const base = conf.idNuevo && x.id != null ? conf.idNuevo(x) : col + '_' + (x.id != null ? x.id : 'sinid' + i);
      const it = elemento(col, x, i, idUnico(base), ahora, conf);
      if (col === 'listas') {
        it.extra.clase = 'checklist';
        const items = Array.isArray(x.items) ? x.items : null;
        if (items) { delete it.datos.items; it.origen.quitados.push('items'); it.origen.itemsVacios = items.map((y, k) => (y && typeof y === 'object' ? null : k)).filter((k) => k !== null).map((k) => [k, items[k]]); }
        doc.items.push(it); st.despues++;
        (items || []).forEach((y, k) => {
          if (!y || typeof y !== 'object') return;
          const p = elemento('listas.items', y, k, idUnico(it.id + '_' + (y.id != null ? y.id : 'sinid' + k)), ahora, { tipo: 'pendiente', tit: 't' }, { lista: it.id });
          p.area = it.area; p.lista = it.id; p.estado = y.ok ? 'hecho' : 'pendiente';
          p.creado = it.creado; p.actualizado = it.actualizado;
          if (it.borrado) p.borrado = it.borrado;
          doc.items.push(p);
          const sti = informe.colecciones['listas.items'] = informe.colecciones['listas.items'] || { antes: 0, despues: 0 };
          sti.antes++; sti.despues++;
        });
        return;
      }
      doc.items.push(it); st.despues++;
    });
  });

  [['personal', antiguo.libroPersonal], ['oficina', antiguo.libroOficina]].forEach(([libro, raw]) => {
    if (raw == null) return;
    const col = 'libro.' + libro, st = informe.colecciones[col] = { antes: 0, despues: 0, formato: Array.isArray(raw) ? 'lista' : 'objeto' };
    if (raw.__roto) { informe.ignorados.roto = true; return; }
    if (!Array.isArray(raw)) { const resto = clon(raw); delete resto.transactions; if (Object.keys(resto).length) st.resto = resto; }
    movsDe(raw).forEach((x, i) => {
      if (!x || typeof x !== 'object') { informe.ignorados.vacios++; return; }
      st.antes++;
      const it = elemento(col, x, i, idUnico('mov_' + libro + '_' + (x.id != null ? x.id : 'sinid' + i)), ahora, { tipo: 'movimiento', tit: 'desc' });
      it.area = libro === 'oficina' ? 'oficina' : (areaDeTexto(x.cat) || 'personal');
      it.estado = 'hecho';
      it.monto = Math.abs(centimos(x.amount));
      it.fechas.inicio = fecha(x.date);
      it.extra = { libro, ingreso: x.type === 'Ingreso', categoria: x.cat ? String(x.cat).slice(0, 40) : '' };
      it.creado = 0; it.actualizado = 0;
      doc.items.push(it); st.despues++;
    });
  });

  doc.migracion = { fecha: ahora, desde: 'v4.5', informe };
  return doc;
}

/* ---------- Reconstruir el original desde el elemento nuevo ---------- */
export function reconstruir(it) {
  const x = clon(it.datos) || {};
  (it.origen.quitados || []).forEach((q) => {
    if (q === 'id') x.id = it.origen.id;
    else if (q === 'upd') x.upd = it.actualizado;
    else if (q.endsWith('>titulo')) x[q.split('>')[0]] = it.titulo;
    else if (q.endsWith('>notas')) x[q.split('>')[0]] = it.notas;
  });
  return x;
}

function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v === undefined ? null : v);
}
export const igualProfundo = (a, b) => canon(a) === canon(b);

/* ---------- Verificar: ¿se puede rehacer EXACTO lo antiguo? ---------- */
export function verificar(antiguo, doc) {
  const problemas = [], porCol = {};
  const d = antiguo.datos && typeof antiguo.datos === 'object' && !antiguo.datos.__roto ? antiguo.datos : {};
  const deCol = (c) => doc.items.filter((it) => it.origen && it.origen.coleccion === c).sort((a, b) => a.origen.indice - b.origen.indice);
  const ids = new Set();
  doc.items.forEach((it) => { if (ids.has(it.id)) problemas.push('id repetido en el formato nuevo: ' + it.id); ids.add(it.id); });

  Object.keys(d).forEach((col) => {
    if (col === 'perfil' || !Array.isArray(d[col])) return;
    const esperados = d[col].map((x, i) => [x, i]).filter(([x]) => x && typeof x === 'object' && !x.purga);
    const nuevos = deCol(col);
    porCol[col] = { antes: esperados.length, despues: nuevos.length, ok: true };
    if (esperados.length !== nuevos.length) { porCol[col].ok = false; problemas.push(col + ': había ' + esperados.length + ' y hay ' + nuevos.length); return; }
    esperados.forEach(([x, i], k) => {
      const it = nuevos[k];
      let rec = reconstruir(it);
      if (col === 'listas' && it.origen.quitados.includes('items')) {
        const hijos = doc.items.filter((y) => y.origen && y.origen.coleccion === 'listas.items' && y.origen.lista === it.id);
        const arr = [];
        hijos.forEach((h) => { arr[h.origen.indice] = reconstruir(h); });
        (it.origen.itemsVacios || []).forEach(([k2, v]) => { arr[k2] = v; });
        rec.items = arr;
      }
      if (it.origen.indice !== i || !igualProfundo(rec, x)) { porCol[col].ok = false; problemas.push(col + ' #' + i + ' (' + (x.id || 'sin id') + ') no se reconstruye igual'); }
    });
  });

  [['personal', antiguo.libroPersonal], ['oficina', antiguo.libroOficina]].forEach(([libro, raw]) => {
    if (raw == null || raw.__roto) return;
    const col = 'libro.' + libro;
    const esperados = movsDe(raw).map((x, i) => [x, i]).filter(([x]) => x && typeof x === 'object');
    const nuevos = deCol(col);
    porCol[col] = { antes: esperados.length, despues: nuevos.length, ok: esperados.length === nuevos.length };
    if (!porCol[col].ok) { problemas.push(col + ': había ' + esperados.length + ' y hay ' + nuevos.length); return; }
    esperados.forEach(([x], k) => { if (!igualProfundo(reconstruir(nuevos[k]), x)) { porCol[col].ok = false; problemas.push(col + ' #' + k + ' no se reconstruye igual'); } });
  });

  /* Ítems de las listas (cada uno se comprobó al reconstruir su lista) */
  if (Array.isArray(d.listas)) {
    const antes = d.listas.filter((l) => l && typeof l === 'object' && !l.purga && Array.isArray(l.items)).reduce((s, l) => s + l.items.filter((y) => y && typeof y === 'object').length, 0);
    const despues = doc.items.filter((y) => y.origen && y.origen.coleccion === 'listas.items').length;
    if (antes || despues) porCol['listas.items'] = { antes, despues, ok: antes === despues && (!porCol.listas || porCol.listas.ok) };
    if (antes !== despues) problemas.push('ítems de listas: había ' + antes + ' y hay ' + despues);
  }
  if (d.perfil && !igualProfundo(doc.perfil.antiguo, d.perfil)) problemas.push('el perfil no se reconstruye igual');
  return { ok: problemas.length === 0, porCol, problemas };
}
