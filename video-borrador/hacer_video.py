"""Borrador de vídeo animado para YouTube: "¿Por qué el cielo es azul?"

Todo se dibuja con código (sin IA, sin créditos): personaje, escenas,
subtítulos, música y efectos. Ejecuta:  python3 hacer_video.py
Genera borrador.mp4 (1280x720, 24 fps).
"""
import math, random, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, S, FPS = 1280, 720, 2, 24          # S = supermuestreo para bordes suaves
DUR = 32.0
N = int(DUR * FPS)
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_fc = {}
def font(size, bold=True):
    k = (size, bold)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FONT_B if bold else FONT_R, int(size * S))
    return _fc[k]

# ---------- utilidades ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a))
def ease_out(x): return 1 - (1 - x) ** 3
def ease_inout(x): return 3 * x * x - 2 * x * x * x
def back_out(x):
    c = 1.9; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2
def lerp(a, b, x): return a + (b - a) * x
def mix(c1, c2, x): return tuple(int(lerp(a, b, x)) for a, b in zip(c1, c2))
def P(*v): return [int(u * S) for u in v]

def ellipse(d, cx, cy, rx, ry, fill, outline=None, w=0):
    d.ellipse(P(cx - rx, cy - ry, cx + rx, cy + ry), fill=fill,
              outline=outline, width=int(w * S))

def gradient(top, bottom):
    y = np.linspace(0, 1, H * S)[:, None, None]
    arr = (np.array(top) * (1 - y) + np.array(bottom) * y).astype(np.uint8)
    return Image.fromarray(np.broadcast_to(arr, (H * S, W * S, 3)).copy())

def text_c(d, x, y, txt, size, fill, stroke=None, sw=0, bold=True):
    if size < 2: return
    f = font(round(size, 1), bold)
    d.text((x * S, y * S), txt, font=f, fill=fill, anchor="mm",
           stroke_width=int(sw * S), stroke_fill=stroke)

def wrap(txt, size, maxw):
    f = font(size); words, lines, cur = txt.split(), [], ""
    for w_ in words:
        test = (cur + " " + w_).strip()
        if f.getlength(test) / S > maxw and cur:
            lines.append(cur); cur = w_
        else:
            cur = test
    lines.append(cur); return lines

# ---------- elementos ----------
def cloud(d, x, y, s, col=(255, 255, 255)):
    for dx, dy, r in [(-40, 8, 32), (0, -10, 42), (42, 6, 30), (15, 18, 30), (-15, 20, 28)]:
        ellipse(d, x + dx * s, y + dy * s, r * s, r * s, col)

def soli(d, cx, cy, r, t, talking=False, wink=False):
    """El personaje: un sol simpático."""
    # rayos girando
    for i in range(12):
        a = i * math.pi / 6 + t * 0.6
        L = r * (1.45 + 0.08 * math.sin(t * 6 + i))
        p1 = (cx + math.cos(a - 0.13) * r * 0.9, cy + math.sin(a - 0.13) * r * 0.9)
        p2 = (cx + math.cos(a) * L, cy + math.sin(a) * L)
        p3 = (cx + math.cos(a + 0.13) * r * 0.9, cy + math.sin(a + 0.13) * r * 0.9)
        d.polygon([tuple(P(*p1)), tuple(P(*p2)), tuple(P(*p3))], fill=(255, 176, 32))
    ellipse(d, cx, cy, r, r, (255, 214, 64), outline=(240, 150, 20), w=4)
    # mejillas
    ellipse(d, cx - r * .55, cy + r * .22, r * .16, r * .1, (255, 150, 110))
    ellipse(d, cx + r * .55, cy + r * .22, r * .16, r * .1, (255, 150, 110))
    # ojos (parpadeo cada ~3 s)
    blink = (t % 3.1) < 0.12
    for sx in (-1, 1):
        ex, ey = cx + sx * r * .32, cy - r * .15
        if blink or (wink and sx == 1):
            d.arc(P(ex - r * .12, ey - r * .08, ex + r * .12, ey + r * .1), 200, 340,
                  fill=(60, 40, 30), width=int(5 * S))
        else:
            ellipse(d, ex, ey, r * .11, r * .14, (60, 40, 30))
            ellipse(d, ex + r * .04, ey - r * .05, r * .04, r * .04, (255, 255, 255))
    # boca
    if talking:
        o = 0.5 + 0.5 * abs(math.sin(t * 14))
        ellipse(d, cx, cy + r * .38, r * .2, r * (.06 + .14 * o), (150, 50, 40))
    else:
        d.arc(P(cx - r * .3, cy + r * .05, cx + r * .3, cy + r * .5), 20, 160,
              fill=(150, 50, 40), width=int(6 * S))

