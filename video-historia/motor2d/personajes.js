// Personajes estilo dibujo animado: caras expresivas, parpadeo, respiración, contorno y ropa de color.
// Sustituye a person(), hat(), emu() y mammoth() del kit (se carga después).
let NOW = 0;               // tiempo global (lo fija frame())
const INK = '#111111';     // color del contorno
const LOOK = {             // vestuario por tipo de sombrero
  nemes:    { skin: '#c98a5c', cloth: '#f6f0e0', trim: '#e2b23a', hair: '#1b1210', pants: '#c98a5c' },
  crown:    { skin: '#eab78e', cloth: '#7b2d8e', trim: '#f2c440', hair: '#3a2214', pants: '#5a1f6a' },
  bicorne:  { skin: '#f2c8a6', cloth: '#21418f', trim: '#f2c440', hair: '#3a2416', pants: '#f3efe6' },
  bearskin: { skin: '#f0c6a0', cloth: '#21418f', trim: '#d63a2e', hair: '#3a2416', pants: '#f3efe6' },
  viking:   { skin: '#f2c29a', cloth: '#8a5a32', trim: '#c9a24a', hair: '#d9772a', pants: '#5a4030', beard: '#d9772a' },
  horned:   { skin: '#f2c29a', cloth: '#9a3a2a', trim: '#e0c070', hair: '#e8b040', pants: '#4a3426', beard: '#e8b040' },
  inca:     { skin: '#b9784c', cloth: '#c0302b', trim: '#f2c440', hair: '#151010', pants: '#b9784c' },
  explorer: { skin: '#f2c8a6', cloth: '#c4a868', trim: '#7a5a2a', hair: '#5a3a1e', pants: '#8a7448' },
  top:      { skin: '#f2c8a6', cloth: '#2b2b33', trim: '#f2f2f2', hair: '#4a3020', pants: '#2b2b33', mustache: '#4a3020' },
  cap:      { skin: '#e8b48c', cloth: '#5b7a9a', trim: '#3a4a5a', hair: '#4a2e1a', pants: '#4a3a2a' },
  slouch:   { skin: '#d9a073', cloth: '#a8743a', trim: '#5a3a1a', hair: '#2a1a10', pants: '#5a4a30' },
  mitre:    { skin: '#f0c6a0', cloth: '#f0ebe0', trim: '#c0302b', hair: '#9a9a9a', pants: '#f0ebe0' },
  laurel:   { skin: '#e8b48c', cloth: '#f4efe4', trim: '#7b2d8e', hair: '#3a2416', pants: '#e8b48c' },
  veil:     { skin: '#eab78e', cloth: '#c0485a', trim: '#f2c440', hair: '#5a3018', pants: '#c0485a' },
};
const TUNICS = ['#d9534f', '#5b8fd9', '#e8a33a', '#4caf7a', '#9b59b6', '#e07a5f', '#3d9970', '#c26a3a'];
const SKINS = ['#f2c8a6', '#e0a97e', '#c98a5c', '#a86a44', '#eab78e'];

function outline(w) { X.lineWidth = w; X.strokeStyle = INK; X.lineJoin = 'round'; X.lineCap = 'round'; }
function blob(fill, w) { X.fillStyle = fill; X.fill(); outline(w); X.stroke(); }

