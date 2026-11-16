// Escenas de la PARTE 2 (datos 11-20)

// ---------- Qhapaq Ñan / Machu Picchu ----------
S.inca_road = (t, d) => { sky(SKY.dawn); sun(1500, 330, 55); mountains(301, 470, 380, '#6a6f9a', 6, .7); mountains(302, 560, 280, '#4d5578', 8); clouds(t, 303, 'rgba(255,255,255,.5)', 380, 520, 6, 12);
  mountains(304, 720, 200, '#3a5530', 7); ground(720, '#4f6e36', '#1d2a14');
  X.fillStyle = '#9a8a6a'; X.beginPath(); X.moveTo(860, 720); X.quadraticCurveTo(700, 860, 300, 1080); X.lineTo(900, 1080); X.quadraticCurveTo(940, 860, 900, 720); X.fill();
  X.strokeStyle = 'rgba(70,60,40,.5)'; X.lineWidth = 2; for (let i = 0; i < 30; i++) { const y = 730 + i * i * .4; X.beginPath(); X.moveTo(880 - i * 15, y); X.lineTo(900 - i * 2, y); X.stroke(); }
  person(lerp(860, 520, ease(prog(t, 0, d))), lerp(760, 1000, ease(prog(t, 0, d))), lerp(80, 260, ease(prog(t, 0, d))), { col: '#1a0d06', hat: 'inca', walk: t * 7, cape: '#a0261d' });
  condor(lerp(1700, 200, (t * .07) % 1), 230, .9, t); vignette(.4); };
S.road_map = (t, d) => { sky(['#0d2238', '#123050', '#163a5e', '#0a1c2e']); title('Qhapaq Ñan: más de 30.000 km', prog(t, 0, .5), 110, 58);
  // Sudamérica estilizada
  const pts = [[880, 180], [1060, 200], [1200, 300], [1240, 420], [1180, 520], [1120, 640], [1040, 760], [980, 860], [930, 900], [900, 840], [880, 720], [850, 600], [800, 480], [780, 360], [820, 250]];
  X.fillStyle = '#2e5a3a'; X.beginPath(); pts.forEach(([x, y], i) => i ? X.lineTo(x, y) : X.moveTo(x, y)); X.closePath(); X.fill(); X.strokeStyle = 'rgba(255,255,255,.25)'; X.lineWidth = 3; X.stroke();
  const route = [[850, 230], [830, 330], [840, 420], [860, 500], [880, 590], [900, 680], [930, 780]]; const branch = [[860, 500], [960, 470], [1010, 560]];
  const k = prog(t, .3, d - .5) * route.length;
  X.strokeStyle = GOLD; X.lineWidth = 9; X.shadowColor = GOLD; X.shadowBlur = 18; X.beginPath(); route.forEach(([x, y], i) => { if (i <= k) i ? X.lineTo(x, y) : X.moveTo(x, y); }); X.stroke();
  if (k > 4) { X.beginPath(); branch.forEach(([x, y], i) => i ? X.lineTo(x, y) : X.moveTo(x, y)); X.stroke(); } X.shadowBlur = 0;
  [['Colombia', 940, 230, 0], ['Ecuador', 640, 320, 1], ['Perú', 660, 470, 2], ['Bolivia', 1120, 560, 3], ['Chile', 690, 700, 4], ['Argentina', 1140, 760, 5]].forEach(([n, x, y, i]) => { const kk = back(prog(t, 1 + i * .45, 1.4 + i * .45)); if (kk > 0) { panel(x - 110 * kk, y - 30, 220 * kk, 60, 18, 'rgba(10,12,28,.8)', GOLD, 3); txt(n, x, y, 36 * kk, '#fff'); } });
  vignette(.4); };
S.rope_bridge = (t, d) => { sky(SKY.day); clouds(t, 311, 'rgba(255,255,255,.9)', 300, 600, 7, 10); mountains(312, 520, 300, '#7d8fb0', 6);
  X.fillStyle = '#5a4a32'; X.beginPath(); X.moveTo(0, 380); X.lineTo(560, 420); X.lineTo(520, H); X.lineTo(0, H); X.fill(); X.beginPath(); X.moveTo(W, 400); X.lineTo(1360, 430); X.lineTo(1400, H); X.lineTo(W, H); X.fill();
  X.fillStyle = '#3a6a2a'; X.fillRect(0, 370, 560, 30); X.fillRect(1360, 390, W, 30);
  const sag = 110 + Math.sin(t * 1.3) * 6; X.strokeStyle = '#b08a4a'; X.lineWidth = 8; [0, 50].forEach(o => { X.beginPath(); X.moveTo(550, 360 + o); X.quadraticCurveTo(960, 360 + sag * 2 + o, 1370, 380 + o); X.stroke(); });
  X.lineWidth = 3; for (let i = 0; i <= 40; i++) { const k = i / 40, x = lerp(550, 1370, k), y = lerp(410, 430, k) + sag * 4 * k * (1 - k); X.beginPath(); X.moveTo(x, y); X.lineTo(x, y - 50); X.stroke(); }
  const k = (t * .08) % 1; person(lerp(560, 1360, k), lerp(410, 430, k) + sag * 4 * k * (1 - k), 120, { col: '#1a0d06', hat: 'inca', walk: t * 7, cape: '#a0261d' });
  txt('+ 4.000 m', 1600, 250, 64, '#fff', { w: 900, stroke: 9 }); condor(400 + t * 30, 230, .8, t); vignette(.35); };
S.unesco = (t, d) => { S.inca_road(t + 3, d); const k = back(prog(t, .3, 1)); if (k > 0) { X.save(); X.translate(1500, 330); X.scale(k, k); glow(0, 0, 260, '#ffd27a', .6);
  X.fillStyle = '#1e5fa8'; X.beginPath(); X.arc(0, 0, 150, 0, 7); X.fill(); X.lineWidth = 10; X.strokeStyle = '#fff'; X.stroke(); txt('PATRIMONIO', 0, -30, 40, '#fff', { w: 900 }); txt('DE LA HUMANIDAD', 0, 22, 30, '#fff'); txt('★', 0, 80, 50, GOLD); X.restore(); } };
