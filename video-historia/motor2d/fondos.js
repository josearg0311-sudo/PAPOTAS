// Fondos 2D generados con IA (img/fondos/*.png): sustituyen a los edificios dibujados con código.
let FONDOS = {};
function fondo(name, t, tint = 0) { const im = FONDOS[name]; if (!im) return false;
  const s = Math.max(W / im.width, H / im.height); X.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s);
  if (tint) { X.fillStyle = `rgba(0,0,0,${tint})`; X.fillRect(0, 0, W, H); } return true; }
// Estrasburgo 1518
function strasBg(t) { fondo('strasbourg', t); }

// ---- Imágenes 3D realistas (ElevenLabs): img/real/<id_escena>.png sustituye al dibujo de la escena ----
let REAL = {};
function realOn() { return Object.keys(REAL).length > 0; }
function realScene(sc) { const im = REAL[sc.id]; if (!im) return false;
  const s = Math.max(W / im.width, H / im.height) * 1.05; X.imageSmoothingEnabled = true; X.imageSmoothingQuality = 'high';
  X.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s); return true; }
