// Escenas de la PARTE 1 (intro + datos 1-10). Cada escena: (t = segundos desde que empieza, d = duración)
const S = {};

// ---------- Egipto ----------
function egyptBase(t, opts = {}) { sky(opts.sky || SKY.sunset); sun(opts.sunX || 1450, opts.sunY || 610, 70); rays(opts.sunX || 1450, opts.sunY || 610, '#ffb347', t, 16, 1800, .07);
  clouds(t, 3, 'rgba(255,190,150,.25)', 120, 330, 5, 8);
  pyramid(1180, 760, 900, 520, '#d9a86a', '#7a5332', opts.eroded || 0); pyramid(560, 760, 520, 300, '#cf9a5c', '#704a2a', opts.eroded || 0); pyramid(1650, 760, 360, 200, '#c99357', '#6b4628', opts.eroded || 0);
  ground(740, '#d4a061', '#6e4a26'); hills(800, 30, 'rgba(120,80,40,.5)', .7, 1); particles(t, 70, 5, '#ffd9a0'); }
S.egypt_cleo = (t, d) => { egyptBase(t); person(420, 1000, 520, { col: '#1a0f0a', hat: 'nemes', dress: true, dressCol: '#24140c', cape: '#3a1d0e', rim: 'rgba(255,190,90,.9)', arm: -.2 });
  palm(140, 900, 420, t); vignette(.6); };
S.egypt_cleo2 = (t, d) => { egyptBase(t, { sunX: 700 }); person(1450, 1040, 600, { col: '#1a0f0a', hat: 'nemes', dress: true, dressCol: '#24140c', cape: '#3a1d0e', rim: 'rgba(255,190,90,.9)', face: -1, arm: .4 });
  palm(1780, 920, 380, t); vignette(.6); };
S.versus = (t, d) => { sky(SKY.night); stars(220, 7, t); glow(480, 540, 500, '#e0663a', .35); glow(1440, 540, 500, '#3a7bd5', .35);
  person(480, 930, 560, { col: '#140c08', hat: 'nemes', dress: true, rim: 'rgba(255,170,80,.95)' }); pyramid(1440, 930, 700, 480, '#e2b47a', '#7a5332');
  const k = back(prog(t, .3, .9)); X.save(); X.translate(W / 2, 520); X.scale(k, k); glow(0, 0, 200, '#ffffff', .4); txt('VS', 0, 0, 170, GOLD, { w: 900, stroke: 14 }); X.restore();
  txt('?', W / 2, 760 + Math.sin(t * 3) * 10, 140 * ease(prog(t, 1, 1.4)), '#fff', { w: 900, stroke: 12 }); vignette(.5); };
S.moon_landing = (t, d) => { sky(['#000', '#020208', '#05050f', '#0b0b18']); stars(300, 11, t); globe(1500, 260, 110, t);
  ground(800, '#9a9a9a', '#3d3d3d'); X.fillStyle = 'rgba(0,0,0,.25)'; [[300, 860, 90], [900, 950, 140], [1500, 880, 70]].forEach(([a, b, r]) => { X.beginPath(); X.ellipse(a, b, r, r * .25, 0, 0, 7); X.fill(); });
  // módulo lunar
  X.save(); X.translate(1250, 820); X.fillStyle = '#c9a227'; X.beginPath(); X.moveTo(-110, 0); X.lineTo(-80, -90); X.lineTo(80, -90); X.lineTo(110, 0); X.fill(); X.fillStyle = '#bfbfbf'; X.beginPath(); X.roundRect(-70, -200, 140, 110, 10); X.fill();
  X.strokeStyle = '#999'; X.lineWidth = 8; X.beginPath(); X.moveTo(-80, -60); X.lineTo(-150, 20); X.moveTo(80, -60); X.lineTo(150, 20); X.stroke(); X.restore();
  // bandera
  X.strokeStyle = '#ddd'; X.lineWidth = 6; X.beginPath(); X.moveTo(760, 830); X.lineTo(760, 560); X.stroke(); X.fillStyle = '#eee'; X.fillRect(760, 560, 170, 105);
  X.fillStyle = '#b22234'; for (let i = 0; i < 7; i++) X.fillRect(760, 560 + i * 15, 170, 7.5); X.fillStyle = '#3c3b6e'; X.fillRect(760, 560, 70, 52);
  // astronauta
  X.save(); X.translate(560, 860 + Math.sin(t * 2) * 6); X.fillStyle = '#f2f2f2'; X.beginPath(); X.roundRect(-55, -230, 110, 140, 30); X.fill(); X.beginPath(); X.arc(0, -270, 52, 0, 7); X.fill();
  const g = X.createLinearGradient(-40, -300, 40, -240); g.addColorStop(0, '#ffcf6b'); g.addColorStop(1, '#6b3f0f'); X.fillStyle = g; X.beginPath(); X.ellipse(0, -270, 38, 30, 0, 0, 7); X.fill();
  X.fillStyle = '#ddd'; X.fillRect(-48, -95, 40, 95); X.fillRect(8, -95, 40, 95); X.fillRect(-90, -220, 35, 100); X.fillRect(55, -220, 35, 100); X.fillStyle = '#bbb'; X.fillRect(-75, -220, 20, 120); X.restore();
  vignette(.5); };
S.timeline_cleo = (t, d) => { sky(['#0b0e22', '#1b1640', '#2a1b3d', '#120c1e']); stars(160, 13, t); particles(t, 40, 3, '#ffd98a');
  title('¿Quién está más cerca de quién?', prog(t, 0, .6), 150);
  const k = prog(t, .2, Math.min(d - .5, 6));
  const px = timeline([{ year: -2560, label: 'Gran Pirámide', sub: '2560 a.C.', col: '#e6b45a' }, { year: -69, label: 'Cleopatra', sub: '69 a.C.', col: '#ff7a59' }, { year: 1969, label: 'Llegada a la Luna', sub: '1969', col: '#6fb7ff' }], -2700, 2100, k, 560);
  bracket(px(-2560), px(-69), 760, '≈ 2.500 años', prog(t, 3.2, 4.2), '#e6b45a'); bracket(px(-69), px(1969), 760, '≈ 2.000 años', prog(t, 4, 5), '#6fb7ff'); vignette(.4); };
S.pyramid_build = (t, d) => { sky(SKY.desert); sun(300, 200, 60); clouds(t, 8, 'rgba(255,255,255,.6)', 80, 260, 4, 10);
  pyramid(1100, 780, 1100, 520, '#e8c48c', '#a77c4a'); X.fillStyle = '#f3e0b8'; X.fillRect(1100 - 230, 780 - 520 * .58, 460, 520 * .58 - 300); // nivel incompleto
  X.fillStyle = '#c9a26b'; X.beginPath(); X.moveTo(200, 780); X.lineTo(900, 520); X.lineTo(960, 520); X.lineTo(330, 780); X.fill(); // rampa
  ground(770, '#e2b97c', '#a0723f');
  for (let i = 0; i < 7; i++) { const k = ((t * .06 + i / 7) % 1); const x = lerp(260, 900, k), y = lerp(770, 525, k); X.fillStyle = '#d8b07a'; X.fillRect(x - 40, y - 50, 80, 50);
    for (let j = 0; j < 4; j++) person(x - 70 - j * 38, y + 6 + j * 4 * .35, 70, { col: '#3a2412', walk: t * 5 + j, face: 1, arm: .3 }); }
  crowd(1010, 26, 21, 120, 170, { col: '#2c1a0e', walking: true }, t); particles(t, 60, 9, '#fff1d0'); vignette(.45); };
