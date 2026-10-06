/* COMPARTIR: usa el menú del teléfono (WhatsApp, correo…) si existe; si no,
   copia el texto para que lo pegues donde quieras. */
import { aviso } from './aviso.js';

export async function compartir({ titulo = '', texto = '' }) {
  if (navigator.share) {
    try { await navigator.share({ title: titulo, text: texto }); return 'compartido'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; }
  }
  try { await navigator.clipboard.writeText(texto); aviso('📋 Copiado. Pégalo en WhatsApp o donde quieras.'); return 'copiado'; }
  catch (e) { aviso('No se pudo compartir en este aparato.'); return 'error'; }
}

/* Enlace de WhatsApp con un mensaje ya escrito (con número peruano si lo hay) */
export function enlaceWhatsApp(texto, telefono = '') {
  let n = String(telefono || '').replace(/\D/g, '');
  if (n.length === 9 && n[0] === '9') n = '51' + n;
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent(texto);
}
