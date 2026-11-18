"""Calendario de publicación (YouTube + TikTok) a partir de los guiones y de Largos/*.json.
Uso: python3 herramientas/calendario.py  → CALENDARIO.md (en canal/)"""
import datetime as dt, glob, json, os, re

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
VL = os.path.join(R, 'Vídeos listos')
DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']


def existe(patron):
    fs = glob.glob(os.path.join(VL, patron)); return '✅' if fs else '⏳'


filas = []
for g in sorted(glob.glob(os.path.join(R, 'Guiones', 'S*.md'))):
    t = open(g, encoding='utf-8').read()
    m = re.search(r'^publicar:[ \t]*(\d{4}-\d\d-\d\d) (\d\d:\d\d)', t, re.M)
    vid = re.search(r'^id:[ \t]*(\S+)', t, re.M)
    if not m or not vid or 'EXCLUSIVA' in t: continue
    vid = vid.group(1); tit = t.splitlines()[0].lstrip('# ').strip()
    filas.append((m.group(1), m.group(2), 'Short', vid, tit, f"{existe(vid + ' - *.mp4')} YouTube · {existe('TikTok/' + vid + ' - *.mp4')} TikTok"))
for j in sorted(glob.glob(os.path.join(R, 'Largos', 'L*.json'))):
    c = json.load(open(j)); f, h = c['publicar'].split()
    filas.append((f, '12:00', 'Avance', c['id'], '7 cosas… ¿adivinas la #1? (vertical)', f"{existe(c['id'] + ' - AVANCE vertical.mp4')} YouTube Shorts + TikTok"))
    filas.append((f, h, 'LARGO', c['id'], '7 cosas que (seguro) no sabías — ' + ' · '.join(c['historias']), f"{existe(c['id'] + ' - 7*.mp4')} YouTube (16:9)"))
    filas.append((f, '20:00', 'Recopilatorio', c['id'], 'Las 7 de la semana en vertical', f"{existe('TikTok/RECOPILATORIO*' + c['id'] + '*.mp4')} solo TikTok"))
filas.sort()
hoy = dt.date(2026, 11, 18)
out = ['# 📅 Calendario de publicación — ¿Acaso lo sabías?', '',
       'Horas en tu hora local. **Shorts**: cada día a las 19:00 en YouTube y en TikTok (la versión de la carpeta `TikTok/`). '
       '**Sábados**: avance a las 12:00, vídeo largo a las 18:00 y recopilatorio vertical a las 20:00 solo en TikTok.',
       'Cada vídeo tiene al lado su `youtube.txt` / `tiktok.txt` con título, descripción y hashtags listos para copiar. ✅ = listo · ⏳ = en preparación.', '',
       '| Fecha | Hora | Tipo | Id | Título | Archivos |', '|---|---|---|---|---|---|']
for f, h, tipo, vid, tit, est in filas:
    d = dt.date.fromisoformat(f)
    if d < hoy: continue
    out.append(f"| {DIAS[d.weekday()]} {d.day:02d}/{d.month:02d} | {h} | {'**' + tipo + '**' if tipo == 'LARGO' else tipo} | {vid} | {tit} | {est} |")
open(os.path.join(R, 'CALENDARIO.md'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print(len(filas), 'publicaciones')