def bubble(d, x, y, w, txt, reveal, size=26):
    lines = wrap(txt, size, w - 50)
    lh = size * 1.35; h = len(lines) * lh + 40
    d.rounded_rectangle(P(x, y, x + w, y + h), radius=int(30 * S), fill=(255, 255, 255),
                        outline=(40, 40, 60), width=int(4 * S))
    d.polygon([tuple(P(x + 30, y + h - 4)), tuple(P(x - 25, y + h + 35)),
               tuple(P(x + 75, y + h - 4))], fill=(255, 255, 255))
    d.line(P(x + 30, y + h - 2, x - 25, y + h + 35, x + 75, y + h - 2),
           fill=(40, 40, 60), width=int(4 * S))
    n = int(len(txt) * reveal); shown = 0
    for i, ln in enumerate(lines):
        part = ln[:max(0, n - shown)]; shown += len(ln) + 1
        d.text(P(x + 25, y + 20 + i * lh), part, font=font(size), fill=(40, 40, 60))

def subtitle(d, txt):
    if not txt: return
    f = font(30); tw = f.getlength(txt) / S
    d.rounded_rectangle(P(W / 2 - tw / 2 - 20, H - 78, W / 2 + tw / 2 + 20, H - 28),
                        radius=int(14 * S), fill=(0, 0, 0))
    text_c(d, W / 2, H - 53, txt, 30, (255, 255, 255))

# ---------- guion / subtítulos ----------
SUBS = [
    (0.8, 5.0, "¿Por qué el cielo es azul?"),
    (5.5, 9.0, "¡Hola! Soy Soli, el sol."),
    (9.0, 13.0, "Mi luz parece blanca... ¡pero lleva todos los colores!"),
    (13.5, 18.0, "Cuando llega al aire, choca con partículas diminutas."),
    (18.0, 22.0, "La luz azul rebota mucho más que la roja."),
    (22.5, 27.0, "Se reparte por todo el cielo... ¡y lo vemos azul!"),
    (27.5, 32.0, "¡Suscríbete para más curiosidades!"),
]
RAINBOW = [(255, 60, 60), (255, 150, 40), (255, 230, 50), (80, 200, 80),
           (60, 140, 255), (100, 80, 220), (170, 80, 200)]
random.seed(4)
PARTS = [(random.uniform(560, 1220), random.uniform(130, 560)) for _ in range(28)]
SKY_PALE, SKY_DEEP = ((230, 236, 245), (200, 212, 228)), ((70, 150, 245), (170, 215, 255))

