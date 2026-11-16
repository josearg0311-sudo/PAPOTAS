// Pulido final tras la revisión escena a escena (se carga después de estructuras.js)

// títulos nunca encima de la barra de progreso
function title(s, k, y = 140, size = 64, col = '#fff') { if (k <= 0) return; y = Math.max(y, 175); X.globalAlpha = ease(k); txt(s, W / 2, y + 20 * (1 - ease(k)), size, col, { stroke: 10 }); X.globalAlpha = 1; }

// ---------- líneas de tiempo adaptadas a la duración de la escena ----------
function tlK(t, d) { return prog(t, .15, Math.max(1.2, d * .6)); }
function tlB(t, d) { return prog(t, Math.max(1, d * .55), Math.max(1.6, d * .8)); }
S.timeline_cleo = (t, d) => { sky(['#0b0e22', '#1b1640', '#2a1b3d', '#120c1e']); stars(160, 13, t); particles(t, 40, 3, '#ffd98a');
  title('¿Quién está más cerca de quién?', prog(t, 0, .6), 175);
  const k = tlK(t, d), px = timeline([{ year: -2560, label: 'Gran Pirámide', sub: '2560 a.C.', col: '#e6b45a' }, { year: -69, label: 'Cleopatra', sub: '69 a.C.', col: '#ff7a59' }, { year: 1969, label: 'Llegada a la Luna', sub: '1969', col: '#6fb7ff' }], -2700, 2100, k, 480);
  bracket(px(-2560), px(-69), 790, '≈ 2.500 años', tlB(t, d), '#e6b45a'); bracket(px(-69), px(1969), 790, '≈ 2.000 años', prog(t, Math.max(1.2, d * .65), Math.max(1.8, d * .9)), '#6fb7ff'); vignette(.4); };
S.timeline_oxford = (t, d) => { sky(['#0b1022', '#14204a', '#1c1840', '#0c0b1e']); stars(160, 19, t); title('¿Qué llegó primero?', prog(t, 0, .5), 175);
  const k = tlK(t, d), px = timeline([{ year: 1096, label: 'Clases en Oxford', sub: '≈ 1096', col: '#6fb7ff' }, { year: 1325, label: 'Fundación de Tenochtitlan', sub: '1325', col: '#ff9a3c' }], 1000, 1450, k, 520);
  bracket(px(1096), px(1325), 800, '+ de 200 años', tlB(t, d)); vignette(.4); };
S.timeline_fax = (t, d) => { sky(['#0b1022', '#14204a', '#1c1840', '#0c0b1e']); stars(160, 411, t); title('¿Fax o teléfono?', prog(t, 0, .5), 175);
  const k = tlK(t, d), px = timeline([{ year: 1843, label: 'Primer «fax»', sub: '1843', col: '#ffb347' }, { year: 1876, label: 'Teléfono', sub: '1876', col: '#6fb7ff' }], 1830, 1890, k, 520);
  bracket(px(1843), px(1876), 800, '33 años antes', tlB(t, d)); vignette(.4); };
S.timeline_nintendo = (t, d) => { sky(['#0b1022', '#14204a', '#1c1840', '#0c0b1e']); stars(160, 431, t); title('Nintendo es más antigua que…', prog(t, 0, .5), 175);
  timeline([{ year: 1889, label: 'Nintendo', sub: '1889', col: '#e53935' }, { year: 1895, label: 'Cine', sub: '1895', col: '#ffb347' }, { year: 1903, label: 'Avión', sub: '1903', col: '#6fb7ff' }, { year: 1920, label: 'Radio', sub: '≈ 1920', col: '#6fdc8c' }], 1880, 1930, tlK(t, d), 540); vignette(.4); };
S.timeline_glow = (t, d) => { sky(['#05040c', '#0c0a1c', '#140f2c', '#06050e']); stars(250, 401, t); title('Tres datos sobre el tiempo', prog(t, 0, .5), 200, 70);
  const k = tlK(t, d); timeline([{ year: 1843, label: 'Fax', sub: '1843', col: '#ffb347' }, { year: 1889, label: 'Nintendo', sub: '1889', col: '#e53935' }, { year: 1977, label: 'Guillotina', sub: '1977', col: '#9ecbff' }], 1820, 2000, k, 560); vignette(.5); };