S.young_cleo = (t, d) => { sky(SKY.dawn); sea(640, t, '#3b78a8', '#0e2a45'); // faro de Alejandría
  X.fillStyle = '#e9dcc4'; X.fillRect(1420, 260, 90, 380); X.fillRect(1400, 230, 130, 40); X.fillRect(1440, 140, 50, 90); glow(1465, 150, 160, '#ffcf6b', .7 + .2 * Math.sin(t * 3));
  // ventana del palacio
  X.fillStyle = '#2b1c12'; X.fillRect(0, 0, W, 120); X.fillRect(0, 0, 260, H); X.fillRect(W - 260, 0, 260, H); X.fillRect(0, 900, W, 180);
  X.fillStyle = '#4b3220'; for (let i = 0; i < 2; i++) { X.fillRect(i ? W - 300 : 240, 100, 60, 820); X.fillStyle = '#5b3d27'; }
  person(820, 960, 470, { col: '#1d120b', hat: 'crown', hatCol: '#e0b03a', dress: true, dressCol: '#2b170c', rim: 'rgba(255,200,140,.9)', face: 1 }); vignette(.5); };
S.pyramid_ruins = (t, d) => { egyptBase(t, { eroded: 1.4, sky: SKY.dawn, sunX: 400, sunY: 640 }); sphinx(600, 860, 1.6);
  [[1300, 1010, 300, 1], [1420, 1015, 280, -1], [1520, 1010, 290, -1]].forEach(([x, y, h, f], i) => person(x, y, h, { col: '#1a0f0a', hat: i ? 'none' : 'nemes', dress: true, face: f, rim: 'rgba(255,190,90,.8)', arm: i ? 0 : .6 }));
  vignette(.55); };
S.colosseum = (t, d) => { sky(SKY.day); sun(1600, 180, 60); clouds(t, 12, 'rgba(255,255,255,.85)', 60, 300, 6, 10);
  X.save(); X.translate(960, 820); const g = X.createLinearGradient(0, -460, 0, 0); g.addColorStop(0, '#e2c49a'); g.addColorStop(1, '#a9845a'); X.fillStyle = g;
  X.beginPath(); X.moveTo(-760, 0); X.lineTo(-760, -300); X.quadraticCurveTo(0, -520, 520, -440); X.lineTo(760, -260); X.lineTo(760, 0); X.fill();
  X.fillStyle = '#5a4128'; for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) { const x = -720 + i * 82, top = -260 - r * 95 - Math.max(0, (i - 4)) * 6 * (r === 2 ? 1 : 0); if (r === 2 && i > 13) continue; X.beginPath(); X.roundRect(x, top, 44, 70, [22, 22, 0, 0]); X.fill(); }
  X.restore(); ground(820, '#b9a281', '#6d5a40');
  crowd(1040, 14, 31, 230, 290, { col: '#1d1d24', hats: ['cap', 'none', 'none', 'slouch'] }, t);
  for (let i = 0; i < 4; i++) { const fk = Math.max(0, Math.sin(t * 2.3 + i * 1.7)); if (fk > .97) glow(300 + i * 400, 830, 140, '#ffffff', .9); } vignette(.4); };

// ---------- Oxford / aztecas ----------
S.oxford = (t, d) => { sky(SKY.night); stars(200, 17, t, 500); moon(1600, 200, 70); clouds(t, 18, 'rgba(160,170,210,.18)', 120, 400, 5, 6);
  X.fillStyle = '#16161f'; const spires = [[300, 380], [560, 300], [820, 420], [1060, 260], [1300, 360], [1560, 320]];
  X.fillRect(150, 640, 1620, 440); spires.forEach(([x, h]) => { X.fillRect(x - 60, 640 - h + 120, 120, h); X.beginPath(); X.moveTo(x - 70, 640 - h + 120); X.lineTo(x, 640 - h - 60); X.lineTo(x + 70, 640 - h + 120); X.fill(); });
  for (let i = 0; i < 26; i++) { const x = 190 + i * 60, y = 700 + (i % 3) * 110; X.fillStyle = `rgba(255,200,110,${.5 + .4 * Math.sin(t * 2 + i)})`; X.beginPath(); X.roundRect(x, y, 26, 48, [13, 13, 0, 0]); X.fill(); glow(x + 13, y + 24, 50, '#ffb347', .25); }
  vignette(.55); };
S.aztec_temple = (t, d) => { sky(SKY.sunset); sun(300, 500, 60); clouds(t, 22, 'rgba(255,170,130,.3)', 80, 300, 5, 8);
  X.save(); X.translate(960, 900); const step = (w, h, y, c) => { X.fillStyle = c; X.fillRect(-w / 2, y - h, w, h); };
  for (let i = 0; i < 6; i++) step(1100 - i * 140, 85, -i * 85, i % 2 ? '#9a8064' : '#8a7058'); X.fillStyle = '#5b4a3b'; X.fillRect(-90, -510, 180, 510);
  X.fillStyle = '#7a1e1e'; X.fillRect(-280, -680, 200, 170); X.fillStyle = '#1e4f7a'; X.fillRect(80, -680, 200, 170); X.fillStyle = '#2a1a10'; X.fillRect(-210, -600, 60, 90); X.fillRect(150, -600, 60, 90); X.restore();
  smoke(780, 230, t, .7, '#888'); smoke(1140, 230, t + 1, .7, '#888'); ground(890, '#6b5638', '#2c2216');
  crowd(1050, 12, 41, 210, 260, { col: '#1a0f0a', hats: ['inca', 'none'] }, t); vignette(.5); };
S.timeline_oxford = (t, d) => { sky(['#0b1022', '#14204a', '#1c1840', '#0c0b1e']); stars(160, 19, t); title('¿Qué llegó primero?', prog(t, 0, .6), 150);
  const k = prog(t, .2, Math.min(d - .3, 5)); const px = timeline([{ year: 1096, label: 'Clases en Oxford', sub: '≈ 1096', col: '#6fb7ff' }, { year: 1325, label: 'Fundación de Tenochtitlan', sub: '1325', col: '#ff9a3c' }], 1000, 1450, k, 560);
  bracket(px(1096), px(1325), 780, '+ de 200 años', prog(t, 2.6, 3.6)); vignette(.4); };