S.machu_picchu = (t, d) => { sky(SKY.dawn); sun(400, 300, 50); mountains(321, 600, 300, '#8090b0', 6);
  X.fillStyle = '#2d4a2a'; X.beginPath(); X.moveTo(1150, 700); X.quadraticCurveTo(1300, 120, 1420, 160); X.quadraticCurveTo(1520, 300, 1650, 700); X.fill(); X.fillStyle = '#3a5a32'; X.beginPath(); X.moveTo(1250, 700); X.quadraticCurveTo(1380, 300, 1450, 260); X.lineTo(1500, 700); X.fill();
  X.fillStyle = '#3f6a35'; X.beginPath(); X.moveTo(0, 1080); X.lineTo(0, 760); X.quadraticCurveTo(700, 600, 1300, 720); X.lineTo(1920, 1080); X.fill();
  for (let i = 0; i < 7; i++) { X.fillStyle = i % 2 ? '#5b8a44' : '#4e7a3a'; X.fillRect(150 + i * 30, 800 + i * 40, 900 - i * 60, 34); X.fillStyle = '#7a7466'; X.fillRect(150 + i * 30, 830 + i * 40, 900 - i * 60, 6); }
  const R = rng(322); for (let i = 0; i < 26; i++) { const x = 380 + R() * 700, y = 700 + R() * 70; X.fillStyle = '#9a9384'; X.fillRect(x, y, 40 + R() * 40, 30); }
  for (let l = 0; l < 3; l++) { X.fillStyle = `rgba(255,255,255,${.35 - l * .08})`; for (let i = 0; i < 5; i++) { X.beginPath(); X.ellipse(((i * 500 + t * (20 + l * 10)) % 2600) - 300, 640 + l * 70, 360, 50, 0, 0, 7); X.fill(); } }
  condor(1000 + Math.sin(t * .3) * 300, 280, 1, t); vignette(.4); };
S.bingham = (t, d) => { sky(['#1f3a28', '#2f5a36', '#4a7a42', '#2a4a2a']); const R = rng(331); for (let i = 0; i < 40; i++) { X.fillStyle = `rgba(20,${50 + R() * 50},20,.8)`; X.beginPath(); X.ellipse(R() * W, R() * 700, 80 + R() * 120, 40 + R() * 60, R(), 0, 7); X.fill(); }
  X.fillStyle = '#6a5a3a'; X.beginPath(); X.moveTo(0, 1080); X.quadraticCurveTo(700, 820, 1920, 700); X.lineTo(1920, 1080); X.fill();
  const k = ease(prog(t, 0, d)); person(lerp(700, 1000, k), lerp(930, 870, k), 330, { col: '#1a120a', hat: 'slouch', walk: t * 6, staff: true, arm: .2, rim: 'rgba(255,230,160,.7)' });
  person(lerp(420, 720, k), lerp(980, 930, k), 360, { expr: 'talk', col: '#2a1a0e', hat: 'explorer', walk: t * 6, arm: .1, rim: 'rgba(255,230,160,.7)' });
  rays(1600, 0, '#fff2c0', t, 8, 1400, .07); particles(t, 50, 332, '#fff7d0'); txt('1911', 1600, 200, 90, '#fff', { w: 900, stroke: 10 }); vignette(.5); };
S.farmers = (t, d) => { S.machu_picchu(t, d); [[450, 830], [620, 870], [800, 910]].forEach(([x, y], i) => person(x, y, 130, { col: '#2a1a0e', hat: 'slouch', arm: Math.sin(t * 3 + i) * .6 + .3, dress: i === 1, dressCol: '#7a1a1a' }));
  [[980, 900], [1060, 905]].forEach(([x, y]) => { X.fillStyle = '#e8e0d0'; X.beginPath(); X.ellipse(x, y - 30, 30, 20, 0, 0, 7); X.fill(); X.fillRect(x + 15, y - 60, 10, 30); }); };
S.camera_photo = (t, d) => { sky(SKY.indoor); X.save(); X.translate(560, 560); X.fillStyle = '#3a2412'; X.fillRect(-150, -120, 300, 220); X.fillStyle = '#1a1a1a'; X.beginPath(); X.arc(150, -10, 70, 0, 7); X.fill(); X.fillStyle = '#333'; X.beginPath(); X.arc(150, -10, 40, 0, 7); X.fill();
  X.strokeStyle = '#2a1a0a'; X.lineWidth = 12; X.beginPath(); X.moveTo(-60, 100); X.lineTo(-140, 420); X.moveTo(0, 100); X.lineTo(0, 440); X.moveTo(60, 100); X.lineTo(140, 420); X.stroke(); X.restore();
  const fl = Math.max(0, 1 - ((t - 1) * 3)); if (t > 1) { glow(710, 550, 700 * fl + 1, '#ffffff', .9 * fl); }
  const k = back(prog(t, 1.2, 1.9)); if (k > 0) { X.save(); X.translate(1300, 520); X.rotate(.05); X.scale(k, k); X.fillStyle = '#f3ecd8'; X.fillRect(-330, -230, 660, 470); X.save(); X.beginPath(); X.rect(-300, -200, 600, 360); X.clip(); X.translate(-300 - 960 * .3125, -200 - 540 * .3333 + 180); X.scale(.3125, .3333); X.filter = 'sepia(1)'; S.machu_picchu(t, d); X.filter = 'none'; X.restore();
    txt('National Geographic, 1913', 0, 200, 30, '#3a2a1a'); X.restore(); } vignette(.55); };

// ---------- Roma ----------
function romeBg(t) { sky(SKY.day); sun(1600, 160, 55); clouds(t, 341, 'rgba(255,255,255,.85)', 60, 260, 5, 10);
  X.fillStyle = '#e8dcc0'; for (let i = 0; i < 6; i++) { const x = 80 + i * 330, h = 300 + (i % 3) * 80; X.fillRect(x, 760 - h, 280, h); X.fillStyle = '#c9b8a0'; X.fillRect(x - 10, 760 - h - 20, 300, 24); X.fillStyle = '#7a3a2a'; X.beginPath(); X.moveTo(x - 10, 760 - h - 20); X.lineTo(x + 140, 760 - h - 80); X.lineTo(x + 290, 760 - h - 20); X.fill(); X.fillStyle = '#e8dcc0'; }
  X.fillStyle = '#d8ccb0'; for (let i = 0; i < 14; i++) X.fillRect(120 + i * 130, 460, 26, 300); ground(760, '#b9a689', '#6d5d48'); }
S.rome_street = (t, d) => { romeBg(t); crowd(1000, 16, 351, 240, 300, { col: '#2a1e14', hats: ['laurel', 'none', 'veil', 'none'], walking: true }, t); vignette(.4); };
S.fullonica = (t, d) => { sky(['#5a4632', '#7a6448', '#8a7454', '#4a3a28']); X.fillStyle = '#a89070'; X.fillRect(0, 600, W, 480);
  [[420, 0], [960, 1], [1500, 2]].forEach(([x, i]) => { X.fillStyle = '#c9b48f'; X.beginPath(); X.ellipse(x, 800, 240, 70, 0, 0, 7); X.fill(); X.fillStyle = '#d8c66a'; X.beginPath(); X.ellipse(x, 790, 210, 55, 0, 0, 7); X.fill();
    X.fillStyle = 'rgba(255,255,255,.3)'; for (let b = 0; b < 6; b++) { const k = (t * .6 + b / 6 + i * .3) % 1; X.beginPath(); X.arc(x - 150 + b * 60, 780 - k * 120, 10 * (1 - k), 0, 7); X.fill(); }
    person(x, 790 - Math.abs(Math.sin(t * 5 + i)) * 20, 320, { col: '#2a1a0e', walk: t * 8 + i, arm: Math.sin(t * 5 + i) * .4 + .3, dress: true, dressCol: '#5a3a1e' }); });
  smoke(500, 600, t, .8, '#e8e0d0'); txt('Lavandería romana (fullonica)', 1150, 230, 56, '#fff', { stroke: 9 }); vignette(.5); };
