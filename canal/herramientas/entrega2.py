"""Entrega ordenada por SEMANAS (lunes–domingo), sin tildes en los nombres, con un 'QUE PUBLICAR HOY.txt' por día.
Uso: python3 herramientas/entrega2.py  → canal/Entrega2/ACASO LO SABIAS - MES 1/... y Entrega2/zips/SEMANA N (...).zip"""
import datetime as dt, glob, json, os, re, shutil, unicodedata, zipfile

R = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
VL, TT = os.path.join(R, 'Vídeos listos'), os.path.join(R, 'Vídeos listos', 'TikTok')
OUT = os.path.join(R, 'Entrega2'); RAIZ = os.path.join(OUT, 'ACASO LO SABIAS - MES 1')
DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
MES = ['', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
sin = lambda s: ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def uno(p):
    fs = sorted(glob.glob(p)); return fs[0] if fs else None


def enlazar(src, dst):
    if not src: raise SystemExit(f'FALTA: {dst}')
    try: os.link(src, dst)
    except OSError: shutil.copy2(src, dst)


def leer(p): return open(p, encoding='utf-8').read().strip() if p else ''


plan = {}
for g in sorted(glob.glob(os.path.join(R, 'Guiones', 'S*.md'))):
    t = open(g, encoding='utf-8').read()
    m = re.search(r'^publicar:[ \t]*(\d{4}-\d\d-\d\d)', t, re.M); vid = re.search(r'^id:[ \t]*(\S+)', t, re.M)
    if m and vid and 'EXCLUSIVA' not in t:
        plan.setdefault(m.group(1), []).append(('short', vid.group(1), t.splitlines()[0].lstrip('# ').strip()))
for j in sorted(glob.glob(os.path.join(R, 'Largos', 'L*.json'))):
    c = json.load(open(j)); plan.setdefault(c['publicar'][:10], []).append(('largo', c['id'], c['titulo']))

shutil.rmtree(OUT, ignore_errors=True); os.makedirs(os.path.join(OUT, 'zips'))
fechas = sorted(dt.date.fromisoformat(f) for f in plan)
lunes0 = fechas[0] - dt.timedelta(days=fechas[0].weekday())
semanas = {}
for d in fechas: semanas.setdefault((d - lunes0).days // 7 + 1, []).append(d)
txt_d = lambda d: f'{DIAS[d.weekday()]} {d.day} {MES[d.month]}'
cal = ['ACASO LO SABIAS - CALENDARIO DEL MES 1', '=' * 40, '']
for n, ds in semanas.items():
    sem = f'SEMANA {n} ({ds[0].day} {MES[ds[0].month]} - {ds[-1].day} {MES[ds[-1].month]})'
    cal += ['', sem, '-' * len(sem)]
    for k, d in enumerate(ds, 1):
        car = os.path.join(RAIZ, sem, f'{k} - {txt_d(d)}'); os.makedirs(car)
        hoy = [f'QUE PUBLICAR EL {txt_d(d).upper()} {d.year}', '=' * 44, '']
        for tipo, vid, tit in plan[d.isoformat()]:
            if tipo == 'short':
                enlazar(uno(os.path.join(VL, f'{vid} - *.mp4')), os.path.join(car, 'A - YOUTUBE 19h - video.mp4'))
                enlazar(uno(os.path.join(VL, f'{vid} - portada.jpg')), os.path.join(car, 'A - YOUTUBE 19h - portada.jpg'))
                enlazar(uno(os.path.join(TT, f'{vid} - *.mp4')), os.path.join(car, 'B - TIKTOK 19h - video.mp4'))
                hoy += ['A) YOUTUBE SHORT · 19:00', '------------------------', leer(uno(os.path.join(VL, f'{vid} - youtube.txt'))), '',
                        'B) TIKTOK · 19:00', '-----------------', leer(uno(os.path.join(TT, f'{vid} - tiktok.txt'))).replace(f"'{vid} - portada.jpg'", "'A - YOUTUBE 19h - portada.jpg'"), '']
                cal.append(f'  {txt_d(d):18} 19:00  Short + TikTok · {tit}')
            else:
                enlazar(uno(os.path.join(VL, f'{vid} - AVANCE vertical.mp4')), os.path.join(car, 'A - AVANCE 12h (YouTube y TikTok) - video.mp4'))
                enlazar(uno(os.path.join(VL, f'{vid} - 7*.mp4')), os.path.join(car, 'B - YOUTUBE LARGO 18h - video.mp4'))
                enlazar(uno(os.path.join(VL, f'{vid} - miniatura A.jpg')), os.path.join(car, 'B - YOUTUBE LARGO 18h - miniatura A.jpg'))
                enlazar(uno(os.path.join(VL, f'{vid} - miniatura B.jpg')), os.path.join(car, 'B - YOUTUBE LARGO 18h - miniatura B.jpg'))
                enlazar(uno(os.path.join(TT, f'RECOPILATORIO {vid} - *.mp4')), os.path.join(car, 'C - TIKTOK RECOPILATORIO 20h - video.mp4'))
                hoy += ['A) AVANCE · 12:00 (YouTube Shorts y TikTok)', '-------------------------------------------', leer(uno(os.path.join(VL, f'{vid} - AVANCE.txt'))), '',
                        'B) YOUTUBE VIDEO LARGO · 18:00', '------------------------------', leer(uno(os.path.join(VL, f'{vid} - youtube.txt'))), '',
                        'C) TIKTOK RECOPILATORIO · 20:00', '-------------------------------', leer(uno(os.path.join(TT, f'RECOPILATORIO {vid} - tiktok.txt'))), '']
                cal += [f'  {txt_d(d):18} 12:00  Avance (YouTube Shorts + TikTok)',
                        f'  {"":18} 18:00  VIDEO LARGO YouTube · {tit}',
                        f'  {"":18} 20:00  Recopilatorio TikTok']
        open(os.path.join(car, '0 - QUE PUBLICAR HOY.txt'), 'w', encoding='utf-8-sig', newline='\r\n').write('\n'.join(hoy) + '\n')
leeme = open(os.path.join(R, 'Entrega', '00 LÉEME - cómo subir.txt'), encoding='utf-8').read()
leeme = leeme.replace('Dentro, los archivos están NUMERADOS', 'Dentro, abre primero "0 - QUE PUBLICAR HOY.txt": tiene TODOS los títulos, descripciones y hashtags del día.\nLos archivos están ordenados con letras (A, B, C)')
open(os.path.join(RAIZ, '00 LEEME - como subir.txt'), 'w', encoding='utf-8-sig', newline='\r\n').write(leeme)
open(os.path.join(RAIZ, '00 CALENDARIO.txt'), 'w', encoding='utf-8-sig', newline='\r\n').write('\n'.join(cal) + '\n')
for sem in sorted(os.listdir(RAIZ)):
    p = os.path.join(RAIZ, sem)
    if not os.path.isdir(p): continue
    z = os.path.join(OUT, 'zips', f'{sem}.zip')
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_STORED) as zf:
        for base, _, fs in os.walk(p):
            for f in sorted(fs): zf.write(os.path.join(base, f), os.path.relpath(os.path.join(base, f), RAIZ))
    print(f'{sem:32} {os.path.getsize(z) / 1e6:6.0f} MB')
