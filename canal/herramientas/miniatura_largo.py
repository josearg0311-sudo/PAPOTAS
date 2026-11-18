"""Dos miniaturas creativas (1280×720) para un vídeo largo, sin gastar créditos (usa fondos 16:9 y personajes recortados).
  A "Protagonista": el personaje de la historia #1 enorme, un "7" gigante dorado y una tira con las otras 6 caras.
  B "Collage": 7 polaroids de plastilina numeradas; la #1 tapada con un "?" para dar curiosidad.
Uso: python3 herramientas/miniatura_largo.py Largos/L01.json  → Vídeos listos/L01 - miniatura A.jpg / B.jpg"""
import glob, json, math, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EP, VL = os.path.join(R, 'En proceso'), os.path.join(R, 'Vídeos listos')
FT = os.path.join(R, 'recursos', 'fuentes', 'montserrat-latin-{}-normal.woff')
F = lambda s, w=900: ImageFont.truetype(FT.format(w), s)
W, H = 1280, 720
INK, CREMA, ORO = (13, 12, 11), (243, 233, 210), (255, 201, 60)


def fondo(vid):
    fs = sorted(glob.glob(os.path.join(EP, vid, 'ancho_*.jpg'))) or sorted(glob.glob(os.path.join(EP, vid, 'escena_*_fondo.jpg')))
    return Image.open(fs[0]).convert('RGB')


def personaje(vid, k=0):
    fs = sorted(glob.glob(os.path.join(EP, vid, 'escena_*_personaje.png')))
    im = Image.open(fs[min(k, len(fs) - 1)]).convert('RGBA')
    return im.crop(im.getbbox())


