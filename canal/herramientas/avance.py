"""Avance vertical del sábado (≈16 s, 0 créditos) para anunciar el vídeo largo.
Toma 1,8 s del arranque de cada Short (#7 → #2) con su número, tapa la #1 con un "?" y cierra con "HOY 18:00".
Uso: python3 herramientas/avance.py Largos/L01.json  → Vídeos listos/<id> - AVANCE vertical.mp4"""
import glob, json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EP, VL, REC = os.path.join(R, 'En proceso'), os.path.join(R, 'Vídeos listos'), os.path.join(R, 'recursos')
F = lambda s, w=900: ImageFont.truetype(os.path.join(REC, 'fuentes', f'montserrat-latin-{w}-normal.woff'), s)
W, H, FPS, SEG = 1080, 1920, 30, 1.8
INK, CREMA, ORO = (13, 12, 11), (243, 233, 210), (255, 201, 60)
TMP = tempfile.mkdtemp(prefix='avance_')


def short_mp4(vid):
    fs = [f for f in glob.glob(os.path.join(VL, f'{vid} - *.mp4')) if 'AVANCE' not in f]
    return fs[0] if fs else None


def insignia(num):
    im = Image.new('RGBA', (W, H)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((60, 300, 330, 470), 30, fill=ORO, outline=INK, width=8)
    d.text((195, 385), f'#{num}', font=F(120), fill=INK, anchor='mm')
    p = os.path.join(TMP, f'ins{num}.png'); im.save(p); return p


def tarjeta(lineas, fondo, nombre):
    im = Image.open(fondo).convert('RGB') if fondo else Image.new('RGB', (W, H), INK)
    s = max(W / im.width, H / im.height); im = im.resize((int(im.width * s + 1), int(im.height * s + 1)))
    im = im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H))
    im = Image.blend(im.filter(ImageFilter.GaussianBlur(18)), Image.new('RGB', (W, H), INK), 0.55); d = ImageDraw.Draw(im)
    y = H // 2 - sum(l[1].size + 30 for l in lineas) // 2
    for t, f, c in lineas:
        d.text((W // 2, y + f.size // 2), t, font=f, fill=c, anchor='mm', stroke_width=6, stroke_fill=INK); y += f.size + 30
    p = os.path.join(TMP, nombre); im.save(p, quality=94); return p


def main(ruta):
    cfg = json.load(open(ruta)); hs = cfg['historias']; n = len(hs)
    partes = []
    for i, vid in enumerate(hs[:-1]):
        mp4 = short_mp4(vid); num = n - i
        if not mp4: print('falta', vid); continue
        out = os.path.join(TMP, f'p{i}.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '0.3', '-t', str(SEG), '-i', mp4, '-i', insignia(num), '-filter_complex',
                        f'[0:v]scale={W}:{H},fps={FPS},setsar=1[v];[v][1:v]overlay=0:0,fade=t=in:d=0.12', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out], check=True)
        partes.append(out)
    fondo1 = (sorted(glob.glob(os.path.join(EP, hs[-1], 'ancho_*.jpg'))) or [None])[0]
    t1 = tarjeta([('#1', F(260), ORO), ('???', F(200), CREMA), ('LA MÁS INCREÍBLE', F(70), CREMA)], fondo1, 'c1.jpg')
    t2 = tarjeta([('HOY', F(120), CREMA), ('18:00', F(230), ORO), ('VÍDEO COMPLETO', F(80), CREMA), ('EN EL CANAL', F(80), CREMA)], fondo1, 'c2.jpg')
    for k, (img, dur) in enumerate(((t1, 2.2), (t2, 3.0))):
        out = os.path.join(TMP, f'c{k}.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', str(dur), '-i', img, '-vf',
                        f"scale={W}:{H},zoompan=z='1+0.0008*on':d={int(dur * FPS)}:s={W}x{H}:fps={FPS},fade=t=in:d=0.15",
                        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out], check=True)
        partes.append(out)
    lista = os.path.join(TMP, 'l.txt'); open(lista, 'w').write(''.join(f"file '{p}'\n" for p in partes))
    total = SEG * (n - 1) + 5.2
    salida = os.path.join(VL, f"{cfg['id']} - AVANCE vertical.mp4")
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-stream_loop', '-1', '-i', os.path.join(REC, 'musica.mp3'),
                    '-filter_complex', f'[1:a]atrim=0:{total:.2f},afade=t=in:d=0.3,afade=t=out:st={total - 0.8:.2f}:d=0.8,loudnorm=I=-14[a]',
                    '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest',
                    '-movflags', '+faststart', salida], check=True)
    open(os.path.join(VL, f"{cfg['id']} - AVANCE.txt"), 'w', encoding='utf-8').write(
        f"Publicar: {cfg['publicar'][:10]} a las 12:00 (Short de YouTube y TikTok)\n"
        f"Título: 7 cosas que (seguro) NO sabías 🤯 ¿Adivinas la #1? Hoy a las 18:00\n"
        f"Descripción: Hoy a las 18:00 sale el vídeo completo con las 7 historias de la semana. ¿Cuál crees que es la número 1? 👇\n"
        f"#sabiasque #curiosidades #acasolosabias #shorts\n")
    print('✅', salida)


if __name__ == '__main__':
    main(sys.argv[1])
