"""Miniaturas serias con imagen realista: python3 miniaturas_reales.py <imagen> <parte> <salida.jpg> [lado_texto izq|der]"""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

src, parte, out = sys.argv[1], sys.argv[2], sys.argv[3]
lado = sys.argv[4] if len(sys.argv) > 4 else "izq"
W, H = 1280, 720
F9 = "fuentes/montserrat-latin-900-normal.woff"; F8 = "fuentes/montserrat-latin-800-normal.woff"
f = lambda s, w=9: ImageFont.truetype(F9 if w == 9 else F8, s)

img = Image.open(src).convert("RGB")
sc = max(W / img.width, H / img.height); img = img.resize((int(img.width * sc), int(img.height * sc)), Image.LANCZOS)
img = img.crop(((img.width - W) // 2, (img.height - H) // 2, (img.width - W) // 2 + W, (img.height - H) // 2 + H))
if lado == "der": img = img.transpose(Image.FLIP_LEFT_RIGHT)
# grading cinematográfico: más contraste, algo menos saturado, sombras profundas
img = ImageEnhance.Contrast(img).enhance(1.18); img = ImageEnhance.Color(img).enhance(.9); img = ImageEnhance.Brightness(img).enhance(.92)
# degradado oscuro en el lado del texto
grad = Image.new("L", (W, H))
for x in range(W):
    a = int(max(0, min(1, (0.62 - x / W) / 0.42)) ** 1.3 * 235)
    ImageDraw.Draw(grad).line([(x, 0), (x, H)], fill=a)
img = Image.composite(Image.new("RGB", (W, H), (6, 6, 10)), img, grad)
# viñeta
vig = Image.new("L", (W, H), 0); ImageDraw.Draw(vig).ellipse((-W * .25, -H * .35, W * 1.25, H * 1.35), fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(120)); img = Image.composite(img, Image.new("RGB", (W, H), (0, 0, 0)), vig)

d = ImageDraw.Draw(img)
def text(xy, s, font, fill, stroke=6):
    d.text(xy, s, font=font, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))
x0 = 60
# número dorado con degradado
num = Image.new("L", (W, H)); ImageDraw.Draw(num).text((x0 - 6, 18), "20", font=f(250), fill=255)
goldg = Image.new("RGB", (W, H))
for y in range(H):
    k = min(1, max(0, (y - 60) / 230)); ImageDraw.Draw(goldg).line([(0, y), (W, y)], fill=(int(255 - 20 * k), int(228 - 90 * k), int(120 - 100 * k)))
shadow = num.filter(ImageFilter.GaussianBlur(10)); img.paste((0, 0, 0), (6, 8), shadow)
img.paste(goldg, (0, 0), num); d = ImageDraw.Draw(img)
text((x0, 300), "DATOS HISTÓRICOS", f(64), (255, 255, 255), 4)
text((x0, 372), "QUE NO TE ENSEÑARON", f(40, 8), (225, 225, 225), 3)
# etiqueta roja
pf = f(44); w = d.textlength("¡PARECEN MENTIRA!", font=pf) + 48
d.rounded_rectangle((x0, 440, x0 + w, 512), radius=14, fill=(214, 38, 38))
d.text((x0 + 24, 448), "¡PARECEN MENTIRA!", font=pf, fill=(255, 255, 255))
# parte: discreto, línea dorada
d.line((x0, 548, x0 + 60, 548), fill=(255, 196, 46), width=5)
d.text((x0 + 76, 532), f"PARTE {parte}", font=f(32, 8), fill=(255, 196, 46))
# logo arriba a la derecha
logo = Image.open("img/logo.png").convert("RGBA").resize((140, 140), Image.LANCZOS)
img.paste(logo, (W - 168, 26), logo)
img.save(out, quality=94)
print("ok", out)