// ---------- textos que chocaban ----------
const _excav = S.excavation;
S.excavation = (t, d) => { sky(['#6d4c2f', '#5a3d24', '#4a321c', '#3a2614']); const R = rng(71); for (let i = 0; i < 300; i++) { X.fillStyle = `rgba(${60 + R() * 60},${40 + R() * 30},${20 + R() * 20},.5)`; X.beginPath(); X.arc(R() * W, R() * H, R() * 14 + 2, 0, 7); X.fill(); }
  glow(960, 640, 520, '#ffd9a0', .35); X.save(); X.translate(960, 700);
  X.beginPath(); X.arc(0, 0, 210, Math.PI, 0); X.lineTo(210, 30); X.lineTo(-210, 30); X.closePath(); ob('#6a6660');
  X.beginPath(); X.rect(-14, -208, 28, 236); ob('#4a4742', 4); X.beginPath(); X.rect(-180, -50, 360, 28); ob('#4a4742', 4);
  X.beginPath(); X.moveTo(-60, -10); X.quadraticCurveTo(-70, 60, -30, 90); X.lineTo(-10, 30); X.closePath(); ob('#5a5650', 4); X.restore();
  X.save(); X.translate(1300 + Math.sin(t * 4) * 40, 560); X.rotate(-.6 + Math.sin(t * 4) * .1); X.beginPath(); X.rect(-10, -160, 20, 160); ob('#c8a26b', 4); X.beginPath(); X.rect(-26, 0, 52, 70); ob('#333', 4); X.restore();
  stamp('SIN CUERNOS', 960, 300, prog(t, Math.min(1.2, d * .3), Math.min(1.8, d * .5)), '#2ecc71', 0); particles(t, 50, 72, '#e8c89a'); vignette(.6); };

// ---------- drakkar vikingo ----------
S.viking_ship = (t, d) => { sky(SKY.storm); clouds(t, 61, 'rgba(60,70,85,.7)', 40, 380, 8, 30); mountains(62, 600, 330, '#1d252e', 6, .7); sea(640, t, '#2c4a5e', '#0b1a24', '#9fb3c8');
  X.save(); X.translate(960, 780 + Math.sin(t * 1.6) * 12); X.rotate(Math.sin(t * 1.2) * .025);
  // mástil y vela
  X.beginPath(); X.rect(-10, -560, 20, 520); ob('#4a2e18', 4); X.beginPath(); X.moveTo(-260, -520); X.lineTo(260, -520); X.quadraticCurveTo(300, -330, 250, -170); X.lineTo(-250, -170); X.quadraticCurveTo(-300, -330, -260, -520); X.closePath(); ob('#b0382f');
  X.save(); X.clip(); X.fillStyle = '#f3ead8'; for (let i = 0; i < 4; i++) X.fillRect(-300, -500 + i * 90, 600, 42); X.restore(); X.beginPath(); X.moveTo(-260, -520); X.lineTo(260, -520); X.quadraticCurveTo(300, -330, 250, -170); X.lineTo(-250, -170); X.quadraticCurveTo(-300, -330, -260, -520); X.lineWidth = OL; X.strokeStyle = INK; X.stroke();
  // tripulación (detrás del casco)
  for (let i = 0; i < 6; i++) person(-330 + i * 130, -40, 170, { hat: 'viking', arm: Math.sin(t * 2.4 + i) * .5 + .2, expr: i % 2 ? 'talk' : 'smile' });
  // casco con proa y popa de dragón
  X.beginPath(); X.moveTo(-520, -150); X.quadraticCurveTo(-470, -40, -400, -30); X.lineTo(400, -30); X.quadraticCurveTo(470, -40, 520, -150); X.quadraticCurveTo(540, -40, 420, 50); X.lineTo(-420, 50); X.quadraticCurveTo(-540, -40, -520, -150); X.closePath(); ob('#6b4226');
  X.strokeStyle = 'rgba(0,0,0,.35)'; X.lineWidth = 3; for (let i = 0; i < 3; i++) { X.beginPath(); X.moveTo(-430, -10 + i * 18); X.lineTo(430, -10 + i * 18); X.stroke(); }
  X.beginPath(); X.moveTo(520, -150); X.quadraticCurveTo(560, -230, 600, -240); X.lineTo(640, -228); X.lineTo(600, -212); X.quadraticCurveTo(570, -190, 548, -130); X.closePath(); ob('#6b4226'); X.fillStyle = '#ffd23f'; X.beginPath(); X.arc(605, -230, 5, 0, 7); X.fill();
  X.beginPath(); X.moveTo(-520, -150); X.quadraticCurveTo(-560, -220, -540, -260); X.quadraticCurveTo(-520, -220, -500, -140); X.closePath(); ob('#6b4226');
  for (let i = 0; i < 9; i++) { X.beginPath(); X.arc(-380 + i * 95, -30, 34, 0, 7); ob(['#c9a227', '#7a2a2a', '#2a4a7a'][i % 3], 4); X.beginPath(); X.arc(-380 + i * 95, -30, 9, 0, 7); ob('#bbb', 3); }
  for (let i = 0; i < 7; i++) { X.save(); X.translate(-330 + i * 110, 30); X.rotate(.5 + Math.sin(t * 2.4 + i) * .25); X.beginPath(); X.rect(-5, 0, 10, 170); ob('#8a5a2a', 3); X.restore(); }
  X.restore(); particles(t, 80, 63, '#cfe0ef', 'snow'); vignette(.55); };

