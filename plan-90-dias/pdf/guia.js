// Genera la guía «Progresa» (A4, estilo revista, sin datos personales) a partir de datos.json
const {chromium} = require('playwright');
const fs = require('fs');
const D = JSON.parse(fs.readFileSync(__dirname + '/datos.json', 'utf8'));
const F = require('path').join(__dirname, '..', 'fuentes') + '/';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const fmt = (n, d = 0) => Number(n).toLocaleString('es-ES', {minimumFractionDigits: d, maximumFractionDigits: d});
const taz = t => ({1: '1 taza', .75: '¾ taza', .5: '½ taza', 1.25: '1¼ taza', 1.5: '1½ taza'}[t] || t + ' taza');
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

function plato(t = 260) {
  return `<svg viewBox="0 0 300 300" width="${t}" height="${t}"><circle cx="150" cy="150" r="142" fill="#fff" stroke="#17251F" stroke-width="3"/><circle cx="150" cy="150" r="124" fill="#F6F2EA"/>
  <path d="M150 30 A120 120 0 0 0 150 270 Z" fill="#34B27D"/><path d="M150 150 L150 30 A120 120 0 0 1 270 150 Z" fill="#F28A6B"/><path d="M150 150 L270 150 A120 120 0 0 1 150 270 Z" fill="#F2B93B"/>
  <text x="92" y="128" text-anchor="middle" font-size="40">🥦🍅</text><text x="92" y="170" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">½ VERDURAS</text><text x="92" y="188" text-anchor="middle" font-size="11" fill="#fff">2 manos · libres</text>
  <text x="205" y="88" text-anchor="middle" font-size="32">🍗</text><text x="205" y="114" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">¼ PROTEÍNA</text><text x="205" y="128" text-anchor="middle" font-size="10.5" fill="#fff">1½ palmas</text>
  <text x="205" y="196" text-anchor="middle" font-size="32">🍚</text><text x="205" y="222" text-anchor="middle" font-size="13" font-weight="800" fill="#fff">¼ CARBO</text><text x="205" y="236" text-anchor="middle" font-size="10.5" fill="#fff">1 puño</text></svg>`;
}
const mbar = (p, c, g) => { const kp = p * 4, kc = c * 4, kg = g * 9, t = kp + kc + kg || 1; return `<div class="mbar"><i style="width:${kp / t * 100}%;background:#2FA89C"></i><i style="width:${kc / t * 100}%;background:#E8B23A"></i><i style="width:${kg / t * 100}%;background:#E07AA3"></i></div>`; };

/* ---------------- selección de contenido (general, sin datos de nadie) ---------------- */
const R = D.todas;
const conFicha = R.filter(r => r.ficha);
// lecciones: texto general
const GEN = [[/Tu base: 3 litros/g, 'Tu base: unos 35 ml por kilo'], [/12 vasos de 250 ml al día\. /g, 'Unos 8 a 14 vasos al día, según tu tamaño. '],
  [/\d+ g al día, repartidos en 4–5 comidas\. Es tu seguro para mantener músculo mientras bajas\./g, 'Entre 1,6 y 2 g por kilo al día, repartidos en 3–5 comidas. Es tu seguro para mantener músculo mientras bajas.'],
  [/¿Cuánta proteína al día en tu plan\?/g, '¿Cuánta proteína por kilo si entrenas?'], [/ \(y tú no comes sopas: pide la ensalada\)/g, ''], [/Mejor segundo para tu plan:/g, 'Mejor segundo para cuidarte:'],
  [/una noche no arruina todo tu esfuerzo/gi, 'una noche no arruina meses de esfuerzo']];
const gen = t => GEN.reduce((s, [re, r]) => s.replace(re, r), String(t));
for (const l of D.lecciones) { l.pr = gen(l.pr); l.d.forEach(x => { x.h = gen(x.h); x.p = gen(x.p); }); l.q.forEach(q => { q.p = gen(q.p); q.o = q.o.map(gen); }); if (/proteína por kilo/.test(l.q.map(q => q.p).join())) { const q = l.q.find(q => /proteína por kilo/.test(q.p)); q.o = ['0,5 g', '1,6 a 2 g', '5 g']; q.r = 1; } }
// tableros de comidas sugeridas
const tiene = (r, re) => re.test(r.title.toLowerCase());
const TABLEROS = [
  {t: 'Desayunos con huevo', e: '🍳', col: '#FFE27A', l: R.filter(r => r.grupo === 'des' && tiene(r, /huevo|tortilla|omelette/))},
  {t: 'Con granos andinos', e: '🥣', col: '#C8EEDB', l: R.filter(r => r.grupo === 'des' && tiene(r, /quinua|avena|ca[ñn]ihua/) && !tiene(r, /panqueque|waffle|crepe/))},
  {t: 'Sánguches y tostadas para llevar', e: '🥪', col: '#FFC4D6', l: R.filter(r => r.grupo === 'des' && tiene(r, /s[aá]nguche|tostada/))},
  {t: 'Panqueques, waffles y crepes', e: '🥞', col: '#CFE3F7', l: R.filter(r => r.grupo === 'des' && tiene(r, /panqueque|waffle|crepe/))},
  {t: 'Criollos de la mañana', e: '🌽', col: '#FFE27A', l: R.filter(r => r.grupo === 'des' && tiene(r, /tamal|humita|tacu|mote|camote|papa|solterito|pastel|yuca|mazamorra|palta|queso fresco con/) && !tiene(r, /s[aá]nguche|tostada|tortilla/))},
  {t: 'Almuerzos de olla', e: '🍲', col: '#FFC4D6', l: R.filter(r => r.grupo === 'alm' && tiene(r, /seco|estofado|guisad|ají de|picante|sudado|escabeche|ollita|tacu/))},
  {t: 'Al horno o a la plancha', e: '🔥', col: '#C8EEDB', l: R.filter(r => r.grupo === 'alm' && tiene(r, /horno|plancha|brocheta|papillote|lim[oó]n/))},
  {t: 'Salteados, chaufas y tallarines', e: '🍝', col: '#CFE3F7', l: R.filter(r => r.grupo === 'alm' && tiene(r, /saltad|chaufa|tallar|sillao|tapado/))},
  {t: 'Pescados de nuestro mar', e: '🐟', col: '#CFE3F7', l: R.filter(r => r.grupo !== 'ens' && r.grupo !== 'des' && tiene(r, /bonito|jurel|caballa|trucha|merluza|pescado|at[uú]n/))},
  {t: 'Cenas ligeras', e: '🌙', col: '#FFE27A', l: R.filter(r => r.grupo === 'cen' && (tiene(r, /tortilla|huevos|ensalada|zapallito|vapor|salpic/)))},
  {t: 'Con menestras', e: '🫘', col: '#C8EEDB', l: R.filter(r => r.grupo !== 'ens' && tiene(r, /lenteja|frejol|pallar|tarwi|haba/))},
  {t: 'Ensaladas para acompañar', e: '🥗', col: '#FFC4D6', l: R.filter(r => r.grupo === 'ens' && r.tag === 'Libre')},
];
// fichas: 24 recetas variadas (una por tipo de plato, alternando desayuno y almuerzo)
const FSEL = (() => {
  const elegir = (g, n) => {
    const grupos = {}; for (const r of conFicha.filter(r => r.grupo === g)) (grupos[r.ico] ||= []).push(r);
    const listas = Object.values(grupos).map(l => l.filter((_, k) => k % Math.max(1, Math.floor(l.length / 2)) === 0));
    const out = []; for (let ronda = 0; out.length < n && ronda < 6; ronda++) for (const l of listas) if (l[ronda] && out.length < n) out.push(l[ronda]);
    return out;
  };
  return [...elegir('des', 12), ...elegir('alm', 12)].sort((a, b) => a.code.localeCompare(b.code)).map(r => ({code: r.code, r, f: D.fichas[r.code], ico: r.ico}));
})();

