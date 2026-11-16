// Estructuras rehechas con el mismo estilo que los personajes (contorno negro grueso, volumen y detalle).
// Se carga después de escenas1/escenas2: sustituye funciones y escenas con fallos.
const OL = 5;                                   // grosor de contorno de edificios
function ob(fill, w = OL) { X.fillStyle = fill; X.fill(); X.lineWidth = w; X.strokeStyle = INK; X.lineJoin = 'round'; X.stroke(); }
function rect(x, y, w, h, fill, r = 0, lw = OL) { X.beginPath(); r ? X.roundRect(x, y, w, h, r) : X.rect(x, y, w, h); ob(fill, lw); }
function win(x, y, w, h, lit, arch = true) { X.beginPath(); arch ? X.roundRect(x, y, w, h, [w / 2, w / 2, 2, 2]) : X.rect(x, y, w, h); ob(lit ? '#ffd27a' : '#2b3550', 3.5);
  if (lit) glow(x + w / 2, y + h / 2, w * 1.6, '#ffb347', .25); }
function shadeRight(x, y, w, h, a = .18) { X.fillStyle = `rgba(0,0,0,${a})`; X.fillRect(x + w * .72, y, w * .28, h); }

// ---------- Esfinge y caballo ----------
function sphinx(x, by, s) { X.save(); X.translate(x, by); X.scale(s, s);
  X.beginPath(); X.moveTo(-170, 0); X.lineTo(-170, -50); X.quadraticCurveTo(-140, -80, -40, -80); X.lineTo(60, -80); X.lineTo(70, -60); X.lineTo(150, -55); X.lineTo(160, 0); X.closePath(); ob('#c99a5c');
  X.beginPath(); X.moveTo(40, -80); X.lineTo(44, -150); X.quadraticCurveTo(70, -185, 100, -150); X.lineTo(104, -80); X.closePath(); ob('#d6aa6a');
  X.beginPath(); X.moveTo(36, -150); X.lineTo(30, -95); X.lineTo(48, -100); X.lineTo(52, -150); X.closePath(); ob('#b88a4e', 3); X.beginPath(); X.moveTo(108, -150); X.lineTo(114, -95); X.lineTo(96, -100); X.lineTo(92, -150); X.closePath(); ob('#b88a4e', 3);
  X.beginPath(); X.ellipse(72, -122, 18, 24, 0, 0, 7); ob('#c99a5c', 3); X.fillStyle = INK; X.fillRect(62, -128, 7, 3); X.fillRect(78, -128, 7, 3);
  X.restore(); }
function horse(x, y, s, f = 1, col = '#7a4a2a') { X.save(); X.translate(x, y); X.scale(s * f, s);
  [[-50, 6], [-30, -6], [38, -6], [58, 6]].forEach(([a, o]) => { X.beginPath(); X.moveTo(a - 7, -78); X.lineTo(a + 7, -78); X.lineTo(a + 6 + o, -6); X.lineTo(a - 6 + o, -6); X.closePath(); ob(shade(col, -.15), 4); X.beginPath(); X.rect(a - 8 + o, -10, 16, 10); ob('#222', 3); });
  X.beginPath(); X.ellipse(0, -100, 82, 36, 0, 0, 7); ob(col);
  X.beginPath(); X.moveTo(52, -118); X.quadraticCurveTo(70, -170, 92, -190); X.lineTo(118, -186); X.quadraticCurveTo(102, -150, 86, -96); X.closePath(); ob(col);
  X.beginPath(); X.moveTo(88, -196); X.quadraticCurveTo(150, -186, 152, -164); X.quadraticCurveTo(140, -150, 108, -160); X.closePath(); ob(col);
  X.beginPath(); X.moveTo(90, -196); X.lineTo(96, -214); X.lineTo(104, -194); ob(col, 3);
  X.beginPath(); X.moveTo(60, -126); X.quadraticCurveTo(70, -190, 96, -198); X.lineTo(86, -170); X.quadraticCurveTo(70, -140, 66, -112); X.closePath(); ob('#2a1a10', 3);
  X.beginPath(); X.moveTo(-78, -112); X.quadraticCurveTo(-120, -90, -104, -30); X.quadraticCurveTo(-92, -70, -72, -96); ob('#2a1a10', 3);
  X.fillStyle = INK; X.beginPath(); X.arc(116, -180, 4, 0, 7); X.fill();
  X.beginPath(); X.ellipse(-6, -132, 34, 12, 0, 0, 7); ob('#8a1a1a', 3); X.restore(); }