// ---------- Tenochtitlan ----------
S.tenochtitlan = (t, d) => { sky(SKY.dawn); mountains(5, 470, 260, '#6c7aa0', 7); mountains(6, 520, 160, '#4f5d80', 9); sea(520, t, '#4a8bb0', '#1b4a66', '#ffe2b0');
  X.beginPath(); X.ellipse(960, 780, 820, 230, 0, 0, 7); ob('#cdb48c');
  X.strokeStyle = INK; X.lineWidth = 26; [[[300, 760], [-100, 700]], [[1620, 760], [2050, 720]], [[960, 1000], [960, 1200]]].forEach(([a, b]) => { X.beginPath(); X.moveTo(...a); X.lineTo(...b); X.stroke(); });
  X.strokeStyle = '#bda57f'; X.lineWidth = 18; [[[300, 760], [-100, 700]], [[1620, 760], [2050, 720]], [[960, 1000], [960, 1200]]].forEach(([a, b]) => { X.beginPath(); X.moveTo(...a); X.lineTo(...b); X.stroke(); });
  X.strokeStyle = '#4a8bb0'; X.lineWidth = 10; for (let i = -2; i <= 2; i++) { X.beginPath(); X.moveTo(400, 780 + i * 60); X.lineTo(1520, 780 + i * 60); X.stroke(); }
  const R = rng(4); for (let i = 0; i < 90; i++) { const a = R() * 7, r = Math.sqrt(R()); const x = 960 + Math.cos(a) * 740 * r, y = 780 + Math.sin(a) * 200 * r; if (Math.abs(x - 960) < 230 && Math.abs(y - 760) < 120) continue;
    X.beginPath(); X.rect(x - 22, y - 26, 44, 26); ob(R() > .5 ? '#f0e4cc' : '#e0cca8', 3); }
  X.save(); X.translate(960, 820); for (let i = 0; i < 5; i++) { X.beginPath(); X.rect(-190 + i * 30, -50 - i * 50, 380 - i * 60, 50); ob(i % 2 ? '#a88c6c' : '#988060', 4); }
  [[-60, '#a52a2a'], [60, '#2a5a8a']].forEach(([cx, c]) => { X.beginPath(); X.rect(cx - 40, -330, 80, 80); ob(c, 4); }); X.restore();
  for (let i = 0; i < 6; i++) { const x = (i * 330 + t * 30) % (W + 200) - 100, y = 1010 - (i % 2) * 40; X.beginPath(); X.ellipse(x, y, 70, 12, 0, 0, 7); ob('#5a3a1e', 3); person(x, y - 4, 70, { hat: i % 2 ? 'inca' : null }); }
  vignette(.45); };

