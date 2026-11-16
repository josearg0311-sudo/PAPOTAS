// "Chispa": la mascota del canal (la bombilla con cerebro del logo, convertida en personaje)
const CHISPA_FRASES = { 1: '¡Más cerca de la Luna!', 2: '¡Oxford es más viejo!', 3: '¡Mamuts y pirámides!', 4: '¡No era bajito!', 5: '¡Sin cuernos!',
  6: '¡Solo 38 minutos!', 7: '¡Ganaron los emús!', 8: '¿¡Por un balde!?', 9: '¡Nudos que cuentan!', 10: '¡Correo exprés inca!',
  11: '¡Más de 30.000 km!', 12: '¡Nunca se perdió!', 13: '¡Puaj!', 14: '¿Kétchup de farmacia?', 15: '¡Qué escándalo!',
  16: '¡Una ola de melaza!', 17: '¡A bailar sin parar!', 18: '¡Antes que el teléfono!', 19: '¡Desde 1889!', 20: '¡En 1977!' };

// o: expr ('happy','surprised','wink','talk'), wave (0..1), point (-1 izq / 1 der), look (-1..1)
function chispa(x, y, s, o = {}) {
  const t = NOW, bob = Math.sin(t * 3) * 8, tilt = Math.sin(t * 1.7) * .06 + (o.tilt || 0);
  X.save(); X.translate(x, y + bob); X.rotate(tilt); X.scale(s, s);
  glow(0, -20, 190, '#ffd23f', .45 + .1 * Math.sin(t * 5));
  // brazos (detrás)
  const arm = (side, up) => { const sx = side * 62, ex = side * (95 + up * 10), ey = -10 - up * 80; X.lineCap = 'round';
    X.strokeStyle = '#111'; X.lineWidth = 12; X.beginPath(); X.moveTo(sx, 10); X.quadraticCurveTo(side * 90, 10, ex, ey); X.stroke();
    X.beginPath(); X.arc(ex, ey, 17, 0, 7); X.fillStyle = '#fff'; X.fill(); X.lineWidth = 6; X.stroke(); };
  const wave = o.wave ? Math.sin(t * 12) * .35 + .65 : 0;
  arm(-1, o.point === -1 ? .4 : .05); arm(1, o.point === 1 ? .4 : wave);
  // casquillo
  [0, 1, 2].forEach(i => { X.beginPath(); X.roundRect(-38 + i * 3, 62 + i * 20, 76 - i * 6, 18, 8); X.fillStyle = i % 2 ? '#8a8f99' : '#c3c8d0'; X.fill(); X.lineWidth = 6; X.strokeStyle = '#111'; X.stroke(); });
  X.beginPath(); X.arc(0, 128, 14, 0, Math.PI); X.fillStyle = '#5a5f69'; X.fill(); X.stroke();
  // cristal
  X.beginPath(); X.moveTo(-40, 64); X.bezierCurveTo(-46, 40, -100, 10, -100, -60); X.bezierCurveTo(-100, -130, -52, -170, 0, -170); X.bezierCurveTo(52, -170, 100, -130, 100, -60); X.bezierCurveTo(100, 10, 46, 40, 40, 64); X.closePath();
  const g = X.createRadialGradient(-20, -90, 10, 0, -60, 130); g.addColorStop(0, '#fffbe0'); g.addColorStop(.6, '#ffe36a'); g.addColorStop(1, '#ffb52e'); X.fillStyle = g; X.fill(); X.lineWidth = 7; X.strokeStyle = '#111'; X.stroke();
  // cerebro dentro
  X.save(); X.globalAlpha = .55; X.strokeStyle = '#e8762a'; X.lineWidth = 5; X.beginPath();
  for (let i = 0; i < 5; i++) { const yy = -120 + i * 16; X.moveTo(-50, yy); X.bezierCurveTo(-25, yy - 12, 25, yy + 12, 50, yy); } X.stroke(); X.restore();
  X.fillStyle = 'rgba(255,255,255,.7)'; X.beginPath(); X.ellipse(-55, -100, 10, 26, .5, 0, 7); X.fill();
  // cara
  const blink = (t % 3.3) < .12, look = (o.look || 0) * 6, ex = o.expr || 'happy';
  [-30, 30].forEach((dx, i) => { const r = ex === 'surprised' ? 30 : 26;
    if ((blink && ex !== 'surprised') || (ex === 'wink' && i === 1)) { X.lineWidth = 6; X.strokeStyle = '#111'; X.beginPath(); X.moveTo(dx - 18, -60); X.quadraticCurveTo(dx, -48, dx + 18, -60); X.stroke(); return; }
    X.beginPath(); X.ellipse(dx, -62, 22, r, 0, 0, 7); X.fillStyle = '#fff'; X.fill(); X.lineWidth = 6; X.strokeStyle = '#111'; X.stroke();
    X.fillStyle = '#111'; X.beginPath(); X.arc(dx + 4 + look, -58, ex === 'surprised' ? 6 : 8, 0, 7); X.fill(); });
  X.lineWidth = 6; X.strokeStyle = '#111'; X.beginPath(); X.moveTo(-50, ex === 'surprised' ? -104 : -96); X.lineTo(-14, ex === 'surprised' ? -100 : -92); X.moveTo(14, ex === 'surprised' ? -100 : -92); X.lineTo(50, ex === 'surprised' ? -104 : -96); X.stroke();
  const talk = ex === 'talk' ? Math.abs(Math.sin(t * 12)) : 0;
  if (ex === 'surprised') { X.beginPath(); X.ellipse(0, -10, 14, 18, 0, 0, 7); X.fillStyle = '#7a1f1f'; X.fill(); X.stroke(); }
  else { X.beginPath(); X.moveTo(-30, -22); X.quadraticCurveTo(0, 14 + talk * 10, 30, -22); X.closePath(); X.fillStyle = '#7a1f1f'; X.fill(); X.stroke(); X.fillStyle = '#ff7a8a'; X.beginPath(); X.ellipse(0, -2 + talk * 4, 12, 6, 0, 0, 7); X.fill(); }
  X.fillStyle = 'rgba(255,90,90,.45)'; X.beginPath(); X.arc(-62, -30, 12, 0, 7); X.arc(62, -30, 12, 0, 7); X.fill();
  X.restore();
  // chispas alrededor
  for (let i = 0; i < 4; i++) { const k = (t * .9 + i / 4) % 1, a = i * 1.7 + t; X.globalAlpha = 1 - k; txt('✦', x + Math.cos(a) * (110 + k * 60) * s, y - 60 * s + Math.sin(a) * (110 + k * 60) * s, 34 * s, '#fff3a0'); } X.globalAlpha = 1;
}
function bubble(x, y, text, k, dir = -1, size = 46) { if (k <= 0) return; X.save(); X.font = `900 ${size}px Mont`; const w = X.measureText(text).width + 60, h = size + 44; X.restore();
  const s = back(k); X.save(); X.translate(x, y); X.scale(s, s); X.beginPath(); X.roundRect(dir < 0 ? -w : 0, -h, w, h, 30); X.moveTo(dir * 10, -8); X.lineTo(dir * 50, 30); X.lineTo(dir * 60, -12);
  X.fillStyle = '#fff'; X.fill(); X.lineWidth = 7; X.strokeStyle = '#111'; X.stroke(); X.fillStyle = '#fff'; X.fillRect(dir < 0 ? dir * 64 : 6, -16, 58, 12); txt(text, dir * w / 2, -h / 2, size, '#111', { w: 900 }); X.restore(); }