const P = [];
const ficha = (x, grande) => {
  const {r, f} = x;
  const ings = f.ing.map(t => { if (t.startsWith('— ')) return `<li class="sec">${esc(t.slice(2))}</li>`; const m = t.match(/^([\d.,]+)\s*(g|ml)\s*(?:\([^)]*\))?\s*·\s*(.*)$/); if (m && f.n > 1) { const v = parseFloat(m[1].replace(',', '.')) / f.n; return `<li><b>${fmt(v >= 10 ? Math.round(v) : v, v < 10 ? 1 : 0)} ${m[2]}</b> ${esc(m[3].replace(/\s*\(.*?\)/g, ''))}</li>`; } const p = t.split('·'); return p.length > 1 ? `<li><b>${esc(p[0].trim())}</b> ${esc(p.slice(1).join('·').trim())}</li>` : `<li>${esc(t)}</li>`; }).join('');
  return `<article class="ficha ${grande ? 'grande' : ''}">
    <div class="f-cab"><span class="f-ico">${x.ico}</span><div><div class="f-cod">${esc(r.code)} · ${NT[r.grupo]} · ⏱ ${esc(f.prep)} + ${esc(f.coc)}${f.n > 1 ? ` · por porción (rinde ${f.n})` : ''}</div><h3>${esc(r.title)}</h3></div></div>
    <div class="f-num"><span><b>${r.kcal}</b> kcal</span><span style="color:#1F8F84"><b>${fmt(r.prot, 1)}</b> g P</span><span style="color:#B98410"><b>${fmt(f.c, 1)}</b> g C</span><span style="color:#B8487A"><b>${fmt(f.g, 1)}</b> g G</span></div>${mbar(r.prot, f.c, f.g)}
    ${r.adj && r.adj !== 'Tal cual' ? `<div class="f-plan">¿Día de entreno o más hambre? Súmale: <b>${esc(r.adj.replace(/^\+\s*/, ''))}</b></div>` : ''}
    <div class="f-cuerpo"><ul class="f-ing">${ings}</ul><ol class="f-pasos">${f.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>
    ${f.tip ? `<div class="f-tip">💡 ${esc(f.tip)}</div>` : ''}${r.note ? `<div class="f-tip">🔁 ${esc(r.note)}</div>` : ''}
  </article>`;
};
const filaR = r => `<div class="rr ${r.ficha ? 'cf' : ''}"><span>${r.ico}</span><b>${esc(r.code)}</b> ${esc(r.title)}${r.snack ? ' 🎒' : ''}<em>${r.grupo === 'ens' ? `${r.kcal} kcal · ${esc(r.tag)}` : `${r.kcal} kcal · ${fmt(r.prot, 1)} g proteína`}</em></div>`;
const htmlRRg = x => x.cab ? `<div class="rr-cab">${{des: '🍳 Desayunos', alm: '🍛 Almuerzos', cen: '🥗 Cenas', ens: '🥬 Ensaladas y acompañamientos'}[x.cab]}</div>` : filaR(x);
const sug = (r, i) => `<div class="sug" style="transform:rotate(${giro(i) * .4}deg)"><span>${r.ico}</span><div><b>${esc(r.title)}</b><small>${esc(r.code)} · ${r.kcal} kcal · ${fmt(r.prot, 0)} g prot${r.snack ? ' · 🎒' : ''}</small></div></div>`;
const tablero = (t, n, i) => `<div class="tablero" style="--c:${t.col}"><div class="tab-cab" style="transform:rotate(${giro(i) * .6}deg)">${t.e} ${esc(t.t)} <small>· ${t.l.length} ideas</small></div><div class="sugs">${t.l.slice(0, n).map(sug).join('')}</div></div>`;

