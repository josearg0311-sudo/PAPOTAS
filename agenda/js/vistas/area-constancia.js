/* HÁBITOS Y METAS DE CADA ÁREA. Cada área conserva su temática: su nombre,
   sus ideas de hábitos y metas, y metas que se llenan solas con los datos
   de esa misma área (km en Deporte, horas de estudio en Estudios, soles
   cobrados en Oficina…). Seguimiento solo los junta para mirarlos. */
import { elementos, buscarElemento } from '../datos/datos.js';
import { preferencias } from '../datos/preferencias.js';
import { AREAS, area } from '../datos/areas.js';
import { val, lista, promedio, tendenciaPeso, ordenDias } from '../datos/herramientas.js';
import { diasHabito, marcasHabito, tocaHabito, rachaHabito, cumplimiento, semanaHabito, progresoMeta, ritmoMeta, sumaDesde } from '../datos/seguimiento.js';
import { hoy, fmtCorta, fmtHora, inicioSemana, DIAS3, esHora } from '../util/fechas.js';
import { fmtSoles, aCentimos } from '../util/dinero.js';
import { esc, vacio, plural } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { fila, filas, casilla, mini, pildora, cambiarExtra, nuevo, borrar, boton, pie } from './area-comun.js';
import { editar } from '../piezas/formulario.js';
import { aviso } from '../piezas/aviso.js';

