/* HÁBITOS (como la v4.5): los de hoy en anillos y los últimos 14 días en
   cuadritos. Cada hábito sigue en su espacio: aquí se ven separados por
   espacio, con su color y un enlace de vuelta a él. */
import { AREAS } from '../datos/areas.js';
import { esc, ico, vacio } from '../util/dom.js';
import { hoy, sumarDias, inicioSemana, diaSemana, DIAS3 } from '../util/fechas.js';
import { preferencias } from '../datos/preferencias.js';
import { habitosDe, TEMAS } from './area-constancia.js';
import { marcasHabito, tocaHabito, rachaHabito, cumplimiento, diasHabito } from '../datos/seguimiento.js';

const em = (x) => (x.extra && x.extra.em) || (x.datos && x.datos.em) || '⭐';
const C = 2 * Math.PI * 26;
function frecuencia(x) { const d = diasHabito(x); return d.length === 7 ? 'Cada día' : d.length === 5 && !d.includes(0) && !d.includes(6) ? 'De lunes a viernes' : d.length + ' días por semana'; }

export function vistaHabitos() {
  const h = hoy(), todos = habitosDe(''), deHoy = todos.filter((x) => tocaHabito(x, h)), ok = deHoy.filter((x) => marcasHabito(x)[h]).length;
  const ini = inicioSemana(h, preferencias().semanaLunes);
  let tocaS = 0, hechoS = 0;
  todos.forEach((x) => { for (let d = ini; d <= h; d = sumarDias(d, 1)) if (tocaHabito(x, d)) { tocaS++; if (marcasHabito(x)[d]) hechoS++; } });
  const semana = tocaS ? Math.round(hechoS / tocaS * 100) : 0, mejor = todos.reduce((m, x) => Math.max(m, rachaHabito(x, h)), 0);
  const pct = deHoy.length ? ok / deHoy.length : 0;
  const dias = Array.from({ length: 14 }, (_, i) => sumarDias(h, i - 13));
  const anillo = (x) => { const hecho = !!marcasHabito(x)[h], r = rachaHabito(x, h);
    return '<button type="button" class="hab-anillo area-' + x.area + '" role="checkbox" aria-checked="' + hecho + '" data-acc="hab-marcar" data-id="' + esc(x.id) + '">' +
      '<span class="ha-aro"><svg viewBox="0 0 60 60" aria-hidden="true"><circle class="fondo" cx="30" cy="30" r="26"/><circle class="valor" cx="30" cy="30" r="26" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (hecho ? 0 : C).toFixed(1) + '"/></svg><span>' + esc(em(x)) + '</span></span>' +
      '<b>' + esc(x.titulo) + '</b><small>' + (r ? '🔥 ' + r + (r === 1 ? ' día' : ' días') : hecho ? 'Hecho hoy' : 'Empieza hoy') + '</small></button>'; };
  return '<div class="hab-cab"><p>Hoy <b>' + ok + ' de ' + deHoy.length + '</b> · semana ' + semana + ' % · racha 🔥 ' + mejor + '</p>' +
      '<div class="anillo-hoy" role="img" aria-label="' + Math.round(pct * 100) + ' % de hoy"><svg viewBox="0 0 74 74" aria-hidden="true"><circle class="fondo" cx="37" cy="37" r="32"/><circle class="valor" cx="37" cy="37" r="32" stroke-dasharray="' + (2 * Math.PI * 32).toFixed(1) + '" stroke-dashoffset="' + (2 * Math.PI * 32 * (1 - pct)).toFixed(1) + '"/></svg><span><b>' + Math.round(pct * 100) + '%</b></span></div></div>' +
    (!todos.length ? vacio('Aún no tienes hábitos', 'Crea uno en el espacio que le corresponde: tomar agua en Personal, repasar en Estudios, entrenar en Deporte…') : '') +
    (deHoy.length ? '<h2 class="seccion-t">Hoy <small>' + ok + ' de ' + deHoy.length + '</small></h2><div class="hab-anillos">' + deHoy.map(anillo).join('') + '</div>' : '') +
    (todos.length ? '<h2 class="seccion-t">Seguimiento <small>últimos 14 días</small></h2>' : '') +
    AREAS.map((a) => { const l = todos.filter((x) => x.area === a.id); if (!l.length) return '';
      return '<section class="tarjeta hab-tabla area-' + a.id + '"><header class="t-cab"><h2><a href="#areas/' + a.id + '/constancia">' + esc(a.emoji) + ' ' + esc(a.nombre) + '</a></h2><span class="n">' + esc(TEMAS[a.id].tab) + '</span></header>' +
        '<div class="ht-dias" aria-hidden="true"><span></span><span class="ht-cuad">' + dias.map((d) => '<i' + (d === h ? ' class="hoy"' : '') + '>' + DIAS3[diaSemana(d)].charAt(0) + '<br>' + +d.slice(8) + '</i>').join('') + '</span><span>🔥</span></div>' +
        l.map((x) => { const m = marcasHabito(x), r = rachaHabito(x, h), c = cumplimiento(x, h, 30);
          return '<div class="ht-fila"><button type="button" class="ht-nom" data-acc="hab-editar" data-id="' + esc(x.id) + '"><span class="ht-em" aria-hidden="true">' + esc(em(x)) + '</span><span><b>' + esc(x.titulo) + '</b><small>' + frecuencia(x) + (c != null ? ' · ' + c + ' %' : '') + '</small></span></button>' +
            '<span class="ht-cuad" role="img" aria-label="Últimos 14 días: ' + dias.filter((d) => m[d]).length + ' hechos">' + dias.map((d) => '<i class="' + (m[d] ? 'si' : tocaHabito(x, d) ? 'no' : 'libre') + (d === h ? ' hoy' : '') + '"></i>').join('') + '</span>' +
            '<b class="ht-racha">' + r + '</b></div>'; }).join('') + '</section>'; }).join('') +
    '<div class="fila-botones izq">' + AREAS.map((a) => '<button type="button" class="btn area-' + a.id + '" data-acc="hab-nuevo" data-area="' + a.id + '">' + ico('i-plus') + 'Hábito en ' + esc(a.nombre) + '</button>').join('') + '</div>' +
    '<h2 class="seccion-t">Metas</h2><div class="herr-botones">' + AREAS.map((a) => '<a class="herr-btn area-' + a.id + '" href="#areas/' + a.id + '/constancia"><b>' + esc(a.emoji) + ' ' + esc(TEMAS[a.id].tab) + '</b>' + ico('i-der') + '</a>').join('') + '</div>';
}
export const acciones = {};