S.tenochtitlan = (t, d) => { sky(SKY.dawn); mountains(5, 520, 280, '#6c7aa0', 7); mountains(6, 560, 180, '#4f5d80', 9);
  sea(560, t, '#4a8bb0', '#1b4a66', '#ffe2b0');
  X.fillStyle = '#c9b18c'; X.beginPath(); X.ellipse(960, 760, 620, 190, 0, 0, 7); X.fill(); X.strokeStyle = '#bda57f'; X.lineWidth = 16; X.beginPath(); X.moveTo(340, 760); X.lineTo(0, 700); X.moveTo(1580, 760); X.lineTo(1920, 720); X.moveTo(960, 950); X.lineTo(960, 1080); X.stroke();
  const R = rng(4); for (let i = 0; i < 70; i++) { const a = R() * 7, r = R(); const x = 960 + Math.cos(a) * 560 * r, y = 760 + Math.sin(a) * 160 * r; X.fillStyle = R() > .5 ? '#e9dcc4' : '#d8c3a0'; X.fillRect(x - 15, y - 22, 30, 22); }
  X.save(); X.translate(960, 760); for (let i = 0; i < 5; i++) { X.fillStyle = i % 2 ? '#a88c6c' : '#987c5e'; X.fillRect(-150 + i * 22, -40 - i * 40, 300 - i * 44, 40); } X.fillStyle = '#7a1e1e'; X.fillRect(-50, -250, 40, 50); X.fillStyle = '#1e4f7a'; X.fillRect(10, -250, 40, 50); X.restore();
  for (let i = 0; i < 6; i++) { const x = (i * 330 + t * 25) % (W + 200) - 100; X.fillStyle = '#3b2a1a'; X.beginPath(); X.ellipse(x, 1000 - (i % 2) * 40, 60, 10, 0, 0, 7); X.fill(); person(x, 995 - (i % 2) * 40, 60, { col: '#2a1a0f' }); }
  vignette(.45); };
S.library = (t, d) => { sky(SKY.indoor); for (let s = 0; s < 5; s++) { const x = 60 + s * 380; X.fillStyle = '#2b1709'; X.fillRect(x, 80, 330, 920);
    for (let r = 0; r < 7; r++) { for (let b = 0; b < 14; b++) { const R = rng(s * 100 + r * 20 + b); X.fillStyle = ['#6b2b1a', '#3f4a2a', '#5a3a1a', '#2a3a5a', '#7a5a2a'][Math.floor(R() * 5)]; X.fillRect(x + 12 + b * 22, 100 + r * 128 + R() * 20, 18, 105 - R() * 20); } X.fillStyle = '#1c0e05'; X.fillRect(x, 205 + r * 128, 330, 12); } }
  X.fillStyle = '#3a2210'; X.fillRect(300, 800, 1320, 40); [[600, 790], [1300, 790]].forEach(([x, y]) => { glow(x, y - 70, 260, '#ffb347', .55 + .1 * Math.sin(t * 7 + x)); X.fillStyle = '#efe0c0'; X.fillRect(x - 8, y - 60, 16, 60); X.fillStyle = '#ffcf6b'; X.beginPath(); X.ellipse(x, y - 72, 7, 14 + Math.sin(t * 9) * 2, 0, 0, 7); X.fill(); });
  person(800, 800, 300, { col: '#120a05', hat: 'mitre', dress: true, rim: 'rgba(255,180,90,.7)' }); person(1100, 800, 290, { col: '#120a05', dress: true, face: -1, rim: 'rgba(255,180,90,.7)', arm: .3 });
  book(960, 790, .35, t); particles(t, 40, 23, '#ffd98a'); vignette(.6); };

// ---------- mamuts ----------
S.mammoths = (t, d) => { sky(SKY.arctic); sun(1500, 330, 50, '#fff', '#cfe6ff'); mountains(31, 600, 260, '#8ea6bf', 8); mountains(32, 660, 160, '#c8d8e6', 10);
  ground(700, '#eef4f8', '#b9cad8'); for (let i = 0; i < 4; i++) mammoth(((i * 420 + t * 35) % (W + 600)) - 300, 900 + i % 2 * 60, .9 + (i % 2) * .25, t * 3 + i, 1);
  particles(t, 140, 33, '#ffffff', 'snow'); vignette(.35); };
S.wrangel_map = (t, d) => { sky(['#06223a', '#0b3355', '#0d3d63', '#07263f']); X.strokeStyle = 'rgba(255,255,255,.08)'; X.lineWidth = 2; for (let i = 0; i < 20; i++) { X.beginPath(); X.moveTo(i * 100, 0); X.lineTo(i * 100, H); X.stroke(); X.beginPath(); X.moveTo(0, i * 60); X.lineTo(W, i * 60); X.stroke(); }
  X.fillStyle = '#d9e6ef'; X.beginPath(); X.moveTo(0, 620); for (let x = 0; x <= W; x += 60) X.lineTo(x, 640 + Math.sin(x / 90) * 40 + Math.sin(x / 33) * 15); X.lineTo(W, H); X.lineTo(0, H); X.fill();
  txt('SIBERIA', 560, 760, 60, '#7d97ab', { w: 900 }); txt('OCÉANO ÁRTICO', 960, 180, 48, 'rgba(255,255,255,.35)', { w: 900 });
  const k = prog(t, .3, 1.2); X.fillStyle = '#e8f0f6'; X.beginPath(); X.ellipse(1200, 430, 150 * ease(k), 70 * ease(k), -.2, 0, 7); X.fill();
  pin(1200, 420, 'Isla Wrangel', prog(t, 1, 1.6)); txt('Últimos mamuts: hace ≈ 4.000 años', 960, 250, 50 * ease(prog(t, 2, 2.6)), GOLD, { stroke: 8 }); vignette(.45); };
S.split_pyr_mammoth = (t, d) => { const k = ease(prog(t, 0, .8)); X.save(); X.beginPath(); X.rect(0, 0, W / 2, H); X.clip(); X.translate(-200, 0); S.pyramid_build(t, d); X.restore();
  X.save(); X.beginPath(); X.rect(W / 2, 0, W / 2, H); X.clip(); X.translate(W / 2 - 300, 0); X.scale(.9, .9); sky(SKY.arctic); ground(700, '#eef4f8', '#b9cad8'); mammoth(600 + t * 20, 920, 1.3, t * 3); particles(t, 80, 35, '#fff', 'snow'); X.restore();
  X.fillStyle = GOLD; X.fillRect(W / 2 - 4, 0, 8, H); panel(W / 2 - 230, 70, 460, 110, 24); txt('MISMA ÉPOCA', W / 2, 125, 58 * k, GOLD, { w: 900 }); vignette(.4); };