// expr: 'smile' (por defecto), 'happy', 'surprised', 'angry', 'sad', 'talk', 'laugh'
function person(x, y, h, o = {}) {
  const seed = Math.round(x * 7 + h * 13) | 0, R = rng(seed);
  const base = LOOK[o.hat] || { skin: SKINS[Math.floor(R() * 5)], cloth: TUNICS[Math.floor(R() * 8)], trim: '#f2e6c8', hair: ['#2a1a10', '#5a3418', '#1a1010', '#8a5a2a'][Math.floor(R() * 4)] };
  const L = { ...base, pants: base.pants || shade(base.cloth, -.3), ...(o.look || {}) };
  if (o.hat === 'veil' || (!LOOK[o.hat] && o.dress)) L.cloth = o.cloth || TUNICS[Math.floor(R() * 8)];
  if (o.cloth) L.cloth = o.cloth;
  const s = h / 200, f = o.face || 1, wp = o.walk || 0, ar = o.arm || 0, tiny = h < 110;
  const breathe = 1 + .018 * Math.sin(NOW * 2.2 + seed), bob = o.walk ? Math.abs(Math.sin(wp)) * 6 : 0;
  const expr = o.expr || (o.cheer ? 'happy' : 'smile');
  X.save(); X.translate(x, y);
  X.fillStyle = 'rgba(0,0,0,.22)'; X.beginPath(); X.ellipse(0, 0, 34 * s, 8 * s, 0, 0, 7); X.fill();
  X.scale(s * f, s); X.translate(0, -bob);
  const lw = tiny ? 7 : 5.6;
  // capa (detrás)
  if (o.cape) { X.beginPath(); X.moveTo(-26, -118); X.bezierCurveTo(-48, -80, -56 - Math.sin(wp) * 6, -30, -50, -2); X.lineTo(10, -8); X.lineTo(22, -118); X.closePath(); blob(o.cape.startsWith('#') && parseInt(o.cape.slice(1, 3), 16) > 60 ? o.cape : L.trim === '#f2c440' ? '#a8262a' : shade(L.cloth, -.25), lw); }
  // piernas
  const la = Math.sin(wp) * 14, lb = -la;
  [[-11, la], [11, lb]].forEach(([dx, sw]) => { X.beginPath(); X.moveTo(dx - 7, -54); X.lineTo(dx + 7, -54); X.lineTo(dx + 6 + sw, -8); X.lineTo(dx - 6 + sw, -8); X.closePath(); blob(L.pants, lw);
    X.beginPath(); X.ellipse(dx + sw + 5 * 1, -5, 13, 7, 0, 0, 7); blob('#3a2416', lw); });
  // cuerpo
  X.save(); X.translate(0, -54); X.scale(1, breathe); X.translate(0, 54);
  if (o.dress || L.cloth === LOOK.nemes.cloth && o.hat === 'nemes') { X.beginPath(); X.moveTo(-24, -120); X.quadraticCurveTo(-36, -60, -44 - Math.sin(wp) * 4, -6); X.quadraticCurveTo(0, 4, 44 + Math.sin(wp) * 4, -6); X.quadraticCurveTo(36, -60, 24, -120); X.closePath(); blob(L.cloth, lw);
    X.strokeStyle = L.trim; X.lineWidth = 5; X.beginPath(); X.moveTo(-40, -16); X.quadraticCurveTo(0, -8, 40, -16); X.stroke(); }
  else { X.beginPath(); X.moveTo(-26, -122); X.quadraticCurveTo(-34, -84, -28, -50); X.quadraticCurveTo(0, -42, 28, -50); X.quadraticCurveTo(34, -84, 26, -122); X.quadraticCurveTo(0, -130, -26, -122); blob(L.cloth, lw); }
  // detalles de ropa
  X.strokeStyle = L.trim; X.lineWidth = 5; X.beginPath(); X.moveTo(-24, -60); X.quadraticCurveTo(0, -54, 24, -60); X.stroke();
  if (o.hat === 'bicorne' || o.hat === 'bearskin') { X.fillStyle = '#f3efe6'; X.beginPath(); X.moveTo(-10, -122); X.lineTo(10, -122); X.lineTo(6, -64); X.lineTo(-6, -64); X.fill(); X.fillStyle = L.trim; for (let i = 0; i < 4; i++) { X.beginPath(); X.arc(0, -112 + i * 14, 2.6, 0, 7); X.fill(); } }
  if (o.hat === 'inca') { X.fillStyle = L.trim; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) X.fillRect(-15 + i * 11, -110 + j * 16, 7, 7); }
  if (o.hat === 'nemes' || o.hat === 'crown') { X.fillStyle = L.trim; X.beginPath(); X.ellipse(0, -118, 26, 9, 0, 0, Math.PI); X.fill(); }
  if (o.hat === 'top') { X.fillStyle = '#f2f2f2'; X.beginPath(); X.moveTo(-8, -122); X.lineTo(8, -122); X.lineTo(0, -90); X.fill(); X.fillStyle = '#c0302b'; X.beginPath(); X.moveTo(-8, -120); X.lineTo(8, -120); X.lineTo(0, -112); X.fill(); }
  if (o.hat === 'laurel') { X.strokeStyle = L.trim; X.lineWidth = 7; X.beginPath(); X.moveTo(-20, -122); X.lineTo(18, -54); X.stroke(); }
  X.restore();
  // brazos
  const arm = (sx, ex, ey, back) => { X.beginPath(); X.moveTo(sx, -112); X.quadraticCurveTo((sx + ex) / 2 + (back ? -6 : 6), (-112 + ey) / 2 - 6, ex, ey); outline(15 + lw * 2); X.stroke(); X.strokeStyle = L.cloth; X.lineWidth = 15; X.stroke();
    X.beginPath(); X.arc(ex, ey, 8, 0, 7); blob(L.skin, lw); };
  arm(-22, -32 - lb * .4, -64, true);
  const hx = 36 + ar * 12, hy = -66 - ar * 70; arm(22, hx, hy, false);
  if (o.staff) { outline(8); X.beginPath(); X.moveTo(hx, hy + 60); X.lineTo(hx, hy - 120); X.stroke(); X.strokeStyle = '#8a5a2a'; X.lineWidth = 4; X.stroke(); }
  if (o.item) { X.save(); o.item(hx, hy); X.restore(); }
  // cabeza (grande, estilo caricatura)
  const hb = Math.sin(NOW * 2.2 + seed) * 1.5 + (o.cheer ? Math.sin(NOW * 8 + seed) * 3 : 0);
  X.save(); X.translate(0, hb);
  X.beginPath(); X.ellipse(0, -128, 8, 8, 0, 0, 7); X.fillStyle = L.skin; X.fill();
  if (o.hat === 'nemes' || o.hat === 'veil') { X.beginPath(); X.moveTo(-36, -170); X.quadraticCurveTo(-44, -120, -30, -108); X.lineTo(30, -108); X.quadraticCurveTo(44, -120, 36, -170); blob(o.hat === 'nemes' ? L.hair : L.hair, lw); }
  X.beginPath(); X.moveTo(-38, -168); X.bezierCurveTo(-42, -214, 42, -214, 38, -168); X.bezierCurveTo(40, -128, 20, -122, 4, -121); X.bezierCurveTo(-18, -122, -40, -130, -38, -168); blob(L.skin, lw);
  // pelo
  if (!['bearskin', 'top', 'mitre', 'horned', 'viking', 'nemes', 'explorer', 'slouch'].includes(o.hat)) { X.beginPath(); X.ellipse(-2, -184, 31, 17, -.1, Math.PI * .95, Math.PI * 2.05); blob(L.hair, lw); }
  if (L.beard) { X.beginPath(); X.moveTo(-26, -158); X.quadraticCurveTo(-28, -112, 0, -108); X.quadraticCurveTo(28, -112, 26, -158); X.quadraticCurveTo(0, -136, -26, -158); blob(L.beard, lw); }
  if (!tiny) face(expr, L, seed); else { X.fillStyle = INK; X.beginPath(); X.arc(-8, -162, 4, 0, 7); X.arc(12, -162, 4, 0, 7); X.fill(); }
  if (L.mustache) { X.beginPath(); X.ellipse(-6, -142, 10, 4, .3, 0, 7); X.ellipse(12, -142, 10, 4, -.3, 0, 7); X.fillStyle = L.mustache; X.fill(); }
  X.save(); X.translate(0, -14); hat(o.hat, L, o.hatCol, lw); X.restore();
  X.restore();
  X.restore();
  if (o.torch) { const tx = x + hx * s * f, ty = y + (hy - 30 - bob) * s; glow(tx, ty, 140 * s, '#ff9a3c', .6); X.fillStyle = '#ffb347'; X.beginPath(); X.ellipse(tx, ty, 9 * s, 18 * s + Math.sin(NOW * 12) * 2 * s, 0, 0, 7); X.fill(); }
}
function face(expr, L, seed) {
  const blink = ((NOW + (seed % 97) * .37) % 3.7) < .13;
  const ey = -170, lx = -12, rx = 15, look = 3;
  const surprised = expr === 'surprised', angry = expr === 'angry';
  // mejillas
  X.fillStyle = 'rgba(255,110,110,.35)'; X.beginPath(); X.arc(-20, -146, 7, 0, 7); X.arc(26, -146, 7, 0, 7); X.fill();
  [lx, rx].forEach(ex => { if (blink && !surprised) { outline(3.2); X.beginPath(); X.moveTo(ex - 7, ey); X.quadraticCurveTo(ex, ey + 4, ex + 7, ey); X.stroke(); return; }
    const ry = surprised ? 17 : 14; X.beginPath(); X.ellipse(ex, ey - 2, 12, ry, 0, 0, 7); blob('#ffffff', 3.6);
    X.fillStyle = '#111'; X.beginPath(); X.arc(ex + look + 1, ey, surprised ? 3 : 4.2, 0, 7); X.fill(); });
  // cejas
  outline(3.4); const by = ey - 15 - (surprised ? 5 : 0);
  X.beginPath(); X.moveTo(lx - 8, by + (angry ? -3 : 1)); X.lineTo(lx + 7, by + (angry ? 4 : expr === 'sad' ? -4 : -1)); X.moveTo(rx - 7, by + (angry ? 4 : expr === 'sad' ? -4 : -1)); X.lineTo(rx + 8, by + (angry ? -3 : 1)); X.stroke();
  // nariz
  X.fillStyle = shade(L.skin, -.18); X.beginPath(); X.ellipse(6, -150, 5, 4, 0, 0, 7); X.fill();
  // boca
  const talking = expr === 'talk' ? Math.abs(Math.sin(NOW * 11 + seed)) : 0;
  if (surprised) { X.beginPath(); X.ellipse(4, -134, 6, 8, 0, 0, 7); blob('#7a2020', 2.6); }
  else if (expr === 'laugh' || expr === 'happy' || talking > .1) { const o = expr === 'laugh' ? 10 : expr === 'happy' ? 7 : 3 + talking * 6;
    X.beginPath(); X.moveTo(-8, -138); X.quadraticCurveTo(4, -138 + o * 2, 16, -138); X.closePath(); blob('#8a2424', 2.6); X.fillStyle = '#fff'; X.fillRect(-4, -138, 14, 3); }
  else if (expr === 'sad' || angry) { outline(3.2); X.beginPath(); X.moveTo(-6, -132); X.quadraticCurveTo(4, -139, 14, -132); X.stroke(); }
  else { outline(3.2); X.beginPath(); X.moveTo(-7, -139); X.quadraticCurveTo(4, -131, 15, -139); X.stroke(); }
}
function hat(k, L, hc, lw = 3.6) { if (!k) return; L = typeof L === 'object' ? L : LOOK[k] || { trim: '#f2c440', cloth: '#555', hair: '#333' };
  const g = (c) => blob(c, lw);
  if (k === 'crown') { X.beginPath(); X.moveTo(-24, -170); X.lineTo(-22, -198); X.lineTo(-11, -184); X.lineTo(0, -204); X.lineTo(11, -184); X.lineTo(22, -198); X.lineTo(24, -170); X.closePath(); g(hc || '#f2c440'); X.fillStyle = '#d6303a'; X.beginPath(); X.arc(0, -180, 4, 0, 7); X.fill(); }
  if (k === 'nemes') { X.beginPath(); X.moveTo(-34, -160); X.quadraticCurveTo(0, -212, 34, -160); X.lineTo(30, -176); X.quadraticCurveTo(0, -200, -30, -176); X.closePath(); g(hc || '#f2c440');
    X.beginPath(); X.moveTo(-31, -178); X.quadraticCurveTo(0, -206, 31, -178); X.lineTo(31, -170); X.quadraticCurveTo(0, -194, -31, -170); X.closePath(); g('#2a5aa8');
    X.save(); X.translate(0, -196); X.beginPath(); X.moveTo(-5, 6); X.quadraticCurveTo(-8, -10, 0, -14); X.quadraticCurveTo(8, -10, 5, 6); g('#f2c440'); X.restore(); }
  if (k === 'bicorne') { X.beginPath(); X.moveTo(-50, -170); X.quadraticCurveTo(0, -230, 50, -170); X.quadraticCurveTo(0, -186, -50, -170); g('#1a1a22'); X.fillStyle = '#d6303a'; X.beginPath(); X.arc(18, -186, 7, 0, 7); X.fill(); X.fillStyle = '#21418f'; X.beginPath(); X.arc(18, -186, 4, 0, 7); X.fill(); }
  if (k === 'bearskin') { X.beginPath(); X.ellipse(0, -205, 30, 52, 0, 0, 7); g('#121218'); X.strokeStyle = '#d6303a'; X.lineWidth = 5; X.beginPath(); X.moveTo(-28, -176); X.quadraticCurveTo(0, -168, 28, -176); X.stroke(); }
  if (k === 'viking' || k === 'horned') { if (k === 'horned') { [-1, 1].forEach(sd => { X.beginPath(); X.moveTo(sd * 26, -182); X.quadraticCurveTo(sd * 66, -190, sd * 58, -236); X.quadraticCurveTo(sd * 50, -204, sd * 20, -192); X.closePath(); g(hc || '#f3ead2'); }); }
    X.beginPath(); X.arc(0, -172, 35, Math.PI, 0); X.closePath(); g('#9aa2ab'); X.fillStyle = '#c9a24a'; X.fillRect(-35, -176, 70, 7); X.beginPath(); X.rect(-3, -178, 6, 24); g('#9aa2ab'); }
  if (k === 'inca') { X.beginPath(); X.rect(-33, -186, 66, 14); g(hc || '#c0302b'); [-2, -1, 0, 1, 2].forEach(i => { X.beginPath(); X.ellipse(i * 11, -204 - (2 - Math.abs(i)) * 4, 5, 18, i * .25, 0, 7); g(['#f2c440', '#27ae60', '#e74c3c'][Math.abs(i) % 3]); }); }
  if (k === 'explorer' || k === 'slouch') { X.beginPath(); X.ellipse(0, -176, 52, 12, 0, 0, 7); g(k === 'explorer' ? '#d8c08a' : '#8a6a3a'); X.beginPath(); X.ellipse(0, -186, 28, 22, 0, Math.PI, 0); X.closePath(); g(k === 'explorer' ? '#d8c08a' : '#8a6a3a'); X.fillStyle = '#5a3a1a'; X.fillRect(-28, -190, 56, 6); }
  if (k === 'top') { X.beginPath(); X.ellipse(0, -178, 44, 9, 0, 0, 7); g('#1c1c22'); X.beginPath(); X.rect(-25, -236, 50, 58); g('#1c1c22'); X.fillStyle = '#7a2020'; X.fillRect(-25, -190, 50, 8); }
  if (k === 'cap') { X.beginPath(); X.arc(0, -176, 33, Math.PI, 0); X.closePath(); g(L.trim || '#3a4a5a'); X.beginPath(); X.ellipse(30, -178, 22, 6, 0, 0, 7); g(L.trim || '#3a4a5a'); }
  if (k === 'mitre') { X.beginPath(); X.moveTo(-26, -176); X.quadraticCurveTo(-30, -230, 0, -250); X.quadraticCurveTo(30, -230, 26, -176); X.closePath(); g('#f6f2e8'); X.fillStyle = '#c9a24a'; X.fillRect(-4, -246, 8, 66); X.fillRect(-24, -186, 48, 8); }
  if (k === 'laurel') { X.fillStyle = '#4a8a3a'; for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * .1); X.beginPath(); X.ellipse(Math.cos(a) * 34, -168 + Math.sin(a) * 34, 8, 4, a + 1.2, 0, 7); X.fill(); } }
  if (k === 'veil') { X.beginPath(); X.moveTo(-36, -170); X.quadraticCurveTo(0, -214, 36, -170); X.quadraticCurveTo(0, -190, -36, -170); g(L.trim === '#f2c440' ? '#f4e8c8' : L.trim); }
}
function crowd(y, n, seed, h0, h1, o = {}, t = 0) { const R = rng(seed); const list = []; for (let i = 0; i < n; i++) list.push({ x: R() * (W + 200) - 100, h: lerp(h0, h1, R()), f: R() > .5 ? 1 : -1, ph: R() * 6, hat: o.hats ? o.hats[Math.floor(R() * o.hats.length)] : o.hat, a: (R() - .5) * .4 });
  list.sort((a, b) => a.h - b.h).forEach((p, i) => person(p.x, y + (p.h - h0) * .3, p.h, { ...o, face: p.f, walk: o.walking ? t * 6 + p.ph : 0, arm: o.cheer ? Math.sin(t * 5 + i) * .8 + .4 : p.a, hat: p.hat, expr: o.expr || (o.cheer ? 'happy' : (i % 3 ? 'smile' : 'talk')) })); }