def render(fi):
    t = fi / FPS
    # cielo: se va volviendo azul en la escena 4
    k = ease_inout(prog(t, 21.5, 24.5)) if t < 27 else 1
    if t < 5: k = 1
    if 5 <= t < 21.5: k = 0
    img = gradient(mix(SKY_PALE[0], SKY_DEEP[0], k), mix(SKY_PALE[1], SKY_DEEP[1], k))
    d = ImageDraw.Draw(img)
    for i, (cy, sp, s) in enumerate([(110, 18, 1.0), (200, 11, .7), (70, 25, .55)]):
        cloud(d, (i * 470 + t * sp) % (W + 300) - 150, cy, s)
    # suelo
    d.rectangle(P(0, 640, W, H), fill=(110, 190, 90))
    ellipse(d, 300, 660, 420, 60, (130, 205, 105)); ellipse(d, 1050, 670, 380, 55, (120, 198, 98))

    # ---------- Escena 1: título ----------
    if t < 5.5:
        a = back_out(prog(t, 0.2, 1.0)); out = ease_inout(prog(t, 4.6, 5.4))
        sc = a * (1 - out)
        if sc > 0.02:
            size = 64 * sc
            if size > 4:
                y = 250 + 8 * math.sin(t * 3)
                text_c(d, W / 2, y, "¿Por qué el cielo", size, (255, 255, 255), (30, 60, 140), 6 * sc)
                text_c(d, W / 2, y + 80 * sc, "es AZUL?", size * 1.25, (255, 230, 60), (30, 60, 140), 7 * sc)
        sy = lerp(900, 470, back_out(prog(t, 1.2, 2.2)))
        sy = lerp(sy, 900, out)
        soli(d, W / 2, sy, 70, t)

    # ---------- Escenas 2-3: Soli habla, arco iris ----------
    elif t < 13.5:
        ent = back_out(prog(t, 5.4, 6.3))
        sx, sy = 230, lerp(900, 330, ent)
        speaking = (5.8 < t < 8.6) or (9.2 < t < 12.6)
        if t < 9:
            bubble(d, 360, 120, 560, "¡Hola! Soy Soli, el sol. ☀", prog(t, 5.8, 7.6))
        else:
            # haz de luz que se abre en arco iris
            sp = ease_out(prog(t, 10.2, 11.5))
            for i, c in enumerate(RAINBOW):
                ang = math.radians(-6 + i * 3.2) * sp
                L = 900 * ease_out(prog(t, 9.6, 10.6))
                d.line(P(sx + 90, sy, sx + 90 + math.cos(ang) * L, sy + math.sin(ang) * L + i * 3 * sp),
                       fill=c if sp > .05 else (255, 255, 240), width=int(12 * S))
            bubble(d, 360, 90, 600, "Mi luz parece blanca... ¡pero lleva todos los colores!",
                   prog(t, 9.2, 12.0))
        soli(d, sx, sy, 80, t, talking=speaking)

    # ---------- Escena 3b: dispersión ----------
    elif t < 22.5:
        sx, sy = 180, 260
        soli(d, sx, sy, 70, t, talking=(13.6 < t < 17 or 18.1 < t < 21))
        pa = ease_out(prog(t, 13.6, 14.6))
        for (px, py) in PARTS:
            r = 9 * pa * (1 + .15 * math.sin(t * 4 + px))
            if r > .5: ellipse(d, px, py, r, r, (140, 170, 200), outline=(90, 120, 160), w=2)
        # rayo rojo: sigue recto
        L = ease_out(prog(t, 14.5, 16)) * 1100
        d.line(P(sx + 80, sy + 20, sx + 80 + L, sy + 20 + L * .28), fill=(255, 70, 60), width=int(10 * S))
        # rayo azul: entra y rebota en todas direcciones al tocar partículas
        Lb = ease_out(prog(t, 15.5, 16.8)) * 380
        d.line(P(sx + 80, sy - 10, sx + 80 + Lb, sy - 10 + Lb * .25), fill=(60, 120, 255), width=int(10 * S))
        bp = prog(t, 17.5, 21.5)
        if bp > 0:
            for i, (px, py) in enumerate(PARTS):
                start = 17.5 + (i % 9) * 0.35
                q = ease_out(prog(t, start, start + 1.2))
                if q <= 0: continue
                for j in range(3):
                    a = (i * 2.3 + j * 2.1)
                    ll = 70 * q
                    d.line(P(px, py, px + math.cos(a) * ll, py + math.sin(a) * ll),
                           fill=(60, 120, 255), width=int(5 * S))
        if t > 18:
            lab = ease_out(prog(t, 18, 18.6))
            text_c(d, 960, 600 - 20 * lab, "Azul: ¡rebota mucho!", 30 * max(lab, .1), (40, 90, 220), (255, 255, 255), 4)
        if t > 15.6:
            lab = ease_out(prog(t, 15.6, 16.2))
            text_c(d, 1060, 120, "Rojo: sigue recto", 30 * max(lab, .1), (220, 50, 40), (255, 255, 255), 4)

    # ---------- Escena 4: cielo azul ----------
    elif t < 27.5:
        soli(d, 640, 330, 95, t, talking=(22.6 < t < 26.4))
        for i in range(16):
            a = i / 16 * math.tau + t
            rr = 160 + 12 * math.sin(t * 5 + i)
            ellipse(d, 640 + math.cos(a) * rr * 1.6, 330 + math.sin(a) * rr * .8, 6, 6, (255, 255, 255))
        txt = "¡POR ESO LO VEMOS AZUL!"
        z = back_out(prog(t, 24.6, 25.4))
        if z > .05:
            text_c(d, 640, 540, txt, 54 * z, (255, 255, 255), (20, 70, 170), 6)

    # ---------- Escena 5: cierre / suscríbete ----------
    else:
        soli(d, 340, 360, 100, t, wink=(29.5 < t < 30.3))
        z = back_out(prog(t, 27.8, 28.6))
        pulse = 1 + .05 * math.sin(t * 8) * (t > 29)
        bw, bh = 380 * z * pulse, 100 * z * pulse
        clicked = 30.0 < t < 30.4
        col = (120, 120, 120) if t > 30.2 else (230, 30, 40)
        if bw > 5:
            d.rounded_rectangle(P(820 - bw / 2, 330 - bh / 2, 820 + bw / 2, 330 + bh / 2),
                                radius=int(20 * S), fill=col)
            text_c(d, 820, 330, "SUSCRITO ✓" if t > 30.2 else "SUSCRÍBETE", 40 * z * pulse, (255, 255, 255))
        if 29.2 < t < 31:  # manita que hace clic
            hx = lerp(1150, 860, ease_out(prog(t, 29.2, 29.9)))
            hy = lerp(560, 360, ease_out(prog(t, 29.2, 29.9))) + (6 if clicked else 0)
            ellipse(d, hx, hy, 26, 26, (255, 220, 180), outline=(120, 80, 50), w=3)
            d.rounded_rectangle(P(hx - 9, hy - 70, hx + 9, hy - 10), radius=int(9 * S),
                                fill=(255, 220, 180), outline=(120, 80, 50), width=int(3 * S))
        text_c(d, 820, 450, "¡Más curiosidades cada semana!", 30 * z, (30, 60, 140), bold=True)

    # subtítulos
    for a, b, s in SUBS:
        if a <= t < b: subtitle(d, s)
    # fundido de entrada / salida
    img = img.resize((W, H), Image.LANCZOS)
    f = min(prog(t, 0, .5), 1 - prog(t, DUR - .6, DUR))
    if f < 1: img = Image.eval(img, lambda v: int(v * f))
    return img

