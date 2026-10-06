/* La primera vez que abres la v5 en un aparato con datos de la v4.5:
   muestra la migración paso a paso y, al final, el informe (antes → después
   por tipo). Si algo falla, no se guarda nada y lo explica. */
import { migrarDesdeV45 } from '../datos/datos.js';
import { leerCopia } from '../datos/copias.js';
import { guardarArchivo } from '../datos/respaldo.js';
import { ico, esc } from '../util/dom.js';
import { hoy } from '../util/fechas.js';

const NOMBRES = {
  tareas: 'Tareas', recordatorios: 'Recordatorios', eventos: 'Eventos', notas: 'Notas', listas: 'Listas', 'listas.items': 'Ítems de listas',
  habitos: 'Hábitos', metas: 'Metas', pagos: 'Pagos fijos', diario: 'Diario', enfoque: 'Enfoque del día', cursos: 'Cursos', entrenos: 'Entrenamientos',
  rutinas: 'Rutinas', medidas: 'Medidas', bienestar: 'Bienestar', cobros: 'Cobros', deudas: 'Préstamos', proyectos: 'Proyectos', horas: 'Horas',
  clientes: 'Clientes', casa: 'Casa', menu: 'Menús', docs: 'Documentos', fichas: 'Fichas', revisiones: 'Revisiones',
  'libro.personal': 'Movimientos personales', 'libro.oficina': 'Movimientos de oficina'
};

function capa(html) {
  let c = document.getElementById('capaMigracion');
  if (!c) { c = document.createElement('div'); c.id = 'capaMigracion'; document.body.appendChild(c); }
  c.innerHTML = '<div class="migracion" role="dialog" aria-modal="true" aria-labelledby="migTit"><div class="migracion-caja">' + html + '</div></div>';
  return c;
}
function pasos(estado) {
  const P = [['copia', 'Guardar una copia exacta de tu versión anterior'], ['convertir', 'Convertir al formato nuevo'], ['verificar', 'Verificar elemento por elemento que no falte nada'], ['guardar', 'Guardar']];
  return '<ol class="mig-pasos">' + P.map(([k, t]) => '<li class="' + (estado[k] || '') + '"><span class="mig-ico">' + (estado[k] === 'ok' ? ico('i-check') : estado[k] === 'mal' ? ico('i-x') : '<i></i>') + '</span>' + t + '</li>').join('') + '</ol>';
}
function descargarTextos(textos) {
  guardarArchivo(JSON.stringify({ app: 'agenda', formato: 'copia-literal-v4.5', fecha: new Date().toISOString(), claves: textos }, null, 1), 'agenda_copia_v4.5_' + hoy() + '.json');
}

export function mostrarMigracion() {
  return new Promise((listo) => {
    capa('<span class="eti-mig">Fase 2 · tus datos</span><h2 id="migTit">Pasando tus datos a la Agenda nueva</h2>' +
      '<p>Encontré tu agenda anterior en este aparato. La paso al formato nuevo <b>sin borrar la anterior</b>.</p>' + pasos({ copia: 'en' }));
    setTimeout(async () => {
      const r = await migrarDesdeV45();
      if (!r.ok && r.paso === 'copia') {
        capa('<span class="eti-mig">Antes de seguir</span><h2 id="migTit">Necesito que guardes una copia</h2>' +
          '<p>Este navegador no me deja guardar la copia automática (' + esc(r.error && r.error.message || 'sin espacio') + '). Descárgala tú: es un archivo con <b>todo</b> lo de tu versión anterior, tal cual.</p>' +
          pasos({ copia: 'mal' }) +
          '<div class="fila-botones"><button type="button" class="btn" id="migBajar">' + ico('i-bajar') + 'Descargar la copia</button><button type="button" class="btn pri" id="migSeguir" disabled>Migrar</button></div>');
        document.getElementById('migBajar').onclick = () => { descargarTextos(r.textos); document.getElementById('migSeguir').disabled = false; };
        document.getElementById('migSeguir').onclick = async () => {
          const r2 = await migrarDesdeV45({ copiaObligatoria: false });
          if (r2.ok) informe(r2, listo); else fallo(r2, listo);
        };
        return;
      }
      if (r.ok) informe(r, listo); else fallo(r, listo);
    }, 350);
  });
}