S.teeth = (t, d) => { sky(['#2a1a10', '#4a2c18', '#6a3c20', '#2a170b']); glow(960, 500, 600, '#ffd27a', .3);
  X.save(); X.translate(960, 540); X.fillStyle = '#c8916a'; X.beginPath(); X.ellipse(0, -40, 230, 290, 0, 0, 7); X.fill(); X.fillStyle = '#2a1a10'; X.beginPath(); X.ellipse(0, -270, 230, 120, 0, Math.PI, 0); X.fill();
  X.fillStyle = '#3a2016'; X.beginPath(); X.ellipse(-80, -90, 22, 14, 0, 0, 7); X.ellipse(80, -90, 22, 14, 0, 0, 7); X.fill();
  X.fillStyle = '#7a2a2a'; X.beginPath(); X.moveTo(-130, 60); X.quadraticCurveTo(0, 200, 130, 60); X.quadraticCurveTo(0, 90, -130, 60); X.fill(); X.fillStyle = '#ffffff'; X.beginPath(); X.moveTo(-115, 68); X.quadraticCurveTo(0, 100, 115, 68); X.lineTo(105, 100); X.quadraticCurveTo(0, 125, -105, 100); X.fill(); X.restore();
  for (let i = 0; i < 5; i++) { const k = (t * 1.2 + i / 5) % 1, a = i * 1.3; X.save(); X.translate(960 + Math.cos(a) * 200 * (1 + k), 620 + Math.sin(a) * 80 * (1 + k)); X.rotate(k * 2); X.globalAlpha = 1 - k; txt('✦', 0, 0, 60, '#fff'); X.restore(); } X.globalAlpha = 1;
  txt('¿Blanqueador de dientes? 🤢'.replace(' 🤢', ''), 960, 170, 60, GOLD, { w: 900, stroke: 9 }); vignette(.55); };
S.vespasian = (t, d) => { romeBg(t); X.fillStyle = 'rgba(0,0,0,.35)'; X.fillRect(0, 0, W, H); X.save(); X.translate(700, 940); X.fillStyle = '#e8e0d0';
  X.fillRect(-160, -60, 320, 60); X.beginPath(); X.moveTo(-200, -60); X.quadraticCurveTo(-210, -300, -110, -360); X.lineTo(110, -360); X.quadraticCurveTo(210, -300, 200, -60); X.fill();
  X.beginPath(); X.ellipse(0, -470, 100, 125, 0, 0, 7); X.fill(); X.fillStyle = '#c9c0b0'; X.beginPath(); X.ellipse(30, -470, 60, 110, 0, -1.2, 1.2); X.fill(); hat('laurel', '#000'); X.restore();
  const k = back(prog(t, .5, 1.1)); if (k > 0) { X.save(); X.translate(1350, 470); X.rotate(-.08); X.scale(k, k); panel(-300, -140, 600, 280, 20, '#f3e6c8', '#7a1a1a', 8); txt('IMPUESTO', 0, -50, 80, '#7a1a1a', { w: 900 }); txt('sobre la orina', 0, 40, 50, '#3a2a1a'); X.restore(); }
  for (let i = 0; i < 6; i++) { const k2 = ((t * .7 + i / 6) % 1); coin(1150 + i * 70, 760 + k2 * 120, 30, t * 4 + i); } vignette(.5); };
S.coin_quote = (t, d) => { sky(['#0e0905', '#22160a', '#3a2410', '#120a05']); rays(960, 440, '#ffd27a', t, 14, 1400, .09); coin(960, 440, 230, t * 1.2);
  txt('«El dinero no huele»', 960, 780, 84 * ease(prog(t, .5, 1)), '#fff', { w: 900, stroke: 10 }); txt('Pecunia non olet', 960, 860, 46 * ease(prog(t, 1, 1.5)), GOLD, { stroke: 7 }); vignette(.55); };

// ---------- kétchup ----------
function bottle(x, y, s, label, t = 0) { X.save(); X.translate(x, y); X.scale(s, s); glow(0, -150, 260, '#ff6b4a', .25);
  X.fillStyle = 'rgba(200,230,255,.25)'; X.beginPath(); X.moveTo(-90, 0); X.lineTo(-90, -220); X.quadraticCurveTo(-90, -270, -35, -290); X.lineTo(-35, -360); X.lineTo(35, -360); X.lineTo(35, -290); X.quadraticCurveTo(90, -270, 90, -220); X.lineTo(90, 0); X.closePath(); X.fill();
  X.fillStyle = '#b3201a'; X.beginPath(); X.moveTo(-82, -8); X.lineTo(-82, -200); X.quadraticCurveTo(-82, -250, -30, -270); X.lineTo(30, -270); X.quadraticCurveTo(82, -250, 82, -200); X.lineTo(82, -8); X.fill();
  X.fillStyle = '#4a2a10'; X.fillRect(-40, -390, 80, 34); X.fillStyle = '#f3e6c8'; X.fillRect(-80, -190, 160, 120); X.strokeStyle = '#7a1a1a'; X.lineWidth = 4; X.strokeRect(-72, -182, 144, 104);
  txt(label, 0, -150, 26, '#7a1a1a', { w: 900 }); txt('para la indigestión', 0, -110, 15, '#3a2a1a'); X.fillStyle = 'rgba(255,255,255,.35)'; X.fillRect(-70, -260, 14, 230); X.restore(); }
S.ketchup_medicine = (t, d) => { sky(['#1a0c08', '#3a1a10', '#5a2a18', '#1a0a05']); X.fillStyle = '#3a2412'; X.fillRect(0, 760, W, 320); bottle(960, 820, 1.7 + .02 * Math.sin(t * 2), 'MEDICINA', t); stamp('¿MEDICINA?', 960, 230, prog(t, .8, 1.4), GOLD, -.05); vignette(.55); };
function tomato(x, y, r) { const g = X.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); g.addColorStop(0, '#ff7a5a'); g.addColorStop(1, '#a8160e'); X.fillStyle = g; X.beginPath(); X.ellipse(x, y, r * 1.08, r, 0, 0, 7); X.fill();
  X.fillStyle = '#2f7a2a'; for (let i = 0; i < 5; i++) { X.save(); X.translate(x, y - r * .85); X.rotate(i / 5 * Math.PI * 2); X.beginPath(); X.ellipse(0, -r * .15, r * .08, r * .25, 0, 0, 7); X.fill(); X.restore(); } }
