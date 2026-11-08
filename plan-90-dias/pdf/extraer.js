// Saca del motor de la app todo lo que necesita el PDF (perfil migrado del plan original)
const {chromium} = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + require('path').join(__dirname, '..', 'index.html') + '?hoy=2026-11-09');
  await p.evaluate(() => { localStorage.clear(); localStorage.setItem('plan90', '{"v":2,"dias":{}}'); });
  await p.reload(); await p.waitForTimeout(400);
  const datos = await p.evaluate(() => {
    const etapas = Array.from({length: Math.ceil(SEMANAS / 4)}, (_, i) => { const e = etapa(i + 1); return {n: e.n, color: e.color, desde: fLarga(e.desdeF), hasta: fLarga(e.hastaF), entreno: e.entreno, descanso: e.descanso, arrozAlm: e.arrozAlm, arrozCen: e.arrozCen}; });
    // semana de ejemplo (etapa 1), con fútbol en la mañana un día
    const lun = deClave('2026-11-09');
    const patron = [
      {t: 'Doble · gym mañana + fútbol noche', ses: [{act: 'gym', t: 'm'}, {act: 'fut', t: 'n'}]},
      {t: 'Gym en la tarde', ses: [{act: 'gym', t: 't'}]},
      {t: 'Fútbol en la noche', ses: [{act: 'fut', t: 'n'}]},
      {t: 'Doble · los dos en la noche', ses: [{act: 'gym', t: 'n'}, {act: 'fut', t: 'n'}]},
      {t: 'Gym en la mañana', ses: [{act: 'gym', t: 'm'}]},
      {t: 'Fútbol en la mañana', ses: [{act: 'fut', t: 'm'}]},
      {t: 'Descanso', ses: []},
    ];
    const usadas = new Set();
    const semana = patron.map((pt, i) => {
      const k = clave(sumar(lun, i));
      const plan = planDelDia({ses: pt.ses, comidas: {}, extras: []}, k);
      const comidas = plan.lista.map(c => {
        if (c.hito) return {hito: c.nombres, ico: c.ico, franja: c.franja};
        if (c.tipo === 'extra') return {id: c.id, nombre: c.nombre, tipo: c.tipo, rol: c.rol, kcal: c.kcal, prot: c.prot, formula: c.formula, franja: c.franja};
        const pool = poolPara(c.tipo).filter(r => !usadas.has(r.code)).map(r => ({r, m: ajuste(r, c) + (FICHAS[r.code] ? 3 : 0)})).sort((a, b) => b.m - a.m);
        const r = pool[(i * 3 + c.id.length) % 3].r; usadas.add(r.code);
        const v = valores(r, c.tipo);
        return {id: c.id, nombre: c.nombre, tipo: c.tipo, rol: c.rol, kcal: c.kcal, prot: c.prot, formula: c.formula, franja: c.franja, receta: {code: r.code, title: r.title, adj: c.tipo === 'snack' ? '' : r.adj, k: v.k, p: v.p, ajuste: ajuste(r, c), ico: iconoReceta(r.title)}};
      });
      return {k, dia: DIAS[sumar(lun, i).getDay()], fecha: fCorta(sumar(lun, i)), titulo: pt.t, kcal: plan.kcal, ses: pt.ses.map(s => ACT[s.act].e).join(''), comidas};
    });
    // lista de compras de esa semana
    const tot = {};
    for (const d of semana) for (const c of d.comidas) { const code = c.receta?.code; const f = code && FICHAS[code]; if (!f) continue;
      for (const t of f.ing) { const x = leerIng(t); if (x.sec) continue; const a = alimDe(x.nombre); if (!a || a.cat === 'sazon') continue; const it = (tot[a.id] ||= {n: a.n, e: a.e, cat: a.cat, g: 0, u: 0}); if (x.g != null) it.g += x.g / f.n; else if (x.unid) it.u += x.unid / f.n; } }
    const compras = Object.values(tot).map(t => ({...t, q: t.n === 'Huevo entero' ? `${Math.ceil(t.u + t.g / 50)} unid` : t.g >= 1000 ? `${fmt(t.g / 1000, 1)} kg` : `${Math.ceil(t.g / 10) * 10} g`}));
    const fichas = [...usadas].filter(c => FICHAS[c]).map(c => ({code: c, r: buscarReceta(c), f: FICHAS[c], ico: iconoReceta(buscarReceta(c).title), alims: buscarReceta(c).alims.map(id => ALIM_ID[id].e)}));
    return {
      perfil: PF, prot: PROT_META, agua: aguaBase(), semanas: SEMANAS, proyPeso: PROY_PESO, proyCint: PROY_CINT, llega: llegaMeta() ? fLarga(llegaMeta()) : null,
      bmr: Math.round(bmr(PF.peso0)), tdee: Math.round(tdee(PF.peso0)), dep: Math.round(gastoDeporte(PF.peso0)), trab: TRABAJOS[PF.trabajo],
      etapas, semana, compras, fichas,
      cats: CATS, alim: ALIM.map(a => ({id: a.id, n: a.n, e: a.e, cat: a.cat, k: a.k, p: a.p, c: a.c, g: a.g, ut: a.ut, uso: USO_ALIM[a.id] || 0, plan: a.plan, excl: EXCL.has(a.id)})),
      excl: EXCL_EXTRA.filter(x => EXCL.has(x.id)).map(x => ({n: x.n, e: x.e})),
      todas: TODAS.map(r => ({code: r.code, title: r.title, grupo: r.grupo, kcal: r.kcal, prot: r.prot, tk: r.tk, tp: r.tp, adj: r.adj, tag: r.tag, snack: r.snack, note: r.note, ficha: !!FICHAS[r.code], ico: iconoReceta(r.title)})),
      lecciones: LECCIONES.map(l => ({t: l.t, e: l.e, pr: l.pr, d: l.d.map(x => ({h: x.h, p: x.p, s: x.s || x.g})), q: l.q})),
      antojo: ANTOJO, animo: ANIMO,
    };
  });
  fs.writeFileSync(__dirname + '/datos.json', JSON.stringify(datos, null, 1));
  console.log('errores', errs, '· semanas', datos.semanas, '· etapas', datos.etapas.length, '· fichas', datos.fichas.length, '· compras', datos.compras.length, '· recetas', datos.todas.length);
  console.log(datos.semana.map(d => d.dia + ': ' + d.comidas.filter(c => c.receta).map(c => c.receta.code).join(' ')).join('\n'));
  await b.close();
})();