// capa de la mascota sobre el vídeo
function chispaLayer(t) {
  if (!TL.datos.length) return; const [ts, n] = TL.datos.filter(([a]) => a <= t + .4).slice(-1)[0] || [null, null];
  // transición de marca: destello dorado en iris al empezar cada dato
  TL.datos.forEach(([a]) => { const k = (t - (a - .35)) / .7; if (k > 0 && k < 1) { const r = Math.sin(k * Math.PI) * 1300; X.save(); X.beginPath(); X.arc(1780, 870, r, 0, 7); X.fillStyle = rgba('#ffc42e', .85 * Math.sin(k * Math.PI)); X.fill();
    X.lineWidth = 40; X.strokeStyle = rgba('#111111', .8 * Math.sin(k * Math.PI)); X.stroke(); X.restore(); chispa(lerp(2150, 1780, ease(clamp(k * 2))), 900, 1.0, { expr: 'surprised' }); } });
  if (ts == null || t < ts || t >= TL.outro - .3) return;
  const lt = t - ts, inK = ease(prog(lt, .2, .8));
  // en su esquina, reaccionando al dato
  const x = lerp(2150, 1790, inK), y = 905; const phase = lt > 4.6 && lt < 7.2;
  chispa(x, y, .62, { expr: phase ? 'talk' : (lt < 4.6 ? 'surprised' : 'happy'), wave: lt > 4.6 && lt < 5.4, look: -.6 });
  bubble(x - 80, y - 120, CHISPA_FRASES[n] || '¡Wow!', prog(lt, 4.6, 5) * (1 - prog(lt, 7, 7.3)), -1, 40);
}
