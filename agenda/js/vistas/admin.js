/* ADMINISTRACIÓN (dentro de Ajustes): la nube, tus áreas, y tus etiquetas
   y categorías. La nube NUNCA se conecta sola: cada paso pide confirmación. */
import { AREAS, COLORES, COLOR_ORIGINAL, ICONOS } from '../datos/areas.js';
import { documento, elementos, poner, cambiarPerfil } from '../datos/datos.js';
import { nubeDisponible, config, estadoNube, nubeAntigua, crearNube, unirNube, desconectar, sincronizar, traerNubeAntigua, codigoDe, mensajeError, empaquetar } from '../datos/nube.js';
import { hoy, fmtFecha, fmtHora } from '../util/fechas.js';
import { preferencias } from '../datos/preferencias.js';
import { esc, ico, plural } from '../util/dom.js';
import { abrirHoja, cerrarHoja } from '../piezas/hoja.js';
import { confirmar } from '../piezas/confirmar.js';
import { editar } from '../piezas/formulario.js';
import { aviso } from '../piezas/aviso.js';
import { cambiarPref } from '../datos/preferencias.js';
import { tecladoDisponible, palabrasAprendidas, olvidarPalabra, agregarPalabra } from '../piezas/teclado.js';

function ajuste(titulo, texto, control) {
  return '<div class="ajuste"><div class="ajuste-txt"><b>' + titulo + '</b>' + (texto ? '<small>' + texto + '</small>' : '') + '</div><div class="ajuste-ctl">' + control + '</div></div>';
}
const cuando = (t) => { if (!t) return 'nunca'; const s = Math.round((Date.now() - t) / 1000); if (s < 60) return 'hace un momento'; if (s < 3600) return 'hace ' + Math.round(s / 60) + ' min'; const d = hoy(new Date(t)); return d === hoy() ? 'hoy ' + fmtHora(new Date(t).toLocaleTimeString('en-GB', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }), preferencias().formatoHora) : fmtFecha(d); };