function construir() {
// 1. portada
P.push(pag(`
  <div class="portada">
    <div class="kicker">Guía práctica · comida peruana</div>
    <h1 class="mega">Pro<br>gre<span style="color:${C.naranja}">sa</span></h1>
    <p class="bajada">Qué comer, cuánto servir y 254 ideas peruanas para armar tus comidas, sin dietas estrictas.</p>
    <div class="plato-portada">${plato(430)}</div>
    ${postit('<b class="g">½ · ¼ · ¼</b><br>el plato que funciona', {col: C.menta, rot: -5, estilo: 'position:absolute;left:4mm;top:150mm;width:46mm'})}
    ${postit('<b class="g">✋ ✊ 👍</b><br>porciones con tu mano, sin balanza', {col: C.rosa, rot: 3, estilo: 'position:absolute;left:62mm;top:166mm;width:52mm'})}
    ${postit(`<b class="g">${R.length}</b> comidas sugeridas<br>desayunos, almuerzos, cenas`, {col: C.amarillo, rot: -2, estilo: 'position:absolute;left:18mm;top:204mm;width:54mm'})}
    ${postit(`<b class="g">${D.alim.length}</b> alimentos<br>de los recetarios peruanos`, {col: C.cielo, rot: 4, estilo: 'position:absolute;right:8mm;top:196mm;width:50mm'})}
    <div class="sello" style="left:108mm;top:132mm">🍳 🍛 🐟 🥗 🍌</div>
    <div class="indice-portada"><b>Adentro:</b> lo básico · calcula lo tuyo · el plato y la mano · el semáforo · comer y entrenar · ${D.alim.length} alimentos · combina a tu gusto · ideas por momento del día · despensa base · ${FSEL.length} recetas paso a paso · las ${R.length} del recetario · 9 lecciones en viñetas · hojas para registrar</div>
  </div>`, {folio: false}));

// 2. intro + índice suelto
P.push(pag(`
  <div class="carta">
    <div class="kicker">Antes de empezar</div>
    <h2 class="titular">Esto no es una dieta.<br><span class="subrayado">Es una guía para elegir mejor.</span></h2>
    <div class="cols2">
      <p class="capitular">No hay menú obligatorio ni horario fijo. Aquí encuentras cómo armar un plato que te llene y te dé energía, cuánto servir sin pesar nada y un montón de ideas de comida peruana para escoger según lo que tengas, el tiempo que tengas y cómo te mueves ese día.</p>
      <p>La idea es simple: <b>proteína en cada comida, verduras en abundancia, carbo según tu actividad</b> y grasa medida. Con eso, cualquier receta de esta guía encaja.</p>
      <p>Si entrenas, la comida de antes y la de después llevan carbo y proteína. Si un día no te mueves, baja un poco el carbo. Si tienes una meta concreta, la página de «Calcula lo tuyo» te da un punto de partida.</p>
      <p>Las recetas vienen de recetarios de desayunos y almuerzos peruanos saludables. Cada una trae sus calorías y proteína, y una sugerencia de qué sumarle cuando necesitas más energía.</p>
    </div>
    ${globo('Léela como una revista: salta a lo que necesites. Las hojas del final son para escribir encima. ✍️')}
  </div>
  <div class="mapa">
    ${[['Lo básico', IDX.basico, C.amarillo], ['Calcula lo tuyo', IDX.calc, C.rosa], ['El plato y la mano', IDX.plato, C.menta], ['El semáforo', IDX.semaf, C.cielo], ['Comer y entrenar', IDX.dia, C.amarillo], [`${D.alim.length} alimentos`, IDX.alim, C.rosa], ['Combina a tu gusto', IDX.combina, C.menta], ['Ideas por momento', IDX.ideas, C.cielo], ['Despensa base', IDX.despensa, C.amarillo], [`${FSEL.length} recetas paso a paso`, IDX.fichas, C.rosa], ['Todo el recetario', IDX.rr, C.menta], ['9 lecciones', IDX.lec, C.cielo], ['Hojas para registrar', IDX.reg, C.amarillo]].map(([t, n, col], i) => postit(`<span class="num-g">${n ?? ''}</span>${t}`, {col, rot: giro(i), estilo: `display:inline-block;margin:2.2mm 2.5mm;padding:3mm 3.5mm;width:${[40, 36, 46, 38, 34, 42][i % 6]}mm`})).join('')}
  </div>`));

// 3. lo básico
marca('basico');
P.push(pag(`
  <div class="kicker">Lo básico</div>
  <h2 class="titular">Tres cosas que <span style="color:${C.verde}">sí importan</span></h2>
  <div class="tres">
    <div style="background:${C.amarillo};transform:rotate(-1.5deg)"><span>⚡</span><b>Energía</b><p>Las calorías son la energía de la comida. Si comes un poco menos de lo que gastas, bajas; si comes más, subes. Para bajar 1 kg de grasa hay que dejar de comer unas <b>7700 kcal</b>, repartidas en semanas: unas 500 al día dan ≈ ½ kg por semana.</p></div>
    <div style="background:${C.menta};transform:rotate(1deg)"><span>🍗</span><b>Proteína</b><p>Es lo que más llena y lo que cuida tu músculo. Si entrenas, apunta a <b>1,6–2 g por kilo</b> al día, repartida en todas tus comidas: una palma en cada una.</p></div>
    <div style="background:${C.rosa};transform:rotate(-.8deg)"><span>🥦</span><b>Volumen</b><p>Las verduras llenan el plato con muy pocas calorías. La mitad del plato verde es el truco para comer rico, harto y sin pasarte.</p></div>
  </div>
  <div class="dos" style="margin-top:9mm">
    <div>
      <h3>Los tres macronutrientes</h3>
      <div class="macros">
        <div><i style="background:#2FA89C"></i><b>Proteína · 4 kcal/g</b><span>pollo, pescado, huevo, carnes magras, menestras, yogur, queso fresco</span></div>
        <div><i style="background:#E8B23A"></i><b>Carbohidrato · 4 kcal/g</b><span>arroz, papa, camote, yuca, choclo, quinua, avena, pan, fruta</span></div>
        <div><i style="background:#E07AA3"></i><b>Grasa · 9 kcal/g</b><span>aceite, palta, queso, frutos secos: poca cantidad, mucha energía</span></div>
      </div>
      <h3>Agua</h3>
      <p>Unos 35 ml por kilo al día, más ½ litro por cada hora de deporte. Orina amarillo claro = vas bien.</p>
    </div>
    <div>
      ${postit('<b>¿Por qué la balanza sube y baja?</b><br><br>Agua, sal, carbo y digestión mueven 1–2 kg de un día a otro. Lo que cuenta es el <b>promedio de la semana</b>, no el número de una mañana.', {col: C.cielo, rot: 2.5, w: '76mm'})}
      <div style="margin-top:10mm">${globo('No cuentes cada caloría. Con el plato y la mano ya estás haciendo el 80 % del trabajo. 😉', 'coach', C.naranja)}</div>
    </div>
  </div>`));

// 4. calcula lo tuyo
marca('calc');
const fila = (et, f) => `<div class="calc-f"><span>${et}</span><span class="hueco"></span><small>${f}</small></div>`;
P.push(pag(`
  <div class="kicker">Calcula lo tuyo</div>
  <h2 class="titular" style="font-size:32pt">Un punto de partida, <span class="subrayado">con lápiz</span></h2>
  <p class="bajada-ch">Estas fórmulas dan una estimación. Úsala dos o tres semanas, mira tu promedio semanal y ajusta de a poco (±100 kcal).</p>
  <div class="dos" style="grid-template-columns:1.2fr 1fr">
    <div class="hoja-calc">
      ${fila('① Gasto en reposo', 'hombres: 10 × peso + 6,25 × estatura − 5 × edad + 5<br>mujeres: 10 × peso + 6,25 × estatura − 5 × edad − 161')}
      ${fila('② × tu día a día', 'sentado casi todo el día ×1,2 · de pie o caminando ×1,35 · trabajo físico ×1,5')}
      ${fila('③ + deporte (por día)', 'pesas ≈ 4 × peso × horas · fútbol ≈ 6 × peso × horas · correr ≈ 7 × peso × horas<br>suma la semana y divide entre 7')}
      ${fila('④ = gasto total', '① × ② + ③')}
      ${fila('⑤ Tu meta de calorías', 'bajar: ④ − 300 a 500 · mantener: ④ · ganar músculo: ④ + 200 a 300')}
      ${fila('⑥ Proteína (g/día)', 'peso × 1,6 a 2')}
      ${fila('⑦ Agua (L/día)', 'peso × 0,035 + 0,5 por hora de deporte')}
    </div>
    <div>
      ${postit('<b>Días de entreno y de descanso</b><br><br>No hace falta comer igual todos los días. En días de entreno, suma 1 puño de carbo; en días de descanso, quítalo. El promedio de la semana es lo que manda.', {col: C.amarillo, rot: -2.5, w: '72mm'})}
      <div class="ritmo">
        <h3>¿Qué ritmo es sano?</h3>
        <div><b>🐢 Suave</b> ¼ kg por semana</div><div><b>🚶 Moderado</b> ½ kg por semana</div><div><b>🏃 Rápido</b> ¾ kg por semana (exige más)</div>
        <p class="mini">Más rápido que eso suele costar músculo y energía. Para ganar músculo: ¼ kg por semana como máximo.</p>
      </div>
      ${globo('La app hace estas cuentas por ti y las ajusta cada 4 semanas con tu peso real.', 'coach', C.azul)}
    </div>
  </div>`));

// 5. plato y mano
marca('plato');
P.push(pag(`
  <div class="kicker">El plato y la mano</div>
  <div class="dos" style="grid-template-columns:1fr 1fr;align-items:start">
    <div>
      <h2 class="titular" style="font-size:34pt">Sin balanza.<br>Con tu <span style="color:${C.naranja}">mano</span>.</h2>
      <div class="manos">
        <div><span>✋</span><b>Palma = proteína</b><small>≈ 100 g cocido. En almuerzo y cena, 1 a 1½ palmas.</small></div>
        <div><span>✊</span><b>Puño = carbo</b><small>≈ 1 taza de arroz, fideos o quinua cocidos. Más en días activos, menos en días quietos.</small></div>
        <div><span>👍</span><b>Pulgar = grasa</b><small>1 cdta de aceite o ¼ de palta por comida.</small></div>
        <div><span>🤲</span><b>2 manos = verduras</b><small>Libres. Repite si te quedas con hambre.</small></div>
      </div>
    </div>
    <div style="text-align:center;position:relative;padding-top:6mm">${plato(300)}${postit('Si juntas 2 carbos (arroz + papa), <b>sirve ½ de cada uno</b>.', {col: C.amarillo, rot: -4, estilo: 'position:absolute;left:-6mm;bottom:-10mm;width:52mm;text-align:left'})}</div>
  </div>
  <h3 style="margin-top:16mm">Equivalencias de 1 puño de carbo</h3>
  <div class="equiv">${[['🍚', '1 taza de arroz'], ['🥔', '2 papas medianas'], ['🍠', '1 camote mediano'], ['🥔', '1 trozo de yuca'], ['🍝', '1 taza de fideos'], ['🥣', '1 taza de quinua'], ['🌽', '1 choclo'], ['🫘', '1 taza de menestras'], ['🥖', '1 pan francés']].map(([e, t], i) => `<div style="transform:rotate(${giro(i) * .6}deg)"><span>${e}</span>${t}</div>`).join('')}</div>
  <h3>¿Cuánto carbo según tu día?</h3>
  <div class="arroz-etapas">${[['😴 Día quieto', '½ – ¾ puño'], ['🚶 Día normal', '¾ – 1 puño'], ['🏋️ Día de entreno', '1 puño'], ['🏋️⚽ Entreno doble', '1 – 1½ puños']].map(([a, b]) => `<div style="border-top:5px solid ${C.verde}"><b>${a}</b><span>${b} en almuerzo y cena</span></div>`).join('')}</div>`));

// 6. semáforo + cambios
marca('semaf');
const cambios = [['🍟 Papas fritas', '🥔 Papas doradas al horno'], ['🥤 Gaseosa', '💧 Agua con limón o infusión fría'], ['🍗 Pollo broaster', '🍗 Pollo al horno con hierbas'], ['🍞 3 panes en el desayuno', '🍞 1 pan + 2 huevos'], ['🍰 Postre del menú', '🍎 Una fruta'], ['🧃 Jugo de caja', '🍊 La fruta entera'], ['🍚 Doble arroz', '🍚 1 puño + más ensalada'], ['🍪 Galletas a media tarde', '🥛 Yogur natural + fruta']];
P.push(pag(`
  <div class="kicker">El semáforo</div>
  <h2 class="titular">Nada está prohibido. <span class="subrayado">Todo tiene su lugar.</span></h2>
  <div class="semaforo grande-s">
    <div style="background:#D9F2E4"><b>🟢 Cuando quieras</b>verduras, pollo, pescado, huevos, frutas, yogur natural, menestras, agua, infusiones</div>
    <div style="background:#FFF1C4"><b>🟡 Con medida</b>arroz, papa, camote, yuca, fideos, pan, quinua, avena, palta, queso fresco, aceite</div>
    <div style="background:#FFD9CF"><b>🔴 Planificado</b>frituras, gaseosas, dulces, galletas, broaster, alcohol: se planean, no se improvisan</div>
  </div>
  <h3 style="margin-top:10mm">Cambios inteligentes</h3>
  <div class="cambios">${cambios.map(([a, b], i) => `<div class="cambio" style="transform:rotate(${giro(i) * .5}deg)"><s>${a}</s><span>→</span><b>${b}</b></div>`).join('')}</div>
  <div class="dos" style="margin-top:8mm">
    ${postit('<b>Regla 80/20</b><br><br>Si 8 de cada 10 comidas siguen la guía, las otras 2 no arruinan nada. Disfrútalas sin culpa y vuelve a lo de siempre en la siguiente comida.', {col: C.amarillo, rot: -2})}
    ${globo('El plato más sano es el que puedes repetir. Si odias algo, cámbialo por otro del mismo color del semáforo.', 'coach', C.verde)}
  </div>`));

// 7. comer y entrenar
marca('dia');
const ejemplos = [
  ['Entrenas temprano', '🌅🏋️', [['🍌', 'Algo ligero', 'antes'], ['🏋️', 'Entreno', 'h'], ['🍳', 'Desayuno', 'después'], ['🍛', 'Almuerzo', ''], ['🥗', 'Cena', '']]],
  ['Entrenas en la tarde', '🌤️⚽', [['🍳', 'Desayuno', ''], ['🍛', 'Almuerzo', 'antes'], ['⚽', 'Entreno', 'h'], ['🍌', 'Merienda', 'después'], ['🥗', 'Cena', '']]],
  ['Entrenas en la noche', '🌙🏋️', [['🍳', 'Desayuno', ''], ['🍛', 'Almuerzo', ''], ['🍌', 'Merienda', 'antes'], ['🏋️', 'Entreno', 'h'], ['🥗', 'Cena', 'después']]],
  ['Dos entrenos el mismo día', '🏋️⚽', [['🍳', 'Desayuno', ''], ['🍛', 'Almuerzo', ''], ['🍌', 'Merienda', 'antes'], ['🏋️⚽', 'Entrenos', 'h'], ['🥗', 'Cena', 'después'], ['🍎', '+1 fruta', '']]],
  ['Día sin entreno', '😴', [['🍳', 'Desayuno', ''], ['🍛', 'Almuerzo', ''], ['🥛', 'Merienda', ''], ['🥗', 'Cena', '']]],
];
P.push(pag(`
  <div class="kicker">Comer y entrenar</div>
  <h2 class="titular">La comida se acomoda <span style="color:${C.verde}">al entreno</span></h2>
  <div class="regla-grande">
    <div style="background:${C.amarillo};transform:rotate(-2deg)"><span>🍌🥚</span><b>1–3 h ANTES</b><small>carbo + proteína</small></div>
    ${flecha('width:22mm;color:#17251F')}
    <div style="background:#17251F;color:#fff;transform:rotate(1deg)"><span>🏋️ ⚽</span><b>ENTRENAS</b><small>agua: +0,5 L por hora</small></div>
    ${flecha('width:22mm;color:#17251F')}
    <div style="background:${C.menta};transform:rotate(-1deg)"><span>🍚🍗</span><b>HASTA 2 h DESPUÉS</b><small>carbo + proteína</small></div>
  </div>
  <p class="bajada-ch">Ejemplos, no reglas: mueve tus comidas para que una quede antes y otra después de moverte.</p>
  <div class="escenarios">${ejemplos.map(([t, ico, l], i) => `<div class="esc" style="margin-left:${[0, 14, 4, 18, 8][i]}mm"><div class="esc-t"><span class="esc-ico">${ico}</span>${t}</div><div class="linea">${l.map(([e, n, r]) => r === 'h' ? `<div class="hito-l">${e}<small>${n}</small></div>` : `<div class="com-l ${r === 'antes' ? 'pre' : r === 'después' ? 'post' : ''}"><span>${e}</span><b>${n}</b><small>${r === 'antes' ? '⚡ antes' : r === 'después' ? '🔧 después' : '&nbsp;'}</small></div>`).join('<i class="sep">›</i>')}</div></div>`).join('')}</div>
  <div class="dos" style="margin-top:4mm">
    ${postit('<b>Ideas para antes</b> (ligeras)<br>🍌 plátano + yogur · 🍞 pan con huevo · 🥣 avena con fruta · 🍠 camote con queso fresco', {col: C.amarillo, rot: 1.5})}
    ${postit('<b>Ideas para después</b> (completas)<br>🥪 sánguche de pollo · 🍳 tortilla + pan · 🍛 tu almuerzo o cena con su puño de carbo · 🥛 yogur griego + fruta', {col: C.menta, rot: -1.5})}
  </div>`));

// 8-9. alimentos
marca('alim');
const catOrden = ['prot', 'carb', 'verd', 'fruta', 'lact', 'gras', 'sazon'];
const tarjAlim = a => `<div class="al" style="border-color:${CATCOL[a.cat]}"><span class="ae">${a.e}</span><b>${esc(a.n)}</b><small>${a.cat === 'sazon' ? 'libre' : `${a.k} kcal · ${fmt(a.p, 1)} g P /100 g`}</small><small class="ut">${esc(a.ut)}</small>${a.uso ? `<i>${a.uso} recetas</i>` : ''}</div>`;
const grupoAl = c => `<div class="grupo-al"><h4 style="background:${CATCOL[c]}">${D.cats[c].e} ${esc(D.cats[c].n)} <small>· se mide en ${D.cats[c].mano}</small></h4><div class="als">${D.alim.filter(a => a.cat === c).map(tarjAlim).join('')}</div></div>`;
P.push(pag(`
  <div class="kicker">Los alimentos</div>
  <h2 class="titular" style="font-size:30pt">${D.alim.length} alimentos de la <span class="subrayado">cocina peruana</span></h2>
  <p class="bajada-ch">Cada tarjeta dice cuántas kcal y proteína tiene por 100 g, cómo se mide con la mano y en cuántas recetas de esta guía aparece.</p>
  ${grupoAl('prot')}${grupoAl('carb')}`));
P.push(pag(`${grupoAl('verd')}${grupoAl('fruta')}${grupoAl('lact')}${grupoAl('gras')}
  <div class="dos" style="grid-template-columns:1.3fr 1fr;margin-top:4mm">
    <div><h4 class="mini-t">🌿 Sazón libre</h4><p class="mini">${D.alim.filter(a => a.cat === 'sazon').map(a => `${a.e} ${esc(a.n)}`).join(' · ')}</p></div>
    ${postit('<b>¿No te gusta algo?</b> Cámbialo por otro del mismo grupo y la misma medida: pollo por pescado, papa por camote.', {col: C.rosa, rot: -2})}
  </div>`));

// 10. combina a tu gusto
marca('combina');
const col = (cat, n) => D.alim.filter(a => a.cat === cat).sort((a, b) => b.uso - a.uso).slice(0, n);
const combos = [['🐟', 'Bonito', '🍠', 'Camote', '🥗', 'Ensalada criolla', '🥑', 'Palta'], ['🍗', 'Pollo', '🍚', 'Arroz', '🥦', 'Brócoli y zanahoria', '🫒', 'Oliva'], ['🥚', 'Tortilla de 2 huevos', '🥖', 'Pan francés', '🍅', 'Tomate y pepino', '🧀', 'Queso fresco'], ['🥩', 'Res magra', '🥔', 'Papa sancochada', '🫑', 'Pimiento y cebolla', '🫒', 'Oliva'], ['🫘', 'Lentejas', '🍚', '½ arroz', '🥬', 'Ensalada verde', '🥑', 'Palta'], ['🦃', 'Pavita', '🥣', 'Quinua', '🎃', 'Zapallo al horno', '🫒', 'Oliva']];
P.push(pag(`
  <div class="kicker">Combina a tu gusto</div>
  <h2 class="titular">1 + 1 + 2 + 1 = <span style="color:${C.verde}">un plato completo</span></h2>
  <p class="bajada-ch">Elige uno de cada columna y ya tienes almuerzo o cena. No necesitas receta.</p>
  <div class="combina">${[['prot', '✋ 1 palma de proteína', 8], ['carb', '✊ 1 puño de carbo', 8], ['verd', '🤲 2 manos de verduras', 8], ['gras', '👍 1 pulgar de grasa', 4]].map(([c, t, n], i) => `<div class="comb-col" style="--c:${CATCOL[c]};transform:rotate(${giro(i) * .4}deg)"><h4>${t}</h4>${col(c, n).map(a => `<div>${a.e} ${esc(a.n)}</div>`).join('')}</div>`).join('<div class="mas">+</div>')}</div>
  <h3 style="margin-top:9mm">Seis combinaciones que funcionan</h3>
  <div class="combos">${combos.map((c, i) => `<div class="combo" style="transform:rotate(${giro(i) * .7}deg)">${[0, 2, 4, 6].map(j => `<span><em>${c[j]}</em>${esc(c[j + 1])}</span>`).join('<i>+</i>')}</div>`).join('')}</div>`));

// 11-13. ideas por momento
marca('ideas');
P.push(pag(`<div class="kicker">Ideas por momento del día</div><h2 class="titular" style="font-size:30pt">¿No sabes qué comer? <span class="subrayado">Elige una.</span></h2><p class="bajada-ch">Calorías y proteína de la receta base, por porción. 🎒 = fácil de llevar.</p>
  <div class="tableros">${TABLEROS.slice(0, 4).map((t, i) => tablero(t, 6, i)).join('')}</div>`));
P.push(pag(`<div class="tableros">${TABLEROS.slice(4, 8).map((t, i) => tablero(t, 6, i + 4)).join('')}</div>`));
P.push(pag(`<div class="tableros">${TABLEROS.slice(8, 12).map((t, i) => tablero(t, 6, i + 8)).join('')}</div>`));

// 14. despensa base
marca('despensa');
const desp = [['🍗 Proteínas', ['Pechuga de pollo', 'Bonito, jurel o caballa', 'Atún en agua', 'Huevos', 'Res magra', 'Menestras secas']], ['🍚 Carbos', ['Arroz', 'Papa', 'Camote', 'Avena en hojuelas', 'Quinua', 'Pan integral o francés']], ['🥦 Verduras', ['Tomate', 'Cebolla', 'Lechuga', 'Pepino', 'Zanahoria', 'Brócoli', 'Zapallito', 'Pimiento']], ['🍎 Frutas', ['Plátano', 'Manzana', 'Mandarina', 'Papaya']], ['🥛 Lácteos', ['Yogur natural sin azúcar', 'Yogur griego', 'Leche semidescremada', 'Queso fresco']], ['🥑 Grasas', ['Aceite de oliva', 'Palta']], ['🌿 Sazón', ['Limón', 'Ajo', 'Ají amarillo y panca', 'Culantro y huacatay', 'Orégano y comino', 'Sillao bajo en sodio']]];
P.push(pag(`
  <div class="kicker">Despensa base</div>
  <div class="dos" style="grid-template-columns:1fr 1.15fr">
    <div>
      <h2 class="titular" style="font-size:32pt">Con esto en casa, <span class="subrayado">siempre hay algo</span></h2>
      <p>La lista corta que permite preparar casi todas las recetas de esta guía. Compra fresco lo que se malogra y ten en reserva lo que dura.</p>
      ${postit('<b>Tip de mercado</b><br><br>El bonito, el jurel y la caballa dan tanta proteína como el pollo y suelen costar menos. 🐟', {col: C.menta, rot: -3, w: '62mm'})}
      <div style="margin-top:8mm">${postit('<b>Domingo de preparación</b><br><br>Cocina arroz o quinua, sancocha huevos, hornea pollo y pica verduras. Con eso armas la semana en 10 minutos por comida.', {col: C.amarillo, rot: 2, w: '66mm'})}</div>
      <div style="margin-top:8mm">${globo('Arroz, avena y quinua van en seco: rinden 2,5 veces al cocinarse.', 'coach', C.naranja)}</div>
    </div>
    <div class="ticket">
      <div class="ticket-cab">🛒 Despensa base</div>
      ${desp.map(([t, l]) => `<div class="tk-sec">${t}</div>${l.map(x => `<div class="tk"><span class="caja"></span>${esc(x)}<span class="pts"></span></div>`).join('')}`).join('')}
    </div>
  </div>`));

// fichas
marca('fichas');
const fichas = FSEL;
const ALTO = 259 * 3.78;
const M = globalThis.MEDIDAS;
{ let paginas = [[]], usado = 125;
  fichas.forEach((x, i) => { const h = M.fichas[i] + 20; if (usado + h > ALTO && paginas[paginas.length - 1].length) { paginas.push([]); usado = 0; } paginas[paginas.length - 1].push(i); usado += h; });
  const ultUso = paginas[paginas.length - 1].reduce((a, i) => a + M.fichas[i] + 20, 0);
  const relleno = ultUso < ALTO * .6 ? `<div class="mis-versiones"><div class="marco-notas"><b>Mis versiones · lo que cambié y me salió rico</b>${'<div class="renglon"></div>'.repeat(12)}</div><div>${postit('<b>Regla de oro al cambiar algo</b><br><br>Cambia una verdura por otra: libre.<br>Cambia una proteína por otra: misma palma.<br>Cambia el carbo: mira las equivalencias de la página ' + IDX.plato + '.', {col: C.amarillo, rot: 3})}</div></div>` : '';
  paginas.forEach((ix, n) => P.push(pag(`${n === 0 ? `<div class="kicker">Recetas paso a paso</div><h2 class="titular" style="font-size:30pt">${fichas.length} recetas para empezar</h2><p class="bajada-ch">Cantidades por porción. La barra muestra de dónde vienen las calorías: proteína, carbo y grasa. Cuando necesites más energía, súmale lo que dice la franja verde.</p>` : ''}${ix.map(i => ficha(fichas[i], i === 0)).join('')}${n === paginas.length - 1 ? relleno : ''}`))); }

// recetario
marca('rr');
const todas = ['des', 'alm', 'cen', 'ens'].flatMap(g => [{cab: g}, ...R.filter(r => r.grupo === g)]);
{ const pags = []; let pg = null, col = 0, usado = 0, lim = 0;
  const nueva = () => { pg = [[], [], []]; pags.push(pg); col = 0; usado = 0; lim = pags.length === 1 ? ALTO - 105 : ALTO - 6; };
  nueva();
  todas.forEach((x, i) => { const h = M.rr[i]; if (usado + h > lim) { col++; usado = 0; if (col > 2) nueva(); } pg[col].push(x); usado += h; });
  const rellenoRR = pg => !pg[1].length ? `<div class="rcol" style="grid-column:2/4">${postit('<b>Las que voy a probar esta semana</b>' + '<div class="renglon"></div>'.repeat(8), {col: C.amarillo, rot: 2, estilo: 'margin:8mm 6mm'})}${globo('Empieza por 2 o 3 recetas nuevas por semana. El resto, repite tus favoritas: así se vuelve costumbre.', 'coach', C.verde)}</div>` : '';
  pags.forEach((pg, n) => P.push(pag(`${n === 0 ? `<div class="kicker">Todo el recetario</div><h2 class="titular" style="font-size:26pt">${R.length} comidas sugeridas</h2><p class="bajada-ch">Calorías y proteína de la receta base, por porción. En negrita las que tienen ficha completa en esta guía. 🎒 = fácil de llevar.</p>` : ''}<div class="recetario">${pg.filter((c, k) => c.length || k === 0).map(c => `<div class="rcol">${c.map(htmlRRg).join('')}</div>`).join('')}${rellenoRR(pg)}</div>`))); }

// lecciones
const leccion = (l, i) => `<div class="lec" style="transform:rotate(${giro(i) * .35}deg)"><div class="lec-cab"><span class="lec-n">${i + 1}</span><b>${l.e} ${esc(l.t)}</b></div>
  <div class="vinetas">${globo(esc(l.pr), 'tu')}${l.d.map(x => `<div class="panel"><div class="escena">${x.s}</div>${globo(`<b>${esc(x.h)}</b>`, 'coach', [C.verde, C.naranja, C.azul][i % 3])}<p>${x.p}</p></div>`).join('')}</div>
  <div class="quiz">${l.q.map((q, j) => `<div><b>${j + 1}. ${esc(q.p)}</b> ${q.o.map((o, k) => `<span class="op">${'abc'[k]}) ${esc(o)}</span>`).join(' ')}</div>`).join('')}</div></div>`;
const insignias = () => `<div class="kicker" style="margin-top:4mm">Insignias para pegar en tu refri</div><div class="insig">${[['🌱', 'Primer paso', '1 lección'], ['📘', 'Aprendiz', '3 lecciones'], ['🧠', 'Va en serio', '5 lecciones'], ['🏅', 'Graduado', 'las 9'], ['💯', 'Perfecto', 'todo 3/3'], ['✋', 'Ojo clínico', 'la mano 3/3'], ['🔥', 'Racha de 7', '7 días de hábitos'], ['🥗', 'Verde', '7 días con verduras'], ['💧', 'Hidratado', '7 días con tu agua'], ['🍳', 'Cocinero', '10 recetas probadas']].map(([e, t, d], i) => `<div class="ins" style="transform:rotate(${giro(i) * 2}deg);background:${[C.amarillo, C.rosa, C.menta, C.cielo][i % 4]}"><span>${e}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div>`;
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
      <div class="kicker" style="margin-top:12mm">Hidratación después del deporte</div>
      <p>Pésate antes y después. Lo que bajas es sudor: repón 1 a 1,5 L por kilo.</p>
      <table class="tabla"><tr><th>Bajaste</th><th>Repón</th><th>Vasos de 250 ml</th></tr>${[.5, 1, 1.5, 2, 2.5].map(k => `<tr><td>${fmt(k, 1)} kg</td><td>${fmt(k, 1)} – ${fmt(k * 1.5, 1)} L</td><td>${Math.round(k * 4)} – ${Math.round(k * 6)}</td></tr>`).join('')}</table>
      <p class="mini">Si bajaste más del 2 % de tu peso, lleva más agua la próxima vez.</p>
    </div>
    <div class="antojo-col">
      <div class="kicker">Plan anti-antojo</div>
      <h2 class="titular" style="font-size:28pt">3 pasos, <span class="subrayado">15 minutos</span></h2>
      ${D.antojo.map((a, i) => postit(`<span class="g">${a.e}</span><br><b>Paso ${i + 1}: ${esc(a.t)}</b><br>${esc(a.d)}`, {col: [C.cielo, C.amarillo, C.menta][i], rot: [-2, 2, -1][i], estilo: `margin:5mm 0 5mm ${[0, 16, 6][i]}mm;width:70mm`})).join('')}
      ${globo(esc(D.animo[1]), 'coach', C.naranja)}
    </div>
  </div>`));

