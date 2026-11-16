// Caja de herramientas de dibujo 2D (canvas) para las escenas de "¿Acaso lo sabías?"
const W = 1920, H = 1080;
const GOLD = '#ffc42e';
let X; // contexto 2D
function setCtx(c) { X = c; }

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => x * x * (3 - 2 * x);
const easeOut = x => 1 - Math.pow(1 - x, 3);
const back = x => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;
function rng(seed) { let s = (Math.imul((seed | 0) + 0x9e3779b9, 0x85ebca6b) ^ ((seed | 0) * 2654435761)) >>> 0 || 1; s = (Math.imul(s ^ (s >>> 13), 0xc2b2ae35)) >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const m = v => Math.round(clamp(f < 0 ? v * (1 + f) : v + (255 - v) * f, 0, 255));
  return `rgb(${m(r)},${m(g)},${m(b)})`; }

// ---------- fondos ----------
function sky(stops) { const g = X.createLinearGradient(0, 0, 0, H); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); X.fillStyle = g; X.fillRect(-200, -200, W + 400, H + 400); }
const SKY = {
  sunset: ['#1b1440', '#6b2c5c', '#e0663a', '#ffc46b'],
  dawn: ['#20325e', '#6f6ea8', '#f2a37a', '#ffe0a8'],
  day: ['#2b6cc4', '#5aa0e6', '#a8d4f5', '#e8f4ff'],
  night: ['#03050f', '#0b1230', '#1a2550', '#2a3360'],
  storm: ['#0d1117', '#1f2733', '#3a4452', '#59626e'],
  desert: ['#3a6db5', '#86b6e0', '#f3d9a6', '#f7c27a'],
  arctic: ['#2a3b55', '#5c7894', '#b9cfe0', '#e9f2f8'],
  indoor: ['#1a0f08', '#2e1a0d', '#4a2c16', '#2a170b'],
  stage: ['#050208', '#14061a', '#2a0b2a', '#120410'],
};
function sun(x, y, r, col = '#fff1b8', glow = '#ffb347') { r = Math.max(1, r);
  const g = X.createRadialGradient(x, y, 0, x, y, r * 6);
  g.addColorStop(0, rgba('#ffffff', 0.9)); g.addColorStop(0.15, rgba(glow, 0.55)); g.addColorStop(1, rgba(glow, 0));
  X.fillStyle = g; X.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
  X.fillStyle = col; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill();
}
function moon(x, y, r) { X.save(); X.shadowColor = '#cfe0ff'; X.shadowBlur = 60; X.fillStyle = '#eef3ff'; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); X.restore();
  X.fillStyle = 'rgba(150,160,190,.35)'; [[.3, -.2, .18], [-.25, .25, .12], [.1, .35, .09]].forEach(([a, b, c]) => { X.beginPath(); X.arc(x + a * r, y + b * r, c * r, 0, 7); X.fill(); }); }
function stars(n, seed, t, maxY = H) { const R = rng(seed); for (let i = 0; i < n; i++) { const x = R() * W, y = R() * maxY, s = R() * 2 + .4, ph = R() * 6;
  X.fillStyle = `rgba(255,255,255,${.35 + .45 * Math.abs(Math.sin(t * 1.5 + ph))})`; X.fillRect(x, y, s, s); } }
function cloud(x, y, s, col = 'rgba(255,255,255,.85)') { X.fillStyle = col;
  [[-60, 10, 45], [-15, -15, 60], [45, 0, 50], [90, 15, 35], [10, 22, 45]].forEach(([a, b, r]) => { X.beginPath(); X.arc(x + a * s, y + b * s, r * s, 0, 7); X.fill(); }); }
function clouds(t, seed, col, y0 = 80, y1 = 380, n = 6, speed = 12) { const R = rng(seed);
  for (let i = 0; i < n; i++) { const s = .6 + R() * 1.4, y = y0 + R() * (y1 - y0), sp = speed * (.5 + R());
    const x = ((R() * (W + 600) + t * sp) % (W + 600)) - 300; cloud(x, y, s, col); } }
function mountains(seed, baseY, amp, col, n = 9, jag = .5) { const R = rng(seed); X.fillStyle = col; X.beginPath(); X.moveTo(-200, H + 50); X.lineTo(-200, baseY);
  const pts = n * 3; for (let i = 0; i <= pts; i++) { const x = -200 + (W + 400) * i / pts; const peak = i % 3 === 1;
    X.lineTo(x, baseY - (peak ? amp * (.55 + R() * .45) : amp * R() * jag * .5)); }
  X.lineTo(W + 200, H + 50); X.closePath(); X.fill(); }
function snowcaps(seed, baseY, amp, n = 9) { /* simple: overlay light gradient on top part */ }
function hills(baseY, amp, col, freq = 1, ph = 0) { X.fillStyle = col; X.beginPath(); X.moveTo(-200, H + 50);
  for (let x = -200; x <= W + 200; x += 20) X.lineTo(x, baseY - amp * (Math.sin(x / 300 * freq + ph) * .5 + Math.sin(x / 130 * freq + ph * 2) * .2));
  X.lineTo(W + 200, H + 50); X.fill(); }
