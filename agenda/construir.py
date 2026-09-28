#!/usr/bin/env python3
"""Arma agenda/index.html: UN solo archivo con todo dentro.

    python3 agenda/construir.py

Junta fuente/estilo.css, fuente/cuerpo.html y fuente/app.js, mete los iconos
como data: (así el logo sale al instalar aunque subas solo el index), el
manifiesto se genera al vuelo dentro de la página, y el Libro de Cuentas
(../libro-de-cuentas/index.html) va entero en base64. Si cambias Cuentas,
vuelve a ejecutar esto y la agenda lo lleva.
"""
import base64, json, os, urllib.parse

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
cuentas = base64.b64encode(leer('../libro-de-cuentas/index.html', 'rb')).decode()

png192  = 'data:image/png;base64,' + b64('icon-192.png')
png512  = 'data:image/png;base64,' + b64('icon-512.png')
mask512 = 'data:image/png;base64,' + b64('icon-maskable-512.png')
apple   = 'data:image/png;base64,' + b64('apple-touch-icon.png')
svguri  = 'data:image/svg+xml,' + urllib.parse.quote(' '.join(svg.split()), safe=' =:/";,')

iconos = json.dumps([
    {"src": png192,  "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": png512,  "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": mask512, "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
])

fuente_datos = 'data:font/woff2;base64,' + b64('fuente/jakarta.woff2')
cabeza = f'''<!DOCTYPE html>
<html lang="es" data-tema="oscuro" data-paleta="medianoche">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0A0D14">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Agenda">
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="Agenda">
<meta name="description" content="Agenda personal: tareas, listas, calendario, recordatorios, hábitos, metas, diario, pagos, notas y cuentas.">
<!-- Los iconos van METIDOS en el archivo: así el logo sale al instalarla
     aunque subas solo este index, sin nada al lado. -->
<link rel="icon" type="image/svg+xml" href="{svguri}">
<link rel="apple-touch-icon" href="{apple}">
<title>Agenda</title>
<script>
/* Tema y paleta ANTES de pintar nada (las mismas claves que Cuentas), y el
   manifiesto generado aquí mismo: arranca en ESTA página se llame como se
   llame el archivo, y lleva el logo dentro. Sin él Android no ofrece
   instalar ni pone el icono. */
(function(){{
  try{{
    var t = localStorage.getItem('libro_cuentas_tema');
    var p = localStorage.getItem('cuentas_paleta');
    if(t === 'claro') document.documentElement.setAttribute('data-tema','claro');
    if(p) document.documentElement.setAttribute('data-paleta', p);
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
      background_color:'#0A0D14', theme_color:'#0A0D14',
      categories:['productivity','lifestyle','finance'],
      icons:{iconos},
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
  window.ICONO_AGENDA = '{png192}';
  window.FUENTE_AGENDA = '{fuente_datos}';
}})();
</script>
'''

logo_css = ':root{ --logo:url("' + 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode()).decode() + '") }\n'
# Tipografía Plus Jakarta Sans (licencia OFL), metida en el archivo para que
# se vea igual sin internet. Una sola fuente variable cubre todos los grosores.
fuente_b64 = b64('fuente/jakarta.woff2')
logo_css += ("@font-face{ font-family:'Jakarta'; src:url(data:font/woff2;base64," + fuente_b64 +
             ") format('woff2'); font-weight:200 800; font-display:swap }\n")
html = (cabeza + '<style>\n' + logo_css + css + '</style>\n</head>\n<body>\n' + cuerpo +
        '\n<!-- El Libro de Cuentas entero, en base64 (se abre en la sección Cuentas) -->\n'
        '<script type="application/octet-stream" id="fuenteCuentas">' + cuentas + '</script>\n'
        '<script>\n' + app + '</script>\n</body>\n</html>\n')
with open(os.path.join(AQUI, 'index.html'), 'w') as f:
    f.write(html)
print('index.html:', len(html.encode()) // 1024, 'KB')