// ---------- mapa real de Sudamérica ----------
const SA = [[-77, 8], [-72, 12], [-62, 10.5], [-52, 5], [-50, 0], [-44, -2.5], [-35, -5], [-35, -9], [-39, -15], [-41, -22], [-48, -26], [-53, -33], [-58, -38], [-62, -41], [-65, -45], [-68, -50], [-69, -55], [-74, -52], [-75, -47], [-73, -40], [-71.5, -30], [-70.5, -18], [-76, -14], [-81, -6], [-80, -2], [-79, 1], [-77, 8]];
const mp = (lon, lat) => [960 + (lon + 58) * 11.6, 200 + (12 - lat) * 11.6];
function saMap() { X.beginPath(); SA.forEach(([lo, la], i) => { const [x, y] = mp(lo, la); i ? X.lineTo(x, y) : X.moveTo(x, y); }); X.closePath(); ob('#3a6b45');
  // los Andes
  X.strokeStyle = 'rgba(160,140,110,.75)'; X.lineWidth = 16; X.lineCap = 'round'; X.beginPath(); [[-76, 6], [-78, 0], [-77, -8], [-72, -15], [-69, -22], [-70, -32], [-71, -42], [-72, -50]].forEach(([lo, la], i) => { const [x, y] = mp(lo, la); i ? X.lineTo(x, y) : X.moveTo(x, y); }); X.stroke(); }
function city(lo, la, name, k, dx = 16, align = 'left') { if (k <= 0) return; const [x, y] = mp(lo, la); X.beginPath(); X.arc(x, y, 9 * back(k), 0, 7); ob('#fff', 3); X.globalAlpha = clamp(k * 2); txt(name, x + dx, y, 30, '#fff', { align, stroke: 6 }); X.globalAlpha = 1; }
function route(pts, k, col = GOLD) { const n = pts.length - 1, kk = k * n; X.strokeStyle = col; X.lineWidth = 8; X.lineCap = 'round'; X.shadowColor = col; X.shadowBlur = 16; X.beginPath();
  pts.forEach(([lo, la], i) => { if (i > kk + 1) return; const [x, y] = mp(lo, la); if (!i) X.moveTo(x, y); else { const [px, py] = mp(...pts[i - 1]), f = clamp(kk - i + 1); X.lineTo(lerp(px, x, f), lerp(py, y, f)); } }); X.stroke(); X.shadowBlur = 0; }
S.road_map = (t, d) => { sky(['#0d2238', '#123050', '#163a5e', '#0a1c2e']); saMap(); title('Qhapaq Ñan: más de 30.000 km', prog(t, 0, .5), 175, 56);
  const k = prog(t, .3, d * .75); const main = [[-77.3, 1.2], [-78.5, -.2], [-78.5, -7.2], [-72, -13.5], [-69.5, -16], [-68, -22], [-65.2, -26.8]], coast = [[-80.4, -3.6], [-79, -8], [-77, -12], [-71.5, -16.4], [-70.3, -23], [-70.6, -33.4]];
  route(main, k); route(coast, prog(t, .8, d * .85)); X.strokeStyle = GOLD; X.lineWidth = 6; X.beginPath(); X.moveTo(...mp(-72, -13.5)); X.lineTo(...mp(-77, -12)); X.stroke();
  city(-78.5, -.2, 'Quito', prog(t, .6, 1)); city(-72, -13.5, 'Cusco', prog(t, 1, 1.4)); city(-77, -12, 'Lima', prog(t, 1.3, 1.7), -16, 'right'); city(-70.6, -33.4, 'Santiago', prog(t, 1.8, 2.2), -16, 'right'); city(-65.2, -26.8, 'Tucumán', prog(t, 2, 2.4));
  [['COLOMBIA', -71, 6], ['ECUADOR', -91, 0], ['PERÚ', -90, -9], ['BOLIVIA', -60, -19], ['CHILE', -84, -30], ['ARGENTINA', -60, -38]].forEach(([n, lo, la], i) => { const kk = ease(prog(t, 1 + i * .35, 1.4 + i * .35)); if (kk <= 0) return; const [x, y] = mp(lo, la); X.globalAlpha = kk; txt(n, x, y, 30, '#cfe6ff', { w: 900, stroke: 6 }); X.globalAlpha = 1; });
  vignette(.4); };