// ---------- animales con personalidad ----------
function emu(x, y, s, ph = 0, f = 1) { const col = '#6b5238'; X.save(); X.translate(x, y); X.scale(s * f, s);
  X.fillStyle = 'rgba(0,0,0,.2)'; X.beginPath(); X.ellipse(0, 0, 50, 9, 0, 0, 7); X.fill();
  const lg = Math.sin(ph) * 22, bounce = Math.abs(Math.cos(ph)) * 8; X.translate(0, -bounce);
  [[-10, lg], [10, -lg]].forEach(([dx, sw]) => { outline(9); X.beginPath(); X.moveTo(dx, -80); X.lineTo(dx + sw * .4 - 6, -42); X.lineTo(dx + sw, -2); X.stroke(); X.strokeStyle = '#8a7a6a'; X.lineWidth = 5; X.stroke();
    outline(5); X.beginPath(); X.moveTo(dx + sw - 10, 0); X.lineTo(dx + sw + 14, 0); X.stroke(); });
  X.beginPath(); X.ellipse(0, -108, 60, 44, -.12, 0, 7); blob(col, 4);
  X.strokeStyle = shade(col, -.35); X.lineWidth = 3; for (let i = 0; i < 9; i++) { X.beginPath(); X.moveTo(-46 + i * 11, -96); X.quadraticCurveTo(-48 + i * 11, -80, -52 + i * 11 + Math.sin(ph + i) * 3, -70); X.stroke(); }
  outline(17); X.beginPath(); X.moveTo(40, -128); X.quadraticCurveTo(62, -165 + Math.sin(ph * .5) * 4, 56, -200); X.stroke(); X.strokeStyle = '#7a8aa0'; X.lineWidth = 10; X.stroke();
  X.beginPath(); X.ellipse(60, -210, 21, 18, .15, 0, 7); blob('#3a3530', 4);
  X.beginPath(); X.moveTo(76, -214); X.quadraticCurveTo(100, -208, 78, -200); X.closePath(); blob('#e0b060', 3);
  X.beginPath(); X.ellipse(64, -216, 9, 11, 0, 0, 7); blob('#fff', 2.5); X.fillStyle = '#1a1210'; X.beginPath(); X.arc(67, -215, 5, 0, 7); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.arc(68.5, -217, 1.8, 0, 7); X.fill();
  if (((NOW + x * .01) % 3.1) < .12) { X.fillStyle = '#3a3530'; X.beginPath(); X.ellipse(64, -216, 10, 12, 0, 0, 7); X.fill(); }
  outline(3); X.beginPath(); X.moveTo(56, -230); X.lineTo(70, -226); X.stroke(); X.restore(); }