/* ---------- Nube ---------- */
export function grupoNube() {
  if (!nubeDisponible()) return ajuste('Estado', '<span class="estado-nube apagada">○ No disponible en la vista previa</span> Esta es una copia de prueba con datos de ejemplo: aquí no se conecta ninguna nube, para no crear nada en tu cuenta de jsonbin.io. La nube se activa en la app de verdad.', '');
  const c = config(), e = estadoNube(), ant = nubeAntigua();
  let html = '';
  if (!c) {
    html += ajuste('Estado', '<span class="estado-nube apagada">○ Sin conectar</span> Tus datos están solo en este aparato. Conecta la nube para tenerlos en tu celular y tu laptop, y no perderlos si cambias de equipo.', '') +
      ajuste('Primer aparato', 'Crea tu nube nueva en tu cuenta gratuita de <b>jsonbin.io</b> con tu llave (X-Master-Key)' + (ant ? '. <b>Ya la encontré</b>: es la que usa la versión anterior en este aparato.' : '.') + ' Te muestro todo antes de conectar.', '<button type="button" class="btn pri" data-acc="nube-crear">' + ico('i-nube') + 'Crear mi nube</button>') +
      ajuste('Otro aparato', 'Si ya creaste tu nube en otro aparato, pega aquí su código (empieza con AGENDA5:).', '<button type="button" class="btn" data-acc="nube-unir">Unir este aparato</button>');
  } else {
    const est = e.ocupado ? '<span class="estado-nube ocupada">◌ Sincronizando…</span>' : e.ok ? '<span class="estado-nube ok">● Sincronizada</span> ' + cuando(e.fecha) + (e.n ? ' · ' + e.n + ' cosas' : '') : '<span class="estado-nube error">● Con problema</span> ' + esc(e.error || '') + (e.fecha ? ' · última vez bien: ' + cuando(e.fecha) : '');
    html += ajuste('Estado', est + '<br>Se sincroniza sola mientras la usas (cada minuto, al abrirla y al volver internet). Bin: <span class="mono">' + esc(c.bin.slice(0, 6)) + '…</span>', '<button type="button" class="btn pri" data-acc="nube-ahora">' + ico('i-nube') + 'Sincronizar ahora</button>') +
      ajuste('Conectar otro aparato', 'Te doy un código para pegar en tu otro celular o laptop.', '<button type="button" class="btn" data-acc="nube-codigo">Ver código</button>') +
      ajuste('Desconectar este aparato', 'Deja de sincronizar aquí. No borra nada: ni lo de este aparato ni lo de la nube.', '<button type="button" class="btn peligro" data-acc="nube-quitar">Desconectar</button>');
  }
  if (ant) html += ajuste('Nube de la versión anterior', 'La v4.5 sigue usando sus 3 bins y <b>la nueva nunca escribe en ellos</b>. Si en este aparato te falta algo que solo estaba en la nube anterior, puedes traerlo: se <b>lee</b> una vez, se verifica y se junta.', '<button type="button" class="btn" data-acc="nube-antigua">' + ico('i-bajar') + 'Traer (solo leer)</button>');
  return html + '<p class="pie-ajuste">' + ico('i-escudo') + 'Antes de subir, la app revisa que tus datos estén sanos; si algo no cuadra, no sube nada y te avisa. Tu llave queda solo en este aparato.</p>';
}
async function hojaCrear(repintar) {
  const ant = nubeAntigua(), d = documento(), n = d ? d.items.length : 0;
  let kb = '?'; try { kb = Math.max(1, Math.round(JSON.stringify(await empaquetar(d)).length / 1024)); } catch (e) { /* nada */ }
  const hoja = abrirHoja('Crear mi nube', '<form class="form" id="formNube" autocomplete="off">' +
    '<p class="ayuda"><b>Esto es lo que va a pasar:</b></p><ol class="lista-pasos"><li>Se crea <b>un bin nuevo y privado</b> llamado «agenda5» en tu cuenta de jsonbin.io.</li><li>Se suben tus <b>' + n + ' cosas</b> (unos ' + kb + ' KB, comprimidas).</li><li>Desde ahí, este aparato se sincroniza solo.</li><li><b>Los 3 bins de la versión anterior no se tocan</b>: la v4.5 sigue funcionando igual.</li></ol>' +
    '<label class="campo"><span>Tu llave de jsonbin.io (X-Master-Key)</span><input class="entrada mono" name="llave" type="password" required value="' + esc(ant ? ant.llave : '') + '" placeholder="$2a$10$…" spellcheck="false" autocapitalize="off"></label>' +
    '<label class="interruptor"><input type="checkbox" name="ver"><span>Mostrar la llave</span></label>' +
    '<label class="interruptor"><input type="checkbox" name="ok" required><span>Entiendo y quiero conectar mi nube</span></label>' +
    '<div class="fila-botones"><button type="submit" class="btn pri">' + ico('i-nube') + 'Crear y subir</button></div></form>');
  const f = hoja.querySelector('#formNube');
  f.ver.addEventListener('change', () => { f.llave.type = f.ver.checked ? 'text' : 'password'; });
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!f.ok.checked) { aviso('Marca «Entiendo y quiero conectar» para seguir.'); return; }
    const b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Conectando…';
    try { await crearNube(f.llave.value); cerrarHoja(); repintar(); aviso('☁️ Nube creada: tus datos ya están a salvo. Ahora conecta tus otros aparatos.'); }
    catch (e) { b.disabled = false; b.textContent = 'Crear y subir'; aviso('No se pudo crear: ' + mensajeError(e)); }
  });
}
function hojaUnir(repintar) {
  const hoja = abrirHoja('Unir este aparato', '<form class="form" id="formUnir" autocomplete="off">' +
    '<p class="ayuda">En el aparato donde ya tienes la nube: <b>Ajustes → Nube → Ver código</b>. Cópialo y pégalo aquí. Lo de este aparato y lo de la nube <b>se juntan</b>: no se pierde nada.</p>' +
    '<label class="campo"><span>Código</span><textarea class="entrada mono" name="codigo" required placeholder="AGENDA5:…" spellcheck="false" autocapitalize="off"></textarea></label>' +
    '<div class="fila-botones"><button type="submit" class="btn pri">Unir y juntar</button></div></form>');
  const f = hoja.querySelector('#formUnir');
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const b = f.querySelector('button[type=submit]'); b.disabled = true; b.textContent = 'Conectando…';
    try { const r = await unirNube(f.codigo.value); cerrarHoja(); repintar(); aviso('☁️ Unido' + (r && r.bajados ? ': llegaron ' + plural(r.bajados, 'cosa', 'cosas') : '') + '.'); }
    catch (e) { b.disabled = false; b.textContent = 'Unir y juntar'; aviso(mensajeError(e)); }
  });
}

