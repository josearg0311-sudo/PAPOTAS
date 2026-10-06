/* AUTOCORRECTOR (sin pantalla: se prueba solo).
   Diccionario de ~39 000 palabras ordenadas por uso + TUS palabras (las que
   usas en la agenda y las que aprende). Qué hace:
   - Tildes: «manana» → «mañana»; «mas» → «más» (solo si la forma sin tilde es rara).
   - Errores de una letra, pesando la distancia en el teclado: «hila» → «hola»
     (la i está junto a la o) gana a una letra lejana.
   - Errores de dos letras en palabras largas: «expedinete» → «expediente».
   - Preguntas: tras «¿», «que/como/cuando/donde…» llevan tilde.
   - Sugerencias mientras escribes y la palabra siguiente según cómo escribes tú.
   - No toca: nombres con mayúscula a mitad de frase, números, #etiquetas,
     palabras que conoce, ni lo que tú le enseñaste. */

const LETRA = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+$/;
export const clave = (w) => String(w).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n');
const ABC = 'abcdefghijklmnopqrstuvwxyzñ';
/* Válidas sin tilde y con otro significado: nunca se les pone tilde sola
   (en Perú «papa» es la papa, no «papá») */
const SIN_TOCAR = new Set(['papa', 'papas', 'aun', 'habito', 'animo', 'publico', 'practico', 'continuo', 'critico', 'medico', 'liquido', 'deposito', 'transito', 'titulo', 'calculo', 'limite', 'solo', 'esta', 'este', 'ese', 'esa', 'tu', 'el', 'si', 'mi', 'se', 'te', 'de', 'como', 'que', 'cual', 'quien', 'cuando', 'donde', 'cuanto']);

/* Teclas vecinas (teclado QWERTY con ñ) */
const FILAS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const POS = {};
FILAS.forEach((f, y) => [...f].forEach((c, x) => { POS[c] = [x + y * 0.5, y]; }));
/* Confusiones de sonido muy comunes en Perú (seseo, b/v, y/ll, g/j, h muda) */
const SONIDO = [['s', 'z'], ['s', 'c'], ['z', 'c'], ['b', 'v'], ['y', 'i'], ['g', 'j'], ['k', 'c'], ['q', 'c']];
const suena = (a, b) => SONIDO.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
/* Palabras que se escriben pegadas por error */
export const JUNTAS = { porfavor: 'por favor', aveces: 'a veces', osea: 'o sea', talvez: 'tal vez', enserio: 'en serio', apesar: 'a pesar', denuevo: 'de nuevo', nose: 'no sé', aparte: null, porsupuesto: 'por supuesto', alrato: 'al rato', almenos: 'al menos', derepente: 'de repente', haber: null, ahorita: null, porfa: null };
/* Cómo suena una palabra en español de Perú: sin h, s=z=c(e,i), b=v,
   ll=y, g(e,i)=j, qu=k=c(a,o,u). «aser» y «hacer» suenan igual. */
export function fonema(w) {
  return clave(w).replace(/ch/g, '§').replace(/h/g, '').replace(/§/g, 'ch')
    .replace(/qu(?=[ei])/g, 'k').replace(/c(?=[ei])/g, 's').replace(/z/g, 's').replace(/c/g, 'k').replace(/q/g, 'k')
    .replace(/v/g, 'b').replace(/ll/g, 'y').replace(/gu(?=[ei])/g, 'g').replace(/g(?=[ei])/g, 'j')
    .replace(/y(?=[^aeiou]|$)/g, 'i').replace(/(.)\1+/g, '$1');
}
export function vecinas(a, b) {
  const p = POS[a], q = POS[b];
  return !!(p && q) && Math.abs(p[0] - q[0]) <= 1.1 && Math.abs(p[1] - q[1]) <= 1;
}

/* Interrogativos y exclamativos que llevan tilde después de ¿ o ¡ */
const TILDE_PREGUNTA = { que: 'qué', como: 'cómo', cuando: 'cuándo', donde: 'dónde', quien: 'quién', quienes: 'quiénes', cual: 'cuál', cuales: 'cuáles', cuanto: 'cuánto', cuanta: 'cuánta', cuantos: 'cuántos', cuantas: 'cuántas', adonde: 'adónde' };

export function conCaso(c, w) {
  if (w.length > 1 && w === w.toUpperCase()) return c.toUpperCase();
  if (w.charAt(0) !== w.charAt(0).toLowerCase()) return c.charAt(0).toUpperCase() + c.slice(1);
  return c;
}

/* Distancia de edición con transposición (Damerau), con tope para cortar antes */
function distancia(a, b, tope) {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  const n = a.length, m = b.length;
  let prev2 = null, prev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i]; let min = i;
    for (let j = 1; j <= m; j++) {
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v); if (v < min) min = v;
    }
    if (min > tope) return tope + 1;
    prev2 = prev; prev = cur;
  }
  return prev[m];
}

