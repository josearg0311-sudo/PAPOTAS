// Saca de la app los datos generales para la guía (sin datos de ninguna persona)
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  // un perfil neutro solo para que la app arranque; no se usa ningún dato suyo
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('progresa:perfiles', JSON.stringify({activo: 'g', lista: [{id: 'g', nombre: 'Guía'}]})); localStorage.setItem('progresa:p:g', JSON.stringify({v: 3, perfil: {nombre: 'Guía', excl: [], frutas: []}})); });
  await p.reload(); await p.waitForTimeout(400);
  const datos = await p.evaluate(() => ({
    cats: CATS,
    alim: ALIM.map(a => ({id: a.id, n: a.n, e: a.e, cat: a.cat, k: a.k, p: a.p, c: a.c, g: a.g, ut: a.ut, uso: USO_ALIM[a.id] || 0})),
    todas: TODAS.map(r => ({code: r.code, title: r.title, grupo: r.grupo, kcal: r.kcal, prot: r.prot, adj: r.adj, tag: r.tag, snack: !!r.snack, note: r.note, ficha: !!FICHAS[r.code], ico: iconoReceta(r.title), alims: r.alims.map(id => ALIM_ID[id].e), alimIds: r.alims})),
    fichas: FICHAS,
    lecciones: LECCIONES.map(l => ({t: l.t, e: l.e, pr: l.pr, d: l.d.map(x => ({h: x.h, p: x.p, s: x.s || x.g})), q: l.q})),
    antojo: ANTOJO, animo: ANIMO,
  }));
  fs.writeFileSync(path.join(__dirname, 'datos.json'), JSON.stringify(datos));
  console.log('errores', errs, '· recetas', datos.todas.length, '· fichas', Object.keys(datos.fichas).length, '· alimentos', datos.alim.length);
  await b.close();
})();
