// Renderiza los Shorts verticales de cada dato: node render_cortos.js v1|v2 [solo_dato]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const D = __dirname, vid = process.argv[2], solo = process.argv[3] ? +process.argv[3] : null, FPS = 30;
const TL = JSON.parse(fs.readFileSync(path.join(D, `tl_${vid}.json`), 'utf8'));
const OUT = path.join(D, '../shorts'); fs.mkdirSync(OUT, { recursive: true });
// tramos: desde "Dato número N" hasta el final de su párrafo
const words = TL.chunks.flatMap(c => c.w);
const tramos = TL.datos.map(([ts, n]) => { const w0 = words.find(w => Math.abs(w.s - ts) < .01); const ws = words.filter(w => w.par === w0.par);
  return { n, t0: Math.max(0, ts - .3), t1: Math.min(ws[ws.length - 1].e + 1.0, ts + 59) }; }).filter(x => !solo || x.n === solo);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const f8 = 'data:font/woff;base64,' + fs.readFileSync(path.join(D, '../fuentes/montserrat-latin-800-normal.woff')).toString('base64');
  const f9 = 'data:font/woff;base64,' + fs.readFileSync(path.join(D, '../fuentes/montserrat-latin-900-normal.woff')).toString('base64');
  const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(D, '../img/logo.png')).toString('base64');
  const FD = path.join(D, '../img/fondos'); const fondosData = fs.existsSync(FD) ? Object.fromEntries(fs.readdirSync(FD).filter(f => f.endsWith('.png')).map(f => [f.replace('.png', ''), 'data:image/png;base64,' + fs.readFileSync(path.join(FD, f)).toString('base64')])) : {};
  const RD = path.join(D, '../img/real'); const realData = fs.existsSync(RD) ? Object.fromEntries(fs.readdirSync(RD).filter(f => f.endsWith('.jpg') && f.startsWith(vid + '_')).map(f => [f.replace('.jpg', ''), 'data:image/jpeg;base64,' + fs.readFileSync(path.join(RD, f)).toString('base64')])) : {};
  const js = ['kit.js', 'personajes.js', 'mascota.js', 'escenas1.js', 'escenas2.js', 'estructuras.js', 'pulido.js', 'fondos.js', 'capas.js', 'cortos.js'].map(f => fs.readFileSync(path.join(D, f), 'utf8')).join('\n');
  await p.setContent(`<html><head><style>@font-face{font-family:Mont;font-weight:800;src:url(${f8})}@font-face{font-family:Mont;font-weight:900;src:url(${f9})}body{margin:0}</style></head><body><canvas id=c width=1080 height=1920></canvas><script>${js}
    setCtx(document.getElementById('c').getContext('2d'));
    window.init = async (tl, lg) => { TL = tl; await document.fonts.load('800 40px Mont'); await document.fonts.load('900 40px Mont'); LOGO = new Image(); LOGO.src = lg; await LOGO.decode(); for (const [k, v] of Object.entries(window.__fondos || {})) { const im = new Image(); im.src = v; await im.decode(); FONDOS[k] = im; } for (const [k, v] of Object.entries(window.__real || {})) { const im = new Image(); im.src = v; await im.decode(); REAL[k] = im; } };
    window.render = (t, n, t0, t1) => { frameV(t, n, t0, t1); return document.getElementById('c').toDataURL('image/jpeg', .92); };</script></body></html>`);
  p.on('pageerror', e => { console.error('ERROR:', e.message); process.exit(1); });
  await p.evaluate(fd => { window.__fondos = fd; }, fondosData); await p.evaluate(rd => { window.__real = rd; }, realData);
  await p.evaluate(([tl, lg]) => init(tl, lg), [TL, logo]);
  const audio = fs.existsSync(path.join(D, `audio_${vid}_mix.wav`)) ? path.join(D, `audio_${vid}_mix.wav`) : path.join(D, `audio_${vid}.wav`);
  for (const { n, t0, t1 } of tramos) {
    const out = path.join(OUT, `short_dato_${String(n).padStart(2, '0')}.mp4`), d = t1 - t0;
    const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-', '-ss', String(t0), '-t', String(d), '-i', audio,
      '-af', `afade=t=in:d=0.2,afade=t=out:st=${(d - .5).toFixed(2)}:d=0.5`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = Math.round(t0 * FPS); i < Math.round(t1 * FPS); i++) { const dd = await p.evaluate(a => render(...a), [i / FPS, n, t0, t1]); if (!ff.stdin.write(Buffer.from(dd.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log(`Short dato ${n}: ${d.toFixed(1)} s`);
  }
  await b.close(); console.log('Listo');
})();
