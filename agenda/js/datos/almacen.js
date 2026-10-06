/* El almacén del navegador, con red de seguridad: si está lleno o bloqueado
   (ventana privada, sin espacio) no se cae la app; se avisa.

   REGLA DE ORO: la versión nueva NUNCA escribe en las claves de la v4.5.
   Sus claves empiezan por «agenda5_». De las antiguas solo se LEE, salvo
   «agenda_pin», que se comparte a propósito para que tu PIN siga valiendo. */

export const CLAVES = {
  pref: 'agenda5_pref',
  pinEspera: 'agenda5_pin_espera',
  errores: 'agenda5_errores'
};

/* Claves de la v4.5 (solo lectura, salvo el PIN) */
export const ANTIGUAS = {
  datos: 'agenda_datos_v1',
  pref: 'agenda_pref',
  tema: 'agenda_tema',
  pin: 'agenda_pin',
  libroPersonal: 'ledger_finanzas_simple_v1',
  libroOficina: 'ledger_oficina_v1',
  nube: 'agenda_nube_cfg'
};

export function leer(clave, porDefecto = null) {
  try {
    const t = localStorage.getItem(clave);
    if (t == null) return porDefecto;
    const v = JSON.parse(t);
    return v == null ? porDefecto : v;
  } catch (e) { return porDefecto; }
}
export function leerTexto(clave) {
  try { return localStorage.getItem(clave); } catch (e) { return null; }
}

let alFallar = null;
export function cuandoFalleGuardar(fn) { alFallar = fn; }

export function escribir(clave, valor) {
  if (Object.values(ANTIGUAS).includes(clave) && clave !== ANTIGUAS.pin) {
    throw new Error('La versión nueva no escribe en la clave antigua «' + clave + '»');
  }
  try { localStorage.setItem(clave, JSON.stringify(valor)); return true; }
  catch (e) { if (alFallar) alFallar(e); return false; }
}
export function borrar(clave) {
  if (Object.values(ANTIGUAS).includes(clave) && clave !== ANTIGUAS.pin) {
    throw new Error('La versión nueva no borra la clave antigua «' + clave + '»');
  }
  try { localStorage.removeItem(clave); } catch (e) { /* nada que hacer */ }
}

/* Lo que hay guardado de la v4.5 en este aparato: solo se cuenta, no se toca.
   Sirve para tranquilizar («tus datos siguen aquí») y, en la Fase 2, para
   comprobar que la migración no pierde nada. */
export function resumenAntiguo() {
  const d = leer(ANTIGUAS.datos, null);
  const out = { hay: false, colecciones: {}, total: 0, libros: { personal: 0, oficina: 0 }, nube: !!leer(ANTIGUAS.nube, null) };
  if (d && typeof d === 'object') {
    Object.keys(d).forEach((k) => {
      if (Array.isArray(d[k])) {
        const n = d[k].filter((x) => x && x.id && !x.del).length;
        if (n) { out.colecciones[k] = n; out.total += n; }
      }
    });
  }
  ['personal', 'oficina'].forEach((k) => {
    const raw = leer(k === 'personal' ? ANTIGUAS.libroPersonal : ANTIGUAS.libroOficina, null);
    const l = raw && Array.isArray(raw.transactions) ? raw.transactions : (Array.isArray(raw) ? raw : []);
    out.libros[k] = l.length;
  });
  out.hay = out.total > 0 || out.libros.personal > 0 || out.libros.oficina > 0;
  return out;
}

/* Registro de fallos (los últimos 20), para revisarlos desde Ajustes */
export function anotarError(e, donde = '') {
  try {
    const l = leer(CLAVES.errores, []);
    l.push({ t: Date.now(), donde, msj: String((e && (e.message || e)) || '').slice(0, 300), pila: String((e && e.stack) || '').split('\n').slice(0, 4).join(' | ').slice(0, 500) });
    localStorage.setItem(CLAVES.errores, JSON.stringify(l.slice(-20)));
  } catch (x) { /* sin registro */ }
}