// ---------- Zanzíbar ----------
function palace(x, by, s, col = '#f4efe4') { X.save(); X.translate(x, by); X.scale(s, s);
  rect(-280, -200, 560, 200, col); shadeRight(-280, -200, 560, 200, .08);
  for (let r = 0; r < 3; r++) { rect(-288, -200 + r * 66, 576, 10, shade(col, -.12), 0, 3); for (let i = 0; i < 11; i++) win(-262 + i * 49, -184 + r * 66, 26, 42, false); }
  rect(-48, -360, 96, 170, col); shadeRight(-48, -360, 96, 170, .08); rect(-58, -378, 116, 22, shade(col, -.12), 0, 4);
  X.beginPath(); X.moveTo(-50, -378); X.lineTo(0, -430); X.lineTo(50, -378); X.closePath(); ob('#b8462e');
  X.beginPath(); X.arc(0, -310, 30, 0, 7); ob('#ffffff', 4); X.strokeStyle = INK; X.lineWidth = 4; X.beginPath(); X.moveTo(0, -310); X.lineTo(0, -330); X.moveTo(0, -310); X.lineTo(14, -310); X.stroke();
  rect(-60, -60, 120, 60, '#6a4a2a', 0, 4); X.restore(); }
S.zanzibar_palace = (t, d) => { sky(SKY.day); sun(1600, 180, 60); clouds(t, 91, 'rgba(255,255,255,.9)', 60, 280, 5, 10);
  ground(560, '#f2e4c4', '#e2cc9a'); palace(960, 650, 1.15); palm(330, 660, 340, t); palm(1600, 660, 380, t + 1);
  sea(700, t, '#2bb0c4', '#0b5d78'); ship(1500, 880, .55, t); ship(380, 920, .5, t + 1); vignette(.35); };
S.zanzibar_fire = (t, d) => { sky(['#2a2a33', '#5a4a44', '#a0705a', '#d8a070']); clouds(t, 93, 'rgba(60,60,60,.5)', 60, 300, 6, 18);
  ground(560, '#cdbb9a', '#a8946e'); palace(1350, 650, .85, '#e6e0cf'); smoke(1350, 420, t, 1.8, '#444'); smoke(1150, 470, t + 1.5, 1.4, '#555');
  for (let i = 0; i < 3; i++) { const k = (t * 1.2 + i / 3) % 1; flash(lerp(1180, 1520, (i * .37) % 1), 520 + i * 40, 60, Math.max(0, 1 - k * 3)); }
  sea(700, t, '#3a6070', '#0e2a35'); const fire = i => Math.max(0, Math.sin(t * 3 + i * 2)) ** 8; ship(620, 900, .9, t, fire(0)); ship(160, 860, .6, t + 2, fire(1));
  particles(t, 60, 95, '#ffb070', 'embers'); vignette(.5); };

// ---------- Roma ----------
function romanHouse(x, w, h, col, t) { const y = 760 - h; rect(x, y, w, h, col); shadeRight(x, y, w, h, .1);
  X.beginPath(); X.moveTo(x - 16, y); X.lineTo(x + w / 2, y - 60); X.lineTo(x + w + 16, y); X.closePath(); ob('#b5532f');
  for (let i = 0; i < Math.floor(w / 70); i++) win(x + 24 + i * 70, y + 40, 34, 50, false, false);
  rect(x + w / 2 - 34, 760 - 110, 68, 110, '#5a3418', 0, 4);
  X.beginPath(); X.moveTo(x + 10, 760 - 140); X.lineTo(x + w - 10, 760 - 140); X.lineTo(x + w + 6, 760 - 110); X.lineTo(x - 6, 760 - 110); X.closePath(); ob(['#c0392b', '#e8b43a', '#2e86c1'][Math.floor(x) % 3]); }
function romeBg(t) { sky(SKY.day); sun(1650, 150, 55); clouds(t, 341, 'rgba(255,255,255,.85)', 60, 230, 5, 10);
  // templo al fondo
  X.save(); X.translate(960, 560); rect(-260, -40, 520, 40, '#e8e0cc'); for (let i = 0; i < 8; i++) rect(-240 + i * 66, -250, 30, 210, '#f2ecdc', 0, 4);
  X.beginPath(); X.moveTo(-280, -250); X.lineTo(0, -340); X.lineTo(280, -250); X.closePath(); ob('#e8e0cc'); X.restore();
  [[40, 230, 300, '#e9c99a'], [300, 260, 380, '#d8a46a'], [1340, 270, 360, '#e3b98a'], [1640, 250, 300, '#d9b07a']].forEach(([x, w, h, c]) => romanHouse(x, w, h, c, t));
  ground(760, '#b9a689', '#6d5d48'); X.strokeStyle = 'rgba(60,40,20,.35)'; X.lineWidth = 3; for (let i = 0; i < 12; i++) { X.beginPath(); X.moveTo(0, 800 + i * 26); X.lineTo(W, 800 + i * 26); X.stroke(); } }
