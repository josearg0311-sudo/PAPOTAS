// Short vertical con la identidad de marca de "¿Acaso lo sabías?"
// node render_marca.js <carpeta> <salida.mp4> [--frames=t1,t2]
// La carpeta tiene tl.json (de linea.py) con escenas, subtítulos y fx: sello, salto, lugar, serie, fin.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const DIR = path.resolve(process.argv[2]), out = process.argv[3], FPS = 30;
const TL = JSON.parse(fs.readFileSync(path.join(DIR, 'tl.json'), 'utf8'));
const stills = (process.argv.find(a => a.startsWith('--frames=')) || '').slice(9);
const b64 = (f, m) => `data:${m};base64,` + fs.readFileSync(f).toString('base64');
const RAIZ = path.join(__dirname, '../recursos');

const PAGE = `
const W = 1080, H = 1920; let X, TL, IMG = {}, LOGO;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, prog = (t, a, b) => clamp((t - a) / (b - a));
const back = k => 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
const GOLD = '#FFC93C', INK = '#0d0c0b', CREAM = '#F3E9D2';
function rng(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; s ^= s >>> 15; return (s >>> 0) / 4294967296; }; }
const MOVES = { in: [1.04, 1.14, 0, 0], in_fast: [1.0, 1.2, 0, 0], out: [1.16, 1.04, 0, 0], up: [1.12, 1.12, 0, -70], down: [1.12, 1.12, 0, 70] };
let SHAKE = 0;
function drawImg(sc, t, end, ctx) { const im = IMG[sc.img]; const k = ease(prog(t, sc.t, end)); const [z0, z1, dx, dy] = MOVES[sc.move] || MOVES.in;
  let z = lerp(z0, z1, k), ox = lerp(-dx, dx, k), oy = lerp(-dy, dy, k);
  if (TL.estilo === 'vivo' || TL.estilo === 'stopmotion') { const lt = t - sc.t, pu = Math.exp(-lt * 5) * .07; z += pu; ox += Math.sin(t * .9) * 10 + Math.sin(t * 2.3) * 4; oy += Math.cos(t * .7) * 9; }
  for (const sh of TL.fx.shake || []) if (t > sh && t < sh + 1.2) { const a = (1 - prog(t, sh, sh + 1.2)) * 28; ox += Math.sin(t * 90) * a; oy += Math.cos(t * 73) * a; z += .03 * (1 - prog(t, sh, sh + 1.2)); }
  const s = Math.max(W / im.width, H / im.height) * z; ctx.save(); if (TL.estilo === 'vivo' || TL.estilo === 'stopmotion') { ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(t * .5) * .008); ctx.translate(-W / 2, -H / 2); }
  if (sc.frames) clip(ctx, sc, t);
  else if (sc.fondo) capas(ctx, sc, t, end, z, ox, oy);
  else if (sc.layout === 'vinetas') vinetas(ctx, im, sc, t, end); else ctx.drawImage(im, W / 2 - im.width * s / 2 + ox, H / 2 - im.height * s / 2 + oy, im.width * s, im.height * s); ctx.restore(); }
function cover(ctx, im, z, ox, oy) { const s = Math.max(W / im.width, H / im.height) * z; ctx.drawImage(im, W / 2 - im.width * s / 2 + ox, H / 2 - im.height * s / 2 + oy, im.width * s, im.height * s); }
// CLIP animado con IA: secuencia de fotogramas (se congela en el último si la escena dura más)
function clip(ctx, sc, t) { const lt = t - sc.t, n = sc.frames.length, i = Math.min(n - 1, Math.max(0, Math.floor(lt * (sc.fps || 24))));
  const extra = Math.max(0, lt - n / (sc.fps || 24)); cover(ctx, IMG[sc.frames[i]], 1.02 + extra * .02, 0, 0); }
// CAPAS 2.5D: fondo lento + personaje recortado con movimiento propio (entra, respira, se balancea, tiembla)
function capas(ctx, sc, t, end, z, ox, oy) { const lt = t - sc.t, bg = IMG[sc.fondo], pj = IMG[sc.pj];
  cover(ctx, bg, 1.03 + (z - 1) * .5, ox * .4, oy * .4);
  if (sc.niebla) { ctx.save(); ctx.filter = 'blur(45px)'; ctx.globalAlpha = .22; ctx.fillStyle = '#c9c2bb'; for (let i = 0; i < 6; i++) { const x = ((i * 300 + t * 60) % (W + 600)) - 300; ctx.beginPath(); ctx.ellipse(x, H * (.55 + .07 * Math.sin(i)), 380, 90, 0, 0, 6.283); ctx.fill(); } ctx.restore(); }
  const ent = back(prog(lt, 0, .55)), dir = sc.entra === 'der' ? 1 : -1, br = 1 + .014 * Math.sin(t * 2.4), sway = Math.sin(t * 1.3) * .012;
  const nerv = sc.nervio ? Math.sin(t * 37) * 2.5 : 0, zz = z * 1.04 + .05 * prog(lt, 0, end - sc.t), s = Math.max(W / pj.width, H / pj.height) * zz;
  const fade = sc.entra === 'fade', mv = fade ? .35 : 1.5; ctx.save(); if (fade) ctx.globalAlpha = prog(lt, 0, .5);
  ctx.translate(W / 2 + ox * mv + (fade ? 0 : (1 - ent) * dir * 500) + nerv, H + oy * (fade ? .3 : 1.2)); ctx.rotate(fade ? sway * .5 : sway); ctx.scale(1, br);
  ctx.drawImage(pj, -pj.width * s / 2, -H / 2 - pj.height * s / 2, pj.width * s, pj.height * s); ctx.restore(); }
// 2) VIÑETAS: la escena se arma como una página de cómic (plano general + dos detalles)
function vinetas(ctx, im, sc, t, end) { const d = end - sc.t, lt = t - sc.t; const s0 = Math.max(W / im.width, H / im.height) * 1.15;
  ctx.save(); ctx.filter = 'blur(14px) brightness(.45)'; ctx.drawImage(im, W / 2 - im.width * s0 / 2, H / 2 - im.height * s0 / 2, im.width * s0, im.height * s0); ctx.restore();
  const P = [ { r: [40, 110, W - 80, 820], c: [0, .22, 1, .5], t0: 0 }, { r: [40, 950, W / 2 - 55, 820], c: [.05, .45, .5, .5], t0: Math.min(.7, d * .15) }, { r: [W / 2 + 15, 950, W / 2 - 55, 820], c: [.5, .5, .5, .5], t0: Math.min(1.3, d * .28) } ];
  P.forEach((p, i) => { const a = prog(lt, p.t0, p.t0 + .35); if (a <= 0) return; const [x, y, w, h] = p.r, sl = (1 - back(a)) * (i === 0 ? -300 : 300);
    ctx.save(); ctx.translate(sl * (i === 2 ? 1 : i === 1 ? -1 : 0), i === 0 ? sl * .6 : 0); ctx.globalAlpha = clamp(a * 2);
    ctx.fillStyle = INK; ctx.fillRect(x - 10, y - 10, w + 20, h + 20); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const own = i > 0 && sc.det && IMG[sc.det[i - 1]], src = own || im, [cx, cy, cw, ch] = own ? [0, 0, 1, 1] : p.c;
    const pz = 1 + .08 * prog(lt, p.t0, d), sw = src.width * cw, sh = src.height * ch, sca = Math.max(w / sw, h / sh) * pz;
    ctx.drawImage(src, src.width * cx, src.height * cy, sw, sh, x + w / 2 - sw * sca / 2 + Math.sin(lt * .6 + i) * 8, y + h / 2 - sh * sca / 2, sw * sca, sh * sca); ctx.restore(); }); }
// 3) partículas de ambiente según la escena (lluvia, brasas, polvo, salpicaduras)
function ambiente(t) { const sc = TL.scenes; let k = 0; for (let i = 0; i < sc.length; i++) if (sc[i].t <= t) k = i; const tipo = sc[k].amb; if (!tipo || TL.estilo === 'vinetas') return;
  const R = rng(k * 7 + 3); X.save();
  for (let i = 0; i < (tipo === 'lluvia' ? 140 : 70); i++) { const sx = R() * W, sy = R() * H, sp = .4 + R() * .8;
    if (tipo === 'lluvia') { const y = (sy + t * 1900 * sp) % H, x = (sx + t * 160 * sp) % W; X.strokeStyle = 'rgba(220,230,255,.35)'; X.lineWidth = 2; X.beginPath(); X.moveTo(x, y); X.lineTo(x + 9, y + 42); X.stroke(); }
    else if (tipo === 'brasas') { const y = H - ((sy + t * 120 * sp) % H), x = sx + Math.sin(t * 2 + i) * 30; X.fillStyle = 'rgba(255,' + (140 + R() * 90 | 0) + ',60,' + (.4 + .5 * Math.abs(Math.sin(t * 3 + i))) + ')'; X.beginPath(); X.arc(x, y, 2 + R() * 3, 0, 6.283); X.fill(); }
    else if (tipo === 'salpicaduras') { const y = (sy + t * 900 * sp) % H, x = sx + Math.sin(t + i) * 40; X.fillStyle = 'rgba(70,40,20,.55)'; X.beginPath(); X.ellipse(x, y, 5 + R() * 6, 8 + R() * 10, .3, 0, 6.283); X.fill(); }
    else { const y = (sy - t * 25 * sp + H) % H, x = (sx + Math.sin(t * .4 + i) * 40 + W) % W; X.fillStyle = 'rgba(255,240,210,' + (.15 + .25 * Math.abs(Math.sin(t + i))) + ')'; X.beginPath(); X.arc(x, y, 1.5 + R() * 2.5, 0, 6.283); X.fill(); } }
  X.restore(); if (sc[k].luz) { const f = .06 + .05 * Math.sin(t * 13) * Math.sin(t * 7.1); X.fillStyle = 'rgba(255,170,80,' + f + ')'; X.fillRect(0, 0, W, H); } }
// Transición de marca: mancha de tinta que se expande y descubre la escena nueva
function blob(ctx, cx, cy, r, seed) { const R = rng(seed); ctx.beginPath(); const n = 40;
  for (let i = 0; i <= n; i++) { const a = i / n * 6.283, rr = r * (1 + .16 * Math.sin(a * 5 + seed) + .1 * Math.sin(a * 11 + seed * 2) + .05 * (R() - .5)); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.closePath(); }
let OFF;
function scenes(t) { const sc = TL.scenes; let k = 0; for (let i = 0; i < sc.length; i++) if (sc[i].t <= t) k = i;
  const end = i => i + 1 < sc.length ? sc[i + 1].t : TL.dur; const dur = .45;
  if (k > 0 && t < sc[k].t + dur && sc[k].t !== TL.fx.salto) { drawImg(sc[k - 1], t, end(k - 1), X);
    if (!OFF) { OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; } const o = OFF.getContext('2d'); o.clearRect(0, 0, W, H); drawImg(sc[k], t, end(k), o);
    const p = ease(prog(t, sc[k].t, sc[k].t + dur)), R = rng(k * 13 + 5), cx = W * (.3 + .4 * R()), cy = H * (.3 + .4 * R());
    X.save(); blob(X, cx, cy, p * 1500, k * 3 + 1); X.clip(); X.drawImage(OFF, 0, 0); X.restore();
    X.save(); X.globalAlpha = (1 - p) * .9; X.lineWidth = 26; X.strokeStyle = INK; blob(X, cx, cy, p * 1500, k * 3 + 1); X.stroke(); X.restore();
  } else drawImg(sc[k], t, end(k), X); }
// Textura de marca: semitono + grano + viñeta
let HALF, GRN;
function texture(t) { if (!HALF) { HALF = document.createElement('canvas'); HALF.width = W; HALF.height = H; const h = HALF.getContext('2d'); h.fillStyle = 'rgba(0,0,0,.5)';
    for (let y = 0; y < H; y += 9) for (let x = (y / 9 % 2) * 4.5; x < W; x += 9) { h.beginPath(); h.arc(x, y, 1.6, 0, 6.283); h.fill(); }
    GRN = []; for (let f = 0; f < 4; f++) { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'), R = rng(f + 1), im = g.createImageData(540, 960);
      for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (R() - .5) * 90; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); GRN.push(c); } }
  X.save(); X.globalCompositeOperation = 'multiply'; X.globalAlpha = .05; X.drawImage(HALF, 0, 0); X.globalCompositeOperation = 'overlay'; X.globalAlpha = .16; X.drawImage(GRN[Math.floor(t * 12) % 4], 0, 0, W, H); X.restore();
  const v = X.createRadialGradient(W / 2, H * .45, H * .22, W / 2, H * .5, H * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.62)'); X.fillStyle = v; X.fillRect(0, 0, W, H);
  const g = X.createLinearGradient(0, H * .62, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); X.fillStyle = g; X.fillRect(0, H * .62, W, H * .38); }
// Marco de viñeta de cómic (firma visual permanente)
function panel() { X.save(); X.strokeStyle = CREAM; X.globalAlpha = .9; X.lineWidth = 5; X.strokeRect(26, 26, W - 52, H - 52); X.globalAlpha = 1; X.strokeStyle = INK; X.lineWidth = 26; X.strokeRect(13, 13, W - 26, H - 26); X.restore(); }
// SELLO "¿?" que golpea la pantalla con la frase de marca
function sello(t, cx, cy, sc0) { const t0 = TL.fx.sello, t1 = TL.fx.salto; if (t < t0 || t > t1 + .15) return; const out = prog(t, t1 - .05, t1 + .15);
  const k = prog(t, t0, t0 + .28), s = (k < 1 ? lerp(2.4, 1, ease(k)) : 1) * (sc0 || 1), rot = -.21 + .06 * ease(k);
  X.save(); X.translate(cx, cy); X.rotate(rot); X.scale(s, s); X.globalAlpha = clamp(k * 3) * (1 - out); X.scale(1 + out * .6, 1 + out * .6);
  const r = 230; X.fillStyle = GOLD; X.beginPath(); X.arc(0, 0, r, 0, 6.283); X.fill();
  X.lineWidth = 10; X.strokeStyle = INK; X.beginPath(); X.arc(0, 0, r - 18, 0, 6.283); X.stroke(); X.lineWidth = 4; X.beginPath(); X.arc(0, 0, r - 62, 0, 6.283); X.stroke();
  X.fillStyle = INK; X.font = '900 34px Mont'; X.textAlign = 'center'; X.textBaseline = 'middle'; const txt = '¿ACASO LO SABÍAS? ★ ¿ACASO LO SABÍAS? ★ ';
  for (let i = 0; i < txt.length; i++) { const a = -Math.PI / 2 + i / txt.length * 6.283; X.save(); X.rotate(a + Math.PI / 2); X.translate(0, -(r - 41)); X.fillText(txt[i], 0, 0); X.restore(); }
  X.font = '900 230px Mont'; X.fillText('¿?', 0, 12); X.restore();
  if (k > 0 && k < 1) SHAKE = Math.max(SHAKE, 0); const imp = prog(t, t0 + .24, t0 + .5); if (imp > 0 && imp < 1) { X.save(); X.globalAlpha = (1 - imp) * .5; X.fillStyle = GOLD; X.fillRect(0, 0, W, H); X.restore(); } }
// SALTO: entramos por el punto del "?" (transición de marca hacia la historia)
function salto(t) { const t0 = TL.fx.salto, lt = t - t0; if (lt < -.05 || lt > .9) return;
  const k = prog(lt, 0, .55); X.save(); X.translate(W / 2, H * .42); const s = lerp(1, 40, Math.pow(k, 2.2)); X.scale(s, s);
  X.fillStyle = GOLD; X.font = '900 420px Mont'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.globalAlpha = clamp(lt * 8) * (1 - prog(lt, .55, .9)); X.fillText('?', 0, 0); X.restore();
  const f = lt < .5 ? prog(lt, .35, .5) : 1 - prog(lt, .5, .9); X.fillStyle = 'rgba(255,201,60,' + f + ')'; X.fillRect(0, 0, W, H); }
// Rótulo de lugar y fecha, estilo máquina de escribir sobre cinta negra
function lugar(t) { const L = TL.fx.lugar; if (!L || t < L.t || t > L.t + 3.6) return; const a = Math.min(prog(t, L.t, L.t + .2), 1 - prog(t, L.t + 3.2, L.t + 3.6));
  const n1 = Math.floor((t - L.t - .15) * 24), l1 = L.l1.slice(0, clamp(n1, 0, 99)), l2 = L.l2.slice(0, clamp(n1 - L.l1.length - 3, 0, 99));
  X.save(); X.globalAlpha = a; X.translate(70, 300); X.rotate(-.025); X.fillStyle = 'rgba(13,12,11,.88)'; X.fillRect(0, 0, 640, 150); X.fillStyle = GOLD; X.fillRect(0, 0, 14, 150);
  X.font = '900 58px Mont'; X.fillStyle = CREAM; X.textBaseline = 'top'; X.fillText(l1, 40, 18); X.font = '800 40px Mont'; X.fillStyle = GOLD; X.fillText(l2, 40, 88);
  if (Math.floor(t * 3) % 2 === 0 && n1 < L.l1.length + L.l2.length + 6) { X.fillStyle = CREAM; X.fillRect(40 + X.measureText(l2).width + 6, 92, 22, 38); } X.restore(); }
// Subtítulos de marca: cinta negra ligeramente inclinada, palabra activa en dorado
function wd(words, size) { X.font = '900 ' + size + 'px Mont'; return words.map(w => X.measureText(w.w.toUpperCase()).width); }
function subs(t) { if (t > TL.fx.sello - .05 && t < TL.fx.sello + 1.4) return; if (TL.fx.fin && t > TL.fx.fin) return;
  const c = TL.chunks.find(c => t >= c.s - .05 && t <= c.e + .25); if (!c) return;
  const pop = ease(prog(t, c.s - .05, c.s + .12)), size = 80, ws = wd(c.w, size), sp = 28, tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1), sc = Math.min(1, 900 / tot);
  X.save(); X.translate(W / 2, 1460); X.rotate(-.022); X.scale(sc * (.9 + .1 * pop), sc * (.9 + .1 * pop));
  X.fillStyle = 'rgba(13,12,11,.92)'; X.fillRect(-tot / 2 - 36, -66, tot + 72, 132); X.fillStyle = GOLD; X.fillRect(-tot / 2 - 36, 56, tot + 72, 10);
  let x = -tot / 2; c.w.forEach((w, i) => { const on = t >= w.s && t < w.e + .08; X.font = '900 ' + size + 'px Mont'; X.textBaseline = 'middle'; X.textAlign = 'left';
    X.fillStyle = on ? GOLD : CREAM; X.fillText(w.w.toUpperCase(), x, 4); x += ws[i] + sp; }); X.restore(); }
function serie(t) { const S = TL.fx.serie; if (!S) return; X.save(); X.font = '900 34px Mont'; const w = X.measureText(S).width + 50; X.translate(W - 60 - w, 70);
  X.fillStyle = 'rgba(13,12,11,.85)'; X.fillRect(0, 0, w, 64); X.fillStyle = TL.fx.color || GOLD; X.fillRect(0, 58, w, 6); X.fillStyle = CREAM; X.textBaseline = 'middle'; X.fillText(S, 25, 33); X.restore();
  X.save(); X.globalAlpha = .95; X.drawImage(LOGO, 52, 52, 120, 120); X.restore(); }
// Cierre de marca
function fin(t) { const f = TL.fx.fin; if (!f || t < f) return; const k = ease(prog(t, f, f + .35));
  X.save(); X.globalAlpha = k; X.fillStyle = INK; X.fillRect(0, 0, W, H); X.restore(); if (k < .05) return;
  X.save(); X.globalAlpha = k; X.drawImage(HALF, 0, 0); X.restore();
  const s = back(prog(t, f + .15, f + .6)); X.save(); X.translate(W / 2, 760); X.scale(s, s); X.drawImage(LOGO, -230, -230, 460, 460); X.restore();
  X.save(); X.globalAlpha = prog(t, f + .5, f + .8); X.textAlign = 'center'; X.font = '900 92px Mont'; X.fillStyle = CREAM; X.fillText('¿Y TÚ,', W / 2, 1180); X.fillStyle = GOLD; X.fillText('LO SABÍAS?', W / 2, 1290);
  X.font = '800 44px Mont'; X.fillStyle = CREAM; X.fillText('Te leo en los comentarios', W / 2, 1390); X.restore();
  const b = back(prog(t, f + .9, f + 1.3)); X.save(); X.translate(W / 2, 1560); X.scale(b, b); X.fillStyle = GOLD; X.beginPath(); X.roundRect(-250, -60, 500, 120, 60); X.fill();
  X.fillStyle = INK; X.font = '900 54px Mont'; X.textAlign = 'center'; X.textBaseline = 'middle'; X.fillText('SUSCRÍBETE', 0, 4); X.restore(); }
function barra(t) { const p = t / TL.dur; X.fillStyle = 'rgba(243,233,210,.2)'; X.fillRect(26, H - 40, W - 52, 10); X.fillStyle = GOLD; X.fillRect(26, H - 40, (W - 52) * p, 10); }
// STOP-MOTION: la imagen avanza "a pasos" (12 por segundo) con un leve temblor de cámara hecho a mano;
// los textos de marca y subtítulos siguen fluidos para leerse bien.
function paso(t) { return TL.estilo === 'stopmotion' ? Math.floor(t * 12) / 12 : t; }
function frame(t) { X.fillStyle = INK; X.fillRect(0, 0, W, H); const tq = paso(t);
  X.save(); if (TL.estilo === 'stopmotion') { const R = rng(Math.floor(t * 12) + 7); X.translate(W / 2 + (R() - .5) * 5, H / 2 + (R() - .5) * 5); X.rotate((R() - .5) * .004); X.translate(-W / 2, -H / 2); }
  scenes(tq); ambiente(tq); X.restore(); texture(t);
  if (!(TL.fx.fin && t > TL.fx.fin + .35)) { serie(t); lugar(t); sello(t, W / 2, H * .42); subs(t); } salto(t); fin(t); panel(); barra(t);
  const a = Math.min(prog(t, 0, .25), 1 - prog(t, TL.dur - .4, TL.dur)); if (a < 1) { X.fillStyle = 'rgba(0,0,0,' + (1 - a) + ')'; X.fillRect(0, 0, W, H); } }
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
  const imgs = Object.fromEntries(TL.scenes.flatMap(s => [s.img, ...(s.det || []), ...(s.frames || []), s.fondo, s.pj]).filter(Boolean).map(f => [f, b64(path.join(DIR, f), f.endsWith('.png') ? 'image/png' : 'image/jpeg')]));
  await p.evaluate(([tl, im, lg]) => init(tl, im, lg), [TL, imgs, b64(path.join(RAIZ, 'logo.png'), 'image/png')]);
  if (stills) { for (const s of stills.split(',')) { const d = await p.evaluate(t => render(t), +s); fs.writeFileSync(`${out}_${s}.jpg`, Buffer.from(d.split(',')[1], 'base64')); } await b.close(); return; }
  const audio = fs.existsSync(path.join(DIR, 'mezcla.wav')) ? path.join(DIR, 'mezcla.wav') : path.join(DIR, 'voz.mp3');
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-', '-i', audio,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < Math.round(TL.dur * FPS); i++) { const d = await p.evaluate(t => render(t), i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('Listo:', out);
})();
