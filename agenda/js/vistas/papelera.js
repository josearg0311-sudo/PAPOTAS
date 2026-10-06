/* PAPELERA: lo borrado queda 30 días; se devuelve con un toque. */
import { enPapelera, restaurar, borrarDefinitivo, DIAS_PAPELERA, hijosBorradosCon } from '../datos/datos.js';
import { TIPOS } from '../datos/modelo.js';
import { chipArea, area } from '../datos/areas.js';
import { ico, esc, vacio } from '../util/dom.js';
import { hoy, relativo, fmtCorta } from '../util/fechas.js';
import { aviso } from '../piezas/aviso.js';
import { confirmar } from '../piezas/confirmar.js';
import { tarjeta } from './comun.js';

export function vistaPapelera() {
  const l = enPapelera();
  let html = '<a class="btn volver" href="#mas">' + ico('i-izq') + 'Más</a>';
  if (!l.length) return html + tarjeta({ eti: 'PAPELERA', titulo: 'La papelera está vacía', guia: '<b>Nada se borra de golpe.</b> Lo que borres queda aquí ' + DIAS_PAPELERA + ' días y puedes devolverlo a su sitio.', cuerpo: vacio('', 'Cuando borres algo, lo encontrarás aquí durante ' + DIAS_PAPELERA + ' días.') });
  let grupo = '';
  const filas = l.map((x) => {
    const dia = hoy(new Date(x.borrado)), resta = Math.max(0, DIAS_PAPELERA - Math.floor((Date.now() - x.borrado) / 864e5));
    const cab = dia !== grupo ? (grupo = dia, '<div class="grupo-tit"><span>Borrado ' + relativo(dia).toLowerCase() + '</span><span class="linea"></span><span class="mono">' + fmtCorta(dia) + '</span></div>') : '';
    const hijos = x.tipo === 'lista' ? hijosBorradosCon(x.id) : 0;
    return cab + '<div class="fila-pap area-' + area(x.area).id + '"><div class="fd-txt"><b>' + esc(x.titulo || '(sin título)') + '</b><small>' + chipArea(x.area) + '<span>' + esc(TIPOS[x.tipo] || x.tipo) + (hijos ? ' · con ' + hijos + ' dentro' : '') + ' · se borra en ' + resta + (resta === 1 ? ' día' : ' días') + '</span></small></div>' +
      '<div class="acc-pap"><button type="button" class="btn pri" data-acc="pap-restaurar" data-id="' + esc(x.id) + '">' + ico('i-deshacer') + 'Restaurar</button>' +
      '<button type="button" class="icono-btn" data-acc="pap-borrar" data-id="' + esc(x.id) + '" aria-label="Borrar para siempre" title="Borrar para siempre">' + ico('i-basura') + '</button></div></div>';
  }).join('');
  return html + tarjeta({ eti: 'PAPELERA', titulo: l.length === 1 ? '1 cosa' : l.length + ' cosas', guia: '<b>Restaurar</b> la devuelve a su sitio. El ícono de basura la borra para siempre.', cuerpo: '<div class="filas-pap">' + filas + '</div>' });
}
export const acciones = {
  'pap-restaurar'(b, ev, repintar) { restaurar(b.dataset.id); aviso('Restaurado: volvió a su sitio'); repintar(); },
  async 'pap-borrar'(b, ev, repintar) {
    if (!(await confirmar({ titulo: '¿Borrar para siempre?', texto: 'Ya no se podrá recuperar.', si: 'Borrar para siempre', peligro: true }))) return;
    borrarDefinitivo(b.dataset.id); aviso('Borrado para siempre'); repintar();
  }
};
