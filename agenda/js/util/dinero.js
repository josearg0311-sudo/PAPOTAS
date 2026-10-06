/* Dinero en soles. Se guarda en céntimos (números enteros) para que las sumas
   no tengan errores de decimales; se muestra como «S/ 1,250.00» (es-PE). */

export const MONEDA = 'S/';
let fmt = null;
try { fmt = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); } catch (e) { fmt = null; }

function conComas(n) {
  const [ent, dec] = Math.abs(n).toFixed(2).split('.');
  return ent.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
}

/* 125000 → «S/ 1,250.00»; negativo → «−S/ 1,250.00» */
export function fmtSoles(centimos) {
  const c = Math.round(Number(centimos) || 0);
  const v = Math.abs(c) / 100;
  const t = fmt ? fmt.format(v) : conComas(v);
  return (c < 0 ? '−' : '') + MONEDA + ' ' + t;
}
export function fmtSolesDesdeSoles(soles) { return fmtSoles(aCentimos(soles)); }
export function aCentimos(soles) { return Math.round((Number(soles) || 0) * 100); }

/* Lo que escribe una persona → céntimos (o null si no es un monto).
   Acepta «1250», «1,250», «1,250.50», «S/ 1 250», «12.5», «12,5» y también
   el estilo europeo «1.250,50». La regla: si hay coma Y punto, el último es el
   decimal; si solo hay comas, una coma seguida de exactamente 3 cifras es de
   miles (1,250 = mil doscientos cincuenta), si no, es decimal (12,5).
   El error de antes —«1,250» guardado como S/ 1.25— queda resuelto aquí. */
export function leerMonto(texto) {
  let s = String(texto == null ? '' : texto).trim().replace(/^S\/\.?/i, '').replace(/[\s ]/g, '').replace(/−/g, '-');
  if (!s) return null;
  const neg = s.startsWith('-');
  s = s.replace(/^[-+]/, '');
  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
  const ultComa = s.lastIndexOf(','), ultPunto = s.lastIndexOf('.');
  let entero = s, decimal = '';
  if (ultComa >= 0 && ultPunto >= 0) {
    const sep = Math.max(ultComa, ultPunto);
    entero = s.slice(0, sep).replace(/[.,]/g, '');
    decimal = s.slice(sep + 1);
  } else if (ultComa >= 0 || ultPunto >= 0) {
    const ch = ultComa >= 0 ? ',' : '.';
    const partes = s.split(ch);
    const miles = partes.length > 1 && partes.slice(1).every((p) => p.length === 3) && partes[0].length >= 1 && partes[0].length <= 3;
    if (ch === ',' && miles) { entero = partes.join(''); }
    else if (ch === '.' && partes.length > 2 && miles) { entero = partes.join(''); }
    else if (partes.length === 2) { entero = partes[0]; decimal = partes[1]; }
    else return null;
  }
  /* «1.250» (un punto y 3 cifras) es ambiguo: se rechaza para que la persona lo aclare */
  if (!/^\d*$/.test(entero) || !/^\d*$/.test(decimal) || decimal.length > 2) return null;
  const c = Number(entero || '0') * 100 + Number((decimal + '00').slice(0, 2));
  if (!Number.isFinite(c)) return null;
  return neg ? -c : c;
}