const TODOS = [0, 1, 2, 3, 4, 5, 6], LAB = [1, 2, 3, 4, 5];
const finDeMes = (h) => { const [y, m] = h.split('-').map(Number); return h.slice(0, 8) + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0'); };

/* La temática de cada área */
export const TEMAS = {
  personal: { pulso: 'Tu casa y tu gente', tab: 'Hábitos y metas', titulo: 'Tus hábitos personales', guia: 'Lo que te hace bien a ti, a tu casa y a tu gente. Marca cada día lo que cumpliste.',
    habitos: [['💧', 'Tomar 2 litros de agua', TODOS], ['💰', 'Anotar mis gastos', TODOS], ['📵', 'Dejar el celular antes de dormir', TODOS], ['📞', 'Llamar a la familia', [0]]],
    metas: [{ em: '💰', t: 'Ahorrar para un viaje', objetivo: 2000, unidad: 'soles' }, { em: '📖', t: 'Leer 12 libros este año', objetivo: 12, unidad: 'libros' }],
    autos: [['', 'La avanzo yo']] },
  estudios: { pulso: 'Tus estudios hoy', tab: 'Hábitos de estudio', titulo: 'Tus hábitos de estudio', guia: 'La constancia gana exámenes. Las metas de horas se llenan solas con tu Pomodoro en Estudios.',
    habitos: [['📚', 'Leer 20 minutos', LAB], ['🃏', 'Repasar mis fichas', TODOS], ['✍️', 'Pasar en limpio la clase', LAB]],
    metas: [{ em: '⏱️', t: 'Estudiar 30 horas este mes', objetivo: 30, unidad: 'horas', auto: 'estudio', mes: true }, { em: '🎓', t: 'Promedio de 15 este ciclo', objetivo: 15, unidad: 'de promedio', auto: 'promedio' }],
    autos: [['', 'La avanzo yo'], ['estudio', 'Horas de foco en Estudios (Pomodoro)'], ['promedio', 'Mi promedio general de cursos']] },
  oficina: { pulso: 'Tu oficina hoy', tab: 'Hábitos de trabajo', titulo: 'Tus hábitos de trabajo', guia: 'Rutinas que te ordenan la oficina. Las metas de cobros y horas se llenan solas con tus registros.',
    habitos: [['📥', 'Revisar plazos y correo al empezar', LAB], ['⏱️', 'Registrar mis horas', LAB], ['🗂️', 'Ordenar pendientes del viernes', [5]]],
    metas: [{ em: '💼', t: 'Cobrar S/ 5,000 este mes', objetivo: 5000, unidad: 'soles', auto: 'cobrado', mes: true }, { em: '⏱️', t: '80 horas facturables este mes', objetivo: 80, unidad: 'horas', auto: 'horas', mes: true }],
    autos: [['', 'La avanzo yo'], ['cobrado', 'Soles cobrados (Cobros)'], ['horas', 'Horas trabajadas (Horas)']] },
  deporte: { pulso: 'Tu cuerpo en movimiento', tab: 'Metas y hábitos', titulo: 'Tus hábitos de deporte', guia: 'Tus entrenos ya cuentan como hábito (en «Entrenos y racha»). Aquí van los complementos y tus metas, que se llenan solas con tus entrenos y tu peso.',
    habitos: [['🧘', 'Estirar 10 minutos', TODOS], ['😴', 'Dormir 7 horas', TODOS], ['💧', 'Tomar 2 litros de agua', TODOS]],
    metas: [{ em: '🏃', t: 'Correr 50 km este mes', objetivo: 50, unidad: 'km', auto: 'km', mes: true }, { em: '🏋️', t: 'Entrenar 12 veces este mes', objetivo: 12, unidad: 'entrenos', auto: 'entrenos', mes: true }, { em: '⚖️', t: 'Llegar a 72 kg', objetivo: 72, unidad: 'kg', auto: 'peso' }],
    autos: [['', 'La avanzo yo'], ['km', 'Km de mis entrenos'], ['entrenos', 'Número de entrenos'], ['peso', 'Mi peso (meta para bajar)']] }
};

/* ---------- Hábitos ---------- */
export const habitosDe = (idArea) => elementos((x) => x.tipo === 'habito' && (!idArea || x.area === idArea)).sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
const creadoDe = (x) => (x.creado ? hoy(new Date(x.creado)) : '');
export function habitosDeHoy() { const h = hoy(); return habitosDe('').filter((x) => tocaHabito(x, h)); }
export function marcarHabito(id) {
  const x = buscarElemento(id), h = hoy(), m = Object.assign({}, marcasHabito(x));
  const on = !m[h]; if (on) m[h] = 1; else delete m[h];
  cambiarExtra(id, { marcas: m });
  return on;
}
const puntos = (estado) => '<span class="puntos-sem" aria-hidden="true">' + estado.map((e) => '<i class="' + e + '"></i>').join('') + '</span>';
function filaHabito(x) {
  const h = hoy(), ok = !!marcasHabito(x)[h], toca = tocaHabito(x, h), r = rachaHabito(x, h), c = cumplimiento(x, h, 30, creadoDe(x));
  const ds = diasHabito(x), diasTxt = ds.length === 7 ? 'todos los días' : ordenDias(preferencias().semanaLunes).filter((d) => ds.includes(d)).map((d) => DIAS3[d]).join(', ');
  return fila({ inicio: toca ? casilla(ok, 'hab-marcar', x.id, (ok ? 'Desmarcar: ' : 'Hecho hoy: ') + x.titulo) : '<span class="hf-em" title="Hoy no toca">' + esc(val(x, 'em', '⭐')) + '</span>',
    titulo: (toca ? val(x, 'em', '⭐') + ' ' : '') + x.titulo, acc: 'hab-editar', id: x.id, clase: ok ? 'hecho-hoy' : '',
    meta: (r ? '<span class="pill racha">🔥 ' + r + '</span> ' : '') + (c != null ? c + ' % en 30 días · ' : '') + esc(diasTxt) + (esHora(x.fechas.hora) ? ' · ⏰ ' + fmtHora(x.fechas.hora, preferencias().formatoHora) : '') +
      (toca ? '' : ' · <i>hoy no toca</i>') + puntos(semanaHabito(x, inicioSemana(h, preferencias().semanaLunes), h)) });
}
function editarHabito(id, idArea, repintar, pre = null) {
  const x = id ? buscarElemento(id) : null, orden = ordenDias(preferencias().semanaLunes);
  editar({ titulo: x ? 'Hábito' : 'Nuevo hábito', campos: [
    { n: 'em', t: 'texto', etq: 'Emoji', v: x ? val(x, 'em', '⭐') : (pre && pre[0]) || '⭐', max: 4, mitad: true },
    { n: 'titulo', t: 'texto', etq: 'Hábito', v: x ? x.titulo : (pre && pre[1]) || '', req: true, max: 60, ph: 'Ej. Caminar 30 minutos', mitad: true },
    { n: 'dias', t: 'multi', etq: 'Qué días', v: (x ? diasHabito(x) : (pre && pre[2]) || TODOS).map(String), ops: orden.map((d) => [String(d), DIAS3[d].replace(/^./, (c) => c.toUpperCase())]) },
    { n: 'hora', t: 'hora', etq: 'Avisarme a las (opcional)', v: x ? x.fechas.hora : '' },
    { n: 'area', t: 'botones', etq: 'Área', v: x ? x.area : idArea, ops: AREAS.map((a) => [a.id, a.nombre]) }],
  alGuardar: (v) => {
    const dias = v.dias.map(Number).sort(), fechas = Object.assign({}, x ? x.fechas : {}, { hora: esHora(v.hora) ? v.hora : null });
    if (!dias.length) { aviso('Elige al menos un día'); return false; }
    if (x) cambiarExtra(id, { em: v.em || '⭐', dias }, { titulo: v.titulo, area: v.area, fechas });
    else nuevo('habito', v.area, { titulo: v.titulo, fechas, extra: { em: v.em || '⭐', dias, marcas: {} } });
    repintar(); aviso(x ? 'Hábito guardado' : 'Hábito creado · márcalo cada día que lo cumplas');
  }, alBorrar: x ? () => borrar(id, repintar) : null });
}

/* ---------- Metas ---------- */
export const metasDe = (idArea) => elementos((x) => x.tipo === 'meta' && x.estado !== 'cancelado' && (!idArea || x.area === idArea));
const fechaDeMs = (ms) => (+ms > 0 ? hoy(new Date(+ms)) : '');
/* Los registros de cada área para las metas automáticas */
function registros(auto) {
  switch (auto) {
    case 'km': return elementos((x) => x.tipo === 'entreno').map((e) => ({ fecha: e.fechas.inicio, valor: +String(val(e, 'km', 0) || 0).replace(',', '.') || 0 }));
    case 'entrenos': return elementos((x) => x.tipo === 'entreno').map((e) => ({ fecha: e.fechas.inicio, valor: 1 }));
    case 'estudio': return elementos((x) => x.tipo === 'enfoque').map((e) => ({ fecha: e.fechas.inicio, valor: ((e.extra.minutosArea && e.extra.minutosArea.estudios) || (!e.extra.minutosArea && e.datos && e.datos.pomosEsp && e.datos.pomosEsp.estudios * 25) || 0) / 60 }));
    case 'horas': return elementos((x) => x.tipo === 'horas').map((h) => ({ fecha: h.fechas.inicio, valor: (+val(h, 'minutos', 0) || 0) / 60 }));
    case 'cobrado': return elementos((x) => x.tipo === 'cobro' && x.estado === 'hecho').map((c) => ({ fecha: fechaDeMs(val(c, 'cobradoEn', 0) || (c.datos && c.datos.cobrado)) || c.fechas.vence, valor: (+c.monto || 0) / 100 }));
    default: return [];
  }
}
export function avanceMeta(m) {
  const auto = val(m, 'auto', ''), desde = val(m, 'desde', '') || creadoDe(m), obj = +val(m, 'objetivo', 0) || 0;
  if (auto === 'promedio') {
    const ps = elementos((x) => x.tipo === 'curso').map((c) => promedio(lista(c, 'evaluaciones', 'notas'))).filter((p) => p != null);
    return progresoMeta({ actual: ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length * 10) / 10 : 0, objetivo: obj });
  }
  if (auto === 'peso') {
    const t = tendenciaPeso(elementos((x) => x.tipo === 'medida'), hoy());
    const ini = +val(m, 'inicial', 0) || (t ? t.puntos.filter((p) => p.f >= desde)[0] || t.puntos[t.puntos.length - 1] : { p: 0 }).p;
    return Object.assign(progresoMeta({ actual: t ? t.ultimo : ini, objetivo: obj, inicial: ini, baja: true }), { baja: true, inicial: ini });
  }
  if (auto) return progresoMeta({ actual: Math.round(sumaDesde(registros(auto), desde) * 10) / 10, objetivo: obj });
  return progresoMeta({ actual: +val(m, 'actual', 0) || 0, objetivo: obj });
}
const conUnidad = (n, u) => (/^soles?$/i.test(u || '') ? fmtSoles(aCentimos(n)) : (Math.round(n * 10) / 10).toLocaleString('es-PE') + (u ? ' ' + esc(u) : ''));
function filaMeta(m) {
  const p = avanceMeta(m), u = val(m, 'unidad', ''), auto = val(m, 'auto', ''), r = ritmoMeta(p, m.fechas.vence, hoy(), !!p.baja);
  const ritmo = p.logrado ? '<span class="pill nota aprueba">🏆 lograda</span>' : r ? (r.vencida ? pildora('vencido', 'venció ' + fmtCorta(m.fechas.vence)) : '<span class="pill">faltan ' + conUnidad(r.falta, u) + ' · ≈ ' + conUnidad(r.porSemana, u) + '/semana</span>') : '';
  return fila({ inicio: '<span class="hf-em">' + esc(val(m, 'em', '🎯')) + '</span>', titulo: m.titulo, acc: 'meta-editar', id: m.id,
    meta: '<span class="progreso"><i style="width:' + p.pct + '%"></i></span> <b class="mono">' + p.pct + ' %</b> · ' + conUnidad(p.actual, u) + ' de ' + conUnidad(p.objetivo, u) + ' ' + ritmo +
      (auto ? ' <span class="pill auto">se llena sola</span>' : '') + (m.fechas.vence && !p.logrado && !(r && r.vencida) ? ' <span class="pill">hasta ' + fmtCorta(m.fechas.vence) + '</span>' : ''),
    final: auto || p.logrado ? '' : mini('+ Sumar', 'meta-sumar', m.id, '', 'Sumar avance a ' + m.titulo), clase: p.logrado ? 'lograda' : '' });
}
function editarMeta(id, idArea, repintar, pre = null) {
  const m = id ? buscarElemento(id) : null, tema = TEMAS[m ? m.area : idArea] || TEMAS.personal, h = hoy();
  editar({ titulo: m ? 'Meta' : 'Nueva meta', campos: [
    { n: 'em', t: 'texto', etq: 'Emoji', v: m ? val(m, 'em', '🎯') : (pre && pre.em) || '🎯', max: 4, mitad: true },
    { n: 'titulo', t: 'texto', etq: 'Qué quieres lograr', v: m ? m.titulo : (pre && pre.t) || '', req: true, max: 80, mitad: true },
    { n: 'auto', t: 'sel', etq: 'Cómo avanza', v: m ? val(m, 'auto', '') : (pre && pre.auto) || '', ops: tema.autos },
    { n: 'actual', t: 'dec', etq: 'Llevo (si la avanzas tú)', v: m ? val(m, 'actual', 0) : 0, mitad: true },
    { n: 'objetivo', t: 'dec', etq: 'Objetivo', v: m ? val(m, 'objetivo', '') : (pre && pre.objetivo) || '', req: true, mitad: true },
    { n: 'unidad', t: 'texto', etq: 'Unidad', v: m ? val(m, 'unidad', '') : (pre && pre.unidad) || '', max: 16, ph: 'soles, km, libros…', mitad: true },
    { n: 'vence', t: 'fecha', etq: 'Fecha límite (opcional)', v: m ? m.fechas.vence : pre && pre.mes ? finDeMes(h) : '', mitad: true },
    { n: 'desde', t: 'fecha', etq: 'Contar desde (metas que se llenan solas)', v: m ? val(m, 'desde', '') || creadoDe(m) : pre && pre.mes ? h.slice(0, 8) + '01' : h }],
  alGuardar: (v) => {
    if (!(+v.objetivo > 0)) { aviso('Pon un objetivo mayor que cero'); return false; }
    const extra = { em: v.em || '🎯', auto: v.auto, actual: +v.actual || 0, objetivo: +v.objetivo, unidad: v.unidad, desde: v.desde || h };
    if (v.auto === 'peso' && !(m && val(m, 'inicial', 0))) { const t = tendenciaPeso(elementos((x) => x.tipo === 'medida'), h); extra.inicial = t ? t.ultimo : 0; }
    const fechas = Object.assign({}, m ? m.fechas : {}, { vence: v.vence || null });
    if (m) cambiarExtra(id, extra, { titulo: v.titulo, fechas }); else nuevo('meta', idArea, { titulo: v.titulo, fechas, extra });
    repintar(); aviso(m ? 'Meta guardada' : '🎯 Meta creada');
  }, alBorrar: m ? () => borrar(id, repintar) : null });
}
function sumarMeta(id, repintar) {
  const m = buscarElemento(id), u = val(m, 'unidad', '');
  editar({ titulo: 'Sumar a «' + m.titulo + '»', textoGuardar: 'Sumar', campos: [{ n: 'cant', t: 'dec', etq: 'Cuánto avanzaste' + (u ? ' (' + u + ')' : ''), v: '', req: true, ph: 'Ej. 1' }],
    alGuardar: (v) => {
      const n = +v.cant; if (!n) return false;
      const antes = avanceMeta(m), act = Math.max(0, Math.round(((+val(m, 'actual', 0) || 0) + n) * 100) / 100);
      cambiarExtra(id, { actual: act });
      const ahora = avanceMeta(buscarElemento(id)); repintar();
      aviso(!antes.logrado && ahora.logrado ? '🏆 ¡Meta lograda! ' + m.titulo : '+' + conUnidad(n, u) + ' · vas en ' + ahora.pct + ' %', () => { cambiarExtra(id, { actual: antes.actual }); repintar(); });
    } });
}

