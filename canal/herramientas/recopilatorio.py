"""Recopilatorio semanal "EXPRESS" en horizontal (16:9) a partir de los Shorts ya montados. 0 créditos.
Uso: python3 herramientas/recopilatorio.py S10 S07 S08 S11 S06 S09 S01   (orden de la cuenta atrás: #7 … #1)
     añade --vertical para la versión 9:16 de TikTok (va a "Vídeos listos/TikTok/").
Cada Short se recorta: se queda la pregunta "¿Sabías que…?" + la historia, y se quitan
"¿Acaso lo sabías? Pues si no lo sabías…", la pregunta final y el cierre (se dicen una sola vez al final).
"""
import json, os, re, subprocess, sys, glob, tempfile
from PIL import Image, ImageDraw, ImageFont, ImageFilter

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EP, VL, REC = os.path.join(R, 'En proceso'), os.path.join(R, 'Vídeos listos'), os.path.join(R, 'recursos')
VERT = '--vertical' in sys.argv          # versión vertical 9:16 para TikTok
W, H, FPS = (1080, 1920, 30) if VERT else (1920, 1080, 30)
ORO, TINTA, CREMA = '#FFC93C', '#0D0C0B', '#F3E9D2'
TMP = tempfile.mkdtemp(prefix='recop_')


def fuente(peso, tam):
    return ImageFont.truetype(os.path.join(REC, 'fuentes', f'montserrat-latin-{peso}-normal.woff'), tam)


def guion(vid):
    g = open(glob.glob(os.path.join(R, 'Guiones', vid + '_*.md'))[0], encoding='utf-8').read()
    campo = lambda k: (re.search(rf'^{k}:[ \t]*(.*)$', g, re.M) or [None, ''])[1].strip()
    return {'serie': campo('serie'), 'color': campo('color') or ORO, 'lugar': campo('lugar'), 'mini': campo('miniatura')}


def cortes(vid):
    """(inicio, fin) de los trozos a conservar, según las palabras de Whisper."""
    w = json.load(open(os.path.join(EP, vid, 'whisper.json')))
    txt = [x['w'] for x in w]
    q = next(i for i, t in enumerate(txt) if t.endswith('?'))                       # fin de "¿Sabías que …?"
    c = next(i for i, t in enumerate(txt) if t.lower().strip('.,…') == 'cuento')     # "… ahora te lo cuento."
    e = max(i for i, t in enumerate(txt) if t.lower().strip('¿?¡!.,…') == 'esto')                    # cierre "Esto es…"
    ult_q = max(i for i in range(c, e) if txt[i].endswith('?'))                      # pregunta final al público
    fin = next(i for i in range(ult_q, c, -1)
               if re.search(r'[.!]$', txt[i]) and not re.search(r'(\.\.\.|…)$', txt[i]))
    return [(0, w[q]['e'] + 0.25), (w[c]['e'] + 0.15, w[fin]['e'] + 0.35)]


def texto_centrado(d, y, s, f, color, ancho=W):
    x = (ancho - d.textlength(s, font=f)) / 2; d.text((x, y), s, font=f, fill=color)


def envolver(d, s, f, maxw):
    lineas, l = [], ''
    for p in s.split():
        if d.textlength((l + ' ' + p).strip(), font=f) <= maxw: l = (l + ' ' + p).strip()
        else: lineas.append(l); l = p
    return [x for x in lineas + [l] if x]


