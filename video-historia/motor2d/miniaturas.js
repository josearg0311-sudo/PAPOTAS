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
  window.thumb = async (n) => { TL = { vid: 'v' + n, title: '', datos: [], outro: 1e9, chunks: [], scenes: [] }; await document.fonts.load('900 40px Mont'); LOGO = new Image(); LOGO.src = '${logo}'; await LOGO.decode(); NOW = 1.3;
    if (n === 1) { S.emu_war(1.8, 6); X.fillStyle = 'rgba(0,0,0,.25)'; X.fillRect(0, 0, W, H);
      emu(1330, 1010, 2.3, 1, -1); person(300, 1120, 760, { hat: 'slouch', expr: 'surprised', arm: 1.1 });
      big([['¡PERDIERON', '#ffffff'], ['CONTRA', '#ffffff'], ['PÁJAROS!', '#ffc42e']], 560, 200, 140, -.04); badge('PARTE 1', 600, 720); chispa(1720, 820, 1.0, { expr: 'surprised', look: -1 }); }
    else { sky(['#05060a', '#14101c', '#2a1420', '#0a0b10']); rays(1250, 0, '#ffb0a0', 2, 8, 1300, .1); ground(960, '#2a2a30', '#0a0a0e'); guillotineDraw(1250, 980, 1.1, 1); vignette(.5);
      big([['¡GUILLOTINA', '#ffffff'], ['HASTA', '#ffffff'], ['1977!', '#ff4a3a']], 70, 220, 150, -.04); badge('PARTE 2', 120, 770); chispa(1650, 760, 1.2, { expr: 'surprised', look: -1 }); }
    corner(); finish(5);
    const c2 = document.createElement('canvas'); c2.width = 1280; c2.height = 720; c2.getContext('2d').drawImage(document.getElementById('c'), 0, 0, 1280, 720); return c2.toDataURL('image/jpeg', .92); };
  </script></body></html>`);
  p.on('pageerror', e => { console.error(e.message); process.exit(1); });
  for (const n of [1, 2]) { const d = await p.evaluate(n => thumb(n), n); fs.writeFileSync(path.join(D, `../miniatura_parte${n}.jpg`), Buffer.from(d.split(',')[1], 'base64')); }
  await b.close(); console.log('miniaturas listas');
})();
