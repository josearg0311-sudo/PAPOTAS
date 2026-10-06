/* Pruebas automáticas de la Agenda. Se abren en pruebas/index.html (o las
   corre Playwright). Cada fase suma las suyas; nunca se borra una prueba. */
import * as F from '../js/util/fechas.js';
import * as D from '../js/util/dinero.js';
import { escribir, CLAVES, ANTIGUAS, resumenAntiguo } from '../js/datos/almacen.js';
import { normalizarPref, minutosVigilia } from '../js/datos/preferencias.js';
import { hashPIN } from '../js/piezas/candado.js';
import { migrar, verificar, reconstruir, antiguoDesdeTextos, igualProfundo } from '../js/datos/migracion.js';
import { fusionar, normalizarDoc } from '../js/datos/modelo.js';
import { analizarArchivo } from '../js/datos/respaldo.js';
import { interpretar } from '../js/util/interpretar.js';
import { grupo, siguiente, ordenar } from '../js/datos/pendientes.js';
import { ocurre, minutosPorArea } from '../js/datos/calendario.js';
import { modeloVacio } from '../js/datos/modelo.js';
import { feriado, pascua } from '../js/datos/feriados.js';
import { textoICS, enlaceGoogle } from '../js/util/ics.js';
import { diaDePago } from '../js/datos/calendario.js';
import * as HR from '../js/datos/herramientas.js';

const resultados = [];
function prueba(nombre, fn) {
  try { const r = fn(); if (r && r.then) return r.then(() => resultados.push([nombre, true]), (e) => resultados.push([nombre, false, String(e && e.message || e)])); resultados.push([nombre, true]); }
  catch (e) { resultados.push([nombre, false, String(e && e.message || e)]); }
  return Promise.resolve();
}
function igual(a, b, msj = '') { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(msj + ' esperaba ' + JSON.stringify(b) + ' y salió ' + JSON.stringify(a)); }

const tareas = [];

/* ---------- Fechas (hora de Lima) ---------- */
tareas.push(prueba('Lima: 00:30 UTC del 6/10 todavía es 5/10 en Lima', () => igual(F.hoy(new Date('2026-10-06T00:30:00Z')), '2026-10-05')));
tareas.push(prueba('Lima: 05:00 UTC del 6/10 ya es 6/10 a las 00:00', () => { igual(F.hoy(new Date('2026-10-06T05:00:00Z')), '2026-10-06'); igual(F.horaAhora(new Date('2026-10-06T05:00:00Z')), '00:00'); }));
tareas.push(prueba('Formato dd/mm/aaaa', () => igual(F.fmtFecha('2026-10-05'), '05/10/2026')));
tareas.push(prueba('Formato «lun 5 oct»', () => igual(F.fmtCorta('2026-10-05', false), 'lun 5 oct')));
tareas.push(prueba('Setiembre se abrevia «set»', () => igual(F.fmtCorta('2026-09-14', false), 'lun 14 set')));
tareas.push(prueba('Formato largo', () => igual(F.fmtLarga('2026-10-06'), 'martes 6 de octubre')));
tareas.push(prueba('Hora 24 h y 12 h', () => { igual(F.fmtHora('14:30', '24'), '14:30'); igual(F.fmtHora('14:30', '12'), '2:30 p. m.'); igual(F.fmtHora('00:05', '12'), '12:05 a. m.'); igual(F.fmtHora('12:00', '12'), '12:00 p. m.'); }));
tareas.push(prueba('Sumar días cruzando mes y año', () => { igual(F.sumarDias('2026-12-30', 3), '2027-01-02'); igual(F.sumarDias('2028-03-01', -1), '2028-02-29'); }));
tareas.push(prueba('Inicio de semana lunes y domingo', () => { igual(F.inicioSemana('2026-10-08', true), '2026-10-05'); igual(F.inicioSemana('2026-10-08', false), '2026-10-04'); igual(F.inicioSemana('2026-10-04', true), '2026-09-28'); }));
tareas.push(prueba('Fechas inválidas se rechazan', () => { igual(F.esFecha('2026-02-30'), false); igual(F.esFecha('2026-02-28'), true); igual(F.fmtFecha('basura'), ''); }));
tareas.push(prueba('Plazos: vencido 🔴, vence en 3 días ⚠️, normal', () => {
  igual(F.plazo('2026-10-04', '2026-10-05').nivel, 'vencido');
  igual(F.plazo('2026-10-05', '2026-10-05').texto, 'vence hoy');
  igual(F.plazo('2026-10-08', '2026-10-05').texto, 'vence en 3 días');
  igual(F.plazo('2026-10-09', '2026-10-05').nivel, 'ok');
}));
tareas.push(prueba('Relativo: Hoy, Mañana, Ayer, día de la semana', () => {
  igual(F.relativo('2026-10-05', '2026-10-05'), 'Hoy'); igual(F.relativo('2026-10-06', '2026-10-05'), 'Mañana');
  igual(F.relativo('2026-10-04', '2026-10-05'), 'Ayer'); igual(F.relativo('2026-10-08', '2026-10-05'), 'Jueves');
}));

