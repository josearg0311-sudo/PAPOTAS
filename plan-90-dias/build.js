// Arma index.html (un solo archivo, funciona sin conexión) a partir de:
//   src.html          → el código de la app
//   recetario.json    → las 254 recetas
//   fichas.json       → ingredientes, pasos y macros de los libros 1 y 2
//   fuentes/*.woff2   → Poppins e Inter, metidas en base64
// Uso:  node build.js
const fs = require('fs'), path = require('path');
const d = (...p) => path.join(__dirname, ...p);
const b64 = f => fs.readFileSync(d('fuentes', f)).toString('base64');
const fuentes = [
  ['Inter', '400 700', 'inter.woff2'],
  ['Poppins', '600', 'poppins-600.woff2'],
  ['Poppins', '700', 'poppins-700.woff2'],
].map(([fam, w, f]) => `@font-face{font-family:'${fam}';font-style:normal;font-weight:${w};font-display:swap;src:url(data:font/woff2;base64,${b64(f)}) format('woff2')}`).join('\n');
const recetario = JSON.stringify(JSON.parse(fs.readFileSync(d('recetario.json'), 'utf8')));
const fichas = JSON.stringify(JSON.parse(fs.readFileSync(d('fichas.json'), 'utf8')));
let html = fs.readFileSync(d('src.html'), 'utf8');
if (!html.includes('/*@FUENTES@*/') || !html.includes('/*@RECETARIO@*/') || !html.includes('/*@FICHAS@*/')) throw new Error('faltan marcadores');
html = html.replace('/*@FUENTES@*/', () => fuentes).replace('/*@RECETARIO@*/', () => recetario).replace('/*@FICHAS@*/', () => fichas);
fs.writeFileSync(d('index.html'), html);
console.log('index.html listo:', (html.length / 1024).toFixed(0), 'KB');
