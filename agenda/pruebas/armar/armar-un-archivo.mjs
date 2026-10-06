/* ARMA LA AGENDA EN UN SOLO ARCHIVO para publicar.
   index.html queda con TODO adentro (estilos, programa, letras, íconos y
   diccionario): funciona aunque en Netlify se suba solo ese archivo.
   Junto a él van sw.js (sin internet), manifest.webmanifest, iconos/,
   _headers y _redirects, por si se arrastra la carpeta completa.

   Uso (desde la raíz del repo, con esbuild instalado en cualquier lado):
     node agenda/pruebas/armar/armar-un-archivo.mjs <carpeta-salida> [ruta-a-esbuild]
   Luego se comprime la carpeta de salida → agenda5-para-netlify.zip */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SALIDA = path.resolve(process.argv[2] || 'agenda5-un-archivo');
const require = createRequire(import.meta.url);
const esbuild = require(process.argv[3] || 'esbuild');
const leer = (r, enc = 'utf8') => fs.readFileSync(path.join(RAIZ, r), enc);
const datos = (r, tipo) => 'data:' + tipo + ';base64,' + fs.readFileSync(path.join(RAIZ, r)).toString('base64');
const sinCerrarScript = (t) => t.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

/* 1) Estilos, con letras e imágenes adentro */
let css = ['tokens', 'base', 'componentes', 'vistas'].map((n) => leer('css/' + n + '.css')).join('\n');
css = css.replace(/url\('\.\.\/fuentes\/([\w-]+\.woff2)'\)/g, (m, f) => "url('" + datos('fuentes/' + f, 'font/woff2') + "')")
  .replace(/url\('\.\.\/iconos\/([\w-]+\.png)'\)/g, (m, f) => "url('" + datos('iconos/' + f, 'image/png') + "')");
if (/url\('\.\./.test(css)) throw new Error('Quedó una dirección relativa en el CSS');

/* 2) El programa en un solo bloque */
const r = await esbuild.build({ entryPoints: [path.join(RAIZ, 'js/app.js')], bundle: true, format: 'esm', write: false, minify: true, target: 'es2020', legalComments: 'none' });
const js = r.outputFiles[0].text;

/* 3) index.html */
let html = leer('index.html');
const cambiar = (de, a) => { if (!html.includes(de)) throw new Error('No encontré en index.html: ' + de); html = html.replace(de, () => a); };   // con función: el programa trae «$&» y no debe interpretarse
cambiar('<link rel="icon" type="image/svg+xml" href="iconos/icono.svg">', '<link rel="icon" type="image/svg+xml" href="' + datos('iconos/icono.svg', 'image/svg+xml') + '">');
cambiar('<link rel="apple-touch-icon" href="iconos/apple-touch-icon.png">', '<link rel="apple-touch-icon" href="' + datos('iconos/apple-touch-icon.png', 'image/png') + '">');
cambiar('<link rel="preload" href="fuentes/plus-jakarta.woff2" as="font" type="font/woff2" crossorigin>\n', '');
cambiar(/<link rel="stylesheet" href="css\/tokens.css">\n<link rel="stylesheet" href="css\/base.css">\n<link rel="stylesheet" href="css\/componentes.css">\n<link rel="stylesheet" href="css\/vistas.css">/.exec(html)[0], '<style>\n' + css.replace(/<\/style/gi, '<\\/style') + '\n</style>');
cambiar('<script type="module" src="js/app.js"></script>', '<!-- programa: va al final, ver abajo -->');
const dic = leer('diccionario/palabras-es.txt');
cambiar('</body>', '<script type="text/plain" id="diccionario-incluido">' + dic.replace(/</g, '') + '</script>\n<script type="module">\n' + sinCerrarScript(js) + '\n</script>\n</body>');

/* 4) Carpeta de salida */
fs.rmSync(SALIDA, { recursive: true, force: true });
fs.mkdirSync(path.join(SALIDA, 'iconos'), { recursive: true });
fs.writeFileSync(path.join(SALIDA, 'index.html'), html);
for (const f of ['manifest.webmanifest', '_headers', '_redirects']) fs.copyFileSync(path.join(RAIZ, f), path.join(SALIDA, f));
for (const f of fs.readdirSync(path.join(RAIZ, 'iconos'))) fs.copyFileSync(path.join(RAIZ, 'iconos', f), path.join(SALIDA, 'iconos', f));
/* sw.js: solo guarda lo que existe en el paquete */
let sw = leer('sw.js');
const lista = "const ARCHIVOS = [\n  './', './index.html', './manifest.webmanifest',\n  " + fs.readdirSync(path.join(RAIZ, 'iconos')).map((f) => "'./iconos/" + f + "'").join(', ') + '\n];';
sw = sw.replace(/const ARCHIVOS = \[[\s\S]*?\];/, lista);
fs.writeFileSync(path.join(SALIDA, 'sw.js'), sw);
console.log('Listo:', SALIDA, '· index.html', Math.round(html.length / 1024), 'KB · programa', Math.round(js.length / 1024), 'KB');
