"""Quita la marca de agua semitransparente 'clideo.com' invirtiendo la mezcla alfa.
Uso: python3 quitar_marca.py calibrar <carpeta_frames> <mask.png> <params.npz>
     (como módulo: fix(frame_uint8_HxWx3, params) -> frame)"""
import sys, glob, numpy as np, cv2
from PIL import Image
Y0, Y1, X0, X1 = 615, 695, 900, 1262

def bg_est(reg):
    # interpola verticalmente entre las 4 filas de arriba y las 4 de abajo
    top = reg[:4].mean(0); bot = reg[-4:].mean(0)
    w = np.linspace(0, 1, reg.shape[0])[:, None, None]
    return top * (1 - w) + bot * w

def calibrar(folder, maskp, out):
    mask = np.asarray(Image.open(maskp))[Y0:Y1, X0:X1] > 0
    fs = sorted(glob.glob(folder + "/f*.png"))
    O, B = [], []
    for f in fs:
        reg = np.asarray(Image.open(f).convert("RGB"), dtype=np.float32)[Y0:Y1, X0:X1]
        O.append(reg); B.append(bg_est(reg))
    O, B = np.stack(O), np.stack(B)
    # regresión robusta por píxel: O = k*B + c  ->  k = 1-a, c = a*W
    Bm, Om = B.mean(0), O.mean(0)
    k = ((B - Bm) * (O - Om)).sum(0) / (((B - Bm) ** 2).sum(0) + 1e-3)
    k = np.clip(k, 0.35, 1.0); c = Om - k * Bm
    c = np.clip(c, 0, 255)
    k[~mask] = 1; c[~mask] = 0
    np.savez(out, k=k.astype(np.float32), c=c.astype(np.float32), mask=mask)

def load(p):
    z = np.load(p); return z["k"], z["c"], z["mask"]

def fix(frame, params):
    k, c, mask = params
    reg = frame[Y0:Y1, X0:X1].astype(np.float32)
    rec = (reg - c) / k
    rec = np.clip(rec, 0, 255).astype(np.uint8)
    # el contorno que queda se rellena con inpainting desde los píxeles vecinos
    m = cv2.dilate(mask.astype(np.uint8) * 255, np.ones((3, 3), np.uint8))
    rec = cv2.inpaint(np.ascontiguousarray(rec), m, 3, cv2.INPAINT_TELEA)
    frame[Y0:Y1, X0:X1] = rec
    return frame

if __name__ == "__main__" and sys.argv[1] == "calibrar":
    calibrar(*sys.argv[2:5])