S.fullonica = (t, d) => { sky(['#5a4632', '#7a6448', '#8a7454', '#4a3a28']); X.fillStyle = '#a89070'; X.fillRect(0, 560, W, 520);
  for (let i = 0; i < 6; i++) rect(80 + i * 320, 140, 60, 420, '#cdb894', 0, 4);
  txt('Lavandería romana (fullonica)', 1150, 230, 52, '#fff', { stroke: 9 });
  [[420, 0], [960, 1], [1500, 2]].forEach(([x, i]) => { const bob = Math.abs(Math.sin(t * 5 + i)) * 14;
    person(x, 880 - bob, 330, { walk: t * 8 + i, arm: Math.sin(t * 5 + i) * .4 + .4, cloth: ['#3d9970', '#e8a33a', '#5b8fd9'][i], expr: i === 1 ? 'talk' : 'smile' });
    // pila de piedra delante (tapa las piernas)
    X.beginPath(); X.moveTo(x - 220, 810); X.lineTo(x + 220, 810); X.lineTo(x + 205, 960); X.lineTo(x - 205, 960); X.closePath(); ob('#bfae8e');
    X.beginPath(); X.ellipse(x, 810, 220, 28, 0, 0, 7); ob('#d8c66a', 4); X.fillStyle = 'rgba(255,255,255,.35)';
    for (let b = 0; b < 6; b++) { const k = (t * .6 + b / 6 + i * .3) % 1; X.beginPath(); X.arc(x - 150 + b * 60, 805 - k * 90, 9 * (1 - k), 0, 7); X.fill(); } });
  vignette(.5); };
S.teeth = (t, d) => { romeBg(t); X.fillStyle = 'rgba(0,0,0,.35)'; X.fillRect(0, 0, W, H);
  person(960, 1250, 1050, { hat: 'laurel', expr: 'laugh', arm: .6 });
  for (let i = 0; i < 6; i++) { const k = (t * 1.2 + i / 6) % 1, a = i * 1.05; X.globalAlpha = 1 - k; txt('✦', 980 + Math.cos(a) * 160 * (1 + k), 560 + Math.sin(a) * 70 * (1 + k), 60, '#fff'); } X.globalAlpha = 1;
  txt('¿Blanqueador de dientes?', 960, 190, 62, GOLD, { w: 900, stroke: 10 }); vignette(.5); };
S.vespasian = (t, d) => { romeBg(t); X.fillStyle = 'rgba(0,0,0,.3)'; X.fillRect(0, 0, W, H);
  // trono
  rect(470, 600, 300, 300, '#7a1f2a', 20); rect(450, 560, 340, 60, '#c9a227', 16); rect(440, 880, 360, 60, '#c9a227', 10);
  person(620, 960, 520, { hat: 'laurel', expr: 'talk', arm: .7, look: { cloth: '#f4efe4', trim: '#7b2d8e' } });
  txt('VESPASIANO', 620, 230, 64, '#fff', { w: 900, stroke: 10 });
  const k = back(prog(t, .5, 1.1)); if (k > 0) { X.save(); X.translate(1350, 470); X.rotate(-.06); X.scale(k, k); panel(-300, -140, 600, 280, 20, '#f3e6c8', INK, 8); txt('IMPUESTO', 0, -50, 80, '#7a1a1a', { w: 900 }); txt('sobre la orina', 0, 40, 50, '#3a2a1a'); X.restore(); }
  for (let i = 0; i < 6; i++) { const k2 = ((t * .7 + i / 6) % 1); coin(1150 + i * 70, 720 + k2 * 120, 30, t * 4 + i); } vignette(.5); };

// ---------- Módena ----------
function belltower(x, by, s, t) { X.save(); X.translate(x, by); X.scale(s, s);
  for (let i = 0; i < 5; i++) { const w = 200 - i * 8; rect(-w / 2, -160 * (i + 1), w, 160, i % 2 ? '#e2d6be' : '#d8cab0'); rect(-w / 2 - 8, -160 * (i + 1), w + 16, 12, '#c4b394', 0, 3);
    if (i > 0) { win(-50, -160 * (i + 1) + 40, 28, 70, false); win(22, -160 * (i + 1) + 40, 28, 70, false); } }
  rect(-80, -930, 160, 130, '#e2d6be'); for (let i = 0; i < 3; i++) win(-62 + i * 46, -910, 32, 90, i === 1);
  X.beginPath(); X.moveTo(-90, -930); X.lineTo(0, -1180); X.lineTo(90, -930); X.closePath(); ob('#cfc1a4'); X.beginPath(); X.moveTo(0, -1180); X.lineTo(0, -1230); X.lineWidth = 6; X.stroke();
  X.restore(); }
