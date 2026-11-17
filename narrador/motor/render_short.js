// Short vertical de Tommy Charted: node render_short.js <carpeta> <salida.mp4> [--frames=t1,t2]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const DIR = path.resolve(process.argv[2]), out = process.argv[3], FPS = 30;
const TL = JSON.parse(fs.readFileSync(path.join(DIR, 'tl.json'), 'utf8'));
const stills = (process.argv.find(a => a.startsWith('--frames=')) || '').slice(9);
const b64 = (f, m) => `data:${m};base64,` + fs.readFileSync(f).toString('base64');
const RAIZ = path.join(__dirname, '../../video-historia');

const PAGE = `
const W = 1080, H = 1920; let X, TL, IMG = {}, LOGO;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, prog = (t, a, b) => clamp((t - a) / (b - a));
const GOLD = '#FFC93C';
function rng(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; s ^= s >>> 15; return (s >>> 0) / 4294967296; }; }
// cámara: Ken Burns según el tipo de movimiento
const MOVES = { in: [1.04, 1.14, 0, 0], in_fast: [1.0, 1.22, 0, 0], out: [1.16, 1.04, 0, 0], up: [1.12, 1.12, 0, -70], down: [1.12, 1.12, 0, 70] };
function drawImg(sc, t, end) { const im = IMG[sc.img]; const k = ease(prog(t, sc.t, end)); const [z0, z1, dx, dy] = MOVES[sc.move] || MOVES.in;
  let z = lerp(z0, z1, k), ox = lerp(-dx, dx, k), oy = lerp(-dy, dy, k);
  const sh = TL.fx.shake; if (t > sh && t < sh + 1.2) { const a = (1 - prog(t, sh, sh + 1.2)) * 26; ox += Math.sin(t * 90) * a; oy += Math.cos(t * 73) * a; z += .03 * (1 - prog(t, sh, sh + 1.2)); }
  const s = Math.max(W / im.width, H / im.height) * z; X.drawImage(im, W / 2 - im.width * s / 2 + ox, H / 2 - im.height * s / 2 + oy, im.width * s, im.height * s); }
let OFF;
function scenes(t) { const sc = TL.scenes; let k = 0; for (let i = 0; i < sc.length; i++) if (sc[i].t <= t) k = i;
  const end = i => i + 1 < sc.length ? sc[i + 1].t : TL.dur; drawImg(sc[k], t, end(k));
  const fade = .4; if (k > 0 && t < sc[k].t + fade) { if (!OFF) { OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; }
    const m = X; X = OFF.getContext('2d'); drawImg(sc[k - 1], t, end(k - 1)); X = m; X.globalAlpha = 1 - ease(prog(t, sc[k].t, sc[k].t + fade)); X.drawImage(OFF, 0, 0); X.globalAlpha = 1; } }
// teletransporte: anillo dorado + chispas + destello blanco
function teleport(t) { const t0 = TL.fx.teleport, lt = t - t0; if (lt < -.6 || lt > 1.1) return;
  X.save(); X.globalCompositeOperation = 'screen'; const R = rng(7);
  for (let i = 0; i < 160; i++) { const a = R() * 6.283, sp = 300 + R() * 900, r0 = R() * 60, life = .4 + R() * .7, tt = lt + .6;
    if (tt < 0 || tt > life + .6) continue; const d = r0 + sp * Math.pow(tt, .8) * (lt < 0 ? .25 : 1); const x = W / 2 + Math.cos(a) * d, y = H * .5 + Math.sin(a) * d * .9;
    const al = clamp(1 - tt / (life + .6)); X.fillStyle = 'rgba(255,' + (190 + R() * 60 | 0) + ',90,' + al + ')'; X.beginPath(); X.arc(x, y, 2 + R() * 6, 0, 6.283); X.fill(); }
  const ring = prog(lt, -.3, .5); if (ring > 0 && ring < 1) { X.strokeStyle = 'rgba(255,210,110,' + (1 - ring) + ')'; X.lineWidth = 30 * (1 - ring) + 4; X.beginPath(); X.arc(W / 2, H * .5, 80 + ring * 1100, 0, 6.283); X.stroke(); }
  X.restore(); const fl = lt < 0 ? prog(lt, -.25, 0) : 1 - prog(lt, 0, .45); if (fl > 0) { X.fillStyle = 'rgba(255,240,200,' + fl * .95 + ')'; X.fillRect(0, 0, W, H); } }
function grade(t) { const v = X.createRadialGradient(W / 2, H * .45, H * .25, W / 2, H * .5, H * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); X.fillStyle = v; X.fillRect(0, 0, W, H);
  const g = X.createLinearGradient(0, H * .6, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); X.fillStyle = g; X.fillRect(0, H * .6, W, H * .4); }
function wrapWidth(words, size) { X.font = '900 ' + size + 'px Mont'; return words.map(w => X.measureText(w.w.toUpperCase()).width); }
function subs(t) { const [ta, tb] = TL.fx.title; if (t > ta && t < tb) return; const c = TL.chunks.find(c => t >= c.s - .05 && t <= c.e + .25) || null; if (!c) return;
  const pop = ease(prog(t, c.s - .05, c.s + .12)), size = 92; const ws = wrapWidth(c.w, size), sp = 40, tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  const sc = Math.min(1, 980 / tot); let x = W / 2 - tot * sc / 2; X.save(); X.translate(0, 1400); X.scale(1, 1);
  c.w.forEach((w, i) => { const on = t >= w.s && t < w.e + .08; const s = sc * (on ? 1.07 : 1) * (.85 + .15 * pop);
    X.save(); X.translate(x + ws[i] * sc / 2, 0); X.scale(s, s); X.font = '900 ' + size + 'px Mont'; X.textAlign = 'center'; X.textBaseline = 'middle';
    X.lineJoin = 'round'; X.lineWidth = 18; X.strokeStyle = '#000'; X.strokeText(w.w.toUpperCase(), 0, 0); X.fillStyle = on ? GOLD : '#fff'; X.fillText(w.w.toUpperCase(), 0, 0); X.restore(); x += (ws[i] + sp) * sc; });
  X.restore(); }
function pill(txt, y, a, bg, fg, size) { if (a <= 0) return; X.save(); X.globalAlpha = a; X.font = '900 ' + size + 'px Mont'; const w = X.measureText(txt).width + 70, h = size * 1.5;
  X.translate(W / 2, y); X.scale(.8 + .2 * a, .8 + .2 * a); X.fillStyle = bg; X.beginPath(); X.roundRect(-w / 2, -h / 2, w, h, h / 2); X.fill();
  X.fillStyle = fg; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText(txt, 0, 4); X.restore(); }
function overlays(t) { // logo arriba, título de la frase de marca y tarjeta con el nombre
  X.save(); X.globalAlpha = .95; X.drawImage(LOGO, W / 2 - 75, 70, 150, 150); X.restore();
  const [a, b] = TL.fx.title; pill('¿ACASO LO SABÍAS?', 1400, Math.min(prog(t, a, a + .25), 1 - prog(t, b - .2, b)), GOLD, '#111', 84);
  const n = TL.fx.name; const na = Math.min(prog(t, n, n + .4), 1 - prog(t, TL.dur - .5, TL.dur));
  if (na > 0) { pill('TOMMY CHARTED', 1610, na, 'rgba(10,10,14,.85)', GOLD, 64); X.save(); X.globalAlpha = na; X.font = '800 34px Mont'; X.fillStyle = '#fff'; X.textAlign = 'center'; X.fillText('VIAJERO DEL TIEMPO', W / 2, 1700); X.restore(); }
  const p = t / TL.dur; X.fillStyle = 'rgba(255,255,255,.25)'; X.fillRect(0, H - 12, W, 12); X.fillStyle = GOLD; X.fillRect(0, H - 12, W * p, 12); }
function frame(t) { X.fillStyle = '#000'; X.fillRect(0, 0, W, H); scenes(t); grade(t); teleport(t); overlays(t); subs(t);
  const a = Math.min(prog(t, 0, .3), 1 - prog(t, TL.dur - .5, TL.dur)); if (a < 1) { X.fillStyle = 'rgba(0,0,0,' + (1 - a) + ')'; X.fillRect(0, 0, W, H); } }
`;

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const f9 = b64(path.join(RAIZ, 'fuentes/montserrat-latin-900-normal.woff'), 'font/woff'), f8 = b64(path.join(RAIZ, 'fuentes/montserrat-latin-800-normal.woff'), 'font/woff');
  await p.setContent(`<html><head><style>@font-face{font-family:Mont;font-weight:900;src:url(${f9})}@font-face{font-family:Mont;font-weight:800;src:url(${f8})}body{margin:0}</style></head><body><canvas id=c width=1080 height=1920></canvas><script>${PAGE}
    X = document.getElementById('c').getContext('2d');
    window.init = async (tl, imgs, lg) => { TL = tl; await document.fonts.load('900 40px Mont'); await document.fonts.load('800 40px Mont');
      for (const [k, v] of Object.entries(imgs)) { const im = new Image(); im.src = v; await im.decode(); IMG[k] = im; } LOGO = new Image(); LOGO.src = lg; await LOGO.decode(); };
    window.render = t => { frame(t); return document.getElementById('c').toDataURL('image/jpeg', .92); };</script></body></html>`);
  p.on('pageerror', e => { console.error('ERROR en página:', e.message); process.exit(1); });
  const imgs = Object.fromEntries(TL.scenes.map(s => [s.img, b64(path.join(DIR, s.img), 'image/jpeg')]));
  await p.evaluate(([tl, im, lg]) => init(tl, im, lg), [TL, imgs, b64(path.join(RAIZ, 'img/logo.png'), 'image/png')]);
  if (stills) { for (const s of stills.split(',')) { const d = await p.evaluate(t => render(t), +s); fs.writeFileSync(`${out}_${s}.jpg`, Buffer.from(d.split(',')[1], 'base64')); } await b.close(); return; }
  const audio = fs.existsSync(path.join(DIR, 'mezcla.wav')) ? path.join(DIR, 'mezcla.wav') : path.join(DIR, 'voz.mp3');
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-', '-i', audio,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < Math.round(TL.dur * FPS); i++) { const d = await p.evaluate(t => render(t), i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('Listo:', out);
})();