S.fish_cusco = (t, d) => { sky(['#0d2238', '#123050', '#163a5e', '#0a1c2e']); const [ox, oy] = mp(-74.5, -12.5), Z = 3.2, P = (lo, la) => { const [x, y] = mp(lo, la); return [(x - ox) * Z + W / 2, (y - oy) * Z + H / 2 + 30]; };
  X.save(); X.translate(W / 2, H / 2 + 30); X.scale(Z, Z); X.translate(-ox, -oy); saMap(); X.restore();
  title('Del mar a la mesa del Inca', prog(t, 0, .5), 175, 56);
  const [cx, cy] = P(-77.6, -12.2), [ux, uy] = P(-72, -13.5); pin(cx - 30, cy, 'Costa', prog(t, .2, .6), '#2b9adf'); pin(ux, uy, 'Cusco', prog(t, .5, .9));
  const k = prog(t, .8, d * .8); arrow(cx, cy, ux - 30, uy, k); fish(lerp(cx, ux - 40, ease(k)), lerp(cy, uy, ease(k)) - 50, 1, 1);
  txt('Pescado fresco en ≈ 2 días', W / 2, 820, 52 * ease(prog(t, d * .6, d * .75)), GOLD, { w: 900, stroke: 9 }); vignette(.45); };

// ---------- Boston: el tanque revienta ----------
S.tank_burst = (t, d) => { bostonBg(t, SKY.storm); const shake = t < 1.2 ? Math.sin(t * 60) * 7 * (1.2 - t) : 0; X.save(); X.translate(shake, 0);
  const k = ease(prog(t, .25, d * .9));
  // charco
  X.beginPath(); X.ellipse(1250 - k * 420, 805, 160 + k * 620, 30 + k * 24, 0, 0, 7); ob('#2e1004', 4);
  // ola de melaza: nace bajo el tanque, alta junto a él y con una cresta al frente
  const H0 = 120 + k * 110, xs = 1300, xf = xs - (320 + k * 820), base = 805;
  const top = x => { const f = (xs - x) / (xs - xf); return base - H0 * (1 - .45 * f) - H0 * .35 * Math.exp(-Math.pow((1 - f) / .09, 2)) + Math.sin(x / 45 + t * 5) * 5; };
  X.beginPath(); X.moveTo(xs, base + 8); for (let x = xs; x >= xf + 30; x -= 10) X.lineTo(x, top(x));
  X.quadraticCurveTo(xf - 50, top(xf + 30) - 10, xf - 20, top(xf + 30) + 50); X.quadraticCurveTo(xf + 10, base - 20, xf - 40, base + 8); X.closePath();
  const wg = X.createLinearGradient(0, base - H0 * 1.3, 0, base); wg.addColorStop(0, '#7a3a10'); wg.addColorStop(1, '#2e1004'); X.fillStyle = wg; X.fill(); X.lineWidth = OL; X.strokeStyle = INK; X.stroke();
  X.strokeStyle = 'rgba(255,200,130,.4)'; X.lineWidth = 6; X.beginPath(); for (let x = xs - 280; x >= xf + 50; x -= 10) { const y = top(x) + 18; x === xs - 280 ? X.moveTo(x, y) : X.lineTo(x, y); } X.stroke();
  // tanque encima (la ola sale de debajo) con grieta
  tank(1300, 760, 1.05, 0); X.strokeStyle = INK; X.lineWidth = 6; X.beginPath(); X.moveTo(1290, 330); X.lineTo(1320, 420); X.lineTo(1290, 520); X.lineTo(1330, 640); X.lineTo(1300, 760); X.stroke();
  for (let i = 0; i < 8; i++) { const kk = clamp((t - .2) * 1.4); X.save(); X.translate(1300 + Math.cos(i * .9) * 380 * kk, 420 - Math.sin(i * 1.7) * 260 * kk + kk * kk * 220); X.rotate(i + t * 4); X.beginPath(); X.rect(-12, -6, 24, 12); ob('#888', 2); X.restore(); }
  X.restore(); vignette(.5); };