// ---------- mitos / Napoleón ----------
S.myth = (t, d) => { sky(SKY.indoor); book(960, 760, 1.1, t); stamp('MITO', 960, 480, prog(t, .6, 1.2)); particles(t, 50, 41, '#ffd98a'); vignette(.6); };
S.napoleon = (t, d) => { sky(SKY.storm); clouds(t, 43, 'rgba(40,40,50,.6)', 60, 400, 7, 20); smoke(300, 900, t, 1.4, '#777'); smoke(1600, 950, t + 2, 1.6, '#666');
  hills(860, 90, '#20242b', .6, 2); ground(860, '#2a2e35', '#101216');
  X.save(); X.translate(1300, 300); X.strokeStyle = '#111'; X.lineWidth = 6; X.beginPath(); X.moveTo(0, 560); X.lineTo(0, 0); X.stroke(); const wv = t * 3;
  ['#002395', '#ffffff', '#ed2939'].forEach((c, i) => { X.fillStyle = c; X.beginPath(); X.moveTo(i * 70, 0 + Math.sin(wv + i) * 8); X.lineTo(i * 70 + 70, Math.sin(wv + i + 1) * 8); X.lineTo(i * 70 + 70, 150 + Math.sin(wv + i + 1) * 8); X.lineTo(i * 70, 150 + Math.sin(wv + i) * 8); X.fill(); }); X.restore();
  horse(820, 900, 2.1, 1); person(860, 700, 330, { col: '#0d0d12', hat: 'bicorne', cape: '#1a1a22', rim: 'rgba(255,220,170,.6)', arm: .9 }); vignette(.6); };
S.height_chart = (t, d) => { sky(['#121a2e', '#1d2a4a', '#1a2440', '#0e1424']); title('¿Cuánto medía Napoleón?', prog(t, 0, .6), 120);
  const k = prog(t, .3, 2.2); const base = 800; X.strokeStyle = 'rgba(255,255,255,.15)'; X.lineWidth = 2;
  for (let cm = 140; cm <= 200; cm += 10) { const y = base - (cm - 120) * 7; X.beginPath(); X.moveTo(300, y); X.lineTo(1650, y); X.stroke(); txt(cm + ' cm', 230, y, 28, 'rgba(255,255,255,.5)'); }
  const ppl = [{ x: 620, cm: 169, lab: 'Napoleón', hat: 'bicorne', col: GOLD }, { x: 1000, cm: 165, lab: 'Francés promedio', hat: 'none', col: '#9ecbff' }, { x: 1380, cm: 185, lab: 'Su guardia', hat: 'bearskin', col: '#ff8a65' }];
  ppl.forEach((p, i) => { const kk = ease(prog(k, i * .25, .5 + i * .25)); const hpx = (p.cm - 120) * 7 * 1.05 * kk + 1; person(p.x, base, hpx * 180 / 175, { col: '#0d0f18', hat: kk > .5 ? p.hat : null, rim: rgba(p.col, .9) });
    txt(p.lab, p.x, base + 60, 40, p.col, { stroke: 7 }); txt((p.cm / 100).toFixed(2).replace('.', ',') + ' m', p.x, base - hpx - 70, 46 * kk, '#fff', { stroke: 8 }); });
  vignette(.4); };
S.inches = (t, d) => { sky(SKY.indoor); X.fillStyle = '#5a3a1f'; X.fillRect(0, 300, W, 780); X.fillStyle = 'rgba(0,0,0,.15)'; for (let i = 0; i < 14; i++) X.fillRect(0, 320 + i * 55, W, 3);
  const ruler = (y, unit, lab, col, k) => { const L = 12 * unit * ease(k); X.fillStyle = col; X.fillRect(300, y, L, 90); X.strokeStyle = '#3a2a10'; X.lineWidth = 3;
    for (let i = 0; i <= 12; i++) if (i * unit <= L) { X.beginPath(); X.moveTo(300 + i * unit, y); X.lineTo(300 + i * unit, y + (i % 6 ? 30 : 55)); X.stroke(); txt(i, 300 + i * unit, y + 72, 24, '#3a2a10'); }
    txt(lab, 300, y - 40, 42, '#fff', { align: 'left', stroke: 7 }); };
  ruler(420, 102, 'Pulgada francesa ≈ 2,71 cm', '#e9d6a5', prog(t, .2, 1.2)); ruler(680, 96, 'Pulgada inglesa ≈ 2,54 cm', '#cfe0f0', prog(t, .8, 1.8));
  txt('5 pies 2 pulgadas… ¡pero francesas!', 960, 220, 54 * ease(prog(t, 2.2, 2.8)), GOLD, { stroke: 9 }); vignette(.5); };
S.caricature = (t, d) => { sky(SKY.indoor); X.fillStyle = '#4a2c16'; X.fillRect(0, 700, W, 380); X.save(); X.translate(960, 560); X.rotate(-.04); X.fillStyle = '#f1e4c6'; X.fillRect(-460, -360, 920, 640);
  X.strokeStyle = '#2a1a0a'; X.lineWidth = 6; const k = prog(t, .2, 2.5); X.setLineDash([2000]); X.lineDashOffset = 2000 * (1 - k);
  // caricatura: Napoleón diminuto con sombrero enorme
  X.beginPath(); X.ellipse(0, -110, 230, 70, 0, Math.PI, 0); X.moveTo(-230, -110); X.quadraticCurveTo(0, -60, 230, -110); X.stroke();
  X.beginPath(); X.arc(0, -40, 45, 0, 7); X.moveTo(-35, 0); X.lineTo(-45, 150); X.lineTo(45, 150); X.lineTo(35, 0); X.moveTo(-25, 150); X.lineTo(-30, 230); X.moveTo(25, 150); X.lineTo(30, 230); X.moveTo(-40, 40); X.lineTo(-110, 100); X.moveTo(40, 40); X.lineTo(110, -10); X.stroke();
  X.setLineDash([]); X.restore(); X.save(); X.translate(1460 + Math.sin(t * 6) * 20, 640 + Math.cos(t * 6) * 10); X.rotate(-.7); X.fillStyle = '#f5f0e6'; X.beginPath(); X.ellipse(0, -110, 26, 120, 0, 0, 7); X.fill(); X.fillStyle = '#222'; X.fillRect(-4, 0, 8, 60); X.restore(); vignette(.6); };
S.guards = (t, d) => { sky(SKY.dawn); hills(820, 60, '#3a3550', .5, 1); ground(830, '#4a4458', '#1e1b26'); clouds(t, 51, 'rgba(255,220,200,.35)', 80, 300, 5, 8);
  [[460, 470], [640, 480], [1280, 470], [1460, 485], [1640, 465]].forEach(([x, h], i) => person(x, 1000, h, { col: '#10101a', hat: 'bearskin', rim: 'rgba(255,200,160,.7)', staff: true, arm: .1, face: x < 960 ? 1 : -1 }));
  person(960, 1000, 300, { col: '#0d0d14', hat: 'bicorne', rim: 'rgba(255,215,120,1)', cape: '#15151d' }); glow(960, 800, 260, '#ffd27a', .25 + .1 * Math.sin(t * 2)); vignette(.55); };