function informe(r, listo) {
  const v = r.verificacion, filas = Object.keys(v.porCol).filter((c) => v.porCol[c].antes || v.porCol[c].despues);
  const total = filas.reduce((s, c) => s + v.porCol[c].antes, 0);
  capa('<span class="eti-mig">Listo</span><h2 id="migTit">Tus datos ya están en la Agenda nueva</h2>' +
    '<p>Se pasaron <b>' + total + ' cosas</b> y se comprobó una por una que se pueden reconstruir exactas. Tu versión anterior sigue intacta.</p>' +
    pasos({ copia: r.copia ? 'ok' : 'mal', convertir: 'ok', verificar: 'ok', guardar: 'ok' }) +
    '<div class="mig-tabla" role="table" aria-label="Antes y después por tipo"><div class="mig-fila cab" role="row"><span role="columnheader">Qué</span><span role="columnheader">Antes</span><span role="columnheader">Ahora</span><span role="columnheader"></span></div>' +
    filas.map((c) => '<div class="mig-fila" role="row"><span role="cell">' + esc(NOMBRES[c] || c) + '</span><span class="mono" role="cell">' + v.porCol[c].antes + '</span><span class="mono" role="cell">' + v.porCol[c].despues + '</span><span role="cell" class="' + (v.porCol[c].ok ? 'ok' : 'mal') + '">' + ico(v.porCol[c].ok ? 'i-check' : 'i-x') + '</span></div>').join('') + '</div>' +
    (r.copia ? '<p class="mig-nota">' + ico('i-escudo') + 'Copia exacta guardada en este aparato. Puedes descargarla ahora o cuando quieras desde Ajustes → Tus datos.</p>' : '') +
    '<div class="fila-botones">' + (r.copia ? '<button type="button" class="btn" id="migBajar">' + ico('i-bajar') + 'Descargar la copia</button>' : '') +
    '<button type="button" class="btn pri" id="migListo">Ver mis datos</button></div>');
  const b = document.getElementById('migBajar');
  if (b) b.onclick = async () => { const c = await leerCopia(r.copia.id); if (c) guardarArchivo(c.texto, 'agenda_copia_v4.5_' + hoy() + '.json'); };
  document.getElementById('migListo').onclick = () => { document.getElementById('capaMigracion').remove(); listo(true); };
  document.getElementById('migListo').focus({ preventScroll: true });
  document.querySelector('.migracion').scrollTop = 0;
}

function fallo(r, listo) {
  const det = r.verificacion ? r.verificacion.problemas.slice(0, 8) : [String(r.error && r.error.message || r.error || 'Error desconocido')];
  capa('<span class="eti-mig">No se migró nada</span><h2 id="migTit">Me detuve para no perder nada</h2>' +
    '<p>Encontré algo que no cuadra, así que <b>no guardé ningún cambio</b>. Tu versión anterior sigue intacta y la puedes seguir usando.</p>' +
    pasos({ copia: r.paso === 'copia' ? 'mal' : 'ok', convertir: 'ok', verificar: r.paso === 'verificacion' ? 'mal' : r.paso === 'guardar' ? 'ok' : '', guardar: r.paso === 'guardar' ? 'mal' : '' }) +
    '<details class="mig-detalle"><summary>Detalle para revisar</summary><pre>' + esc(det.join('\n')) + '</pre></details>' +
    '<div class="fila-botones"><button type="button" class="btn" id="migBajar">' + ico('i-bajar') + 'Descargar copia de mis datos</button><button type="button" class="btn pri" id="migListo">Entendido</button></div>');
  document.getElementById('migBajar').onclick = () => descargarTextos(r.textos);
  document.getElementById('migListo').onclick = () => { document.getElementById('capaMigracion').remove(); listo(false); };
}