def lateral(n, info):
    """Capa transparente con el número a la izquierda y el título/lugar a la derecha."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    # izquierda: número gigante + serie
    d.text((90, 250), f'#{n}', font=fuente(900, 260), fill=ORO, stroke_width=6, stroke_fill=TINTA)
    tam = 34
    while d.textlength(info['serie'], font=fuente(800, tam)) > 500: tam -= 2
    fs = fuente(800, tam); sy = 590
    d.rectangle((96, sy, 96 + d.textlength(info['serie'], font=fs) + 30, sy + 56), fill=TINTA)
    d.rectangle((96, sy + 56, 96 + d.textlength(info['serie'], font=fs) + 30, sy + 62), fill=info['color'])
    d.text((111, sy + 9), info['serie'], font=fs, fill=CREMA)
    # derecha: título (miniatura) y lugar
    x0, maxw = 1300, 540
    a, b = (info['mini'].split('|') + [''])[:2]
    y = 330
    for l in envolver(d, a.strip(), fuente(800, 52), maxw):
        d.text((x0, y), l, font=fuente(800, 52), fill=CREMA, stroke_width=4, stroke_fill=TINTA); y += 64
    tb = 96
    while max([d.textlength(p, font=fuente(900, tb)) for p in b.split()] or [0]) > maxw: tb -= 4
    for l in envolver(d, b.strip(), fuente(900, tb), maxw):
        d.text((x0, y), l, font=fuente(900, tb), fill=ORO, stroke_width=5, stroke_fill=TINTA); y += tb + 12
    if info['lugar'].strip():
        lug, fecha = (info['lugar'].split('|') + [''])[:2]
        y += 30; d.rectangle((x0, y, x0 + 6, y + 92), fill=ORO)
        d.text((x0 + 24, y), lug.strip(), font=fuente(800, 32), fill=CREMA, stroke_width=3, stroke_fill=TINTA)
        d.text((x0 + 24, y + 50), fecha.strip(), font=fuente(800, 28), fill=ORO, stroke_width=3, stroke_fill=TINTA)
    # marco del panel central
    pw = round((H - 44) * 1080 / 1920); px = (W - pw) // 2
    d.rounded_rectangle((px - 8, 22, px + pw + 8, H - 22), radius=26, outline=ORO, width=6)
    return im


def tarjeta(nombre, lineas, fondo=None):
    """Imagen de rótulo a pantalla completa (intro, separador, cierre)."""
    if fondo:
        im = Image.open(fondo).convert('RGB').resize((W, int(W * fondo_ratio(fondo)))).crop((0, 0, W, H))
        im = im.filter(ImageFilter.GaussianBlur(28)).point(lambda v: int(v * 0.35))
    else:
        im = Image.new('RGB', (W, H), TINTA)
    d = ImageDraw.Draw(im)
    alto = sum(f.size + 24 for _, f, _ in lineas); y = (H - alto) / 2
    lineas = [(l, f, c) for s, f, c in lineas for l in (envolver(d, s, f, W - 140) or [''])]
    alto = sum(f.size + 24 for _, f, _ in lineas); y = (H - alto) / 2
    for s, f, c in lineas:
        texto_centrado(d, y, s, f, c); y += f.size + 24
    logo = Image.open(os.path.join(REC, 'logo.png')).convert('RGBA'); logo.thumbnail((150, 150))
    im.paste(logo, (W - 190, 40), logo)
    ruta = os.path.join(TMP, nombre + '.png'); im.save(ruta); return ruta


def fondo_ratio(p):
    a = Image.open(p); return a.height / a.width


def ff(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


ENC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', str(FPS),
       '-c:a', 'aac', '-ar', '44100', '-ac', '2', '-b:a', '192k']


def clip_tarjeta(png, dur, salida, musica_desde=0.0):
    ff('-loop', '1', '-t', str(dur), '-i', png, '-ss', str(musica_desde), '-t', str(dur), '-i', os.path.join(REC, 'musica.mp3'),
       '-filter_complex', f"[0:v]scale={W}:{H},zoompan=z='1+0.0006*on':d=1:s={W}x{H}:fps={FPS},fade=t=in:d=0.25,fade=t=out:st={dur-0.25}:d=0.25[v];"
       f"[1:a]volume=0.55,afade=t=in:d=0.3,afade=t=out:st={dur-0.4}:d=0.4[a]", '-map', '[v]', '-map', '[a]', *ENC, '-shortest', salida)


def insignia(n):
    """Vertical: etiqueta "#N" bajo el logo del Short."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); f = fuente(900, 72)
    w = d.textlength(f'#{n}', font=f)
    d.rounded_rectangle((34, 150, 34 + w + 56, 150 + 104), radius=26, fill=ORO, outline=TINTA, width=5)
    d.text((62, 202), f'#{n}', font=f, fill=TINTA, anchor='lm')
    return im


