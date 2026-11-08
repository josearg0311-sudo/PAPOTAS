// Genera el PDF «Progresa» (A4, estilo revista) a partir de datos.json
const {chromium} = require('playwright');
const fs = require('fs');
const D = JSON.parse(fs.readFileSync(__dirname + '/datos.json', 'utf8'));
const F = require('path').join(__dirname, '..', 'fuentes') + '/';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const fmt = (n, d = 0) => Number(n).toLocaleString('es-ES', {minimumFractionDigits: d, maximumFractionDigits: d});
const taz = t => ({1: '1 taza', .75: '¾ taza', .5: '½ taza', 1.25: '1¼ taza', 1.5: '1½ taza'}[t] || t + ' taza');
const PF = D.perfil;
const C = {verde: '#1F7A55', naranja: '#D9692F', azul: '#2F5D8C', tinta: '#17251F', crema: '#FBF8F2', amarillo: '#FFE27A', rosa: '#FFC4D6', menta: '#C8EEDB', cielo: '#CFE3F7'};
const giro = i => [-2.2, 1.4, -1, 2, -1.6, .8][i % 6];
let nPag = 0;
const IDX = {}; const marca = k => { if (!IDX[k] || IDX._pasada) IDX[k] = nPag + 1; };
const pag = (cuerpo, {fondo = C.crema, clase = '', folio = true, tinta} = {}) => { nPag++; return `<section class="pag ${clase}" style="background:${fondo};${tinta ? `color:${tinta}` : ''}">${cuerpo}${folio ? `<div class="folio">${nPag} · Progresa</div>` : ''}</section>`; };
const postit = (html, {col = C.amarillo, rot = -2, w = '', estilo = ''} = {}) => `<div class="postit" style="background:${col};transform:rotate(${rot}deg);${w ? `width:${w};` : ''}${estilo}">${html}</div>`;
const cinta = (estilo = '') => `<span class="cinta" style="${estilo}"></span>`;
const flecha = (estilo, d = 'M5 40 C 40 5, 80 5, 110 30', punta = true) => `<svg class="flecha" style="${estilo}" viewBox="0 0 120 50"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>${punta ? '<path d="M98 22 L111 31 L96 35" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' : ''}</svg>`;
const coach = (t = 56, col = C.verde) => `<svg width="${t}" height="${t}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="31" fill="${col}" fill-opacity=".18"/><path d="M14 64c1-12 8-18 18-18s17 6 18 18z" fill="${col}"/><path d="M27 46l5 7 5-7" fill="#fff"/><circle cx="32" cy="30" r="13" fill="#E8B48A"/><path d="M18 26c0-9 6-14 14-14s14 5 14 14H18z" fill="${col}"/><rect x="30" y="24" width="20" height="4" rx="2" fill="${col}"/><circle cx="27.5" cy="31" r="1.6" fill="#17251F"/><circle cx="36.5" cy="31" r="1.6" fill="#17251F"/><path d="M27 36.5c3 2.6 7 2.6 10 0" stroke="#17251F" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M44 48l6 3" stroke="#555" stroke-width="1.5"/><circle cx="51" cy="52" r="2.6" fill="#B8B8B8"/></svg>`;
const tu = (t = 46) => `<svg width="${t}" height="${t}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="31" fill="#FFE9D6"/><path d="M14 64c1-12 8-18 18-18s17 6 18 18z" fill="#2F5D8C"/><circle cx="32" cy="31" r="13" fill="#C98E64"/><path d="M19 28c0-10 6-14 13-14s13 4 13 13c-3-3-8-5-13-5s-10 2-13 6z" fill="#2A1E17"/><circle cx="27.5" cy="32" r="1.6" fill="#17251F"/><circle cx="36.5" cy="32" r="1.6" fill="#17251F"/><path d="M28 38h8" stroke="#17251F" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const globo = (txt, quien = 'coach', col = C.verde) => `<div class="vin ${quien}">${quien === 'coach' ? coach(48, col) : tu(42)}<div class="globo">${txt}</div></div>`;
const NT = {des: 'Desayuno', alm: 'Almuerzo', cen: 'Cena', ens: 'Ensalada'};
const CATCOL = {prot: '#F28A6B', carb: '#F2B93B', verd: '#34B27D', fruta: '#F27EAA', lact: '#6DB8EC', gras: '#B9A13F', sazon: '#9CA3AF'};

/* ---------------- gráficos ---------------- */
function curvaPortada() {
  const P = D.proyPeso, S = P.length - 1, W = 180, H = 62, mn = PF.meta - 1, mx = P[0] + 1;
  const x = i => 4 + (W - 8) * i / S, y = v => 6 + (H - 14) * (mx - v) / (mx - mn);
  const e1 = D.etapas[0];
  let s = '<svg class="curva-portada" viewBox="0 0 ' + W + ' ' + H + '">';
  D.etapas.forEach((e, i) => { s += '<rect x="' + x(i * 4) + '" y="' + (H - 5) + '" width="' + (x(Math.min(S, (i + 1) * 4)) - x(i * 4) - .6) + '" height="3" rx="1" fill="' + e.color + '"/>'; });
  s += '<line x1="0" x2="' + W + '" y1="' + y(PF.meta) + '" y2="' + y(PF.meta) + '" stroke="' + C.naranja + '" stroke-width=".5" stroke-dasharray="1.5 1.5"/>';
  s += '<polyline points="' + P.map((v, i) => x(i) + ',' + y(v)).join(' ') + '" fill="none" stroke="' + C.tinta + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
  s += '<circle cx="' + x(0) + '" cy="' + y(P[0]) + '" r="2" fill="' + C.verde + '"/><circle cx="' + x(S) + '" cy="' + y(P[S]) + '" r="2.4" fill="' + C.naranja + '"/></svg>';
  return s + postit('<b class="g">' + fmt(PF.peso0, 1) + ' kg</b><br>hoy, día 1', {col: C.menta, rot: -5, estilo: 'position:absolute;left:4mm;top:142mm;width:38mm'})
    + postit('<b class="g">' + fmt(e1.entreno) + '</b> kcal<br>día de entreno · etapa 1', {col: C.rosa, rot: 3, estilo: 'position:absolute;left:62mm;top:150mm;width:46mm'})
    + postit('<b class="g">' + D.prot + ' g</b><br>de proteína al día', {col: C.cielo, rot: -2, estilo: 'position:absolute;left:96mm;top:214mm;width:42mm'})
    + postit('<b class="g">' + fmt(PF.meta) + ' kg</b><br>≈ ' + esc(D.llega) + '<br>' + D.etapas.length + ' etapas · ' + D.semanas + ' semanas', {col: C.amarillo, rot: 4, estilo: 'position:absolute;right:2mm;top:182mm;width:48mm'})
    + '<div class="sello">🏋️ ⚽ 🍳 🍚 🥗</div>';
}
function graficoProyeccion(w = 700, h = 300) {
  const P = D.proyPeso, Cc = D.proyCint, S = P.length - 1;
  const L = 44, R = 50, T = 18, B = 34;
  const mn = Math.floor(Math.min(...P, PF.meta) - 1), mx = Math.ceil(Math.max(...P) + 1);
  const x = i => L + (w - L - R) * i / S, y = v => T + (h - T - B) * (mx - v) / (mx - mn);
  const cmn = Math.min(...Cc, PF.metaCintura || 999) - 1, cmx = Math.max(...Cc) + 1, yc = v => T + (h - T - B) * (cmx - v) / (cmx - cmn);
  let s = `<svg viewBox="0 0 ${w} ${h}" class="graf">`;
  D.etapas.forEach((e, i) => { const a = x(i * 4), bb = x(Math.min(S, (i + 1) * 4)); s += `<rect x="${a}" y="${T}" width="${bb - a}" height="${h - T - B}" fill="${e.color}" opacity="${i % 2 ? .07 : .13}"/><text x="${(a + bb) / 2}" y="${h - 8}" text-anchor="middle" font-size="11" font-weight="700" fill="${e.color}">E${e.n}</text>`; });
  for (let v = mn; v <= mx; v += 2) s += `<line x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}" stroke="#17251F" stroke-opacity=".08"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="#55655D">${v}</text>`;
  s += `<line x1="${L}" x2="${w - R}" y1="${y(PF.meta)}" y2="${y(PF.meta)}" stroke="${C.naranja}" stroke-width="2" stroke-dasharray="6 5"/><text x="${w - R + 4}" y="${y(PF.meta) + 4}" font-size="11" font-weight="700" fill="${C.naranja}">${fmt(PF.meta)} kg</text>`;
  const band = P.map((v, i) => { const c = P[0] - v; return [x(i), y(P[0] - c * 1.25), y(P[0] - c * .75)]; });
  s += `<polygon points="${band.map(b => `${b[0]},${b[1]}`).join(' ')} ${band.reverse().map(b => `${b[0]},${b[2]}`).join(' ')}" fill="${C.verde}" opacity=".16"/>`;
  s += `<polyline points="${Cc.map((v, i) => `${x(i)},${yc(v)}`).join(' ')}" fill="none" stroke="${C.azul}" stroke-width="2.2" stroke-dasharray="2 5" stroke-linecap="round"/>`;
  s += `<polyline points="${P.map((v, i) => `${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${C.verde}" stroke-width="3.2" stroke-linejoin="round"/>`;
  [0, 4, 8, 12, 16, 20, 24].filter(i => i <= S).forEach(i => { s += `<circle cx="${x(i)}" cy="${y(P[i])}" r="4.5" fill="#fff" stroke="${C.verde}" stroke-width="2.5"/><text x="${x(i)}" y="${y(P[i]) - 10}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${C.tinta}">${fmt(P[i], 1)}</text>`; });
  s += `<text x="${x(S) + 4}" y="${yc(Cc[S]) + 4}" font-size="10.5" font-weight="700" fill="${C.azul}">${fmt(Cc[S], 1)} cm</text>`;
  return s + `</svg>`;
}
function plato(t = 260) {
  return `<svg viewBox="0 0 300 300" width="${t}" height="${t}"><circle cx="150" cy="150" r="142" fill="#fff" stroke="#17251F" stroke-width="3"/><circle cx="150" cy="150" r="124" fill="#F6F2EA"/>
  <path d="M150 30 A120 120 0 0 0 150 270 Z" fill="#34B27D"/><path d="M150 150 L150 30 A120 120 0 0 1 270 150 Z" fill="#F28A6B"/><path d="M150 150 L270 150 A120 120 0 0 1 150 270 Z" fill="#F2B93B"/>
  <text x="92" y="128" text-anchor="middle" font-size="40">🥦🍅</text><text x="92" y="170" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">½ VERDURAS</text><text x="92" y="188" text-anchor="middle" font-size="11" fill="#fff">2 manos · libres</text>
  <text x="205" y="88" text-anchor="middle" font-size="32">🍗</text><text x="205" y="114" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">¼ PROTEÍNA</text><text x="205" y="128" text-anchor="middle" font-size="10.5" fill="#fff">1½ palmas</text>
  <text x="205" y="196" text-anchor="middle" font-size="32">🍚</text><text x="205" y="222" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">¼ CARBO</text><text x="205" y="236" text-anchor="middle" font-size="10.5" fill="#fff">1 puño</text></svg>`;
}
const mbar = (p, c, g) => { const kp = p * 4, kc = c * 4, kg = g * 9, t = kp + kc + kg || 1; return `<div class="mbar"><i style="width:${kp / t * 100}%;background:#2FA89C"></i><i style="width:${kc / t * 100}%;background:#E8B23A"></i><i style="width:${kg / t * 100}%;background:#E07AA3"></i></div>`; };

