"""Descarga lo generado en ElevenLabs a "En proceso/<id>/" con los nombres que espera fabricar.py.
Uso: python3 herramientas/descargar_semana.py
Lee: En proceso/semana1_mapa.json, rondas.json, ses_r1.txt, ses_r2.txt y los JSON de estado en En proceso/status/.
"""
import json, os, re, glob, io, urllib.request
from PIL import Image

EP = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'En proceso')
mapa = json.load(open(os.path.join(EP, 'semana1_mapa.json')))
rondas = json.load(open(os.path.join(EP, 'rondas.json')))

# sesión -> nodo (mismo orden en que se lanzaron)
ses2nodo = {}
for clave, fich in (('r1', 'ses_r1.txt'), ('r2', 'ses_r2.txt')):
    lineas = [l.split() for l in open(os.path.join(EP, fich)) if l.strip()]
    for nodos, ses in zip(rondas[clave], lineas):
        ses2nodo.update(dict(zip(ses, nodos)))

# nodo -> (id, nombre de archivo)
destino = {}
for vid, v in mapa.items():
    destino[v['clip_img']] = (vid, 'escena_01_img.png')
    destino[v['clip']] = (vid, 'escena_01.mp4')
    destino[v['voz']] = (vid, 'voz.mp3')
    for c in v['capas']:
        n = f"{c['n']:02d}"
        destino[c['fondo']] = (vid, f'escena_{n}_fondo.jpg')
        destino[c['pj']] = (vid, f'escena_{n}_pj_original.png')
        destino[c['recorte']] = (vid, f'escena_{n}_personaje.png')

hechos, faltan = 0, set(destino.values())
for f in glob.glob(os.path.join(EP, 'status', '*')):
    for g in json.load(open(f)).get('generations', []):
        url = g.get('content_url')
        if g.get('status') != 'completed' or not url:
            continue
        ses = re.search(r'content_generation/([^/]+)/', url).group(1)
        nodo = ses2nodo.get(ses)
        if nodo not in destino:
            continue
        vid, nombre = destino[nodo]
        ruta = os.path.join(EP, vid, nombre); os.makedirs(os.path.dirname(ruta), exist_ok=True)
        faltan.discard((vid, nombre))
        if os.path.exists(ruta):
            continue
        datos = urllib.request.urlopen(url, timeout=120).read()
        if nombre.endswith('.jpg'):
            Image.open(io.BytesIO(datos)).convert('RGB').save(ruta, quality=93)
        else:
            open(ruta, 'wb').write(datos)
        hechos += 1
print('Descargados:', hechos)
print('Faltan:', len(faltan))
for x in sorted(faltan):
    print('  ', *x)