function ground(y, top, bot) { const g = X.createLinearGradient(0, y, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); X.fillStyle = g; X.fillRect(-200, y, W + 400, H - y + 200); }
function sea(y, t, c1 = '#1a6fa8', c2 = '#062b4a', glint = '#ffd58a') { ground(y, c1, c2);
  X.strokeStyle = 'rgba(255,255,255,.25)'; X.lineWidth = 2;
  for (let r = 0; r < 14; r++) { const yy = y + 8 + r * r * 3.2; X.beginPath();
    for (let x = -50; x < W + 50; x += 30) { const v = Math.sin(x / 60 + t * 2 + r) * (2 + r * .4); x === -50 ? X.moveTo(x, yy + v) : X.lineTo(x, yy + v); } X.stroke(); }
  X.fillStyle = rgba(glint, .25); for (let i = 0; i < 40; i++) { const xx = (i * 137 + t * 30) % W, yy = y + 10 + (i * 53) % (H - y); X.fillRect(xx, yy, 30 + (i % 3) * 20, 2); } }
function particles(t, n, seed, col, kind = 'dust') { const R = rng(seed);
  for (let i = 0; i < n; i++) { const x0 = R() * W, y0 = R() * H, s = R() * 3 + 1, sp = 20 + R() * 40, ph = R() * 6;
    let x, y; if (kind === 'snow') { x = (x0 + Math.sin(t + ph) * 30) % W; y = (y0 + t * sp) % H; }
    else if (kind === 'embers') { x = (x0 + Math.sin(t * .7 + ph) * 40) % W; y = (y0 - t * sp + H * 10) % H; }
    else { x = (x0 + t * sp * .5) % W; y = y0 + Math.sin(t * .5 + ph) * 20; }
    X.fillStyle = rgba(col, .25 + .35 * Math.abs(Math.sin(t + ph))); X.beginPath(); X.arc(x, y, s, 0, 7); X.fill(); } }
function rays(x, y, col, t, n = 14, len = 1600, a = .12) { X.save(); X.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const ang = i / n * Math.PI * 2 + t * .05; const w = .05 + .03 * Math.sin(t + i);
    X.fillStyle = rgba(col, a * (.6 + .4 * Math.sin(t * .8 + i * 1.7))); X.beginPath(); X.moveTo(x, y);
    X.lineTo(x + Math.cos(ang - w) * len, y + Math.sin(ang - w) * len); X.lineTo(x + Math.cos(ang + w) * len, y + Math.sin(ang + w) * len); X.fill(); }
  X.restore(); }
function glow(x, y, r, col, a = .5) { r = Math.max(1, r); const g = X.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); X.fillStyle = g; X.fillRect(x - r, y - r, 2 * r, 2 * r); }
function vignette(a = .55) { const g = X.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); X.fillStyle = g; X.fillRect(0, 0, W, H); }
function smoke(x, y, t, s = 1, col = '#555') { for (let i = 0; i < 8; i++) { const k = (t * .4 + i / 8) % 1; X.fillStyle = rgba(col, .35 * (1 - k));
  X.beginPath(); X.arc(x + Math.sin(i * 3 + t) * 20 * s + k * 120 * s, y - k * 300 * s, (20 + k * 80) * s, 0, 7); X.fill(); } }
function flash(x, y, r, k) { if (k <= 0) return; glow(x, y, r * 3, '#ffcc66', .8 * k); X.fillStyle = rgba('#fff5d0', k); X.beginPath(); X.arc(x, y, r * k, 0, 7); X.fill(); }

// ---------- texto ----------
function txt(s, x, y, size, col = '#fff', opts = {}) { X.save(); X.font = `${opts.w || 800} ${size}px Mont`; X.textAlign = opts.align || 'center'; X.textBaseline = 'middle';
  if (opts.stroke) { X.lineWidth = opts.stroke; X.strokeStyle = opts.sc || '#000'; X.lineJoin = 'round'; X.strokeText(s, x, y); }
  if (opts.shadow) { X.shadowColor = opts.shadow; X.shadowBlur = opts.blur || 20; }
  X.fillStyle = col; X.fillText(s, x, y); X.restore(); }
function panel(x, y, w, h, r = 24, fill = 'rgba(10,12,28,.82)', stroke = GOLD, lw = 4) { X.beginPath(); X.roundRect(x, y, w, h, r); X.fillStyle = fill; X.fill(); if (stroke) { X.lineWidth = lw; X.strokeStyle = stroke; X.stroke(); } }

