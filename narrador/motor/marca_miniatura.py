"""Miniatura de marca: python3 marca_miniatura.py imagen.jpg "LÍNEA 1" "PALABRA DORADA" "SERIE" "#color" salida.jpg"""
import sys, math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, l1, l2, serie, col, out = sys.argv[1:7]
W, H = 1280, 720; F = os.path.join(os.path.dirname(__file__), '../../video-historia/fuentes/montserrat-latin-{}-normal.woff')
f = lambda s, w=900: ImageFont.truetype(F.format(w), s)
INK, CREAM, GOLD = (13, 12, 11), (243, 233, 210), (255, 201, 60)
im = Image.open(src).convert('RGB'); sc = max(W * .62 / im.width, H / im.height); im = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
c = Image.new('RGB', (W, H), INK); x0 = W - im.width; c.paste(im.crop((0, (im.height - H) // 2, im.width, (im.height - H) // 2 + H)), (max(x0, 420), 0))
g = Image.new('L', (W, H)); d = ImageDraw.Draw(g)
for x in range(W): d.line([(x, 0), (x, H)], fill=int(255 * min(1, max(0, (720 - x) / 300))))
c = Image.composite(Image.new('RGB', (W, H), INK), c, g); d = ImageDraw.Draw(c)
for y in range(0, H, 10):                                                    # semitono sutil
    for x in range((y // 10 % 2) * 5, 520, 10): d.ellipse((x - 1.4, y - 1.4, x + 1.4, y + 1.4), fill=(30, 28, 26))
def fit(txt, maxw, size):
    while f(size).getlength(txt) > maxw and size > 40: size -= 4
    return f(size)
fa, fb = fit(l1, 640, 96), fit(l2, 680, 170)
d.text((52, 190), l1, font=fa, fill=CREAM, stroke_width=4, stroke_fill=INK)
d.text((46, 300), l2, font=fb, fill=GOLD, stroke_width=6, stroke_fill=INK)
fs = f(30); w = fs.getlength(serie) + 44; d.rectangle((52, 92, 52 + w, 140), fill=INK, outline=None); d.rectangle((52, 136, 52 + w, 142), fill=col)
d.text((74, 98), serie, font=fs, fill=CREAM)
# sello ¿? en la esquina (firma del canal)
sz = 210; s = Image.new('RGBA', (sz, sz)); sd = ImageDraw.Draw(s); r = sz // 2 - 4
sd.ellipse((4, 4, sz - 4, sz - 4), fill=GOLD); sd.ellipse((16, 16, sz - 16, sz - 16), outline=INK, width=6)
sd.text((sz / 2, sz / 2 + 4), '¿?', font=f(100), fill=INK, anchor='mm'); s = s.rotate(14, resample=Image.BICUBIC)
c.paste(s, (W - sz - 30, H - sz - 30), s)
d = ImageDraw.Draw(c); d.rectangle((6, 6, W - 7, H - 7), outline=CREAM, width=4)
c.save(out, quality=94); print('ok', out)
