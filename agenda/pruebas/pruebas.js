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

Promise.all(tareas).then(() => {
  const ok = resultados.filter((r) => r[1]).length;
  const el = document.getElementById('resultado');
  el.innerHTML = '<h1>' + ok + ' de ' + resultados.length + ' pruebas pasan</h1><ul>' +
    resultados.map((r) => '<li class="' + (r[1] ? 'ok' : 'mal') + '">' + (r[1] ? '✓ ' : '✗ ') + r[0] + (r[2] ? '<br><small>' + r[2] + '</small>' : '') + '</li>').join('') + '</ul>';
  window.__RESULTADO__ = { ok, total: resultados.length, fallos: resultados.filter((r) => !r[1]) };
});