// ---------- personajes (siluetas con contraluz) ----------
// opts: col, rim, hat, dress, cape, arm(-1..1), walk(phase), face (dir 1/-1), staff, torch, item
let PL = null;
function person(x, y, h, o = {}) {
  if (!PL) { PL = document.createElement('canvas'); PL.width = 1500; PL.height = 1500; }
  const s = h / 200, col = o.col || '#15121a', f = o.face || 1, wp = o.walk || 0;
  const P = PL.getContext('2d'); P.setTransform(1, 0, 0, 1, 0, 0); P.globalCompositeOperation = 'source-over'; P.clearRect(0, 0, 1500, 1500);
  const main = X; X = P; X.save(); X.translate(750, 1400); X.scale(s * f, s);
  const la = Math.sin(wp) * 16, lb = -la, ar = o.arm || 0;
  X.fillStyle = col; X.strokeStyle = col; X.lineCap = 'round'; X.lineJoin = 'round';
  // piernas (curvas con muslo y pantorrilla)
  const leg = (dx, sw) => { X.lineWidth = 15; X.beginPath(); X.moveTo(dx, -92); X.quadraticCurveTo(dx + sw * .7 + 2, -48, dx + sw, -4); X.stroke(); X.beginPath(); X.ellipse(dx + sw + 6, -3, 12, 5, 0, 0, 7); X.fill(); };
  leg(-8, la); leg(8, lb);
  if (o.dress) { X.fillStyle = o.dressCol || col; X.beginPath(); X.moveTo(-17, -128); X.quadraticCurveTo(-30, -60, -40 - Math.sin(wp) * 4, 0); X.quadraticCurveTo(0, 8, 40 + Math.sin(wp) * 4, 0); X.quadraticCurveTo(30, -60, 17, -128); X.fill(); X.fillStyle = col; }
  if (o.cape) { X.fillStyle = o.cape; X.beginPath(); X.moveTo(-15, -150); X.bezierCurveTo(-40, -110, -52 - Math.sin(wp) * 6, -50, -46, -2); X.lineTo(-6, -20); X.lineTo(14, -150); X.fill(); X.fillStyle = col; }
  // torso con hombros y cintura
  X.beginPath(); X.moveTo(-24, -150); X.quadraticCurveTo(-27, -120, -16, -92); X.lineTo(16, -92); X.quadraticCurveTo(27, -120, 24, -150); X.quadraticCurveTo(0, -158, -24, -150); X.fill();
  // brazos
  X.lineWidth = 12; X.beginPath(); X.moveTo(-21, -146); X.quadraticCurveTo(-30 - lb * .3, -118, -27 - lb * .5, -88); X.stroke();
  const hx = 36 + ar * 14, hy = -88 - ar * 82; X.beginPath(); X.moveTo(21, -146); X.quadraticCurveTo(34 + ar * 6, -120 - ar * 30, hx, hy); X.stroke();
  if (o.staff) { X.lineWidth = 5; X.beginPath(); X.moveTo(hx, hy + 70); X.lineTo(hx, hy - 110); X.stroke(); }
  if (o.item) { X.save(); o.item(hx, hy); X.restore(); X.fillStyle = col; X.strokeStyle = col; }
  // cuello y cabeza
  X.fillRect(-6, -168, 12, 16); X.beginPath(); X.ellipse(2, -182, 15, 18, 0, 0, 7); X.fill(); X.beginPath(); X.moveTo(14, -184); X.lineTo(20, -176); X.lineTo(14, -172); X.fill();
  X.save(); X.translate(0, -18); hat(o.hat, col, o.hatCol); X.restore();
  X.restore();
  if (o.rim) { X.globalCompositeOperation = 'source-atop'; const g = X.createLinearGradient(750 - 60 * s * f, 0, 750 + 60 * s * f, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.62, 'rgba(0,0,0,0)'); g.addColorStop(1, o.rim); X.fillStyle = g; X.fillRect(0, 0, 1500, 1500);
    const g2 = X.createLinearGradient(0, 1400 - 230 * s, 0, 1400); g2.addColorStop(0, 'rgba(255,255,255,.06)'); g2.addColorStop(1, 'rgba(0,0,0,.25)'); X.fillStyle = g2; X.fillRect(0, 0, 1500, 1500); X.globalCompositeOperation = 'source-over'; }
  X = main;
  X.fillStyle = 'rgba(0,0,0,.28)'; X.beginPath(); X.ellipse(x, y, 34 * s, 7 * s, 0, 0, 7); X.fill();
  X.drawImage(PL, x - 750, y - 1400);
  if (o.torch) { glow(x + (36 + ar * 14) * s * f, y + (-88 - ar * 82 - 30) * s, 120 * s, '#ff9a3c', .55); X.fillStyle = '#ffb347'; X.beginPath(); X.ellipse(x + (36 + ar * 14) * s * f, y + (-88 - ar * 82 - 30) * s, 8 * s, 16 * s, 0, 0, 7); X.fill(); }
}
function hat(k, col, hc) { if (!k) return; X.fillStyle = hc || col;
  if (k === 'crown') { X.fillStyle = hc || '#d9a520'; X.beginPath(); X.moveTo(-18, -168); X.lineTo(-14, -190); X.lineTo(-6, -176); X.lineTo(0, -196); X.lineTo(6, -176); X.lineTo(14, -190); X.lineTo(18, -168); X.fill();
    X.fillStyle = col; X.beginPath(); X.moveTo(-18, -165); X.quadraticCurveTo(-30, -130, -24, -110); X.lineTo(-10, -120); X.fill(); }
  if (k === 'nemes') { X.fillStyle = hc || '#d9a520'; X.beginPath(); X.moveTo(-17, -160); X.quadraticCurveTo(0, -186, 19, -160); X.lineTo(24, -128); X.lineTo(12, -134); X.lineTo(-10, -134); X.lineTo(-22, -128); X.fill(); X.fillStyle = 'rgba(30,60,140,.7)'; for (let i = 0; i < 4; i++) X.fillRect(-20, -150 + i * 6, 42, 2.5); }
  if (k === 'bicorne') { X.beginPath(); X.ellipse(0, -172, 40, 14, 0, Math.PI, 0); X.fill(); X.beginPath(); X.moveTo(-42, -172); X.quadraticCurveTo(0, -205, 42, -172); X.fill(); }
  if (k === 'bearskin') { X.beginPath(); X.ellipse(0, -195, 20, 42, 0, 0, 7); X.fill(); }
  if (k === 'viking') { X.beginPath(); X.arc(0, -162, 19, Math.PI, 0); X.fill(); X.fillRect(-2, -164, 4, 22); }
  if (k === 'horned') { X.beginPath(); X.arc(0, -162, 19, Math.PI, 0); X.fill(); X.fillStyle = hc || '#e8dcc0';
    X.beginPath(); X.moveTo(-17, -170); X.quadraticCurveTo(-45, -180, -40, -215); X.quadraticCurveTo(-34, -190, -12, -178); X.fill();
    X.beginPath(); X.moveTo(17, -170); X.quadraticCurveTo(45, -180, 40, -215); X.quadraticCurveTo(34, -190, 12, -178); X.fill(); }
  if (k === 'inca') { X.fillStyle = hc || '#c0392b'; X.fillRect(-19, -176, 38, 9); X.fillStyle = '#f1c40f'; for (let i = -2; i <= 2; i++) { X.beginPath(); X.ellipse(i * 7, -192, 4, 16, i * .2, 0, 7); X.fill(); } }
  if (k === 'explorer') { X.beginPath(); X.ellipse(0, -170, 34, 8, 0, 0, 7); X.fill(); X.beginPath(); X.ellipse(0, -178, 18, 14, 0, Math.PI, 0); X.fill(); }
  if (k === 'top') { X.fillRect(-30, -172, 60, 6); X.fillRect(-17, -210, 34, 40); }
  if (k === 'cap') { X.beginPath(); X.arc(0, -165, 19, Math.PI, 0); X.fill(); X.fillRect(0, -168, 32, 6); }
  if (k === 'slouch') { X.beginPath(); X.ellipse(0, -170, 38, 9, 0, 0, 7); X.fill(); X.beginPath(); X.ellipse(0, -178, 19, 13, 0, Math.PI, 0); X.fill(); }
  if (k === 'mitre') { X.beginPath(); X.moveTo(-16, -168); X.lineTo(0, -215); X.lineTo(16, -168); X.fill(); }
  if (k === 'laurel') { X.strokeStyle = '#c9a227'; X.lineWidth = 5; X.beginPath(); X.arc(0, -160, 20, Math.PI * .9, Math.PI * 2.1); X.stroke(); }
  if (k === 'veil') { X.beginPath(); X.moveTo(-20, -170); X.quadraticCurveTo(0, -185, 20, -170); X.lineTo(28, -110); X.lineTo(-28, -110); X.fill(); }
}
function crowd(y, n, seed, h0, h1, o = {}, t = 0) { const R = rng(seed); for (let i = 0; i < n; i++) { const x = R() * (W + 200) - 100, h = lerp(h0, h1, R());
  person(x, y + (h - h0) * .3, h, { ...o, face: R() > .5 ? 1 : -1, walk: o.walking ? t * 6 + R() * 6 : R() * 2, arm: o.cheer ? Math.sin(t * 5 + i) : (R() - .5) * .4, hat: o.hats ? o.hats[Math.floor(R() * o.hats.length)] : o.hat }); } }