S.doctor_tomato = (t, d) => { sky(SKY.indoor); X.fillStyle = '#4a2c16'; X.fillRect(0, 0, W, H); X.fillStyle = '#5a3a1e'; for (let i = 0; i < 5; i++) X.fillRect(1250, 200 + i * 140, 550, 20);
  for (let i = 0; i < 20; i++) { X.fillStyle = ['#7a2a2a', '#2a4a7a', '#4a6a2a', '#e8d8b0'][i % 4]; X.fillRect(1270 + (i % 5) * 105, 140 + Math.floor(i / 5) * 140, 50, 60); }
  person(760, 1000, 640, { expr: 'talk', col: '#14100c', hat: 'top', arm: .9 + Math.sin(t * 2) * .05, rim: 'rgba(255,210,150,.8)', item: (a, b) => tomato(a, b - 14, 22) });
  txt('1830 · EE. UU.', 400, 200, 64, '#fff', { w: 900, stroke: 9 }); vignette(.55); };
S.pills = (t, d) => { sky(['#2a1a10', '#3a2416', '#4a2c1a', '#1a0f08']); X.fillStyle = '#5a3a1e'; X.fillRect(0, 740, W, 340);
  for (let i = 0; i < 5; i++) { const x = 400 + i * 280; X.fillStyle = 'rgba(220,240,255,.2)'; X.beginPath(); X.roundRect(x - 80, 460, 160, 280, 20); X.fill(); X.fillStyle = '#e8dcc0'; X.fillRect(x - 60, 560, 120, 90); txt('TOMATE', x, 605, 26, '#a8160e', { w: 900 }); X.fillStyle = '#3a2412'; X.fillRect(x - 50, 430, 100, 34); }
  for (let i = 0; i < 26; i++) { const R = rng(i + 400); const x = 300 + R() * 1300, fall = (t * .6 + R()) % 1, y = lerp(-50, 760 + R() * 180, Math.min(1, fall * 1.4)); X.save(); X.translate(x, y); X.rotate(R() * 6 + t); X.fillStyle = '#c0392b'; X.beginPath(); X.roundRect(-26, -12, 52, 24, 12); X.fill(); X.fillStyle = '#f2f2f2'; X.beginPath(); X.roundRect(0, -12, 26, 24, [0, 12, 12, 0]); X.fill(); X.restore(); }
  vignette(.5); };
S.fries = (t, d) => { sky(['#2a1205', '#5a2a0a', '#8a4a10', '#3a1a05']); glow(960, 560, 700, '#ffcf6b', .35); X.save(); X.translate(960, 780);
  X.fillStyle = '#e53935'; X.beginPath(); X.moveTo(-230, -260); X.lineTo(230, -260); X.lineTo(180, 120); X.lineTo(-180, 120); X.fill();
  for (let i = 0; i < 18; i++) { const R = rng(i + 500); X.save(); X.translate(-200 + i * 24, -260); X.rotate((R() - .5) * .4); const g = X.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, '#e8a83a'); g.addColorStop(.5, '#ffd56b'); g.addColorStop(1, '#d08a20'); X.fillStyle = g; X.fillRect(-12, -150 - R() * 120, 24, 200); X.restore(); }
  X.fillStyle = '#e53935'; X.beginPath(); X.moveTo(-235, -120); X.lineTo(235, -120); X.lineTo(180, 120); X.lineTo(-180, 120); X.fill(); X.restore();
  X.fillStyle = '#b3201a'; X.beginPath(); X.moveTo(1200, 300); X.quadraticCurveTo(1150 + Math.sin(t * 3) * 10, 420, 1160, 520); X.lineTo(1180, 520); X.quadraticCurveTo(1190, 420, 1220, 300); X.fill(); bottle(1250, 300 - 10, .8, 'KÉTCHUP'); vignette(.5); };
S.pharmacy = (t, d) => { sky(SKY.indoor); X.fillStyle = '#3a2210'; X.fillRect(0, 0, W, H); for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) { const x = 160 + c * 136, y = 120 + r * 130; X.fillStyle = '#5a3a1e'; X.fillRect(x - 60, y + 50, 130, 12);
    const R = rng(r * 20 + c); X.fillStyle = ['rgba(120,200,160,.7)', 'rgba(200,120,90,.7)', 'rgba(90,140,220,.7)', 'rgba(230,200,120,.7)'][Math.floor(R() * 4)]; X.beginPath(); X.roundRect(x - 30, y - 30, 60, 80, 10); X.fill(); X.fillStyle = '#efe0c0'; X.fillRect(x - 22, y, 44, 22); }
  X.fillStyle = '#4a2a12'; X.fillRect(200, 800, 1520, 280); bottle(960, 820, 1.1, 'KÉTCHUP'); glow(960, 650, 300, '#ffd27a', .35); vignette(.55); };

// ---------- tenedor ----------
function fork(x, y, s, rot = 0, gold = true) { X.save(); X.translate(x, y); X.rotate(rot); X.scale(s, s); const g = X.createLinearGradient(-20, 0, 20, 0); g.addColorStop(0, gold ? '#8a5a12' : '#888'); g.addColorStop(.5, gold ? '#ffe9a0' : '#f4f4f4'); g.addColorStop(1, gold ? '#8a5a12' : '#888'); X.fillStyle = g;
  X.beginPath(); X.roundRect(-10, -20, 20, 260, 10); X.fill(); X.beginPath(); X.moveTo(-34, -20); X.quadraticCurveTo(-34, 20, 0, 30); X.quadraticCurveTo(34, 20, 34, -20); X.lineTo(34, -40); X.lineTo(-34, -40); X.fill(); X.fillRect(-34, -170, 14, 140); X.fillRect(20, -170, 14, 140); X.restore(); }
S.fork_gold = (t, d) => { sky(['#14060a', '#2a0c14', '#3a1220', '#14060a']); X.fillStyle = '#6a0f1e'; X.beginPath(); X.ellipse(960, 820, 700, 160, 0, 0, 7); X.fill(); rays(960, 400, '#ffd27a', t, 12, 1400, .08); glow(960, 520, 400, '#ffd27a', .4); fork(960, 560, 1.7, Math.sin(t) * .08); vignette(.6); };
function banquetTable(t) { X.fillStyle = '#4a1a12'; X.fillRect(0, 0, W, H); X.fillStyle = '#6a2a1a'; for (let i = 0; i < 6; i++) { X.beginPath(); X.roundRect(100 + i * 300, 80, 200, 380, [100, 100, 0, 0]); X.fill(); }
  X.fillStyle = '#e8dcc0'; X.fillRect(0, 720, W, 360); X.fillStyle = '#c9a227'; for (let i = 0; i < 5; i++) { X.beginPath(); X.ellipse(300 + i * 330, 800, 90, 26, 0, 0, 7); X.fill(); }
  [[500, 700], [1400, 700]].forEach(([x, y]) => { X.fillStyle = '#efe0c0'; X.fillRect(x - 8, y - 70, 16, 70); glow(x, y - 85, 160, '#ffb347', .6); X.fillStyle = '#ffcf6b'; X.beginPath(); X.ellipse(x, y - 82, 7, 14 + Math.sin(t * 9 + x) * 2, 0, 0, 7); X.fill(); }); }