/* ---------- Dinero (soles) ---------- */
tareas.push(prueba('Formato S/ 1,250.00', () => { igual(D.fmtSoles(125000), 'S/ 1,250.00'); igual(D.fmtSoles(9550), 'S/ 95.50'); igual(D.fmtSoles(-125000), '−S/ 1,250.00'); igual(D.fmtSoles(0), 'S/ 0.00'); }));
tareas.push(prueba('«1,250» es mil doscientos cincuenta (el error de la v4.5 lo guardaba como 1.25)', () => igual(D.leerMonto('1,250'), 125000)));
tareas.push(prueba('Montos que escribe una persona', () => {
  igual(D.leerMonto('1250'), 125000); igual(D.leerMonto('1,250.50'), 125050); igual(D.leerMonto('S/ 1,250.50'), 125050);
  igual(D.leerMonto('12.5'), 1250); igual(D.leerMonto('12,5'), 1250); igual(D.leerMonto('1.250,50'), 125050);
  igual(D.leerMonto('1,250,000'), 125000000); igual(D.leerMonto('95.5'), 9550); igual(D.leerMonto('-20'), -2000);
}));
tareas.push(prueba('Montos sin sentido se rechazan', () => { igual(D.leerMonto(''), null); igual(D.leerMonto('abc'), null); igual(D.leerMonto('1.2.3'), null); igual(D.leerMonto('1.250'), null); igual(D.leerMonto('12.345'), null); }));
tareas.push(prueba('Céntimos sin errores de decimales', () => { igual(D.aCentimos(0.1) + D.aCentimos(0.2), 30); igual(D.aCentimos(95.5), 9550); }));

/* ---------- Protección de tus datos antiguos ---------- */
tareas.push(prueba('La versión nueva se niega a escribir en las claves de la v4.5', () => {
  ['agenda_datos_v1', 'ledger_finanzas_simple_v1', 'ledger_oficina_v1', 'agenda_pref', 'agenda_nube_cfg'].forEach((k) => {
    let fallo = false; try { escribir(k, { x: 1 }); } catch (e) { fallo = true; }
    if (!fallo) throw new Error('escribió en ' + k);
  });
}));
tareas.push(prueba('Sus propias claves empiezan por agenda5_', () => Object.values(CLAVES).forEach((k) => { if (!k.startsWith('agenda5_')) throw new Error(k); })));
tareas.push(prueba('El PIN comparte la clave de la v4.5 a propósito', () => igual(ANTIGUAS.pin, 'agenda_pin')));
tareas.push(prueba('Contar los datos antiguos no los modifica', () => {
  const antes = localStorage.getItem('agenda_datos_v1');
  resumenAntiguo();
  igual(localStorage.getItem('agenda_datos_v1'), antes);
}));

/* ---------- Preferencias ---------- */
tareas.push(prueba('Preferencias rotas se corrigen sin romper la app', () => {
  const p = normalizarPref({ tema: 'rosado', formatoHora: 13, vigilia: { ini: '25:00', fin: 'x' }, inicio: 'nada', bloqueoMin: 7 });
  igual([p.tema, p.formatoHora, p.vigilia.ini, p.vigilia.fin, p.inicio, p.bloqueoMin], ['auto', '24', '06:00', '22:00', 'hoy', 1]);
}));
tareas.push(prueba('Horas despierto (también si cruza la medianoche)', () => {
  igual(minutosVigilia(normalizarPref({ vigilia: { ini: '06:00', fin: '22:00' } })), 960);
  igual(minutosVigilia(normalizarPref({ vigilia: { ini: '08:00', fin: '01:00' } })), 1020);
}));