/* ---------- Teclado ---------- */
const siNo = (acc, k, v) => '<div class="selector" role="group"><button type="button" data-acc="' + acc + '" data-k="' + k + '" data-v="1" aria-pressed="' + !!v + '">Sí</button><button type="button" data-acc="' + acc + '" data-k="' + k + '" data-v="0" aria-pressed="' + !v + '">No</button></div>';
export function grupoTeclado() {
  const t = preferencias().teclado, n = Object.values(palabrasAprendidas()).filter((x) => x > 0).length;
  return (tecladoDisponible() ? '' : '<p class="pie-ajuste">' + ico('i-info') + 'El teclado propio aparece en el celular y la tablet. En la computadora usas tu teclado de siempre; estos ajustes viajan contigo.</p>') +
    ajuste('Teclado de la Agenda', 'Con ñ, tildes manteniendo la vocal, sugerencias, emojis y calculadora para montos. Desactívalo para usar el del celular.', siNo('tk-pref', 'activo', t.activo)) +
    ajuste('Autocorrector', 'Corrige al poner espacio: tildes («manana» → mañana), errores de una o dos letras, s/z/c, b/v, h. Si borras justo después, vuelve tu palabra y la aprende.', siNo('tk-pref', 'corrector', t.corrector)) +
    ajuste('Abrir ¿ y ¡ solos', 'Al terminar una pregunta con «?», pone el «¿» al inicio.', siNo('tk-pref', 'signos', t.signos)) +
    ajuste('Teclas grandes', 'Más altas y con letra más grande.', siNo('tk-pref', 'grande', t.grande)) +
    ajuste('Vibrar al tocar', '', siNo('tk-pref', 'vibrar', t.vibrar)) +
    ajuste('Mis palabras', plural(n, 'palabra aprendida', 'palabras aprendidas') + ' (nombres, lugares y términos tuyos que el corrector no debe tocar). Incluye las que aprendió la versión anterior.', '<button type="button" class="btn" data-acc="tk-palabras">Ver y editar</button>');
}
function hojaPalabras(repintar) {
  const m = palabrasAprendidas(), l = Object.keys(m).filter((w) => m[w] > 0).sort((a, b) => a.localeCompare(b, 'es'));
  const h = abrirHoja('Mis palabras', '<form class="form" id="formPalabra" autocomplete="off"><div class="anadir-palabra"><input class="entrada" name="w" maxlength="30" placeholder="Agregar una palabra (ej. Tolito)" spellcheck="false" autocorrect="off"><button type="submit" class="btn pri">Agregar</button></div></form>' +
    (l.length ? '<div class="chips-admin palabras">' + l.map((w) => '<button type="button" class="chip-admin" data-olvidar="' + esc(w) + '" aria-label="Olvidar ' + esc(w) + '">' + esc(w) + ' ✕</button>').join('') + '</div><p class="ayuda">Toca una palabra para olvidarla.</p>' : '<p class="ayuda">Aún no aprendió ninguna. Cuando el corrector cambie algo que escribiste bien, borra justo después: vuelve tu palabra y la aprende.</p>'));
  h.querySelector('#formPalabra').addEventListener('submit', (ev) => { ev.preventDefault(); const v = ev.target.w.value; if (agregarPalabra(v)) { aviso('Aprendida: ' + v.trim()); hojaPalabras(repintar); } else aviso('Escribe una sola palabra, solo con letras.'); });
  h.querySelectorAll('[data-olvidar]').forEach((b) => b.addEventListener('click', () => { olvidarPalabra(b.dataset.olvidar); aviso('Olvidada: ' + b.dataset.olvidar); hojaPalabras(repintar); }));
}

