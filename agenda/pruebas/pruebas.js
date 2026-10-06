/* Pruebas automáticas de la Agenda. Se abren en pruebas/index.html (o las
   corre Playwright). Cada fase suma las suyas; nunca se borra una prueba. */
import * as F from '../js/util/fechas.js';
import * as D from '../js/util/dinero.js';
import { escribir, CLAVES, ANTIGUAS, resumenAntiguo } from '../js/datos/almacen.js';
import { normalizarPref, minutosVigilia } from '../js/datos/preferencias.js';
import { hashPIN } from '../js/piezas/candado.js';

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

Promise.all(tareas).then(() => {
  const ok = resultados.filter((r) => r[1]).length;
  const el = document.getElementById('resultado');
  el.innerHTML = '<h1>' + ok + ' de ' + resultados.length + ' pruebas pasan</h1><ul>' +
    resultados.map((r) => '<li class="' + (r[1] ? 'ok' : 'mal') + '">' + (r[1] ? '✓ ' : '✗ ') + r[0] + (r[2] ? '<br><small>' + r[2] + '</small>' : '') + '</li>').join('') + '</ul>';
  window.__RESULTADO__ = { ok, total: resultados.length, fallos: resultados.filter((r) => !r[1]) };
});