S.banquet = (t, d) => { banquetTable(t); person(960, 960, 560, { expr: 'happy', col: '#1a0a12', hat: 'crown', hatCol: '#e0b03a', dress: true, dressCol: '#3a0f4a', rim: 'rgba(255,210,140,.9)', arm: .55 + Math.sin(t * 2) * .1, item: (a, b) => { X.save(); X.scale(.25, .25); fork(a * 4, b * 4 - 40, 1, -.3); X.restore(); } });
  txt('Venecia · ≈ año 1000', 960, 190, 60, '#fff', { w: 900, stroke: 9 }); vignette(.5); };
S.clergy = (t, d) => { banquetTable(t); [[500, -1, 0], [760, 1, 1], [1180, -1, 2], [1440, 1, 3]].forEach(([x, f, i]) => person(x, 1000, 470 + (i % 2) * 30, { expr: 'surprised', col: '#0e0a0a', hat: 'mitre', dress: true, dressCol: '#1a1414', face: f, arm: 1 + Math.sin(t * 6 + i) * .2, rim: 'rgba(255,200,140,.8)' }));
  txt('!!', 960, 360 + Math.sin(t * 8) * 8, 160, '#ff3b3b', { w: 900, stroke: 12 }); vignette(.5); };
S.hands_eat = (t, d) => { banquetTable(t); X.save(); X.translate(960, 760); X.fillStyle = '#8a5a2a'; X.beginPath(); X.ellipse(0, 0, 220, 60, 0, 0, 7); X.fill(); X.fillStyle = '#c47a3a'; X.beginPath(); X.ellipse(0, -40, 140, 70, 0, 0, 7); X.fill(); X.restore();
  [[-1, 640], [1, 1280]].forEach(([f, x]) => { X.save(); X.translate(x + Math.sin(t * 3) * 20 * f, 600 + Math.cos(t * 3) * 20); X.scale(f, 1); X.fillStyle = '#d9a07a'; X.beginPath(); X.roundRect(-160, -40, 200, 80, 30); X.fill(); for (let i = 0; i < 4; i++) { X.beginPath(); X.roundRect(30, -40 + i * 22, 70, 18, 9); X.fill(); } X.restore(); });
  txt('¡Con los dedos!', 960, 220, 72, GOLD, { w: 900, stroke: 10 }); vignette(.5); };
S.forks_table = (t, d) => { sky(['#2a1a10', '#3a2414', '#4a2c18', '#1a0f08']); X.fillStyle = '#efe6d0'; X.fillRect(0, 400, W, 680);
  for (let i = 0; i < 4; i++) { const x = 320 + i * 430; X.fillStyle = '#ffffff'; X.beginPath(); X.arc(x, 700, 130, 0, 7); X.fill(); X.strokeStyle = '#c9a227'; X.lineWidth = 6; X.stroke(); fork(x - 180, 700, .55, 0, false); X.fillStyle = '#d0d0d0'; X.fillRect(x + 160, 600, 18, 220); }
  txt('Siglos después… ¡ya es normal!', 960, 220, 72 * ease(prog(t, .2, .8)), GOLD, { w: 900, stroke: 10 }); vignette(.5); };

// ---------- Boston 1919 ----------
function bostonBg(t, skyc = SKY.day) { sky(skyc); clouds(t, 361, 'rgba(255,255,255,.75)', 50, 240, 5, 10);
  for (let i = 0; i < 9; i++) { const x = i * 230 - 60, h = 300 + (i * 97) % 220; X.fillStyle = ['#8a3a2a', '#7a3424', '#9a4a32'][i % 3]; X.fillRect(x, 760 - h, 210, h); X.fillStyle = 'rgba(255,240,200,.7)'; for (let r = 0; r < Math.floor(h / 70); r++) for (let c = 0; c < 3; c++) X.fillRect(x + 25 + c * 62, 780 - h + r * 70, 32, 40); }
  ground(760, '#6a6a6a', '#3a3a3a'); X.fillStyle = '#4a4a4a'; X.fillRect(0, 900, W, 10); }
function tank(x, y, s, burst = 0) { X.save(); X.translate(x, y); X.scale(s, s); const g = X.createLinearGradient(-250, 0, 250, 0); g.addColorStop(0, '#4a4f55'); g.addColorStop(.4, '#9aa2aa'); g.addColorStop(1, '#3a3f45'); X.fillStyle = g;
  X.fillRect(-250, -420, 500, 420); X.beginPath(); X.ellipse(0, -420, 250, 50, 0, 0, 7); X.fill(); X.strokeStyle = 'rgba(0,0,0,.25)'; X.lineWidth = 3; for (let i = 0; i < 7; i++) { X.beginPath(); X.moveTo(-250, -60 * i); X.lineTo(250, -60 * i); X.stroke(); }
  if (burst > 0) { X.fillStyle = '#2a1206'; X.beginPath(); X.moveTo(-40, -300); for (let i = 0; i < 10; i++) X.lineTo((i % 2 ? 60 : 20) * burst + i * 8 - 40, -300 + i * 30); X.lineTo(-60, 0); X.fill(); } X.restore(); }
S.boston = (t, d) => { bostonBg(t); tank(1400, 760, 1, 0); txt('Boston · 1919', 1450, 200, 70, '#fff', { w: 900, stroke: 10 }); crowd(1000, 10, 371, 200, 240, { col: '#1a1a1a', hats: ['top', 'cap', 'slouch'], walking: true }, t); vignette(.4); };
S.tank_burst = (t, d) => { bostonBg(t, SKY.storm); const shake = t < 1.5 ? Math.sin(t * 60) * 8 * (1.5 - t) : 0; X.save(); X.translate(shake, 0); tank(1300, 760, 1.1, ease(prog(t, .2, .8)));
  if (t > .3) { const k = ease(prog(t, .3, d)); X.fillStyle = '#3a1a08'; X.beginPath(); X.moveTo(1300, 500); X.quadraticCurveTo(1100 - k * 600, 600, 900 - k * 900, 900); X.lineTo(1300, 900); X.fill();
    for (let i = 0; i < 10; i++) { const kk = (t * .8 + i / 10) % 1; X.fillStyle = '#4a2208'; X.beginPath(); X.arc(1300 - kk * 700, 520 + kk * kk * 400 - Math.sin(i) * 60, 30 * (1 - kk) + 6, 0, 7); X.fill(); } }
  for (let i = 0; i < 8; i++) { const kk = clamp((t - .2) * 1.5); X.fillStyle = '#555'; X.fillRect(1300 + Math.cos(i) * 400 * kk, 500 - Math.sin(i * 1.7) * 300 * kk + kk * kk * 200, 14, 14); } X.restore(); vignette(.5); };