/* ---------- Tus áreas ---------- */
export function grupoAreas() {
  return AREAS.map((a) => ajuste('<span class="punto-area area-' + a.id + '" aria-hidden="true"></span>' + esc(a.nombre), esc(a.lema) + ' · ' + COLORES[a.color || COLOR_ORIGINAL[a.id]][0].toLowerCase(),
    '<button type="button" class="btn" data-acc="area-editar" data-id="' + a.id + '">' + ico('i-lapiz') + 'Editar</button>')).join('') +
    '<p class="pie-ajuste">' + ico('i-info') + 'Son tus 4 áreas de vida, cada una con sus herramientas propias. Puedes cambiarles nombre, lema, emoji, color e ícono; lo que guardaste en cada una se queda donde está.</p>';
}
function editarArea(id, repintar) {
  const a = AREAS.find((x) => x.id === id), conf = (documento().perfil.areas || {});
  editar({ titulo: 'Área · ' + a.nombre, campos: [
    { n: 'nombre', t: 'texto', etq: 'Nombre', v: a.nombre, req: true, max: 24 },
    { n: 'lema', t: 'texto', etq: 'Lema', v: a.lema, max: 60 },
    { n: 'emoji', t: 'texto', etq: 'Emoji (como en tu versión anterior)', v: a.emoji, max: 4, ph: '🏠' },
    { n: 'color', t: 'botones', etq: 'Color', v: a.color || COLOR_ORIGINAL[id], ops: Object.entries(COLORES).map(([k, c]) => [k, c[0]]) },
    { n: 'icono', t: 'botones', etq: 'Ícono', v: a.icono, ops: ICONOS }],
  antes: '<p class="ayuda">Todo lo de ' + esc(a.nombre) + ' (recordatorios, herramientas, hábitos…) sigue en su sitio: solo cambia cómo se ve.</p>',
  despues: '<div class="fila-botones izq"><button type="button" class="btn chico" id="areaOriginal">Volver a como era</button></div>',
  alGuardar: (v) => {
    cambiarPerfil({ areas: Object.assign({}, conf, { [id]: { nombre: v.nombre.trim(), lema: v.lema.trim(), emoji: (v.emoji || '').trim(), color: v.color, icono: v.icono } }) });
    repintar(); aviso('Área guardada');
  } });
  const b = document.getElementById('areaOriginal');
  if (b) b.addEventListener('click', () => { const c = Object.assign({}, conf); delete c[id]; cambiarPerfil({ areas: c }); cerrarHoja(); repintar(); aviso('Área como era'); });
  /* los íconos se ven como íconos */
  document.querySelectorAll('#formHerr [data-sel="icono"] button').forEach((x) => { x.innerHTML = ico(x.dataset.v) + '<span class="solo-lector">' + x.textContent + '</span>'; x.setAttribute('aria-label', x.textContent); });
  document.querySelectorAll('#formHerr [data-sel="color"] button').forEach((x) => { x.insertAdjacentHTML('afterbegin', '<i class="muestra-color" style="background:' + COLORES[x.dataset.v][document.documentElement.dataset.tema === 'claro' ? 2 : 1][0] + '"></i>'); });
}