// ---------- animales ----------
function emu(x, y, s, ph = 0, f = 1, col = '#4a3b2c') { X.save(); X.translate(x, y); X.scale(s * f, s);
  const lg = Math.sin(ph) * 25; X.strokeStyle = '#3a2f22'; X.lineWidth = 6; X.lineCap = 'round';
  X.beginPath(); X.moveTo(-8, -70); X.lineTo(-8 + lg * .5, -35); X.lineTo(-8 + lg, 0); X.stroke();
  X.beginPath(); X.moveTo(8, -70); X.lineTo(8 - lg * .5, -35); X.lineTo(8 - lg, 0); X.stroke();
  const g = X.createRadialGradient(-10, -110, 10, 0, -95, 70); g.addColorStop(0, shade(col, .25)); g.addColorStop(1, shade(col, -.35)); X.fillStyle = g;
  X.beginPath(); X.ellipse(0, -100, 55, 38, -.15, 0, 7); X.fill();
  // plumas
  X.strokeStyle = shade(col, -.45); X.lineWidth = 2; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI; X.beginPath(); X.moveTo(-40 + i * 4.5, -85 + Math.sin(a) * 6); X.lineTo(-44 + i * 4.5, -62 + Math.sin(a + ph) * 4); X.stroke(); }
  X.strokeStyle = '#5b4a3a'; X.lineWidth = 10; X.beginPath(); X.moveTo(38, -115); X.quadraticCurveTo(55, -150 + Math.sin(ph * .5) * 4, 52, -185); X.stroke();
  X.fillStyle = '#2b2520'; X.beginPath(); X.ellipse(56, -190, 13, 10, .2, 0, 7); X.fill(); X.fillStyle = '#6b5a45'; X.beginPath(); X.moveTo(66, -192); X.lineTo(86, -186); X.lineTo(66, -184); X.fill();
  X.fillStyle = '#d94'; X.beginPath(); X.arc(60, -193, 2.6, 0, 7); X.fill(); X.restore(); }