// ---------- vikingos ----------
S.viking_ship = (t, d) => { sky(SKY.storm); clouds(t, 61, 'rgba(60,70,85,.7)', 40, 420, 8, 30); mountains(62, 650, 330, '#1d252e', 6, .7); sea(650, t, '#2c4a5e', '#0b1a24', '#9fb3c8');
  X.save(); X.translate(900, 760 + Math.sin(t * 1.6) * 12); X.rotate(Math.sin(t * 1.2) * .03); X.fillStyle = '#3b2616'; X.beginPath(); X.moveTo(-420, -40); X.quadraticCurveTo(0, 70, 420, -40); X.lineTo(470, -150); X.lineTo(430, -60); X.quadraticCurveTo(0, 30, -430, -60); X.lineTo(-470, -150); X.fill();
  X.strokeStyle = '#2a190d'; X.lineWidth = 8; X.beginPath(); X.moveTo(0, -20); X.lineTo(0, -430); X.stroke(); X.fillStyle = '#b0382f'; X.beginPath(); X.moveTo(-200, -410); X.lineTo(200, -410); X.lineTo(220, -120); X.lineTo(-220, -120); X.fill();
  X.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) X.fillRect(-200, -380 + i * 75, 400, 30);
  for (let i = 0; i < 7; i++) { X.fillStyle = ['#c9a227', '#7a2a2a', '#2a4a7a'][i % 3]; X.beginPath(); X.arc(-330 + i * 110, -40, 32, 0, 7); X.fill(); person(-330 + i * 110, -55, 150, { col: '#141414', hat: 'viking', arm: Math.sin(t * 2 + i) * .3 }); }
  X.restore(); particles(t, 80, 63, '#cfe0ef', 'snow'); vignette(.55); };
S.excavation = (t, d) => { sky(['#6d4c2f', '#5a3d24', '#4a321c', '#3a2614']); const R = rng(71); for (let i = 0; i < 300; i++) { X.fillStyle = `rgba(${60 + R() * 60},${40 + R() * 30},${20 + R() * 20},.5)`; X.beginPath(); X.arc(R() * W, R() * H, R() * 14 + 2, 0, 7); X.fill(); }
  glow(960, 560, 520, '#ffd9a0', .35); X.save(); X.translate(960, 600); X.fillStyle = '#5d5a55'; X.beginPath(); X.arc(0, 0, 210, Math.PI, 0); X.lineTo(210, 30); X.lineTo(-210, 30); X.fill();
  X.fillStyle = '#7a756d'; X.beginPath(); X.arc(-60, -110, 90, Math.PI * 1.1, Math.PI * 1.6); X.lineTo(-60, -110); X.fill(); X.fillStyle = '#4a4742'; X.fillRect(-12, -205, 24, 230); X.fillRect(-150, -40, 300, 26); X.restore();
  X.save(); X.translate(1250 + Math.sin(t * 4) * 40, 470); X.rotate(-.6 + Math.sin(t * 4) * .1); X.fillStyle = '#c8a26b'; X.fillRect(-10, -160, 20, 160); X.fillStyle = '#222'; X.fillRect(-26, 0, 52, 70); X.restore();
  stamp('SIN CUERNOS', 960, 800, prog(t, 1.2, 1.8), '#2ecc71', 0); particles(t, 50, 72, '#e8c89a'); vignette(.6); };
S.opera = (t, d) => { sky(SKY.stage); X.fillStyle = '#5a0f1a'; X.fillRect(0, 0, 330, H); X.fillRect(W - 330, 0, 330, H); X.fillStyle = '#7a1424';
  for (let i = 0; i < 6; i++) { X.fillRect(i * 55, 0, 28, H); X.fillRect(W - 330 + i * 55, 0, 28, H); } X.fillStyle = '#4a0c15'; X.fillRect(0, 0, W, 130);
  X.fillStyle = '#3a2416'; X.fillRect(330, 820, W - 660, 260); [[700, 1], [1220, -1]].forEach(([x, f], i) => { X.save(); X.globalCompositeOperation = 'lighter'; const g = X.createLinearGradient(x, 0, x, 820); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(1, 'rgba(255,240,200,.35)'); X.fillStyle = g; X.beginPath(); X.moveTo(x - 30, 0); X.lineTo(x + 30, 0); X.lineTo(x + 220, 820); X.lineTo(x - 220, 820); X.fill(); X.restore();
    person(x, 840, 430, { col: '#1a0f12', hat: 'horned', hatCol: '#f0e2c0', cape: '#5a1010', dress: true, rim: 'rgba(255,230,180,.9)', face: f, arm: Math.sin(t * 2 + i) * .8 + .3 }); });
  crowd(1120, 30, 73, 160, 200, { col: '#050305' }, t); vignette(.5); };
S.viking_stuck = (t, d) => { sky(SKY.indoor); X.fillStyle = '#4a3020'; X.fillRect(0, 0, W, H); X.fillStyle = '#2a190d'; X.fillRect(780, 250, 360, 830); X.fillStyle = '#6b4428'; X.fillRect(740, 210, 440, 60); X.fillRect(740, 250, 50, 830); X.fillRect(1130, 250, 50, 830);
  const shake = Math.sin(t * 18) * 6; person(960 + shake, 1080, 820, { col: '#1a120c', hat: 'horned', hatCol: '#efe0bf', cape: '#5a1e10', rim: 'rgba(255,190,120,.7)', arm: .7 + Math.sin(t * 9) * .3 });
  for (let i = 0; i < 6; i++) { const k = (t * 1.5 + i / 6) % 1; X.fillStyle = `rgba(255,255,255,${1 - k})`; X.beginPath(); X.arc(800 + i * 60, 260 - k * 80, 6, 0, 7); X.fill(); }
  txt('¡CLONK!', 1450, 300 + Math.sin(t * 6) * 10, 90, GOLD, { w: 900, stroke: 10 }); vignette(.55); };

// ---------- guerra más corta ----------
S.stopwatch = (t, d) => { sky(SKY.night); X.fillStyle = '#1f6b2a'; X.beginPath(); X.moveTo(0, 620); X.lineTo(W, 620); X.lineTo(W, H); X.lineTo(0, H); X.fill();
  X.strokeStyle = 'rgba(255,255,255,.7)'; X.lineWidth = 6; X.beginPath(); X.moveTo(W / 2, 620); X.lineTo(W / 2, H); X.stroke(); X.beginPath(); X.ellipse(W / 2, 850, 200, 90, 0, 0, 7); X.stroke();
  [[200, 120], [1720, 120]].forEach(([x, y]) => { glow(x, y, 400, '#fffbe0', .5); X.fillStyle = '#fff'; X.fillRect(x - 60, y - 20, 120, 40); });
  crowd(640, 60, 81, 50, 70, { col: '#0a0a10', cheer: true }, t); clockFace(960, 420, 210, (t * 6) % 60); vignette(.45); };
S.zanzibar_palace = (t, d) => { sky(SKY.day); sun(1600, 180, 60); clouds(t, 91, 'rgba(255,255,255,.9)', 60, 280, 5, 10); sea(700, t, '#2bb0c4', '#0b5d78');
  ground(640, '#f2e4c4', '#d9c49a'); palace(900, 660, 1.3); palm(250, 700, 380, t); palm(1650, 700, 420, t + 1); palm(1500, 720, 300, t + 2);
  ship(1500, 860, .55, t); ship(300, 900, .5, t + 1); vignette(.35); };