export function crearCorrector(texto, { propias = {}, textos = [] } = {}) {
  const ws = String(texto || '').split(/\s+/).filter(Boolean);
  const rango = new Map(), porClave = new Map(), porInicio = new Map(), porFonema = new Map();
  ws.forEach((w, i) => {
    if (!rango.has(w)) rango.set(w, i);
    if (i < 25000) { const f = fonema(w); if (!porFonema.has(f)) porFonema.set(f, w); }
    const k = clave(w); if (!porClave.has(k)) porClave.set(k, w);
    const ini = k[0] + k.length; if (!porInicio.has(ini)) porInicio.set(ini, []); porInicio.get(ini).push(w);
  });
  /* Tus palabras: { palabra: veces } (las que aprendió + las de tus datos) */
  const mias = new Map(Object.entries(propias).map(([w, n]) => [w.toLowerCase(), +n || 1]));
  const siguientes = new Map(), primeras = new Map(), uso = new Map();
  textos.forEach((t) => {
    /* Palabras sueltas de tus textos (sin «MiCasa_5G», correos ni enlaces) */
    const ps = (String(t || '').replace(/\S*[@_/\d]\S*/g, ' ').match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g) || []).filter((w) => !/[a-záéíóúüñ][A-ZÁÉÍÓÚÜÑ]/.test(w));
    ps.forEach((w, i) => {
      const l = w.toLowerCase();
      uso.set(l, (uso.get(l) || 0) + 1);
      if (l.length >= 3 && !rango.has(l)) mias.set(l, Math.max(mias.get(l) || 0, 1));
      if (i === 0) primeras.set(w, (primeras.get(w) || 0) + 1);
      else { const p = ps[i - 1].toLowerCase(); if (!siguientes.has(p)) siguientes.set(p, new Map()); const m = siguientes.get(p); m.set(l, (m.get(l) || 0) + 1); }
    });
  });

  const miasClave = new Map();
  const indexar = () => { miasClave.clear(); mias.forEach((n, m) => { const k = clave(m); if (!miasClave.has(k)) miasClave.set(k, m); }); };
  indexar();
  const conocida = (l) => rango.has(l) || mias.has(l);
  /* Rango de uso: lo que TÚ escribes seguido cuenta como muy común */
  const r = (w) => { const base = rango.has(w) ? rango.get(w) : mias.has(w) ? 2500 : 99999, u = (uso.get(w) || 0) + (mias.get(w) || 0); return u ? Math.min(base, Math.round(600 / u)) : base; };

  /* Candidatos a una letra (cambio, falta, sobra, letras cambiadas de lugar) */
  function cercanos(k) {
    const out = [];
    for (let i = 0; i <= k.length; i++) {
      if (i < k.length) out.push([k.slice(0, i) + k.slice(i + 1), 0.8]);                                   // sobra una
      if (i < k.length - 1) out.push([k.slice(0, i) + k[i + 1] + k[i] + k.slice(i + 2), 0.55]);           // cambiadas
      for (const c of ABC) {
        if (i < k.length && c !== k[i]) out.push([k.slice(0, i) + c + k.slice(i + 1), suena(c, k[i]) ? 0.3 : vecinas(c, k[i]) ? 0.45 : 1]);   // otra letra
        out.push([k.slice(0, i) + c + k.slice(i), c === 'h' ? 0.35 : 0.85]);                              // falta una (la h muda casi gratis)
      }
    }
    /* y ↔ ll (yuvia → lluvia, llendo → yendo) */
    for (let i = k.indexOf('y'); i >= 0; i = k.indexOf('y', i + 1)) out.push([k.slice(0, i) + 'll' + k.slice(i + 1), 0.3]);
    for (let i = k.indexOf('ll'); i >= 0; i = k.indexOf('ll', i + 2)) out.push([k.slice(0, i) + 'y' + k.slice(i + 2), 0.3]);
    return out;
  }
  /* Puntaje: menos es mejor. Pesa la frecuencia (log) y el tipo de error */
  const puntaje = (w, costo) => costo * 3 + Math.log2(r(w) + 2);

  function corregir(w, { inicioFrase = false, pregunta = false } = {}) {
    if (!w || w.length < 2 || !LETRA.test(w)) return null;
    const l = w.toLowerCase(), mayus = w.charAt(0) !== l.charAt(0), k = clave(l);
    if (JUNTAS[k] && !mias.has(l)) return conCaso(JUNTAS[k], w);
    /* Después de ¿ o ¡: «que» → «qué» */
    if (pregunta && TILDE_PREGUNTA[k] && l !== TILDE_PREGUNTA[k]) return conCaso(TILDE_PREGUNTA[k], w);
    if (conocida(l)) {
      /* Conocida pero casi siempre se escribe con tilde («mas» → «más») */
      const t = porClave.get(k);
      if (t && t !== l && !mias.has(l) && !SIN_TOCAR.has(l) && r(t) * 5 < r(l) && r(t) < 15000) return conCaso(t, w);
      return null;
    }
    if (mayus && !inicioFrase) return null;            // un nombre propio a mitad de frase
    if (porClave.has(k)) return conCaso(porClave.get(k), w);   // solo faltaban tildes
    if (miasClave.has(k)) return conCaso(miasClave.get(k), w);
    if (mayus || l.length < 3) return null;
    /* Suena igual que una palabra conocida («aser» → «hacer», «resivo» → «recibo») */
    const fon = porFonema.get(fonema(l));
    if (fon && fon !== l) return conCaso(fon, w);
    const tope = l.length < 5 ? 6000 : 25000;
    let mejor = null, pm = Infinity;
    for (const [c, costo] of cercanos(k)) {
      const cand = porClave.get(c) || miasClave.get(c);
      if (!cand || r(cand) >= tope) continue;
      const p = puntaje(cand, costo);
      if (p < pm) { pm = p; mejor = cand; }
    }
    /* Palabras largas: hasta dos errores, entre las de largo parecido */
    if (!mejor && l.length >= 6) {
      for (let d = -2; d <= 2; d++) {
        (porInicio.get(k[0] + (k.length + d)) || []).forEach((cand) => {
          if (r(cand) >= 30000) return;
          const dist = distancia(k, clave(cand), 2);
          if (dist <= 2) { const p = puntaje(cand, dist * 1.1); if (p < pm) { pm = p; mejor = cand; } }
        });
      }
    }
    return mejor ? conCaso(mejor, w) : null;
  }

  /* Hasta n palabras que empiezan como lo que vas escribiendo (las tuyas primero) */
  function sugerir(pre, n = 3) {
    if (!pre) return [];
    const kp = clave(pre), out = [], ya = new Set([pre.toLowerCase()]);
    [...mias.entries()].sort((a, b) => b[1] - a[1]).forEach(([m]) => { if (out.length < 1 && m.length > pre.length && clave(m).startsWith(kp) && !ya.has(m)) { out.push(m); ya.add(m); } });
    for (let i = 0; i < ws.length && out.length < n; i++) {
      const w = ws[i];
      if (!ya.has(w) && w.length > pre.length && clave(w).startsWith(kp)) { out.push(w); ya.add(w); }
    }
    return out.map((w) => conCaso(w, pre));
  }
  /* La palabra que sigue, según cómo escribes tú */
  function predecir(previa, n = 3) {
    if (!previa) return [...primeras.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w);
    const m = siguientes.get(previa.toLowerCase());
    return m ? [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([w]) => w) : [];
  }
  function aprender(w, veces = 1) {
    const l = String(w || '').toLowerCase();
    if (!LETRA.test(l) || l.length < 2) return;
    mias.set(l, (mias.get(l) || 0) + veces);
    if (!miasClave.has(clave(l))) miasClave.set(clave(l), l);
  }
  function olvidar(w) { mias.delete(String(w || '').toLowerCase()); indexar(); }
  return { conocida: (w) => conocida(String(w).toLowerCase()), corregir, sugerir, predecir, aprender, olvidar, tamano: ws.length };
}