S.molasses_wave = (t, d) => { bostonBg(t, SKY.storm); const k = ease(prog(t, 0, d)); const front = lerp(W + 100, -200, k);
  X.save(); const g = X.createLinearGradient(0, 400, 0, H); g.addColorStop(0, '#6a3410'); g.addColorStop(1, '#2a1004'); X.fillStyle = g; X.beginPath(); X.moveTo(W + 200, H); X.lineTo(W + 200, 500);
  for (let x = W + 200; x >= front; x -= 40) X.lineTo(x, 520 + Math.sin(x / 80 + t * 3) * 25 + (x - front < 300 ? (300 - (x - front)) * .4 : 0)); X.lineTo(front - 60, H); X.fill();
  X.fillStyle = 'rgba(255,200,140,.25)'; for (let x = front; x < W; x += 90) { X.beginPath(); X.ellipse(x, 540 + Math.sin(x / 80 + t * 3) * 25, 40, 8, 0, 0, 7); X.fill(); } X.restore();
  for (let i = 0; i < 4; i++) { const x = front - 200 - i * 180; if (x > -100) person(x, 1000, 220, { expr: 'surprised', col: '#1a1a1a', hat: 'cap', walk: t * 12 + i, face: -1, arm: 1.2 }); }
  txt('≈ 55 km/h', 1500, 230, 64, GOLD, { w: 900, stroke: 9 }); vignette(.5); };
S.memorial = (t, d) => { sky(['#05060c', '#0c0f1c', '#141828', '#07080f']); for (let i = 0; i < 21; i++) { const x = 330 + (i % 7) * 210, y = 430 + Math.floor(i / 7) * 160, k = prog(t, i * .08, i * .08 + .5);
    if (k <= 0) continue; X.globalAlpha = k; X.fillStyle = '#efe6d0'; X.fillRect(x - 12, y, 24, 70); glow(x, y - 16, 70, '#ffb347', .7); X.fillStyle = '#ffcf6b'; X.beginPath(); X.ellipse(x, y - 14, 7, 15 + Math.sin(t * 8 + i) * 2, 0, 0, 7); X.fill(); X.globalAlpha = 1; }
  txt('21 víctimas', 960, 230, 84 * ease(prog(t, .5, 1.2)), '#fff', { w: 900, stroke: 10 }); vignette(.6); };
S.boston_sun = (t, d) => { bostonBg(t, ['#ff9a3c', '#ffc46b', '#ffe0a0', '#fff2d0']); sun(1500, 200, 90, '#fff', '#ffb347'); X.fillStyle = 'rgba(255,170,60,.12)'; X.fillRect(0, 0, W, H);
  for (let i = 0; i < 8; i++) { const k = (t * .3 + i / 8) % 1; X.strokeStyle = `rgba(150,70,20,${.5 * (1 - k)})`; X.lineWidth = 6; X.beginPath(); const x = 300 + i * 200; X.moveTo(x, 900 - k * 500); X.bezierCurveTo(x - 30, 860 - k * 500, x + 30, 820 - k * 500, x, 780 - k * 500); X.stroke(); }
  person(700, 1000, 300, { expr: 'happy', col: '#2a1a10', hat: 'top', arm: 1.1, face: 1 }); txt('Huele a… ¡dulce!', 960, 220, 70, '#5a2a0a', { w: 900, stroke: 6, sc: '#fff2d0' }); vignette(.35); };

// ---------- Estrasburgo 1518 ----------
function strasBg(t) { sky(SKY.dawn); clouds(t, 381, 'rgba(255,230,210,.5)', 60, 260, 5, 8);
  X.fillStyle = '#b48a7a'; X.fillRect(820, 150, 280, 650); X.beginPath(); X.moveTo(860, 150); X.lineTo(960, -60); X.lineTo(1060, 150); X.fill(); X.fillStyle = '#7a5040'; X.beginPath(); X.arc(960, 420, 80, 0, 7); X.fill();
  for (let i = 0; i < 8; i++) { const x = i < 4 ? 40 + i * 190 : 1140 + (i - 4) * 190, h = 380 + (i * 37) % 100; X.fillStyle = '#efe2c8'; X.fillRect(x, 800 - h, 170, h); X.strokeStyle = '#4a2a18'; X.lineWidth = 8;
    X.strokeRect(x, 800 - h, 170, h); X.beginPath(); X.moveTo(x, 800 - h); X.lineTo(x + 170, 800 - h / 2); X.moveTo(x + 170, 800 - h); X.lineTo(x, 800 - h / 2); X.stroke(); X.fillStyle = '#7a2a1a'; X.beginPath(); X.moveTo(x - 10, 800 - h); X.lineTo(x + 85, 800 - h - 120); X.lineTo(x + 180, 800 - h); X.fill(); }
  ground(800, '#8a7a6a', '#4a4036'); }
S.strasbourg = (t, d) => { strasBg(t); txt('Estrasburgo · 1518', 1400, 230, 64, '#fff', { w: 900, stroke: 9 }); crowd(1000, 8, 391, 200, 240, { col: '#1a120c', hats: ['cap', 'veil', 'none'], walking: true }, t); vignette(.4); };
S.woman_dance = (t, d) => { strasBg(t); crowd(1020, 10, 392, 220, 260, { col: '#120c08', hats: ['cap', 'veil'] }, 0);
  X.save(); X.translate(960, 980); X.rotate(Math.sin(t * 4) * .15); person(0, 0, 420, { expr: 'laugh', col: '#1a0e14', hat: 'veil', dress: true, dressCol: '#6a1a2a', arm: Math.sin(t * 5) * .9 + .2, walk: t * 8, rim: 'rgba(255,210,170,.9)' }); X.restore();
  txt('¡Días bailando sin parar!', 960, 200, 60, GOLD, { w: 900, stroke: 9 }); vignette(.45); };
S.crowd_dance = (t, d) => { strasBg(t); const R = rng(393); for (let i = 0; i < 26; i++) { const x = R() * W, y = 880 + R() * 160, h = 200 + R() * 120; X.save(); X.translate(x, y); X.rotate(Math.sin(t * 4 + i) * .2);
    person(0, 0, h, { expr: i % 2 ? 'laugh' : 'happy', col: '#140c08', hat: R() > .5 ? 'veil' : 'cap', dress: R() > .5, dressCol: '#3a1a1a', arm: Math.sin(t * 5 + i) * .9 + .2, walk: t * 8 + i }); X.restore(); }
  for (let i = 0; i < 2; i++) person(150 + i * 1620, 1000, 260, { col: '#0e0a06', hat: 'cap', arm: Math.sin(t * 9) * .3 + .6, item: (a, b) => { X.fillStyle = '#8a5a2a'; X.beginPath(); X.ellipse(a, b, 14, 26, .5, 0, 7); X.fill(); } });
  vignette(.45); };