// hojas para registrar (en blanco)
marca('reg');
P.push(pag(`
  <div class="kicker">Para escribir encima</div>
  <h2 class="titular" style="font-size:28pt">Mi registro semanal <span style="color:${C.verde}">· 12 semanas</span></h2>
  <div class="datos-ini"><span>Empiezo el: ______________</span><span>Peso: ________</span><span>Cintura: ________</span><span>Mi meta: ______________________</span></div>
  <table class="registro"><tr><th>Sem</th><th>Lun</th><th>Mié</th><th>Vie</th><th>Promedio</th><th>Cintura</th><th>¿Cómo me sentí?</th></tr>
  ${Array.from({length: 12}, (_, i) => `<tr><td><b>${i + 1}</b></td><td></td><td></td><td></td><td></td><td class="${i % 2 ? '' : 'gris'}"></td><td style="width:62mm"></td></tr>`).join('')}</table>
  <p class="mini">Pésate en ayunas, mismo horario. La cintura cada 2 semanas, a la altura del ombligo. Si el promedio no cambia en 2–3 semanas y querías cambiarlo, ajusta ±100 kcal (≈ ¼ de taza de arroz en almuerzo y cena).</p>
  <div class="dos" style="margin-top:6mm">${postit('<b>Fotos de progreso</b><br>Frente, perfil y espalda cada 4 semanas. Misma luz, misma ropa. Muchas veces la foto cambia antes que la balanza.', {col: C.rosa, rot: -2})}${globo('Registrar no es para juzgarte: es para saber qué ajustar.', 'coach', C.verde)}</div>`));