/* ---------- PIN compatible con la v4.5 ---------- */
tareas.push(prueba('El PIN se tritura igual que en la v4.5 (SHA-256 de «sal:pin»)', () =>
  hashPIN('4821', 'sal123').then((h) => igual(h, '07af83a66a2f07b515eb119a71a312028e64e913c82114455afe4f17bbcf08bc'))));

/* ---------- FASE 2 · Migración v4.5 → v5 ---------- */
const cargarFix = (n) => fetch('datos/' + n + '.json', { cache: 'no-store' }).then((r) => r.json());
tareas.push(cargarFix('v45-ejemplos').then((fx) => Promise.all([
  prueba('Ejemplos v4.5: la migración se verifica sin un solo problema', () => {
    const a = antiguoDesdeTextos(fx), d = migrar(a, 1), v = verificar(a, d);
    if (!v.ok) throw new Error(v.problemas.slice(0, 5).join(' | '));
  }),
  prueba('Ejemplos v4.5: mismo número de cosas por colección (y 44 movimientos)', () => {
    const a = antiguoDesdeTextos(fx), d = migrar(a, 1), v = verificar(a, d);
    Object.keys(a.datos).forEach((c) => { if (Array.isArray(a.datos[c])) { const n = a.datos[c].filter((x) => x && !x.purga).length; if (!v.porCol[c] || v.porCol[c].despues !== n) throw new Error(c); } });
    igual(d.items.filter((x) => x.tipo === 'movimiento').length, 44);
  }),
  prueba('Ejemplos v4.5: tareas y recordatorios pasan a pendientes con su área y prioridad', () => {
    const a = antiguoDesdeTextos(fx), d = migrar(a, 1);
    const t = a.datos.tareas[0], it = d.items.find((x) => x.origen && x.origen.coleccion === 'tareas' && x.origen.id === t.id);
    igual([it.tipo, it.titulo, it.area, it.prioridad, it.fechas.inicio], ['pendiente', t.t, t.esp, 'alta', t.fecha]);
    const r = d.items.filter((x) => x.origen && x.origen.coleccion === 'recordatorios');
    if (!r.every((x) => x.tipo === 'pendiente' && x.lista === 'lista_recordatorios' && x.aviso === true)) throw new Error('recordatorios');
  }),
  prueba('Ejemplos v4.5: las listas antiguas son listas y sus ítems, pendientes marcables', () => {
    const a = antiguoDesdeTextos(fx), d = migrar(a, 1), l = a.datos.listas[0];
    const nueva = d.items.find((x) => x.tipo === 'lista' && x.origen && x.origen.id === l.id);
    const hijos = d.items.filter((x) => x.lista === nueva.id);
    igual(hijos.length, l.items.length);
    igual(hijos.map((x) => x.estado === 'hecho'), l.items.map((x) => !!x.ok));
  }),
  prueba('Ejemplos v4.5: montos en céntimos exactos', () => {
    const a = antiguoDesdeTextos(fx), d = migrar(a, 1);
    const p = d.items.find((x) => x.tipo === 'pago' && x.titulo === 'Luz'); igual(p.monto, 9550);
    const m = d.items.find((x) => x.tipo === 'movimiento' && x.titulo === 'Sueldo'); igual([m.monto, m.extra.ingreso], [350000, true]);
  }),
  prueba('Migrar dos veces y juntar no duplica nada', () => {
    const a = antiguoDesdeTextos(fx), d1 = migrar(a, 1), d2 = migrar(a, 2);
    const r = fusionar(d1, d2); igual(r.doc.items.length, d1.items.length); igual(r.nuevos, 0);
  }),
  prueba('Volver a traer lo mismo no cambia nada (0 nuevas, 0 actualizadas)', () => {
    const a = antiguoDesdeTextos(fx), r = fusionar(migrar(a, 1), migrar(a, 999));
    igual([r.nuevos, r.actualizados], [0, 0]);
  }),
  prueba('Importar el respaldo antiguo (formato de la v4.5) da lo mismo que migrar', () => {
    const viejo = { app: 'agenda', version: 2, exportadoEn: '2026-10-01T00:00:00Z', agenda: JSON.parse(fx.agenda_datos_v1), cuentas: JSON.parse(fx.ledger_finanzas_simple_v1), oficina: JSON.parse(fx.ledger_oficina_v1) };
    const an = analizarArchivo(JSON.stringify(viejo));
    if (!an.ok) throw new Error(an.error);
    const d = migrar(antiguoDesdeTextos(fx), 1);
    igual(an.doc.items.map((x) => x.id).sort(), d.items.map((x) => x.id).sort());
  }),
  prueba('Respaldo v5: exportar → importar devuelve exactamente lo mismo', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1);
    const an = analizarArchivo(JSON.stringify({ app: 'agenda', formato: 'agenda5', version: 1, datos: d }));
    if (!an.ok) throw new Error(an.error);
    if (!igualProfundo(an.doc.items, normalizarDoc(d).items)) throw new Error('no es igual');
  })
])));
tareas.push(cargarFix('v45-raros').then((fx) => Promise.all([
  prueba('Datos raros: se verifica sin pérdidas (ids repetidos, sin id, nulos, montos como texto…)', () => {
    const a = antiguoDesdeTextos(fx), d = migrar(a, 1), v = verificar(a, d);
    if (!v.ok) throw new Error(v.problemas.slice(0, 6).join(' | '));
  }),
  prueba('Datos raros: ids únicos aunque el original los repita', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1), ids = d.items.map((x) => x.id);
    igual(new Set(ids).size, ids.length);
  }),
  prueba('Datos raros: lo vacío y lo ya purgado se cuenta como ignorado', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1);
    igual(d.migracion.informe.ignorados.purgados, 1);
    if (d.migracion.informe.ignorados.vacios < 2) throw new Error('vacíos ' + d.migracion.informe.ignorados.vacios);
  }),
  prueba('Datos raros: «1,250» se migra como S/ 1,250.00 y «12.5» como S/ 12.50', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1);
    igual(d.items.find((x) => x.tipo === 'pago' && x.titulo === 'Alquiler').monto, 125000);
    igual(d.items.find((x) => x.tipo === 'movimiento' && x.titulo === 'Taxi').monto, 1250);
  }),
  prueba('Datos raros: campos desconocidos y colecciones inventadas se conservan', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1);
    const t = d.items.find((x) => x.origen && x.origen.id === 't5');
    igual(t.datos.campoFuturo, { a: [1, 2, { b: null }] });
    igual(t.estado, 'en_curso');
    const z = d.items.find((x) => x.origen && x.origen.coleccion === 'coleccionInventada');
    if (!igualProfundo(reconstruir(z), { id: 'z1', loQueSea: true, upd: 129 })) throw new Error('no se reconstruye');
  }),
  prueba('Datos raros: área inválida se deduce (gym → Deporte) y lo borrado va a la papelera', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1);
    igual(d.items.find((x) => x.origen && x.origen.id === 't2').area, 'deporte');
    if (!d.items.find((x) => x.origen && x.origen.id === 't3').borrado) throw new Error('t3 sin borrar');
  }),
  prueba('Datos raros: el recordatorio pospuesto suena a su nueva hora', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1), r = d.items.find((x) => x.origen && x.origen.id === 'r1');
    igual([r.fechas.inicio, r.fechas.hora], ['2026-10-05', '18:30']);
  }),
  prueba('Datos raros: fechas y horas imposibles no se inventan (quedan vacías en el formato nuevo)', () => {
    const d = migrar(antiguoDesdeTextos(fx), 1), t = d.items.find((x) => x.origen && x.origen.id === 't1');
    igual([t.fechas.inicio, t.fechas.hora, t.datos.fecha], [null, null, '2026-13-45']);
  }),
  prueba('Datos dañados (texto que no es JSON): no se rompe nada', () => {
    const a = antiguoDesdeTextos({ agenda_datos_v1: '{roto', ledger_finanzas_simple_v1: null }), d = migrar(a, 1);
    igual(d.migracion.informe.ignorados.roto, true);
  })
])));

