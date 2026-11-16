// Miniaturas de YouTube (1280x720): node miniaturas.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const D = __dirname;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const f8 = 'data:font/woff;base64,' + fs.readFileSync(path.join(D, '../fuentes/montserrat-latin-800-normal.woff')).toString('base64');
  const f9 = 'data:font/woff;base64,' + fs.readFileSync(path.join(D, '../fuentes/montserrat-latin-900-normal.woff')).toString('base64');
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(D, '../img/logo.png')).toString('base64');
  const js = ['kit.js', 'personajes.js', 'mascota.js', 'escenas1.js', 'escenas2.js', 'capas.js'].map(f => fs.readFileSync(path.join(D, f), 'utf8')).join('\n');
  await p.setContent(`<html><head><style>@font-face{font-family:Mont;font-weight:800;src:url(${f8})}@font-face{font-family:Mont;font-weight:900;src:url(${f9})}body{margin:0}</style></head><body><canvas id=c width=1920 height=1080></canvas><script>${js}
  setCtx(document.getElementById('c').getContext('2d'));
  function big(lines, x, y, size, rot) { X.save(); X.translate(x, y); X.rotate(rot || 0); lines.forEach(([s, col], i) => { const yy = i * size * 1.02;
      X.font = '900 ' + size + 'px Mont'; X.textAlign = 'left'; X.textBaseline = 'middle'; X.lineJoin = 'round';
      X.lineWidth = size * .26; X.strokeStyle = '#111'; X.strokeText(s, 0, yy); X.fillStyle = col; X.fillText(s, 0, yy); }); X.restore(); }
  function badge(s, x, y) { X.save(); X.translate(x, y); X.rotate(-.06); panel(0, 0, 520, 110, 26, '#e53935', '#111', 10); txt(s, 260, 57, 66, '#fff', { w: 900 }); X.restore(); }
  function corner() { drawLogo(1770, 150, 230); }
  function stage(col1, col2, fx, fy) { const g = X.createRadialGradient(fx, fy, 50, fx, fy, 1300); g.addColorStop(0, col1); g.addColorStop(1, col2); X.fillStyle = g; X.fillRect(0, 0, W, H);
    stars(260, 9, 2); rays(fx, fy, '#ffb347', 3, 18, 1400, .09); glow(fx, fy, 620, '#ffb347', .55); glow(fx, fy, 300, '#fff1c0', .35); }
  function pill(s, x, y, size, fill) { X.save(); X.font = '900 ' + size + 'px Mont'; const w = X.measureText(s).width + size * 1.1; X.restore();
    X.save(); X.translate(x, y); X.rotate(-.03); panel(0, 0, w, size * 1.6, size * .8, fill, '#111', 8); txt(s, w / 2, size * .82, size, '#fff', { w: 900 }); X.restore(); return w; }
  function block(n) { // bloque de texto común de la serie
    X.save(); X.translate(110, 110); X.rotate(-.03);
    X.font = '900 330px Mont'; X.textBaseline = 'alphabetic'; X.lineJoin = 'round'; X.lineWidth = 34; X.strokeStyle = '#111'; X.strokeText('20', 0, 300);
    const g = X.createLinearGradient(0, 40, 0, 300); g.addColorStop(0, '#fff3a0'); g.addColorStop(.5, '#ffc42e'); g.addColorStop(1, '#e8901a'); X.fillStyle = g; X.fillText('20', 0, 300);
    X.restore();
    chispa(570, 220, .62, { expr: 'surprised', look: 1, tilt: .25 });
    [['DATOS', 520], ['HISTÓRICOS', 610]].forEach(([s, y]) => { X.save(); X.translate(118, y); X.rotate(-.03); X.font = '900 96px Mont'; X.lineJoin = 'round'; X.lineWidth = 20; X.strokeStyle = '#111'; X.strokeText(s, 0, 0); X.fillStyle = '#fff'; X.fillText(s, 0, 0); X.restore(); });
    pill('¡PARECEN MENTIRA!', 120, 660, 58, '#e53935');
    pill('PARTE ' + n, 125, 800, 46, '#1e5fd8');
  }
  window.thumb = async (n) => { TL = { vid: 'v' + n, title: '', datos: [], outro: 1e9, chunks: [], scenes: [] }; await document.fonts.load('900 40px Mont'); LOGO = new Image(); LOGO.src = '${logo}'; await LOGO.decode(); NOW = 1.3;
    if (n === 1) { stage('#7a3a12', '#0a0608', 1380, 520); hills(900, 60, '#2a1608', .5, 1); ground(900, '#3a2210', '#0a0604');
      for (let i = 0; i < 5; i++) emu(1030 + i * 190, 905 - (i % 2) * 15, .55, i * 1.3, -1);
      emu(1400, 1000, 2.7, 1.2, -1);
      // casco militar del emú vencedor
      const s = 2.7, hx = 1400 - 60 * s, hy = 1000 - (210 + Math.abs(Math.cos(1.2)) * 8) * s; X.save(); X.translate(hx, hy - 16 * s); X.rotate(-.15);
      X.beginPath(); X.arc(0, 0, 27 * s, Math.PI, 0); X.closePath(); X.fillStyle = '#5b6b2a'; X.fill(); X.lineWidth = 9; X.strokeStyle = '#111'; X.stroke();
      X.beginPath(); X.ellipse(0, 0, 40 * s, 7 * s, 0, 0, 7); X.fillStyle = '#4a5822'; X.fill(); X.stroke(); X.restore();
      // medalla
      X.save(); X.translate(1440, 760); X.fillStyle = '#c0302b'; X.fillRect(-14, -60, 28, 50); coin(0, 10, 34, 0); X.restore();
    }
    else { stage('#5a1020', '#05040a', 1350, 470);
      X.save(); X.globalCompositeOperation = 'lighter'; const g = X.createLinearGradient(1900, 120, 1000, 600); g.addColorStop(0, 'rgba(160,200,255,.4)'); g.addColorStop(1, 'rgba(160,200,255,0)'); X.fillStyle = g; X.beginPath(); X.moveTo(1920, 60); X.lineTo(1920, 200); X.lineTo(900, 900); X.lineTo(900, 300); X.fill(); X.restore();
      ground(960, '#1a1418', '#050405'); guillotineDraw(1350, 980, 1.08, 1);
      X.save(); X.translate(1600, 300); X.rotate(.12); panel(-150, -60, 300, 120, 20, '#111', '#ff4a3a', 8); txt('1977', 0, 4, 84, '#ff4a3a', { w: 900 }); X.restore(); }
    // limpiar la burbuja si no hay
    if (n === 1) { X.save(); X.fillStyle = '#fff'; X.beginPath(); X.roundRect(1330, 230, 380, 110, 30); X.fill(); X.lineWidth = 8; X.strokeStyle = '#111'; X.stroke(); X.beginPath(); X.moveTo(1400, 335); X.lineTo(1380, 390); X.lineTo(1450, 338); X.fillStyle = '#fff'; X.fill(); X.stroke(); txt('¡GANAMOS!', 1520, 286, 56, '#111', { w: 900 }); X.restore(); }
    block(n); drawLogo(1790, 130, 190); finish(5); vignette(.35);
    const c2 = document.createElement('canvas'); c2.width = 1280; c2.height = 720; c2.getContext('2d').drawImage(document.getElementById('c'), 0, 0, 1280, 720); return c2.toDataURL('image/jpeg', .93); };
  </script></body></html>`);
  p.on('pageerror', e => { console.error(e.message); process.exit(1); });
  for (const n of [1, 2]) { const d = await p.evaluate(n => thumb(n), n); fs.writeFileSync(path.join(D, `../miniatura_parte${n}.jpg`), Buffer.from(d.split(',')[1], 'base64')); }
  await b.close(); console.log('miniaturas listas');
})();