function mammoth(x, y, s, ph = 0, f = 1) { X.save(); X.translate(x, y); X.scale(s * f, s);
  X.fillStyle = '#4a3326'; const lg = Math.sin(ph) * 8;
  [[-60, lg], [-25, -lg], [35, -lg], [65, lg]].forEach(([a, o]) => { X.beginPath(); X.roundRect(a - 14 + o, -90, 30, 90, 10); X.fill(); });
  const g = X.createRadialGradient(-20, -170, 20, 0, -140, 160); g.addColorStop(0, '#7a5640'); g.addColorStop(1, '#2e1f16'); X.fillStyle = g;
  X.beginPath(); X.ellipse(0, -140, 110, 80, 0, 0, 7); X.fill(); X.beginPath(); X.ellipse(95, -170, 55, 60, 0, 0, 7); X.fill(); X.beginPath(); X.ellipse(70, -215, 40, 30, 0, 0, 7); X.fill();
  X.strokeStyle = '#3a271c'; X.lineWidth = 3; for (let i = 0; i < 30; i++) { X.beginPath(); X.moveTo(-100 + i * 7, -100); X.lineTo(-104 + i * 7 + Math.sin(i + ph) * 3, -60); X.stroke(); }
  X.strokeStyle = '#4a3326'; X.lineWidth = 22; X.beginPath(); X.moveTo(140, -165); X.quadraticCurveTo(165, -90, 150 + Math.sin(ph * .7) * 10, -40); X.stroke();
  X.strokeStyle = '#efe6d2'; X.lineWidth = 11; X.beginPath(); X.moveTo(130, -140); X.quadraticCurveTo(200, -70, 165, -150); X.stroke();
  X.fillStyle = '#111'; X.beginPath(); X.arc(118, -185, 4, 0, 7); X.fill(); X.restore(); }
function horse(x, y, s, f = 1, col = '#1a1410') { X.save(); X.translate(x, y); X.scale(s * f, s); X.fillStyle = col;
  [[-50, 0], [-35, 0], [40, 0], [55, 0]].forEach(([a]) => X.fillRect(a, -90, 10, 90));
  X.beginPath(); X.ellipse(0, -110, 75, 32, 0, 0, 7); X.fill(); X.beginPath(); X.moveTo(55, -125); X.lineTo(95, -190); X.lineTo(118, -180); X.lineTo(80, -105); X.fill();
  X.beginPath(); X.ellipse(110, -182, 24, 12, .5, 0, 7); X.fill(); X.beginPath(); X.moveTo(-70, -120); X.quadraticCurveTo(-110, -90, -95, -40); X.lineTo(-80, -100); X.fill(); X.restore(); }
function fish(x, y, s, f = 1) { X.save(); X.translate(x, y); X.scale(s * f, s); const g = X.createLinearGradient(0, -20, 0, 20); g.addColorStop(0, '#5f8fb0'); g.addColorStop(1, '#d8e6ee'); X.fillStyle = g;
  X.beginPath(); X.ellipse(0, 0, 60, 20, 0, 0, 7); X.fill(); X.beginPath(); X.moveTo(-55, 0); X.lineTo(-85, -20); X.lineTo(-85, 20); X.fill(); X.fillStyle = '#111'; X.beginPath(); X.arc(40, -4, 3.5, 0, 7); X.fill(); X.restore(); }
function condor(x, y, s, t) { X.save(); X.translate(x, y); X.scale(s, s); X.fillStyle = '#111'; const fl = Math.sin(t * 2) * 10;
  X.beginPath(); X.moveTo(0, 0); X.quadraticCurveTo(-60, -20 - fl, -130, -5 - fl); X.quadraticCurveTo(-70, 5, 0, 10); X.quadraticCurveTo(70, 5, 130, -5 - fl); X.quadraticCurveTo(60, -20 - fl, 0, 0); X.fill(); X.restore(); }

// ---------- arquitectura y objetos ----------
function pyramid(x, by, w, h, light = '#e6c084', dark = '#9c7446', eroded = 0) { const R = rng(Math.round(x + w));
  X.fillStyle = light; X.beginPath(); X.moveTo(x - w / 2, by); X.lineTo(x, by - h); X.lineTo(x + w * .18, by); X.fill();
  X.fillStyle = dark; X.beginPath(); X.moveTo(x, by - h); X.lineTo(x + w / 2, by); X.lineTo(x + w * .18, by); X.fill();
  X.strokeStyle = 'rgba(80,50,20,.25)'; X.lineWidth = 1.5; const rows = 26; for (let i = 1; i < rows; i++) { const yy = by - h * i / rows, k = i / rows;
    X.beginPath(); X.moveTo(x - w / 2 * (1 - k), yy); X.lineTo(x + w / 2 * (1 - k), yy); X.stroke(); }
  if (eroded) { X.fillStyle = 'rgba(60,40,20,.25)'; for (let i = 0; i < 40 * eroded; i++) { const k = R(), yy = by - h * k, half = w / 2 * (1 - k); X.fillRect(x - half + R() * half * 2, yy, 6 + R() * 18, 4 + R() * 6); } } }
function sphinx(x, by, s) { X.save(); X.translate(x, by); X.scale(s, s); X.fillStyle = '#b48a55'; X.beginPath(); X.roundRect(-160, -60, 260, 60, 10); X.fill();
  X.beginPath(); X.moveTo(60, -60); X.lineTo(70, -150); X.lineTo(130, -150); X.lineTo(140, -60); X.fill(); X.fillStyle = '#8c6a3e'; X.fillRect(80, -140, 40, 50); X.restore(); }