S.bucket_tower = (t, d) => { sky(SKY.dawn); clouds(t, 161, 'rgba(255,230,210,.6)', 60, 300, 5, 8); hills(820, 40, '#8a7a6a', .4, 1);
  belltower(560, 1000, .85, t); ground(980, '#b8a888', '#7a6a50');
  rect(1150, 440, 520, 460, '#f3e6c8', 20, 6); bucket(1410, 870, 1.1, .35);
  txt('Módena, hoy', 1410, 510, 58, '#3a2a1a', { w: 900 }); txt('«La Secchia Rapita»', 1410, 570, 40, '#8a4a1a');
  vignette(.45); };
function medievalTown(t, night = true) { const R = rng(808);
  for (let i = 0; i < 9; i++) { const x = i * 230 - 40, w = 150 + R() * 70, h = 220 + R() * 200, y = 720 - h, c = night ? '#1c2236' : '#b89a7a';
    rect(x, y, w, h, c, 0, 4); for (let k = 0; k < Math.floor(w / 36); k++) { X.beginPath(); X.rect(x + k * 36, y - 22, 22, 22); ob(c, 4); }
    for (let r = 0; r < 2; r++) win(x + 24 + r * (w - 70), y + 50, 22, 40, night && R() > .4); }
  // torre con chapitel
  rect(1450, 160, 120, 560, night ? '#20283e' : '#c4a888', 0, 4); X.beginPath(); X.moveTo(1440, 160); X.lineTo(1510, 20); X.lineTo(1580, 160); X.closePath(); ob(night ? '#2a3350' : '#a8754a'); win(1490, 260, 40, 80, night); }
S.bucket_theft = (t, d) => { sky(SKY.night); stars(200, 131, t, 600); moon(1720, 140, 60); medievalTown(t, true); ground(700, '#1d2333', '#07090f');
  // pozo
  X.save(); X.translate(960, 780); rect(-120, -80, 240, 80, '#4a4f5c', 6); X.beginPath(); X.ellipse(0, -80, 120, 22, 0, 0, 7); ob('#2a2e38', 4); rect(-110, -230, 18, 150, '#5a3a20', 0, 4); rect(92, -230, 18, 150, '#5a3a20', 0, 4); rect(-130, -250, 260, 26, '#6b4428', 6, 4); X.restore();
  const x = lerp(560, 1350, ease(prog(t, 0, d))); person(x, 1000, 330, { hat: 'cap', torch: true, arm: .9, walk: t * 6, expr: 'smile' });
  person(x + 170, 1010, 340, { hat: 'cap', walk: t * 6 + 1, arm: .4, expr: 'talk', item: (a, b) => { X.save(); X.translate(a, b + 90); X.scale(.38, .38); bucket(0, 0, 1); X.restore(); } }); vignette(.55); };

// ---------- Machu Picchu ----------
S.machu_picchu = (t, d) => { sky(SKY.dawn); sun(400, 300, 50); mountains(321, 620, 300, '#8090b0', 6);
  X.beginPath(); X.moveTo(1150, 760); X.quadraticCurveTo(1290, 150, 1420, 170); X.quadraticCurveTo(1530, 320, 1680, 760); X.closePath(); ob('#3f6a35');
  X.beginPath(); X.moveTo(0, 1080); X.lineTo(0, 760); X.quadraticCurveTo(700, 640, 1350, 740); X.lineTo(1920, 1080); X.closePath(); ob('#4e7a3a');
  for (let i = 0; i < 6; i++) { const y = 800 + i * 44, w = 1000 - i * 70; X.beginPath(); X.rect(170 + i * 35, y, w, 30); ob(i % 2 ? '#5b8a44' : '#679a4c', 3); X.fillStyle = '#8a8274'; X.fillRect(170 + i * 35, y + 24, w, 6); }
  // edificios de piedra con puertas trapezoidales y techo de paja
  [[360, 730], [520, 715], [680, 705], [860, 712], [1020, 722]].forEach(([x, y], i) => { rect(x - 60, y - 70, 120, 70, '#a8a090', 0, 4);
    X.beginPath(); X.moveTo(x - 14, y); X.lineTo(x - 10, y - 46); X.lineTo(x + 10, y - 46); X.lineTo(x + 14, y); X.closePath(); ob('#3a3328', 3);
    if (i % 2 === 0) { X.beginPath(); X.moveTo(x - 72, y - 70); X.lineTo(x, y - 128); X.lineTo(x + 72, y - 70); X.closePath(); ob('#c49a4a', 4); } });
  for (let l = 0; l < 3; l++) { X.fillStyle = `rgba(255,255,255,${.3 - l * .08})`; for (let i = 0; i < 5; i++) { X.beginPath(); X.ellipse(((i * 500 + t * (20 + l * 10)) % 2600) - 300, 640 + l * 70, 360, 50, 0, 0, 7); X.fill(); } }
  condor(1000 + Math.sin(t * .3) * 300, 280, 1, t); vignette(.4); };

