"""Portada vertical (1080×1920) para TikTok del recopilatorio y del avance de cada semana. 0 créditos.
Lo importante va en el centro (TikTok recorta el perfil a 3:4).
Uso: python3 herramientas/portada_tiktok_largo.py Largos/L01.json → Vídeos listos/TikTok/RECOPILATORIO L01 - portada.jpg"""
import json, os, random, sys
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import miniatura_largo as M

W, H = 1080, 1920
INK, CREMA, ORO = M.INK, M.CREMA, M.ORO
F = M.F


def centrado(d, y, t, f, fill, sw=8):
    d.text((W // 2, y), t, font=f, fill=fill, anchor='mm', stroke_width=sw, stroke_fill=INK)


def portada(cfg, vol):
    n = len(cfg['historias']); hs = [M.H_(v, n - i) for i, v in enumerate(cfg['historias'])]
    rnd = random.Random(cfg['id'])
    uno = hs[-1]
    c = M.cubrir(M.fondo(uno.vid), W, H).filter(ImageFilter.GaussianBlur(16)).convert('RGBA')
    c = Image.blend(c, Image.new('RGBA', (W, H), INK + (255,)), 0.5)
    d = ImageDraw.Draw(c)
    # cabecera
    centrado(d, 250, '7 COSAS QUE', F(118), CREMA)
    centrado(d, 370, '(SEGURO)', F(78, 800), CREMA, 6)
    centrado(d, 500, 'NO SABÍAS', F(150), ORO, 10)
    # polaroids #7..#2 en 2 columnas × 3 filas
    pos = [(70, 640), (560, 660), (70, 950), (560, 970), (70, 1260), (560, 1280)]
    for (x, y), h in zip(pos, hs[:-1]):
        card = Image.new('RGBA', (450, 290), CREMA + (255,))
        foto = M.cubrir(M.fondo(h.vid), 420, 220).convert('RGBA')
        q = M.personaje(h.vid); q = q.resize((int(q.width * 215 / q.height), 215), Image.LANCZOS)
        foto.alpha_composite(q, ((420 - q.width) // 2, 220 - q.height + 15) if q.width < 420 else (0, 5))
        card.paste(foto, (15, 15)); cd = ImageDraw.Draw(card)
        cd.text((225, 262), f'#{h.num}', font=F(40), fill=INK, anchor='mm')
        card = card.rotate(rnd.uniform(-6, 6), expand=True, resample=Image.BICUBIC)
        M.pegar(c, card, x, y)
    # la #1 tapada
    big = Image.new('RGBA', (560, 330), ORO + (255,)); bd = ImageDraw.Draw(big)
    bd.rectangle((14, 14, 545, 250), fill=INK)
    bd.text((280, 132), '?', font=F(200), fill=ORO, anchor='mm')
    bd.text((280, 290), '#1 ¿ADIVINAS CUÁL?', font=F(44), fill=INK, anchor='mm')
    big = big.rotate(-3, expand=True, resample=Image.BICUBIC); M.pegar(c, big, (W - big.width) // 2, 1560)
    d = ImageDraw.Draw(c)
    d.rounded_rectangle((W - 230, 40, W - 40, 120), 20, fill=ORO)
    d.text((W - 135, 80), f'VOL. {vol}', font=F(44), fill=INK, anchor='mm')
    d.rectangle((8, 8, W - 9, H - 9), outline=CREMA, width=6)
    return c.convert('RGB')


if __name__ == '__main__':
    ruta = sys.argv[1]; cfg = json.load(open(ruta)); vol = int(cfg['id'][1:])
    out = os.path.join(M.VL, 'TikTok', f"RECOPILATORIO {cfg['id']} - portada.jpg")
    portada(cfg, vol).save(out, quality=93); print('ok', out)