function mammoth(x, y, s, ph = 0, f = 1) { X.save(); X.translate(x, y); X.scale(s * f, s);
  X.fillStyle = 'rgba(0,0,0,.2)'; X.beginPath(); X.ellipse(0, 0, 130, 16, 0, 0, 7); X.fill(); const lg = Math.sin(ph) * 7;
  [[-62, lg], [-26, -lg], [36, -lg], [68, lg]].forEach(([a, o]) => { X.beginPath(); X.roundRect(a - 16 + o, -96, 34, 96, 12); blob('#6a4a34', 4); });
  X.beginPath(); X.ellipse(0, -142, 118, 86, 0, 0, 7); blob('#8a5f42', 4);
  X.strokeStyle = '#6a4630'; X.lineWidth = 3; for (let i = 0; i < 18; i++) { X.beginPath(); X.moveTo(-100 + i * 11, -88); X.quadraticCurveTo(-102 + i * 11, -72, -104 + i * 11 + Math.sin(i + ph) * 3, -62); X.stroke(); }
  X.beginPath(); X.ellipse(98, -176, 60, 62, 0, 0, 7); blob('#8a5f42', 4); X.beginPath(); X.ellipse(76, -226, 42, 26, 0, 0, 7); blob('#7a5038', 4);
  outline(30); X.beginPath(); X.moveTo(146, -168); X.quadraticCurveTo(176, -90, 150 + Math.sin(ph * .7) * 12, -36); X.quadraticCurveTo(140, -24, 128, -40); X.stroke(); X.strokeStyle = '#8a5f42'; X.lineWidth = 22; X.stroke();
  outline(16); X.beginPath(); X.moveTo(132, -140); X.quadraticCurveTo(212, -70, 170, -160); X.stroke(); X.strokeStyle = '#f6eedc'; X.lineWidth = 10; X.stroke();
  X.beginPath(); X.ellipse(70, -176, 26, 34, 0, 0, 7); blob('#7a5038', 4);
  X.beginPath(); X.ellipse(120, -192, 11, 13, 0, 0, 7); blob('#fff', 3); X.fillStyle = '#1a1210'; X.beginPath(); X.arc(123, -191, 6, 0, 7); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.arc(125, -194, 2, 0, 7); X.fill();
  X.fillStyle = 'rgba(255,120,120,.35)'; X.beginPath(); X.arc(132, -170, 9, 0, 7); X.fill(); X.restore(); }