// ---------- Boston ----------
function brick(x, w, h, c, t) { const y = 760 - h; rect(x, y, w, h, c); shadeRight(x, y, w, h, .12); rect(x - 8, y - 16, w + 16, 18, shade(c, -.25), 0, 4);
  const cols = Math.floor((w - 30) / 46), rows = Math.floor((h - 120) / 70);
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) win(x + 22 + k * 46, y + 30 + r * 70, 26, 42, false, false);
  rect(x + w / 2 - 26, 760 - 90, 52, 90, '#3a2414', 0, 4); }
function bostonBg(t, skyc = SKY.day) { sky(skyc); clouds(t, 361, 'rgba(255,255,255,.75)', 50, 220, 5, 10);
  [[0, 210, 380, '#9a3f2c'], [230, 180, 300, '#7c3626'], [430, 220, 440, '#a54a32'], [670, 170, 330, '#86412e'], [1640, 200, 400, '#9a3f2c'], [1860, 160, 320, '#7c3626']].forEach(([x, w, h, c]) => brick(x, w, h, c, t));
  ground(760, '#7a7a7a', '#3e3e3e'); rect(-10, 760, W + 20, 18, '#9a9a9a', 0, 3);
  for (let i = 0; i < 4; i++) { const x = 180 + i * 520; rect(x - 5, 560, 10, 200, '#222', 0, 2); X.beginPath(); X.arc(x, 556, 14, 0, 7); ob('#ffe9a0', 3); } }
function tank(x, y, s, burst = 0) { X.save(); X.translate(x, y); X.scale(s, s); const g = X.createLinearGradient(-250, 0, 250, 0); g.addColorStop(0, '#5a6068'); g.addColorStop(.4, '#aab2ba'); g.addColorStop(1, '#4a4f55');
  X.beginPath(); X.rect(-250, -440, 500, 440); X.fillStyle = g; X.fill(); X.lineWidth = OL; X.strokeStyle = INK; X.stroke();
  X.beginPath(); X.ellipse(0, -440, 250, 46, 0, 0, 7); ob('#9aa2aa'); X.strokeStyle = 'rgba(0,0,0,.3)'; X.lineWidth = 3; for (let i = 1; i < 7; i++) { X.beginPath(); X.moveTo(-250, -62 * i); X.lineTo(250, -62 * i); X.stroke(); }
  X.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 7; i++) for (let k = 0; k < 12; k++) { X.beginPath(); X.arc(-230 + k * 42, -62 * i, 3, 0, 7); X.fill(); }
  if (burst > 0) { X.beginPath(); X.moveTo(-30, -330); for (let i = 0; i < 9; i++) X.lineTo((i % 2 ? 70 : 20) * burst + i * 6 - 30, -330 + i * 36); X.lineTo(-60, 0); X.closePath(); ob('#3a1606', 4); }
  X.restore(); }
S.molasses_wave = (t, d) => { bostonBg(t, SKY.storm); const k = ease(prog(t, 0, d)); const front = lerp(W + 100, -200, k);
  X.beginPath(); X.moveTo(W + 200, H); X.lineTo(W + 200, 520);
  for (let x = W + 200; x >= front; x -= 30) { const crest = x - front < 260 ? (260 - (x - front)) * .55 : 0; X.lineTo(x, 540 + Math.sin(x / 70 + t * 4) * 22 - (x - front < 260 ? 0 : 0) + crest * .2 - (x - front < 140 ? 60 * Math.sin((x - front) / 140 * Math.PI) : 0)); }
  X.lineTo(front - 40, H); X.closePath(); const g = X.createLinearGradient(0, 480, 0, H); g.addColorStop(0, '#7a3e12'); g.addColorStop(1, '#2a1004'); X.fillStyle = g; X.fill(); X.lineWidth = OL; X.strokeStyle = INK; X.stroke();
  X.fillStyle = 'rgba(255,210,150,.35)'; for (let x = front + 60; x < W; x += 110) { X.beginPath(); X.ellipse(x, 548 + Math.sin(x / 70 + t * 4) * 22, 36, 7, 0, 0, 7); X.fill(); }
  for (let i = 0; i < 4; i++) { const x = front - 220 - i * 190; if (x > -100) person(x, 1000, 230, { hat: 'cap', walk: t * 12 + i, face: -1, arm: 1.2, expr: 'surprised' }); }
  txt('≈ 55 km/h', 1500, 230, 64, GOLD, { w: 900, stroke: 9 }); vignette(.5); };

