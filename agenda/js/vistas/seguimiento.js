/* SEGUIMIENTO: el panorama de la semana, SIEMPRE separado por área (cada
   una con su color, sus indicadores y un enlace de vuelta a su panel), y
   la revisión semanal guiada, un paso por área.
   Direcciones: #seguimiento y #seguimiento/revision */
import { AREAS } from '../datos/areas.js';
import { elementos, buscarElemento } from '../datos/datos.js';
import { preferencias, minutosVigilia } from '../datos/preferencias.js';
import { bloquesDelDia, minutosPorArea } from '../datos/calendario.js';
import { mover, hechoEn, ordenar, restaurarVersion } from '../datos/pendientes.js';
import { LISTA_TAREAS } from '../datos/modelo.js';
import { marcasHabito, tocaHabito, diasDeSemana, descuidadas, semanaARevisar } from '../datos/seguimiento.js';
import { hoy, sumarDias, inicioSemana, fmtCorta } from '../util/fechas.js';
import { esc, ico, plural, explica } from '../util/dom.js';
import { tarjeta } from './comun.js';
import { cifra, cifras, cambiarExtra, nuevo } from './area-comun.js';
import { habitosDe, metasDe, avanceMeta, TEMAS } from './area-constancia.js';
import { aviso } from '../piezas/aviso.js';
import * as personal from './area-personal.js';
import * as estudios from './area-estudios.js';
import * as oficina from './area-oficina.js';
import * as deporte from './area-deporte.js';

const PANELES = { personal, estudios, oficina, deporte };
const SOBRECARGA = 0.85;
const ui = { sem: 0, paso: 0, semRev: '' };
const hh = (m) => (m < 60 ? Math.round(m) + ' min' : Math.floor(m / 60) + ' h' + (Math.round(m % 60) ? ' ' + Math.round(m % 60) : ''));
const fechaMs = (ms) => (+ms > 0 ? hoy(new Date(+ms)) : '');
const iniActual = () => inicioSemana(hoy(), preferencias().semanaLunes);

/* ---------- Números de una semana, por área ---------- */
export function datosSemana(ini) {
  const dias = diasDeSemana(ini), fin = dias[6], h = hoy(), vig = minutosVigilia(), porArea = {}, cargas = [];
  AREAS.forEach((a) => { porArea[a.id] = { min: 0, foco: 0, hechos: 0, pend: 0, habitosToca: 0, habitosHechos: 0 }; });
  dias.forEach((d) => {
    const m = minutosPorArea(bloquesDelDia(d));
    AREAS.forEach((a) => { porArea[a.id].min += m[a.id] || 0; });
    if (m.total / vig > SOBRECARGA) cargas.push({ dia: d, pct: Math.round(m.total / vig * 100) });
    const e = buscarElemento('enfoque_' + d) || elementos((x) => x.tipo === 'enfoque' && x.fechas.inicio === d)[0];
    if (e) { const ma = e.extra.minutosArea || (e.datos && e.datos.pomosEsp ? Object.fromEntries(Object.entries(e.datos.pomosEsp).map(([k, v]) => [k, v * 25])) : {}); AREAS.forEach((a) => { porArea[a.id].foco += +ma[a.id] || 0; }); }
  });
  elementos((x) => x.tipo === 'pendiente' && porArea[x.area]).forEach((x) => {
    const f = fechaMs(hechoEn(x)), hist = (x.extra.historial || []).filter((d) => d >= ini && d <= fin).length;
    if (x.estado === 'hecho' && f >= ini && f <= fin) porArea[x.area].hechos++;
    porArea[x.area].hechos += hist;
    if (x.estado !== 'hecho' && x.estado !== 'cancelado' && x.fechas.inicio && x.fechas.inicio <= fin) porArea[x.area].pend++;
  });
  elementos((x) => x.tipo === 'habito' && porArea[x.area]).forEach((x) => {
    const m = marcasHabito(x);
    dias.filter((d) => d <= h && tocaHabito(x, d)).forEach((d) => { porArea[x.area].habitosToca++; if (m[d]) porArea[x.area].habitosHechos++; });
  });
  return { ini, fin, dias, porArea, cargas, descuidadas: fin <= h || ini <= h ? descuidadas(porArea) : [] };
}
const pctHab = (v) => (v.habitosToca ? Math.round(v.habitosHechos / v.habitosToca * 100) : null);

