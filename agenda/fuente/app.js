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
var CLAVE_TEMA     = 'libro_cuentas_tema';
var CLAVE_PALETA   = 'cuentas_paleta';
var JSONBIN        = 'https://api.jsonbin.io/v3/b';
var MONEDA         = 'S/';
var COLS = ['tareas','listas','eventos','recordatorios','habitos','notas','enfoque','metas','pagos','diario'];

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
  if(d.perfil && typeof d.perfil === 'object') out.perfil = { nombre:String(d.perfil.nombre || '').slice(0,40), upd:+d.perfil.upd || 0 };
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
  if(!escribirJSON(CLAVE, db)) aviso('No se pudo guardar', 'El almacenamiento del navegador está lleno o bloqueado.');
}
function guardar(){
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
  o.del = true; o.upd = Date.now();
  ultimoBorrado = { col:col, id:id };
  guardar();
  aviso((nombre || 'Borrado'), null, 'Deshacer', function(){
    var x = buscarId(col, id);
    if(x){ delete x.del; x.upd = Date.now(); guardar(); pintar(); }
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
function dinero(v){
  return (v < 0 ? '−' : '') + MONEDA + ' ' + Math.abs(v).toLocaleString('es-PE', { minimumFractionDigits:2, maximumFractionDigits:2 });
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
  return { texto:limpio, fecha:fecha, hora:hora, prio:prio, area:area };
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
function edadCumple(e, dia){ return e.nacio ? +dia.slice(0, 4) - +e.nacio : 0; }

function itemsDelDia(dia){
  var out = [];
  vivos('eventos').forEach(function(e){
    if(ocurre(e.fecha, e.rep, dia, e.hasta)){
      var t = e.cumple ? '🎂 ' + e.t + (edadCumple(e, dia) > 0 ? ' (' + edadCumple(e, dia) + ')' : '') : e.t;
      out.push({ tipo:'evento', id:e.id, t:t, hora:e.todo ? '' : (e.ini || ''), fin:e.todo ? '' : (e.fin || ''),
                 c:e.cumple ? 'var(--rosa)' : color(e.color), lugar:e.lugar || '', o:e });
    }
  });
  vivos('recordatorios').forEach(function(r){
    var toca = r.hecho ? r.fecha === dia : ocurre(r.fecha, r.rep, dia);
    if(toca) out.push({ tipo:'rec', id:r.id, t:r.t, hora:r.hora || '09:00', c:'var(--oro)', hecho:!!r.hecho && !r.rep, o:r });
  });
  vivos('tareas').forEach(function(t){
    if(t.fecha === dia) out.push({ tipo:'tarea', id:t.id, t:t.t, hora:t.hora || '', c:PRIOS[t.prio || 0].c, hecho:!!t.hecha, o:t });
  });
  var ym = dia.slice(0, 7);
  vivos('pagos').forEach(function(p){
    if(p.activo === false || (p.desde && ym < p.desde)) return;
    if(diaPago(p, ym) === dia) out.push({ tipo:'pago', id:p.id, t:(p.em ? p.em + ' ' : '') + p.t, hora:'', c:'var(--oro)', hecho:pagado(p, ym), ym:ym, o:p });
  });
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
function movimientos(clave){
  var raw = leerJSON(clave || CLAVE_LEDGER, null);
  var l = raw && Array.isArray(raw.transactions) ? raw.transactions : (Array.isArray(raw) ? raw : []);
  return l.filter(function(t){ return t && /^\d{4}-\d{2}-\d{2}$/.test(t.date); });
}

/* ==========================================================================
   NAVEGACIÓN
   ========================================================================== */
var SECCIONES = [
  { id:'hoy',           nom:'Hoy',           ico:'i-hoy',     g:'Organizar' },
  { id:'tareas',        nom:'Tareas',        ico:'i-tareas' },
  { id:'calendario',    nom:'Calendario',    ico:'i-cal' },
  { id:'recordatorios', nom:'Recordatorios', ico:'i-campana' },
  { id:'listas',        nom:'Listas',        ico:'i-listas' },
  { id:'notas',         nom:'Notas',         ico:'i-notas' },
  { id:'habitos',       nom:'Hábitos',       ico:'i-habitos', g:'Crecer' },
  { id:'metas',         nom:'Metas',         ico:'i-meta' },
  { id:'foco',          nom:'Enfoque',       ico:'i-reloj' },
  { id:'diario',        nom:'Diario',        ico:'i-diario' },
  { id:'progreso',      nom:'Progreso',      ico:'i-grafica' },
  { id:'pagos',         nom:'Pagos fijos',   ico:'i-recibo',  g:'Dinero' },
  { id:'personal',      nom:'Gastos personales', corto:'Gastos', ico:'i-cuentas' },
  { id:'oficina',       nom:'Oficina',       ico:'i-maletin' }
];
var ABAJO = ['hoy','tareas','calendario','personal'];
function esLibro(v){ return v === 'personal' || v === 'oficina'; }

var ui = {
  vista:'hoy', antes:'', tFiltro:'hoy', tArea:'',
  calMes:hoyISO().slice(0,7), calSel:hoyISO(), calModo:'mes',
  lista:null, notasQ:'', capTipo:'tarea', verHechos:false,
  pagosMes:hoyISO().slice(0,7), diarioDia:hoyISO()
};

function contadores(){
  return {
    tareas: tareasPendientesHoy().length,
    tareasTarde: tareasPendientesHoy().filter(function(t){ return t.fecha < hoyISO(); }).length,
    recordatorios: recordatoriosVencidos().length,
    pagos: pagosProximos(0).length
  };
}

function pintarNav(){
  var k = contadores();
  function num(id){ return id === 'tareas' ? k.tareas : id === 'recordatorios' ? k.recordatorios : id === 'pagos' ? k.pagos : 0; }
  $('navLat').innerHTML = SECCIONES.map(function(s){
    var n = num(s.id);
    var alerta = (s.id === 'tareas' && k.tareasTarde) || ((s.id === 'recordatorios' || s.id === 'pagos') && n);
    return (s.g ? '<div class="grupo">' + s.g + '</div>' : '') +
      '<button type="button" data-ir="' + s.id + '"' + (ui.vista === s.id ? ' aria-current="page"' : '') + '>' +
        ico(s.ico) + s.nom + (n ? '<span class="cuenta' + (alerta ? ' alerta' : '') + '">' + n + '</span>' : '') +
      '</button>';
  }).join('');
  var enMas = ABAJO.indexOf(ui.vista) < 0;
  var otros = k.recordatorios + k.pagos;
  $('barraInf').innerHTML = ABAJO.map(function(id){
    var s = SECCIONES.find(function(x){ return x.id === id; });
    var n = id === 'tareas' ? k.tareas : 0;
    return '<button type="button" data-ir="' + id + '"' + (ui.vista === id ? ' aria-current="page"' : '') + '>' +
             ico(s.ico) + (s.corto || s.nom) + (n ? '<span class="globo">' + n + '</span>' : '') + '</button>';
  }).join('') +
  '<button type="button" data-acc="menu-mas"' + (enMas ? ' aria-current="page"' : '') + '>' + ico('i-mas') + 'Más' +
    (otros ? '<span class="globo">' + otros + '</span>' : '') + '</button>';
  document.querySelectorAll('.lateral .pie [data-ir]').forEach(function(b){
    if(ui.vista === 'ajustes') b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  });
  $('marcaNombre').textContent = db.perfil.nombre ? 'de ' + db.perfil.nombre : 'Mi organización';
}

function ir(v, sinHash){
  if(v === 'cuentas') v = 'personal';    // la dirección de antes sigue valiendo
  if(v !== 'ajustes' && !SECCIONES.some(function(s){ return s.id === v; })) v = 'hoy';
  if(v !== 'listas') ui.lista = null;
  ui.vista = v;
  if(!sinHash && location.hash !== '#' + v){
    try{ history.pushState(null, '', '#' + v); }catch(e){ location.hash = v; }
  }
  cerrarFlotante();
  pintar();
  window.scrollTo(0, 0);
}

/* Si estás escribiendo en la página, no se repinta por debajo: perderías
   lo escrito. Se espera a que sueltes el campo. */
var repintarAlSoltar = false;
function pintarSeguro(){
  var a = document.activeElement;
  if(a && $('contenido').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)){ repintarAlSoltar = true; return; }
  pintar();
}

function pintar(){
  repintarAlSoltar = false;
  pintarNav();
  var v = ui.vista;
  var sec = SECCIONES.find(function(s){ return s.id === v; });
  $('tituloVista').textContent = v === 'ajustes' ? 'Ajustes' : (v === 'listas' && ui.lista ? (listaActual() || {}).nombre || 'Listas' : sec.nom);
  if(!foco.fin) document.title = (v === 'hoy' ? 'Agenda' : $('tituloVista').textContent + ' · Agenda');
  document.body.classList.toggle('en-cuentas', esLibro(v));

  if(esLibro(v)){
    $('contenido').classList.add('oculto');
    mostrarLibro(v);
    ui.antes = v;
    return;
  }
  $('zonaCuentas').classList.add('oculto');
  $('contenido').classList.remove('oculto');

  var html = VISTAS[v]();
  var nueva = ui.antes !== v + (ui.lista || '');
  $('contenido').innerHTML = '<div class="' + (nueva ? 'vista' : '') + '">' + html + '</div>';
  ui.antes = v + (ui.lista || '');
  if(v === 'hoy' || v === 'tareas' || v === 'recordatorios') actualizarPista();
  tictac();
}

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
  var paraMover = !t.hecha && t.fecha && t.fecha <= hoyISO();
  return '<div class="fila' + (t.hecha ? ' hecha' : '') + '" data-fila="' + t.id + '">' +
    casilla('tarea-ok', t.id, t.hecha, t.prio ? PRIOS[t.prio].c : '') +
    '<div class="cuerpo" data-acc="tarea-ed" data-id="' + t.id + '">' +
      '<div class="titulo">' + esc(t.t) + '</div>' +
      '<div class="meta">' +
        metaFecha(t.fecha, t.hora, t.hecha) +
        (t.rep && t.rep !== 'no' ? '<span>' + ico('i-rep') + REPS_CORTO[t.rep] + '</span>' : '') +
        (sub ? '<span>' + ico('i-sub') + sub + '</span>' : '') +
        (t.area ? '<span class="etiqueta">' + esc(t.area) + '</span>' : '') +
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
  else if(it.tipo === 'rec') izq = '<span class="icono-tipo" style="--c:var(--oro)">' + ico('i-campana') + '</span>';
  else izq = '<span class="barrita" style="--c:' + it.c + '"></span>';
  var acc = { tarea:'tarea-ed', rec:'rec-ed', pago:'pago-ed', evento:'evento-ed' }[it.tipo];
  var cuando = it.hora ? it.hora + (it.fin ? '–' + it.fin : '') : (it.tipo === 'evento' ? 'Todo el día' : '');
  var nom = { evento:it.o.cumple ? 'Cumpleaños' : 'Evento', rec:'Recordatorio', tarea:'Tarea', pago:'Pago · ' + dinero(+it.o.monto || 0) }[it.tipo];
  return '<div class="fila' + (it.hecho ? ' hecha' : '') + '">' +
    '<span class="hora">' + (it.hora || '—') + '</span>' + izq +
    '<div class="cuerpo" data-acc="' + acc + '" data-id="' + it.id + '"' + (conFecha ? ' data-dia="' + conFecha + '"' : '') + '>' +
      '<div class="titulo">' + esc(it.t) + '</div>' +
      '<div class="meta">' +
        '<span>' + nom + (cuando && it.tipo === 'evento' && !it.o.cumple ? ' · ' + cuando : '') + '</span>' +
        (it.lugar ? '<span>' + ico('i-lugar') + esc(it.lugar) + '</span>' : '') +
        (it.o.rep && it.o.rep !== 'no' && !it.o.cumple ? '<span>' + ico('i-rep') + REPS_CORTO[it.o.rep] + '</span>' : '') +
      '</div>' +
    '</div>' +
  '</div>';
}

function vacio(emoji, titulo, texto){
  return '<div class="vacio"><span class="emoji">' + emoji + '</span><b>' + titulo + '</b>' + (texto || '') + '</div>';
}

function captura(tipos, placeholder){
  var tipo = tipos.indexOf(ui.capTipo) >= 0 ? ui.capTipo : tipos[0];
  ui.capTipo = tipo;
  var NOM = { tarea:'Tarea', rec:'Recordatorio', evento:'Evento', nota:'Nota' };
  return (tipos.length > 1 ?
    '<div class="fichas desliza" style="margin-bottom:8px">' + tipos.map(function(t){
      return '<button type="button" class="ficha" data-acc="cap-tipo" data-tipo="' + t + '" aria-pressed="' + (t === tipo) + '">' + NOM[t] + '</button>';
    }).join('') + '</div>' : '') +
    '<form class="captura" data-acc="captura" autocomplete="off">' +
      '<input id="entradaCaptura" type="text" enterkeyhint="done" maxlength="200" placeholder="' + esc(placeholder) + '">' +
      '<button type="submit" class="btn primario chico">' + ico('i-plus') + 'Añadir</button>' +
    '</form>' +
    '<div class="pista" id="pista"></div>';
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

/* ---------- Hoy ---------------------------------------------------------- */
VISTAS.hoy = function(){
  var hoy = hoyISO(), h = new Date().getHours();
  var saludo = h < 6 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  var emoji = h < 6 ? '🌙' : h < 12 ? '☀️' : h < 19 ? '🌤️' : '🌙';
  var nombre = db.perfil.nombre;
  var total = COLS.reduce(function(s, c){ return s + vivos(c).length; }, 0);

  var items = itemsDelDia(hoy);
  var tareasHoy = vivos('tareas').filter(function(t){
    return (t.fecha && t.fecha <= hoy && !t.hecha) || (t.hecha && t.hechaEn && iso(new Date(t.hechaEn)) === hoy) || (t.log && t.log.indexOf(hoy) >= 0);
  });
  var hechas = tareasHoy.filter(function(t){ return t.hecha || (t.log && t.log.indexOf(hoy) >= 0 && !(t.fecha <= hoy)); }).length;
  var pct = tareasHoy.length ? hechas / tareasHoy.length : 0;
  var C = 2 * Math.PI * 22;
  var agenda = items.filter(function(i){ return i.tipo !== 'tarea'; });
  var pendPagos = pagosProximos(0).length;

  var html = '<section class="heroe"><div class="arriba"><div>' +
      '<div class="fecha">' + cap(fechaLarga(hoy)) + '</div>' +
      '<h2>' + saludo + (nombre ? ', ' + esc(nombre) : '') + ' ' + emoji + '</h2>' +
      '<p class="frase">«' + esc(fraseDelDia()) + '»</p></div>' +
      '<svg class="anillo" viewBox="0 0 54 54" aria-label="' + Math.round(pct * 100) + '% de las tareas de hoy"><circle class="fondo" cx="27" cy="27" r="22"/>' +
      '<circle class="valor" cx="27" cy="27" r="22" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct)).toFixed(1) + '"/></svg>' +
    '</div>' +
    '<div class="datos">' +
      '<button class="dato" data-ir="tareas">' + ico('i-tareas') + '<b>' + (tareasHoy.length - hechas) + '</b> por hacer</button>' +
      '<button class="dato" data-ir="calendario">' + ico('i-cal') + '<b>' + agenda.filter(function(i){ return i.tipo === 'evento'; }).length + '</b> eventos</button>' +
      '<button class="dato" data-ir="recordatorios">' + ico('i-campana') + '<b>' + agenda.filter(function(i){ return i.tipo === 'rec' && !i.hecho; }).length + '</b> avisos</button>' +
      (pendPagos ? '<button class="dato" data-ir="pagos">' + ico('i-recibo') + '<b>' + pendPagos + '</b> por pagar</button>' : '') +
    '</div></section>';

  if(!total && !nombre){
    html += '<div class="tarjeta" style="margin-bottom:16px"><div class="tarjeta-cuerpo" style="padding:18px 16px">' +
      '<b style="font-size:16px;display:block;margin-bottom:4px">Bienvenido a tu agenda 👋</b>' +
      '<p style="margin:0 0 12px;color:var(--tinta-2);font-size:13.5px">Tareas, listas, calendario, recordatorios que suenan, hábitos, metas, diario, pagos, notas y tu libro de cuentas: todo en un solo sitio y solo para ti. ¿Cómo te llamas?</p>' +
      '<form data-acc="bienvenida" class="captura" style="margin:0 0 10px"><input id="nombreBienvenida" type="text" maxlength="40" placeholder="Tu nombre"><button class="btn primario chico" type="submit">Empezar</button></form>' +
      '<button type="button" class="btn chico" data-acc="ejemplos">Ver con ejemplos</button>' +
    '</div></div>';
  }

  html += captura(['tarea','rec','evento','nota'], 'Añade algo… (Enter para guardar)');
  html += '<div class="rejilla dos">';

  /* Tu día */
  html += '<section class="tarjeta">' + cabTarjeta('i-cal', 'Tu día', 'var(--verde)', 'Calendario', 'data-ir="calendario"') +
    (agenda.length ? '<div class="lista-filas">' + agenda.map(function(i){ return filaAgenda(i); }).join('') + '</div>'
                   : '<div class="vacio" style="padding-top:4px">Sin eventos, avisos ni pagos hoy.</div>') +
    '</section>';

  /* Enfoque */
  var enf = buscarId('enfoque', hoy);
  var ei = (enf && !enf.del && enf.items) || [];
  html += '<section class="tarjeta">' + cabTarjeta('i-diana', 'Enfoque de hoy', 'var(--haber)') +
    '<p style="margin:0 16px 6px;font-size:12.5px;color:var(--tinta-3)">Las tres cosas que harían de hoy un buen día.</p>' +
    '<div class="enfoque">' + [0,1,2].map(function(i){
      var x = ei[i] || { t:'', ok:false };
      return '<label class="' + (x.ok ? 'hecho' : '') + '"><span class="n">' + (i + 1) + '</span>' +
        '<input type="text" maxlength="120" data-enfoque="' + i + '" value="' + esc(x.t) + '" placeholder="' + ['Lo más importante','Lo segundo','Lo tercero'][i] + '">' +
        casilla('enfoque-ok', String(i), x.ok, 'var(--haber)', true) + '</label>';
    }).join('') + '</div></section>';

  /* Tareas */
  var pend = vivos('tareas').filter(function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; }).sort(ordenTareas);
  var atrasadas = pend.filter(function(t){ return t.fecha < hoy; }).length;
  html += '<section class="tarjeta">' + cabTarjeta('i-tareas', 'Tareas para hoy', 'var(--azul)', 'Todas', 'data-ir="tareas"') +
    (pend.length ? '<div class="lista-filas">' + pend.slice(0, 8).map(filaTarea).join('') + '</div>' +
       (pend.length > 8 ? '<div class="vacio" style="padding:8px">y ' + (pend.length - 8) + ' más…</div>' : '') +
       (atrasadas ? '<div class="pie-fila-btn"><button class="btn chico" data-acc="t-atrasadas-hoy">' + ico('i-rep') + 'Pasar las ' + atrasadas + ' atrasadas a hoy</button></div>' : '')
     : vacio('✅', 'Nada pendiente para hoy', 'Añade una arriba o disfruta el día.')) + '</section>';

  /* Hábitos */
  var wd = new Date().getDay();
  var hab = vivos('habitos').filter(function(x){ return !x.dias || x.dias.indexOf(wd) >= 0; });
  html += '<section class="tarjeta">' + cabTarjeta('i-habitos', 'Hábitos de hoy', 'var(--oro)', 'Hábitos', 'data-ir="habitos"') +
    (hab.length ? '<div class="chips-habito">' + hab.map(function(x){
      var ok = x.marcas && x.marcas[hoy];
      return '<button type="button" class="chip-habito" data-acc="habito-hoy" data-id="' + x.id + '" aria-pressed="' + !!ok + '"><span class="em">' + esc(x.em || '⭐') + '</span>' + esc(x.nombre) + (ok ? ' ✓' : '') + '</button>';
    }).join('') + '</div>'
    : '<div class="vacio" style="padding-top:4px">Crea hábitos para marcarlos cada día. <br><button class="btn chico" style="margin-top:8px" data-ir="habitos">Crear un hábito</button></div>') +
    '</section>';

  /* Ánimo del día */
  var dia = buscarId('diario', hoy);
  var an = dia && !dia.del ? dia.animo : 0;
  html += '<section class="tarjeta">' + cabTarjeta('i-diario', '¿Cómo te sientes hoy?', 'var(--rosa)', 'Diario', 'data-ir="diario"') +
    '<div class="tarjeta-cuerpo">' + animosHTML(an, hoy) +
    (dia && dia.texto ? '<p style="margin:10px 0 0;font-size:13px;color:var(--tinta-2)">' + esc(dia.texto.slice(0, 140)) + (dia.texto.length > 140 ? '…' : '') + '</p>'
                      : '<button class="btn chico" style="margin-top:10px" data-ir="diario">' + ico('i-lapiz') + 'Escribir en el diario</button>') +
    '</div></section>';

  /* Pagos por vencer */
  var pp = pagosProximos(7);
  if(pp.length){
    html += '<section class="tarjeta">' + cabTarjeta('i-recibo', 'Pagos por vencer', 'var(--debe)', 'Pagos', 'data-ir="pagos"') +
      '<div class="lista-filas">' + pp.slice(0, 5).map(function(x){ return filaPago(x.p, x.ym); }).join('') + '</div></section>';
  }

  /* Metas */
  var ms = vivos('metas').filter(function(m){ return !m.archivada; }).slice(0, 3);
  if(ms.length){
    html += '<section class="tarjeta">' + cabTarjeta('i-meta', 'Tus metas', 'var(--verde)', 'Metas', 'data-ir="metas"') +
      ms.map(function(m){
        var p = Math.min(1, (+m.actual || 0) / (+m.objetivo || 1));
        return '<div class="barra-h" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr) 42px"><span>' + esc((m.em || '🎯') + ' ' + m.t) + '</span>' +
          '<div class="barra-prog" style="--c:' + color(m.color) + '"><i style="width:' + Math.round(p * 100) + '%"></i></div><b>' + Math.round(p * 100) + '%</b></div>';
      }).join('') + '<div style="height:10px"></div></section>';
  }

  /* Cumpleaños */
  var cs = proximosCumples(30);
  if(cs.length){
    html += '<section class="tarjeta">' + cabTarjeta('i-regalo', 'Próximos cumpleaños', 'var(--rosa)') +
      '<div class="lista-filas">' + cs.slice(0, 5).map(function(c){
        var edad = edadCumple(c.e, c.dia);
        return '<div class="fila"><span class="em-fila">🎂</span><div class="cuerpo" data-acc="evento-ed" data-id="' + c.e.id + '"><div class="titulo">' + esc(c.e.t) + '</div>' +
          '<div class="meta"><span class="' + (c.en === 0 ? 'hoy' : '') + '">' + (c.en === 0 ? '¡Hoy!' : c.en === 1 ? 'Mañana' : 'En ' + c.en + ' días') + ' · ' + fechaCorta(c.dia) + '</span>' +
          (edad > 0 ? '<span class="cumple">cumple ' + edad + '</span>' : '') + '</div></div></div>';
      }).join('') + '</div></section>';
  }

  /* Semana */
  var ini = inicioSemana(hoy);
  var semana = '<div class="semana-mini">' + [0,1,2,3,4,5,6].map(function(i){
    var d = sumarDias(ini, i), n = itemsDelDia(d).filter(function(x){ return !x.hecho; }).length;
    return '<button type="button" class="' + (d === hoy ? 'hoy' : '') + '" data-acc="ir-dia" data-dia="' + d + '"><small>' + DIAS3[deISO(d).getDay()] + '</small><b>' + deISO(d).getDate() + '</b>' +
      '<span class="puntos">' + '<i></i>'.repeat(Math.min(n, 3)) + '</span></button>';
  }).join('') + '</div>';
  var prox = [];
  for(var i = 1; i <= 7 && prox.length < 5; i++){
    var d = sumarDias(hoy, i);
    itemsDelDia(d).forEach(function(x){ if(x.tipo !== 'tarea' && !x.hecho && prox.length < 5) prox.push({ d:d, x:x }); });
  }
  html += '<section class="tarjeta">' + cabTarjeta('i-cal', 'Esta semana', 'var(--azul)') + semana +
    (prox.length ? '<div class="lista-filas">' + prox.map(function(p){
      var acc = { rec:'rec-ed', pago:'pago-ed', evento:'evento-ed' }[p.x.tipo];
      return '<div class="fila"><span class="hora" style="width:74px">' + relativo(p.d) + '</span>' +
        '<span class="barrita" style="--c:' + p.x.c + '"></span>' +
        '<div class="cuerpo" data-acc="' + acc + '" data-id="' + p.x.id + '"><div class="titulo">' + esc(p.x.t) + '</div>' +
        '<div class="meta"><span>' + (p.x.hora || 'Todo el día') + '</span></div></div></div>';
    }).join('') + '</div>' : '<div class="vacio" style="padding-top:0">Nada agendado los próximos 7 días.</div>') +
    '</section>';

  /* Dinero: los dos libros */
  var mes = hoy.slice(0, 7);
  [['personal', CLAVE_LEDGER, 'Gastos personales', 'i-cuentas', 'var(--haber)'], ['oficina', CLAVE_OFICINA, 'Oficina', 'i-maletin', 'var(--azul)']].forEach(function(L){
    var ent = 0, sal = 0, tot = 0, n = 0;
    movimientos(L[1]).forEach(function(t){
      var a = Math.abs(+t.amount || 0), sg = t.type === 'Gasto' ? -a : a;
      tot += sg; n++;
      if(t.date.slice(0, 7) === mes){ if(sg < 0) sal += a; else ent += a; }
    });
    html += '<section class="tarjeta">' + cabTarjeta(L[3], L[2] + ' · ' + MESES[new Date().getMonth()], L[4], 'Abrir', 'data-ir="' + L[0] + '"') +
      (n ? '<div class="cifras"><div class="entra"><small>Entró</small><b>' + dinero(ent) + '</b></div>' +
        '<div class="sale"><small>Salió</small><b>' + dinero(sal) + '</b></div>' +
        '<div><small>Saldo</small><b style="color:' + (tot < 0 ? 'var(--debe)' : 'var(--tinta)') + '">' + dinero(tot) + '</b></div></div>'
         : '<div class="vacio" style="padding-top:2px">Aún no hay movimientos. <button class="btn chico" style="margin-top:8px" data-ir="' + L[0] + '">' + ico('i-plus') + 'Anotar el primero</button></div>') +
      '</section>';
  });

  /* Notas fijadas */
  var fijas = vivos('notas').filter(function(n){ return n.fija; });
  if(fijas.length){
    html += '<section class="tarjeta ancho-2">' + cabTarjeta('i-pin', 'Notas fijadas', 'var(--oro)', 'Notas', 'data-ir="notas"') +
      '<div class="tarjeta-cuerpo"><div class="notas-muro">' + fijas.map(tarjetaNota).join('') + '</div></div></section>';
  }
  html += '</div>';
  return html;
};
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
  var enArea = ui.tArea ? todas.filter(function(t){ return (t.area || '') === ui.tArea; }) : todas;
  var F = {
    hoy:     function(t){ return !t.hecha && t.fecha && t.fecha <= hoy; },
    prox:    function(t){ return !t.hecha && t.fecha > hoy; },
    todas:   function(t){ return !t.hecha; },
    algun:   function(t){ return !t.hecha && !t.fecha; },
    hechas:  function(t){ return t.hecha; }
  };
  var NOM = { hoy:'Hoy', prox:'Próximas', todas:'Pendientes', algun:'Algún día', hechas:'Hechas' };
  var html = captura(['tarea'], 'Nueva tarea… ej. «comprar regalo el sábado #casa»');

  html += '<div class="fichas desliza">' + Object.keys(F).map(function(k){
    var n = enArea.filter(F[k]).length;
    return '<button type="button" class="ficha" data-acc="t-filtro" data-f="' + k + '" aria-pressed="' + (ui.tFiltro === k) + '">' + NOM[k] +
      (k !== 'hechas' && n ? ' <span class="n">' + n + '</span>' : '') + '</button>';
  }).join('') + '</div>';

  var areas = [];
  todas.forEach(function(t){ if(t.area && areas.indexOf(t.area) < 0) areas.push(t.area); });
  if(areas.length){
    html += '<div class="fichas desliza" style="margin-top:-6px">' +
      '<button type="button" class="ficha" data-acc="t-area" data-a="" aria-pressed="' + !ui.tArea + '">Todas las áreas</button>' +
      areas.sort().map(function(a){
        return '<button type="button" class="ficha" data-acc="t-area" data-a="' + esc(a) + '" aria-pressed="' + (ui.tArea === a) + '">#' + esc(a) + '</button>';
      }).join('') + '</div>';
  }

  var lista = enArea.filter(F[ui.tFiltro]);
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

  var grupos = [], idx = {};
  function meter(clave, titulo, rojo, t){
    if(!(clave in idx)){ idx[clave] = grupos.length; grupos.push({ t:titulo, rojo:rojo, l:[] }); }
    grupos[idx[clave]].l.push(t);
  }
  lista.forEach(function(t){
    if(!t.fecha) meter('z', 'Sin fecha', false, t);
    else if(t.fecha < hoy) meter('a', 'Atrasadas', true, t);
    else if(t.fecha === hoy) meter('b', 'Hoy', false, t);
    else if(t.fecha <= fin7) meter('c' + t.fecha, cap(relativo(t.fecha)) + ' · ' + fechaCorta(t.fecha), false, t);
    else meter('y' + t.fecha.slice(0, 7), cap(MESES[deISO(t.fecha).getMonth()]) + ' ' + t.fecha.slice(0, 4), false, t);
  });
  return html + grupos.map(function(g){
    return '<div class="seccion-tit' + (g.rojo ? ' rojo' : '') + '">' + g.t + ' <span class="n">' + g.l.length + '</span>' +
      (g.rojo ? '<button class="btn chico" style="margin-left:auto;text-transform:none;letter-spacing:0" data-acc="t-atrasadas-hoy">Pasar a hoy</button>' : '') + '</div>' +
      '<div class="tarjeta"><div class="lista-filas">' + g.l.map(filaTarea).join('') + '</div></div>';
  }).join('');
};

/* ---------- Calendario ---------------------------------------------------- */
VISTAS.calendario = function(){
  var hoy = hoyISO();
  var p = ui.calMes.split('-'), y = +p[0], m = +p[1] - 1;
  var primero = iso(new Date(y, m, 1));
  var html = '<div class="cal-cab">' +
    '<button class="btn-icono" data-acc="cal-mover" data-n="-1" aria-label="Mes anterior">' + ico('i-izq') + '</button>' +
    '<h2>' + MESES[m] + ' ' + y + '</h2>' +
    '<button class="btn-icono" data-acc="cal-mover" data-n="1" aria-label="Mes siguiente">' + ico('i-der') + '</button>' +
    '<div class="der"><button class="btn chico" data-acc="cal-hoy">Hoy</button>' +
    '<div class="selector"><button data-acc="cal-modo" data-m="mes" aria-pressed="' + (ui.calModo === 'mes') + '">Mes</button>' +
    '<button data-acc="cal-modo" data-m="agenda" aria-pressed="' + (ui.calModo === 'agenda') + '">Agenda</button></div></div>' +
  '</div>';

  if(ui.calModo === 'agenda'){
    var dias = '', cuantos = 0;
    var desde = ui.calMes === hoy.slice(0, 7) ? hoy : primero;
    for(var i = 0; i < 90; i++){
      var d = sumarDias(desde, i), its = itemsDelDia(d);
      if(!its.length) continue;
      cuantos++;
      dias += '<div class="seccion-tit' + (d === hoy ? '" style="color:var(--verde-sube)' : '') + '">' + cap(relativo(d)) + (Math.abs(diasEntre(hoy, d)) < 7 ? ' · ' + fechaCorta(d) : '') + '</div>' +
        '<div class="tarjeta"><div class="lista-filas">' + its.map(function(x){ return filaAgenda(x, d); }).join('') + '</div></div>';
    }
    return html + (cuantos ? dias : '<div class="tarjeta">' + vacio('🗓️', 'Nada en los próximos 90 días', 'Toca + para añadir un evento.') + '</div>');
  }

  var ini = inicioSemana(primero);
  var cab = [];
  for(var k = 0; k < 7; k++) cab.push(DIAS3[deISO(sumarDias(ini, k)).getDay()]);
  var celdas = '';
  for(var j = 0; j < 42; j++){
    var dd = sumarDias(ini, j);
    if(j === 35 && dd.slice(0, 7) !== ui.calMes) break;   // sin sexta fila vacía
    var its2 = itemsDelDia(dd);
    var cls = 'celda' + (dd.slice(0, 7) !== ui.calMes ? ' fuera' : '') + (dd === hoy ? ' hoy' : '') + (dd === ui.calSel ? ' sel' : '');
    celdas += '<button type="button" class="' + cls + '" data-acc="cal-dia" data-dia="' + dd + '">' +
      '<span class="num">' + deISO(dd).getDate() + '</span>' +
      '<span class="puntos solo-movil-p">' + its2.slice(0, 4).map(function(x){ return '<i style="--c:' + x.c + '"></i>'; }).join('') + '</span>' +
      its2.slice(0, 3).map(function(x){ return '<span class="mini" style="--c:' + x.c + '">' + (x.hora ? x.hora + ' ' : '') + esc(x.t) + '</span>'; }).join('') +
      (its2.length > 3 ? '<span class="mini" style="--c:transparent;color:var(--tinta-3)">+' + (its2.length - 3) + ' más</span>' : '') +
    '</button>';
  }
  var sel = itemsDelDia(ui.calSel);
  var panel = '<section class="tarjeta"><div class="tarjeta-cab"><h3>' + cap(fechaLarga(ui.calSel)) + '</h3></div>' +
    (sel.length ? '<div class="lista-filas">' + sel.map(function(x){ return filaAgenda(x, ui.calSel); }).join('') + '</div>'
                : '<div class="vacio" style="padding-top:6px">Día libre.</div>') +
    '<div class="tarjeta-cuerpo" style="display:flex;gap:6px;flex-wrap:wrap;padding-top:10px">' +
      '<button class="btn chico" data-acc="nuevo" data-tipo="evento">' + ico('i-plus') + 'Evento</button>' +
      '<button class="btn chico" data-acc="nuevo" data-tipo="rec">' + ico('i-plus') + 'Recordatorio</button>' +
      '<button class="btn chico" data-acc="nuevo" data-tipo="tarea">' + ico('i-plus') + 'Tarea</button>' +
    '</div></section>';
  return html + '<div class="cal-layout"><div><div class="cal-dias">' + cab.map(function(c){ return '<span>' + c + '</span>'; }).join('') + '</div>' +
    '<div class="cal-mes">' + celdas + '</div></div>' + panel + '</div>';
};

/* ---------- Recordatorios ------------------------------------------------- */
function filaRec(r){
  var hecho = r.hecho && (!r.rep || r.rep === 'no');
  var m = momentoR(r), f = m.slice(0, 10), h = m.slice(11, 16);
  return '<div class="fila' + (hecho ? ' hecha' : '') + '" data-fila="' + r.id + '">' +
    casilla('rec-ok', r.id, hecho, 'var(--oro)') +
    '<div class="cuerpo" data-acc="rec-ed" data-id="' + r.id + '">' +
      '<div class="titulo">' + esc(r.t) + '</div>' +
      '<div class="meta">' + metaFecha(f, h, hecho) +
        (r.rep && r.rep !== 'no' ? '<span>' + ico('i-rep') + REPS_CORTO[r.rep] + '</span>' : '') +
        (r.pospuesto ? '<span>' + ico('i-dormir') + 'pospuesto</span>' : '') +
      '</div>' +
    '</div>' +
    (!hecho ? '<div class="lado"><button class="btn-icono" data-acc="rec-posponer" data-id="' + r.id + '" title="Posponer" aria-label="Posponer">' + ico('i-dormir') + '</button></div>' : '') +
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
  html += captura(['rec'], 'Recordar… ej. «tomar pastilla a las 9pm» o «llamar a mamá el domingo»');

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
    return '<div class="seccion-tit' + (rojo ? ' rojo' : '') + '">' + t + ' <span class="n">' + l.length + '</span></div>' +
      '<div class="tarjeta"><div class="lista-filas">' + l.map(filaRec).join('') + '</div></div>';
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
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
        '<button class="btn chico" data-acc="lista-volver">' + ico('i-izq') + 'Listas</button>' +
        '<div style="flex:1"></div>' +
        '<button class="btn-icono" data-acc="lista-ed" data-id="' + l.id + '" title="Editar lista" aria-label="Editar lista">' + ico('i-lapiz') + '</button>' +
      '</div>' +
      '<div class="tarjeta" style="--c:' + color(l.color) + '">' +
        '<div class="tarjeta-cuerpo" style="padding:16px">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px"><span style="font-size:28px">' + esc(l.em || '📝') + '</span>' +
          '<div style="flex:1;min-width:0"><b style="font-size:18px;display:block">' + esc(l.nombre) + '</b><small style="color:var(--tinta-3)">' + ok + ' de ' + items.length + ' marcados</small></div></div>' +
          '<div class="barra-prog"><i style="width:' + (items.length ? ok / items.length * 100 : 0) + '%"></i></div>' +
        '</div>' +
        '<form class="captura" data-acc="item-nuevo" style="margin:0 12px 10px;box-shadow:none" autocomplete="off">' +
          '<input id="nuevoItem" type="text" maxlength="160" placeholder="Añadir a la lista… (Enter)" enterkeyhint="enter">' +
          '<button type="submit" class="btn primario chico">' + ico('i-plus') + '</button></form>' +
        (orden.length ? '<div class="lista-filas" style="border-top:1px solid var(--regla-2)">' + orden.map(function(x){
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
      return '<button type="button" class="tarjeta tarjeta-lista" style="--c:' + color(x.color) + '" data-acc="lista-abrir" data-id="' + x.id + '">' +
        '<div class="cab"><span class="em">' + esc(x.em || '📝') + '</span><div style="min-width:0"><b>' + esc(x.nombre) + '</b>' +
        '<small>' + (its.length ? (its.length - ok2) + ' por marcar · ' + its.length + ' en total' : 'Vacía') + '</small></div></div>' +
        '<div class="barra-prog"><i style="width:' + (its.length ? ok2 / its.length * 100 : 0) + '%"></i></div>' +
      '</button>';
    }).join('') +
    '<button type="button" class="tarjeta tarjeta-lista" data-acc="nuevo" data-tipo="lista" style="border-style:dashed;align-items:center;justify-content:center;min-height:98px;color:var(--tinta-2)">' +
      ico('i-plus') + '<b style="font-size:14px">Nueva lista</b></button>' +
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
  return '<div class="rejilla dos">' + hs.map(function(x){
    var r = racha(x), pc = cumplimiento(x);
    var dias = [];
    for(var i = 6; i >= 0; i--) dias.push(sumarDias(hoy, -i));
    var frec = !x.dias || x.dias.length === 7 ? 'Cada día' : x.dias.length + ' días por semana';
    return '<section class="tarjeta habito">' +
      '<div class="cab"><span class="em">' + esc(x.em || '⭐') + '</span>' +
        '<div class="nom"><b>' + esc(x.nombre) + '</b><small>' + frec + '</small></div>' +
        '<span class="racha" title="Racha">🔥 ' + r + '</span>' +
        '<button class="btn-icono" data-acc="habito-ed" data-id="' + x.id + '" aria-label="Editar">' + ico('i-lapiz') + '</button></div>' +
      '<div class="dias-habito">' + dias.map(function(d){
        var w = deISO(d).getDay(), libre = x.dias && x.dias.indexOf(w) < 0, ok = x.marcas && x.marcas[d];
        return '<button type="button" class="dia-h' + (ok ? ' ok' : '') + (libre ? ' libre' : '') + (d === hoy ? ' hoy' : '') + '" data-acc="habito-dia" data-id="' + x.id + '" data-dia="' + d + '">' +
          DIAS3[w] + '<span class="c">' + CHECK + '</span></button>';
      }).join('') + '</div>' +
      '<div class="pie-h"><span>Últimos 30 días</span><div class="barra-prog"><i style="width:' + Math.round(pc * 100) + '%"></i></div><b>' + Math.round(pc * 100) + '%</b></div>' +
    '</section>';
  }).join('') + '</div>';
};

/* ---------- Notas ---------------------------------------------------------- */
function tarjetaNota(n){
  return '<button type="button" class="tarjeta nota" style="--c:' + (n.color ? color(n.color) : 'var(--regla)') + '" data-acc="nota-ed" data-id="' + n.id + '">' +
    (n.t ? '<b>' + esc(n.t) + '</b>' : '') + (n.cuerpo ? '<p>' + esc(n.cuerpo) + '</p>' : '') +
    '<small>' + (n.fija ? ico('i-pin') : '') + relativo(iso(new Date(n.upd || Date.now()))) + '</small></button>';
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
function mostrarLibro(cual){
  var z = $('zonaCuentas');
  z.classList.remove('oculto');
  Object.keys(marcos).forEach(function(k){ marcos[k].style.display = k === cual ? '' : 'none'; });
  if(!marcos[cual]){
    var m = document.createElement('iframe');
    m.className = 'marco-cuentas';
    m.title = LIBROS[cual].sub;
    m.srcdoc = fuenteLibro(cual);
    z.appendChild(m);
    marcos[cual] = m;
  }
}
var cacheCuentas = '';
function fuenteCuentas(){
  if(cacheCuentas) return cacheCuentas;
  var el = $('fuenteCuentas');
  if(!el) return '<p style="font-family:sans-serif;padding:20px">No se encontró el libro de cuentas dentro del archivo.</p>';
  var bin = atob(el.textContent.replace(/\s+/g, ''));
  var bytes = new Uint8Array(bin.length);
  for(var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  cacheCuentas = new TextDecoder('utf-8').decode(bytes);
  return cacheCuentas;
}
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
  return s;
}
function recargarCuentas(){
  Object.keys(marcos).forEach(function(k){ marcos[k].srcdoc = fuenteLibro(k) + '<!-- ' + Date.now() + ' -->'; });
}

/* ---------- Metas ------------------------------------------------------------
   Un número que quieres alcanzar: ahorrar S/ 2000, leer 12 libros, correr
   100 km. Se suma de a poco y la agenda te dice a qué ritmo vas.          */
VISTAS.metas = function(){
  var ms = vivos('metas').sort(function(a, b){ return (a.creada || 0) - (b.creada || 0); });
  var activas = ms.filter(function(m){ return !m.archivada; });
  var archivadas = ms.filter(function(m){ return m.archivada; });
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
    }
    return '<section class="tarjeta meta-t' + (p >= 1 ? ' lograda' : '') + '" style="--c:' + color(m.color) + '">' +
      '<div class="cab"><span class="em">' + esc(m.em || '🎯') + '</span><div class="nom"><b>' + esc(m.t) + '</b>' +
        '<small>' + (p >= 1 ? '🎉 ¡Lograda!' : 'Faltan ' + formNum(falta) + ' ' + esc(m.unidad || '')) + (m.fecha ? ' · hasta el ' + fechaCorta(m.fecha) : '') + '</small></div>' +
        '<button class="btn-icono" data-acc="meta-ed" data-id="' + m.id + '" aria-label="Editar">' + ico('i-lapiz') + '</button></div>' +
      '<div class="cifra-grande">' + formNum(act) + ' <small>/ ' + formNum(obj) + ' ' + esc(m.unidad || '') + ' · ' + Math.round(p * 100) + '%</small></div>' +
      '<div class="barra-prog"><i style="width:' + (p * 100).toFixed(1) + '%"></i></div>' +
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
function formNum(n){ n = Math.round(n * 100) / 100; return n.toLocaleString('es-PE', { maximumFractionDigits:2 }); }

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
      (id ? '<label class="interruptor"><input type="checkbox" name="arch"' + (m.archivada ? ' checked' : '') + '>Archivar (ya no se muestra en Hoy)</label>' : '') +
      botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  if(!id) f.t.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
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
  return html + '<p style="color:var(--tinta-3);font-size:12.5px;margin-top:14px">Marcar un pago no lo anota en tus libros: si quieres que cuente, anótalo también como gasto en Gastos personales u Oficina.</p>';
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
      (id ? '<label class="interruptor"><input type="checkbox" name="act"' + (p.activo !== false ? ' checked' : '') + '>Activo (desmárcalo para pausarlo)</label>' : '') +
      botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  if(!id && !p.t) f.t.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    p.t = f.t.value.trim(); if(!p.t) return;
    p.monto = Math.round(num(f.m.value) * 100) / 100; p.dia = Math.min(31, Math.max(1, parseInt(f.d.value, 10) || 1));
    p.cat = f.c.value.trim(); p.em = leerSelector('em') || '🧾'; p.aviso = f.av.checked;
    if(f.act) p.activo = f.act.checked;
    poner('pagos', p); cerrarFlotante(); pintar();
  };
  edAcciones = { borrar: function(){ cerrarFlotante(); quitar('pagos', p.id, 'Pago borrado'); pintar(); } };
}
function alternarPago(id, ym, boton){
  var p = buscarId('pagos', id);
  if(!p) return;
  p.pagados = p.pagados || {};
  if(p.pagados[ym]) delete p.pagados[ym]; else p.pagados[ym] = Date.now();
  poner('pagos', p);
  if(p.pagados[ym]) aviso('Pagado ✓', p.t + ' · ' + dinero(+p.monto || 0), 'Deshacer', function(){ delete p.pagados[ym]; poner('pagos', p); pintar(); });
  if(boton){ boton.setAttribute('aria-checked', !!p.pagados[ym]); boton.classList.add('pop'); setTimeout(pintarSeguro, 300); }
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
var PREGUNTAS = ['¿Qué salió bien hoy?', '¿Por qué estás agradecido hoy?', '¿Qué aprendiste hoy?', '¿Qué harías distinto?', '¿Qué te hizo sonreír?', '¿Qué te preocupa y qué puedes hacer al respecto?', '¿Cuál fue el mejor momento del día?'];
VISTAS.diario = function(){
  var dia = ui.diarioDia, hoy = hoyISO();
  var e = buscarId('diario', dia); if(e && e.del) e = null;
  var html = '<section class="tarjeta" style="margin-bottom:16px">' +
    '<div class="tarjeta-cab"><button class="btn-icono" data-acc="diario-mover" data-n="-1" aria-label="Día anterior">' + ico('i-izq') + '</button>' +
      '<h2 style="flex:1;justify-content:center">' + (dia === hoy ? 'Hoy' : cap(relativo(dia))) + ' · ' + fechaCorta(dia) + '</h2>' +
      '<button class="btn-icono" data-acc="diario-mover" data-n="1" aria-label="Día siguiente"' + (dia >= hoy ? ' disabled style="opacity:.3"' : '') + '>' + ico('i-der') + '</button></div>' +
    '<div class="tarjeta-cuerpo">' + animosHTML(e ? e.animo : 0, dia) +
      '<textarea class="entrada" id="textoDiario" data-dia="' + dia + '" maxlength="10000" placeholder="' + esc(PREGUNTAS[deISO(dia).getDate() % PREGUNTAS.length]) + '" style="height:auto;min-height:170px;padding:12px;margin-top:12px;line-height:1.55;resize:vertical">' + esc(e ? e.texto : '') + '</textarea>' +
      '<small style="color:var(--tinta-3);font-size:12px">Se guarda solo mientras escribes.</small>' +
    '</div></section>';

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
      (a ? ANIMOS[a].e : (x && x.texto ? '✎' : deISO(d).getDate())) + '</button>';
  }
  html += '<div class="rejilla dos"><section class="tarjeta">' + cabTarjeta('i-cal', cap(MESES[mm]) + ' ' + y, 'var(--rosa)') +
    '<div class="tarjeta-cuerpo"><div class="mes-animo" style="margin-bottom:6px">' + cab.join('') + '</div><div class="mes-animo">' + celdas + '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;font-size:12.5px;color:var(--tinta-2)">' +
      [5,4,3,2,1].filter(function(i){ return cuenta[i]; }).map(function(i){ return '<span>' + ANIMOS[i].e + ' ' + cuenta[i] + '</span>'; }).join('') +
    '</div></div></section>';

  var todas = vivos('diario').filter(function(x){ return x.animo || x.texto; }).sort(function(a, b){ return b.id.localeCompare(a.id); });
  html += '<section class="tarjeta">' + cabTarjeta('i-diario', 'Entradas', 'var(--verde)') +
    (todas.length ? '<div>' + todas.slice(0, 40).map(function(x){
      return '<button class="entrada-diario" data-acc="diario-dia" data-dia="' + x.id + '"><span class="em">' + (x.animo ? ANIMOS[x.animo].e : '📝') + '</span><div style="min-width:0">' +
        '<b>' + cap(fechaLarga(x.id)) + '</b>' + (x.texto ? '<p>' + esc(x.texto) + '</p>' : '') + '</div></button>';
    }).join('') + '</div>' : vacio('📖', 'Aún no has escrito', 'Elige cómo te sientes y cuenta tu día en un par de líneas.')) +
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
      '<div class="tarjeta-cuerpo"><select class="entrada" id="focoTarea"><option value="">— Elige una tarea (opcional) —</option>' +
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
}
function terminarFoco(){
  var era = foco.modo;
  foco.fin = 0; foco.resta = 0;
  if(era === 'trabajo'){
    var hoy = hoyISO(), e = buscarId('enfoque', hoy);
    e = e ? JSON.parse(JSON.stringify(e)) : { id:hoy, items:[] };
    delete e.del; e.pomos = (e.pomos || 0) + 1;
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
VISTAS.progreso = function(){
  var hoy = hoyISO(), por = hechasPorDia();
  var dias = [], eti = [], sem = 0, semAnt = 0;
  for(var i = 13; i >= 0; i--){ var d = sumarDias(hoy, -i); dias.push(por[d] || 0); eti.push(String(deISO(d).getDate())); }
  for(var j = 0; j < 7; j++){ sem += por[sumarDias(hoy, -j)] || 0; semAnt += por[sumarDias(hoy, -7 - j)] || 0; }
  var pomos = [], etiP = [], pomSem = 0;
  for(var k = 6; k >= 0; k--){ var dd = sumarDias(hoy, -k), e = buscarId('enfoque', dd), n = e && !e.del ? (e.pomos || 0) : 0; pomos.push(n); pomSem += n; etiP.push(DIAS3[deISO(dd).getDay()]); }
  var hs = vivos('habitos'), mejor = 0;
  hs.forEach(function(x){ mejor = Math.max(mejor, racha(x)); });
  var mes = hoy.slice(0, 7), escritos = vivos('diario').filter(function(x){ return x.id.slice(0, 7) === mes && (x.animo || x.texto); });
  var sumA = 0, nA = 0; escritos.forEach(function(x){ if(x.animo){ sumA += x.animo; nA++; } });
  var dif = sem - semAnt;

  var html = '<div class="kpis">' +
    '<div class="tarjeta kpi"><small>Tareas esta semana</small><b>' + sem + '</b><span class="' + (dif > 0 ? 'sube' : dif < 0 ? 'baja' : '') + '">' + (dif > 0 ? '▲ ' + dif : dif < 0 ? '▼ ' + (-dif) : '=') + ' vs. la anterior</span></div>' +
    '<div class="tarjeta kpi"><small>Mejor racha</small><b>🔥 ' + mejor + '</b><span>días seguidos</span></div>' +
    '<div class="tarjeta kpi"><small>Sesiones de enfoque</small><b>🍅 ' + pomSem + '</b><span>esta semana</span></div>' +
    '<div class="tarjeta kpi"><small>Ánimo del mes</small><b>' + (nA ? ANIMOS[Math.round(sumA / nA)].e : '—') + '</b><span>' + escritos.length + ' días en el diario</span></div>' +
  '</div>';
  html += '<div class="rejilla dos">';
  html += '<section class="tarjeta ancho-2">' + cabTarjeta('i-tareas', 'Tareas hechas · últimos 14 días', 'var(--azul)') +
    '<div class="tarjeta-cuerpo">' + barras(dias, eti, 'var(--verde)') + '</div></section>';
  html += '<section class="tarjeta">' + cabTarjeta('i-habitos', 'Hábitos · últimos 30 días', 'var(--oro)') +
    (hs.length ? hs.map(function(x){ var p = Math.round(cumplimiento(x) * 100);
      return '<div class="barra-h"><span>' + esc((x.em || '⭐') + ' ' + x.nombre) + '</span><div class="barra-prog"><i style="width:' + p + '%"></i></div><b>' + p + '%</b></div>'; }).join('') + '<div style="height:10px"></div>'
      : '<div class="vacio">Sin hábitos todavía.</div>') + '</section>';
  html += '<section class="tarjeta">' + cabTarjeta('i-reloj', 'Enfoque · últimos 7 días', 'var(--debe)') +
    '<div class="tarjeta-cuerpo">' + barras(pomos, etiP, 'var(--debe)', 120) + '</div></section>';
  var ms = vivos('metas').filter(function(m){ return !m.archivada; });
  if(ms.length){
    html += '<section class="tarjeta ancho-2">' + cabTarjeta('i-meta', 'Metas', 'var(--verde)') + ms.map(function(m){
      var p = Math.min(100, Math.round((+m.actual || 0) / (+m.objetivo || 1) * 100));
      return '<div class="barra-h"><span>' + esc((m.em || '🎯') + ' ' + m.t) + '</span><div class="barra-prog" style="--c:' + color(m.color) + '"><i style="width:' + p + '%"></i></div><b>' + p + '%</b></div>';
    }).join('') + '<div style="height:10px"></div></section>';
  }
  return html + '</div>';
};

/* ---------- Confeti, para celebrar ------------------------------------------ */
function confeti(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var c = $('confeti'), g = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight;
  var cs = getComputedStyle(document.documentElement);
  var col = ['--verde','--haber','--debe','--oro','--azul','--rosa'].map(function(v){ return cs.getPropertyValue(v).trim() || '#7C8CF8'; });
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
var pinCfg = leerJSON(CLAVE_PIN, null), pinEscrito = '', pinModo = 'abrir', pinNuevo = '', fallos = 0, bloqueadoHasta = 0, ocultoDesde = 0;
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
  { id:'medianoche', nom:'Medianoche', gotas:['#7C8CF8','#3DDC97','#FF6B81'] },
  { id:'carbon',     nom:'Carbón',     gotas:['#E0A72E','#8FD14F','#F2622E'] },
  { id:'violeta',    nom:'Violeta',    gotas:['#B478F5','#31D0C6','#F2568F'] },
  { id:'bosque',     nom:'Bosque',     gotas:['#4FA88C','#3ED598','#FF6B5E'] }
];
var nube = leerJSON(CLAVE_NUBE, null);

VISTAS.ajustes = function(){
  var tema = document.documentElement.getAttribute('data-tema') || 'oscuro';
  var pal = document.documentElement.getAttribute('data-paleta') || 'medianoche';
  var permiso = 'Notification' in window ? Notification.permission : 'no';
  var llaveCuentas = (leerJSON(CLAVE_NUBE_CTA, null) || {}).key || '';

  var html = '<div class="seccion-tit" style="margin-top:0">Tú</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Tu nombre</b><small>Para saludarte en Hoy.</small></div>' +
    '<input class="entrada" id="ajNombre" style="max-width:240px" maxlength="40" value="' + esc(db.perfil.nombre) + '" placeholder="Tu nombre"></div></div>';

  html += '<div class="seccion-tit">Apariencia</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Tema</b><small>Se aplica también a Cuentas.</small></div>' +
      '<div class="selector"><button data-acc="tema" data-t="oscuro" aria-pressed="' + (tema !== 'claro') + '">Oscuro</button><button data-acc="tema" data-t="claro" aria-pressed="' + (tema === 'claro') + '">Claro</button></div></div>' +
    '<div class="ajuste"><div class="txt"><b>Colores</b></div><div class="rejilla-paletas">' + PALETAS.map(function(p){
      return '<button type="button" class="muestra" data-acc="paleta" data-p="' + p.id + '" aria-pressed="' + (p.id === pal) + '"><span class="gotas">' +
        p.gotas.map(function(c){ return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' + p.nom + '</button>';
    }).join('') + '</div></div>' +
    '<div class="ajuste"><div class="txt"><b>La semana empieza</b></div>' +
      '<div class="selector"><button data-acc="lunes" data-v="1" aria-pressed="' + pref.lunes + '">Lunes</button><button data-acc="lunes" data-v="0" aria-pressed="' + !pref.lunes + '">Domingo</button></div></div>' +
  '</div>';

  html += '<div class="seccion-tit">Privacidad</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Bloqueo con PIN</b><small>' + (pinCfg ? 'Activado. Se pide al abrir y al volver después de un minuto fuera.' :
      'Pide un PIN de 4 a 6 números para abrir la agenda. Tapa lo que hay; no cifra los datos. Si lo olvidas no se puede recuperar.') + '</small></div>' +
      (pinCfg ? '<button class="btn chico" data-acc="pin-cambiar">Cambiar</button><button class="btn chico peligro" data-acc="pin-quitar">Quitar</button>'
              : '<button class="btn chico primario" data-acc="pin-poner">' + ico('i-candado') + 'Poner PIN</button>') + '</div></div>';

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
    html += '<div class="ajuste"><div class="txt"><b>Conectada a jsonbin.io</b><small>La agenda se guarda también en tu base <span class="cifra">' + esc(nube.bin) + '</span> y se junta con la de tus otros aparatos. Cuentas sincroniza aparte, desde su propio menú.</small></div>' +
      '<button class="btn chico primario" data-acc="nube-ya">' + ico('i-nube') + 'Sincronizar ahora</button></div>' +
      '<div class="ajuste"><div class="txt"><b>Añadir otro aparato</b><small>Copia este código y pégalo en Ajustes del otro aparato.</small></div>' +
      '<button class="btn chico" data-acc="nube-codigo">Ver código</button></div>' +
      '<div class="ajuste"><div class="txt"><b>Desconectar este aparato</b><small>Los datos se quedan aquí y en la nube; solo deja de sincronizar.</small></div>' +
      '<button class="btn chico peligro" data-acc="nube-quitar">Desconectar</button></div>';
  } else {
    html += '<div class="ajuste"><div class="txt"><b>Primer aparato</b><small>Usa tu cuenta gratuita de jsonbin.io, la misma de Cuentas. Pega tu X-Master-Key' +
      (llaveCuentas ? ' (ya la puse: es la que usa Cuentas)' : '') + ' y crea la base de la agenda.</small></div>' +
      '<input class="entrada" id="ajLlave" style="max-width:320px" placeholder="X-Master-Key" value="' + esc(llaveCuentas) + '">' +
      '<button class="btn chico primario" data-acc="nube-crear">Crear base</button></div>' +
      '<div class="ajuste"><div class="txt"><b>Otro aparato</b><small>Pega el código que te da el primero.</small></div>' +
      '<input class="entrada" id="ajCodigo" style="max-width:320px" placeholder="AGENDA1:…">' +
      '<button class="btn chico" data-acc="nube-unir">Conectar</button></div>';
  }
  html += '</div>';

  html += '<div class="seccion-tit">Tus datos</div><div class="tarjeta">' +
    '<div class="ajuste"><div class="txt"><b>Respaldo completo</b><small>Un archivo con toda la agenda, tus gastos personales y las cuentas de la oficina. Guárdalo de vez en cuando.</small></div>' +
      '<button class="btn chico" data-acc="respaldo">' + ico('i-bajar') + 'Descargar</button>' +
      '<button class="btn chico" data-acc="cargar">' + ico('i-subir') + 'Cargar</button>' +
      '<input type="file" id="archivoRespaldo" accept=".json,application/json" class="oculto"></div>' +
    '<div class="ajuste"><div class="txt"><b>Instalar como aplicación</b><small>Con su icono, a pantalla completa y abriendo sin internet.</small></div>' +
      '<button class="btn chico" data-acc="instalar">' + ico('i-instalar') + 'Instalar</button></div>' +
    '<div class="ajuste"><div class="txt"><b>Borrar toda la agenda</b><small>Tareas, listas, eventos, recordatorios, hábitos y notas de este aparato. Las cuentas no se tocan.</small></div>' +
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
function abrirFlotante(html, alCerrar){
  cerrarFlotante();
  $('capaFlotante').innerHTML = '<div class="velo" data-velo="1"><div class="hoja-flot" role="dialog" aria-modal="true"><div class="asa"></div>' + html + '</div></div>';
  alCerrarFlot = alCerrar || null;
}
function cerrarFlotante(){
  var f = alCerrarFlot; alCerrarFlot = null;
  if(f) f();
  edAcciones = {};
  $('capaFlotante').innerHTML = '';
  if(repintarAlSoltar) pintar();
}
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
function proximaHora(){ var d = new Date(); return dos((d.getHours() + 1) % 24) + ':00'; }
function sumarHora(h, min){
  var p = (h || '09:00').split(':'), t = (+p[0] * 60 + +p[1] + min) % 1440;
  return dos(Math.floor(t / 60)) + ':' + dos(t % 60);
}
function fechaPorDefecto(){ return ui.vista === 'calendario' ? ui.calSel : hoyISO(); }

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
        campo('Área', '<input name="area" list="listaAreas" maxlength="30" value="' + esc(t.area) + '" placeholder="Personal, Trabajo…"><datalist id="listaAreas">' +
          areas.map(function(a){ return '<option value="' + esc(a) + '">'; }).join('') + '</datalist>') + '</div>' +
      grupo('Prioridad', selector('prio', PRIOS.map(function(p, i){ return { v:String(i), n:(i ? '<span style="color:' + p.c + '">●</span> ' : '') + p.n }; }), String(t.prio || 0))) +
      grupo('Subtareas', '<div class="subtareas" id="subs">' + (t.sub || []).map(filaSub).join('') + '</div>' +
        '<button type="button" class="btn chico" data-ed="sub-add" style="align-self:flex-start;margin-top:4px">' + ico('i-plus') + 'Subtarea</button>') +
      campo('Notas', '<textarea name="notas" maxlength="4000" placeholder="Detalles, enlaces, lo que haga falta">' + esc(t.notas) + '</textarea>') +
      botonesEd(!!id, id ? '<button type="button" class="btn" data-ed="alternar">' + (t.hecha ? 'Marcar pendiente' : ico('i-check') + 'Hecha') + '</button>' : '') +
    '</form>');
  var f = $('formEd');
  if(!id) f.t.focus();
  f.onsubmit = function(e){
    e.preventDefault();
    t.t = f.t.value.trim(); if(!t.t) return;
    t.fecha = f.fecha.value; t.hora = f.hora.value; t.rep = f.rep.value;
    if(t.rep !== 'no' && !t.fecha) t.fecha = hoyISO();
    t.area = f.area.value.trim(); t.notas = f.notas.value.trim();
    t.prio = +leerSelector('prio') || 0;
    t.sub = leerSubs();
    poner('tareas', t);
    cerrarFlotante(); pintar();
    if(!id) aviso('Tarea guardada', t.fecha ? relativo(t.fecha) + (t.hora ? ' · ' + t.hora : '') : null);
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); quitar('tareas', t.id, 'Tarea borrada'); pintar(); },
    alternar: function(){ cerrarFlotante(); alternarTarea(t.id); },
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
    setTimeout(pintarSeguro, 320);
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
    Object.assign({ id:nid(), t:'', fecha:fechaPorDefecto(), hasta:'', todo:false, ini:ini, fin:sumarHora(ini, 60), lugar:'', color:'acento', rep:'no', aviso:15, notas:'' }, preset || {});
  var AVISOS = [[-1,'Sin aviso'],[0,'A la hora'],[5,'5 min antes'],[10,'10 min antes'],[15,'15 min antes'],[30,'30 min antes'],[60,'1 hora antes'],[120,'2 horas antes'],[1440,'1 día antes']];
  abrirFlotante(cabFlot(id ? 'Evento' : 'Nuevo evento') +
    '<form class="form" id="formEd" autocomplete="off">' +
      campo('Título', '<input name="t" required maxlength="200" value="' + esc(e.t) + '" placeholder="Ej. Cumpleaños de Ana, reunión, dentista">') +
      '<div class="fila-campos">' + campo('Día', '<input type="date" name="fecha" required value="' + esc(e.fecha) + '">') +
                                    campo('Hasta (varios días)', '<input type="date" name="hasta" value="' + esc(e.hasta || '') + '">') + '</div>' +
      '<label class="interruptor"><input type="checkbox" name="cumple"' + (e.cumple ? ' checked' : '') + '>🎂 Es un cumpleaños o aniversario (se repite cada año)</label>' +
      '<div id="filaCumple"' + (e.cumple ? '' : ' style="display:none"') + '>' + campo('Año en que nació (opcional, para saber cuántos cumple)', '<input name="nacio" type="number" min="1900" max="2100" value="' + esc(e.nacio || '') + '" placeholder="Ej. 1990">') + '</div>' +
      '<div id="filaNoCumple"' + (e.cumple ? ' style="display:none"' : '') + '>' +
      '<label class="interruptor" style="margin-bottom:12px"><input type="checkbox" name="todo"' + (e.todo ? ' checked' : '') + '>Todo el día</label>' +
      '<div class="fila-campos" id="filaHoras"' + (e.todo ? ' style="display:none"' : '') + '>' +
        campo('Empieza', '<input type="time" name="ini" value="' + esc(e.ini || '') + '">') +
        campo('Termina', '<input type="time" name="fin" value="' + esc(e.fin || '') + '">') + '</div></div>' +
      campo('Lugar', '<input name="lugar" maxlength="120" value="' + esc(e.lugar) + '" placeholder="Opcional">') +
      '<div class="fila-campos">' + campo('Repetir', selRep(e.rep)) +
        campo('Aviso', '<select name="aviso">' + AVISOS.map(function(a){ return '<option value="' + a[0] + '"' + (+e.aviso === a[0] ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') + '</select>') + '</div>' +
      grupo('Color', selector('color', OPC_COLOR, e.color || 'acento', 'colores')) +
      campo('Notas', '<textarea name="notas" maxlength="4000">' + esc(e.notas) + '</textarea>') +
      botonesEd(!!id, id ? '<button type="button" class="btn" data-ed="google">' + ico('i-enlace') + 'Google</button><button type="button" class="btn" data-ed="ics">.ics</button>' : '') +
    '</form>');
  var f = $('formEd');
  if(!id) f.t.focus();
  f.todo.onchange = function(){ $('filaHoras').style.display = f.todo.checked ? 'none' : ''; };
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
    e.color = leerSelector('color') || 'acento'; e.notas = f.notas.value.trim();
    e.cumple = f.cumple.checked;
    if(e.cumple){ e.todo = true; e.rep = 'ano'; e.hasta = ''; e.nacio = parseInt(f.nacio.value, 10) || ''; if(e.aviso > 0 && e.aviso < 1440) e.aviso = 1440; e.ini = e.ini || '09:00'; }
    else delete e.nacio;
    return e;
  }
  f.onsubmit = function(ev){
    ev.preventDefault(); leer(); if(!e.t) return;
    poner('eventos', e); cerrarFlotante(); pintar();
    if(!id) aviso('Evento guardado', relativo(e.fecha) + (e.todo ? '' : ' · ' + e.ini));
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); quitar('eventos', e.id, 'Evento borrado'); pintar(); },
    google: function(){ window.open(enlaceGoogle(leer(), 'evento'), '_blank', 'noopener'); },
    ics: function(){ bajarICS([aVEVENT(leer(), 'evento')], (e.t || 'evento') + '.ics'); }
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
      botonesEd(!!id, '<button type="button" class="btn" data-ed="google">' + ico('i-enlace') + 'Google</button><button type="button" class="btn" data-ed="ics">.ics</button>') +
    '</form>');
  var f = $('formEd');
  if(!id && !r.t) f.t.focus();
  function leer(){
    r.t = f.t.value.trim(); r.fecha = f.fecha.value || hoyISO(); r.hora = f.hora.value || '09:00';
    r.rep = f.rep.value; r.notas = f.notas.value.trim();
    return r;
  }
  f.onsubmit = function(ev){
    ev.preventDefault(); leer(); if(!r.t) return;
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
      '<label class="interruptor"><input type="checkbox" name="fija"' + (n.fija ? ' checked' : '') + '>Fijar arriba y en Hoy</label>' +
      '<div class="botones">' + '<button type="button" class="btn peligro" data-ed="borrar" aria-label="Borrar">' + ico('i-basura') + '</button>' +
        '<button type="submit" class="btn primario">' + ico('i-check') + 'Listo</button></div>' +
    '</form>', function(){ guardarYa(); pintarSeguro(); });
  var f = $('formEd');
  (id ? f.cuerpo : f.t).focus();
  function guardarYa(){
    clearTimeout(reloj);
    var t = f.t.value.trim(), c = f.cuerpo.value.replace(/\s+$/, '');
    var col = leerSelector('color'), fija = f.fija.checked;
    if(!existe && !t && !c) return;
    if(n.t === t && n.cuerpo === c && (n.color || '') === col && !!n.fija === fija && existe) return;
    n.t = t; n.cuerpo = c; n.color = col; n.fija = fija; existe = true;
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
    '_color': guardarYa
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
      botonesEd(!!id) +
    '</form>');
  var f = $('formEd');
  if(!id) f.n.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    x.nombre = f.n.value.trim(); if(!x.nombre) return;
    x.em = leerSelector('em') || '⭐';
    var d = leerSelector('dias', true).map(Number);
    x.dias = d.length ? d : [0,1,2,3,4,5,6];
    poner('habitos', x); cerrarFlotante(); pintar();
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
      botonesEd(!!id) +
    '</form>');
  var f = $('formEd'), plantilla = 'vacia';
  if(!id) f.n.focus();
  f.onsubmit = function(ev){
    ev.preventDefault();
    l.nombre = f.n.value.trim(); if(!l.nombre) return;
    l.em = leerSelector('em') || '📝'; l.color = leerSelector('color') || 'acento';
    if(!id) l.items = PLANTILLAS[plantilla].items.map(function(t){ return { id:nid(), t:t, ok:false }; });
    poner('listas', l); cerrarFlotante();
    ui.lista = l.id; ui.vista = 'listas'; pintar();
    setTimeout(function(){ var i = $('nuevoItem'); if(i && !id && !l.items.length) i.focus(); }, 50);
  };
  edAcciones = {
    borrar: function(){ cerrarFlotante(); ui.lista = null; quitar('listas', l.id, 'Lista borrada'); pintar(); },
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
  var ops = [['tarea','i-tareas','Tarea'],['rec','i-campana','Recordatorio'],['evento','i-cal','Evento'],['nota','i-notas','Nota'],['lista','i-listas','Lista'],['habito','i-habitos','Hábito'],['meta','i-meta','Meta'],['pago','i-recibo','Pago fijo'],['diario','i-diario','Diario'],['personal','i-cuentas','Gasto personal'],['oficina','i-maletin','Movimiento de oficina']];
  abrirFlotante(cabFlot('Añadir') + '<div class="rejilla-mas">' + ops.map(function(o){
    return '<button type="button" data-acc="nuevo" data-tipo="' + o[0] + '">' + ico(o[1]) + o[2] + '</button>';
  }).join('') + '</div>');
}
function menuMas(){
  var k = contadores();
  var ops = SECCIONES.filter(function(s){ return ABAJO.indexOf(s.id) < 0; });
  abrirFlotante(cabFlot('Más') + '<div class="rejilla-mas">' + ops.map(function(s){
    var n = s.id === 'recordatorios' ? k.recordatorios : 0;
    return '<button type="button" data-ir="' + s.id + '">' + ico(s.ico) + s.nom + (n ? '<span class="globo">' + n + '</span>' : '') + '</button>';
  }).join('') + '<button type="button" data-acc="buscar">' + ico('i-buscar') + 'Buscar</button>' +
    '<button type="button" data-ir="ajustes">' + ico('i-ajustes') + 'Ajustes</button></div>');
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
  else if(tipo === 'pago') editarPago(null, preset);
  else if(tipo === 'diario'){ ui.diarioDia = hoyISO(); ir('diario'); setTimeout(function(){ var t = $('textoDiario'); if(t) t.focus(); }, 60); }
  else if(tipo === 'personal' || tipo === 'oficina' || tipo === 'dinero') ir(tipo === 'dinero' ? 'personal' : tipo);
}
function nuevoSegunVista(){
  var v = ui.vista;
  if(v === 'tareas') nuevo('tarea');
  else if(v === 'calendario') nuevo('evento');
  else if(v === 'recordatorios') nuevo('rec');
  else if(v === 'notas') nuevo('nota');
  else if(v === 'habitos') nuevo('habito');
  else if(v === 'metas') nuevo('meta');
  else if(v === 'pagos') nuevo('pago');
  else if(v === 'diario'){ var td = $('textoDiario'); if(td) td.focus(); }
  else if(v === 'listas'){ if(ui.lista && $('nuevoItem')) $('nuevoItem').focus(); else nuevo('lista'); }
  else menuNuevo();
}

/* ---------- Buscar en todo ------------------------------------------------- */
function abrirBuscar(){
  abrirFlotante(cabFlot('Buscar') + '<input class="entrada" id="q" type="search" placeholder="Tareas, eventos, notas, listas…" autocomplete="off">' +
    '<div id="resultados" style="margin-top:10px"></div>');
  var q = $('q');
  q.focus();
  q.oninput = function(){ $('resultados').innerHTML = resultados(q.value); };
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
function bajar(blob, nombre){
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
  var op = { body:a.cuerpo, tag:a.tipo + a.id, icon:window.ICONO_AGENDA || 'icon-192.png', badge:window.ICONO_AGENDA || 'icon-192.png', requireInteraction:true, data:{ vista:{ rec:'recordatorios', tarea:'tareas', pago:'pagos', prueba:'foco' }[a.tipo] || 'calendario' } };
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
  p.classList.toggle('oculto', !nube);
  p.dataset.estado = e;
  $('pastillaTexto').textContent = { ok:'Sincronizado', busy:'Sincronizando', err:'Sin conexión', off:'Nube' }[e] || 'Nube';
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
      if(ahora !== antes){ guardarLocal(); pintarSeguro(); }
      if(ahora !== JSON.stringify(fusionar(remoto, remoto))){
        return fetch(JSONBIN + '/' + cfg.bin, { method:'PUT', headers:cabeceras(), body:ahora })
          .then(function(r){ if(!r.ok) throw new Error('http ' + r.status); });
      }
    })
    .then(function(){ estadoNube('ok'); })
    .catch(function(){ estadoNube('err'); })
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
      aviso('Nube conectada', 'Ahora puedes añadir tus otros aparatos.');
      estadoNube('ok'); pintar();
    })
    .catch(function(e){ aviso('No se pudo crear', String(e.message || e)); });
}
function codigoNube(){ return 'AGENDA1:' + btoa(JSON.stringify({ k:nube.key, b:nube.bin })); }
function unirNube(codigo){
  try{
    var j = JSON.parse(atob(String(codigo).trim().replace(/^AGENDA1:/, '')));
    if(!j.k || !j.b) throw 0;
    nube = { key:j.k, bin:j.b };
    escribirJSON(CLAVE_NUBE, nube);
    aviso('Conectando…');
    sincronizar().then(function(){ pintar(); aviso('Listo', 'Este aparato ya está sincronizado.'); });
  }catch(e){ aviso('Código no válido', 'Cópialo entero desde Ajustes del otro aparato.'); }
}

/* Escucha: rápido mientras la usas, nada si la dejas quieta */
function latido(){
  if(!nube || document.hidden) return;
  if(Date.now() - ultimoToque > 5 * 60e3) return;
  sincronizar();
}

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
function aplicarTema(t){
  document.documentElement.setAttribute('data-tema', t);
  try{ localStorage.setItem(CLAVE_TEMA, t); }catch(e){}
  colorBarra(); recargarCuentas();
}
function aplicarPaleta(p){
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
  [
    T({ t:'Pagar el recibo de luz', fecha:hoy, prio:3, area:'Casa' }),
    T({ t:'Llamar al banco', fecha:hoy, hora:'16:00', area:'Dinero' }),
    T({ t:'Preparar la presentación', fecha:sumarDias(hoy, 2), prio:2, area:'Trabajo', sub:[{ id:nid(), t:'Borrador', ok:true },{ id:nid(), t:'Gráficos', ok:false },{ id:nid(), t:'Ensayar', ok:false }] }),
    T({ t:'Regar las plantas', fecha:hoy, rep:'sem', area:'Casa' }),
    T({ t:'Aprender a cocinar lasaña', fecha:'' , area:'Personal' })
  ].forEach(function(t){ poner('tareas', t); });
  poner('eventos', { id:nid(), t:'Almuerzo con la familia', fecha:sumarDias(hoy, (7 - w) % 7 || 7), todo:false, ini:'13:00', fin:'15:00', lugar:'Casa de mamá', color:'rosa', rep:'no', aviso:60, notas:'' });
  poner('eventos', { id:nid(), t:'Gimnasio', fecha:hoy, todo:false, ini:'19:00', fin:'20:00', lugar:'', color:'verde', rep:'lab', aviso:15, notas:'' });
  poner('recordatorios', { id:nid(), t:'Tomar vitaminas', fecha:hoy, hora:'21:00', rep:'dia', notas:'' });
  poner('recordatorios', { id:nid(), t:'Renovar el seguro del auto', fecha:sumarDias(hoy, 5), hora:'10:00', rep:'no', notas:'' });
  poner('listas', { id:nid(), nombre:'Compras', em:'🛒', color:'verde', creada:c++, items:['Leche','Pan','Huevos','Café','Fruta'].map(function(t, i){ return { id:nid(), t:t, ok:i === 1 }; }) });
  var marcas = {}; for(var i = 1; i < 5; i++) marcas[sumarDias(hoy, -i)] = 1;
  poner('habitos', { id:nid(), nombre:'Beber 2 litros de agua', em:'💧', dias:[0,1,2,3,4,5,6], marcas:marcas, creada:c - 30 * 864e5 });
  poner('habitos', { id:nid(), nombre:'Leer 20 minutos', em:'📚', dias:[1,2,3,4,5], marcas:{}, creada:c });
  poner('notas', { id:nid(), t:'Wifi de casa', cuerpo:'Red: MiCasa_5G\nClave: la de siempre 😉', color:'azul', fija:true });
  poner('enfoque', { id:hoy, items:[{ t:'Pagar la luz', ok:false },{ t:'Avanzar la presentación', ok:false },{ t:'Caminar 30 minutos', ok:false }], pomos:2 });
  poner('eventos', { id:nid(), t:'Mamá', fecha:sumarDias(hoy, 9).slice(0, 4) - 58 + sumarDias(hoy, 9).slice(4), todo:true, ini:'09:00', fin:'', lugar:'', color:'rosa', rep:'ano', aviso:1440, notas:'', cumple:true, nacio:+sumarDias(hoy, 9).slice(0, 4) - 58 });
  poner('metas', { id:nid(), t:'Ahorrar para el viaje', em:'✈️', actual:650, objetivo:2000, unidad:'soles', fecha:sumarDias(hoy, 120), color:'azul', creada:c++ });
  poner('metas', { id:nid(), t:'Leer libros este año', em:'📚', actual:4, objetivo:12, unidad:'libros', fecha:hoy.slice(0, 4) + '-12-31', color:'verde', creada:c++ });
  var ym = hoy.slice(0, 7), dHoy = deISO(hoy).getDate();
  var pg = function(){ var o = {}; o[ym] = Date.now(); return o; };
  poner('pagos', { id:nid(), t:'Luz', em:'💡', monto:95.5, dia:Math.min(28, dHoy + 2), cat:'Servicios', pagados:{}, activo:true, aviso:true, desde:ym });
  poner('pagos', { id:nid(), t:'Internet', em:'🌐', monto:89.9, dia:Math.max(1, dHoy - 3), cat:'Servicios', pagados:pg(), activo:true, aviso:true, desde:ym });
  poner('pagos', { id:nid(), t:'Alquiler', em:'🏠', monto:1200, dia:1, cat:'Casa', pagados:pg(), activo:true, aviso:true, desde:ym });
  [[-1,4,'Buen día en el trabajo, terminé el informe.'],[-2,3,''],[-3,5,'Cena con amigos 🥳'],[-5,2,'Cansado, dormí poco.']].forEach(function(x){
    poner('diario', { id:sumarDias(hoy, x[0]), animo:x[1], texto:x[2] });
  });
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
    case 'buscar': abrirBuscar(); break;
    case 'nuevo': nuevo(b.dataset.tipo); break;
    case 'cap-tipo':
      ui.capTipo = b.dataset.tipo;
      b.parentNode.querySelectorAll('.ficha').forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      var ph = { tarea:'Nueva tarea…', rec:'Recordar… ej. «llamar a mamá el domingo a las 11»', evento:'Evento… ej. «cena con amigos el viernes a las 8»', nota:'Apunta una idea…' };
      $('entradaCaptura').placeholder = ph[ui.capTipo]; $('entradaCaptura').focus();
      break;

    case 'tarea-ok': alternarTarea(id, b); break;
    case 'tarea-ed': cerrarFlotante(); editarTarea(id); break;
    case 'rec-ok': alternarRec(id, b); break;
    case 'rec-ed': cerrarFlotante(); editarRec(id); break;
    case 'rec-posponer': menuPosponer(id); break;
    case 'posponer': posponer(id, isNaN(+b.dataset.m) ? b.dataset.m : +b.dataset.m); break;
    case 'rec-ver-hechos': ui.verHechos = !ui.verHechos; pintar(); break;
    case 'rec-borrar-hechos':
      if(!confirm('¿Borrar todos los recordatorios hechos?')) return;
      vivos('recordatorios').forEach(function(r){ if(r.hecho && (!r.rep || r.rep === 'no')){ r.del = true; r.upd = Date.now(); } });
      guardar(); pintar(); break;
    case 'evento-ed': cerrarFlotante(); editarEvento(id); break;
    case 'nota-ed': cerrarFlotante(); editarNota(id); break;
    case 'habito-ed': cerrarFlotante(); editarHabito(id); break;

    case 't-filtro': ui.tFiltro = b.dataset.f; pintar(); break;
    case 't-area': ui.tArea = b.dataset.a; pintar(); break;
    case 't-borrar-hechas':
      if(!confirm('¿Borrar todas las tareas hechas?')) return;
      vivos('tareas').forEach(function(x){ if(x.hecha){ x.del = true; x.upd = Date.now(); } });
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
    case 'cal-modo': ui.calModo = b.dataset.m; pintar(); break;

    case 'lista-abrir': ir('listas'); ui.lista = id; pintar(); break;
    case 'lista-volver': ui.lista = null; pintar(); break;
    case 'lista-ed': editarLista(id); break;
    case 'item-ok':
      cambiarLista(function(l){ var it = l.items.find(function(x){ return x.id === id; }); if(it) it.ok = !it.ok; });
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
    case 'lunes': pref.lunes = b.dataset.v === '1'; escribirJSON(CLAVE_PREF, pref); pintar(); break;
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
    case 'nube-unir': unirNube($('ajCodigo').value); break;
    case 'nube-ya': sincronizar().then(function(){ aviso($('pastillaNube').dataset.estado === 'ok' ? 'Sincronizado' : 'No se pudo conectar'); }); break;
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
      nube = null; try{ localStorage.removeItem(CLAVE_NUBE); }catch(e){}
      estadoNube('off'); pintar(); break;
    case 'respaldo': descargarRespaldo(); break;
    case 'cargar': $('archivoRespaldo').click(); break;
    case 'instalar': instalar(); break;
    case 'borrar-todo':
      if(!confirm('¿Borrar TODA la agenda de este aparato? Los gastos personales y la oficina no se tocan.')) return;
      if(!confirm('Seguro? No se puede deshacer (salvo con un respaldo).')) return;
      COLS.forEach(function(c){ db[c].forEach(function(x){ x.del = true; x.upd = Date.now(); }); });
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
    db.perfil = { nombre:n, upd:Date.now() }; guardar(); pintar();
  } else if(a === 'captura'){
    var inp = $('entradaCaptura'), v = inp.value.trim();
    if(!v) return;
    crearDesdeCaptura(v);
    inp.value = '';
    pintar();
    var ni = $('entradaCaptura'); if(ni) ni.focus();
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
  if(tipo === 'tarea'){
    var t = { id:nid(), t:p.texto, fecha:p.fecha, hora:p.hora, prio:p.prio, area:p.area, rep:'no', sub:[], notas:'', creada:Date.now() };
    if(!t.fecha && ui.vista === 'tareas' && ui.tFiltro === 'hoy') t.fecha = hoyISO();
    poner('tareas', t);
    aviso('Tarea añadida', t.fecha ? relativo(t.fecha) + (t.hora ? ' · ' + t.hora : '') : 'Sin fecha');
  } else if(tipo === 'rec'){
    if(!p.fecha && !p.hora){ editarRec(null, { t:p.texto }); return; }
    var h = p.hora || '09:00', f = p.fecha || hoyISO();
    if(f === hoyISO() && h <= horaAhora() && !p.hora) h = proximaHora();
    poner('recordatorios', { id:nid(), t:p.texto, fecha:f, hora:h, rep:'no', notas:'' });
    aviso('Te lo recordaré', relativo(f) + ' · ' + h);
  } else if(tipo === 'evento'){
    var e = { id:nid(), t:p.texto, fecha:p.fecha || hoyISO(), hasta:'', todo:!p.hora, ini:p.hora, fin:p.hora ? sumarHora(p.hora, 60) : '', lugar:'', color:'acento', rep:'no', aviso:p.hora ? 15 : -1, notas:'' };
    poner('eventos', e);
    aviso('Evento añadido', relativo(e.fecha) + (e.hora ? ' · ' + e.ini : ''));
  } else if(tipo === 'nota'){
    poner('notas', { id:nid(), t:'', cuerpo:v, color:'', fija:false });
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
    db.perfil = { nombre:t.value.trim().slice(0, 40), upd:Date.now() }; guardar(); pintarNav();
  } else if(t.id === 'focoTarea'){
    foco.tarea = t.value; guardarFoco(); pintarSeguro();
  } else if(t.dataset && t.dataset.min){
    var mv = Math.min(180, Math.max(1, parseInt(t.value, 10) || 1));
    pref[t.dataset.min] = mv; escribirJSON(CLAVE_PREF, pref);
    if(!foco.fin){ foco.resta = 0; guardarFoco(); }
    pintarSeguro(); tictac();
  } else if(t.id === 'textoDiario'){
    clearTimeout(relojDiario); guardarDiario(t.dataset.dia, { texto:t.value.replace(/\s+$/, '') });
  } else if(t.id === 'ajSonido'){
    pref.sonido = t.checked; escribirJSON(CLAVE_PREF, pref);
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
  if(!$('candado').classList.contains('oculto')){
    if(/^[0-9]$/.test(ev.key)) teclaPIN(ev.key);
    else if(ev.key === 'Backspace') teclaPIN('b');
    else if(ev.key === 'Enter') teclaPIN('ok');
    ev.preventDefault(); return;
  }
  if(ev.key === 'Escape'){ if($('capaFlotante').innerHTML){ cerrarFlotante(); ev.preventDefault(); } return; }
  /* En los pasos de una tarea, Enter añade otro paso en vez de guardar */
  if(ev.key === 'Enter' && ev.target.closest && ev.target.closest('#subs')){
    ev.preventDefault(); if(edAcciones['sub-add']) edAcciones['sub-add'](); return;
  }
  if(enCampo || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if($('capaFlotante').innerHTML) return;
  if(ev.key === '/'){ ev.preventDefault(); abrirBuscar(); }
  else if(ev.key === 'n' || ev.key === 'N'){ ev.preventDefault(); nuevoSegunVista(); }
  else if(/^[1-9]$/.test(ev.key)){ ir(SECCIONES[+ev.key - 1].id); }
});

$('fab').addEventListener('click', function(ev){ ev.stopPropagation(); nuevoSegunVista(); });
$('btnBuscar').addEventListener('click', function(ev){ ev.stopPropagation(); abrirBuscar(); });
$('btnTema').addEventListener('click', function(ev){
  ev.stopPropagation();
  aplicarTema(document.documentElement.getAttribute('data-tema') === 'claro' ? 'oscuro' : 'claro');
  if(ui.vista === 'ajustes') pintar();
});
$('pastillaNube').addEventListener('click', function(ev){ ev.stopPropagation(); sincronizar(); });

window.addEventListener('popstate', function(){ ir((location.hash || '#hoy').slice(1), true); });

/* Cuentas cambió algo en otra pestaña o dentro del marco: Hoy lo refleja */
window.addEventListener('storage', function(ev){
  if((ev.key === CLAVE_LEDGER || ev.key === CLAVE_OFICINA) && ui.vista === 'hoy') pintarSeguro();
  else if(ev.key === CLAVE){ db = normalizar(leerJSON(CLAVE, null)); pintarSeguro(); }
  else if(ev.key === CLAVE_TEMA || ev.key === CLAVE_PALETA){
    try{
      document.documentElement.setAttribute('data-tema', localStorage.getItem(CLAVE_TEMA) === 'claro' ? 'claro' : 'oscuro');
      var pp = localStorage.getItem(CLAVE_PALETA); if(pp) document.documentElement.setAttribute('data-paleta', pp);
      colorBarra();
    }catch(e){}
  }
});

document.addEventListener('visibilitychange', function(){
  if(document.hidden){ ocultoDesde = Date.now(); return; }
  if(pinCfg && ocultoDesde && Date.now() - ocultoDesde > 60000) mostrarCandado('abrir');
  if(!document.hidden){ ultimoToque = Date.now(); revisarAlarmas(); if(nube) sincronizar(); pintarSeguro(); }
});

/* ==========================================================================
   ARRANQUE
   ========================================================================== */
(function arrancar(){
  var zona = document.createElement('div');
  zona.id = 'zonaCuentas'; zona.className = 'oculto';
  $('contenido').after(zona);

  if(!document.documentElement.getAttribute('data-paleta')) document.documentElement.setAttribute('data-paleta', 'medianoche');
  colorBarra();

  var h = (location.hash || '').slice(1);
  if(h === 'cuentas') h = 'personal';
  ui.vista = (h === 'ajustes' || SECCIONES.some(function(s){ return s.id === h; })) ? h : 'hoy';
  pintar();
  estadoNube(nube ? 'ok' : 'off');

  var hospedado = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if(hospedado && 'serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(function(){});
    navigator.serviceWorker.addEventListener('message', function(ev){
      if(ev.data && ev.data.vista) ir(ev.data.vista);
    });
  }

  if(pinCfg) mostrarCandado('abrir');
  /* El logo un instante al abrir, solo una vez por sesión */
  var portada = $('portada'), vista = false;
  try{ vista = sessionStorage.getItem('agenda_portada'); sessionStorage.setItem('agenda_portada', '1'); }catch(e){}
  var instalada = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  setTimeout(function(){ portada.classList.add('fuera'); setTimeout(function(){ portada.remove(); }, 400); }, (vista && !instalada) ? 0 : 750);

  tictac();
  setInterval(tictac, 1000);
  revisarAlarmas();
  setInterval(revisarAlarmas, 15000);
  if(nube) sincronizar();
  setInterval(latido, 30000);

  /* A medianoche cambia el día: Hoy tiene que enterarse */
  var dia = hoyISO();
  setInterval(function(){ if(hoyISO() !== dia){ dia = hoyISO(); pintarSeguro(); } }, 60000);
})();

})();