// ---------- Estrasburgo ----------
function cathedral(x, by, s) { X.save(); X.translate(x, by); X.scale(s, s);
  rect(-230, -520, 460, 520, '#c98f80'); shadeRight(-230, -520, 460, 520, .1);
  rect(-150, -900, 150, 380, '#c98f80'); X.beginPath(); X.moveTo(-160, -900); X.lineTo(-75, -1200); X.lineTo(10, -900); X.closePath(); ob('#b87c6e');
  for (let i = 0; i < 4; i++) win(-120 + (i % 2) * 60, -860 + Math.floor(i / 2) * 150, 30, 100, false);
  X.beginPath(); X.arc(0, -380, 90, 0, 7); ob('#3a5a9a'); X.strokeStyle = INK; X.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; X.beginPath(); X.moveTo(0, -380); X.lineTo(Math.cos(a) * 90, -380 + Math.sin(a) * 90); X.stroke(); }
  X.beginPath(); X.arc(0, -380, 26, 0, 7); ob('#e8b43a', 3);
  X.beginPath(); X.moveTo(-80, 0); X.lineTo(-80, -170); X.quadraticCurveTo(0, -270, 80, -170); X.lineTo(80, 0); X.closePath(); ob('#4a2a1a');
  [-190, 150].forEach(px => { X.beginPath(); X.moveTo(px, 0); X.lineTo(px, -120); X.quadraticCurveTo(px + 20, -160, px + 40, -120); X.lineTo(px + 40, 0); X.closePath(); ob('#4a2a1a', 4); });
  X.restore(); }
function timberHouse(x, w, h, c, beam) { const y = 800 - h; rect(x, y, w, h, c); shadeRight(x, y, w, h, .08);
  X.strokeStyle = beam; X.lineWidth = 9; X.beginPath(); X.moveTo(x, y + h * .5); X.lineTo(x + w, y + h * .5); X.moveTo(x + w / 2, y); X.lineTo(x + w / 2, y + h); X.moveTo(x, y); X.lineTo(x + w / 2, y + h * .5); X.moveTo(x + w, y); X.lineTo(x + w / 2, y + h * .5); X.stroke();
  X.beginPath(); X.rect(x, y, w, h); X.lineWidth = OL; X.strokeStyle = INK; X.stroke();
  win(x + 18, y + h * .58, 30, 44, false, false); win(x + w - 48, y + h * .58, 30, 44, false, false);
  X.beginPath(); X.moveTo(x - 14, y); X.lineTo(x + w / 2, y - 130); X.lineTo(x + w + 14, y); X.closePath(); ob('#9a3a24'); }
function strasBg(t) { sky(SKY.dawn); clouds(t, 381, 'rgba(255,230,210,.5)', 60, 260, 5, 8); cathedral(960, 800, .9);
  [[20, 200, 380, '#f1e4c8', '#6b3a1e'], [240, 180, 330, '#f4d9b0', '#5a2e16'], [440, 170, 360, '#efe0d0', '#6b3a1e'],
   [1290, 180, 350, '#f2dcc0', '#5a2e16'], [1490, 200, 390, '#f1e4c8', '#6b3a1e'], [1710, 190, 340, '#f4d9b0', '#5a2e16']].forEach(([x, w, h, c, b]) => timberHouse(x, w, h, c, b));
  ground(800, '#8a7a6a', '#4a4036'); X.strokeStyle = 'rgba(40,30,20,.3)'; X.lineWidth = 3; for (let i = 0; i < 10; i++) { X.beginPath(); X.moveTo(0, 830 + i * 26); X.lineTo(W, 830 + i * 26); X.stroke(); } }

