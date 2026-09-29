#!/usr/bin/env python3
"""Arma la agenda en dos versiones a partir de fuente/:

    python3 agenda/construir.py

  index.html            La LIGERA, para la dirección web (GitHub Pages).
                        Los iconos, la tipografía y el logo van en archivos
                        aparte al lado (icon-*.png, jakarta.woff2, icono.svg):
                        el celular los guarda una vez y cada apertura baja
                        mucho menos. Necesita esos archivos al lado.
  agenda-completa.html  La de UN SOLO ARCHIVO: todo dentro (iconos, letra,
                        logo). Sirve para abrirla o compartirla suelta.

En las dos, el Libro de Cuentas (../libro-de-cuentas/index.html) va dentro
comprimido con gzip y en base64; la agenda lo descomprime al abrir un libro.
Si cambias Cuentas, vuelve a ejecutar esto y la agenda lo lleva.
"""
import base64, gzip, json, os, re, shutil, subprocess, tempfile, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
def leer(p, modo='r'):
    with open(os.path.join(AQUI, p), modo) as f:
        return f.read()
def b64(p):
    return base64.b64encode(leer(p, 'rb')).decode()

css    = leer('fuente/estilo.css')
cuerpo = leer('fuente/cuerpo.html')
app    = leer('fuente/app.js')
svg    = leer('icono.svg')
cuentas = base64.b64encode(gzip.compress(leer('../libro-de-cuentas/index.html', 'rb'), 9, mtime=0)).decode()

# La tipografía va también suelta al lado, para la versión ligera
for f in ('jakarta.woff2', 'fraunces.woff2', 'caveat.woff2'):
    shutil.copyfile(os.path.join(AQUI, 'fuente', f), os.path.join(AQUI, f))

# Achicar el código de la versión ligera si hay terser a mano (npx terser o
# la variable TERSER). Si no, va tal cual: funciona igual, solo pesa más.
def terser_bin():
    t = os.environ.get('TERSER') or shutil.which('terser')
    return [t] if t else None
def achicar_js(js):
    t = terser_bin()
    if not t:
        return js
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(js); ruta = f.name
    try:
        r = subprocess.run(t + [ruta, '--compress', 'passes=2', '--mangle', '--ecma', '2017'], capture_output=True, text=True, timeout=180)
        return r.stdout if r.returncode == 0 and len(r.stdout) > 1000 else js
    finally:
        os.unlink(ruta)
def achicar_css(c):
    c = re.sub(r'/\*.*?\*/', '', c, flags=re.S)
    c = re.sub(r'\n\s*', '\n', c)
    return re.sub(r'\n+', '\n', c).strip() + '\n'

app_ligera = achicar_js(app)
css_ligera = achicar_css(css)