S.historian = (t, d) => { S.library(t, d); X.save(); X.translate(960, 600); const k = back(prog(t, .3, .9)); X.scale(k, k); X.fillStyle = '#f3e6c8'; X.fillRect(-300, -200, 600, 400); X.strokeStyle = '#3a2a1a'; X.lineWidth = 4;
  for (let i = 0; i < 6; i++) { X.beginPath(); X.moveTo(-250, -150 + i * 50); X.lineTo(250, -150 + i * 50); X.stroke(); } X.restore();
  X.save(); X.translate(960 + Math.sin(t) * 150, 560 + Math.cos(t * 1.3) * 60); X.strokeStyle = '#c9a227'; X.lineWidth = 14; X.beginPath(); X.arc(0, 0, 90, 0, 7); X.stroke(); X.fillStyle = 'rgba(200,230,255,.2)'; X.fill(); X.beginPath(); X.moveTo(64, 64); X.lineTo(170, 170); X.lineWidth = 24; X.stroke(); X.restore();
  txt('?', 1500, 300 + Math.sin(t * 3) * 10, 200, GOLD, { w: 900, stroke: 12 }); };

// ---------- tecnología ----------
S.timeline_glow = (t, d) => { sky(['#05040c', '#0c0a1c', '#140f2c', '#06050e']); stars(250, 401, t); const k = ease(prog(t, 0, d));
  X.strokeStyle = GOLD; X.lineWidth = 6; X.shadowColor = GOLD; X.shadowBlur = 20; X.beginPath(); X.moveTo(100, 600); X.lineTo(100 + 1720 * k, 600); X.stroke(); X.shadowBlur = 0;
  [['📠', 400], ['☎', 960], ['🎮', 1500]].forEach(([s, x], i) => { if (k * 1720 + 100 > x) { glow(x, 600, 120, '#ffd27a', .6); X.fillStyle = GOLD; X.beginPath(); X.arc(x, 600, 20, 0, 7); X.fill(); } });
  txt('¿Cuándo pasó qué?', 960, 300, 80, '#fff', { w: 900, stroke: 10 }); vignette(.5); };
S.fax_machine = (t, d) => { sky(SKY.indoor); X.fillStyle = '#4a2c16'; X.fillRect(0, 720, W, 360); X.save(); X.translate(960, 720);
  X.fillStyle = '#6b4428'; X.fillRect(-400, -60, 800, 60); X.strokeStyle = '#c9a227'; X.lineWidth = 10; X.beginPath(); X.moveTo(-300, -60); X.lineTo(-300, -460); X.lineTo(300, -460); X.lineTo(300, -60); X.stroke();
  const a = Math.sin(t * 2.5) * .5; X.save(); X.translate(0, -460); X.rotate(a); X.strokeStyle = '#d8b04a'; X.lineWidth = 6; X.beginPath(); X.moveTo(0, 0); X.lineTo(0, 340); X.stroke(); X.fillStyle = '#c9a227'; X.beginPath(); X.arc(0, 340, 40, 0, 7); X.fill(); X.restore();
  X.fillStyle = '#f3e6c8'; X.fillRect(-200, -160, 400, 90); X.fillStyle = '#2a1a0a'; const n = Math.floor((t * 6) % 12); for (let i = 0; i < n; i++) X.fillRect(-180 + i * 30, -140 + (i % 3) * 18, 20, 12); X.restore();
  X.strokeStyle = '#1a1a1a'; X.lineWidth = 4; X.beginPath(); X.moveTo(1360, 600); X.quadraticCurveTo(1600, 300, 1920, 360); X.stroke(); txt('1843', 1500, 220, 90, GOLD, { w: 900, stroke: 10 }); vignette(.55); };
S.timeline_fax = (t, d) => { sky(['#0b1022', '#14204a', '#1c1840', '#0c0b1e']); stars(160, 411, t); title('¿Fax o teléfono?', prog(t, 0, .6), 150);
  const k = prog(t, .2, Math.min(d - .3, 5)); const px = timeline([{ year: 1843, label: 'Primer «fax»', sub: '1843', col: '#ffb347' }, { year: 1876, label: 'Teléfono', sub: '1876', col: '#6fb7ff' }], 1830, 1890, k, 560);
  bracket(px(1843), px(1876), 790, '33 años antes', prog(t, 2.6, 3.6)); vignette(.4); };
S.hanafuda = (t, d) => { sky(['#2a0c0c', '#4a1414', '#5a1c1a', '#2a0a0a']); X.fillStyle = '#c9b48f'; X.fillRect(0, 700, W, 380); for (let i = 0; i < 12; i++) X.fillRect(0, 700 + i * 32, W, 2);
  const cols = ['#c0392b', '#e8b4c8', '#f1c40f', '#27ae60', '#2c3e50']; for (let i = 0; i < 7; i++) { const R = rng(i + 420); X.save(); X.translate(380 + i * 200, 700 - (i % 2) * 40 + Math.sin(t + i) * 6); X.rotate((R() - .5) * .5);
    X.fillStyle = '#1a1a1a'; X.beginPath(); X.roundRect(-75, -115, 150, 230, 10); X.fill(); X.fillStyle = '#f5ecd8'; X.beginPath(); X.roundRect(-67, -107, 134, 214, 8); X.fill();
    X.fillStyle = cols[i % 5]; X.beginPath(); X.arc(0, -20, 46, 0, 7); X.fill(); X.fillStyle = '#2f6a2a'; X.fillRect(-55, 40, 110, 40); X.restore(); }
  txt('Kioto · 1889', 960, 220, 70, '#fff', { w: 900, stroke: 9 }); txt('Cartas hanafuda hechas a mano', 960, 300, 44, GOLD, { stroke: 7 }); vignette(.5); };
S.console = (t, d) => { sky(['#0a0420', '#1a0a40', '#2a0f58', '#0a0420']); for (let i = 0; i < 20; i++) { X.strokeStyle = 'rgba(180,90,255,.25)'; X.lineWidth = 2; X.beginPath(); X.moveTo(0, 700 + i * i * 1.2); X.lineTo(W, 700 + i * i * 1.2); X.stroke(); X.beginPath(); X.moveTo(960 + (i - 10) * 40, 700); X.lineTo(960 + (i - 10) * 220, H); X.stroke(); }
  X.save(); X.translate(960, 560 + Math.sin(t * 2) * 10); X.fillStyle = '#d8d8d8'; X.beginPath(); X.roundRect(-330, -110, 660, 220, 40); X.fill(); X.fillStyle = '#2a2a2a'; X.fillRect(-250, -20, 120, 40); X.fillRect(-210, -60, 40, 120);
  X.fillStyle = '#c0392b'; X.beginPath(); X.arc(200, -20, 34, 0, 7); X.arc(280, 20, 34, 0, 7); X.fill(); X.fillStyle = '#555'; X.fillRect(-40, 10, 40, 14); X.fillRect(30, 10, 40, 14); X.restore();
  txt('Mucho antes de los videojuegos…', 960, 220, 60, '#fff', { w: 900, stroke: 9 }); vignette(.5); };