# ---------- audio: música alegre + efectos "pop" ----------
def make_audio(path, sr=44100):
    n = int(DUR * sr); out = np.zeros(n)
    bpm = 112; beat = 60 / bpm
    chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]  # C Am F G
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    def note(t0, m, dur, vol, kind="pluck"):
        i0 = int(t0 * sr); L = int(dur * sr)
        if i0 >= n: return
        L = min(L, n - i0); tt = np.arange(L) / sr; f = hz(m)
        if kind == "pluck":
            w = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 6)
        else:
            w = np.sin(2 * np.pi * f * tt) * np.minimum(1, tt * 20) * np.exp(-tt * 1.5)
        out[i0:i0 + L] += vol * w
    melody = [72, 74, 76, 79, 76, 74, 72, 67]
    b = 0; t0 = 0.0
    while t0 < DUR:
        ch = chords[(b // 4) % 4]
        note(t0, ch[0] - 24, beat * .9, .25, "bass")
        for k, m in enumerate(ch): note(t0 + beat / 2, m, beat * .5, .07)
        note(t0, melody[b % 8], beat * .8, .09)
        t0 += beat; b += 1
    for tp in [1.2, 5.5, 10.2, 13.6, 17.5, 22.6, 24.6, 27.8, 30.0]:   # pops
        i0 = int(tp * sr); L = int(.15 * sr); tt = np.arange(L) / sr
        out[i0:i0 + L] += .4 * np.sin(2 * np.pi * (300 + 1800 * tt) * tt) * np.exp(-tt * 25)
    fade = np.minimum(1, np.minimum(np.arange(n) / sr / .5, (n - np.arange(n)) / sr / 1.0))
    out = out * fade; out = out / np.max(np.abs(out)) * .7
    with wave.open(path, "w") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes((out * 32767).astype(np.int16).tobytes())

if __name__ == "__main__":
    make_audio("audio.wav")
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", "audio.wav",
                          "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
                          "-c:a", "aac", "-b:a", "160k", "-shortest", "borrador.mp4"],
                         stdin=subprocess.PIPE)
    for fi in range(N):
        p.stdin.write(render(fi).tobytes())
        if fi % 96 == 0: print(f"{fi / N:5.0%}", flush=True)
    p.stdin.close(); p.wait(); print("Listo: borrador.mp4")