P.push(pag(`
  <div class="kicker">Para escribir encima</div>
  <h2 class="titular" style="font-size:28pt">28 días de hábitos</h2>
  <div class="habitos">${[['🍗', 'Proteína en cada comida'], ['🥗', 'Verduras en almuerzo y cena'], ['💧', 'Mi agua del día'], ['🏋️', 'Me moví / entrené'], ['😴', '7 h de sueño'], ['🍳', 'Cociné algo de la guía']].map(([e, t]) => `<div class="hab"><span>${e} ${esc(t)}</span><div class="circulos">${Array.from({length: 28}, (_, i) => `<i>${i + 1}</i>`).join('')}</div></div>`).join('')}</div>
  <div class="dos" style="margin-top:10mm">
    <div class="marco-notas"><b>Mis comidas favoritas de la guía</b>${'<div class="renglon"></div>'.repeat(9)}</div>
    <div>${postit('<b>Mi «por qué»</b><br><br>________________________<br><br>________________________<br><br>________________________', {col: C.amarillo, rot: 2.5, w: '74mm'})}
      <div class="contra">Guía general de orientación para personas sanas y activas; no reemplaza a un profesional de salud. Si tienes una condición médica, estás embarazada o tienes una relación difícil con la comida, consulta antes con un profesional. Recetas basadas en recetarios de desayunos y almuerzos peruanos saludables.</div></div>
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
.tres{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm;margin-top:4mm}
.tres>div{padding:5mm;border-radius:3mm;box-shadow:0 1.5mm 3.5mm rgba(0,0,0,.12)}
.tres span{font-size:28pt;display:block;line-height:1}.tres b{font-family:Poppins;font-size:15pt;display:block;margin:1mm 0 2mm}.tres p{font-size:9.3pt;margin:0}
.macros>div{display:grid;grid-template-columns:5mm 1fr;gap:0 2mm;align-items:start;margin:2.5mm 0}
.macros i{width:4mm;height:4mm;border-radius:1mm;grid-row:span 2;margin-top:1mm}.macros b{font-size:10pt}.macros span{font-size:8.6pt;color:#45554D}
.hoja-calc{background:#fff;border:2px solid #17251F;border-radius:3mm;padding:4mm 5mm;box-shadow:2mm 2mm 0 #17251F}
.calc-f{display:grid;grid-template-columns:42mm 1fr;gap:1mm 3mm;align-items:end;padding:3mm 0;border-bottom:1px dashed #D9D1C0}
.calc-f>span:first-child{font-family:Poppins;font-weight:600;font-size:10.5pt}
.calc-f .hueco{border-bottom:2px solid #17251F;height:7mm}
.calc-f small{grid-column:1/-1;font-size:8pt;color:#55655D;line-height:1.35}
.ritmo{background:#fff;border-radius:3mm;padding:4mm;margin:8mm 0 4mm;box-shadow:0 1mm 3mm rgba(0,0,0,.1)}
.ritmo h3{margin-top:0}.ritmo>div{padding:1.5mm 0;border-bottom:1px dotted #D9D1C0;font-size:9.5pt}
.equiv{display:grid;grid-template-columns:repeat(9,1fr);gap:2mm;margin:2mm 0 4mm}
.equiv>div{background:#fff;border-radius:2mm;padding:2mm 1mm;text-align:center;font-size:7.6pt;box-shadow:0 .8mm 2mm rgba(0,0,0,.1)}
.equiv span{display:block;font-size:17pt}
.grande-s>div{font-size:10pt;padding:5mm}
.cambios{display:grid;grid-template-columns:1fr 1fr;gap:4mm 6mm}
.cambio{background:#fff;border-radius:3mm;padding:3mm 4mm;display:grid;grid-template-columns:1fr 6mm 1.2fr;align-items:center;gap:2mm;font-size:9.5pt;box-shadow:0 1mm 2.5mm rgba(0,0,0,.1)}
.cambio s{color:#8B968F}.cambio span{font-family:Poppins;font-size:14pt;color:#D9692F;text-align:center}
.combina{display:grid;grid-template-columns:1fr 6mm 1fr 6mm 1fr 6mm .9fr;align-items:start;gap:1mm}
.comb-col{background:#fff;border-top:6px solid var(--c);border-radius:2.5mm;padding:3mm;font-size:9pt;box-shadow:0 1mm 3mm rgba(0,0,0,.1)}
.comb-col h4{font-size:9.5pt;margin-bottom:2mm}.comb-col>div{padding:.8mm 0;border-bottom:1px dotted #D9D1C0}
.mas{font-family:Poppins;font-size:22pt;text-align:center;padding-top:20mm}
.combos{display:grid;grid-template-columns:1fr 1fr;gap:5mm 6mm}
.combo{background:#FFE27A;border-radius:3mm;padding:3mm;display:flex;align-items:center;flex-wrap:wrap;gap:1.5mm;font-size:8.6pt;box-shadow:0 1.5mm 3mm rgba(0,0,0,.12)}
.combo:nth-child(3n+2){background:#C8EEDB}.combo:nth-child(3n){background:#FFC4D6}
.combo span{display:flex;flex-direction:column;align-items:center;text-align:center;width:19mm}.combo em{font-style:normal;font-size:17pt}.combo i{font-style:normal;font-weight:700}
.tableros{display:grid;grid-template-columns:1fr 1fr;gap:7mm 7mm}
.tablero{background:#fff;border-radius:3mm;padding:3mm 3.5mm 2mm;box-shadow:0 1.5mm 4mm rgba(0,0,0,.1);border-top:7px solid var(--c)}
.tab-cab{display:inline-block;background:var(--c);font-family:Poppins;font-weight:700;font-size:11pt;padding:1.2mm 3.5mm;border-radius:2mm;margin:-7mm 0 2mm -1mm;box-shadow:0 1mm 2mm rgba(0,0,0,.1)}
.tab-cab small{font-family:Inter;font-weight:500;font-size:8pt}
.sug{display:grid;grid-template-columns:9mm 1fr;align-items:center;gap:2mm;padding:1.6mm 0;border-bottom:1px dashed #E2DBCC}
.sug span{font-size:15pt;text-align:center}.sug b{display:block;font-size:9pt;line-height:1.2}.sug small{font-size:7.4pt;color:#55655D}
.datos-ini{display:flex;flex-wrap:wrap;gap:4mm 10mm;font-size:10pt;margin-bottom:5mm;font-weight:600}
.registro td{height:12mm}
.al{min-height:15mm!important;padding:1.3mm 1.8mm!important}
.grupo-al{margin-bottom:2.2mm!important}
.sug{padding:1.3mm 0!important}
.tk{padding:.3mm 0!important}

.insig{display:grid;grid-template-columns:repeat(5,1fr);gap:6mm 5mm;margin-top:3mm}
.ins{border-radius:50%;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:2px dashed rgba(23,37,31,.5);box-shadow:0 1.5mm 3mm rgba(0,0,0,.12)}
.ins span{font-size:22pt;line-height:1}.ins b{font-family:Poppins;font-size:9pt;margin-top:1mm}.ins small{font-size:7pt}
.mis-versiones{margin-top:6mm;display:grid;grid-template-columns:1.4fr 1fr;gap:8mm;align-items:start}
`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  // 1ª pasada: medir fichas y filas del recetario con el ancho real
  globalThis.MEDIDAS = {fichas: FSEL.map(() => 300), rr: []};
  const todasM = ['des', 'alm', 'cen', 'ens'].flatMap(g => [{cab: g}, ...D.todas.filter(r => r.grupo === g)]);
  globalThis.MEDIDAS.rr = todasM.map(() => 12);
  construir(); P.length = 0; nPag = 0;
  const med = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><section class="pag" style="height:auto"><div id="mf">${FSEL.map((x, i) => ficha(x, i === 0)).join('')}</div><div class="recetario"><div class="rcol" id="mr">${todasM.map(htmlRRg).join('')}</div></div></section></body></html>`;
  await p.setContent(med); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  globalThis.MEDIDAS = await p.evaluate(() => { const alto = e => { const cs = getComputedStyle(e); return e.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom); }; return {fichas: [...document.querySelectorAll('#mf>.ficha')].map(alto), rr: [...document.querySelectorAll('#mr>*')].map(alto)}; });
  IDX._pasada = true; construir(); P.length = 0; nPag = 0; construir();
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Progresa · tu plan</title><style>${CSS}</style></head><body>${P.join('\n')}</body></html>`;
  fs.writeFileSync(__dirname + '/guia.html', html);
  await p.goto('file://' + __dirname + '/guia.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  // páginas cuyo contenido no cabe
  const sobra = await p.evaluate(() => [...document.querySelectorAll('.pag')].map((s, i) => { const lim = s.getBoundingClientRect().bottom; let max = 0; s.querySelectorAll('*').forEach(e => { if (e.classList.contains('folio') || getComputedStyle(e).position === 'absolute') return; const r = e.getBoundingClientRect(); if (r.height) max = Math.max(max, r.bottom); }); return {i: i + 1, sobra: Math.round(max - (lim - 14 * 3.78))}; }).filter(x => x.sobra > 0));
  console.log('páginas:', P.length, '· se pasan:', JSON.stringify(sobra));
  await p.pdf({path: process.argv[2] || __dirname + '/guia.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true});
  await b.close();
})();