/* ---------- FASE 3 · Entender lo que escribes, grupos y repeticiones ---------- */
const H = '2026-10-06'; /* martes */
const I = (t, m = 600) => interpretar(t, { hoy: H, ahoraMin: m });
tareas.push(prueba('«llamar al notario mañana 10am»', () => { const r = I('llamar al notario mañana 10am'); igual([r.titulo, r.fecha, r.hora], ['Llamar al notario', '2026-10-07', '10:00']); }));
tareas.push(prueba('«pagar la luz el viernes a las 6 !!» (las 6 es de la tarde)', () => { const r = I('pagar la luz el viernes a las 6 !!'); igual([r.titulo, r.fecha, r.hora, r.prioridad], ['Pagar la luz', '2026-10-09', '18:00', 'media']); }));
tareas.push(prueba('«a las 7 de la mañana» y «9:15 p. m.»', () => { igual(I('correr a las 7 de la mañana').hora, '07:00'); igual(I('cena 9:15 p. m.').hora, '21:15'); }));
tareas.push(prueba('Fechas: 15/10, «20 de diciembre», «en 3 días», «pasado mañana»', () => {
  igual(I('dentista 15/10').fecha, '2026-10-15'); igual(I('regalo 20 de diciembre').fecha, '2026-12-20');
  igual(I('revisar en 3 días').fecha, '2026-10-09'); igual(I('pasado mañana partido').fecha, '2026-10-08');
  igual(I('renovar 5/1').fecha, '2027-01-05');
}));
tareas.push(prueba('Plazo legal, área y etiquetas con #', () => { const r = I('Escrito de apelación plazo legal #oficina #exp4521 el 15/10'); igual([r.titulo, r.plazoLegal, r.area, r.etiquetas, r.fecha], ['Escrito de apelación', true, 'oficina', ['exp4521'], '2026-10-15']); }));
tareas.push(prueba('«algún día» queda sin fecha; solo la hora: hoy o mañana según si ya pasó', () => {
  igual(I('leer sobre bayes algún día').algunDia, true);
  igual(I('llamar a las 9am', 600).fecha, '2026-10-07'); igual(I('llamar a las 11am', 600).fecha, '2026-10-06');
}));
tareas.push(prueba('Tildes y mayúsculas se conservan', () => igual(I('Llamar a José Ñique mañana').titulo, 'Llamar a José Ñique')));
const P = (inicio, hora, estado = 'pendiente') => Object.assign(modeloVacio(), { titulo: 'x', estado, fechas: Object.assign(modeloVacio().fechas, { inicio, hora }) });
tareas.push(prueba('Grupos: hoy, más tarde, mañana, próximos, algún día, hecho, atrasado', () => {
  igual(grupo(P(H, null), H, 600), 'hoy'); igual(grupo(P(H, '09:00'), H, 600), 'hoy'); igual(grupo(P(H, '15:00'), H, 600), 'tarde');
  igual(grupo(P('2026-10-07', null), H, 600), 'manana'); igual(grupo(P('2026-10-10', null), H, 600), 'prox');
  igual(grupo(P(null, null), H, 600), 'algun'); igual(grupo(P(H, null, 'hecho'), H, 600), 'hecho'); igual(grupo(P('2026-10-01', null), H, 600), 'hoy');
}));
tareas.push(prueba('Repeticiones: diaria, laborables (salta el fin de semana), mensual del 31, anual del 29 de febrero', () => {
  igual(siguiente('2026-10-06', 'dia'), '2026-10-07'); igual(siguiente('2026-10-09', 'lab'), '2026-10-12');
  igual(siguiente('2026-01-31', 'mes'), '2026-02-28'); igual(siguiente('2028-02-29', 'ano'), '2029-02-28'); igual(siguiente('2026-12-15', 'mes'), '2027-01-15');
}));
tareas.push(prueba('Orden: el plazo legal siempre primero, luego por fecha y prioridad', () => {
  const a = Object.assign(P('2026-10-01', null), { titulo: 'a', prioridad: 'baja' }), b = Object.assign(P('2026-10-09', null), { titulo: 'b', plazoLegal: true }), c = Object.assign(P('2026-10-01', null), { titulo: 'c', prioridad: 'alta' });
  igual([a, b, c].sort(ordenar).map((x) => x.titulo), ['b', 'c', 'a']);
}));
tareas.push(prueba('Eventos que se repiten o duran varios días', () => {
  igual(ocurre('2026-10-05', 'sem', '2026-10-12'), true); igual(ocurre('2026-10-05', 'sem', '2026-10-13'), false);
  igual(ocurre('2026-10-05', null, '2026-10-07', '2026-10-08'), true); igual(ocurre('2026-10-05', 'lab', '2026-10-10'), false);
  igual(ocurre('1968-10-15', 'ano', '2026-10-15'), true);
}));
tareas.push(prueba('Balance: los bloques que se pisan no se cuentan dos veces', () => {
  const r = minutosPorArea([{ ini: 540, fin: 600, area: 'oficina' }, { ini: 570, fin: 630, area: 'estudios' }, { ini: 700, fin: 730, area: 'oficina' }]);
  igual([r.total, r.oficina, r.estudios], [120, 90, 30]);
}));