function palm(x, by, h, t = 0) { X.strokeStyle = '#3b2a17'; X.lineWidth = h * .05; X.beginPath(); X.moveTo(x, by); X.quadraticCurveTo(x + h * .1, by - h * .5, x + h * .05, by - h); X.stroke();
  X.fillStyle = '#1f3a1c'; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * .55 + Math.sin(t + i) * .05; X.save(); X.translate(x + h * .05, by - h); X.rotate(a); X.beginPath(); X.ellipse(h * .25, 0, h * .27, h * .05, 0, 0, 7); X.fill(); X.restore(); } }
function palace(x, by, s, col = '#f2ede2') { X.save(); X.translate(x, by); X.scale(s, s); X.fillStyle = col; X.fillRect(-260, -180, 520, 180);
  X.fillStyle = shade(col, -.15); X.fillRect(-260, -200, 520, 22); X.fillStyle = col; X.fillRect(-40, -330, 80, 160); X.fillStyle = shade(col, -.15); X.fillRect(-48, -345, 96, 18);
  X.fillStyle = '#2b2b33'; X.beginPath(); X.arc(0, -290, 22, 0, 7); X.fill(); X.strokeStyle = '#fff'; X.lineWidth = 3; X.beginPath(); X.moveTo(0, -290); X.lineTo(0, -305); X.moveTo(0, -290); X.lineTo(12, -290); X.stroke();
  X.fillStyle = '#5a4630'; for (let r = 0; r < 3; r++) for (let i = 0; i < 11; i++) { X.beginPath(); X.roundRect(-240 + i * 45, -165 + r * 55, 22, 36, [11, 11, 0, 0]); X.fill(); } X.restore(); }
function ship(x, y, s, t, fire = 0, col = '#2c2f36') { X.save(); X.translate(x, y + Math.sin(t * 1.3 + x) * 4); X.scale(s, s);
  X.fillStyle = col; X.beginPath(); X.moveTo(-220, -40); X.lineTo(230, -40); X.lineTo(190, 20); X.lineTo(-200, 20); X.fill();
  X.fillStyle = shade(col, .15); X.fillRect(-120, -95, 200, 55); X.fillRect(-60, -130, 90, 35);
  X.fillStyle = '#1a1c22'; X.fillRect(-30, -200, 26, 75); X.fillRect(30, -190, 26, 65); X.strokeStyle = '#111'; X.lineWidth = 4; X.beginPath(); X.moveTo(-150, -40); X.lineTo(-150, -220); X.moveTo(150, -40); X.lineTo(150, -210); X.stroke();
  X.fillStyle = '#16181d'; X.fillRect(-200, -60, 70, 10);
  X.restore(); smoke(x - 17 * s, y - 200 * s, t, s * .8, '#3a3a3a');
  if (fire > 0) { flash(x - 210 * s, y - 55 * s, 40 * s, fire); } }
function truck(x, y, s, col = '#4b5320') { X.save(); X.translate(x, y); X.scale(s, s); X.fillStyle = col; X.beginPath(); X.roundRect(-190, -120, 250, 80, 6); X.fill();
  X.beginPath(); X.moveTo(60, -40); X.lineTo(60, -150); X.lineTo(130, -150); X.lineTo(170, -95); X.lineTo(170, -40); X.fill();
  X.fillStyle = '#9ec1d6'; X.fillRect(75, -138, 50, 40); X.fillStyle = '#151515'; [-130, -40, 120].forEach(a => { X.beginPath(); X.arc(a, -35, 32, 0, 7); X.fill(); X.fillStyle = '#555'; X.beginPath(); X.arc(a, -35, 12, 0, 7); X.fill(); X.fillStyle = '#151515'; });
  X.restore(); }
function machinegun(x, y, s, fire = 0) { X.save(); X.translate(x, y); X.scale(s, s); X.strokeStyle = '#1b1b1b'; X.lineWidth = 6; X.beginPath(); X.moveTo(0, 0); X.lineTo(-25, 50); X.moveTo(0, 0); X.lineTo(25, 50); X.stroke();
  X.fillStyle = '#222'; X.fillRect(-40, -18, 80, 22); X.fillRect(30, -12, 110, 9); X.restore(); if (fire > 0) flash(x + 145 * s, y - 8 * s, 20 * s, fire); }
function bucket(x, y, s, glowA = 0) { if (glowA) glow(x, y - 60 * s, 260 * s, '#ffd27a', glowA);
  X.save(); X.translate(x, y); X.scale(s, s); const g = X.createLinearGradient(-70, 0, 70, 0); g.addColorStop(0, '#5a3a1e'); g.addColorStop(.45, '#a8743f'); g.addColorStop(1, '#4a2f18'); X.fillStyle = g;
  X.beginPath(); X.moveTo(-75, -150); X.lineTo(75, -150); X.lineTo(60, 0); X.lineTo(-60, 0); X.fill();
  X.strokeStyle = 'rgba(40,25,10,.6)'; X.lineWidth = 2; for (let i = -60; i <= 60; i += 15) { X.beginPath(); X.moveTo(i * 1.12, -150); X.lineTo(i * .9, 0); X.stroke(); }
  X.fillStyle = '#3a3a3a'; X.fillRect(-73, -125, 146, 10); X.fillRect(-64, -40, 128, 10); X.strokeStyle = '#3a3a3a'; X.lineWidth = 6; X.beginPath(); X.arc(0, -150, 75, Math.PI * 1.05, Math.PI * 1.95); X.stroke();
  X.fillStyle = '#2a1a0c'; X.beginPath(); X.ellipse(0, -150, 75, 14, 0, 0, 7); X.fill(); X.restore(); }