function navSemana(ini, acc) {
  const fin = sumarDias(ini, 6), act = iniActual();
  return '<div class="cal-nav"><button type="button" class="icono-btn" data-acc="' + acc + '" data-n="-1" aria-label="Semana anterior">' + ico('i-izq') + '</button>' +
    '<b>' + (ini === act ? 'Esta semana' : ini === sumarDias(act, -7) ? 'Semana pasada' : fmtCorta(ini) + ' – ' + fmtCorta(fin)) + '<small>' + fmtCorta(ini) + ' – ' + fmtCorta(fin) + '</small></b>' +
    '<button type="button" class="icono-btn" data-acc="' + acc + '" data-n="1" aria-label="Semana siguiente"' + (ini >= act ? ' disabled' : '') + '>' + ico('i-der') + '</button></div>';
}

/* ---------- Panorama ---------- */
function revisionDe(ini) { return elementos((x) => x.tipo === 'revision' && x.fechas.inicio === ini)[0] || null; }

function vistaPanorama() {
  const ini = sumarDias(iniActual(), ui.sem * 7), d = datosSemana(ini), maxMin = Math.max(60, ...AREAS.map((a) => d.porArea[a.id].min + d.porArea[a.id].foco));
  const rIni = semanaARevisar(hoy(), iniActual(), preferencias().semanaLunes), rev = revisionDe(rIni), hecha = rev && rev.extra && rev.extra.hecha;
  const revisiones = elementos((x) => x.tipo === 'revision').sort((a, b) => (b.fechas.inicio || '').localeCompare(a.fechas.inicio || ''));
  return explica('<b>Tu semana, área por área.</b> Cada área conserva lo suyo: aquí solo se juntan para mirarlas lado a lado. Toca un área para ir a su panel.') +
    tarjeta({ eti: 'REVISIÓN', titulo: hecha ? 'Revisión hecha ✓' : 'Revisión semanal', clase: 'revision-cta' + (hecha ? '' : ' pendiente'),
      guia: 'Una vez por semana: miras cada área con sus datos, pasas lo pendiente a la próxima semana y eliges tus 3 prioridades. Toma 5 minutos.',
      cuerpo: '<p class="texto-tarjeta">' + (hecha ? 'Ya revisaste la semana del ' + fmtCorta(rIni) + '. Puedes volver a verla o cambiarla.' : 'Toca revisar la semana del <b>' + fmtCorta(rIni) + ' al ' + fmtCorta(sumarDias(rIni, 6)) + '</b>.') + '</p>' +
        '<div class="pie-tarjeta"><a class="btn ' + (hecha ? '' : 'pri') + '" href="#seguimiento/revision" data-acc="rev-empezar" data-ini="' + rIni + '">' + ico('i-check') + (hecha ? 'Ver la revisión' : 'Empezar la revisión') + '</a></div>' }) +
    '<section class="tarjeta">' + navSemana(ini, 'seg-sem') +
      '<header class="t-cab"><span class="eti">BALANCE</span><h2>Tiempo por área</h2></header>' +
      '<div class="balance-semana">' + AREAS.map((a) => { const v = d.porArea[a.id], ph = pctHab(v);
        return '<a class="bs-fila area-' + a.id + '" href="#areas/' + a.id + '"><b>' + a.nombre + '</b>' +
          '<span class="bs-barra" role="img" aria-label="' + a.nombre + ': ' + hh(v.min) + ' planificadas y ' + hh(v.foco) + ' de foco"><i class="plan" style="width:' + (v.min / maxMin * 100).toFixed(1) + '%"></i><i class="foco" style="width:' + (v.foco / maxMin * 100).toFixed(1) + '%"></i></span>' +
          '<small>' + hh(v.min) + ' en agenda' + (v.foco ? ' · ' + hh(v.foco) + ' de foco' : '') + ' · ' + plural(v.hechos, 'hecho', 'hechos') + (ph != null ? ' · hábitos ' + ph + ' %' : '') + '</small></a>'; }).join('') + '</div>' +
      '<p class="leyenda-bs"><span><i class="plan"></i>en agenda (eventos, clases, recordatorios con hora)</span><span><i class="foco"></i>foco con Pomodoro</span></p>' +
      (d.descuidadas.length ? '<div class="nota-fase aviso-carga">' + ico('i-info') + '<span><b>Área descuidada:</b> ' + d.descuidadas.map((k) => AREAS.find((a) => a.id === k).nombre).join(', ') + ' no tuvo tiempo, foco ni nada hecho esta semana.</span></div>' : '') +
      (d.cargas.length ? '<div class="nota-fase aviso-carga">' + ico('i-info') + '<span><b>Días sobrecargados:</b> ' + d.cargas.map((c) => fmtCorta(c.dia) + ' (' + c.pct + ' %)').join(', ') + '. Más del ' + Math.round(SOBRECARGA * 100) + ' % de tus horas despierto.</span></div>' : '') +
    '</section>' +
    '<div class="areas-seg">' + AREAS.map((a) => {
      const v = d.porArea[a.id], hs = habitosDe(a.id), ms = metasDe(a.id).map((m) => ({ m, p: avanceMeta(m) })).sort((x, y) => x.p.logrado - y.p.logrado).slice(0, 3), ph = pctHab(v);
      return tarjeta({ eti: a.nombre.toUpperCase(), titulo: TEMAS[a.id].pulso, clase: 'area-' + a.id,
        cuerpo: PANELES[a.id].pulso() +
          '<div class="seg-mini">' + (hs.length ? '<p><b>' + plural(hs.length, 'hábito', 'hábitos') + '</b>' + (ph != null ? ' · ' + ph + ' % cumplido esta semana' : '') + '</p>' : '<p class="tenue">Sin hábitos en ' + a.nombre + '.</p>') +
            (ms.length ? ms.map(({ m, p }) => '<div class="meta-mini"><span>' + esc((m.extra.em || (m.datos && m.datos.em) || '🎯') + ' ' + m.titulo) + '</span><span class="progreso"><i style="width:' + p.pct + '%"></i></span><b class="mono">' + p.pct + ' %</b></div>').join('') : '<p class="tenue">Sin metas en ' + a.nombre + '.</p>') + '</div>' +
          '<div class="pie-tarjeta"><a class="btn" href="#areas/' + a.id + '/constancia">' + ico('i-meta') + TEMAS[a.id].tab + '</a><a class="btn" href="#areas/' + a.id + '">Ir a ' + a.nombre + ico('i-der') + '</a></div>' });
    }).join('') + '</div>' +
    (revisiones.length ? tarjeta({ eti: 'HISTORIAL', titulo: 'Revisiones anteriores', n: revisiones.length,
      cuerpo: '<div class="hfs">' + revisiones.slice(0, 8).map((r) => { const ex = r.extra || {}, txt = (ex.respuestas && (ex.respuestas.bien || ex.respuestas.mejorar)) || Object.values(r.datos || {}).filter((v) => typeof v === 'string' && v && !/^\d{4}-/.test(v)).join(' · ');
        return '<div class="hf"><a class="hf-txt" href="#seguimiento/revision" data-acc="rev-empezar" data-ini="' + esc(r.fechas.inicio || '') + '"><b>Semana del ' + (r.fechas.inicio ? fmtCorta(r.fechas.inicio) : '—') + (ex.hecha ? ' ✓' : '') + '</b><small>' + esc(txt.slice(0, 120) || 'Sin notas') + '</small></a></div>'; }).join('') + '</div>' }) : '');
}

