// Capas superpuestas y escenas de logo + motor de fotogramas
let TL = null, LOGO = null;

function logoBg(t) { sky(['#0b0716', '#1a0f24', '#2a1630', '#0e0814']); rays(W / 2, H / 2 - 60, '#ffbe3c', t, 18, 1600, .16); stars(150, 501, t); particles(t, 60, 502, '#ffd98a'); vignette(.55); }
function drawLogo(cx, cy, size) { if (!LOGO) return; glow(cx, cy, size * .95, '#ffbe3c', .45); X.drawImage(LOGO, cx - size / 2, cy - size / 2, size, size); }
S.logo_intro = (t, d) => { logoBg(t); const s = back(prog(t, 0, .6)) * (1 + .02 * Math.sin(t * 3)); drawLogo(W / 2, H / 2 - 70, 560 * s);
  X.globalAlpha = ease(prog(t, .5, 1)); txt(TL.title.split(' · ')[0], W / 2, H / 2 + 270, 44, GOLD, { stroke: 7 }); X.globalAlpha = 1; };
S.title_card = (t, d) => { logoBg(t); const s = back(prog(t, 0, .6)); drawLogo(W / 2, H / 2 - 90, 520 * s);
  const k = back(prog(t, .7, 1.2)); if (k > 0) { panel(W / 2 - 230 * k, H / 2 + 220, 460 * k, 120, 30, '#e53935', null); txt('PARTE 2', W / 2, H / 2 + 282, 72 * k, '#fff', { w: 900 }); } };
S.logo_comments = (t, d) => { logoBg(t); drawLogo(W / 2, H / 2 - 150, 420 * back(prog(t, 0, .5)));
  const k = ease(prog(t, .4, .9)); txt('¿Cuál de estos datos no conocías?', W / 2, H / 2 + 150, 64 * Math.max(k, .05), '#fff', { w: 900, stroke: 9 });
  txt('¡Te leo en los comentarios! 💬'.replace(' 💬', ''), W / 2, H / 2 + 240, 44 * Math.max(k, .05), GOLD, { stroke: 7 }); };
S.logo_subscribe = (t, d) => { logoBg(t); drawLogo(W / 2, H / 2 - 170, 400 * back(prog(t, 0, .5)));
  const bs = back(prog(t, .4, 1)) * (1 + .04 * Math.sin(t * 6)), subs = t > 3.2;
  if (bs > .05) { panel(W / 2 - 280 * bs, H / 2 + 90 - 60 * bs, 560 * bs, 120 * bs, 28 * bs, subs ? '#5a5a5a' : '#e53935', null); txt(subs ? 'SUSCRITO ✓' : 'SUSCRÍBETE', W / 2, H / 2 + 92, 56 * bs, '#fff', { w: 900 });
    // campana
    X.save(); X.translate(W / 2 + 360 * bs, H / 2 + 90); X.rotate(Math.sin(t * 12) * .25 * (t > 4 && t < 6 ? 1 : 0)); X.fillStyle = GOLD; X.beginPath(); X.moveTo(-40 * bs, 30 * bs); X.quadraticCurveTo(-40 * bs, -50 * bs, 0, -50 * bs); X.quadraticCurveTo(40 * bs, -50 * bs, 40 * bs, 30 * bs); X.fill(); X.beginPath(); X.arc(0, 40 * bs, 12 * bs, 0, 7); X.fill(); X.restore(); }
  if (TL.vid === 'v1' && t > 5) { const k = back(prog(t, 5, 5.6)); panel(W / 2 - 400 * k, H - 200, 800 * k, 100, 24); txt('▶  PARTE 2: datos 11 al 20', W / 2, H - 150, 46 * k, '#fff', { w: 900 }); } };