/* «cuando» → «Cuándo» si es la palabra que abre una pregunta */
export function tildeInterrogativo(w) { const t = TILDE_PREGUNTA[clave(w)]; return t && t !== String(w).toLowerCase() ? conCaso(t, w) : null; }

/* ¿Qué contexto tiene la palabra que termina en «pos»? */
export function contexto(texto, ini) {
  const previo = texto.slice(0, ini);
  const frase = previo.split(/[.!?\n]/).pop();
  return {
    inicioFrase: !previo.trim() || /[.!?¡¿\n]\s*$/.test(previo),
    pregunta: /[¿¡]\s*$/.test(previo),
    previa: (previo.match(/([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+$/) || [])[1] || '',
    frase
  };
}
/* Al cerrar una pregunta o exclamación sin abrirla: «cuándo vienes?» → «¿cuándo vienes?» */
export function abrirSigno(texto, pos, signo) {
  const abre = signo === '?' ? '¿' : '¡', antes = texto.slice(0, pos);
  const corte = Math.max(antes.lastIndexOf('.'), antes.lastIndexOf('!'), antes.lastIndexOf('?'), antes.lastIndexOf('\n'), antes.lastIndexOf('¡'), antes.lastIndexOf('¿'));
  if (corte >= 0 && antes[corte] === abre) return null;
  let i = corte + 1; while (i < antes.length && antes[i] === ' ') i++;
  if (i >= antes.length) return null;
  return { pos: i, texto: abre };
}
