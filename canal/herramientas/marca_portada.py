"""Portada vertical para Shorts (1080x1920): python3 marca_portada.py imagen.jpg "LÍNEA 1" "PALABRA GIGANTE" "SERIE" "#color" salida.jpg [personaje.png]"""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
src, l1, l2, serie, col, out = sys.argv[1:7]; pj = sys.argv[7] if len(sys.argv) > 7 else None
W, H = 1080, 1920; F = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../recursos/fuentes/montserrat-latin-{}-normal.woff')
f = lambda s, w=900: ImageFont.truetype(F.format(w), s)
INK, CREAM, GOLD = (13, 12, 11), (243, 233, 210), (255, 201, 60)
im = Image.open(src).convert('RGB'); sc = max(W / im.width, H / im.height); im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
c = im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H))
c = ImageEnhance.Contrast(c).enhance(1.12); c = ImageEnhance.Color(c).enhance(1.15)
if pj:  # personaje recortado, grande y con contorno claro para que destaque
    p = Image.open(pj).convert('RGBA'); s2 = H * .62 / p.height; p = p.resize((int(p.width * s2), int(p.height * s2)), Image.LANCZOS)
    a = p.split()[3]; borde = Image.new('RGBA', p.size, CREAM + (255,)); borde.putalpha(a.filter(ImageFilter.MaxFilter(17)))
    x, y = (W - p.width) // 2, H - p.height - 40; c.paste(borde, (x, y), borde); c.paste(p, (x, y), p)
g = Image.new('L', (W, H)); d = ImageDraw.Draw(g)
for y in range(H): d.line([(0, y), (W, y)], fill=int(235 * max(0, 1 - y / 760) ** 1.4))
c = Image.composite(Image.new('RGB', (W, H), INK), c, g); d = ImageDraw.Draw(c)
def fit(t, maxw, size):
    while f(size).getlength(t) > maxw and size > 40: size -= 4
    return f(size)
fa, fb = fit(l1, 960, 96), fit(l2, 980, 210)
d.text((W / 2, 300), l1, font=fa, fill=CREAM, anchor='mm', stroke_width=5, stroke_fill=INK)
d.text((W / 2, 470), l2, font=fb, fill=GOLD, anchor='mm', stroke_width=8, stroke_fill=INK)
fs = f(34); w = fs.getlength(serie) + 50; d.rectangle(((W - w) / 2, 110, (W + w) / 2, 168), fill=INK); d.rectangle(((W - w) / 2, 164, (W + w) / 2, 170), fill=col)
d.text((W / 2, 139), serie, font=fs, fill=CREAM, anchor='mm')
sz = 230; s = Image.new('RGBA', (sz, sz)); sd = ImageDraw.Draw(s)
sd.ellipse((4, 4, sz - 4, sz - 4), fill=GOLD); sd.ellipse((18, 18, sz - 18, sz - 18), outline=INK, width=7); sd.text((sz / 2, sz / 2 + 4), '¿?', font=f(110), fill=INK, anchor='mm')
s = s.rotate(14, resample=Image.BICUBIC); c.paste(s, (W - sz - 40, 640), s)
ImageDraw.Draw(c).rectangle((8, 8, W - 9, H - 9), outline=CREAM, width=6)
c.save(out, quality=94); print('ok', out)