S.zanzibar_fire = (t, d) => { sky(['#2a2a33', '#5a4a44', '#a0705a', '#d8a070']); clouds(t, 93, 'rgba(60,60,60,.5)', 60, 300, 6, 18); sea(720, t, '#3a6070', '#0e2a35');
  ground(660, '#cdbb9a', '#8a7a5a'); palace(1300, 680, .9, '#e2dccb'); smoke(1300, 480, t, 1.8, '#444'); smoke(1100, 500, t + 1.5, 1.4, '#555');
  const fire = i => Math.max(0, Math.sin(t * 3 + i * 2)) ** 8; ship(600, 900, .9, t, fire(0)); ship(150, 860, .6, t + 2, fire(1));
  for (let i = 0; i < 3; i++) { const k = (t * 1.2 + i / 3) % 1; flash(lerp(1150, 1450, (i * .37) % 1), 560 + i * 40, 60, Math.max(0, 1 - k * 3)); } particles(t, 60, 95, '#ffb070', 'embers'); vignette(.5); };
S.clock38 = (t, d) => { sky(['#14161f', '#20222e', '#2a2433', '#15141c']); title('La guerra más corta de la historia', prog(t, 0, .5), 130);
  const m = 38 * ease(prog(t, .2, 3)); clockFace(620, 540, 240, m); txt(Math.round(m) + ' min', 620, 210, 80, '#ff6b6b', { w: 900, stroke: 10 });
  bars([{ label: 'Guerra Reino Unido - Zanzíbar', v: 38, col: '#ff6b6b', fmt: v => Math.round(v) + ' min' }, { label: 'Primer tiempo de fútbol', v: 45, col: '#6fdc8c', fmt: v => Math.round(v) + ' min' }], prog(t, 1.5, 4), 1000, 430, 620, 80, 110, 45); vignette(.4); };

// ---------- emús ----------
S.emus_field = (t, d) => { sky(SKY.desert); sun(1550, 220, 60); clouds(t, 101, 'rgba(255,255,255,.8)', 60, 260, 4, 8);
  hills(640, 60, '#a07a4a', .4, 1); ground(640, '#d8b35a', '#8a6a2a'); for (let i = 0; i < 160; i++) { const R = rng(i); X.strokeStyle = 'rgba(120,90,30,.5)'; X.lineWidth = 2; const x = R() * W, y = 660 + R() * 420; X.beginPath(); X.moveTo(x, y); X.lineTo(x + Math.sin(t + i) * 4, y - 20 - R() * 20); X.stroke(); }
  [[500, 920, 1.5, 1], [900, 880, 1.2, -1], [1300, 950, 1.7, -1], [1600, 820, .9, 1], [250, 830, .9, 1]].forEach(([x, y, s, f], i) => emu(x, y, s, t * 2 + i, f)); vignette(.35); };
S.emus_wheat = (t, d) => { sky(SKY.desert); sun(400, 200, 55); ground(600, '#e2c35e', '#a07a2a');
  for (let i = 0; i < 400; i++) { const R = rng(i + 7); const x = R() * W, y = 620 + R() * 460, h = 30 + R() * 30; X.strokeStyle = '#c9a23a'; X.lineWidth = 3; X.beginPath(); X.moveTo(x, y); X.lineTo(x + Math.sin(t * 2 + x) * 6, y - h); X.stroke(); X.fillStyle = '#e8c45a'; X.beginPath(); X.ellipse(x + Math.sin(t * 2 + x) * 6, y - h, 4, 10, 0, 0, 7); X.fill(); }
  for (let i = 0; i < 14; i++) { const R = rng(i + 70); emu(((R() * W + t * 60 * (R() > .5 ? 1 : -1)) % (W + 300) + W + 300) % (W + 300) - 150, 700 + R() * 380, .6 + R() * .7, t * 6 + i, R() > .5 ? 1 : -1); }
  person(1700, 1000, 380, { col: '#2a1c10', hat: 'slouch', arm: .9 + Math.sin(t * 8) * .3, face: -1, rim: 'rgba(255,220,150,.8)' }); txt('!', 1700, 520, 120, '#ff3b3b', { w: 900, stroke: 10 }); vignette(.35); };
S.emu_war = (t, d) => { sky(SKY.desert); sun(1650, 200, 55); clouds(t, 111, 'rgba(255,255,255,.7)', 60, 260, 4, 10); hills(620, 40, '#b08850', .5, 2); ground(620, '#d9b45e', '#94702e');
  truck(520, 900, 1.6); machinegun(560, 690, 1.4, Math.max(0, Math.sin(t * 25)) * (t % 2 < 1.2 ? 1 : 0)); person(470, 720, 190, { col: '#3a3a1e', hat: 'slouch', arm: .5 }); person(650, 730, 180, { col: '#3a3a1e', hat: 'slouch', arm: 1.2 });
  for (let i = 0; i < 12; i++) { const R = rng(i + 120); const sp = 120 + R() * 200, x = 1000 + ((R() * 900 + t * sp) % 1200); emu(x, 720 + R() * 330, .55 + R() * .6, t * 10 + i, 1); }
  particles(t, 100, 113, '#e8c890'); smoke(1100, 950, t, 1.1, '#c9a46a'); vignette(.4); };
S.emu_victory = (t, d) => { sky(SKY.sunset); sun(1500, 640, 80); rays(1500, 640, '#ffb347', t, 14, 1600, .06); hills(760, 140, '#4a2c1a', .35, 1); ground(760, '#7a4a24', '#2a170b');
  truck(lerp(700, -400, ease(prog(t, 0, d))), 930, 1.0, '#2a2a1a'); emu(1250, 790, 2.2, 0, -1, '#2a1d12');
  if (t > .8) { X.fillStyle = 'rgba(255,255,255,.95)'; X.beginPath(); X.roundRect(1330, 220, 360, 110, 30); X.fill(); X.beginPath(); X.moveTo(1380, 330); X.lineTo(1360, 380); X.lineTo(1420, 330); X.fill(); txt('¡Ganamos!', 1510, 276, 54 * back(prog(t, .8, 1.2)), '#222', { w: 900 }); }
  vignette(.5); };

// ---------- el balde ----------
S.bucket = (t, d) => { sky(['#0b0705', '#1e140c', '#2e1e12', '#120a05']); rays(960, 300, '#ffd27a', t, 10, 1400, .07); bucket(960, 820, 2.4, .6); particles(t, 70, 121, '#ffd98a'); vignette(.6); };
S.bucket_theft = (t, d) => { sky(SKY.night); stars(200, 131, t, 600); moon(1650, 160, 60); hills(700, 100, '#101522', .5, 1);
  X.fillStyle = '#0c0f18'; [[150, 260], [300, 340], [420, 220], [1550, 300], [1700, 380]].forEach(([x, h]) => { X.fillRect(x - 45, 720 - h, 90, h); X.fillRect(x - 55, 720 - h, 110, 18); });
  ground(700, '#161b28', '#07090f'); X.fillStyle = '#2a2f3a'; X.beginPath(); X.ellipse(960, 760, 110, 30, 0, 0, 7); X.fill(); X.fillRect(850, 700, 220, 60);
  const x = lerp(700, 1400, ease(prog(t, 0, d))); person(x, 980, 330, { col: '#0a0a10', hat: 'cap', torch: true, arm: .9, walk: t * 6 });
  person(x + 160, 990, 340, { col: '#0a0a10', hat: 'cap', walk: t * 6 + 1, arm: .4, item: (a, b) => { X.save(); X.translate(a, b + 90); X.scale(.38, .38); bucket(0, 0, 1); X.restore(); } }); vignette(.6); };