/* ---------------- páginas ---------------- */
const P = [];
const ficha = (x, grande) => {
  const {r, f} = x;
  const ings = f.ing.map(t => { if (t.startsWith('— ')) return `<li class="sec">${esc(t.slice(2))}</li>`; const m = t.match(/^([\d.,]+)\s*(g|ml)\s*(?:\([^)]*\))?\s*·\s*(.*)$/); if (m && f.n > 1) { const v = parseFloat(m[1].replace(',', '.')) / f.n; return `<li><b>${fmt(v >= 10 ? Math.round(v) : v, v < 10 ? 1 : 0)} ${m[2]}</b> ${esc(m[3].replace(/\s*\(.*?\)/g, ''))}</li>`; } const p = t.split('·'); return p.length > 1 ? `<li><b>${esc(p[0].trim())}</b> ${esc(p.slice(1).join('·').trim())}</li>` : `<li>${esc(t)}</li>`; }).join('');
  return `<article class="ficha ${grande ? 'grande' : ''}">
    <div class="f-cab"><span class="f-ico">${x.ico}</span><div><div class="f-cod">${esc(r.code)} · ${NT[r.grupo]} · ⏱ ${esc(f.prep)} + ${esc(f.coc)}${f.n > 1 ? ` · por porción (rinde ${f.n})` : ''}</div><h3>${esc(r.title)}</h3></div></div>
    <div class="f-num"><span><b>${r.kcal}</b> kcal</span><span style="color:#1F8F84"><b>${r.prot}</b> g P</span><span style="color:#B98410"><b>${fmt(f.c, 1)}</b> g C</span><span style="color:#B8487A"><b>${fmt(f.g, 1)}</b> g G</span></div>${mbar(r.prot, f.c, f.g)}
    <div class="f-plan">Para tu plan: <b>${esc(r.adj)}</b> → <b>${r.tk} kcal · ${r.tp} g</b></div>
    <div class="f-cuerpo"><ul class="f-ing">${ings}</ul><ol class="f-pasos">${f.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>
    ${f.tip ? `<div class="f-tip">💡 ${esc(f.tip)}</div>` : ''}${r.note ? `<div class="f-tip">🔁 ${esc(r.note)}</div>` : ''}
  </article>`;
};
const filaR = r => `<div class="rr ${r.ficha ? 'cf' : ''}"><span>${r.ico}</span><b>${esc(r.code)}</b> ${esc(r.title)}${r.snack ? ' 🎒' : ''}<em>${r.grupo === 'ens' ? `${r.kcal} · ${esc(r.tag)}` : `${r.tk} kcal · ${r.tp} g`}</em></div>`;
const htmlRRg = x => x.cab ? `<div class="rr-cab">${{des: '🍳 Desayunos', alm: '🍛 Almuerzos', cen: '🥗 Cenas', ens: '🥬 Ensaladas y acompañamientos'}[x.cab]}</div>` : filaR(x);
function construir() {
const e1 = D.etapas[0];
// 1. portada
P.push(pag(`
  <div class="portada">
    <div class="kicker">Edición personal · ${esc(D.etapas[0].desde)}</div>
    <h1 class="mega">Pro<br>gre<span style="color:${C.naranja}">sa</span></h1>
    <p class="bajada">Tu plan de comidas peruanas que se ajusta contigo, etapa por etapa.</p>
    <div class="plato-portada">${plato(430)}</div>
    ${curvaPortada()}
    <div class="indice-portada"><b>Adentro:</b> las cuentas · tu progresión · tu día según el entreno · el plato · ${D.alim.length} alimentos · una semana armada · lista de compras · 24 recetas paso a paso · las 254 del recetario · 9 lecciones en viñetas · hojas para registrar</div>
  </div>`, {folio: false}));

// 2. carta + índice suelto
P.push(pag(`
  <div class="carta">
    <div class="kicker">Antes de empezar</div>
    <h2 class="titular">Esto no es una dieta de 90 días.<br><span class="subrayado">Es un plan que aprende de ti.</span></h2>
    <div class="cols2">
      <p class="capitular">Empiezas en ${fmt(PF.peso0, 1)} kg, con ${PF.cintura0} cm de cintura y entrenando gym y fútbol varias veces por semana, en horarios que cambian. El objetivo es llegar a ${fmt(PF.meta)} kg y a una cintura de ${PF.metaCintura} cm o menos, sin pasar hambre y comiendo comida peruana de verdad.</p>
      <p>El plan se divide en <b>etapas de 4 semanas</b>. En cada etapa las calorías se recalculan con tu peso real, no con lo que «debería» pasar. Si el promedio semanal se frena, el plan te propone un ajuste pequeño (≈ ¼ de taza de arroz). Si bajas demasiado rápido, te pide comer un poco más para cuidar tu músculo.</p>
      <p>Cada día se arma según <b>cómo entrenas</b>: no es lo mismo fútbol a las 7 am que gym a las 7 pm. La comida de antes y la de después del entreno llevan carbo + proteína; el resto se reparte en tus porciones de mano.</p>
      <p>Las recetas salen de los libros de desayunos y almuerzos peruanos, ya ajustadas a ti: cada una dice qué agregarle para llegar a tu meta de esa comida.</p>
    </div>
    ${globo('Lee esto como una revista: salta a lo que necesites. Las hojas del final son para escribir encima. ✍️')}
  </div>
  <div class="mapa">
    ${[['Las cuentas', IDX.cuentas, C.amarillo], ['Tu progresión', IDX.prog, C.rosa], ['Tu día según el entreno', IDX.dia, C.menta], ['El plato y la mano', IDX.plato, C.cielo], [`${D.alim.length} alimentos`, IDX.alim, C.amarillo], ['Tu semana armada', IDX.semana, C.rosa], ['Lista de compras', IDX.compras, C.menta], [`${D.fichas.length} recetas paso a paso`, IDX.fichas, C.cielo], ['Todo el recetario', IDX.rr, C.amarillo], ['9 lecciones', IDX.lec, C.rosa], ['Hojas para registrar', IDX.reg, C.menta]].map(([t, n, col], i) => postit(`<span class="num-g">${n}</span>${t}`, {col, rot: giro(i), estilo: `display:inline-block;margin:3mm 3mm;width:${[44, 38, 52, 42, 36, 46][i % 6]}mm`})).join('')}
  </div>`));

// 3. las cuentas
marca('cuentas');
P.push(pag(`
  <div class="kicker">Las cuentas</div>
  <h2 class="titular">¿De dónde salen tus <span style="color:${C.verde}">${fmt(e1.entreno)}</span> kcal?</h2>
  <div class="cadena">
    <div class="eslabon" style="background:${C.cielo};transform:rotate(-2deg)"><small>gasto en reposo</small><b>${fmt(D.bmr)}</b><span>Mifflin-St Jeor<br>10×${fmt(PF.peso0, 1)} + 6,25×${PF.talla} − 5×${PF.edad} + 5</span></div>
    ${flecha('width:24mm;color:#17251F')}
    <div class="eslabon" style="background:${C.menta};transform:rotate(1.5deg)"><small>× tu día a día</small><b>×${D.trab.f}</b><span>${esc(D.trab.n)}</span></div>
    ${flecha('width:24mm;color:#17251F')}
    <div class="eslabon" style="background:${C.rosa};transform:rotate(-1deg)"><small>+ deporte</small><b>+${fmt(D.dep)}</b><span>gym ${fmt(PF.deportes.gym?.dias || 0, 1)}×/sem<br>fútbol ${fmt(PF.deportes.fut?.dias || 0, 1)}×/sem<br>(promedio por día)</span></div>
  </div>
  <div class="resultado"><span>= gastas ≈</span> <b>${fmt(D.tdee)}</b> <span>kcal al día</span></div>
  <div class="dos" style="margin-top:8mm">
    <div>
      <h3>Y entonces, el déficit</h3>
      <p>Para bajar 1 kg de grasa hay que dejar de comer unas <b>7700 kcal</b>, repartidas en semanas. Con tus metas de etapa 1 (${fmt(e1.entreno)} en días de entreno y ${fmt(e1.descanso)} en descanso) el déficit ronda las 500–650 kcal diarias: <b>≈ 0,5 kg por semana</b> al principio, y un poco menos cuando el cuerpo pesa menos.</p>
      <p>Por eso cada etapa baja 100 kcal: tu gasto también baja al pesar menos. Así el ritmo se mantiene sin recortes bruscos.</p>
      <h3>Proteína: ${D.prot} g</h3>
      <p>1,8 g por kilo. Es lo que protege tu músculo mientras bajas y lo que más llena. Repartida en 4–5 comidas sale a 35–45 g cada una.</p>
      <h3>Agua: ${fmt(D.agua, 2)} L + 0,5 L por hora de entreno</h3>
      <p>35 ml por kilo de peso. En un día doble (gym + fútbol) son más de 4 litros.</p>
    </div>
    <div style="position:relative">
      ${postit(`<b>Tus calorías vienen de tu nutricionista</b><br><br>El motor calcula ≈ ${fmt(D.tdee - 650)} kcal de promedio, pero tu plan original manda: ${fmt(e1.entreno)} / ${fmt(e1.descanso)} en la etapa 1, y −100 por etapa. La app respeta ese número y solo propone ajustes si el peso real lo pide.`, {col: C.amarillo, rot: 2.5, w: '72mm'})}
      <div class="tabla-dias">
        <div class="t-fila t-cab"><span>Tipo de día</span><span>kcal E1</span></div>
        <div class="t-fila"><span>😴 Descanso</span><b>${fmt(e1.descanso)}</b></div>
        <div class="t-fila"><span>🏋️ o ⚽ Un entreno</span><b>${fmt(e1.entreno)}</b></div>
        <div class="t-fila"><span>🏋️ + ⚽ Día doble</span><b>${fmt(e1.entreno + 100)}</b></div>
      </div>
      ${globo('El día doble suma 1 fruta o 1 yogur. Nada más: no es día libre. 😉', 'coach', C.naranja)}
    </div>
  </div>`));

// 4. progresión
marca('prog');
P.push(pag(`
  <div class="kicker">Tu progresión</div>
  <h2 class="titular">${D.semanas} semanas, ${D.etapas.length} etapas, <span style="color:${C.naranja}">una curva</span></h2>
  <p class="bajada-ch">Línea verde: peso proyectado. Franja: rango realista (±25 %). Puntos azules: cintura. Llegada estimada a ${fmt(PF.meta)} kg: <b>${esc(D.llega)}</b>.</p>
  <div class="caja-graf">${graficoProyeccion(720, 330)}</div>
  <div class="etapas-collage">
    ${D.etapas.map((e, i) => `<div class="etapa" style="border-color:${e.color};transform:rotate(${giro(i) * .7}deg)"><div class="et-n" style="background:${e.color}">E${e.n}</div><div class="et-f">${esc(e.desde)} – ${esc(e.hasta)}</div><div class="et-k"><b>${fmt(e.entreno)}</b> entreno · <b>${fmt(e.descanso)}</b> descanso</div><div class="et-a">🍚 ${taz(e.arrozAlm)} almuerzo · ${taz(e.arrozCen)} cena</div><div class="et-p">≈ ${fmt(D.proyPeso[Math.min(D.proyPeso.length - 1, (i + 1) * 4)], 1)} kg al cierre</div></div>`).join('')}
  </div>`));

// 5. checkpoints + motor
marca('motor');
P.push(pag(`
  <div class="dos" style="grid-template-columns:1.15fr 1fr">
    <div>
      <div class="kicker">Cómo se ajusta el plan</div>
      <h2 class="titular" style="font-size:30pt">El motor revisa tu <span class="subrayado">promedio semanal</span>, no el número de hoy</h2>
      <p>Pésate lunes, miércoles y viernes en ayunas. El agua, la sal y el carbo mueven la balanza 1–2 kg de un día a otro; el promedio de la semana no miente.</p>
      <div class="regla" style="background:${C.rosa}"><span>🍚</span><div><b>Si bajas menos del 60 % de lo previsto en 2 semanas</b><br>quita 100 kcal al día ≈ ¼ de taza de arroz en almuerzo y cena.</div></div>
      <div class="regla" style="background:${C.amarillo}"><span>🍌</span><div><b>Si bajas más de 1 kg por semana dos semanas seguidas</b><br>suma 100 kcal: 1 fruta o ½ taza de arroz. Cuidas músculo y rendimiento.</div></div>
      <div class="regla" style="background:${C.menta}"><span>🎯</span><div><b>Si la cintura baja y el peso no</b><br>vas perfecto: pierdes grasa y mantienes músculo. No cambies nada.</div></div>
      <div class="regla" style="background:${C.cielo}"><span>⏳</span><div><b>Después de un ajuste, espera 2 semanas</b><br>antes de cambiar otra cosa.</div></div>
    </div>
    <div class="checkpoints">
      <h3 style="margin-top:6mm">📸 Checkpoints: al cierre de cada etapa</h3>
      <div class="pol-rej">${D.etapas.map((e, i) => `<div class="polaroid" style="transform:rotate(${giro(i + 2)}deg)">${cinta()}<div class="foto">S${Math.min(D.semanas, (i + 1) * 4)}</div><div class="pie-p"><b>${esc(e.hasta)}</b><br>≈ ${fmt(D.proyPeso[Math.min(D.proyPeso.length - 1, (i + 1) * 4)], 1)} kg · ${fmt(D.proyCint[Math.min(D.proyCint.length - 1, (i + 1) * 4)], 1)} cm</div></div>`).join('')}</div>
      <p class="mini" style="margin-top:4mm">Frente, perfil y espalda. Misma luz, misma hora, misma ropa.</p>
    </div>
  </div>`));

// 6-7. el día según el entreno
marca('dia');
const linea = d => `<div class="linea">${d.comidas.map(c => c.hito ? `<div class="hito-l">${c.ico}<small>${esc(c.hito)}</small></div>` : `<div class="com-l ${c.rol}"><span>${{des: '🍳', alm: '🍛', cen: '🥗', snack: '🍌', extra: '🍎'}[c.tipo]}</span><b>${esc(c.nombre)}</b><small>${c.rol === 'pre' ? '⚡ antes' : c.rol === 'post' ? '🔧 después' : c.rol === 'prepost' ? '⚡ entre' : `${c.kcal} kcal`}</small></div>`).join('<i class="sep">›</i>')}</div>`;
P.push(pag(`
  <div class="kicker">Tu día según cómo entrenas</div>
  <h2 class="titular">La comida se acomoda <span style="color:${C.verde}">al entreno</span>, no al revés</h2>
  <div class="regla-grande">
    <div style="background:${C.amarillo};transform:rotate(-2deg)"><span>🍌🥚</span><b>1–3 h ANTES</b><small>carbo + proteína</small></div>
    ${flecha('width:22mm;color:#17251F')}
    <div style="background:#17251F;color:#fff;transform:rotate(1deg)"><span>🏋️ ⚽</span><b>ENTRENAS</b><small>agua: +0,5 L por hora</small></div>
    ${flecha('width:22mm;color:#17251F')}
    <div style="background:${C.menta};transform:rotate(-1deg)"><span>🍚🍗</span><b>HASTA 2 h DESPUÉS</b><small>carbo + proteína</small></div>
  </div>
  <div class="escenarios">
    ${D.semana.slice(0, 6).map((d, i) => `<div class="esc" style="margin-left:${[0, 14, 4, 18, 2, 10][i]}mm"><div class="esc-t"><span class="esc-ico">${d.ses || '😴'}</span>${esc(d.titulo)}<span class="esc-k">${fmt(d.kcal)} kcal</span></div>${linea(d)}</div>`).join('')}
  </div>
  ${postit('<b>Fútbol temprano</b><br>Pre-entreno ligero (plátano + yogur) y el <u>desayuno pasa a ser tu comida de después</u>.', {col: C.rosa, rot: 2, estilo: 'width:92mm;margin:1mm 0 0 auto'})}`));

// 8. plato y mano
marca('plato');
P.push(pag(`
  <div class="kicker">El plato y la mano</div>
  <div class="dos" style="grid-template-columns:1fr 1fr;align-items:start">
    <div>
      <h2 class="titular" style="font-size:34pt">Sin balanza.<br>Con tu <span style="color:${C.naranja}">mano</span>.</h2>
      <div class="manos">
        <div><span>✋</span><b>Palma = proteína</b><small>≈ 100 g cocido. Almuerzo y cena: 1½ palmas.</small></div>
        <div><span>✊</span><b>Puño = carbo</b><small>≈ 1 taza de arroz, fideos o quinua cocidos.</small></div>
        <div><span>👍</span><b>Pulgar = grasa</b><small>1 cdta de aceite o ¼ de palta.</small></div>
        <div><span>🤲</span><b>2 manos = verduras</b><small>Libres. Repite si te quedas con hambre.</small></div>
      </div>
    </div>
    <div style="text-align:center;position:relative;padding-top:6mm">${plato(300)}${postit('Si juntas 2 carbos (arroz + papa), <b>come ½ de cada uno</b>.', {col: C.amarillo, rot: -4, estilo: 'position:absolute;left:-6mm;bottom:-10mm;width:52mm;text-align:left'})}</div>
  </div>
  <h3 style="margin-top:16mm">El arroz de cada etapa</h3>
  <div class="arroz-etapas">${D.etapas.map(e => `<div style="border-top:5px solid ${e.color}"><b>E${e.n}</b><span>🍚 ${taz(e.arrozAlm)}</span><span>🌙 ${taz(e.arrozCen)}</span></div>`).join('')}</div>
  <p class="mini">«Arroz o equivalente»: 1 taza de arroz = 2 papas medianas = 1 camote mediano = 1 trozo de yuca = 1 taza de fideos o quinua = 1 choclo = 1 taza de menestras.</p>
  <div class="semaforo">
    <div style="background:#D9F2E4"><b>🟢 Cuando quieras</b>verduras, pollo, pescado, huevos, tus frutas (manzana, mandarina, plátano, papaya), yogur natural, agua, infusiones</div>
    <div style="background:#FFF1C4"><b>🟡 Con medida</b>arroz, papa, camote, yuca, fideos, pan, quinua, menestras, palta, queso fresco, aceite</div>
    <div style="background:#FFD9CF"><b>🔴 Planificado</b>frituras, gaseosas, dulces, galletas, broaster, alcohol: se planean, no se improvisan</div>
  </div>`));

// 9-10. alimentos
marca('alim');
const catOrden = ['prot', 'carb', 'verd', 'fruta', 'lact', 'gras', 'sazon'];
const tarjAlim = a => `<div class="al ${a.excl ? 'excl' : ''}" style="border-color:${CATCOL[a.cat]}"><span class="ae">${a.e}</span><b>${esc(a.n)}${a.plan ? ' ★' : ''}</b><small>${a.cat === 'sazon' ? 'libre' : `${a.k} kcal · ${fmt(a.p, 1)} g P /100 g`}</small><small class="ut">${esc(a.ut)}</small>${a.uso ? `<i>${a.uso} recetas</i>` : ''}</div>`;
const grupoAl = c => `<div class="grupo-al"><h4 style="background:${CATCOL[c]}">${D.cats[c].e} ${esc(D.cats[c].n)} <small>· se mide en ${D.cats[c].mano}</small></h4><div class="als">${D.alim.filter(a => a.cat === c).map(tarjAlim).join('')}</div></div>`;
P.push(pag(`
  <div class="kicker">Los alimentos</div>
  <h2 class="titular" style="font-size:30pt">${D.alim.length} alimentos sacados de <span class="subrayado">1400 ingredientes</span> de los libros</h2>
  <p class="bajada-ch">Cada tarjeta dice cuántas kcal y proteína tiene por 100 g, cómo se mide con la mano y en cuántas recetas aparece. ★ tus frutas.</p>
  ${grupoAl('prot')}${grupoAl('carb')}`));
P.push(pag(`${grupoAl('verd')}${grupoAl('fruta')}${grupoAl('lact')}${grupoAl('gras')}
  <div class="dos" style="grid-template-columns:1.3fr 1fr;margin-top:4mm">
    <div><h4 class="mini-t">🌿 Sazón libre</h4><p class="mini">${D.alim.filter(a => a.cat === 'sazon').map(a => `${a.e} ${esc(a.n)}`).join(' · ')}</p></div>
    ${postit(`<b>🚫 No va en tu plan</b><br>${D.excl.map(x => `<s>${x.e} ${esc(x.n)}</s>`).join(' · ')}<br><span class="mini">Las recetas con vainita traen su cambio: arveja o zanahoria.</span>`, {col: C.rosa, rot: -2})}
  </div>`));

// 11-12. semana
marca('semana');
const tarjDia = (d, i) => `<div class="dia-c" style="transform:rotate(${giro(i) * .5}deg)"><div class="dia-cab" style="background:${[C.verde, C.naranja, C.azul][i % 3]}"><b>${esc(d.dia)} ${esc(d.fecha)}</b><span>${d.ses || '😴'} ${esc(d.titulo)}</span><em>${fmt(d.kcal)} kcal</em></div>
  ${d.comidas.map(c => c.hito ? `<div class="dia-hito">${c.ico} ${esc(c.hito)}</div>` : c.receta ? `<div class="dia-com"><span class="ic">${c.receta.ico}</span><div><small>${esc(c.nombre)}${c.rol === 'pre' ? ' · ⚡ antes' : c.rol === 'post' ? ' · 🔧 después' : ''}</small><b>${esc(c.receta.title)}</b>${c.receta.adj ? `<i>${esc(c.receta.adj)}</i>` : ''}</div><em>${c.receta.k}<br><small>${c.receta.p} g</small></em></div>` : `<div class="dia-com"><span class="ic">🍎</span><div><small>${esc(c.nombre)}</small><b>${esc(c.formula)}</b></div><em>${c.kcal}</em></div>`).join('')}</div>`;
P.push(pag(`
  <div class="kicker">Tu semana armada</div>
  <h2 class="titular" style="font-size:30pt">Una semana real de la <span style="color:${C.verde}">etapa 1</span></h2>
  <p class="bajada-ch">Elegida por ajuste a tu meta de cada comida, sin repetir recetas. Los números son kcal y proteína ya con los agregados de tu plan.</p>
  <div class="semana-g">${D.semana.slice(0, 4).map(tarjDia).join('')}</div>`));
P.push(pag(`<div class="semana-g">${D.semana.slice(4).map((d, i) => tarjDia(d, i + 4)).join('')}
  <div class="nota-sem">${globo('¿No te gusta algo? En la app tocas «Cambiar» y eliges entre todo el recetario, filtrando por lo que tienes en casa.', 'coach', C.azul)}${postit('<b>Domingo = descanso</b><br>comes 300 kcal menos que un día de entreno. Aprovecha para preparar la semana.', {col: C.amarillo, rot: 2})}</div></div>`));

// 13. compras
marca('compras');
const comprasPor = c => D.compras.filter(x => x.cat === c).sort((a, b) => b.g - a.g);
P.push(pag(`
  <div class="kicker">Lista de compras</div>
  <div class="dos" style="grid-template-columns:1fr 1.25fr">
    <div>
      <h2 class="titular" style="font-size:32pt">Todo lo de esa semana, <span class="subrayado">en una hoja</span></h2>
      <p>Cantidades para <b>1 porción</b> de cada receta, sumadas. Si cocinas para más gente, multiplica. Los huevos, en unidades.</p>
      ${postit('Lleva la hoja al mercado y tacha. ✏️<br><br>Tip: el bonito, el jurel y la caballa rinden igual que el pollo y suelen costar menos.', {col: C.menta, rot: -3, w: '62mm'})}
      <div style="margin-top:10mm">${globo('Arroz, avena y quinua van en seco: rinden 2,5 veces al cocinarse.', 'coach', C.naranja)}</div>
    </div>
    <div class="ticket">
      <div class="ticket-cab">🛒 Semana del ${esc(D.semana[0].fecha)} al ${esc(D.semana[6].fecha)}</div>
      ${catOrden.filter(c => comprasPor(c).length).map(c => `<div class="tk-sec">${D.cats[c].e} ${esc(D.cats[c].n)}</div>${comprasPor(c).map(x => `<div class="tk"><span class="caja"></span>${x.e} ${esc(x.n)}<span class="pts"></span><b>${esc(x.q)}</b></div>`).join('')}`).join('')}
    </div>
  </div>`));

// 14-23. fichas
const fichas = D.fichas;
const ALTO = 259 * 3.78; // alto útil de la página en px
const M = globalThis.MEDIDAS;
marca('fichas');
{ let paginas = [[]], usado = 125, primera = true;
  fichas.forEach((x, i) => { const h = M.fichas[i] + 20; if (usado + h > ALTO && paginas[paginas.length - 1].length) { paginas.push([]); usado = 0; primera = false; } paginas[paginas.length - 1].push(i); usado += h; });
  const ultUso = paginas[paginas.length - 1].reduce((a, i) => a + M.fichas[i] + 20, 0);
  const relleno = ultUso < ALTO * .6 ? `<div class="mis-versiones"><div class="marco-notas"><b>Mis versiones · lo que cambié y me salió rico</b>${'<div class="renglon"></div>'.repeat(12)}</div><div>${postit('<b>Regla de oro al cambiar algo</b><br><br>Cambia una verdura por otra: libre.<br>Cambia una proteína por otra: misma palma.<br>Cambia el carbo: mira la equivalencia de la página ' + IDX.plato + '.', {col: C.amarillo, rot: 3})}${globo('¿Inventaste algo bueno? Guárdalo en la app como «Mi plato» y lo eliges con un toque.', 'coach', C.azul)}</div></div>` : '';
  paginas.forEach((ix, n) => P.push(pag(`${n === 0 ? `<div class="kicker">Recetas paso a paso</div><h2 class="titular" style="font-size:30pt">Las ${fichas.length} recetas de tu semana</h2><p class="bajada-ch">Cantidades por porción, sacadas de los libros. La barra muestra de dónde vienen las calorías: proteína, carbo y grasa.</p>` : ''}${ix.map(i => ficha(fichas[i], i === 0)).join('')}${n === paginas.length - 1 ? relleno : ''}`))); }

// recetario completo
const grupos = ['des', 'alm', 'cen', 'ens'];
const todas = grupos.flatMap(g => [{cab: g}, ...D.todas.filter(r => r.grupo === g)]);
const htmlRR = x => x.cab ? `<div class="rr-cab">${{des: '🍳 Desayunos', alm: '🍛 Almuerzos', cen: '🥗 Cenas', ens: '🥬 Ensaladas y acompañamientos'}[x.cab]}</div>` : filaR(x);
marca('rr');
{ const pags = []; let pg = null, col = 0, usado = 0, lim = 0;
  const nueva = () => { pg = [[], [], []]; pags.push(pg); col = 0; usado = 0; lim = pags.length === 1 ? ALTO - 105 : ALTO - 6; };
  nueva();
  todas.forEach((x, i) => { const h = M.rr[i]; if (usado + h > lim) { col++; usado = 0; if (col > 2) nueva(); } pg[col].push(x); usado += h; });
  pags.forEach((pg, n) => P.push(pag(`${n === 0 ? `<div class="kicker">Todo el recetario</div><h2 class="titular" style="font-size:26pt">Las 254 recetas, ya ajustadas a ti</h2><p class="bajada-ch">Total del plan (con los agregados) en kcal y proteína. En negrita las que tienen ficha completa. 🎒 = sirve de snack.</p>` : ''}<div class="recetario">${pg.map(c => `<div class="rcol">${c.map(htmlRR).join('')}</div>`).join('')}</div>`))); }

// lecciones
const leccion = (l, i) => `<div class="lec" style="transform:rotate(${giro(i) * .35}deg)"><div class="lec-cab"><span class="lec-n">${i + 1}</span><b>${l.e} ${esc(l.t)}</b></div>
  <div class="vinetas">${globo(esc(l.pr), 'tu')}${l.d.map((x, j) => `<div class="panel"><div class="escena">${x.s}</div>${globo(`<b>${esc(x.h)}</b>`, 'coach', [C.verde, C.naranja, C.azul][i % 3])}<p>${x.p}</p></div>`).join('')}</div>
  <div class="quiz">${l.q.map((q, j) => `<div><b>${j + 1}. ${esc(q.p)}</b> ${q.o.map((o, k) => `<span class="op">${'abc'[k]}) ${esc(o)}</span>`).join(' ')}</div>`).join('')}</div></div>`;
const insignias = () => `<div class="kicker" style="margin-top:4mm">Insignias para pegar en tu refri</div><div class="insig">${[['🌱', 'Primer paso', '1 lección'], ['📘', 'Aprendiz', '3 lecciones'], ['🧠', 'Va en serio', '5 lecciones'], ['🏅', 'Graduado', 'las 9'], ['💯', 'Perfecto', 'todo 3/3'], ['✋', 'Ojo clínico', 'la mano 3/3'], ['🔥', 'Racha de 7', '7 días cumpliendo'], ['🎯', 'Etapa 1', '4 semanas'], ['💧', 'Hidratado', '7 días con tu agua'], ['🏁', 'Meta', fmt(PF.meta) + ' kg']].map(([e, t, d], i) => `<div class="ins" style="transform:rotate(${giro(i) * 2}deg);background:${[C.amarillo, C.rosa, C.menta, C.cielo][i % 4]}"><span>${e}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div>`;
const lecs = D.lecciones;
marca('lec');
P.push(pag(`<div class="kicker">Aprende en viñetas</div><h2 class="titular" style="font-size:28pt">9 lecciones de 2 minutos</h2>${lecs.slice(0, 2).map(leccion).join('')}`));
for (let i = 2; i < lecs.length; i += 2) P.push(pag(lecs.slice(i, i + 2).map((l, j) => leccion(l, i + j)).join('') + (lecs.length - i === 1 ? insignias() : '')));
P.push(pag(`
  <div class="dos" style="grid-template-columns:1fr 1fr">
    <div>
      <div class="kicker">Respuestas del quiz</div>
      <div class="respuestas">${lecs.map((l, i) => `<div><b>${i + 1}. ${esc(l.t)}</b> ${l.q.map((q, j) => `${j + 1}${'abc'[q.r]}`).join(' · ')}</div>`).join('')}</div>
      <p class="mini">(Sin trampa: primero respóndelas tú.)</p>
      <div class="kicker" style="margin-top:12mm">Hidratación después del fútbol</div>
      <p>Pésate antes y después. Lo que bajas es sudor: repón 1 a 1,5 L por kilo.</p>
      <table class="tabla"><tr><th>Bajaste</th><th>Repón</th><th>Vasos de 250 ml</th></tr>${[.5, 1, 1.5, 2, 2.5].map(k => `<tr><td>${fmt(k, 1)} kg</td><td>${fmt(k, 1)} – ${fmt(k * 1.5, 1)} L</td><td>${Math.round(k * 4)} – ${Math.round(k * 6)}</td></tr>`).join('')}</table>
      <p class="mini">Si bajaste más del 2 % de tu peso (≈ ${fmt(PF.peso0 * .02, 1)} kg), lleva más agua al próximo partido.</p>
    </div>
    <div class="antojo-col">
      <div class="kicker">Plan anti-antojo</div>
      <h2 class="titular" style="font-size:28pt">3 pasos, <span class="subrayado">15 minutos</span></h2>
      ${D.antojo.map((a, i) => postit(`<span class="g">${a.e}</span><br><b>Paso ${i + 1}: ${esc(a.t)}</b><br>${esc(a.d)}`, {col: [C.cielo, C.amarillo, C.menta][i], rot: [-2, 2, -1][i], estilo: `margin:5mm 0 5mm ${[0, 16, 6][i]}mm;width:70mm`})).join('')}
      ${globo(esc(D.animo[0]), 'coach', C.naranja)}
    </div>
  </div>`));

// hojas para registrar
marca('reg');
P.push(pag(`
  <div class="kicker">Para escribir encima</div>
  <h2 class="titular" style="font-size:28pt">Registro de peso <span style="color:${C.verde}">· lunes, miércoles, viernes</span></h2>
  <table class="registro"><tr><th>Sem</th><th>Etapa</th><th>Lun</th><th>Mié</th><th>Vie</th><th>Promedio</th><th>Previsto</th><th>Cintura</th></tr>
  ${Array.from({length: D.semanas}, (_, i) => `<tr><td><b>${i + 1}</b></td><td style="color:${D.etapas[Math.floor(i / 4)].color};font-weight:700">E${Math.floor(i / 4) + 1}</td><td></td><td></td><td></td><td></td><td class="prev">${fmt(D.proyPeso[i + 1], 1)}</td><td class="${i % 2 ? '' : 'gris'}">${i % 2 ? `<span class="prev">${fmt(D.proyCint[i + 1], 1)}</span>` : ''}</td></tr>`).join('')}</table>
  <p class="mini">Cintura cada 2 semanas, a la altura del ombligo, al final de una exhalación. Si el promedio no baja en 2 semanas, mira la página ${IDX.motor}.</p>`));
P.push(pag(`
  <div class="kicker">Para escribir encima</div>
  <h2 class="titular" style="font-size:28pt">28 días de hábitos</h2>
  <div class="habitos">${[['🍽️', '¾ de comidas cumplidas'], ['🍗', `${D.prot} g de proteína`], ['💧', `${fmt(D.agua, 1)} L de agua o más`], ['🏋️', 'Entrené / me moví'], ['😴', '7 h de sueño'], ['🥗', 'Verduras en almuerzo y cena']].map(([e, t]) => `<div class="hab"><span>${e} ${esc(t)}</span><div class="circulos">${Array.from({length: 28}, (_, i) => `<i>${i + 1}</i>`).join('')}</div></div>`).join('')}</div>
  <div class="dos" style="margin-top:10mm">
    <div class="marco-notas"><b>Mis notas de la etapa</b>${'<div class="renglon"></div>'.repeat(9)}</div>
    <div>${postit('<b>Mi «por qué»</b><br><br>________________________<br><br>________________________<br><br>________________________', {col: C.amarillo, rot: 2.5, w: '74mm'})}
      <div class="contra">Guía general para una persona sana y activa; no reemplaza a un profesional de salud. Hecho con <b>Progresa</b> a partir de tu plan, tu recetario y los libros de desayunos y almuerzos peruanos.</div></div>
  </div>`));

return P; }
/* ---------------- estilos ---------------- */
const CSS = `
@font-face{font-family:Inter;src:url(file://${F}inter.woff2) format('woff2');font-weight:400 700}
@font-face{font-family:Poppins;src:url(file://${F}poppins-600.woff2) format('woff2');font-weight:600}
@font-face{font-family:Poppins;src:url(file://${F}poppins-700.woff2) format('woff2');font-weight:700}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{font:10pt/1.42 Inter,sans-serif;color:${C.tinta};-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pag{width:210mm;height:297mm;position:relative;overflow:hidden;page-break-after:always;padding:16mm 15mm 18mm}
.pag::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(23,37,31,.05) 1px,transparent 1px);background-size:5mm 5mm;pointer-events:none}
.pag>*{position:relative}
.folio{position:absolute;bottom:8mm;right:15mm;font-size:8pt;color:#8B968F;letter-spacing:.08em;text-transform:uppercase}
h1,h2,h3,h4{font-family:Poppins,sans-serif;margin:0;letter-spacing:-.01em}
h3{font-size:13pt;margin:5mm 0 2mm}
p{margin:0 0 3mm}
.kicker{font-size:8.5pt;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${C.naranja};margin-bottom:2mm}
.titular{font-size:36pt;line-height:1.02;margin-bottom:5mm}
.subrayado{background:linear-gradient(transparent 62%,${C.amarillo} 62%,${C.amarillo} 92%,transparent 92%);padding:0 1mm}
.bajada-ch{font-size:10.5pt;color:#45554D;max-width:150mm;margin-bottom:5mm}
.mini{font-size:8.3pt;color:#55655D}
.postit{padding:4mm 4.5mm;box-shadow:0 2mm 4mm rgba(23,37,31,.14);font-size:9.5pt;line-height:1.35;position:relative}
.postit::after{content:"";position:absolute;top:-3mm;left:40%;width:16mm;height:6mm;background:rgba(255,255,255,.55);transform:rotate(-4deg)}
.postit .g{font-family:Poppins;font-size:17pt;line-height:1.1}
.cinta{position:absolute;top:-3mm;left:50%;width:18mm;height:6mm;background:rgba(255,226,122,.75);transform:translateX(-50%) rotate(3deg);z-index:2}
.flecha{flex:none;height:auto}
.vin{display:flex;align-items:flex-end;gap:2.5mm;margin:3mm 0}
.vin.tu{flex-direction:row-reverse}
.vin svg{flex:none}
.globo{background:#fff;border:1.6px solid ${C.tinta};border-radius:4mm;border-bottom-left-radius:1mm;padding:2.4mm 3.4mm;font-size:9.3pt;box-shadow:1.2mm 1.2mm 0 ${C.tinta}}
.vin.tu .globo{border-bottom-left-radius:4mm;border-bottom-right-radius:1mm;background:#FFF6E8}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:9mm}
.cols2{column-count:2;column-gap:8mm;font-size:10.3pt}
.capitular::first-letter{font-family:Poppins;font-size:40pt;float:left;line-height:.9;margin:1mm 2mm 0 0;color:${C.verde}}
/* portada */
.portada{height:100%}
.mega{font-size:118pt;line-height:.8;letter-spacing:-.04em;margin-top:6mm}
.bajada{font-size:15pt;max-width:95mm;margin-top:13mm;font-weight:500}
.curva-portada{position:absolute;left:0;top:168mm;width:180mm;height:62mm}
.plato-portada{position:absolute;right:-48mm;top:22mm;transform:rotate(12deg);opacity:.96}
.sello{position:absolute;left:104mm;top:126mm;font-size:24pt;letter-spacing:3mm;transform:rotate(-8deg)}
.indice-portada{position:absolute;left:0;right:0;bottom:6mm;border-top:2px solid ${C.tinta};padding-top:3mm;font-size:9pt}
/* carta */
.mapa{margin-top:3mm;text-align:center}
.num-g{display:block;font-family:Poppins;font-size:22pt;line-height:1;color:${C.tinta}}
/* cuentas */
.cadena{display:flex;align-items:center;gap:2mm;margin-top:4mm}
.eslabon{flex:1;padding:4mm;border-radius:3mm;box-shadow:0 1.5mm 3mm rgba(0,0,0,.1)}
.eslabon small{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.1em;display:block}
.eslabon b{font-family:Poppins;font-size:26pt;display:block;line-height:1.1}
.eslabon span{font-size:8.3pt;display:block}
.resultado{margin:7mm 0 0 30mm;font-family:Poppins;font-size:16pt;transform:rotate(-1.5deg)}
.resultado b{font-size:46pt;color:${C.verde};padding:0 2mm;background:${C.amarillo}}
.tabla-dias{margin:8mm 0 4mm;border:2px solid ${C.tinta};border-radius:3mm;overflow:hidden}
.t-fila{display:flex;justify-content:space-between;padding:2.6mm 4mm;border-top:1px solid rgba(23,37,31,.15)}
.t-fila b{font-family:Poppins;font-size:13pt}
.t-cab{background:${C.tinta};color:#fff;font-weight:700;font-size:8.5pt;text-transform:uppercase;letter-spacing:.1em;border:0}
/* progresión */
.caja-graf{background:#fff;border:2px solid ${C.tinta};border-radius:4mm;padding:3mm;box-shadow:2mm 2mm 0 ${C.tinta}}
.graf{width:100%;height:auto;display:block;font-family:Inter}
.etapas-collage{display:flex;flex-wrap:wrap;gap:4mm 5mm;margin-top:9mm}
.etapa{width:56mm;background:#fff;border:2px solid;border-radius:3mm;padding:3mm 3.5mm;position:relative;font-size:8.8pt}
.et-n{position:absolute;top:-4mm;right:3mm;color:#fff;font-family:Poppins;font-weight:700;padding:.6mm 3mm;border-radius:2mm}
.et-f{font-weight:700;font-size:8pt;text-transform:uppercase;letter-spacing:.06em;color:#55655D}
.et-k b{font-family:Poppins;font-size:12pt}
/* reglas */
.regla{display:flex;gap:4mm;align-items:flex-start;padding:3.5mm 4mm;border-radius:3mm;margin:3.5mm 0;box-shadow:0 1mm 2.5mm rgba(0,0,0,.08)}
.regla:nth-child(odd){margin-left:6mm}
.regla span{font-size:22pt;line-height:1}
.pol-rej{display:grid;grid-template-columns:1fr 1fr;gap:1mm 3mm}
.polaroid{display:block;width:auto;background:#fff;padding:2.5mm 2.5mm 3mm;margin:4mm 2mm;box-shadow:0 1.5mm 3.5mm rgba(0,0,0,.18);position:relative;vertical-align:top}
.foto{height:17mm;background:repeating-linear-gradient(45deg,#EEE9DE 0 4mm,#F6F2EA 4mm 8mm);display:grid;place-items:center;font-family:Poppins;font-size:18pt;color:#B9B0A0}
.pie-p{font-size:8pt;margin-top:2mm;text-align:center}
/* día */
.regla-grande{display:flex;align-items:center;gap:2mm;margin:1mm 0 5mm}
.regla-grande>div{flex:1;padding:4mm;border-radius:3mm;text-align:center;box-shadow:0 1.5mm 3mm rgba(0,0,0,.12)}
.regla-grande span{font-size:24pt;display:block}
.regla-grande b{font-family:Poppins;display:block;font-size:11pt}
.regla-grande small{font-size:8.5pt}
.esc{margin-bottom:3.4mm}
.esc-t{font-family:Poppins;font-weight:600;font-size:11pt;margin-bottom:1.5mm;display:flex;align-items:center;gap:2mm}
.esc-ico{font-size:14pt}
.esc-k{font-family:Inter;font-weight:700;font-size:8pt;background:${C.tinta};color:#fff;border-radius:9mm;padding:.6mm 2.5mm}
.linea{display:flex;align-items:center;flex-wrap:wrap;gap:1.2mm}
.com-l{background:#fff;border:1.5px solid rgba(23,37,31,.25);border-radius:2.5mm;padding:1.4mm 2.4mm;display:flex;flex-direction:column;align-items:center;min-width:17mm}
.com-l span{font-size:13pt;line-height:1}
.com-l b{font-size:7.8pt}
.com-l small{font-size:7pt;color:#55655D}
.com-l.pre,.com-l.prepost{background:#FFF1C4;border-color:#E8B23A}
.com-l.post{background:#D9F2E4;border-color:${C.verde}}
.hito-l{background:${C.tinta};color:#fff;border-radius:2.5mm;padding:1.4mm 2.4mm;font-size:13pt;display:flex;flex-direction:column;align-items:center}
.hito-l small{font-size:7pt}
.sep{font-style:normal;color:#8B968F}
/* plato */
.manos>div{display:grid;grid-template-columns:14mm 1fr;align-items:center;margin:4mm 0;padding:2.5mm 3mm;background:#fff;border-radius:3mm;border:1.5px solid rgba(23,37,31,.15)}
.manos>div:nth-child(even){margin-left:9mm}
.manos span{font-size:26pt;grid-row:span 2}
.manos b{font-family:Poppins;font-size:11pt}
.manos small{font-size:8.5pt;color:#45554D}
.arroz-etapas{display:flex;gap:3mm;margin:2mm 0 3mm}
.arroz-etapas>div{flex:1;background:#fff;border-radius:2mm;padding:2mm;text-align:center;font-size:8.5pt;display:flex;flex-direction:column}
.arroz-etapas b{font-family:Poppins;font-size:12pt}
.semaforo{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:5mm}
.semaforo>div{padding:3.5mm;border-radius:3mm;font-size:8.6pt}
.semaforo>div:nth-child(2){transform:rotate(1.2deg)}
.semaforo b{display:block;font-family:Poppins;font-size:10.5pt;margin-bottom:1mm}
/* alimentos */
.grupo-al{margin-bottom:3mm}
.grupo-al h4{display:inline-block;color:#fff;font-size:10pt;padding:1mm 3.5mm;border-radius:2mm;margin-bottom:2mm;transform:rotate(-1deg)}
.grupo-al h4 small{font-family:Inter;font-weight:500;opacity:.9}
.als{display:grid;grid-template-columns:repeat(6,1fr);gap:1.6mm}
.al{background:#fff;border:1.5px solid;border-left-width:4px;border-radius:2mm;padding:1.6mm 2mm;display:flex;flex-direction:column;position:relative;min-height:17mm}
.al .ae{font-size:13pt;line-height:1.1}
.al b{font-size:8pt;line-height:1.15}
.al small{font-size:6.6pt;color:#55655D;line-height:1.2}
.al .ut{color:#2F5D8C}
.al i{position:absolute;top:1.2mm;right:1.5mm;font-size:6.2pt;font-style:normal;font-weight:700;color:#8B968F}
.al.excl{opacity:.45;text-decoration:line-through}
.mini-t{font-size:10pt;margin-bottom:1mm}
/* semana */
.semana-g{display:grid;grid-template-columns:1fr 1fr;gap:6mm 7mm;align-items:start}
.dia-c{background:#fff;border-radius:3mm;box-shadow:0 1.5mm 4mm rgba(0,0,0,.12);overflow:hidden;font-size:8.3pt}
.dia-cab{color:#fff;padding:2.5mm 3.5mm;display:grid;grid-template-columns:1fr auto}
.dia-cab b{font-family:Poppins;font-size:12pt;text-transform:capitalize}
.dia-cab span{grid-column:1;font-size:8.3pt;opacity:.95}
.dia-cab em{grid-row:1/3;grid-column:2;align-self:center;font-style:normal;font-family:Poppins;font-size:12pt}
.dia-com{display:grid;grid-template-columns:8mm 1fr auto;gap:2mm;padding:1.8mm 3mm;border-top:1px dashed rgba(23,37,31,.18);align-items:center}
.dia-com .ic{font-size:13pt}
.dia-com small{display:block;font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8B968F}
.dia-com b{display:block;line-height:1.2}
.dia-com i{display:block;font-size:7pt;color:#2F5D8C;font-style:normal}
.dia-com em{font-style:normal;font-weight:700;text-align:right;font-size:9pt}
.dia-com em small{display:inline;letter-spacing:0;text-transform:none;color:#1F8F84}
.dia-hito{background:${C.tinta};color:#fff;font-size:7.8pt;font-weight:700;padding:1mm 3mm}
.nota-sem{padding-top:4mm}
/* compras */
.ticket{background:#fff;padding:5mm 6mm 8mm;box-shadow:0 2mm 5mm rgba(0,0,0,.14);transform:rotate(1.2deg);font-size:9pt;-webkit-mask:radial-gradient(circle at 50% 100%,transparent 1.6mm,#000 1.7mm) 0 0/5mm 100% repeat-x}
.ticket-cab{font-family:Poppins;font-weight:700;font-size:11pt;border-bottom:2px dashed ${C.tinta};padding-bottom:2mm;margin-bottom:1mm}
.tk-sec{font-weight:700;font-size:8pt;text-transform:uppercase;letter-spacing:.1em;color:#8B968F;margin:2mm 0 .5mm}
.tk{display:flex;align-items:center;gap:2mm;padding:.45mm 0}
.tk .caja{width:3.5mm;height:3.5mm;border:1.4px solid ${C.tinta};border-radius:.8mm;flex:none}
.tk .pts{flex:1;border-bottom:1px dotted #B9B0A0;margin:0 1mm}
/* fichas */
.ficha{background:#fff;border-radius:3mm;padding:4mm 5mm;margin-bottom:5mm;box-shadow:0 1mm 3mm rgba(0,0,0,.1);font-size:8.4pt}
.ficha:nth-of-type(even){margin-left:8mm}
.ficha:nth-of-type(odd){margin-right:8mm}
.f-cab{display:flex;gap:3mm;align-items:center}
.f-ico{font-size:22pt;background:#F6F2EA;border-radius:3mm;width:13mm;height:13mm;display:grid;place-items:center;flex:none}
.f-cod{font-size:7.4pt;font-weight:700;color:${C.naranja};letter-spacing:.05em}
.f-cab h3{margin:0;font-size:12.5pt}
.f-num{display:flex;gap:5mm;margin-top:2mm;font-size:8.5pt}
.f-num b{font-family:Poppins;font-size:11pt}
.mbar{display:flex;height:2mm;border-radius:1mm;overflow:hidden;margin:1.2mm 0 2mm;background:#EEE}
.mbar i{display:block}
.f-plan{background:#E8F4EE;border-radius:2mm;padding:1.4mm 2.5mm;margin-bottom:2mm}
.f-cuerpo{display:grid;grid-template-columns:.85fr 1.15fr;gap:5mm}
.f-ing{margin:0;padding:0;list-style:none}
.f-ing li{padding:.6mm 0;border-bottom:1px dotted #D9D1C0}
.f-ing li.sec{font-weight:700;text-transform:uppercase;font-size:7pt;letter-spacing:.08em;color:#8B968F;border:0;padding-top:2mm}
.f-pasos{margin:0;padding-left:4.5mm}
.f-pasos li{margin-bottom:1.2mm}
.f-tip{margin-top:1.5mm;font-size:8pt;color:#45554D}
.ficha.grande{border:2px solid ${C.tinta};box-shadow:2mm 2mm 0 ${C.tinta};font-size:8.8pt}
/* recetario */
.recetario{display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;font-size:7pt;line-height:1.25}
.rr{break-inside:avoid;padding:.55mm 0;border-bottom:1px dotted #D9D1C0;display:block}
.rr span{margin-right:.8mm}
.rr b{color:${C.naranja};font-size:6.5pt}
.rr em{display:block;font-style:normal;color:#55655D;font-size:6.5pt;padding-left:4mm}
.rr.cf{font-weight:700}
.rr-cab{break-after:avoid;font-family:Poppins;font-weight:700;font-size:10pt;margin:2mm 0 1mm;padding:.8mm 2mm;background:${C.tinta};color:#fff;border-radius:1.5mm}
/* lecciones */
.lec{background:#fff;border:2px solid ${C.tinta};border-radius:3mm;padding:3.5mm;margin-bottom:5mm;box-shadow:2mm 2mm 0 rgba(23,37,31,.85)}
.lec-cab{display:flex;align-items:center;gap:3mm;font-family:Poppins;font-size:13pt;margin-bottom:1mm}
.lec-n{background:${C.naranja};color:#fff;width:9mm;height:9mm;border-radius:2mm;display:grid;place-items:center;font-size:12pt}
.vinetas{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.vinetas>.vin{grid-column:1/-1;margin:0 0 1mm}
.panel{border:1.5px solid rgba(23,37,31,.3);border-radius:2mm;padding:1.8mm;font-size:7.7pt;line-height:1.33}
.panel .escena{font-size:13pt;text-align:center;background:#F6F2EA;border-radius:1.5mm;padding:1mm;letter-spacing:1mm}
.panel .vin{margin:1.5mm 0}
.panel .globo{font-size:8pt;padding:1.5mm 2.2mm}
.panel p{margin:0}
.quiz{margin-top:2mm;font-size:7.6pt;display:grid;gap:1mm;background:#FFF6E0;padding:2.5mm;border-radius:2mm}
.op{margin-left:2mm;white-space:nowrap}
.respuestas>div{padding:1.6mm 0;border-bottom:1px dotted #B9B0A0;font-size:9pt}
.tabla{border-collapse:collapse;width:100%;font-size:9pt;margin:2mm 0}
.tabla th,.tabla td{border:1.5px solid ${C.tinta};padding:1.6mm 2.5mm;text-align:center}
.tabla th{background:${C.tinta};color:#fff}
/* registros */
.registro{border-collapse:collapse;width:100%;font-size:8.5pt}
.registro th{background:${C.tinta};color:#fff;padding:1.5mm;font-size:8pt}
.registro td{border:1px solid #B9B0A0;height:7.9mm;text-align:center;background:#fff}
.registro td.gris{background:#EEE9DE}
.registro .prev{color:#A39B89;font-size:7.5pt}
.habitos .hab{margin-bottom:4mm}
.hab>span{font-family:Poppins;font-weight:600;font-size:10.5pt;display:block;margin-bottom:1.5mm}
.circulos{display:grid;grid-template-columns:repeat(28,1fr);gap:.9mm}
.circulos i{font-size:5.5pt!important;aspect-ratio:1;border:1.5px solid ${C.tinta};border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:6.5pt;color:#A39B89;background:#fff}
.marco-notas{background:#fff;border-radius:3mm;padding:4mm;box-shadow:0 1mm 3mm rgba(0,0,0,.1)}
.renglon{border-bottom:1px solid #D9D1C0;height:8mm}
.contra{margin-top:14mm;font-size:8.3pt;color:#55655D;border-top:2px solid ${C.tinta};padding-top:3mm}
.antojo-col .postit{display:block}
.insig{display:grid;grid-template-columns:repeat(5,1fr);gap:6mm 5mm;margin-top:3mm}
.ins{border-radius:50%;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:2px dashed rgba(23,37,31,.5);box-shadow:0 1.5mm 3mm rgba(0,0,0,.12)}
.ins span{font-size:22pt;line-height:1}.ins b{font-family:Poppins;font-size:9pt;margin-top:1mm}.ins small{font-size:7pt}
.mis-versiones{margin-top:6mm;display:grid;grid-template-columns:1.4fr 1fr;gap:8mm;align-items:start}
`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  // 1ª pasada: medir fichas y filas del recetario con el ancho real
  globalThis.MEDIDAS = {fichas: D.fichas.map(() => 300), rr: []};
  const todasM = ['des', 'alm', 'cen', 'ens'].flatMap(g => [{cab: g}, ...D.todas.filter(r => r.grupo === g)]);
  globalThis.MEDIDAS.rr = todasM.map(() => 12);
  construir(); P.length = 0; nPag = 0;
  const med = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><section class="pag" style="height:auto"><div id="mf">${D.fichas.map((x, i) => ficha(x, i === 0)).join('')}</div><div class="recetario"><div class="rcol" id="mr">${todasM.map(htmlRRg).join('')}</div></div></section></body></html>`;
  await p.setContent(med); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  globalThis.MEDIDAS = await p.evaluate(() => { const alto = e => { const cs = getComputedStyle(e); return e.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom); }; return {fichas: [...document.querySelectorAll('#mf>.ficha')].map(alto), rr: [...document.querySelectorAll('#mr>*')].map(alto)}; });
  IDX._pasada = true; construir(); P.length = 0; nPag = 0; construir();
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Progresa · tu plan</title><style>${CSS}</style></head><body>${P.join('\n')}</body></html>`;
  fs.writeFileSync(__dirname + '/progresa.html', html);
  await p.goto('file://' + __dirname + '/progresa.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  // páginas cuyo contenido no cabe
  const sobra = await p.evaluate(() => [...document.querySelectorAll('.pag')].map((s, i) => { const lim = s.getBoundingClientRect().bottom; let max = 0; s.querySelectorAll('*').forEach(e => { if (e.classList.contains('folio') || getComputedStyle(e).position === 'absolute') return; const r = e.getBoundingClientRect(); if (r.height) max = Math.max(max, r.bottom); }); return {i: i + 1, sobra: Math.round(max - (lim - 14 * 3.78))}; }).filter(x => x.sobra > 0));
  console.log('páginas:', P.length, '· se pasan:', JSON.stringify(sobra));
  await p.pdf({path: process.argv[2] || __dirname + '/progresa.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true});
  await b.close();
})();