function hourglass(x, y, s, t) { X.save(); X.translate(x, y); X.scale(s, s); glow(0, 0, 300, '#ffb347', .35);
  X.fillStyle = '#6b4423'; X.fillRect(-120, -200, 240, 24); X.fillRect(-120, 176, 240, 24); X.fillStyle = '#8b5a2b'; X.fillRect(-110, -180, 14, 360); X.fillRect(96, -180, 14, 360);
  X.fillStyle = 'rgba(200,230,255,.18)'; X.beginPath(); X.moveTo(-85, -176); X.lineTo(85, -176); X.quadraticCurveTo(80, -40, 8, 0); X.quadraticCurveTo(80, 40, 85, 176); X.lineTo(-85, 176); X.quadraticCurveTo(-80, 40, -8, 0); X.quadraticCurveTo(-80, -40, -85, -176); X.fill();
  const k = (t * .05) % 1; X.fillStyle = '#e8b65a'; X.beginPath(); const topH = 150 * (1 - k); X.moveTo(-70 * (1 - k) - 10, -20 - topH); X.lineTo(70 * (1 - k) + 10, -20 - topH); X.lineTo(6, -6); X.lineTo(-6, -6); X.fill();
  X.beginPath(); X.moveTo(-80, 170); X.quadraticCurveTo(0, 170 - 130 * k - 20, 80, 170); X.fill(); X.fillRect(-2, -6, 4, 176); X.restore(); }
function book(x, y, s, t) { X.save(); X.translate(x, y); X.scale(s, s); glow(0, -60, 420, '#ffd98a', .45 + .1 * Math.sin(t * 2));
  X.fillStyle = '#4a2410'; X.beginPath(); X.moveTo(-330, 20); X.lineTo(0, 50); X.lineTo(330, 20); X.lineTo(330, 40); X.lineTo(0, 70); X.lineTo(-330, 40); X.fill();
  const page = (d) => { X.fillStyle = '#f3e3c0'; X.beginPath(); X.moveTo(0, 40); X.quadraticCurveTo(d * 150, -10, d * 310, 12); X.lineTo(d * 300, -190); X.quadraticCurveTo(d * 150, -215, 0, -170); X.fill();
    X.strokeStyle = 'rgba(90,60,30,.35)'; X.lineWidth = 3; for (let i = 0; i < 9; i++) { X.beginPath(); X.moveTo(d * 40, -140 + i * 18); X.lineTo(d * 270, -150 + i * 18); X.stroke(); } };
  page(-1); page(1); X.restore(); }
function globe(x, y, r, t) { X.save(); const g = X.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g.addColorStop(0, '#5fb0e6'); g.addColorStop(1, '#0d3c66'); X.fillStyle = g; X.beginPath(); X.arc(x, y, r, 0, 7); X.fill();
  X.clip(); X.fillStyle = '#3f8f4f'; for (let i = 0; i < 6; i++) { const ox = ((i * 170 + t * 30) % (r * 4)) - r * 2; X.beginPath(); X.ellipse(x + ox, y + Math.sin(i) * r * .4, r * .35, r * .22, i, 0, 7); X.fill(); } X.restore(); }
function coin(x, y, r, t = 0, label = '') { X.save(); X.translate(x, y); X.scale(Math.abs(Math.cos(t)) * .9 + .1, 1); const g = X.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r); g.addColorStop(0, '#fff0a8'); g.addColorStop(.6, '#e0a82e'); g.addColorStop(1, '#8a5a12'); X.fillStyle = g;
  X.beginPath(); X.arc(0, 0, r, 0, 7); X.fill(); X.strokeStyle = '#8a5a12'; X.lineWidth = r * .06; X.beginPath(); X.arc(0, 0, r * .82, 0, 7); X.stroke();
  X.fillStyle = 'rgba(120,80,20,.6)'; X.beginPath(); X.arc(r * .05, -r * .05, r * .42, 0, 7); X.fill(); X.restore(); }
function clockFace(x, y, r, minutes, col = '#fff') { X.save(); X.translate(x, y); X.fillStyle = 'rgba(10,12,28,.85)'; X.beginPath(); X.arc(0, 0, r, 0, 7); X.fill(); X.lineWidth = r * .06; X.strokeStyle = GOLD; X.stroke();
  X.fillStyle = rgba('#ff3b3b', .55); X.beginPath(); X.moveTo(0, 0); X.arc(0, 0, r * .9, -Math.PI / 2, -Math.PI / 2 + minutes / 60 * Math.PI * 2); X.fill();
  X.strokeStyle = col; for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, l = i % 5 ? .06 : .14; X.lineWidth = i % 5 ? 2 : 5; X.beginPath(); X.moveTo(Math.cos(a) * r * .92, Math.sin(a) * r * .92); X.lineTo(Math.cos(a) * r * (.92 - l), Math.sin(a) * r * (.92 - l)); X.stroke(); }
  const a = -Math.PI / 2 + minutes / 60 * Math.PI * 2; X.lineWidth = 8; X.lineCap = 'round'; X.beginPath(); X.moveTo(0, 0); X.lineTo(Math.cos(a) * r * .78, Math.sin(a) * r * .78); X.stroke(); X.restore(); }