/* ---------- FASE 4 · Agenda ---------- */
tareas.push(prueba('Feriados del Perú: fijos y Semana Santa (2026 y 2027)', () => {
  igual(pascua(2026), '2026-04-05'); igual(pascua(2027), '2027-03-28');
  igual(feriado('2026-04-02'), 'Jueves Santo'); igual(feriado('2026-04-03'), 'Viernes Santo'); igual(feriado('2027-03-26'), 'Viernes Santo');
  igual(feriado('2026-07-28'), 'Fiestas Patrias'); igual(feriado('2026-10-08'), 'Combate de Angamos'); igual(feriado('2026-08-30'), 'Santa Rosa de Lima'); igual(feriado('2026-10-06'), '');
}));
tareas.push(prueba('Pago fijo del 31: en febrero vence el 28 (y el 29 en bisiesto)', () => {
  const p = Object.assign(modeloVacio(), { extra: { dia: 31 } });
  igual(diaDePago(p, '2026-02'), '2026-02-28'); igual(diaDePago(p, '2028-02'), '2028-02-29'); igual(diaDePago(p, '2026-10'), '2026-10-31');
}));
const EV = Object.assign(modeloVacio(), { id: 'ev_1', tipo: 'evento', titulo: 'Audiencia; Exp. 04521, sala 3', notas: 'Llevar\ncopias', repetir: 'sem', aviso: 30,
  fechas: Object.assign(modeloVacio().fechas, { inicio: '2026-10-07', hora: '09:00', horaFin: '11:00' }), extra: { lugar: 'Av. Abancay' } });