S.book_magic = (t, d) => { sky(SKY.indoor); X.fillStyle = '#3a2210'; X.fillRect(0, 760, W, 320); book(960, 800, 1.2, t);
  const R = rng(511); for (let i = 0; i < 8; i++) { const k = (t * .25 + i / 8) % 1, x = 960 + (R() - .5) * 800 * k, y = 600 - k * 520; X.globalAlpha = 1 - k; X.save(); X.translate(x, y); X.rotate((R() - .5) * k);
    ['🏛', '⚔', '👑', '🗿'].length; X.fillStyle = '#f3e3c0'; X.fillRect(-60, -40, 120, 80); X.strokeStyle = '#8a6a3a'; X.lineWidth = 3; X.strokeRect(-60, -40, 120, 80); X.fillStyle = '#8a6a3a'; X.beginPath(); X.moveTo(-40, 25); X.lineTo(0, -25); X.lineTo(40, 25); X.fill(); X.restore(); X.globalAlpha = 1; }
  particles(t, 80, 512, '#ffd98a', 'embers'); vignette(.6); };
S.classroom = (t, d) => { sky(['#3a2a1a', '#4a3622', '#5a4128', '#2a1c10']); X.fillStyle = '#1e3a2a'; X.fillRect(360, 160, 1200, 520); X.strokeStyle = '#6b4a2a'; X.lineWidth = 24; X.strokeRect(360, 160, 1200, 520);
  const k = prog(t, .2, 1.6); X.save(); X.globalAlpha = .92; txt('20', 760, 420, 300 * ease(k), '#f2f2e8', { w: 900 }); txt('DATOS', 1220, 360, 110 * ease(prog(t, .8, 1.6)), '#f2f2e8', { w: 900 }); txt('que no te enseñaron', 1220, 480, 52 * ease(prog(t, 1.2, 2)), '#f2e08a', { w: 800 }); X.restore();
  globe(1700, 820, 110, t); X.fillStyle = '#5a3a1e'; for (let i = 0; i < 3; i++) { X.fillRect(200 + i * 520, 860, 380, 30); X.fillRect(230 + i * 520, 890, 20, 190); X.fillRect(530 + i * 520, 890, 20, 190); }
  rays(1700, 0, '#ffe6b0', t, 6, 1400, .06); particles(t, 60, 513, '#fff1d0'); vignette(.55); };
S.hourglass_scene = (t, d) => { sky(['#120a05', '#24140a', '#3a2010', '#120a05']); X.fillStyle = 'rgba(210,180,120,.12)'; for (let i = 0; i < 10; i++) { X.beginPath(); X.ellipse(300 + i * 150, 900 + (i % 3) * 30, 200, 40, 0, 0, 7); X.fill(); }
  hourglass(960, 520, 1.25, t + 3); particles(t, 70, 521, '#ffd98a', 'embers'); vignette(.6); };

// ---------- capas ----------
function datoBadge(t) { const act = TL.datos.filter(([ts]) => ts <= t && t < ts + 4.2); if (!act.length) return; const [ts, n] = act[act.length - 1], lt = t - ts;
  const a = back(prog(lt, 0, .45)), out = ease(prog(lt, 3.7, 4.2)); const x0 = 70 - 520 * (1 - a) - 520 * out;
  panel(x0, 70, 440, 150, 24, 'rgba(12,14,30,.9)', GOLD, 5); txt('DATO', x0 + 120, 146, 54, '#eee', { w: 900 }); txt('#' + n, x0 + 320, 146, 100, GOLD, { w: 900, stroke: 6, sc: '#3a2800' }); }
function progressBar(t) { if (!TL.datos.length || t < TL.datos[0][0] || t >= TL.outro - .3) return; const n = Math.max(...TL.datos.filter(([ts]) => ts <= t).map(x => x[1]));
  const x0 = 620, y0 = 44, seg = 34; panel(x0 - 140, y0 - 24, 20 * seg + 170, 48, 18, 'rgba(0,0,0,.45)', null); txt(n + '/20', x0 - 70, y0, 30, GOLD, { w: 900 });
  for (let i = 0; i < 20; i++) { X.fillStyle = i < n ? GOLD : 'rgba(255,255,255,.28)'; X.beginPath(); X.roundRect(x0 + i * seg, y0 - 5, seg - 7, 10, 4); X.fill(); } }
