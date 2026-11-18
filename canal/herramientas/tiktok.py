"""Versión TikTok de Shorts ya montados (0 créditos): cambia "SUSCRÍBETE" por "SÍGUEME" en el cierre
y crea "<id> - tiktok.txt" con texto, hashtags y checklist.
Uso: python3 herramientas/tiktok.py S01 S07 …   (sin argumentos: todos los que tengan youtube.txt)
"""
import glob, json, os, re, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EP, VL, REC = os.path.join(R, 'En proceso'), os.path.join(R, 'Vídeos listos'), os.path.join(R, 'recursos')
OUT = os.path.join(VL, 'TikTok'); os.makedirs(OUT, exist_ok=True)
ORO, TINTA = '#FFC93C', '#0D0C0B'
PX, PY, PW, PH = 290, 1500, 500, 120          # botón del cierre (render_marca.js: centro 540,1560 · 500×120)
MX, MY, MW, MH = 250, 1470, 580, 180          # zona que se limpia (cubre el rebote de la animación)
HASH = {'ANIMALES EXTREMOS': '#animales #naturaleza #ciencia', 'MISTERIOS SIN RESOLVER': '#misterio #misterios #historia',
        'HISTORIAS QUE PARECEN MENTIRA': '#historia #historiareal #historias', 'TU CUERPO ES INCREÍBLE': '#cuerpohumano #ciencia #salud',
        'ESTRENO': '#historia #titanic #historiareal'}


def boton(ruta):
    im = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, PW - 1, PH - 1), radius=60, fill=ORO)
    f = ImageFont.truetype(os.path.join(REC, 'fuentes', 'montserrat-latin-900-normal.woff'), 54)
    s = 'SÍGUEME'; w = d.textlength(s, font=f); d.text(((PW - w) / 2, PH / 2 + 4), s, font=f, fill=TINTA, anchor='lm')
    im.save(ruta)


def ficha(vid, yt, serie):
    txt = open(yt, encoding='utf-8').read()
    sec = lambda k: (re.search(rf'{k}:\n(.*?)(?:\n\n|\Z)', txt, re.S) or [None, ''])[1].strip()
    pub = re.search(r'PUBLICAR: (.*)', txt).group(1)
    titulo, desc, com = sec('TÍTULO'), sec('DESCRIPCIÓN').split('\n')[0], sec('COMENTARIO FIJADO')
    gancho = desc.split('¿Acaso lo sabías?')[0].strip()
    tags = f"{HASH.get(serie, '#historia')} #datoscuriosos #curiosidades #sabiasque #acasolosabias #fyp #parati"
    return (f"PUBLICAR: {pub}  (en TikTok funciona bien entre 19:00 y 21:00)\n\n"
            f"TEXTO DE LA PUBLICACIÓN (copiar y pegar):\n{titulo}\n{gancho}\n{com}\n\n{tags}\n\n"
            f"PORTADA: elige el fotograma con el título o sube '{vid} - portada.jpg' (si tu app lo permite).\n\n"
            "CHECKLIST: subir vídeo · pegar texto · portada · activar 'Contenido generado por IA' (Más opciones) · "
            "comentarios activados · publicar o programar · (al publicarse) fijar un comentario con la pregunta\n")


def hacer(vid):
    yt = os.path.join(VL, f'{vid} - youtube.txt'); mp4 = glob.glob(os.path.join(VL, f'{vid} - *.mp4'))[0]
    tl = json.load(open(os.path.join(EP, vid, 'tl.json'))); f, dur = tl['fx']['fin'], tl['dur']
    serie = (re.search(r'^serie:\s*(.*)$', open(glob.glob(os.path.join(R, 'Guiones', vid + '_*.md'))[0], encoding='utf-8').read(), re.M) or [0, ''])[1].strip()
    tmp = tempfile.mkdtemp(); limpio, btn = os.path.join(tmp, 'limpio.png'), os.path.join(tmp, 'btn.png')
    # fondo limpio: el cierre justo antes de que aparezca el botón
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{f + 0.85:.2f}', '-i', mp4, '-frames:v', '1',
                    '-vf', f'crop={MW}:{MH}:{MX}:{MY}', limpio], check=True)
    boton(btn)
    salida = os.path.join(OUT, os.path.basename(mp4))
    a = f + 0.85; b = f + 0.95
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-loop', '1', '-t', str(dur), '-i', limpio, '-loop', '1', '-t', str(dur), '-i', btn,
                    '-filter_complex',
                    f"[2:v]format=rgba,fade=t=in:st={b:.2f}:d=0.3:alpha=1[bt];"
                    f"[0:v][1:v]overlay={MX}:{MY}:enable='gte(t,{a:.2f})'[v1];[v1][bt]overlay={PX}:{PY}:enable='gte(t,{b:.2f})',"
                    f"fade=t=out:st={dur - 0.4:.2f}:d=0.4[v]",
                    '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p',
                    '-c:a', 'copy', '-t', str(dur), salida], check=True)
    open(os.path.join(OUT, f'{vid} - tiktok.txt'), 'w', encoding='utf-8').write(ficha(vid, yt, serie))
    print('ok', vid, flush=True)


if __name__ == '__main__':
    ids = sys.argv[1:] or sorted({os.path.basename(p).split(' - ')[0] for p in glob.glob(os.path.join(VL, 'S* - youtube.txt'))})
    for v in ids:
        hacer(v)