/* ---------- Revisión semanal guiada ---------- */
const PASOS = ['semana', ...AREAS.map((a) => a.id), 'cierre'];
function revisionPara(ini) {
  return revisionDe(ini) || nuevo('revision', 'personal', { id: 'revision_' + ini, titulo: 'Revisión semanal', fechas: { inicio: ini, fin: sumarDias(ini, 6) }, extra: { respuestas: {}, hecha: false } });
}
function pendientesArea(idArea, fin) {
  return elementos((x) => x.tipo === 'pendiente' && x.area === idArea && x.estado !== 'hecho' && x.estado !== 'cancelado' && x.fechas.inicio && x.fechas.inicio <= fin).sort(ordenar);
}
function vistaRevision() {
  const ini = ui.semRev || semanaARevisar(hoy(), iniActual(), preferencias().semanaLunes), fin = sumarDias(ini, 6), d = datosSemana(ini);
  const r = revisionDe(ini), resp = (r && r.extra.respuestas) || {}, paso = PASOS[ui.paso], lunesProx = sumarDias(ini, 7);
  const puntos = '<ol class="pasos-rev">' + PASOS.map((p, i) => { const a = AREAS.find((x) => x.id === p);
    return '<li class="' + (a ? 'area-' + a.id : '') + (i === ui.paso ? ' actual' : i < ui.paso ? ' hecho' : '') + '"><button type="button" data-acc="rev-ir" data-n="' + i + '" aria-label="Paso ' + (i + 1) + ': ' + (a ? a.nombre : p === 'semana' ? 'Tu semana' : 'Cierre') + '"' + (i === ui.paso ? ' aria-current="step"' : '') + '>' + (a ? a.nombre : p === 'semana' ? 'Semana' : 'Cierre') + '</button></li>'; }).join('') + '</ol>';
  let cuerpo = '';
  if (paso === 'semana') {
    const tot = AREAS.reduce((s, a) => s + d.porArea[a.id].hechos, 0);
    cuerpo = tarjeta({ eti: 'PASO 1', titulo: 'Tu semana en números', guia: 'Primero, lo que pasó. Luego revisas cada área con lo suyo.',
      cuerpo: cifras([cifra(tot, tot === 1 ? 'cosa hecha' : 'cosas hechas', 'ok'), cifra(hh(AREAS.reduce((s, a) => s + d.porArea[a.id].min, 0)), 'en agenda'), cifra(hh(AREAS.reduce((s, a) => s + d.porArea[a.id].foco, 0)), 'de foco')]) +
        '<div class="balance-semana">' + AREAS.map((a) => { const v = d.porArea[a.id]; return '<div class="bs-fila area-' + a.id + '"><b>' + a.nombre + '</b><small>' + plural(v.hechos, 'hecho', 'hechos') + ' · ' + plural(v.pend, 'pendiente', 'pendientes') + (pctHab(v) != null ? ' · hábitos ' + pctHab(v) + ' %' : '') + '</small></div>'; }).join('') + '</div>' +
        (d.descuidadas.length ? '<div class="nota-fase aviso-carga">' + ico('i-info') + '<span><b>Descuidaste:</b> ' + d.descuidadas.map((k) => AREAS.find((a) => a.id === k).nombre).join(', ') + '. Piensa en algo pequeño para la próxima semana.</span></div>' : '') });
  } else if (paso === 'cierre') {
    const pr = (r && r.extra.prioridades) || [];
    cuerpo = tarjeta({ eti: 'CIERRE', titulo: 'Para la próxima semana', guia: 'Lo que aprendiste y solo 3 prioridades. Cada prioridad se vuelve un recordatorio para el lunes, en su área.',
      cuerpo: '<div class="form rev-form"><label class="campo"><span>¿Qué salió bien?</span><textarea class="entrada" id="revBien" maxlength="1000">' + esc(resp.bien || '') + '</textarea></label>' +
        '<label class="campo"><span>¿Qué harías distinto?</span><textarea class="entrada" id="revMejorar" maxlength="1000">' + esc(resp.mejorar || '') + '</textarea></label>' +
        '<div class="campo"><span>Tus 3 prioridades (en su área)</span>' + [0, 1, 2].map((i) => { const p = pr[i] || {};
          return '<div class="prio-rev"><input class="entrada" id="revPr' + i + '" maxlength="120" value="' + esc(p.t || '') + '" placeholder="Prioridad ' + (i + 1) + '"' + (p.id ? ' disabled' : '') + '><select class="entrada" id="revPrA' + i + '"' + (p.id ? ' disabled' : '') + '>' + AREAS.map((a) => '<option value="' + a.id + '"' + ((p.area || 'personal') === a.id ? ' selected' : '') + '>' + a.nombre + '</option>').join('') + '</select></div>'; }).join('') + '</div></div>' });
  } else {
    const a = AREAS.find((x) => x.id === paso), s = PANELES[a.id].semana(ini, fin), pend = pendientesArea(a.id, fin);
    cuerpo = tarjeta({ eti: 'PASO ' + (ui.paso + 1), titulo: a.nombre, clase: 'area-' + a.id + ' rev-area', guia: 'Lo de ' + a.nombre + ' esta semana, con sus propios datos.',
      cuerpo: cifras(s.cifras.map((c) => cifra(c[0], c[1], c[2]))) +
        (s.notas.length ? '<ul class="rev-notas">' + s.notas.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') +
        (pend.length ? '<div class="grupo-tit"><span>Quedó pendiente</span><span class="linea"></span><span class="mono">' + pend.length + '</span></div><div class="hfs">' + pend.slice(0, 8).map((x) => '<div class="hf"><div class="hf-txt"><b>' + esc(x.titulo) + '</b><small>' + fmtCorta(x.fechas.inicio) + (x.plazoLegal ? ' <span class="pill legal">PLAZO LEGAL</span>' : '') + '</small></div><span class="hf-fin"><button type="button" class="mini-btn" data-acc="rev-pasar" data-id="' + esc(x.id) + '" data-f="' + lunesProx + '">Al ' + fmtCorta(lunesProx) + '</button></span></div>').join('') + '</div>' +
          '<div class="pie-tarjeta"><button type="button" class="btn" data-acc="rev-pasar-todo" data-area="' + a.id + '" data-f="' + lunesProx + '">Pasar todo al ' + fmtCorta(lunesProx) + '</button></div>' : '<p class="texto-tarjeta txt-ok">✓ Nada pendiente en ' + a.nombre + '.</p>') +
        '<div class="form rev-form"><label class="campo"><span>' + esc(s.pregunta) + '</span><textarea class="entrada" id="revTxt" data-area="' + a.id + '" maxlength="1000">' + esc(resp[a.id] || '') + '</textarea></label></div>' });
  }
  return '<a class="btn volver" href="#seguimiento">' + ico('i-izq') + 'Seguimiento</a>' +
    '<section class="tarjeta">' + navSemana(ini, 'rev-sem') + puntos + '</section>' + cuerpo +
    '<div class="fila-botones rev-nav">' + (ui.paso > 0 ? '<button type="button" class="btn" data-acc="rev-ir" data-n="' + (ui.paso - 1) + '">' + ico('i-izq') + 'Atrás</button>' : '') +
      (ui.paso < PASOS.length - 1 ? '<button type="button" class="btn pri" data-acc="rev-ir" data-n="' + (ui.paso + 1) + '">Siguiente' + ico('i-der') + '</button>' : '<button type="button" class="btn pri" data-acc="rev-terminar">' + ico('i-check') + 'Terminar la revisión</button>') + '</div>';
}

/* Guarda lo escrito en el paso actual antes de cambiar de paso */
function guardarPaso() {
  const ini = ui.semRev || semanaARevisar(hoy(), iniActual(), preferencias().semanaLunes);
  const t = document.getElementById('revTxt'), b = document.getElementById('revBien'), m = document.getElementById('revMejorar');
  if (!t && !b) return;
  const r = revisionPara(ini), resp = Object.assign({}, r.extra.respuestas || {});
  if (t) resp[t.dataset.area] = t.value.trim();
  if (b) { resp.bien = b.value.trim(); resp.mejorar = m.value.trim(); }
  const extra = { respuestas: resp };
  if (b) {
    const viejas = r.extra.prioridades || [];
    extra.prioridades = [0, 1, 2].map((i) => viejas[i] && viejas[i].id ? viejas[i] : { t: (document.getElementById('revPr' + i).value || '').trim(), area: document.getElementById('revPrA' + i).value }).filter((p) => p.t);
  }
  cambiarExtra(r.id, extra);
}

export function vistaSeguimiento(param) { return param === 'revision' ? vistaRevision() : vistaPanorama(); }

export const acciones = {
  'seg-sem'(b) { ui.sem = Math.min(0, ui.sem + +b.dataset.n); return true; },
  'rev-empezar'(b) { ui.semRev = b.dataset.ini || ''; ui.paso = 0; },
  'rev-sem'(b) { guardarPaso(); const ini = ui.semRev || semanaARevisar(hoy(), iniActual(), preferencias().semanaLunes); ui.semRev = sumarDias(ini, 7 * +b.dataset.n) > iniActual() ? iniActual() : sumarDias(ini, 7 * +b.dataset.n); return true; },
  'rev-ir'(b) { guardarPaso(); ui.paso = Math.max(0, Math.min(PASOS.length - 1, +b.dataset.n)); window.scrollTo(0, 0); return true; },
  'rev-pasar'(b, ev, rp) {
    guardarPaso();
    const x = buscarElemento(b.dataset.id), r = mover(b.dataset.id, b.dataset.f, x.fechas.hora); rp();
    aviso('Pasado al ' + fmtCorta(b.dataset.f), () => { if (r) restaurarVersion(r.antes); rp(); });
  },
  'rev-pasar-todo'(b, ev, rp) {
    guardarPaso();
    const ini = ui.semRev || semanaARevisar(hoy(), iniActual(), preferencias().semanaLunes), l = pendientesArea(b.dataset.area, sumarDias(ini, 6));
    const antes = l.map((x) => mover(x.id, b.dataset.f, x.fechas.hora)).filter(Boolean); rp();
    aviso(plural(antes.length, 'pendiente pasado', 'pendientes pasados') + ' al ' + fmtCorta(b.dataset.f), () => { antes.forEach((r) => restaurarVersion(r.antes)); rp(); });
  },
  'rev-terminar'(b, ev, rp) {
    guardarPaso();
    const ini = ui.semRev || semanaARevisar(hoy(), iniActual(), preferencias().semanaLunes), r = revisionPara(ini), lunesProx = sumarDias(ini, 7) < hoy() ? hoy() : sumarDias(ini, 7);
    let creadas = 0;
    const pr = (r.extra.prioridades || []).map((p) => { if (p.id || !p.t) return p; creadas++;
      return Object.assign({}, p, { id: nuevo('pendiente', p.area, { titulo: p.t, prioridad: 'alta', lista: LISTA_TAREAS, fechas: { inicio: lunesProx }, extra: { revision: r.id } }).id }); });
    const d = datosSemana(ini);
    cambiarExtra(r.id, { hecha: true, hechaEn: Date.now(), prioridades: pr, resumen: d.porArea });
    ui.paso = 0; location.hash = '#seguimiento';
    aviso('✓ Revisión terminada' + (creadas ? ' · ' + plural(creadas, 'prioridad creada', 'prioridades creadas') + ' para ' + (lunesProx === hoy() ? 'hoy' : 'el ' + fmtCorta(lunesProx)) : ''));
  }
};