function likeOverlay(t) { if (TL.like == null || t < TL.like - .3 || t > TL.like + 4) return; const lt = t - TL.like + .3, s = back(prog(lt, 0, .5)) * (1 - ease(prog(lt, 3.8, 4.3))); if (s < .05) return;
  const clicked = lt > 1.6; X.save(); X.translate(W / 2, H / 2 - 60); X.scale(s, s); panel(-300, -80, 600, 160, 40, clicked ? '#1e88e5' : '#e53935', null);
  X.fillStyle = '#fff'; X.beginPath(); X.roundRect(-230, -20, 30, 70, 6); X.fill(); X.beginPath(); X.moveTo(-195, -20); X.lineTo(-170, -70); X.quadraticCurveTo(-150, -75, -152, -50); X.lineTo(-158, -22); X.lineTo(-110, -22); X.quadraticCurveTo(-95, -15, -100, 0); X.lineTo(-112, 45); X.quadraticCurveTo(-118, 52, -130, 52); X.lineTo(-195, 52); X.fill();
  txt('¡DALE LIKE!', 60, 2, 66, '#fff', { w: 900 }); X.restore(); }
function subtitles(t) { const c = TL.chunks.find(c => c.s <= t && t < c.e); if (!c) return; X.save(); X.font = '800 66px Mont'; X.textBaseline = 'middle';
  const sp = X.measureText(' ').width * 1.35, ws = c.w.map(w => X.measureText(w.w).width), tw = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
  let x = W / 2 - tw / 2; const y = H - 120, pop = back(prog(t, c.s, c.s + .18));
  // banda oscura suave detrás
  const g = X.createLinearGradient(0, H - 260, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); X.fillStyle = g; X.fillRect(0, H - 260, W, 260);
  c.w.forEach((w, i) => { const on = w.s - .04 <= t && t < w.e + .06; const sc = on ? 1.04 : 1; X.save(); X.translate(x + ws[i] / 2, y + 8 * (1 - pop)); X.scale(sc, sc);
    X.lineWidth = 12; X.lineJoin = 'round'; X.strokeStyle = '#000'; X.textAlign = 'center'; X.strokeText(w.w, 0, 0); X.fillStyle = on ? GOLD : (w.s < t ? '#ffffff' : 'rgba(255,255,255,.92)'); X.fillText(w.w, 0, 0); X.restore(); x += ws[i] + sp; });
  X.restore(); }

// ---------- fotograma ----------
let OFF = null, OX = null;
function drawScene(sc, t) { const lt = t - sc.t, d = sc.end - sc.t, f = S[sc.key];
  X.save(); if (!sc.key.startsWith('logo') && sc.key !== 'title_card') { const z = 1 + .06 * (lt / Math.max(d, 1)); X.translate(W / 2, H / 2); X.scale(z, z); X.translate(-W / 2, -H / 2); }
  if (f) f(lt, d); else { sky(SKY.night); txt('escena pendiente: ' + sc.key, W / 2, H / 2, 50, '#f55'); } X.restore(); }
function frame(t) { const sc = TL.scenes; let k = 0; for (let i = 0; i < sc.length; i++) if (sc[i].t <= t) k = i;
  const cur = sc[k], fade = .35; drawScene(cur, t);
  if (k > 0 && t < cur.t + fade) { if (!OFF) { OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; } const main = X; X = OFF.getContext('2d'); drawScene(sc[k - 1], t); X = main;
    X.globalAlpha = 1 - ease(prog(t, cur.t, cur.t + fade)); X.drawImage(OFF, 0, 0); X.globalAlpha = 1; }
  grain(t);
  progressBar(t); datoBadge(t); likeOverlay(t); subtitles(t);
  const a = Math.min(prog(t, 0, .4), 1 - prog(t, TL.dur - .8, TL.dur)); if (a < 1) { X.fillStyle = `rgba(0,0,0,${1 - a})`; X.fillRect(0, 0, W, H); } }

let GR = null;
function grain(t) { if (!GR) { GR = document.createElement('canvas'); GR.width = 512; GR.height = 512; const g = GR.getContext('2d'), im = g.createImageData(512, 512); const R = rng(999);
    for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); }
  X.save(); X.globalAlpha = .05; X.globalCompositeOperation = 'overlay'; const ox = (t * 997) % 512, oy = (t * 613) % 512; X.translate(-ox, -oy);
  X.fillStyle = X.createPattern(GR, 'repeat'); X.fillRect(0, 0, W + 512, H + 512); X.restore(); }
