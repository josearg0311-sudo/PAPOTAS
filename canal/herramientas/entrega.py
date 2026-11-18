"""Organiza la entrega en carpetas por DÍA DE PUBLICACIÓN y crea un .zip por día.
Uso: python3 herramientas/entrega.py [desde=2026-11-26]
→ canal/Entrega/<AAAA-MM-DD día>/ (archivos numerados por orden de subida) y canal/Entrega/zips/<misma carpeta>.zip"""
import datetime as dt, glob, json, os, re, shutil, sys, zipfile

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VL, ENT = os.path.join(R, 'Vídeos listos'), os.path.join(R, 'Entrega')
TT = os.path.join(VL, 'TikTok')
DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
desde = dt.date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else dt.date(2026, 11, 26)


def uno(patron):
    fs = sorted(f for f in glob.glob(patron) if not f.endswith('.part'))
    return fs[0] if fs else None


def poner(carpeta, origen, nombre):
    if not origen: return False
    dst = os.path.join(carpeta, nombre)
    if os.path.exists(dst): os.remove(dst)
    try: os.link(origen, dst)
    except OSError: shutil.copy2(origen, dst)
    return True


plan = {}  # fecha -> lista de (hora, tipo, id)
for g in sorted(glob.glob(os.path.join(R, 'Guiones', 'S*.md'))):
    t = open(g, encoding='utf-8').read()
    m = re.search(r'^publicar:[ \t]*(\d{4}-\d\d-\d\d) (\d\d:\d\d)', t, re.M); vid = re.search(r'^id:[ \t]*(\S+)', t, re.M)
    if m and vid and 'EXCLUSIVA' not in t: plan.setdefault(m.group(1), []).append((m.group(2), 'short', vid.group(1)))
for j in sorted(glob.glob(os.path.join(R, 'Largos', 'L*.json'))):
    c = json.load(open(j)); f = c['publicar'].split()[0]
    plan.setdefault(f, []).append(('18:00', 'largo', c['id']))

os.makedirs(os.path.join(ENT, 'zips'), exist_ok=True)
resumen, faltan = [], []
for f in sorted(plan):
    d = dt.date.fromisoformat(f)
    if d < desde: continue
    nom = f'{f} {DIAS[d.weekday()]}'
    car = os.path.join(ENT, nom); shutil.rmtree(car, ignore_errors=True); os.makedirs(car)
    hechos = []
    for hora, tipo, vid in sorted(plan[f]):
        if tipo == 'short':
            ok = [poner(car, uno(os.path.join(VL, f'{vid} - *.mp4')), f'1 YOUTUBE 19-00 - {vid} - VIDEO.mp4'),
                  poner(car, uno(os.path.join(VL, f'{vid} - portada.jpg')), f'1 YOUTUBE 19-00 - {vid} - portada.jpg'),
                  poner(car, uno(os.path.join(VL, f'{vid} - youtube.txt')), f'1 YOUTUBE 19-00 - {vid} - textos.txt'),
                  poner(car, uno(os.path.join(TT, f'{vid} - *.mp4')), f'2 TIKTOK 19-00 - {vid} - VIDEO.mp4'),
                  poner(car, uno(os.path.join(TT, f'{vid} - tiktok.txt')), f'2 TIKTOK 19-00 - {vid} - textos.txt')]
            hechos.append(f'Short {vid}')
        else:
            ok = [poner(car, uno(os.path.join(VL, f'{vid} - AVANCE vertical.mp4')), f'1 AVANCE 12-00 (YouTube Shorts y TikTok) - VIDEO.mp4'),
                  poner(car, uno(os.path.join(VL, f'{vid} - AVANCE.txt')), f'1 AVANCE 12-00 (YouTube Shorts y TikTok) - textos.txt'),
                  poner(car, uno(os.path.join(VL, f'{vid} - 7*.mp4')), f'2 YOUTUBE LARGO 18-00 - {vid} - VIDEO.mp4'),
                  poner(car, uno(os.path.join(VL, f'{vid} - miniatura A.jpg')), f'2 YOUTUBE LARGO 18-00 - {vid} - miniatura A.jpg'),
                  poner(car, uno(os.path.join(VL, f'{vid} - miniatura B.jpg')), f'2 YOUTUBE LARGO 18-00 - {vid} - miniatura B.jpg'),
                  poner(car, uno(os.path.join(VL, f'{vid} - youtube.txt')), f'2 YOUTUBE LARGO 18-00 - {vid} - textos.txt'),
                  poner(car, uno(os.path.join(TT, f'RECOPILATORIO {vid} - *.mp4')), f'3 TIKTOK RECOPILATORIO 20-00 - VIDEO.mp4'),
                  poner(car, uno(os.path.join(TT, f'RECOPILATORIO {vid} - tiktok.txt')), f'3 TIKTOK RECOPILATORIO 20-00 - textos.txt')]
            hechos.append(f'Largo {vid} + avance + recopilatorio')
        if not all(ok): faltan.append(f'{nom}: {vid}')
    z = os.path.join(ENT, 'zips', nom + '.zip')
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_STORED) as zf:
        for a in sorted(os.listdir(car)): zf.write(os.path.join(car, a), os.path.join(nom, a))
    resumen.append((nom, ', '.join(hechos), os.path.getsize(z) / 1e6))
for n, h, mb in resumen: print(f'{n:22} {mb:6.0f} MB  {h}')
print('FALTAN:', faltan or 'nada')
