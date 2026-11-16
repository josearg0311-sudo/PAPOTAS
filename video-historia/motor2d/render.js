// Renderiza un vídeo 2D: node render.js v1 salida.mp4 [desde hasta] [--frames t1,t2,...]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const D = __dirname, vid = process.argv[2], out = process.argv[3];
const TL = JSON.parse(fs.readFileSync(path.join(D, `tl_${vid}.json`), 'utf8'));
const t0 = parseFloat(process.argv[4] || 0), t1 = parseFloat(process.argv[5] || TL.dur), FPS = 30;
const stills = (process.argv.find(a => a.startsWith('--frames=')) || '').slice(9);

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const font = 'data:font/woff;base64,' + fs.readFileSync(path.join(D, '../fuentes/montserrat-latin-800-normal.woff')).toString('base64');
  const font9 = 'data:font/woff;base64,' + fs.readFileSync(path.join(D, '../fuentes/montserrat-latin-900-normal.woff')).toString('base64');
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(D, '../img/logo.png')).toString('base64');
  const js = ['kit.js', 'personajes.js', 'mascota.js', 'escenas1.js', 'escenas2.js', 'estructuras.js', 'capas.js'].filter(f => fs.existsSync(path.join(D, f))).map(f => fs.readFileSync(path.join(D, f), 'utf8')).join('\n');
  await p.setContent(`<html><head><style>@font-face{font-family:Mont;font-weight:800;src:url(${font})}@font-face{font-family:Mont;font-weight:900;src:url(${font9})}body{margin:0}</style></head>
    <body><canvas id=c width=1920 height=1080></canvas><script>${js}
    setCtx(document.getElementById('c').getContext('2d'));
    window.init = async (tl, logo) => { TL = tl; await document.fonts.load('800 40px Mont'); await document.fonts.load('900 40px Mont');
      LOGO = new Image(); LOGO.src = logo; await LOGO.decode(); };
    window.render = (t, q) => { frame(t); return document.getElementById('c').toDataURL('image/jpeg', q); };</script></body></html>`);
  p.on('pageerror', e => { console.error('ERROR en página:', e.message); process.exit(1); });
  await p.evaluate(([tl, lg]) => init(tl, lg), [TL, logo]);
  if (stills) {
    for (const s of stills.split(',')) { const d = await p.evaluate(t => render(t, .9), parseFloat(s)); fs.writeFileSync(`${out}_${s}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
    await b.close(); return;
  }
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-',
    '-ss', String(t0), '-t', String(t1 - t0), '-i', fs.existsSync(path.join(D, `audio_${vid}_mix.wav`)) ? path.join(D, `audio_${vid}_mix.wav`) : path.join(D, `audio_${vid}.wav`),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n0 = Math.round(t0 * FPS), n1 = Math.round(t1 * FPS);
  for (let i = n0; i < n1; i++) {
    const d = await p.evaluate(t => render(t, .93), i / FPS);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - n0) % 900 === 0) console.log(`  ${(i / FPS).toFixed(1)}s / ${t1.toFixed(1)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('Listo:', out);
})();