def cubrir(im, w, h):
    s = max(w / im.width, h / im.height); im = im.resize((int(im.width * s + 1), int(im.height * s + 1)), Image.LANCZOS)
    return im.crop(((im.width - w) // 2, (im.height - h) // 2, (im.width - w) // 2 + w, (im.height - h) // 2 + h))


def contorno(p, grosor=10, color=CREMA):
    a = p.split()[3].filter(ImageFilter.MaxFilter(grosor * 2 + 1))
    base = Image.new('RGBA', p.size, color + (0,)); base.putalpha(a)
    lienzo = Image.new('RGBA', p.size); lienzo.alpha_composite(base); lienzo.alpha_composite(p)
    return lienzo


def sombra(p, d=14, blur=12):
    s = Image.new('RGBA', (p.width + 2 * blur + d, p.height + 2 * blur + d))
    neg = Image.new('RGBA', p.size, (0, 0, 0, 170)); neg.putalpha(p.split()[3].point(lambda v: v * 0.7))
    s.paste(neg, (blur + d, blur + d), neg); return s.filter(ImageFilter.GaussianBlur(blur))


def pegar(c, p, x, y):
    sh = sombra(p); c.alpha_composite(sh, (max(0, x - 12), max(0, y - 12)))
    c.alpha_composite(p, (x, y))


def texto(d, xy, t, f, fill, sw=6):
    d.text(xy, t, font=f, fill=fill, stroke_width=sw, stroke_fill=INK)


def version_a(cfg, hs):
    uno = hs[-1]
    c = cubrir(fondo(uno), W, H).filter(ImageFilter.GaussianBlur(2)).convert('RGBA')
    g = Image.new('L', (W, H)); gd = ImageDraw.Draw(g)
    for x in range(W): gd.line([(x, 0), (x, H)], fill=int(235 * min(1, max(0, (760 - x) / 520))))
    c = Image.composite(Image.new('RGBA', (W, H), INK + (255,)), c, g)
    p = personaje(uno); p = p.resize((int(p.width * 640 / p.height), 640), Image.LANCZOS)
    pegar(c, contorno(p), W - p.width - 10, H - p.height + 30)
    d = ImageDraw.Draw(c)
    texto(d, (40, -40), '7', F(430), ORO, 10)
    texto(d, (300, 70), 'COSAS QUE', F(78), CREMA)
    texto(d, (300, 158), '(SEGURO)', F(62, 800), CREMA)
    texto(d, (300, 230), 'NO SABÍAS', F(108), ORO, 8)
    # tira de caras de las otras historias
    x = 40
    for h in hs[:-1]:
        q = personaje(h); q = q.crop((0, 0, q.width, min(q.height, int(q.width * 1.05))))
        q = ImageOps.fit(q, (120, 120), Image.LANCZOS, centering=(0.5, 0.15))
        m = Image.new('L', (120, 120)); ImageDraw.Draw(m).ellipse((0, 0, 119, 119), fill=255)
        disco = Image.new('RGBA', (132, 132)); dd = ImageDraw.Draw(disco); dd.ellipse((0, 0, 131, 131), fill=CREMA)
        bg = cubrir(fondo(h), 120, 120).convert('RGBA'); bg.alpha_composite(q)
        disco.paste(bg, (6, 6), m); c.alpha_composite(disco, (x, 520)); x += 112
    d = ImageDraw.Draw(c); d.rectangle((6, 6, W - 7, H - 7), outline=CREMA, width=4)
    return c.convert('RGB')


def version_b(cfg, hs):
    rnd = random.Random(cfg['id'])
    c = cubrir(fondo(hs[-1]), W, H).filter(ImageFilter.GaussianBlur(14)).convert('RGBA')
    c = Image.blend(c, Image.new('RGBA', (W, H), INK + (255,)), 0.55)
    pos = [(30, 232), (330, 262), (630, 232), (60, 476), (360, 482), (660, 470)]
    for (x, y), h in zip(pos, hs[:-1]):
        card = Image.new('RGBA', (260, 212), CREMA + (255,))
        foto = cubrir(fondo(h), 240, 160).convert('RGBA')
        q = personaje(h); q = q.resize((int(q.width * 155 / q.height), 155), Image.LANCZOS)
        foto.alpha_composite(q, ((240 - q.width) // 2, 160 - q.height + 18) if q.width < 240 else (0, 5))
        card.paste(foto, (10, 10)); cd = ImageDraw.Draw(card)
        cd.text((130, 190), f'#{h.num}', font=F(30), fill=INK, anchor='mm')
        card = card.rotate(rnd.uniform(-8, 8), expand=True, resample=Image.BICUBIC)
        pegar(c, card, x, y)
    # la #1, grande y tapada
    big = Image.new('RGBA', (360, 420), ORO + (255,)); bd = ImageDraw.Draw(big)
    bd.rectangle((14, 14, 345, 340), fill=INK)
    bd.text((180, 180), '?', font=F(260), fill=ORO, anchor='mm')
    bd.text((180, 382), '#1', font=F(52), fill=INK, anchor='mm')
    big = big.rotate(6, expand=True, resample=Image.BICUBIC); pegar(c, big, W - 400, 230)
    d = ImageDraw.Draw(c)
    texto(d, (34, 20), '7 COSAS QUE', F(96), CREMA, 7)
    texto(d, (34, 125), 'NO SABÍAS', F(118), ORO, 8)
    d.rectangle((6, 6, W - 7, H - 7), outline=CREMA, width=4)
    return c.convert('RGB')


class H_:
    def __init__(self, vid, num): self.vid, self.num = vid, num
    def __str__(self): return self.vid


def main(ruta):
    cfg = json.load(open(ruta)); n = len(cfg['historias'])
    hs = [H_(v, n - i) for i, v in enumerate(cfg['historias'])]
    fondo_ = fondo; globals()['fondo'] = lambda h: fondo_(h.vid if isinstance(h, H_) else h)
    per_ = personaje; globals()['personaje'] = lambda h, k=0: per_(h.vid if isinstance(h, H_) else h, k)
    for nombre, fn in (('A', version_a), ('B', version_b)):
        out = os.path.join(VL, f"{cfg['id']} - miniatura {nombre}.jpg"); fn(cfg, hs).save(out, quality=93); print('ok', out)


if __name__ == '__main__':
    main(sys.argv[1])