/* ---------- La pestaña de cada área ---------- */
export function vistaConstancia(idArea) {
  const t = TEMAS[idArea], a = area(idArea), hs = habitosDe(idArea), ms = metasDe(idArea), h = hoy();
  const tocan = hs.filter((x) => tocaHabito(x, h)), hechos = tocan.filter((x) => marcasHabito(x)[h]).length;
  const nombres = new Set(hs.map((x) => x.titulo.toLowerCase())), ideasH = t.habitos.filter((x) => !nombres.has(x[1].toLowerCase()));
  const titM = new Set(ms.map((x) => x.titulo.toLowerCase())), ideasM = t.metas.filter((x) => !titM.has(x.t.toLowerCase()));
  return tarjeta({ eti: 'HÁBITOS', titulo: t.titulo, n: tocan.length ? hechos + '/' + tocan.length + ' hoy' : null, clase: 'area-' + a.id, guia: t.guia,
    cuerpo: (hs.length ? filas(hs.map(filaHabito)) : vacio('Sin hábitos de ' + a.nombre, 'Empieza con una idea de abajo o crea el tuyo.')) +
      (ideasH.length ? '<div class="ideas"><small>Ideas para ' + a.nombre + ':</small>' + ideasH.map((x, i) => '<button type="button" class="mini-btn" data-acc="hab-idea" data-area="' + a.id + '" data-i="' + t.habitos.indexOf(x) + '">+ ' + esc(x[0] + ' ' + x[1]) + '</button>').join('') + '</div>' : '') +
      pie(boton('Nuevo hábito', 'hab-nuevo', '', ' data-area="' + a.id + '"')) }) +
    tarjeta({ eti: 'METAS', titulo: 'Metas de ' + a.nombre, n: ms.length || null, clase: 'area-' + a.id,
      guia: 'Cada meta con su avance y cuánto te falta por semana para llegar a tiempo. Las que dicen <b>«se llena sola»</b> toman los datos de ' + a.nombre + '.',
      cuerpo: (ms.length ? filas(ms.sort((x, y) => avanceMeta(x).logrado - avanceMeta(y).logrado).map(filaMeta)) : vacio('Sin metas de ' + a.nombre, 'Ponte una meta con fecha: te diré cuánto avanzar cada semana.')) +
        (ideasM.length ? '<div class="ideas"><small>Ideas:</small>' + ideasM.map((x) => '<button type="button" class="mini-btn" data-acc="meta-idea" data-area="' + a.id + '" data-i="' + t.metas.indexOf(x) + '">+ ' + esc(x.em + ' ' + x.t) + '</button>').join('') + '</div>' : '') +
        pie(boton('Nueva meta', 'meta-nueva', '', ' data-area="' + a.id + '"')) });
}
/* Señales de constancia de un área (para su Resumen) */
export function senalesConstancia(idArea) {
  const h = hoy(), s = [], tocan = habitosDe(idArea).filter((x) => tocaHabito(x, h)), faltan = tocan.filter((x) => !marcasHabito(x)[h]);
  if (faltan.length) s.push({ nivel: 'ok', txt: plural(faltan.length, 'hábito', 'hábitos') + ' por marcar hoy: ' + faltan.slice(0, 2).map((x) => x.titulo).join(', ') + (faltan.length > 2 ? '…' : ''), ir: 'constancia' });
  metasDe(idArea).forEach((m) => { const p = avanceMeta(m), r = ritmoMeta(p, m.fechas.vence, h, !!p.baja);
    if (r && r.vencida) s.push({ nivel: 'vencido', txt: '🎯 ' + m.titulo + ': venció en ' + p.pct + ' %', ir: 'constancia' });
    else if (r && r.dias <= 7) s.push({ nivel: 'pronto', txt: '🎯 ' + m.titulo + ': ' + p.pct + ' % y quedan ' + plural(r.dias, 'día', 'días'), ir: 'constancia' }); });
  return s;
}