tareas.push(prueba('Archivo .ics: hora de Lima, repetición, alarma y textos escapados', () => {
  const t = textoICS([EV], 0);
  ['TZID:America/Lima', 'DTSTART;TZID=America/Lima:20261007T090000', 'DTEND;TZID=America/Lima:20261007T110000', 'SUMMARY:Audiencia\\; Exp. 04521\\, sala 3', 'RRULE:FREQ=WEEKLY', 'TRIGGER:-PT30M', 'LOCATION:Av. Abancay'].forEach((l) => { if (!t.includes(l)) throw new Error('falta ' + l); });
  if (!t.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)) throw new Error('línea de más de 75 bytes');
}));
tareas.push(prueba('Archivo .ics: evento de todo el día termina al día siguiente', () => {
  const t = textoICS([Object.assign({}, EV, { todoElDia: true, repetir: null, fechas: Object.assign({}, EV.fechas, { hora: null, inicio: '2026-12-31' }) })], 0);
  if (!t.includes('DTSTART;VALUE=DATE:20261231') || !t.includes('DTEND;VALUE=DATE:20270101')) throw new Error(t);
}));
tareas.push(prueba('Enlace a Google Calendar con fecha, hora y zona de Lima', () => {
  const u = new URL(enlaceGoogle(EV));
  igual([u.searchParams.get('dates'), u.searchParams.get('ctz'), u.searchParams.get('recur')], ['20261007T090000/20261007T110000', 'America/Lima', 'RRULE:FREQ=WEEKLY']);
}));