def armar(completa):
    js_app = app if completa else app_ligera
    hoja = css if completa else css_ligera
    if completa:
        png192  = 'data:image/png;base64,' + b64('icon-192.png')
        png512  = 'data:image/png;base64,' + b64('icon-512.png')
        mask512 = 'data:image/png;base64,' + b64('icon-maskable-512.png')
        apple   = 'data:image/png;base64,' + b64('apple-touch-icon.png')
        favicon = 'data:image/svg+xml,' + urllib.parse.quote(' '.join(svg.split()), safe=' =:/";,')
        letra   = 'data:font/woff2;base64,' + b64('fuente/jakarta.woff2')
        serif   = 'data:font/woff2;base64,' + b64('fuente/fraunces.woff2')
        mano    = 'data:font/woff2;base64,' + b64('fuente/caveat.woff2')
        logo    = 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode()
        # Iconos del manifiesto: tal cual (son data:)
        iconos_js = json.dumps([
            {"src": png192,  "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": png512,  "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": mask512, "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ])
        icono_aviso = png192
        letra_js = json.dumps(letra)
        serif_js = json.dumps(serif)
    else:
        apple, favicon, letra, logo = 'apple-touch-icon.png', 'icono.svg', 'jakarta.woff2', 'icono.svg'
        serif = 'fraunces.woff2'
        mano = 'caveat.woff2'
        # Iconos del manifiesto: archivos al lado, con la dirección completa
        iconos_js = ('[{src:base+carpeta+"icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},'
                     '{src:base+carpeta+"icon-512.png",sizes:"512x512",type:"image/png",purpose:"any"},'
                     '{src:base+carpeta+"icon-maskable-512.png",sizes:"512x512",type:"image/png",purpose:"maskable"}]')
        icono_aviso = 'icon-192.png'
        letra_js = 'new URL("jakarta.woff2", location.href).href'
        serif_js = 'new URL("fraunces.woff2", location.href).href'

    cabeza = f'''<!DOCTYPE html>
<html lang="es" data-tema="oscuro" data-paleta="brasa">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#121110">
<meta name="color-scheme" content="dark light">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Agenda">
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="Agenda">
<meta name="format-detection" content="telephone=no">
<meta name="description" content="Agenda personal: tareas, listas, calendario, recordatorios, hábitos, metas, diario, pagos, notas y cuentas.">
<link rel="icon" type="image/svg+xml" href="{favicon}">
<link rel="apple-touch-icon" href="{apple}">
{'' if completa else '<link rel="preload" href="jakarta.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="fraunces.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="caveat.woff2" as="font" type="font/woff2" crossorigin>'}
<title>Agenda</title>
<script>
/* Tema y paleta ANTES de pintar nada (claves propias de la agenda), y el
   manifiesto generado aquí mismo: arranca en ESTA página se llame como se
   llame el archivo, y lleva el logo. Sin él Android no ofrece instalar. */
(function(){{
  try{{
    var t = localStorage.getItem('agenda_tema');
    var p = localStorage.getItem('agenda_paleta');
    if(t === 'claro') document.documentElement.setAttribute('data-tema','claro');
    if(/^(brasa|jade|ciruela|grafito)$/.test(p || '')) document.documentElement.setAttribute('data-paleta', p);
  }}catch(e){{}}
  try{{
    var aqui = location.pathname || './';
    var carpeta = aqui.replace(/[^\\/]*$/, '');
    var base = location.origin && location.origin !== 'null' ? location.origin : '';
    var m = {{
      name:'Agenda · Mi organización', short_name:'Agenda',
      description:'Tareas, listas, calendario, recordatorios, hábitos, metas, diario, pagos, notas y cuentas.',
      start_url: base + aqui, id: base + aqui, scope: base + carpeta,
      display:'standalone', orientation:'any', lang:'es',
      background_color:'#121110', theme_color:'#121110',
      categories:['productivity','lifestyle','finance'],
      icons:{iconos_js},
      shortcuts:[
        {{ name:'Tareas',     url: base + aqui + '#tareas' }},
        {{ name:'Calendario', url: base + aqui + '#calendario' }},
        {{ name:'Gastos personales', url: base + aqui + '#personal' }},
        {{ name:'Oficina',    url: base + aqui + '#oficina' }}
      ]
    }};
    var txt = JSON.stringify(m), h;
    try{{ h = URL.createObjectURL(new Blob([txt], {{ type:'application/manifest+json' }})); }}
    catch(_){{ h = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(txt); }}
    var l = document.createElement('link'); l.rel = 'manifest'; l.href = h;
    document.head.appendChild(l);
  }}catch(e){{}}
  window.ICONO_AGENDA = '{icono_aviso}';
  window.FUENTE_AGENDA = {letra_js};
  window.SERIF_AGENDA = {serif_js};
}})();
</script>
'''
    logo_css = ':root{ --logo:url("' + logo + '") }\n'
    # Tipografía Plus Jakarta Sans (licencia OFL). Una sola fuente variable
    # cubre todos los grosores.
    logo_css += ("@font-face{ font-family:'Jakarta'; src:url(" + letra +
                 ") format('woff2'); font-weight:200 800; font-display:swap }\n")
    # Fraunces (licencia OFL) para los títulos y las cifras grandes
    logo_css += ("@font-face{ font-family:'Fraunces'; src:url(" + serif +
                 ") format('woff2'); font-weight:400 700; font-display:swap }\n")
    # Caveat (licencia OFL): letra a mano para los toques personales
    logo_css += ("@font-face{ font-family:'Caveat'; src:url(" + mano +
                 ") format('woff2'); font-weight:500 700; font-display:swap }\n")
    return (cabeza + '<style>\n' + logo_css + hoja + '</style>\n</head>\n<body>\n' + cuerpo +
            '\n<!-- El Libro de Cuentas entero, comprimido (gzip + base64); se abre en Dinero -->\n'
            '<script type="application/octet-stream" id="fuenteCuentas" data-gz="1">' + cuentas + '</script>\n'
            '<script>\n' + js_app + '</script>\n</body>\n</html>\n')

for nombre, completa in (('index.html', False), ('agenda-completa.html', True)):
    html = armar(completa)
    with open(os.path.join(AQUI, nombre), 'w') as f:
        f.write(html)
    print(nombre + ':', len(html.encode()) // 1024, 'KB', '· comprimido', len(gzip.compress(html.encode(), 6)) // 1024, 'KB')