// ---------- Fax de 1843 ----------
S.fax_machine = (t, d) => { sky(SKY.indoor); X.fillStyle = '#4a2c16'; X.fillRect(0, 760, W, 320); txt('1843', 1500, 220, 90, GOLD, { w: 900, stroke: 10 });
  X.save(); X.translate(960, 760); rect(-420, -40, 840, 40, '#6b4428', 8);
  // dos pilares de latón con péndulo
  rect(-330, -520, 40, 480, '#c9a227', 8); rect(290, -520, 40, 480, '#c9a227', 8); rect(-350, -540, 700, 40, '#b8901e', 10);
  const a = Math.sin(t * 2.5) * .45; X.save(); X.translate(0, -500); X.rotate(a); X.lineWidth = 8; X.strokeStyle = INK; X.beginPath(); X.moveTo(0, 0); X.lineTo(0, 320); X.stroke(); X.strokeStyle = '#d8b04a'; X.lineWidth = 4; X.stroke(); X.beginPath(); X.arc(0, 330, 34, 0, 7); ob('#c9a227', 4); X.restore();
  // cilindro con el papel y la aguja
  X.beginPath(); X.ellipse(-180, -110, 30, 60, 0, 0, 7); ob('#8a6a2a', 4); rect(-180, -170, 360, 120, '#f3e6c8', 0, 4); X.beginPath(); X.ellipse(180, -110, 30, 60, 0, 0, 7); ob('#b89040', 4);
  X.fillStyle = INK; const n = Math.floor((t * 6) % 14); for (let i = 0; i < n; i++) X.fillRect(-160 + i * 24, -150 + (i % 3) * 30, 16, 12);
  rect(-20, -230, 40, 70, '#555', 6, 4); X.restore();
  X.strokeStyle = INK; X.lineWidth = 6; X.beginPath(); X.moveTo(1290, 700); X.quadraticCurveTo(1600, 360, 1920, 400); X.stroke(); X.strokeStyle = '#c9a227'; X.lineWidth = 3; X.stroke(); vignette(.55); };

// ---------- París de noche ----------
S.dark_paris = (t, d) => { sky(SKY.storm); clouds(t, 441, 'rgba(30,30,40,.7)', 40, 400, 8, 30); const fl = Math.max(0, Math.sin(t * 2.3)) ** 30; if (fl > .1) { X.fillStyle = `rgba(220,230,255,${fl * .4})`; X.fillRect(0, 0, W, H); }
  X.save(); X.translate(960, 900); X.fillStyle = '#0c0e16'; X.strokeStyle = INK; X.lineWidth = 4;
  X.beginPath(); X.moveTo(-230, 0); X.quadraticCurveTo(-120, -260, -60, -420); X.lineTo(-24, -700); X.lineTo(-8, -820); X.lineTo(8, -820); X.lineTo(24, -700); X.lineTo(60, -420); X.quadraticCurveTo(120, -260, 230, 0); X.lineTo(150, 0); X.quadraticCurveTo(0, -200, -150, 0); X.closePath(); X.fill();
  X.fillRect(-120, -270, 240, 24); X.fillRect(-60, -470, 120, 18); X.fillRect(-4, -880, 8, 70); X.restore();
  X.fillStyle = '#080a10'; for (let i = 0; i < 12; i++) { const x = i * 170, h = 160 + (i * 53) % 140; X.fillRect(x, 900 - h, 150, h + 200); X.fillStyle = 'rgba(255,200,120,.5)'; if (i % 3 === 0) X.fillRect(x + 40, 900 - h + 40, 22, 30); X.fillStyle = '#080a10'; }
  vignette(.6); };

// ---------- transición de marca más sutil (sin disco gigante) ----------
function chispaLayer(t) {
  if (!TL.datos.length) return; const [ts, n] = TL.datos.filter(([a]) => a <= t + .4).slice(-1)[0] || [null, null];
  TL.datos.forEach(([a]) => { const k = (t - (a - .3)) / .6; if (k > 0 && k < 1) { const s = Math.sin(k * Math.PI);
    X.save(); X.globalCompositeOperation = 'screen'; X.fillStyle = rgba('#ffd27a', .35 * s); X.fillRect(0, 0, W, H); X.restore();
    X.save(); X.globalAlpha = s; X.translate(lerp(W + 300, -300, k), 540); X.rotate(-.25); const g = X.createLinearGradient(-400, 0, 400, 0); g.addColorStop(0, 'rgba(255,196,46,0)'); g.addColorStop(.5, 'rgba(255,230,150,.9)'); g.addColorStop(1, 'rgba(255,196,46,0)'); X.fillStyle = g; X.fillRect(-400, -1200, 800, 2400); X.restore(); } });
  if (ts == null || t < ts || t >= TL.outro - .3) return;
  const lt = t - ts, inK = ease(prog(lt, .2, .8));
  const x = lerp(2150, 1790, inK), y = 905; const phase = lt > 4.6 && lt < 7.2;
  chispa(x, y, .62, { expr: phase ? 'talk' : (lt < 4.6 ? 'surprised' : 'happy'), wave: lt > 4.6 && lt < 5.4, look: -.6 });
  bubble(x - 80, y - 120, CHISPA_FRASES[n] || '¡Wow!', prog(lt, 4.6, 5) * (1 - prog(lt, 7, 7.3)), -1, 40);
}

