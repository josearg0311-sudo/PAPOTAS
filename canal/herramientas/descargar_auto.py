"""Descarga lo generado en ElevenLabs para un mapa de nodos (p. ej. En proceso/mes1_mapa.json).
Encuentra solo qué sesión corresponde a cada nodo y su enlace de descarga leyendo el registro de la sesión
de Claude (.jsonl) y los resultados guardados (tool-results/*.txt).
Uso: python3 herramientas/descargar_auto.py "En proceso/mes1_mapa.json"
"""
import glob, io, json, os, re, sys, urllib.request
from PIL import Image

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EP = os.path.join(R, 'En proceso')
LOGS = glob.glob('/root/.claude/projects/-home-user-PAPOTAS/*.jsonl') + \
       glob.glob('/root/.claude/projects/-home-user-PAPOTAS/*/tool-results/*.txt')

mapa = json.load(open(sys.argv[1]))
destino = {}
for nodo, rel in mapa.pop('archivos', {}).items():   # formato libre: {"archivos": {nodo: "S10/ancho_02.jpg"}}
    destino[nodo] = tuple(rel.split('/', 1))
for vid, v in mapa.items():
    if v.get('clip_img'): destino[v['clip_img']] = (vid, 'escena_01_img.png')
    if v.get('clip'): destino[v['clip']] = (vid, 'escena_01.mp4')
    if v.get('voz'): destino[v['voz']] = (vid, 'voz.mp3')
    for c in v.get('capas', []):
        n = f"{c['n']:02d}"
        destino[c['fondo']] = (vid, f'escena_{n}_fondo.jpg')
        destino[c['pj']] = (vid, f'escena_{n}_pj_original.png')
        destino[c['recorte']] = (vid, f'escena_{n}_personaje.png')

ses2nodo, ses2url = {}, {}
pat_run = re.compile(r'\\?"node_id\\?":\\?"([A-Za-z0-9]{20})\\?",\\?"session_id\\?":\\?"([A-Za-z0-9]{20})\\?"')
pat_url = re.compile(r'(https://elevenlabsusercontent\.com/database/workspace/[0-9a-f]+/content_generation/([A-Za-z0-9]{20})/[A-Za-z0-9]{20}/content\.(?:png|jpg|webp|mp4|mp3|wav)\?Expires=\d+&KeyName=[\w-]+&Signature=[A-Za-z0-9_=-]+)')
for f in LOGS:
    try: txt = open(f, encoding='utf-8', errors='ignore').read()
    except Exception: continue
    for n, s in pat_run.findall(txt):
        if n in destino: ses2nodo[s] = n          # la última ejecución gana
    for u, s in pat_url.findall(txt):
        ses2url[s] = u
# la última sesión lanzada para cada nodo
nodo2ses = {}
for s, n in ses2nodo.items(): nodo2ses[n] = s

hechos, faltan = 0, []
for nodo, (vid, nombre) in destino.items():
    ruta = os.path.join(EP, vid, nombre)
    if os.path.exists(ruta): continue
    s = nodo2ses.get(nodo); u = ses2url.get(s) if s else None
    if not u: faltan.append((vid, nombre, 'sin lanzar' if not s else 'sin terminar')); continue
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    try:
        datos = urllib.request.urlopen(u, timeout=120).read()
    except Exception as e:
        faltan.append((vid, nombre, f'error {e}')); continue
    if nombre.endswith('.jpg'): Image.open(io.BytesIO(datos)).convert('RGB').save(ruta, quality=93)
    else: open(ruta, 'wb').write(datos)
    hechos += 1
print('Descargados:', hechos, '· Faltan:', len(faltan))
from collections import Counter
print(Counter(x[2] for x in faltan))
listos = [vid for vid in mapa if all(os.path.exists(os.path.join(EP, v, n)) for k, (v, n) in destino.items() if v == vid)]
print('Shorts completos:', ' '.join(listos))
