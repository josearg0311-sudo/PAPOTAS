/* DICTAR POR VOZ (si el navegador lo permite, p. ej. Chrome en Android):
   lo que dices se escribe en el campo, en español de Perú. */
const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const puedeDictar = () => !!SR;

/* Escucha y va escribiendo en «campo». Devuelve una función para detener. */
export function dictar(campo, { alCambiar, alTerminar } = {}) {
  const rec = new SR();
  rec.lang = 'es-PE'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  const base = campo.value ? campo.value.replace(/\s*$/, ' ') : '';
  rec.onresult = (ev) => {
    let t = '';
    for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
    campo.value = base + t.trim();
    if (alCambiar) alCambiar(campo.value, ev.results[ev.results.length - 1].isFinal);
  };
  rec.onerror = (ev) => { if (alTerminar) alTerminar(ev.error === 'not-allowed' ? 'Permite el micrófono para dictar.' : ev.error === 'no-speech' ? 'No te escuché. Intenta de nuevo.' : 'No se pudo dictar.'); };
  rec.onend = () => { if (alTerminar) alTerminar(''); };
  try { rec.start(); } catch (e) { if (alTerminar) alTerminar('No se pudo usar el micrófono.'); }
  return () => { try { rec.stop(); } catch (e) { /* nada */ } };
}

/* «almuerzo 15 soles» → { monto: '15', texto: 'almuerzo' } (para gastos dictados) */
export function separarMonto(t) {
  const m = String(t).match(/(?:s\/\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:soles|sol|lucas|luca)?/i);
  if (!m) return { monto: '', texto: String(t).trim() };
  return { monto: m[1].replace(',', '.'), texto: (String(t).slice(0, m.index) + ' ' + String(t).slice(m.index + m[0].length)).replace(/\s+/g, ' ').replace(/\b(de|en|por)\s*$/i, '').trim() };
}