/* ---------- Fase 5: herramientas de las áreas ---------- */
const it = (o) => Object.assign(modeloVacio(), o, { fechas: Object.assign(modeloVacio().fechas, o.fechas || {}) });
tareas.push(prueba('Lo editado en la v5 (extra) gana a lo de la v4.5 (datos), sin borrarlo', () => {
  const x = it({ datos: { cada: 7, ult: '2026-10-01' }, extra: { ult: '2026-10-05' } });
  igual([HR.val(x, 'cada'), HR.val(x, 'ult'), HR.val(x, 'nada', 'x'), x.datos.ult], [7, '2026-10-05', 'x', '2026-10-01']);
}));
tareas.push(prueba('Casa: cuándo toca (vencido, hoy, pronto)', () => {
  igual(HR.casaEstado(it({ datos: { cada: 7, ult: '2026-09-28' } }), '2026-10-06').nivel, 'vencido');
  igual(HR.casaEstado(it({ datos: { cada: 3, ult: '2026-10-05' } }), '2026-10-06').prox, '2026-10-08');
  igual(HR.casaEstado(it({ datos: { cada: 3, ult: '2026-10-03' } }), '2026-10-06').nivel, 'hoy');
  igual(HR.casaEstado(it({ datos: {} }), '2026-10-06').nivel, 'hoy');
}));
tareas.push(prueba('Cumpleaños: próxima fecha y edad (29 de febrero en año normal → 28)', () => {
  igual(HR.proximoCumple(it({ fechas: { inicio: '1968-10-15' }, datos: { nacio: 1968 } }), '2026-10-06'), { fecha: '2026-10-15', dias: 9, edad: 58 });
  igual(HR.proximoCumple(it({ fechas: { inicio: '1990-03-02' } }), '2026-10-06').fecha, '2027-03-02');
  igual(HR.proximoCumple(it({ fechas: { inicio: '2000-02-29' } }), '2026-10-06').fecha, '2027-02-28');
}));
tareas.push(prueba('Préstamos: lo que te deben y lo que debes (sin los saldados)', () => {
  igual(HR.resumenPrestamos([it({ monto: 12000, extra: { meDeben: true } }), it({ monto: 3500 }), it({ monto: 999, estado: 'hecho' })]), { meDeben: 12000, debo: 3500, nMe: 1, nYo: 1 });
}));
tareas.push(prueba('Promedio vigesimal con pesos (y sin pesos si falta alguno)', () => {
  igual(HR.promedio([{ v: 16, p: 20 }, { v: 14, p: 20 }, { v: '', p: 30 }]), 15);
  igual(Math.round(HR.promedio([{ v: 9, p: '' }, { v: 12, p: '' }]) * 10) / 10, 10.5);
  igual(HR.promedio([]), null);
}));
tareas.push(prueba('Faltas: aviso cuando queda 1 y alerta al llegar al máximo', () => {
  igual(HR.faltas(it({ datos: { faltas: 4, maxFaltas: 5 } })).nivel, 'pronto');
  igual(HR.faltas(it({ datos: { faltas: 5, maxFaltas: 5 } })).nivel, 'vencido');
  igual(HR.faltas(it({ datos: { faltas: 1 } })).nivel, 'ok');
}));
tareas.push(prueba('Sesiones de estudio: reparte los temas y deja la víspera para repasar', () => {
  const p = HR.planSesiones({ desde: '2026-10-06', examen: '2026-10-12', temas: ['Cadena', 'Partes', 'Sustitución'] });
  igual(p.map((x) => x.fecha), ['2026-10-06', '2026-10-08', '2026-10-10', '2026-10-11']);
  igual(p[p.length - 1].repaso, true); igual(p.flatMap((x) => x.temas), ['Cadena', 'Partes', 'Sustitución']);
  igual(HR.planSesiones({ desde: '2026-10-06', examen: '2026-10-07', temas: ['A', 'B'] }).map((x) => [x.fecha, x.temas]), [['2026-10-06', ['A', 'B']]]);
  igual(HR.planSesiones({ desde: '2026-10-12', examen: '2026-10-12', temas: ['A'] }), []);
}));
tareas.push(prueba('Fichas (Leitner): acierto sube de caja, error vuelve a la 1', () => {
  igual(HR.responderFicha(it({ datos: { caja: 2 } }), true, '2026-10-06'), { caja: 3, prox: '2026-10-10' });
  igual(HR.responderFicha(it({ datos: { caja: 5 } }), true, '2026-10-06'), { caja: 5, prox: '2026-10-22' });
  igual(HR.responderFicha(it({ datos: { caja: 4 } }), false, '2026-10-06'), { caja: 1, prox: '2026-10-07' });
}));
tareas.push(prueba('Horas: tarifa de la v4.5 en soles pasa a céntimos y suma por cliente', () => {
  const r = HR.resumenHoras([it({ fechas: { inicio: '2026-10-06' }, extra: { minutos: 90 }, datos: { tarifa: 60, cliente: 'ABC' } }), it({ fechas: { inicio: '2026-10-05' }, extra: { minutos: 30, tarifa: 4500, cliente: 'Juan' } }), it({ fechas: { inicio: '2026-09-30' }, extra: { minutos: 60 }, datos: { tarifa: 60 } })], '2026-10');
  igual([r.min, r.monto, r.porCliente.ABC.monto, r.porCliente.Juan.monto], [120, 11250, 9000, 2250]);
}));
tareas.push(prueba('Entrenos como hábito: racha de semanas que cumplen la meta y días sin entrenar', () => {
  const f = ['2026-10-05', '2026-10-03', '2026-10-01', '2026-09-30', '2026-09-27', '2026-09-24', '2026-09-22', '2026-09-15'];
  const r = HR.rachaEntrenos(f, '2026-10-06', { meta: 3 });
  igual([r.semanas, r.estaSemana, r.diasSin], [2, 1, 1]);
  igual(HR.rachaEntrenos(f, '2026-10-06', { meta: 1 }).semanas, 4);
  igual(HR.avisoEntreno(HR.rachaEntrenos(['2026-10-01'], '2026-10-06')), 'Llevas 5 días sin entrenar');
  igual(HR.avisoEntreno(HR.rachaEntrenos([], '2026-10-06')), null);
}));
tareas.push(prueba('Récords: el mayor peso por ejercicio (sin importar mayúsculas)', () => {
  const r = HR.records([it({ fechas: { inicio: '2026-10-01' }, datos: { ejs: [{ n: 'Press banca', p: 57.5, r: 10 }] } }), it({ fechas: { inicio: '2026-10-05' }, extra: { ejercicios: [{ n: 'press banca', p: 60, r: 8 }, { n: 'Fondos', p: '' }] } })]);
  igual(r, [{ n: 'press banca', p: 60, fecha: '2026-10-05', reps: 8 }]);
}));
tareas.push(prueba('Partidos y pichanga: récord, goles y cuota por jugador', () => {
  igual(HR.resumenPartidos([it({ datos: { jugado: true, res: 'v', goles: 2, asist: 1 } }), it({ datos: { jugado: true, res: 'd' } }), it({ datos: {} })]), { v: 1, e: 0, d: 1, goles: 2, asist: 1, jugados: 2 });
  const p = HR.pichanga(it({ datos: { pich: { costo: 120, jug: [{ n: 'A', p: true }, { n: 'B', p: false }, { n: 'C', p: false }] } } }));
  igual([p.costo, p.cuota, p.pagaron, p.falta], [12000, 4000, 1, 8000]);
}));
tareas.push(prueba('Peso: último y cambio en 30 días', () => {
  const m = [['2026-09-08', 76.4], ['2026-09-15', 75.9], ['2026-10-06', 74.8]].map(([f, p]) => it({ fechas: { inicio: f }, datos: { peso: p } }));
  const t = HR.tendenciaPeso(m, '2026-10-06');
  igual([t.ultimo, t.cambio30, t.puntos.length], [74.8, -1.6, 3]);
}));

Promise.all(tareas).then(() => {
  const ok = resultados.filter((r) => r[1]).length;
  const el = document.getElementById('resultado');
  el.innerHTML = '<h1>' + ok + ' de ' + resultados.length + ' pruebas pasan</h1><ul>' +
    resultados.map((r) => '<li class="' + (r[1] ? 'ok' : 'mal') + '">' + (r[1] ? '✓ ' : '✗ ') + r[0] + (r[2] ? '<br><small>' + r[2] + '</small>' : '') + '</li>').join('') + '</ul>';
  window.__RESULTADO__ = { ok, total: resultados.length, fallos: resultados.filter((r) => !r[1]) };
});