export const acciones = {
  'hab-marcar'(b, ev, rp) {
    const on = marcarHabito(b.dataset.id), x = buscarElemento(b.dataset.id); rp();
    if (on) { const r = rachaHabito(x, hoy()); aviso('✓ ' + x.titulo + (r > 1 ? ' · 🔥 ' + r + ' seguidos' : ''), () => { marcarHabito(x.id); rp(); }); }
  },
  'hab-nuevo'(b, ev, rp) { editarHabito(null, b.dataset.area, rp); },
  'hab-editar'(b, ev, rp) { editarHabito(b.dataset.id, null, rp); },
  'hab-idea'(b, ev, rp) {
    const [em, t, dias] = TEMAS[b.dataset.area].habitos[+b.dataset.i];
    const x = nuevo('habito', b.dataset.area, { titulo: t, extra: { em, dias, marcas: {} } }); rp();
    aviso('Hábito agregado: ' + t, () => { borrar(x.id, rp); });
  },
  'meta-nueva'(b, ev, rp) { editarMeta(null, b.dataset.area, rp); },
  'meta-idea'(b, ev, rp) { editarMeta(null, b.dataset.area, rp, TEMAS[b.dataset.area].metas[+b.dataset.i]); },
  'meta-editar'(b, ev, rp) { editarMeta(b.dataset.id, null, rp); },
  'meta-sumar'(b, ev, rp) { sumarMeta(b.dataset.id, rp); }
};
