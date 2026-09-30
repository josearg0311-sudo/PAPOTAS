(function(){
'use strict';

/* ==========================================================================
   DATOS
   Todo vive en el navegador, en una sola clave. Cada cosa (tarea, evento,
   nota...) lleva su `id` y la hora de su último cambio (`upd`). Borrar no
   la quita: la marca `del`. Así, al juntar lo de dos aparatos, gana siempre
   el cambio más reciente de cada cosa, y un borrado no resucita.
   ========================================================================== */
var CLAVE          = 'agenda_datos_v1';
var CLAVE_NUBE     = 'agenda_nube_cfg';       // { key, bin }
var CLAVE_AVISADOS = 'agenda_avisados';       // lo que ya sonó en ESTE aparato
var CLAVE_PREF     = 'agenda_pref';           // gustos de este aparato
var CLAVE_LEDGER   = 'ledger_finanzas_simple_v1';   // Gastos personales (lo de Cuentas de siempre)
var CLAVE_OFICINA  = 'ledger_oficina_v1';           // Cuentas de la oficina
var CLAVE_NUBE_CTA = 'libro_cuentas_db_cfg';
/* La agenda guarda su tema y su paleta aparte: tiene su propio estilo */
var CLAVE_TEMA     = 'agenda_tema';
var CLAVE_PALETA   = 'agenda_paleta';
var JSONBIN        = 'https://api.jsonbin.io/v3/b';
var MONEDA         = 'S/';
var COLS = ['tareas','listas','eventos','recordatorios','habitos','notas','enfoque','metas','pagos','diario','cursos','entrenos','medidas','cobros','proyectos','revisiones','deudas','rutinas','bienestar','horas','casa','menu','docs','fichas','clientes'];

var $ = function(id){ return document.getElementById(id); };

function leerJSON(k, def){ try{ var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; }catch(e){ return def; } }
function escribirJSON(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(e){ return false; } }

function docVacio(){
  var d = { v:1, perfil:{ nombre:'', upd:0 } };
  COLS.forEach(function(c){ d[c] = []; });
  return d;
}
function normalizar(d){
  var out = docVacio();
  if(!d || typeof d !== 'object') return out;
  if(d.perfil && typeof d.perfil === 'object'){
    out.perfil = { nombre:String(d.perfil.nombre || '').slice(0,40), upd:+d.perfil.upd || 0 };
    if(d.perfil.presu && typeof d.perfil.presu === 'object') out.perfil.presu = { personal:+d.perfil.presu.personal || 0, oficina:+d.perfil.presu.oficina || 0 };
    if(d.perfil.prefs && typeof d.perfil.prefs === 'object'){
      var pp = {};
      ['estatura', 'metaKm', 'hiit', 'feriados', 'hoyOff', 'lunes'].forEach(function(k){ if(k in d.perfil.prefs) pp[k] = d.perfil.prefs[k]; });
      out.perfil.prefs = pp;
    }
  }
  COLS.forEach(function(c){
    if(Array.isArray(d[c])) out[c] = d[c].filter(function(x){ return x && x.id; });
  });
  return out;
}

var db   = normalizar(leerJSON(CLAVE, null));
var pref = Object.assign({ lunes:true, sonido:true }, leerJSON(CLAVE_PREF, {}));
var avisados = leerJSON(CLAVE_AVISADOS, {});

function nid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function vivos(col){ return db[col].filter(function(x){ return !x.del; }); }
function buscarId(col, id){ return db[col].find(function(x){ return x.id === id; }); }

function guardarLocal(){
  if(typeof olvidarDias === 'function') olvidarDias();
  if(!escribirJSON(CLAVE, db)) aviso('No se pudo guardar', 'El almacenamiento del navegador está lleno o bloqueado.');
  if(typeof HIST !== 'undefined'){ HIST.estable = JSON.stringify(db); pintarHist(); }
}
function guardar(){
  if(typeof HIST !== 'undefined') anotarHistorial();
  guardarLocal();
  programarSubida();
}
/* Mete o actualiza una cosa, siempre con la hora del cambio */
function poner(col, obj){
  obj.upd = Date.now();
  var i = db[col].findIndex(function(x){ return x.id === obj.id; });
  if(i < 0) db[col].push(obj); else db[col][i] = obj;
  guardar();
  return obj;
}
var ultimoBorrado = null;
function quitar(col, id, nombre){
  var o = buscarId(col, id);
  if(!o) return;
  o.del = true; o.upd = o.delEn = Date.now();
  ultimoBorrado = { col:col, id:id };
  guardar();
  aviso((nombre || 'Borrado') + ' · está en la papelera', null, 'Deshacer', function(){
    var x = buscarId(col, id);
    if(x){ delete x.del; delete x.delEn; x.upd = Date.now(); guardar(); pintar(); }
  });
}

/* Junta dos copias: por cada cosa gana la que se tocó más tarde */
function fusionar(a, b){
  var out = docVacio();
  out.perfil = (+(b.perfil && b.perfil.upd) > +(a.perfil && a.perfil.upd)) ? b.perfil : a.perfil;
  var limite = Date.now() - 60 * 864e5;   // los borrados de hace más de 60 días ya no hacen falta
  COLS.forEach(function(c){
    var m = {};
    (a[c] || []).forEach(function(x){ m[x.id] = x; });
    (b[c] || []).forEach(function(x){ var y = m[x.id]; if(!y || (+x.upd || 0) > (+y.upd || 0)) m[x.id] = x; });
    out[c] = Object.keys(m).map(function(k){ return m[k]; })
                   .filter(function(x){ return !(x.del && (+x.upd || 0) < limite); });
  });
  return out;
}

/* ==========================================================================
   FECHAS
   Siempre en hora local y como texto AAAA-MM-DD: se comparan como texto,
   se guardan como texto y no hay zonas horarias que se cuelen.
   ========================================================================== */
var DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
var DIAS3 = ['dom','lun','mar','mié','jue','vie','sáb'];
var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var MESES3= ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function dos(n){ return (n < 10 ? '0' : '') + n; }
function iso(d){ return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); }
function hoyISO(){ return iso(new Date()); }
function deISO(s){ var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function sumarDias(s, n){ var d = deISO(s); d.setDate(d.getDate() + n); return iso(d); }
function diasEntre(a, b){ return Math.round((deISO(b) - deISO(a)) / 864e5); }
function horaAhora(){ var d = new Date(); return dos(d.getHours()) + ':' + dos(d.getMinutes()); }
function fechaLarga(s){ var d = deISO(s); return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
function fechaCorta(s){
  var d = deISO(s), t = d.getDate() + ' ' + MESES3[d.getMonth()];
  if(d.getFullYear() !== new Date().getFullYear()) t += ' ' + d.getFullYear();
  return t;
}
function relativo(s){
  if(!s) return '';
  var n = diasEntre(hoyISO(), s);
  if(n === 0) return 'Hoy';
  if(n === 1) return 'Mañana';
  if(n === -1) return 'Ayer';
  if(n > 1 && n < 7) return cap(DIAS[deISO(s).getDay()]);
  if(n < -1 && n > -7) return 'Hace ' + (-n) + ' días';
  return DIAS3[deISO(s).getDay()] + ' ' + fechaCorta(s);
}
function hora12(h){ return h || ''; }
function cap(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function inicioSemana(s){
  var d = deISO(s), w = d.getDay();
  var atras = pref.lunes ? (w + 6) % 7 : w;
  return sumarDias(s, -atras);
}

/* ---------- Repeticiones -------------------------------------------------- */
var REPS = { no:'No se repite', dia:'Cada día', lab:'De lunes a viernes', sem:'Cada semana', mes:'Cada mes', ano:'Cada año' };
var REPS_CORTO = { dia:'diario', lab:'laborables', sem:'semanal', mes:'mensual', ano:'anual' };

function ocurre(base, rep, dia, hasta){
  if(!base) return false;
  if(dia === base) return true;
  if(dia < base) return false;
  if(!rep || rep === 'no') return !!hasta && dia <= hasta;
  var d = deISO(dia), b = deISO(base);
  switch(rep){
    case 'dia': return true;
    case 'lab': return d.getDay() > 0 && d.getDay() < 6;
    case 'sem': return d.getDay() === b.getDay();
    case 'mes': return d.getDate() === b.getDate();
    case 'ano': return d.getDate() === b.getDate() && d.getMonth() === b.getMonth();
  }
  return false;
}
function siguiente(fecha, rep){
  var d = deISO(fecha);
  switch(rep){
    case 'dia': d.setDate(d.getDate() + 1); break;
    case 'lab': do{ d.setDate(d.getDate() + 1); }while(d.getDay() === 0 || d.getDay() === 6); break;
    case 'sem': d.setDate(d.getDate() + 7); break;
    case 'mes':
      var dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1);
      var fin = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(dia, fin)); break;
    case 'ano': d.setFullYear(d.getFullYear() + 1); break;
    default: return fecha;
  }
  return iso(d);
}
/* Próxima vez que toca, contando desde `desde` inclusive */
function proximaDesde(base, rep, desde){
  if(!base) return '';
  if(base >= desde || !rep || rep === 'no') return base;
  for(var i = 0; i < 800; i++){
    var d = sumarDias(desde, i);
    if(ocurre(base, rep, d)) return d;
  }
  return '';
}

/* ---------- Utilidades --------------------------------------------------- */
function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function ico(id, cls){ return '<svg class="i' + (cls ? ' ' + cls : '') + '"><use href="#' + id + '"/></svg>'; }
var FMT_DINERO = new Intl.NumberFormat('es-PE', { minimumFractionDigits:2, maximumFractionDigits:2 });
var FMT_NUM = new Intl.NumberFormat('es-PE', { maximumFractionDigits:2 });
function dinero(v){
  return (v < 0 ? '−' : '') + MONEDA + ' ' + FMT_DINERO.format(Math.abs(v));
}
function sinTildes(s){
  return String(s || '').toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n');
}
var CHECK = ico('i-check');

var COLORES = {
  acento:'var(--verde)', verde:'var(--haber)', rojo:'var(--debe)', oro:'var(--oro)', azul:'var(--azul)', rosa:'var(--rosa)'
};
function color(k){ return COLORES[k] || COLORES.acento; }
var PRIOS = [
  { n:'Sin prioridad', c:'var(--tinta-3)' },
  { n:'Baja',  c:'var(--azul)' },
  { n:'Media', c:'var(--oro)' },
  { n:'Alta',  c:'var(--debe)' }
];
var AREAS_BASE = ['Personal','Trabajo','Casa','Salud','Estudios','Dinero'];

/* ==========================================================================
   ENTENDER LO QUE ESCRIBES
   "Llamar al banco mañana a las 5" → tarea «Llamar al banco», mañana, 17:00.
   Se busca sobre una copia en minúsculas y sin tildes que tiene EXACTAMENTE
   la misma longitud que el original, así lo encontrado se puede recortar
   del texto de verdad sin perder mayúsculas ni tildes.
   ========================================================================== */
var DIAS_N = { domingo:0, lunes:1, martes:2, miercoles:3, jueves:4, viernes:5, sabado:6 };
var MESES_N = { enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6, julio:7, agosto:8, septiembre:9, setiembre:9, octubre:10, noviembre:11, diciembre:12 };

function interpretar(texto){
  var orig = ' ' + texto + ' ';
  var bajo = sinTildes(orig);
  var fecha = '', hora = '', prio = 0, area = '';
  var hoy = hoyISO();

  function cortar(m){
    var i = m.index, n = m[0].length;
    orig = orig.slice(0, i) + ' '.repeat(n) + orig.slice(i + n);
    bajo = bajo.slice(0, i) + ' '.repeat(n) + bajo.slice(i + n);
  }
  function buscar(re){ var m = re.exec(bajo); if(m) cortar(m); return m; }

  var m, parte = '';
  /* Primero lo que modifica la hora, para que "de la mañana" no se lea como el día */
  if((m = buscar(/\s(?:de la|por la) (manana|tarde|noche)(?=\s)/))) parte = m[1];
  if((m = buscar(/\s(?:al )?mediodia(?=\s)/))) hora = '12:00';

  if(buscar(/\spasado manana(?=\s)/)) fecha = sumarDias(hoy, 2);
  else if(buscar(/\smanana(?=\s)/)) fecha = sumarDias(hoy, 1);
  else if(buscar(/\shoy(?=\s)/)) fecha = hoy;
  else if((m = buscar(/\sen (\d{1,3}) (dia|dias|semana|semanas|mes|meses)(?=\s)/))){
    var k = +m[1], u = m[2];
    if(u.indexOf('dia') === 0) fecha = sumarDias(hoy, k);
    else if(u.indexOf('semana') === 0) fecha = sumarDias(hoy, 7 * k);
    else { var dm = deISO(hoy); dm.setMonth(dm.getMonth() + k); fecha = iso(dm); }
  }
  else if(buscar(/\sen una semana(?=\s)/)) fecha = sumarDias(hoy, 7);
  else if((m = buscar(/\s(?:el |este |esta |proximo |el proximo |la proxima )?(lunes|martes|miercoles|jueves|viernes|sabado|domingo)(?=\s)/))){
    var obj = DIAS_N[m[1]], w = deISO(hoy).getDay();
    var falta = (obj - w + 7) % 7 || 7;
    fecha = sumarDias(hoy, falta);
  }
  else if((m = buscar(/\s(?:el )?(\d{1,2}) de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?: de (\d{4}))?(?=\s)/))){
    fecha = armarFecha(+m[1], MESES_N[m[2]], m[3] ? +m[3] : 0);
  }
  else if((m = buscar(/\s(?:el )?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?(?=\s)/))){
    var an = m[3] ? +m[3] : 0; if(an && an < 100) an += 2000;
    fecha = armarFecha(+m[1], +m[2], an);
  }

  function armarFecha(d, mes, an){
    if(mes < 1 || mes > 12 || d < 1 || d > 31) return '';
    var y = an || new Date().getFullYear();
    var f = y + '-' + dos(mes) + '-' + dos(d);
    if(!an && f < hoy) f = (y + 1) + '-' + dos(mes) + '-' + dos(d);
    return f;
  }

  /* La hora: "a las 5", "a las 17:30", "5pm", "9:15", "18h" */
  if(!hora){
    if((m = buscar(/\s(?:a las?|alas|sobre las) (\d{1,2})(?::(\d{2}))?\s?(am|pm|a\.m\.|p\.m\.|h|hs|hrs)?(?=\s)/))){
      hora = armarHora(+m[1], m[2] ? +m[2] : 0, m[3], true);
    } else if((m = buscar(/\s(\d{1,2}):(\d{2})\s?(am|pm|a\.m\.|p\.m\.|h|hs|hrs)?(?=\s)/))){
      hora = armarHora(+m[1], +m[2], m[3], false);
    } else if((m = buscar(/\s(\d{1,2})\s?(am|pm|a\.m\.|p\.m\.|h|hs|hrs)(?=\s)/))){
      hora = armarHora(+m[1], 0, m[2], false);
    }
  }
  function armarHora(h, mi, suf, adivinar){
    suf = (suf || '').replace(/\./g,'');
    if(h > 23 || mi > 59) return '';
    if(suf === 'pm' && h < 12) h += 12;
    else if(suf === 'am' && h === 12) h = 0;
    else if(!suf || suf.charAt(0) === 'h'){
      if(parte === 'tarde' || parte === 'noche'){ if(h < 12) h += 12; }
      else if(parte !== 'manana' && adivinar && h >= 1 && h <= 7) h += 12;   // "a las 5" casi siempre es de la tarde
    }
    return dos(h) + ':' + dos(mi);
  }

  /* Prioridad con signos de exclamación, área con almohadilla */
  if((m = buscar(/\s(!{1,3})(?=\s)/))) prio = m[1].length;
  if((m = /\s#([\wáéíóúñü]+)(?=\s)/i.exec(orig))){ area = cap(m[1]); cortar(m); }

  /* Solo la hora: hoy si aún no ha pasado; si ya pasó, mañana */
  if(hora && !fecha) fecha = hora > horaAhora() ? hoy : sumarDias(hoy, 1);

  var limpio = orig.replace(/\s+/g, ' ').trim()
                   .replace(/\s+(el|la|a|para|de|en|y)$/i, '')
                   .replace(/^(el|la|para)\s+/i, '');
  var esp = espDeTexto(area);
  if(esp) area = '';
  return { texto:limpio, fecha:fecha, hora:hora, prio:prio, area:area, esp:esp };
}

/* ==========================================================================
   LO QUE TOCA CADA DÍA
   Junta en una sola lista los eventos, los recordatorios, las tareas y los
   pagos de un día, con su hora, para pintarlos igual en Hoy y en el
   Calendario.
   ========================================================================== */
function momentoR(r){ return r.pospuesto || (r.fecha + 'T' + (r.hora || '09:00')); }

/* Día del mes en que vence un pago (el 31 en febrero es el 28) */
function diaPago(p, ym){
  var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
  var fin = new Date(y, m, 0).getDate();
  return ym + '-' + dos(Math.min(+p.dia || 1, fin));
}
function pagado(p, ym){ return !!(p.pagados && p.pagados[ym]); }
function edadCumple(e, dia){ return 0; }   // la edad en los cumpleaños se quitó

/* Lo de cada día se calcula una vez y se reutiliza hasta el siguiente
   cambio: el calendario y Hoy piden los mismos días muchas veces. */
var memoDia = {};
function olvidarDias(){ memoDia = {}; }
function itemsDelDia(dia){
  if(memoDia[dia]) return memoDia[dia].slice();
  var out = calcularDia(dia);
  memoDia[dia] = out;
  return out.slice();
}
function calcularDia(dia){
  var out = [];
  vivos('eventos').forEach(function(e){
    if(ocurre(e.fecha, e.rep, dia, e.hasta)){
      var t = e.cumple ? '🎂 ' + e.t + (edadCumple(e, dia) > 0 ? ' (' + edadCumple(e, dia) + ')' : '') : e.t;
      out.push({ tipo:'evento', id:e.id, t:t, hora:e.todo ? '' : (e.ini || ''), fin:e.todo ? '' : (e.fin || ''),
                 c:e.cumple ? 'var(--rosa)' : (e.color && e.color !== 'esp' ? color(e.color) : colorEsp(e)), lugar:e.lugar || '', esp:espDe(e), o:e });
    }
  });
  vivos('recordatorios').forEach(function(r){
    var toca = r.hecho ? r.fecha === dia : ocurre(r.fecha, r.rep, dia);
    if(toca) out.push({ tipo:'rec', id:r.id, t:r.t, hora:r.hora || '09:00', c:colorEsp(r), hecho:!!r.hecho && !r.rep, esp:espDe(r), o:r });
  });
  vivos('tareas').forEach(function(t){
    if(t.fecha === dia) out.push({ tipo:'tarea', id:t.id, t:t.t, hora:t.hora || '', c:PRIOS[t.prio || 0].c, hecho:!!t.hecha, esp:espDe(t), o:t });
  });
  var ym = dia.slice(0, 7);
  vivos('pagos').forEach(function(p){
    if(p.activo === false || (p.desde && ym < p.desde)) return;
    if(diaPago(p, ym) === dia) out.push({ tipo:'pago', id:p.id, t:(p.em ? p.em + ' ' : '') + p.t, hora:'', c:'var(--oro)', hecho:pagado(p, ym), ym:ym, esp:espDe(p), o:p });
  });
  out = out.concat(clasesDelDia(dia));
  out.sort(function(a, b){
    if(!a.hora !== !b.hora) return a.hora ? 1 : -1;       // lo de todo el día, arriba
    return (a.hora || '').localeCompare(b.hora || '') || a.t.localeCompare(b.t);
  });
  return out;
}

function tareasPendientesHoy(){
  var hoy = hoyISO();
  return vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; });
}
function recordatoriosVencidos(){
  var ya = hoyISO() + 'T' + horaAhora();
  return vivos('recordatorios').filter(function(r){ return !r.hecho && r.fecha && momentoR(r) <= ya; });
}
/* Pagos sin pagar que vencen en los próximos `dias` (o ya vencieron este mes) */
function pagosProximos(dias){
  var hoy = hoyISO(), lim = sumarDias(hoy, dias), out = [];
  [hoy.slice(0, 7), sumarDias(hoy.slice(0, 7) + '-28', 7).slice(0, 7)].forEach(function(ym){
    vivos('pagos').forEach(function(p){
      if(p.activo === false || (p.desde && ym < p.desde) || pagado(p, ym)) return;
      var d = diaPago(p, ym);
      if(d <= lim && (d >= hoy || ym === hoy.slice(0, 7))) out.push({ p:p, ym:ym, dia:d });
    });
  });
  return out.sort(function(a, b){ return a.dia.localeCompare(b.dia); });
}
function proximosCumples(dias){
  var hoy = hoyISO(), out = [];
  vivos('eventos').forEach(function(e){
    if(!e.cumple) return;
    for(var i = 0; i <= dias; i++){
      var d = sumarDias(hoy, i);
      if(ocurre(e.fecha, 'ano', d)){ out.push({ e:e, dia:d, en:i }); break; }
    }
  });
  return out.sort(function(a, b){ return a.en - b.en; });
}

/* Cuentas guarda sus movimientos en el mismo navegador: se leen de ahí */
var memoMovs = {};
function movimientos(clave){
  clave = clave || CLAVE_LEDGER;
  var texto = null; try{ texto = localStorage.getItem(clave); }catch(e){}
  var c = memoMovs[clave];
  if(!c || c.texto !== texto){
    var raw = null; try{ raw = texto ? JSON.parse(texto) : null; }catch(e){}
    var l = raw && Array.isArray(raw.transactions) ? raw.transactions : (Array.isArray(raw) ? raw : []);
    c = memoMovs[clave] = { texto:texto, l:l.filter(function(t){ return t && /^\d{4}-\d{2}-\d{2}$/.test(t.date); }) };
  }
  return c.l.slice();
}

/* ==========================================================================
   NAVEGACIÓN
   ========================================================================== */
var SECCIONES = [
  { id:'hoy',           nom:'Hoy',           ico:'i-hoy' },
  { id:'esp-personal',  nom:'Personal',      ico:'i-casa',    g:'Espacios', esp:'personal' },
  { id:'esp-estudios',  nom:'Estudios',      ico:'i-birrete', esp:'estudios' },
  { id:'esp-oficina',   nom:'Oficina',       ico:'i-maletin', esp:'oficina' },
  { id:'esp-deporte',   nom:'Deporte',       ico:'i-balon',   esp:'deporte' },
  /* Cinco secciones y, dentro de cada una, sus pestañas (las «hijas») */
  /* Agenda junta el día, el calendario, las tareas, los proyectos y los avisos */
  { id:'agenda',        nom:'Agenda',        ico:'i-cal',     g:'Organizar' },
  { id:'calendario',    nom:'Calendario',    corto:'Mes', ico:'i-cal', padre:'agenda', oculta:true },
  { id:'tareas',        nom:'Tareas',        ico:'i-tareas',  padre:'agenda', oculta:true },
  { id:'proyectos',     nom:'Proyectos',     ico:'i-carpeta', padre:'agenda', oculta:true },
  { id:'recordatorios', nom:'Avisos',        corto:'Avisos', ico:'i-campana', padre:'agenda', oculta:true },
  { id:'notas',         nom:'Notas',         ico:'i-notas' },
  { id:'listas',        nom:'Listas',        ico:'i-listas', padre:'notas', oculta:true },
  { id:'habitos',       nom:'Hábitos',       ico:'i-habitos' },
  { id:'metas',         nom:'Metas',         ico:'i-meta', padre:'habitos', oculta:true },
  { id:'diario',        nom:'Diario',        ico:'i-diario', padre:'habitos', oculta:true },
  { id:'dinero',        nom:'Dinero',        ico:'i-grafica' },
  { id:'movimientos',   nom:'Movimientos',   corto:'Movimientos', ico:'i-cuentas', padre:'dinero', oculta:true },
  { id:'pagos',         nom:'Pagos fijos',   corto:'Pagos', ico:'i-recibo', padre:'dinero', oculta:true },
  { id:'personal',      nom:'Libro personal', movil:'Gastos personales', corto:'Personal', ico:'i-cuentas', padre:'dinero', oculta:true },
  { id:'oficina',       nom:'Libro de oficina', movil:'Oficina', corto:'Oficina', ico:'i-maletin', padre:'dinero', oculta:true },
  /* Enfoque vive dentro de Estudios (se abre con «Estudiar ahora») */
  { id:'foco',          nom:'Enfoque',       ico:'i-reloj', oculta:true },
  { id:'papelera',      nom:'Papelera',      ico:'i-basura', oculta:true },
  /* Paneles de inicio: lo que abre cada botón de la barra de abajo */
  { id:'panel-agenda',  nom:'Agenda',        ico:'i-cal',     oculta:true },
  { id:'panel-dinero',  nom:'Dinero',        ico:'i-grafica', oculta:true },
  { id:'panel-notas',   nom:'Notas',         ico:'i-notas',   oculta:true },
  { id:'panel-mas',     nom:'Más',           ico:'i-mas',     oculta:true },
  { id:'secciones',     nom:'Administrar secciones', movil:'Secciones', ico:'i-espacios', oculta:true }
];
/* Las pestañas de cada sección: la madre primero y luego sus hijas */
var PEST_GRUPO = {
  agenda:     [['agenda','Días'], ['calendario','Mes'], ['tareas','Tareas'], ['recordatorios','Avisos'], ['proyectos','Proyectos']],
  notas:      [['notas','Notas'], ['listas','Listas']],
  habitos:    [['habitos','Hábitos'], ['metas','Metas'], ['diario','Diario']],
  dinero:     [['dinero','Resumen'], ['movimientos','Movimientos'], ['pagos','Pagos']]
};
function secPadre(v){ var s = SECCIONES.find(function(x){ return x.id === v; }); return s && s.padre ? s.padre : v; }
function pestanasGrupo(v){
  var g = PEST_GRUPO[secPadre(v)];
  if(!g) return '';
  var k = contadores();
  var num = { recordatorios:k.recordatorios, pagos:k.pagos };
  return '<nav class="pest-grupo" aria-label="Pestañas">' + g.map(function(p){
    return '<button type="button" data-ir="' + p[0] + '"' + (p[0] === v ? ' aria-current="page"' : '') + '>' + p[1] +
      (num[p[0]] ? '<span class="pg-n">' + num[p[0]] + '</span>' : '') + '</button>';
  }).join('') + '</nav>';
}
/* Cada sección con su grupo (el grupo lo marca la primera de cada uno) */
var GRUPO_DE = {}, GRUPOS = [''];
(function(){ var g = ''; SECCIONES.forEach(function(s){ if(s.oculta) return; if(s.g){ g = s.g; GRUPOS.push(g); } GRUPO_DE[s.id] = g; }); })();
var FIJAS = ['hoy'];   // no se pueden ocultar
function secOculta(id){ return (pref.secOff || []).indexOf(id) >= 0 && FIJAS.indexOf(id) < 0; }
/* Las secciones del menú en el orden y con lo que elegiste mostrar.
   Los grupos se quedan en su sitio; dentro de cada uno manda tu orden. */
function navSecs(todas){
  var orden = pref.secOrden || [];
  function pos(s){ var i = orden.indexOf(s.id); return i < 0 ? 1000 + SECCIONES.indexOf(s) : i; }
  var out = [];
  GRUPOS.forEach(function(g){
    SECCIONES.filter(function(s){ return !s.oculta && GRUPO_DE[s.id] === g && (todas || !secOculta(s.id)); })
      .sort(function(a, b){ return pos(a) - pos(b); })
      .forEach(function(s, i){ var c = Object.assign({}, s); delete c.g; if(!i && g) c.g = g; out.push(c); });
  });
  return out;
}
/* En el móvil: cuatro botones abajo (tú eliges cuáles) y "Todo" */
var ABAJO = ['hoy','agenda','dinero','notas'];
/* La barra nueva (Hoy · Agenda · Dinero · Notas · Más) reemplaza una vez la que tenías */
if(pref.abajoV !== 3){ delete pref.abajo; pref.abajoV = 3; escribirJSON(CLAVE_PREF, pref); }
function abajoValido(id){ return id === 'espacios' || SECCIONES.some(function(s){ return s.id === id && !s.oculta && !s.esp; }); }
function barraAbajo(){
  var a = Array.isArray(pref.abajo) ? pref.abajo.filter(abajoValido).slice(0, 4) : null;
  return a && a.length ? a : ABAJO;
}
/* A qué panel pertenece cada pantalla (para volver y para la barra de abajo) */
function panelDe(v){
  if(!v) return '';
  if(v.indexOf('panel-') === 0) return v;
  var p = secPadre(v);
  if(p === 'agenda') return 'panel-agenda';
  if(p === 'dinero') return 'panel-dinero';
  if(p === 'notas') return 'panel-notas';
  if(p === 'habitos' || v.indexOf('esp-') === 0 || v === 'ajustes' || v === 'secciones' || v === 'papelera') return 'panel-mas';
  return '';
}
function esLibro(v){ return false; }   // los libros se muestran dentro de la agenda

var ui = {
  vista:'hoy', antes:'', tFiltro:'hoy', tArea:'',
  calMes:hoyISO().slice(0,7), calSel:hoyISO(), calModo:'mes',
  lista:null, notasQ:'', capTipo:'tarea', verHechos:false,
  pagosMes:hoyISO().slice(0,7), diarioDia:hoyISO(),
  dinLibro:'todo', qaLibro:'personal', qaTipo:'Gasto',
  tEsp:'', calEsp:'', espUlt:'personal', capEsp:'', qaCatPre:''
};

function contadores(){
  return {
    tareas: tareasPendientesHoy().length,
    tareasTarde: tareasPendientesHoy().filter(function(t){ return t.fecha < hoyISO(); }).length,
    recordatorios: recordatoriosVencidos().length,
    pagos: pagosProximos(0).length
  };
}

function nomCorto(s){ return s.corto || s.movil || s.nom; }
function navPlegados(){ return pref.navPlegado || []; }
/* Cambia el contenido solo si es distinto: el menú no se redibuja entero
   cada vez que se pinta una sección */
function ponerSiCambia(el, html){ if(el.__html !== html){ el.innerHTML = html; el.__html = html; } }
function pintarNav(){
  var k = contadores();
  function num(id){ return id === 'tareas' || id === 'agenda' ? k.tareas : id === 'calendario' ? k.recordatorios : id === 'dinero' ? k.pagos : 0; }
  var vPadre = secPadre(ui.vista);
  var grupoNav = '';
  var SNAV = navSecs();
  ponerSiCambia($('navLat'), SNAV.map(function(s){
    var n = num(s.id);
    var alerta = (s.id === 'tareas' && k.tareasTarde) || ((s.id === 'calendario' || s.id === 'dinero') && n);
    var enEsp = s.esp ? ' class="nav-esp" style="--c:' + espInfo(s.esp).c + '"' : '';
    if(s.esp) n = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoyISO() && espDe(t) === s.esp; }).length;
    if(s.g) grupoNav = s.g;
    var plegado = navPlegados().indexOf(grupoNav) >= 0;
    var abre = s.g ? '<button type="button" class="grupo" data-acc="nav-plegar" data-v="' + s.g + '" aria-expanded="' + !plegado + '">' + s.g + ico('i-der') + '</button>' + (plegado ? '<div class="nav-iconos">' : '') : '';
    var sig = SNAV[SNAV.indexOf(s) + 1], cierra = plegado && (!sig || sig.g) ? '</div>' : '';
    if(plegado) return abre + '<button type="button" class="nav-ico" data-ir="' + s.id + '" title="' + s.nom + '" aria-label="' + s.nom + '"' + (vPadre === s.id ? ' aria-current="page"' : '') + '>' + ico(s.ico) + (n ? '<span class="punto-nav' + (alerta ? ' alerta' : '') + '"></span>' : '') + '</button>' + cierra;
    return abre +
      ('<button type="button"' + enEsp + ' data-ir="' + s.id + '"' + (vPadre === s.id ? ' aria-current="page"' : '') + '>' +
        ico(s.ico) + s.nom + (n ? '<span class="cuenta' + (alerta ? ' alerta' : '') + '">' + n + '</span>' : '') +
      '</button>');
  }).join(''));
  var DINERO = ['dinero','personal','oficina','pagos'], AB = barraAbajo();
  var enEsp = ui.vista.indexOf('esp-') === 0;
  if(enEsp) ui.espUlt = ui.vista.slice(4);
  var PANEL_DE_BOTON = { agenda:'panel-agenda', dinero:'panel-dinero', notas:'panel-notas' };
  function activoAbajo(id){
    if(PANEL_DE_BOTON[id]) return panelDe(ui.vista) === PANEL_DE_BOTON[id];
    return ui.vista === id || (AB.indexOf(ui.vista) < 0 && vPadre === id) || (id === 'espacios' && enEsp);
  }
  var enMas = ui.vista !== 'hoy' && !AB.some(activoAbajo);
  $('barraInf').style.gridTemplateColumns = 'repeat(' + (AB.length + 1) + ',minmax(0,1fr))';
  var otros = (AB.indexOf('calendario') < 0 && AB.indexOf('agenda') < 0 ? k.recordatorios : 0) + (AB.indexOf('dinero') < 0 ? k.pagos : 0);
  ponerSiCambia($('barraInf'), AB.map(function(id){
    var s = id === 'espacios' ? { nom:'Espacios', ico:'i-espacios' } : SECCIONES.find(function(x){ return x.id === id; });
    var destino = id === 'espacios' ? 'esp-' + (ui.espUlt || 'personal') : (PANEL_DE_BOTON[id] || id);
    var n = id === 'espacios' ? k.tareas : num(id);
    return '<button type="button" data-ir="' + destino + '"' + (activoAbajo(id) ? ' aria-current="page"' : '') + '>' +
             ico(s.ico) + nomCorto(s) + (n ? '<span class="globo">' + n + '</span>' : '') + '</button>';
  }).join('') +
  '<button type="button" data-ir="panel-mas"' + (enMas ? ' aria-current="page"' : '') + '>' + ico('i-mas') + 'Más' +
    (otros ? '<span class="globo">' + otros + '</span>' : '') + '</button>');
  var nom = db.perfil.nombre || '';
  $('avatar').textContent = nom ? nom.trim().charAt(0).toUpperCase() : '✦';
  $('perfilNombre').textContent = nom || 'Tu agenda';
  document.querySelectorAll('.lateral .pie [data-ir]').forEach(function(b){
    if(ui.vista === 'ajustes') b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  $('marcaNombre').textContent = db.perfil.nombre ? 'de ' + db.perfil.nombre : 'Mi organización';
}

function ir(v, sinHash){
  /* Si justo se está deshaciendo el paso de una hoja, se va después */
  if(ignorarPop && !sinHash){ irPendiente = v; return; }
  /* Los libros ya no se abren aparte: sus movimientos viven en Dinero → Movimientos */
  if(v === 'cuentas' || v === 'personal' || v === 'oficina'){ ui.movLibro = v === 'oficina' ? 'oficina' : 'personal'; ui.movCat = ''; v = 'movimientos'; }
  if(v === 'progreso' || v === 'revision' || v === 'foco'){ v = 'hoy'; try{ history.replaceState(null, '', '#hoy'); }catch(e){} }   // secciones que ya no existen
  if(v !== 'ajustes' && !SECCIONES.some(function(s){ return s.id === v; })) v = 'hoy';
  if(v !== 'listas') ui.lista = null;
  if(v !== 'proyectos') ui.proy = null;
  if(v !== ui.vista) ui.sel = null;
  ui.vista = v;
  if(!sinHash && location.hash !== '#' + v){
    /* Si había una hoja abierta, su paso en el historial se reutiliza */
    try{ history[hojaEnHist ? 'replaceState' : 'pushState'](null, '', '#' + v); }catch(e){ location.hash = v; }
    hojaEnHist = false;
  }
  cerrarFlotante();
  if(!NAV.moviendo) NAV.yTomada = window.scrollY || 0;   // la altura de la pantalla que dejas, antes de subir
  window.scrollTo(0, 0);   // antes de cambiar el contenido: así no obliga a recalcular la página nueva
  pintar();
}

/* Si estás escribiendo en la página, no se repinta por debajo: perderías
   lo escrito. Se espera a que sueltes el campo. */
var repintarAlSoltar = false;
function pintarSeguro(){
  var a = document.activeElement;
  if(a && $('contenido').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)){ repintarAlSoltar = true; return; }
  pintar();
}

/* ==========================================================================
   ATRÁS Y ADELANTE ENTRE PANTALLAS
   Como en un navegador, pero dentro de la agenda: cada pantalla que visitas
   (una sección, la pestaña de un espacio, una lista, un proyecto) queda
   anotada con hasta dónde habías bajado. ‹ vuelve a la anterior y › a la
   siguiente. En el celular también se desliza desde el borde.
   ========================================================================== */
var NAV = { atras:[], adelante:[], clave:null, foto:null, moviendo:false };
function fotoPantalla(){
  var v = ui.vista, e = v.indexOf('esp-') === 0 ? v.slice(4) : '';
  return { v:v, lista:v === 'listas' ? ui.lista || null : null, proy:v === 'proyectos' ? ui.proy || null : null,
           esp:e, tab:e ? tabEsp(e) : '', y:0 };
}
function clavePantalla(f){ return [f.v, f.lista || '', f.proy || '', f.tab || ''].join('|'); }
function anotarPantalla(){
  var f = fotoPantalla(), k = clavePantalla(f);
  if(NAV.clave !== null && k !== NAV.clave && !NAV.moviendo && NAV.foto){
    if(NAV.yTomada == null) NAV.yTomada = window.scrollY || 0;
    NAV.foto.y = NAV.yTomada;   // hasta dónde bajaste en la que dejas
    NAV.atras.push(NAV.foto);
    if(NAV.atras.length > 60) NAV.atras.shift();
    NAV.adelante = [];
  }
  NAV.clave = k; NAV.foto = f; NAV.yTomada = null;
  pintarPasos();
}
function pintarPasos(){
  var a = $('btnAtras'), d = $('btnAdelante');
  if(!a) return;
  a.disabled = !NAV.atras.length; d.disabled = !NAV.adelante.length;
  var ant = NAV.atras[NAV.atras.length - 1], sig = NAV.adelante[NAV.adelante.length - 1];
  a.title = ant ? 'Volver a ' + nombrePantalla(ant) + ' (Alt+←)' : 'Pantalla anterior';
  d.title = sig ? 'Ir a ' + nombrePantalla(sig) + ' (Alt+→)' : 'Pantalla siguiente';
  document.body.classList.toggle('con-pasos', !!(NAV.atras.length || NAV.adelante.length));
}
function nombrePantalla(f){
  var s = SECCIONES.find(function(x){ return x.id === f.v; }), n = f.v === 'ajustes' ? 'Ajustes' : s ? s.nom : f.v;
  if(f.esp){ var p = PESTANAS[f.esp].find(function(x){ return x[0] === f.tab; }); if(p && p[0] !== 'inicio') n += ' · ' + p[1]; }
  if(f.lista){ var l = buscarId('listas', f.lista); if(l && !l.del) n = l.nombre || n; }
  if(f.proy){ var pr = buscarId('proyectos', f.proy); if(pr && !pr.del) n = pr.nombre || n; }
  return n;
}
function iconoPantalla(f){
  var s = SECCIONES.find(function(x){ return x.id === f.v; });
  return f.esp ? espInfo(f.esp).em : ico(s ? s.ico : 'i-ajustes');
}
/* d = -1 atrás, 1 adelante; n = cuántos pasos; sinHash si ya lo movió el navegador */
function pasoNav(d, n, sinHash){
  n = n || 1;
  var de = d < 0 ? NAV.atras : NAV.adelante, a = d < 0 ? NAV.adelante : NAV.atras;
  if(de.length < n) return false;
  NAV.foto.y = window.scrollY || 0;
  a.push(NAV.foto);
  for(var i = 1; i < n; i++) a.push(de.pop());
  var f = de.pop();
  NAV.moviendo = true; ui.dir = d;
  try{
    cerrarFlotante();
    if(f.esp){ ui.espTab = ui.espTab || {}; ui.espTab[f.esp] = f.tab; }
    ui.lista = f.lista; ui.proy = f.proy;
    ir(f.v, sinHash);
  } finally { NAV.moviendo = false; }
  NAV.clave = clavePantalla(fotoPantalla()); NAV.foto = fotoPantalla();
  pintarPasos();
  var y = f.y || 0;
  requestAnimationFrame(function(){ window.scrollTo(0, y); });
  return true;
}
/* Mantener pulsado ‹ (o clic derecho): la lista de pantallas recientes */
function hojaHistorialNav(){
  var at = NAV.atras.slice().reverse().slice(0, 12), ad = NAV.adelante.slice().reverse().slice(0, 6);
  if(!at.length && !ad.length) return;
  function fila(f, d, n){
    return '<button type="button" data-acc="nav-saltar" data-d="' + d + '" data-n="' + n + '"><span class="nav-hist-ico">' + iconoPantalla(f) + '</span><span><b>' + esc(nombrePantalla(f)) + '</b><small>' + (d < 0 ? (n === 1 ? 'La anterior' : 'Hace ' + n + ' pantallas') : (n === 1 ? 'La siguiente' : n + ' más adelante')) + '</small></span></button>';
  }
  abrirFlotante(cabFlot('Pantallas recientes') + '<div class="menu-lista nav-hist">' +
    ad.map(function(f, i){ return fila(f, 1, ad.length - i); }).join('') +
    '<div class="nav-hist-aqui"><span class="nav-hist-ico">' + iconoPantalla(NAV.foto) + '</span><b>' + esc(nombrePantalla(NAV.foto)) + '</b><small>Estás aquí</small></div>' +
    at.map(function(f, i){ return fila(f, -1, i + 1); }).join('') + '</div>');
}
/* Las hojas se cierran arrastrándolas hacia abajo desde su parte de arriba */
(function(){
  var hoja = null, y0 = 0, dy = 0;
  document.addEventListener('touchstart', function(ev){
    var h = ev.target.closest && ev.target.closest('.hoja-flot');
    hoja = null;
    if(!h || ev.touches.length !== 1) return;
    var r = h.getBoundingClientRect();
    if(ev.touches[0].clientY - r.top > 64 || ev.target.closest('input,textarea,select')) return;   // solo desde el asa y la cabecera
    hoja = h; y0 = ev.touches[0].clientY; dy = 0;
  }, { passive:true });
  document.addEventListener('touchmove', function(ev){
    if(!hoja) return;
    dy = Math.max(0, ev.touches[0].clientY - y0);
    hoja.style.transition = 'none'; hoja.style.transform = 'translateY(' + dy + 'px)';
  }, { passive:true });
  document.addEventListener('touchend', function(){
    if(!hoja) return;
    var h = hoja; hoja = null;
    h.style.transition = ''; 
    if(dy > 90){ h.style.transform = 'translateY(100%)'; setTimeout(cerrarFlotante, 160); }
    else h.style.transform = '';
  }, { passive:true });
})();

/* Deslizar el contenido de lado cambia de pestaña (Tareas y los espacios) */
(function(){
  var x0 = 0, y0 = 0, t0 = 0, vale = false;
  document.addEventListener('touchstart', function(ev){
    vale = false;
    if(ev.touches.length !== 1 || $('capaFlotante').innerHTML || ui.sel) return;
    var t = ev.target;
    if(!t.closest || !t.closest('#contenido') || t.closest('.fila[data-fila],[data-desliza],.desliza,.segmento,.esp-tabs,input,textarea,.espacios-carrusel,.franja-semana,.w-habs,.hab-tabla,.regresivas')) return;
    x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; t0 = Date.now();
    vale = x0 > 28 && x0 < innerWidth - 28;
  }, { passive:true });
  document.addEventListener('touchend', function(ev){
    if(!vale) return;
    vale = false;
    var tc = ev.changedTouches[0], dx = tc.clientX - x0, dy = tc.clientY - y0;
    if(Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - t0 > 600) return;
    var paso = dx < 0 ? 1 : -1;
    if(ui.vista === 'tareas'){
      var ks = ['hoy','prox','todas','algun','hechas'], i = ks.indexOf(ui.tFiltro) + paso;
      if(i >= 0 && i < ks.length){ ui.tFiltro = ks[i]; ui.dir = paso; ui.antes = ''; pintar(); }
    } else if(ui.vista.indexOf('esp-') === 0){
      var e = ui.vista.slice(4), ps = PESTANAS[e].map(function(p){ return p[0]; }), j = ps.indexOf(tabEsp(e)) + paso;
      if(j >= 0 && j < ps.length){ ui.espTab = ui.espTab || {}; ui.espTab[e] = ps[j]; ui.dir = paso; ui.antes = ''; pintar(); }
    }
  }, { passive:true });
})();

/* Deslizar desde el borde: desde la izquierda, atrás; desde la derecha, adelante */
(function(){
  var x0 = 0, y0 = 0, lado = 0, marca = null, dx = 0;
  var BORDE = 24;
  document.addEventListener('touchstart', function(ev){
    lado = 0;
    if(ev.touches.length !== 1 || $('capaFlotante').innerHTML || ui.sel || esLibro(ui.vista)) return;
    x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY;
    if(x0 < BORDE && NAV.atras.length) lado = -1;
    else if(x0 > innerWidth - BORDE && NAV.adelante.length) lado = 1;
    dx = 0;
  }, { passive:true });
  document.addEventListener('touchmove', function(ev){
    if(!lado) return;
    var mx = ev.touches[0].clientX - x0, my = ev.touches[0].clientY - y0;
    if(Math.abs(my) > 40 && Math.abs(my) > Math.abs(mx)){ quitar_(); lado = 0; return; }
    dx = lado < 0 ? Math.max(0, mx) : Math.max(0, -mx);
    if(!marca){ marca = document.createElement('div'); marca.className = 'gesto-nav ' + (lado < 0 ? 'izq' : 'der'); marca.innerHTML = ico('i-der', lado < 0 ? 'izq' : ''); document.body.appendChild(marca); }
    var p = Math.min(1, dx / 90);
    marca.style.setProperty('--p', p.toFixed(2));
    marca.classList.toggle('listo', dx > 90);
  }, { passive:true });
  function quitar_(){ if(marca){ marca.remove(); marca = null; } }
  document.addEventListener('touchend', function(){
    if(!lado) return;
    var d = lado; lado = 0; quitar_();
    if(dx > 90){ vibrar(10); pasoNav(d); }
  }, { passive:true });
  document.addEventListener('touchcancel', function(){ lado = 0; quitar_(); }, { passive:true });
})();

/* Al bajar, el título grande se va y aparece el pequeño de la barra */
/* Se mira la posición en el siguiente cuadro: leerla justo después de
   cambiar el contenido obliga al navegador a recalcular toda la página */
var bajadoPend = false;
function marcarBajado(){
  if(bajadoPend) return;
  bajadoPend = true;
  requestAnimationFrame(function(){ bajadoPend = false; document.body.classList.toggle('bajado', (window.scrollY || 0) > 64); });
}
window.addEventListener('scroll', marcarBajado, { passive:true });

function pintar(){
  olvidarDias();
  try{ pintarVista(); }
  catch(e){
    anotarError(e, 'pintar ' + ui.vista);
    try{
      $('zonaCuentas').classList.add('oculto'); $('contenido').classList.remove('oculto');
      $('contenido').innerHTML = '<section class="tarjeta" style="margin-top:10px">' + vacio('⚠️', 'Algo falló al mostrar esta sección', 'Tus datos están bien. Prueba otra vez o vuelve a Hoy.') +
        '<div class="botones" style="padding:0 16px 16px;justify-content:center"><button class="btn" data-acc="reintentar">Reintentar</button><button class="btn primario" data-ir="hoy">Ir a Hoy</button></div></section>';
    }catch(e2){}
  }
}
function pintarVista(){
  repintarAlSoltar = false;
  anotarPantalla();
  pintarNav();
  var v = ui.vista;
  var sec = SECCIONES.find(function(s){ return s.id === v; });
  $('tituloVista').textContent = v === 'ajustes' ? 'Ajustes' : (v === 'listas' && ui.lista ? (listaActual() || {}).nombre || 'Listas' : (sec.esp ? espInfo(sec.esp).em + ' ' : '') + (innerWidth < 600 && sec.movil ? sec.movil : sec.nom));
  if(!foco.fin) document.title = (v === 'hoy' ? 'Agenda' : $('tituloVista').textContent + ' · Agenda');
  document.body.classList.toggle('en-cuentas', esLibro(v));
  document.body.classList.toggle('con-sel', !!ui.sel);
  document.body.classList.toggle('sin-fab', v === 'secciones' || v === 'papelera' || v === 'ajustes');
  document.body.dataset.esp = sec && sec.esp ? sec.esp : '';

  if(esLibro(v)){
    /* Los libros: arriba las pestañas de Dinero y debajo el libro */
    $('contenido').classList.remove('oculto');
    $('contenido').innerHTML = '<div class="pest-sobre-libro">' + pestanasGrupo(v) + '</div>';
    document.body.classList.remove('con-titulo-grande');
    mostrarLibro(v);
    ui.antes = v;
    return;
  }
  $('zonaCuentas').classList.add('oculto');
  $('contenido').classList.remove('oculto');

  var html = v.indexOf('panel-') === 0 ? VISTAS[v]()
           : sec && sec.esp ? volverPanel(v) + VISTAS.espacio(sec.esp)
           : volverPanel(v) + cabSeccion(v) + VISTAS[v]();
  var nueva = ui.antes !== v + (ui.lista || '');
  var dirCls = nueva ? (ui.dir < 0 ? 'vista entra-izq' : 'vista entra-der') : '';
  ui.dir = 1;
  $('contenido').innerHTML = '<div class="' + dirCls + '">' + html + '</div>';
  document.body.classList.toggle('con-titulo-grande', !!$('contenido').querySelector('.cab-grande, .portada-hoy, .portada-esp, .panel-cab'));
  marcarBajado();
  ui.antes = v + (ui.lista || '');
  if(v === 'hoy' || v === 'tareas' || v === 'recordatorios') actualizarPista();
  tictac();
}

/* ==========================================================================
   REGISTRO DE FALLOS
   Si algo falla, se apunta aquí (los últimos 20) para poder revisarlo desde
   Ajustes, en vez de dejar la pantalla en blanco.
   ========================================================================== */
var CLAVE_ERRORES = 'agenda_errores';
function anotarError(e, donde){
  try{
    var l = leerJSON(CLAVE_ERRORES, []);
    l.push({ t:Date.now(), donde:donde || '', msj:String(e && (e.message || e) || '').slice(0, 300), pila:String(e && e.stack || '').split('\n').slice(0, 4).join(' | ').slice(0, 500), v:ui && ui.vista });
    escribirJSON(CLAVE_ERRORES, l.slice(-20));
  }catch(x){}
}
window.addEventListener('error', function(ev){ anotarError(ev.error || ev.message, 'global'); });
window.addEventListener('unhandledrejection', function(ev){ anotarError(ev.reason, 'promesa'); });

/* ==========================================================================
   PIEZAS QUE SE REPITEN
   ========================================================================== */
function casilla(acc, id, marcada, c, cuadrada, extra){
  return '<button type="button" class="casilla' + (cuadrada ? ' cuadrada' : '') + '" role="checkbox" aria-checked="' + !!marcada + '"' +
         (c ? ' style="--c:' + c + '"' : '') + ' data-acc="' + acc + '" data-id="' + id + '"' + (extra || '') + ' aria-label="Marcar">' + CHECK + '</button>';
}

/* Cabecera de tarjeta con su azulejo de color */
function cabTarjeta(icono, titulo, c, mas, masAcc){
  return '<div class="tarjeta-cab"><h2><span class="azulejo" style="--c:' + (c || 'var(--verde)') + '">' + ico(icono) + '</span>' + titulo + '</h2>' +
    (mas ? '<button class="mas" ' + (masAcc || '') + '>' + mas + ico('i-der') + '</button>' : '') + '</div>';
}

function metaFecha(fecha, hora, hecha){
  if(!fecha) return '';
  var hoy = hoyISO();
  var cls = hecha ? '' : (fecha < hoy ? 'tarde' : fecha === hoy ? 'hoy' : '');
  return '<span class="' + cls + '">' + ico('i-cal') + relativo(fecha) + (hora ? ' · ' + hora : '') + '</span>';
}

function filaTarea(t){
  var sub = t.sub && t.sub.length ? t.sub.filter(function(s){ return s.ok; }).length + '/' + t.sub.length : '';
  var sel = enSel('tareas') && ui.vista === 'tareas', ya = sel && elegida(t.id);
  var paraMover = !sel && !t.hecha && t.fecha && t.fecha <= hoyISO();
  return '<div class="fila' + (t.hecha ? ' hecha' : '') + (sel ? ' eligiendo' : '') + (ya ? ' elegida' : '') + '" data-fila="' + t.id + '">' +
    (sel ? casilla('sel-t', t.id, ya, 'var(--verde)', true) : casilla('tarea-ok', t.id, t.hecha, t.prio ? PRIOS[t.prio].c : '')) +
    '<div class="cuerpo" data-acc="' + (sel ? 'sel-t' : 'tarea-ed') + '" data-id="' + t.id + '">' +
      '<div class="titulo">' + esc(t.t) + '</div>' +
      '<div class="meta">' +
        metaFecha(t.fecha, t.hora, t.hecha) +
        (t.rep && t.rep !== 'no' ? '<span>' + ico('i-rep') + REPS_CORTO[t.rep] + '</span>' : '') +
        (sub ? '<span>' + ico('i-sub') + sub + '</span>' : '') +
        (t.proy && ui.vista !== 'proyectos' && buscarId('proyectos', t.proy) && !buscarId('proyectos', t.proy).del ? '<span class="etiqueta">📁 ' + esc(buscarId('proyectos', t.proy).nombre) + '</span>' : '') +
        (ui.vista.indexOf('esp-') ? chipEsp(t) : '') +
        (t.area && !espDeTexto(t.area) ? '<span class="etiqueta">' + esc(t.area) + '</span>' : '') +
        (t.notas ? '<span>' + ico('i-notas') + '</span>' : '') +
        (t.hecha && t.hechaEn ? '<span>Hecha ' + relativo(iso(new Date(t.hechaEn))).toLowerCase() + '</span>' : '') +
      '</div>' +
    '</div>' +
    (paraMover ? '<div class="lado"><button class="btn-icono" data-acc="tarea-manana" data-id="' + t.id + '" title="Pasar a mañana" aria-label="Pasar a mañana">' + ico('i-flecha') + '</button></div>' : '') +
  '</div>';
}

function filaAgenda(it, conFecha){
  var izq;
  if(it.tipo === 'tarea') izq = casilla('tarea-ok', it.id, it.hecho, it.o.prio ? it.c : '');
  else if(it.tipo === 'pago') izq = casilla('pago-ok', it.id, it.hecho, 'var(--oro)', false, ' data-ym="' + it.ym + '"');
  else if(it.tipo === 'rec') izq = '<span class="icono-tipo" style="--c:' + it.c + '">' + ico('i-campana') + '</span>';
  else izq = '<span class="barrita" style="--c:' + it.c + '"></span>';
  var acc = { tarea:'tarea-ed', rec:'rec-ed', pago:'pago-ed', evento:'evento-ed', clase:'curso-ed', feriado:'cal-feriado' }[it.tipo];
  var cuando = it.hora ? it.hora + (it.fin ? '–' + it.fin : '') : (it.tipo === 'evento' ? 'Todo el día' : '');
  var nom = { evento:it.o.cumple ? 'Cumpleaños' : (TIPOS_EV[it.o.tipo] || TIPOS_EV.evento).n, rec:'Recordatorio', tarea:'Tarea', clase:'Clase · ' + cuando, pago:'Pago · ' + dinero(+it.o.monto || 0), feriado:'Feriado nacional' }[it.tipo];
  var enEsp = ui.vista.indexOf('esp-') === 0;
  return '<div class="fila' + (it.hecho ? ' hecha' : '') + '">' +
    '<span class="hora">' + (it.hora || '—') + '</span>' + izq +
    '<div class="cuerpo" data-acc="' + acc + '" data-id="' + it.id + '"' + (conFecha ? ' data-dia="' + conFecha + '"' : '') + '>' +
      '<div class="titulo">' + esc(it.t) + '</div>' +
      '<div class="meta">' +
        '<span>' + nom + (cuando && it.tipo === 'evento' && !it.o.cumple ? ' · ' + cuando : '') + '</span>' +
        (it.lugar ? '<span>' + ico('i-lugar') + esc(it.lugar) + '</span>' : '') +
        (it.o.rep && it.o.rep !== 'no' && !it.o.cumple ? '<span>' + ico('i-rep') + REPS_CORTO[it.o.rep] + '</span>' : '') +
        (it.o.resultado ? '<span class="etiqueta">' + esc(it.o.resultado) + '</span>' : '') +
        (!enEsp && it.esp ? chipEsp({ esp:it.esp }) : '') +
      '</div>' +
    '</div>' +
  '</div>';
}

function vacio(emoji, titulo, texto){
  return '<div class="vacio"><span class="emoji">' + emoji + '</span><b>' + titulo + '</b>' + (texto || '') + '</div>';
}

function captura(tipos, placeholder, esp){
  ui.capEsp = esp || '';
  var tipo = tipos.indexOf(ui.capTipo) >= 0 ? ui.capTipo : tipos[0];
  ui.capTipo = tipo;
  var NOM = { tarea:'Tarea', rec:'Recordatorio', evento:'Evento', nota:'Nota' };
  return (tipos.length > 1 ?
    '<div class="fichas desliza" style="margin-bottom:8px">' + tipos.map(function(t){
      return '<button type="button" class="ficha" data-acc="cap-tipo" data-tipo="' + t + '" aria-pressed="' + (t === tipo) + '">' + NOM[t] + '</button>';
    }).join('') + '</div>' : '') +
    '<form class="captura" data-acc="captura" autocomplete="off">' +
      '<input id="entradaCaptura" type="text" enterkeyhint="done" maxlength="200" placeholder="' + esc(placeholder) + '">' + botonVoz('entradaCaptura') +
      '<button type="submit" class="btn primario chico">' + ico('i-plus') + 'Añadir</button>' +
    '</form>' +
    '<div class="pista" id="pista"></div>';
}

/* ==========================================================================
   GUÍA: qué puedes hacer y a dónde ir, dicho con palabras
   Un solo catálogo lo usan el botón + («¿Qué quieres hacer?»), el buscador
   (escribes «gasto» y te ofrece anotarlo o ir a Movimientos) y Hoy.
   ========================================================================== */
var ACCIONES = [
  { g:'Tu día', t:'Crear una tarea', d:'Algo que tienes que hacer, con fecha si quieres', i:'i-tareas', a:'data-acc="nuevo" data-tipo="tarea"', p:'tarea hacer pendiente to do' },
  { g:'Tu día', t:'Agendar un evento', d:'Cita, reunión, examen o partido con día y hora', i:'i-cal', a:'data-acc="nuevo" data-tipo="evento"', p:'evento cita reunion examen partido agendar calendario' },
  { g:'Tu día', t:'Poner un recordatorio', d:'La agenda te avisa a la hora que digas', i:'i-campana', a:'data-acc="nuevo" data-tipo="rec"', p:'recordatorio aviso alarma avisar recordar' },
  { g:'Tu día', t:'Empezar un proyecto', d:'Algo grande que vas armando por tareas', i:'i-carpeta', a:'data-acc="nuevo" data-tipo="proyecto"', p:'proyecto plan' },
  { g:'Dinero', t:'Anotar un gasto', d:'Lo que acabas de gastar (tu libro personal)', i:'i-bajar', a:'data-acc="din-anotar" data-libro="personal" data-t="Gasto"', p:'gasto gaste pagar compra plata dinero salio' },
  { g:'Dinero', t:'Anotar un ingreso', d:'Sueldo, venta o lo que te pagaron', i:'i-subir', a:'data-acc="din-anotar" data-libro="personal" data-t="Ingreso"', p:'ingreso sueldo cobre entro plata dinero venta' },
  { g:'Dinero', t:'Movimiento de la oficina', d:'Un gasto o ingreso del libro de la oficina', i:'i-maletin', a:'data-acc="din-anotar" data-libro="oficina" data-t="Gasto"', p:'oficina empresa factura trabajo' },
  { g:'Dinero', t:'Agregar un pago fijo', d:'Luz, internet, alquiler… y te avisa antes de que venza', i:'i-recibo', a:'data-acc="nuevo" data-tipo="pago"', p:'pago fijo luz agua internet alquiler recibo servicio mensual' },
  { g:'Dinero', t:'Anotar un préstamo', d:'Alguien te debe o tú le debes a alguien', i:'i-cuentas', a:'data-acc="nuevo" data-tipo="deuda"', p:'prestamo deuda debe presté' },
  { g:'Dinero', t:'Anotar un cobro de la oficina', d:'Lo que te debe un cliente y cuándo vence', i:'i-subir', a:'data-acc="nuevo" data-tipo="cobro"', p:'cobro cliente factura por cobrar' },
  { g:'Escribir', t:'Escribir una nota', d:'Ideas, datos, apuntes; con casillas si quieres', i:'i-notas', a:'data-acc="nuevo" data-tipo="nota"', p:'nota apunte idea escribir' },
  { g:'Escribir', t:'Hacer una lista', d:'Compras, bolso, cosas para marcar', i:'i-listas', a:'data-acc="nuevo" data-tipo="lista"', p:'lista compras super mercado marcar' },
  { g:'Escribir', t:'Escribir en el diario', d:'Cuenta tu día en un par de líneas', i:'i-diario', a:'data-acc="nuevo" data-tipo="diario"', p:'diario dia contar escribir' },
  { g:'Constancia', t:'Crear un hábito', d:'Algo que quieres hacer seguido y llevar la racha', i:'i-habitos', a:'data-acc="nuevo" data-tipo="habito"', p:'habito racha rutina diario' },
  { g:'Constancia', t:'Ponerte una meta', d:'Un número al que quieres llegar: ahorrar, leer…', i:'i-meta', a:'data-acc="nuevo" data-tipo="meta"', p:'meta objetivo ahorrar leer' },
  { g:'Tus espacios', t:'Agregar un curso', d:'Con su horario, notas y faltas (Estudios)', i:'i-birrete', a:'data-acc="nuevo" data-tipo="curso"', p:'curso clase universidad estudios horario nota' },
  { g:'Tus espacios', t:'Anotar un entrenamiento', d:'Fútbol, gym, correr… (Deporte)', i:'i-balon', a:'data-acc="nuevo" data-tipo="entreno"', p:'entreno entrenamiento gym futbol correr deporte' },
  { g:'Tus espacios', t:'Crear una rutina de gym', d:'Tus ejercicios y récords (Deporte)', i:'i-meta', a:'data-acc="nuevo" data-tipo="rutina"', p:'rutina gym ejercicios pesas' }
];
var DESTINOS = [
  { t:'Mi día', d:'Agenda · todo lo de hoy junto', i:'i-hoy', ir:'agenda', p:'dia hoy agenda pendientes' },
  { t:'Calendario', d:'Agenda · mes, semana o año', i:'i-cal', ir:'calendario', p:'calendario mes semana eventos' },
  { t:'Tareas', d:'Agenda · lo que tienes que hacer', i:'i-tareas', ir:'tareas', p:'tareas pendientes atrasadas' },
  { t:'Avisos', d:'Agenda · tus recordatorios', i:'i-campana', ir:'recordatorios', p:'avisos recordatorios alarmas' },
  { t:'Proyectos', d:'Agenda · tus proyectos', i:'i-carpeta', ir:'proyectos', p:'proyectos' },
  { t:'Resumen del dinero', d:'Dinero · cómo vas este mes', i:'i-grafica', ir:'dinero', p:'dinero plata resumen presupuesto gasto mes' },
  { t:'Movimientos', d:'Dinero · cada gasto e ingreso', i:'i-cuentas', ir:'movimientos', p:'movimientos gastos ingresos libro cuentas' },
  { t:'Pagos fijos', d:'Dinero · luz, internet, alquiler…', i:'i-recibo', ir:'pagos', p:'pagos fijos recibos servicios' },
  { t:'Notas', d:'Notas · tus apuntes', i:'i-notas', ir:'notas', p:'notas apuntes' },
  { t:'Listas', d:'Notas · compras y cosas por marcar', i:'i-listas', ir:'listas', p:'listas compras' },
  { t:'Hábitos', d:'Más · rachas de cada día', i:'i-habitos', ir:'habitos', p:'habitos rachas' },
  { t:'Metas', d:'Más · cuánto te falta', i:'i-meta', ir:'metas', p:'metas objetivos' },
  { t:'Diario', d:'Más · lo que escribiste', i:'i-diario', ir:'diario', p:'diario' },
  { t:'Personal', d:'Espacio · casa, compras, cumpleaños, préstamos', i:'i-casa', ir:'esp-personal', p:'personal casa compras cumpleaños prestamos' },
  { t:'Estudios', d:'Espacio · cursos, horario, exámenes', i:'i-birrete', ir:'esp-estudios', p:'estudios cursos universidad examenes horario' },
  { t:'Oficina', d:'Espacio · clientes, cobros, reuniones', i:'i-maletin', ir:'esp-oficina', p:'oficina trabajo clientes cobros reuniones' },
  { t:'Deporte', d:'Espacio · entrenos, rutinas, partidos', i:'i-balon', ir:'esp-deporte', p:'deporte futbol gym partidos entrenos cancha' },
  { t:'Ajustes', d:'Nombre, apariencia, avisos, nube, respaldo', i:'i-ajustes', ir:'ajustes', p:'ajustes configuracion nube respaldo tema color' },
  { t:'Papelera', d:'Lo que borraste en los últimos 30 días', i:'i-basura', ir:'papelera', p:'papelera borrado recuperar' }
];
function filaAccion(x){
  return '<button type="button" class="acc-fila" ' + x.a + '><span class="acc-ico">' + ico(x.i) + '</span><span class="acc-txt"><b>' + x.t + '</b><small>' + x.d + '</small></span>' + ico('i-der') + '</button>';
}
function filaDestino(x){
  return '<button type="button" class="acc-fila destino" data-ir="' + x.ir + '"><span class="acc-ico">' + ico(x.i) + '</span><span class="acc-txt"><b>Ir a ' + x.t + '</b><small>' + x.d + '</small></span>' + ico('i-der') + '</button>';
}

/* Añadir desde un solo sitio: el botón + (o «Añadir…» de cada pantalla)
   abre esta hoja con la escritura rápida arriba y lo demás debajo */
var TIPO_POR_VISTA = { tareas:'tarea', recordatorios:'rec', calendario:'evento', notas:'nota' };
function hojaAnadir(tipo){
  var v = ui.vista, esp = v.indexOf('esp-') === 0 ? v.slice(4) : '';
  if(tipo) ui.capTipo = tipo; else if(TIPO_POR_VISTA[v]) ui.capTipo = TIPO_POR_VISTA[v];
  var ph = esp ? espInfo(esp).em + ' Añadir en ' + espInfo(esp).nom + '… ej. «mañana 5pm pichanga»' : 'Escribe y listo… ej. «pagar la luz el viernes 6pm»';
  var MAS_VIEJO = [['lista','i-listas','Lista'],['habito','i-habitos','Hábito'],['meta','i-meta','Meta'],['proyecto','i-carpeta','Proyecto'],['pago','i-recibo','Pago fijo'],
    ['personal','i-cuentas','Gasto'],['oficina','i-maletin','Mov. oficina'],['diario','i-diario','Diario'],['curso','i-birrete','Curso'],['entreno','i-balon','Entreno'],['rutina','i-meta','Rutina gym'],['deuda','i-cuentas','Préstamo'],['cobro','i-subir','Cobro']];
  var grupos = [];
  ACCIONES.forEach(function(x){ var g = grupos.find(function(y){ return y.n === x.g; }); if(!g){ g = { n:x.g, xs:[] }; grupos.push(g); } g.xs.push(x); });
  abrirFlotante(cabFlot('¿Qué quieres hacer?') + '<div class="hoja-anadir">' +
    '<p class="ha-guia">Toca lo que quieres hacer, o escríbelo abajo y la agenda entiende la fecha y la hora.</p>' +
    grupos.map(function(g){ return '<h4 class="ha-mas">' + g.n + '</h4><div class="acc-lista">' + g.xs.map(filaAccion).join('') + '</div>'; }).join('') +
    '<h4 class="ha-mas">O escríbelo rápido</h4>' + captura(['tarea','rec','evento','nota'], ph, esp) + '</div>');
  actualizarPista();
}
/* ---------- Dictar por voz (si el navegador puede) ------------------------ */
var VOZ = null;   // el dictado por voz se quitó de la agenda
function botonVoz(idCampo){
  return VOZ ? '<button type="button" class="btn-icono btn-voz" data-acc="dictar" data-id="' + idCampo + '" title="Dictar" aria-label="Dictar por voz">' + ico('i-mic') + '</button>' : '';
}
var vozActiva = null;
function dictar(idCampo, boton){
  if(!VOZ){ aviso('Tu navegador no deja dictar', 'Prueba con Chrome en el celular.'); return; }
  if(vozActiva){ try{ vozActiva.stop(); }catch(e){} vozActiva = null; return; }
  var campo = $(idCampo); if(!campo) return;
  var r = new VOZ(), antes = campo.value ? campo.value.replace(/\s+$/, '') + ' ' : '';
  r.lang = 'es-PE'; r.interimResults = true; r.continuous = false;
  r.onresult = function(ev){
    var t = ''; for(var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
    campo.value = antes + t;
    if(idCampo === 'entradaCaptura') actualizarPista();
  };
  r.onerror = function(ev){ if(ev.error === 'not-allowed') aviso('Permite el micrófono', 'Toca el candado de la barra de direcciones → Micrófono.'); };
  r.onend = function(){ vozActiva = null; if(boton) boton.classList.remove('escuchando'); campo.focus(); };
  try{ r.start(); vozActiva = r; if(boton) boton.classList.add('escuchando'); vibrar(15); }catch(e){ vozActiva = null; }
}

/* El botón + sube justo lo que ocupan los avisos, para que nunca lo tapen */
(function(){
  var caja = document.getElementById('avisos');
  if(!caja || typeof ResizeObserver === 'undefined') return;
  new ResizeObserver(function(){ document.documentElement.style.setProperty('--avisos-h', Math.ceil(caja.getBoundingClientRect().height) + 'px'); }).observe(caja);
})();

/* ---------- Compartir (WhatsApp o lo que tenga el celular) ---------------- */
function compartir(titulo, texto){
  if(navigator.share){ navigator.share({ title:titulo, text:texto }).catch(function(){}); return; }
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank', 'noopener');
}
function textoLista(l){
  var its = l.items || [];
  return (l.em || '📝') + ' *' + l.nombre + '*\n' + its.filter(function(i){ return !i.ok; }).map(function(i){ return '⬜ ' + i.t; }).join('\n') +
    (its.some(function(i){ return i.ok; }) ? '\n' + its.filter(function(i){ return i.ok; }).map(function(i){ return '✅ ' + i.t; }).join('\n') : '');
}
function textoEvento(e){
  return '📅 *' + e.t + '*\n' + cap(fechaLarga(e.fecha)) + (e.todo ? '' : ' · ' + e.ini + (e.fin ? '–' + e.fin : '')) + (e.lugar ? '\n📍 ' + e.lugar : '') + (e.notas ? '\n' + e.notas : '');
}
function textoTareasHoy(){
  var hoy = hoyISO(), ts = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; }).sort(ordenTareas);
  return '✅ *Mis pendientes de hoy*\n' + (ts.length ? ts.map(function(t){ return '• ' + t.t + (t.hora ? ' (' + t.hora + ')' : ''); }).join('\n') : 'Nada pendiente 🙌');
}

/* ---------- Cuánto puedes gastar hoy (con tu presupuesto personal) -------- */
function gastoDiario(){
  var pres = presupuesto('personal');
  if(!pres) return null;
  var hoy = hoyISO(), ym = hoy.slice(0, 7), sal = 0, hoyG = 0;
  movimientos(CLAVE_LEDGER).forEach(function(t){
    if(t.type !== 'Gasto' || t.date.slice(0, 7) !== ym) return;
    var a = Math.abs(+t.amount || 0);
    if(t.date === hoy) hoyG += a; else sal += a;
  });
  var diasMes = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate(), quedan = diasMes - deISO(hoy).getDate() + 1;
  var porDia = Math.max(0, (pres - sal) / quedan);
  return { pres:pres, porDia:porDia, hoy:hoyG, queda:Math.max(0, porDia - hoyG), pasado:hoyG > porDia, restante:pres - sal - hoyG, quedan:quedan };
}
function tarjetaGastoDiario(){
  var g = gastoDiario();
  if(!g) return '<section class="tarjeta gasto-dia vacio-gd"><div class="gd-txt"><b>¿Cuánto puedes gastar al día?</b><small>Pon tu presupuesto del mes y la agenda te lo calcula.</small></div><button class="btn chico primario" data-acc="presu-ed">Poner presupuesto</button></section>';
  return '<section class="tarjeta gasto-dia' + (g.pasado ? ' pasado' : '') + '"><div class="gd-txt"><small>' + (g.pasado ? 'Hoy te pasaste' : 'Hoy puedes gastar') + '</small>' +
    '<b>' + dinero(g.pasado ? g.hoy - g.porDia : g.queda) + '</b>' +
    '<span>Llevas ' + dinero(g.hoy) + ' hoy · te quedan ' + dinero(Math.max(0, g.restante)) + ' para ' + g.quedan + (g.quedan === 1 ? ' día' : ' días') + '</span></div>' +
    '<div class="gd-riel"><i style="width:' + Math.min(100, g.porDia ? g.hoy / g.porDia * 100 : 100) + '%"></i></div></section>';
}

/* ---------- Ordenar pendientes: una tarea a la vez ------------------------ */
function paraOrdenar(){
  var hoy = hoyISO();
  return vivos('tareas').filter(function(t){ return !t.hecha && (!t.fecha || t.fecha < hoy); }).sort(ordenTareas);
}
function ordenarPendientes(){
  var ts = paraOrdenar();
  if(!ts.length){ cerrarFlotante(); aviso('🙌 Todo en orden', 'No tienes tareas atrasadas ni sin fecha.'); pintar(); return; }
  var t = ts[0], hoy = hoyISO(), aLunes = ((8 - deISO(hoy).getDay()) % 7) || 7;
  abrirFlotante(cabFlot('Ordenar pendientes') +
    '<div class="ordenar">' +
      '<p class="or-cuenta">Quedan <b>' + ts.length + '</b> · ' + (t.fecha ? '<span class="tarde">atrasada desde ' + relativo(t.fecha).toLowerCase() + '</span>' : 'sin fecha') + '</p>' +
      '<div class="or-tarea"><b>' + esc(t.t) + '</b>' + (t.notas ? '<small>' + esc(t.notas.slice(0, 120)) + '</small>' : '') + chipEsp(t) + '</div>' +
      '<div class="or-botones">' +
        '<button type="button" class="btn primario" data-acc="ord" data-id="' + t.id + '" data-f="' + hoy + '">Hoy</button>' +
        '<button type="button" class="btn" data-acc="ord" data-id="' + t.id + '" data-f="' + sumarDias(hoy, 1) + '">Mañana</button>' +
        '<button type="button" class="btn" data-acc="ord" data-id="' + t.id + '" data-f="' + sumarDias(hoy, aLunes) + '">El lunes</button>' +
        '<button type="button" class="btn" data-acc="ord" data-id="' + t.id + '" data-f="">Algún día</button>' +
        '<button type="button" class="btn" data-acc="ord-hecha" data-id="' + t.id + '">' + ico('i-check') + 'Ya la hice</button>' +
        '<button type="button" class="btn peligro" data-acc="ord-borrar" data-id="' + t.id + '">' + ico('i-basura') + 'Borrar</button>' +
      '</div>' +
      '<button type="button" class="btn chico or-saltar" data-acc="ord-fin">Terminar por ahora</button>' +
    '</div>');
}

/* ---------- Gasto rápido: monto, categoría y listo ------------------------ */
var CATS_BASE = ['Comida','Transporte','Casa','Servicios','Salud','Ocio','Deporte','Estudios'];
function gastoRapido(cual, tipo){
  ui.grLibro = cual || ui.grLibro || 'personal'; ui.grTipo = tipo || 'Gasto'; ui.grCat = '';
  var usadas = {};
  libroDatos(ui.grLibro).forEach(function(t){ if(t.cat && t.type === ui.grTipo) usadas[t.cat] = (usadas[t.cat] || 0) + 1; });
  var cats = Object.keys(usadas).sort(function(a, b){ return usadas[b] - usadas[a]; }).concat(ui.grTipo === 'Ingreso' ? ['Sueldo','Ventas','Cobro'] : CATS_BASE)
    .filter(function(c, i, arr){ return arr.indexOf(c) === i; }).slice(0, 10);
  var gd = null;
  abrirFlotante(cabFlot(ui.grTipo === 'Ingreso' ? 'Ingreso rápido' : 'Gasto rápido') +
    '<form class="form gasto-rapido" data-acc="gasto-rapido" autocomplete="off">' +
      '<div class="gr-conmuta"><div class="selector">' +
        ['Gasto','Ingreso'].map(function(t){ return '<button type="button" data-acc="gr-tipo" data-v="' + t + '" aria-pressed="' + (ui.grTipo === t) + '">' + t + '</button>'; }).join('') + '</div>' +
        '<div class="selector">' + ['personal','oficina'].map(function(l){ return '<button type="button" data-acc="gr-libro" data-v="' + l + '" aria-pressed="' + (ui.grLibro === l) + '">' + NOM_LIBRO[l] + '</button>'; }).join('') + '</div></div>' +
      '<label class="gr-monto"><span>' + MONEDA + '</span><input id="grMonto" inputmode="decimal" placeholder="0.00" autocomplete="off"></label>' +
      (gd ? '<p class="gr-pista">Hoy puedes gastar <b>' + dinero(gd.queda) + '</b></p>' : '') +
      '<div class="gr-cats">' + cats.map(function(c){ return '<button type="button" class="ficha" data-acc="gr-cat" data-v="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
      '<input class="entrada" id="grDesc" maxlength="160" placeholder="En qué (opcional) · ej. almuerzo, taxi">' +
      '<button type="submit" class="btn primario gr-ok">' + ico('i-check') + 'Anotar en ' + NOM_LIBRO[ui.grLibro] + '</button>' +
    '</form>');
  setTimeout(function(){ var m = $('grMonto'); if(m) m.focus(); }, 60);
}
function guardarGastoRapido(){
  var m = $('grMonto'), v = (m.value || '').replace(/−/g, '-').replace(/,/g, '.');
  if(/\d[+\-]/.test(v)){ var tot = 0; (v.match(/[+\-]?[\d.]+/g) || []).forEach(function(x){ tot += parseFloat(x) || 0; }); v = String(tot); }
  var monto = Math.round(Math.abs(num(v)) * 100) / 100;
  if(!monto){ m.focus(); aviso('Falta el monto'); return; }
  var cual = ui.grLibro || 'personal', cat = ui.grCat || '', desc = ($('grDesc').value || '').trim();
  var t = { id:nid(), date:hoyISO(), desc:desc || cat || ui.grTipo, type:ui.grTipo === 'Ingreso' ? 'Ingreso' : 'Gasto', amount:monto, cat:cat.slice(0, 40) };
  cambiarLibro(cual, function(l){ return l.concat([t]); });
  cerrarFlotante(); pintar(); vibrar(15);
  var gd = null;
  aviso((t.type === 'Gasto' ? '💸 ' : '💰 ') + dinero(monto) + (t.desc ? ' · ' + t.desc : ''), gd ? (gd.pasado ? 'Hoy ya te pasaste por ' + dinero(gd.hoy - gd.porDia) : 'Te quedan ' + dinero(gd.queda) + ' para hoy') : NOM_LIBRO[cual], 'Deshacer', function(){
    cambiarLibro(cual, function(l){ return l.filter(function(x){ return x.id !== t.id; }); }); pintar();
  });
}
/* Mantener pulsado el +: lo más usado a un toque */
function menuRapido(){
  vibrar(20);
  var ops = [['gasto','💸','Gasto'],['tarea','✅','Tarea'],['evento','📅','Evento'],['rec','🔔','Aviso'],['nota','📝','Nota']];
  abrirFlotante(cabFlot('Rápido') + '<div class="menu-rapido">' + ops.map(function(o){
    return '<button type="button" data-acc="rapido" data-v="' + o[0] + '"><span>' + o[1] + '</span>' + o[2] + '</button>';
  }).join('') + '</div>');
}

function botonAnadir(tipo, texto){
  return '<button type="button" class="anadir-rapido" data-acc="anadir" data-tipo="' + tipo + '">' + ico('i-plus') + '<span>' + texto + '</span></button>';
}

function actualizarPista(){
  var el = $('pista'), inp = $('entradaCaptura');
  if(!el || !inp) return;
  var v = inp.value.trim();
  if(!v){
    el.innerHTML = 'Escribe natural: <b>«pagar la luz el viernes a las 6 !!»</b> o <b>«dentista 15/10 9:30 #salud»</b>';
    return;
  }
  var p = interpretar(v), bits = [];
  if(p.fecha) bits.push(relativo(p.fecha) + ' (' + fechaCorta(p.fecha) + ')');
  if(p.hora) bits.push(p.hora);
  if(p.prio) bits.push('prioridad ' + PRIOS[p.prio].n.toLowerCase());
  if(p.area) bits.push('#' + p.area);
  if(p.esp) bits.push(espInfo(p.esp).em + ' ' + espInfo(p.esp).nom);
  el.innerHTML = bits.length ? 'Se guardará: <b>' + esc(p.texto || '…') + '</b> · ' + esc(bits.join(' · ')) : '';
}

/* ==========================================================================
   VISTAS
   ========================================================================== */
var VISTAS = {};

/* Una frase para cada día del año, siempre la misma ese día */
var FRASES = [
  'Lo que se agenda, se hace.',
  'Hecho es mejor que perfecto.',
  'Un paso pequeño cada día llega lejos.',
  'Primero lo importante; lo urgente sabe esperar un poco.',
  'La disciplina es elegir entre lo que quieres ahora y lo que más quieres.',
  'No tienes que verlo todo: solo el siguiente paso.',
  'Tu futuro se construye con lo que haces hoy, no mañana.',
  'Empieza donde estás, usa lo que tienes, haz lo que puedas.',
  'Menos pendientes en la cabeza, más espacio para vivir.',
  'La constancia vence al talento cuando el talento no es constante.',
  'Cuida los céntimos y los soles se cuidarán solos.',
  'Si toma menos de dos minutos, hazlo ya.',
  'Descansar también es parte del plan.',
  'Celebra lo que ya lograste antes de ir por lo siguiente.',
  'Un buen día empieza con tres prioridades claras.',
  'Lo que no se mide, no se mejora.',
  'Cada tarea tachada es una promesa cumplida contigo.',
  'Enfócate en el progreso, no en la perfección.',
  'Organizarse es regalarle tiempo a tu yo de mañana.',
  'Hoy es un buen día para empezar eso que vienes posponiendo.',
  'Ahorra primero, gasta después.',
  'Tu energía es limitada: ponla donde importa.',
  'Pequeños hábitos, grandes cambios.',
  'La motivación te arranca; el hábito te mantiene.',
  'Mejor un plan sencillo que se cumple que uno perfecto que no.',
  'Termina lo que empiezas y empezarás menos cosas que no terminas.',
  'El mejor momento fue ayer; el segundo mejor, ahora.',
  'Di que sí a pocas cosas y hazlas muy bien.',
  'Anota, suelta y confía en tu agenda.',
  'Paso a paso también se llega.'
];
function fraseDelDia(){
  var d = new Date(), ini = new Date(d.getFullYear(), 0, 0);
  return FRASES[Math.floor((d - ini) / 864e5) % FRASES.length];
}

/* Cuánto del día ya pasó (de 6:00 a 24:00, las horas en que se vive) */
function barraDelDia(){
  var d = new Date(), min = d.getHours() * 60 + d.getMinutes();
  var p = Math.max(0, Math.min(1, (min - 360) / (1440 - 360)));
  var txt = min < 360 ? 'El día aún no empieza' : p >= 1 ? 'Día terminado' : 'Llevas el ' + Math.round(p * 100) + '% del día';
  return '<div class="barra-dia" title="' + txt + '"><div class="barra-dia-cab"><span>' + txt + '</span><span>' + horaAhora() + '</span></div>' +
    '<div class="barra-dia-riel"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div></div>';
}
/* El día en una línea de tiempo: lo pasado se apaga y una marca dice "ahora" */
function lineaDelDia(items){
  var ya = horaAhora(), puesto = false, h = '<div class="linea-tiempo">';
  items.forEach(function(it){
    var pasado = it.hora && (it.fin || it.hora) < ya;
    if(!puesto && it.hora && it.hora >= ya){
      h += '<div class="ahora"><span>Ahora · ' + ya + '</span></div>'; puesto = true;
    }
    h += '<div class="lt-item' + (pasado ? ' pasado' : '') + '" style="--c:' + it.c + '">' + filaAgenda(it) + '</div>';
  });
  if(!puesto && items.some(function(i){ return i.hora; })) h += '<div class="ahora"><span>Ahora · ' + ya + '</span></div>';
  return h + '</div>';
}

/* ---------- Hoy ----------------------------------------------------------
   Ordenado por secciones: tus espacios, ahora (lo siguiente, el día y el
   enfoque), por hacer (tareas y bienestar), lo que se viene y el dinero.
   Cada sección se puede ocultar desde Ajustes. */
var SECC_HOY = [
  ['espacios', 'Tus espacios'], ['ahora', 'Ahora'], ['hacer', 'Por hacer'],
  ['viene', 'Lo que se viene'], ['dinero', 'Dinero'], ['notas', 'Notas fijadas']
];
function hoyVisible(k){ return (pref.hoyOff || []).indexOf(k) < 0; }
function tituloSecc(t, extra){ return '<h3 class="seccion-t"><span>' + t + '</span>' + (extra || '') + '</h3>'; }
function minutosHasta(hora){ var p = hora.split(':'), d = new Date(); return (+p[0] * 60 + +p[1]) - (d.getHours() * 60 + d.getMinutes()); }
function textoFalta(min){ return min <= 0 ? 'ahora' : min < 60 ? 'en ' + min + ' min' : 'en ' + Math.floor(min / 60) + ' h' + (min % 60 ? ' ' + (min % 60) + ' min' : ''); }

/* Lo siguiente con hora: hoy lo que falta, si no, lo primero de mañana */
function loSiguiente(){
  var hoy = hoyISO(), ya = horaAhora();
  var hoyItems = itemsDelDia(hoy).filter(function(x){ return x.hora && !x.hecho && (x.fin || x.hora) >= ya; });
  if(hoyItems.length){ var x = hoyItems[0]; return { x:x, d:hoy, enCurso:x.hora <= ya }; }
  for(var i = 1; i <= 7; i++){
    var d = sumarDias(hoy, i), its = itemsDelDia(d).filter(function(x){ return x.hora && !x.hecho && x.tipo !== 'tarea'; });
    if(its.length) return { x:its[0], d:d, enCurso:false };
  }
  return null;
}
function tarjetaSiguiente(){
  var s = loSiguiente();
  if(!s) return '<section class="tarjeta siguiente vacia"><small>Lo siguiente</small><b>Nada agendado</b><span>Tienes el día libre. 🌿</span></section>';
  var x = s.x, E = x.esp ? espInfo(x.esp) : null;
  var acc = { tarea:'tarea-ed', rec:'rec-ed', pago:'pago-ed', evento:'evento-ed', clase:'curso-ed' }[x.tipo];
  var cuando = s.d === hoyISO() ? (s.enCurso ? 'En curso · hasta las ' + (x.fin || x.hora) : textoFalta(minutosHasta(x.hora))) : cap(relativo(s.d)) + ' · ' + x.hora;
  var nom = { evento:(TIPOS_EV[x.o.tipo] || TIPOS_EV.evento).n, rec:'Recordatorio', tarea:'Tarea', clase:'Clase', pago:'Pago' }[x.tipo];
  return '<section class="tarjeta siguiente' + (s.enCurso ? ' en-curso' : '') + '" style="--c:' + x.c + '" data-acc="' + acc + '" data-id="' + x.id + '">' +
    '<small>' + (s.enCurso ? '● Ahora mismo' : 'Lo siguiente') + '</small>' +
    '<b>' + esc(x.t) + '</b>' +
    '<span class="sig-cuando">' + cuando + '</span>' +
    '<span class="sig-meta">' + nom + ' · ' + x.hora + (x.fin ? '–' + x.fin : '') + (x.lugar ? ' · ' + esc(x.lugar) : '') + (E ? ' · ' + E.em + ' ' + E.nom : '') + '</span></section>';
}

VISTAS.hoy = function(){
  var hoy = hoyISO(), ahora = new Date(), h = ahora.getHours();
  var saludo = h < 6 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  var nombre = db.perfil.nombre;
  var total = COLS.reduce(function(s, c){ return s + vivos(c).length; }, 0);

  var items = itemsDelDia(hoy);
  var tareasHoy = vivos('tareas').filter(function(t){
    return (t.fecha && t.fecha <= hoy && !t.hecha) || (t.hecha && t.hechaEn && iso(new Date(t.hechaEn)) === hoy) || (t.log && t.log.indexOf(hoy) >= 0);
  });
  var hechas = tareasHoy.filter(function(t){ return t.hecha || (t.log && t.log.indexOf(hoy) >= 0 && !(t.fecha <= hoy)); }).length;
  var pct = tareasHoy.length ? hechas / tareasHoy.length : 0;
  var C = 2 * Math.PI * 30;
  var agenda = items.filter(function(i){ return i.tipo !== 'tarea'; });
  function w(clase, titulo, n, ver, cuerpo){
    return '<section class="w ' + clase + '">' + (titulo ? '<header class="w-cab"><b>' + titulo + '</b>' + (n != null ? '<span class="w-n">' + n + '</span>' : '') +
      (ver ? '<button class="ver-link" ' + ver + '>Ver todo ' + ico('i-der') + '</button>' : '') + '</header>' : '') + cuerpo + '</section>';
  }

  /* ---- Cabecera corta: saludo y avance del día ---- */
  var html = '<header class="hoy-cab portada-hoy heroe-hoy">' +
    '<div class="hc-txt"><small>' + cap(DIAS[ahora.getDay()]) + ' ' + ahora.getDate() + ' de ' + MESES[ahora.getMonth()] + '</small>' +
      '<h2 class="ph-saludo">' + saludo + (nombre ? ', ' + esc(nombre.split(' ')[0]) : '') + '</h2>' +
      '<p class="hc-frase">' + esc(fraseDelDia()) + '</p></div>' +
    '<div class="anillo-hoy ph-anillo"><svg class="anillo" viewBox="0 0 72 72" aria-label="' + Math.round(pct * 100) + '% de las tareas de hoy"><circle class="fondo" cx="36" cy="36" r="30"/>' +
      '<circle class="valor" cx="36" cy="36" r="30" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '"/></svg>' +
      '<span><b>' + hechas + '/' + tareasHoy.length + '</b>hechas</span></div>' +
  '</header>';

  /* Franja de la semana */
  var ini = inicioSemana(hoy);
  html += '<div class="franja-semana semana-mini">' + [0,1,2,3,4,5,6].map(function(i){
    var d = sumarDias(ini, i), n = itemsDelDia(d).filter(function(x){ return !x.hecho; }).length;
    return '<button type="button" class="' + (d === hoy ? 'hoy' : '') + (d < hoy ? ' pasado' : '') + '" data-acc="ir-dia" data-dia="' + d + '"><small>' + DIAS3[deISO(d).getDay()] + '</small><b>' + deISO(d).getDate() + '</b>' +
      '<span class="puntos">' + '<i></i>'.repeat(Math.min(n, 4)) + '</span></button>';
  }).join('') + '</div>';

  if(!total && !nombre){
    html += '<section class="bienvenida-hoy"><h3>Bienvenido a tu agenda 👋</h3>' +
      '<p>Tareas, calendario, recordatorios, hábitos, metas, diario, pagos, notas y tus cuentas: todo en un solo sitio. ¿Cómo te llamas?</p>' +
      '<form data-acc="bienvenida" class="captura" style="margin:0 0 10px"><input id="nombreBienvenida" type="text" maxlength="40" placeholder="Tu nombre"><button class="btn primario chico" type="submit">Empezar</button></form>' +
      '<button type="button" class="btn chico" data-acc="ejemplos">Ver con ejemplos</button></section>';
  }
  html += '<div class="panel-hoy">';

  /* Tus espacios: lo primero, con lo que tiene cada uno para hoy */
  if(hoyVisible('espacios')) html += espaciosHoy(hoy);
  /* Qué hacer ahora: la agenda te dice lo que toca y te lleva */
  if(hoyVisible('ahora')) html += queHacerAhora(hoy, h);
  /* Lo siguiente */
  if(hoyVisible('ahora')) html += '<div class="w w-2 w-sig">' + tarjetaSiguiente() + '</div>';

  /* Pendientes: lo justo, con su botón de añadir */
  if(hoyVisible('hacer')){
    var pend = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; }).sort(ordenTareas);
    var atrasadas = pend.filter(function(t){ return t.fecha < hoy; }).length;
    html += w('w-2 w-tareas', 'Pendientes', pend.length, 'data-ir="tareas"',
      (pend.length ? '<div class="lista-filas">' + pend.slice(0, 4).map(filaTarea).join('') + '</div>' +
        (pend.length > 4 ? '<button class="w-mas" data-ir="tareas">+' + (pend.length - 4) + ' más</button>' : '') : '<p class="nada">Nada pendiente hoy. Día libre. 👊</p>') +
      '<div class="w-pie">' + botonAnadir('tarea', 'Añadir tarea') + (atrasadas ? '<button class="btn chico" data-acc="t-atrasadas-hoy">' + ico('i-rep') + 'Pasar ' + atrasadas + ' atrasadas a hoy</button>' : '') + '</div>');
  }

  /* Tu día: lo agendado de hoy */
  if(hoyVisible('ahora')){
    html += w('w-2 w-dia tu-dia', 'Tu día', agenda.length, 'data-ir="calendario"',
      agenda.length ? lineaDelDia(agenda.slice(0, 5)) + (agenda.length > 5 ? '<button class="w-mas" data-ir="calendario">+' + (agenda.length - 5) + ' más</button>' : '') : '<p class="nada">Sin eventos ni avisos hoy.</p>');
  }
  /* Al final de la tarde: cómo te fue y qué trae mañana */
  if(hoyVisible('ahora') && h >= 18) html += widgetCierre(hoy, hechas, tareasHoy.length);
  if(hoyVisible('viene')) html += widgetManana(hoy);

  /* Hábitos, agua y plata: bloques que se tocan */
  if(hoyVisible('hacer')){
    var wd = ahora.getDay(), CH = 2 * Math.PI * 20;
    var hab = vivos('habitos').filter(function(x){ return !x.dias || x.dias.indexOf(wd) >= 0; });
    var habOk = hab.filter(function(x){ return x.marcas && x.marcas[hoy]; }).length;
    html += w('w-2 w-habitos', 'Hábitos', habOk + '/' + hab.length, 'data-ir="habitos"',
      hab.length ? '<div class="w-habs">' + hab.map(function(x){
        var ok = !!(x.marcas && x.marcas[hoy]);
        return '<button type="button" class="w-hab' + (ok ? ' ok' : '') + '" data-acc="habito-hoy" data-id="' + x.id + '" aria-pressed="' + ok + '" title="' + esc(x.nombre) + '">' +
          '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" class="f"/><circle cx="24" cy="24" r="20" class="v" stroke-dasharray="' + CH.toFixed(1) + '" stroke-dashoffset="' + (ok ? 0 : CH).toFixed(1) + '"/></svg>' +
          '<span class="em">' + esc(x.em || '⭐') + '</span><small>' + esc(x.nombre) + '</small></button>';
      }).join('') + '</div>' : '<p class="nada">Crea tu primer hábito. <button class="btn chico" data-acc="nuevo" data-tipo="habito">Crear</button></p>');
  }
  if(hoyVisible('dinero')){
    /* Dinero del mes: lo gastado y lo que entró, cada uno con su botón */
    var ppH = pagosProximos(7);
    html += '<section class="w w-2 w-dinero-hoy"><header class="w-cab"><b>Tu dinero este mes</b>' + (ppH.length ? '<span class="w-n">' + ppH.length + ' por pagar</span>' : '') +
      '<button class="ver-link" data-ir="panel-dinero">Ver todo ' + ico('i-der') + '</button></header>' + bloquesDinero('todo') + '</section>';
  }

  /* Tus 3 prioridades */
  if(hoyVisible('hacer')){
    var enf = buscarId('enfoque', hoy), ei = (enf && !enf.del && enf.items) || [];
    html += w('w-2 w-prio', 'Tus 3 prioridades', null, '', '<div class="enfoque-grande enfoque">' + [0,1,2].map(function(i){
      var x = ei[i] || { t:'', ok:false };
      return '<label class="' + (x.ok ? 'hecho' : '') + '"><span class="n">' + (i + 1) + '</span>' +
        '<input type="text" maxlength="120" data-enfoque="' + i + '" value="' + esc(x.t) + '" placeholder="' + ['Lo más importante','Lo segundo','Lo tercero'][i] + '">' +
        casilla('enfoque-ok', String(i), x.ok, 'var(--haber)', true) + '</label>';
    }).join('') + '</div>');
  }

  /* Lo que viene: lo próximo de la semana y la cuenta atrás más cercana */
  if(hoyVisible('viene')){
    var prox = [];
    for(var i = 1; i <= 7 && prox.length < 3; i++){
      var d = sumarDias(hoy, i);
      itemsDelDia(d).forEach(function(x){ if(x.tipo !== 'tarea' && x.tipo !== 'clase' && !x.hecho && prox.length < 3) prox.push({ d:d, x:x }); });
    }
    var cr = cuentasRegresivas()[0];
    if(prox.length || cr){
      html += w('w-2 w-viene', 'Lo que viene', null, 'data-ir="calendario"',
        (cr ? '<button type="button" class="w-regre" style="--c:' + (cr.e.cumple ? 'var(--rosa)' : colorEsp(cr.e)) + '" data-acc="evento-ed" data-id="' + cr.e.id + '"><b>' + (cr.en === 0 ? '¡Hoy!' : cr.en) + '</b><span>' + (cr.en === 0 ? '' : cr.en === 1 ? 'día para' : 'días para') + '<em>' + esc(cr.e.t) + '</em></span></button>' : '') +
        (prox.length ? '<div class="lista-filas">' + prox.map(function(p){
          var acc = { rec:'rec-ed', pago:'pago-ed', evento:'evento-ed' }[p.x.tipo];
          return '<div class="fila"><span class="hora">' + cap(relativo(p.d)).slice(0, 9) + (p.x.hora ? '<br>' + p.x.hora : '') + '</span><span class="barrita" style="--c:' + p.x.c + '"></span>' +
            '<div class="cuerpo" data-acc="' + acc + '" data-id="' + p.x.id + '"><div class="titulo">' + esc(p.x.t) + '</div></div></div>';
        }).join('') + '</div>' : ''));
    }
  }

  /* Notas fijadas: solo los títulos, tocables */
  var fijas = vivos('notas').filter(function(n){ return n.fija; });
  if(fijas.length && hoyVisible('notas')){
    html += w('w-2 w-notas', 'Fijadas', fijas.length, 'data-ir="notas"', '<div class="w-chips">' + fijas.slice(0, 6).map(function(n){
      return '<button type="button" class="ficha" data-acc="nota-ed" data-id="' + n.id + '">' + ico('i-pin') + esc(n.t || (n.cuerpo || '').slice(0, 24)) + '</button>';
    }).join('') + '</div>');
  }
  html += '</div>';
  html += '<div class="pie-hoy"><button class="btn chico" data-acc="personalizar-hoy">' + ico('i-ajustes') + 'Elegir qué ver en Hoy</button></div>';
  return html;
};
/* Tus cuatro espacios en grande: cuánto tienen hoy, lo próximo y cómo vas */
function espaciosHoy(hoy){
  return '<section class="w w-2 esp-hoy"><header class="w-cab"><b>Tus espacios</b></header><div class="eh-rejilla">' + ESPACIOS.map(function(E){
    var ts = vivos('tareas').filter(function(t){ return espDe(t) === E.id; });
    var pend = ts.filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; }).length;
    var hechas = ts.filter(function(t){ return t.hecha && t.hechaEn && iso(new Date(t.hechaEn)) === hoy; }).length;
    var ag = agendaEsp(E.id, 7), hoyAg = ag.filter(function(a){ return a.d === hoy && a.x.tipo !== 'tarea'; }).length;
    var prox = ag.filter(function(a){ return a.x.tipo !== 'tarea'; })[0] || ag[0];
    var total = pend + hoyAg, p = hechas + pend ? hechas / (hechas + pend) : (total ? 0 : 1);
    var cuando = prox ? (prox.d === hoy ? (prox.x.hora ? prox.x.hora : 'hoy') : relativo(prox.d).toLowerCase().slice(0, 10) + (prox.x.hora ? ' ' + prox.x.hora : '')) : '';
    return '<button type="button" class="eh" data-ir="esp-' + E.id + '" style="--ec:' + E.c + '">' +
      '<span class="eh-cab"><span class="eh-em">' + E.em + '</span><b>' + E.nom + '</b></span>' +
      '<span class="eh-num"><strong>' + total + '</strong><em>' + (total === 1 ? 'cosa para hoy' : 'cosas para hoy') + '</em></span>' +
      '<span class="eh-prox">' + (prox ? '<i>Próximo</i>' + esc(prox.x.t) + ' · ' + cuando : '<i>Libre</i>' + esc(E.lema)) + '</span>' +
      '<span class="eh-barra"><i style="width:' + Math.round(p * 100) + '%"></i></span>' +
      '<span class="eh-pie">' + (hechas ? hechas + ' ' + (hechas === 1 ? 'hecha' : 'hechas') + ' hoy' : pend ? pend + ' ' + (pend === 1 ? 'tarea pendiente' : 'tareas pendientes') : 'Al día ✓') + '</span>' +
    '</button>';
  }).join('') + '</div></section>';
}

/* Lo que toca ahora, en frases, cada una con su botón que te lleva */
function queHacerAhora(hoy, h){
  var k = contadores(), out = [];
  function s(c, i, txt, btn, attrs){ out.push('<div class="qh-fila" style="--qc:' + c + '"><span class="qh-ico">' + ico(i) + '</span><span class="qh-txt">' + txt + '</span><button type="button" class="qh-btn" ' + attrs + '>' + btn + '</button></div>'); }
  if(k.recordatorios) s('var(--debe)', 'i-campana', 'Tienes <b>' + k.recordatorios + (k.recordatorios === 1 ? ' aviso pasado' : ' avisos pasados') + '</b> sin marcar', 'Ver', 'data-ir="recordatorios"');
  var tarde = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha < hoy; }).length;
  if(tarde) s('var(--debe)', 'i-tareas', '<b>' + tarde + (tarde === 1 ? ' tarea atrasada' : ' tareas atrasadas') + '</b>: decide qué hacer con cada una', 'Ordenar', 'data-acc="ordenar"');
  var pv = pagosProximos(0);
  if(pv.length) s('var(--oro)', 'i-recibo', 'Pago de <b>' + esc(pv[0].p.t) + '</b> ' + (pv.length > 1 ? 'y ' + (pv.length - 1) + ' más ' : '') + 'por pagar', 'Pagar', 'data-ir="pagos"');
  var wd = new Date().getDay(), hab = vivos('habitos').filter(function(x){ return !x.dias || x.dias.indexOf(wd) >= 0; });
  var falta = hab.filter(function(x){ return !(x.marcas && x.marcas[hoy]); }).length;
  if(hab.length && falta && h >= 12) s('var(--azul)', 'i-habitos', 'Te ' + (falta === 1 ? 'falta <b>1 hábito</b>' : 'faltan <b>' + falta + ' hábitos</b>') + ' de hoy', 'Marcar', 'data-ir="habitos"');
  var gastoHoy = libroDatos('personal').some(function(t){ return t.date === hoy; });
  if(!gastoHoy && h >= 13) s('var(--haber)', 'i-bajar', '¿Gastaste algo hoy? <b>Anótalo</b> en 5 segundos', 'Anotar', 'data-acc="din-anotar" data-libro="personal" data-t="Gasto"');
  var di = buscarId('diario', hoy);
  if(h >= 20 && !(di && !di.del && di.texto)) s('var(--rosa)', 'i-diario', 'Cierra el día: <b>cuenta cómo te fue</b>', 'Escribir', 'data-ir="diario"');
  var tHoy = vivos('tareas').filter(function(t){ return t.fecha === hoy; }).length;
  if(!tHoy && h < 14) s('var(--verde)', 'i-plus', 'Aún no tienes tareas para hoy: <b>planea tu día</b>', 'Añadir', 'data-acc="nuevo" data-tipo="tarea"');
  if(!out.length) return '<section class="w w-2 qh"><header class="w-cab"><b>Qué hacer ahora</b></header><p class="qh-ok">Todo al día. 👌 Si quieres añadir algo, toca el <b>+</b>.</p></section>';
  return '<section class="w w-2 qh"><header class="w-cab"><b>Qué hacer ahora</b><span class="w-n">' + out.length + '</span></header>' + out.slice(0, 5).join('') + '</section>';
}

/* Mañana: lo agendado, las tareas y los pagos que tocan */
function widgetManana(hoy){
  var m = sumarDias(hoy, 1), its = itemsDelDia(m);
  var ag = its.filter(function(x){ return x.tipo !== 'tarea' && !x.hecho; });
  var nt = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha === m; }).length;
  var pagos = ag.filter(function(x){ return x.tipo === 'pago'; }).length;
  var primero = ag.filter(function(x){ return x.hora; })[0];
  var res = [];
  if(primero) res.push('Empiezas a las <b>' + primero.hora + '</b>');
  if(nt) res.push('<b>' + nt + '</b> ' + (nt === 1 ? 'tarea' : 'tareas'));
  if(pagos) res.push('<b>' + pagos + '</b> ' + (pagos === 1 ? 'pago' : 'pagos'));
  return '<section class="w w-2 w-manana"><header class="w-cab"><b>Mañana</b><span class="w-n">' + cap(DIAS[deISO(m).getDay()]).slice(0, 3) + ' ' + deISO(m).getDate() + '</span>' +
    '<button class="ver-link" data-acc="cal-ir-dia-hoy" data-dia="' + m + '">Ver día ' + ico('i-der') + '</button></header>' +
    (res.length ? '<p class="manana-res">' + res.join(' · ') + '</p>' : '') +
    (ag.length ? '<div class="lista-filas">' + ag.slice(0, 4).map(function(x){
      var acc = { rec:'rec-ed', pago:'pago-ed', evento:'evento-ed', clase:'curso-ed' }[x.tipo] || 'evento-ed';
      return '<div class="fila"><span class="hora">' + (x.hora || 'Todo<br>el día') + '</span><span class="barrita" style="--c:' + x.c + '"></span>' +
        '<div class="cuerpo" data-acc="' + acc + '" data-id="' + x.id + '"><div class="titulo">' + esc(x.t) + '</div></div></div>';
    }).join('') + (ag.length > 4 ? '<button class="w-mas" data-acc="cal-ir-dia-hoy" data-dia="' + m + '">+' + (ag.length - 4) + ' más</button>' : '') + '</div>'
    : '<p class="nada">' + (nt ? 'Sin eventos: día para avanzar pendientes.' : 'Mañana lo tienes libre. 🌿') + '</p>') +
    '<div class="w-pie"><button class="btn chico" data-acc="cal-nuevo" data-tipo="evento" data-dia="' + m + '">' + ico('i-plus') + 'Evento mañana</button>' +
      '<button class="btn chico" data-acc="cal-nuevo" data-tipo="tarea" data-dia="' + m + '">' + ico('i-plus') + 'Tarea mañana</button></div></section>';
}
/* Cierre del día: lo que hiciste hoy, en números */
function widgetCierre(hoy, hechas, total){
  var wd = new Date().getDay(), hab = vivos('habitos').filter(function(x){ return !x.dias || x.dias.indexOf(wd) >= 0; });
  var habOk = hab.filter(function(x){ return x.marcas && x.marcas[hoy]; }).length, gasto = 0, ent = 0;
  ['personal', 'oficina'].forEach(function(l){ libroDatos(l).forEach(function(t){ if(t.date === hoy && t.type === 'Gasto') gasto += t.amount; }); });
  vivos('entrenos').forEach(function(e){ if(e.fecha === hoy) ent += +e.min || 0; });
  var d = buscarId('diario', hoy), escrito = d && !d.del && d.texto;
  var num = function(v, t){ return '<div><b>' + v + '</b><small>' + t + '</small></div>'; };
  return '<section class="w w-2 w-cierre"><header class="w-cab"><b>Tu día en números</b></header>' +
    '<div class="cierre-nums">' + num(hechas + '/' + total, 'tareas') + (hab.length ? num(habOk + '/' + hab.length, 'hábitos') : '') + num(dinero(gasto), 'gastado') + (ent ? num(ent + ' min', 'de deporte') : '') + '</div>' +
    '<div class="w-pie">' + (escrito ? '<span class="nada" style="padding:0">📖 Ya escribiste en tu diario.</span>' : '<button class="btn chico primario" data-ir="diario">📖 Contar cómo te fue</button>') + '</div></section>';
}
function personalizarHoy(){
  abrirFlotante(cabFlot('Qué ver en Hoy') + '<p class="explica">Oculta las secciones que no uses; el saludo y la captura siempre se quedan.</p>' +
    '<div class="lista-interruptores">' + SECC_HOY.map(function(s){
      return '<label class="interruptor"><input type="checkbox" data-hoy-secc="' + s[0] + '"' + (hoyVisible(s[0]) ? ' checked' : '') + '>' + s[1] + '</label>';
    }).join('') + '</div><div class="botones"><button class="btn primario" data-cerrar="1">Listo</button></div>', function(){ pintar(); });
}
/* ==========================================================================
   ESPACIOS
   La vida en cuatro: Personal, Estudios, Oficina y Deporte. Cada tarea,
   evento, recordatorio, nota, lista, hábito, meta y pago pertenece a uno,
   y cada espacio tiene su panel con su calendario, sus tareas, su dinero y
   las herramientas que solo tienen sentido ahí (cursos y exámenes en
   Estudios, entrenamientos y peso en Deporte, reuniones en Oficina).
   ========================================================================== */
var TIPOS_EV = {
  evento:  { n:'Evento',  em:'📅' },
  reunion: { n:'Reunión', em:'🤝' },
  examen:  { n:'Examen',  em:'📝' },
  partido: { n:'Partido', em:'⚽' },
  cita:    { n:'Cita',    em:'🩺' }
};
var ESPACIOS = [
  { id:'personal', nom:'Personal', em:'🏠', ico:'i-casa',    c:'var(--esp-personal)', lema:'Tu casa, tu gente y tus cosas' },
  { id:'estudios', nom:'Estudios', em:'🎓', ico:'i-birrete', c:'var(--esp-estudios)', lema:'Clases, exámenes y horas de estudio' },
  { id:'oficina',  nom:'Oficina',  em:'💼', ico:'i-maletin', c:'var(--esp-oficina)',  lema:'Trabajo, reuniones y cuentas de la oficina' },
  { id:'deporte',  nom:'Deporte',  em:'⚽', ico:'i-balon',   c:'var(--esp-deporte)',  lema:'Fútbol, gym y todo lo que te mueve' }
];
function espInfo(id){ return ESPACIOS.find(function(e){ return e.id === id; }) || ESPACIOS[0]; }

/* De qué espacio es una cosa. Lo viejo, sin espacio, se deduce de su área */
function espDe(x){
  if(x && x.esp && espInfo(x.esp).id === x.esp) return x.esp;
  return espDeTexto(x && (x.area || x.cat || '')) || 'personal';
}
function espDeTexto(t){
  t = sinTildes(t || '');
  if(!t) return '';
  if(/^(estudio|estudios|uni|universidad|cole|colegio|clase|clases|curso|cursos|examen|tesis)$/.test(t)) return 'estudios';
  if(/^(oficina|trabajo|chamba|work|empresa|clientes?|negocio)$/.test(t)) return 'oficina';
  if(/^(deporte|deportes|gym|gimnasio|futbol|fulbito|pichanga|correr|entreno|ejercicio|salud)$/.test(t)) return 'deporte';
  if(/^(personal|casa|hogar|familia|dinero)$/.test(t)) return 'personal';
  return '';
}
function espPorDefecto(){
  if(ui.vista.indexOf('esp-') === 0) return ui.vista.slice(4);
  if(ui.vista === 'tareas' && ui.tEsp) return ui.tEsp;
  if(ui.vista === 'calendario' && ui.calEsp) return ui.calEsp;
  return 'personal';
}
function selectorEsp(actual){
  return grupo('Espacio', selector('esp', ESPACIOS.map(function(e){ return { v:e.id, n:e.em + ' ' + e.nom, c:e.c }; }), actual || espPorDefecto(), 'espacios'));
}
function colorEsp(x){ return espInfo(espDe(x)).c; }
function chipEsp(x){ var e = espInfo(espDe(x)); return '<span class="chip-esp" style="--c:' + e.c + '">' + e.nom + '</span>'; }
function filtroEsp(acc, actual){
  return '<div class="fichas desliza">' +
    '<button type="button" class="ficha" data-acc="' + acc + '" data-v="" aria-pressed="' + !actual + '">Todos</button>' +
    ESPACIOS.map(function(e){
      return '<button type="button" class="ficha ficha-esp" style="--c:' + e.c + '" data-acc="' + acc + '" data-v="' + e.id + '" aria-pressed="' + (actual === e.id) + '">' + e.em + ' ' + e.nom + '</button>';
    }).join('') + '</div>';
}

/* ---------- Cursos: sus clases salen solas en el calendario -------------- */
function clasesDelDia(dia){
  var w = deISO(dia).getDay(), out = [];
  vivos('cursos').forEach(function(c){
    if(c.inicio && dia < c.inicio) return;
    if(c.fin && dia > c.fin) return;
    (c.clases || []).forEach(function(k){
      if(+k.d === w) out.push({ tipo:'clase', id:c.id, t:c.nombre, hora:k.ini || '', fin:k.fin || '', c:'var(--esp-estudios)', lugar:c.aula || '', esp:'estudios', o:c });
    });
  });
  return out;
}
function proximaClase(c){
  var hoy = hoyISO(), ya = horaAhora();
  for(var i = 0; i < 15; i++){
    var d = sumarDias(hoy, i), w = deISO(d).getDay();
    if(c.inicio && d < c.inicio) continue;
    if(c.fin && d > c.fin) return null;
    var ks = (c.clases || []).filter(function(k){ return +k.d === w && (i > 0 || (k.fin || k.ini) >= ya); })
      .sort(function(a, b){ return (a.ini || '').localeCompare(b.ini || ''); });
    if(ks.length) return { dia:d, k:ks[0] };
  }
  return null;
}
function editarCurso(id){
  var c = id ? JSON.parse(JSON.stringify(buscarId('cursos', id))) : { id:nid(), nombre:'', prof:'', aula:'', clases:[{ d:1, ini:'08:00', fin:'10:00' }], inicio:'', fin:'', creada:Date.now() };
  var orden = pref.lunes ? [1,2,3,4,5,6,0] : [0,1,2,3,4,5,6];
  function filaClase(k){
    return '<div class="fila-clase"><select>' + orden.map(function(d){ return '<option value="' + d + '"' + (+k.d === d ? ' selected' : '') + '>' + cap(DIAS[d]) + '</option>'; }).join('') + '</select>' +
      '<input type="time" value="' + esc(k.ini || '') + '"><input type="time" value="' + esc(k.fin || '') + '">' +
      '<button type="button" class="btn-icono" data-ed="clase-x" aria-label="Quitar">' + ico('i-x') + '</button></div>';
  }
  abrirFlotante(cabFlot(id ? 'Curso' : 'Nuevo curso') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Curso o materia', '<input name="n" required maxlength="80" value="' + esc(c.nombre) + '" placeholder="Ej. Matemática II, Inglés intermedio">') +
      '<div class="fila-campos">' + campo('Profesor', '<input name="p" maxlength="60" value="' + esc(c.prof) + '" placeholder="Opcional">') +
        campo('Aula o enlace', '<input name="a" maxlength="80" value="' + esc(c.aula) + '" placeholder="Ej. Aula 204, Zoom">') + '</div>' +
      grupo('Horario de clases', '<div id="clases" class="clases">' + (c.clases || []).map(filaClase).join('') + '</div>' +
        '<button type="button" class="btn chico" data-ed="clase-add" style="align-self:flex-start;margin-top:4px">' + ico('i-plus') + 'Otra clase</button>') +
      grupo('Notas del curso (sobre 20)', '<div id="notasCurso" class="clases">' + (c.notas || []).map(filaNota).join('') + '</div>' +
        '<button type="button" class="btn chico" data-ed="nota-add" style="align-self:flex-start;margin-top:4px">' + ico('i-plus') + 'Añadir nota</button>' +
        '<small style="color:var(--tinta-3)">Nombre de la evaluación, nota y peso en %. Si no pones pesos, cuentan igual. Con pesos que sumen 100, te digo cuánto necesitas en lo que falta para aprobar.</small>') +
      '<div class="fila-campos">' + campo('Faltas que llevas', '<input name="fa" inputmode="numeric" value="' + esc(c.faltas || '') + '" placeholder="0">') +
        campo('Máximo de faltas permitidas', '<input name="mf" inputmode="numeric" value="' + esc(c.maxFaltas || '') + '" placeholder="Ej. 6 (30%)">') + '</div>' +
      '<div class="fila-campos">' + campo('Empieza el', '<input type="date" name="i" value="' + esc(c.inicio) + '">') +
        campo('Termina el', '<input type="date" name="f" value="' + esc(c.fin) + '">') + '</div>' +
      '<small style="color:var(--tinta-3)">Las clases aparecen solas en el calendario y en Estudios, cada semana, entre esas fechas.</small>' +
      botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  if(!id) f.n.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    c.nombre = f.n.value.trim(); if(!c.nombre) return;
    c.prof = f.p.value.trim(); c.aula = f.a.value.trim(); c.inicio = f.i.value; c.fin = f.f.value;
    c.faltas = parseInt(f.fa.value, 10) || 0; c.maxFaltas = parseInt(f.mf.value, 10) || 0;
    c.clases = [].slice.call(document.querySelectorAll('#clases .fila-clase')).map(function(r){
      var s = r.querySelectorAll('select,input');
      return { d:+s[0].value, ini:s[1].value, fin:s[2].value };
    }).filter(function(k){ return k.ini; });
    c.notas = [].slice.call(document.querySelectorAll('#notasCurso .fila-clase')).map(function(r){
      var s = r.querySelectorAll('input');
      return { n:s[0].value.trim(), v:s[1].value === '' ? '' : Math.max(0, Math.min(20, num(s[1].value))), p:num(s[2].value) || '' };
    }).filter(function(x){ return x.n || x.v !== ''; });
    poner('cursos', c); cerrarFlotante(); pintar();
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); quitar('cursos', c.id, 'Curso borrado'); pintar(); },
    'clase-add': function(){ $('clases').insertAdjacentHTML('beforeend', filaClase({ d:orden[0], ini:'', fin:'' })); },
    'clase-x': function(b){ b.parentNode.remove(); },
    'nota-add': function(){ $('notasCurso').insertAdjacentHTML('beforeend', filaNota({ n:'', v:'', p:'' })); var ins = $('notasCurso').querySelectorAll('input'); ins[ins.length - 3].focus(); }
  };
}
function filaNota(x){
  return '<div class="fila-clase nota-curso"><input placeholder="Ej. Parcial" value="' + esc(x.n || '') + '" maxlength="40">' +
    '<input inputmode="decimal" placeholder="Nota" value="' + esc(x.v === '' || x.v == null ? '' : x.v) + '">' +
    '<input inputmode="decimal" placeholder="Peso %" value="' + esc(x.p || '') + '">' +
    '<button type="button" class="btn-icono" data-ed="clase-x" aria-label="Quitar">' + ico('i-x') + '</button></div>';
}
/* Promedio ponderado; sin pesos, simple. Solo cuenta lo que ya tiene nota */
function promedioCurso(c){
  var ns = (c.notas || []).filter(function(x){ return x.v !== '' && x.v != null; });
  if(!ns.length) return null;
  var conPeso = ns.every(function(x){ return +x.p > 0; });
  var suma = 0, pesos = 0;
  ns.forEach(function(x){ var p = conPeso ? +x.p : 1; suma += +x.v * p; pesos += p; });
  return pesos ? suma / pesos : null;
}
function promedioGeneral(){
  var ps = vivos('cursos').map(promedioCurso).filter(function(p){ return p != null; });
  return ps.length ? ps.reduce(function(a, b){ return a + b; }, 0) / ps.length : null;
}
function chipNota(p){ return p == null ? '' : '<span class="nota-chip ' + (p >= 10.5 ? 'ok' : 'mal') + '">' + p.toFixed(1) + '</span>'; }

/* ---------- Entrenamientos y peso ---------------------------------------- */
var DEPORTES = [
  { v:'futbol', n:'Fútbol', em:'⚽' }, { v:'gym', n:'Gym', em:'🏋️' }, { v:'correr', n:'Correr', em:'🏃' },
  { v:'bici', n:'Bici', em:'🚴' }, { v:'nadar', n:'Nadar', em:'🏊' }, { v:'otro', n:'Otro', em:'💪' }
];
function deporteInfo(v){ return DEPORTES.find(function(d){ return d.v === v; }) || DEPORTES[5]; }
var INTENS = ['', 'Suave', 'Medio', 'Duro'];
function editarEntreno(id, preset){
  var x = id ? JSON.parse(JSON.stringify(buscarId('entrenos', id))) : Object.assign({ id:nid(), fecha:hoyISO(), tipo:ui.entTipo || 'gym', min:60, km:'', int:2, notas:'' }, preset || {});
  abrirFlotante(cabFlot(id ? 'Entrenamiento' : 'Nuevo entrenamiento') +
    '<form class="form" id="formEd" autocomplete="off">' +
      grupo('Qué hiciste', selector('tipo', DEPORTES.map(function(d){ return { v:d.v, n:d.em + ' ' + d.n }; }), x.tipo)) +
      '<div class="fila-campos tres">' + campo('Día', '<input type="date" name="f" value="' + esc(x.fecha) + '">') +
        campo('Minutos', '<input name="m" inputmode="numeric" value="' + esc(x.min) + '">') +
        campo('Km (opcional)', '<input name="k" inputmode="decimal" value="' + esc(x.km) + '">') + '</div>' +
      grupo('Intensidad', selector('int', [1,2,3].map(function(i){ return { v:String(i), n:INTENS[i] }; }), String(x.int || 2))) +
      (vivos('rutinas').length ? campo('Rutina', '<select id="selRutina"><option value="">— Sin rutina —</option>' + vivos('rutinas').map(function(r){ return '<option value="' + r.id + '"' + (x.rutina === r.id ? ' selected' : '') + '>' + esc(r.nombre) + '</option>'; }).join('') + '</select>') : '') +
      grupo('Ejercicios (opcional)', '<div class="ej-cab"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>Kg</span><span></span></div><div id="ejsEnt" class="clases">' + (x.ejs || []).map(filaEj).join('') + '</div>' +
        '<button type="button" class="btn chico" data-ed="ej-add" style="align-self:flex-start;margin-top:4px">' + ico('i-plus') + 'Ejercicio</button>') +
      campo('Notas', '<textarea name="n" maxlength="1000" placeholder="Ej. Pecho y tríceps · ganamos 5-3 · 10 series de 100 m">' + esc(x.notas) + '</textarea>') +
      botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  f.onsubmit = function(ev){
    ev.preventDefault();
    x.tipo = leerSelector('tipo') || 'otro'; x.fecha = f.f.value || hoyISO();
    x.min = Math.max(0, parseInt(f.m.value, 10) || 0); x.km = num(f.k.value) || '';
    x.int = +leerSelector('int') || 2; x.notas = f.n.value.trim();
    x.rutina = $('selRutina') ? $('selRutina').value : (x.rutina || '');
    var antes = {}; records().forEach(function(r){ antes[normEj(r.n)] = r.max; });
    x.ejs = leerEjs('ejsEnt');
    poner('entrenos', x); cerrarFlotante(); pintar();
    var nuevos = x.ejs.filter(function(e){ var k = normEj(e.n); return +e.p && antes[k] != null && +e.p > antes[k]; });
    if(nuevos.length){ confeti(); aviso('🏆 ¡Nuevo récord!', nuevos.map(function(e){ return e.n + ': ' + formNum(+e.p) + ' kg'; }).join(' · ')); return; }
    if(!id) aviso(deporteInfo(x.tipo).em + ' Entrenamiento guardado', x.min + ' min' + (x.km ? ' · ' + x.km + ' km' : ''));
  };
  var sr = $('selRutina');
  if(sr) sr.onchange = function(){
    if(!sr.value) return;
    $('ejsEnt').innerHTML = ejsDeRutina(sr.value).map(filaEj).join('');
    document.querySelectorAll('[data-grupo="tipo"] button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.sel === 'gym'); });
    var rr = buscarId('rutinas', sr.value); if(rr && !f.n.value) f.n.value = rr.nombre;
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); quitar('entrenos', x.id, 'Entrenamiento borrado'); pintar(); },
    'ej-add': function(){ $('ejsEnt').insertAdjacentHTML('beforeend', filaEj({ n:'', s:3, r:10, p:'' })); var i = $('ejsEnt').querySelectorAll('.fila-ej input'); i[i.length - 4].focus(); },
    'ej-x': function(b){ b.parentNode.remove(); }
  };
}
function semanasSeguidas(){
  /* Semanas seguidas con al menos un entrenamiento, contando la actual si ya hay */
  var dias = {}; vivos('entrenos').forEach(function(e){ dias[e.fecha] = 1; });
  var ini = inicioSemana(hoyISO()), n = 0;
  function hay(desde){ for(var i = 0; i < 7; i++) if(dias[sumarDias(desde, i)]) return true; return false; }
  var s = hay(ini) ? ini : sumarDias(ini, -7);
  while(hay(s) && n < 520){ n++; s = sumarDias(s, -7); }
  return n;
}

/* ---------- Cobros de la oficina ----------------------------------------- */
function editarCobro(id, preset){
  var x = id ? JSON.parse(JSON.stringify(buscarId('cobros', id))) : Object.assign({ id:nid(), cliente:'', concepto:'', monto:'', vence:sumarDias(hoyISO(), 15), cobrado:0, esp:'oficina' }, preset || {});
  abrirFlotante(cabFlot(id ? 'Cobro' : 'Nuevo cobro') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Cliente', '<input name="c" required maxlength="60" value="' + esc(x.cliente) + '" placeholder="Ej. Empresa ABC">') +
      campo('Concepto', '<input name="k" maxlength="80" value="' + esc(x.concepto) + '" placeholder="Ej. Factura F001-123, asesoría de agosto">') +
      '<div class="fila-campos">' + campo('Monto (' + MONEDA + ')', '<input name="m" inputmode="decimal" required value="' + esc(x.monto) + '">') +
        campo('Vence el', '<input type="date" name="v" value="' + esc(x.vence) + '">') + '</div>' +
      botonesEd(!!id) + '</form>');
  var f = $('formEd');
  if(!id) f.c.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    x.cliente = f.c.value.trim(); if(!x.cliente) return;
    x.concepto = f.k.value.trim(); x.monto = Math.round(num(f.m.value) * 100) / 100; x.vence = f.v.value;
    poner('cobros', x); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('cobros', x.id, 'Cobro borrado'); pintar(); } };
}
function cobrar(id, boton){
  var x = buscarId('cobros', id);
  if(!x) return;
  var idMov = 'cobro-' + x.id;
  x.cobrado = Date.now(); poner('cobros', x);
  if(+x.monto) cambiarLibro('oficina', function(l){ return l.filter(function(t){ return t.id !== idMov; }).concat([{ id:idMov, date:hoyISO(), desc:'Cobro: ' + x.cliente + (x.concepto ? ' – ' + x.concepto : ''), type:'Ingreso', amount:+x.monto, cat:'Ventas' }]); });
  if(boton){ boton.setAttribute('aria-checked', 'true'); boton.classList.add('pop'); }
  aviso('💰 Cobrado', x.cliente + ' · ' + dinero(+x.monto || 0) + ' anotado en la oficina', 'Deshacer', function(){
    x.cobrado = 0; poner('cobros', x);
    cambiarLibro('oficina', function(l){ return l.filter(function(t){ return t.id !== idMov; }); });
    pintar();
  });
  setTimeout(pintarSeguro, 300);
}

/* ---------- Panel de un espacio -------------------------------------------- */
function agendaEsp(id, dias){
  var hoy = hoyISO(), out = [];
  for(var i = 0; i < dias; i++){
    var d = sumarDias(hoy, i);
    itemsDelDia(d).forEach(function(x){ if(x.esp === id && !x.hecho) out.push({ d:d, x:x }); });
  }
  return out;
}
function dineroEsp(id){
  if(id === 'oficina') return { libro:'oficina', lista:libroDatos('oficina'), cat:'' };
  var todo = libroDatos('personal');
  if(id === 'estudios') return { libro:'personal', cat:'Estudios', lista:todo.filter(function(t){ return espDeTexto(t.cat) === 'estudios'; }) };
  if(id === 'deporte') return { libro:'personal', cat:'Deporte', lista:todo.filter(function(t){ return espDeTexto(t.cat) === 'deporte'; }) };
  return { libro:'personal', cat:'', lista:todo };
}

/* Adorno de fondo del saludo de cada espacio: la cancha, la pizarra,
   la oficina y la casa */
var DECO_ESP = {
  deporte:'<svg class="deco" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="#fff" stroke-width="2.5"><rect x="8" y="8" width="384" height="184" rx="4"/><path d="M200 8v184"/><circle cx="200" cy="100" r="36"/><rect x="8" y="52" width="58" height="96"/><rect x="8" y="78" width="22" height="44"/><rect x="334" y="52" width="58" height="96"/><rect x="370" y="78" width="22" height="44"/><path d="M66 78a26 26 0 0 1 0 44M334 78a26 26 0 0 0 0 44"/></g><circle cx="200" cy="100" r="3.5" fill="#fff"/></svg>',
  estudios:'<div class="deco tiza" aria-hidden="true"><span style="left:52%;top:14%">∫ x² dx = x³⁄3</span><span style="left:70%;top:52%">a² + b² = c²</span><span style="left:46%;top:70%">E = mc²</span><span style="left:84%;top:22%">π ≈ 3,14</span></div>',
  oficina:'<svg class="deco deco-der" viewBox="226 16 170 184" preserveAspectRatio="xMaxYMax meet" aria-hidden="true"><g fill="#fff"><rect x="250" y="120" width="18" height="80" rx="2"/><rect x="276" y="95" width="18" height="105" rx="2"/><rect x="302" y="105" width="18" height="95" rx="2"/><rect x="328" y="70" width="18" height="130" rx="2"/><rect x="354" y="45" width="18" height="155" rx="2"/></g><path d="M236 128 285 92 311 102 337 66 386 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="m372 26 14 4-4 14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  personal:'<div class="deco burbujas" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'
};
VISTAS.espacio = function(id){
  var E = espInfo(id), hoy = hoyISO(), ym = hoy.slice(0, 7);
  ui.espUlt = id;
  var tareas = vivos('tareas').filter(function(t){ return espDe(t) === id && !t.hecha; }).sort(ordenTareas);
  var paraHoy = tareas.filter(function(t){ return t.fecha && t.fecha <= hoy; });
  var ag7 = agendaEsp(id, 7);
  var hoyItems = ag7.filter(function(a){ return a.d === hoy && a.x.tipo !== 'tarea'; });
  var din = dineroEsp(id), tm = totalesMes(din.lista, ym);

  /* Portada del espacio: una franja de su color a todo lo ancho, el
     nombre en grande y los otros espacios como círculos para saltar */
  var prox = ag7.filter(function(a){ return a.x.tipo !== 'tarea'; })[0];
  var html = '<header class="portada-esp esp-heroe tema-' + id + '" style="--ec:' + E.c + '">' +
    '<nav class="pe-cambia cambia-esp" aria-label="Espacios">' + ESPACIOS.map(function(e){
      return '<button type="button" data-ir="esp-' + e.id + '" style="--c:' + e.c + '" aria-pressed="' + (e.id === id) + '" title="' + e.nom + '" aria-label="' + e.nom + '"><span>' + e.em + '</span></button>';
    }).join('') + '</nav>' +
    '<span class="pe-em">' + E.em + '</span>' +
    '<h2 class="pe-nom">' + E.nom + '</h2>' +
    '<p class="pe-lema">' + (prox ? 'Lo próximo: <b>' + esc(prox.x.t) + '</b> · ' + relativo(prox.d).toLowerCase() + (prox.x.hora ? ' ' + prox.x.hora : '') : E.lema) + '</p>' +
    '<div class="pe-datos datos">' + datosHeroe(id) + '</div></header>';

  var tab = tabEsp(id);
  html += pestanasEsp(id);
  if(tab === 'inicio'){
    var ph = { personal:'Añade algo de tu vida… ej. «llamar a mamá el domingo»', estudios:'Ej. «entregar monografía el viernes !!»', oficina:'Ej. «reunión con el cliente mañana a las 10»', deporte:'Ej. «pichanga el sábado a las 5»' }[id];
    html += botonAnadir('tarea', 'Añadir en ' + E.nom + '…');
  }
  return html + '<div class="rejilla dos esp-' + tab + '">' + MODULOS[id](tab) + '</div>';
};
function tarjetaProyEsp(id){
  var E = espInfo(id), hoy = hoyISO(), pa = proyectosActivos(id);
  return '<section class="tarjeta">' + cabTarjeta('i-carpeta', 'Proyectos', E.c, pa.length ? 'Todos' : 'Nuevo', pa.length ? 'data-acc="proy-lista" data-v="' + id + '"' : 'data-acc="nuevo" data-tipo="proyecto"') +
    (pa.length ? '<div class="lista-filas">' + pa.slice(0, 5).map(function(p){
      var a = avanceProy(p.id), n = p.limite ? diasEntre(hoy, p.limite) : null;
      return '<div class="fila" style="align-items:center">' + anilloMini(a.p, E.c, 38) + '<div class="cuerpo" data-acc="proy-abrir" data-id="' + p.id + '"><div class="titulo">' + esc(p.nombre) + '</div><div class="meta"><span>' + a.hechas + ' de ' + a.total + ' tareas</span>' +
        (n != null ? '<span class="' + (n < 0 ? 'tarde' : n <= 7 ? 'hoy' : '') + '">' + (n < 0 ? 'vencido' : n === 0 ? 'vence hoy' : 'faltan ' + n + ' días') + '</span>' : '') + '</div></div></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Sin proyectos activos.</div>') + '</section>';
}
function tarjetaSinCompras(){
  return '<section class="tarjeta">' + cabTarjeta('i-listas', 'Para comprar', 'var(--esp-personal)') +
    '<div class="vacio" style="padding-top:4px">Crea tu lista de compras y táchala desde aquí.<br><button class="btn chico primario" style="margin-top:10px" data-acc="crear-compras">' + ico('i-plus') + 'Crear lista de compras</button></div></section>';
}

/* ---------- Lo propio de cada espacio -------------------------------------- */
function horasEstudioSemana(){
  var ini = inicioSemana(hoyISO()), min = 0;
  for(var i = 0; i < 7; i++){
    var e = buscarId('enfoque', sumarDias(ini, i));
    if(e && !e.del && e.pomosEsp && e.pomosEsp.estudios) min += e.pomosEsp.estudios * minutosModo('trabajo');
  }
  return min / 60;
}
function eventosTipo(tipo, dias, esp){
  var hoy = hoyISO(), out = [];
  vivos('eventos').forEach(function(e){
    if((e.tipo || 'evento') !== tipo || (esp && espDe(e) !== esp)) return;
    for(var i = 0; i <= dias; i++){ var d = sumarDias(hoy, i); if(ocurre(e.fecha, e.rep, d, e.hasta)){ out.push({ e:e, dia:d, en:i }); break; } }
  });
  return out.sort(function(a, b){ return a.en - b.en || (a.e.ini || '').localeCompare(b.e.ini || ''); });
}
function cuenta(en){ return en === 0 ? '¡Hoy!' : en === 1 ? 'Mañana' : 'En ' + en + ' días'; }

var MODULOS = {
  personal: function(tab){
    var hoy = hoyISO(), d = buscarId('diario', hoy), an = d && !d.del ? d.animo : 0;
    if(tab === 'casa') return (tarjetaCompras() || tarjetaSinCompras()) + tarjetaMenu();
    if(tab === 'papeles') return tarjetaFechas() + tarjetaPrestamos();
    var pp = pagosProximos(10).filter(function(x){ return espDe(x.p) === 'personal'; });
    return bloquesDinero('personal') + tarjetaSemanaEsp('personal') +
      (pp.length ? '<section class="tarjeta">' + cabTarjeta('i-recibo', 'Pagos que vienen', 'var(--debe)', 'Pagos', 'data-ir="pagos"') +
        '<div class="lista-filas">' + pp.slice(0, 4).map(function(x){ return filaPago(x.p, x.ym); }).join('') + '</div></section>' : '') +
      tarjetaDineroEsp('personal');
  },
  estudios: function(tab){
    var cs = vivos('cursos').sort(function(a, b){
      var pa = proximaClase(a), pb = proximaClase(b);
      return (pa ? pa.dia + pa.k.ini : 'z').localeCompare(pb ? pb.dia + pb.k.ini : 'z');
    });
    var ex = eventosTipo('examen', 60);
    var ini = inicioSemana(hoyISO()), porDia = [], eti = [];
    for(var i = 0; i < 7; i++){
      var dd = sumarDias(ini, i), e = buscarId('enfoque', dd);
      porDia.push(Math.round((e && !e.del && e.pomosEsp && e.pomosEsp.estudios ? e.pomosEsp.estudios : 0) * minutosModo('trabajo')));
      eti.push(DIAS3[deISO(dd).getDay()]);
    }
    var pg = promedioGeneral();
    var T = {};
    T.cursos = '<section class="tarjeta ancho-2">' + cabTarjeta('i-birrete', 'Mis cursos' + (pg != null ? ' ' + chipNota(pg) : ''), 'var(--esp-estudios)', 'Nuevo curso', 'data-acc="nuevo" data-tipo="curso"') +
        (cs.length ? '<div class="lista-filas">' + cs.map(function(c){
          var p = proximaClase(c);
          return '<div class="fila"><span class="curso-ico">' + esc((c.nombre || '?').charAt(0).toUpperCase()) + '</span><div class="cuerpo" data-acc="curso-ed" data-id="' + c.id + '"><div class="titulo">' + esc(c.nombre) + ' ' + chipNota(promedioCurso(c)) + '</div>' +
            '<div class="meta">' + (p ? '<span class="' + (p.dia === hoyISO() ? 'hoy' : '') + '">' + ico('i-reloj') + cap(relativo(p.dia)) + ' ' + p.k.ini + (p.k.fin ? '–' + p.k.fin : '') + '</span>' : '<span>Sin clases próximas</span>') +
            (c.aula ? '<span>' + ico('i-lugar') + esc(c.aula) + '</span>' : '') + (c.prof ? '<span>' + esc(c.prof) + '</span>' : '') + '</div>' +
            (textoNecesaria(c) || textoFaltas(c) ? '<div class="meta curso-extra">' + textoNecesaria(c) + textoFaltas(c) + '</div>' : '') + '</div>' +
            '<div class="lado"><button class="btn-icono falta-btn" data-acc="curso-falta" data-id="' + c.id + '" title="Anotar una falta" aria-label="Anotar una falta">−1</button></div></div>';
        }).join('') + '</div>' : vacio('📚', 'Añade tus cursos', 'Pon su horario y las clases saldrán solas en el calendario.')) + '</section>';
    T.examenes = '<section class="tarjeta">' + cabTarjeta('i-diana', 'Próximos exámenes', 'var(--debe)', 'Nuevo examen', 'data-acc="nuevo-examen"') +
        (ex.length ? '<div class="lista-filas">' + ex.slice(0, 5).map(function(x){
          return '<div class="fila"><span class="cuenta-atras ' + (x.en <= 3 ? 'urge' : '') + '"><b>' + (x.en === 0 ? 'HOY' : x.en) + '</b>' + (x.en ? (x.en === 1 ? 'día' : 'días') : '') + '</span><div class="cuerpo" data-acc="evento-ed" data-id="' + x.e.id + '"><div class="titulo">' + esc(x.e.t) + '</div><div class="meta"><span>' + cap(fechaLarga(x.dia)) + (x.e.todo ? '' : ' · ' + x.e.ini) + '</span>' + (x.e.lugar ? '<span>' + ico('i-lugar') + esc(x.e.lugar) + '</span>' : '') + (planDe(x.e.id).length ? '<span class="plan-ok">📚 ' + planDe(x.e.id).filter(function(t){ return t.hecha; }).length + '/' + planDe(x.e.id).length + ' repasos</span>' : '') + '</div></div>' +
            (x.en >= 2 && !planDe(x.e.id).length ? '<button class="btn chico" data-acc="examen-plan" data-id="' + x.e.id + '" data-dia="' + x.dia + '">📚 Plan</button>' : '') + '</div>';
        }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Sin exámenes a la vista. 😌</div>') + '</section>';
    T.horas = '<section class="tarjeta">' + cabTarjeta('i-reloj', 'Horas de estudio esta semana', 'var(--esp-estudios)', 'Estudiar ahora', 'data-acc="estudiar"') +
        '<div class="tarjeta-cuerpo">' + barras(porDia, eti, 'var(--esp-estudios)', 120) +
        '<p style="margin:10px 0 0;font-size:12.5px;color:var(--tinta-3)">Se cuentan las sesiones del temporizador de Enfoque marcadas como Estudios.</p></div></section>';
    if(tab === 'cursos') return horarioHTML() + T.cursos;
    return tarjetaSemanaEsp('estudios') + T.examenes;
  },
  oficina: function(tab){
    var re = eventosTipo('reunion', 7);
    var cob = vivos('cobros').filter(function(x){ return !x.cobrado; }).sort(function(a, b){ return (a.vence || '9').localeCompare(b.vence || '9'); });
    var totalCob = cob.reduce(function(a, x){ return a + (+x.monto || 0); }, 0);
    var hoyC = hoyISO();
    var cobros = '<section class="tarjeta">' + cabTarjeta('i-subir', 'Por cobrar' + (totalCob ? ' <small class="cab-num">' + dinero(totalCob) + '</small>' : ''), 'var(--haber)', 'Nuevo cobro', 'data-acc="nuevo" data-tipo="cobro"') +
      (cob.length ? '<div class="lista-filas">' + cob.slice(0, 6).map(function(x){
        var n = x.vence ? diasEntre(hoyC, x.vence) : null;
        var est = n == null ? '<span>Sin fecha</span>' : n < 0 ? '<span class="tarde">Venció hace ' + (-n) + (n === -1 ? ' día' : ' días') + '</span>' : n === 0 ? '<span class="hoy">Vence hoy</span>' : '<span>Vence ' + relativo(x.vence).toLowerCase() + '</span>';
        return '<div class="fila">' + casilla('cobro-ok', x.id, false, 'var(--haber)') +
          '<div class="cuerpo" data-acc="cobro-ed" data-id="' + x.id + '"><div class="titulo">' + esc(x.cliente) + (x.concepto ? ' · ' + esc(x.concepto) : '') + '</div><div class="meta">' + est + '</div></div>' +
          '<span class="monto" style="color:var(--haber)">' + dinero(+x.monto || 0) + '</span>' +
          '<button class="btn-icono recordar" data-acc="cobro-recordar" data-id="' + x.id + '" title="Recordar el pago al cliente" aria-label="Recordar el pago al cliente">💬</button></div>';
      }).join('') + '</div><p style="margin:0;padding:0 16px 12px;font-size:12px;color:var(--tinta-3)">Al marcarlo como cobrado se anota solo como ingreso en el libro de la oficina.</p>'
       : '<div class="vacio" style="padding-top:4px">Nadie te debe nada. 👌 Apunta aquí lo que te deben tus clientes.</div>') + '</section>';
    var pp = pagosProximos(15).filter(function(x){ return espDe(x.p) === 'oficina'; });
    var reun = '<section class="tarjeta">' + cabTarjeta('i-maletin', 'Reuniones', 'var(--esp-oficina)', 'Nueva reunión', 'data-acc="nuevo-reunion"') +
        (re.length ? '<div class="lista-filas">' + re.slice(0, 6).map(function(x){
          return '<div class="fila"><span class="hora" style="width:70px">' + (x.e.todo ? cuenta(x.en) : (x.en ? relativo(x.dia).slice(0, 3) + ' ' : '') + x.e.ini) + '</span><span class="barrita" style="--c:var(--esp-oficina)"></span><div class="cuerpo" data-acc="evento-ed" data-id="' + x.e.id + '"><div class="titulo">' + esc(x.e.t) + '</div><div class="meta"><span>' + cuenta(x.en) + '</span>' + (x.e.lugar ? '<span>' + ico('i-lugar') + esc(x.e.lugar) + '</span>' : '') + '</div></div></div>';
        }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Sin reuniones esta semana.</div>') + '</section>';
    var pagosO = (pp.length ? '<section class="tarjeta">' + cabTarjeta('i-recibo', 'Pagos de la oficina', 'var(--debe)', 'Pagos', 'data-ir="pagos"') +
        '<div class="lista-filas">' + pp.slice(0, 4).map(function(x){ return filaPago(x.p, x.ym); }).join('') + '</div></section>' : '');
    if(tab === 'clientes') return tarjetaClientes() + cobros;
    if(tab === 'trabajo') return tarjetaTablero() + reun;
    return bloquesDinero('oficina') + tarjetaSemanaEsp('oficina') + cobros + reun + tarjetaDineroEsp('oficina') + pagosO;
  },
  deporte: function(tab){
    var hoy = hoyISO(), ini = sumarDias(hoy, -6), porDia = [], eti = [], total = 0, ses = 0;
    var es = vivos('entrenos');
    for(var i = 0; i < 7; i++){
      var dd = sumarDias(ini, i), m = 0;
      es.forEach(function(e){ if(e.fecha === dd){ m += +e.min || 0; ses++; } });
      total += m; porDia.push(m); eti.push(DIAS3[deISO(dd).getDay()]);
    }
    var ult = es.slice().sort(function(a, b){ return b.fecha.localeCompare(a.fecha) || (b.upd || 0) - (a.upd || 0); }).slice(0, 5);
    var pa = eventosTipo('partido', 30);
    var pesos = vivos('medidas').filter(function(x){ return +x.peso; }).sort(function(a, b){ return a.id.localeCompare(b.id); });
    var ultP = pesos[pesos.length - 1], antP = pesos[pesos.length - 2];
    var linea = '';
    if(pesos.length > 1){
      var ps = pesos.slice(-12), mn = Math.min.apply(null, ps.map(function(p){ return +p.peso; })), mx = Math.max.apply(null, ps.map(function(p){ return +p.peso; }));
      var rango = Math.max(.5, mx - mn);
      var pts = ps.map(function(p, k){ return (k / (ps.length - 1) * 280 + 10).toFixed(1) + ',' + (60 - (+p.peso - mn) / rango * 44 - 8).toFixed(1); });
      linea = '<svg class="spark" viewBox="0 0 300 64" preserveAspectRatio="none"><polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--esp-deporte)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<circle cx="' + pts[pts.length - 1].split(',')[0] + '" cy="' + pts[pts.length - 1].split(',')[1] + '" r="5" fill="var(--esp-deporte)"/></svg>';
    }
    var T = {};
    T.entrenos = '<section class="tarjeta">' + cabTarjeta('i-habitos', 'Entrenamientos', 'var(--esp-deporte)', 'Todos', 'data-acc="ver-entrenos"') +
        '<div class="tarjeta-cuerpo">' +
          '<div class="entreno-rapido">' + DEPORTES.map(function(d){
            return '<button type="button" data-acc="entreno-rapido" data-v="' + d.v + '"><span>' + d.em + '</span>' + d.n + '</button>';
          }).join('') + '</div>' +
          '<div class="resumen-dep"><div><b>' + Math.round(total / 6) / 10 + ' h</b><small>últimos 7 días</small></div><div><b>' + ses + '</b><small>sesiones</small></div><div><b>🔥 ' + semanasSeguidas() + '</b><small>semanas seguidas</small></div></div>' +
          barras(porDia, eti, 'var(--esp-deporte)', 110) +
        '</div>' +
        (ult.length ? '<div class="lista-filas">' + ult.map(function(e){
          var d = deporteInfo(e.tipo);
          return '<div class="fila"><span class="em-fila">' + d.em + '</span><div class="cuerpo" data-acc="entreno-ed" data-id="' + e.id + '"><div class="titulo">' + d.n + (e.notas ? ' · ' + esc(e.notas.slice(0, 40)) : '') + '</div><div class="meta"><span>' + relativo(e.fecha) + '</span><span>' + e.min + ' min</span>' + (e.km ? '<span>' + e.km + ' km</span>' : '') + (e.int ? '<span class="etiqueta">' + INTENS[e.int] + '</span>' : '') + '</div></div></div>';
        }).join('') + '</div>' : '') + '</section>';
    T.partidos = '<section class="tarjeta">' + cabTarjeta('i-balon', 'Próximos partidos', 'var(--esp-deporte)', 'Nuevo partido', 'data-acc="nuevo-partido"') +
        (pa.length ? '<div class="lista-filas">' + pa.slice(0, 4).map(function(x){
          return '<div class="fila"><span class="cuenta-atras"><b>' + (x.en === 0 ? 'HOY' : x.en) + '</b>' + (x.en ? (x.en === 1 ? 'día' : 'días') : '') + '</span><div class="cuerpo" data-acc="evento-ed" data-id="' + x.e.id + '"><div class="titulo">⚽ ' + esc(x.e.t) + '</div><div class="meta"><span>' + cap(relativo(x.dia)) + (x.e.todo ? '' : ' · ' + x.e.ini) + '</span>' + (x.e.lugar ? '<span>' + ico('i-lugar') + esc(x.e.lugar) + '</span>' : '') + '</div></div></div>';
        }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Sin partidos programados. ¿Armamos una pichanga?</div>') + '</section>';
    if(tab === 'entreno') return tarjetaRutinas() + tarjetaCuerpo();
    if(tab === 'cancha') return T.partidos + tarjetaBolso(pa);
    var hr = rutinasHoy();
    return tarjetaSemanaEsp('deporte') + T.entrenos +
      (hr.length ? '<section class="tarjeta">' + cabTarjeta('i-meta', 'Hoy toca', 'var(--esp-deporte)', 'Entreno', 'data-acc="esp-tab" data-esp="deporte" data-v="entreno"') + '<div class="hoy-toca">' + hr.map(function(r){
        return '<div class="hoy-toca-item"><span>🏋️ <b>' + esc(r.nombre) + '</b> · ' + (r.ejercicios || []).length + ' ejercicios</span><button class="btn chico primario" data-acc="rutina-empezar" data-id="' + r.id + '">' + ico('i-play') + 'Anotar</button></div>';
      }).join('') + '</div></section>' : '') +
      T.partidos + tarjetaMapaActividad();
  }
};

/* ==========================================================================
   PROYECTOS
   Tareas que van juntas hacia algo más grande: la tesis, la mudanza, el
   lanzamiento de un cliente, preparar una media maratón. Cada proyecto
   vive en un espacio, tiene fecha límite y muestra cuánto falta.
   ========================================================================== */
function tareasDe(pid){ return vivos('tareas').filter(function(t){ return t.proy === pid; }); }
function avanceProy(pid){
  var ts = tareasDe(pid), h = ts.filter(function(t){ return t.hecha; }).length;
  return { total:ts.length, hechas:h, p:ts.length ? h / ts.length : 0 };
}
function proyectosActivos(esp){
  return vivos('proyectos').filter(function(p){ return p.estado !== 'hecho' && (!esp || espDe(p) === esp); })
    .sort(function(a, b){ return (a.limite || '9').localeCompare(b.limite || '9'); });
}
function anilloMini(p, c, tam){
  tam = tam || 44; var r = tam / 2 - 5, C = 2 * Math.PI * r;
  return '<svg class="anillo-mini" width="' + tam + '" height="' + tam + '" viewBox="0 0 ' + tam + ' ' + tam + '" aria-hidden="true">' +
    '<circle cx="' + tam / 2 + '" cy="' + tam / 2 + '" r="' + r + '" fill="none" stroke="var(--regla)" stroke-width="5"/>' +
    '<circle cx="' + tam / 2 + '" cy="' + tam / 2 + '" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - p)).toFixed(1) + '" transform="rotate(-90 ' + tam / 2 + ' ' + tam / 2 + ')"/>' +
    '<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-size="' + (tam * .26).toFixed(0) + '" font-weight="800" fill="var(--tinta)">' + Math.round(p * 100) + '</text></svg>';
}
function tarjetaProyecto(p){
  var a = avanceProy(p.id), E = espInfo(espDe(p));
  var sig = tareasDe(p.id).filter(function(t){ return !t.hecha; }).sort(ordenTareas)[0];
  var n = p.limite ? diasEntre(hoyISO(), p.limite) : null;
  return '<button type="button" class="tarjeta proy-card" style="--c:' + E.c + '" data-acc="proy-abrir" data-id="' + p.id + '">' +
    '<div class="proy-cab">' + anilloMini(a.p, E.c) + '<div style="min-width:0;flex:1"><b>' + esc(p.nombre) + '</b>' +
      '<small>' + E.em + ' ' + E.nom + ' · ' + a.hechas + ' de ' + a.total + ' tareas</small></div></div>' +
    (sig ? '<div class="proy-sig">Siguiente: <b>' + esc(sig.t) + '</b></div>' : '<div class="proy-sig">' + (a.total ? '¡Todo hecho! Márcalo terminado.' : 'Añade la primera tarea.') + '</div>') +
    (n != null ? '<div class="proy-lim ' + (n < 0 ? 'tarde' : n <= 7 ? 'pronto' : '') + '">' + ico('i-bandera') + (n < 0 ? 'Venció hace ' + (-n) + ' días' : n === 0 ? 'Vence hoy' : 'Faltan ' + n + ' días · ' + fechaCorta(p.limite)) + '</div>' : '') +
  '</button>';
}
VISTAS.proyectos = function(){
  var p = ui.proy && buscarId('proyectos', ui.proy);
  if(p && !p.del) return detalleProyecto(p);
  ui.proy = null;
  var act = proyectosActivos(ui.proyEsp || ''), hechos = vivos('proyectos').filter(function(x){ return x.estado === 'hecho' && (!ui.proyEsp || espDe(x) === ui.proyEsp); });
  var html = filtroEsp('proy-esp', ui.proyEsp || '');
  html += act.length ? '<div class="proy-rejilla">' + act.map(tarjetaProyecto).join('') + '</div>'
                     : '<div class="tarjeta">' + vacio('📁', 'Sin proyectos activos', 'Un proyecto junta las tareas de algo grande (la tesis, una mudanza, un cliente) y te muestra cuánto falta.') + '</div>';
  html += '<div style="margin-top:14px"><button class="btn primario" data-acc="nuevo" data-tipo="proyecto">' + ico('i-plus') + 'Nuevo proyecto</button></div>';
  if(hechos.length) html += '<div class="seccion-tit">Terminados <span class="n">' + hechos.length + '</span></div><div class="proy-rejilla">' + hechos.map(tarjetaProyecto).join('') + '</div>';
  return html;
};
function detalleProyecto(p){
  var a = avanceProy(p.id), E = espInfo(espDe(p));
  var ts = tareasDe(p.id), pend = ts.filter(function(t){ return !t.hecha; }).sort(ordenTareas), hechas = ts.filter(function(t){ return t.hecha; });
  var n = p.limite ? diasEntre(hoyISO(), p.limite) : null;
  var ritmo = '';
  if(n != null && n > 0 && pend.length) ritmo = 'Para llegar a tiempo: unas ' + Math.ceil(pend.length / Math.max(1, Math.ceil(n / 7))) + ' tareas por semana.';
  return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><button class="btn chico" data-acc="proy-volver">' + ico('i-izq') + 'Proyectos</button><div style="flex:1"></div>' +
      '<button class="btn chico" data-acc="proy-estado" data-id="' + p.id + '">' + (p.estado === 'hecho' ? 'Reabrir' : ico('i-check') + 'Terminado') + '</button>' +
      '<button class="btn-icono" data-acc="proy-ed" data-id="' + p.id + '" aria-label="Editar">' + ico('i-lapiz') + '</button></div>' +
    '<section class="heroe esp-heroe" style="--ec:' + E.c + '"><div class="arriba"><div><div class="fecha">' + E.em + ' ' + E.nom + ' · proyecto</div><h2>' + esc(p.nombre) + '</h2>' +
      (p.desc ? '<p class="frase" style="font-style:normal">' + esc(p.desc) + '</p>' : '') + '</div>' + anilloMini(a.p, '#fff', 64) + '</div>' +
      '<div class="datos"><span class="dato">' + ico('i-tareas') + '<b>' + a.hechas + '/' + a.total + '</b> tareas</span>' +
      (n != null ? '<span class="dato">' + ico('i-bandera') + '<b>' + (n < 0 ? 'Vencido' : n) + '</b>' + (n >= 0 ? (n === 1 ? ' día' : ' días') : '') + '</span>' : '') + '</div></section>' +
    (ritmo ? '<p style="margin:-4px 2px 14px;color:var(--tinta-2);font-size:13px">' + ritmo + '</p>' : '') +
    '<div class="tarjeta">' +
      '<form class="captura" data-acc="proy-tarea" data-id="' + p.id + '" style="margin:12px;box-shadow:none" autocomplete="off"><input id="proyTarea" type="text" maxlength="200" placeholder="Nueva tarea del proyecto… (Enter)"><button class="btn primario chico" type="submit">' + ico('i-plus') + '</button></form>' +
      (pend.length ? '<div class="lista-filas">' + pend.map(filaTarea).join('') + '</div>' : vacio('🎯', a.total ? 'Todo hecho' : 'Sin tareas', a.total ? 'Márcalo como terminado arriba.' : 'Divide el proyecto en pasos pequeños.')) +
    '</div>' +
    (hechas.length ? '<div class="seccion-tit">Hechas <span class="n">' + hechas.length + '</span></div><div class="tarjeta"><div class="lista-filas">' + hechas.map(filaTarea).join('') + '</div></div>' : '');
}
function editarProyecto(id, preset){
  var p = id ? JSON.parse(JSON.stringify(buscarId('proyectos', id))) : Object.assign({ id:nid(), nombre:'', desc:'', limite:'', estado:'activo', creada:Date.now() }, preset || {});
  abrirFlotante(cabFlot(id ? 'Proyecto' : 'Nuevo proyecto') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Nombre', '<input name="n" required maxlength="80" value="' + esc(p.nombre) + '" placeholder="Ej. Tesis, Mudanza, Web del cliente, Media maratón">') +
      campo('De qué se trata (opcional)', '<textarea name="d" maxlength="400" style="min-height:64px">' + esc(p.desc) + '</textarea>') +
      campo('Fecha límite (opcional)', '<input type="date" name="l" value="' + esc(p.limite) + '">') +
      selectorEsp(p.esp || (id ? espDe(p) : espPorDefecto())) +
      botonesEd(!!id) + '</form>');
  var f = $('formEd');
  if(!id) f.n.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    p.nombre = f.n.value.trim(); if(!p.nombre) return;
    p.desc = f.d.value.trim(); p.limite = f.l.value; p.esp = leerSelector('esp') || 'personal';
    poner('proyectos', p); cerrarFlotante(); ui.proy = p.id; ir('proyectos'); ui.proy = p.id; pintar();
  };
  edAcciones = { borrar: function(){
    cerrarFlotante();
    tareasDe(p.id).forEach(function(t){ delete t.proy; t.upd = Date.now(); });
    ui.proy = null; quitar('proyectos', p.id, 'Proyecto borrado (sus tareas se quedan)'); pintar();
  } };
}

/* ==========================================================================
   REVISIÓN SEMANAL
   Cinco minutos el domingo: qué hiciste, qué salió bien, qué mejorar y
   qué es lo importante de la semana que viene. La agenda pone los números.
   ========================================================================== */
function statsSemana(ini){
  var fin = sumarDias(ini, 6), enS = function(d){ return d >= ini && d <= fin; };
  var r = { tareas:0, entrenos:0, minEnt:0, pomos:0, estudio:0, ent:0, sal:0, habT:0, habH:0, animo:0, nAnimo:0, eventos:0 };
  vivos('tareas').forEach(function(t){
    if(t.hecha && t.hechaEn && enS(iso(new Date(t.hechaEn)))) r.tareas++;
    (t.log || []).forEach(function(d){ if(enS(d)) r.tareas++; });
  });
  vivos('entrenos').forEach(function(e){ if(enS(e.fecha)){ r.entrenos++; r.minEnt += +e.min || 0; } });
  for(var i = 0; i < 7; i++){
    var d = sumarDias(ini, i), e = buscarId('enfoque', d);
    if(e && !e.del){ r.pomos += e.pomos || 0; r.estudio += (e.pomosEsp && e.pomosEsp.estudios) || 0; }
    var w = deISO(d).getDay();
    if(d <= hoyISO()) vivos('habitos').forEach(function(h){ if(!h.dias || h.dias.indexOf(w) >= 0){ r.habT++; if(h.marcas && h.marcas[d]) r.habH++; } });
    var di = buscarId('diario', d); if(di && !di.del && di.animo){ r.animo += di.animo; r.nAnimo++; }
    r.eventos += itemsDelDia(d).filter(function(x){ return x.tipo === 'evento' || x.tipo === 'clase'; }).length;
  }
  libroDatos('personal').concat(libroDatos('oficina')).forEach(function(t){ if(enS(t.date)){ if(t.type === 'Gasto') r.sal += t.amount; else r.ent += t.amount; } });
  return r;
}

/* ==========================================================================
   PRÉSTAMOS: quién te debe y a quién le debes
   ========================================================================== */
function editarDeuda(id, preset){
  var x = id ? JSON.parse(JSON.stringify(buscarId('deudas', id))) : Object.assign({ id:nid(), persona:'', concepto:'', monto:'', tipo:'me', fecha:'', saldada:0, esp:'personal' }, preset || {});
  abrirFlotante(cabFlot(id ? 'Préstamo' : 'Nuevo préstamo') +
    '<form class="form" id="formEd" autocomplete="off">' +
      grupo('Quién le debe a quién', selector('tipoD', [{ v:'me', n:'💚 Me deben' }, { v:'yo', n:'🧡 Yo debo' }], x.tipo)) +
      campo('Persona', '<input name="p" required maxlength="60" value="' + esc(x.persona) + '" placeholder="Ej. Carlos">') +
      campo('Por qué', '<input name="c" maxlength="80" value="' + esc(x.concepto) + '" placeholder="Ej. Entradas del concierto">') +
      '<div class="fila-campos">' + campo('Monto (' + MONEDA + ')', '<input name="m" inputmode="decimal" required value="' + esc(x.monto) + '">') +
        campo('Para cuándo (opcional)', '<input type="date" name="f" value="' + esc(x.fecha) + '">') + '</div>' +
      botonesEd(!!id) + '</form>');
  var f = $('formEd');
  if(!id) f.p.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    x.persona = f.p.value.trim(); if(!x.persona) return;
    x.tipo = leerSelector('tipoD') || 'me'; x.concepto = f.c.value.trim();
    x.monto = Math.round(num(f.m.value) * 100) / 100; x.fecha = f.f.value;
    poner('deudas', x); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('deudas', x.id, 'Préstamo borrado'); pintar(); } };
}
function saldarDeuda(id, boton){
  var x = buscarId('deudas', id);
  if(!x) return;
  var idMov = 'deuda-' + x.id, me = x.tipo === 'me';
  x.saldada = Date.now(); poner('deudas', x);
  if(+x.monto) cambiarLibro('personal', function(l){ return l.filter(function(t){ return t.id !== idMov; }).concat([{ id:idMov, date:hoyISO(), desc:(me ? 'Me pagó ' : 'Le pagué a ') + x.persona + (x.concepto ? ' – ' + x.concepto : ''), type:me ? 'Ingreso' : 'Gasto', amount:+x.monto, cat:'Préstamos' }]); });
  if(boton){ boton.setAttribute('aria-checked', 'true'); boton.classList.add('pop'); }
  aviso(me ? '💚 ' + x.persona + ' te pagó' : '🧡 Le pagaste a ' + x.persona, dinero(+x.monto || 0) + ' anotado en tu libro', 'Deshacer', function(){
    x.saldada = 0; poner('deudas', x);
    cambiarLibro('personal', function(l){ return l.filter(function(t){ return t.id !== idMov; }); });
    pintar();
  });
  setTimeout(pintarSeguro, 300);
}
function tarjetaPrestamos(){
  var ds = vivos('deudas').filter(function(d){ return !d.saldada; });
  var me = ds.filter(function(d){ return d.tipo === 'me'; }), yo = ds.filter(function(d){ return d.tipo === 'yo'; });
  var sm = me.reduce(function(a, d){ return a + (+d.monto || 0); }, 0), sy = yo.reduce(function(a, d){ return a + (+d.monto || 0); }, 0);
  var hoy = hoyISO();
  return '<section class="tarjeta">' + cabTarjeta('i-cuentas', 'Préstamos', 'var(--esp-personal)', 'Nuevo', 'data-acc="nuevo" data-tipo="deuda"') +
    '<div class="cifras" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="entra"><small>Te deben</small><b>' + dinero(sm) + '</b></div><div class="sale"><small>Debes</small><b>' + dinero(sy) + '</b></div></div>' +
    (ds.length ? '<div class="lista-filas">' + ds.sort(function(a, b){ return (a.fecha || '9').localeCompare(b.fecha || '9'); }).slice(0, 6).map(function(d){
      var m = d.tipo === 'me', n = d.fecha ? diasEntre(hoy, d.fecha) : null;
      return '<div class="fila">' + casilla('deuda-ok', d.id, false, m ? 'var(--haber)' : 'var(--oro)') +
        '<div class="cuerpo" data-acc="deuda-ed" data-id="' + d.id + '"><div class="titulo">' + (m ? esc(d.persona) + ' te debe' : 'Le debes a ' + esc(d.persona)) + '</div>' +
        '<div class="meta">' + (d.concepto ? '<span>' + esc(d.concepto) + '</span>' : '') + (n != null ? '<span class="' + (n < 0 ? 'tarde' : n <= 2 ? 'hoy' : '') + '">' + (n < 0 ? 'desde hace ' + (-n) + ' días' : relativo(d.fecha)) + '</span>' : '') + '</div></div>' +
        '<span class="monto" style="color:' + (m ? 'var(--haber)' : 'var(--oro)') + '">' + dinero(+d.monto || 0) + '</span>' +
        (m ? '<button class="btn-icono recordar" data-acc="deuda-recordar" data-id="' + d.id + '" title="Recordárselo por WhatsApp" aria-label="Recordárselo por WhatsApp">💬</button>' : '') + '</div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:2px">Nadie te debe y no debes nada. 🙌</div>') + '</section>';
}

/* ==========================================================================
   CALENDARIO POR SEMANA: los días en columnas y las horas en filas
   ========================================================================== */
var H_INI = 6, H_FIN = 24, H_ALTO = 46;
function minutos(h){ var p = (h || '0:0').split(':'); return +p[0] * 60 + +p[1]; }

/* ==========================================================================
   RUTINAS DE GYM Y RÉCORDS
   Una rutina es una lista de ejercicios con sus series, repeticiones y
   peso. Al anotar un entrenamiento con rutina, se apunta lo que moviste de
   verdad; con eso la agenda sabe tus récords y cuánto has subido.
   ========================================================================== */
function normEj(n){ return sinTildes(String(n || '').trim()); }
function rutinasHoy(){
  var w = new Date().getDay();
  return vivos('rutinas').filter(function(r){ return r.dias && r.dias.indexOf(w) >= 0; });
}
/* Lo último que hiciste de un ejercicio, para proponerlo otra vez */
function ultimoEj(nombre){
  var k = normEj(nombre), mejor = null;
  vivos('entrenos').forEach(function(e){
    (e.ejs || []).forEach(function(x){ if(normEj(x.n) === k && (!mejor || e.fecha > mejor.f)) mejor = { f:e.fecha, x:x }; });
  });
  return mejor && mejor.x;
}
function records(){
  var m = {};
  vivos('entrenos').slice().sort(function(a, b){ return a.fecha.localeCompare(b.fecha); }).forEach(function(e){
    (e.ejs || []).forEach(function(x){
      var p = +x.p || 0; if(!p) return;
      var k = normEj(x.n);
      if(!m[k]) m[k] = { n:x.n, max:p, f:e.fecha, primero:p, veces:0 };
      m[k].veces++;
      if(p > m[k].max){ m[k].max = p; m[k].f = e.fecha; }
    });
  });
  return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a, b){ return b.veces - a.veces || b.max - a.max; });
}
function filaEj(x, i){
  return '<div class="fila-ej"><input value="' + esc(x.n || '') + '" placeholder="Ejercicio" maxlength="50">' +
    '<input inputmode="numeric" value="' + esc(x.s || '') + '" placeholder="Ser.">' +
    '<input inputmode="numeric" value="' + esc(x.r || '') + '" placeholder="Rep.">' +
    '<input inputmode="decimal" value="' + esc(x.p || '') + '" placeholder="Kg">' +
    '<button type="button" class="btn-icono" data-ed="ej-x" aria-label="Quitar">' + ico('i-x') + '</button></div>';
}
function leerEjs(caja){
  return [].slice.call(document.querySelectorAll('#' + caja + ' .fila-ej')).map(function(r){
    var i = r.querySelectorAll('input');
    return { n:i[0].value.trim(), s:parseInt(i[1].value, 10) || '', r:parseInt(i[2].value, 10) || '', p:num(i[3].value) || '' };
  }).filter(function(x){ return x.n; });
}
function editarRutina(id){
  var r = id ? JSON.parse(JSON.stringify(buscarId('rutinas', id))) : { id:nid(), nombre:'', dias:[], ejercicios:[{ n:'', s:4, r:10, p:'' }], creada:Date.now() };
  var orden = pref.lunes ? [1,2,3,4,5,6,0] : [0,1,2,3,4,5,6];
  abrirFlotante(cabFlot(id ? 'Rutina' : 'Nueva rutina') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Nombre', '<input name="n" required maxlength="50" value="' + esc(r.nombre) + '" placeholder="Ej. Pecho y tríceps, Pierna, Full body">') +
      grupo('Qué días toca (opcional)', selector('dias', orden.map(function(d){ return { v:String(d), n:cap(DIAS3[d]) }; }), (r.dias || []).map(String), '', true)) +
      grupo('Ejercicios', '<div class="ej-cab"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>Kg</span><span></span></div><div id="ejsRut" class="clases">' + (r.ejercicios || []).map(filaEj).join('') + '</div>' +
        '<button type="button" class="btn chico" data-ed="ej-add" style="align-self:flex-start;margin-top:4px">' + ico('i-plus') + 'Ejercicio</button>') +
      botonesEd(!!id) + '</form>');
  var f = $('formEd');
  if(!id) f.n.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    r.nombre = f.n.value.trim(); if(!r.nombre) return;
    r.dias = leerSelector('dias', true).map(Number); r.ejercicios = leerEjs('ejsRut');
    poner('rutinas', r); cerrarFlotante(); pintar();
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); quitar('rutinas', r.id, 'Rutina borrada'); pintar(); },
    'ej-add': function(){ $('ejsRut').insertAdjacentHTML('beforeend', filaEj({ n:'', s:3, r:10, p:'' })); var i = $('ejsRut').querySelectorAll('.fila-ej input'); i[i.length - 4].focus(); },
    'ej-x': function(b){ b.parentNode.remove(); }
  };
}
/* Ejercicios de una rutina para anotarlos hoy: con lo que hiciste la última vez */
function ejsDeRutina(rid){
  var r = buscarId('rutinas', rid);
  if(!r) return [];
  return (r.ejercicios || []).map(function(x){ var u = ultimoEj(x.n); return u ? { n:x.n, s:u.s || x.s, r:u.r || x.r, p:u.p || x.p } : x; });
}

function tarjetaRutinas(){
  var rs = vivos('rutinas'), hoyR = rutinasHoy(), rec = records().slice(0, 6);
  return '<section class="tarjeta">' + cabTarjeta('i-meta', 'Rutinas y récords', 'var(--esp-deporte)', 'Nueva rutina', 'data-acc="nuevo" data-tipo="rutina"') +
    (hoyR.length ? '<div class="hoy-toca">' + hoyR.map(function(r){
      return '<div class="hoy-toca-item"><span>🏋️ Hoy toca <b>' + esc(r.nombre) + '</b> · ' + (r.ejercicios || []).length + ' ejercicios</span><button class="btn chico primario" data-acc="rutina-empezar" data-id="' + r.id + '">' + ico('i-play') + 'Anotar</button></div>';
    }).join('') + '</div>' : '') +
    (rs.length ? '<div class="lista-filas">' + rs.map(function(r){
      var dias = (r.dias || []).length ? (r.dias || []).slice().sort(function(a, b){ return ((a + 6) % 7) - ((b + 6) % 7); }).map(function(d){ return cap(DIAS3[d]); }).join(' · ') : 'Cuando quieras';
      return '<div class="fila"><span class="em-fila">🏋️</span><div class="cuerpo" data-acc="rutina-ed" data-id="' + r.id + '"><div class="titulo">' + esc(r.nombre) + '</div><div class="meta"><span>' + dias + '</span><span>' + (r.ejercicios || []).length + ' ejercicios</span></div></div>' +
        '<div class="lado"><button class="btn-icono" data-acc="rutina-empezar" data-id="' + r.id + '" title="Anotar hoy" aria-label="Anotar hoy">' + ico('i-play') + '</button></div></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Crea tus rutinas (pecho, pierna…) y anótalas con un toque; la agenda recuerda tus pesos.</div>') +
    (rec.length ? '<div class="records"><b class="records-tit">🏆 Récords personales</b>' + rec.map(function(r){
      var sub = r.max - r.primero;
      return '<div class="record"><span>' + esc(r.n) + '</span><b>' + formNum(r.max) + ' kg</b><small>' + (sub > 0 ? '+' + formNum(sub) + ' kg desde el inicio' : fechaCorta(r.f)) + '</small></div>';
    }).join('') + '</div>' : '') + '</section>';
}

/* ==========================================================================
   HORARIO DE CLASES: la semana de un vistazo, en columnas
   ========================================================================== */
function horarioHTML(){
  var cs = vivos('cursos');
  if(!cs.length) return '';
  var dias = pref.lunes ? [1,2,3,4,5,6,0] : [0,1,2,3,4,5,6], hoyW = new Date().getDay();
  var porDia = {};
  cs.forEach(function(c, ci){
    (c.clases || []).forEach(function(k){ (porDia[k.d] = porDia[k.d] || []).push({ c:c, k:k, tono:ci % 5 }); });
  });
  dias = dias.filter(function(d){ return porDia[d] && porDia[d].length; });
  if(!dias.length) return '';
  return '<section class="tarjeta">' + cabTarjeta('i-cal', 'Horario de clases', 'var(--esp-estudios)') +
    '<div class="horario" style="grid-template-columns:repeat(' + dias.length + ',minmax(104px,1fr))">' + dias.map(function(d){
      var ks = porDia[d].sort(function(a, b){ return (a.k.ini || '').localeCompare(b.k.ini || ''); });
      return '<div class="hor-col' + (d === hoyW ? ' hoy' : '') + '"><b>' + cap(DIAS3[d]) + '</b>' + ks.map(function(x){
        return '<button type="button" class="hor-clase tono' + x.tono + '" data-acc="curso-ed" data-id="' + x.c.id + '"><small>' + x.k.ini + (x.k.fin ? '–' + x.k.fin : '') + '</small><span>' + esc(x.c.nombre) + '</span>' + (x.c.aula ? '<em>' + esc(x.c.aula) + '</em>' : '') + '</button>';
      }).join('') + '</div>';
    }).join('') + '</div></section>';
}

/* ==========================================================================
   CUENTAS REGRESIVAS: los días que faltan para lo que esperas
   ========================================================================== */
function cuentasRegresivas(){
  var hoy = hoyISO(), out = [];
  vivos('eventos').forEach(function(e){
    if(!e.cuenta) return;
    var d = proximaDesde(e.fecha, e.cumple ? 'ano' : e.rep, hoy);
    if(d && d >= hoy) out.push({ e:e, dia:d, en:diasEntre(hoy, d) });
  });
  return out.sort(function(a, b){ return a.en - b.en; });
}
function tarjetaCuentas(){
  var cs = cuentasRegresivas();
  if(!cs.length) return '';
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-reloj', 'Cuenta regresiva', 'var(--oro)') +
    '<div class="regresivas">' + cs.slice(0, 4).map(function(x){
      var c = x.e.cumple ? 'var(--rosa)' : (x.e.color && x.e.color !== 'esp' ? color(x.e.color) : colorEsp(x.e));
      return '<button type="button" class="regresiva" style="--c:' + c + '" data-acc="evento-ed" data-id="' + x.e.id + '">' +
        '<b>' + (x.en === 0 ? '¡Hoy!' : x.en) + '</b><small>' + (x.en === 0 ? '' : x.en === 1 ? 'día' : 'días') + '</small>' +
        '<span>' + (x.e.cumple ? '🎂 ' : '') + esc(x.e.t) + '</span><em>' + cap(fechaLarga(x.dia)) + '</em></button>';
    }).join('') + '</div></section>';
}

/* ==========================================================================
   TEMA AUTOMÁTICO: claro de día, oscuro de noche, según el teléfono
   ========================================================================== */
var mqOscuro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function temaSegunSistema(){ return mqOscuro && !mqOscuro.matches ? 'claro' : 'oscuro'; }
if(mqOscuro && mqOscuro.addEventListener) mqOscuro.addEventListener('change', function(){ if(pref.temaAuto) aplicarTema(temaSegunSistema(), true); });

/* ==========================================================================
   LO PROPIO DE CADA ESPACIO, SEGUNDA TANDA
   ========================================================================== */

/* ---------- Personal: agua, sueño, fechas importantes y la compra --------- */
var META_AGUA = 8;
function bienestar(dia){ var b = buscarId('bienestar', dia); return b && !b.del ? b : { id:dia, agua:0, sueno:'' }; }
function tarjetaBienestar(){
  var hoy = hoyISO(), b = bienestar(hoy), dias = [];
  for(var i = 6; i >= 0; i--){ var d = sumarDias(hoy, -i); dias.push({ d:d, b:bienestar(d) }); }
  var suenos = dias.filter(function(x){ return +x.b.sueno; });
  var media = suenos.length ? suenos.reduce(function(a, x){ return a + +x.b.sueno; }, 0) / suenos.length : 0;
  var vasos = '';
  for(var v = 1; v <= META_AGUA; v++) vasos += '<button type="button" class="vaso' + (v <= b.agua ? ' lleno' : '') + '" data-acc="agua" data-v="' + v + '" aria-label="' + v + ' vasos">' + ico('i-gota') + '</button>';
  return '<section class="tarjeta">' + cabTarjeta('i-gota', 'Agua y sueño', 'var(--azul)') +
    '<div class="tarjeta-cuerpo">' +
      '<div class="bien-fila"><span>💧 Agua hoy</span><b>' + b.agua + ' / ' + META_AGUA + ' vasos</b></div>' +
      '<div class="vasos">' + vasos + '</div>' +
      '<div class="bien-fila" style="margin-top:14px"><span>😴 Anoche dormí</span>' +
        '<div class="sueno-sel">' + [5, 6, 7, 8, 9].map(function(h){ return '<button type="button" data-acc="sueno" data-v="' + h + '" aria-pressed="' + (+b.sueno === h) + '">' + h + ' h</button>'; }).join('') + '</div></div>' +
      '<div class="sueno-semana">' + dias.map(function(x){
        var h = +x.b.sueno || 0;
        return '<div class="sueno-dia' + (x.d === hoy ? ' hoy' : '') + '" title="' + fechaCorta(x.d) + ': ' + (h ? h + ' h' : 'sin dato') + '"><i style="height:' + (h ? Math.min(100, h / 10 * 100) : 4) + '%" class="' + (h && h < 6 ? 'poco' : h >= 7 ? 'bien' : '') + '"></i><small>' + DIAS3[deISO(x.d).getDay()].charAt(0) + '</small></div>';
      }).join('') + '</div>' +
      '<small class="bien-pie">' + (media ? 'Duermes ' + media.toFixed(1) + ' h de media esta semana' + (media < 7 ? '. Lo ideal son 7 a 9.' : '. ¡Bien!') : 'Marca cuántas horas dormiste para ver tu semana.') + '</small>' +
    '</div></section>';
}
function tarjetaFechas(){
  var cs = proximosCumples(60);
  var otros = vivos('eventos').filter(function(e){ return !e.cumple && e.rep === 'ano' && espDe(e) === 'personal'; });
  var hoy = hoyISO(), anivs = [];
  otros.forEach(function(e){ var d = proximaDesde(e.fecha, 'ano', hoy); if(d && diasEntre(hoy, d) <= 60) anivs.push({ e:e, dia:d, en:diasEntre(hoy, d) }); });
  var todo = cs.map(function(c){ return { t:'🎂 ' + c.e.t, extra:'', en:c.en, dia:c.dia, id:c.e.id, cumple:true }; })
    .concat(anivs.map(function(a){ return { t:'💝 ' + a.e.t, extra:'', en:a.en, dia:a.dia, id:a.e.id }; })).sort(function(a, b){ return a.en - b.en; });
  return '<section class="tarjeta">' + cabTarjeta('i-regalo', 'Fechas importantes', 'var(--rosa)', 'Añadir', 'data-acc="nuevo-cumple"') +
    (todo.length ? '<div class="lista-filas">' + todo.slice(0, 5).map(function(x){
      return '<div class="fila"><span class="cuenta-atras' + (x.en <= 3 ? ' urge' : '') + '"><b>' + (x.en === 0 ? 'HOY' : x.en) + '</b>' + (x.en ? (x.en === 1 ? 'día' : 'días') : '') + '</span>' +
        '<div class="cuerpo" data-acc="evento-ed" data-id="' + x.id + '"><div class="titulo">' + esc(x.t) + '</div><div class="meta"><span>' + cap(fechaLarga(x.dia)) + '</span>' + (x.extra ? '<span class="cumple">' + x.extra + '</span>' : '') + '</div></div>' +
        (x.en === 0 ? '<button class="btn chico" data-acc="fecha-felicitar" data-id="' + x.id + '">🎉 Saludar</button>'
         : x.cumple && x.en <= 30 ? (tareaRegalo(x.id) ? '<span class="etiqueta ok-regalo">🎁 anotado</span>' : '<button class="btn-icono" data-acc="cumple-regalo" data-id="' + x.id + '" data-dia="' + x.dia + '" title="Anotar el regalo" aria-label="Anotar el regalo">🎁</button>') : '') + '</div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Añade cumpleaños y aniversarios para que nunca se te pasen.</div>') + '</section>';
}
function tarjetaCompras(){
  var l = vivos('listas').find(function(x){ return /compra|super|mercado/i.test(sinTildes(x.nombre)); });
  if(!l) return '';
  var faltan = (l.items || []).filter(function(i){ return !i.ok; });
  return '<section class="tarjeta">' + cabTarjeta('i-listas', 'Para comprar', 'var(--esp-personal)', 'Abrir lista', 'data-acc="lista-abrir" data-id="' + l.id + '"') +
    '<div class="compras">' + (faltan.length ? faltan.slice(0, 12).map(function(i){
      return '<button type="button" class="compra" data-acc="compra-ok" data-lista="' + l.id + '" data-id="' + i.id + '">' + esc(i.t) + '</button>';
    }).join('') : '<span class="vacio" style="padding:4px 0">Nada que comprar. 🛒</span>') + '</div>' +
    siempreHTML(l) +
    '<form class="captura" data-acc="compra-nueva" data-lista="' + l.id + '" style="margin:0 12px 12px;box-shadow:none" autocomplete="off"><input id="compraNueva" maxlength="80" placeholder="Añadir a la compra… (Enter)"><button class="btn chico primario" type="submit">' + ico('i-plus') + '</button></form></section>';
}

/* ---------- Complementos: lo de siempre, recordar, regalo, plan, bolso ------ */
var BASICOS_COMPRA = ['Arroz', 'Huevos', 'Leche', 'Pan', 'Pollo', 'Papas', 'Fruta', 'Aceite', 'Azúcar', 'Papel higiénico'];
function claveCompra(t){ return sinTildes(String(t)).toLowerCase().trim(); }
function esListaCompras(l){ return !!l && /compra|super|mercado/i.test(sinTildes(l.nombre || '')); }
/* Cada vez que tachas algo de la compra se cuenta, y lo que más compras
   sale como botón para volver a apuntarlo con un toque. */
function contarCompra(l, t){
  var f = l.frec = l.frec || {}, k = Object.keys(f).find(function(x){ return claveCompra(x) === claveCompra(t); }) || String(t).trim().slice(0, 60);
  f[k] = (f[k] || 0) + 1;
  var ks = Object.keys(f);
  if(ks.length > 60) ks.sort(function(a, b){ return f[a] - f[b]; }).slice(0, ks.length - 60).forEach(function(x){ delete f[x]; });
}
function siempreHTML(l){
  var f = l.frec || {}, pend = (l.items || []).filter(function(i){ return !i.ok; }).map(function(i){ return claveCompra(i.t); });
  var ks = Object.keys(f).sort(function(a, b){ return f[b] - f[a] || a.localeCompare(b); });
  if(ks.length < 4) BASICOS_COMPRA.forEach(function(b){ if(!ks.some(function(k){ return claveCompra(k) === claveCompra(b); })) ks.push(b); });
  ks = ks.filter(function(k){ return pend.indexOf(claveCompra(k)) < 0; }).slice(0, 10);
  if(!ks.length) return '';
  return '<div class="siempre"><small>Lo de siempre</small><div>' + ks.map(function(k){
    return '<button type="button" data-acc="compra-siempre" data-lista="' + l.id + '" data-t="' + esc(k) + '">+ ' + esc(k) + '</button>';
  }).join('') + '</div></div>';
}
function nombreCumple(t){ return String(t || '').replace(/^\s*(cumple(años|anos)?|cumple)\s*(de\s+)?/i, '').trim() || String(t || ''); }
function tareaRegalo(evId){ return vivos('tareas').find(function(t){ return t.regalo === evId && !t.hecha; }); }
function planDe(evId){ return vivos('tareas').filter(function(t){ return t.plan === evId; }); }
function crearPlanExamen(evId, dia){
  var e = buscarId('eventos', evId); if(!e) return;
  var hoy = hoyISO(), dias = [];
  for(var i = 5; i >= 1; i--){ var d = sumarDias(dia, -i); if(d >= hoy) dias.push(d); }
  if(!dias.length){ aviso('Ya no hay días para repasar', 'El examen es mañana: ¡a darle hoy!'); return; }
  var ids = dias.map(function(d, k){
    var t = poner('tareas', { id:nid(), t:(k === dias.length - 1 ? 'Repaso final: ' : 'Repasar (' + (k + 1) + '/' + dias.length + '): ') + e.t, fecha:d, hora:'', prio:k === dias.length - 1 ? 2 : 1, area:'', esp:'estudios', rep:'no', sub:[], notas:'Plan de repaso para «' + e.t + '» del ' + fechaCorta(dia) + '.', plan:evId, creada:Date.now() });
    return t.id;
  });
  aviso('📚 Plan listo: ' + dias.length + (dias.length === 1 ? ' día' : ' días') + ' de repaso', 'Del ' + fechaCorta(dias[0]) + ' al ' + fechaCorta(dias[dias.length - 1]) + ', en tus tareas.', 'Deshacer', function(){
    ids.forEach(function(id){ var t = buscarId('tareas', id); if(t){ t.del = true; t.upd = t.delEn = Date.now(); } });
    guardar(); pintar();
  });
  pintar();
}
function telCliente(nombre){
  var c = vivos('clientes').find(function(x){ return claveCompra(x.nombre) === claveCompra(nombre); });
  return c ? (c.tel || '').replace(/[^\d]/g, '') : '';
}
function whatsapp(tel, texto){
  if(!tel) return compartir('Mensaje', texto);
  if(tel.length === 9) tel = '51' + tel;
  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
}
var BOLSO_BASE = ['Chimpunes', 'Canilleras', 'Camiseta y short', 'Medias', 'Agua', 'Toalla', 'Plata para la cancha'];
function listaBolso(){ return vivos('listas').find(function(x){ return /bolso|partido|pichanga|futbol/i.test(sinTildes(x.nombre || '')); }); }
function tarjetaBolso(pa){
  var l = listaBolso(), prox = (pa || [])[0];
  var tit = 'Tu bolso' + (prox && prox.en <= 1 ? ' · partido ' + (prox.en ? 'mañana' : 'hoy') : '');
  if(!l) return '<section class="tarjeta">' + cabTarjeta('i-listas', 'Tu bolso', 'var(--esp-deporte)') +
    '<div class="vacio" style="padding-top:4px">Que no se te quede nada: chimpunes, canilleras, agua…<br><button class="btn chico primario" style="margin-top:10px" data-acc="bolso-crear">🎒 Armar mi bolso</button></div></section>';
  var its = l.items || [], listos = its.filter(function(i){ return i.ok; }).length;
  return '<section class="tarjeta">' + cabTarjeta('i-listas', tit, 'var(--esp-deporte)', 'Editar', 'data-acc="lista-abrir" data-id="' + l.id + '"') +
    '<div class="bolso">' + its.map(function(i){
      return '<button type="button" class="' + (i.ok ? 'listo' : '') + '" aria-pressed="' + !!i.ok + '" data-acc="bolso-ok" data-lista="' + l.id + '" data-id="' + i.id + '">' + (i.ok ? '✓ ' : '') + esc(i.t) + '</button>';
    }).join('') + '</div>' +
    '<div class="bolso-pie"><span>' + (its.length && listos === its.length ? '🎒 ¡Todo listo, a la cancha!' : listos + ' de ' + its.length + ' en el bolso') + '</span>' +
    (listos ? '<button class="btn chico" data-acc="bolso-vaciar" data-lista="' + l.id + '">Vaciar</button>' : '') + '</div></section>';
}
/* Diario: lo que escribiste hace una semana, un mes y un año */
function recuerdosHTML(dia){
  var y = +dia.slice(0, 4), m = +dia.slice(5, 7), d = dia.slice(8);
  var mes = m === 1 ? (y - 1) + '-12-' + d : y + '-' + dos(m - 1) + '-' + d;
  var ops = [['Hace una semana', sumarDias(dia, -7)], ['Hace un mes', mes], ['Hace un año', (y - 1) + dia.slice(4)]];
  var hay = ops.map(function(o){ var x = buscarId('diario', o[1]); return x && !x.del && x.texto ? { n:o[0], x:x } : null; }).filter(Boolean);
  if(!hay.length) return '';
  return '<section class="tarjeta recuerdos">' + cabTarjeta('i-diario', 'Un día como hoy', 'var(--rosa)') + '<div>' + hay.map(function(h){
    return '<button class="entrada-diario" data-acc="diario-dia" data-dia="' + h.x.id + '"><span class="em">🕰️</span><div style="min-width:0"><b>' + h.n + ' · ' + fechaCorta(h.x.id) + '</b><p>' + esc(h.x.texto) + '</p></div></button>';
  }).join('') + '</div></section>';
}

/* ---------- Estudios: nota que necesitas y faltas --------------------------- */
var NOTA_APROBAR = 10.5;
/* Si las evaluaciones tienen peso y faltan algunas por rendir, cuánto hay
   que sacar de media en lo que falta para cerrar el curso aprobado. */
function notaNecesaria(c){
  var ns = c.notas || [];
  if(!ns.length || !ns.every(function(x){ return +x.p > 0; })) return null;
  var total = ns.reduce(function(a, x){ return a + +x.p; }, 0);
  if(Math.abs(total - 100) > 0.5) return null;
  var hecho = 0, pesoHecho = 0, pesoFalta = 0;
  ns.forEach(function(x){ if(x.v !== '' && x.v != null){ hecho += +x.v * +x.p; pesoHecho += +x.p; } else pesoFalta += +x.p; });
  if(!pesoFalta) return null;
  return (NOTA_APROBAR * 100 - hecho) / pesoFalta;
}
function textoNecesaria(c){
  var n = notaNecesaria(c);
  if(n == null) return '';
  if(n <= 0) return '<span class="necesita ok">Ya aprobaste 🎉</span>';
  if(n > 20) return '<span class="necesita mal">Necesitarías ' + n.toFixed(1) + ': habla con el profe</span>';
  return '<span class="necesita ' + (n > 15 ? 'mal' : n > 12 ? 'ojo' : 'ok') + '">Necesitas ' + n.toFixed(1) + ' en lo que falta</span>';
}
function textoFaltas(c){
  if(!c.maxFaltas && !c.faltas) return '';
  var f = +c.faltas || 0, m = +c.maxFaltas || 0;
  return '<span class="faltas ' + (m && f >= m ? 'mal' : m && f >= m * .7 ? 'ojo' : '') + '">Faltas ' + f + (m ? '/' + m : '') + '</span>';
}

/* ---------- Oficina: cronómetro de horas por cliente ------------------------ */
var CLAVE_RELOJ = 'agenda_reloj';
var reloj = leerJSON(CLAVE_RELOJ, null);
function minutosHoras(desde, cliente){
  return vivos('horas').filter(function(h){ return h.fecha >= desde && (!cliente || h.cliente === cliente); }).reduce(function(a, h){ return a + (+h.min || 0); }, 0);
}
function hhmm(min){ min = Math.round(min); return Math.floor(min / 60) + 'h ' + dos(min % 60) + 'm'; }
function tarjetaHoras(){
  var hoy = hoyISO(), ini = inicioSemana(hoy), mes = hoy.slice(0, 7) + '-01';
  var semana = minutosHoras(ini), hoyMin = minutosHoras(hoy) - minutosHoras(sumarDias(hoy, 1));
  var porCli = {}, tarifas = {};
  vivos('horas').forEach(function(h){ if(h.fecha >= mes){ var k = h.cliente || 'Sin cliente'; porCli[k] = (porCli[k] || 0) + (+h.min || 0); if(+h.tarifa) tarifas[k] = +h.tarifa; } });
  var facturable = Object.keys(porCli).reduce(function(a, k){ return a + (tarifas[k] ? porCli[k] / 60 * tarifas[k] : 0); }, 0);
  var clientes = [];
  vivos('horas').concat(vivos('cobros')).forEach(function(x){ var n = x.cliente; if(n && clientes.indexOf(n) < 0) clientes.push(n); });
  var enMarcha = reloj && reloj.inicio;
  var ult = vivos('horas').sort(function(a, b){ return (b.fecha + b.ini).localeCompare(a.fecha + a.ini); }).slice(0, 4);
  return '<section class="tarjeta tarjeta-horas">' + cabTarjeta('i-reloj', 'Horas trabajadas', 'var(--esp-oficina)', 'Anotar a mano', 'data-acc="hora-nueva"') +
    '<div class="tarjeta-cuerpo">' +
      '<div class="cronometro' + (enMarcha ? ' andando' : '') + '">' +
        '<div><small>' + (enMarcha ? 'Trabajando en ' + esc(reloj.cliente || 'algo') : 'Cronómetro parado') + '</small><b id="relojOficina">' + (enMarcha ? mmssLargo(Date.now() - reloj.inicio) : '0:00:00') + '</b></div>' +
        (enMarcha ? '<button class="btn peligro" data-acc="reloj-parar">' + ico('i-pausa') + 'Parar</button>'
                  : '<form class="reloj-form" data-acc="reloj-empezar" autocomplete="off"><input class="entrada" id="relojCliente" list="listaClientes" placeholder="Cliente o proyecto" maxlength="60"><datalist id="listaClientes">' + clientes.map(function(c){ return '<option value="' + esc(c) + '">'; }).join('') + '</datalist><button class="btn primario" type="submit">' + ico('i-play') + 'Empezar</button></form>') +
      '</div>' +
      '<div class="cifras" style="padding:12px 0 0"><div><small>Hoy</small><b>' + hhmm(hoyMin) + '</b></div><div><small>Esta semana</small><b>' + hhmm(semana) + '</b></div><div class="entra"><small>Facturable del mes</small><b>' + dinero(facturable) + '</b></div></div>' +
      (Object.keys(porCli).length ? '<div style="margin-top:10px">' + Object.keys(porCli).sort(function(a, b){ return porCli[b] - porCli[a]; }).slice(0, 5).map(function(k){
        var total = Object.keys(porCli).reduce(function(a, x){ return a + porCli[x]; }, 0);
        return '<div class="barra-h" style="padding:5px 0;grid-template-columns:minmax(0,120px) minmax(0,1fr) 70px"><span>' + esc(k) + '</span><div class="barra-prog"><i style="width:' + (porCli[k] / total * 100).toFixed(1) + '%;background:var(--esp-oficina)"></i></div><b>' + (porCli[k] / 60).toFixed(1) + ' h</b></div>';
      }).join('') + '</div>' : '') +
    '</div>' +
    (ult.length ? '<div class="lista-filas">' + ult.map(function(h){
      return '<div class="fila"><span class="hora" style="width:52px">' + (h.ini || '') + '</span><div class="cuerpo" data-acc="hora-ed" data-id="' + h.id + '"><div class="titulo">' + esc(h.cliente || 'Sin cliente') + (h.nota ? ' · ' + esc(h.nota) : '') + '</div><div class="meta"><span>' + relativo(h.fecha) + '</span><span>' + hhmm(+h.min || 0) + '</span>' + (+h.tarifa ? '<span>' + dinero(+h.min / 60 * +h.tarifa) + '</span>' : '') + '</div></div></div>';
    }).join('') + '</div>' : '') + '</section>';
}
function mmssLargo(ms){ var s = Math.floor(ms / 1000); return Math.floor(s / 3600) + ':' + dos(Math.floor(s / 60) % 60) + ':' + dos(s % 60); }
function tarifaDe(cliente){
  var t = 0; vivos('horas').forEach(function(h){ if(h.cliente === cliente && +h.tarifa) t = +h.tarifa; }); return t;
}
function pararReloj(){
  if(!reloj) return;
  var min = Math.max(1, Math.round((Date.now() - reloj.inicio) / 60000)), d = new Date(reloj.inicio);
  var h = { id:nid(), fecha:iso(d), ini:dos(d.getHours()) + ':' + dos(d.getMinutes()), min:min, cliente:reloj.cliente || '', nota:'', tarifa:tarifaDe(reloj.cliente || '') };
  poner('horas', h);
  reloj = null; try{ localStorage.removeItem(CLAVE_RELOJ); }catch(e){}
  aviso('⏱️ ' + hhmm(min) + ' anotadas', h.cliente || 'Sin cliente', 'Editar', function(){ editarHora(h.id); });
  pintar();
}
function editarHora(id){
  var h = id ? JSON.parse(JSON.stringify(buscarId('horas', id))) : { id:nid(), fecha:hoyISO(), ini:'09:00', min:60, cliente:'', nota:'', tarifa:'' };
  abrirFlotante(cabFlot(id ? 'Horas trabajadas' : 'Anotar horas') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Cliente o proyecto', '<input name="c" maxlength="60" value="' + esc(h.cliente) + '" placeholder="Ej. Empresa ABC">') +
      '<div class="fila-campos tres">' + campo('Día', '<input type="date" name="f" value="' + esc(h.fecha) + '">') + campo('Empecé', '<input type="time" name="i" value="' + esc(h.ini) + '">') + campo('Minutos', '<input name="m" inputmode="numeric" value="' + esc(h.min) + '">') + '</div>' +
      '<div class="fila-campos">' + campo('Qué hice', '<input name="n" maxlength="120" value="' + esc(h.nota) + '" placeholder="Opcional">') + campo('Tarifa por hora (' + MONEDA + ')', '<input name="t" inputmode="decimal" value="' + esc(h.tarifa) + '" placeholder="Opcional">') + '</div>' +
      botonesEd(!!id) + '</form>');
  var f = $('formEd');
  f.onsubmit = function(ev){
    ev.preventDefault();
    h.cliente = f.c.value.trim(); h.fecha = f.f.value || hoyISO(); h.ini = f.i.value; h.min = Math.max(1, parseInt(f.m.value, 10) || 1);
    h.nota = f.n.value.trim(); h.tarifa = num(f.t.value) || '';
    poner('horas', h); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('horas', h.id, 'Registro borrado'); pintar(); } };
}

/* ---------- Deporte: tus números en la cancha -------------------------------- */
function statsFutbol(){
  var hoy = hoyISO(), r = { pj:0, g:0, a:0, v:0, e:0, d:0, racha:[] };
  vivos('eventos').filter(function(e){ return e.tipo === 'partido' && e.fecha <= hoy && e.jugado; })
    .sort(function(a, b){ return a.fecha.localeCompare(b.fecha); }).forEach(function(e){
      r.pj++; r.g += +e.goles || 0; r.a += +e.asist || 0;
      if(e.res === 'v') r.v++; else if(e.res === 'e') r.e++; else if(e.res === 'd') r.d++;
      if(e.res) r.racha.push(e.res);
    });
  return r;
}
function tarjetaFutbol(){
  var s = statsFutbol();
  var ult = vivos('eventos').filter(function(e){ return e.tipo === 'partido' && e.jugado; }).sort(function(a, b){ return b.fecha.localeCompare(a.fecha); }).slice(0, 4);
  return '<section class="tarjeta marcador-card">' + cabTarjeta('i-balon', 'Tus números en la cancha', 'var(--esp-deporte)', 'Anotar partido', 'data-acc="partido-jugado"') +
    '<div class="marcador">' +
      [['PJ', s.pj], ['Goles', s.g], ['Asist.', s.a], ['G/P', s.pj ? (s.g / s.pj).toFixed(1) : '0']].map(function(x){ return '<div><b>' + x[1] + '</b><small>' + x[0] + '</small></div>'; }).join('') +
    '</div>' +
    '<div class="ved"><span class="v">' + s.v + ' ganados</span><span class="e">' + s.e + ' empates</span><span class="d">' + s.d + ' perdidos</span>' +
      '<span class="forma">' + s.racha.slice(-5).map(function(x){ return '<i class="' + x + '">' + { v:'G', e:'E', d:'P' }[x] + '</i>'; }).join('') + '</span></div>' +
    (ult.length ? '<div class="lista-filas">' + ult.map(function(e){
      return '<div class="fila"><span class="res-chip ' + (e.res || '') + '">' + ({ v:'G', e:'E', d:'P' }[e.res] || '·') + '</span><div class="cuerpo" data-acc="evento-ed" data-id="' + e.id + '"><div class="titulo">' + esc(e.t) + (e.resultado ? ' · ' + esc(e.resultado) : '') + '</div><div class="meta"><span>' + relativo(e.fecha) + '</span>' +
        (+e.goles ? '<span>⚽ ' + e.goles + '</span>' : '') + (+e.asist ? '<span>🅰️ ' + e.asist + '</span>' : '') + '</div></div></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Anota tus partidos jugados con tus goles y asistencias.</div>') + '</section>';
}

/* ==========================================================================
   PESTAÑAS DE CADA ESPACIO
   Cada espacio tiene su Resumen y tres pestañas con herramientas que solo
   tienen sentido ahí: la casa y la comida en Personal, el repaso y los
   exámenes en Estudios, el tablero y los clientes en Oficina, el gym, la
   cancha y el cardio en Deporte.
   ========================================================================== */
var PESTANAS = {
  personal:[['inicio','Resumen','🏠'],['casa','Casa','🧹'],['papeles','Papeles','📄']],
  estudios:[['inicio','Resumen','🎓'],['cursos','Cursos','📚']],
  oficina:[['inicio','Resumen','💼'],['clientes','Clientes','🤝'],['trabajo','Trabajo','📋']],
  deporte:[['inicio','Resumen','⚽'],['entreno','Entreno','🏋️'],['cancha','Cancha','🥅']]
};
function tabEsp(id){
  var t = (ui.espTab || {})[id];
  return PESTANAS[id].some(function(p){ return p[0] === t; }) ? t : 'inicio';
}
function pestanasEsp(id){
  var act = tabEsp(id);
  return '<div class="esp-tabs" role="tablist">' + PESTANAS[id].map(function(p){
    return '<button type="button" role="tab" data-acc="esp-tab" data-esp="' + id + '" data-v="' + p[0] + '" aria-selected="' + (p[0] === act) + '"><span>' + p[2] + '</span>' + p[1] + '</button>';
  }).join('') + '</div>';
}

/* Los números del saludo, distintos en cada espacio */
function datosHeroe(id){
  function d(icono, v, txt, acc){ return '<' + (acc ? 'button' : 'span') + ' class="dato"' + (acc ? ' ' + acc : '') + '>' + ico(icono) + '<b>' + v + '</b> ' + txt + '</' + (acc ? 'button' : 'span') + '>'; }
  var hoy = hoyISO();
  if(id === 'personal'){
    var l = listaCompras(), falta = l ? (l.items || []).filter(function(i){ return !i.ok; }).length : 0;
    var cu = proximosCumples(60)[0], teDeben = vivos('deudas').filter(function(x){ return !x.saldada && x.tipo === 'me'; }).reduce(function(a, x){ return a + (+x.monto || 0); }, 0);
    return d('i-listas', falta, 'por comprar', 'data-acc="esp-tab" data-esp="personal" data-v="casa"') +
      d('i-regalo', cu ? (cu.en === 0 ? '¡Hoy!' : cu.en) : '—', cu ? (cu.en === 0 ? 'hay cumpleaños' : cu.en === 1 ? 'día al próximo cumple' : 'días al próximo cumple') : 'sin cumpleaños cerca', 'data-acc="esp-tab" data-esp="personal" data-v="papeles"') +
      d('i-cuentas', dinero(teDeben), 'te deben', 'data-acc="esp-tab" data-esp="personal" data-v="papeles"');
  }
  if(id === 'estudios'){
    var pg = promedioGeneral(), ex = eventosTipo('examen', 90)[0];
    var rep = vivos('tareas').filter(function(t){ return t.plan && !t.hecha && t.fecha <= hoy; }).length;
    return d('i-birrete', pg != null ? pg.toFixed(1) : '—', 'de promedio', 'data-acc="esp-tab" data-esp="estudios" data-v="cursos"') +
      d('i-diana', ex ? (ex.en === 0 ? '¡Hoy!' : ex.en) : '—', ex ? (ex.en === 0 ? 'hay examen' : ex.en === 1 ? 'día al próximo examen' : 'días al próximo examen') : 'sin exámenes', 'data-acc="esp-tab" data-esp="estudios" data-v="inicio"') +
      d('i-estrella', rep, rep === 1 ? 'repaso para hoy' : 'repasos para hoy', 'data-acc="esp-tareas" data-v="estudios"');
  }
  if(id === 'oficina'){
    var cob = vivos('cobros').filter(function(x){ return !x.cobrado; }).reduce(function(a, x){ return a + (+x.monto || 0); }, 0);
    var enCurso = vivos('tareas').filter(function(t){ return espDe(t) === 'oficina' && !t.hecha && t.estado === 'curso'; }).length;
    var reu = eventosTipo('reunion', 7).length;
    return d('i-subir', dinero(cob), 'por cobrar', 'data-acc="esp-tab" data-esp="oficina" data-v="clientes"') +
      d('i-tareas', enCurso, 'en curso', 'data-acc="esp-tab" data-esp="oficina" data-v="trabajo"') +
      d('i-maletin', reu, reu === 1 ? 'reunión en 7 días' : 'reuniones en 7 días', 'data-acc="esp-tab" data-esp="oficina" data-v="trabajo"');
  }
  var ses = vivos('entrenos').filter(function(e){ return e.fecha > sumarDias(hoy, -7) && e.fecha <= hoy; }).length, pa = eventosTipo('partido', 60)[0];
  return d('i-habitos', semanasSeguidas(), 'semanas activo') +
    d('i-flecha', ses, ses === 1 ? 'entreno en 7 días' : 'entrenos en 7 días', 'data-acc="esp-tab" data-esp="deporte" data-v="entreno"') +
    d('i-balon', pa ? (pa.en === 0 ? '¡Hoy!' : pa.en) : '—', pa ? (pa.en === 0 ? 'hay partido' : pa.en === 1 ? 'día al partido' : 'días al partido') : 'sin partidos', 'data-acc="esp-tab" data-esp="deporte" data-v="cancha"');
}

/* Resumen compacto: lo que viene y lo pendiente del espacio, en una sola tarjeta */
function tarjetaSemanaEsp(id){
  var E = espInfo(id), hoy = hoyISO();
  var tareas = vivos('tareas').filter(function(t){ return espDe(t) === id && !t.hecha; }).sort(ordenTareas);
  var ag = agendaEsp(id, 7).filter(function(a){ return a.x.tipo !== 'tarea'; }), visto = {}, prox = [];
  ag.forEach(function(a){
    var k = a.x.tipo + a.x.id;
    if(visto[k] && (a.x.o.rep && a.x.o.rep !== 'no' || a.x.tipo === 'clase')) return;
    visto[k] = 1; prox.push(a);
  });
  var ns = vivos('notas').filter(function(n){ return espDe(n) === id; }).length;
  var ls = vivos('listas').filter(function(l){ return espDe(l) === id; }).length;
  var ms = vivos('metas').filter(function(m){ return espDe(m) === id && !m.archivada; });
  var pa = proyectosActivos(id).length;
  var wd = new Date().getDay();
  var hs = vivos('habitos').filter(function(x){ return espDe(x) === id && (!x.dias || x.dias.indexOf(wd) >= 0); });
  var din = dineroEsp(id), tm = totalesMes(din.lista, hoy.slice(0, 7));
  function chip(em, n, txt, acc){ return '<button type="button" class="atajo" ' + acc + '><span>' + em + '</span><b>' + n + '</b>' + txt + '</button>'; }
  return '<section class="tarjeta ancho-2 semana-esp">' + cabTarjeta('i-cal', 'Tu semana en ' + E.nom.toLowerCase(), E.c, 'Calendario', 'data-acc="esp-cal" data-v="' + id + '"') +
    '<div class="semana-cols"><div><h4>Lo que viene</h4>' +
      (prox.length ? '<div class="lista-filas">' + prox.slice(0, 5).map(function(a){
        return filaAgenda(a.x, a.d).replace('<span class="hora">' + (a.x.hora || '—') + '</span>', '<span class="hora">' + (a.d === hoy ? (a.x.hora || 'Hoy') : cap(relativo(a.d)).slice(0, 3) + (a.x.hora ? '<br>' + a.x.hora : '')) + '</span>');
      }).join('') + '</div>' : '<div class="vacio" style="padding:6px 0">Semana libre. 😌</div>') +
    '</div><div><h4>Pendientes <button class="mas-mini" data-acc="esp-tareas" data-v="' + id + '">' + tareas.length + ' en total</button></h4>' +
      (tareas.length ? '<div class="lista-filas">' + tareas.slice(0, 5).map(filaTarea).join('') + '</div>' : '<div class="vacio" style="padding:6px 0">Todo al día. ✅</div>') +
    '</div></div>' +
    (hs.length ? '<div class="chips-habito">' + hs.map(function(x){
      var ok = x.marcas && x.marcas[hoy];
      return '<button type="button" class="chip-habito" data-acc="habito-hoy" data-id="' + x.id + '" aria-pressed="' + !!ok + '"><span class="em">' + esc(x.em || '⭐') + '</span>' + esc(x.nombre) + (ok ? ' ✓' : '') + '</button>';
    }).join('') + '</div>' : '') +
    '<div class="atajos">' +
      (pa ? chip('📁', pa, pa === 1 ? 'proyecto' : 'proyectos', 'data-acc="proy-lista" data-v="' + id + '"') : '') +
      (ms.length ? chip('🎯', ms.length, ms.length === 1 ? 'meta' : 'metas', 'data-ir="metas"') : '') +
      (ns ? chip('🗒️', ns, ns === 1 ? 'nota' : 'notas', 'data-ir="notas"') : '') +
      (ls ? chip('📋', ls, ls === 1 ? 'lista' : 'listas', 'data-ir="listas"') : '') +
      chip('💸', dinero(tm.sal), din.cat ? 'gastado este mes' : 'salió este mes', 'data-acc="din-ver" data-v="' + din.libro + '"') +
    '</div></section>';
}

/* Las cuentas del espacio, solo donde son el centro: Personal y Oficina */
function tarjetaDineroEsp(id){
  var din = dineroEsp(id);
  var ult = din.lista.slice().sort(function(a, b){ return b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)); }).slice(0, 4);
  if(!ult.length) return '';
  return '<section class="tarjeta">' + cabTarjeta('i-cuentas', 'Últimos movimientos', 'var(--haber)', 'Ver todos', 'data-acc="mov-ver" data-v="' + din.libro + '"') +
    '<div class="lista-filas">' + ult.map(function(t){ return filaMov(t, false, false); }).join('') + '</div></section>';
}
/* Gasto e ingreso del mes, lado a lado, cada uno con su botón para anotar */
function bloquesDinero(id){
  var din = id === 'todo' ? { libro:'personal', lista:movsDe('todo'), cat:'' } : dineroEsp(id), ym = hoyISO().slice(0, 7), tm = totalesMes(din.lista, ym), ta = totalesMes(din.lista, mesAntes(ym, 1));
  var hoy = hoyISO(), gHoy = 0, iHoy = 0;
  din.lista.forEach(function(t){ if(t.date === hoy){ if(t.type === 'Gasto') gHoy += t.amount; else iHoy += t.amount; } });
  var queda = tm.ent - tm.sal;
  function bloque(tipo, em, monto, lbl, extra, riel, nota){
    return '<div class="din-bloque ' + tipo + '"><span class="w-ico">' + em + '</span><b class="db-monto">' + dinero(monto) + '</b><span class="w-lbl">' + lbl + '</span>' +
      '<div class="w-riel"><i style="width:' + Math.max(0, Math.min(100, riel * 100)).toFixed(1) + '%"></i></div>' +
      '<small class="db-nota">' + nota + '</small>' +
      '<button class="btn chico ' + (tipo === 'g' ? 'primario' : 'btn-ingreso') + '" data-acc="esp-anotar" data-v="' + id + '" data-t="' + (tipo === 'g' ? 'Gasto' : 'Ingreso') + '">' + ico('i-plus') + extra + '</button></div>';
  }
  return '<div class="din-bloques">' +
    bloque('g', '💸', tm.sal, 'gastado este mes', 'Gasto', tm.ent ? tm.sal / tm.ent : (tm.sal ? 1 : 0),
      gHoy ? '<b>' + dinero(gHoy) + '</b> hoy' : tm.ent ? Math.round(tm.sal / tm.ent * 100) + '% de lo que entró' : 'Nada hoy') +
    bloque('i', '💰', tm.ent, id === 'oficina' ? 'facturado este mes' : 'ingresó este mes', 'Ingreso', ta.ent ? tm.ent / ta.ent : (tm.ent ? 1 : 0),
      iHoy ? '<b>' + dinero(iHoy) + '</b> hoy' : ta.ent ? 'Mes pasado: ' + MONEDA + ' ' + formNum(Math.round(ta.ent)) : 'Nada hoy') +
    '<div class="din-queda ' + (queda < 0 ? 'neg' : '') + '"><span>' + (queda < 0 ? 'Este mes vas en rojo' : 'Te queda este mes') + '</span><b>' + (queda < 0 ? '−' : '') + dinero(Math.abs(queda)) + '</b></div>' +
  '</div>';
}

/* ==========================================================================
   PERSONAL
   ========================================================================== */
function listaCompras(){ return vivos('listas').find(function(x){ return /compra|super|mercado/i.test(sinTildes(x.nombre)); }); }

/* ---------- La casa: cosas que tocan cada tanto -------------------------- */
var CASA_SUG = [['Cambiar las sábanas','🛏️',7],['Regar las plantas','🪴',3],['Limpiar la refrigeradora','🧊',30],['Cambiar el cepillo de dientes','🪥',90],['Revisar el balón de gas','🔥',30],['Lavar el auto','🚗',15],['Limpiar el baño a fondo','🚿',7],['Sacar la basura reciclable','♻️',7]];
function estadoCasa(c){
  var hoy = hoyISO(), desde = c.ult ? diasEntre(c.ult, hoy) : null;
  var resta = desde == null ? 0 : (+c.cada || 7) - desde;
  return { desde:desde, resta:resta, p:desde == null ? 1 : Math.min(1, desde / (+c.cada || 7)) };
}
function tarjetaCasa(){
  var cs = vivos('casa').map(function(c){ return { c:c, s:estadoCasa(c) }; }).sort(function(a, b){ return a.s.resta - b.s.resta; });
  var usados = cs.map(function(x){ return sinTildes(x.c.t); });
  var sug = CASA_SUG.filter(function(s){ return usados.indexOf(sinTildes(s[0])) < 0; }).slice(0, 5);
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-casa', 'La casa: cada cuánto toca', 'var(--esp-personal)', 'Añadir', 'data-acc="casa-nueva"') +
    (cs.length ? '<div class="casa-lista">' + cs.map(function(x){
      var s = x.s, est = s.desde == null ? 'Sin empezar' : s.resta < 0 ? 'Atrasado ' + (-s.resta) + (s.resta === -1 ? ' día' : ' días') : s.resta === 0 ? 'Toca hoy' : 'En ' + s.resta + (s.resta === 1 ? ' día' : ' días');
      var cls = s.desde == null || s.resta < 0 ? 'mal' : s.resta === 0 ? 'ojo' : 'ok';
      return '<div class="casa-item ' + cls + '"><span class="casa-em">' + esc(x.c.em || '🧹') + '</span>' +
        '<div class="cuerpo" data-acc="casa-ed" data-id="' + x.c.id + '"><div class="titulo">' + esc(x.c.t) + '</div>' +
          '<div class="casa-barra"><i style="width:' + Math.round(s.p * 100) + '%"></i></div>' +
          '<div class="meta"><span class="estado">' + est + '</span><span>Cada ' + x.c.cada + ' días</span>' + (s.desde != null ? '<span>Última: ' + relativo(x.c.ult).toLowerCase() + '</span>' : '') + '</div></div>' +
        '<button class="btn chico' + (s.resta <= 0 ? ' primario' : '') + '" data-acc="casa-ok" data-id="' + x.c.id + '">' + ico('i-check') + 'Hecho</button></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Anota lo que toca cada tanto en casa y la agenda te avisa cuándo toca otra vez.</div>') +
    (sug.length ? '<div class="sugerencias"><small>Ideas:</small>' + sug.map(function(s){
      return '<button type="button" class="chip-sug" data-acc="casa-sug" data-t="' + esc(s[0]) + '" data-em="' + s[1] + '" data-c="' + s[2] + '">' + s[1] + ' ' + esc(s[0]) + '</button>';
    }).join('') + '</div>' : '') + '</section>';
}
function editarCasa(id){
  var c = id ? JSON.parse(JSON.stringify(buscarId('casa', id))) : { id:nid(), t:'', em:'🧹', cada:7, ult:'' };
  abrirFlotante(cabFlot(id ? 'Cosa de la casa' : 'Nueva cosa de la casa') +
    '<form class="form" id="formEd" autocomplete="off">' +
      '<div class="fila-campos" style="grid-template-columns:70px minmax(0,1fr)">' + campo('Emoji', '<input name="em" maxlength="4" value="' + esc(c.em) + '">') + campo('Qué', '<input name="t" required maxlength="60" value="' + esc(c.t) + '" placeholder="Ej. Cambiar el filtro del agua">') + '</div>' +
      '<div class="fila-campos">' + campo('Cada cuántos días', '<input name="cada" inputmode="numeric" value="' + esc(c.cada) + '">') + campo('La última vez', '<input type="date" name="ult" value="' + esc(c.ult) + '">') + '</div>' +
      botonesEd(!!id) + '</form>');
  var f = $('formEd');
  if(!id) f.t.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    c.t = f.t.value.trim(); if(!c.t) return;
    c.em = f.em.value.trim() || '🧹'; c.cada = Math.max(1, parseInt(f.cada.value, 10) || 7); c.ult = f.ult.value;
    poner('casa', c); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('casa', c.id, 'Borrado'); pintar(); } };
}

/* ---------- Menú de la semana ------------------------------------------ */
var PLATOS = ['Lomo saltado','Ají de gallina','Arroz con pollo','Tallarines verdes con bistec','Causa limeña','Seco de res con frejoles','Pollo al horno con papas','Menestrón','Sopa criolla','Ceviche','Arroz chaufa','Estofado de pollo','Olluquito con charqui','Carapulcra','Pescado a la plancha con ensalada','Tallarines rojos','Papa a la huancaína y pollo','Lentejas con arroz','Cau cau','Tacu tacu','Pollo saltado','Quinua con verduras','Sudado de pescado','Tortilla de verduras','Pastel de papa','Ensalada César con pollo'];
function menuDia(d){ var m = buscarId('menu', d); return m && !m.del ? m : { id:d, alm:'', cena:'' }; }
function tarjetaMenu(){
  var ini = inicioSemana(sumarDias(hoyISO(), 7 * (ui.menuSem || 0))), hoy = hoyISO(), dias = [];
  for(var i = 0; i < 7; i++) dias.push(sumarDias(ini, i));
  var hechos = dias.filter(function(d){ var m = menuDia(d); return m.alm || m.cena; }).length;
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-diario', 'Menú de la semana', 'var(--naranja, #F59E7A)') +
    '<div class="menu-nav"><button class="btn-icono" data-acc="menu-sem" data-n="-1" aria-label="Semana anterior">' + ico('i-izq') + '</button>' +
      '<b>' + (ui.menuSem ? fechaCorta(dias[0]) + ' – ' + fechaCorta(dias[6]) : 'Esta semana') + '</b><small>' + hechos + ' de 7 días planeados</small>' +
      '<button class="btn-icono" data-acc="menu-sem" data-n="1" aria-label="Semana siguiente">' + ico('i-der') + '</button></div>' +
    '<div class="menu">' +
      '<div class="menu-cab"><span></span><span>🍽️ Almuerzo</span><span>🌙 Cena</span></div>' +
      dias.map(function(d){
        var m = menuDia(d);
        return '<div class="menu-fila' + (d === hoy ? ' hoy' : '') + '"><b>' + cap(DIAS3[deISO(d).getDay()]) + '<small>' + deISO(d).getDate() + '</small></b>' +
          ['alm','cena'].map(function(k){
            return '<div class="menu-celda"><input data-menu="' + d + '|' + k + '" value="' + esc(m[k] || '') + '" maxlength="60" placeholder="—"><button type="button" data-acc="menu-idea" data-d="' + d + '" data-k="' + k + '" title="Dame una idea" aria-label="Dame una idea">🎲</button></div>';
          }).join('') + '</div>';
      }).join('') +
    '</div>' +
    '<div class="pie-fila-btn"><button class="btn chico" data-acc="menu-copiar">' + ico('i-rep') + 'Repetir la semana pasada</button><button class="btn chico" data-acc="menu-sorpresa">🎲 Llenar lo vacío</button></div></section>';
}
function platoAlAzar(evitar){
  var ops = PLATOS.filter(function(p){ return evitar.indexOf(p) < 0; });
  return (ops.length ? ops : PLATOS)[Math.floor(Math.random() * (ops.length || PLATOS.length))];
}
function platosDeLaSemana(ini){ var out = []; for(var i = 0; i < 7; i++){ var m = menuDia(sumarDias(ini, i)); out.push(m.alm, m.cena); } return out.filter(Boolean); }

/* ---------- Documentos que vencen ---------------------------------------- */
var DOC_SUG = [['DNI','🪪'],['Pasaporte','🛂'],['Licencia de conducir','🚗'],['SOAT','🛡️'],['Seguro de salud','🏥'],['Tarjeta de crédito','💳']];
function tarjetaDocs(){
  var hoy = hoyISO();
  var ds = vivos('docs').map(function(d){ return { d:d, n:d.vence ? diasEntre(hoy, d.vence) : null }; }).sort(function(a, b){ return (a.n == null ? 1e6 : a.n) - (b.n == null ? 1e6 : b.n); });
  var usados = ds.map(function(x){ return sinTildes(x.d.t); });
  var sug = DOC_SUG.filter(function(s){ return usados.indexOf(sinTildes(s[0])) < 0; });
  return '<section class="tarjeta">' + cabTarjeta('i-candado', 'Documentos y vencimientos', 'var(--esp-personal)', 'Añadir', 'data-acc="doc-nuevo"') +
    (ds.length ? '<div class="lista-filas">' + ds.map(function(x){
      var n = x.n, est = n == null ? '<span>Sin fecha</span>' : n < 0 ? '<span class="doc-est mal">Vencido hace ' + (-n) + ' días</span>' : n <= 60 ? '<span class="doc-est ojo">Vence en ' + n + ' días</span>' : '<span class="doc-est ok">Vigente · ' + fechaCorta(x.d.vence) + '</span>';
      return '<div class="fila"><span class="em-fila">' + esc(x.d.em || '📄') + '</span><div class="cuerpo" data-acc="doc-ed" data-id="' + x.d.id + '"><div class="titulo">' + esc(x.d.t) + (x.d.num ? ' <small class="doc-num">' + esc(x.d.num) + '</small>' : '') + '</div><div class="meta">' + est + '</div></div></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Que no se te pase la renovación del DNI, el pasaporte o el SOAT.</div>') +
    (sug.length ? '<div class="sugerencias"><small>Añadir:</small>' + sug.map(function(s){ return '<button type="button" class="chip-sug" data-acc="doc-nuevo" data-t="' + s[0] + '" data-em="' + s[1] + '">' + s[1] + ' ' + s[0] + '</button>'; }).join('') + '</div>' : '') + '</section>';
}
function editarDoc(id, preset){
  var d = id ? JSON.parse(JSON.stringify(buscarId('docs', id))) : Object.assign({ id:nid(), t:'', em:'📄', num:'', vence:'', notas:'' }, preset || {});
  abrirFlotante(cabFlot(id ? 'Documento' : 'Nuevo documento') +
    '<form class="form" id="formEd" autocomplete="off">' +
      '<div class="fila-campos" style="grid-template-columns:70px minmax(0,1fr)">' + campo('Emoji', '<input name="em" maxlength="4" value="' + esc(d.em) + '">') + campo('Documento', '<input name="t" required maxlength="60" value="' + esc(d.t) + '" placeholder="Ej. Pasaporte">') + '</div>' +
      '<div class="fila-campos">' + campo('Vence el', '<input type="date" name="v" value="' + esc(d.vence) + '">') + campo('Número (opcional)', '<input name="num" maxlength="30" value="' + esc(d.num) + '">') + '</div>' +
      campo('Notas', '<textarea name="notas" maxlength="600" placeholder="Dónde se renueva, qué llevar…">' + esc(d.notas) + '</textarea>') +
      '<label class="interruptor"><input type="checkbox" name="rec"' + (id ? '' : ' checked') + '>🔔 Crear un recordatorio 1 mes antes de que venza</label>' +
      botonesEd(!!id) + '</form>');
  var f = $('formEd');
  if(!d.t) f.t.focus(); else if(!id) f.v.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    d.t = f.t.value.trim(); if(!d.t) return;
    d.em = f.em.value.trim() || '📄'; d.vence = f.v.value; d.num = f.num.value.trim(); d.notas = f.notas.value.trim();
    poner('docs', d);
    if(f.rec.checked && d.vence){
      var fr = sumarDias(d.vence, -30); if(fr < hoyISO()) fr = hoyISO();
      poner('recordatorios', { id:nid(), t:'Renovar ' + d.t, fecha:fr, hora:'09:00', rep:'no', notas:'Vence el ' + fechaCorta(d.vence), esp:'personal' });
      aviso('🔔 Te aviso el ' + fechaCorta(fr), 'Renovar ' + d.t);
    }
    cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('docs', d.id, 'Documento borrado'); pintar(); } };
}

/* ==========================================================================
   ESTUDIOS
   ========================================================================== */
/* ---------- Fichas de repaso (sistema de cajas) ------------------------- */
var CAJAS = [1, 2, 4, 8, 16];   /* días hasta volver a verla, según la caja */
function fichasParaHoy(curso){
  var hoy = hoyISO();
  return vivos('fichas').filter(function(f){ return (!curso || f.curso === curso) && (!f.prox || f.prox <= hoy); });
}
function nombreCurso(cid){ var c = cid && buscarId('cursos', cid); return c && !c.del ? c.nombre : 'General'; }
function tarjetaFichas(){
  var fs = vivos('fichas'), cursos = vivos('cursos');
  var grupos = [{ id:'', n:'Todas' }].concat(cursos.map(function(c){ return { id:c.id, n:c.nombre }; }));
  if(fs.some(function(f){ return !f.curso || !buscarId('cursos', f.curso); })) grupos.push({ id:'_g', n:'General' });
  var dominadas = fs.filter(function(f){ return (+f.caja || 1) >= 5; }).length;
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-estrella', 'Fichas de repaso', 'var(--esp-estudios)') +
    '<div class="tarjeta-cuerpo"><p class="explica">Escribe una pregunta y su respuesta. Cada ficha vuelve cuando toca: si la sabes, tarda más en volver; si no, vuelve mañana.</p>' +
      '<div class="mazos">' + grupos.filter(function(g){ return g.id === '' || fs.some(function(f){ return g.id === '_g' ? !buscarId('cursos', f.curso) : f.curso === g.id; }); }).map(function(g){
        var del = g.id === '' ? fs : fs.filter(function(f){ return g.id === '_g' ? !buscarId('cursos', f.curso) : f.curso === g.id; });
        var hoyN = del.filter(function(f){ return !f.prox || f.prox <= hoyISO(); }).length;
        return '<button type="button" class="mazo' + (hoyN ? ' toca' : '') + '" data-acc="repasar" data-v="' + g.id + '"' + (hoyN ? '' : ' disabled') + '><b>' + esc(g.n) + '</b><span>' + del.length + ' fichas</span><em>' + (hoyN ? '▶ Repasar ' + hoyN : 'Al día ✓') + '</em></button>';
      }).join('') + '</div>' +
      (fs.length ? '<div class="cajas">' + [1,2,3,4,5].map(function(k){
        var n = fs.filter(function(f){ return (+f.caja || 1) === k; }).length;
        return '<div><i style="height:' + (fs.length ? Math.max(4, n / fs.length * 100) : 4) + '%"></i><small>' + (k === 5 ? '🏆' : 'Caja ' + k) + '<br><b>' + n + '</b></small></div>';
      }).join('') + '</div><small class="bien-pie">' + dominadas + ' de ' + fs.length + ' fichas dominadas</small>' : '') +
    '</div>' +
    '<form class="ficha-form" data-acc="ficha-nueva" autocomplete="off">' +
      '<select id="fichaCurso"><option value="">General</option>' + cursos.map(function(c){ return '<option value="' + c.id + '"' + (ui.fichaCurso === c.id ? ' selected' : '') + '>' + esc(c.nombre) + '</option>'; }).join('') + '</select>' +
      '<input id="fichaQ" maxlength="200" placeholder="Pregunta · ej. ¿Derivada de sen x?">' +
      '<input id="fichaA" maxlength="300" placeholder="Respuesta · ej. cos x">' +
      '<button class="btn primario" type="submit">' + ico('i-plus') + 'Ficha</button></form>' +
    (fs.length ? '<details class="todas-fichas"><summary>Ver todas las fichas (' + fs.length + ')</summary><div class="lista-filas">' + fs.slice().sort(function(a, b){ return (b.creada || 0) - (a.creada || 0); }).map(function(f){
      return '<div class="fila"><span class="caja-chip">' + (+f.caja || 1) + '</span><div class="cuerpo" data-acc="ficha-ed" data-id="' + f.id + '"><div class="titulo">' + esc(f.q) + '</div><div class="meta"><span>' + esc(nombreCurso(f.curso)) + '</span><span>' + (!f.prox || f.prox <= hoyISO() ? 'Para hoy' : 'Vuelve ' + relativo(f.prox).toLowerCase()) + '</span></div></div></div>';
    }).join('') + '</div></details>' : '') + '</section>';
}
var repaso = null;
function empezarRepaso(curso){
  var cola = fichasParaHoy(curso === '_g' ? '' : curso).filter(function(f){ return curso !== '_g' || !buscarId('cursos', f.curso); });
  if(!cola.length){ aviso('Nada que repasar', 'Todo al día.'); return; }
  cola.sort(function(){ return Math.random() - .5; });
  repaso = { cola:cola.map(function(f){ return f.id; }), bien:0, mal:0, total:cola.length, vista:false };
  pintarRepaso();
}
function pintarRepaso(){
  if(!repaso) return;
  alCerrarFlot = null;   /* cambiar de ficha no es cerrar el repaso */
  if(!repaso.cola.length){
    var r = repaso; repaso = null;
    abrirFlotante(cabFlot('¡Repaso terminado!') + '<div class="repaso-fin"><b>' + r.bien + ' / ' + (r.bien + r.mal) + '</b><span>respuestas que sabías</span><p>' + (r.mal ? 'Las que fallaste vuelven mañana. ¡A por ellas!' : '¡Perfecto! 🎉') + '</p><button class="btn primario" data-cerrar="1">Listo</button></div>');
    if(!r.mal) confeti();
    pintar(); return;
  }
  var f = buscarId('fichas', repaso.cola[0]), hechas = repaso.total - repaso.cola.length;
  abrirFlotante(cabFlot('Repaso · ' + esc(nombreCurso(f.curso))) +
    '<div class="repaso"><div class="repaso-prog"><i style="width:' + (hechas / repaso.total * 100) + '%"></i></div><small>' + (hechas + 1) + ' de ' + repaso.total + ' · caja ' + (+f.caja || 1) + '</small>' +
      '<div class="ficha-grande' + (repaso.vista ? ' vuelta' : '') + '"><div class="cara">' + esc(f.q) + '</div>' + (repaso.vista ? '<div class="cara resp">' + esc(f.a || '—') + '</div>' : '') + '</div>' +
      (repaso.vista ? '<div class="botones"><button class="btn peligro" data-ed="no">✗ No la sabía</button><button class="btn primario" data-ed="si">✓ La sabía</button></div>'
                    : '<div class="botones"><button class="btn primario" data-ed="ver">Ver respuesta</button></div>') +
    '</div>', function(){ repaso = null; });
  edAcciones = {
    ver: function(){ repaso.vista = true; pintarRepaso(); },
    si: function(){ responderFicha(true); },
    no: function(){ responderFicha(false); }
  };
}
function responderFicha(sabia){
  var r = repaso, f = JSON.parse(JSON.stringify(buscarId('fichas', r.cola[0])));
  f.caja = sabia ? Math.min(5, (+f.caja || 1) + 1) : 1;
  f.prox = sumarDias(hoyISO(), sabia ? CAJAS[f.caja - 1] : 1);
  poner('fichas', f);
  if(sabia) r.bien++; else r.mal++;
  r.cola.shift(); r.vista = false;
  pintarRepaso();
}
function editarFicha(id){
  var f = JSON.parse(JSON.stringify(buscarId('fichas', id)));
  abrirFlotante(cabFlot('Ficha') + '<form class="form" id="formEd" autocomplete="off">' +
    campo('Curso', '<select name="c"><option value="">General</option>' + vivos('cursos').map(function(c){ return '<option value="' + c.id + '"' + (c.id === f.curso ? ' selected' : '') + '>' + esc(c.nombre) + '</option>'; }).join('') + '</select>') +
    campo('Pregunta', '<textarea name="q" maxlength="200">' + esc(f.q) + '</textarea>') + campo('Respuesta', '<textarea name="a" maxlength="300">' + esc(f.a) + '</textarea>') +
    botonesEd(true) + '</form>');
  var fm = $('formEd');
  fm.onsubmit = function(ev){ ev.preventDefault(); f.q = fm.q.value.trim(); f.a = fm.a.value.trim(); f.curso = fm.c.value; if(!f.q) return; poner('fichas', f); cerrarFlotante(); pintar(); };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('fichas', f.id, 'Ficha borrada'); pintar(); } };
}

/* ---------- Exámenes con sus temas ---------------------------------------- */
function tarjetaTemas(){
  var ex = eventosTipo('examen', 90);
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-diana', 'Preparar exámenes', 'var(--debe)', 'Nuevo examen', 'data-acc="nuevo-examen"') +
    (ex.length ? '<div class="examenes">' + ex.slice(0, 6).map(function(x){
      var e = x.e, ts = e.temas || [], ok = ts.filter(function(t){ return t.ok; }).length, falta = ts.length - ok;
      var ritmo = falta && x.en > 0 ? Math.ceil(falta / x.en) : falta;
      var p = ts.length ? ok / ts.length : 0;
      return '<div class="examen' + (x.en <= 3 ? ' urge' : '') + '">' +
        '<div class="examen-cab"><span class="cuenta-atras' + (x.en <= 3 ? ' urge' : '') + '"><b>' + (x.en === 0 ? 'HOY' : x.en) + '</b>' + (x.en ? (x.en === 1 ? 'día' : 'días') : '') + '</span>' +
          '<div class="cuerpo" data-acc="evento-ed" data-id="' + e.id + '"><div class="titulo">' + esc(e.t) + '</div><div class="meta"><span>' + cap(fechaLarga(x.dia)) + (e.todo ? '' : ' · ' + e.ini) + '</span>' + (e.lugar ? '<span>' + ico('i-lugar') + esc(e.lugar) + '</span>' : '') + '</div></div>' +
          anilloMini(p, p >= 1 ? 'var(--haber)' : 'var(--esp-estudios)', 42) + '</div>' +
        (ts.length ? '<div class="temas">' + ts.map(function(t, i){
          return '<button type="button" class="tema" data-acc="tema-ok" data-id="' + e.id + '" data-i="' + i + '" aria-pressed="' + !!t.ok + '">' + (t.ok ? '✓ ' : '') + esc(t.t) + '</button>';
        }).join('') + '</div>' : '') +
        '<div class="examen-pie">' + (ts.length ? '<small>' + (falta ? 'Te faltan ' + falta + ' temas' + (x.en > 0 ? ': unos <b>' + ritmo + ' por día</b>' : '') : '¡Todo repasado! 💪') + '</small>' : '<small>Añade los temas que entran.</small>') +
          '<form class="tema-form" data-acc="tema-nuevo" data-id="' + e.id + '" autocomplete="off"><input maxlength="80" placeholder="+ Tema (Enter)"></form></div>' +
      '</div>';
    }).join('') + '</div>' : vacio('📝', 'Sin exámenes a la vista', 'Crea uno y añade sus temas: te digo cuántos repasar cada día.')) + '</section>';
}

/* ---------- Clases de hoy y mañana ---------------------------------------- */
function tarjetaClasesHoy(){
  var hoy = hoyISO(), items = [];
  [0, 1].forEach(function(k){
    var d = sumarDias(hoy, k), w = deISO(d).getDay();
    vivos('cursos').forEach(function(c){
      if(c.inicio && d < c.inicio || c.fin && d > c.fin) return;
      (c.clases || []).forEach(function(cl){ if(+cl.d === w) items.push({ d:d, c:c, k:cl }); });
    });
  });
  items.sort(function(a, b){ return (a.d + a.k.ini).localeCompare(b.d + b.k.ini); });
  var ahora = new Date(), hm = dos(ahora.getHours()) + ':' + dos(ahora.getMinutes());
  return '<section class="tarjeta">' + cabTarjeta('i-birrete', 'Clases de hoy y mañana', 'var(--esp-estudios)', 'Horario', 'data-acc="esp-tab" data-esp="estudios" data-v="cursos"') +
    (items.length ? '<div class="lista-filas">' + items.map(function(x){
      var ya = x.d === hoy && (x.k.fin || x.k.ini) < hm, ahoraSi = x.d === hoy && x.k.ini <= hm && (x.k.fin || x.k.ini) >= hm;
      return '<div class="fila' + (ya ? ' hecha' : '') + '"><span class="hora" style="width:56px">' + (x.d === hoy ? '' : 'Mañ ') + x.k.ini + '</span><span class="barrita" style="--c:var(--esp-estudios)"></span>' +
        '<div class="cuerpo" data-acc="curso-ed" data-id="' + x.c.id + '"><div class="titulo">' + esc(x.c.nombre) + (ahoraSi ? ' <span class="en-vivo">EN CLASE</span>' : '') + '</div><div class="meta"><span>' + x.k.ini + (x.k.fin ? '–' + x.k.fin : '') + '</span>' + (x.c.aula ? '<span>' + ico('i-lugar') + esc(x.c.aula) + '</span>' : '') + textoFaltas(x.c) + '</div></div></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Sin clases hoy ni mañana. 📖</div>') + '</section>';
}

/* ==========================================================================
   OFICINA
   ========================================================================== */
/* ---------- Tablero: por hacer, en curso, hecho ------------------------ */
function columnaKan(t){ return t.hecha ? 2 : t.estado === 'curso' ? 1 : 0; }
function tarjetaTablero(){
  var hace7 = Date.now() - 7 * 864e5;
  var ts = vivos('tareas').filter(function(t){ return espDe(t) === 'oficina' && (!t.hecha || (t.hechaEn || 0) > hace7); }).sort(ordenTareas);
  var cols = [['Por hacer','📥'],['En curso','⚙️'],['Hecho (7 días)','✅']];
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-tareas', 'Tablero de trabajo', 'var(--esp-oficina)', 'Nueva tarea', 'data-acc="nuevo" data-tipo="tarea"') +
    '<div class="kanban">' + cols.map(function(c, ci){
      var suyas = ts.filter(function(t){ return columnaKan(t) === ci; });
      return '<div class="kan-col k' + ci + '"><h4>' + c[1] + ' ' + c[0] + '<span>' + suyas.length + '</span></h4>' +
        (suyas.length ? suyas.slice(0, 12).map(function(t){
          var pr = t.proy && buscarId('proyectos', t.proy);
          return '<div class="kan-tarjeta" style="--c:' + (t.prio ? PRIOS[t.prio].c : 'var(--regla)') + '">' +
            '<div class="cuerpo" data-acc="tarea-ed" data-id="' + t.id + '"><b>' + esc(t.t) + '</b>' +
              '<div class="meta">' + (t.fecha ? '<span class="' + (!t.hecha && t.fecha < hoyISO() ? 'tarde' : t.fecha === hoyISO() ? 'hoy' : '') + '">' + relativo(t.fecha) + '</span>' : '') + (pr && !pr.del ? '<span>📁 ' + esc(pr.nombre) + '</span>' : '') + '</div></div>' +
            '<div class="kan-mov">' + (ci > 0 ? '<button class="btn-icono" data-acc="kan-mover" data-id="' + t.id + '" data-d="-1" aria-label="Atrás">' + ico('i-izq') + '</button>' : '<span></span>') +
              (ci < 2 ? '<button class="btn-icono" data-acc="kan-mover" data-id="' + t.id + '" data-d="1" aria-label="Avanzar">' + ico('i-der') + '</button>' : '') + '</div></div>';
        }).join('') : '<div class="kan-vacio">—</div>') + '</div>';
    }).join('') + '</div></section>';
}
function moverKan(id, d){
  var t = JSON.parse(JSON.stringify(buscarId('tareas', id))), c = columnaKan(t) + d;
  if(c < 0 || c > 2) return;
  if(c === 2){ alternarTarea(id); return; }
  t.hecha = false; t.hechaEn = 0; t.estado = c === 1 ? 'curso' : '';
  poner('tareas', t);
  if(c === 1) aviso('⚙️ En curso', t.t);
  pintar();
}

/* ---------- Clientes ----------------------------------------------------- */
function clientesTodos(){
  var fichas = vivos('clientes'), nombres = fichas.map(function(c){ return sinTildes(c.nombre); }), sueltos = [];
  vivos('horas').concat(vivos('cobros')).forEach(function(x){
    var n = (x.cliente || '').trim(); if(!n) return;
    if(nombres.indexOf(sinTildes(n)) < 0 && sueltos.indexOf(n) < 0) sueltos.push(n);
  });
  return fichas.map(function(c){ return { c:c, n:c.nombre }; }).concat(sueltos.map(function(n){ return { c:null, n:n }; }));
}
function datosCliente(n){
  var k = sinTildes(n), mes = hoyISO().slice(0, 7) + '-01';
  var min = vivos('horas').filter(function(h){ return sinTildes(h.cliente || '') === k && h.fecha >= mes; }).reduce(function(a, h){ return a + (+h.min || 0); }, 0);
  var cob = vivos('cobros').filter(function(x){ return sinTildes(x.cliente || '') === k; });
  var debe = cob.filter(function(x){ return !x.cobrado; }).reduce(function(a, x){ return a + (+x.monto || 0); }, 0);
  var pagado = cob.filter(function(x){ return x.cobrado; }).reduce(function(a, x){ return a + (+x.monto || 0); }, 0);
  var vencido = cob.some(function(x){ return !x.cobrado && x.vence && x.vence < hoyISO(); });
  return { min:min, debe:debe, pagado:pagado, vencido:vencido };
}
function tarjetaClientes(){
  var cs = clientesTodos();
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-maletin', 'Clientes', 'var(--esp-oficina)', 'Nuevo cliente', 'data-acc="cliente-nuevo"') +
    (cs.length ? '<div class="clientes">' + cs.map(function(x){
      var d = datosCliente(x.n), c = x.c || {};
      var ini = x.n.split(/\s+/).map(function(p){ return p.charAt(0); }).join('').slice(0, 2).toUpperCase();
      var tel = (c.tel || '').replace(/[^\d+]/g, '');
      return '<div class="cliente">' +
        '<div class="cliente-cab" data-acc="' + (x.c ? 'cliente-ed' : 'cliente-nuevo') + '" data-id="' + (x.c ? c.id : '') + '" data-n="' + esc(x.n) + '"><span class="cliente-ini">' + esc(ini) + '</span><div><b>' + esc(x.n) + '</b><small>' + (c.contacto ? esc(c.contacto) : x.c ? (c.email ? esc(c.email) : 'Sin contacto') : 'Toca para completar su ficha') + '</small></div></div>' +
        '<div class="cliente-num"><div><small>Horas del mes</small><b>' + (d.min / 60).toFixed(1) + '</b></div><div class="' + (d.vencido ? 'mal' : '') + '"><small>Te debe</small><b>' + dinero(d.debe) + '</b></div><div><small>Te pagó</small><b>' + dinero(d.pagado) + '</b></div></div>' +
        '<div class="cliente-acc">' +
          (tel ? '<a class="btn chico" href="https://wa.me/' + tel.replace('+', '') + '" target="_blank" rel="noopener">💬 WhatsApp</a><a class="btn chico" href="tel:' + tel + '">📞 Llamar</a>' : '') +
          (c.email ? '<a class="btn chico" href="mailto:' + esc(c.email) + '">✉️ Correo</a>' : '') +
          '<button class="btn chico" data-acc="cliente-cobro" data-n="' + esc(x.n) + '">' + ico('i-plus') + 'Cobro</button>' +
          '<button class="btn chico" data-acc="cliente-reloj" data-n="' + esc(x.n) + '">' + ico('i-play') + 'Trabajar</button>' +
        '</div></div>';
    }).join('') + '</div>' : vacio('🤝', 'Tus clientes', 'Guarda sus datos y ve de un vistazo las horas que les dedicas y lo que te deben.')) + '</section>';
}
function editarCliente(id, nombre){
  var c = id ? JSON.parse(JSON.stringify(buscarId('clientes', id))) : { id:nid(), nombre:nombre || '', contacto:'', tel:'', email:'', ruc:'', notas:'' };
  abrirFlotante(cabFlot(id ? 'Cliente' : 'Nuevo cliente') + '<form class="form" id="formEd" autocomplete="off">' +
    campo('Empresa o nombre', '<input name="n" required maxlength="60" value="' + esc(c.nombre) + '">') +
    '<div class="fila-campos">' + campo('Persona de contacto', '<input name="co" maxlength="60" value="' + esc(c.contacto) + '">') + campo('RUC', '<input name="ruc" inputmode="numeric" maxlength="15" value="' + esc(c.ruc) + '">') + '</div>' +
    '<div class="fila-campos">' + campo('Teléfono / WhatsApp', '<input name="tel" type="tel" maxlength="20" value="' + esc(c.tel) + '" placeholder="+51 999 999 999">') + campo('Correo', '<input name="em" type="email" maxlength="80" value="' + esc(c.email) + '">') + '</div>' +
    campo('Notas', '<textarea name="notas" maxlength="1000">' + esc(c.notas) + '</textarea>') + botonesEd(!!id) + '</form>');
  var f = $('formEd');
  f.onsubmit = function(ev){
    ev.preventDefault();
    c.nombre = f.n.value.trim(); if(!c.nombre) return;
    c.contacto = f.co.value.trim(); c.ruc = f.ruc.value.trim(); c.tel = f.tel.value.trim(); c.email = f.em.value.trim(); c.notas = f.notas.value.trim();
    poner('clientes', c); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('clientes', c.id, 'Cliente borrado'); pintar(); } };
}

/* ---------- Actas de reunión y acuerdos ---------------------------------- */
function reunionesPasadas(dias){
  var hoy = hoyISO(), out = [];
  vivos('eventos').forEach(function(e){
    if(e.tipo !== 'reunion') return;
    for(var i = 0; i <= dias; i++){ var d = sumarDias(hoy, -i); if(ocurre(e.fecha, e.rep, d, e.hasta)) out.push({ e:e, dia:d }); }
  });
  return out.sort(function(a, b){ return b.dia.localeCompare(a.dia); });
}
function tarjetaActas(){
  var rs = reunionesPasadas(21).slice(0, 6), pend = [];
  vivos('eventos').forEach(function(e){
    Object.keys(e.actas || {}).forEach(function(d){ (e.actas[d].acuerdos || []).forEach(function(a, i){ if(!a.ok) pend.push({ e:e, d:d, a:a, i:i }); }); });
  });
  return '<section class="tarjeta">' + cabTarjeta('i-notas', 'Actas y acuerdos', 'var(--esp-oficina)') +
    (pend.length ? '<div class="acuerdos"><h4>Acuerdos pendientes · ' + pend.length + '</h4>' + pend.slice(0, 8).map(function(p){
      return '<div class="fila">' + casilla('acuerdo-ok', p.e.id, false, 'var(--esp-oficina)', true, ' data-d="' + p.d + '" data-i="' + p.i + '"') +
        '<div class="cuerpo" data-acc="acta" data-id="' + p.e.id + '" data-d="' + p.d + '"><div class="titulo">' + esc(p.a.t) + '</div><div class="meta"><span>' + (p.a.quien ? '👤 ' + esc(p.a.quien) : 'Sin responsable') + '</span><span>' + esc(p.e.t) + ' · ' + fechaCorta(p.d) + '</span></div></div></div>';
    }).join('') + '</div>' : '') +
    (rs.length ? '<div class="lista-filas">' + rs.map(function(r){
      var acta = (r.e.actas || {})[r.dia];
      return '<div class="fila"><span class="em-fila">' + (acta ? '📝' : '🤝') + '</span><div class="cuerpo" data-acc="acta" data-id="' + r.e.id + '" data-d="' + r.dia + '"><div class="titulo">' + esc(r.e.t) + '</div><div class="meta"><span>' + cap(relativo(r.dia)) + '</span>' +
        (acta ? '<span>' + (acta.acuerdos || []).length + ' acuerdos</span>' : '<span class="tarde">Sin acta</span>') + '</div></div>' +
        '<button class="btn chico" data-acc="acta" data-id="' + r.e.id + '" data-d="' + r.dia + '">' + (acta ? 'Ver' : 'Escribir') + '</button></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Después de cada reunión, apunta aquí qué se decidió y quién hace qué.</div>') + '</section>';
}
function filaAcuerdo(a){
  return '<div class="fila-acuerdo"><input value="' + esc(a.t || '') + '" placeholder="Acuerdo o tarea" maxlength="120"><input value="' + esc(a.quien || '') + '" placeholder="Quién" maxlength="30">' +
    '<label title="Crear tarea para mí"><input type="checkbox"' + (a.tarea ? ' checked disabled' : '') + '>Tarea</label><button type="button" class="btn-icono" data-ed="ac-x" aria-label="Quitar">' + ico('i-x') + '</button></div>';
}
function editarActa(eid, dia){
  var e = JSON.parse(JSON.stringify(buscarId('eventos', eid))), acta = (e.actas || {})[dia] || { asist:'', notas:'', acuerdos:[] };
  abrirFlotante(cabFlot('Acta · ' + esc(e.t)) + '<form class="form" id="formEd" autocomplete="off">' +
    '<small style="color:var(--tinta-3)">' + cap(fechaLarga(dia)) + (e.lugar ? ' · ' + esc(e.lugar) : '') + '</small>' +
    campo('Asistentes', '<input name="as" maxlength="200" value="' + esc(acta.asist) + '" placeholder="Ej. Ana, Luis, cliente">') +
    campo('Qué se habló', '<textarea name="no" maxlength="4000" placeholder="Puntos principales…">' + esc(acta.notas) + '</textarea>') +
    grupo('Acuerdos', '<div id="acuerdos" class="clases">' + (acta.acuerdos.length ? acta.acuerdos : [{ t:'' }]).map(filaAcuerdo).join('') + '</div>' +
      '<button type="button" class="btn chico" data-ed="ac-add" style="align-self:flex-start;margin-top:4px">' + ico('i-plus') + 'Acuerdo</button>' +
      '<small style="color:var(--tinta-3)">Marca "Tarea" y se crea en tu tablero de la oficina.</small>') +
    botonesEd(!!(e.actas && e.actas[dia])) + '</form>');
  var f = $('formEd');
  f.onsubmit = function(ev){
    ev.preventDefault();
    var viejos = acta.acuerdos || [], nuevas = 0;
    acta = { asist:f.as.value.trim(), notas:f.no.value.trim(), acuerdos:[].slice.call(document.querySelectorAll('#acuerdos .fila-acuerdo')).map(function(r, i){
      var ins = r.querySelectorAll('input'), a = { t:ins[0].value.trim(), quien:ins[1].value.trim(), ok:viejos[i] && viejos[i].t === ins[0].value.trim() ? !!viejos[i].ok : false, tarea:ins[2].checked };
      if(a.t && a.tarea && !ins[2].disabled){ poner('tareas', { id:nid(), t:a.t, fecha:'', hora:'', prio:0, area:'', esp:'oficina', rep:'no', sub:[], notas:'De la reunión «' + e.t + '» del ' + fechaCorta(dia), creada:Date.now() }); nuevas++; }
      return a;
    }).filter(function(a){ return a.t; }) };
    e.actas = e.actas || {}; e.actas[dia] = acta;
    poner('eventos', e); cerrarFlotante(); pintar();
    aviso('📝 Acta guardada', nuevas ? nuevas + (nuevas === 1 ? ' tarea creada' : ' tareas creadas') + ' en el tablero' : null);
  };
  edAcciones = {
    'ac-add': function(){ $('acuerdos').insertAdjacentHTML('beforeend', filaAcuerdo({ t:'' })); var i = $('acuerdos').querySelectorAll('.fila-acuerdo'); i[i.length - 1].querySelector('input').focus(); },
    'ac-x': function(b){ b.parentNode.remove(); },
    borrar: function(){ delete e.actas[dia]; poner('eventos', e); cerrarFlotante(); pintar(); aviso('Acta borrada'); }
  };
}

/* ==========================================================================
   DEPORTE
   ========================================================================== */
/* ---------- Temporizador de intervalos y descansos -------------------- */
var crono = null;
function pitidoCorto(freq, dur){
  try{
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if(audio.state === 'suspended') audio.resume();
    var o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime;
    o.frequency.value = freq || 660; g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (dur || .18));
    o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (dur || .18) + .02);
  }catch(e){}
}
function iniciarCrono(titulo, fases){
  pitidoCorto(880, .1);
  crono = { titulo:titulo, fases:fases, i:0, fin:Date.now() + fases[0].s * 1000, ult:-1 };
  abrirFlotante(cabFlot(esc(titulo)) + '<div class="crono-grande" id="cronoCaja"><small id="cronoFase"></small><b id="cronoT">0:00</b><div class="crono-prog"><i id="cronoProg"></i></div><em id="cronoSig"></em>' +
    '<div class="botones"><button class="btn peligro" data-cerrar="1">' + ico('i-x') + 'Terminar</button></div></div>', function(){ crono = null; });
  tickCrono();
}
function tickCrono(){
  if(!crono) return;
  var r = crono.fin - Date.now();
  if(r <= 0){
    crono.i++;
    try{ if(navigator.vibrate) navigator.vibrate(300); }catch(e){}
    if(crono.i >= crono.fases.length){ var t = crono.titulo; alCerrarFlot = null; crono = null; cerrarFlotante(); pitido(); aviso('💪 ¡Terminado!', t); return; }
    pitidoCorto(crono.fases[crono.i].tipo === 'descanso' ? 440 : 880, .35);
    crono.fin = Date.now() + crono.fases[crono.i].s * 1000; r = crono.fin - Date.now();
  }
  var f = crono.fases[crono.i], seg = Math.ceil(r / 1000);
  if(seg <= 3 && seg !== crono.ult && seg > 0){ crono.ult = seg; pitidoCorto(520, .08); }
  var caja = $('cronoCaja'); if(!caja) return;
  caja.className = 'crono-grande ' + (f.tipo || 'trabajo');
  $('cronoFase').textContent = f.n;
  $('cronoT').textContent = Math.floor(seg / 60) + ':' + dos(seg % 60);
  $('cronoProg').style.width = (100 - r / (f.s * 1000) * 100).toFixed(1) + '%';
  var sig = crono.fases[crono.i + 1];
  $('cronoSig').textContent = sig ? 'Después: ' + sig.n + ' · ' + sig.s + ' s' : 'Último tramo';
}
setInterval(tickCrono, 200);
function tarjetaDescanso(){
  return '<section class="tarjeta">' + cabTarjeta('i-reloj', 'Descanso entre series', 'var(--esp-deporte)') +
    '<div class="tarjeta-cuerpo"><div class="descansos">' + [45, 60, 90, 120, 180].map(function(s){
      return '<button type="button" data-acc="descanso" data-v="' + s + '"><b>' + { 45:'45"', 60:"1'", 90:"1'30", 120:"2'", 180:"3'" }[s] + '</b><small>' + (s <= 60 ? 'Ligero' : s <= 90 ? 'Hipertrofia' : 'Fuerza') + '</small></button>';
    }).join('') + '</div><small class="bien-pie">Pita 3 veces antes de acabar para que vuelvas a la barra.</small></div></section>';
}
function tarjetaIntervalos(){
  var c = pref.hiit || { t:20, d:10, r:8 };
  return '<section class="tarjeta">' + cabTarjeta('i-habitos', 'Intervalos (HIIT / Tabata)', 'var(--esp-deporte)') +
    '<form class="tarjeta-cuerpo hiit" data-acc="hiit" autocomplete="off">' +
      '<label><small>Trabajo</small><input name="t" inputmode="numeric" value="' + c.t + '"><em>seg</em></label>' +
      '<label><small>Descanso</small><input name="d" inputmode="numeric" value="' + c.d + '"><em>seg</em></label>' +
      '<label><small>Rondas</small><input name="r" inputmode="numeric" value="' + c.r + '"><em>×</em></label>' +
      '<button class="btn primario" type="submit">' + ico('i-play') + 'Empezar</button>' +
      '<small class="bien-pie" style="grid-column:1/-1">Total: ' + Math.round((c.t + c.d) * c.r / 60 * 10) / 10 + ' min con 10 s para prepararte. Tabata clásico: 20/10 × 8.</small>' +
    '</form></section>';
}

/* ---------- Cardio: ritmo y kilómetros -------------------------------- */
function ritmoTxt(minPorKm){ if(!isFinite(minPorKm) || !minPorKm) return '—'; var m = Math.floor(minPorKm), s = Math.round((minPorKm - m) * 60); if(s === 60){ m++; s = 0; } return m + ':' + dos(s); }
function statsCardio(){
  var hoy = hoyISO(), mes = hoy.slice(0, 7), ini = inicioSemana(hoy);
  var es = vivos('entrenos').filter(function(e){ return +e.km > 0; });
  var r = { kmMes:0, kmSem:0, corr:[], largo:0, mejor:0 };
  es.forEach(function(e){
    var km = +e.km;
    if(e.fecha.slice(0, 7) === mes) r.kmMes += km;
    if(e.fecha >= ini) r.kmSem += km;
    if(e.tipo === 'correr'){ r.corr.push(e); if(km > r.largo) r.largo = km; var p = (+e.min || 0) / km; if(p > 0 && (!r.mejor || p < r.mejor)) r.mejor = p; }
  });
  var kmC = r.corr.reduce(function(a, e){ return a + +e.km; }, 0), minC = r.corr.reduce(function(a, e){ return a + (+e.min || 0); }, 0);
  r.ritmo = kmC ? minC / kmC : 0;
  r.kmMes = Math.round(r.kmMes * 10) / 10; r.kmSem = Math.round(r.kmSem * 10) / 10;
  return r;
}
function tarjetaCardio(){
  var s = statsCardio(), meta = +pref.metaKm || 15, p = Math.min(1, s.kmSem / meta);
  var ult = vivos('entrenos').filter(function(e){ return ['correr','bici','nadar'].indexOf(e.tipo) >= 0; }).sort(function(a, b){ return b.fecha.localeCompare(a.fecha); }).slice(0, 5);
  /* Kilómetros de las últimas 8 semanas */
  var sem = [], eti = [], ini = inicioSemana(hoyISO());
  for(var i = 7; i >= 0; i--){
    var a = sumarDias(ini, -7 * i), b = sumarDias(a, 6);
    sem.push(Math.round(vivos('entrenos').reduce(function(t, e){ return t + (e.fecha >= a && e.fecha <= b ? +e.km || 0 : 0); }, 0) * 10) / 10);
    eti.push(i ? fechaCorta(a).split(' ')[0] : 'Esta');
  }
  return '<section class="tarjeta ancho-2">' + cabTarjeta('i-flecha', 'Correr, bici y natación', 'var(--esp-deporte)', 'Anotar', 'data-acc="entreno-rapido" data-v="correr"') +
    '<div class="tarjeta-cuerpo">' +
      '<div class="marcador cardio-marcador">' +
        [['Km del mes', formNum(s.kmMes)], ['Ritmo medio', ritmoTxt(s.ritmo)], ['Mejor ritmo', ritmoTxt(s.mejor)], ['Más largo', s.largo ? formNum(s.largo) + ' km' : '—']].map(function(x){ return '<div><b>' + x[1] + '</b><small>' + x[0] + '</small></div>'; }).join('') +
      '</div>' +
      '<div class="meta-km"><div class="bien-fila"><span>🎯 Meta semanal</span><form class="meta-km-form" data-acc="meta-km"><b>' + formNum(s.kmSem) + ' /</b><input id="metaKm" inputmode="decimal" value="' + meta + '"><b>km</b></form></div>' +
        '<div class="barra-prog grande"><i style="width:' + Math.round(p * 100) + '%;background:var(--esp-deporte)"></i></div>' +
        '<small class="bien-pie">' + (p >= 1 ? '¡Meta de la semana cumplida! 🏅' : 'Te faltan ' + formNum(Math.round((meta - s.kmSem) * 10) / 10) + ' km esta semana.') + ' El ritmo es minutos por kilómetro corriendo.</small></div>' +
      barras(sem, eti, 'var(--esp-deporte)', 100) +
    '</div>' +
    (ult.length ? '<div class="lista-filas">' + ult.map(function(e){
      var d = deporteInfo(e.tipo);
      return '<div class="fila"><span class="em-fila">' + d.em + '</span><div class="cuerpo" data-acc="entreno-ed" data-id="' + e.id + '"><div class="titulo">' + (e.km ? formNum(+e.km) + ' km' : d.n) + ' · ' + e.min + ' min</div><div class="meta"><span>' + relativo(e.fecha) + '</span>' + (e.tipo === 'correr' && +e.km ? '<span>' + ritmoTxt(e.min / e.km) + ' /km</span>' : '') + '</div></div></div>';
    }).join('') + '</div>' : '') + '</section>';
}

/* ---------- Mapa de actividad: 12 semanas -------------------------------- */
function tarjetaMapaActividad(){
  var hoy = hoyISO(), ini = sumarDias(inicioSemana(hoy), -7 * 11), min = {}, dias = 0, max = 0;
  vivos('entrenos').forEach(function(e){ if(e.fecha >= ini) min[e.fecha] = (min[e.fecha] || 0) + (+e.min || 30); });
  vivos('eventos').forEach(function(e){ if(e.tipo === 'partido' && e.jugado && e.fecha >= ini && !min[e.fecha]) min[e.fecha] = 90; });
  Object.keys(min).forEach(function(k){ dias++; if(min[k] > max) max = min[k]; });
  var celdas = '';
  for(var i = 0; i < 84; i++){
    var d = sumarDias(ini, i), m = min[d] || 0, n = !m ? 0 : m < 40 ? 1 : m < 70 ? 2 : m < 100 ? 3 : 4;
    celdas += '<i class="n' + n + (d === hoy ? ' hoy' : '') + (d > hoy ? ' fut' : '') + '" title="' + fechaCorta(d) + (m ? ': ' + m + ' min' : '') + '"></i>';
  }
  return '<section class="tarjeta">' + cabTarjeta('i-cal', 'Tus últimas 12 semanas', 'var(--esp-deporte)') +
    '<div class="tarjeta-cuerpo"><div class="mapa-act">' + celdas + '</div>' +
    '<div class="mapa-ley"><small>' + dias + ' días activo de 84</small><span>Menos <i class="n0"></i><i class="n1"></i><i class="n2"></i><i class="n3"></i><i class="n4"></i> Más</span></div></div></section>';
}

/* ---------- Cuerpo: peso e IMC --------------------------------------------- */
function tarjetaCuerpo(){
  var pesos = vivos('medidas').filter(function(x){ return +x.peso; }).sort(function(a, b){ return a.id.localeCompare(b.id); });
  var ultP = pesos[pesos.length - 1], antP = pesos[pesos.length - 2], est = +pref.estatura || 0;
  var imc = ultP && est ? +ultP.peso / Math.pow(est / 100, 2) : 0;
  var cat = !imc ? '' : imc < 18.5 ? ['Bajo peso', 'ojo'] : imc < 25 ? ['Saludable', 'ok'] : imc < 30 ? ['Sobrepeso', 'ojo'] : ['Obesidad', 'mal'];
  var linea = '';
  if(pesos.length > 1){
    var ps = pesos.slice(-12), mn = Math.min.apply(null, ps.map(function(p){ return +p.peso; })), mx = Math.max.apply(null, ps.map(function(p){ return +p.peso; }));
    var rango = Math.max(.5, mx - mn);
    var pts = ps.map(function(p, k){ return (k / (ps.length - 1) * 280 + 10).toFixed(1) + ',' + (60 - (+p.peso - mn) / rango * 44 - 8).toFixed(1); });
    linea = '<svg class="spark" viewBox="0 0 300 64" preserveAspectRatio="none"><polyline points="' + pts.join(' ') + '" fill="none" stroke="var(--esp-deporte)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  return '<section class="tarjeta">' + cabTarjeta('i-grafica', 'Tu cuerpo', 'var(--esp-deporte)') +
    '<div class="tarjeta-cuerpo"><div class="peso-fila"><div class="peso-actual"><b>' + (ultP ? formNum(+ultP.peso) + ' kg' : '—') + '</b>' +
      (ultP && antP ? '<small class="' + (+ultP.peso <= +antP.peso ? 'baja' : 'sube') + '">' + (+ultP.peso - +antP.peso > 0 ? '+' : '') + formNum(+ultP.peso - +antP.peso) + ' kg desde el ' + fechaCorta(antP.id) + '</small>' : '<small>Anota tu peso de vez en cuando</small>') + '</div>' +
      '<form class="peso-form" data-acc="peso" autocomplete="off"><input class="entrada" id="pesoHoy" inputmode="decimal" placeholder="kg hoy"><button class="btn chico primario" type="submit">' + ico('i-plus') + '</button></form></div>' +
      linea +
      '<div class="imc">' + (imc ? '<div><small>IMC</small><b>' + imc.toFixed(1) + '</b></div><span class="necesita ' + cat[1] + '">' + cat[0] + '</span>' +
        '<div class="imc-barra"><i style="left:' + Math.max(0, Math.min(100, (imc - 15) / 20 * 100)).toFixed(1) + '%"></i></div>' : '<small>Pon tu estatura para calcular tu IMC:</small>') +
        '<form class="estatura-form" data-acc="estatura"><input id="estatura" inputmode="numeric" value="' + (est || '') + '" placeholder="cm"><button class="btn chico" type="submit">OK</button></form></div>' +
    '</div></section>';
}

/* ---------- Armar la pichanga: jugadores y cuota ----------------------- */
function tarjetaPichanga(){
  var pa = eventosTipo('partido', 30)[0];
  if(!pa) return '<section class="tarjeta">' + cabTarjeta('i-balon', 'Armar la pichanga', 'var(--esp-deporte)', 'Nuevo partido', 'data-acc="nuevo-partido"') +
    '<div class="vacio" style="padding-top:4px">Programa un partido y aquí juntas a los jugadores, la cuota de la cancha y quién ya pagó.</div></section>';
  var e = pa.e, pi = e.pich || { costo:'', jug:[] }, n = pi.jug.length, cuota = n && +pi.costo ? +pi.costo / n : 0;
  var pagaron = pi.jug.filter(function(j){ return j.p; }).length;
  return '<section class="tarjeta">' + cabTarjeta('i-balon', 'Armar la pichanga', 'var(--esp-deporte)', 'Copiar lista', 'data-acc="pich-copiar" data-id="' + e.id + '"') +
    '<div class="tarjeta-cuerpo"><div class="pich-cab"><b>⚽ ' + esc(e.t) + '</b><small>' + cap(relativo(pa.dia)) + (e.todo ? '' : ' · ' + e.ini) + (e.lugar ? ' · ' + esc(e.lugar) : '') + '</small></div>' +
      '<div class="cifras" style="padding:10px 0 4px"><div><small>Jugadores</small><b>' + n + '</b></div>' +
        '<div><small>Cancha</small><form class="pich-costo" data-acc="pich-costo" data-id="' + e.id + '"><input id="pichCosto" inputmode="decimal" value="' + esc(pi.costo) + '" placeholder="' + MONEDA + '"></form></div>' +
        '<div class="entra"><small>Cuota c/u</small><b>' + (cuota ? dinero(cuota) : '—') + '</b></div></div>' +
      (n ? '<div class="jugadores">' + pi.jug.map(function(j, i){
        return '<span class="jugador' + (j.p ? ' pago' : '') + '"><button type="button" data-acc="pich-pago" data-id="' + e.id + '" data-i="' + i + '" title="' + (j.p ? 'Pagó' : 'Marcar que pagó') + '">' + (j.p ? '✓' : (i + 1)) + ' ' + esc(j.n) + '</button><button type="button" class="x" data-acc="pich-x" data-id="' + e.id + '" data-i="' + i + '" aria-label="Quitar">×</button></span>';
      }).join('') + '</div><small class="bien-pie">' + pagaron + ' de ' + n + ' pagaron' + (cuota ? ' · falta juntar ' + dinero(cuota * (n - pagaron)) : '') + '. Toca un nombre cuando pague.</small>' : '') +
      '<form class="captura" data-acc="pich-jug" data-id="' + e.id + '" style="margin:10px 0 0;box-shadow:none" autocomplete="off"><input id="pichJug" maxlength="120" placeholder="Nombres, separados por comas…"><button class="btn chico primario" type="submit">' + ico('i-plus') + '</button></form>' +
    '</div></section>';
}

/* ==========================================================================
   DESHACER Y REHACER
   Se guarda una foto de la agenda antes de cada cambio (los cambios que
   llegan juntos, en menos de un segundo, cuentan como uno). Al deshacer,
   lo que vuelve se marca con la hora de ahora, para que la sincronización
   lo lleve también al otro aparato en vez de pisarlo.
   ========================================================================== */
var HIST = { atras:[], adelante:[], estable:null, t:0 };
var MAX_HIST = 40;
function fotoDB(){ return JSON.stringify(db); }
function anotarHistorial(){
  var ahora = Date.now();
  if(HIST.estable && ahora - HIST.t > 900){
    HIST.atras.push(HIST.estable);
    if(HIST.atras.length > MAX_HIST) HIST.atras.shift();
    HIST.adelante = [];
  }
  HIST.t = ahora;
}
function pintarHist(){
  var a = $('btnDeshacer'), r = $('btnRehacer');
  if(a) a.disabled = !HIST.atras.length;
  if(r) r.disabled = !HIST.adelante.length;
}
function volverA(txt){
  var viejo = JSON.parse(txt), ahora = Date.now(), cambios = 0;
  COLS.forEach(function(c){
    var antes = {};
    (viejo[c] || []).forEach(function(x){ antes[x.id] = x; });
    db[c] = db[c].map(function(x){
      var v = antes[x.id];
      delete antes[x.id];
      if(!v){
        if(x.del) return x;
        cambios++;
        return { id:x.id, del:true, purga:true, upd:ahora };
      }
      if(JSON.stringify(v) === JSON.stringify(x)) return x;
      cambios++;
      v = JSON.parse(JSON.stringify(v)); v.upd = ahora; return v;
    });
    Object.keys(antes).forEach(function(k){ var v = JSON.parse(JSON.stringify(antes[k])); v.upd = ahora; db[c].push(v); cambios++; });
  });
  /* El perfil vuelve atrás, pero los ajustes (secciones, barra…) se quedan
     como están: esos se cambian desde sus pantallas, no con deshacer */
  var prefsHoy = db.perfil && db.perfil.prefs;
  function sinPrefs(x){ x = Object.assign({}, x); delete x.prefs; return JSON.stringify(x); }
  if(sinPrefs(viejo.perfil || {}) !== sinPrefs(db.perfil || {})){
    db.perfil = Object.assign({}, viejo.perfil, { upd:ahora });
    if(prefsHoy) db.perfil.prefs = prefsHoy; else delete db.perfil.prefs;
    cambios++;
  }
  guardarLocal(); programarSubida(); pintar();
  return cambios;
}
function deshacer(){
  if(!HIST.atras.length){ aviso('Nada que deshacer'); return; }
  var actual = fotoDB();
  HIST.adelante.push(actual);
  volverA(HIST.atras.pop());
  HIST.t = 0;
  aviso('↶ Deshecho', null, 'Rehacer', rehacer);
  pintarHist();
}
function rehacer(){
  if(!HIST.adelante.length){ aviso('Nada que rehacer'); return; }
  HIST.atras.push(fotoDB());
  volverA(HIST.adelante.pop());
  HIST.t = 0;
  aviso('↷ Rehecho', null, 'Deshacer', deshacer);
  pintarHist();
}

/* ==========================================================================
   PAPELERA
   Lo que borras no desaparece: queda aquí 30 días. Puedes devolverlo o
   borrarlo para siempre. Lo borrado para siempre deja solo una marca
   mínima, para que el otro aparato también lo borre al sincronizar.
   ========================================================================== */
var DIAS_PAPELERA = 30;
var PAPELERA_TIPOS = {
  tareas:['Tarea','✅', function(x){ return x.t; }],
  eventos:['Evento','📅', function(x){ return (x.cumple ? '🎂 ' : '') + x.t; }],
  recordatorios:['Recordatorio','🔔', function(x){ return x.t; }],
  notas:['Nota','🗒️', function(x){ return x.t || (x.cuerpo || '').split('\n')[0]; }],
  listas:['Lista','📋', function(x){ return x.nombre; }],
  habitos:['Hábito','🔥', function(x){ return x.nombre; }],
  metas:['Meta','🎯', function(x){ return x.t; }],
  pagos:['Pago fijo','🧾', function(x){ return x.t; }],
  proyectos:['Proyecto','📁', function(x){ return x.nombre; }],
  cursos:['Curso','🎓', function(x){ return x.nombre; }],
  entrenos:['Entrenamiento','🏋️', function(x){ return deporteInfo(x.tipo).n + ' · ' + fechaCorta(x.fecha); }],
  rutinas:['Rutina','🏋️', function(x){ return x.nombre; }],
  cobros:['Cobro','💰', function(x){ return x.cliente + (x.concepto ? ' · ' + x.concepto : ''); }],
  deudas:['Préstamo','🤝', function(x){ return x.persona + (x.concepto ? ' · ' + x.concepto : ''); }],
  diario:['Diario','📖', function(x){ return 'Diario del ' + fechaCorta(x.id); }],
  horas:['Horas','⏱️', function(x){ return (x.cliente || 'Sin cliente') + ' · ' + hhmm(+x.min || 0); }],
  casa:['Casa','🧹', function(x){ return x.t; }],
  docs:['Documento','📄', function(x){ return x.t; }],
  fichas:['Ficha','🧠', function(x){ return x.q; }],
  clientes:['Cliente','🤝', function(x){ return x.nombre; }]
};
function enPapelera(){
  var out = [], limite = Date.now() - DIAS_PAPELERA * 864e5;
  Object.keys(PAPELERA_TIPOS).forEach(function(c){
    (db[c] || []).forEach(function(x){
      if(!x.del || x.purga) return;
      var cuando = x.delEn || x.upd || 0;
      if(cuando < limite) return;
      var t = ''; try{ t = PAPELERA_TIPOS[c][2](x) || ''; }catch(e){}
      if(!t) return;
      out.push({ c:c, x:x, t:t, cuando:cuando });
    });
  });
  return out.sort(function(a, b){ return b.cuando - a.cuando; });
}
/* Pasados 30 días, lo de la papelera se borra solo */
function limpiarPapelera(){
  var limite = Date.now() - DIAS_PAPELERA * 864e5, n = 0;
  COLS.forEach(function(c){
    db[c] = db[c].map(function(x){
      if(x.del && !x.purga && (x.delEn || x.upd || 0) < limite){ n++; return { id:x.id, del:true, purga:true, upd:Date.now() }; }
      return x;
    });
  });
  if(n) guardar();
}
function purgar(c, id){
  var i = db[c].findIndex(function(x){ return x.id === id; });
  if(i >= 0) db[c][i] = { id:id, del:true, purga:true, upd:Date.now() };
}
function restaurarDePapelera(c, id){
  var x = buscarId(c, id);
  if(!x) return;
  delete x.del; delete x.delEn; x.upd = Date.now();
  guardar();
}
VISTAS.papelera = function(){
  var cs = enPapelera();
  var html = '<section class="tarjeta papelera">' + cabTarjeta('i-basura', 'Papelera' + (cs.length ? ' <span class="cab-num">' + cs.length + '</span>' : ''), 'var(--debe)', cs.length ? 'Vaciar' : '', cs.length ? 'data-acc="pap-vaciar"' : '') +
    '<p class="explica" style="margin:0 16px 10px">Lo que borras queda aquí ' + DIAS_PAPELERA + ' días y después se borra solo. Toca <b>Restaurar</b> para devolverlo a su sitio.</p>';
  if(!cs.length) return html + vacio('🗑️', 'La papelera está vacía', 'Cuando borres algo, lo encontrarás aquí.') + '</section>';
  var grupo = '';
  html += '<div class="lista-filas">' + cs.map(function(p){
    var dia = iso(new Date(p.cuando)), cab = '';
    if(dia !== grupo){ grupo = dia; cab = '<div class="dia-mini"><b>' + cap(relativo(dia)) + '</b><span>' + fechaCorta(dia) + '</span></div>'; }
    var T = PAPELERA_TIPOS[p.c], resta = DIAS_PAPELERA - Math.floor((Date.now() - p.cuando) / 864e5);
    return cab + '<div class="fila pap-fila"><span class="em-fila">' + T[1] + '</span><div class="cuerpo"><div class="titulo">' + esc(p.t) + '</div>' +
      '<div class="meta"><span>' + T[0] + '</span>' + (p.x.esp ? chipEsp(p.x) : '') + '<span>Se borra en ' + resta + (resta === 1 ? ' día' : ' días') + '</span></div></div>' +
      '<div class="lado"><button class="btn chico primario" data-acc="pap-restaurar" data-c="' + p.c + '" data-id="' + p.x.id + '">' + ico('i-deshacer') + 'Restaurar</button>' +
      '<button class="btn-icono" data-acc="pap-borrar" data-c="' + p.c + '" data-id="' + p.x.id + '" title="Borrar para siempre" aria-label="Borrar para siempre">' + ico('i-basura') + '</button></div></div>';
  }).join('') + '</div></section>';
  return html;
};

HIST.estable = fotoDB();
limpiarPapelera();

/* ==========================================================================
   ADMINISTRAR SECCIONES
   Una sola pantalla para organizarlo todo: qué secciones ver, en qué orden,
   qué va en la barra de abajo del celular, cuánto hay en cada una y una
   limpieza de lo viejo (todo va a la papelera y se puede deshacer).
   ========================================================================== */
function resumenSec(id){
  try{
    var hoy = hoyISO(), n;
    if(id.indexOf('esp-') === 0){
      var e = id.slice(4);
      n = vivos('tareas').filter(function(t){ return !t.hecha && espDe(t) === e; }).length;
      return n + (n === 1 ? ' tarea pendiente' : ' tareas pendientes');
    }
    switch(id){
      case 'hoy': return 'Tu día de un vistazo';
      case 'tareas':
        var ts = vivos('tareas'), p = ts.filter(function(t){ return !t.hecha; }).length;
        return p + ' pendientes · ' + (ts.length - p) + ' hechas';
      case 'proyectos': n = proyectosActivos().length; return n + (n === 1 ? ' proyecto activo' : ' proyectos activos');
      case 'calendario':
        var fin = sumarDias(hoy, 7);
        n = vivos('eventos').filter(function(e){ return e.fecha >= hoy && e.fecha <= fin; }).length;
        return vivos('eventos').length + ' eventos · ' + n + ' esta semana';
      case 'recordatorios': n = vivos('recordatorios').filter(function(r){ return !r.hecho; }).length; return n + ' activos';
      case 'listas':
        var faltan = 0; vivos('listas').forEach(function(l){ (l.items || []).forEach(function(i){ if(!i.ok) faltan++; }); });
        return vivos('listas').length + ' listas · ' + faltan + ' por marcar';
      case 'notas': n = vivos('notas').length; return n + (n === 1 ? ' nota' : ' notas');
      case 'habitos': n = vivos('habitos').length; return n + (n === 1 ? ' hábito' : ' hábitos');
      case 'metas': n = vivos('metas').filter(function(m){ return !m.archivada; }).length; return n + (n === 1 ? ' meta activa' : ' metas activas');
      case 'foco': return 'Temporizador pomodoro';
      case 'diario': n = vivos('diario').length; return n + (n === 1 ? ' día escrito' : ' días escritos');
      case 'progreso': return 'Gráficas de cómo vas';
      case 'revision': n = vivos('revisiones').length; return n + (n === 1 ? ' revisión hecha' : ' revisiones hechas');
      case 'dinero': return 'Los dos libros juntos';
      case 'pagos': n = vivos('pagos').length; return n + (n === 1 ? ' pago fijo' : ' pagos fijos');
      case 'personal': n = movimientos(CLAVE_LEDGER).length; return n + ' movimientos';
      case 'oficina': n = movimientos(CLAVE_OFICINA).length; return n + ' movimientos';
    }
  }catch(e){}
  return '';
}

/* Lo que se puede limpiar, con cuántas cosas hay de cada uno */
function hayParaLimpiar(){
  var hoy = hoyISO(), mes = Date.now() - 30 * 864e5, ano = sumarDias(hoy, -365), marcadas = 0;
  vivos('listas').forEach(function(l){ (l.items || []).forEach(function(i){ if(i.ok) marcadas++; }); });
  return [
    { k:'tareas', em:'✅', t:'Tareas hechas hace más de un mes', l:vivos('tareas').filter(function(t){ return t.hecha && (t.hechaEn || t.upd || 0) < mes; }) },
    { k:'recs', em:'🔔', t:'Recordatorios ya hechos', l:vivos('recordatorios').filter(function(r){ return r.hecho && (!r.rep || r.rep === 'no'); }) },
    { k:'eventos', em:'📅', t:'Eventos de hace más de un año', l:vivos('eventos').filter(function(e){ return e.fecha && e.fecha < ano && (!e.rep || e.rep === 'no') && !e.cumple; }) },
    { k:'listas', em:'🛒', t:'Cosas ya marcadas en tus listas', n:marcadas },
    { k:'notas', em:'📝', t:'Notas vacías', l:vivos('notas').filter(function(x){ return !String(x.t || x.titulo || '').trim() && !String(x.texto || x.txt || x.cuerpo || '').trim(); }) }
  ].map(function(x){ if(x.n == null) x.n = x.l.length; return x; });
}
function limpiar(k){
  var cosa = hayParaLimpiar().find(function(x){ return x.k === k; });
  if(!cosa || !cosa.n) return;
  if(!confirm(cosa.t + ': ' + cosa.n + '. ¿Limpiar? ' + (k === 'listas' ? 'Se quitan de sus listas.' : 'Irán a la papelera.'))) return;
  var ahora = Date.now();
  if(k === 'listas') vivos('listas').forEach(function(l){
    if((l.items || []).some(function(i){ return i.ok; })){ l.items = l.items.filter(function(i){ return !i.ok; }); l.upd = ahora; }
  });
  else cosa.l.forEach(function(x){ x.del = true; x.upd = x.delEn = ahora; });
  guardar(); pintar();
  aviso('🧹 Limpio', cosa.n + (cosa.n === 1 ? ' cosa' : ' cosas') + (k === 'listas' ? ' quitadas' : ' a la papelera'), 'Deshacer', deshacer);
}

VISTAS.secciones = function(){
  var AB = barraAbajo(), todas = navSecs(true);
  var html = '';

  /* La barra de abajo del celular */
  var cand = [{ id:'espacios', nom:'Espacios', ico:'i-espacios' }].concat(SECCIONES.filter(function(s){ return !s.oculta && !s.esp; }));
  html += '<div class="seccion-tit" style="margin-top:0">Barra de abajo del celular</div><section class="tarjeta"><div class="tarjeta-cuerpo adm-barra">' +
    '<p class="explica">Elige hasta 4 accesos directos; «Todo» siempre va al final. Tócalos para quitarlos.</p>' +
    '<div class="adm-barra-prev">' + AB.map(function(id, i){
      var s = cand.find(function(c){ return c.id === id; });
      return '<button type="button" class="adm-slot" data-acc="abajo-quitar" data-v="' + id + '" aria-label="Quitar ' + esc(s.nom) + ' de la barra">' + ico(s.ico) + '<span>' + nomCorto(s) + '</span><i class="x">×</i></button>';
    }).join('') + (AB.length < 4 ? '<span class="adm-slot vacio">＋</span>' : '') + '<span class="adm-slot fija">' + ico('i-mas') + '<span>Todo</span></span></div>' +
    '<div class="fichas adm-cand">' + cand.filter(function(c){ return AB.indexOf(c.id) < 0; }).map(function(c){
      return '<button type="button" class="ficha" data-acc="abajo-poner" data-v="' + c.id + '"' + (AB.length >= 4 ? ' disabled' : '') + '>' + ico(c.ico) + nomCorto(c) + '</button>';
    }).join('') + '</div></div></section>';

  /* Las secciones, por grupos */
  html += '<div class="seccion-tit">Tus secciones</div><p class="explica adm-ayuda">Apaga las que no uses: desaparecen del menú pero no se borra nada. Con las flechas cambias el orden dentro de cada grupo.</p>';
  GRUPOS.forEach(function(g){
    var del = todas.filter(function(s){ return GRUPO_DE[s.id] === g; });
    if(!del.length) return;
    html += '<section class="tarjeta adm-grupo"><div class="adm-grupo-tit">' + (g || 'Principal') + '</div><div class="lista-filas">' + del.map(function(s, i){
      var E = s.esp ? espInfo(s.esp) : null, fija = FIJAS.indexOf(s.id) >= 0, off = secOculta(s.id);
      return '<div class="fila adm-fila' + (off ? ' apagada' : '') + '">' +
        '<span class="adm-ico"' + (E ? ' style="--c:' + E.c + '"' : '') + '>' + (E ? E.em : ico(s.ico)) + '</span>' +
        '<div class="cuerpo" data-ir="' + s.id + '"><div class="titulo">' + s.nom + '</div><div class="meta"><span>' + resumenSec(s.id) + '</span></div></div>' +
        '<div class="lado adm-lado">' +
          '<button type="button" class="btn-icono" data-acc="sec-mover" data-v="' + s.id + '" data-d="-1" aria-label="Subir ' + s.nom + '"' + (i ? '' : ' disabled') + '>' + ico('i-der', 'arriba') + '</button>' +
          '<button type="button" class="btn-icono" data-acc="sec-mover" data-v="' + s.id + '" data-d="1" aria-label="Bajar ' + s.nom + '"' + (i < del.length - 1 ? '' : ' disabled') + '>' + ico('i-der', 'abajo') + '</button>' +
          '<label class="interruptor" title="' + (fija ? 'Siempre visible' : off ? 'Oculta' : 'Visible') + '"><input type="checkbox" data-sec-ver="' + s.id + '"' + (off ? '' : ' checked') + (fija ? ' disabled' : '') + ' aria-label="Mostrar ' + s.nom + '"></label>' +
        '</div></div>';
    }).join('') + '</div></section>';
  });

  /* Limpieza */
  var lim = hayParaLimpiar(), algo = lim.some(function(x){ return x.n; });
  html += '<div class="seccion-tit">Limpieza</div><section class="tarjeta"><div class="lista-filas">' + lim.map(function(x){
    return '<div class="fila adm-fila"><span class="em-fila">' + x.em + '</span><div class="cuerpo"><div class="titulo">' + x.t + '</div><div class="meta"><span>' + (x.n ? x.n + (x.n === 1 ? ' cosa' : ' cosas') : 'Nada que limpiar 👌') + '</span></div></div>' +
      (x.n ? '<div class="lado"><button class="btn chico" data-acc="limpiar" data-v="' + x.k + '">' + ico('i-basura') + 'Limpiar</button></div>' : '') + '</div>';
  }).join('') + '</div>' + (algo ? '<p class="explica" style="margin:0 16px 14px">Lo limpiado va a la papelera ' + DIAS_PAPELERA + ' días, y también puedes deshacerlo.</p>' : '') + '</section>';

  html += '<div class="botones" style="margin-top:14px"><button class="btn" data-acc="sec-restablecer">' + ico('i-deshacer') + 'Volver al orden original</button>' +
    '<button class="btn" data-ir="papelera">' + ico('i-basura') + 'Papelera (' + enPapelera().length + ')</button></div>';
  return html;
};
function moverSec(id, d){
  var g = GRUPO_DE[id], del = navSecs(true).filter(function(s){ return GRUPO_DE[s.id] === g; }).map(function(s){ return s.id; });
  var i = del.indexOf(id), j = i + d;
  if(i < 0 || j < 0 || j >= del.length) return;
  del[i] = del[j]; del[j] = id;
  var orden = navSecs(true).map(function(s){ return s.id; }).filter(function(x){ return GRUPO_DE[x] !== g; }).concat(del);
  pref.secOrden = orden; guardarPref(); pintar();
}

/* ==========================================================================
   ELEGIR VARIAS A LA VEZ (Tareas)
   «Seleccionar» o dejar el dedo sobre una tarea: luego se marcan hechas,
   se mueven de fecha, se cambian de espacio o prioridad, o se borran todas
   juntas. Se deshace con un toque.
   ========================================================================== */
function enSel(col){ return !!(ui.sel && ui.sel.col === col); }
function elegida(id){ return !!(ui.sel && ui.sel.ids.indexOf(id) >= 0); }
function barraSel(){
  var n = ui.sel.ids.length, ts = ui.sel.ids.map(function(id){ return buscarId('tareas', id); }).filter(Boolean);
  var todasHechas = ts.length && ts.every(function(t){ return t.hecha; });
  return '<div class="barra-sel" role="toolbar" aria-label="Acciones con lo elegido">' +
    '<div class="barra-sel-cab"><b>' + (n ? n + (n === 1 ? ' elegida' : ' elegidas') : 'Toca las tareas') + '</b>' +
      '<button type="button" class="btn-icono" data-acc="sel-fin" aria-label="Terminar">' + ico('i-x') + '</button></div>' +
    '<div class="barra-sel-acc">' +
      '<button type="button" data-acc="sel-hecha"' + (n ? '' : ' disabled') + '>' + ico(todasHechas ? 'i-deshacer' : 'i-check') + (todasHechas ? 'Reabrir' : 'Hechas') + '</button>' +
      '<button type="button" data-acc="sel-mover"' + (n ? '' : ' disabled') + '>' + ico('i-cal') + 'Fecha</button>' +
      '<button type="button" data-acc="sel-etiquetar"' + (n ? '' : ' disabled') + '>' + ico('i-espacios') + 'Espacio</button>' +
      '<button type="button" class="peligro" data-acc="sel-borrar"' + (n ? '' : ' disabled') + '>' + ico('i-basura') + 'Borrar</button>' +
    '</div></div>';
}
function conElegidas(fn, titulo){
  var ids = ui.sel ? ui.sel.ids.slice() : [], ahora = Date.now(), n = 0;
  ids.forEach(function(id){ var t = buscarId('tareas', id); if(t && !t.del){ fn(t); t.upd = ahora; n++; } });
  ui.sel = null; cerrarFlotante();
  if(!n) return;
  guardar(); pintar();
  aviso(titulo + ' · ' + n + (n === 1 ? ' tarea' : ' tareas'), null, 'Deshacer', deshacer);
}
function selHecha(){
  var ts = ui.sel.ids.map(function(id){ return buscarId('tareas', id); }).filter(Boolean);
  var reabrir = ts.length && ts.every(function(t){ return t.hecha; }), hoy = hoyISO();
  conElegidas(function(t){
    if(reabrir){ t.hecha = false; t.hechaEn = 0; return; }
    if(t.hecha) return;
    if(t.rep && t.rep !== 'no'){
      var f = t.fecha || hoy;
      do{ f = siguiente(f, t.rep); }while(f <= hoy);
      t.fecha = f; t.veces = (t.veces || 0) + 1; t.log = (t.log || []).concat([hoy]).slice(-60);
      (t.sub || []).forEach(function(s){ s.ok = false; });
    } else { t.hecha = true; t.hechaEn = Date.now(); }
  }, reabrir ? '↩️ Reabiertas' : '✅ Hechas');
}
function hojaSelFecha(){
  var hoy = hoyISO(), d = new Date(), aLunes = ((8 - d.getDay()) % 7) || 7;
  var ops = [['Hoy', hoy], ['Mañana', sumarDias(hoy, 1)], ['Pasado mañana', sumarDias(hoy, 2)], ['El próximo lunes', sumarDias(hoy, aLunes)], ['En una semana', sumarDias(hoy, 7)], ['Sin fecha', '']];
  abrirFlotante(cabFlot('Mover ' + ui.sel.ids.length + (ui.sel.ids.length === 1 ? ' tarea' : ' tareas')) +
    '<div class="menu-lista">' + ops.map(function(o){
      return '<button type="button" data-acc="sel-fecha" data-f="' + o[1] + '">' + ico(o[1] ? 'i-cal' : 'i-x') + '<span><b>' + o[0] + '</b>' + (o[1] ? '<small>' + fechaCorta(o[1]) + '</small>' : '') + '</span></button>';
    }).join('') + '</div>' +
    '<div class="campo" style="margin-top:12px"><span>Otra fecha</span><div class="sel-otra"><input class="entrada" type="date" id="selFechaOtra" value="' + hoy + '"><button class="btn primario" data-acc="sel-fecha" data-f="otra">Poner</button></div></div>');
}
function hojaSelEtiquetar(){
  abrirFlotante(cabFlot('Espacio y prioridad') +
    '<div class="campo"><span>Pasar al espacio</span><div class="rejilla-mas espacios">' + ESPACIOS.map(function(e){
      return '<button type="button" style="--c:' + e.c + '" data-acc="sel-esp" data-e="' + e.id + '"><span class="em">' + e.em + '</span><span>' + e.nom + '</span></button>';
    }).join('') + '</div></div>' +
    '<div class="campo" style="margin-top:12px"><span>Prioridad</span><div class="selector">' + PRIOS.map(function(p, i){
      return '<button type="button" data-acc="sel-prio" data-p="' + i + '"><i class="punto-prio" style="background:' + p.c + '"></i>' + p.n + '</button>';
    }).join('') + '</div></div>');
}

/* Dejar el dedo sobre una tarea: empieza a elegir */
(function(){
  var reloj = null, x0 = 0, y0 = 0, saltarClic = false;
  document.addEventListener('touchstart', function(ev){
    clearTimeout(reloj);
    var f = ev.target.closest && ev.target.closest('.fila[data-fila]');
    if(!f || ui.sel || ev.touches.length !== 1 || !f.querySelector('[data-acc="tarea-ok"]') || ui.vista !== 'tareas') return;
    x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY;
    reloj = setTimeout(function(){
      reloj = null; saltarClic = true; vibrar(25);
      ui.sel = { col:'tareas', ids:[f.dataset.fila] }; pintar();
    }, 520);
  }, { passive:true });
  document.addEventListener('touchmove', function(ev){
    if(reloj && (Math.abs(ev.touches[0].clientX - x0) > 10 || Math.abs(ev.touches[0].clientY - y0) > 10)){ clearTimeout(reloj); reloj = null; }
  }, { passive:true });
  document.addEventListener('touchend', function(){
    clearTimeout(reloj); reloj = null;
    if(saltarClic) setTimeout(function(){ saltarClic = false; }, 450);   // el clic que sigue al soltar, y nada más
  }, { passive:true });
  window.addEventListener('click', function(ev){ if(saltarClic){ saltarClic = false; ev.stopPropagation(); ev.preventDefault(); } }, true);
  document.addEventListener('contextmenu', function(ev){ if(ev.target.closest && ev.target.closest('.fila[data-fila]') && ui.vista === 'tareas') ev.preventDefault(); });
})();


/* ==========================================================================
   CABECERA DE CADA SECCIÓN
   Cada sección abre con su color, su icono y un resumen de lo que importa
   ahí, para saber de un vistazo cómo vas antes de mirar la lista.
   ========================================================================== */
function anilloSec(p){
  var C = 2 * Math.PI * 17;
  return '<svg class="cab-sec-anillo" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="f"/><circle cx="20" cy="20" r="17" class="v" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - Math.max(0, Math.min(1, p)))).toFixed(1) + '"/></svg><b class="cab-sec-pct">' + Math.round(p * 100) + '%</b>';
}
function cabSeccion(v){
  var hoy = hoyISO(), d = null;
  try{
    if(v === 'tareas'){
      var th = vivos('tareas').filter(function(t){ return (t.fecha && t.fecha <= hoy && !t.hecha) || (t.hecha && t.hechaEn && iso(new Date(t.hechaEn)) === hoy); });
      var hh = th.filter(function(t){ return t.hecha; }).length, tarde = th.filter(function(t){ return !t.hecha && t.fecha < hoy; }).length;
      var pend = vivos('tareas').filter(function(t){ return !t.hecha; }).length;
      d = { c:'var(--azul)', i:'i-tareas', t:'Tareas', s:(th.length - hh) + ' para hoy' + (tarde ? ' · <em>' + tarde + ' atrasadas</em>' : '') + ' · ' + pend + ' pendientes en total', p:th.length ? hh / th.length : null, pt:hh + ' de ' + th.length + ' hechas hoy' };
    } else if(v === 'recordatorios'){
      var rs = vivos('recordatorios').filter(function(r){ return !r.hecho; }), venc = recordatoriosVencidos().length;
      var hoyR = rs.filter(function(r){ return momentoR(r).slice(0, 10) === hoy; }).length;
      d = { c:'var(--oro)', i:'i-campana', t:'Avisos', s:hoyR + ' para hoy' + (venc ? ' · <em>' + venc + ' pasados sin marcar</em>' : '') + ' · ' + rs.length + ' activos' };
    } else if(v === 'listas' && !ui.lista){
      var ls = vivos('listas'), faltan = 0, total = 0;
      ls.forEach(function(l){ (l.items || []).forEach(function(i){ total++; if(!i.ok) faltan++; }); });
      d = { c:'var(--haber)', i:'i-listas', t:'Listas', s:ls.length + (ls.length === 1 ? ' lista' : ' listas') + ' · ' + faltan + ' cosas por marcar', p:total ? (total - faltan) / total : null, pt:'marcado' };
    } else if(v === 'notas'){
      var ns = vivos('notas');
      d = { c:'#E7B24A', i:'i-notas', t:'Notas', s:ns.length + (ns.length === 1 ? ' nota' : ' notas') + ' · ' + ns.filter(function(n){ return n.fija; }).length + ' fijadas' };
    } else if(v === 'habitos'){
      var wd = new Date().getDay(), hs = vivos('habitos').filter(function(x){ return !x.dias || x.dias.indexOf(wd) >= 0; });
      var ok = hs.filter(function(x){ return x.marcas && x.marcas[hoy]; }).length;
      var mejor = Math.max.apply(null, vivos('habitos').map(function(x){ return racha(x); }).concat([0]));
      var semH = 0, semT = 0, iniH = inicioSemana(hoy);
      vivos('habitos').forEach(function(x){ for(var k = 0; k < 7; k++){ var dk = sumarDias(iniH, k); if(dk > hoy) break; if(x.dias && x.dias.indexOf(deISO(dk).getDay()) < 0) continue; semT++; if(x.marcas && x.marcas[dk]) semH++; } });
      d = { c:'#FB923C', i:'i-habitos', t:'Hábitos', s:'Hoy ' + ok + ' de ' + hs.length + (semT ? ' · semana ' + Math.round(semH / semT * 100) + '%' : '') + (mejor ? ' · racha 🔥 ' + mejor : ''), p:hs.length ? ok / hs.length : null, pt:'de hoy' };
    } else if(v === 'metas'){
      var ms = vivos('metas').filter(function(m){ return !m.archivada; });
      var prom = ms.length ? ms.reduce(function(a, m){ return a + Math.min(1, (+m.actual || 0) / (+m.objetivo || 1)); }, 0) / ms.length : 0;
      var logradas = ms.filter(function(m){ return (+m.actual || 0) >= (+m.objetivo || 1); }).length;
      d = { c:'var(--oro)', i:'i-meta', t:'Metas', s:ms.length + (ms.length === 1 ? ' meta' : ' metas') + (logradas ? ' · ' + logradas + ' logradas 🏆' : ''), p:ms.length ? prom : null, pt:'de media' };
    } else if(v === 'proyectos' && !ui.proy){
      var pa = proyectosActivos(), pt = 0, ph = 0;
      pa.forEach(function(x){ var a = avanceProy(x.id); pt += a.total; ph += a.hechas; });
      d = { c:'#A78BFA', i:'i-carpeta', t:'Proyectos', s:pa.length + (pa.length === 1 ? ' activo' : ' activos') + ' · ' + (pt - ph) + ' tareas por hacer', p:pt ? ph / pt : null, pt:'avance' };
    } else if(v === 'pagos'){
      var ym = ui.pagosMes || hoy.slice(0, 7), tot = 0, pag = 0, n = 0, np = 0;
      vivos('pagos').forEach(function(p){ if(p.activo === false || (p.desde && ym < p.desde)) return; n++; tot += +p.monto || 0; if(pagado(p, ym)){ np++; pag += +p.monto || 0; } });
      d = { c:'var(--debe)', i:'i-recibo', t:'Pagos fijos', s:np + ' de ' + n + ' pagados · faltan ' + dinero(tot - pag), p:tot ? pag / tot : null, pt:'pagado' };
    } else if(v === 'diario'){
      var mes = hoy.slice(0, 7), ents = vivos('diario').filter(function(e){ return e.id.slice(0, 7) === mes && e.texto; }), rachaD = rachaDiario();
      d = { c:'var(--rosa)', i:'i-diario', t:'Diario', s:ents.length + (ents.length === 1 ? ' día escrito' : ' días escritos') + ' este mes' + (rachaD > 1 ? ' · 🔥 ' + rachaD + ' días seguidos' : '') };
    } else if(v === 'progreso'){
      d = { c:'var(--haber)', i:'i-grafica', t:'Progreso', s:'Cómo vas en tareas, hábitos, enfoque y ánimo' };
    } else if(v === 'calendario'){
      var fin7 = sumarDias(hoy, 6), ne = 0;
      for(var ci = 0; ci < 7; ci++) ne += itemsDelDia(sumarDias(hoy, ci)).filter(function(x){ return x.tipo === 'evento' || x.tipo === 'clase'; }).length;
      d = { c:'var(--azul)', i:'i-cal', t:'Calendario', s:ne + (ne === 1 ? ' cosa' : ' cosas') + ' en 7 días' + diaCargado(hoy) };
    } else if(v === 'agenda'){
      var diaA = ui.agDia || hoy, itsA = itemsDelDia(diaA).filter(function(x){ return !x.hecho; }).length;
      var tardeA = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha < hoy; }).length;
      d = { c:'var(--verde)', i:'i-cal', t:'Agenda', s:(diaA === hoy ? 'Hoy' : cap(relativo(diaA))) + ': ' + itsA + (itsA === 1 ? ' pendiente' : ' pendientes') + (tardeA ? ' · <em>' + tardeA + (tardeA === 1 ? ' atrasada' : ' atrasadas') + '</em>' : '') };
    } else if(v === 'dinero'){
      var selD = ui.dinLibro || 'todo';
      d = { c:'var(--haber)', i:'i-grafica', t:'Dinero', s:cap(MESES[+hoy.slice(5, 7) - 1]) + ' · ' + (selD === 'todo' ? 'los dos libros' : 'libro ' + NOM_LIBRO[selD].toLowerCase()) };
    } else if(v === 'movimientos'){
      var libM = ui.movLibro || 'personal', mesM = ui.movMes || hoy.slice(0, 7);
      var nM = movsDe(libM === 'ambos' ? 'todo' : libM).filter(function(t){ return mesM === 'todo' || t.date.slice(0, 7) === mesM; }).length;
      d = { c:'var(--haber)', i:'i-cuentas', t:'Movimientos', s:nM + (nM === 1 ? ' movimiento' : ' movimientos') + ' · ' + (mesM === 'todo' ? 'todo el libro' : MESES[+mesM.slice(5, 7) - 1] + ' ' + mesM.slice(0, 4)) + ' · ' + (libM === 'ambos' ? 'los dos libros' : NOM_LIBRO[libM]) };
    } else if(v === 'foco'){
      d = { c:'var(--debe)', i:'i-reloj', t:'Enfoque', s:'Trabaja por bloques y descansa entre medio' };
    } else if(v === 'revision'){
      d = { c:'var(--verde)', i:'i-check', t:'Revisión semanal', s:'Mira cómo te fue y elige lo importante de la próxima semana' };
    } else if(v === 'ajustes'){
      d = { c:'var(--tinta-2)', i:'i-ajustes', t:'Ajustes', s:'Tu nombre, apariencia, avisos, nube y respaldos' };
    } else if(v === 'secciones'){
      var tv = navSecs(true);
      d = { c:'var(--verde)', i:'i-espacios', t:'Secciones', s:tv.filter(function(x){ return !secOculta(x.id); }).length + ' de ' + tv.length + ' a la vista · ordénalas, ocúltalas y elige tu barra' };
    } else if(v === 'papelera'){
      var np = enPapelera().length;
      d = { c:'var(--debe)', i:'i-basura', t:'Papelera', s:np ? np + (np === 1 ? ' cosa' : ' cosas') + ' para recuperar · se borran solas a los ' + DIAS_PAPELERA + ' días' : 'Vacía' };
    }
  }catch(e){ d = null; }
  if(!d) return '';
  /* Título grande y abierto, sin caja: el color de la sección arriba, el
     resumen debajo y, si hay avance, una línea fina con el porcentaje */
  return '<header class="cab-grande cab-compacta cab-sec" style="--sc:' + d.c + '">' + '<span class="cg-ico">' + ico(d.i) + '</span>' +
    '<div class="cg-txt"><h2 class="cg-tit">' + d.t + '</h2><p class="cg-sub">' + d.s + '</p></div>' +
    (d.p != null ? '<div class="cg-anillo" title="' + esc(d.pt || '') + '">' + anilloSec(d.p) + '</div>' : '') +
    '</header>';
}

/* ==========================================================================
   DESLIZAR EN LAS LISTAS (celular)
   Una tarea o un recordatorio: a la derecha lo das por hecho; a la
   izquierda lo pasas a mañana (la tarea) o lo pospones una hora (el aviso).
   ========================================================================== */
(function(){
  var fila = null, x0 = 0, y0 = 0, dx = 0, horizontal = null;
  document.addEventListener('touchstart', function(ev){
    var f = ev.target.closest && ev.target.closest('.fila[data-fila]');
    if(!f || ui.sel || ev.touches.length !== 1 || ev.touches[0].clientX < 24 || ev.touches[0].clientX > innerWidth - 24 || !(f.querySelector('[data-acc="tarea-ok"]') || f.querySelector('[data-acc="rec-ok"]'))){ fila = null; return; }
    fila = f; x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; dx = 0; horizontal = null;
  }, { passive:true });
  document.addEventListener('touchmove', function(ev){
    if(!fila) return;
    var mx = ev.touches[0].clientX - x0, my = ev.touches[0].clientY - y0;
    if(horizontal === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) horizontal = Math.abs(mx) > Math.abs(my) * 1.4;
    if(!horizontal) return;
    dx = Math.max(-140, Math.min(140, mx));
    fila.classList.add('deslizando');
    fila.style.transform = 'translateX(' + dx + 'px)';
    fila.dataset.gesto = dx > 70 ? 'hecho' : dx < -70 ? 'luego' : '';
  }, { passive:true });
  document.addEventListener('touchend', function(){
    if(!fila) return;
    var f = fila, id = f.dataset.fila, esTarea = !!f.querySelector('[data-acc="tarea-ok"]'), g = f.dataset.gesto;
    fila = null;
    f.style.transform = ''; f.classList.remove('deslizando'); delete f.dataset.gesto;
    if(!horizontal || !g) return;
    if(g === 'hecho'){ if(esTarea) alternarTarea(id); else alternarRec(id); return; }
    if(esTarea){
      var t = buscarId('tareas', id); if(!t) return;
      var antes = JSON.parse(JSON.stringify(t)), man = sumarDias(hoyISO(), 1);
      t = JSON.parse(JSON.stringify(t)); t.fecha = man; poner('tareas', t);
      aviso('⏭️ Pasada a mañana', t.t, 'Deshacer', function(){ poner('tareas', antes); pintar(); });
      pintarSeguro();
    } else posponer(id, 60);
  }, { passive:true });
})();

/* ---------- Tareas -------------------------------------------------------- */
function ordenTareas(a, b){
  return (a.fecha || '9999').localeCompare(b.fecha || '9999') ||
         (b.prio || 0) - (a.prio || 0) ||
         (a.hora || '99').localeCompare(b.hora || '99') ||
         (a.creada || 0) - (b.creada || 0);
}

VISTAS.tareas = function(){
  var hoy = hoyISO(), fin7 = sumarDias(hoy, 7);
  var todas = vivos('tareas');
  var enArea = ui.tEsp ? todas.filter(function(t){ return espDe(t) === ui.tEsp; }) : todas;
  var F = {
    hoy:     function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; },
    prox:    function(t){ return !t.hecha && t.fecha > hoy; },
    todas:   function(t){ return !t.hecha; },
    algun:   function(t){ return !t.hecha && !t.fecha; },
    hechas:  function(t){ return t.hecha; }
  };
  var NOM = { hoy:'Hoy', prox:'Próximas', todas:'Pendientes', algun:'Algún día', hechas:'Hechas' };
  var html = '';

  /* Pestañas fijas arriba (se deslizan con el dedo) y una barra de herramientas */
  html += '<div class="segmento-fijo"><div class="segmento" data-pestanas="t-filtro">' + Object.keys(F).map(function(k){
    var n = enArea.filter(F[k]).length;
    return '<button type="button" class="ficha" data-acc="t-filtro" data-f="' + k + '" aria-pressed="' + (ui.tFiltro === k) + '">' + NOM[k] +
      (k !== 'hechas' && n ? ' <span class="n">' + n + '</span>' : '') + '</button>';
  }).join('') + '</div></div>';

  var lista = enArea.filter(F[ui.tFiltro]);
  var eligiendo = enSel('tareas');
  if(eligiendo) ui.sel.ids = ui.sel.ids.filter(function(id){ var x = buscarId('tareas', id); return x && !x.del; });
  ui.selVisibles = lista.map(function(t){ return t.id; });
  var Eh = ui.tEsp ? espInfo(ui.tEsp) : null;
  html += '<div class="barra-herr herr-sel">' +
    '<button type="button" class="btn chico btn-filtro" data-acc="menu-esp" data-f="t-esp">' + (Eh ? Eh.em + ' ' + Eh.nom : ico('i-espacios') + 'Todos los espacios') + ' ▾</button>' +
    (lista.length ? (eligiendo ?
      '<button type="button" class="btn chico" data-acc="sel-todas">' + ico('i-check') + (lista.every(function(t){ return elegida(t.id); }) ? 'Ninguna' : 'Todas (' + lista.length + ')') + '</button>' :
      '<button type="button" class="btn chico" data-acc="sel-on" data-col="tareas">' + ico('i-check') + 'Seleccionar</button>') : '') +
    '<button type="button" class="btn-icono btn-compartir" data-acc="compartir-tareas" title="Compartir por WhatsApp" aria-label="Compartir pendientes">' + ico('i-compartir') + '</button>' +
    '</div>' + botonAnadir('tarea', 'Añadir tarea…') +
    (paraOrdenar().length ? '<button type="button" class="ordenar-cta" data-acc="ordenar"><span>🧹</span><span><b>Ordenar ' + paraOrdenar().length + (paraOrdenar().length === 1 ? ' pendiente' : ' pendientes') + '</b><small>Atrasadas o sin fecha: decide en un toque qué hacer con cada una</small></span>' + ico('i-der') + '</button>' : '');
  if(eligiendo) html += barraSel();
  if(ui.tFiltro === 'hechas'){
    lista.sort(function(a, b){ return (b.hechaEn || 0) - (a.hechaEn || 0); });
    if(!lista.length) return html + '<div class="tarjeta">' + vacio('🗂️', 'Aún no hay tareas hechas') + '</div>';
    return html + '<div class="tarjeta"><div class="lista-filas">' + lista.slice(0, 200).map(filaTarea).join('') + '</div></div>' +
      '<div style="margin-top:12px"><button class="btn chico peligro" data-acc="t-borrar-hechas">' + ico('i-basura') + 'Borrar las hechas</button></div>';
  }
  lista.sort(ordenTareas);
  if(!lista.length){
    var txt = { hoy:['🌤️','Nada para hoy','Las tareas con fecha de hoy o atrasadas salen aquí.'],
                prox:['📆','Nada más adelante','Pon fecha a una tarea y aparecerá aquí.'],
                todas:['🎉','No tienes nada pendiente',''],
                algun:['💭','Sin tareas sin fecha','Lo que quieras hacer “algún día” va aquí.'] }[ui.tFiltro];
    return html + '<div class="tarjeta">' + vacio(txt[0], txt[1], txt[2]) + '</div>';
  }

  /* Como una agenda de papel: cada grupo con su fecha grande a la izquierda */
  var grupos = [], idx = {};
  function meter(clave, titulo, rojo, t, num, sub){
    if(!(clave in idx)){ idx[clave] = grupos.length; grupos.push({ t:titulo, rojo:rojo, l:[], num:num, sub:sub, hoy:clave === 'b' }); }
    grupos[idx[clave]].l.push(t);
  }
  lista.forEach(function(t){
    var f = t.fecha && deISO(t.fecha);
    if(!t.fecha) meter('z', 'Sin fecha', false, t, '∞', 'algún día');
    else if(t.fecha < hoy) meter('a', 'Atrasadas', true, t, '!', 'pendiente');
    else if(t.fecha === hoy) meter('b', 'Hoy', false, t, f.getDate(), DIAS3[f.getDay()]);
    else if(t.fecha <= fin7) meter('c' + t.fecha, cap(relativo(t.fecha)), false, t, f.getDate(), DIAS3[f.getDay()]);
    else meter('y' + t.fecha.slice(0, 7), cap(MESES[f.getMonth()]) + ' ' + t.fecha.slice(0, 4), false, t, MESES3[f.getMonth()], t.fecha.slice(0, 4));
  });
  return html + '<div class="planner">' + grupos.map(function(g){
    return '<section class="pl-dia' + (g.rojo ? ' rojo' : '') + (g.hoy ? ' es-hoy' : '') + '">' +
      '<div class="pl-fecha"><b>' + g.num + '</b><span>' + g.sub + '</span></div>' +
      '<div class="pl-cuerpo"><h3 class="pl-tit">' + g.t + ' <span class="n">' + g.l.length + '</span>' +
        (g.rojo ? '<button class="btn chico" data-acc="t-atrasadas-hoy">Pasar a hoy</button>' : '') + '</h3>' +
        '<div class="lista-filas">' + g.l.map(filaTarea).join('') + '</div></div></section>';
  }).join('') + '</div>';
};

/* ---------- Calendario ---------------------------------------------------- */
/* ==========================================================================
   CALENDARIO
   Cinco vistas: Día (por horas), Semana, Mes, Agenda y Año. En el celular
   se pasa de día, semana o mes deslizando el dedo, y tocando un hueco del
   día o de la semana se crea un evento a esa hora. Muestra los feriados de
   Perú y se puede filtrar por espacio y por tipo.
   ========================================================================== */
/* ---------- Feriados de Perú ---------------------------------------------- */
function pascua(y){
  var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  var mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return y + '-' + dos(mes) + '-' + dos(dia);
}
var cacheFeriados = {};
function feriadosAno(y){
  if(cacheFeriados[y]) return cacheFeriados[y];
  var p = pascua(y), f = {};
  [['01-01','Año Nuevo'],['05-01','Día del Trabajo'],['06-07','Batalla de Arica y Día de la Bandera'],['06-29','San Pedro y San Pablo'],['07-23','Día de la Fuerza Aérea'],
   ['07-28','Fiestas Patrias'],['07-29','Fiestas Patrias'],['08-06','Batalla de Junín'],['08-30','Santa Rosa de Lima'],['10-08','Combate de Angamos'],
   ['11-01','Todos los Santos'],['12-08','Inmaculada Concepción'],['12-09','Batalla de Ayacucho'],['12-25','Navidad']].forEach(function(x){ f[y + '-' + x[0]] = x[1]; });
  f[sumarDias(p, -3)] = 'Jueves Santo'; f[sumarDias(p, -2)] = 'Viernes Santo';
  return (cacheFeriados[y] = f);
}
function feriado(dia){ return ''; }   // los feriados se quitaron de la agenda

/* ---------- Lo que se ve en el calendario ------------------------------- */
var TIPOS_CAL = [['evento','Eventos','📅'],['tarea','Tareas','✅'],['rec','Avisos','🔔'],['clase','Clases','🎓'],['pago','Pagos','🧾']];
function itemsCal(d){
  var ocultos = ui.calOcultos || [];
  var out = itemsDelDia(d).filter(function(x){ return (!ui.calEsp || x.esp === ui.calEsp) && ocultos.indexOf(x.tipo) < 0; });
  var fer = feriado(d);
  if(fer && ocultos.indexOf('feriado') < 0 && !ui.calEsp) out.unshift({ tipo:'feriado', id:'fer-' + d, t:'🇵🇪 ' + fer, hora:'', c:'var(--debe)', o:{} });
  return out;
}
var ACC_ITEM = { tarea:'tarea-ed', rec:'rec-ed', pago:'pago-ed', evento:'evento-ed', clase:'curso-ed', feriado:'cal-feriado' };

/* Bloques con hora de un día, repartidos en carriles si se pisan */
function bloquesDia(its){
  var bloques = its.filter(function(x){ return x.hora; }).map(function(x){
    var a = Math.max(minutos(x.hora), H_INI * 60), b = x.fin && x.fin > x.hora ? minutos(x.fin) : a + (x.tipo === 'tarea' || x.tipo === 'rec' ? 30 : 60);
    return { x:x, a:a, b:Math.min(Math.max(b, a + 15), H_FIN * 60) };
  }).sort(function(p, q){ return p.a - q.a || q.b - p.b; });
  var carriles = [];
  bloques.forEach(function(bl){ var k = 0; while(carriles[k] && carriles[k] > bl.a) k++; carriles[k] = bl.b; bl.k = k; });
  var nc = Math.max(1, carriles.length);
  return bloques.map(function(bl){
    var top = (bl.a - H_INI * 60) / 60 * H_ALTO, h2 = Math.max(22, (bl.b - bl.a) / 60 * H_ALTO - 2);
    return '<button type="button" class="sem-ev' + (bl.x.hecho ? ' hecho' : '') + (h2 < 36 ? ' corto' : '') + '" style="--c:' + bl.x.c + ';top:' + top.toFixed(0) + 'px;height:' + h2.toFixed(0) + 'px;left:calc(' + (bl.k / nc * 100) + '% + 2px);width:calc(' + (100 / nc) + '% - 4px)" data-acc="' + ACC_ITEM[bl.x.tipo] + '" data-id="' + bl.x.id + '">' +
      (h2 < 36 ? '<b><small>' + bl.x.hora + '</small> ' + esc(bl.x.t) + '</b>' : '<b>' + esc(bl.x.t) + '</b><small>' + bl.x.hora + (bl.x.fin ? '–' + bl.x.fin : '') + (bl.x.lugar ? ' · ' + esc(bl.x.lugar) : '') + '</small>') + '</button>';
  }).join('');
}
function lineaAhora(d){
  if(d !== hoyISO()) return '';
  var m = new Date().getHours() * 60 + new Date().getMinutes();
  return m >= H_INI * 60 ? '<div class="sem-ahora" style="top:' + ((m - H_INI * 60) / 60 * H_ALTO).toFixed(0) + 'px"></div>' : '';
}
function chipsTodoDia(its, max){
  var todo = its.filter(function(x){ return !x.hora; }), resto = max && todo.length > max ? todo.length - (max - 1) : 0;
  if(resto) todo = todo.slice(0, max - 1);
  return todo.map(function(x){
    return '<button type="button" class="sem-chip' + (x.hecho ? ' hecho' : '') + (x.tipo === 'feriado' ? ' fer' : '') + '" style="--c:' + x.c + '" data-acc="' + ACC_ITEM[x.tipo] + '" data-id="' + x.id + '">' + esc(x.t) + '</button>';
  }).join('') + (resto ? '<span class="sem-mas">+' + resto + ' más</span>' : '');
}

/* ---------- Vista Día ------------------------------------------------------ */
function vistaDia(){
  var d = ui.calSel, hoy = hoyISO(), its = itemsCal(d), ini = inicioSemana(d);
  var tira = '<div class="semana-mini cal-tira">' + [0,1,2,3,4,5,6].map(function(i){
    var x = sumarDias(ini, i), n = itemsCal(x).filter(function(y){ return !y.hecho; }).length;
    return '<button type="button" class="' + (x === hoy ? 'hoy' : '') + (x === d ? ' sel' : '') + (feriado(x) ? ' fer' : '') + '" data-acc="cal-ir" data-dia="' + x + '"><small>' + DIAS3[deISO(x).getDay()] + '</small><b>' + deISO(x).getDate() + '</b><span class="puntos">' + '<i></i>'.repeat(Math.min(n, 3)) + '</span></button>';
  }).join('') + '</div>';
  var horas = '';
  for(var h = H_INI; h < H_FIN; h++) horas += '<div class="sem-h" style="top:' + (h - H_INI) * H_ALTO + 'px">' + dos(h) + ':00</div>';
  var todo = chipsTodoDia(its), conHora = its.filter(function(x){ return x.hora; }).length;
  var libre = '';
  if(!its.length) libre = '<div class="dia-libre">Día libre ' + (d === hoy ? 'hoy' : '') + ' 🌿<small>Toca una hora para añadir algo.</small></div>';
  return tira +
    '<section class="tarjeta cal-dia-vista">' +
      '<div class="cal-dia-cab"><b>' + cap(fechaLarga(d)) + '</b><small>' + (its.length ? its.length + (its.length === 1 ? ' cosa' : ' cosas') + (conHora ? ' · ' + conHora + ' con hora' : '') : 'Nada agendado') + '</small></div>' +
      (todo ? '<div class="cal-dia-todo">' + todo + '</div>' : '') + libre +
      '<div class="cal-dia-rejilla"><div class="sem-horas"><div class="sem-cuerpo" style="height:' + (H_FIN - H_INI) * H_ALTO + 'px">' + horas + '</div></div>' +
        '<div class="sem-cuerpo cal-hueco" data-acc="cal-hueco" data-dia="' + d + '" style="height:' + (H_FIN - H_INI) * H_ALTO + 'px">' + bloquesDia(its) + lineaAhora(d) + '</div></div>' +
    '</section>';
}

/* ---------- Vista Semana --------------------------------------------------- */
function vistaSemana(){
  var ini = inicioSemana(ui.calSel), hoy = hoyISO(), dias = [];
  for(var i = 0; i < 7; i++) dias.push(sumarDias(ini, i));
  var alto = (H_FIN - H_INI) * H_ALTO;
  var maxT = Math.max.apply(null, dias.map(function(d){ return itemsCal(d).filter(function(x){ return !x.hora; }).length; }).concat([0]));
  var altoTodo = 'style="height:' + (maxT ? Math.min(maxT, 4) * 24 + 6 : 6) + 'px"';
  var horas = '';
  for(var h = H_INI; h < H_FIN; h++) horas += '<div class="sem-h" style="top:' + (h - H_INI) * H_ALTO + 'px">' + dos(h) + ':00</div>';
  var cols = dias.map(function(d){
    var its = itemsCal(d);
    return '<div class="sem-col' + (d === hoy ? ' hoy' : '') + (d === ui.calSel ? ' sel' : '') + '">' +
      '<button type="button" class="sem-cab' + (feriado(d) ? ' fer' : '') + '" data-acc="cal-ir-dia" data-dia="' + d + '"><small>' + DIAS3[deISO(d).getDay()] + '</small><b>' + deISO(d).getDate() + '</b></button>' +
      '<div class="sem-todo" ' + altoTodo + '>' + chipsTodoDia(its, 4).replace('class="sem-mas"', 'class="sem-mas" data-acc="cal-ir-dia" data-dia="' + d + '"') + '</div>' +
      '<div class="sem-cuerpo cal-hueco" data-acc="cal-hueco" data-dia="' + d + '" style="height:' + alto + 'px">' + bloquesDia(its) + lineaAhora(d) + '</div></div>';
  }).join('');
  return '<div class="tarjeta sem-envoltura"><div class="sem-rejilla"><div class="sem-horas"><div class="sem-cab"></div><div class="sem-todo" ' + altoTodo + '></div><div class="sem-cuerpo" style="height:' + alto + 'px">' + horas + '</div></div>' + cols + '</div></div>';
}

/* Huecos libres del día entre las 7 de la mañana y las 10 de la noche */
function diaCargado(hoy){
  var mejor = null;
  for(var i = 0; i < 7; i++){ var d = sumarDias(hoy, i), n = itemsDelDia(d).filter(function(x){ return x.tipo !== 'tarea' && x.tipo !== 'clase'; }).length; if(n >= 3 && (!mejor || n > mejor.n)) mejor = { d:d, n:n }; }
  return mejor ? ' · más lleno: ' + (mejor.d === hoy ? 'hoy' : relativo(mejor.d).toLowerCase()) + ' (' + mejor.n + ')' : '';
}
function minHora(h){ var p = String(h).split(':'); return +p[0] * 60 + (+p[1] || 0); }
function huecosLibres(its, d){
  var ocup = its.filter(function(x){ return x.hora && x.tipo !== 'tarea' && x.tipo !== 'rec' && x.tipo !== 'pago'; })
    .map(function(x){ var a = minHora(x.hora), b = x.fin ? minHora(x.fin) : a + 60; return [a, Math.max(b, a + 15)]; })
    .sort(function(a, b){ return a[0] - b[0]; });
  var ini = 7 * 60, fin = 22 * 60, out = [];
  if(d === hoyISO()){ var n = new Date(); ini = Math.max(ini, Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30); }
  var cur = ini;
  ocup.forEach(function(o){ if(o[0] - cur >= 60) out.push([cur, Math.min(o[0], fin)]); cur = Math.max(cur, o[1]); });
  if(fin - cur >= 60) out.push([cur, fin]);
  return out.filter(function(h){ return h[1] - h[0] >= 60; });
}
function huecosHTML(its, d){
  if(d < hoyISO()) return '';
  var hs = huecosLibres(its, d), hh = function(m){ return dos(Math.floor(m / 60)) + ':' + dos(m % 60); };
  if(!hs.length) return '<div class="huecos lleno">⛔ Sin huecos libres de una hora entre 7:00 y 22:00</div>';
  return '<div class="huecos"><span>🟢 Libre</span>' + hs.slice(0, 4).map(function(h){
    return '<button type="button" data-acc="cal-hueco-libre" data-dia="' + d + '" data-h="' + hh(h[0]) + '">' + hh(h[0]) + '–' + hh(h[1]) + '</button>';
  }).join('') + '</div>';
}

/* ---------- Vista Mes ------------------------------------------------------ */
function panelDia(d){
  var its = itemsCal(d), fer = feriado(d);
  return '<section class="tarjeta cal-panel"><div class="tarjeta-cab"><h3>' + cap(fechaLarga(d)) + '</h3>' +
      '<button class="mas" data-acc="cal-ir-dia" data-dia="' + d + '">Ver por horas' + ico('i-der') + '</button></div>' +
    (fer ? '<div class="fer-banda">🇵🇪 Feriado: ' + esc(fer) + '</div>' : '') + huecosHTML(its, d) +
    '<form class="captura cal-rapido" data-acc="cal-rapido" autocomplete="off"><input id="calRapido" maxlength="200" placeholder="Añadir este día… ej. «dentista 4pm» o «cumple de Ana»"><button class="btn chico primario" type="submit">' + ico('i-plus') + '</button></form>' +
    (its.filter(function(x){ return x.tipo !== 'feriado'; }).length ? '<div class="lista-filas">' + its.filter(function(x){ return x.tipo !== 'feriado'; }).map(function(x){ return filaAgenda(x, d); }).join('') + '</div>'
                : '<div class="vacio" style="padding:4px 16px 8px">Día libre.</div>') +
    '<div class="pie-fila-btn">' +
      '<button class="btn chico" data-acc="cal-nuevo" data-tipo="evento" data-dia="' + d + '">' + ico('i-plus') + 'Evento</button>' +
      '<button class="btn chico" data-acc="cal-nuevo" data-tipo="rec" data-dia="' + d + '">' + ico('i-plus') + 'Aviso</button>' +
      '<button class="btn chico" data-acc="cal-nuevo" data-tipo="tarea" data-dia="' + d + '">' + ico('i-plus') + 'Tarea</button>' +
    '</div></section>';
}
function vistaMes(){
  var hoy = hoyISO(), p = ui.calMes.split('-'), y = +p[0], m = +p[1] - 1;
  var primero = iso(new Date(y, m, 1)), ini = inicioSemana(primero);
  var cab = [];
  for(var k = 0; k < 7; k++) cab.push(DIAS3[deISO(sumarDias(ini, k)).getDay()]);
  var celdas = '';
  for(var j = 0; j < 42; j++){
    var dd = sumarDias(ini, j);
    if(j === 35 && dd.slice(0, 7) !== ui.calMes) break;
    var its = itemsCal(dd).filter(function(x){ return x.tipo !== 'feriado'; }), fer = feriado(dd);
    var cls = 'celda' + (dd.slice(0, 7) !== ui.calMes ? ' fuera' : '') + (dd === hoy ? ' hoy' : '') + (dd === ui.calSel ? ' sel' : '') + (fer ? ' fer' : '') + (dd < hoy ? ' pasado' : '');
    celdas += '<button type="button" class="' + cls + '" data-acc="cal-dia" data-dia="' + dd + '"' + (fer ? ' title="' + esc(fer) + '"' : '') + '>' +
      '<span class="num">' + deISO(dd).getDate() + '</span>' +
      '<span class="barras solo-movil-p">' + its.slice(0, 3).map(function(x){ return '<i style="--c:' + x.c + '"></i>'; }).join('') + (its.length > 3 ? '<em>+' + (its.length - 3) + '</em>' : '') + '</span>' +
      its.slice(0, 3).map(function(x){ return '<span class="mini" style="--c:' + x.c + '">' + (x.hora ? x.hora + ' ' : '') + esc(x.t) + '</span>'; }).join('') +
      (its.length > 3 ? '<span class="mini" style="--c:transparent;color:var(--tinta-3)">+' + (its.length - 3) + ' más</span>' : '') +
      (fer ? '<span class="mini fer-mini">🇵🇪 ' + esc(fer) + '</span>' : '') +
    '</button>';
  }
  return '<div class="cal-layout"><div class="cal-mes-caja"><div class="cal-dias">' + cab.map(function(c){ return '<span>' + c + '</span>'; }).join('') + '</div>' +
    '<div class="cal-mes">' + celdas + '</div></div>' + panelDia(ui.calSel) + '</div>';
}

/* ---------- Vista Agenda --------------------------------------------------- */
function vistaAgenda(){
  var hoy = hoyISO(), desde = ui.calSel < hoy && ui.calSel.slice(0, 7) === hoy.slice(0, 7) ? hoy : ui.calSel, dias = '', cuantos = 0;
  for(var i = 0; i < 60; i++){
    var d = sumarDias(desde, i), its = itemsCal(d);
    if(!its.length) continue;
    cuantos++;
    dias += '<div class="ag-dia' + (d === hoy ? ' hoy' : '') + '"><div class="ag-fecha"><small>' + DIAS3[deISO(d).getDay()] + '</small><b>' + deISO(d).getDate() + '</b><em>' + MESES3[deISO(d).getMonth()] + '</em></div>' +
      '<div class="tarjeta"><div class="lista-filas">' + its.map(function(x){ return x.tipo === 'feriado' ? '<div class="fer-banda">' + esc(x.t) + '</div>' : filaAgenda(x, d); }).join('') + '</div></div></div>';
  }
  return cuantos ? '<div class="agenda-lista">' + dias + '</div>' : '<div class="tarjeta">' + vacio('🗓️', 'Nada en los próximos 60 días', 'Toca + para añadir un evento.') + '</div>';
}

/* ---------- Vista Año ------------------------------------------------------ */
function vistaAno(){
  var y = +ui.calSel.slice(0, 4), hoy = hoyISO();
  return '<div class="ano-rejilla">' + [0,1,2,3,4,5,6,7,8,9,10,11].map(function(m){
    var primero = iso(new Date(y, m, 1)), ini = inicioSemana(primero), celdas = '';
    for(var j = 0; j < 42; j++){
      var d = sumarDias(ini, j);
      if(j >= 35 && d.slice(5, 7) !== dos(m + 1)) break;
      if(d.slice(5, 7) !== dos(m + 1)){ celdas += '<i class="vacia"></i>'; continue; }
      var n = itemsCal(d).filter(function(x){ return x.tipo !== 'clase' && x.tipo !== 'feriado'; }).length;
      celdas += '<i class="n' + Math.min(n, 3) + (d === hoy ? ' hoy' : '') + (feriado(d) ? ' fer' : '') + '" data-acc="cal-ir-dia" data-dia="' + d + '" title="' + fechaCorta(d) + (n ? ': ' + n : '') + '">' + deISO(d).getDate() + '</i>';
    }
    return '<section class="tarjeta ano-mes' + (y + '-' + dos(m + 1) === hoy.slice(0, 7) ? ' actual' : '') + '"><button class="ano-tit" data-acc="cal-ir-mes" data-v="' + y + '-' + dos(m + 1) + '">' + cap(MESES[m]) + '</button><div class="ano-dias">' + celdas + '</div></section>';
  }).join('') + '</div>';
}

VISTAS.calendario = function(){
  var modo = ui.calModo || 'mes', d = ui.calSel, p = ui.calMes.split('-');
  var titulo = modo === 'dia' ? cap(DIAS[deISO(d).getDay()]) + ' ' + deISO(d).getDate() + ' ' + MESES3[deISO(d).getMonth()]
    : modo === 'semana' ? deISO(inicioSemana(d)).getDate() + ' ' + MESES3[deISO(inicioSemana(d)).getMonth()] + ' – ' + fechaCorta(sumarDias(inicioSemana(d), 6))
    : modo === 'anio' ? d.slice(0, 4)
    : modo === 'agenda' ? 'Desde ' + fechaCorta(d)
    : cap(MESES[+p[1] - 1]) + ' ' + p[0];
  var nOcultos = (ui.calOcultos || []).length;
  var html = '<div class="cal-top">' +
      '<div class="cal-nav"><button class="btn-icono" data-acc="cal-paso" data-n="-1" aria-label="Anterior">' + ico('i-izq') + '</button>' +
        '<h2>' + titulo + '</h2><button class="btn-icono" data-acc="cal-paso" data-n="1" aria-label="Siguiente">' + ico('i-der') + '</button></div>' +
      '<div class="cal-acc"><button class="btn chico" data-acc="cal-hoy">Hoy</button>' +
        '<button class="btn-icono' + (nOcultos ? ' activo' : '') + '" data-acc="cal-filtros" title="Qué mostrar, importar y exportar" aria-label="Opciones del calendario">' + ico('i-ajustes') + (nOcultos ? '<span class="globo gris">' + nOcultos + '</span>' : '') + '</button></div>' +
    '</div>' +
    '<div class="selector cal-modos">' + [['dia','Día'],['semana','Semana'],['mes','Mes'],['agenda','Agenda'],['anio','Año']].map(function(o){
      return '<button data-acc="cal-modo" data-m="' + o[0] + '" aria-pressed="' + (modo === o[0]) + '">' + o[1] + '</button>';
    }).join('') + '</div>' + filtroEsp('cal-esp', ui.calEsp) +
    '<div class="cal-cuerpo" data-desliza="cal">';
  html += modo === 'dia' ? vistaDia() : modo === 'semana' ? vistaSemana() : modo === 'agenda' ? vistaAgenda() : modo === 'anio' ? vistaAno() : vistaMes();
  return html + '</div>';
};
/* Un paso adelante o atrás, según la vista */
function pasoCal(n){
  var modo = ui.calModo || 'mes';
  if(modo === 'dia') ui.calSel = sumarDias(ui.calSel, n);
  else if(modo === 'semana') ui.calSel = sumarDias(ui.calSel, 7 * n);
  else if(modo === 'agenda') ui.calSel = sumarDias(ui.calSel, 30 * n);
  else if(modo === 'anio') ui.calSel = (+ui.calSel.slice(0, 4) + n) + ui.calSel.slice(4, 7) + '-01';
  else {
    var p = ui.calMes.split('-'), dd = new Date(+p[0], +p[1] - 1 + n, 1);
    ui.calMes = iso(dd).slice(0, 7);
    ui.calSel = ui.calMes === hoyISO().slice(0, 7) ? hoyISO() : iso(dd);
    return;
  }
  ui.calMes = ui.calSel.slice(0, 7);
}
function filtrosCal(){
  var oc = ui.calOcultos || [];
  abrirFlotante(cabFlot('Calendario') + '<h4 class="sub-flot">Qué mostrar</h4><div class="lista-interruptores">' + TIPOS_CAL.map(function(t){
    return '<label class="interruptor"><input type="checkbox" data-cal-tipo="' + t[0] + '"' + (oc.indexOf(t[0]) < 0 && !(t[0] === 'feriado' && pref.feriados === false) ? ' checked' : '') + '>' + t[2] + ' ' + t[1] + '</label>';
  }).join('') + '</div><h4 class="sub-flot">Importar y exportar</h4>' +
    '<div class="menu-lista">' +
      '<button type="button" data-acc="ics-importar">' + ico('i-subir') + '<span><b>Importar de Google Calendar u otro</b><small>Un archivo .ics: en Google Calendar → Configuración → Importar y exportar → Exportar.</small></span></button>' +
      '<button type="button" data-acc="ics-todo">' + ico('i-bajar') + '<span><b>Exportar todo a .ics</b><small>Para pasar tus eventos y avisos al calendario del teléfono, que suena siempre.</small></span></button>' +
    '</div><input type="file" id="archivoIcs" accept=".ics,text/calendar" class="oculto">' +
    '<div class="botones"><button class="btn primario" data-cerrar="1">Listo</button></div>', function(){ pintar(); });
}
/* ---------- Importar .ics ------------------------------------------------ */
function leerICS(txt){
  var lineas = txt.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/), evs = [], e = null;
  function fechaICS(v, params){
    var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z?))?/.exec(v);
    if(!m) return null;
    if(!m[4]) return { f:m[1] + '-' + m[2] + '-' + m[3], h:'' };
    var d = m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    return { f:iso(d), h:dos(d.getHours()) + ':' + dos(d.getMinutes()) };
  }
  function texto(v){ return v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); }
  lineas.forEach(function(l){
    if(l === 'BEGIN:VEVENT'){ e = {}; return; }
    if(l === 'END:VEVENT'){ if(e && e.ini) evs.push(e); e = null; return; }
    if(!e) return;
    var i = l.indexOf(':'); if(i < 0) return;
    var k = l.slice(0, i), v = l.slice(i + 1), nom = k.split(';')[0];
    if(nom === 'SUMMARY') e.t = texto(v);
    else if(nom === 'LOCATION') e.lugar = texto(v);
    else if(nom === 'DESCRIPTION') e.notas = texto(v);
    else if(nom === 'UID') e.uid = v;
    else if(nom === 'DTSTART') e.ini = fechaICS(v);
    else if(nom === 'DTEND') e.fin = fechaICS(v);
    else if(nom === 'RRULE'){ var f = /FREQ=(\w+)/.exec(v); e.rep = f ? { DAILY:'dia', WEEKLY:'sem', MONTHLY:'mes', YEARLY:'ano' }[f[1]] || 'no' : 'no'; }
  });
  return evs;
}
function importarICS(archivo){
  var lector = new FileReader();
  lector.onload = function(){
    var evs = leerICS(String(lector.result || '')), uids = {}, n = 0, rep = 0;
    vivos('eventos').forEach(function(x){ if(x.uid) uids[x.uid] = 1; });
    evs.forEach(function(x){
      if(x.uid && uids[x.uid]){ rep++; return; }
      var todo = !x.ini.h, hasta = '';
      if(todo && x.fin && x.fin.f > x.ini.f){ var ult = sumarDias(x.fin.f, -1); if(ult > x.ini.f) hasta = ult; }
      poner('eventos', { id:nid(), uid:x.uid || '', t:(x.t || 'Evento').slice(0, 200), fecha:x.ini.f, hasta:hasta, todo:todo, ini:x.ini.h, fin:x.fin && x.fin.h ? x.fin.h : (x.ini.h ? sumarHora(x.ini.h, 60) : ''),
        lugar:(x.lugar || '').slice(0, 120), notas:(x.notas || '').slice(0, 4000), color:'esp', esp:espPorDefecto(), tipo:'evento', rep:x.rep || 'no', aviso:todo ? -1 : 15 });
      n++;
    });
    cerrarFlotante(); pintar();
    aviso(n ? '📅 ' + n + (n === 1 ? ' evento importado' : ' eventos importados') : 'No había eventos nuevos', rep ? rep + ' ya estaban en tu agenda.' : (evs.length ? null : 'El archivo no tiene eventos.'));
  };
  lector.readAsText(archivo);
}
/* Deslizar el dedo para pasar de día, semana o mes (en el celular) */
(function(){
  var x0 = 0, y0 = 0, t0 = 0, activo = false;
  document.addEventListener('touchstart', function(ev){
    var c = ev.target.closest && ev.target.closest('[data-desliza]');
    activo = !!c && !ev.target.closest('.sem-envoltura,.fichas.desliza,input,textarea,.ano-rejilla') && ev.touches[0].clientX >= 24 && ev.touches[0].clientX <= innerWidth - 24;
    if(!activo) return;
    x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; t0 = Date.now();
  }, { passive:true });
  document.addEventListener('touchend', function(ev){
    if(!activo) return; activo = false;
    var t = ev.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0;
    if(Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8 && Date.now() - t0 < 700 && ui.vista === 'calendario'){
      pasoCal(dx < 0 ? 1 : -1);
      var c = $('contenido'); c.classList.remove('desliza-izq', 'desliza-der'); pintar();
      c.classList.add(dx < 0 ? 'desliza-izq' : 'desliza-der'); setTimeout(function(){ c.classList.remove('desliza-izq', 'desliza-der'); }, 300);
    }
  }, { passive:true });
})();

/* ---------- Recordatorios ------------------------------------------------- */
function filaRec(r){
  var hecho = r.hecho && (!r.rep || r.rep === 'no');
  var m = momentoR(r), f = m.slice(0, 10), h = m.slice(11, 16);
  var tarde = !hecho && m <= hoyISO() + 'T' + horaAhora();
  return '<div class="fila fila-rec' + (hecho ? ' hecha' : '') + (tarde ? ' tarde' : '') + '" data-fila="' + r.id + '">' +
    '<div class="rec-hora" data-acc="rec-ed" data-id="' + r.id + '"><b>' + (h || '—') + '</b><span>' + (f === hoyISO() ? 'hoy' : relativo(f).toLowerCase().slice(0, 12)) + '</span></div>' +
    '<div class="cuerpo" data-acc="rec-ed" data-id="' + r.id + '">' +
      '<div class="titulo">' + esc(r.t) + '</div>' +
      '<div class="meta">' + (f !== hoyISO() ? '<span>' + fechaCorta(f) + '</span>' : '') +
        (r.rep && r.rep !== 'no' ? '<span>' + ico('i-rep') + REPS_CORTO[r.rep] + '</span>' : '') +
        (r.pospuesto ? '<span>' + ico('i-dormir') + 'pospuesto</span>' : '') +
      '</div>' +
    '</div>' +
    '<div class="lado">' + (!hecho ? '<button class="btn-icono" data-acc="rec-posponer" data-id="' + r.id + '" title="Posponer" aria-label="Posponer">' + ico('i-dormir') + '</button>' : '') +
      casilla('rec-ok', r.id, hecho, 'var(--oro)') + '</div>' +
  '</div>';
}

VISTAS.recordatorios = function(){
  var html = '';
  if(!('Notification' in window)){
    html += '<div class="banda">' + ico('i-campana') + '<div class="txt"><b>Este navegador no da avisos del sistema</b>Sonarán dentro de la agenda mientras esté abierta. Para no fallar, pasa los importantes a tu calendario.</div></div>';
  } else if(Notification.permission !== 'granted'){
    html += '<div class="banda">' + ico('i-campana') + '<div class="txt"><b>Activa los avisos</b>Para que los recordatorios te salten aunque estés en otra pestaña.</div>' +
      '<button class="btn chico primario" data-acc="permiso">Activar</button></div>';
  }
  html += botonAnadir('rec', 'Nuevo recordatorio…');

  var ya = hoyISO() + 'T' + horaAhora(), finHoy = hoyISO() + 'T99';
  var todos = vivos('recordatorios');
  var pend = todos.filter(function(r){ return !(r.hecho && (!r.rep || r.rep === 'no')); })
                  .sort(function(a, b){ return momentoR(a).localeCompare(momentoR(b)); });
  var venc = pend.filter(function(r){ return momentoR(r) <= ya; });
  var hoyL = pend.filter(function(r){ var m = momentoR(r); return m > ya && m < finHoy; });
  var prox = pend.filter(function(r){ return momentoR(r) >= finHoy; });
  var hechos = todos.filter(function(r){ return r.hecho && (!r.rep || r.rep === 'no'); })
                    .sort(function(a, b){ return (b.upd || 0) - (a.upd || 0); });

  if(!pend.length && !hechos.length) return html + '<div class="tarjeta">' + vacio('🔔', 'Sin recordatorios', 'Escribe arriba qué y cuándo, y la agenda te avisa.') + '</div>';
  function bloque(t, l, rojo){
    if(!l.length) return '';
    return '<section class="rec-bloque' + (rojo ? ' rojo' : '') + '"><h3 class="seccion-tit' + (rojo ? ' rojo' : '') + '">' + t + ' <span class="n">' + l.length + '</span></h3>' +
      '<div class="lista-filas rec-lista">' + l.map(filaRec).join('') + '</div></section>';
  }
  html += bloque('Pasados sin marcar', venc, true) + bloque('Hoy', hoyL) + bloque('Próximos', prox);
  if(!pend.length) html += '<div class="tarjeta">' + vacio('✨', 'Todo al día') + '</div>';
  if(hechos.length){
    html += '<div class="seccion-tit"><button data-acc="rec-ver-hechos" style="font:inherit;color:inherit;letter-spacing:inherit;text-transform:inherit">' +
      (ui.verHechos ? '▾' : '▸') + ' Hechos <span class="n">' + hechos.length + '</span></button></div>';
    if(ui.verHechos){
      html += '<div class="tarjeta"><div class="lista-filas">' + hechos.slice(0, 50).map(filaRec).join('') + '</div></div>' +
        '<div style="margin-top:12px"><button class="btn chico peligro" data-acc="rec-borrar-hechos">' + ico('i-basura') + 'Borrar los hechos</button></div>';
    }
  }
  return html;
};

/* ---------- Listas -------------------------------------------------------- */
function listaActual(){ var l = ui.lista && buscarId('listas', ui.lista); return l && !l.del ? l : null; }

VISTAS.listas = function(){
  var l = listaActual();
  if(ui.lista && !l) ui.lista = null;
  if(l){
    var items = l.items || [];
    var ok = items.filter(function(x){ return x.ok; }).length;
    var orden = items.filter(function(x){ return !x.ok; }).concat(items.filter(function(x){ return x.ok; }));
    var pl = items.length ? ok / items.length : 0, CL = 2 * Math.PI * 22;
    return '<div class="hoja-lista" style="--c:' + color(l.color) + '">' +
        '<div class="hl-barra"><button class="btn chico" data-acc="lista-volver">' + ico('i-izq') + 'Listas</button>' +
          '<span class="hl-acc"><button class="btn chico" data-acc="compartir-lista" data-id="' + l.id + '">' + ico('i-compartir') + 'Compartir</button>' +
          '<button class="btn-icono" data-acc="lista-ed" data-id="' + l.id + '" title="Editar lista" aria-label="Editar lista">' + ico('i-lapiz') + '</button></span></div>' +
        '<header class="hl-cab"><span class="hl-em">' + esc(l.em || '📝') + '</span>' +
          '<div class="hl-txt"><h2>' + esc(l.nombre) + '</h2><p>' + (items.length ? (items.length - ok) + ' por marcar · ' + ok + ' de ' + items.length + ' listos' : 'Todavía vacía') + '</p></div>' +
          '<svg class="hl-anillo" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" class="f"/><circle cx="26" cy="26" r="22" class="v" stroke-dasharray="' + CL.toFixed(1) + '" stroke-dashoffset="' + (CL * (1 - pl)).toFixed(1) + '"/><text x="26" y="30" text-anchor="middle">' + Math.round(pl * 100) + '%</text></svg>' +
        '</header>' +
        '<form class="captura hl-captura" data-acc="item-nuevo" autocomplete="off">' +
          '<input id="nuevoItem" type="text" maxlength="160" placeholder="Añadir a la lista… (Enter)" enterkeyhint="enter">' + botonVoz('nuevoItem') +
          '<button type="submit" class="btn primario chico">' + ico('i-plus') + '</button></form>' +
        (orden.length ? '<div class="lista-filas hl-renglones">' + orden.map(function(x){
          return '<div class="item-lista' + (x.ok ? ' ok' : '') + '">' + casilla('item-ok', x.id, x.ok, color(l.color), true) +
            '<span class="t" data-acc="item-ed" data-id="' + x.id + '">' + esc(x.t) + '</span>' +
            '<button class="btn-icono" data-acc="item-quitar" data-id="' + x.id + '" aria-label="Quitar">' + ico('i-x') + '</button></div>';
        }).join('') + '</div>' : vacio('📝', 'Lista vacía', 'Escribe arriba y pulsa Enter; el cursor se queda para seguir añadiendo.')) +
      '</div>' +
      (items.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        '<button class="btn chico" data-acc="lista-desmarcar">' + ico('i-rep') + 'Desmarcar todo</button>' +
        (ok ? '<button class="btn chico" data-acc="lista-limpiar">' + ico('i-basura') + 'Quitar marcados</button>' : '') +
      '</div>' : '');
  }
  var ls = vivos('listas').sort(function(a, b){ return (a.creada || 0) - (b.creada || 0); });
  return '<div class="listas-rejilla">' + ls.map(function(x){
      var its = x.items || [], ok2 = its.filter(function(i){ return i.ok; }).length;
      /* Una tapa de libreta: su color arriba, lo primero que falta a la vista */
      var pl = its.length ? ok2 / its.length : 0, CL = 2 * Math.PI * 15;
      var faltan = its.filter(function(i){ return !i.ok; }).slice(0, 3);
      return '<button type="button" class="tarjeta tarjeta-lista libreta" style="--c:' + color(x.color) + '" data-acc="lista-abrir" data-id="' + x.id + '">' +
        '<span class="lb-lomo"></span>' +
        '<span class="lb-cab"><span class="em">' + esc(x.em || '📝') + '</span>' +
          '<svg class="lb-anillo" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" class="f"/><circle cx="18" cy="18" r="15" class="v" stroke-dasharray="' + CL.toFixed(1) + '" stroke-dashoffset="' + (CL * (1 - pl)).toFixed(1) + '"/></svg></span>' +
        '<b class="lb-nom">' + esc(x.nombre) + '</b>' +
        '<small class="lb-cuenta">' + (its.length ? (its.length - ok2) + ' por marcar · ' + its.length + ' en total' : 'Vacía') + '</small>' +
        (faltan.length ? '<span class="lb-items">' + faltan.map(function(i){ return '<span>' + esc(i.t) + '</span>'; }).join('') + '</span>' : '') +
      '</button>';
    }).join('') +
    '<button type="button" class="tarjeta tarjeta-lista libreta nueva" data-acc="nuevo" data-tipo="lista">' +
      ico('i-plus') + '<b>Nueva lista</b></button>' +
  '</div>' +
  (!ls.length ? '<p style="color:var(--tinta-3);font-size:13px;margin-top:14px">Listas para marcar: la compra, la maleta, lo que falta en casa, pelis por ver… Se pueden desmarcar enteras para volver a usarlas.</p>' : '');
};

/* ---------- Hábitos ------------------------------------------------------- */
function racha(x){
  var hoy = hoyISO(), n = 0, d = hoy;
  var toca = function(s){ return !x.dias || x.dias.indexOf(deISO(s).getDay()) >= 0; };
  var marcas = x.marcas || {};
  if(toca(hoy) && !marcas[hoy]) d = sumarDias(hoy, -1);   // hoy aún se puede hacer
  for(var i = 0; i < 1000; i++){
    if(toca(d)){ if(marcas[d]) n++; else break; }
    d = sumarDias(d, -1);
  }
  return n;
}
function cumplimiento(x){
  var hoy = hoyISO(), hechos = 0, toca = 0, creado = x.creada ? iso(new Date(x.creada)) : '';
  for(var i = 0; i < 30; i++){
    var d = sumarDias(hoy, -i);
    if(creado && d < creado) break;
    if(!x.dias || x.dias.indexOf(deISO(d).getDay()) >= 0){ toca++; if(x.marcas && x.marcas[d]) hechos++; }
  }
  return toca ? hechos / toca : 0;
}

VISTAS.habitos = function(){
  var hs = vivos('habitos').sort(function(a, b){ return (a.creada || 0) - (b.creada || 0); });
  var hoy = hoyISO();
  if(!hs.length){
    var sug = [['💧','Beber 2 litros de agua'],['📚','Leer 20 minutos'],['🏃','Hacer ejercicio'],['🧘','Meditar 10 minutos'],['😴','Dormir antes de las 11'],['💰','Anotar mis gastos']];
    return '<div class="tarjeta">' + vacio('🔥', 'Hábitos que se hacen solos', 'Marca cada día lo que cumples y mira crecer la racha.') +
      '<div class="chips-habito" style="justify-content:center;padding-bottom:22px">' + sug.map(function(s){
        return '<button class="chip-habito" data-acc="habito-sug" data-em="' + s[0] + '" data-n="' + esc(s[1]) + '"><span class="em">' + s[0] + '</span>' + s[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div style="margin-top:12px"><button class="btn primario" data-acc="nuevo" data-tipo="habito">' + ico('i-plus') + 'Crear mi propio hábito</button></div>';
  }
  /* Arriba: lo de hoy en anillos grandes, un toque y listo */
  var wd = deISO(hoy).getDay(), CH = 2 * Math.PI * 30;
  var deHoy = hs.filter(function(x){ return !x.dias || x.dias.indexOf(wd) >= 0; });
  var okHoy = deHoy.filter(function(x){ return x.marcas && x.marcas[hoy]; }).length;
  var html = '<section class="hab-hoy"><h3 class="seccion-tit">Hoy <span class="n">' + okHoy + ' de ' + deHoy.length + '</span></h3>' +
    (deHoy.length ? '<div class="hab-anillos">' + deHoy.map(function(x){
      var ok = !!(x.marcas && x.marcas[hoy]), r = racha(x);
      return '<button type="button" class="hab-anillo' + (ok ? ' ok' : '') + '" data-acc="habito-dia" data-id="' + x.id + '" data-dia="' + hoy + '" aria-pressed="' + ok + '">' +
        '<svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" class="f"/><circle cx="36" cy="36" r="30" class="v" stroke-dasharray="' + CH.toFixed(1) + '" stroke-dashoffset="' + (ok ? 0 : CH).toFixed(1) + '"/></svg>' +
        '<span class="em">' + esc(x.em || '⭐') + '</span>' +
        '<b>' + esc(x.nombre) + '</b><small>' + (r ? '🔥 ' + r + (r === 1 ? ' día' : ' días') : 'Empieza hoy') + '</small></button>';
    }).join('') + '</div>' : '<p class="nada">Hoy no toca ningún hábito. 😌</p>') + '</section>';

  /* Abajo: la tabla de seguimiento, como en un cuaderno (14 días) */
  var dias = [];
  for(var i = 13; i >= 0; i--) dias.push(sumarDias(hoy, -i));
  html += '<h3 class="seccion-tit">Seguimiento <span class="n">últimos 14 días</span></h3>' +
    '<section class="hab-tabla"><div class="ht-fila ht-cab"><span class="ht-nom"></span>' + dias.map(function(d, k){
      return '<span class="ht-d' + (k < 4 ? ' lejos' : '') + (d === hoy ? ' hoy' : '') + '">' + DIAS3[deISO(d).getDay()].charAt(0) + '<i>' + deISO(d).getDate() + '</i></span>';
    }).join('') + '<span class="ht-racha">🔥</span></div>' +
    hs.map(function(x){
      var r = racha(x), pc = cumplimiento(x);
      var frec = !x.dias || x.dias.length === 7 ? 'Cada día' : x.dias.length + ' días por semana';
      return '<div class="ht-fila habito"><button type="button" class="ht-nom" data-acc="habito-ed" data-id="' + x.id + '" title="Editar"><span class="em">' + esc(x.em || '⭐') + '</span><span class="t"><b>' + esc(x.nombre) + '</b><small>' + frec + ' · ' + Math.round(pc * 100) + '%</small></span></button>' +
        dias.map(function(d, k){
          var w = deISO(d).getDay(), libre = x.dias && x.dias.indexOf(w) < 0, ok = x.marcas && x.marcas[d];
          return '<button type="button" class="ht-c dia-h' + (k < 4 ? ' lejos' : '') + (ok ? ' ok' : '') + (libre ? ' libre' : '') + (d === hoy ? ' hoy' : '') + '" data-acc="habito-dia" data-id="' + x.id + '" data-dia="' + d + '" aria-label="' + esc(x.nombre) + ' el ' + fechaCorta(d) + '"><span class="c">' + CHECK + '</span></button>';
        }).join('') +
        '<span class="ht-racha"><b>' + r + '</b></span></div>';
    }).join('') + '</section>' +
    '<div class="pie-fila-btn" style="padding:14px 0 0"><button class="btn chico" data-acc="nuevo" data-tipo="habito">' + ico('i-plus') + 'Nuevo hábito</button></div>';
  return html;
};

/* ---------- Notas ---------------------------------------------------------- */
/* Las líneas que empiezan con [ ] o [x] son casillas que se marcan desde el muro */
var RE_CASILLA = /^\s*(?:[-*]\s*)?\[( |x|X)\]\s?/;
function cuerpoNota(n){
  var lineas = (n.cuerpo || '').split('\n');
  if(!lineas.some(function(l){ return RE_CASILLA.test(l); })) return n.cuerpo ? '<p>' + esc(n.cuerpo) + '</p>' : '';
  var hechas = 0, total = 0;
  var html = lineas.slice(0, 14).map(function(l, i){
    var m = l.match(RE_CASILLA);
    if(!m) return l.trim() ? '<span class="nl-txt">' + esc(l) + '</span>' : '';
    var ok = m[1].toLowerCase() === 'x'; total++; if(ok) hechas++;
    return '<button type="button" class="nl-casilla' + (ok ? ' ok' : '') + '" data-acc="nota-check" data-id="' + n.id + '" data-l="' + i + '"><i>' + (ok ? '✓' : '') + '</i>' + esc(l.replace(RE_CASILLA, '')) + '</button>';
  }).join('');
  lineas.forEach(function(l, i){ if(i >= 14 && RE_CASILLA.test(l)){ total++; if(/\[(x|X)\]/.test(l)) hechas++; } });
  return '<div class="nota-lista">' + html + '</div><span class="nl-cuenta">' + hechas + ' de ' + total + '</span>';
}
function marcarLineaNota(id, i){
  var n = buscarId('notas', id); if(!n) return;
  n = JSON.parse(JSON.stringify(n));
  var ls = (n.cuerpo || '').split('\n');
  if(!ls[i] || !RE_CASILLA.test(ls[i])) return;
  ls[i] = ls[i].replace(/\[( |x|X)\]/, function(_, c){ return c === ' ' ? '[x]' : '[ ]'; });
  n.cuerpo = ls.join('\n'); poner('notas', n); vibrar(8); pintarSeguro();
}
function tarjetaNota(n){
  return '<div role="button" tabindex="0" class="tarjeta nota" style="--c:' + (n.color ? color(n.color) : 'var(--regla)') + '" data-acc="nota-ed" data-id="' + n.id + '">' +
    (n.t ? '<b>' + esc(n.t) + '</b>' : '') + cuerpoNota(n) +
    '<small>' + (n.fija ? ico('i-pin') : '') + relativo(iso(new Date(n.upd || Date.now()))) + '</small></div>';
}
VISTAS.notas = function(){
  var q = sinTildes(ui.notasQ.trim());
  var ns = vivos('notas').filter(function(n){ return !q || sinTildes(n.t + ' ' + n.cuerpo).indexOf(q) >= 0; })
    .sort(function(a, b){ return (b.fija ? 1 : 0) - (a.fija ? 1 : 0) || (b.upd || 0) - (a.upd || 0); });
  var total = vivos('notas').length;
  return '<div style="display:flex;gap:8px;margin-bottom:14px">' +
      (total ? '<input class="entrada" id="notasQ" type="search" placeholder="Buscar en las notas" value="' + esc(ui.notasQ) + '" style="flex:1">' : '<div style="flex:1"></div>') +
      '<button class="btn primario" data-acc="nuevo" data-tipo="nota">' + ico('i-plus') + 'Nota</button></div>' +
    (ns.length ? '<div class="notas-muro">' + ns.map(tarjetaNota).join('') + '</div>'
      : '<div class="tarjeta">' + (total ? vacio('🔎', 'Nada coincide') : vacio('🗒️', 'Sin notas', 'Ideas, datos que no quieres olvidar, direcciones, contraseñas del wifi…')) + '</div>');
};

/* ---------- Gastos personales y Oficina ----------------------------------------
   Dos libros de cuentas, cada uno con SUS movimientos y SU nube. Los dos
   son el mismo Libro de Cuentas de siempre, que va entero dentro de este
   archivo (en base64) y se abre en un marco con srcdoc. Un srcdoc hereda
   la dirección de la página, así que comparte el navegador con la agenda.

   · Gastos personales usa las claves de siempre: lo que ya tenías en
     Cuentas aparece aquí tal cual.
   · Oficina es el mismo programa con otras claves (otros datos, otra nube)
     y otro nombre. Colores y tema, los mismos para todo.                  */
var LIBROS = {
  personal: { clave:CLAVE_LEDGER,  nube:'libro_cuentas_db_cfg',   nom:'Personal', sub:'Gastos personales',     archivo:'personal_' },
  oficina:  { clave:CLAVE_OFICINA, nube:'oficina_cuentas_db_cfg', nom:'Oficina',  sub:'Cuentas de la oficina', archivo:'oficina_' }
};
var marcos = {};
function crearMarco(cual){
  if(marcos[cual]) return marcos[cual];
  var m = document.createElement('iframe');
  m.className = 'marco-cuentas';
  m.title = LIBROS[cual].sub;
  m.style.display = 'none';
  if(cacheCuentas) m.srcdoc = fuenteLibro(cual);
  else {
    m.srcdoc = '<body style="margin:0;display:grid;place-items:center;height:100vh;font-family:sans-serif;color:#8a93a8;background:transparent">Abriendo el libro…</body>';
    cargarCuentas().then(function(){ m.srcdoc = fuenteLibro(cual); });
  }
  $('zonaCuentas').appendChild(m);
  return (marcos[cual] = m);
}
function mostrarLibro(cual){
  var z = $('zonaCuentas');
  z.classList.remove('oculto');
  crearMarco(cual);
  Object.keys(marcos).forEach(function(k){ marcos[k].style.display = k === cual ? '' : 'none'; });
}
/* Informe de un libro sin tener que abrirlo: se usa el mismo motor de
   Excel y PDF del libro, con el periodo que elijas aquí */
function exportarLibro(cual, formato, periodo, desde, hasta){
  var m = crearMarco(cual), intentos = 0;
  (function prueba(){
    var w = null; try{ w = m.contentWindow; }catch(e){}
    if(w && typeof w.exportarPara === 'function'){
      var n = w.exportarPara(periodo, desde, hasta, formato);
      if(!n) aviso('Sin movimientos', NOM_LIBRO[cual] + ': no hay nada en ese periodo.');
      return;
    }
    if(++intentos > 60){ aviso('No se pudo preparar el informe', 'Abre el libro una vez y vuelve a intentarlo.'); return; }
    setTimeout(prueba, 100);
  })();
}
function tarjetaInformes(){
  var I = ui.inf || (ui.inf = { libro:ui.dinLibro === 'oficina' ? 'oficina' : ui.dinLibro === 'personal' ? 'personal' : 'ambos', periodo:'mes', desde:'', hasta:'' });
  var PER = [['mes','Este mes'],['mes-1','Mes pasado'],['90','Últimos 90 días'],['anio','Este año'],['todo','Todo'],['rango','Elegir fechas']];
  return '<section class="tarjeta informes" style="margin-bottom:14px">' + cabTarjeta('i-bajar', 'Descargar informes', 'var(--azul)') +
    '<div class="tarjeta-cuerpo">' +
      '<div class="inf-fila"><span>Libro</span><div class="selector">' + [['personal','🏠 Personal'],['oficina','💼 Oficina'],['ambos','Los dos']].map(function(o){
        return '<button type="button" data-acc="inf-libro" data-v="' + o[0] + '" aria-pressed="' + (I.libro === o[0]) + '">' + o[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div class="inf-fila"><span>Periodo</span><div class="selector inf-per">' + PER.map(function(o){
        return '<button type="button" data-acc="inf-per" data-v="' + o[0] + '" aria-pressed="' + (I.periodo === o[0]) + '">' + o[1] + '</button>';
      }).join('') + '</div></div>' +
      (I.periodo === 'rango' ? '<div class="fila-campos inf-rango"><label class="campo"><span>Desde</span><input type="date" id="infDesde" value="' + esc(I.desde) + '"></label><label class="campo"><span>Hasta</span><input type="date" id="infHasta" value="' + esc(I.hasta) + '"></label></div>' : '') +
      '<div class="inf-botones">' +
        '<button type="button" class="btn inf-btn excel" data-acc="inf-bajar" data-v="xlsx"><span class="inf-ico">XLS</span><span><b>Excel</b><small>Movimientos con fórmulas, resumen por mes y por categoría</small></span></button>' +
        '<button type="button" class="btn inf-btn pdf" data-acc="inf-bajar" data-v="pdf"><span class="inf-ico">PDF</span><span><b>PDF</b><small>Informe listo para imprimir o enviar</small></span></button>' +
      '</div>' +
    '</div></section>';
}
/* El libro viene comprimido (gzip + base64) para que la agenda pese menos.
   Se descomprime una sola vez, sin congelar la pantalla, la primera vez
   que hace falta (o un rato después de abrir, cuando el celular está libre). */
var cacheCuentas = '', promesaCuentas = null;
function cargarCuentas(){
  if(promesaCuentas) return promesaCuentas;
  var el = $('fuenteCuentas');
  if(!el){ cacheCuentas = '<p style="font-family:sans-serif;padding:20px">No se encontró el libro de cuentas dentro del archivo.</p>'; return (promesaCuentas = Promise.resolve(cacheCuentas)); }
  var bin = atob(el.textContent.replace(/\s+/g, ''));
  var bytes = new Uint8Array(bin.length);
  for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if(!el.dataset.gz){ cacheCuentas = new TextDecoder('utf-8').decode(bytes); return (promesaCuentas = Promise.resolve(cacheCuentas)); }
  if(typeof DecompressionStream === 'undefined'){
    cacheCuentas = '<p style="font-family:sans-serif;padding:24px;line-height:1.5">Tu navegador es muy antiguo para abrir el libro de cuentas. Actualiza Chrome o Safari y vuelve a intentarlo.</p>';
    return (promesaCuentas = Promise.resolve(cacheCuentas));
  }
  promesaCuentas = new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text()
    .then(function(t){ el.textContent = ''; return (cacheCuentas = t); })
    .catch(function(){ promesaCuentas = null; return (cacheCuentas = '<p style="font-family:sans-serif;padding:24px">No se pudo abrir el libro. Recarga la página.</p>'); });
  return promesaCuentas;
}
function fuenteCuentas(){ return cacheCuentas; }
function fuenteLibro(cual){
  var L = LIBROS[cual], s = fuenteCuentas();
  function cambia(a, b){ s = s.split(a).join(b); }
  cambia("var CLAVE_DATOS = 'ledger_finanzas_simple_v1'", "var CLAVE_DATOS = '" + L.clave + "'");
  cambia("var CLAVE_NUBE  = 'libro_cuentas_db_cfg'", "var CLAVE_NUBE  = '" + L.nube + "'");
  cambia('<h1>Cuentas</h1>', '<h1>' + L.nom + '</h1>');
  cambia('<p>Ingresos &amp; Gastos</p>', '<p>' + L.sub + '</p>');
  cambia('<title>Cuentas · Ingresos y gastos</title>', '<title>' + L.sub + '</title>');
  cambia("pdf.texto('Cuentas',", "pdf.texto('" + L.sub + "',");
  cambia("'cuentas_' + hoyISO()", "'" + L.archivo + "' + hoyISO()");
  cambia("'respaldo_cuentas_' + hoyISO()", "'respaldo_" + L.archivo + "' + hoyISO()");
  cambia("pdf.texto('CUENTAS', M", "pdf.texto('" + L.sub.toUpperCase() + "', M");
  cambia('function subirANube(){', 'window.recargarLibro = function(){ if(estado.editando) return false; cargarLocal(); pintarTodo(); return true; };' +
    'window.estadoNubeDesdeAgenda = function(e){ estadoNube(hayNube() ? e : "off"); };' +
    'function subirANube(){ try{ if(window.parent !== window && window.parent.sincronizarLibro){ if(hayNube()){ estadoNube("busy"); if(window.cuentasHuboCambio) window.cuentasHuboCambio(); } window.parent.sincronizarLibro("' + cual + '"); return; } }catch(e){}');
  cambia('function bajarDeNube(silencioso){', 'function bajarDeNube(silencioso){ try{ if(window.parent !== window && window.parent.sincronizarLibro){ if(!estado.editando) window.parent.sincronizarLibro("' + cual + '", true); return; } }catch(e){}');
  cambia('function bajarArchivo(blob, nombre){', 'window.exportarPara = function(periodo, desde, hasta, formato){' +
    'var f = estado.filtros, antes = { periodo:f.periodo, desde:f.desde, hasta:f.hasta, ym:f.ym };' +
    'f.periodo = periodo; f.desde = desde || ""; f.hasta = hasta || ""; f.ym = periodo === "ym" ? desde : "";' +
    'try{ if(formato === "pdf") exportarPDF(); else if(formato === "csv") exportarCSV(); else exportarExcel(); } finally { f.periodo = antes.periodo; f.desde = antes.desde; f.hasta = antes.hasta; f.ym = antes.ym; }' +
    'return delPeriodo().length; };' +
    'function bajarArchivo(blob, nombre){ try{ if(window.parent !== window && window.parent.guardarArchivo){ window.parent.guardarArchivo(blob, nombre); return; } }catch(e){}');
  /* El libro se viste igual que la agenda: mismo logo, mismas tarjetas */
  var logo = getComputedStyle(document.documentElement).getPropertyValue('--logo').trim();
  var fuenteCss = window.FUENTE_AGENDA ? "@font-face{font-family:'Jakarta';src:url(" + window.FUENTE_AGENDA + ") format('woff2');font-weight:200 800}:root{--letra:'Jakarta',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif!important}body{font-family:var(--letra)!important}" : '';
  if(window.SERIF_AGENDA) fuenteCss += "@font-face{font-family:'Barlow Condensed';src:url(" + window.SERIF_AGENDA + ") format('woff2');font-weight:500 900}";
  cambia('</head>', '<style id="estilo-agenda">:root{--logo:' + logo + '}' + fuenteCss + varsAgenda() + ESTILO_LIBRO + '</style></head>');
  return s;
}
var ESTILO_LIBRO = [
  /* fondo liso, como la agenda */
  'body{background:var(--papel)!important}',
  /* el logo de la agenda en la cabecera y en la bienvenida */
  '.sello,.marca-grande{background:var(--logo) center/contain no-repeat!important;border:0!important;box-shadow:none!important;padding:0!important}',
  '.sello{width:38px!important;height:38px!important;border-radius:0!important}',
  '.marca-grande{width:104px!important;height:104px!important}',
  '.sello svg,.marca-grande svg{visibility:hidden}',
  /* títulos y cifras grandes en serifa; el resto, sin letra de máquina */
  '.marca h1,.tarjeta-cabeza h2,.balance .cantidad,h1,h2,h3{font-family:var(--serif)!important;letter-spacing:-.01em!important}',
  '.marca h1{font-size:20px!important;font-weight:600!important}',
  '.tarjeta-cabeza h2{font-size:18px!important;font-weight:560!important;text-transform:none!important;color:var(--tinta)!important}',
  '*{text-transform:none!important}',
  '.rotulo,.balance .rotulo,.balance-partes .r,small,label{letter-spacing:.01em!important}',
  /* tarjetas sin borde, separadas por el tono */
  '.tarjeta,.balance,.kpi{border:0!important;border-radius:26px!important;box-shadow:none!important;background:var(--hoja)!important}',
  /* el balance, como los saludos de la agenda */
  '.balance{position:relative;overflow:hidden;color:var(--tinta)!important;background:radial-gradient(360px 240px at 100% 0%,color-mix(in srgb,var(--verde) 28%,transparent),transparent 70%),var(--hoja)!important}',
  '.balance::before,.balance::after{display:none!important}',
  '.balance .cantidad{font-weight:560!important;color:var(--tinta)!important}',
  '.balance .cantidad.negativo{color:var(--debe)!important}',
  '.balance .rotulo,.balance .periodo,.balance-partes .r{color:var(--tinta-2)!important}',
  '.balance-partes{border-color:var(--regla-2)!important}',
  /* botones redondos con el acento, sin brillo */
  '.btn-lleno{background:var(--verde)!important;color:var(--papel)!important;border-color:transparent!important;box-shadow:none!important}',
  '.flotante{background:var(--verde)!important;color:var(--papel)!important;border-radius:50%!important;box-shadow:0 8px 24px rgba(0,0,0,.35)!important;border:0!important}',
  '.btn,.control{border-radius:99px!important}',
  'input,select,textarea{border-radius:16px!important}',
  '.segmentado button[aria-pressed="true"]{background:var(--tinta)!important;color:var(--papel)!important;box-shadow:none!important}',
  /* barra de abajo: el activo con el color del acento */
  '.barra-inferior{background:var(--papel)!important;border-top:1px solid var(--regla-2)!important;box-shadow:none!important;backdrop-filter:none!important}',
  '.barra-inferior button[aria-current="page"]{color:var(--tinta)!important}',
  '.barra-inferior button[aria-current="page"] svg{color:var(--verde)!important;background:none!important}',
  '.modal{border-radius:28px 28px 0 0!important;border:0!important}@media (min-width:700px){.modal{border-radius:28px!important}}'
].join('');
/* Los colores de la agenda, tal cual, para vestir al libro */
var VARS_LIBRO = ['--papel','--hoja','--hoja-2','--tinta','--tinta-2','--tinta-3','--regla','--regla-2','--verde','--verde-sube','--verde-piso','--haber','--haber-piso','--debe','--debe-piso','--oro','--oro-piso','--azul','--rosa'];
function varsAgenda(){
  var cs = getComputedStyle(document.documentElement);
  return ':root,:root[data-tema],:root[data-paleta],:root[data-paleta][data-tema]{' + VARS_LIBRO.map(function(v){ return v + ':' + cs.getPropertyValue(v).trim() + '!important'; }).join(';') +
    ';--cifra:var(--letra)!important;--serif:\'Barlow Condensed\',\'Arial Narrow\',sans-serif;color-scheme:' + (document.documentElement.getAttribute('data-tema') === 'claro' ? 'light' : 'dark') + '}';
}
function recargarCuentas(){
  Object.keys(marcos).forEach(function(k){ marcos[k].srcdoc = fuenteLibro(k) + '<!-- ' + Date.now() + ' -->'; });
}

/* ---------- Dinero: los dos libros de un vistazo -----------------------------
   Lo que importa del dinero sin abrir el libro: cuánto va entrando y
   saliendo este mes, si vas mejor o peor que el anterior, en qué se va,
   cuánto te queda del presupuesto, y un formulario para anotar en dos
   segundos. Anotar aquí escribe en el mismo libro (y en su nube, si la
   tiene), así que al abrir el libro el movimiento ya está.            */
var NOM_LIBRO = { personal:'Personal', oficina:'Oficina' };
function libroDatos(cual){
  return movimientos(LIBROS[cual].clave).map(function(t){
    return { id:t.id, date:t.date, desc:t.desc || '', type:t.type === 'Gasto' ? 'Gasto' : 'Ingreso', amount:Math.abs(+t.amount || 0), cat:t.cat || '', libro:cual };
  });
}
function movsDe(sel){ return sel === 'todo' ? libroDatos('personal').concat(libroDatos('oficina')) : libroDatos(sel); }
function totalesMes(lista, ym){
  var r = { ent:0, sal:0, n:0 };
  lista.forEach(function(t){ if(t.date.slice(0, 7) === ym){ r.n++; if(t.type === 'Gasto') r.sal += t.amount; else r.ent += t.amount; } });
  return r;
}
function mesAntes(ym, n){ var d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1 - n, 1); return iso(d).slice(0, 7); }
function presupuesto(sel){
  var p = (db.perfil && db.perfil.presu) || {};
  return sel === 'todo' ? (+p.personal || 0) + (+p.oficina || 0) : (+p[sel] || 0);
}
function pct(a, b){ return b ? Math.round((a - b) / b * 100) : 0; }

VISTAS.dinero = function(){
  var sel = ui.dinLibro || 'todo', hoy = hoyISO(), ym = hoy.slice(0, 7), ymA = mesAntes(ym, 1);
  var lista = movsDe(sel);
  var m = totalesMes(lista, ym);
  var diaMes = deISO(hoy).getDate(), diasMes = new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
  /* Comparar con el mes pasado HASTA EL MISMO DÍA, que es lo justo */
  var aHastaHoy = 0;
  lista.forEach(function(t){ if(t.type === 'Gasto' && t.date.slice(0, 7) === ymA && +t.date.slice(8) <= diaMes) aHastaHoy += t.amount; });
  var dif = pct(m.sal, aHastaHoy);
  var saldo = 0; lista.forEach(function(t){ saldo += t.type === 'Gasto' ? -t.amount : t.amount; });

  var html = '<div class="fichas desliza din-libros">' + [['todo','Los dos'],['personal','🏠 Personal'],['oficina','💼 Oficina']].map(function(o){
    return '<button type="button" class="ficha" data-acc="din-libro" data-v="' + o[0] + '" aria-pressed="' + (sel === o[0]) + '">' + o[1] + '</button>';
  }).join('') + '</div>';

  /* Lo gastado y lo que entró este mes, con sus botones, y el saldo del libro */
  html += bloquesDinero(sel) +
    '<button type="button" class="din-saldo" data-acc="mov-ver" data-v="' + (sel === 'todo' ? 'ambos' : sel) + '"><span>Saldo total ' + (sel === 'todo' ? 'de los dos libros' : 'del libro') + '</span><b class="' + (saldo < 0 ? 'neg' : '') + '">' + (saldo < 0 ? '−' : '') + dinero(Math.abs(saldo)) + '</b>' + ico('i-der') + '</button>';

  html += '<div class="rejilla dos">';

  /* Cómo vas: comparación y presupuesto */
  var pres = presupuesto(sel), ideas = [];
  if(aHastaHoy || m.sal){
    ideas.push(dif > 0 ? '<b class="sale">▲ ' + dif + '%</b> más gasto que el mes pasado a estas alturas (' + dinero(aHastaHoy) + ').'
             : dif < 0 ? '<b class="entra">▼ ' + (-dif) + '%</b> menos gasto que el mes pasado a estas alturas (' + dinero(aHastaHoy) + ').'
             : 'Gastas lo mismo que el mes pasado a estas alturas.');
  }
  var mayor = null;
  lista.forEach(function(t){ if(t.type === 'Gasto' && t.date.slice(0, 7) === ym && (!mayor || t.amount > mayor.amount)) mayor = t; });
  if(mayor) ideas.push('Tu mayor gasto del mes: <b>' + esc(mayor.desc || mayor.cat || 'sin descripción') + '</b>, ' + dinero(mayor.amount) + '.');
  var ritmo = diaMes ? m.sal / diaMes * diasMes : 0;
  if(m.sal) ideas.push('A este ritmo cerrarás el mes con unos <b>' + dinero(ritmo) + '</b> de gasto.');
  var presHTML = '';
  if(pres){
    var usado = Math.min(1, m.sal / pres), queda = pres - m.sal, porDia = queda > 0 ? queda / (diasMes - diaMes + 1) : 0;
    var estado = m.sal > pres ? 'mal' : ritmo > pres ? 'ojo' : 'bien';
    presHTML = '<div class="presu ' + estado + '"><div class="presu-cab"><span>Presupuesto de gasto</span><b>' + dinero(m.sal) + ' / ' + dinero(pres) + '</b></div>' +
      '<div class="barra-prog"><i style="width:' + (usado * 100).toFixed(1) + '%"></i><em style="left:' + (diaMes / diasMes * 100).toFixed(1) + '%" title="Hoy"></em></div>' +
      '<small>' + (queda >= 0 ? 'Te quedan <b>' + dinero(queda) + '</b>: unos ' + dinero(porDia) + ' por día hasta fin de mes.' : 'Te pasaste por <b>' + dinero(-queda) + '</b>.') +
      (estado === 'ojo' ? ' A este ritmo te pasarás.' : '') + '</small></div>';
  }
  html += '<section class="tarjeta">' + cabTarjeta('i-diana', 'Cómo vas este mes', 'var(--oro)', pres ? 'Presupuesto' : 'Poner presupuesto', 'data-acc="presu-ed"') +
    '<div class="tarjeta-cuerpo">' + presHTML +
    (ideas.length ? '<ul class="ideas">' + ideas.map(function(i){ return '<li>' + i + '</li>'; }).join('') + '</ul>'
                  : '<div class="vacio" style="padding:8px 0">Anota tus movimientos y aquí verás cómo vas: comparación con el mes pasado, tu mayor gasto y hacia dónde vas.</div>') +
    '</div></section>';

  html += tarjetaSemanaGasto(lista, hoy);

  /* En qué se va: cada categoría lleva a sus movimientos */
  var porCat = {};
  lista.forEach(function(t){ if(t.type === 'Gasto' && t.date.slice(0, 7) === ym){ var c = t.cat || 'Sin categoría'; porCat[c] = (porCat[c] || 0) + t.amount; } });
  var catL = Object.keys(porCat).sort(function(x, y){ return porCat[y] - porCat[x]; });
  html += '<section class="tarjeta">' + cabTarjeta('i-listas', 'En qué se va este mes', 'var(--debe)') +
    (catL.length ? '<div class="cats-din">' + catL.slice(0, 7).map(function(c, i){
      var p = m.sal ? porCat[c] / m.sal : 0;
      return '<button type="button" class="barra-h cat-fila" style="--c:' + ['var(--debe)','var(--oro)','var(--azul)','var(--rosa)','var(--verde)','var(--haber)','var(--tinta-3)'][i] + '" data-acc="mov-ver" data-v="' + (sel === 'todo' ? 'ambos' : sel) + '" data-cat="' + esc(c) + '"><span>' + esc(c) + '</span>' +
        '<div class="barra-prog"><i style="width:' + (p * 100).toFixed(1) + '%;background:var(--c)"></i></div><b>' + dinero(porCat[c]) + '</b></button>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:4px">Sin gastos este mes todavía.</div>') + '</section>';

  /* Últimos movimientos: se tocan para editarlos, ↻ los repite hoy */
  var ult = lista.slice().sort(function(x, y){ return y.date.localeCompare(x.date) || String(y.id).localeCompare(String(x.id)); }).slice(0, 5);
  html += '<section class="tarjeta">' + cabTarjeta('i-reloj', 'Últimos movimientos', 'var(--verde)', 'Ver todos', 'data-acc="mov-ver" data-v="' + (sel === 'todo' ? 'ambos' : sel) + '"') +
    (ult.length ? '<div class="lista-filas">' + ult.map(function(t){ return filaMov(t, sel === 'todo', false); }).join('') + '</div>' : '<div class="vacio">Aún no hay movimientos.</div>') + '</section>';

  /* Últimos 6 meses */
  var meses = [], maxV = 1;
  for(var i = 5; i >= 0; i--){ var y = mesAntes(ym, i), tt = totalesMes(lista, y); meses.push({ ym:y, t:tt }); maxV = Math.max(maxV, tt.ent, tt.sal); }
  html += '<section class="tarjeta">' + cabTarjeta('i-grafica', 'Últimos 6 meses', 'var(--azul)') +
    '<div class="tarjeta-cuerpo"><div class="meses-graf">' + meses.map(function(x){
      var he = x.t.ent / maxV * 100, hs = x.t.sal / maxV * 100;
      return '<button type="button" class="mes-col' + (x.ym === ym ? ' actual' : '') + '" data-acc="mov-ver" data-v="' + (sel === 'todo' ? 'ambos' : sel) + '" data-mes="' + x.ym + '" title="' + cap(MESES[+x.ym.slice(5, 7) - 1]) + ': entró ' + dinero(x.t.ent) + ', salió ' + dinero(x.t.sal) + '">' +
        '<div class="par"><i class="e" style="height:' + (x.t.ent ? Math.max(3, he) : 0) + '%"></i><i class="s" style="height:' + (x.t.sal ? Math.max(3, hs) : 0) + '%"></i></div>' +
        '<small>' + MESES3[+x.ym.slice(5, 7) - 1] + '</small><b class="' + (x.t.ent - x.t.sal < 0 ? 'neg' : '') + '">' + (x.t.n ? (x.t.ent - x.t.sal < 0 ? '−' : '+') + formNum(Math.round(Math.abs(x.t.ent - x.t.sal))) : '—') + '</b></button>';
    }).join('') + '</div><div class="leyenda-graf"><span><i class="e"></i>Entró</span><span><i class="s"></i>Salió</span><span>Debajo: lo que quedó</span></div></div></section>';

  html += tarjetaRepetidos(lista, ym);
  /* Los informes (PDF y Excel), al final: están, pero no mandan */
  return html + '</div><div style="margin-top:16px">' + tarjetaInformes() + '</div>';
};

/* ---------- Agenda: el día, con sus tareas, eventos, avisos y pagos -------- */
VISTAS.agenda = function(){
  var hoy = hoyISO(), dia = ui.agDia || hoy, ini = inicioSemana(dia);
  ui.calSel = dia; ui.calMes = dia.slice(0, 7);
  var html = '<div class="ag-semana"><button type="button" class="btn-icono" data-acc="ag-sem" data-n="-7" aria-label="Semana anterior">' + ico('i-izq') + '</button><div class="ag-dias">' +
    [0,1,2,3,4,5,6].map(function(i){
      var d = sumarDias(ini, i), n = itemsDelDia(d).filter(function(x){ return !x.hecho; }).length;
      return '<button type="button" class="' + (d === hoy ? 'hoy ' : '') + (d === dia ? 'sel' : '') + '" data-acc="ag-dia" data-dia="' + d + '"><small>' + DIAS3[deISO(d).getDay()] + '</small><b>' + deISO(d).getDate() + '</b><i>' + (n ? '•'.repeat(Math.min(n, 3)) : '') + '</i></button>';
    }).join('') + '</div><button type="button" class="btn-icono" data-acc="ag-sem" data-n="7" aria-label="Semana siguiente">' + ico('i-der') + '</button></div>';
  html += '<div class="ag-cab"><h2>' + (dia === hoy ? 'Hoy' : cap(relativo(dia))) + '</h2><span>' + cap(fechaLarga(dia)) + '</span>' +
    (dia !== hoy ? '<button type="button" class="ficha" data-acc="ag-dia" data-dia="' + hoy + '">Ir a hoy</button>' : '') + '</div>';

  var its = itemsDelDia(dia).filter(function(x){ return x.tipo !== 'feriado'; });
  var atras = dia === hoy ? vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha < hoy; }).sort(ordenTareas) : [];
  if(atras.length){
    html += '<section class="ag-bloque"><h3 class="ag-h"><span class="tarde">Atrasadas</span><b>' + atras.length + '</b><button type="button" class="ag-link" data-acc="t-atrasadas-hoy">Pasar a hoy</button></h3>' +
      '<div class="lista-filas">' + atras.slice(0, 6).map(filaTarea).join('') + '</div>' +
      (atras.length > 6 ? '<button type="button" class="ag-mas" data-acc="ag-tareas" data-v="hoy">Ver las ' + atras.length + '</button>' : '') + '</section>';
  }
  var sinHora = its.filter(function(x){ return !x.hora; }), conHora = its.filter(function(x){ return x.hora; }).sort(function(a, b){ return a.hora.localeCompare(b.hora); });
  if(sinHora.length) html += '<section class="ag-bloque ag-sin-hora"><h3 class="ag-h"><span>Sin hora</span><b>' + sinHora.length + '</b></h3><div class="lista-filas">' + sinHora.map(function(x){ return filaAgenda(x, dia).replace('<span class="hora">—</span>', ''); }).join('') + '</div></section>';
  if(conHora.length) html += '<section class="ag-bloque"><h3 class="ag-h"><span>Por horas</span><b>' + conHora.length + '</b></h3><div class="lista-filas">' + conHora.map(function(x){ return filaAgenda(x, dia); }).join('') + '</div></section>';
  if(!sinHora.length && !conHora.length && !atras.length) html += '<div class="ag-vacio">' + vacio('🌿', 'Día libre', 'No tienes nada agendado para este día.') + '</div>';
  html += '<div class="ag-anadir">' +
    '<button type="button" class="btn" data-acc="cal-nuevo" data-tipo="tarea" data-dia="' + dia + '">' + ico('i-plus') + 'Tarea</button>' +
    '<button type="button" class="btn" data-acc="cal-nuevo" data-tipo="evento" data-dia="' + dia + '">' + ico('i-plus') + 'Evento</button>' +
    '<button type="button" class="btn" data-acc="cal-nuevo" data-tipo="rec" data-dia="' + dia + '">' + ico('i-plus') + 'Aviso</button></div>';
  var sf = vivos('tareas').filter(function(t){ return !t.hecha && !t.fecha; }).length;
  if(sf) html += '<button type="button" class="ag-sinfecha" data-acc="ag-tareas" data-v="algun"><span>' + ico('i-tareas') + sf + (sf === 1 ? ' tarea sin fecha' : ' tareas sin fecha') + '</span>' + ico('i-der') + '</button>';
  return html;
};

/* ==========================================================================
   PANELES DE INICIO
   Agenda, Dinero, Notas y Más abren un panel de mosaicos grandes: cada uno
   dice para qué sirve y lo que tiene ahora. Al tocarlo entras a su pantalla;
   arriba de esa pantalla, «‹ Agenda» (o el que sea) te devuelve al panel.
   ========================================================================== */
var NOM_PANEL = { 'panel-agenda':'Agenda', 'panel-dinero':'Dinero', 'panel-notas':'Notas', 'panel-mas':'Más' };
function volverPanel(v){
  var p = panelDe(v);
  if(!p) return '';
  return '<button type="button" class="volver-panel" data-ir="' + p + '">' + ico('i-izq') + NOM_PANEL[p] + '</button>';
}
/* Un mosaico: icono en su color, nombre, para qué sirve y el dato de ahora */
function mosaico(o){
  if(o.ir && secOculta(o.ir)) return '';   // lo que ocultaste en «Administrar secciones» tampoco sale aquí
  return '<button type="button" class="mosaico' + (o.ancho ? ' ancho' : '') + (o.alerta ? ' alerta' : '') + '" ' + (o.acc || 'data-ir="' + o.ir + '"') + ' style="--mc:' + o.c + '">' +
    '<span class="mo-ico">' + (o.em ? '<span class="mo-em">' + o.em + '</span>' : ico(o.i)) + '</span>' +
    '<span class="mo-txt"><b>' + o.t + '</b><small>' + o.d + '</small></span>' +
    (o.n != null ? '<span class="mo-dato"><strong>' + o.n + '</strong>' + (o.nl ? '<em>' + o.nl + '</em>' : '') + '</span>' : '') +
    '<span class="mo-flecha">' + ico('i-der') + '</span></button>';
}
function cabPanel(t, sub, acciones){
  return '<header class="panel-cab"><h2>' + t + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>' +
    (acciones ? '<div class="panel-acciones">' + acciones + '</div>' : '');
}
function accPanel(txt, attrs, clase){ return '<button type="button" class="btn ' + (clase || '') + '" ' + attrs + '>' + ico('i-plus') + txt + '</button>'; }

VISTAS['panel-agenda'] = function(){
  var hoy = hoyISO(), k = contadores();
  var pendHoy = itemsDelDia(hoy).filter(function(x){ return !x.hecho; }).length;
  var ne = 0; for(var i = 0; i < 7; i++) ne += itemsDelDia(sumarDias(hoy, i)).filter(function(x){ return x.tipo === 'evento' || x.tipo === 'clase'; }).length;
  var tHoy = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; }).length;
  var recHoy = vivos('recordatorios').filter(function(r){ return !r.hecho && r.fecha === hoy; }).length;
  var pa = proyectosActivos().length;
  return cabPanel('Agenda', cap(fechaLarga(hoy)) + ' · ' + pendHoy + (pendHoy === 1 ? ' cosa pendiente hoy' : ' cosas pendientes hoy'),
      accPanel('Tarea', 'data-acc="nuevo" data-tipo="tarea"', 'primario') + accPanel('Evento', 'data-acc="nuevo" data-tipo="evento"') + accPanel('Aviso', 'data-acc="nuevo" data-tipo="rec"')) +
    '<div class="mosaicos">' +
      mosaico({ ir:'agenda', i:'i-hoy', c:'#2E6BFF', t:'Mi día', d:'Todo lo de un día junto: tareas, eventos y avisos', n:pendHoy, nl:'para hoy', ancho:true }) +
      mosaico({ ir:'calendario', i:'i-cal', c:'#30D158', t:'Calendario', d:'Tu mes, semana o año de un vistazo', n:ne, nl:'en 7 días' }) +
      mosaico({ ir:'tareas', i:'i-tareas', c:'#FFD60A', t:'Tareas', d:'Lo que tienes que hacer', n:tHoy, nl:k.tareasTarde ? k.tareasTarde + ' atrasadas' : 'para hoy', alerta:!!k.tareasTarde }) +
      mosaico({ ir:'recordatorios', i:'i-campana', c:'#FF9F0A', t:'Avisos', d:'Lo que no se te puede olvidar', n:k.recordatorios || recHoy, nl:k.recordatorios ? 'pasados' : 'para hoy', alerta:!!k.recordatorios }) +
      mosaico({ ir:'proyectos', i:'i-carpeta', c:'#BF5AF2', t:'Proyectos', d:'Metas grandes paso a paso', n:pa, nl:pa === 1 ? 'activo' : 'activos' }) +
    '</div>';
};
VISTAS['panel-dinero'] = function(){
  var ym = hoyISO().slice(0, 7), todo = movsDe('todo'), tm = totalesMes(todo, ym);
  var nMes = todo.filter(function(t){ return t.date.slice(0, 7) === ym; }).length;
  var np = 0, pend = 0;
  vivos('pagos').forEach(function(p){ if(p.activo === false || (p.desde && ym < p.desde)) return; if(!pagado(p, ym)){ np++; pend += +p.monto || 0; } });
  var queda = tm.ent - tm.sal;
  return cabPanel('Dinero', cap(MESES[+ym.slice(5, 7) - 1]) + ': te queda ' + (queda < 0 ? '−' : '') + dinero(Math.abs(queda)),
      accPanel('Gasto', 'data-acc="din-anotar" data-libro="personal" data-t="Gasto"', 'primario') + accPanel('Ingreso', 'data-acc="din-anotar" data-libro="personal" data-t="Ingreso"', 'btn-ingreso')) +
    '<div class="mosaicos">' +
      mosaico({ ir:'dinero', i:'i-grafica', c:'#2E6BFF', t:'Resumen del mes', d:'Cuánto entró, cuánto salió, en qué se va y cómo vas', n:dinero(tm.sal), nl:'gastado', ancho:true }) +
      mosaico({ ir:'movimientos', i:'i-cuentas', c:'#30D158', t:'Movimientos', d:'Cada gasto e ingreso, para ver o corregir', n:nMes, nl:'este mes' }) +
      mosaico({ ir:'pagos', i:'i-recibo', c:'#FF453A', t:'Pagos fijos', d:'Luz, internet, alquiler…', n:np, nl:np ? dinero(pend) + ' por pagar' : 'todo pagado', alerta:!!k0Pagos() }) +
      mosaico({ acc:'data-acc="mov-ver" data-v="personal"', i:'i-casa', c:'#5AA9FF', t:'Libro personal', d:'Tus gastos personales', n:dinero(totalesMes(movsDe('personal'), ym).sal), nl:'gastado' }) +
      mosaico({ acc:'data-acc="mov-ver" data-v="oficina"', i:'i-maletin', c:'#94A3B8', t:'Libro de la oficina', d:'Cuentas de la oficina', n:dinero(totalesMes(movsDe('oficina'), ym).ent), nl:'facturado' }) +
    '</div>';
};
function k0Pagos(){ return pagosProximos(0).length; }
VISTAS['panel-notas'] = function(){
  var ns = vivos('notas'), ls = vivos('listas'), fij = ns.filter(function(n){ return n.fija; }).length;
  var porMarcar = ls.reduce(function(a, l){ return a + (l.items || []).filter(function(i){ return !i.ok; }).length; }, 0);
  return cabPanel('Notas', ns.length + (ns.length === 1 ? ' nota' : ' notas') + ' y ' + ls.length + (ls.length === 1 ? ' lista' : ' listas'),
      accPanel('Nota', 'data-acc="nuevo" data-tipo="nota"', 'primario') + accPanel('Lista', 'data-acc="nuevo" data-tipo="lista"')) +
    '<div class="mosaicos">' +
      mosaico({ ir:'notas', i:'i-notas', c:'#FFD60A', t:'Notas', d:'Ideas, datos y apuntes; con casillas si quieres', n:ns.length, nl:fij ? fij + ' fijadas' : 'notas' }) +
      mosaico({ ir:'listas', i:'i-listas', c:'#30D158', t:'Listas', d:'Compras, bolso, pendientes para marcar', n:porMarcar, nl:'por marcar' }) +
    '</div>';
};
VISTAS['panel-mas'] = function(){
  var hoy = hoyISO(), wd = new Date().getDay();
  var hab = vivos('habitos').filter(function(x){ return !x.dias || x.dias.indexOf(wd) >= 0; }), habOk = hab.filter(function(x){ return x.marcas && x.marcas[hoy]; }).length;
  var escritos = vivos('diario').filter(function(e){ return e.id.slice(0, 7) === hoy.slice(0, 7) && e.texto; }).length;
  var html = cabPanel('Más', 'Tus espacios, hábitos y ajustes');
  html += '<h3 class="panel-sub">Tus espacios</h3><div class="mosaicos">' + ESPACIOS.map(function(E){
    var n = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoy && espDe(t) === E.id; }).length;
    return mosaico({ ir:'esp-' + E.id, em:E.em, c:E.c, t:E.nom, d:E.lema, n:n, nl:'para hoy' });
  }).join('') + '</div>';
  html += '<h3 class="panel-sub">Constancia</h3><div class="mosaicos">' +
    mosaico({ ir:'habitos', i:'i-habitos', c:'#FF9F0A', t:'Hábitos', d:'Lo que haces cada día y tus rachas', n:habOk + '/' + hab.length, nl:'hoy' }) +
    mosaico({ ir:'metas', i:'i-meta', c:'#FFD60A', t:'Metas', d:'Ahorrar, leer, entrenar… y cuánto falta', n:vivos('metas').length, nl:'metas' }) +
    mosaico({ ir:'diario', i:'i-diario', c:'#FF6482', t:'Diario', d:'Cuenta tu día en un par de líneas', n:escritos, nl:'días este mes' }) +
  '</div>';
  html += '<h3 class="panel-sub">Ajustes y herramientas</h3><div class="panel-lista">' +
    [['ajustes', 'i-ajustes', 'Ajustes', 'Tu nombre, apariencia, avisos, nube y respaldos'], ['acc:buscar', 'i-buscar', 'Buscar', 'En todo lo que tienes'],
     ['acc:personalizar-hoy', 'i-hoy', 'Elegir qué ver en Hoy', 'Muestra u oculta bloques'], ['secciones', 'i-espacios', 'Administrar secciones', 'Orden y secciones del menú'],
     ['papelera', 'i-basura', 'Papelera', enPapelera().length ? enPapelera().length + ' cosas borradas' : 'Vacía']].map(function(x){
      var at = x[0].indexOf('acc:') === 0 ? 'data-acc="' + x[0].slice(4) + '"' : 'data-ir="' + x[0] + '"';
      return '<button type="button" class="pl-fila" ' + at + '>' + ico(x[1]) + '<span><b>' + x[2] + '</b><small>' + x[3] + '</small></span>' + ico('i-der') + '</button>';
    }).join('') + '</div>';
  return html;
};

/* Una fila de movimiento: se toca para editar */
function filaMov(t, conLibro, conRepetir){
  var g = t.type === 'Gasto';
  return '<div class="fila mov" data-busca="' + esc(sinTildes(((t.desc || '') + ' ' + (t.cat || '') + ' ' + t.amount).toLowerCase())) + '"><span class="mov-ico ' + (g ? 'g' : 'i') + '">' + ico(g ? 'i-bajar' : 'i-subir') + '</span>' +
    '<div class="cuerpo" data-acc="mov-ed" data-libro="' + t.libro + '" data-id="' + esc(String(t.id)) + '"><div class="titulo">' + esc(t.desc || t.cat || (g ? 'Gasto' : 'Ingreso')) + '</div>' +
    '<div class="meta"><span>' + relativo(t.date) + '</span>' + (t.cat ? '<span class="etiqueta">' + esc(t.cat) + '</span>' : '') + (conLibro ? '<span title="' + NOM_LIBRO[t.libro] + '">' + (t.libro === 'oficina' ? '💼' : '🏠') + '</span>' : '') + '</div></div>' +
    '<span class="monto" style="color:' + (g ? 'var(--debe)' : 'var(--haber)') + '">' + (g ? '−' : '+') + dinero(t.amount) + '</span>' +
    (conRepetir ? '<button class="btn-icono repetir-mov" data-acc="mov-repetir" data-libro="' + t.libro + '" data-id="' + esc(String(t.id)) + '" title="Repetir hoy" aria-label="Repetir hoy">' + ico('i-rep') + '</button>' : '') + '</div>';
}

/* ---------- Movimientos: los dos libros, dentro de la agenda --------------- */
VISTAS.movimientos = function(){
  var lib = ui.movLibro || 'personal', hoy = hoyISO(), mesHoy = hoy.slice(0, 7), mes = ui.movMes || mesHoy, tipo = ui.movTipo || 'todo', cat = ui.movCat || '';
  var todos = movsDe(lib === 'ambos' ? 'todo' : lib);
  var delPer = mes === 'todo' ? todos : todos.filter(function(t){ return t.date.slice(0, 7) === mes; });
  var ent = 0, sal = 0;
  delPer.forEach(function(t){ if(t.type === 'Gasto') sal += t.amount; else ent += t.amount; });
  var lista = delPer.filter(function(t){ return (tipo === 'todo' || (tipo === 'g') === (t.type === 'Gasto')) && (!cat || (t.cat || 'Sin categoría') === cat); })
    .sort(function(a, b){ return b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)); });
  var libAnotar = lib === 'oficina' ? 'oficina' : 'personal';

  var html = '<div class="fichas desliza din-libros">' + [['personal','🏠 Personal'],['oficina','💼 Oficina'],['ambos','Los dos']].map(function(o){
    return '<button type="button" class="ficha" data-acc="mov-libro" data-v="' + o[0] + '" aria-pressed="' + (lib === o[0]) + '">' + o[1] + '</button>';
  }).join('') + '</div>';

  /* El mes, con flechas, o todo el libro */
  html += '<div class="mov-mes">' +
    '<button type="button" class="btn-icono" data-acc="mov-mes" data-n="-1" aria-label="Mes anterior"' + (mes === 'todo' ? ' disabled' : '') + '>' + ico('i-izq') + '</button>' +
    '<b>' + (mes === 'todo' ? 'Todo el libro' : cap(MESES[+mes.slice(5, 7) - 1]) + ' ' + mes.slice(0, 4)) + '</b>' +
    '<button type="button" class="btn-icono" data-acc="mov-mes" data-n="1" aria-label="Mes siguiente"' + (mes === 'todo' || mes >= mesHoy ? ' disabled' : '') + '>' + ico('i-der') + '</button>' +
    '<button type="button" class="ficha" data-acc="mov-mes" data-n="' + (mes === 'todo' ? 'hoy' : 'todo') + '">' + (mes === 'todo' ? 'Este mes' : 'Todo') + '</button></div>';

  html += '<div class="mov-cifras"><div class="entra"><small>Entró</small><b>' + dinero(ent) + '</b></div><div class="sale"><small>Salió</small><b>' + dinero(sal) + '</b></div>' +
    '<div class="' + (ent - sal < 0 ? 'sale' : '') + '"><small>Quedó</small><b>' + (ent - sal < 0 ? '−' : '') + dinero(Math.abs(ent - sal)) + '</b></div></div>';

  html += '<div class="mov-anotar"><button class="btn primario" data-acc="din-anotar" data-libro="' + libAnotar + '" data-t="Gasto">' + ico('i-plus') + 'Gasto</button>' +
    '<button class="btn btn-ingreso" data-acc="din-anotar" data-libro="' + libAnotar + '" data-t="Ingreso">' + ico('i-plus') + 'Ingreso</button></div>';

  html += '<div class="mov-filtros"><div class="selector mov-tipo">' + [['todo','Todos'],['g','Gastos'],['i','Ingresos']].map(function(o){
      return '<button type="button" data-acc="mov-tipo" data-v="' + o[0] + '" aria-pressed="' + (tipo === o[0]) + '">' + o[1] + '</button>';
    }).join('') + '</div>' +
    '<input class="entrada" id="buscaMov" type="search" placeholder="Buscar…" autocomplete="off"></div>' +
    (cat ? '<button type="button" class="ficha mov-cat-activa" data-acc="mov-cat" data-v="">Categoría: ' + esc(cat) + ' ✕</button>' : '');

  if(!lista.length){
    html += '<section class="tarjeta">' + vacio(todos.length ? '🔎' : '💸', todos.length ? 'Nada por aquí' : 'Aún no hay movimientos', todos.length ? 'No hay movimientos con estos filtros en este periodo.' : 'Anota tu primer gasto o ingreso con los botones de arriba.') + '</section>';
    return html;
  }
  /* Agrupados por día, con lo que quedó ese día */
  var dias = [], porDia = {};
  lista.slice(0, 400).forEach(function(t){ if(!porDia[t.date]){ porDia[t.date] = []; dias.push(t.date); } porDia[t.date].push(t); });
  html += '<div id="listaMovs">' + dias.map(function(d){
    var neto = porDia[d].reduce(function(a, t){ return a + (t.type === 'Gasto' ? -t.amount : t.amount); }, 0);
    return '<section class="tarjeta mov-dia"><div class="mov-dia-cab"><b>' + cap(fechaLarga(d)) + '</b><span class="' + (neto < 0 ? 'sale' : 'entra') + '">' + (neto < 0 ? '−' : '+') + dinero(Math.abs(neto)) + '</span></div>' +
      '<div class="lista-filas">' + porDia[d].map(function(t){ return filaMov(t, lib === 'ambos', false); }).join('') + '</div></section>';
  }).join('') + '</div>' +
  (lista.length > 400 ? '<p class="explica-t" style="text-align:center">Se muestran los 400 más recientes. Usa el buscador o elige un mes.</p>' : '');
  return html;
};
/* El buscador de movimientos filtra sin repintar */
document.addEventListener('input', function(ev){
  if(!ev.target || ev.target.id !== 'buscaMov') return;
  var q = sinTildes(ev.target.value.trim().toLowerCase());
  document.querySelectorAll('#listaMovs .mov-dia').forEach(function(sec){
    var vis = 0;
    sec.querySelectorAll('.fila.mov').forEach(function(f){ var ok = !q || (f.dataset.busca || '').indexOf(q) >= 0; f.style.display = ok ? '' : 'none'; if(ok) vis++; });
    sec.style.display = vis ? '' : 'none';
  });
});

/* Lo que hay guardado en un libro, tal cual */
function libroCrudo(cual){
  var raw = leerJSON(LIBROS[cual].clave, null);
  return raw && Array.isArray(raw.transactions) ? raw.transactions : (Array.isArray(raw) ? raw : []);
}
/* Editor de un movimiento: monto, tipo, en qué, categoría, fecha y libro */
function editarMovimiento(cual, id, preset){
  var o = null;
  if(id){ o = libroCrudo(cual).find(function(x){ return String(x.id) === String(id); }); if(!o){ aviso('Ese movimiento ya no está', 'Quizá se borró en otro aparato.'); pintar(); return; } }
  var t = o ? { date:o.date, desc:o.desc || '', type:o.type === 'Gasto' ? 'Gasto' : 'Ingreso', amount:Math.abs(+o.amount || 0), cat:o.cat || '' }
            : Object.assign({ date:hoyISO(), desc:'', type:'Gasto', amount:'', cat:'' }, preset || {});
  var usadas = {};
  ['personal', 'oficina'].forEach(function(l){ libroDatos(l).forEach(function(x){ if(x.cat) usadas[x.cat] = (usadas[x.cat] || 0) + 1; }); });
  var cats = Object.keys(usadas).sort(function(a, b){ return usadas[b] - usadas[a]; }).concat(CATS_BASE, ['Sueldo', 'Ventas', 'Cobro']).filter(function(c, i, arr){ return arr.indexOf(c) === i; });
  abrirFlotante(cabFlot(id ? 'Movimiento' : 'Nuevo movimiento') +
    '<form class="form" id="formEd" autocomplete="off">' +
      grupo('Tipo', selector('movTipoEd', [{ v:'Gasto', n:'💸 Gasto' }, { v:'Ingreso', n:'💰 Ingreso' }], t.type)) +
      '<div class="fila-campos">' + campo('Monto (' + MONEDA + ')', '<input name="monto" inputmode="decimal" required value="' + (t.amount || '') + '" placeholder="0.00">') +
        campo('Fecha', '<input type="date" name="fecha" value="' + esc(t.date) + '">') + '</div>' +
      campo('En qué', '<input name="desc" maxlength="160" value="' + esc(t.desc) + '" placeholder="Ej. Almuerzo, taxi, sueldo">') +
      campo('Categoría', '<input name="cat" maxlength="40" list="movCats" value="' + esc(t.cat) + '" placeholder="Opcional"><datalist id="movCats">' + cats.map(function(c){ return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>') +
      '<div class="chips-cat">' + cats.slice(0, 8).map(function(c){ return '<button type="button" class="ficha" data-ed="cat" data-v="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</div>' +
      grupo('Libro', selector('movLibroEd', [{ v:'personal', n:'🏠 Personal' }, { v:'oficina', n:'💼 Oficina' }], cual)) +
      botonesEd(!!id, id ? '<button type="button" class="btn" data-ed="repetir">' + ico('i-rep') + 'Repetir hoy</button>' : '') +
    '</form>');
  var f = $('formEd');
  if(!id) setTimeout(function(){ f.monto.focus(); }, 60);
  f.onsubmit = function(ev){
    ev.preventDefault();
    var v = String(f.monto.value || '').replace(/−/g, '-').replace(/,/g, '.');
    if(/\d[+\-]/.test(v)){ var tot = 0; (v.match(/[+\-]?[\d.]+/g) || []).forEach(function(x){ tot += parseFloat(x) || 0; }); v = String(tot); }
    var monto = Math.round(Math.abs(num(v)) * 100) / 100;
    if(!monto){ f.monto.focus(); aviso('Falta el monto'); return; }
    var tipo = leerSelector('movTipoEd') || t.type, dest = leerSelector('movLibroEd') || cual;
    var datos = { date:/^\d{4}-\d{2}-\d{2}$/.test(f.fecha.value) ? f.fecha.value : hoyISO(), desc:f.desc.value.trim() || f.cat.value.trim() || tipo, type:tipo, amount:monto, cat:f.cat.value.trim().slice(0, 40) };
    if(id && dest === cual) cambiarLibro(cual, function(l){ return l.map(function(x){ return String(x.id) === String(id) ? Object.assign({}, x, datos) : x; }); });
    else {
      if(id) cambiarLibro(cual, function(l){ return l.filter(function(x){ return String(x.id) !== String(id); }); });
      cambiarLibro(dest, function(l){ return l.concat([Object.assign({}, o || {}, datos, { id:o ? o.id : nid() })]); });
    }
    cerrarFlotante(); pintar(); vibrar(12);
    aviso(id ? 'Movimiento guardado' : (tipo === 'Gasto' ? '💸 ' : '💰 ') + dinero(monto), datos.desc + (dest !== cual && id ? ' · pasó a ' + NOM_LIBRO[dest] : ''));
  };
  edAcciones = {
    cat: function(b){ f.cat.value = b.dataset.v; },
    borrar: function(){
      var copia = o;
      cerrarFlotante();
      cambiarLibro(cual, function(l){ return l.filter(function(x){ return String(x.id) !== String(id); }); });
      pintar();
      aviso('Movimiento borrado', (copia.desc || '') + ' · ' + dinero(Math.abs(+copia.amount || 0)), 'Deshacer', function(){ cambiarLibro(cual, function(l){ return l.concat([copia]); }); pintar(); });
    },
    repetir: function(){
      var c = Object.assign({}, o, { id:nid(), date:hoyISO() });
      cerrarFlotante(); cambiarLibro(cual, function(l){ return l.concat([c]); }); pintar();
      aviso('↻ Repetido hoy: ' + dinero(Math.abs(+c.amount || 0)), c.desc || null, 'Deshacer', function(){ cambiarLibro(cual, function(l){ return l.filter(function(x){ return x.id !== c.id; }); }); pintar(); });
    }
  };
}

/* Esta semana, día por día, contra la semana pasada a la misma altura */
function tarjetaSemanaGasto(lista, hoy){
  var ini = inicioSemana(hoy), iniA = sumarDias(ini, -7), dias = diasEntre(ini, hoy);
  var porDia = [0,0,0,0,0,0,0], eti = [], esta = 0, pasada = 0;
  for(var i = 0; i < 7; i++) eti.push(DIAS3[deISO(sumarDias(ini, i)).getDay()]);
  lista.forEach(function(t){
    if(t.type !== 'Gasto') return;
    var k = diasEntre(ini, t.date);
    if(k >= 0 && k < 7){ porDia[k] += t.amount; if(k <= dias) esta += t.amount; }
    var kA = diasEntre(iniA, t.date);
    if(kA >= 0 && kA <= dias) pasada += t.amount;
  });
  var dif = pct(esta, pasada), prom = esta / (dias + 1);
  if(!esta && !pasada) return '';
  return '<section class="tarjeta">' + cabTarjeta('i-cal', 'Esta semana', 'var(--azul)') +
    '<div class="tarjeta-cuerpo"><div class="sem-gasto-num"><div><small>Gastado</small><b>' + dinero(esta) + '</b></div><div><small>Por día</small><b>' + dinero(prom) + '</b></div>' +
      '<div><small>vs. semana pasada</small><b class="' + (dif > 0 ? 'sale' : dif < 0 ? 'entra' : '') + '">' + (pasada ? (dif > 0 ? '▲ ' : dif < 0 ? '▼ ' : '') + Math.abs(dif) + '%' : '—') + '</b></div></div>' +
      barras(porDia.map(function(v){ return Math.round(v); }), eti, 'var(--debe)', 110) + '</div></section>';
}
/* Gastos que vuelven cada mes: candidatos a pago fijo */
function claveMov(t){ return sinTildes(String(t.desc || '').toLowerCase()).replace(/[^a-z0-9ñ ]/g, '').replace(/\s+/g, ' ').trim(); }
function tarjetaRepetidos(lista, ym){
  var desde = mesAntes(ym, 3), g = {};
  lista.forEach(function(t){
    if(t.type !== 'Gasto' || t.date.slice(0, 7) < desde) return;
    var k = claveMov(t); if(k.length < 3) return;
    var x = g[k] = g[k] || { t:t, meses:{}, total:0, n:0 };
    x.meses[t.date.slice(0, 7)] = 1; x.total += t.amount; x.n++;
  });
  var fijos = vivos('pagos').map(function(p){ return claveMov({ desc:p.t }); });
  var rep = Object.keys(g).filter(function(k){ return Object.keys(g[k].meses).length >= 3 && fijos.indexOf(k) < 0; })
    .map(function(k){ var x = g[k]; x.mes = x.total / Object.keys(x.meses).length; return x; })
    .sort(function(a, b){ return b.mes - a.mes; }).slice(0, 4);
  if(!rep.length) return '';
  return '<section class="tarjeta">' + cabTarjeta('i-rep', 'Se repiten cada mes', 'var(--oro)') +
    '<p class="explica-t">Gastos que aparecen mes a mes. Hazlos pago fijo y la agenda te avisará antes.</p>' +
    '<div class="lista-filas">' + rep.map(function(x){
      return '<div class="fila"><div class="cuerpo"><div class="titulo">' + esc(x.t.desc) + '</div><div class="meta"><span>~' + dinero(x.mes) + ' al mes</span><span>' + Object.keys(x.meses).length + ' meses seguidos</span>' + (x.t.cat ? '<span class="etiqueta">' + esc(x.t.cat) + '</span>' : '') + '</div></div>' +
        '<button class="btn chico" data-acc="hacer-fijo" data-t="' + esc(x.t.desc) + '" data-m="' + Math.round(x.mes * 100) / 100 + '" data-cat="' + esc(x.t.cat || '') + '" data-dia="' + (+x.t.date.slice(8)) + '" data-libro="' + x.t.libro + '">' + ico('i-plus') + 'Pago fijo</button></div>';
    }).join('') + '</div></section>';
}

/* Escribe en el libro (y en su nube si la tiene), con deshacer */
function cambiarLibro(cual, fn){
  var L = LIBROS[cual];
  var raw = leerJSON(L.clave, null);
  var lista = raw && Array.isArray(raw.transactions) ? raw.transactions : (Array.isArray(raw) ? raw : []);
  lista = fn(lista);
  escribirJSON(L.clave, { transactions:lista });
  recargarMarco(cual);
  sincronizarLibro(cual);
}
function anotarMovimiento(f){
  var monto = Math.round(Math.abs(num(f.monto.value)) * 100) / 100;
  if(!monto){ f.monto.focus(); aviso('Falta el monto'); return; }
  var cual = ui.dinLibro && ui.dinLibro !== 'todo' ? ui.dinLibro : (ui.qaLibro || 'personal');
  var t = { id:nid(), date:/^\d{4}-\d{2}-\d{2}$/.test(f.fecha.value) ? f.fecha.value : hoyISO(),
            desc:f.desc.value.trim() || f.cat.value.trim() || (ui.qaTipo === 'Ingreso' ? 'Ingreso' : 'Gasto'),
            type:ui.qaTipo === 'Ingreso' ? 'Ingreso' : 'Gasto', amount:monto, cat:f.cat.value.trim().slice(0, 40) };
  cambiarLibro(cual, function(l){ return l.concat([t]); });
  pintar();
  var qcat = $('qaCat'); if(qcat && ui.qaCatPre) qcat.value = ui.qaCatPre;
  aviso((t.type === 'Gasto' ? 'Gasto' : 'Ingreso') + ' anotado en ' + NOM_LIBRO[cual], dinero(monto) + (t.desc ? ' · ' + t.desc : ''), 'Deshacer', function(){
    cambiarLibro(cual, function(l){ return l.filter(function(x){ return x.id !== t.id; }); });
    pintar();
  });
  var mm = $('qaMonto'); if(mm) mm.focus();
}
function editarPresupuesto(){
  var p = (db.perfil && db.perfil.presu) || {};
  abrirFlotante(cabFlot('Presupuesto de gasto mensual') +
    '<form class="form" id="formEd" autocomplete="off">' +
      '<p style="margin:0;color:var(--tinta-2);font-size:13.5px">Cuánto quieres gastar como máximo cada mes. La agenda te dice cuánto te queda por día y te avisa si al ritmo que vas te pasarás. Déjalo vacío para no usarlo.</p>' +
      '<div class="fila-campos">' + campo('Personal (' + MONEDA + ')', '<input name="p" inputmode="decimal" value="' + (p.personal || '') + '" placeholder="Ej. 1500">') +
        campo('Oficina (' + MONEDA + ')', '<input name="o" inputmode="decimal" value="' + (p.oficina || '') + '" placeholder="Ej. 3000">') + '</div>' +
      '<div class="botones"><button type="submit" class="btn primario">' + ico('i-check') + 'Guardar</button></div>' +
    '</form>');
  var f = $('formEd');
  f.onsubmit = function(ev){
    ev.preventDefault();
    db.perfil = Object.assign({}, db.perfil, { presu:{ personal:Math.max(0, num(f.p.value)), oficina:Math.max(0, num(f.o.value)) }, upd:Date.now() });
    guardar(); cerrarFlotante(); pintar(); aviso('Presupuesto guardado');
  };
}

/* ---------- Metas ------------------------------------------------------------
   Un número que quieres alcanzar: ahorrar S/ 2000, leer 12 libros, correr
   100 km. Se suma de a poco y la agenda te dice a qué ritmo vas.          */
VISTAS.metas = function(){
  var ms = vivos('metas').sort(function(a, b){ return (a.creada || 0) - (b.creada || 0); });
  var activas = ms, archivadas = [];
  if(!ms.length){
    var sug = [['💰','Ahorrar para un viaje',1500,'soles'],['📚','Leer libros este año',12,'libros'],['🏃','Correr este mes',50,'km'],['⚖️','Bajar de peso',5,'kg']];
    return '<div class="tarjeta">' + vacio('🏆', 'Metas que se cumplen', 'Pon un número, súmale de a poco y mira cuánto falta.') +
      '<div class="chips-habito" style="justify-content:center;padding-bottom:22px">' + sug.map(function(s){
        return '<button class="chip-habito" data-acc="meta-sug" data-em="' + s[0] + '" data-n="' + esc(s[1]) + '" data-o="' + s[2] + '" data-u="' + s[3] + '"><span class="em">' + s[0] + '</span>' + s[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div style="margin-top:12px"><button class="btn primario" data-acc="nuevo" data-tipo="meta">' + ico('i-plus') + 'Crear mi meta</button></div>';
  }
  function tarjeta(m){
    var obj = +m.objetivo || 1, act = +m.actual || 0, p = Math.min(1, act / obj);
    var falta = Math.max(0, obj - act), ritmo = '';
    if(m.fecha && falta > 0){
      var dias = diasEntre(hoyISO(), m.fecha);
      ritmo = dias > 0 ? 'Quedan ' + dias + ' días · ' + formNum(falta / dias) + ' ' + esc(m.unidad || '') + ' al día para llegar'
                       : dias === 0 ? 'La fecha límite es hoy' : 'La fecha límite pasó hace ' + (-dias) + ' días';
      /* ¿Vas al día? Lo que deberías llevar si avanzaras parejo desde que la creaste */
      var desde = m.creada ? iso(new Date(+m.creada)) : '', tot = desde ? diasEntre(desde, m.fecha) : 0, pas = desde ? diasEntre(desde, hoyISO()) : 0;
      if(tot > 0 && pas > 0 && dias > 0){
        var esper = obj * Math.min(1, pas / tot);
        ritmo += act >= esper ? '<span class="md-ritmo ok">✅ Vas al día</span>'
                              : '<span class="md-ritmo atras">⚠️ Vas atrasado: deberías llevar ' + formNum(Math.round(esper * 10) / 10) + '</span>';
      }
    }
    /* Un medidor en semicírculo con el porcentaje en el centro */
    var L = Math.PI * 44;
    return '<section class="tarjeta meta-t medidor' + (p >= 1 ? ' lograda' : '') + '" style="--c:' + color(m.color) + '">' +
      '<div class="md-cab"><span class="em">' + esc(m.em || '🎯') + '</span><b class="md-nom">' + esc(m.t) + '</b>' +
        '<button class="btn-icono" data-acc="meta-ed" data-id="' + m.id + '" aria-label="Editar">' + ico('i-lapiz') + '</button></div>' +
      '<div class="md-arco"><svg viewBox="0 0 104 60"><path d="M8 54 A44 44 0 0 1 96 54" class="f"/><path d="M8 54 A44 44 0 0 1 96 54" class="v" stroke-dasharray="' + L.toFixed(1) + '" stroke-dashoffset="' + (L * (1 - p)).toFixed(1) + '"/></svg>' +
        '<span class="md-pct">' + Math.round(p * 100) + '<small>%</small></span></div>' +
      '<div class="md-cifras"><b>' + formNum(act) + '</b> de ' + formNum(obj) + ' ' + esc(m.unidad || '') + '</div>' +
      '<div class="md-falta">' + (p >= 1 ? '🎉 ¡Lograda!' : 'Faltan ' + formNum(falta) + ' ' + esc(m.unidad || '')) + (m.fecha ? ' · hasta el ' + fechaCorta(m.fecha) : '') + '</div>' +
      (ritmo ? '<div class="ritmo">' + ritmo + '</div>' : '') +
      '<div class="acciones">' +
        '<button class="btn chico" data-acc="meta-sumar" data-id="' + m.id + '" data-n="-1">−1</button>' +
        '<button class="btn chico" data-acc="meta-sumar" data-id="' + m.id + '" data-n="1">+1</button>' +
        '<form data-acc="meta-cantidad" data-id="' + m.id + '" style="display:flex;gap:6px;flex:1;min-width:150px">' +
          '<input class="entrada" name="n" inputmode="decimal" placeholder="Sumar…" style="height:32px;border-radius:9px;font-size:13px">' +
          '<button class="btn chico primario" type="submit">' + ico('i-plus') + '</button></form>' +
      '</div></section>';
  }
  return '<div class="rejilla dos">' + activas.map(tarjeta).join('') + '</div>' +
    (archivadas.length ? '<div class="seccion-tit">Archivadas <span class="n">' + archivadas.length + '</span></div><div class="rejilla dos">' + archivadas.map(tarjeta).join('') + '</div>' : '');
};
function formNum(n){ return FMT_NUM.format(Math.round(n * 100) / 100); }

function editarMeta(id, preset){
  var m = id ? JSON.parse(JSON.stringify(buscarId('metas', id))) :
    Object.assign({ id:nid(), t:'', em:'🎯', actual:0, objetivo:10, unidad:'', fecha:'', color:'acento', creada:Date.now() }, preset || {});
  var EM = ['🎯','💰','📚','🏃','⚖️','✈️','🏠','🚗','🎓','💪','🧘','🎸','💻','🌱','❤️','⭐'];
  abrirFlotante(cabFlot(id ? 'Meta' : 'Nueva meta') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Qué quieres lograr', '<input name="t" required maxlength="80" value="' + esc(m.t) + '" placeholder="Ej. Ahorrar para la laptop">') +
      '<div class="fila-campos tres">' +
        campo('Llevo', '<input name="a" inputmode="decimal" value="' + esc(m.actual) + '">') +
        campo('Objetivo', '<input name="o" inputmode="decimal" required value="' + esc(m.objetivo) + '">') +
        campo('Unidad', '<input name="u" maxlength="16" value="' + esc(m.unidad) + '" placeholder="soles, km…">') + '</div>' +
      campo('Fecha límite (opcional)', '<input type="date" name="f" value="' + esc(m.fecha) + '">') +
      grupo('Icono', selector('em', EM.map(function(e){ return { v:e, n:e }; }), m.em, 'emojis')) +
      grupo('Color', selector('color', OPC_COLOR, m.color || 'acento', 'colores')) +

      selectorEsp(m.esp || (id ? espDe(m) : espPorDefecto())) + botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  if(!id) f.t.focus();
  f.onsubmit = function(ev){
    ev.preventDefault(); m.esp = leerSelector('esp') || m.esp || espPorDefecto();
    m.t = f.t.value.trim(); if(!m.t) return;
    m.actual = num(f.a.value); m.objetivo = Math.max(0.01, num(f.o.value) || 1);
    m.unidad = f.u.value.trim(); m.fecha = f.f.value;
    m.em = leerSelector('em') || '🎯'; m.color = leerSelector('color') || 'acento';
    if(f.arch) m.archivada = f.arch.checked;
    poner('metas', m); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('metas', m.id, 'Meta borrada'); pintar(); } };
}
function num(v){ var n = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; }
function sumarMeta(id, n){
  var m = buscarId('metas', id);
  if(!m || !n) return;
  var antes = +m.actual || 0;
  m.actual = Math.max(0, Math.round((antes + n) * 100) / 100);
  poner('metas', m);
  if(antes < +m.objetivo && m.actual >= +m.objetivo){ confeti(); aviso('🏆 ¡Meta lograda!', m.t); }
  pintarSeguro();
}

/* ---------- Pagos fijos ------------------------------------------------------
   Lo que pagas cada mes: luz, agua, internet, alquiler, tarjeta. Un día de
   vencimiento, un monto, y cada mes lo marcas como pagado. Avisa dos días
   antes y el mismo día.                                                    */
var EMOJIS_P = ['💡','💧','🔥','🌐','📱','🏠','🚗','💳','📺','🎓','🏥','🐶','🏋️','🎵','🧾','💼'];
function filaPago(p, ym){
  var d = diaPago(p, ym), ok = pagado(p, ym), n = diasEntre(hoyISO(), d);
  var cuando = ok ? 'Pagado' + (typeof p.pagados[ym] === 'number' ? ' el ' + fechaCorta(iso(new Date(p.pagados[ym]))) : '')
             : n < 0 ? 'Venció hace ' + (-n) + (n === -1 ? ' día' : ' días') : n === 0 ? 'Vence hoy' : n === 1 ? 'Vence mañana' : 'Vence el ' + deISO(d).getDate() + ' (en ' + n + ' días)';
  var cls = ok ? '' : n < 0 ? 'tarde' : n <= 2 ? 'hoy' : '';
  return '<div class="fila' + (ok ? ' hecha' : '') + '">' +
    casilla('pago-ok', p.id, ok, 'var(--haber)', false, ' data-ym="' + ym + '"') +
    '<span class="em-fila">' + esc(p.em || '🧾') + '</span>' +
    '<div class="cuerpo" data-acc="pago-ed" data-id="' + p.id + '"><div class="titulo">' + esc(p.t) + '</div>' +
      '<div class="meta"><span class="' + cls + '">' + ico('i-cal') + cuando + '</span>' + (p.cat ? '<span class="etiqueta">' + esc(p.cat) + '</span>' : '') + '</div></div>' +
    '<span class="monto" style="color:' + (ok ? 'var(--tinta-3)' : 'var(--tinta)') + '">' + dinero(+p.monto || 0) + '</span>' +
  '</div>';
}
VISTAS.pagos = function(){
  var ym = ui.pagosMes, y = +ym.slice(0, 4), m = +ym.slice(5, 7) - 1;
  var ps = vivos('pagos').filter(function(p){ return p.activo !== false && !(p.desde && ym < p.desde); })
    .sort(function(a, b){ return (+a.dia || 0) - (+b.dia || 0); });
  var inactivos = vivos('pagos').filter(function(p){ return p.activo === false; });
  var total = 0, pag = 0;
  ps.forEach(function(p){ total += +p.monto || 0; if(pagado(p, ym)) pag += +p.monto || 0; });
  var html = '<div class="cal-cab">' +
    '<button class="btn-icono" data-acc="pagos-mover" data-n="-1" aria-label="Mes anterior">' + ico('i-izq') + '</button>' +
    '<h2>' + MESES[m] + ' ' + y + '</h2>' +
    '<button class="btn-icono" data-acc="pagos-mover" data-n="1" aria-label="Mes siguiente">' + ico('i-der') + '</button>' +
    '<div class="der"><button class="btn chico primario" data-acc="nuevo" data-tipo="pago">' + ico('i-plus') + 'Pago fijo</button></div></div>';
  if(!vivos('pagos').length){
    var sug = [['💡','Luz',20],['💧','Agua',15],['🌐','Internet',5],['📱','Celular',10],['🏠','Alquiler',1],['💳','Tarjeta de crédito',25]];
    return html + '<div class="tarjeta">' + vacio('🧾', 'Tus pagos de cada mes', 'Apunta lo que pagas todos los meses y la agenda te avisa antes de que venza.') +
      '<div class="chips-habito" style="justify-content:center;padding-bottom:22px">' + sug.map(function(s){
        return '<button class="chip-habito" data-acc="pago-sug" data-em="' + s[0] + '" data-n="' + s[1] + '" data-d="' + s[2] + '"><span class="em">' + s[0] + '</span>' + s[1] + '</button>';
      }).join('') + '</div></div>';
  }
  html += '<div class="resumen-pagos"><div><small>Total del mes</small><b>' + dinero(total) + '</b></div>' +
    '<div><small>Pagado</small><b style="color:var(--haber)">' + dinero(pag) + '</b></div>' +
    '<div><small>Falta</small><b style="color:' + (total - pag > 0 ? 'var(--debe)' : 'var(--tinta-3)') + '">' + dinero(total - pag) + '</b></div></div>';
  html += '<div class="barra-prog" style="height:8px;margin:-4px 2px 16px"><i style="width:' + (total ? pag / total * 100 : 0) + '%"></i></div>';
  html += ps.length ? '<div class="tarjeta"><div class="lista-filas">' + ps.map(function(p){ return filaPago(p, ym); }).join('') + '</div></div>'
                    : '<div class="tarjeta">' + vacio('🧾', 'Ningún pago este mes') + '</div>';
  if(inactivos.length){
    html += '<div class="seccion-tit">Pausados <span class="n">' + inactivos.length + '</span></div><div class="tarjeta"><div class="lista-filas">' +
      inactivos.map(function(p){ return '<div class="fila"><span class="em-fila">' + esc(p.em || '🧾') + '</span><div class="cuerpo" data-acc="pago-ed" data-id="' + p.id + '"><div class="titulo">' + esc(p.t) + '</div><div class="meta"><span>Pausado</span></div></div><span class="monto">' + dinero(+p.monto || 0) + '</span></div>'; }).join('') +
      '</div></div>';
  }
  return html + '<p style="color:var(--tinta-3);font-size:12.5px;margin-top:14px">Al marcar un pago como pagado se anota solo como gasto en su libro (Gastos personales u Oficina). Si no quieres que se anote, desactívalo al editar el pago.</p>';
};
function editarPago(id, preset){
  var p = id ? JSON.parse(JSON.stringify(buscarId('pagos', id))) :
    Object.assign({ id:nid(), t:'', monto:'', dia:1, em:'🧾', cat:'', pagados:{}, activo:true, aviso:true, desde:hoyISO().slice(0, 7) }, preset || {});
  abrirFlotante(cabFlot(id ? 'Pago fijo' : 'Nuevo pago fijo') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Qué pagas', '<input name="t" required maxlength="60" value="' + esc(p.t) + '" placeholder="Ej. Luz, Internet, Alquiler">') +
      '<div class="fila-campos">' + campo('Monto (' + MONEDA + ')', '<input name="m" inputmode="decimal" value="' + esc(p.monto) + '" placeholder="0.00">') +
        campo('Vence el día', '<input name="d" type="number" min="1" max="31" required value="' + esc(p.dia) + '">') + '</div>' +
      campo('Categoría (opcional)', '<input name="c" maxlength="30" value="' + esc(p.cat) + '" placeholder="Servicios, Casa, Deudas…">') +
      grupo('Icono', selector('em', EMOJIS_P.map(function(e){ return { v:e, n:e }; }), p.em, 'emojis')) +
      '<label class="interruptor"><input type="checkbox" name="av"' + (p.aviso !== false ? ' checked' : '') + '>Avisarme 2 días antes y el mismo día</label>' +
      '<label class="interruptor"><input type="checkbox" name="an"' + (p.anotar !== false ? ' checked' : '') + '>Al pagarlo, anotarlo como gasto en mi libro</label>' +
      (id ? '<label class="interruptor"><input type="checkbox" name="act"' + (p.activo !== false ? ' checked' : '') + '>Activo (desmárcalo para pausarlo)</label>' : '') +
      selectorEsp(p.esp || (id ? espDe(p) : espPorDefecto())) + botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  if(!id && !p.t) f.t.focus();
  f.onsubmit = function(ev){
    ev.preventDefault(); p.esp = leerSelector('esp') || p.esp || espPorDefecto();
    p.t = f.t.value.trim(); if(!p.t) return;
    p.monto = Math.round(num(f.m.value) * 100) / 100; p.dia = Math.min(31, Math.max(1, parseInt(f.d.value, 10) || 1));
    p.cat = f.c.value.trim(); p.em = leerSelector('em') || '🧾'; p.aviso = f.av.checked; p.anotar = f.an.checked;
    if(f.act) p.activo = f.act.checked;
    poner('pagos', p); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('pagos', p.id, 'Pago borrado'); pintar(); } };
}
function alternarPago(id, ym, boton){
  var p = buscarId('pagos', id);
  if(!p) return;
  p.pagados = p.pagados || {};
  var libro = espDe(p) === 'oficina' ? 'oficina' : 'personal', idMov = 'pago-' + p.id + '-' + ym;
  var anotar = p.anotar !== false && +p.monto > 0;
  function marcar(on){
    if(on) p.pagados[ym] = Date.now(); else delete p.pagados[ym];
    poner('pagos', p);
    if(anotar) cambiarLibro(libro, function(l){
      l = l.filter(function(t){ return t.id !== idMov; });
      return on ? l.concat([{ id:idMov, date:hoyISO(), desc:p.t, type:'Gasto', amount:+p.monto, cat:p.cat || 'Servicios' }]) : l;
    });
  }
  var on = !p.pagados[ym];
  marcar(on);
  if(on) aviso('Pagado ✓', p.t + ' · ' + dinero(+p.monto || 0) + (anotar ? ' · anotado en ' + (libro === 'oficina' ? 'la oficina' : 'tu libro') : ''), 'Deshacer', function(){ marcar(false); pintar(); });
  if(boton){ boton.setAttribute('aria-checked', on); boton.classList.add('pop'); setTimeout(pintarSeguro, 300); }
  else pintarSeguro();
}

/* ---------- Diario -----------------------------------------------------------
   Una línea al día basta: cómo te sientes y qué pasó. Con el tiempo es un
   mapa de tus meses.                                                        */
var ANIMOS = [null, { e:'😢', n:'Mal' }, { e:'😕', n:'Regular' }, { e:'😐', n:'Normal' }, { e:'🙂', n:'Bien' }, { e:'😄', n:'Genial' }];
function animosHTML(actual, dia){
  return '<div class="animos">' + [1,2,3,4,5].map(function(i){
    return '<button type="button" class="animo" data-acc="animo" data-v="' + i + '" data-dia="' + dia + '" aria-pressed="' + (actual === i) + '"><span>' + ANIMOS[i].e + '</span>' + ANIMOS[i].n + '</button>';
  }).join('') + '</div>';
}
function guardarDiario(dia, cambios){
  var e = buscarId('diario', dia);
  e = e ? JSON.parse(JSON.stringify(e)) : { id:dia, animo:0, texto:'' };
  delete e.del;
  Object.assign(e, cambios);
  poner('diario', e);
}
/* Días seguidos escribiendo, contando hasta hoy (o ayer si hoy aún no) */
function rachaDiario(){
  var d = hoyISO(), n = 0, x = buscarId('diario', d);
  if(!(x && !x.del && x.texto)) d = sumarDias(d, -1);
  for(;;){ x = buscarId('diario', d); if(!(x && !x.del && x.texto)) break; n++; d = sumarDias(d, -1); }
  return n;
}
document.addEventListener('input', function(ev){
  if(!ev.target || ev.target.id !== 'buscaDiario') return;
  var q = sinTildes(ev.target.value.trim().toLowerCase()), vistos = 0;
  document.querySelectorAll('#entradasDiario .entrada-diario').forEach(function(b){
    var ok = !q || sinTildes(b.textContent.toLowerCase()).indexOf(q) >= 0;
    if(!q && vistos >= 40) ok = false;
    b.style.display = ok ? '' : 'none'; if(ok) vistos++;
  });
});
var PREGUNTAS = ['¿Qué salió bien hoy?', '¿Por qué estás agradecido hoy?', '¿Qué aprendiste hoy?', '¿Qué harías distinto?', '¿Qué te hizo sonreír?', '¿Qué te preocupa y qué puedes hacer al respecto?', '¿Cuál fue el mejor momento del día?'];
VISTAS.diario = function(){
  var dia = ui.diarioDia, hoy = hoyISO();
  var e = buscarId('diario', dia); if(e && e.del) e = null;
  var html = '<section class="tarjeta" style="margin-bottom:16px">' +
    '<div class="tarjeta-cab"><button class="btn-icono" data-acc="diario-mover" data-n="-1" aria-label="Día anterior">' + ico('i-izq') + '</button>' +
      '<h2 style="flex:1;justify-content:center">' + (dia === hoy ? 'Hoy' : cap(relativo(dia))) + ' · ' + fechaCorta(dia) + '</h2>' +
      '<button class="btn-icono" data-acc="diario-mover" data-n="1" aria-label="Día siguiente"' + (dia >= hoy ? ' disabled style="opacity:.3"' : '') + '>' + ico('i-der') + '</button></div>' +
    '<div class="tarjeta-cuerpo">' +
      '<textarea class="entrada" id="textoDiario" data-dia="' + dia + '" maxlength="10000" placeholder="' + esc(PREGUNTAS[deISO(dia).getDate() % PREGUNTAS.length]) + '" style="height:auto;min-height:170px;padding:12px;margin-top:12px;line-height:1.55;resize:vertical">' + esc(e ? e.texto : '') + '</textarea>' +
      '<small style="color:var(--tinta-3);font-size:12px">Se guarda solo mientras escribes.</small>' +
    '</div></section>' + recuerdosHTML(dia);

  /* El mes en caritas */
  var ym = dia.slice(0, 7), y = +ym.slice(0, 4), mm = +ym.slice(5, 7) - 1;
  var primero = ym + '-01', ini = inicioSemana(primero), celdas = '';
  var cab = [];
  for(var k = 0; k < 7; k++) cab.push('<span style="text-align:center;font-size:10.5px;font-weight:800;color:var(--tinta-3);text-transform:uppercase">' + DIAS3[deISO(sumarDias(ini, k)).getDay()].slice(0, 2) + '</span>');
  var cuenta = [0,0,0,0,0,0];
  for(var j = 0; j < 42; j++){
    var d = sumarDias(ini, j);
    if(j >= 35 && d.slice(0, 7) !== ym) break;
    if(d.slice(0, 7) !== ym){ celdas += '<button class="vacio-d" tabindex="-1"></button>'; continue; }
    var x = buscarId('diario', d), a = x && !x.del ? x.animo : 0;
    if(a) cuenta[a]++;
    celdas += '<button data-acc="diario-dia" data-dia="' + d + '" class="' + (a ? 'hay' : '') + (d === dia ? ' sel' : '') + '"' + (d > hoy ? ' disabled style="opacity:.35"' : '') + ' title="' + fechaCorta(d) + '">' +
      (x && x.texto ? '✎' : deISO(d).getDate()) + '</button>';
  }
  html += '<div class="rejilla dos"><section class="tarjeta">' + cabTarjeta('i-cal', cap(MESES[mm]) + ' ' + y, 'var(--rosa)') +
    '<div class="tarjeta-cuerpo"><div class="mes-animo" style="margin-bottom:6px">' + cab.join('') + '</div><div class="mes-animo">' + celdas + '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;font-size:12.5px;color:var(--tinta-2)">' +
      '' +
    '</div></div></section>';

  var todas = vivos('diario').filter(function(x){ return x.texto; }).sort(function(a, b){ return b.id.localeCompare(a.id); });
  html += '<section class="tarjeta">' + cabTarjeta('i-diario', 'Entradas', 'var(--verde)') +
    (todas.length > 3 ? '<div class="busca-diario"><input class="entrada" id="buscaDiario" type="search" placeholder="Buscar en tu diario…" autocomplete="off"></div>' : '') +
    (todas.length ? '<div id="entradasDiario">' + todas.slice(0, 400).map(function(x){
      return '<button class="entrada-diario" data-acc="diario-dia" data-dia="' + x.id + '"><span class="em">📝</span><div style="min-width:0">' +
        '<b>' + cap(fechaLarga(x.id)) + '</b>' + (x.texto ? '<p>' + esc(x.texto) + '</p>' : '') + '</div></button>';
    }).join('') + '</div>' : vacio('📖', 'Aún no has escrito', 'Cuenta tu día en un par de líneas.')) +
    '</section></div>';
  return html;
};

/* ---------- Enfoque: temporizador pomodoro ----------------------------------
   25 minutos concentrado, 5 de descanso; cada cuatro, uno largo. Sigue
   contando aunque cambies de sección o recargues, porque lo que se guarda
   es la HORA A LA QUE TERMINA, no los segundos que quedan.               */
var CLAVE_FOCO = 'agenda_foco';
var foco = Object.assign({ modo:'trabajo', fin:0, resta:0, tarea:'', ciclo:0 }, leerJSON(CLAVE_FOCO, {}));
var MODOS = { trabajo:{ n:'Concentración', k:'focoMin', def:25 }, corto:{ n:'Descanso corto', k:'cortoMin', def:5 }, largo:{ n:'Descanso largo', k:'largoMin', def:15 } };
function minutosModo(m){ return +pref[MODOS[m].k] || MODOS[m].def; }
function guardarFoco(){ escribirJSON(CLAVE_FOCO, foco); }
function restanteFoco(){ return foco.fin ? Math.max(0, foco.fin - Date.now()) : (foco.resta || minutosModo(foco.modo) * 60000); }
function mmss(ms){ var s = Math.ceil(ms / 1000); return dos(Math.floor(s / 60)) + ':' + dos(s % 60); }
function pomosHoy(){ var e = buscarId('enfoque', hoyISO()); return e && !e.del ? (e.pomos || 0) : 0; }

VISTAS.foco = function(){
  var total = minutosModo(foco.modo) * 60000, r = restanteFoco();
  var C = 2 * Math.PI * 120;
  var tareas = vivos('tareas').filter(function(t){ return !t.hecha; }).sort(ordenTareas).slice(0, 40);
  var n = pomosHoy();
  return '<div class="rejilla dos"><section class="tarjeta">' +
    '<div class="tarjeta-cuerpo" style="padding-top:16px"><div class="selector" style="justify-content:center">' + Object.keys(MODOS).map(function(k){
      return '<button data-acc="foco-modo" data-m="' + k + '" aria-pressed="' + (foco.modo === k) + '">' + { trabajo:'Enfoque', corto:'Descanso', largo:'Largo' }[k] + '</button>';
    }).join('') + '</div></div>' +
    '<div class="reloj-foco"><div class="circulo">' +
      '<svg class="aro" viewBox="0 0 260 260"><defs><linearGradient id="gradFoco" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--verde-sube)"/><stop offset="1" stop-color="var(--haber)"/></linearGradient></defs>' +
      '<circle class="fondo" cx="130" cy="130" r="120"/><circle class="valor" id="aroFoco" cx="130" cy="130" r="120" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - r / total)).toFixed(1) + '"/></svg>' +
      '<div class="centro"><div class="tiempo" id="tiempoFoco">' + mmss(r) + '</div><div class="modo">' + MODOS[foco.modo].n + '</div></div></div>' +
      '<div class="mandos">' +
        '<button class="btn-icono" data-acc="foco-reiniciar" title="Reiniciar" aria-label="Reiniciar">' + ico('i-rep') + '</button>' +
        '<button class="grande' + (foco.fin ? ' pausa' : '') + '" data-acc="foco-play" aria-label="' + (foco.fin ? 'Pausar' : 'Empezar') + '">' + ico(foco.fin ? 'i-pausa' : 'i-play') + '</button>' +
        '<button class="btn-icono" data-acc="foco-saltar" title="Saltar al siguiente" aria-label="Saltar">' + ico('i-der') + '</button>' +
      '</div>' +
      '<div class="tomates" title="Sesiones de hoy">' + (n ? '🍅'.repeat(Math.min(n, 16)) + (n > 16 ? ' +' + (n - 16) : '') : '<span style="font-size:13px;color:var(--tinta-3)">Hoy aún no hay sesiones</span>') + '</div>' +
    '</div></section>' +
    '<section class="tarjeta">' + cabTarjeta('i-diana', '¿En qué te vas a concentrar?', 'var(--haber)') +
      '<div class="tarjeta-cuerpo"><div class="selector espacios" style="margin-bottom:10px">' + ESPACIOS.map(function(E){
        return '<button type="button" data-acc="foco-esp" data-v="' + E.id + '" style="--c:' + E.c + '" aria-pressed="' + ((foco.esp || 'personal') === E.id) + '">' + E.em + ' ' + E.nom + '</button>';
      }).join('') + '</div><select class="entrada" id="focoTarea"><option value="">— Elige una tarea (opcional) —</option>' +
        tareas.map(function(t){ return '<option value="' + t.id + '"' + (foco.tarea === t.id ? ' selected' : '') + '>' + esc(t.t) + '</option>'; }).join('') + '</select>' +
      (foco.tarea && buscarId('tareas', foco.tarea) && !buscarId('tareas', foco.tarea).hecha ?
        '<button class="btn chico" style="margin-top:10px" data-acc="tarea-ok" data-id="' + foco.tarea + '">' + ico('i-check') + 'Marcar como hecha</button>' : '') +
      '<p style="font-size:13px;color:var(--tinta-2);margin:14px 0 0;line-height:1.55">Trabaja sin interrupciones hasta que suene. Luego descansa de verdad: levántate, estírate, toma agua. Cada 4 sesiones, un descanso largo.</p>' +
      '<div class="fila-campos tres" style="margin-top:14px">' +
        ['trabajo','corto','largo'].map(function(k){
          return '<label class="campo"><span>' + (k === 'trabajo' ? 'Concentración' : k === 'corto' ? 'Descanso' : 'Largo') + ' (min)</span><input type="number" min="1" max="180" data-min="' + MODOS[k].k + '" value="' + minutosModo(k) + '"></label>';
        }).join('') + '</div>' +
    '</div></section></div>';
};
function tictac(){
  var r = restanteFoco();
  var t = $('tiempoFoco'); if(t) t.textContent = mmss(r);
  var a = $('aroFoco');
  if(a){ var C = 2 * Math.PI * 120; a.setAttribute('stroke-dashoffset', (C * (1 - r / (minutosModo(foco.modo) * 60000))).toFixed(1)); }
  var p = $('pastillaFoco');
  p.classList.toggle('oculto', !foco.fin || ui.vista === 'foco');
  $('pastillaFocoTexto').textContent = mmss(r);
  if(foco.fin) document.title = mmss(r) + ' · ' + MODOS[foco.modo].n;
  if(foco.fin && r <= 0) terminarFoco();
  var hv = $('horaViva'); if(hv) hv.textContent = horaAhora();
  var ro = $('relojOficina'); if(ro && reloj && reloj.inicio) ro.textContent = mmssLargo(Date.now() - reloj.inicio);
}
function terminarFoco(){
  var era = foco.modo;
  foco.fin = 0; foco.resta = 0;
  if(era === 'trabajo'){
    var hoy = hoyISO(), e = buscarId('enfoque', hoy);
    e = e ? JSON.parse(JSON.stringify(e)) : { id:hoy, items:[] };
    delete e.del; e.pomos = (e.pomos || 0) + 1;
    var espF = foco.tarea && buscarId('tareas', foco.tarea) ? espDe(buscarId('tareas', foco.tarea)) : (foco.esp || 'personal');
    e.pomosEsp = e.pomosEsp || {}; e.pomosEsp[espF] = (e.pomosEsp[espF] || 0) + 1;
    poner('enfoque', e);
    foco.ciclo = (foco.ciclo || 0) + 1;
    foco.modo = foco.ciclo % 4 === 0 ? 'largo' : 'corto';
  } else foco.modo = 'trabajo';
  guardarFoco();
  dispararAlarma({ t:era === 'trabajo' ? '¡Sesión terminada! 🍅' : 'Se acabó el descanso', cuerpo:era === 'trabajo' ? 'Toca descansar ' + minutosModo(foco.modo) + ' minutos.' : 'A concentrarse otra vez.', id:'foco', tipo:'prueba' });
  document.title = 'Agenda';
  pintarSeguro();
}
function focoPlay(){
  if(foco.fin){ foco.resta = restanteFoco(); foco.fin = 0; }
  else { foco.fin = Date.now() + restanteFoco(); foco.resta = 0; try{ audio = audio || new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} }
  guardarFoco(); pintar(); tictac();
}

/* ---------- Progreso ---------------------------------------------------------- */
function hechasPorDia(){
  var m = {};
  vivos('tareas').forEach(function(t){
    if(t.hecha && t.hechaEn){ var d = iso(new Date(t.hechaEn)); m[d] = (m[d] || 0) + 1; }
    (t.log || []).forEach(function(d){ m[d] = (m[d] || 0) + 1; });
  });
  return m;
}
function barras(valores, etiquetas, colorB, alto){
  var max = Math.max.apply(null, valores.concat([1]));
  return '<div class="barras-v" style="height:' + (alto || 160) + 'px">' + valores.map(function(v, i){
    return '<div class="col" title="' + esc(etiquetas[i]) + ': ' + v + '"><b>' + (v || '') + '</b>' +
      '<div class="zona"><i style="height:' + (v ? Math.max(4, v / max * 100) : 0) + '%;background:' + colorB + '"></i></div>' +
      '<small>' + esc(etiquetas[i]) + '</small></div>';
  }).join('') + '</div>';
}

/* ---------- Confeti, para celebrar ------------------------------------------ */
function confeti(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c = $('confeti'), g = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight;
  var cs = getComputedStyle(document.documentElement);
  var col = ['--verde','--haber','--debe','--oro','--azul','--rosa'].map(function(v){ return cs.getPropertyValue(v).trim() || '#3D8BFF'; });
  var ps = [];
  for(var i = 0; i < 140; i++) ps.push({ x:W / 2 + (Math.random() - .5) * 80, y:H * .35, vx:(Math.random() - .5) * 14, vy:-Math.random() * 14 - 4, r:Math.random() * 6 + 4, c:col[i % col.length], a:Math.random() * 6, va:(Math.random() - .5) * .3 });
  var t0 = performance.now();
  (function paso(t){
    g.clearRect(0, 0, W, H);
    ps.forEach(function(p){ p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); });
    if(t - t0 < 2200) requestAnimationFrame(paso); else g.clearRect(0, 0, W, H);
  })(t0);
}

/* ---------- Candado con PIN ---------------------------------------------------
   Para que nadie cotillee tu agenda si coge tu teléfono. Es una cerradura
   de puerta, no una caja fuerte: los datos no se cifran, se tapan.        */
var CLAVE_PIN = 'agenda_pin';
var pinCfg = null, pinEscrito = '', pinModo = 'abrir', pinNuevo = '', fallos = 0, bloqueadoHasta = 0, ocultoDesde = 0;
function hashPIN(pin, sal){
  var txt = sal + ':' + pin;
  if(window.crypto && crypto.subtle && window.TextEncoder){
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt)).then(function(b){
      return Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  var h = 2166136261;
  for(var i = 0; i < txt.length; i++){ h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return Promise.resolve('f' + h.toString(16));
}
function mostrarCandado(modo){
  pinModo = modo || 'abrir'; pinEscrito = ''; pinNuevo = '';
  $('candadoTitulo').textContent = pinModo === 'abrir' ? 'Escribe tu PIN' : 'Elige un PIN de 4 a 6 números';
  $('candadoNota').textContent = pinModo === 'abrir' ? '' : 'Apúntalo en un lugar seguro: si lo olvidas no hay forma de recuperarlo.';
  $('teclado').innerHTML = [1,2,3,4,5,6,7,8,9].map(function(n){ return '<button type="button" data-pin="' + n + '">' + n + '</button>'; }).join('') +
    '<button type="button" class="fantasma" data-pin="x">' + (pinModo === 'abrir' ? '' : 'Cancelar') + '</button><button type="button" data-pin="0">0</button><button type="button" class="fantasma" data-pin="b">Borrar</button>';
  $('candado').classList.remove('oculto');
  pintarPuntos();
}
function pintarPuntos(){
  var largo = pinModo === 'abrir' && pinCfg ? pinCfg.largo : pinModo === 'repetir' ? pinNuevo.length : Math.max(4, pinEscrito.length);
  var h = '';
  for(var i = 0; i < largo; i++) h += '<i class="' + (i < pinEscrito.length ? 'lleno' : '') + '"></i>';
  $('puntosPin').innerHTML = h;
}
function teclaPIN(k){
  if(Date.now() < bloqueadoHasta){ $('candadoNota').textContent = 'Demasiados intentos. Espera unos segundos.'; return; }
  if(k === 'b'){ pinEscrito = pinEscrito.slice(0, -1); pintarPuntos(); return; }
  if(k === 'x'){ if(pinModo !== 'abrir'){ $('candado').classList.add('oculto'); } return; }
  if(k === 'ok'){ if(pinModo !== 'abrir' && pinEscrito.length >= 4) confirmarNuevo(); return; }
  if(pinEscrito.length >= 6) return;
  pinEscrito += k; pintarPuntos();
  if(pinModo === 'abrir' && pinCfg && pinEscrito.length === pinCfg.largo){
    var intento = pinEscrito;
    hashPIN(intento, pinCfg.sal).then(function(h){
      if(h === pinCfg.hash){ fallos = 0; $('candado').classList.add('oculto'); pinEscrito = ''; }
      else {
        fallos++; pinEscrito = '';
        var p = $('puntosPin'); p.classList.remove('mal'); void p.offsetWidth; p.classList.add('mal');
        if(fallos >= 5){ bloqueadoHasta = Date.now() + 30000; fallos = 0; $('candadoNota').textContent = 'Demasiados intentos. Espera 30 segundos.'; }
        else $('candadoNota').textContent = 'PIN incorrecto';
        pintarPuntos();
      }
    });
  } else if(pinModo === 'repetir'){ if(pinEscrito.length === pinNuevo.length) confirmarNuevo(); }
  else if(pinModo === 'nuevo'){
    if(pinEscrito.length === 6) confirmarNuevo();
    else if(pinEscrito.length >= 4){ $('candadoNota').textContent = 'Pulsa «Listo» para usar este PIN, o sigue hasta 6 números.'; ponerListo(); }
  }
}
function ponerListo(){
  var b = document.querySelector('#teclado [data-pin="x"]');
  if(b){ b.dataset.pin = 'ok'; b.textContent = 'Listo'; }
}
function confirmarNuevo(){
  var b = document.querySelector('#teclado [data-pin="ok"]');
  if(b){ b.dataset.pin = 'x'; b.textContent = 'Cancelar'; }
  if(pinModo === 'nuevo'){ pinNuevo = pinEscrito; pinEscrito = ''; pinModo = 'repetir'; $('candadoTitulo').textContent = 'Repítelo para confirmar'; $('candadoNota').textContent = ''; pintarPuntos(); return; }
  if(pinEscrito !== pinNuevo){ pinModo = 'nuevo'; pinEscrito = ''; pinNuevo = ''; $('candadoTitulo').textContent = 'No coinciden. Elige un PIN'; pintarPuntos(); return; }
  var sal = Math.random().toString(36).slice(2), pin = pinNuevo;
  hashPIN(pin, sal).then(function(h){
    pinCfg = { sal:sal, hash:h, largo:pin.length };
    escribirJSON(CLAVE_PIN, pinCfg);
    $('candado').classList.add('oculto');
    aviso('PIN activado', 'Se pedirá al abrir la agenda y al volver después de un minuto.');
    pintar();
  });
}

/* ---------- Ajustes -------------------------------------------------------- */
var PALETAS = [
  { id:'negro',   nom:'Negro',   gotas:['#1D45C4','#30D158','#000000'] },
  { id:'electrico', nom:'Eléctrico', gotas:['#3D8BFF','#45C97A','#18191B'] },
  { id:'brasa',   nom:'Brasa',   gotas:['#F0883E','#8FC45A','#1A1816'] },
  { id:'jade',    nom:'Jade',    gotas:['#5FD3B3','#E9C66F','#171C1B'] },
  { id:'grafito', nom:'Grafito', gotas:['#C8E06A','#8FD6A0','#191A19'] }
];
function paletaValida(p){ return PALETAS.some(function(x){ return x.id === p; }) ? p : 'negro'; }
var nube = leerJSON(CLAVE_NUBE, null);

VISTAS.ajustes = function(){
  var tema = document.documentElement.getAttribute('data-tema') || 'oscuro';
  var pal = document.documentElement.getAttribute('data-paleta') || 'negro';
  var permiso = 'Notification' in window ? Notification.permission : 'no';
  var llaveCuentas = (leerJSON(CLAVE_NUBE_CTA, null) || {}).key || '';

  var html = '<div class="seccion-tit" style="margin-top:0">Tú</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Tu nombre</b><small>Para saludarte en Hoy.</small></div>' +
    '<input class="entrada" id="ajNombre" style="max-width:240px" maxlength="40" value="' + esc(db.perfil.nombre) + '" placeholder="Tu nombre"></div></div>';

  html += '<div class="seccion-tit">Organización</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Administrar secciones</b><small>Muestra u oculta secciones, cámbialas de orden, elige la barra de abajo del celular y limpia lo viejo.</small></div>' +
      '<button class="btn chico primario" data-ir="secciones">' + ico('i-espacios') + 'Administrar</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Qué ver en Hoy</b><small>Elige los bloques de la pantalla Hoy.</small></div>' +
      '<button class="btn chico" data-acc="personalizar-hoy">' + ico('i-hoy') + 'Elegir</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Teclado de la agenda</b><small>' + (TECLADO.tactil ? 'Usa el teclado propio al escribir (con ñ, tildes, atajos, emojis y calculadora para montos). Apágalo para volver al del celular.' : 'Solo aparece en el celular o la tableta.') + '</small></div>' +
      '<label class="interruptor"><input type="checkbox" data-teclado="1"' + (pref.teclado !== false ? ' checked' : '') + (TECLADO.tactil ? '' : ' disabled') + ' aria-label="Teclado de la agenda"></label></div></div>';

  html += '<div class="seccion-tit">Apariencia</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Tema</b><small>También viste a tus libros de cuentas dentro de la agenda.</small></div>' +
      '<div class="selector"><button data-acc="tema" data-t="oscuro" aria-pressed="' + (!pref.temaAuto && tema !== 'claro') + '">🌙 Oscuro</button><button data-acc="tema" data-t="claro" aria-pressed="' + (!pref.temaAuto && tema === 'claro') + '">☀️ Claro</button><button data-acc="tema" data-t="auto" aria-pressed="' + !!pref.temaAuto + '">🌓 Automático</button></div></div>' +
    '<div class="ajuste"><div class="txt"><b>Colores</b></div><div class="rejilla-paletas">' + PALETAS.map(function(p){
      return '<button type="button" class="muestra" data-acc="paleta" data-p="' + p.id + '" aria-pressed="' + (p.id === pal) + '"><span class="gotas">' +
        p.gotas.map(function(c){ return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' + p.nom + '</button>';
    }).join('') + '</div></div>' +
    '<div class="ajuste"><div class="txt"><b>La semana empieza</b></div>' +
      '<div class="selector"><button data-acc="lunes" data-v="1" aria-pressed="' + pref.lunes + '">Lunes</button><button data-acc="lunes" data-v="0" aria-pressed="' + !pref.lunes + '">Domingo</button></div></div>' +
  '</div>';

  html += '<div class="seccion-tit">Avisos</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Avisos del sistema</b><small>' +
      (permiso === 'granted' ? 'Activados. Los recordatorios, las tareas con hora y los eventos con aviso te saltan en pantalla.' :
       permiso === 'denied' ? 'Bloqueados. Actívalos desde el candado de la barra de direcciones → Notificaciones.' :
       permiso === 'no' ? 'Este navegador no los tiene: sonarán dentro de la agenda.' : 'Aún sin activar.') + '</small></div>' +
      (permiso === 'default' ? '<button class="btn chico primario" data-acc="permiso">Activar</button>' : '') +
      '<button class="btn chico" data-acc="probar-aviso">Probar</button></div>' +
    '<div class="ajuste"><label class="interruptor"><input type="checkbox" id="ajSonido"' + (pref.sonido ? ' checked' : '') + '>Sonido al avisar</label></div>' +
    '<div class="ajuste"><div class="txt"><b>Alarmas con el teléfono bloqueado</b><small>Una página web solo puede avisar mientras sigue viva. Para lo que no puede fallar (citas, pagos, medicinas), pásalo a la app de calendario de tu teléfono: suena siempre. Cada evento y recordatorio tiene su botón “Google Calendar”, o descarga aquí todo junto.</small></div>' +
      '<button class="btn chico" data-acc="ics-todo">' + ico('i-bajar') + 'Todo en .ics</button></div>' +
  '</div>';

  html += '<div class="seccion-tit">Sincronizar entre aparatos</div><div class="tarjeta">';
  if(nube){
    html += '<div class="ajuste"><div class="txt"><b>Conectada a jsonbin.io</b><small>La agenda se guarda también en tu base <span class="cifra">' + esc(nube.bin) + '</span> y se junta con la de tus otros aparatos.</small>' + panelSync() + '</div>' +
      '<button class="btn chico primario" data-acc="sync-ya">' + ico('i-nube') + 'Sincronizar ahora</button></div>' +
      ((leerJSON(LIBROS.personal.nube, null) || {}).bin && (leerJSON(LIBROS.oficina.nube, null) || {}).bin ? '' :
        '<div class="ajuste"><div class="txt"><b>Poner también los libros en la nube</b><small>Crea las bases que faltan con tu misma llave, para que tus cuentas también pasen de un aparato a otro.</small></div>' +
        '<button class="btn chico primario" data-acc="nube-libros">' + ico('i-nube') + 'Conectar libros</button></div>') +
      '<div class="ajuste"><div class="txt"><b>Añadir otro aparato</b><small>Copia este código y pégalo en Ajustes del otro aparato (celular o laptop). Con él se conectan la agenda y los dos libros a la vez.</small></div>' +
      '<button class="btn chico" data-acc="nube-codigo">Ver código</button></div>' +
      '<div class="ajuste"><div class="txt"><b>Desconectar este aparato</b><small>Los datos se quedan aquí y en la nube; solo deja de sincronizar.</small></div>' +
      '<button class="btn chico peligro" data-acc="nube-quitar">Desconectar</button></div>';
  } else {
    html += '<div class="ajuste"><div class="txt"><b>Primer aparato</b><small>Usa tu cuenta gratuita de jsonbin.io. Pega tu X-Master-Key' +
      (llaveCuentas ? ' (ya la puse: es la que usaba Cuentas)' : '') + ' y se crean las bases de la agenda y de los dos libros. Luego conecta tus otros aparatos con el código.</small></div>' +
      '<input class="entrada" id="ajLlave" style="max-width:320px" placeholder="X-Master-Key" value="' + esc(llaveCuentas) + '">' +
      '<button class="btn chico primario" data-acc="nube-crear">Crear base</button></div>' +
      '<div class="ajuste"><div class="txt"><b>Otro aparato</b><small>Pega el código que te da el primero.</small></div>' +
      '<input class="entrada" id="ajCodigo" style="max-width:320px" placeholder="AGENDA2:…">' +
      '<button class="btn chico" data-acc="nube-unir">Conectar</button></div>';
  }
  html += '</div>';

  html += '<div class="seccion-tit">Tus datos</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Respaldo completo</b><small>Un archivo con toda la agenda, tus gastos personales y las cuentas de la oficina. Guárdalo de vez en cuando.</small></div>' +
      '<button class="btn chico" data-acc="respaldo">' + ico('i-bajar') + 'Descargar</button>' +
      '<button class="btn chico" data-acc="cargar">' + ico('i-subir') + 'Cargar</button>' +
      '<input type="file" id="archivoRespaldo" accept=".json,application/json" class="oculto"></div>' +
    (leerJSON(CLAVE_ERRORES, []).length ? '<div class="ajuste"><div class="txt"><b>Registro de fallos</b><small>Hay ' + leerJSON(CLAVE_ERRORES, []).length + ' anotados. Si notas algo raro, cópialo y envíamelo.</small></div><button class="btn chico" data-acc="errores-ver">Ver</button></div>' : '') +
    '<div class="ajuste"><div class="txt"><b>Papelera</b><small>Lo que borras se guarda ' + DIAS_PAPELERA + ' días por si te arrepientes.</small></div>' +
      '<button class="btn chico" data-ir="papelera">' + ico('i-basura') + 'Abrir (' + enPapelera().length + ')</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Instalar como aplicación</b><small>Con su icono, a pantalla completa y abriendo sin internet.</small></div>' +
      '<button class="btn chico" data-acc="instalar">' + ico('i-instalar') + 'Instalar</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Borrar toda la agenda</b><small>Todo lo de la agenda pasa a la papelera (30 días para arrepentirte). Las cuentas no se tocan.</small></div>' +
      '<button class="btn chico peligro" data-acc="borrar-todo">' + ico('i-basura') + 'Borrar</button></div>' +
  '</div>';

  html += '<div class="seccion-tit solo-escritorio">Atajos de teclado</div><div class="tarjeta solo-escritorio"><div class="tarjeta-cuerpo" style="padding:14px 16px;font-size:13.5px;color:var(--tinta-2)">' +
    '<b class="cifra">n</b> añadir · <b class="cifra">/</b> buscar · <b class="cifra">1</b>–<b class="cifra">9</b> cambiar de sección · <b class="cifra">Esc</b> cerrar</div></div>';
  return html;
};

/* ==========================================================================
   HOJA FLOTANTE (editores, menús)
   ========================================================================== */
var alCerrarFlot = null;
/* El botón «atrás» del celular cierra la hoja abierta en vez de cambiar de
   sección: cada hoja deja un paso en el historial, y al cerrarla con la X
   ese paso se deshace solo. */
var hojaEnHist = false, ignorarPop = 0, irPendiente = null;
function finPop(){
  ignorarPop = 0;
  if(irPendiente){ var v = irPendiente; irPendiente = null; ir(v); }
}
function abrirFlotante(html, alCerrar){
  cerrarFlotante(true);
  $('capaFlotante').innerHTML = '<div class="velo" data-velo="1"><div class="hoja-flot" role="dialog" aria-modal="true"><div class="asa"></div>' + html + '</div></div>';
  document.body.classList.add('con-hoja');
  alCerrarFlot = alCerrar || null;
  if(!hojaEnHist){ try{ history.pushState({ hoja:1 }, '', location.href); hojaEnHist = true; }catch(e){} }
}
function cerrarFlotante(interno){
  var f = alCerrarFlot; alCerrarFlot = null;
  if(f) f();
  edAcciones = {};
  $('capaFlotante').innerHTML = '';
  document.body.classList.remove('con-hoja');
  if(repintarAlSoltar) pintar();
  /* Se espera un instante: si enseguida se abre otra hoja, reusa el paso */
  if(interno !== true && hojaEnHist) setTimeout(function(){
    if(hojaEnHist && !$('capaFlotante').innerHTML){
      hojaEnHist = false; ignorarPop = 1;
      try{ history.back(); }catch(e){ ignorarPop = 0; }
      setTimeout(function(){ if(ignorarPop) finPop(); }, 500);   // por si el atrás nunca llega
    }
  }, 0);
}
function vibrar(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms || 12); }catch(e){} }
function cabFlot(t){ return '<div class="cab"><h3>' + t + '</h3><button type="button" class="btn-icono" data-cerrar="1" aria-label="Cerrar">' + ico('i-x') + '</button></div>'; }
function campo(lbl, inner){ return '<label class="campo"><span>' + lbl + '</span>' + inner + '</label>'; }
function grupo(lbl, inner){ return '<div class="campo"><span>' + lbl + '</span>' + inner + '</div>'; }
function selRep(v){
  return '<select name="rep">' + Object.keys(REPS).map(function(k){
    return '<option value="' + k + '"' + (k === (v || 'no') ? ' selected' : '') + '>' + REPS[k] + '</option>';
  }).join('') + '</select>';
}
function selector(nombre, opciones, actual, clase, multi){
  return '<div class="selector ' + (clase || '') + '" data-grupo="' + nombre + '"' + (multi ? ' data-multi="1"' : '') + '>' + opciones.map(function(o){
    var on = multi ? actual.indexOf(o.v) >= 0 : o.v === actual;
    return '<button type="button" data-sel="' + o.v + '" aria-pressed="' + on + '"' + (o.c ? ' style="--c:' + o.c + '"' : '') + (o.tt ? ' title="' + o.tt + '"' : '') + '>' + (o.n || '') + '</button>';
  }).join('') + '</div>';
}
function leerSelector(nombre, multi){
  var g = document.querySelector('[data-grupo="' + nombre + '"]');
  if(!g) return multi ? [] : '';
  var on = [].slice.call(g.querySelectorAll('[aria-pressed="true"]')).map(function(b){ return b.dataset.sel; });
  return multi ? on : (on[0] || '');
}
var OPC_COLOR = Object.keys(COLORES).map(function(k){ return { v:k, c:COLORES[k], tt:k }; });
function botonesEd(existe, extra){
  return '<div class="botones">' + (existe ? '<button type="button" class="btn peligro" data-ed="borrar" aria-label="Borrar">' + ico('i-basura') + '</button>' : '') +
    (extra || '') + '<button type="submit" class="btn primario">' + ico('i-check') + 'Guardar</button></div>';
}
/* Copia de algo para duplicarlo: sin id, sin fecha de cambio ni historial */
function copiaDe(o){
  var c = JSON.parse(JSON.stringify(o));
  ['id', 'upd', 'del', 'delEn', 'hecha', 'hechaEn', 'log', 'veces', 'plan', 'regalo'].forEach(function(k){ delete c[k]; });
  return c;
}
function proximaHora(){ var d = new Date(); return dos((d.getHours() + 1) % 24) + ':00'; }
function sumarHora(h, min){
  var p = (h || '09:00').split(':'), t = (+p[0] * 60 + +p[1] + min) % 1440;
  return dos(Math.floor(t / 60)) + ':' + dos(t % 60);
}
/* Pasadas las 11 de la noche, la próxima hora ya es mañana */
function fechaPorDefecto(){ return ui.vista === 'calendario' ? ui.calSel : (new Date().getHours() >= 23 ? sumarDias(hoyISO(), 1) : hoyISO()); }

/* ---------- Editor de tarea ------------------------------------------------ */
function editarTarea(id, preset){
  var t = id ? JSON.parse(JSON.stringify(buscarId('tareas', id))) : Object.assign({ id:nid(), t:'', fecha:'', hora:'', prio:0, area:'', rep:'no', sub:[], notas:'', creada:Date.now() }, preset || {});
  var areas = AREAS_BASE.slice();
  vivos('tareas').forEach(function(x){ if(x.area && areas.indexOf(x.area) < 0) areas.push(x.area); });
  abrirFlotante(cabFlot(id ? 'Tarea' : 'Nueva tarea') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Qué hay que hacer', '<input name="t" required maxlength="200" value="' + esc(t.t) + '" placeholder="Ej. Renovar el DNI">') +
      '<div class="fila-campos">' + campo('Fecha', '<input type="date" name="fecha" value="' + esc(t.fecha) + '">') +
                                    campo('Hora (opcional)', '<input type="time" name="hora" value="' + esc(t.hora) + '">') + '</div>' +
      '<div class="fila-campos">' + campo('Repetir', selRep(t.rep)) +
        campo('Etiqueta (opcional)', '<input name="area" list="listaAreas" maxlength="30" value="' + esc(t.area) + '" placeholder="Ej. Casa, Tesis, Cliente X"><datalist id="listaAreas">' +
          areas.map(function(a){ return '<option value="' + esc(a) + '">'; }).join('') + '</datalist>') + '</div>' +
      (proyectosActivos().length || t.proy ? campo('Proyecto', '<select name="proy"><option value="">— Ninguno —</option>' + vivos('proyectos').filter(function(p){ return p.estado !== 'hecho' || p.id === t.proy; }).map(function(p){ return '<option value="' + p.id + '"' + (t.proy === p.id ? ' selected' : '') + '>' + esc(p.nombre) + '</option>'; }).join('') + '</select>') : '') +
      grupo('Prioridad', selector('prio', PRIOS.map(function(p, i){ return { v:String(i), n:(i ? '<span style="color:' + p.c + '">●</span> ' : '') + p.n }; }), String(t.prio || 0))) +
      grupo('Subtareas', '<div class="subtareas" id="subs">' + (t.sub || []).map(filaSub).join('') + '</div>' +
        '<button type="button" class="btn chico" data-ed="sub-add" style="align-self:flex-start;margin-top:4px">' + ico('i-plus') + 'Subtarea</button>') +
      campo('Notas', '<textarea name="notas" maxlength="4000" placeholder="Detalles, enlaces, lo que haga falta">' + esc(t.notas) + '</textarea>') +
      selectorEsp(t.esp || (id ? espDe(t) : espPorDefecto())) + botonesEd(!!id, id ? '<button type="button" class="btn" data-ed="duplicar" title="Duplicar" aria-label="Duplicar">' + ico('i-copiar') + '</button><button type="button" class="btn" data-ed="alternar">' + (t.hecha ? 'Marcar pendiente' : ico('i-check') + 'Hecha') + '</button>' : '') +
    '</form>');
  var f = $('formEd');
  if(!id) f.t.focus();
  f.onsubmit = function(e){
    e.preventDefault(); t.esp = leerSelector('esp') || t.esp || espPorDefecto();
    t.t = f.t.value.trim(); if(!t.t) return;
    t.fecha = f.fecha.value; t.hora = f.hora.value; t.rep = f.rep.value;
    if(t.rep !== 'no' && !t.fecha) t.fecha = hoyISO();
    t.area = f.area.value.trim(); t.notas = f.notas.value.trim();
    t.prio = +leerSelector('prio') || 0;
    if(f.proy){ t.proy = f.proy.value || undefined; if(t.proy){ var pp = buscarId('proyectos', t.proy); if(pp && !t.esp) t.esp = espDe(pp); } }
    t.sub = leerSubs();
    poner('tareas', t);
    cerrarFlotante(); pintar();
    if(!id) aviso('Tarea guardada', t.fecha ? relativo(t.fecha) + (t.hora ? ' · ' + t.hora : '') : null);
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); quitar('tareas', t.id, 'Tarea borrada'); pintar(); },
    alternar: function(){ cerrarFlotante(); alternarTarea(t.id); },
    duplicar: function(){ cerrarFlotante(); setTimeout(function(){ editarTarea(null, copiaDe(buscarId('tareas', t.id) || t)); }, 60); },
    'sub-add': function(){
      $('subs').insertAdjacentHTML('beforeend', filaSub({ id:nid(), t:'', ok:false }));
      var ins = $('subs').querySelectorAll('input'); ins[ins.length - 1].focus();
    }
  };
}
function filaSub(s){
  return '<div class="subtarea' + (s.ok ? ' ok' : '') + '" data-sid="' + s.id + '">' +
    '<button type="button" class="casilla cuadrada" role="checkbox" aria-checked="' + !!s.ok + '" data-ed="sub-ok">' + CHECK + '</button>' +
    '<input type="text" maxlength="160" value="' + esc(s.t) + '" placeholder="Paso">' +
    '<button type="button" class="btn-icono" data-ed="sub-x" aria-label="Quitar">' + ico('i-x') + '</button></div>';
}
function leerSubs(){
  return [].slice.call(document.querySelectorAll('#subs .subtarea')).map(function(r){
    return { id:r.dataset.sid, t:r.querySelector('input').value.trim(), ok:r.querySelector('.casilla').getAttribute('aria-checked') === 'true' };
  }).filter(function(s){ return s.t; });
}

function alternarTarea(id, boton){
  var t = buscarId('tareas', id);
  if(!t) return;
  var antes = JSON.parse(JSON.stringify(t));
  if(!t.hecha && t.rep && t.rep !== 'no'){
    /* Una tarea que se repite no se tacha: salta a la próxima vez */
    var hoy = hoyISO(), f = t.fecha || hoy;
    do{ f = siguiente(f, t.rep); }while(f <= hoy);
    t.fecha = f; t.veces = (t.veces || 0) + 1;
    t.log = (t.log || []).concat([hoy]).slice(-60);
    (t.sub || []).forEach(function(s){ s.ok = false; });
    poner('tareas', t);
    aviso('¡Hecha! Vuelve ' + relativo(f).toLowerCase(), null, 'Deshacer', function(){ poner('tareas', antes); pintar(); });
  } else {
    t.hecha = !t.hecha; t.hechaEn = t.hecha ? Date.now() : 0;
    poner('tareas', t);
    if(t.hecha) aviso('¡Hecha!', null, 'Deshacer', function(){ poner('tareas', antes); pintar(); });
  }
  if(!tareasPendientesHoy().length && (t.hecha || t.log)) setTimeout(function(){ confeti(); aviso('🎉 ¡Todo hecho por hoy!'); }, 250);
  if(boton){
    boton.setAttribute('aria-checked', 'true'); boton.classList.add('pop');
    var filaT = boton.closest('.fila');
    if(filaT && (t.hecha || t.log)) filaT.classList.add('completando');
    setTimeout(pintarSeguro, 420);
  } else pintarSeguro();
}
function tareaAManana(id){
  var t = buscarId('tareas', id);
  if(!t) return;
  var antes = JSON.parse(JSON.stringify(t));
  t.fecha = sumarDias(hoyISO(), 1);
  poner('tareas', t);
  aviso('Pasada a mañana', t.t, 'Deshacer', function(){ poner('tareas', antes); pintar(); });
  pintarSeguro();
}

/* ---------- Editor de evento ----------------------------------------------- */
function editarEvento(id, preset){
  var ini = proximaHora();
  var e = id ? JSON.parse(JSON.stringify(buscarId('eventos', id))) :
    Object.assign({ id:nid(), t:'', fecha:fechaPorDefecto(), hasta:'', todo:false, ini:ini, fin:sumarHora(ini, 60), lugar:'', color:'esp', tipo:'evento', rep:'no', aviso:15, notas:'' }, preset || {});
  var AVISOS = [[-1,'Sin aviso'],[0,'A la hora'],[5,'5 min antes'],[10,'10 min antes'],[15,'15 min antes'],[30,'30 min antes'],[60,'1 hora antes'],[120,'2 horas antes'],[1440,'1 día antes']];
  abrirFlotante(cabFlot(id ? 'Evento' : 'Nuevo evento') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Título', '<input name="t" required maxlength="200" value="' + esc(e.t) + '" placeholder="Ej. Cumpleaños de Ana, reunión, dentista">') +
      grupo('Tipo', selector('tipoEv', Object.keys(TIPOS_EV).map(function(k){ return { v:k, n:TIPOS_EV[k].em + ' ' + TIPOS_EV[k].n }; }), e.tipo || 'evento')) +
      '<div id="filaResultado" class="partido-campos" style="display:none">' +
        '<label class="interruptor"><input type="checkbox" name="jugado"' + (e.jugado ? ' checked' : '') + '>⚽ Ya lo jugué: anotar mis números</label>' +
        '<div id="filaJugado"' + (e.jugado ? '' : ' style="display:none"') + '>' +
          grupo('¿Cómo quedó?', selector('resPartido', [{ v:'v', n:'✅ Ganamos' }, { v:'e', n:'🤝 Empate' }, { v:'d', n:'❌ Perdimos' }], e.res || '')) +
          '<div class="fila-campos tres">' + campo('Marcador', '<input name="res" maxlength="40" value="' + esc(e.resultado || '') + '" placeholder="Ej. 4-2">') +
            campo('Mis goles', '<input name="goles" inputmode="numeric" value="' + esc(e.goles || '') + '" placeholder="0">') +
            campo('Asistencias', '<input name="asist" inputmode="numeric" value="' + esc(e.asist || '') + '" placeholder="0">') + '</div></div></div>' +
      '<div class="fila-campos">' + campo('Día', '<input type="date" name="fecha" required value="' + esc(e.fecha) + '">') +
                                    campo('Hasta (varios días)', '<input type="date" name="hasta" value="' + esc(e.hasta || '') + '">') + '</div>' +
      '<div class="fecha-rapida">' + [['hoy', 'Hoy'], ['man', 'Mañana'], ['1', '+1 día'], ['7', '+1 semana'], ['-1', '−1 día']].map(function(o){ return '<button type="button" data-ed="fecha-mover" data-n="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' +
      '<label class="interruptor"><input type="checkbox" name="cumple"' + (e.cumple ? ' checked' : '') + '>🎂 Es un cumpleaños o aniversario (se repite cada año)</label>' +
      '<div id="filaCumple" style="display:none"><input name="nacio" type="hidden" value="' + esc(e.nacio || '') + '"></div>' +
      '<div id="filaNoCumple"' + (e.cumple ? ' style="display:none"' : '') + '>' +
      '<label class="interruptor" style="margin-bottom:12px"><input type="checkbox" name="todo"' + (e.todo ? ' checked' : '') + '>Todo el día</label>' +
      '<div class="fila-campos" id="filaHoras"' + (e.todo ? ' style="display:none"' : '') + '>' +
        campo('Empieza', '<input type="time" name="ini" value="' + esc(e.ini || '') + '">') +
        campo('Termina', '<input type="time" name="fin" value="' + esc(e.fin || '') + '">') + '</div></div>' +
      campo('Lugar', '<input name="lugar" maxlength="120" value="' + esc(e.lugar) + '" placeholder="Opcional">') +
      '<label class="interruptor"><input type="checkbox" name="cuenta"' + (e.cuenta ? ' checked' : '') + '>⏳ Mostrar cuenta regresiva en Hoy</label>' +
      '<div class="fila-campos">' + campo('Repetir', selRep(e.rep)) +
        campo('Aviso', '<select name="aviso">' + AVISOS.map(function(a){ return '<option value="' + a[0] + '"' + (+e.aviso === a[0] ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') + '</select>') + '</div>' +
      grupo('Color', selector('color', [{ v:'esp', c:colorEsp(e), tt:'el del espacio' }].concat(OPC_COLOR), e.color || 'esp', 'colores')) +
      campo('Notas', '<textarea name="notas" maxlength="4000">' + esc(e.notas) + '</textarea>') +
      selectorEsp(e.esp || (id ? espDe(e) : espPorDefecto())) + botonesEd(!!id, '<button type="button" class="btn" data-ed="compartir" aria-label="Compartir">' + ico('i-compartir') + '</button>' + (id ? '<button type="button" class="btn" data-ed="duplicar" title="Duplicar" aria-label="Duplicar">' + ico('i-copiar') + '</button><button type="button" class="btn" data-ed="google">' + ico('i-enlace') + 'Google</button><button type="button" class="btn" data-ed="ics">.ics</button>' : '')) +
    '</form>');
  var f = $('formEd');
  if(!id) f.t.focus();
  f.todo.onchange = function(){ $('filaHoras').style.display = f.todo.checked ? 'none' : ''; };
  f.jugado.onchange = function(){ $('filaJugado').style.display = f.jugado.checked ? '' : 'none'; };
  f.cumple.onchange = function(){
    $('filaCumple').style.display = f.cumple.checked ? '' : 'none';
    $('filaNoCumple').style.display = f.cumple.checked ? 'none' : '';
    if(f.cumple.checked){ f.rep.value = 'ano'; f.aviso.value = '1440'; if(!e.color || e.color === 'acento') document.querySelectorAll('[data-grupo="color"] button').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.sel === 'rosa'); }); }
  };
  f.ini.onchange = function(){ if(f.ini.value && (!f.fin.value || f.fin.value <= f.ini.value)) f.fin.value = sumarHora(f.ini.value, 60); };
  function leer(){
    e.t = f.t.value.trim(); e.fecha = f.fecha.value || hoyISO();
    e.hasta = f.hasta.value && f.hasta.value > e.fecha ? f.hasta.value : '';
    e.todo = f.todo.checked || !f.ini.value; e.ini = f.ini.value; e.fin = f.fin.value;
    e.lugar = f.lugar.value.trim(); e.rep = f.rep.value; e.aviso = +f.aviso.value;
    e.color = leerSelector('color') || 'esp'; e.notas = f.notas.value.trim();
    e.cuenta = f.cuenta.checked;
    e.tipo = leerSelector('tipoEv') || 'evento'; e.resultado = e.tipo === 'partido' ? f.res.value.trim() : '';
    if(e.tipo === 'partido' && f.jugado.checked){ e.jugado = true; e.res = leerSelector('resPartido'); e.goles = parseInt(f.goles.value, 10) || 0; e.asist = parseInt(f.asist.value, 10) || 0; }
    else { delete e.jugado; delete e.res; delete e.goles; delete e.asist; }
    e.cumple = f.cumple.checked;
    if(e.cumple){ e.todo = true; e.rep = 'ano'; e.hasta = ''; e.nacio = parseInt(f.nacio.value, 10) || ''; if(e.aviso > 0 && e.aviso < 1440) e.aviso = 1440; e.ini = e.ini || '09:00'; }
    else delete e.nacio;
    return e;
  }
  f.onsubmit = function(ev){
    ev.preventDefault(); e.esp = leerSelector('esp') || e.esp || espPorDefecto(); leer(); if(!e.t) return;
    poner('eventos', e); cerrarFlotante(); pintar();
    if(!id) aviso((TIPOS_EV[e.tipo] || TIPOS_EV.evento).em + ' ' + (TIPOS_EV[e.tipo] || TIPOS_EV.evento).n + ' guardado', relativo(e.fecha) + (e.todo ? '' : ' · ' + e.ini));
  };
  edAcciones = {
    _color: function(){},
    'fecha-mover': function(bt){
      var v = bt.dataset.n, base = f.fecha.value || hoyISO(), nueva = v === 'hoy' ? hoyISO() : v === 'man' ? sumarDias(hoyISO(), 1) : sumarDias(base, +v);
      var delta = diasEntre(base, nueva);
      f.fecha.value = nueva;
      if(f.hasta.value) f.hasta.value = sumarDias(f.hasta.value, delta);
      vibrar(8);
    },
    borrar: function(){ cerrarFlotante(); quitar('eventos', e.id, 'Evento borrado'); pintar(); },
    google: function(){ window.open(enlaceGoogle(leer(), 'evento'), '_blank', 'noopener'); },
    ics: function(){ bajarICS([aVEVENT(leer(), 'evento')], (e.t || 'evento') + '.ics'); },
    compartir: function(){ var x = leer(); if(x.t) compartir(x.t, textoEvento(x)); },
    duplicar: function(){ var c = copiaDe(buscarId('eventos', e.id) || e); cerrarFlotante(); setTimeout(function(){ editarEvento(null, c); }, 60); }
  };
}

/* ---------- Editor de recordatorio ----------------------------------------- */
function editarRec(id, preset){
  var r = id ? JSON.parse(JSON.stringify(buscarId('recordatorios', id))) :
    Object.assign({ id:nid(), t:'', fecha:fechaPorDefecto(), hora:proximaHora(), rep:'no', notas:'' }, preset || {});
  abrirFlotante(cabFlot(id ? 'Recordatorio' : 'Nuevo recordatorio') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Recordarme', '<input name="t" required maxlength="200" value="' + esc(r.t) + '" placeholder="Ej. Pagar el internet">') +
      '<div class="fila-campos">' + campo('Día', '<input type="date" name="fecha" required value="' + esc(r.fecha) + '">') +
                                    campo('Hora', '<input type="time" name="hora" required value="' + esc(r.hora) + '">') + '</div>' +
      '<div class="fila-campos" style="grid-template-columns:repeat(4,auto);justify-content:start">' +
        [['+1 h',60],['+3 h',180],['Mañana 9:00','m'],['Sábado 10:00','s']].map(function(o){
          return '<button type="button" class="btn chico" data-ed="rapido" data-v="' + o[1] + '">' + o[0] + '</button>';
        }).join('') + '</div>' +
      campo('Repetir', selRep(r.rep)) +
      campo('Notas', '<textarea name="notas" maxlength="2000">' + esc(r.notas) + '</textarea>') +
      selectorEsp(r.esp || (id ? espDe(r) : espPorDefecto())) + botonesEd(!!id, '<button type="button" class="btn" data-ed="google">' + ico('i-enlace') + 'Google</button><button type="button" class="btn" data-ed="ics">.ics</button>') +
    '</form>');
  var f = $('formEd');
  if(!id && !r.t) f.t.focus();
  function leer(){
    r.t = f.t.value.trim(); r.fecha = f.fecha.value || hoyISO(); r.hora = f.hora.value || '09:00';
    r.rep = f.rep.value; r.notas = f.notas.value.trim();
    return r;
  }
  f.onsubmit = function(ev){
    ev.preventDefault(); r.esp = leerSelector('esp') || r.esp || espPorDefecto(); leer(); if(!r.t) return;
    delete r.pospuesto; r.hecho = false;
    poner('recordatorios', r); cerrarFlotante(); pintar();
    aviso(id ? 'Recordatorio guardado' : 'Te lo recordaré', relativo(r.fecha) + ' · ' + r.hora);
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); quitar('recordatorios', r.id, 'Recordatorio borrado'); pintar(); },
    rapido: function(b){
      var v = b.dataset.v, d = new Date();
      if(v === 'm'){ f.fecha.value = sumarDias(hoyISO(), 1); f.hora.value = '09:00'; }
      else if(v === 's'){ f.fecha.value = sumarDias(hoyISO(), ((6 - d.getDay() + 7) % 7) || 7); f.hora.value = '10:00'; }
      else { d = new Date(Date.now() + (+v) * 60000); f.fecha.value = iso(d); f.hora.value = dos(d.getHours()) + ':' + dos(d.getMinutes()); }
    },
    google: function(){ window.open(enlaceGoogle(leer(), 'rec'), '_blank', 'noopener'); },
    ics: function(){ bajarICS([aVEVENT(leer(), 'rec')], (r.t || 'recordatorio') + '.ics'); }
  };
}

function alternarRec(id, boton){
  var r = buscarId('recordatorios', id);
  if(!r) return;
  var antes = JSON.parse(JSON.stringify(r));
  if(r.rep && r.rep !== 'no' && !r.hecho){
    var ya = hoyISO() + 'T' + horaAhora(), f = r.fecha;
    do{ f = siguiente(f, r.rep); }while(f + 'T' + r.hora <= ya);
    r.fecha = f; delete r.pospuesto;
    poner('recordatorios', r);
    aviso('Hecho. El próximo: ' + relativo(f).toLowerCase() + ' · ' + r.hora, null, 'Deshacer', function(){ poner('recordatorios', antes); pintar(); });
  } else {
    r.hecho = !r.hecho; delete r.pospuesto;
    poner('recordatorios', r);
    if(r.hecho) aviso('Hecho', null, 'Deshacer', function(){ poner('recordatorios', antes); pintar(); });
  }
  if(boton){ boton.setAttribute('aria-checked', 'true'); boton.classList.add('pop'); setTimeout(pintarSeguro, 320); }
  else pintarSeguro();
}

function posponer(id, minutos){
  var r = buscarId('recordatorios', id);
  if(!r) return;
  var d;
  if(minutos === 'tarde'){ d = new Date(); d.setHours(18, 0, 0, 0); }
  else if(minutos === 'manana'){ d = deISO(sumarDias(hoyISO(), 1)); d.setHours(9, 0, 0, 0); }
  else d = new Date(Date.now() + minutos * 60000);
  r.pospuesto = iso(d) + 'T' + dos(d.getHours()) + ':' + dos(d.getMinutes());
  poner('recordatorios', r);
  cerrarFlotante(); pintarSeguro();
  aviso('Pospuesto', relativo(iso(d)) + ' · ' + dos(d.getHours()) + ':' + dos(d.getMinutes()));
}
function menuPosponer(id){
  var h = new Date().getHours();
  abrirFlotante(cabFlot('Posponer') + '<div class="form">' +
    [[10,'10 minutos'],[30,'30 minutos'],[60,'1 hora'],[180,'3 horas']].concat(h < 17 ? [['tarde','Esta tarde (18:00)']] : []).concat([['manana','Mañana a las 9:00']]).map(function(o){
      return '<button class="btn" data-acc="posponer" data-id="' + id + '" data-m="' + o[0] + '">' + ico('i-dormir') + o[1] + '</button>';
    }).join('') + '</div>');
}

/* ---------- Editor de nota: se guarda sola mientras escribes --------------- */
function editarNota(id){
  var n = id ? JSON.parse(JSON.stringify(buscarId('notas', id))) : { id:nid(), t:'', cuerpo:'', color:'', fija:false };
  var existe = !!id, reloj = null;
  abrirFlotante(cabFlot(id ? 'Nota' : 'Nueva nota') +
    '<form class="form" id="formEd" autocomplete="off">' +
      '<input class="entrada" name="t" maxlength="120" value="' + esc(n.t) + '" placeholder="Título" style="font-weight:700;font-size:17px">' +
      '<label class="campo"><textarea name="cuerpo" rows="10" maxlength="20000" placeholder="Escribe…" style="min-height:220px">' + esc(n.cuerpo) + '</textarea></label>' +
      grupo('Color', selector('color', [{ v:'', c:'var(--regla)', tt:'sin color' }].concat(OPC_COLOR), n.color || '', 'colores')) +
      selectorEsp(n.esp || (id ? espDe(n) : espPorDefecto())) +
      '<label class="interruptor"><input type="checkbox" name="fija"' + (n.fija ? ' checked' : '') + '>Fijar arriba y en Hoy</label>' +
      '<div class="botones">' + '<button type="button" class="btn peligro" data-ed="borrar" aria-label="Borrar">' + ico('i-basura') + '</button>' +
        '<button type="button" class="btn" data-ed="casilla" title="Convertir la línea en casilla">☑</button>' +
        '<button type="button" class="btn" data-ed="a-lista" title="Crear una lista con las líneas de la nota">' + ico('i-listas') + 'A lista</button>' +
        '<button type="submit" class="btn primario">' + ico('i-check') + 'Listo</button></div>' +
    '</form>', function(){ guardarYa(); pintarSeguro(); });
  var f = $('formEd');
  (id ? f.cuerpo : f.t).focus();
  function guardarYa(){
    clearTimeout(reloj);
    var t = f.t.value.trim(), c = f.cuerpo.value.replace(/\s+$/, '');
    var col = leerSelector('color'), fija = f.fija.checked, esp = leerSelector('esp') || n.esp || 'personal';
    if(!existe && !t && !c) return;
    if(n.t === t && n.cuerpo === c && (n.color || '') === col && !!n.fija === fija && n.esp === esp && existe) return;
    n.t = t; n.cuerpo = c; n.color = col; n.fija = fija; n.esp = esp; existe = true;
    poner('notas', n);
  }
  f.oninput = function(){ clearTimeout(reloj); reloj = setTimeout(guardarYa, 500); };
  f.onchange = guardarYa;
  f.onsubmit = function(ev){ ev.preventDefault(); cerrarFlotante(); };
  edAcciones = {
    borrar: function(){
      clearTimeout(reloj); alCerrarFlot = null; cerrarFlotante();
      if(buscarId('notas', n.id)){ quitar('notas', n.id, 'Nota borrada'); }
      pintar();
    },
    '_color': guardarYa,
    'a-lista': function(){
      var lineas = f.cuerpo.value.split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
      if(!lineas.length){ aviso('La nota está vacía', 'Escribe una cosa por línea y vuelve a tocar «A lista».'); return; }
      guardarYa();
      var l = { id:nid(), nombre:(f.t.value.trim() || 'Lista').slice(0, 60), em:'📝', color:'acento', esp:n.esp || 'personal', creada:Date.now(),
        items:lineas.slice(0, 200).map(function(x){ var ok = /^\[x\]/i.test(x); return { id:nid(), t:x.replace(/^(\[[ x]\]|[-•*·]|\d+[.)])\s*/i, '').slice(0, 160) || x.slice(0, 160), ok:ok }; }) };
      poner('listas', l); alCerrarFlot = null; cerrarFlotante();
      aviso('📋 Lista creada con ' + l.items.length + (l.items.length === 1 ? ' cosa' : ' cosas'), l.nombre, 'Abrir', function(){ ir('listas'); ui.lista = l.id; pintar(); });
      pintar();
    },
    compartir: function(){ var t = f.t.value.trim(), c = f.cuerpo.value.trim(); if(t || c) compartir(t || 'Nota', (t ? '*' + t + '*\n' : '') + c.replace(/\[x\]/gi, '✅').replace(/\[ \]/g, '⬜')); },
    casilla: function(){
      var ta = f.cuerpo, pos = ta.selectionStart || ta.value.length, ini = ta.value.lastIndexOf('\n', pos - 1) + 1;
      if(RE_CASILLA.test(ta.value.slice(ini))) return;
      ta.setRangeText('[ ] ', ini, ini, 'end'); ta.focus(); guardarYa();
    }
  };
}

/* ---------- Editor de hábito ---------------------------------------------- */
var EMOJIS_H = ['💧','📚','🏃','🧘','😴','💰','🥗','💊','🦷','🚭','✍️','🎸','🧹','📵','🙏','⭐'];
function editarHabito(id, preset){
  var x = id ? JSON.parse(JSON.stringify(buscarId('habitos', id))) :
    Object.assign({ id:nid(), nombre:'', em:'⭐', dias:[0,1,2,3,4,5,6], marcas:{}, creada:Date.now() }, preset || {});
  var orden = pref.lunes ? [1,2,3,4,5,6,0] : [0,1,2,3,4,5,6];
  abrirFlotante(cabFlot(id ? 'Hábito' : 'Nuevo hábito') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Hábito', '<input name="n" required maxlength="60" value="' + esc(x.nombre) + '" placeholder="Ej. Caminar 30 minutos">') +
      grupo('Icono', selector('em', EMOJIS_H.map(function(e){ return { v:e, n:e }; }), x.em, 'emojis')) +
      grupo('Qué días', selector('dias', orden.map(function(d){ return { v:String(d), n:cap(DIAS3[d]) }; }), (x.dias || [0,1,2,3,4,5,6]).map(String), '', true)) +
      campo('Avisarme a las (opcional)', '<input type="time" name="h" value="' + esc(x.hora || '') + '">') +
      selectorEsp(x.esp || (id ? espDe(x) : espPorDefecto())) + botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  if(!id) f.n.focus();
  f.onsubmit = function(ev){
    ev.preventDefault(); x.esp = leerSelector('esp') || x.esp || espPorDefecto();
    x.nombre = f.n.value.trim(); if(!x.nombre) return;
    x.em = leerSelector('em') || '⭐';
    var d = leerSelector('dias', true).map(Number);
    x.dias = d.length ? d : [0,1,2,3,4,5,6];
    x.hora = f.h.value || '';
    poner('habitos', x); cerrarFlotante(); pintar();
    if(x.hora && 'Notification' in window && Notification.permission === 'default') pedirPermiso();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('habitos', x.id, 'Hábito borrado'); pintar(); } };
}
function alternarHabito(id, dia){
  var x = buscarId('habitos', id);
  if(!x) return;
  x.marcas = x.marcas || {};
  if(x.marcas[dia]) delete x.marcas[dia]; else x.marcas[dia] = 1;
  poner('habitos', x);
  if(x.marcas[dia] && dia === hoyISO()){
    var r = racha(x);
    if(r > 1 && (r % 7 === 0 || r === 3)) aviso('🔥 ¡' + r + ' días seguidos!', x.nombre);
  }
  pintarSeguro();
}

/* ---------- Editor de lista ----------------------------------------------- */
var PLANTILLAS = {
  vacia:  { n:'En blanco', em:'📝', items:[] },
  compra: { n:'Compras', em:'🛒', c:'verde', items:['Leche','Pan','Huevos','Arroz','Fruta','Verduras','Pollo','Papel higiénico'] },
  viaje:  { n:'Maleta de viaje', em:'🧳', c:'azul', items:['DNI / pasaporte','Cargador del celular','Ropa','Pijama','Cepillo de dientes','Medicinas','Audífonos','Dinero en efectivo'] },
  casa:   { n:'Limpieza de casa', em:'🧹', c:'oro', items:['Barrer y trapear','Lavar la ropa','Cambiar sábanas','Limpiar el baño','Sacar la basura','Regar las plantas'] },
  pelis:  { n:'Pelis y series', em:'🎬', c:'rosa', items:[] },
  ideas:  { n:'Ideas', em:'💡', c:'acento', items:[] }
};
var EMOJIS_L = ['📝','🛒','🧳','🏠','🧹','🎬','💡','🎁','📚','💼','🍳','🐶','🚗','✈️','🎯','❤️'];
function editarLista(id){
  var l = id ? JSON.parse(JSON.stringify(buscarId('listas', id))) : { id:nid(), nombre:'', em:'📝', color:'acento', items:[], creada:Date.now() };
  abrirFlotante(cabFlot(id ? 'Editar lista' : 'Nueva lista') +
    '<form class="form" id="formEd" autocomplete="off">' +
      (!id ? grupo('Empezar desde', '<div class="selector" id="plantillas">' + Object.keys(PLANTILLAS).map(function(k){
        return '<button type="button" data-ed="plantilla" data-v="' + k + '" aria-pressed="' + (k === 'vacia') + '">' + PLANTILLAS[k].em + ' ' + PLANTILLAS[k].n + '</button>';
      }).join('') + '</div>') : '') +
      campo('Nombre', '<input name="n" required maxlength="60" value="' + esc(l.nombre) + '" placeholder="Ej. Compras del mes">') +
      grupo('Icono', selector('em', EMOJIS_L.map(function(e){ return { v:e, n:e }; }), l.em, 'emojis')) +
      grupo('Color', selector('color', OPC_COLOR, l.color || 'acento', 'colores')) +
      selectorEsp(l.esp || (id ? espDe(l) : espPorDefecto())) + botonesEd(!!id, id ? '<button type="button" class="btn" data-ed="duplicar">' + ico('i-copiar') + 'Duplicar</button>' : '') +
    '</form>');
  var f = $('formEd'), plantilla = 'vacia';
  if(!id) f.n.focus();
  f.onsubmit = function(ev){
    ev.preventDefault(); l.esp = leerSelector('esp') || l.esp || espPorDefecto();
    l.nombre = f.n.value.trim(); if(!l.nombre) return;
    l.em = leerSelector('em') || '📝'; l.color = leerSelector('color') || 'acento';
    if(!id) l.items = PLANTILLAS[plantilla].items.map(function(t){ return { id:nid(), t:t, ok:false }; });
    poner('listas', l); cerrarFlotante();
    ui.lista = l.id; ui.vista = 'listas'; pintar();
    setTimeout(function(){ var i = $('nuevoItem'); if(i && !id && !l.items.length) i.focus(); }, 50);
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); ui.lista = null; quitar('listas', l.id, 'Lista borrada'); pintar(); },
    duplicar: function(){
      var o = buscarId('listas', l.id) || l, c = copiaDe(o);
      c.id = nid(); c.nombre = (o.nombre + ' (copia)').slice(0, 60); c.creada = Date.now(); delete c.frec;
      c.items = (o.items || []).map(function(x){ return { id:nid(), t:x.t, ok:false }; });
      poner('listas', c); cerrarFlotante(); ui.lista = c.id; ir('listas'); pintar();
      aviso('Lista duplicada', c.nombre + ' · todo sin marcar');
    },
    plantilla: function(b){
      plantilla = b.dataset.v;
      $('plantillas').querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var p = PLANTILLAS[plantilla];
      if(plantilla !== 'vacia') f.n.value = p.n;
      document.querySelectorAll('[data-grupo="em"] button').forEach(function(x){ x.setAttribute('aria-pressed', x.dataset.sel === p.em); });
      document.querySelectorAll('[data-grupo="color"] button').forEach(function(x){ x.setAttribute('aria-pressed', x.dataset.sel === (p.c || 'acento')); });
    }
  };
}
function cambiarLista(fn){
  var l = listaActual();
  if(!l) return;
  l.items = l.items || [];
  fn(l);
  poner('listas', l);
}

/* ---------- Menús ---------------------------------------------------------- */
function menuNuevo(){
  var ops = [['tarea','i-tareas','Tarea'],['rec','i-campana','Recordatorio'],['evento','i-cal','Evento'],['nota','i-notas','Nota'],['lista','i-listas','Lista'],['habito','i-habitos','Hábito'],['meta','i-meta','Meta'],['proyecto','i-carpeta','Proyecto'],['curso','i-birrete','Curso'],['deuda','i-cuentas','Préstamo'],['rutina','i-meta','Rutina de gym'],['cobro','i-subir','Cobro pendiente'],['entreno','i-balon','Entrenamiento'],['pago','i-recibo','Pago fijo'],['diario','i-diario','Diario'],['personal','i-cuentas','Gasto personal'],['oficina','i-maletin','Movimiento de oficina']];
  abrirFlotante(cabFlot('Añadir') + '<div class="rejilla-mas">' + ops.map(function(o){
    return '<button type="button" data-acc="nuevo" data-tipo="' + o[0] + '">' + ico(o[1]) + o[2] + '</button>';
  }).join('') + '</div>');
}
function menuMas(){
  var k = contadores(), grupos = [], g = null;
  navSecs().forEach(function(sc){
    if(sc.id === 'hoy') return;
    if(sc.g){ g = { n:sc.g, items:[] }; grupos.push(g); }
    g.items.push(sc);
  });
  abrirFlotante(cabFlot('Más') + grupos.map(function(gr){
    var esEsp = gr.n === 'Espacios';
    return '<div class="mas-grupo"><h4>' + gr.n + '</h4><div class="rejilla-mas' + (esEsp ? ' espacios' : '') + '">' + gr.items.map(function(sc){
      var n = sc.id === 'calendario' ? k.recordatorios : sc.id === 'tareas' ? k.tareas : sc.id === 'dinero' ? k.pagos : 0;
      var E = sc.esp ? espInfo(sc.esp) : null;
      return '<button type="button" data-ir="' + sc.id + '"' + (E ? ' style="--c:' + E.c + '"' : '') + (secPadre(ui.vista) === sc.id ? ' aria-current="page"' : '') + '>' + (E ? '<span class="em">' + E.em + '</span>' : ico(sc.ico)) + '<span>' + sc.nom + '</span>' + (n ? '<span class="globo">' + n + '</span>' : '') + '</button>';
    }).join('') + '</div></div>';
  }).join('') +
    '<div class="mas-grupo"><h4>Herramientas</h4><div class="rejilla-mas"><button type="button" data-ir="secciones">' + ico('i-espacios') + '<span>Administrar secciones</span></button><button type="button" data-acc="buscar">' + ico('i-buscar') + '<span>Buscar</span></button>' +
    '<button type="button" data-ir="ajustes">' + ico('i-ajustes') + '<span>Ajustes</span></button><button type="button" data-acc="personalizar-hoy">' + ico('i-hoy') + '<span>Personalizar Hoy</span></button>' +
    '<button type="button" data-ir="papelera">' + ico('i-basura') + '<span>Papelera</span>' + (enPapelera().length ? '<span class="globo gris">' + enPapelera().length + '</span>' : '') + '</button></div></div>');
}
function nuevo(tipo, preset){
  cerrarFlotante();
  if(tipo === 'tarea') editarTarea(null, Object.assign(ui.vista === 'calendario' ? { fecha:ui.calSel } : {}, preset));
  else if(tipo === 'rec') editarRec(null, preset);
  else if(tipo === 'evento') editarEvento(null, preset);
  else if(tipo === 'nota') editarNota(null);
  else if(tipo === 'lista') editarLista(null);
  else if(tipo === 'habito') editarHabito(null, preset);
  else if(tipo === 'meta') editarMeta(null, preset);
  else if(tipo === 'curso') editarCurso(null);
  else if(tipo === 'cobro') editarCobro(null);
  else if(tipo === 'proyecto') editarProyecto(null);
  else if(tipo === 'deuda') editarDeuda(null);
  else if(tipo === 'rutina') editarRutina(null);
  else if(tipo === 'entreno') editarEntreno(null, preset);
  else if(tipo === 'pago') editarPago(null, preset);
  else if(tipo === 'diario'){ ui.diarioDia = hoyISO(); ir('diario'); setTimeout(function(){ var t = $('textoDiario'); if(t) t.focus(); }, 60); }
  else if(tipo === 'personal' || tipo === 'oficina'){ gastoRapido(tipo, 'Gasto'); }
  else if(tipo === 'dinero'){ gastoRapido('personal', 'Gasto'); }
}
function nuevoSegunVista(){
  var v = ui.vista;
  if(v === 'habitos') nuevo('habito');
  else if(v === 'metas') nuevo('meta');
  else if(v === 'pagos') nuevo('pago');
  else if(v === 'proyectos'){ if(ui.proy && $('proyTarea')) $('proyTarea').focus(); else nuevo('proyecto'); }
  else if(v === 'agenda') hojaAnadir();
  else if(v === 'dinero' || v === 'movimientos'){ var lb = v === 'movimientos' ? ui.movLibro : ui.dinLibro; gastoRapido(lb === 'oficina' ? 'oficina' : 'personal', 'Gasto'); }
  else if(v === 'diario'){ var td = $('textoDiario'); if(td) td.focus(); }
  else if(v === 'listas'){ if(ui.lista && $('nuevoItem')) $('nuevoItem').focus(); else nuevo('lista'); }
  else hojaAnadir();
}

/* ---------- Buscar en todo ------------------------------------------------- */
function abrirBuscar(){
  abrirFlotante(cabFlot('Buscar') + '<input class="entrada" id="q" type="search" placeholder="Qué buscas o qué quieres hacer… ej. «gasto», «luz», «examen»" autocomplete="off">' +
    '<div id="resultados" style="margin-top:10px"></div>');
  var q = $('q');
  q.focus();
  var recientes = pref.busq || [];
  function inicio(){
    return '<p class="ha-guia" style="margin-top:12px">Escribe una palabra: te muestro qué puedes hacer, a dónde ir y lo que ya tienes guardado.</p>' + (recientes.length ? '<div class="busq-rec"><small>Recientes</small>' + recientes.map(function(r){ return '<button type="button" class="ficha" data-acc="busq-reciente" data-v="' + esc(r) + '">' + ico('i-buscar') + esc(r) + '</button>'; }).join('') + '</div>' : '');
  }
  $('resultados').innerHTML = inicio();
  var guardarReloj = null;
  q.oninput = function(){
    var v = q.value.trim();
    $('resultados').innerHTML = v ? resultados(q.value) : inicio();
    clearTimeout(guardarReloj);
    if(v.length >= 3) guardarReloj = setTimeout(function(){
      pref.busq = [v].concat((pref.busq || []).filter(function(x){ return x.toLowerCase() !== v.toLowerCase() && v.toLowerCase().indexOf(x.toLowerCase()) !== 0; })).slice(0, 6);
      escribirJSON(CLAVE_PREF, pref);
    }, 1200);
  };
}
function resultados(texto){
  var q = sinTildes(texto.trim());
  if(q.length < 2) return '<div class="vacio">Escribe al menos dos letras.</div>';
  function marca(s){
    var b = sinTildes(s), i = b.indexOf(q);
    if(i < 0) return esc(s);
    return esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length));
  }
  var out = [];
  /* Primero lo que puedes HACER y a DÓNDE IR con esas palabras */
  var palabras = q.split(/\s+/).filter(Boolean);
  function calza(x){ var h = sinTildes((x.t + ' ' + x.d + ' ' + x.p).toLowerCase()); return palabras.every(function(w){ return h.indexOf(w.toLowerCase()) >= 0; }); }
  var accs = ACCIONES.filter(calza).slice(0, 3), dests = DESTINOS.filter(calza).slice(0, 3);
  if(accs.length || dests.length) out.push('<div class="busq-guia">' + accs.map(filaAccion).join('') + dests.map(filaDestino).join('') + '</div>');
  function add(icono, t, sub, acc, id, extra){ out.push('<button class="resultado" data-acc="' + acc + '" data-id="' + id + '"' + (extra || '') + '>' + ico(icono) + '<div style="min-width:0"><b>' + marca(t) + '</b><small>' + esc(sub) + '</small></div></button>'); }
  vivos('tareas').forEach(function(t){ if(sinTildes(t.t + ' ' + (t.notas || '') + ' ' + (t.area || '')).indexOf(q) >= 0) add('i-tareas', t.t, 'Tarea' + (t.hecha ? ' hecha' : '') + (t.fecha ? ' · ' + relativo(t.fecha) : ''), 'tarea-ed', t.id); });
  vivos('eventos').forEach(function(e){ if(sinTildes(e.t + ' ' + (e.lugar || '') + ' ' + (e.notas || '')).indexOf(q) >= 0) add('i-cal', e.t, 'Evento · ' + fechaCorta(e.fecha), 'evento-ed', e.id); });
  vivos('recordatorios').forEach(function(r){ if(sinTildes(r.t + ' ' + (r.notas || '')).indexOf(q) >= 0) add('i-campana', r.t, 'Recordatorio · ' + relativo(r.fecha) + ' ' + r.hora, 'rec-ed', r.id); });
  vivos('notas').forEach(function(n){ var s = n.t || n.cuerpo.split('\n')[0]; if(sinTildes(n.t + ' ' + n.cuerpo).indexOf(q) >= 0) add('i-notas', s || 'Nota', 'Nota', 'nota-ed', n.id); });
  vivos('listas').forEach(function(l){
    if(sinTildes(l.nombre).indexOf(q) >= 0) add('i-listas', l.nombre, 'Lista', 'lista-abrir', l.id);
    (l.items || []).forEach(function(i){ if(sinTildes(i.t).indexOf(q) >= 0) add('i-listas', i.t, 'En la lista ' + l.nombre + (i.ok ? ' · marcado' : ''), 'lista-abrir', l.id); });
  });
  vivos('habitos').forEach(function(x){ if(sinTildes(x.nombre).indexOf(q) >= 0) add('i-habitos', x.nombre, 'Hábito', 'habito-ed', x.id); });
  vivos('cursos').forEach(function(c){ if(sinTildes(c.nombre + ' ' + (c.prof || '') + ' ' + (c.aula || '')).indexOf(q) >= 0) add('i-birrete', c.nombre, 'Curso' + (c.aula ? ' · ' + c.aula : ''), 'curso-ed', c.id); });
  vivos('rutinas').forEach(function(r){ if(sinTildes(r.nombre + ' ' + (r.ejercicios || []).map(function(x){ return x.n; }).join(' ')).indexOf(q) >= 0) add('i-meta', r.nombre, 'Rutina de gym · ' + (r.ejercicios || []).length + ' ejercicios', 'rutina-ed', r.id); });
  vivos('entrenos').forEach(function(e){ var d = deporteInfo(e.tipo); if(sinTildes(d.n + ' ' + (e.notas || '')).indexOf(q) >= 0) add('i-balon', d.em + ' ' + d.n + (e.notas ? ' · ' + e.notas.slice(0, 40) : ''), 'Entrenamiento · ' + fechaCorta(e.fecha), 'entreno-ed', e.id); });
  vivos('metas').forEach(function(m){ if(sinTildes(m.t).indexOf(q) >= 0) add('i-meta', m.t, 'Meta · ' + formNum(+m.actual || 0) + ' de ' + formNum(+m.objetivo || 0), 'meta-ed', m.id); });
  vivos('pagos').forEach(function(p){ if(sinTildes(p.t + ' ' + (p.cat || '')).indexOf(q) >= 0) add('i-recibo', p.t, 'Pago fijo · día ' + p.dia + ' · ' + dinero(+p.monto || 0), 'pago-ed', p.id); });
  vivos('diario').forEach(function(x){ if(x.texto && sinTildes(x.texto).indexOf(q) >= 0) add('i-diario', x.texto.split('\n')[0].slice(0, 80), 'Diario · ' + fechaCorta(x.id), 'diario-dia', x.id, ' data-dia="' + x.id + '"'); });
  return out.length ? out.slice(0, 60).join('') : '<div class="vacio">Nada con «' + esc(texto) + '».</div>';
}

/* ==========================================================================
   CALENDARIO DEL TELÉFONO
   Google Calendar por enlace (abre la app en Android) y .ics para todo lo
   demás (iPhone lo abre directamente). Así las alarmas importantes suenan
   aunque el teléfono esté bloqueado y la agenda cerrada.
   ========================================================================== */
function sinGuiones(f){ return f.replace(/-/g, ''); }
function horaICS(h){ return (h || '09:00').replace(':', '') + '00'; }
function reglaRep(rep){
  return { dia:'FREQ=DAILY', lab:'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', sem:'FREQ=WEEKLY', mes:'FREQ=MONTHLY', ano:'FREQ=YEARLY' }[rep] || '';
}
function tramo(x, tipo){
  if(tipo === 'rec'){
    var fin = sumarHora(x.hora, 15);
    return { todo:false, a:sinGuiones(x.fecha) + 'T' + horaICS(x.hora), b:sinGuiones(fin < x.hora ? sumarDias(x.fecha, 1) : x.fecha) + 'T' + horaICS(fin), aviso:0 };
  }
  if(x.todo) return { todo:true, a:sinGuiones(x.fecha), b:sinGuiones(sumarDias(x.hasta || x.fecha, 1)), aviso:x.aviso };
  var fin2 = x.fin && x.fin > x.ini ? x.fin : sumarHora(x.ini, 60);
  var diaFin = x.hasta || x.fecha;
  if(fin2 <= x.ini) diaFin = sumarDias(diaFin, 1);   // termina pasada la medianoche
  return { todo:false, a:sinGuiones(x.fecha) + 'T' + horaICS(x.ini), b:sinGuiones(diaFin) + 'T' + horaICS(fin2), aviso:x.aviso };
}
function enlaceGoogle(x, tipo){
  var t = tramo(x, tipo), r = reglaRep(x.rep);
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(x.t || '') +
    '&dates=' + t.a + '/' + t.b +
    (x.notas ? '&details=' + encodeURIComponent(x.notas) : '') +
    (x.lugar ? '&location=' + encodeURIComponent(x.lugar) : '') +
    (r ? '&recur=' + encodeURIComponent('RRULE:' + r) : '');
}
function textoICS(s){ return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
function aVEVENT(x, tipo){
  var t = tramo(x, tipo), r = reglaRep(x.rep);
  var sello = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  var l = ['BEGIN:VEVENT', 'UID:' + x.id + '@agenda', 'DTSTAMP:' + sello,
    t.todo ? 'DTSTART;VALUE=DATE:' + t.a : 'DTSTART:' + t.a,
    t.todo ? 'DTEND;VALUE=DATE:' + t.b : 'DTEND:' + t.b,
    'SUMMARY:' + textoICS(x.t)];
  if(x.notas) l.push('DESCRIPTION:' + textoICS(x.notas));
  if(x.lugar) l.push('LOCATION:' + textoICS(x.lugar));
  if(r) l.push('RRULE:' + r);
  if(t.aviso != null && +t.aviso >= 0){
    l.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + textoICS(x.t), 'TRIGGER:-PT' + (+t.aviso) + 'M', 'END:VALARM');
  }
  l.push('END:VEVENT');
  return l.join('\r\n');
}
function bajarICS(eventos, nombre){
  var txt = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Agenda personal//ES', 'CALSCALE:GREGORIAN'].concat(eventos).concat(['END:VCALENDAR']).join('\r\n');
  bajar(new Blob([txt], { type:'text/calendar;charset=utf-8' }), nombre.replace(/[\\/:*?"<>|]+/g, '_'));
}
/* Todas las descargas pasan por aquí: en la vista previa de Claude se
   usa su permiso de descargas; en el navegador o la app instalada, la
   descarga de siempre. Los libros de cuentas también la usan. */
var descargasClaude;
function bajar(blob, nombre){
  var c = window.claude;
  if(descargasClaude === undefined && c && typeof c.use === 'function'){
    descargasClaude = null;
    c.use('downloads').then(function(d){ descargasClaude = d || null; if(d) bajar(blob, nombre); else bajarDirecto(blob, nombre); }, function(){ bajarDirecto(blob, nombre); });
    return;
  }
  if(descargasClaude){
    descargasClaude.save({ filename:nombre, data:blob }).then(function(){ aviso('📥 Archivo guardado', nombre); }, function(e){
      var k = e && e.code;
      if(k === 'declined') return;
      if(k === 'rate_limited') aviso('Espera un momento', 'Ya hay una descarga pendiente de confirmar.');
      else if(k === 'rejected_extension' || k === 'extension_not_enabled') aviso('Este tipo de archivo no se puede guardar aquí', 'Ábrelo desde la app instalada o el navegador.');
      else bajarDirecto(blob, nombre);
    });
    return;
  }
  bajarDirecto(blob, nombre);
}
window.guardarArchivo = bajar;
function bajarDirecto(blob, nombre){
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* ==========================================================================
   AVISOS EN PANTALLA
   ========================================================================== */
var edAcciones = {};
function aviso(titulo, texto, boton, alPulsar, alarma){
  var caja = $('avisos');
  var el = document.createElement('div');
  el.className = 'aviso' + (alarma ? ' alarma' : '');
  el.innerHTML = '<div class="txt"><b>' + esc(titulo) + '</b>' + (texto ? esc(texto) : '') + '</div>' +
    (boton ? '<button type="button">' + esc(boton) + '</button>' : '') +
    (alarma ? '<button type="button" data-cerrar="1">OK</button>' : '');
  if(boton) el.querySelector('button').onclick = function(){ el.remove(); alPulsar(); };
  var ok = el.querySelector('[data-cerrar]');
  if(ok) ok.onclick = function(){ el.remove(); };
  /* Un aviso a la vez (las alarmas se quedan): no tapan la pantalla */
  if(!alarma) [].slice.call(caja.querySelectorAll('.aviso:not(.alarma)')).forEach(function(x){ x.remove(); });
  el.querySelector('.txt').onclick = function(){ if(!alarma) el.remove(); };
  caja.appendChild(el);
  while(caja.children.length > 3) caja.firstChild.remove();
  if(!alarma) setTimeout(function(){ el.remove(); }, boton ? 6000 : 3200);
  return el;
}

/* ==========================================================================
   ALARMAS
   Cada 15 segundos se mira si algo toca. Lo que ya sonó se apunta en este
   aparato para no repetirlo. Si abres la agenda y algo venció hace horas,
   no te llueven veinte alarmas: sale en "Pasados sin marcar".
   ========================================================================== */
var MARGEN_VIEJO = 6 * 3600e3;
function momentoMs(fecha, hora){ var d = deISO(fecha); var p = (hora || '09:00').split(':'); d.setHours(+p[0], +p[1], 0, 0); return d.getTime(); }

function revisarAlarmas(){
  var ahora = Date.now(), hoy = hoyISO(), manana = sumarDias(hoy, 1), sonar = [];

  vivos('recordatorios').forEach(function(r){
    if(r.hecho || !r.fecha) return;
    var m = momentoR(r), ms = momentoMs(m.slice(0, 10), m.slice(11, 16));
    var k = 'r:' + r.id + ':' + m;
    if(ms <= ahora && !avisados[k]){
      avisados[k] = ahora;
      if(ahora - ms < MARGEN_VIEJO) sonar.push({ t:r.t, cuerpo:'Recordatorio · ' + m.slice(11, 16), id:r.id, tipo:'rec' });
    }
  });
  vivos('tareas').forEach(function(t){
    if(t.hecha || !t.fecha || !t.hora) return;
    var ms = momentoMs(t.fecha, t.hora), k = 't:' + t.id + ':' + t.fecha + t.hora;
    if(ms <= ahora && !avisados[k]){
      avisados[k] = ahora;
      if(ahora - ms < MARGEN_VIEJO) sonar.push({ t:t.t, cuerpo:'Tarea para las ' + t.hora, id:t.id, tipo:'tarea' });
    }
  });
  vivos('eventos').forEach(function(e){
    if(e.todo || !e.ini || e.aviso == null || +e.aviso < 0) return;
    [hoy, manana].forEach(function(d){
      if(!ocurre(e.fecha, e.rep, d, e.hasta)) return;
      var ini = momentoMs(d, e.ini), cuando = ini - (+e.aviso) * 60000, k = 'e:' + e.id + ':' + d;
      if(cuando <= ahora && ahora < ini + 30 * 60000 && !avisados[k]){
        avisados[k] = ahora;
        sonar.push({ t:e.t, cuerpo:(+e.aviso ? 'Empieza a las ' + e.ini : 'Empieza ahora') + (e.lugar ? ' · ' + e.lugar : ''), id:e.id, tipo:'evento' });
      }
    });
  });

  /* Hábitos con hora: si hoy toca y aún no lo marcaste */
  vivos('habitos').forEach(function(x){
    if(!x.hora || (x.dias && x.dias.indexOf(deISO(hoy).getDay()) < 0) || (x.marcas && x.marcas[hoy])) return;
    var ms = momentoMs(hoy, x.hora), k = 'h:' + x.id + ':' + hoy;
    if(ms <= ahora && !avisados[k]){
      avisados[k] = ahora;
      if(ahora - ms < MARGEN_VIEJO) sonar.push({ t:(x.em || '🔥') + ' ' + x.nombre, cuerpo:'Tu hábito de hoy · ' + x.hora, id:x.id, tipo:'habito' });
    }
  });

  vivos('pagos').forEach(function(p){
    if(p.activo === false || p.aviso === false) return;
    var ym = hoy.slice(0, 7);
    if(pagado(p, ym) || (p.desde && ym < p.desde)) return;
    var d = diaPago(p, ym), n = diasEntre(hoy, d);
    if(n !== 2 && n !== 0) return;
    var k = 'p:' + p.id + ':' + ym + ':' + n;
    if(momentoMs(hoy, '09:00') <= ahora && !avisados[k]){
      avisados[k] = ahora;
      sonar.push({ t:(p.em ? p.em + ' ' : '') + p.t + ' · ' + dinero(+p.monto || 0), cuerpo:n ? 'Vence en 2 días' : 'Vence hoy', id:p.id, tipo:'pago' });
    }
  });

  if(sonar.length){
    /* Lo apuntado de hace más de 30 días ya no hace falta */
    Object.keys(avisados).forEach(function(k){ if(ahora - avisados[k] > 30 * 864e5) delete avisados[k]; });
    escribirJSON(CLAVE_AVISADOS, avisados);
    sonar.forEach(dispararAlarma);
    pintarSeguro();
  }
}

function dispararAlarma(a){
  var el = aviso('⏰ ' + a.t, a.cuerpo, a.tipo === 'prueba' ? null : a.tipo === 'rec' ? 'Hecho' : a.tipo === 'pago' ? 'Pagado' : 'Ver', function(){
    if(a.tipo === 'rec') alternarRec(a.id);
    else if(a.tipo === 'pago') alternarPago(a.id, hoyISO().slice(0, 7));
    else if(a.tipo === 'tarea') editarTarea(a.id);
    else editarEvento(a.id);
  }, true);
  if(a.tipo === 'rec'){
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = '10 min';
    b.onclick = function(){ el.remove(); posponer(a.id, 10); };
    el.insertBefore(b, el.lastChild);
  }
  if(pref.sonido) pitido();
  try{ if(navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([200, 100, 200]); }catch(e){}
  notificarSistema(a);
}

function notificarSistema(a){
  if(!('Notification' in window) || Notification.permission !== 'granted') return;
  var op = { body:a.cuerpo, tag:a.tipo + a.id, icon:window.ICONO_AGENDA || 'icon-192.png', badge:window.ICONO_AGENDA || 'icon-192.png', requireInteraction:true, data:{ vista:{ rec:'recordatorios', tarea:'tareas', pago:'pagos', prueba:'foco', habito:'habitos' }[a.tipo] || 'calendario' } };
  var sw = navigator.serviceWorker;
  if(sw && sw.controller){
    sw.ready.then(function(reg){ return reg.showNotification(a.t, op); })
      .catch(function(){ try{ new Notification(a.t, op); }catch(e){} });
  } else {
    try{ new Notification(a.t, op); }catch(e){}
  }
}

var audio = null;
function pitido(){
  try{
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if(audio.state === 'suspended') audio.resume();
    [0, .28, .56].forEach(function(t){
      var o = audio.createOscillator(), g = audio.createGain(), t0 = audio.currentTime + t;
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      o.connect(g); g.connect(audio.destination);
      o.start(t0); o.stop(t0 + 0.24);
    });
  }catch(e){}
}

function pedirPermiso(){
  if(!('Notification' in window)){ aviso('Este navegador no da avisos del sistema', 'Sonarán dentro de la agenda.'); return; }
  Notification.requestPermission().then(function(p){
    aviso(p === 'granted' ? 'Avisos activados' : 'Avisos sin activar', p === 'granted' ? 'Te avisaré de tus recordatorios.' : 'Puedes activarlos desde el candado de la barra de direcciones.');
    pintar();
  });
}

/* ==========================================================================
   NUBE (jsonbin.io, la misma cuenta que Cuentas, otra base)
   Cada vez: se baja lo de la nube, se junta con lo de aquí cosa por cosa y,
   si el resultado es distinto de lo que había arriba, se sube. Nadie pisa a
   nadie aunque dos aparatos cambien cosas a la vez.
   ========================================================================== */
var sincronizando = false, otraVez = false, relojSubida = null, ultimoToque = Date.now();

function estadoNube(e){
  var p = $('pastillaNube');
  p.dataset.estado = e;
  if(e === 'busy'){ p.classList.remove('oculto'); $('pastillaTexto').textContent = 'Sincronizando'; }
  else pintarPastillaNube();
}
function programarSubida(){
  if(!nube) return;
  clearTimeout(relojSubida);
  relojSubida = setTimeout(sincronizar, 1500);
}
function cabeceras(){ return { 'Content-Type':'application/json', 'X-Master-Key':nube.key }; }

function sincronizar(){
  if(!nube) return Promise.resolve();
  if(sincronizando){ otraVez = true; return Promise.resolve(); }
  sincronizando = true; estadoNube('busy');
  var cfg = nube;
  return fetch(JSONBIN + '/' + cfg.bin + '/latest', { headers:{ 'X-Master-Key':cfg.key, 'X-Bin-Meta':'false' }, cache:'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function(remoto){
      if(cfg !== nube) return;
      remoto = normalizar(remoto && remoto.record && !remoto.tareas ? remoto.record : remoto);
      var antes = JSON.stringify(db);
      db = fusionar(db, remoto);
      var ahora = JSON.stringify(db);
      if(ahora !== antes){ guardarLocal(); prefDesdePerfil(); pintarSeguro(); }
      if(ahora !== JSON.stringify(fusionar(remoto, remoto))){
        return fetch(JSONBIN + '/' + cfg.bin, { method:'PUT', headers:cabeceras(), body:ahora })
          .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); });
      }
    })
    .then(function(){ apuntarSync('agenda', true); estadoNube('ok'); })
    .catch(function(e){ apuntarSync('agenda', false, e); estadoNube('err'); })
    .then(function(){
      sincronizando = false;
      if(otraVez){ otraVez = false; sincronizar(); }
    });
}

function crearBase(llave){
  llave = (llave || '').trim();
  if(!llave){ aviso('Falta la llave', 'Pega tu X-Master-Key de jsonbin.io.'); return; }
  aviso('Creando la base…');
  fetch(JSONBIN, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Master-Key':llave, 'X-Bin-Name':'agenda', 'X-Bin-Private':'true' }, body:JSON.stringify(db) })
    .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j && j.message || 'http ' + r.status); return j; }); })
    .then(function(j){
      nube = { key:llave, bin:j.metadata.id };
      escribirJSON(CLAVE_NUBE, nube);
      return crearBaseLibro('personal', llave).then(function(){ return crearBaseLibro('oficina', llave); }).then(function(){
        aviso('Nube conectada', 'La agenda y los dos libros ya se guardan en la nube. Ahora añade tus otros aparatos.');
        estadoNube('ok'); pintar(); sincronizarTodo();
      });
    })
    .catch(function(e){ aviso('No se pudo crear', String(e.message || e)); });
}
function codigoNube(){
  var p = leerJSON(LIBROS.personal.nube, null), o = leerJSON(LIBROS.oficina.nube, null), j = { k:nube.key, b:nube.bin };
  if(p && p.bin) j.p = { k:p.key, b:p.bin };
  if(o && o.bin) j.o = { k:o.key, b:o.bin };
  return 'AGENDA2:' + btoa(JSON.stringify(j));
}
function unirNube(codigo){
  try{
    var j = JSON.parse(atob(String(codigo).replace(/\s+/g, '').replace(/^AGENDA[12]:/, '')));
    if(!j.k || !j.b) throw 0;
    nube = { key:j.k, bin:j.b };
    escribirJSON(CLAVE_NUBE, nube);
    if(j.p && j.p.b) escribirJSON(LIBROS.personal.nube, { key:j.p.k, bin:j.p.b });
    if(j.o && j.o.b) escribirJSON(LIBROS.oficina.nube, { key:j.o.k, bin:j.o.b });
    aviso('Conectando…');
    sincronizarTodo().then(function(){
      Object.keys(marcos).forEach(recargarMarco);
      pintar(); aviso('Listo', 'Este aparato ya tiene tu agenda y tus dos libros.' + (j.p && j.o ? '' : ' Los libros sin nube se conectan desde el aparato principal.'));
    });
  }catch(e){ aviso('Código no válido', 'Cópialo entero desde Ajustes del otro aparato.'); }
}

/* Escucha: rápido mientras la usas, nada si la dejas quieta */
function hayAlgunaNube(){ return !!(nube || (leerJSON(LIBROS.personal.nube, null) || {}).bin || (leerJSON(LIBROS.oficina.nube, null) || {}).bin); }
var latidos = 0;
function latido(){
  if(!hayAlgunaNube() || document.hidden) return;
  if(Date.now() - ultimoToque > 5 * 60e3) return;
  /* La agenda cada 30 s; los libros cada minuto y medio (o al tocarlos) */
  latidos++;
  sincronizar();
  if(latidos % 3 === 0){ sincronizarLibro('personal', true); sincronizarLibro('oficina', true); }
}
window.addEventListener('online', function(){ if(hayAlgunaNube()) sincronizarTodo(); });

/* ==========================================================================
   NUBE DE LOS LIBROS
   Los dos libros de cuentas se sincronizan desde aquí, igual que la agenda:
   se baja lo de la nube y se junta movimiento por movimiento con lo de este
   aparato. Para saber qué se borró en el otro aparato se recuerda la última
   versión que ambos compartieron (la "base"): lo que estaba en la base y ya
   no está en un lado, se borró ahí. Así nadie pisa a nadie.
   En la nube el libro sigue guardándose como una lista de movimientos, el
   mismo formato de siempre de Cuentas.
   ========================================================================== */
var syncLibro = { personal:{ en:false, otra:false, ult:0 }, oficina:{ en:false, otra:false, ult:0 } };
function movsLocal(clave){
  var raw = leerJSON(clave, null);
  return raw && Array.isArray(raw.transactions) ? raw.transactions : (Array.isArray(raw) ? raw : []);
}
function movsDeNube(d){
  var r = d && d.record !== undefined ? d.record : d;
  return Array.isArray(r) ? r : (r && Array.isArray(r.transactions) ? r.transactions : []);
}
function juntarMovs(loc, rem, base){
  var B = {}, L = {}, R = {}, ids = [], out = [];
  var hayBase = Array.isArray(base);
  (base || []).forEach(function(x){ B[x.id] = JSON.stringify(x); });
  loc.forEach(function(x){ if(x && x.id && !L[x.id]){ L[x.id] = x; ids.push(x.id); } });
  rem.forEach(function(x){ if(x && x.id && !R[x.id]){ R[x.id] = x; if(!L[x.id]) ids.push(x.id); } });
  ids.forEach(function(id){
    var l = L[id], r = R[id], b = B[id];
    if(l && r){
      var ls = JSON.stringify(l), rs = JSON.stringify(r);
      out.push(ls === rs ? l : (b !== undefined && ls === b) ? r : l);
    } else {
      var x = l || r;
      /* Estaba en la base y el otro lado ya no lo tiene: se borró allí,
         salvo que aquí se haya cambiado después (gana el cambio) */
      if(hayBase && b !== undefined && JSON.stringify(x) === b) return;
      out.push(x);
    }
  });
  return out;
}
function cuerpoLibro(l){ return JSON.stringify(l.length ? l : { transactions:[] }); }
function recargarMarco(cual){
  var m = marcos[cual];
  if(!m) return;
  try{ if(m.contentWindow && m.contentWindow.recargarLibro && m.contentWindow.recargarLibro() !== false) return; }catch(e){}
  m.srcdoc = fuenteLibro(cual) + '<!-- ' + Date.now() + ' -->';
}
/* soloSiToca: cuando lo pide el latido del libro, no más de una vez cada 8 s */
function sincronizarLibro(cual, soloSiToca){
  var L = LIBROS[cual], cfg = leerJSON(L.nube, null), S = syncLibro[cual];
  if(!cfg || !cfg.key || !cfg.bin) return Promise.resolve();
  if(soloSiToca && Date.now() - S.ult < 8000) return Promise.resolve();
  if(S.en){ S.otra = true; return Promise.resolve(); }
  S.en = true; S.ult = Date.now();
  return fetch(JSONBIN + '/' + cfg.bin + '/latest', { headers:{ 'X-Master-Key':cfg.key, 'X-Bin-Meta':'false' }, cache:'no-store' })
    .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(function(d){
      var rem = movsDeNube(d), loc = movsLocal(L.clave), base = leerJSON(L.clave + '_base', null);
      var junto = juntarMovs(loc, rem, base);
      var jl = JSON.stringify(junto);
      if(jl !== JSON.stringify(loc)){ escribirJSON(L.clave, { transactions:junto }); recargarMarco(cual); if(ui.vista === 'dinero' || ui.vista === 'hoy' || ui.vista.indexOf('esp-') === 0) pintarSeguro(); }
      escribirJSON(L.clave + '_base', junto);
      if(jl !== JSON.stringify(rem)){
        return fetch(JSONBIN + '/' + cfg.bin, { method:'PUT', headers:{ 'Content-Type':'application/json', 'X-Master-Key':cfg.key }, body:cuerpoLibro(junto) })
          .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); });
      }
    })
    .then(function(){ apuntarSync(cual, true); estadoLibroMarco(cual, 'ok'); }, function(e){ apuntarSync(cual, false, e); estadoLibroMarco(cual, 'err'); })
    .then(function(){ S.en = false; if(S.otra){ S.otra = false; sincronizarLibro(cual); } });
}
function estadoLibroMarco(cual, e){
  try{ var w = marcos[cual] && marcos[cual].contentWindow; if(w && w.estadoNubeDesdeAgenda) w.estadoNubeDesdeAgenda(e); }catch(x){}
}
window.sincronizarLibro = sincronizarLibro;
function sincronizarTodo(){
  return Promise.all([sincronizar(), sincronizarLibro('personal'), sincronizarLibro('oficina')]);
}
/* Crea en jsonbin la base de un libro que aún no tiene */
function crearBaseLibro(cual, llave){
  var L = LIBROS[cual], c = leerJSON(L.nube, null);
  if(c && c.key && c.bin) return Promise.resolve(c);
  return fetch(JSONBIN, { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Master-Key':llave, 'X-Bin-Name':L.archivo.replace(/_$/, ''), 'X-Bin-Private':'true' }, body:cuerpoLibro(movsLocal(L.clave)) })
    .then(function(r){ return r.json().then(function(j){ if(!r.ok) throw new Error(j && j.message || 'http ' + r.status); return j; }); })
    .then(function(j){ var cfg = { key:llave, bin:j.metadata.id }; escribirJSON(L.nube, cfg); escribirJSON(L.clave + '_base', movsLocal(L.clave)); return cfg; });
}

/* ==========================================================================
   ESTADO DE LA SINCRONIZACIÓN
   Se apunta cuándo se sincronizó cada base (agenda, personal, oficina) y,
   si falló, por qué, con palabras que digan qué hacer.
   ========================================================================== */
var CLAVE_SYNC = 'agenda_sync_estado';
var syncEstado = leerJSON(CLAVE_SYNC, {});
function motivoFallo(e){
  var m = String(e && e.message || e || ''), c = +((/http (\d+)/.exec(m) || [])[1] || 0);
  if(!navigator.onLine) return 'Sin internet ahora mismo. Se sincroniza sola cuando vuelva.';
  if(c === 401) return 'La llave no vale: vuelve a conectar este aparato con el código.';
  if(c === 403) return 'La llave no tiene permiso para esa base.';
  if(c === 404) return 'La base ya no existe en jsonbin.';
  if(c === 429) return 'jsonbin pide un respiro (demasiadas peticiones). Reintenta en un minuto.';
  if(c) return 'jsonbin respondió ' + c + '. Reintenta en un momento.';
  return 'No llegó a salir: puede ser la red o un bloqueador.';
}
function apuntarSync(base, ok, e){
  syncEstado[base] = ok ? { t:Date.now(), ok:true } : { t:(syncEstado[base] || {}).t || 0, ok:false, err:motivoFallo(e), cuando:Date.now() };
  escribirJSON(CLAVE_SYNC, syncEstado);
  pintarPastillaNube();
}
function haceCuanto(t){
  if(!t) return 'nunca';
  var s = Math.round((Date.now() - t) / 1000);
  return s < 45 ? 'ahora mismo' : s < 3600 ? 'hace ' + Math.max(1, Math.round(s / 60)) + ' min' : s < 86400 ? 'hace ' + Math.round(s / 3600) + ' h' : fechaCorta(iso(new Date(t)));
}
function basesConNube(){
  var b = [];
  if(nube) b.push(['agenda', 'Agenda']);
  if((leerJSON(LIBROS.personal.nube, null) || {}).bin) b.push(['personal', 'Gastos personales']);
  if((leerJSON(LIBROS.oficina.nube, null) || {}).bin) b.push(['oficina', 'Oficina']);
  return b;
}
function pintarPastillaNube(){
  var p = $('pastillaNube'); if(!p) return;
  var bs = basesConNube();
  p.classList.toggle('oculto', !bs.length);
  if(!bs.length) return;
  var mal = bs.filter(function(x){ return syncEstado[x[0]] && !syncEstado[x[0]].ok; });
  var ult = Math.min.apply(null, bs.map(function(x){ return (syncEstado[x[0]] || {}).t || 0; }));
  if(p.dataset.estado !== 'busy') p.dataset.estado = mal.length ? 'err' : 'ok';
  $('pastillaTexto').textContent = p.dataset.estado === 'busy' ? 'Sincronizando' : mal.length ? 'Revisar' : haceCuanto(ult);
  p.title = mal.length ? mal.map(function(x){ return x[1] + ': ' + syncEstado[x[0]].err; }).join('\n') : 'Sincronizado ' + haceCuanto(ult) + '. Toca para ver el detalle.';
}
function panelSync(){
  var bs = basesConNube();
  return '<div class="sync-bases">' + [['agenda', 'Agenda', '🗓️'], ['personal', 'Gastos personales', '🏠'], ['oficina', 'Oficina', '💼']].map(function(x){
    var con = bs.some(function(y){ return y[0] === x[0]; }), e = syncEstado[x[0]] || {};
    return '<div class="sync-base ' + (!con ? 'sin' : e.ok === false ? 'mal' : 'ok') + '"><span class="em">' + x[2] + '</span><div><b>' + x[1] + '</b><small>' +
      (!con ? 'Sin nube en este aparato' : e.ok === false ? '⚠️ ' + esc(e.err) : e.t ? '✓ Sincronizado ' + haceCuanto(e.t) : 'Conectada · aún sin sincronizar') + '</small></div></div>';
  }).join('') + '</div>';
}
function hojaSync(){
  abrirFlotante(cabFlot('Sincronización') +
    (basesConNube().length ? '<p class="explica">Tus cambios se juntan con los de tus otros aparatos cosa por cosa: nada se pisa. En el celular también puedes <b>tirar hacia abajo</b> desde arriba de cualquier pantalla para sincronizar.</p>' + panelSync() +
      '<div class="botones"><button class="btn" data-ir="ajustes">' + ico('i-ajustes') + 'Ajustes de la nube</button><button class="btn primario" data-acc="sync-ya">' + ico('i-nube') + 'Sincronizar ahora</button></div>'
     : '<p class="explica">Este aparato aún no está conectado. Ve a Ajustes → Sincronizar entre aparatos y pega el código de tu otro aparato (o crea la base si es el primero).</p><div class="botones"><button class="btn primario" data-ir="ajustes">Ir a Ajustes</button></div>'));
}
setInterval(pintarPastillaNube, 30000);

/* ---------- Tirar hacia abajo para sincronizar (celular) --------------- */
(function(){
  var y0 = null, dy = 0, marca = null;
  function indicador(){
    if(!marca){ marca = document.createElement('div'); marca.className = 'tirar'; marca.innerHTML = ico('i-nube') + '<span></span>'; document.body.appendChild(marca); }
    return marca;
  }
  document.addEventListener('touchstart', function(ev){
    if(window.scrollY > 0 || $('capaFlotante').innerHTML || ev.touches.length !== 1 || ui.vista === 'personal' || ui.vista === 'oficina'){ y0 = null; return; }
    y0 = ev.touches[0].clientY; dy = 0;
  }, { passive:true });
  document.addEventListener('touchmove', function(ev){
    if(y0 === null) return;
    dy = ev.touches[0].clientY - y0;
    if(dy < 10 || window.scrollY > 0){ if(marca) marca.style.opacity = 0; return; }
    var m = indicador(), k = Math.min(1, dy / 90);
    m.style.opacity = k; m.style.transform = 'translate(-50%,' + (Math.min(dy, 120) * .6) + 'px) rotate(' + (dy * 2) + 'deg)';
    m.classList.toggle('listo', dy > 90);
    m.querySelector('span').textContent = dy > 90 ? 'Suelta para sincronizar' : 'Tira para sincronizar';
  }, { passive:true });
  document.addEventListener('touchend', function(){
    if(y0 === null) return;
    var fue = dy > 90; y0 = null;
    if(!marca) return;
    if(!fue){ marca.style.opacity = 0; return; }
    if(!basesConNube().length){ marca.style.opacity = 0; aviso('Este aparato no está conectado', 'Conéctalo en Ajustes → Sincronizar.', 'Ir', function(){ ir('ajustes'); }); return; }
    marca.classList.add('girando'); marca.querySelector('span').textContent = 'Sincronizando…';
    sincronizarTodo().then(function(){
      marca.classList.remove('girando', 'listo'); marca.style.opacity = 0;
      var mal = basesConNube().filter(function(x){ return syncEstado[x[0]] && !syncEstado[x[0]].ok; });
      aviso(mal.length ? '⚠️ No se pudo sincronizar todo' : '☁️ Todo sincronizado', mal.length ? syncEstado[mal[0][0]].err : null);
    });
  }, { passive:true });
})();

/* ---------- Ajustes que viajan entre aparatos ------------------------- */
var PREF_VIAJAN = ['estatura', 'metaKm', 'hiit', 'feriados', 'hoyOff', 'lunes', 'secOff', 'secOrden', 'abajo'];
function prefDesdePerfil(){
  var pp = db.perfil && db.perfil.prefs;
  if(!pp) return;
  PREF_VIAJAN.forEach(function(k){ if(k in pp) pref[k] = pp[k]; });
  escribirJSON(CLAVE_PREF, pref);
}
function guardarPref(){
  escribirJSON(CLAVE_PREF, pref);
  if(typeof PREF_VIAJAN === 'undefined' || !PREF_VIAJAN || !db) return;
  var pp = {};
  PREF_VIAJAN.forEach(function(k){ if(pref[k] !== undefined) pp[k] = pref[k]; });
  if(JSON.stringify(pp) !== JSON.stringify((db.perfil || {}).prefs || {})){
    db.perfil = Object.assign({}, db.perfil, { prefs:pp, upd:Date.now() });
    guardar();
  }
}
prefDesdePerfil();

/* ==========================================================================
   RESPALDO
   ========================================================================== */
function descargarRespaldo(){
  var datos = { app:'agenda', version:2, exportadoEn:new Date().toISOString(), agenda:db, cuentas:leerJSON(CLAVE_LEDGER, null), oficina:leerJSON(CLAVE_OFICINA, null) };
  bajar(new Blob([JSON.stringify(datos, null, 1)], { type:'application/json' }), 'agenda_' + hoyISO() + '.json');
}
function cargarRespaldo(archivo){
  var lector = new FileReader();
  lector.onload = function(){
    try{
      var j = JSON.parse(lector.result);
      var ag = j.app === 'agenda' ? j.agenda : (j.tareas || j.notas ? j : null);
      if(ag){
        db = fusionar(db, normalizar(ag));
        guardar();
      }
      var cta = j.app === 'agenda' ? j.cuentas : (Array.isArray(j.transactions) ? j : null);
      if(cta && (cta.transactions || Array.isArray(cta))){
        var hay = movimientos().length;
        if(!hay || confirm('El respaldo trae también tus gastos personales. ¿Reemplazar los de este aparato por los del respaldo?')){
          escribirJSON(CLAVE_LEDGER, cta);
          recargarCuentas();
        }
      }
      var ofi = j.app === 'agenda' ? j.oficina : null;
      if(ofi && (ofi.transactions || Array.isArray(ofi))){
        if(!movimientos(CLAVE_OFICINA).length || confirm('El respaldo trae también las cuentas de la oficina. ¿Reemplazar las de este aparato?')){
          escribirJSON(CLAVE_OFICINA, ofi);
          recargarCuentas();
        }
      }
      if(!ag && !cta && !ofi) throw 0;
      aviso('Respaldo cargado', ag ? 'Se juntó con lo que ya tenías.' : null);
      pintar();
    }catch(e){ aviso('No se pudo leer', 'El archivo no parece un respaldo de la agenda.'); }
  };
  lector.readAsText(archivo);
}

/* ==========================================================================
   TEMA Y PALETA (compartidos con Cuentas)
   ========================================================================== */
function colorBarra(){
  var m = document.querySelector('meta[name="theme-color"]');
  if(m) m.setAttribute('content', getComputedStyle(document.body).backgroundColor);
}
function aplicarTema(t, desdeAuto){
  if(t === 'auto'){ pref.temaAuto = true; escribirJSON(CLAVE_PREF, pref); t = temaSegunSistema(); }
  else if(!desdeAuto && pref.temaAuto){ pref.temaAuto = false; escribirJSON(CLAVE_PREF, pref); }
  document.documentElement.setAttribute('data-tema', t);
  try{ localStorage.setItem(CLAVE_TEMA, t); }catch(e){}
  colorBarra(); recargarCuentas();
}
function aplicarPaleta(p){
  p = paletaValida(p);
  document.documentElement.setAttribute('data-paleta', p);
  try{ localStorage.setItem(CLAVE_PALETA, p); }catch(e){}
  colorBarra(); recargarCuentas();
}

/* ==========================================================================
   EJEMPLOS, para ver cómo queda antes de llenarla
   ========================================================================== */
function cargarEjemplos(){
  var hoy = hoyISO(), c = Date.now(), w = deISO(hoy).getDay();
  function T(o){ return Object.assign({ id:nid(), prio:0, area:'', rep:'no', sub:[], notas:'', hora:'', creada:c++ }, o); }
  var sab = sumarDias(hoy, (6 - w + 7) % 7 || 7);
  [
    T({ t:'Pagar el recibo de luz', fecha:hoy, prio:3, esp:'personal' }),
    T({ t:'Llamar al banco', fecha:hoy, hora:'16:00', esp:'personal' }),
    T({ t:'Regar las plantas', fecha:hoy, rep:'sem', esp:'personal', area:'Casa' }),
    T({ t:'Preparar la presentación del cliente', fecha:sumarDias(hoy, 2), prio:2, esp:'oficina', sub:[{ id:nid(), t:'Borrador', ok:true },{ id:nid(), t:'Gráficos', ok:false },{ id:nid(), t:'Ensayar', ok:false }] }),
    T({ t:'Enviar el informe mensual', fecha:hoy, prio:3, esp:'oficina' }),
    T({ t:'Resolver la práctica de Matemática', fecha:sumarDias(hoy, 1), prio:2, esp:'estudios' }),
    T({ t:'Leer el capítulo 4 de Economía', fecha:hoy, esp:'estudios' }),
    T({ t:'Comprar chimpunes nuevos', fecha:'', esp:'deporte' })
  ].forEach(function(t){ poner('tareas', t); });
  poner('eventos', { id:nid(), t:'Almuerzo con la familia', fecha:sumarDias(hoy, (7 - w) % 7 || 7), todo:false, ini:'13:00', fin:'15:00', lugar:'Casa de mamá', color:'esp', esp:'personal', tipo:'evento', rep:'no', aviso:60, notas:'' });
  poner('eventos', { id:nid(), t:'Reunión con el equipo', fecha:sumarDias(hoy, 1), todo:false, ini:'10:00', fin:'11:00', lugar:'Sala 2', color:'esp', esp:'oficina', tipo:'reunion', rep:'no', aviso:15, notas:'' });
  poner('eventos', { id:nid(), t:'Revisión semanal', fecha:hoy, todo:false, ini:'09:00', fin:'09:30', lugar:'Zoom', color:'esp', esp:'oficina', tipo:'reunion', rep:'sem', aviso:10, notas:'', actas:(function(){ var o = {}; o[hoy] = { asist:'Ana, Luis, Marco', notas:'Avance del proyecto web y cierre del mes.', acuerdos:[{ t:'Enviar la propuesta a Empresa ABC', quien:'Yo', ok:false },{ t:'Revisar las facturas pendientes', quien:'Ana', ok:false },{ t:'Agendar la presentación', quien:'Luis', ok:true }] }; return o; })() });
  poner('eventos', { id:nid(), t:'Examen parcial de Matemática II', fecha:sumarDias(hoy, 6), todo:false, ini:'08:00', fin:'10:00', lugar:'Aula 204', color:'rojo', esp:'estudios', tipo:'examen', rep:'no', aviso:1440, notas:'Temas: derivadas e integrales', cuenta:true, temas:[{ t:'Límites', ok:true },{ t:'Derivadas', ok:true },{ t:'Regla de la cadena', ok:false },{ t:'Integrales por partes', ok:false },{ t:'Sustitución', ok:false }] });
  poner('eventos', { id:nid(), t:'Pichanga con los amigos', fecha:sab, todo:false, ini:'17:00', fin:'19:00', lugar:'Cancha La Bombonera', color:'esp', esp:'deporte', tipo:'partido', rep:'no', aviso:60, notas:'', pich:{ costo:120, jug:['José','Carlos','Miguel','Renzo','Diego','Luis','Andrés','Paolo','Kevin','Jorge'].map(function(n, i){ return { n:n, p:i < 6 }; }) } });
  poner('eventos', { id:nid(), t:'Gimnasio', fecha:hoy, todo:false, ini:'19:00', fin:'20:00', lugar:'', color:'esp', esp:'deporte', tipo:'evento', rep:'lab', aviso:15, notas:'' });
  poner('cursos', { id:nid(), nombre:'Matemática II', prof:'Prof. Ramírez', aula:'Aula 204', clases:[{ d:1, ini:'08:00', fin:'10:00' },{ d:3, ini:'08:00', fin:'10:00' }], notas:[{ n:'Práctica 1', v:16, p:20 },{ n:'Práctica 2', v:14, p:20 },{ n:'Parcial', v:'', p:30 },{ n:'Final', v:'', p:30 }], inicio:'', fin:'', creada:c++ });
  poner('cursos', { id:nid(), nombre:'Economía', prof:'Dra. Salas', aula:'Aula 110', clases:[{ d:2, ini:'18:00', fin:'20:00' },{ d:4, ini:'18:00', fin:'20:00' }], notas:[{ n:'Control de lectura', v:9, p:'' },{ n:'Exposición', v:12, p:'' }], inicio:'', fin:'', creada:c++ });
  poner('cursos', { id:nid(), nombre:'Inglés intermedio', prof:'', aula:'Zoom', clases:[{ d:6, ini:'09:00', fin:'11:00' }], inicio:'', fin:'', creada:c++ });
  var pT = nid(), pW = nid();
  poner('proyectos', { id:pT, nombre:'Monografía de Economía', desc:'Trabajo final del curso, en grupo de 3', limite:sumarDias(hoy, 20), esp:'estudios', estado:'activo', creada:c++ });
  poner('proyectos', { id:pW, nombre:'Web de Empresa ABC', desc:'Diseño y lanzamiento de la página del cliente', limite:sumarDias(hoy, 12), esp:'oficina', estado:'activo', creada:c++ });
  [['Elegir el tema', -3, true, pT],['Buscar 5 fuentes', 2, false, pT],['Escribir la introducción', 6, false, pT],['Revisión con el grupo', 12, false, pT],
   ['Reunión de requisitos', -5, true, pW],['Maqueta de la portada', -1, true, pW],['Textos e imágenes', 3, false, pW],['Publicar la web', 11, false, pW]]
    .forEach(function(x){ poner('tareas', T({ t:x[0], fecha:sumarDias(hoy, x[1]), hecha:x[2], hechaEn:x[2] ? Date.now() - 864e5 : 0, proy:x[3], esp:x[3] === pT ? 'estudios' : 'oficina' })); });
  poner('deudas', { id:nid(), persona:'Carlos', concepto:'Entradas del concierto', monto:120, tipo:'me', fecha:sumarDias(hoy, 5), saldada:0, esp:'personal' });
  poner('deudas', { id:nid(), persona:'Ana', concepto:'Almuerzo del viernes', monto:35, tipo:'yo', fecha:'', saldada:0, esp:'personal' });
  poner('cobros', { id:nid(), cliente:'Empresa ABC', concepto:'Factura F001-245', monto:2400, vence:sumarDias(hoy, 3), cobrado:0, esp:'oficina' });
  poner('cobros', { id:nid(), cliente:'Juan Pérez', concepto:'Asesoría de agosto', monto:650, vence:sumarDias(hoy, -2), cobrado:0, esp:'oficina' });
  var rP = nid(), rE = nid();
  poner('rutinas', { id:rP, nombre:'Pecho y tríceps', dias:[1,4], ejercicios:[{ n:'Press banca', s:4, r:10, p:60 },{ n:'Press inclinado con mancuernas', s:3, r:12, p:22 },{ n:'Fondos', s:3, r:12, p:'' },{ n:'Extensión de tríceps en polea', s:3, r:15, p:25 }], creada:c++ });
  poner('rutinas', { id:rE, nombre:'Espalda y bíceps', dias:[3,6], ejercicios:[{ n:'Dominadas', s:4, r:8, p:'' },{ n:'Remo con barra', s:4, r:10, p:50 },{ n:'Curl de bíceps', s:3, r:12, p:14 }], creada:c++ });
  [[-22,55,20,45],[-15,57.5,20,47.5],[-8,57.5,22,50],[-1,60,22,50]].forEach(function(x){
    poner('entrenos', { id:nid(), fecha:sumarDias(hoy, x[0]), tipo:'gym', min:65, km:'', int:2, notas:'Pecho y tríceps', rutina:rP, ejs:[{ n:'Press banca', s:4, r:10, p:x[1] },{ n:'Press inclinado con mancuernas', s:3, r:12, p:x[2] },{ n:'Extensión de tríceps en polea', s:3, r:15, p:25 }] });
    poner('entrenos', { id:nid(), fecha:sumarDias(hoy, x[0] - 2), tipo:'gym', min:60, km:'', int:2, notas:'Espalda y bíceps', rutina:rE, ejs:[{ n:'Remo con barra', s:4, r:10, p:x[3] },{ n:'Curl de bíceps', s:3, r:12, p:12 + (x[0] > -10 ? 2 : 0) }] });
  });
  poner('eventos', { id:nid(), t:'Viaje a Cusco', fecha:sumarDias(hoy, 46), hasta:sumarDias(hoy, 50), todo:true, ini:'', fin:'', lugar:'Cusco', color:'oro', esp:'personal', tipo:'evento', rep:'no', aviso:1440, notas:'', cuenta:true });
  [[-1,'gym',70,'',2,'Pecho y tríceps'],[-2,'correr',35,5.2,2,''],[-4,'futbol',90,'',3,'Ganamos 5-3'],[-6,'gym',65,'',2,'Espalda y bíceps'],[-9,'gym',60,'',2,'Pierna'],[-11,'futbol',90,'',3,'Empate 2-2']]
    .forEach(function(x){ poner('entrenos', { id:nid(), fecha:sumarDias(hoy, x[0]), tipo:x[1], min:x[2], km:x[3], int:x[4], notas:x[5] }); });
  [[-28,76.4],[-21,75.9],[-14,75.6],[-7,75.1],[0,74.8]].forEach(function(x){ poner('medidas', { id:sumarDias(hoy, x[0]), peso:x[1] }); });
  poner('recordatorios', { id:nid(), t:'Tomar vitaminas', fecha:hoy, hora:'21:00', rep:'dia', notas:'', esp:'personal' });
  poner('recordatorios', { id:nid(), t:'Renovar el seguro del auto', fecha:sumarDias(hoy, 5), hora:'10:00', rep:'no', notas:'', esp:'personal' });
  poner('recordatorios', { id:nid(), t:'Llevar la camiseta para la pichanga', fecha:sab, hora:'15:00', rep:'no', notas:'', esp:'deporte' });
  poner('listas', { id:nid(), nombre:'Compras', em:'🛒', color:'verde', esp:'personal', creada:c++, items:['Leche','Pan','Huevos','Café','Fruta'].map(function(t, i){ return { id:nid(), t:t, ok:i === 1 }; }) });
  poner('listas', { id:nid(), nombre:'Mochila del gym', em:'🎒', color:'verde', esp:'deporte', creada:c++, items:['Toalla','Tomatodo','Candado','Zapatillas'].map(function(t){ return { id:nid(), t:t, ok:false }; }) });
  var marcas = {}; for(var i = 1; i < 5; i++) marcas[sumarDias(hoy, -i)] = 1;
  poner('habitos', { id:nid(), nombre:'Beber 2 litros de agua', em:'💧', dias:[0,1,2,3,4,5,6], marcas:marcas, esp:'deporte', creada:c - 30 * 864e5 });
  poner('habitos', { id:nid(), nombre:'Leer 20 minutos', em:'📚', dias:[1,2,3,4,5], marcas:{}, esp:'estudios', creada:c });
  poner('habitos', { id:nid(), nombre:'Anotar mis gastos', em:'💰', dias:[0,1,2,3,4,5,6], marcas:{}, esp:'personal', creada:c });
  poner('notas', { id:nid(), t:'Wifi de casa', cuerpo:'Red: MiCasa_5G\nClave: la de siempre 😉', color:'azul', fija:true, esp:'personal' });
  poner('notas', { id:nid(), t:'Rutina de gym', cuerpo:'Lunes: pecho y tríceps\nMiércoles: espalda y bíceps\nViernes: pierna y hombro', color:'verde', fija:false, esp:'deporte' });
  poner('notas', { id:nid(), t:'Temas del parcial', cuerpo:'Derivadas, regla de la cadena, integrales por partes', color:'azul', fija:false, esp:'estudios' });
  /* Movimientos de ejemplo en los libros, solo si están vacíos */
  function ym(n){ return mesAntes(hoy.slice(0, 7), n); }
  function dia(y, d){ return y + '-' + dos(Math.min(d, 28)); }
  var hd = Math.max(1, deISO(hoy).getDate());
  if(!movimientos(CLAVE_LEDGER).length){
    var P = [];
    for(var mm = 3; mm >= 0; mm--){
      var y = ym(mm), lim = mm ? 28 : hd;
      [[1,'Sueldo','Ingreso',3500,'Sueldo'],[3,'Alquiler','Gasto',1200,'Casa'],[6,'Supermercado','Gasto',380 + mm*25,'Comida'],[8,'Gimnasio','Gasto',120,'Deporte'],
       [11,'Curso de inglés','Gasto',180,'Estudios'],[15,'Almuerzos','Gasto',210 - mm*10,'Comida'],[19,'Taxi','Gasto',65,'Transporte'],[24,'Cine','Gasto',48,'Ocio']]
        .forEach(function(x){ if(x[0] <= lim) P.push({ id:nid(), date:dia(y, x[0]), desc:x[1], type:x[2], amount:x[3], cat:x[4] }); });
    }
    escribirJSON(CLAVE_LEDGER, { transactions:P });
  }
  if(!movimientos(CLAVE_OFICINA).length){
    var O = [];
    for(var mo = 3; mo >= 0; mo--){
      var yo = ym(mo), limo = mo ? 28 : hd;
      [[2,'Factura cliente A','Ingreso',4200 + mo*150,'Ventas'],[5,'Útiles de oficina','Gasto',160,'Insumos'],[9,'Internet oficina','Gasto',129,'Servicios'],
       [14,'Factura cliente B','Ingreso',1800,'Ventas'],[20,'Planilla asistente','Gasto',1500,'Personal']]
        .forEach(function(x){ if(x[0] <= limo) O.push({ id:nid(), date:dia(yo, x[0]), desc:x[1], type:x[2], amount:x[3], cat:x[4] }); });
    }
    escribirJSON(CLAVE_OFICINA, { transactions:O });
  }
  db.perfil = Object.assign({}, db.perfil, { presu:{ personal:2400, oficina:2200 }, upd:Date.now() });
  poner('enfoque', { id:hoy, items:[{ t:'Pagar la luz', ok:false },{ t:'Avanzar la presentación', ok:false },{ t:'Caminar 30 minutos', ok:false }], pomos:2, pomosEsp:{ estudios:2 } });
  [-1,-2,-3].forEach(function(k, j){ var d = sumarDias(hoy, k); if(d >= inicioSemana(hoy)) poner('enfoque', { id:d, items:[], pomos:3 - j, pomosEsp:{ estudios:3 - j } }); });
  poner('eventos', { id:nid(), t:'Mamá', fecha:sumarDias(hoy, 9).slice(0, 4) - 58 + sumarDias(hoy, 9).slice(4), todo:true, ini:'09:00', fin:'', lugar:'', color:'rosa', rep:'ano', aviso:1440, notas:'', cumple:true, nacio:+sumarDias(hoy, 9).slice(0, 4) - 58 });
  poner('metas', { id:nid(), esp:'personal', t:'Ahorrar para el viaje', em:'✈️', actual:650, objetivo:2000, unidad:'soles', fecha:sumarDias(hoy, 120), color:'azul', creada:c - 60 * 864e5 });
  poner('metas', { id:nid(), esp:'estudios', t:'Leer libros este año', em:'📚', actual:4, objetivo:12, unidad:'libros', fecha:hoy.slice(0, 4) + '-12-31', color:'verde', creada:c++ });
  var ym = hoy.slice(0, 7), dHoy = deISO(hoy).getDate();
  var pg = function(){ var o = {}; o[ym] = Date.now(); return o; };
  poner('pagos', { id:nid(), esp:'personal', t:'Luz', em:'💡', monto:95.5, dia:Math.min(28, dHoy + 2), cat:'Servicios', pagados:{}, activo:true, aviso:true, desde:ym });
  poner('pagos', { id:nid(), esp:'oficina', t:'Internet', em:'🌐', monto:89.9, dia:Math.max(1, dHoy - 3), cat:'Servicios', pagados:pg(), activo:true, aviso:true, desde:ym });
  poner('pagos', { id:nid(), esp:'personal', t:'Alquiler', em:'🏠', monto:1200, dia:1, cat:'Casa', pagados:pg(), activo:true, aviso:true, desde:ym });
  [[-1,4,'Buen día en el trabajo, terminé el informe.'],[-2,3,''],[-3,5,'Cena con amigos 🥳'],[-5,2,'Cansado, dormí poco.']].forEach(function(x){
    poner('diario', { id:sumarDias(hoy, x[0]), animo:x[1], texto:x[2] });
  });
  [[0,5,''],[-1,8,7],[-2,6,6],[-3,7,8],[-4,8,7],[-5,4,5],[-6,7,7]].forEach(function(x){ poner('bienestar', { id:sumarDias(hoy, x[0]), agua:x[1], sueno:x[2] }); });
  [[0,'09:10',95,'Empresa ABC','Diseño de la portada',60],[-1,'15:00',120,'Empresa ABC','Reunión y ajustes',60],[-1,'09:30',80,'Juan Pérez','Asesoría contable',45],[-2,'10:00',150,'Empresa ABC','Maquetación',60],[-3,'16:00',60,'Juan Pérez','Revisión de facturas',45]]
    .forEach(function(x){ poner('horas', { id:nid(), fecha:sumarDias(hoy, x[0]), ini:x[1], min:x[2], cliente:x[3], nota:x[4], tarifa:x[5] }); });
  [[-4,'Pichanga del jueves','5-3','v',2,1],[-11,'Fulbito con la oficina','2-2','e',1,0],[-18,'Liga del barrio','1-3','d',0,1],[-25,'Liga del barrio','4-1','v',1,2]]
    .forEach(function(x){ poner('eventos', { id:nid(), t:x[1], fecha:sumarDias(hoy, x[0]), todo:true, ini:'', fin:'', lugar:'', color:'esp', esp:'deporte', tipo:'partido', rep:'no', aviso:-1, notas:'', resultado:x[2], jugado:true, res:x[3], goles:x[4], asist:x[5] }); });
  [['Cambiar las sábanas','🛏️',7,-8],['Regar las plantas','🪴',3,-1],['Limpiar la refrigeradora','🧊',30,-12],['Cambiar el cepillo de dientes','🪥',90,-95]]
    .forEach(function(x){ poner('casa', { id:nid(), t:x[0], em:x[1], cada:x[2], ult:sumarDias(hoy, x[3]) }); });
  var iniS = inicioSemana(hoy);
  [['Lomo saltado','Sopa criolla'],['Ají de gallina','Tortilla de verduras'],['Menestrón',''],['Arroz con pollo','Ensalada César con pollo'],['','']].forEach(function(x, k){ poner('menu', { id:sumarDias(iniS, k), alm:x[0], cena:x[1] }); });
  poner('docs', { id:nid(), t:'DNI', em:'🪪', num:'', vence:sumarDias(hoy, 400), notas:'' });
  poner('docs', { id:nid(), t:'SOAT', em:'🛡️', num:'', vence:sumarDias(hoy, 18), notas:'Renovar en la web de la aseguradora' });
  poner('docs', { id:nid(), t:'Pasaporte', em:'🛂', num:'', vence:sumarDias(hoy, -20), notas:'' });
  var cM = vivos('cursos')[0], cE = vivos('cursos')[1];
  [[cM,'¿Derivada de sen x?','cos x',3],[cM,'¿Derivada de eˣ?','eˣ',2],[cM,'Regla de la cadena','(f∘g)\' = f\'(g(x))·g\'(x)',1],[cM,'∫ 1/x dx','ln|x| + C',1],[cE,'¿Qué es la elasticidad precio?','Cuánto cambia la demanda cuando cambia el precio',2],[cE,'Ley de la oferta','A mayor precio, mayor cantidad ofrecida',5]]
    .forEach(function(x, k){ poner('fichas', { id:nid(), curso:x[0] ? x[0].id : '', q:x[1], a:x[2], caja:x[3], prox:x[3] > 2 ? sumarDias(hoy, 3) : '', creada:c + k }); });
  poner('clientes', { id:nid(), nombre:'Empresa ABC', contacto:'María Torres', tel:'+51 999 111 222', email:'maria@empresaabc.pe', ruc:'20123456789', notas:'' });
  poner('clientes', { id:nid(), nombre:'Juan Pérez', contacto:'', tel:'+51 988 777 666', email:'', ruc:'', notas:'Paga a fin de mes' });
  [[-3,'correr',40,6.5],[-9,'correr',30,5],[-16,'bici',60,22],[-18,'correr',45,7.2]].forEach(function(x){ poner('entrenos', { id:nid(), fecha:sumarDias(hoy, x[0]), tipo:x[1], min:x[2], km:x[3], int:2, notas:'' }); });
  vivos('tareas').forEach(function(t){ if(t.t === 'Textos e imágenes' || t.t === 'Preparar la presentación del cliente'){ t.estado = 'curso'; poner('tareas', t); } });
  vivos('cursos').forEach(function(k, j){ if(j < 2){ k.faltas = j ? 4 : 1; k.maxFaltas = 5; poner('cursos', k); } });
  pintar();
  aviso('Ejemplos cargados', 'Bórralos cuando quieras; son solo para ver cómo queda.');
}

/* ==========================================================================
   INSTALAR
   ========================================================================== */
var promesaInstalar = null;
window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); promesaInstalar = e; });
function instalar(){
  if(promesaInstalar){ promesaInstalar.prompt(); promesaInstalar.userChoice.then(function(){ promesaInstalar = null; }); return; }
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if(window.matchMedia('(display-mode: standalone)').matches || navigator.standalone){ aviso('Ya está instalada'); return; }
  aviso('Cómo instalarla', iOS ? 'Safari → Compartir → Añadir a pantalla de inicio.' : 'Menú ⋮ del navegador → Instalar aplicación. Tiene que estar abierta por su dirección https.');
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */
document.addEventListener('click', function(ev){
  ultimoToque = Date.now();
  var t = ev.target;

  var tp = t.closest('[data-pin]');
  if(tp){ teclaPIN(tp.dataset.pin); return; }
  if(t.matches && t.matches('[data-velo]')){ cerrarFlotante(); return; }
  if(t.closest('[data-cerrar]') && t.closest('#capaFlotante')){ cerrarFlotante(); return; }

  /* Selectores de los editores */
  var s = t.closest('[data-sel]');
  if(s){
    var g = s.closest('[data-grupo]');
    if(g.dataset.multi) s.setAttribute('aria-pressed', s.getAttribute('aria-pressed') !== 'true');
    else g.querySelectorAll('[data-sel]').forEach(function(b){ b.setAttribute('aria-pressed', b === s); });
    if(edAcciones._color) edAcciones._color();
    return;
  }
  var ed = t.closest('[data-ed]');
  if(ed){
    var q = ed.dataset.ed;
    if(q === 'sub-ok'){ var on = ed.getAttribute('aria-checked') !== 'true'; ed.setAttribute('aria-checked', on); ed.parentNode.classList.toggle('ok', on); return; }
    if(q === 'sub-x'){ ed.parentNode.remove(); return; }
    if(edAcciones[q]) edAcciones[q](ed);
    return;
  }

  var irA = t.closest('[data-ir]');
  if(irA){ ir(irA.dataset.ir); return; }

  var b = t.closest('[data-acc]');
  if(!b || b.tagName === 'FORM') return;
  var a = b.dataset.acc, id = b.dataset.id;

  switch(a){
    case 'menu-mas': menuMas(); break;
    case 'anadir': hojaAnadir(b.dataset.tipo); break;
    case 'gasto-rapido': gastoRapido(b.dataset.v || 'personal'); break;
    case 'gr-tipo': var mt = ($('grMonto') || {}).value || ''; gastoRapido(ui.grLibro, b.dataset.v); $('grMonto').value = mt; break;
    case 'gr-libro': var ml = ($('grMonto') || {}).value || ''; gastoRapido(b.dataset.v, ui.grTipo); $('grMonto').value = ml; break;
    case 'gr-cat':
      ui.grCat = ui.grCat === b.dataset.v ? '' : b.dataset.v;
      b.parentNode.querySelectorAll('.ficha').forEach(function(x){ x.setAttribute('aria-pressed', x.dataset.v === ui.grCat); });
      break;
    case 'rapido':
      var rv = b.dataset.v;
      if(rv === 'gasto') gastoRapido('personal'); else hojaAnadir(rv);
      break;
    case 'nota-check': marcarLineaNota(id, +b.dataset.l); break;
    case 'busq-reciente': var qq = $('q'); if(qq){ qq.value = b.dataset.v; qq.oninput(); } break;
    case 'dictar': dictar(b.dataset.id, b); break;
    case 'compartir-lista': var lC = buscarId('listas', id); if(lC) compartir(lC.nombre, textoLista(lC)); break;
    case 'compartir-tareas': compartir('Mis pendientes', textoTareasHoy()); break;
    case 'ordenar': ordenarPendientes(); break;
    case 'ord':
      var tO = JSON.parse(JSON.stringify(buscarId('tareas', id))); tO.fecha = b.dataset.f; if(!tO.fecha) tO.hora = '';
      poner('tareas', tO); vibrar(8); ordenarPendientes(); break;
    case 'ord-hecha':
      var tH = JSON.parse(JSON.stringify(buscarId('tareas', id))); tH.hecha = true; tH.hechaEn = Date.now();
      poner('tareas', tH); vibrar(12); ordenarPendientes(); break;
    case 'ord-borrar':
      var tB = buscarId('tareas', id); if(tB){ tB.del = true; tB.upd = tB.delEn = Date.now(); guardar(); } ordenarPendientes(); break;
    case 'ord-fin': cerrarFlotante(); pintar(); break;
    case 'menu-esp':
      var fe = b.dataset.f, act = fe === 't-esp' ? ui.tEsp : fe === 'cal-esp' ? ui.calEsp : '';
      abrirFlotante(cabFlot('Ver espacio') + '<div class="menu-lista">' + [{ id:'', em:'🗂️', nom:'Todos los espacios' }].concat(ESPACIOS).map(function(e){
        return '<button type="button" data-acc="' + fe + '" data-v="' + e.id + '"' + (act === e.id ? ' aria-current="true"' : '') + '><span class="em-menu">' + e.em + '</span><span><b>' + e.nom + '</b></span></button>';
      }).join('') + '</div>');
      break;
    case 'nav-atras': pasoNav(-1); break;
    case 'nav-adelante': pasoNav(1); break;
    case 'nav-saltar': pasoNav(+b.dataset.d, +b.dataset.n); break;
    case 'reintentar': pintar(); break;
    case 'errores-ver':
      var le = leerJSON(CLAVE_ERRORES, []), txtE = le.map(function(x){ return new Date(x.t).toLocaleString('es-PE') + ' · ' + x.donde + ' · ' + x.v + '\n' + x.msj + '\n' + x.pila; }).join('\n\n');
      abrirFlotante(cabFlot('Registro de fallos') + '<p class="explica">Si algo no funcionó bien, aquí queda lo que pasó. Puedes copiarlo y enviármelo.</p>' +
        '<textarea class="entrada" readonly style="height:220px;padding:10px;font-family:var(--cifra);font-size:11.5px">' + esc(txtE || 'Sin fallos anotados. 👌') + '</textarea>' +
        '<div class="botones"><button class="btn" data-acc="errores-borrar">Borrar registro</button><button class="btn primario" data-acc="copiar">Copiar</button></div>');
      break;
    case 'errores-borrar': escribirJSON(CLAVE_ERRORES, []); cerrarFlotante(); pintar(); aviso('Registro borrado'); break;
    case 'deshacer': deshacer(); break;
    case 'rehacer': rehacer(); break;
    case 'pap-restaurar': restaurarDePapelera(b.dataset.c, id); aviso('Restaurado', PAPELERA_TIPOS[b.dataset.c][0] + ' devuelto a su sitio'); pintar(); break;
    case 'pap-borrar':
      if(!confirm('¿Borrar para siempre? Ya no se podrá recuperar.')) return;
      purgar(b.dataset.c, id); guardar(); pintar(); break;
    case 'pap-vaciar':
      var nP = enPapelera().length;
      if(!confirm('¿Vaciar la papelera? Se borrarán para siempre ' + nP + (nP === 1 ? ' cosa.' : ' cosas.'))) return;
      enPapelera().forEach(function(p){ purgar(p.c, p.x.id); }); guardar(); pintar(); aviso('🗑️ Papelera vacía'); break;
    case 'ir-informes': ir('dinero'); setTimeout(function(){ var t = document.querySelector('.informes'); if(t) t.scrollIntoView({ block:'start', behavior:'smooth' }); }, 60); break;
    case 'inf-libro': ui.inf.libro = b.dataset.v; pintar(); break;
    case 'inf-per': ui.inf.periodo = b.dataset.v; pintar(); break;
    case 'inf-bajar':
      var I = ui.inf;
      if(I.periodo === 'rango'){ I.desde = ($('infDesde') || {}).value || ''; I.hasta = ($('infHasta') || {}).value || ''; if(!I.desde && !I.hasta){ aviso('Elige las fechas', 'Pon al menos el día de inicio o el de fin.'); break; } }
      (I.libro === 'ambos' ? ['personal','oficina'] : [I.libro]).forEach(function(l, k){
        setTimeout(function(){ exportarLibro(l, b.dataset.v, I.periodo, I.desde, I.hasta); }, k * 1500);
      });
      aviso('Preparando ' + (b.dataset.v === 'pdf' ? 'el PDF' : 'el Excel') + '…', I.libro === 'ambos' ? 'Se descargan dos archivos: personal y oficina.' : null);
      break;
    case 'personalizar-hoy': personalizarHoy(); break;
    case 'nav-plegar':
      var pl = navPlegados().slice(), gi = pl.indexOf(b.dataset.v);
      if(gi >= 0) pl.splice(gi, 1); else pl.push(b.dataset.v);
      pref.navPlegado = pl; escribirJSON(CLAVE_PREF, pref); pintarNav(); break;
    case 'buscar': abrirBuscar(); break;
    case 'nuevo': nuevo(b.dataset.tipo); break;
    case 'cap-tipo':
      ui.capTipo = b.dataset.tipo;
      b.parentNode.querySelectorAll('.ficha').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var ph = { tarea:'Nueva tarea…', rec:'Recordar… ej. «llamar a mamá el domingo a las 11»', evento:'Evento… ej. «cena con amigos el viernes a las 8»', nota:'Apunta una idea…' };
      $('entradaCaptura').placeholder = ph[ui.capTipo]; $('entradaCaptura').focus();
      break;

    case 'tarea-ok': vibrar(); alternarTarea(id, b); break;
    /* Elegir varias */
    case 'sel-on': ui.sel = { col:b.dataset.col, ids:[] }; pintar(); break;
    case 'sel-fin': ui.sel = null; pintar(); break;
    case 'sel-t':
      if(!ui.sel) break;
      var si = ui.sel.ids.indexOf(id);
      if(si < 0) ui.sel.ids.push(id); else ui.sel.ids.splice(si, 1);
      vibrar(8); pintar(); break;
    case 'sel-todas':
      var vis = ui.selVisibles || [];
      ui.sel.ids = vis.every(elegida) ? [] : vis.slice(); pintar(); break;
    case 'sel-hecha': selHecha(); break;
    case 'sel-mover': hojaSelFecha(); break;
    case 'sel-fecha':
      var nf = b.dataset.f === 'otra' ? ($('selFechaOtra') || {}).value : b.dataset.f;
      if(b.dataset.f === 'otra' && !nf) break;
      conElegidas(function(t){ t.fecha = nf; if(!nf) t.hora = ''; }, nf ? '📅 A ' + relativo(nf).toLowerCase() : '💭 Sin fecha');
      break;
    case 'sel-etiquetar': hojaSelEtiquetar(); break;
    case 'sel-esp': var ne = b.dataset.e; conElegidas(function(t){ t.esp = ne; }, espInfo(ne).em + ' A ' + espInfo(ne).nom); break;
    case 'sel-prio': var np = +b.dataset.p; conElegidas(function(t){ t.prio = np; }, 'Prioridad ' + PRIOS[np].n.toLowerCase()); break;
    case 'sel-borrar':
      if(!ui.sel || !ui.sel.ids.length || !confirm('¿Borrar ' + ui.sel.ids.length + (ui.sel.ids.length === 1 ? ' tarea' : ' tareas') + '? Irán a la papelera.')) break;
      conElegidas(function(t){ t.del = true; t.delEn = Date.now(); }, '🗑️ A la papelera');
      break;
    /* Administrar secciones */
    case 'abajo-quitar':
      var ab = barraAbajo().slice(), ai = ab.indexOf(b.dataset.v);
      if(ab.length <= 1){ aviso('Deja al menos un acceso en la barra'); break; }
      ab.splice(ai, 1); pref.abajo = ab; guardarPref(); pintar(); break;
    case 'abajo-poner':
      var ab2 = barraAbajo().slice();
      if(ab2.length >= 4) break;
      ab2.push(b.dataset.v); pref.abajo = ab2; guardarPref(); pintar(); break;
    case 'sec-mover': moverSec(b.dataset.v, +b.dataset.d); break;
    case 'sec-restablecer':
      if(!confirm('¿Volver al orden original, mostrar todas las secciones y la barra de siempre?')) break;
      delete pref.secOrden; delete pref.secOff; delete pref.abajo; guardarPref(); pintar(); aviso('Secciones como al principio'); break;
    case 'limpiar': limpiar(b.dataset.v); break;
    case 'tarea-ed': cerrarFlotante(); editarTarea(id); break;
    case 'rec-ok': vibrar(); alternarRec(id, b); break;
    case 'rec-ed': cerrarFlotante(); editarRec(id); break;
    case 'rec-posponer': menuPosponer(id); break;
    case 'posponer': posponer(id, isNaN(+b.dataset.m) ? b.dataset.m : +b.dataset.m); break;
    case 'rec-ver-hechos': ui.verHechos = !ui.verHechos; pintar(); break;
    case 'rec-borrar-hechos':
      if(!confirm('¿Borrar todos los recordatorios hechos?')) return;
      vivos('recordatorios').forEach(function(r){ if(r.hecho && (!r.rep || r.rep === 'no')){ r.del = true; r.upd = r.delEn = Date.now(); } });
      guardar(); pintar(); break;
    case 'evento-ed': cerrarFlotante(); editarEvento(id); break;
    case 'nota-ed': cerrarFlotante(); editarNota(id); break;
    case 'habito-ed': cerrarFlotante(); editarHabito(id); break;

    case 't-filtro': ui.tFiltro = b.dataset.f; pintar(); break;
    case 't-area': ui.tArea = b.dataset.a; pintar(); break;
    case 't-borrar-hechas':
      if(!confirm('¿Borrar todas las tareas hechas?')) return;
      vivos('tareas').forEach(function(x){ if(x.hecha){ x.del = true; x.upd = x.delEn = Date.now(); } });
      guardar(); pintar(); break;

    case 'enfoque-ok':
      var hoy = hoyISO(), e = buscarId('enfoque', hoy) || { id:hoy, items:[] };
      var i = +id; e.items = e.items || [];
      e.items[i] = e.items[i] || { t:'', ok:false };
      var inp = document.querySelector('[data-enfoque="' + i + '"]');
      if(inp) e.items[i].t = inp.value.trim();
      if(!e.items[i].t){ if(inp) inp.focus(); return; }
      e.items[i].ok = !e.items[i].ok; delete e.del;
      poner('enfoque', e);
      if(e.items.filter(function(x){ return x && x.ok; }).length === 3 && e.items[i].ok) aviso('🎯 ¡Enfoque del día cumplido!');
      pintar(); break;

    case 'habito-hoy': alternarHabito(id, hoyISO()); break;
    case 'habito-dia': alternarHabito(id, b.dataset.dia); break;
    case 'habito-sug': poner('habitos', { id:nid(), nombre:b.dataset.n, em:b.dataset.em, dias:[0,1,2,3,4,5,6], marcas:{}, creada:Date.now() }); pintar(); break;

    case 'ir-dia': ui.calSel = b.dataset.dia; ui.calMes = b.dataset.dia.slice(0, 7); ui.calModo = 'mes'; ir('calendario'); break;
    case 'cal-dia':
      ui.calSel = b.dataset.dia;
      if(b.dataset.dia.slice(0, 7) !== ui.calMes) ui.calMes = b.dataset.dia.slice(0, 7);
      pintar();
      if(window.innerWidth < 1100){ var pn = document.querySelector('.cal-layout > .tarjeta'); if(pn) pn.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
      break;
    case 'cal-mover':
      var p = ui.calMes.split('-'), d = new Date(+p[0], +p[1] - 1 + (+b.dataset.n), 1);
      ui.calMes = iso(d).slice(0, 7);
      ui.calSel = ui.calMes === hoyISO().slice(0, 7) ? hoyISO() : iso(d);
      pintar(); break;
    case 'cal-hoy': ui.calMes = hoyISO().slice(0, 7); ui.calSel = hoyISO(); pintar(); break;
    case 'cal-modo': ui.calModo = b.dataset.m; if(ui.calModo === 'mes') ui.calMes = ui.calSel.slice(0, 7); pintar(); break;
    case 'cal-paso': pasoCal(+b.dataset.n); pintar(); break;
    case 'cal-ir': ui.calSel = b.dataset.dia; ui.calMes = ui.calSel.slice(0, 7); pintar(); break;
    case 'cal-ir-dia': ui.calSel = b.dataset.dia; ui.calMes = ui.calSel.slice(0, 7); ui.calModo = 'dia'; pintar(); window.scrollTo(0, 0); break;
    case 'cal-ir-mes': ui.calMes = b.dataset.v; ui.calSel = b.dataset.v === hoyISO().slice(0, 7) ? hoyISO() : b.dataset.v + '-01'; ui.calModo = 'mes'; pintar(); window.scrollTo(0, 0); break;
    case 'cal-filtros': filtrosCal(); break;
    case 'ics-importar': $('archivoIcs').click(); break;
    case 'cal-feriado': aviso(b.textContent.trim() || 'Feriado', 'Feriado nacional en Perú'); break;
    case 'cal-hueco-libre':
      ui.calSel = b.dataset.dia;
      editarEvento(null, { fecha:b.dataset.dia, todo:false, ini:b.dataset.h, fin:sumarHora(b.dataset.h, 60), esp:ui.calEsp || espPorDefecto() });
      break;
    case 'cal-nuevo': ui.calSel = b.dataset.dia; nuevo(b.dataset.tipo, { fecha:b.dataset.dia }); break;
    case 'cal-hueco':
      var rH = b.getBoundingClientRect(), minH = Math.max(0, Math.round(((ev.clientY - rH.top) / H_ALTO * 60) / 30) * 30) + H_INI * 60;
      minH = Math.min(minH, H_FIN * 60 - 30);
      var hH = dos(Math.floor(minH / 60)) + ':' + dos(minH % 60);
      ui.calSel = b.dataset.dia;
      editarEvento(null, { fecha:b.dataset.dia, todo:false, ini:hH, fin:sumarHora(hH, 60), esp:ui.calEsp || espPorDefecto() });
      break;

    case 'lista-abrir': ir('listas'); ui.lista = id; pintar(); break;
    case 'lista-volver': ui.lista = null; pintar(); break;
    case 'lista-ed': editarLista(id); break;
    case 'item-ok':
      cambiarLista(function(l){ var it = l.items.find(function(x){ return x.id === id; }); if(it){ it.ok = !it.ok; if(it.ok && esListaCompras(l)) contarCompra(l, it.t); } });
      b.setAttribute('aria-checked', b.getAttribute('aria-checked') !== 'true'); b.classList.add('pop');
      setTimeout(pintarSeguro, 260); break;
    case 'item-quitar': cambiarLista(function(l){ l.items = l.items.filter(function(x){ return x.id !== id; }); }); pintarSeguro(); break;
    case 'item-ed':
      if(b.querySelector('input')) return;
      var viejo = b.textContent;
      b.innerHTML = '<input class="entrada" style="height:34px" maxlength="160" value="' + esc(viejo) + '">';
      var ie = b.querySelector('input'); ie.focus(); ie.select();
      var hecho = false;
      var fin = function(guardarlo){
        if(hecho) return; hecho = true;
        var nv = ie.value.trim();
        if(guardarlo && nv && nv !== viejo) cambiarLista(function(l){ var it = l.items.find(function(x){ return x.id === id; }); if(it) it.t = nv; });
        pintar();
      };
      ie.onkeydown = function(k){ if(k.key === 'Enter'){ k.preventDefault(); fin(true); } else if(k.key === 'Escape'){ k.stopPropagation(); fin(false); } };
      ie.onblur = function(){ fin(true); };
      break;
    case 'lista-desmarcar': cambiarLista(function(l){ l.items.forEach(function(x){ x.ok = false; }); }); pintar(); break;
    case 'lista-limpiar': cambiarLista(function(l){ l.items = l.items.filter(function(x){ return !x.ok; }); }); pintar(); break;

    case 't-esp': ui.tEsp = b.dataset.v; cerrarFlotante(); pintar(); break;
    case 'cal-esp': ui.calEsp = b.dataset.v; pintar(); break;
    case 'esp-tareas': ui.tEsp = b.dataset.v; ui.tFiltro = 'todas'; ir('tareas'); break;
    case 'esp-cal': ui.calEsp = b.dataset.v; ui.calModo = 'agenda'; ir('calendario'); break;
    case 'esp-anotar':
      var de = dineroEsp(b.dataset.v), tipoA = b.dataset.t === 'Ingreso' ? 'Ingreso' : 'Gasto';
      gastoRapido(de.libro, tipoA);
      if(de.cat && tipoA === 'Gasto'){ ui.grCat = de.cat; var bc = document.querySelector('[data-acc="gr-cat"][data-v="' + de.cat + '"]'); if(bc) bc.setAttribute('aria-pressed', 'true'); }
      break;
    case 'curso-ed': cerrarFlotante(); editarCurso(id); break;
    case 'cobro-ed': cerrarFlotante(); editarCobro(id); break;
    case 'deuda-ed': cerrarFlotante(); editarDeuda(id); break;
    case 'rutina-ed': cerrarFlotante(); editarRutina(id); break;
    case 'rutina-empezar':
      var ru = buscarId('rutinas', id);
      if(ru) editarEntreno(null, { tipo:'gym', rutina:id, ejs:ejsDeRutina(id), notas:ru.nombre, min:60 });
      break;
    case 'deuda-ok': saldarDeuda(id, b); break;
    case 'proy-abrir': cerrarFlotante(); ir('proyectos'); ui.proy = id; pintar(); break;
    case 'proy-volver': ui.proy = null; pintar(); break;
    case 'proy-ed': editarProyecto(id); break;
    case 'proy-esp': ui.proyEsp = b.dataset.v; pintar(); break;
    case 'proy-lista': ui.proyEsp = b.dataset.v; ui.proy = null; ir('proyectos'); break;
    case 'proy-estado':
      var pe = buscarId('proyectos', id);
      if(pe){ pe.estado = pe.estado === 'hecho' ? 'activo' : 'hecho'; poner('proyectos', pe); if(pe.estado === 'hecho'){ confeti(); aviso('🎉 ¡Proyecto terminado!', pe.nombre); } pintar(); }
      break;
    case 'ir-revision': ui.revSemana = b.dataset.v; ir('revision'); break;
    case 'rev-mover': ui.revSemana = sumarDias(ui.revSemana || inicioSemana(hoyISO()), +b.dataset.n); pintar(); break;
    case 'sem-mover': ui.calSel = sumarDias(ui.calSel, +b.dataset.n); ui.calMes = ui.calSel.slice(0, 7); pintar(); break;
    case 'cobro-ok': cobrar(id, b); break;
    case 'nuevo-examen': editarEvento(null, { tipo:'examen', esp:'estudios', todo:false, aviso:1440, color:'rojo' }); break;
    case 'nuevo-reunion': editarEvento(null, { tipo:'reunion', esp:'oficina', aviso:15 }); break;
    case 'nuevo-partido': editarEvento(null, { tipo:'partido', esp:'deporte', aviso:60, t:'Partido' }); break;
    case 'partido-jugado': editarEvento(null, { tipo:'partido', esp:'deporte', aviso:-1, t:'Partido', fecha:hoyISO(), ini:'', fin:'', todo:true, jugado:true }); break;
    case 'nuevo-cumple': editarEvento(null, { esp:'personal', cumple:true, todo:true, rep:'ano', aviso:1440, color:'rosa' }); break;
    case 'agua':
      var bA = JSON.parse(JSON.stringify(bienestar(hoyISO()))), vA = +b.dataset.v;
      delete bA.del; bA.agua = bA.agua === vA ? vA - 1 : vA; poner('bienestar', bA);
      if(bA.agua === META_AGUA){ aviso('💧 ¡Meta de agua cumplida!', META_AGUA + ' vasos hoy'); if(typeof confeti === 'function') confeti(); }
      pintarSeguro(); break;
    case 'sueno':
      var bS = JSON.parse(JSON.stringify(bienestar(hoyISO()))), vS = +b.dataset.v;
      delete bS.del; bS.sueno = +bS.sueno === vS ? '' : vS; poner('bienestar', bS); pintarSeguro(); break;
    case 'compra-siempre':
      var lS = buscarId('listas', b.dataset.lista);
      if(lS){ lS = JSON.parse(JSON.stringify(lS)); lS.items = lS.items || []; lS.items.push({ id:nid(), t:b.dataset.t, ok:false }); poner('listas', lS); vibrar(10); pintar(); }
      break;
    case 'deuda-recordar':
      var dR = buscarId('deudas', id);
      if(dR) compartir('Recordatorio', 'Hola ' + dR.persona + ' 👋, te escribo para recordarte lo que quedó pendiente: ' + dinero(+dR.monto || 0) + (dR.concepto ? ' (' + dR.concepto + ')' : '') + '. ¡Gracias! 🙌');
      break;
    case 'cobro-recordar':
      var cR = buscarId('cobros', id);
      if(cR) whatsapp(telCliente(cR.cliente), 'Hola, ' + cR.cliente + '. Te escribo por el pago pendiente de ' + dinero(+cR.monto || 0) + (cR.concepto ? ' por ' + cR.concepto : '') + (cR.vence ? ', con fecha ' + fechaCorta(cR.vence) : '') + '. Quedo atento. ¡Gracias!');
      break;
    case 'fecha-felicitar':
      var eF = buscarId('eventos', id);
      if(eF) compartir('Saludo', eF.cumple ? '¡Feliz cumpleaños, ' + nombreCumple(eF.t) + '! 🎂🎉 Que la pases increíble.' : '¡Feliz ' + eF.t.toLowerCase() + '! 💝');
      break;
    case 'cumple-regalo':
      var eR = buscarId('eventos', id);
      if(eR && !tareaRegalo(id)){
        var fR = sumarDias(b.dataset.dia, -3); if(fR < hoyISO()) fR = hoyISO();
        var tR = poner('tareas', { id:nid(), t:'Regalo para ' + nombreCumple(eR.t), fecha:fR, hora:'', prio:1, area:'', esp:'personal', rep:'no', sub:[], notas:'Cumpleaños el ' + fechaCorta(b.dataset.dia) + '.', regalo:id, creada:Date.now() });
        aviso('🎁 Anotado para el ' + fechaCorta(fR), tR.t, 'Deshacer', function(){ quitar('tareas', tR.id, 'Regalo'); pintar(); });
        pintar();
      }
      break;
    case 'examen-plan': crearPlanExamen(id, b.dataset.dia); break;
    case 'bolso-crear':
      poner('listas', { id:nid(), nombre:'Bolso del partido', em:'🎒', color:'verde', esp:'deporte', creada:Date.now(), items:BOLSO_BASE.map(function(t){ return { id:nid(), t:t, ok:false }; }) }); pintar(); break;
    case 'bolso-ok':
      var lB = buscarId('listas', b.dataset.lista);
      if(lB){ lB = JSON.parse(JSON.stringify(lB)); var iB = (lB.items || []).find(function(x){ return x.id === id; });
        if(iB){ iB.ok = !iB.ok; poner('listas', lB); vibrar(10); if(iB.ok && lB.items.every(function(x){ return x.ok; })) aviso('🎒 ¡Todo listo!', 'A la cancha.'); pintar(); } }
      break;
    case 'bolso-vaciar':
      var lV = buscarId('listas', b.dataset.lista);
      if(lV){ lV = JSON.parse(JSON.stringify(lV)); (lV.items || []).forEach(function(x){ x.ok = false; }); poner('listas', lV); pintar(); }
      break;
    case 'compra-ok':
      var lC = buscarId('listas', b.dataset.lista);
      if(lC){ lC = JSON.parse(JSON.stringify(lC)); var itC = (lC.items || []).find(function(x){ return x.id === id; }); if(itC){ itC.ok = true; contarCompra(lC, itC.t); poner('listas', lC); b.classList.add('comprado'); setTimeout(pintarSeguro, 280); } }
      break;
    case 'curso-falta':
      var cF = buscarId('cursos', id);
      if(cF){ cF = JSON.parse(JSON.stringify(cF)); cF.faltas = (+cF.faltas || 0) + 1; poner('cursos', cF);
        aviso('Falta anotada en ' + cF.nombre, 'Llevas ' + cF.faltas + (cF.maxFaltas ? ' de ' + cF.maxFaltas + ' permitidas' : ''), 'Deshacer', function(){ var c2 = JSON.parse(JSON.stringify(buscarId('cursos', id))); c2.faltas = Math.max(0, (+c2.faltas || 0) - 1); poner('cursos', c2); pintar(); });
        pintar(); }
      break;
    case 'hora-nueva': editarHora(null); break;
    case 'esp-tab':
      ui.espTab = ui.espTab || {}; ui.espTab[b.dataset.esp] = b.dataset.v;
      if(ui.vista !== 'esp-' + b.dataset.esp) ir('esp-' + b.dataset.esp); else pintar();
      var pt = document.querySelector('.esp-tabs'); if(pt && pt.getBoundingClientRect().top < 0) pt.scrollIntoView({ block:'start' });
      break;
    case 'casa-nueva': editarCasa(null); break;
    case 'casa-ed': editarCasa(id); break;
    case 'casa-sug': poner('casa', { id:nid(), t:b.dataset.t, em:b.dataset.em, cada:+b.dataset.c, ult:'' }); aviso(b.dataset.em + ' Añadido', 'Márcalo como hecho la próxima vez que lo hagas.'); pintar(); break;
    case 'casa-ok':
      var cO = JSON.parse(JSON.stringify(buscarId('casa', id))), cAntes = cO.ult;
      cO.ult = hoyISO(); poner('casa', cO);
      aviso((cO.em || '🧹') + ' ¡Hecho!', 'Vuelve a tocar ' + relativo(sumarDias(cO.ult, +cO.cada)).toLowerCase(), 'Deshacer', function(){ var c2 = JSON.parse(JSON.stringify(buscarId('casa', id))); c2.ult = cAntes; poner('casa', c2); pintar(); });
      pintar(); break;
    case 'menu-sem': ui.menuSem = (ui.menuSem || 0) + +b.dataset.n; pintar(); break;
    case 'menu-idea':
      var mI = JSON.parse(JSON.stringify(menuDia(b.dataset.d))); delete mI.del;
      mI[b.dataset.k] = platoAlAzar(platosDeLaSemana(inicioSemana(b.dataset.d))); poner('menu', mI); pintarSeguro(); break;
    case 'menu-sorpresa':
    case 'menu-copiar':
      var iniM = inicioSemana(sumarDias(hoyISO(), 7 * (ui.menuSem || 0))), nM = 0;
      for(var kM = 0; kM < 7; kM++){
        var dM = sumarDias(iniM, kM), mM = JSON.parse(JSON.stringify(menuDia(dM))), antM = menuDia(sumarDias(dM, -7)); delete mM.del;
        ['alm','cena'].forEach(function(k){ if(!mM[k]){ var v = a === 'menu-copiar' ? antM[k] : platoAlAzar(platosDeLaSemana(iniM)); if(v){ mM[k] = v; nM++; } } });
        poner('menu', mM);
      }
      aviso(nM ? '🍲 ' + nM + ' comidas puestas' : 'No había nada que llenar', a === 'menu-copiar' && !nM ? 'La semana pasada estaba vacía.' : null); pintar(); break;
    case 'doc-nuevo': editarDoc(null, b.dataset.t ? { t:b.dataset.t, em:b.dataset.em } : null); break;
    case 'doc-ed': editarDoc(id); break;
    case 'crear-compras':
      poner('listas', { id:nid(), nombre:'Compras', em:'🛒', color:'verde', esp:'personal', creada:Date.now(), items:[] }); pintar(); break;
    case 'repasar': empezarRepaso(b.dataset.v); break;
    case 'ficha-ed': cerrarFlotante(); editarFicha(id); break;
    case 'tema-ok':
      var eT = JSON.parse(JSON.stringify(buscarId('eventos', id))), tT = eT.temas[+b.dataset.i];
      tT.ok = !tT.ok; poner('eventos', eT);
      if(eT.temas.every(function(x){ return x.ok; })){ confeti(); aviso('📚 ¡Todo repasado!', eT.t); }
      pintarSeguro(); break;
    case 'kan-mover': moverKan(id, +b.dataset.d); break;
    case 'cliente-nuevo': editarCliente(null, b.dataset.n); break;
    case 'cliente-ed': editarCliente(id); break;
    case 'cliente-cobro': editarCobro(null, { cliente:b.dataset.n }); break;
    case 'cliente-reloj':
      if(reloj && reloj.inicio){ aviso('Ya hay un cronómetro en marcha', reloj.cliente); break; }
      reloj = { inicio:Date.now(), cliente:b.dataset.n }; escribirJSON(CLAVE_RELOJ, reloj);
      ui.espTab = ui.espTab || {}; ui.espTab.oficina = 'inicio'; aviso('⏱️ Trabajando para ' + b.dataset.n); pintar(); break;
    case 'acta': cerrarFlotante(); editarActa(id, b.dataset.d); break;
    case 'acuerdo-ok':
      var eA = JSON.parse(JSON.stringify(buscarId('eventos', id))), acA = eA.actas[b.dataset.d].acuerdos[+b.dataset.i];
      acA.ok = true; poner('eventos', eA);
      b.setAttribute('aria-checked', 'true'); b.classList.add('pop'); setTimeout(pintarSeguro, 280); break;
    case 'descanso': var sD = +b.dataset.v; iniciarCrono('Descanso', [{ n:'Descansa', s:sD, tipo:'descanso' }]); break;
    case 'pich-pago':
    case 'pich-x':
      var eP = JSON.parse(JSON.stringify(buscarId('eventos', id))), iP = +b.dataset.i;
      if(a === 'pich-x') eP.pich.jug.splice(iP, 1); else eP.pich.jug[iP].p = !eP.pich.jug[iP].p;
      poner('eventos', eP); pintarSeguro(); break;
    case 'pich-copiar':
      var eC = buscarId('eventos', id), pC = eC.pich || { jug:[] }, nC = pC.jug.length, cuC = nC && +pC.costo ? +pC.costo / nC : 0;
      var txtC = '⚽ ' + eC.t + '\n📅 ' + cap(fechaLarga(eC.fecha)) + (eC.todo ? '' : ' · ' + eC.ini) + (eC.lugar ? '\n📍 ' + eC.lugar : '') + '\n\n' +
        pC.jug.map(function(j, k){ return (k + 1) + '. ' + j.n + (j.p ? ' ✅' : ''); }).join('\n') + (cuC ? '\n\n💰 Cuota: ' + dinero(cuC) + ' c/u' : '');
      try{ navigator.clipboard.writeText(txtC).then(function(){ aviso('📋 Lista copiada', 'Pégala en el grupo de WhatsApp.'); }, function(){ prompt('Copia la lista:', txtC); }); }catch(e){ prompt('Copia la lista:', txtC); }
      break;
    case 'hora-ed': cerrarFlotante(); editarHora(id); break;
    case 'reloj-parar': pararReloj(); break;
    case 'estudiar': foco.esp = 'estudios'; guardarFoco(); ir('foco'); break;
    case 'foco-esp': foco.esp = b.dataset.v; guardarFoco(); pintar(); break;
    case 'entreno-rapido': ui.entTipo = b.dataset.v; editarEntreno(null, { tipo:b.dataset.v, min:b.dataset.v === 'futbol' ? 90 : b.dataset.v === 'correr' ? 30 : 60 }); break;
    case 'entreno-ed': cerrarFlotante(); editarEntreno(id); break;
    case 'ver-entrenos':
      var todosE = vivos('entrenos').sort(function(x, y){ return y.fecha.localeCompare(x.fecha); });
      abrirFlotante(cabFlot('Tus entrenamientos') + (todosE.length ? '<div class="lista-filas">' + todosE.slice(0, 80).map(function(e){
        var d = deporteInfo(e.tipo);
        return '<div class="fila"><span class="em-fila">' + d.em + '</span><div class="cuerpo" data-acc="entreno-ed" data-id="' + e.id + '"><div class="titulo">' + d.n + (e.notas ? ' · ' + esc(e.notas.slice(0, 50)) : '') + '</div><div class="meta"><span>' + fechaCorta(e.fecha) + '</span><span>' + e.min + ' min</span>' + (e.km ? '<span>' + e.km + ' km</span>' : '') + '</div></div></div>';
      }).join('') + '</div>' : vacio('🏋️', 'Aún no hay entrenamientos')) +
      '<div class="botones"><button class="btn primario" data-acc="nuevo" data-tipo="entreno">' + ico('i-plus') + 'Anotar entrenamiento</button></div>');
      break;
    case 'din-libro': ui.dinLibro = b.dataset.v; pintar(); break;
    case 'ag-dia': ui.agDia = b.dataset.dia; pintar(); break;
    case 'ag-sem': ui.agDia = sumarDias(ui.agDia || hoyISO(), +b.dataset.n); pintar(); break;
    case 'ag-tareas': ui.tFiltro = b.dataset.v || 'hoy'; ir('tareas'); break;
    case 'din-anotar': gastoRapido(b.dataset.libro === 'oficina' ? 'oficina' : 'personal', b.dataset.t === 'Ingreso' ? 'Ingreso' : 'Gasto'); break;
    case 'mov-ver':
      ui.movLibro = b.dataset.v || 'personal'; ui.movCat = b.dataset.cat || ''; ui.movTipo = b.dataset.cat ? 'g' : 'todo';
      ui.movMes = b.dataset.mes || hoyISO().slice(0, 7);
      ir('movimientos'); break;
    case 'mov-libro': ui.movLibro = b.dataset.v; pintar(); break;
    case 'mov-tipo': ui.movTipo = b.dataset.v; pintar(); break;
    case 'mov-cat': ui.movCat = b.dataset.v || ''; if(!ui.movCat) ui.movTipo = 'todo'; pintar(); break;
    case 'mov-mes':
      var mh = hoyISO().slice(0, 7), mn = b.dataset.n;
      if(mn === 'todo') ui.movMes = 'todo';
      else if(mn === 'hoy') ui.movMes = mh;
      else { var mc = ui.movMes && ui.movMes !== 'todo' ? ui.movMes : mh; ui.movMes = +mn < 0 ? mesAntes(mc, 1) : mesAntes(mc, -1); if(ui.movMes > mh) ui.movMes = mh; }
      pintar(); break;
    case 'mov-ed': editarMovimiento(b.dataset.libro === 'oficina' ? 'oficina' : 'personal', id); break;
    case 'mov-repetir':
      var libR = b.dataset.libro, nuevoR = null;
      cambiarLibro(libR, function(l){
        var o = l.find(function(x){ return String(x.id) === id; });
        if(!o) return l;
        nuevoR = Object.assign({}, o, { id:nid(), date:hoyISO() });
        return l.concat([nuevoR]);
      });
      if(nuevoR){
        vibrar(15); pintar();
        aviso('↻ Repetido hoy: ' + dinero(Math.abs(+nuevoR.amount || 0)), nuevoR.desc || null, 'Deshacer', function(){
          cambiarLibro(libR, function(l){ return l.filter(function(x){ return x.id !== nuevoR.id; }); }); pintar();
        });
      }
      break;
    case 'hacer-fijo':
      editarPago(null, { t:b.dataset.t, monto:+b.dataset.m || '', cat:b.dataset.cat || '', dia:+b.dataset.dia || 1, esp:b.dataset.libro === 'oficina' ? 'oficina' : 'personal' });
      break;
    case 'cal-ir-dia-hoy': ui.calSel = b.dataset.dia; ui.calMes = ui.calSel.slice(0, 7); ui.calModo = 'dia'; ir('calendario'); break;
    case 'din-ver': ui.dinLibro = b.dataset.v; ui.qaLibro = b.dataset.v; ui.qaCatPre = ''; ir('dinero'); break;
    case 'qa-tipo':
      ui.qaTipo = b.dataset.v;
      b.parentNode.querySelectorAll('[data-acc="qa-tipo"]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var qd = $('qaDesc'); if(qd) qd.placeholder = ui.qaTipo === 'Ingreso' ? 'Ej. Sueldo, venta, cobro a cliente' : 'Ej. Almuerzo, taxi, útiles de oficina';
      break;
    case 'qa-libro':
      ui.qaLibro = b.dataset.v;
      b.parentNode.querySelectorAll('[data-acc="qa-libro"]').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var bs = b.closest('form').querySelector('button[type=submit]'); if(bs) bs.lastChild.textContent = 'Anotar en ' + NOM_LIBRO[ui.qaLibro];
      break;
    case 'qa-cat': var qc = $('qaCat'); if(qc){ qc.value = b.dataset.v; } var qm2 = $('qaMonto'); if(qm2 && !qm2.value) qm2.focus(); break;
    case 'presu-ed': editarPresupuesto(); break;
    case 'tarea-manana': tareaAManana(id); break;
    case 't-atrasadas-hoy':
      var hoyA = hoyISO(), movidas = [];
      vivos('tareas').forEach(function(x){ if(!x.hecha && x.fecha && x.fecha < hoyA){ movidas.push(JSON.parse(JSON.stringify(x))); x.fecha = hoyA; x.upd = Date.now(); } });
      guardar(); pintar();
      aviso(movidas.length + (movidas.length === 1 ? ' tarea pasada' : ' tareas pasadas') + ' a hoy', null, 'Deshacer', function(){ movidas.forEach(function(x){ poner('tareas', x); }); pintar(); });
      break;

    case 'pago-ok': alternarPago(id, b.dataset.ym || hoyISO().slice(0, 7), b); break;
    case 'pago-ed': cerrarFlotante(); editarPago(id); break;
    case 'pago-sug': editarPago(null, { t:b.dataset.n, em:b.dataset.em, dia:+b.dataset.d }); break;
    case 'pagos-mover':
      var pm = ui.pagosMes.split('-'), pd = new Date(+pm[0], +pm[1] - 1 + (+b.dataset.n), 1);
      ui.pagosMes = iso(pd).slice(0, 7); pintar(); break;

    case 'meta-ed': cerrarFlotante(); editarMeta(id); break;
    case 'meta-sug': editarMeta(null, { t:b.dataset.n, em:b.dataset.em, objetivo:+b.dataset.o, unidad:b.dataset.u }); break;
    case 'meta-sumar': sumarMeta(id, +b.dataset.n); break;

    case 'animo':
      var da = b.dataset.dia, ya2 = buscarId('diario', da), va = +b.dataset.v;
      guardarDiario(da, { animo:(ya2 && !ya2.del && ya2.animo === va) ? 0 : va });
      pintarSeguro(); break;
    case 'diario-mover':
      var nd = sumarDias(ui.diarioDia, +b.dataset.n);
      if(nd <= hoyISO()){ ui.diarioDia = nd; pintar(); } break;
    case 'diario-dia': cerrarFlotante(); ui.diarioDia = b.dataset.dia || id; if(ui.vista !== 'diario') ir('diario'); else { pintar(); window.scrollTo({ top:0, behavior:'smooth' }); } break;

    case 'foco-modo':
      if(foco.fin && !confirm('¿Parar la sesión en marcha?')) return;
      foco.modo = b.dataset.m; foco.fin = 0; foco.resta = 0; guardarFoco(); pintar(); tictac(); break;
    case 'foco-play': focoPlay(); break;
    case 'foco-reiniciar': foco.fin = 0; foco.resta = 0; guardarFoco(); document.title = 'Enfoque · Agenda'; pintar(); tictac(); break;
    case 'foco-saltar':
      foco.fin = 0; foco.resta = 0;
      foco.modo = foco.modo === 'trabajo' ? ((foco.ciclo + 1) % 4 === 0 ? 'largo' : 'corto') : 'trabajo';
      guardarFoco(); document.title = 'Enfoque · Agenda'; pintar(); tictac(); break;

    case 'pin-poner': case 'pin-cambiar': mostrarCandado('nuevo'); break;
    case 'pin-quitar':
      if(!confirm('¿Quitar el PIN? La agenda se abrirá sin pedirlo.')) return;
      pinCfg = null; try{ localStorage.removeItem(CLAVE_PIN); }catch(e){}
      aviso('PIN quitado'); pintar(); break;

    case 'ejemplos': cargarEjemplos(); break;
    case 'tema': aplicarTema(b.dataset.t); pintar(); break;
    case 'paleta': aplicarPaleta(b.dataset.p); pintar(); break;
    case 'lunes': pref.lunes = b.dataset.v === '1'; guardarPref(); pintar(); break;
    case 'permiso': pedirPermiso(); break;
    case 'probar-aviso':
      if('Notification' in window && Notification.permission === 'default'){ pedirPermiso(); }
      dispararAlarma({ t:'Así suena un aviso', cuerpo:'Todo en orden.', id:'prueba', tipo:'prueba' }); break;
    case 'ics-todo':
      var evs = vivos('eventos').map(function(x){ return aVEVENT(x, 'evento'); })
        .concat(vivos('recordatorios').filter(function(r){ return !r.hecho; }).map(function(x){ return aVEVENT(x, 'rec'); }));
      if(!evs.length){ aviso('No hay eventos ni recordatorios'); return; }
      bajarICS(evs, 'agenda_' + hoyISO() + '.ics'); break;
    case 'nube-crear': crearBase($('ajLlave').value); break;
    case 'sync-ya':
      b.disabled = true; b.textContent = 'Sincronizando…';
      sincronizarTodo().then(function(){ if($('capaFlotante').innerHTML) hojaSync(); if(ui.vista === 'ajustes') pintar(); aviso('☁️ Sincronizado'); });
      break;
    case 'nube-libros':
      aviso('Conectando los libros…');
      crearBaseLibro('personal', nube.key).then(function(){ return crearBaseLibro('oficina', nube.key); })
        .then(function(){ aviso('Libros en la nube', 'Ahora copia de nuevo el código para tus otros aparatos.'); sincronizarTodo(); pintar(); }, function(e){ aviso('No se pudo', String(e.message || e)); });
      break;
    case 'nube-unir': unirNube($('ajCodigo').value); break;
    case 'nube-ya': sincronizarTodo().then(function(){ aviso($('pastillaNube').dataset.estado === 'ok' ? 'Sincronizado' : 'No se pudo conectar'); }); break;
    case 'nube-codigo':
      var cod = codigoNube();
      abrirFlotante(cabFlot('Código para otro aparato') +
        '<p style="margin:0 0 10px;color:var(--tinta-2);font-size:13.5px">Pégalo en Ajustes → Sincronizar → <b>Otro aparato</b>. Guárdalo en privado: da acceso a tu agenda.</p>' +
        '<textarea class="entrada" readonly style="height:110px;padding:10px;font-family:var(--cifra);font-size:12px;word-break:break-all">' + esc(cod) + '</textarea>' +
        '<div class="botones"><button class="btn primario" data-acc="copiar">Copiar</button></div>');
      break;
    case 'copiar':
      var ta = document.querySelector('#capaFlotante textarea');
      ta.select();
      (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(function(){ aviso('Copiado'); }, function(){ try{ document.execCommand('copy'); aviso('Copiado'); }catch(e){} });
      break;
    case 'nube-quitar':
      if(!confirm('¿Dejar de sincronizar este aparato?')) return;
      nube = null; try{ localStorage.removeItem(CLAVE_NUBE); localStorage.removeItem(LIBROS.personal.nube); localStorage.removeItem(LIBROS.oficina.nube); }catch(e){}
      estadoNube('off'); pintar(); break;
    case 'respaldo': descargarRespaldo(); break;
    case 'cargar': $('archivoRespaldo').click(); break;
    case 'instalar': instalar(); break;
    case 'borrar-todo':
      if(!confirm('¿Borrar TODA la agenda de este aparato? Los gastos personales y la oficina no se tocan.')) return;
      if(!confirm('Seguro? No se puede deshacer (salvo con un respaldo).')) return;
      COLS.forEach(function(c){ db[c].forEach(function(x){ if(!x.del){ x.del = true; x.upd = x.delEn = Date.now(); } }); });
      guardar(); pintar(); aviso('Agenda vaciada'); break;
  }
});

document.addEventListener('submit', function(ev){
  var f = ev.target;
  var a = f.dataset.acc;
  if(!a) return;
  ev.preventDefault();
  if(a === 'bienvenida'){
    var n = $('nombreBienvenida').value.trim();
    if(!n) return;
    db.perfil = Object.assign({}, db.perfil, { nombre:n, upd:Date.now() }); guardar(); pintar();
  } else if(a === 'captura'){
    var inp = $('entradaCaptura'), v = inp.value.trim();
    if(!v) return;
    var enHoja = !!f.closest('#capaFlotante');
    crearDesdeCaptura(v);
    inp.value = '';
    /* Desde la hoja: se cierra sola, salvo que se abrió un editor encima */
    if(enHoja && $('capaFlotante').querySelector('form[data-acc="captura"]')) cerrarFlotante();
    pintar();
    if(!enHoja){ var ni = $('entradaCaptura'); if(ni) ni.focus(); }
  } else if(a === 'proy-tarea'){
    var pi = $('proyTarea'), pv = pi.value.trim();
    if(!pv) return;
    var pr = buscarId('proyectos', f.dataset.id), pp2 = interpretar(pv);
    poner('tareas', { id:nid(), t:pp2.texto || pv, fecha:pp2.fecha, hora:pp2.hora, prio:pp2.prio, area:pp2.area, esp:pr ? espDe(pr) : 'personal', proy:f.dataset.id, rep:'no', sub:[], notas:'', creada:Date.now() });
    pintar(); var np = $('proyTarea'); if(np) np.focus();
  } else if(a === 'peso'){
    var kg = num($('pesoHoy').value);
    if(!kg || kg < 20 || kg > 400){ aviso('Escribe tu peso en kg', 'Ej. 72.5'); return; }
    poner('medidas', { id:hoyISO(), peso:Math.round(kg * 10) / 10 });
    aviso('Peso anotado', formNum(kg) + ' kg'); pintar();
  } else if(a === 'compra-nueva'){
    var ci = $('compraNueva'), cv = ci.value.trim();
    var lN = buscarId('listas', f.dataset.lista);
    if(!cv || !lN) return;
    lN = JSON.parse(JSON.stringify(lN)); lN.items = lN.items || [];
    cv.split(/\s*[;,\n]\s*/).filter(Boolean).forEach(function(t){ lN.items.push({ id:nid(), t:t.slice(0, 160), ok:false }); });
    poner('listas', lN); pintar(); var cn = $('compraNueva'); if(cn) cn.focus();
  } else if(a === 'cal-rapido'){
    var ci2 = $('calRapido'), cv2 = ci2.value.trim();
    if(!cv2) return;
    var pc = interpretar(cv2), fc = pc.fecha || ui.calSel, tc = pc.texto || cv2, espC = pc.esp || ui.calEsp || espPorDefecto();
    var esCumple = /^(cumple|aniversario)/i.test(sinTildes(tc));
    var evC = { id:nid(), t:tc, fecha:fc, hasta:'', todo:!pc.hora, ini:pc.hora || '', fin:pc.hora ? sumarHora(pc.hora, 60) : '', lugar:'', color:esCumple ? 'rosa' : 'esp', esp:espC, tipo:'evento', rep:esCumple ? 'ano' : 'no', aviso:pc.hora ? 15 : -1, notas:'' };
    if(esCumple){ evC.cumple = true; evC.todo = true; evC.aviso = 1440; }
    poner('eventos', evC); ui.calSel = fc; ui.calMes = fc.slice(0, 7);
    aviso((esCumple ? '🎂 ' : '📅 ') + 'Añadido ' + relativo(fc).toLowerCase() + (pc.hora ? ' a las ' + pc.hora : ''), tc, 'Editar', function(){ editarEvento(evC.id); });
    pintar(); var cr = $('calRapido'); if(cr) cr.focus();
  } else if(a === 'ficha-nueva'){
    var fq = $('fichaQ'), fa = $('fichaA');
    if(!fq.value.trim()){ fq.focus(); return; }
    ui.fichaCurso = $('fichaCurso').value;
    poner('fichas', { id:nid(), curso:ui.fichaCurso, q:fq.value.trim(), a:fa.value.trim(), caja:1, prox:'', creada:Date.now() });
    pintar(); var nq = $('fichaQ'); if(nq) nq.focus();
  } else if(a === 'tema-nuevo'){
    var tin = f.querySelector('input'), tv = tin.value.trim(), eN = buscarId('eventos', f.dataset.id);
    if(!tv || !eN) return;
    eN = JSON.parse(JSON.stringify(eN)); eN.temas = eN.temas || [];
    tv.split(/\s*[;,\n]\s*/).filter(Boolean).forEach(function(t){ eN.temas.push({ t:t.slice(0, 80), ok:false }); });
    poner('eventos', eN); pintar();
    var ti2 = document.querySelector('form[data-acc="tema-nuevo"][data-id="' + eN.id + '"] input'); if(ti2) ti2.focus();
  } else if(a === 'hiit'){
    var hc = { t:Math.max(5, parseInt(f.t.value, 10) || 20), d:Math.max(0, parseInt(f.d.value, 10) || 0), r:Math.min(50, Math.max(1, parseInt(f.r.value, 10) || 8)) };
    pref.hiit = hc; guardarPref();
    var fases = [{ n:'Prepárate', s:10, tipo:'descanso' }];
    for(var r = 1; r <= hc.r; r++){ fases.push({ n:'¡Dale! · ronda ' + r + ' de ' + hc.r, s:hc.t, tipo:'trabajo' }); if(hc.d && r < hc.r) fases.push({ n:'Descanso', s:hc.d, tipo:'descanso' }); }
    iniciarCrono('Intervalos ' + hc.t + '/' + hc.d + ' × ' + hc.r, fases);
  } else if(a === 'meta-km'){
    var mk = num($('metaKm').value); if(mk > 0){ pref.metaKm = mk; guardarPref(); pintar(); }
  } else if(a === 'estatura'){
    var cm = num($('estatura').value); if(cm > 1 && cm < 3) cm *= 100;
    if(cm < 100 || cm > 250){ aviso('Escribe tu estatura en cm', 'Ej. 172'); return; }
    pref.estatura = Math.round(cm); guardarPref(); pintar();
  } else if(a === 'pich-costo' || a === 'pich-jug'){
    var eJ = JSON.parse(JSON.stringify(buscarId('eventos', f.dataset.id)));
    eJ.pich = eJ.pich || { costo:'', jug:[] };
    if(a === 'pich-costo') eJ.pich.costo = num($('pichCosto').value) || '';
    else { var vj = $('pichJug').value.trim(); if(!vj) return; vj.split(/\s*[,;\n]\s*/).filter(Boolean).forEach(function(n){ eJ.pich.jug.push({ n:n.slice(0, 30), p:false }); }); }
    poner('eventos', eJ); pintar();
    if(a === 'pich-jug'){ var pj2 = $('pichJug'); if(pj2) pj2.focus(); }
  } else if(a === 'reloj-empezar'){
    reloj = { inicio:Date.now(), cliente:$('relojCliente').value.trim() };
    escribirJSON(CLAVE_RELOJ, reloj); pintar();
  } else if(a === 'qa'){
    anotarMovimiento(f);
  } else if(a === 'gasto-rapido'){
    guardarGastoRapido();
  } else if(a === 'meta-cantidad'){
    var cant = num(f.n.value);
    if(cant) sumarMeta(f.dataset.id, cant);
  } else if(a === 'item-nuevo'){
    var ii = $('nuevoItem'), txt = ii.value.trim();
    if(!txt) return;
    cambiarLista(function(l){
      txt.split(/\s*[;\n]\s*/).filter(Boolean).forEach(function(t){ l.items.push({ id:nid(), t:t.slice(0, 160), ok:false }); });
    });
    pintar();
    var n2 = $('nuevoItem'); if(n2) n2.focus();
  }
});

function crearDesdeCaptura(v){
  var p = interpretar(v), tipo = ui.capTipo;
  if(!p.texto) p.texto = v;
  var esp = p.esp || ui.capEsp || espPorDefecto(), E = espInfo(esp);
  if(tipo === 'tarea'){
    var t = { id:nid(), t:p.texto, fecha:p.fecha, hora:p.hora, prio:p.prio, area:p.area, esp:esp, rep:'no', sub:[], notas:'', creada:Date.now() };
    if(!t.fecha && ui.vista === 'tareas' && ui.tFiltro === 'hoy') t.fecha = hoyISO();
    poner('tareas', t);
    aviso(E.em + ' Tarea añadida en ' + E.nom, t.fecha ? relativo(t.fecha) + (t.hora ? ' · ' + t.hora : '') : 'Sin fecha');
  } else if(tipo === 'rec'){
    if(!p.fecha && !p.hora){ editarRec(null, { t:p.texto, esp:esp }); return; }
    var h = p.hora || '09:00', f = p.fecha || hoyISO();
    if(f === hoyISO() && h <= horaAhora() && !p.hora){ h = proximaHora(); if(h === '00:00') f = sumarDias(f, 1); }
    poner('recordatorios', { id:nid(), t:p.texto, fecha:f, hora:h, rep:'no', notas:'', esp:esp });
    aviso('Te lo recordaré', relativo(f) + ' · ' + h);
  } else if(tipo === 'evento'){
    var e = { id:nid(), t:p.texto, fecha:p.fecha || hoyISO(), hasta:'', todo:!p.hora, ini:p.hora, fin:p.hora ? sumarHora(p.hora, 60) : '', lugar:'', color:'esp', esp:esp, tipo:'evento', rep:'no', aviso:p.hora ? 15 : -1, notas:'' };
    poner('eventos', e);
    aviso('Evento añadido', relativo(e.fecha) + (e.hora ? ' · ' + e.ini : ''));
  } else if(tipo === 'nota'){
    poner('notas', { id:nid(), t:'', cuerpo:v, color:'', fija:false, esp:esp });
    aviso('Nota guardada');
  }
}

var relojDiario = null;
document.addEventListener('input', function(ev){
  var t = ev.target;
  if(t.id === 'entradaCaptura') actualizarPista();
  else if(t.id === 'textoDiario'){
    clearTimeout(relojDiario);
    var dd = t.dataset.dia, txt = t.value;
    relojDiario = setTimeout(function(){ guardarDiario(dd, { texto:txt.replace(/\s+$/, '') }); }, 600);
  }
  else if(t.id === 'notasQ'){
    ui.notasQ = t.value;
    var pos = t.selectionStart;
    pintar();
    var n = $('notasQ'); if(n){ n.focus(); try{ n.setSelectionRange(pos, pos); }catch(e){} }
  }
});

document.addEventListener('change', function(ev){
  var t = ev.target;
  if(t.dataset && t.dataset.teclado){ pref.teclado = t.checked; escribirJSON(CLAVE_PREF, pref); if(!t.checked) TECLADO.ocultar(); aviso(t.checked ? '⌨️ Teclado de la agenda activado' : 'Vuelves al teclado del celular'); return; }
  if(t.dataset && t.dataset.secVer){
    var so = (pref.secOff || []).filter(function(x){ return x !== t.dataset.secVer; });
    if(!t.checked) so.push(t.dataset.secVer);
    pref.secOff = so; guardarPref(); pintar(); return;
  }
  if(t.dataset && t.dataset.hoySecc){
    var off = pref.hoyOff || [], k0 = t.dataset.hoySecc, oi = off.indexOf(k0);
    if(t.checked && oi >= 0) off.splice(oi, 1); else if(!t.checked && oi < 0) off.push(k0);
    pref.hoyOff = off; guardarPref(); return;
  }
  if(t.dataset && t.dataset.menu){
    var pm = t.dataset.menu.split('|'), mc = JSON.parse(JSON.stringify(menuDia(pm[0])));
    delete mc.del; mc[pm[1]] = t.value.trim().slice(0, 60); poner('menu', mc);
    return;
  }
  if((t.id === 'pichCosto' || t.id === 'metaKm') && t.form && t.form.requestSubmit){ t.form.requestSubmit(); return; }
  if(t.dataset && t.dataset.enfoque != null){
    var hoy = hoyISO(), e = buscarId('enfoque', hoy) || { id:hoy, items:[] };
    e.items = e.items || [];
    var i = +t.dataset.enfoque;
    e.items[i] = e.items[i] || { t:'', ok:false };
    e.items[i].t = t.value.trim();
    if(!e.items[i].t) e.items[i].ok = false;
    for(var k = 0; k < 3; k++) e.items[k] = e.items[k] || { t:'', ok:false };
    delete e.del;
    poner('enfoque', e);
  } else if(t.id === 'ajNombre'){
    db.perfil = Object.assign({}, db.perfil, { nombre:t.value.trim().slice(0, 40), upd:Date.now() }); guardar(); pintarNav();
  } else if(t.id === 'focoTarea'){
    foco.tarea = t.value; guardarFoco(); pintarSeguro();
  } else if(t.dataset && t.dataset.min){
    var mv = Math.min(180, Math.max(1, parseInt(t.value, 10) || 1));
    pref[t.dataset.min] = mv; escribirJSON(CLAVE_PREF, pref);
    if(!foco.fin){ foco.resta = 0; guardarFoco(); }
    pintarSeguro(); tictac();
  } else if(t.dataset && t.dataset.rev){
    var rid = t.dataset.sem, rr = buscarId('revisiones', rid);
    rr = rr ? JSON.parse(JSON.stringify(rr)) : { id:rid };
    delete rr.del; rr[t.dataset.rev] = t.value.trim(); poner('revisiones', rr);
  } else if(t.id === 'textoDiario'){
    clearTimeout(relojDiario); guardarDiario(t.dataset.dia, { texto:t.value.replace(/\s+$/, '') });
  } else if(t.id === 'ajSonido'){
    pref.sonido = t.checked; escribirJSON(CLAVE_PREF, pref);
  } else if(t.id === 'archivoIcs' && t.files && t.files[0]){
    importarICS(t.files[0]);
  } else if(t.dataset && t.dataset.calTipo){
    var oc = (ui.calOcultos || []).slice(), ti = t.dataset.calTipo, pos = oc.indexOf(ti);
    if(ti === 'feriado'){ pref.feriados = t.checked; guardarPref(); }
    else { if(t.checked && pos >= 0) oc.splice(pos, 1); else if(!t.checked && pos < 0) oc.push(ti); ui.calOcultos = oc; }
  } else if(t.id === 'archivoRespaldo' && t.files && t.files[0]){
    cargarRespaldo(t.files[0]); t.value = '';
  }
});

document.addEventListener('focusout', function(){
  setTimeout(function(){
    var a = document.activeElement;
    if(repintarAlSoltar && !(a && $('contenido').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) pintar();
  }, 0);
});

document.addEventListener('keydown', function(ev){
  ultimoToque = Date.now();
  var enCampo = /INPUT|TEXTAREA|SELECT/.test((ev.target.tagName || '')) || ev.target.isContentEditable;
  if(ev.altKey && !enCampo && (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && $('candado').classList.contains('oculto')){
    ev.preventDefault(); pasoNav(ev.key === 'ArrowLeft' ? -1 : 1); return;
  }
  if(!$('candado').classList.contains('oculto')){
    if(/^[0-9]$/.test(ev.key)) teclaPIN(ev.key);
    else if(ev.key === 'Backspace') teclaPIN('b');
    else if(ev.key === 'Enter') teclaPIN('ok');
    ev.preventDefault(); return;
  }
  if(ev.key === 'Escape'){ if($('capaFlotante').innerHTML){ cerrarFlotante(); ev.preventDefault(); } else if(ui.sel){ ui.sel = null; pintar(); } return; }
  /* En los pasos de una tarea, Enter añade otro paso en vez de guardar */
  if(ev.key === 'Enter' && ev.target.closest && ev.target.closest('#subs')){
    ev.preventDefault(); if(edAcciones['sub-add']) edAcciones['sub-add'](); return;
  }
  if((ev.ctrlKey || ev.metaKey) && !ev.altKey && !enCampo && !$('capaFlotante').innerHTML){
    var kz = ev.key.toLowerCase();
    if(kz === 'z' && !ev.shiftKey){ ev.preventDefault(); deshacer(); return; }
    if(kz === 'y' || (kz === 'z' && ev.shiftKey)){ ev.preventDefault(); rehacer(); return; }
  }
  if(enCampo || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if($('capaFlotante').innerHTML) return;
  if(ev.key === '/'){ ev.preventDefault(); abrirBuscar(); }
  else if(ev.key === 'n' || ev.key === 'N'){ ev.preventDefault(); nuevoSegunVista(); }
  else if(/^[1-9]$/.test(ev.key)){ var ns = navSecs(); if(ns[+ev.key - 1]) ir(ns[+ev.key - 1].id); }
});

$('fab').addEventListener('click', function(ev){ ev.stopPropagation(); if(fabLargo){ fabLargo = false; return; } nuevoSegunVista(); });
var fabReloj = null, fabLargo = false;
$('fab').addEventListener('touchstart', function(){ fabLargo = false; fabReloj = setTimeout(function(){ fabLargo = true; menuRapido(); }, 450); }, { passive:true });
/* El toque que suelta el dedo no debe cerrar el menú recién abierto */
window.addEventListener('click', function(ev){ if(fabLargo){ fabLargo = false; ev.stopPropagation(); ev.preventDefault(); } }, true);
['touchend','touchmove','touchcancel'].forEach(function(e){ $('fab').addEventListener(e, function(){ clearTimeout(fabReloj); }, { passive:true }); });
$('fab').addEventListener('contextmenu', function(ev){ ev.preventDefault(); if(!fabLargo) menuRapido(); });
['btnAtras', 'btnAdelante'].forEach(function(id){
  $(id).addEventListener('contextmenu', function(ev){ ev.preventDefault(); hojaHistorialNav(); });
});
$('btnBuscar').addEventListener('click', function(ev){ ev.stopPropagation(); abrirBuscar(); });
$('btnTema').addEventListener('click', function(ev){
  ev.stopPropagation();
  aplicarTema(document.documentElement.getAttribute('data-tema') === 'claro' ? 'oscuro' : 'claro');
  if(ui.vista === 'ajustes') pintar();
});
$('pastillaNube').addEventListener('click', function(ev){ ev.stopPropagation(); hojaSync(); });

window.addEventListener('popstate', function(){
  var hashA = (location.hash || '').slice(1);
  if(hashA === 'gasto' || hashA === 'anadir'){
    ignorarPop = 0; hojaEnHist = false; cerrarFlotante(true);
    try{ history.replaceState(null, '', '#' + ui.vista); }catch(e){}
    if(hashA === 'gasto') gastoRapido('personal'); else hojaAnadir('tarea');
    return;
  }
  if(ignorarPop){ finPop(); return; }
  if(hojaEnHist){ hojaEnHist = false; cerrarFlotante(true); return; }
  var dest = (location.hash || '#hoy').slice(1), ant = NAV.atras[NAV.atras.length - 1], sig = NAV.adelante[NAV.adelante.length - 1];
  if(ant && ant.v === dest && dest !== ui.vista && pasoNav(-1, 1, true)) return;
  if(sig && sig.v === dest && dest !== ui.vista && pasoNav(1, 1, true)) return;
  ir(dest, true);
});

/* Cuentas cambió algo en otra pestaña o dentro del marco: Hoy lo refleja */
window.addEventListener('storage', function(ev){
  if((ev.key === CLAVE_LEDGER || ev.key === CLAVE_OFICINA) && ui.vista === 'hoy') pintarSeguro();
  else if(ev.key === CLAVE){ db = normalizar(leerJSON(CLAVE, null)); pintarSeguro(); }
  else if(ev.key === CLAVE_TEMA || ev.key === CLAVE_PALETA){
    try{
      document.documentElement.setAttribute('data-tema', localStorage.getItem(CLAVE_TEMA) === 'claro' ? 'claro' : 'oscuro');
      var pp = localStorage.getItem(CLAVE_PALETA); if(pp) document.documentElement.setAttribute('data-paleta', paletaValida(pp));
      colorBarra();
    }catch(e){}
  }
});

document.addEventListener('visibilitychange', function(){
  if(document.hidden){ ocultoDesde = Date.now(); return; }
  if(pinCfg && ocultoDesde && Date.now() - ocultoDesde > 60000) mostrarCandado('abrir');
  if(!document.hidden){ ultimoToque = Date.now(); revisarAlarmas(); if(hayAlgunaNube()) sincronizarTodo(); pintarSeguro(); }
});


/* ==========================================================================
   TECLADO PROPIO
   En el celular, los campos de texto usan el teclado de la agenda en vez
   del del sistema: letras con ñ y tildes (manteniendo pulsada la vocal),
   números y símbolos, emojis, atajos de fecha y hora al crear algo, un
   teclado numérico tipo calculadora para los montos, dictado por voz y un
   botón para volver al teclado del celular. Se apaga en Ajustes.
   ========================================================================== */
var TECLADO = (function(){
  var tactil = window.matchMedia && matchMedia('(pointer:coarse)').matches;
  function activo(){ return tactil && pref.teclado !== false; }
  var el = null, capa = 'abc', mayus = 0, caja = null, ocultarReloj = null, repetir = null, largo = null, saltarClick = false;
  var FILAS = {
    abc: ['qwertyuiop', 'asdfghjklñ', '⇧zxcvbnm⌫', ['123', '😊', ',', ' ', '.', '↵']],
    num: ['1234567890', ['-', '/', ':', ';', '(', ')', 'S/', '&', '@', '"'], ['#+=', '.', ',', '?', '!', "'", '%', '⌫'], ['abc', '😊', ',', ' ', '.', '↵']],
    sim: [['[', ']', '{', '}', '#', '%', '^', '*', '+', '='], ['_', '\\', '|', '~', '<', '>', '€', '$', '£', '•'], ['123', '°', '…', '¿', '¡', '«', '»', '⌫'], ['abc', '😊', ',', ' ', '.', '↵']],
    emo: [['😀', '😂', '😅', '😍', '😎', '🤔', '😴', '😢', '😡', '🙌'], ['👍', '👎', '👊', '💪', '🙏', '👏', '❤️', '🔥', '✅', '❌'], ['⚽', '🏋️', '🏃', '📚', '💼', '🏠', '💰', '🎉', '⌫'], ['abc', '🍕', '☕', ' ', '📅', '↵']],
    numpad: [['1', '2', '3', '+'], ['4', '5', '6', '−'], ['7', '8', '9', '⌫'], ['.', '0', '=', '↵']]
  };
  var TILDES = { a:'áàä', e:'éèë', i:'íìï', o:'óòö', u:'úüù', n:'ñ', A:'ÁÀÄ', E:'ÉÈË', I:'ÍÌÏ', O:'ÓÒÖ', U:'ÚÜÙ', N:'Ñ', '?':'¿', '!':'¡' };
  var ATAJOS = ['hoy', 'mañana', 'pasado mañana', 'el lunes', 'el viernes', 'el sábado', '9am', '12pm', '6pm', '8pm', '!!', '#personal', '#estudios', '#oficina', '#deporte'];

  function valido(x){
    if(!x || !x.matches || x.closest('#candado')) return false;
    if(x.tagName === 'TEXTAREA') return !x.readOnly;
    if(x.tagName !== 'INPUT' || x.readOnly || x.disabled) return false;
    var t = (x.getAttribute('type') || 'text').toLowerCase();
    return ['text', 'search', 'email', 'url', 'tel', ''].indexOf(t) >= 0;
  }
  function esNum(x){ var m = x.getAttribute('data-im') || x.getAttribute('inputmode') || ''; return m === 'decimal' || m === 'numeric' || m === 'tel'; }
  function preparar(x){
    if(!activo() || !valido(x) || x.dataset.nativo) return;
    if(!x.hasAttribute('data-im')) x.setAttribute('data-im', x.getAttribute('inputmode') || '');
    x.setAttribute('inputmode', 'none');
  }
  function crear(){
    if(caja) return caja;
    caja = document.createElement('div'); caja.id = 'tecladoApp'; caja.className = 'tkb oculto'; caja.setAttribute('role', 'group'); caja.setAttribute('aria-label', 'Teclado');
    document.body.appendChild(caja);
    /* Tocar el teclado nunca le quita el foco al campo */
    caja.addEventListener('pointerdown', function(ev){ ev.preventDefault(); pulsar(ev); });
    caja.addEventListener('pointerup', soltar);
    caja.addEventListener('pointercancel', function(ev){ if(!caja.querySelector('.tk-pop')) soltar(ev); });
    caja.addEventListener('pointerleave', function(){ if(!caja.querySelector('.tk-pop')) parar(); });
    /* Con la ventanita de tildes abierta, se elige deslizando o tocando */
    caja.addEventListener('pointermove', function(ev){
      var pop = caja.querySelector('.tk-pop'); if(!pop) return;
      var sobre = document.elementFromPoint(ev.clientX, ev.clientY);
      pop.querySelectorAll('button').forEach(function(x){ x.classList.toggle('tk-sobre', x === (sobre && sobre.closest && sobre.closest('.tk-pop button'))); });
    });
    caja.addEventListener('mousedown', function(ev){ ev.preventDefault(); });
    return caja;
  }
  function tecla(k){
    var nom = { '⇧':'Mayúsculas', '⌫':'Borrar', '↵':'Aceptar', ' ':'Espacio', '123':'Números', 'abc':'Letras', '#+=':'Símbolos', '😊':'Emojis', '=':'Calcular' }[k] || k;
    var txt = k === ' ' ? 'espacio' : k === '⇧' ? (mayus === 2 ? '⇪' : '⇧') : (capa === 'abc' && k.length === 1 && mayus ? k.toUpperCase() : k);
    var cls = 'tk' + (k === ' ' ? ' tk-esp' : '') + (['⇧','⌫','↵','123','abc','#+=','😊'].indexOf(k) >= 0 ? ' tk-fn' : '') + (k === '↵' ? ' tk-ok' : '') + (k === '⇧' && mayus ? ' tk-on' : '');
    return '<button type="button" class="' + cls + '" data-k="' + esc(k) + '" aria-label="' + esc(nom) + '">' + esc(txt) + '</button>';
  }
  function pintarTeclado(){
    if(!el) return;
    var filas = FILAS[capa], barra = '';
    if(capa !== 'numpad'){
      var enCaptura = el.id === 'entradaCaptura' || el.id === 'calRapido';
      barra = '<div class="tk-barra">' +
        (enCaptura ? ATAJOS.map(function(a){ return '<button type="button" class="tk-atajo" data-t="' + esc(a) + '">' + esc(a) + '</button>'; }).join('') : '') +
        ['á','é','í','ó','ú','ñ','¿','¡'].map(function(a){ return '<button type="button" class="tk-atajo tk-acento" data-t="' + a + '">' + a + '</button>'; }).join('') +
      '</div>';
    }
    var cab = '<div class="tk-cab">' + barra + '<span class="tk-cab-acc">' +
      (VOZ && capa !== 'numpad' ? '<button type="button" class="tk-mini" data-k="🎤" aria-label="Dictar">' + ico('i-mic') + '</button>' : '') +
      '<button type="button" class="tk-mini" data-k="⌨" aria-label="Usar el teclado del celular" title="Teclado del celular">⌨︎</button>' +
      '<button type="button" class="tk-mini" data-k="▾" aria-label="Ocultar teclado">▾</button></span></div>';
    crear().innerHTML = cab + '<div class="tk-teclas' + (capa === 'numpad' ? ' tk-numpad' : '') + '">' + filas.map(function(f){
      var ks = typeof f === 'string' ? f.split('') : f;
      return '<div class="tk-fila">' + ks.map(tecla).join('') + '</div>';
    }).join('') + '</div>';
  }
  function mostrar(x){
    clearTimeout(ocultarReloj);
    var cambio = el !== x; el = x;
    if(cambio){ capa = esNum(x) ? 'numpad' : 'abc'; mayus = 0; autoMayus(); }
    pintarTeclado();
    caja.classList.remove('oculto');
    document.body.classList.add('con-teclado');
    document.documentElement.style.setProperty('--kb', caja.offsetHeight + 'px');
    setTimeout(function(){ if(el) el.scrollIntoView({ block:'center', behavior:'smooth' }); }, 60);
  }
  function ocultar(){
    el = null;
    if(caja) caja.classList.add('oculto');
    document.body.classList.remove('con-teclado');
    document.documentElement.style.setProperty('--kb', '0px');
  }
  function autoMayus(){
    if(!el || capa !== 'abc' || esNum(el) || /email|url/.test(el.type || '')) return;
    var v = el.value.slice(0, el.selectionStart || 0);
    if(!v.trim() || /[.!?¡¿]\s+$/.test(v) || /\n\s*$/.test(v)) mayus = mayus === 2 ? 2 : 1;
  }
  function avisarCambio(){ el.dispatchEvent(new Event('input', { bubbles:true })); }
  function escribir(t){
    if(!el) return;
    var s = el.selectionStart, e = el.selectionEnd;
    if(s == null){ el.value += t; } else el.setRangeText(t, s, e, 'end');
    avisarCambio();
  }
  function borrar(){
    if(!el) return;
    var s = el.selectionStart, e = el.selectionEnd;
    if(s == null){ el.value = el.value.slice(0, -1); avisarCambio(); return; }
    if(s !== e){ el.setRangeText('', s, e, 'end'); avisarCambio(); return; }
    if(!s) return;
    var cp = el.value.codePointAt(s - 2);
    var n = cp && cp > 0xFFFF ? 2 : 1;
    el.setRangeText('', s - n, s, 'end'); avisarCambio();
  }
  function calcular(){
    var v = el.value.replace(/−/g, '-').replace(/,/g, '.').replace(/\s/g, '');
    if(!/^[\d.+\-]+$/.test(v) || !/\d[+\-]/.test(v)) return;
    var partes = v.match(/[+\-]?[\d.]+/g) || [], t = 0;
    partes.forEach(function(p){ t += parseFloat(p) || 0; });
    el.value = String(Math.round(t * 100) / 100); avisarCambio();
  }
  function aceptar(){
    if(!el) return;
    if(capa === 'numpad') calcular();
    if(el.tagName === 'TEXTAREA'){ escribir('\n'); return; }
    var ev = new KeyboardEvent('keydown', { key:'Enter', bubbles:true, cancelable:true });
    var siguio = el.dispatchEvent(ev);
    if(siguio && el.form){
      if(el.form.requestSubmit) el.form.requestSubmit(); else el.form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true }));
    } else if(siguio && !el.form){ el.blur(); }
  }
  function accion(k){
    vibrar(4);
    if(k === '⌫'){ borrar(); return; }
    if(k === '↵'){ aceptar(); return; }
    if(k === '⇧'){ mayus = mayus === 0 ? 1 : mayus === 1 ? 2 : 0; pintarTeclado(); return; }
    if(k === '123' || k === 'abc' || k === '#+=' || k === '😊'){ capa = { '123':'num', abc:'abc', '#+=':'sim', '😊':'emo' }[k]; pintarTeclado(); return; }
    if(k === '▾'){ var x = el; ocultar(); if(x) x.blur(); return; }
    if(k === '⌨'){
      var y = el; ocultar();
      y.dataset.nativo = '1'; y.dataset.cambiando = '1'; y.setAttribute('inputmode', y.getAttribute('data-im') || 'text');
      y.blur(); setTimeout(function(){ y.focus(); delete y.dataset.cambiando; }, 30);
      return;
    }
    if(k === '🎤'){ dictar(el.id, null); return; }
    if(k === '='){ calcular(); return; }
    if(k === '−'){ escribir('-'); return; }
    var t = capa === 'abc' && mayus && k.length === 1 ? k.toUpperCase() : k;
    if(k === ' ' && capa !== 'abc') capa = 'abc';
    escribir(t);
    if(capa === 'abc' && mayus === 1){ mayus = 0; }
    autoMayus(); pintarTeclado();
  }
  function parar(){ clearTimeout(largo); clearInterval(repetir); largo = repetir = null; }
  function pulsar(ev){
    var b = ev.target.closest('button');
    if(!b || !el) return;
    var popAbierto = caja.querySelector('.tk-pop');
    if(popAbierto){
      if(b.closest('.tk-pop')){ escribir(b.getAttribute('data-t')); if(mayus === 1){ mayus = 0; } autoMayus(); pintarTeclado(); saltarClick = true; return; }
      popAbierto.remove();
    }
    parar();
    b.classList.add('tk-pulsada');
    var at = b.getAttribute('data-t');
    if(at){ escribir((/\S$/.test(el.value.slice(0, el.selectionStart || 0)) && at.length > 1 ? ' ' : '') + at + (at.length > 1 ? ' ' : '')); vibrar(4); saltarClick = true; return; }
    var k = b.getAttribute('data-k');
    if(k === '⌫'){ accion(k); largo = setTimeout(function(){ repetir = setInterval(borrar, 70); }, 420); saltarClick = true; return; }
    /* Mantener pulsada una vocal: las tildes */
    var base = capa === 'abc' && mayus ? k.toUpperCase() : k;
    if(TILDES[base]){
      largo = setTimeout(function(){
        largo = null; saltarClick = true;
        var pop = document.createElement('div'); pop.className = 'tk-pop';
        pop.innerHTML = TILDES[base].split('').map(function(c){ return '<button type="button" data-t="' + c + '">' + c + '</button>'; }).join('');
        var r = b.getBoundingClientRect(), rc = caja.getBoundingClientRect();
        pop.style.left = Math.max(4, Math.min(rc.width - 44 * TILDES[base].length - 4, r.left - rc.left - 10)) + 'px';
        pop.style.top = (r.top - rc.top - 52) + 'px';
        caja.appendChild(pop); vibrar(12);
      }, 380);
    }
    b.dataset.pend = '1';
  }
  function soltar(ev){
    var b = ev.target.closest && ev.target.closest('button');
    caja.querySelectorAll('.tk-pulsada').forEach(function(x){ x.classList.remove('tk-pulsada'); });
    var pop = caja.querySelector('.tk-pop');
    if(pop){
      var sobre = document.elementFromPoint(ev.clientX, ev.clientY), elegido = sobre && sobre.closest && sobre.closest('.tk-pop button');
      var marcado = pop.querySelector('.tk-sobre');
      elegido = elegido || marcado;
      if(elegido){ escribir(elegido.getAttribute('data-t')); if(mayus === 1){ mayus = 0; } autoMayus(); pintarTeclado(); }
      /* si soltó sin elegir, la ventanita se queda para tocar una */
      parar(); saltarClick = false; return;
    }
    if(largo){ parar(); }
    if(repetir){ parar(); return; }
    if(saltarClick){ saltarClick = false; return; }
    if(b && b.dataset.pend){ delete b.dataset.pend; accion(b.getAttribute('data-k')); }
  }

  /* Antes de que el sistema abra su teclado */
  document.addEventListener('touchstart', function(ev){ if(ev.target && valido(ev.target)) preparar(ev.target); }, { passive:true, capture:true });
  document.addEventListener('focusin', function(ev){
    var x = ev.target;
    if(!activo() || !valido(x) || x.dataset.nativo) return;
    preparar(x); mostrar(x);
  });
  document.addEventListener('focusout', function(ev){
    var x = ev.target;
    if(x.dataset && x.dataset.nativo && !x.dataset.cambiando){ delete x.dataset.nativo; x.setAttribute('inputmode', x.getAttribute('data-im') || ''); x.removeAttribute('data-im'); }
    if(x !== el) return;
    clearTimeout(ocultarReloj);
    ocultarReloj = setTimeout(function(){ var a = document.activeElement; if(!(a && valido(a) && activo())) ocultar(); }, 120);
  });
  /* Tocar dentro del campo (mover el cursor) recalcula la mayúscula */
  document.addEventListener('click', function(ev){ if(el && ev.target === el){ autoMayus(); pintarTeclado(); } });
  return { activo:activo, tactil:tactil, ocultar:ocultar };
})();

/* ==========================================================================
   ARRANQUE
   ========================================================================== */
(function arrancar(){
  var zona = document.createElement('div');
  zona.id = 'zonaCuentas'; zona.className = 'oculto';
  $('contenido').after(zona);

  document.documentElement.setAttribute('data-paleta', paletaValida(document.documentElement.getAttribute('data-paleta')));
  colorBarra();

  var h = (location.hash || '').slice(1), atajo = '';
  if(h === 'gasto' || h === 'anadir'){ atajo = h; h = 'hoy'; try{ history.replaceState(null, '', '#hoy'); }catch(e){} }
  if(h === 'cuentas') h = 'personal';
  if(atajo) setTimeout(function(){ if(atajo === 'gasto') gastoRapido('personal'); else hojaAnadir('tarea'); }, 400);
  ui.vista = (h === 'ajustes' || SECCIONES.some(function(s){ return s.id === h; })) ? h : 'hoy';
  pintar();
  estadoNube(nube ? 'ok' : 'off');

  var hospedado = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if(hospedado && 'serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(function(){});
    navigator.serviceWorker.addEventListener('message', function(ev){
      if(ev.data && ev.data.vista) ir(ev.data.vista);
      if(ev.data && ev.data.nuevaVersion) aviso('✨ Hay una versión nueva de la agenda', 'Toca para usarla ya.', 'Actualizar', function(){ location.reload(); }, true);
    });
  }

  if(pref.temaAuto) aplicarTema(temaSegunSistema(), true);
  if(pinCfg) mostrarCandado('abrir');
  /* El logo un instante al abrir, solo una vez por sesión */
  var portada = $('portada'), vista = false;
  try{ vista = sessionStorage.getItem('agenda_portada'); sessionStorage.setItem('agenda_portada', '1'); }catch(e){}
  var instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  setTimeout(function(){ portada.classList.add('fuera'); setTimeout(function(){ portada.remove(); }, 400); }, (vista && !instalada) ? 0 : 380);

  tictac();
  setInterval(tictac, 1000);
  revisarAlarmas();
  setInterval(revisarAlarmas, 15000);
  if(hayAlgunaNube()) sincronizarTodo();
  (window.requestIdleCallback || function(f){ return setTimeout(f, 2500); })(function(){ cargarCuentas(); }, { timeout:6000 });
  setInterval(latido, 30000);

  /* A medianoche cambia el día: Hoy tiene que enterarse */
  var dia = hoyISO();
  setInterval(function(){ if(hoyISO() !== dia){ dia = hoyISO(); pintarSeguro(); } }, 60000);
})();

})();