S.battle = (t, d) => { sky(['#2a1a1a', '#5a3a2a', '#a0603a', '#d08a4a']); clouds(t, 141, 'rgba(70,40,30,.5)', 80, 380, 6, 20); hills(720, 80, '#3a2416', .6, 1); ground(720, '#4a3020', '#1a0f08');
  for (let side = 0; side < 2; side++) { const R = rng(150 + side); for (let i = 0; i < 26; i++) { const x0 = side ? 1300 + R() * 600 : R() * 620, adv = ease(prog(t, 0, d)) * 200 * (side ? -1 : 1);
    person(x0 + adv, 760 + R() * 300, 170 + R() * 80, { col: '#120a06', hat: R() > .5 ? 'viking' : 'cap', face: side ? -1 : 1, staff: R() > .4, arm: Math.sin(t * 4 + i) * .5 + .4, walk: t * 5 + i }); }
    X.save(); X.translate(side ? 1500 : 400, 360); const c = side ? '#c0392b' : '#e0b030'; X.strokeStyle = '#111'; X.lineWidth = 6; X.beginPath(); X.moveTo(0, 0); X.lineTo(0, 380); X.stroke(); X.fillStyle = c; X.beginPath(); X.moveTo(0, 0); X.lineTo(160, 20 + Math.sin(t * 3) * 10); X.lineTo(150, 110); X.lineTo(0, 100); X.fill(); X.restore(); }
  smoke(960, 820, t, 1.5, '#5a4a3a'); particles(t, 70, 151, '#ffb070', 'embers'); vignette(.55); };
S.bucket_tower = (t, d) => { sky(SKY.dawn); clouds(t, 161, 'rgba(255,230,210,.6)', 60, 300, 5, 8);
  X.fillStyle = '#c9b8a0'; X.fillRect(300, 120, 520, 960); X.fillStyle = '#b3a18a'; for (let i = 0; i < 6; i++) X.fillRect(300, 180 + i * 150, 520, 14);
  X.fillStyle = '#2a1e14'; X.beginPath(); X.roundRect(480, 380, 160, 260, [80, 80, 0, 0]); X.fill(); glow(560, 560, 240, '#ffd27a', .6); bucket(560, 620, .9);
  X.fillStyle = '#dccdb6'; X.fillRect(820, 700, 1100, 380); txt('Módena, hoy', 1370, 300, 64, '#fff', { w: 900, stroke: 9 }); txt('«La Secchia Rapita»', 1370, 380, 46, GOLD, { stroke: 7 }); vignette(.45); };

// ---------- incas ----------
S.andes = (t, d) => { sky(SKY.dawn); sun(1500, 380, 60); mountains(171, 480, 360, '#5d6a8c', 6, .7); mountains(172, 560, 260, '#46506e', 8); clouds(t, 173, 'rgba(255,255,255,.55)', 420, 560, 6, 12);
  mountains(174, 700, 240, '#2c4a2e', 7); for (let i = 0; i < 9; i++) { X.fillStyle = i % 2 ? '#4f7a3a' : '#5f8a44'; X.beginPath(); X.ellipse(960, 760 + i * 38, 700 - i * 40, 26, 0, Math.PI, 0); X.fill(); X.fillStyle = '#6b6457'; X.fillRect(260 + i * 40, 760 + i * 38, 1400 - i * 80, 8); }
  X.fillStyle = '#8a8274'; [[760, 720], [880, 700], [1020, 715], [1150, 705]].forEach(([x, y]) => { X.fillRect(x - 40, y - 60, 80, 60); X.fillStyle = '#5a4a2a'; X.beginPath(); X.moveTo(x - 50, y - 60); X.lineTo(x, y - 110); X.lineTo(x + 50, y - 60); X.fill(); X.fillStyle = '#8a8274'; });
  condor(lerp(200, 1700, (t * .06) % 1), 260 + Math.sin(t) * 30, 1, t); vignette(.4); };
S.inca_emperor = (t, d) => { sky(['#1a0c05', '#3a1c08', '#6a3510', '#2a1406']); rays(960, 360, '#ffcf4a', t, 18, 1500, .09);
  X.save(); X.translate(960, 360); X.rotate(t * .1); X.fillStyle = '#e0a82e'; for (let i = 0; i < 16; i++) { X.rotate(Math.PI / 8); X.beginPath(); X.moveTo(-25, -170); X.lineTo(0, -260); X.lineTo(25, -170); X.fill(); } X.restore();
  X.fillStyle = '#f2c14e'; X.beginPath(); X.arc(960, 360, 170, 0, 7); X.fill(); X.fillStyle = '#c98a1e'; X.beginPath(); X.arc(960, 360, 130, 0, 7); X.fill();
  X.fillStyle = '#7a5a2a'; X.fillRect(780, 760, 360, 60); X.fillRect(820, 620, 280, 150); person(960, 800, 420, { col: '#1a0d06', hat: 'inca', cape: '#8a1a1a', rim: 'rgba(255,200,80,.9)', staff: true, arm: .6 });
  crowd(1080, 10, 181, 220, 260, { col: '#120804', hat: 'inca' }, t); vignette(.55); };
S.quipu = (t, d) => { sky(['#2a1a10', '#4a2c18', '#5a3820', '#2a170b']); glow(960, 400, 700, '#ffcf8a', .35); X.strokeStyle = '#d9c39a'; X.lineWidth = 16; X.beginPath(); X.moveTo(260, 260); X.quadraticCurveTo(960, 300 + Math.sin(t) * 10, 1660, 260); X.stroke();
  const cols = ['#c0392b', '#f1c40f', '#ecf0f1', '#8e5a2b', '#27ae60', '#2980b9', '#e67e22'];
  for (let i = 0; i < 34; i++) { const x = 300 + i * 40, sw = Math.sin(t * 1.5 + i * .4) * 14; X.strokeStyle = cols[i % 7]; X.lineWidth = 9; X.beginPath(); X.moveTo(x, 272 + Math.sin(i / 34 * Math.PI) * 30); X.quadraticCurveTo(x + sw, 600, x + sw * 1.6, 900 + (i % 5) * 30); X.stroke();
    const R = rng(i); for (let k = 0; k < 4; k++) { const ky = 380 + k * 120 + R() * 40, kx = x + sw * (ky - 270) / 630 * 1.2; X.fillStyle = shade(cols[i % 7], -.35); X.beginPath(); X.ellipse(kx, ky, 11, 16, 0, 0, 7); X.fill(); } }
  vignette(.55); };