// contorno para pirámides, templo azteca y Coliseo
function pyramid(x, by, w, h, light = '#e6c084', dark = '#9c7446', eroded = 0) { const R = rng(Math.round(x + w));
  X.beginPath(); X.moveTo(x - w / 2, by); X.lineTo(x, by - h); X.lineTo(x + w * .18, by); X.closePath(); X.fillStyle = light; X.fill();
  X.beginPath(); X.moveTo(x, by - h); X.lineTo(x + w / 2, by); X.lineTo(x + w * .18, by); X.closePath(); X.fillStyle = dark; X.fill();
  X.strokeStyle = 'rgba(80,50,20,.25)'; X.lineWidth = 1.5; const rows = 26; for (let i = 1; i < rows; i++) { const yy = by - h * i / rows, k = i / rows; X.beginPath(); X.moveTo(x - w / 2 * (1 - k), yy); X.lineTo(x + w / 2 * (1 - k), yy); X.stroke(); }
  if (eroded) { X.fillStyle = 'rgba(60,40,20,.25)'; for (let i = 0; i < 40 * eroded; i++) { const k = R(), yy = by - h * k, half = w / 2 * (1 - k); X.fillRect(x - half + R() * half * 2, yy, 6 + R() * 18, 4 + R() * 6); } }
  X.beginPath(); X.moveTo(x - w / 2, by); X.lineTo(x, by - h); X.lineTo(x + w / 2, by); X.lineWidth = OL; X.strokeStyle = INK; X.lineJoin = 'round'; X.stroke();
  X.beginPath(); X.moveTo(x, by - h); X.lineTo(x + w * .18, by); X.lineWidth = 3; X.stroke(); }
S.aztec_temple = (t, d) => { sky(SKY.sunset); sun(300, 500, 60); clouds(t, 22, 'rgba(255,170,130,.3)', 80, 300, 5, 8);
  X.save(); X.translate(960, 900);
  for (let i = 0; i < 6; i++) rect(-(1100 - i * 140) / 2, -85 - i * 85, 1100 - i * 140, 85, i % 2 ? '#a88c6c' : '#988060', 0, 4);
  X.beginPath(); X.moveTo(-70, 0); X.lineTo(-50, -510); X.lineTo(50, -510); X.lineTo(70, 0); X.closePath(); ob('#6b5844', 4);
  X.strokeStyle = 'rgba(0,0,0,.35)'; X.lineWidth = 2; for (let i = 1; i < 26; i++) { X.beginPath(); X.moveTo(-68 + i * .8, -i * 19.6); X.lineTo(68 - i * .8, -i * 19.6); X.stroke(); }
  [[-180, '#a52a2a'], [180, '#2a5a8a']].forEach(([cx, c]) => { rect(cx - 100, -680, 200, 170, c, 0, 5); rect(cx - 30, -600, 60, 90, '#2a1a10', [30, 30, 0, 0], 4); X.beginPath(); X.moveTo(cx - 110, -680); X.lineTo(cx, -760); X.lineTo(cx + 110, -680); X.closePath(); ob(shade(c, -.2)); });
  X.restore(); smoke(780, 150, t, .7, '#888'); smoke(1140, 150, t + 1, .7, '#888'); ground(890, '#6b5638', '#2c2216');
  crowd(1050, 12, 41, 210, 260, { hats: ['inca', 'none'] }, t); vignette(.5); };
const _colosseum = S.colosseum;
S.colosseum = (t, d) => { sky(SKY.day); sun(1600, 180, 60); clouds(t, 12, 'rgba(255,255,255,.85)', 60, 300, 6, 10);
  X.save(); X.translate(960, 820); X.beginPath(); X.moveTo(-760, 0); X.lineTo(-760, -300); X.quadraticCurveTo(0, -520, 520, -440); X.lineTo(760, -260); X.lineTo(760, 0); X.closePath();
  const g = X.createLinearGradient(0, -460, 0, 0); g.addColorStop(0, '#e2c49a'); g.addColorStop(1, '#a9845a'); X.fillStyle = g; X.fill(); X.lineWidth = OL; X.strokeStyle = INK; X.stroke();
  for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) { const x = -720 + i * 82, top = -250 - r * 95; if (r === 2 && i > 13) continue; X.beginPath(); X.roundRect(x, top, 44, 70, [22, 22, 0, 0]); ob('#5a4128', 3); }
  X.strokeStyle = INK; X.lineWidth = 3; for (let r = 0; r < 3; r++) { X.beginPath(); X.moveTo(-760, -165 - r * 95); X.lineTo(r === 2 ? 400 : 760, -165 - r * 95); X.stroke(); }
  X.restore(); ground(820, '#b9a281', '#6d5a40');
  crowd(1040, 14, 31, 230, 290, { hats: ['cap', 'none', 'none', 'slouch'] }, t); vignette(.4); };
