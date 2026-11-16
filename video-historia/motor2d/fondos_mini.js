// Fondos 2D estilo novela gráfica para las miniaturas: node fondos_mini.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const D = __dirname;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const js = ['kit.js', 'personajes.js', 'mascota.js', 'escenas1.js', 'escenas2.js', 'capas.js'].map(f => fs.readFileSync(path.join(D, f), 'utf8')).join('\n');
  await p.setContent(`<canvas id=c width=1920 height=1080></canvas><script>${js}
  setCtx(document.getElementById('c').getContext('2d')); NOW = 1.3;
  // dibuja fn como silueta de color 'col' con contraluz 'rim' desde la dirección dx
  let SL = null;
  function silhouette(fn, col, rim, dx = 1) { if (!SL) { SL = document.createElement('canvas'); SL.width = W; SL.height = H; } const s = SL.getContext('2d'); s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.clearRect(0, 0, W, H);
    const main = X; X = s; fn(); X = main;
    s.globalCompositeOperation = 'source-in'; s.fillStyle = col; s.fillRect(0, 0, W, H);
    // contraluz: copia desplazada hacia la luz, recortada por la silueta
    const off = document.createElement('canvas'); off.width = W; off.height = H; const o = off.getContext('2d'); o.drawImage(SL, 0, 0); o.globalCompositeOperation = 'destination-out'; o.drawImage(SL, -6 * dx, 4);
    o.globalCompositeOperation = 'source-in'; o.fillStyle = rim; o.fillRect(0, 0, W, H);
    X.drawImage(SL, 0, 0); X.save(); X.shadowColor = rim; X.shadowBlur = 18; X.drawImage(off, 0, 0); X.restore(); }
  function dust(n, seed, col, y0, y1) { const R = rng(seed); for (let i = 0; i < n; i++) { X.filter = 'blur(28px)'; X.fillStyle = rgba(col, .04 + R() * .08); X.beginPath(); X.ellipse(R() * W, y0 + R() * (y1 - y0), 80 + R() * 260, 20 + R() * 60, 0, 0, 7); X.fill(); } X.filter = 'none'; }
  function halftone(col, a) { X.save(); X.globalAlpha = a; X.fillStyle = col; for (let y = 0; y < H; y += 14) for (let x = (y / 14) % 2 * 7; x < W; x += 14) { const r = 3.2 * (y / H); X.beginPath(); X.arc(x, y, r, 0, 7); X.fill(); } X.restore(); }
  window.fondo = (n) => {
    if (n === 1) { sky(['#1a0b08', '#5a1e0e', '#c4501a', '#f6a03c']); sun(1500, 560, 120, '#fff0c0', '#ff8a2a'); rays(1500, 560, '#ffb347', 2, 20, 1800, .1);
      mountains(11, 640, 120, '#3a1408', 7, .4); dust(30, 3, '#ffb070', 520, 900);
      ground(700, '#2a0e06', '#0a0402');
      silhouette(() => { truck(1560, 760, 1.5); machinegun(1607, 570, 1.35); person(1528, 602, 182, { hat: 'slouch', arm: .4 }); person(1663, 614, 174, { hat: 'slouch', arm: 1.1 }); }, '#120604', 'rgba(255,170,80,1)', 1);
      for (let i = 0; i < 9; i++) { const R = rng(i + 40); silhouette(() => emu(1000 + R() * 900, 760 + R() * 60, .5 + R() * .4, i * 1.7, -1), '#1a0905', 'rgba(255,170,80,.9)', 1); }
      silhouette(() => emu(1130, 1075, 2.0, 2.2, 1), '#0e0503', 'rgba(255,190,90,1)', 1);
      dust(25, 5, '#ffb070', 800, 1080); halftone('#000', .25); vignette(.6); }
    else { sky(['#020306', '#0a0d16', '#141a28', '#06070c']); X.save(); X.globalCompositeOperation = 'lighter'; const g = X.createLinearGradient(1400, 0, 1250, 900); g.addColorStop(0, 'rgba(190,215,255,.55)'); g.addColorStop(1, 'rgba(190,215,255,0)'); X.fillStyle = g; X.beginPath(); X.moveTo(1330, -20); X.lineTo(1470, -20); X.lineTo(1720, 1000); X.lineTo(1060, 1000); X.fill(); X.restore();
      X.fillStyle = '#0b0d14'; X.fillRect(0, 120, 520, 900); X.fillRect(1700, 80, 300, 950); for (let i = 0; i < 2; i++) { glow(1790, 420 + i * 260, 120, '#ffb347', .35); X.fillStyle = 'rgba(255,190,90,.75)'; X.beginPath(); X.roundRect(1765, 380 + i * 260, 50, 90, [25, 25, 0, 0]); X.fill(); }
      ground(900, '#121520', '#030305'); dust(30, 9, '#a0b4d0', 650, 1000);
      silhouette(() => guillotineDraw(1380, 960, .85, 0), '#06070b', 'rgba(200,220,255,1)', -1);
      X.save(); X.globalCompositeOperation = 'lighter'; X.fillStyle = 'rgba(220,235,255,.85)'; X.beginPath(); X.moveTo(1380 - 130 * .85, 960 - 700 * .85); X.lineTo(1380 + 130 * .85, 960 - 700 * .85); X.lineTo(1380 + 130 * .85, 960 - 620 * .85); X.lineTo(1380 - 130 * .85, 960 - 540 * .85); X.fill(); X.restore();
      halftone('#000', .25); vignette(.65); }
    const c2 = document.createElement('canvas'); c2.width = 1280; c2.height = 720; c2.getContext('2d').drawImage(document.getElementById('c'), 0, 0, 1280, 720); return c2.toDataURL('image/png'); };
  </script>`);
  p.on('pageerror', e => { console.error(e.message); process.exit(1); });
  for (const n of [1, 2]) { const d = await p.evaluate(n => fondo(n), n); fs.writeFileSync(path.join(D, `../img/fondo_mini${n}.png`), Buffer.from(d.split(',')[1], 'base64')); }
  await b.close(); console.log('fondos listos');
})();