S.quipu_decode = (t, d) => { sky(['#0c1424', '#14223a', '#1a2a48', '#0b1220']); title('Cada nudo, un número', prog(t, 0, .5), 120);
  const items = [{ c: '#c0392b', n: 3, lab: 'Censo' }, { c: '#f1c40f', n: 7, lab: 'Maíz' }, { c: '#ecf0f1', n: 2, lab: 'Llamas' }, { c: '#27ae60', n: 5, lab: 'Impuestos' }];
  items.forEach((it, i) => { const x = 420 + i * 360, k = ease(prog(t, .3 + i * .4, 1 + i * .4)); X.strokeStyle = it.c; X.lineWidth = 14; X.beginPath(); X.moveTo(x, 230); X.lineTo(x, 230 + 500 * k); X.stroke();
    for (let j = 0; j < it.n; j++) if (k > j / it.n) { X.fillStyle = shade(it.c, -.4); X.beginPath(); X.ellipse(x, 320 + j * 60, 22, 26, 0, 0, 7); X.fill(); }
    txt(String(it.n * 100 + (i * 37) % 90), x, 790, 64 * k, GOLD, { w: 900, stroke: 8 }); txt(it.lab, x, 850, 38 * k, '#fff', { stroke: 6 }); }); vignette(.4); };
S.quipu_computer = (t, d) => { sky(['#020208', '#060a1a', '#0a1028', '#03050f']); for (let i = 0; i < 30; i++) { const x = 200 + i * 52; X.strokeStyle = `hsla(${40 + i * 3},90%,60%,.85)`; X.lineWidth = 6; X.shadowColor = '#ffcf4a'; X.shadowBlur = 20;
    X.beginPath(); X.moveTo(x, 150); X.lineTo(x + Math.sin(t + i) * 10, 950); X.stroke(); const p = ((t * .5 + i * .13) % 1); X.fillStyle = '#fff'; X.beginPath(); X.arc(x + Math.sin(t + i) * 10 * p, 150 + p * 800, 8, 0, 7); X.fill(); }
  X.shadowBlur = 0; X.strokeStyle = GOLD; X.lineWidth = 14; X.beginPath(); X.moveTo(150, 150); X.lineTo(1770, 150); X.stroke(); txt('0101 · 1101 · 0011', 960, 540, 80, rgba('#ffffff', .15 + .1 * Math.sin(t * 3)), { w: 900 }); vignette(.5); };
S.chasqui = (t, d) => { sky(SKY.dawn); sun(400, 420, 60); mountains(191, 520, 330, '#5d6a8c', 6); mountains(192, 620, 230, '#3c4a62', 8); hills(760, 60, '#3b5a2c', .5, 1);
  ground(760, '#4a6a32', '#1e2e14'); X.strokeStyle = '#a89878'; X.lineWidth = 50; X.beginPath(); X.moveTo(-100, 1000); X.quadraticCurveTo(900, 760, 2000, 820); X.stroke();
  const x = (t * 160) % (W + 400) - 200; person(x, 905 - x * .05, 300, { col: '#1a0d06', hat: 'inca', walk: t * 12, arm: Math.sin(t * 12) * .6, rim: 'rgba(255,200,140,.9)', cape: '#a0261d' }); particles(t, 40, 193, '#ffe0b0'); vignette(.4); };
S.relay = (t, d) => { sky(SKY.dawn); mountains(201, 600, 300, '#56607e', 7); ground(760, '#5a7a3a', '#1e2e14'); X.fillStyle = '#7a6a54'; X.fillRect(1250, 600, 200, 160); X.fillStyle = '#4a3a20'; X.beginPath(); X.moveTo(1230, 600); X.lineTo(1350, 520); X.lineTo(1470, 600); X.fill();
  const k = ease(prog(t, 0, Math.min(d, 3))); person(lerp(300, 880, k), 960, 320, { col: '#1a0d06', hat: 'inca', walk: t * 12 * (1 - k * .8), arm: .9, cape: '#a0261d', rim: 'rgba(255,200,140,.8)', item: (a, b) => { X.fillStyle = '#e8d7b0'; X.fillRect(a - 6, b - 8, 12, 50); } });
  person(lerp(1050, 1700, ease(prog(t, 2.5, d))), 960, 320, { col: '#1a0d06', hat: 'inca', walk: t > 2.5 ? t * 12 : 0, arm: .9, face: 1, cape: '#2a6a9a', rim: 'rgba(255,200,140,.8)' });
  if (t > 2 && t < 3) glow(960, 760, 160, '#ffd27a', .8); vignette(.4); };
S.relay_map = (t, d) => { sky(['#1a1206', '#3a2a12', '#4a3618', '#2a1e0c']); X.fillStyle = 'rgba(240,220,170,.08)'; X.fillRect(0, 0, W, H);
  title('Corredores de relevos: cientos de km al día', prog(t, 0, .5), 110, 56);
  const pts = []; for (let i = 0; i <= 14; i++) pts.push([260 + i * 100, 620 + Math.sin(i * .9) * 160]);
  X.strokeStyle = 'rgba(255,255,255,.25)'; X.lineWidth = 10; X.beginPath(); pts.forEach(([x, y], i) => i ? X.lineTo(x, y) : X.moveTo(x, y)); X.stroke();
  const k = prog(t, .3, d - .3) * 14; X.strokeStyle = GOLD; X.lineWidth = 12; X.beginPath(); pts.forEach(([x, y], i) => { if (i <= k + 1) { const kk = clamp(k - i + 1); if (!i) X.moveTo(x, y); else { const [px, py] = pts[i - 1]; X.lineTo(lerp(px, x, kk), lerp(py, y, kk)); } } }); X.stroke();
  pts.forEach(([x, y], i) => { if (i <= k) { X.fillStyle = '#fff'; X.beginPath(); X.arc(x, y, 14, 0, 7); X.fill(); } });
  txt(Math.round(k / 14 * 240) + ' km', 960, 260, 90, GOLD, { w: 900, stroke: 10 }); vignette(.45); };
S.fish_cusco = (t, d) => { sky(['#10223a', '#1c3a5a', '#2a5a7a', '#14304a']);
  X.fillStyle = '#c9a66b'; X.beginPath(); X.moveTo(0, 0); X.lineTo(700, 0); X.quadraticCurveTo(600, 500, 760, H); X.lineTo(0, H); X.fill(); X.fillStyle = '#2b6aa0'; X.beginPath(); X.moveTo(0, 0); X.lineTo(380, 0); X.quadraticCurveTo(300, 500, 420, H); X.lineTo(0, H); X.fill();
  mountains(211, 760, 300, '#5a6a4a', 5); X.globalAlpha = .9; X.fillStyle = '#3a4a2a'; X.fillRect(700, 760, W, 400); X.globalAlpha = 1;
  title('Del mar a la mesa del Inca', prog(t, 0, .5), 150, 60); pin(350, 600, 'Costa', prog(t, .2, .6), '#2b9adf'); pin(1500, 560, 'Cusco', prog(t, .5, .9));
  const k = prog(t, .8, d - .5); arrow(420, 600, 1440, 560, k); fish(lerp(420, 1400, ease(k)), lerp(600, 520, ease(k)) - 40, 1, 1); vignette(.45); };