S.timeline_nintendo = (t, d) => { sky(['#0b1022', '#14204a', '#1c1840', '#0c0b1e']); stars(160, 431, t); title('Nintendo es más antigua que…', prog(t, 0, .6), 150);
  const k = prog(t, .2, Math.min(d - .3, 5)); timeline([{ year: 1889, label: 'Nintendo', sub: '1889', col: '#e53935' }, { year: 1895, label: 'Cine', sub: '1895', col: '#ffb347' }, { year: 1903, label: 'Avión', sub: '1903', col: '#6fb7ff' }, { year: 1920, label: 'Radio', sub: '≈ 1920', col: '#6fdc8c' }], 1880, 1930, k, 560); vignette(.4); };

// ---------- guillotina / Star Wars ----------
S.dark_paris = (t, d) => { sky(SKY.storm); clouds(t, 441, 'rgba(30,30,40,.7)', 40, 400, 8, 30); const fl = Math.max(0, Math.sin(t * 2.3)) ** 30; if (fl > .1) { X.fillStyle = `rgba(220,230,255,${fl * .4})`; X.fillRect(0, 0, W, H); }
  X.fillStyle = '#0a0b10'; X.beginPath(); X.moveTo(860, 900); X.lineTo(930, 450); X.lineTo(960, 120); X.lineTo(990, 450); X.lineTo(1060, 900); X.fill(); X.fillRect(0, 760, W, 320);
  for (let i = 0; i < 12; i++) X.fillRect(i * 170, 700 - (i * 53) % 140, 150, 400); vignette(.6); };
function guillotineDraw(x, y, s, t) { X.save(); X.translate(x, y); X.scale(s, s); X.fillStyle = '#3a2412'; X.fillRect(-170, -780, 40, 780); X.fillRect(130, -780, 40, 780); X.fillRect(-200, -820, 400, 50); X.fillRect(-240, -40, 480, 40);
  const by = -700 + Math.sin(t * .8) * 6; X.fillStyle = '#b9c2cc'; X.beginPath(); X.moveTo(-130, by); X.lineTo(130, by); X.lineTo(130, by + 80); X.lineTo(-130, by + 160); X.fill(); X.fillStyle = 'rgba(255,255,255,.6)'; X.fillRect(-130, by, 260, 8);
  X.fillStyle = '#2a1a0a'; X.fillRect(-130, -300, 260, 60); X.beginPath(); X.arc(0, -270, 30, 0, 7); X.fillStyle = '#000'; X.fill(); X.restore(); }
S.guillotine = (t, d) => { sky(['#05060a', '#10121a', '#1a1d28', '#0a0b10']); rays(960, 0, '#c8d4ff', t, 6, 1300, .08); ground(900, '#2a2a30', '#0a0a0e'); guillotineDraw(960, 920, 1.05, t); txt('1977', 1550, 250, 120, '#ff4a4a', { w: 900, stroke: 12 }); vignette(.65); };
function cinemaScreen(t) { X.fillStyle = '#05050a'; X.fillRect(0, 0, W, H); X.fillStyle = '#000'; X.fillRect(260, 90, 1400, 600); X.save(); X.beginPath(); X.rect(260, 90, 1400, 600); X.clip(); sky(['#000', '#020210', '#05051a', '#000']); stars(300, 451, t * 3);
  globe(1450, 520, 160, t); const sx = 400 + (t * 120) % 1000; X.fillStyle = '#c8ccd4'; X.beginPath(); X.moveTo(sx, 300); X.lineTo(sx + 260, 330); X.lineTo(sx, 360); X.fill(); X.fillStyle = '#7a8090'; X.fillRect(sx - 40, 320, 50, 20);
  for (let i = 0; i < 3; i++) { const k = (t * 2 + i / 3) % 1; X.strokeStyle = i % 2 ? '#ff3b3b' : '#3bff6b'; X.lineWidth = 6; X.beginPath(); X.moveTo(sx + 260 + k * 500, 330 - i * 20); X.lineTo(sx + 330 + k * 500, 330 - i * 20); X.stroke(); } X.restore();
  glow(960, 390, 900, '#8aa8ff', .12); }
S.cinema = (t, d) => { cinemaScreen(t); crowd(1060, 40, 461, 220, 280, { col: '#030305', cheer: t > 1.5, expr: 'surprised' }, t); vignette(.4); };
S.split_cinema = (t, d) => { X.save(); X.beginPath(); X.rect(0, 0, W / 2, H); X.clip(); X.translate(-480, 0); S.cinema(t, d); X.restore(); X.save(); X.beginPath(); X.rect(W / 2, 0, W / 2, H); X.clip(); X.translate(480, 0); S.guillotine(t, d); X.restore();
  X.fillStyle = GOLD; X.fillRect(W / 2 - 4, 0, 8, H); panel(W / 2 - 200, 70, 400, 110, 24); txt('MISMO AÑO', W / 2, 125, 58 * ease(prog(t, 0, .8)), GOLD, { w: 900 }); vignette(.4); };

S.projector = (t, d) => { sky(['#020204', '#06060c', '#0a0a14', '#020204']); X.save(); X.globalCompositeOperation = 'lighter'; const g = X.createLinearGradient(1500, 600, 200, 300); g.addColorStop(0, 'rgba(255,240,200,.45)'); g.addColorStop(1, 'rgba(255,240,200,.02)');
  X.fillStyle = g; X.beginPath(); X.moveTo(1480, 560); X.lineTo(120, 120); X.lineTo(120, 760); X.lineTo(1480, 620); X.fill(); X.restore(); particles(t, 90, 471, '#fff4d0');
  X.save(); X.translate(1600, 600); X.fillStyle = '#2a2a2e'; X.beginPath(); X.roundRect(-160, -90, 300, 160, 20); X.fill(); X.fillStyle = '#111'; X.beginPath(); X.arc(-160, -10, 50, 0, 7); X.fill(); glow(-170, -10, 80, '#fff4d0', .8);
  [[-60, -180], [90, -180]].forEach(([x, y]) => { X.save(); X.translate(x, y); X.rotate(t * 3); X.fillStyle = '#3a3a40'; X.beginPath(); X.arc(0, 0, 90, 0, 7); X.fill(); X.fillStyle = '#1a1a1e'; for (let i = 0; i < 5; i++) { X.rotate(Math.PI * 2 / 5); X.beginPath(); X.arc(48, 0, 22, 0, 7); X.fill(); } X.restore(); });
  X.fillStyle = '#1a1a1e'; X.fillRect(-60, 70, 20, 300); X.fillRect(60, 70, 20, 300); X.restore();
  crowd(1080, 30, 472, 180, 230, { col: '#020203' }, t); vignette(.5); };
