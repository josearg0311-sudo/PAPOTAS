// Formato vertical para Shorts (1080x1920): la escena 16:9 al centro, titular arriba, subtítulos grandes abajo
const VW = 1080, VH = 1920;
const TITULARES = { 1: 'Cleopatra está más cerca de la Luna que de las pirámides', 2: 'Oxford es más antigua que el Imperio azteca', 3: 'Había mamuts cuando se hicieron las pirámides',
  4: 'Napoleón NO era bajito', 5: 'Los vikingos nunca usaron cuernos', 6: 'La guerra que duró 38 minutos', 7: 'Australia perdió una guerra contra pájaros',
  8: 'Una batalla… por un balde', 9: 'La computadora inca hecha de hilo', 10: 'El correo inca era más rápido que un caballo',
  11: 'Los incas hicieron 30.000 km de caminos', 12: 'Machu Picchu nunca estuvo perdido', 13: 'En Roma, la orina valía dinero', 14: 'El kétchup se vendía como medicina',
  15: 'El tenedor fue un escándalo', 16: 'Una ola de melaza arrasó Boston', 17: 'La epidemia de baile de 1518', 18: 'El fax es más antiguo que el teléfono',
  19: 'Nintendo existe desde 1889', 20: 'La guillotina se usó hasta 1977' };
let SH = null, SHX = null, SHB = null;
function wrapLines(ctx, s, maxW) { const ws = s.split(' '), out = []; let cur = '';
  ws.forEach(w => { const tr = (cur + ' ' + w).trim(); if (ctx.measureText(tr).width > maxW && cur) { out.push(cur); cur = w; } else cur = tr; }); out.push(cur); return out; }
function frameV(t, n, t0, t1) {
  const MAIN = X;
  if (!SH) { SH = document.createElement('canvas'); SH.width = W; SH.height = H; SHX = SH.getContext('2d'); SHB = document.createElement('canvas'); SHB.width = 270; SHB.height = 480; }
  // 1) escena horizontal (sin capas de texto) en un lienzo aparte
  X = SHX; NOW = t; const sc = TL.scenes; let k = 0; for (let i = 0; i < sc.length; i++) if (sc[i].t <= t) k = i;
  drawScene(sc[k], t); if (k > 0 && t < sc[k].t + .35) { if (!OFF) { OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; } const m2 = X; X = OFF.getContext('2d'); drawScene(sc[k - 1], t); X = m2; X.globalAlpha = 1 - ease(prog(t, sc[k].t, sc[k].t + .35)); X.drawImage(OFF, 0, 0); X.globalAlpha = 1; }
  finish(t);
  X = MAIN;
  // 2) fondo: la misma escena ampliada, desenfocada y oscurecida
  const b = SHB.getContext('2d'); b.filter = 'blur(6px) brightness(.45) saturate(1.2)'; b.drawImage(SH, 420, 0, 1080, 1080, -20, -20, 310, 520); b.filter = 'none';
  X.drawImage(SHB, 0, 0, VW, VH);
  // 3) escena al centro con marco
  const sy = 600, sh = 780; X.save(); X.beginPath(); X.roundRect(20, sy, VW - 40, sh, 28); X.clip(); X.drawImage(SH, 240, 0, 1440, 1080, 20, sy, VW - 40, sh); X.restore();
  X.beginPath(); X.roundRect(20, sy, VW - 40, sh, 28); X.lineWidth = 6; X.strokeStyle = GOLD; X.stroke();
  // 4) titular
  const lt = t - t0, a = back(prog(lt, .1, .6));
  X.save(); X.translate(VW / 2, 200); X.scale(a, a); panel(-210, -62, 420, 124, 30, '#111', GOLD, 6); txt('DATO #' + n, 0, 2, 78, GOLD, { w: 900 }); X.restore();
  X.font = '900 74px Mont'; const lines = wrapLines(X, TITULARES[n].toUpperCase(), VW - 120);
  lines.forEach((l, i) => { const kk = ease(prog(lt, .3 + i * .12, .8 + i * .12)); X.globalAlpha = kk; txt(l, VW / 2, 360 + i * 88 + 20 * (1 - kk), 74, '#fff', { w: 900, stroke: 14 }); X.globalAlpha = 1; });
  // 5) subtítulos grandes (karaoke)
  const c = TL.chunks.find(c => c.s <= t && t < c.e);
  if (c) { X.save(); X.font = '900 76px Mont'; X.textBaseline = 'middle'; X.textAlign = 'left'; const sp = X.measureText(' ').width * 1.2;
    const rows = []; let row = [], wsum = 0; c.w.forEach(w => { const ww = X.measureText(w.w).width; if (wsum + ww > VW - 120 && row.length) { rows.push(row); row = []; wsum = 0; } row.push([w, ww]); wsum += ww + sp; }); rows.push(row);
    rows.forEach((r, ri) => { const tw = r.reduce((s, [, ww]) => s + ww + sp, -sp); let x = VW / 2 - tw / 2; const y = 1500 + ri * 96;
      r.forEach(([w, ww]) => { const on = w.s - .04 <= t && t < w.e + .06; X.lineWidth = 16; X.lineJoin = 'round'; X.strokeStyle = '#000'; X.strokeText(w.w, x, y); X.fillStyle = on ? GOLD : '#fff'; X.fillText(w.w, x, y); x += ww + sp; }); });
    X.restore(); }
  // 6) pie: logo + nombre del canal
  drawLogo(150, 1800, 120); txt('¿Acaso lo sabías?', 470, 1800, 52, '#fff', { w: 900, stroke: 10 });
  // Chispa junto al pie, con su comentario
  if (!realOn()) { const lt2 = t - t0 - .3; chispa(VW - 120, 1790, .45, { expr: lt2 > 4.6 && lt2 < 7.2 ? 'talk' : (lt2 < 4.6 ? 'surprised' : 'happy'), look: -1 });
    bubble(VW - 170, 1700, CHISPA_FRASES[n] || '¡Wow!', prog(lt2, 4.6, 5) * (1 - prog(lt2, 7, 7.3)), -1, 40); }
  // 7) barra de progreso del short
  X.fillStyle = 'rgba(255,255,255,.25)'; X.fillRect(0, 0, VW, 10); X.fillStyle = GOLD; X.fillRect(0, 0, VW * prog(t, t0, t1), 10);
  const fa = Math.min(prog(t, t0, t0 + .25), 1 - prog(t, t1 - .4, t1)); if (fa < 1) { X.fillStyle = `rgba(0,0,0,${1 - fa})`; X.fillRect(0, 0, VW, VH); }
}