def segmento(vid, n, salida):
    mp4 = glob.glob(os.path.join(VL, vid + ' - *.mp4'))[0]
    capa = os.path.join(TMP, f'lat_{vid}.png'); (insignia(n) if VERT else lateral(n, guion(vid))).save(capa)
    vf = ("[0:v][1:v]overlay=0:0," if VERT else
          f"[0:v]split[a][b];[a]scale={W}:-2,crop={W}:{H},boxblur=40:3,eq=brightness=-0.28:saturation=0.8[bg];"
          f"[b]scale=-2:{H-44}[fg];[bg][fg]overlay=(W-w)/2:22[m];[m][1:v]overlay=0:0,")
    trozos = []
    for k, (a, b) in enumerate(cortes(vid)):
        t = os.path.join(TMP, f'{vid}_{k}.mp4'); d = b - a
        ff('-ss', f'{a:.2f}', '-t', f'{d:.2f}', '-i', mp4, '-i', capa, '-filter_complex',
           vf + f"fade=t=in:d=0.2,fade=t=out:st={d-0.2:.2f}:d=0.2[v];"
           f"[0:a]afade=t=in:d=0.08,afade=t=out:st={d-0.12:.2f}:d=0.12[au]",
           '-map', '[v]', '-map', '[au]', *ENC, t)
        trozos.append(t)
    unir(trozos, salida)


def unir(partes, salida):
    lista = os.path.join(TMP, os.path.basename(salida) + '.txt')
    open(lista, 'w').write(''.join(f"file '{p}'\n" for p in partes))
    ff('-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', salida)


def main(ids):
    n = len(ids); partes = []
    f9, f8 = fuente(900, 120), fuente(800, 54)
    portada = glob.glob(os.path.join(EP, ids[-1], 'escena_02_fondo.jpg'))[0]
    intro = tarjeta('intro', [(f'{n} COSAS QUE', f8, CREMA), ('(SEGURO)', f8, CREMA), ('NO SABÍAS', f9, ORO),
                              ('Y la número 1 es la más increíble…', fuente(800, 40), CREMA)], portada)
    p = os.path.join(TMP, 'p_intro.mp4'); clip_tarjeta(intro, 4.5, p); partes.append(p)
    for i, vid in enumerate(ids):
        num = n - i; info = guion(vid)
        a, b = (info['mini'].split('|') + [''])[:2]
        sep = tarjeta(f'sep_{vid}', [(f'#{num}', fuente(900, 220), ORO), (info['serie'], fuente(800, 40), info['color']),
                                     (f'{a.strip()} {b.strip()}'.strip(), fuente(900, 70), CREMA)],
                      os.path.join(EP, vid, 'escena_02_fondo.jpg'))
        p = os.path.join(TMP, f'p_sep_{vid}.mp4'); clip_tarjeta(sep, 2.2, p, musica_desde=10 + i * 7); partes.append(p)
        p = os.path.join(TMP, f'p_seg_{vid}.mp4'); segmento(vid, num, p); partes.append(p)
        print('ok', f'#{num}', vid, flush=True)
    cierre = tarjeta('cierre', [('¿CUÁL TE SORPRENDIÓ MÁS?', fuente(900, 84), ORO), ('Déjame el número en los comentarios', f8, CREMA),
                                ('', f8, CREMA), ('SÍGUEME PARA MÁS' if VERT else 'SUSCRÍBETE PARA MÁS', fuente(900, 60), CREMA)], portada)
    p = os.path.join(TMP, 'p_cierre.mp4'); clip_tarjeta(cierre, 5, p, musica_desde=60); partes.append(p)
    etq = next((a.split('=', 1)[1] + ' ' for a in sys.argv if a.startswith('--id=')), '')
    salida = (os.path.join(VL, 'TikTok', f'RECOPILATORIO {etq}- {n} cosas que (seguro) no sabías.mp4') if VERT
              else os.path.join(VL, f'PRUEBA EXPRESS - {n} cosas que (seguro) no sabías.mp4'))
    unir(partes, salida)
    print('✅', salida)


if __name__ == '__main__':
    main([a for a in sys.argv[1:] if not a.startswith('--')] or ['S10', 'S07', 'S08', 'S11', 'S06', 'S09', 'S01'])