// ---------- infografías ----------
// línea de tiempo: items [{year:-2560,label:'Pirámide', col}], rango [y0,y1], aparición progresiva k (0..1)
function timeline(items, y0, y1, k, yy = 620, x0 = 220, x1 = 1700) { X.save();
  const px = yr => x0 + (yr - y0) / (y1 - y0) * (x1 - x0);
  X.strokeStyle = 'rgba(255,255,255,.85)'; X.lineWidth = 8; X.lineCap = 'round'; X.beginPath(); X.moveTo(x0, yy); X.lineTo(lerp(x0, x1, ease(clamp(k * 1.5))), yy); X.stroke();
  items.forEach((it, i) => { const kk = back(prog(k, .25 + i * .2, .45 + i * .2)); if (kk <= 0) return; const x = px(it.year), up = i % 2 ? 1 : -1;
    X.fillStyle = it.col || GOLD; X.beginPath(); X.arc(x, yy, 18 * kk, 0, 7); X.fill(); glow(x, yy, 80 * kk, it.col || GOLD, .5);
    X.strokeStyle = it.col || GOLD; X.lineWidth = 4; X.beginPath(); X.moveTo(x, yy); X.lineTo(x, yy + up * 90 * kk); X.stroke();
    txt(it.label, x, yy + up * 135, 46 * kk, '#fff', { stroke: 8 }); txt(it.sub || '', x, yy + up * 190, 38 * kk, it.col || GOLD, { stroke: 7 }); });
  X.restore(); return px; }
function bracket(xa, xb, y, label, k, col = GOLD) { if (k <= 0) return; const xm = lerp(xa, xb, .5), w = (xb - xa) * ease(k);
  X.strokeStyle = col; X.lineWidth = 5; X.beginPath(); X.moveTo(xm - w / 2, y + 20); X.lineTo(xm - w / 2, y); X.lineTo(xm + w / 2, y); X.lineTo(xm + w / 2, y + 20); X.stroke();
  txt(label, xm, y - 40, 44 * ease(k), col, { stroke: 8 }); }
function bars(items, k, x0 = 360, y0 = 330, w = 1200, bh = 90, gap = 60, max) { max = max || Math.max(...items.map(i => i.v));
  items.forEach((it, i) => { const kk = ease(prog(k, i * .15, .6 + i * .15)); const y = y0 + i * (bh + gap);
    txt(it.label, x0, y - 26, 40, '#fff', { align: 'left', stroke: 7 }); panel(x0, y, w, bh, bh / 2, 'rgba(255,255,255,.12)', null);
    const g = X.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, shade(it.col || GOLD, -.2)); g.addColorStop(1, it.col || GOLD);
    X.fillStyle = g; X.beginPath(); X.roundRect(x0, y, Math.max(bh, w * it.v / max * kk), bh, bh / 2); X.fill();
    txt(it.fmt ? it.fmt(it.v * kk) : Math.round(it.v * kk), x0 + w + 30, y + bh / 2, 46, it.col || GOLD, { align: 'left', stroke: 7 }); }); }
function title(s, k, y = 140, size = 64, col = '#fff') { if (k <= 0) return; X.globalAlpha = ease(k); txt(s, W / 2, y + 20 * (1 - ease(k)), size, col, { stroke: 10 }); X.globalAlpha = 1; }
function stamp(s, x, y, k, col = '#e53935', rot = -.18) { if (k <= 0) return; const sc = lerp(3, 1, back(k)); X.save(); X.translate(x, y); X.rotate(rot); X.scale(sc, sc); X.globalAlpha = clamp(k * 2);
  X.lineWidth = 12; X.strokeStyle = col; X.beginPath(); X.roundRect(-260, -90, 520, 180, 20); X.stroke(); txt(s, 0, 4, 120, col, { w: 900 }); X.restore(); X.globalAlpha = 1; }
function arrow(x0, y0, x1, y1, k, col = GOLD, lw = 10) { if (k <= 0) return; const x = lerp(x0, x1, ease(k)), y = lerp(y0, y1, ease(k));
  X.strokeStyle = col; X.lineWidth = lw; X.lineCap = 'round'; X.setLineDash([24, 18]); X.lineDashOffset = -k * 200; X.beginPath(); X.moveTo(x0, y0); X.lineTo(x, y); X.stroke(); X.setLineDash([]);
  const a = Math.atan2(y1 - y0, x1 - x0); X.fillStyle = col; X.beginPath(); X.moveTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); X.lineTo(x + Math.cos(a + 2.5) * 30, y + Math.sin(a + 2.5) * 30); X.lineTo(x + Math.cos(a - 2.5) * 30, y + Math.sin(a - 2.5) * 30); X.fill(); }
function pin(x, y, label, k, col = '#e53935') { if (k <= 0) return; const s = back(k); X.save(); X.translate(x, y); X.scale(s, s); glow(0, 0, 70, col, .5 + .2 * Math.sin(k * 20));
  X.fillStyle = col; X.beginPath(); X.arc(0, -40, 22, Math.PI, 0); X.lineTo(0, 0); X.closePath(); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.arc(0, -40, 8, 0, 7); X.fill(); X.restore();
  if (label) txt(label, x, y - 90 * s, 40 * s, '#fff', { stroke: 8 }); }