/* ---------- Etiquetas y categorías ---------- */
function etiquetas() {
  const m = {};
  elementos((x) => Array.isArray(x.etiquetas) && x.etiquetas.length).forEach((x) => x.etiquetas.forEach((e) => { m[e] = (m[e] || 0) + 1; }));
  return Object.entries(m).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
}
function categorias(libro) {
  const m = {};
  elementos((x) => x.tipo === 'movimiento' && ((x.extra && x.extra.libro) || 'personal') === libro && x.extra.categoria).forEach((x) => { m[x.extra.categoria] = (m[x.extra.categoria] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
export function grupoEtiquetas() {
  const e = etiquetas(), cp = categorias('personal'), co = categorias('oficina');
  const chips = (l, acc, extra = '') => l.length ? '<div class="chips-admin">' + l.map(([k, n]) => '<button type="button" class="chip-admin" data-acc="' + acc + '" data-v="' + esc(k) + '"' + extra + '>' + esc(k) + ' <span class="mono">' + n + '</span></button>').join('') + '</div>' : '<small class="tenue">Ninguna todavía.</small>';
  return '<div class="ajuste columna"><div class="ajuste-txt"><b>Etiquetas</b><small>Las que pones con # en tus recordatorios y eventos. Toca una para renombrarla o quitarla de todo.</small></div>' + chips(e, 'etq-editar') + '</div>' +
    '<div class="ajuste columna"><div class="ajuste-txt"><b>Categorías del libro personal</b><small>Toca una para renombrarla (si pones el nombre de otra, se juntan).</small></div>' + chips(cp, 'cat-editar', ' data-libro="personal"') + '</div>' +
    '<div class="ajuste columna"><div class="ajuste-txt"><b>Categorías del libro de la oficina</b></div>' + chips(co, 'cat-editar', ' data-libro="oficina"') + '</div>';
}
function editarEtiqueta(e, repintar) {
  const afectados = elementos((x) => Array.isArray(x.etiquetas) && x.etiquetas.includes(e));
  editar({ titulo: 'Etiqueta #' + e, textoGuardar: 'Renombrar', campos: [{ n: 'nuevo', t: 'texto', etq: 'Nuevo nombre (en ' + plural(afectados.length, 'cosa', 'cosas') + ')', v: e, req: true, max: 30 }],
    alGuardar: (v) => {
      const n = v.nuevo.trim().replace(/^#/, ''); if (!n || n === e) return;
      afectados.forEach((x) => { const y = JSON.parse(JSON.stringify(x)); y.etiquetas = [...new Set(y.etiquetas.map((t) => (t === e ? n : t)))]; poner(y); });
      repintar(); aviso('#' + e + ' → #' + n + ' en ' + plural(afectados.length, 'cosa', 'cosas'));
    },
    alBorrar: async () => {
      if (!(await confirmar({ titulo: '¿Quitar #' + e + '?', texto: 'Se quita la etiqueta de ' + plural(afectados.length, 'cosa', 'cosas') + '. Las cosas no se borran.', si: 'Quitar etiqueta', peligro: true }))) return;
      const antes = afectados.map((x) => JSON.parse(JSON.stringify(x)));
      afectados.forEach((x) => { const y = JSON.parse(JSON.stringify(x)); y.etiquetas = y.etiquetas.filter((t) => t !== e); poner(y); });
      repintar(); aviso('#' + e + ' quitada', () => { antes.forEach((y) => poner(y)); repintar(); });
    } });
}
function editarCategoria(c, libro, repintar) {
  const afectados = elementos((x) => x.tipo === 'movimiento' && ((x.extra && x.extra.libro) || 'personal') === libro && x.extra.categoria === c);
  editar({ titulo: 'Categoría · ' + c, textoGuardar: 'Renombrar', campos: [{ n: 'nuevo', t: 'texto', etq: 'Nuevo nombre (en ' + plural(afectados.length, 'movimiento', 'movimientos') + ')', v: c, req: true, max: 40 }],
    alGuardar: (v) => {
      const n = v.nuevo.trim(); if (!n || n === c) return;
      const antes = afectados.map((x) => JSON.parse(JSON.stringify(x)));
      afectados.forEach((x) => { const y = JSON.parse(JSON.stringify(x)); y.extra.categoria = n; poner(y); });
      repintar(); aviso(c + ' → ' + n, () => { antes.forEach((y) => poner(y)); repintar(); });
    } });
}

export const acciones = {
  'tk-pref'(b) { cambiarPref({ teclado: Object.assign({}, preferencias().teclado, { [b.dataset.k]: b.dataset.v === '1' }) }); return true; },
  'tk-palabras'(b, ev, rp) { hojaPalabras(rp); },
  'nube-crear'(b, ev, rp) { hojaCrear(rp); },
  'nube-unir'(b, ev, rp) { hojaUnir(rp); },
  async 'nube-ahora'(b, ev, rp) { b.disabled = true; try { const r = await sincronizar('a mano'); aviso('☁️ Sincronizada' + (r && r.bajados ? ' · llegaron ' + plural(r.bajados, 'cambio', 'cambios') : '')); } catch (e) { aviso(mensajeError(e)); } rp(); },
  'nube-codigo'() {
    const cod = codigoDe(config());
    const h = abrirHoja('Código para otro aparato', '<p class="ayuda">Pégalo en el otro aparato en <b>Ajustes → Nube → Unir este aparato</b>.</p><textarea class="entrada mono codigo-nube" readonly>' + esc(cod) + '</textarea>' +
      '<p class="ayuda txt-aviso">⚠️ Lleva tu llave: no lo compartas con nadie.</p><div class="fila-botones"><button type="button" class="btn pri" id="copiarCodigo">Copiar</button></div>');
    h.querySelector('#copiarCodigo').addEventListener('click', () => { const t = h.querySelector('textarea'); t.select(); (navigator.clipboard ? navigator.clipboard.writeText(cod) : Promise.reject()).then(() => aviso('Código copiado'), () => { document.execCommand('copy'); aviso('Código copiado'); }); });
  },
  async 'nube-quitar'(b, ev, rp) {
    if (!(await confirmar({ titulo: '¿Desconectar este aparato?', texto: 'Deja de sincronizar aquí. No se borra nada, ni aquí ni en la nube. Puedes volver a unirlo con el código.', si: 'Desconectar', peligro: true }))) return;
    desconectar(); rp(); aviso('Este aparato ya no se sincroniza.');
  },
  async 'nube-antigua'(b, ev, rp) {
    if (!(await confirmar({ titulo: '¿Traer de la nube anterior?', texto: 'Se <b>leen</b> los 3 bins de la versión anterior (no se escribe nada en ellos), se guarda una copia, se verifica sin pérdidas y se junta con lo de aquí. Lo que ya tienes no se duplica.', si: 'Leer y juntar' }))) return;
    try { const r = await traerNubeAntigua(); rp(); aviso('Listo: ' + plural(r.nuevos, 'cosa nueva', 'cosas nuevas') + ' y ' + plural(r.actualizados, 'actualizada', 'actualizadas') + '.'); }
    catch (e) { aviso('No se trajo nada: ' + mensajeError(e)); }
  },
  'area-editar'(b, ev, rp) { editarArea(b.dataset.id, rp); },
  'etq-editar'(b, ev, rp) { editarEtiqueta(b.dataset.v, rp); },
  'cat-editar'(b, ev, rp) { editarCategoria(b.dataset.v, b.dataset.libro, rp); }
};
