/* Balanza & Plato · prueba completa en un navegador real.
   Uso (desde la raíz del repositorio):  node nutricion/pruebas/prueba.js
   Necesita Playwright con Chromium. Levanta solo un servidor web y una imitación de
   Supabase, simula dos celulares y falla con código 1 si algo no funciona. */
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const RAIZ=path.resolve(__dirname,'..'),EAN=path.join(__dirname,'codigo-7750182000123.png');
const TIPOS={'.html':'text/html','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
function web(){return new Promise(r=>{const s=http.createServer((q,res)=>{const f=path.join(RAIZ,decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'')||'index.html');
  fs.readFile(fs.existsSync(f)&&fs.statSync(f).isDirectory()?path.join(f,'index.html'):f,(e,d)=>{if(e){res.writeHead(404);return res.end()}res.writeHead(200,{'Content-Type':TIPOS[path.extname(f)]||'application/octet-stream'});res.end(d)})});s.listen(0,()=>r(s))})}
function supabaseFalso(){const filas=new Map();return new Promise(r=>{const s=http.createServer((q,res)=>{const H={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Content-Type':'application/json'};
  if(q.method==='OPTIONS'){res.writeHead(204,H);return res.end()}let b='';q.on('data',c=>b+=c);q.on('end',()=>{const j=JSON.parse(b||'{}');
  if(q.url.endsWith('/balanza_guardar')){const k=j.p_familia+'|'+j.p_clave,o=filas.get(k);if(!o||o.ts<j.p_ts)filas.set(k,{familia:j.p_familia,clave:j.p_clave,datos:j.p_datos,ts:j.p_ts,srv:Date.now()});res.writeHead(204,H);return res.end()}
  if(q.url.endsWith('/balanza_leer')){res.writeHead(200,H);return res.end(JSON.stringify([...filas.values()].filter(f=>f.familia===j.p_familia&&f.srv>j.p_desde)))}
  res.writeHead(404,H);res.end('{}')})});s.listen(0,()=>r(s))})}
let fallos=0;const ok=(cond,txt)=>{console.log((cond?'  ✓ ':'  ✗ ')+txt);if(!cond)fallos++};
(async()=>{
  const W=await web(),S=await supabaseFalso(),URL=`http://localhost:${W.address().port}/index.html`,SB=`http://localhost:${S.address().port}`;
  const b=await chromium.launch(),errores=[];
  const celular=async n=>{const c=await b.newContext({viewport:{width:1280,height:900}});const p=await c.newPage();
    p.on('pageerror',e=>errores.push(n+': '+e.message));
    await p.addInitScript(sb=>{const f=window.fetch;window.fetch=(u,o)=>f(String(u).replace('https://prueba.supabase.co',sb),o)},SB);return p};
  const V=s=>s+' >> visible=true';
  try{
    console.log('Perfiles y cuestionario');
    const A=await celular('A');await A.goto(URL);await A.click('[data-a="demo"]');await A.waitForSelector('.pcards',{timeout:20000});
    ok(await A.$$eval('.pcard:not(.addc)',l=>l.length)===3,'crea 3 perfiles de ejemplo');
    await A.click('[data-a="newProfile"]');await A.fill('#np-n','Rosa');await A.click('#f-newp button[type=submit]');await A.waitForSelector('.wiz');
    await A.click('[data-a="wizSet:meta:perder"]');await A.click('[data-a="wizSet:sexo:m"]');
    for(const v of ['45','158','78','66']){await A.fill('#wiz-in',v);await A.click('[data-a="wizNext"]')}
    await A.click('[data-a="wizSet:act:ligero"]');await A.click('[data-a="wizSet:ritmo:0.5"]');await A.click('[data-a="wizSet:dieta:omni"]');await A.click('[data-a="wizNext"]');await A.click('[data-a="wizSet:ncom:4"]');await A.click('[data-a="wizDone"]');
    await A.waitForSelector('.rings');ok(+(await A.textContent('.eq dd')).replace(/\D/g,'')>=1200,'el cuestionario calcula las calorías');
    console.log('Registro y unidades');
    await A.click(V('[data-a="fab"]'));await A.fill('#qa-q','inca kola');await A.waitForTimeout(150);await A.click('#qa-list li:first-child .add');
    ok((await A.$$eval('#qa-unit option',o=>o.map(x=>x.textContent))).join().includes('ml'),'las bebidas se miden en ml');
    await A.selectOption('#qa-unit','g');await A.fill('#qa-qty','1500');await A.press('#qa-qty','Tab');await A.click('[data-a="qaAdd"]');await A.waitForTimeout(150);
    ok((await A.$$eval('.items .q',l=>l.map(x=>x.textContent))).some(t=>t.includes('1,5 L')),'1500 ml se muestra como 1,5 L');
    await A.click('.items li [data-a^="delItem"] >> nth=0');await A.click('#toast [data-a="undo"]');await A.waitForTimeout(100);
    ok((await A.$$eval('.items .q',l=>l.length))>=1,'deshacer recupera lo borrado');
    console.log('Escáner');
    await A.click(V('[data-a="tab:alimentos"]'));await A.click('[data-a="scanOpen"]');await A.waitForTimeout(300);
    await A.setInputFiles('#scan-photo',EAN);await A.waitForSelector('#f-scanprod,[data-a="prodUse"]',{timeout:20000});
    ok(await A.inputValue('#sp-code').catch(()=>'')==='7750182000123','lee el código de barras de una foto');
    await A.fill('#sp-n','Producto de prueba');await A.fill('#sp-k','400');await A.click('#f-scanprod button[type=submit]');await A.waitForTimeout(150);
    await A.click('[data-a="scanAgain"]');await A.waitForTimeout(300);await A.setInputFiles('#scan-photo2',EAN);await A.waitForSelector('[data-a="prodUse"]',{timeout:20000});
    ok((await A.textContent('.sheet .sub')).includes('en tus alimentos'),'reconoce un producto ya guardado');await A.click('[data-a="closeModal"]');
    console.log('Sincronización entre dos celulares');
    await A.click(V('[data-a="tab:perfil"]'));await A.click('[data-a="nubeOpen"]');await A.fill('#nb-url','https://prueba.supabase.co');await A.fill('#nb-key','sb_publishable_prueba_0000000000');await A.click('[data-a="nubeGen"]');
    const fam=await A.inputValue('#nb-fam');await A.click('#f-nube button[type=submit]');await A.waitForTimeout(1500);
    ok(await A.evaluate(()=>nubeOn()&&!NUBE.err),'el celular A se conecta');
    const B=await celular('B');await B.goto(URL);await B.click('[data-a="nubeOpen"]');
    await B.fill('#nb-paste',`URL: https://prueba.supabase.co\nClave: sb_publishable_prueba_0000000000\nFamilia: ${fam}`);await B.click('#f-nube button[type=submit]');
    await B.waitForSelector('.pcards',{timeout:10000});ok((await B.$$eval('.pcard:not(.addc)',l=>l.length))===4,'el celular B recibe los 4 perfiles');
    await B.click('.pcard >> nth=1');await B.waitForSelector('.rings');await B.click(V('[data-a="fab"]'));await B.fill('#qa-q','chicha morada');await B.waitForTimeout(150);await B.click('#qa-list li:first-child .add');await B.click('[data-a="qaAdd"]');await B.waitForTimeout(2500);
    await A.evaluate(()=>syncNow());await A.waitForTimeout(1000);await A.click('[data-a="closeModal"]').catch(()=>{});await A.click(V('[data-a="tab:familia"]'));
    ok((await A.textContent('.mesa')).includes('Chicha morada'),'A ve en Familia lo que Luis apuntó en B');
    console.log('Recetas, familia y presupuesto');
    await A.click(V('[data-a="tab:recetas"]'));await A.click('#rc-list .rcard >> nth=0');await A.waitForTimeout(150);
    for(let i=0;i<4;i++){const s=`[data-a^="recFam"] >> nth=${i}`;if(await A.$(s)&&await A.getAttribute(s,'aria-pressed')==='false'){await A.click(s);await A.waitForTimeout(60)}}
    ok(/porciones en total/.test(await A.textContent('.sheet')),'cocinar para la familia suma las porciones');
    await A.click('[data-a="closeModal"]');await A.click(V('[data-a="tab:plan"]'));await A.click(V('[data-a="planGen"]'));if(await A.$('[data-a="planGenYes"]'))await A.click('[data-a="planGenYes"]');
    await A.click(V('[data-a="tab:compras"]'));ok((await A.textContent('main')).includes('S/'),'la lista de compras muestra el costo en soles');
    const g=await A.evaluate(()=>{for(let i=27;i>=0;i--){day(addDays(todayISO(),-i),true).c.almuerzo=[{id:uid(),f:'b-arroz-blanco-cocido',n:'Arroz',k:130,p:2.7,c:28,gr:.3,fb:.4,g:1300}]}
      U.pesos=[0,1,2,3,4].map(i=>({d:addDays(todayISO(),-28+i*7),kg:80-i*.5}));U.perfil.kg=78;saveU();actualizarGasto(true);return{real:U.perfil.tdeeReal,ok:estimarGasto(U).ok}});
    ok(g.ok&&g.real>0,'calcula el gasto real con 4 semanas de datos');
    await A.setViewportSize({width:390,height:844});for(const t of ['hoy','plan','recetas']){await A.click(V(`.dock [data-a="tab:${t}"]`));await A.waitForTimeout(120);ok(!(await A.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`sin desborde lateral en el celular (${t})`)}
  }catch(e){fallos++;console.log('  ✗ la prueba se interrumpió: '+e.message.split('\n')[0])}
  ok(!errores.length,'sin errores de JavaScript'+(errores.length?': '+errores.join(' | '):''));
  await b.close();W.close();S.close();
  console.log(fallos?`\n${fallos} comprobación(es) fallaron.`:'\nTodo bien.');process.exit(fallos?1:0);
})();