// ---------- París de noche: Torre Eiffel ----------
function eiffel(x, by, s, lit) { X.save(); X.translate(x, by); X.scale(s, s); const c = '#1a1d28';
  const leg = (sd) => { X.beginPath(); X.moveTo(sd * 300, 0); X.quadraticCurveTo(sd * 170, -170, sd * 95, -360); X.lineTo(sd * 55, -360); X.quadraticCurveTo(sd * 90, -180, sd * 170, 0); X.closePath(); ob(c, 4); };
  leg(-1); leg(1); X.beginPath(); X.moveTo(-175, 0); X.quadraticCurveTo(0, -200, 175, 0); X.lineWidth = 10; X.strokeStyle = INK; X.stroke();
  X.beginPath(); X.rect(-130, -380, 260, 26); ob(c, 4);
  X.beginPath(); X.moveTo(-100, -354); X.lineTo(-50, -640); X.lineTo(50, -640); X.lineTo(100, -354); X.closePath(); ob(c, 4); X.beginPath(); X.rect(-70, -660, 140, 22); ob(c, 4);
  X.beginPath(); X.moveTo(-45, -638); X.lineTo(-10, -940); X.lineTo(10, -940); X.lineTo(45, -638); X.closePath(); ob(c, 4); X.beginPath(); X.rect(-3, -1010, 6, 70); ob(c, 2);
  X.strokeStyle = 'rgba(255,255,255,.12)'; X.lineWidth = 2; for (let i = 0; i < 14; i++) { X.beginPath(); X.moveTo(-90 + i * 2, -360 - i * 20); X.lineTo(90 - i * 2, -380 - i * 20); X.stroke(); }
  if (lit) for (let i = 0; i < 30; i++) { const y = -Math.random() * 900; X.fillStyle = `rgba(255,220,140,${.4 + Math.random() * .5})`; X.beginPath(); X.arc((Math.random() - .5) * (1 + y / 1000) * 200, y, 3, 0, 7); X.fill(); }
  X.restore(); }
S.dark_paris = (t, d) => { sky(SKY.storm); clouds(t, 441, 'rgba(30,30,40,.7)', 40, 380, 8, 30); const fl = Math.max(0, Math.sin(t * 2.3)) ** 30; if (fl > .1) { X.fillStyle = `rgba(220,230,255,${fl * .4})`; X.fillRect(0, 0, W, H); }
  eiffel(960, 900, .85, false); const R = rng(9); for (let i = 0; i < 12; i++) { const x = i * 170, h = 140 + R() * 140; X.beginPath(); X.rect(x, 900 - h, 150, h + 200); ob('#0c0e16', 4); if (i % 2) { X.fillStyle = 'rgba(255,200,120,.6)'; X.fillRect(x + 40, 940 - h, 24, 34); } }
  vignette(.6); };

// ---------- nave espacial del cine ----------
function spaceship(x, y, s, t) { X.save(); X.translate(x, y); X.scale(s, s);
  glow(-150, 0, 90, '#6fd3ff', .8); glow(-150, 30, 70, '#6fd3ff', .6);
  X.beginPath(); X.moveTo(160, 0); X.lineTo(-120, -34); X.lineTo(-150, -10); X.lineTo(-150, 10); X.lineTo(-120, 34); X.closePath(); ob('#d6dbe3', 4);
  X.beginPath(); X.moveTo(-40, -26); X.lineTo(-110, -110); X.lineTo(-140, -110); X.lineTo(-100, -26); X.closePath(); ob('#b8c0cc', 4);
  X.beginPath(); X.moveTo(-40, 26); X.lineTo(-110, 110); X.lineTo(-140, 110); X.lineTo(-100, 26); X.closePath(); ob('#b8c0cc', 4);
  X.beginPath(); X.ellipse(30, -6, 34, 14, 0, 0, 7); ob('#6fb7ff', 3); X.fillStyle = '#c0392b'; X.fillRect(-90, -6, 50, 12); X.restore(); }
function cinemaScreen(t) { X.fillStyle = '#05050a'; X.fillRect(0, 0, W, H); X.beginPath(); X.rect(260, 90, 1400, 600); ob('#000', 8); X.save(); X.beginPath(); X.rect(260, 90, 1400, 600); X.clip(); sky(['#000', '#020210', '#05051a', '#000']); stars(300, 451, t * 3);
  globe(1450, 520, 160, t); const sx = 380 + (t * 140) % 1100;
  for (let i = 0; i < 4; i++) { const k = (t * 2.2 + i / 4) % 1; X.strokeStyle = i % 2 ? '#ff3b3b' : '#3bff6b'; X.lineWidth = 7; X.lineCap = 'round'; X.shadowColor = X.strokeStyle; X.shadowBlur = 14; X.beginPath(); X.moveTo(sx + 160 + k * 600, 380 - i * 14); X.lineTo(sx + 240 + k * 600, 380 - i * 14); X.stroke(); X.shadowBlur = 0; }
  spaceship(sx, 380, .9, t); X.restore(); glow(960, 390, 900, '#8aa8ff', .12); }
