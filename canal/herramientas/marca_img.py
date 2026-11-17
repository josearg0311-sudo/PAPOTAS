"""Look de marca "¿Acaso lo sabías?": blanco y negro cálido + solo los dorados en color.
python3 marca_img.py entrada.jpg salida.jpg"""
import sys
import numpy as np
from PIL import Image, ImageFilter
im = Image.open(sys.argv[1]).convert('RGB'); a = np.asarray(im).astype(np.float32) / 255
hsv = np.asarray(im.convert('HSV')).astype(np.float32) / 255
h, s, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
# máscara de dorados/ámbar (luces, fuego, oro) suavizada
m = np.clip((s - .38) / .2, 0, 1) * np.clip((v - .42) / .2, 0, 1) * np.clip(1 - np.abs(h - 40) / 22, 0, 1)
m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255
lum = (a @ np.array([.299, .587, .114]))[..., None]
lum = np.clip((np.power(lum, .82) - .5) * 1.22 + .54, 0, 1)    # más luz y contraste
mono = lum * np.array([1.0, .96, .88]) + (1 - lum) * np.array([-.02, -.01, .02])  # tinta cálida, sombras frías
oro = np.clip(a * np.array([1.12, 1.0, .75]) * 1.08, 0, 1)        # dorados más vivos
out = mono * (1 - m[..., None]) + oro * m[..., None]
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save(sys.argv[2], quality=93)
