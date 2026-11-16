"""Monta los vídeos de "¿Acaso lo sabías?" a partir del audio, el guion sincronizado
(palabras.json), el guion visual (escenas.txt) y las imágenes de img/.

Uso:
  python3 montar.py v1 salida.mp4 [desde hasta]     # parte 1 (datos 1-10)
  python3 montar.py v2 salida.mp4 [desde hasta]     # parte 2 (datos 11-20)
"""
import sys, os, re, json, math, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
AUDIO = "/root/.claude/uploads/9ac8c931-b906-5e4c-bd88-a98dddd4a956/ffcb09c9-Generated_Audio_November_16_2026_-_2_14PM.wav"
W, H, FPS = 1920, 1080, 30
GOLD = (255, 196, 46); WHITE = (255, 255, 255)
F800 = os.path.join(AQUI, "fuentes/montserrat-latin-800-normal.woff")
F900 = os.path.join(AQUI, "fuentes/montserrat-latin-900-normal.woff")
_fc = {}
def font(size, heavy=False):
    k = (int(size), heavy)
    if k not in _fc: _fc[k] = ImageFont.truetype(F900 if heavy else F800, max(2, int(size)))
    return _fc[k]

def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a)) if b > a else 1.0
def ease(x): return x * x * (3 - 2 * x)
def back(x): c = 1.7; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

NUM = {w: i + 1 for i, w in enumerate("uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece "
                                      "catorce quince dieciséis diecisiete dieciocho diecinueve veinte".split())}

# ---------------- datos ----------------
words = json.load(open(os.path.join(AQUI, "palabras.json"), encoding="utf-8"))
norm = lambda s: re.sub(r"[^\wáéíóúñü]", "", s.lower())
toks = [norm(w["w"]) for w in words]
def find(phrase, start=0):
    p = [t for t in (norm(x) for x in phrase.split()) if t]
    for i in range(start, len(toks)):
        if toks[i:i + len(p)] == p: return i
    raise ValueError("no encuentro: " + phrase)
def par_first(pi): return next(i for i, w in enumerate(words) if w["par"] == pi)
def par_last(pi): return max(i for i, w in enumerate(words) if w["par"] == pi)
audio_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                  "-of", "csv=p=0", AUDIO], capture_output=True, text=True).stdout)
rows = [[c.strip() for c in l.split("|")] for l in open(os.path.join(AQUI, "escenas.txt"), encoding="utf-8")
        if l.strip() and not l.startswith("#")]

VID = sys.argv[1]
if VID == "v1":
    PRE = 0.0
    SEGS = [(0.0, words[par_last(17)]["e"] + 0.55), (words[par_first(31)]["s"] - 0.35, audio_dur)]
    TITLE = "20 datos históricos que no te enseñaron en el colegio"
else:
    PRE = 3.0   # cortinilla inicial sin voz
    SEGS = [(words[par_first(2)]["s"] - 0.3, words[par_last(2)]["e"] + 0.45),
            (words[par_first(18)]["s"] - 0.35, audio_dur)]
    TITLE = "20 datos históricos que no te enseñaron en el colegio · PARTE 2"

def a2v(ta):
    """tiempo del audio original -> tiempo del vídeo (None si cae fuera)"""
    off = PRE
    for a, b in SEGS:
        if a <= ta <= b: return off + ta - a
        off += b - a
    return None
DUR = PRE + sum(b - a for a, b in SEGS)

# escenas con su tiempo
scenes = []; pos = 0
for sid, anchor, desc in rows:
    if not sid.startswith(VID): continue
    if VID == "v2" and sid == "v2_02": pos = find("Dato número once")
    if sid.endswith("_59") or sid.endswith("_50") and VID == "v2": pos = max(pos, par_first(31))
    i = find(anchor, pos); pos = i
    t = a2v(words[i]["s"])
    if t is None: continue
    scenes.append({"id": sid, "t": t - 0.15, "desc": desc})
scenes[0]["t"] = 0.0
for k, s in enumerate(scenes):
    s["end"] = scenes[k + 1]["t"] if k + 1 < len(scenes) else DUR
    if s["desc"].startswith("@"):
        s["file"] = None if s["desc"] == "@logo" else os.path.join(AQUI, "img", s["desc"][1:])
    else:
        s["file"] = os.path.join(AQUI, "img", s["id"] + ".png")
# si falta una imagen, se usa la anterior disponible (solo para pruebas)
avail = [s for s in scenes if s["file"] and os.path.exists(s["file"])]
for s in scenes:
    if s["file"] and not os.path.exists(s["file"]):
        prev = [a for a in avail if a["t"] <= s["t"]] or avail
        s["missing"] = True
        s["file"] = (prev[-1] if prev else None) and prev[-1]["file"]

# subtítulos: trozos de hasta 5 palabras, cortando en la puntuación
vw = []
for w in words:
    s, e = a2v(w["s"]), a2v(w["e"])
    if s is not None and e is not None: vw.append({**w, "vs": s, "ve": e})
chunks, cur = [], []
for k, w in enumerate(vw):
    cur.append(w)
    txt = " ".join(x["w"] for x in cur)
    nxt = vw[k + 1] if k + 1 < len(vw) else None
    if (re.search(r"[.?!…:,;]$", w["w"]) or len(cur) >= 5 or len(txt) > 30 or nxt is None
            or nxt["par"] != w["par"] or (nxt and nxt["vs"] - w["ve"] > 0.6)):
        chunks.append(cur); cur = []
for k, c in enumerate(chunks):
    c0 = c[0]["vs"]; c1 = chunks[k + 1][0]["vs"] if k + 1 < len(chunks) else c[-1]["ve"] + 0.5
    chunks[k] = {"w": c, "s": c0 - 0.05, "e": min(c1, c[-1]["ve"] + 0.6)}

# datos: insignia y contador
datos = []
for k, w in enumerate(vw):
    if norm(w["w"]) == "dato" and k + 2 < len(vw) and norm(vw[k + 1]["w"]) == "número":
        n = NUM.get(norm(vw[k + 2]["w"]))
        if n: datos.append((w["vs"], n))
like_t = next((w["vs"] for w in vw if norm(w["w"]) == "like"), None)
outro_t = a2v(words[par_first(31)]["s"])

# ---------------- recursos gráficos ----------------
_img = {}
def load(path):
    if path not in _img:
        im = Image.open(path).convert("RGB")
        # se escala a 1.25x del lienzo para tener margen de movimiento
        sc = max(W / im.width, H / im.height) * 1.25
        _img[path] = im.resize((int(im.width * sc), int(im.height * sc)), Image.LANCZOS)
    return _img[path]
LOGO = Image.open(os.path.join(AQUI, "img/logo.png")).convert("RGBA")

def kenburns(path, x, idx):
    im = load(path)
    z0, z1 = (1.0, 1.18) if idx % 2 == 0 else (1.18, 1.02)
    z = z0 + (z1 - z0) * x
    cw, ch = im.width / 1.25 / z * 1.0, im.height / 1.25 / z
    dirs = [(-1, 0), (1, 0), (0, -1), (1, 1), (-1, 1), (0, 1)]
    dx, dy = dirs[idx % len(dirs)]
    mx, my = (im.width - cw) / 2, (im.height - ch) / 2
    cx = im.width / 2 + dx * mx * 0.6 * (x - 0.5)
    cy = im.height / 2 + dy * my * 0.6 * (x - 0.5)
    box = (cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2)
    return im.transform((W, H), Image.EXTENT, box, Image.BILINEAR)

_rays = None
def logo_bg(t):
    global _rays
    if _rays is None:
        y, x = np.mgrid[0:H, 0:W]
        _rays = (np.arctan2(y - H / 2, x - W / 2), np.hypot(y - H / 2, x - W / 2))
    ang, r = _rays
    rays = (np.cos(ang * 12 + t * 0.6) > 0.55).astype(np.float32) * np.clip(1 - r / 1300, 0, 1) * 0.35
    vign = np.clip(1 - r / 1500, 0, 1)
    base = np.stack([20 + 30 * vign, 14 + 20 * vign, 30 + 25 * vign], -1)
    col = base + rays[..., None] * np.array([255, 190, 60])
    return Image.fromarray(np.clip(col, 0, 255).astype(np.uint8))

def text_c(d, x, y, txt, size, fill, heavy=False, stroke=0, sfill=(0, 0, 0)):
    d.text((x, y), txt, font=font(size, heavy), fill=fill, anchor="mm",
           stroke_width=stroke, stroke_fill=sfill)

def logo_scene(img, t, ts, kind):
    lt = t - ts
    bg = logo_bg(t)
    img.paste(bg)
    sc = back(prog(lt, 0, 0.6)) * (1 + 0.02 * math.sin(t * 3))
    size = int(560 * sc) if kind == "intro" else int(420 * sc)
    if size > 10:
        lg = LOGO.resize((size, size), Image.LANCZOS)
        cy = H // 2 - 60 if kind == "intro" else H // 2 - 130
        img.paste(lg, (W // 2 - size // 2, cy - size // 2), lg)
    d = ImageDraw.Draw(img)
    a = ease(prog(lt, 0.5, 1.0))
    if kind == "intro" and a > 0:
        text_c(d, W // 2, H // 2 + 280, TITLE, 40, tuple(int(c * a) for c in GOLD), stroke=3)
    if kind == "comments":
        text_c(d, W // 2, H // 2 + 170, "¿Cuál de estos datos no conocías?", 58 * max(a, .05), WHITE, True, 4)
        text_c(d, W // 2, H // 2 + 250, "¡Te leo en los comentarios!", 40 * max(a, .05), GOLD, False, 3)
    if kind == "subscribe":
        bs = back(prog(lt, 0.4, 1.0)) * (1 + 0.04 * math.sin(t * 6))
        bw, bh = 520 * bs, 110 * bs
        if bw > 20:
            subs = lt > 3.2
            col = (90, 90, 90) if subs else (230, 30, 40)
            d.rounded_rectangle((W / 2 - bw / 2, H / 2 + 150 - bh / 2, W / 2 + bw / 2, H / 2 + 150 + bh / 2),
                                radius=int(24 * bs), fill=col)
            text_c(d, W / 2, H / 2 + 150, "SUSCRITO ✓" if subs else "SUSCRÍBETE", 50 * bs, WHITE, True)
            text_c(d, W / 2, H / 2 + 265, "y activa la campanita 🔔".replace(" 🔔", ""), 38 * bs, GOLD)
        if VID == "v1" and lt > 5:
            text_c(d, W / 2, H - 90, "▶  PARTE 2: datos 11 al 20", 44 * ease(prog(lt, 5, 5.6)), WHITE, True, 4)

def dato_badge(img, t):
    act = [(ts, n) for ts, n in datos if ts <= t < ts + 4.5]
    if not act: return
    ts, n = act[-1]; lt = t - ts
    a = back(prog(lt, 0, 0.45)); out = ease(prog(lt, 4.0, 4.5))
    x0 = 70 - 520 * (1 - a) - 520 * out
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle((x0, 60, x0 + 430, 210), radius=22, fill=(12, 14, 30, 225), outline=GOLD, width=5)
    text_c(d, x0 + 120, 137, "DATO", 52, (235, 235, 235), True)
    text_c(d, x0 + 315, 135, f"#{n}", 96, GOLD, True, 3, (60, 40, 0))

def progress(img, t):
    if not datos or t < datos[0][0] or (outro_t and t >= outro_t - 0.3): return
    n = max(nn for ts, nn in datos if ts <= t)
    d = ImageDraw.Draw(img, "RGBA")
    x0, y0, seg = 620, 40, 34
    d.rounded_rectangle((x0 - 130, y0 - 22, x0 + 20 * seg + 30, y0 + 22), radius=16, fill=(0, 0, 0, 120))
    text_c(d, x0 - 65, y0, f"{n}/20", 30, GOLD, True)
    for i in range(20):
        c = GOLD + (255,) if i < n else (255, 255, 255, 70)
        d.rounded_rectangle((x0 + i * seg, y0 - 5, x0 + i * seg + seg - 6, y0 + 5), radius=4, fill=c)

def like_overlay(img, t):
    if like_t is None or not (like_t - 0.3 <= t < like_t + 4.0): return
    lt = t - like_t + 0.3
    s = back(prog(lt, 0, 0.5)) * (1 - ease(prog(lt, 3.8, 4.3)))
    clicked = lt > 1.6
    if s < 0.05: return
    d = ImageDraw.Draw(img, "RGBA")
    bw, bh = 560 * s, 140 * s; cx, cy = W / 2, H / 2 - 60
    d.rounded_rectangle((cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2), radius=int(30 * s),
                        fill=(230, 30, 40, 240) if not clicked else (40, 120, 255, 240))
    text_c(d, cx, cy, "👍  ¡DALE LIKE!".replace("👍  ", ""), 64 * s, WHITE, True)

def subtitles(img, t):
    c = next((c for c in chunks if c["s"] <= t < c["e"]), None)
    if not c: return
    d = ImageDraw.Draw(img)
    f = font(64)
    parts = [w["w"] for w in c["w"]]
    widths = [f.getlength(p) for p in parts]; sp = f.getlength(" ")
    tw = sum(widths) + sp * (len(parts) - 1)
    x = W / 2 - tw / 2; y = H - 140
    pop = back(prog(t, c["s"], c["s"] + 0.18))
    for w, wd in zip(c["w"], widths):
        on = w["vs"] - 0.05 <= t
        col = GOLD if (w["vs"] - 0.05 <= t < w["ve"] + 0.05) else WHITE
        d.text((x, y + 6 * (1 - pop)), w["w"], font=f, fill=col, stroke_width=7, stroke_fill=(0, 0, 0))
        x += wd + sp

def title_card(img, t):
    """cortinilla inicial de la parte 2"""
    logo_scene(img, t, 0, "intro")

# ---------------- render ----------------
def scene_frame(s, t, idx):
    if s["file"] is None:
        im = Image.new("RGB", (W, H))
        kind = "intro"
        if s["id"] in ("v1_59", "v2_50"): kind = "comments"
        if s["id"] in ("v1_60", "v2_51"): kind = "subscribe"
        logo_scene(im, t, s["t"], kind)
        return im
    x = prog(t, s["t"], s["end"] + 0.4)
    return kenburns(s["file"], x, idx)

def render(t):
    if VID == "v2" and t < PRE:
        im = Image.new("RGB", (W, H)); title_card(im, t)
    else:
        k = max(i for i, s in enumerate(scenes) if s["t"] <= t)
        s = scenes[k]
        im = scene_frame(s, t, k)
        fade = 0.35
        if k > 0 and t < s["t"] + fade:
            prev = scene_frame(scenes[k - 1], t, k - 1)
            im = Image.blend(prev, im, ease(prog(t, s["t"], s["t"] + fade)))
        if s["file"] is not None:
            # viñeta suave para que el texto se lea
            im = Image.composite(im, Image.new("RGB", (W, H)), VIGN)
    progress(im, t); dato_badge(im, t); like_overlay(im, t); subtitles(im, t)
    a = min(prog(t, 0, 0.4), 1 - prog(t, DUR - 0.8, DUR))
    if a < 1: im = Image.eval(im, lambda v: int(v * a))
    return im

yy, xx = np.mgrid[0:H, 0:W]
r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
v = np.clip(1.15 - 0.35 * r ** 2, 0, 1); v[H - 260:] *= np.linspace(1, 0.55, 260)[:, None]
VIGN = Image.fromarray((v * 255).astype(np.uint8))

if __name__ == "__main__":
    out = sys.argv[2]
    t0 = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
    t1 = float(sys.argv[4]) if len(sys.argv) > 4 else DUR
    # audio: tramos del original + silencio inicial (parte 2)
    tmpa = out + ".wav"
    fc = "".join(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st={b - a - 0.12}:d=0.12[a{i}];"
                 for i, (a, b) in enumerate(SEGS))
    fc += "".join(f"[a{i}]" for i in range(len(SEGS))) + f"concat=n={len(SEGS)}:v=0:a=1[c];"
    fc += f"[c]adelay={int(PRE * 1000)}:all=1,atrim=start={t0}:end={t1},asetpts=PTS-STARTPTS[o]"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", AUDIO, "-filter_complex", fc, "-map", "[o]",
                    "-ar", "44100", tmpa], check=True)
    p = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", tmpa,
                          "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
                          "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out],
                         stdin=subprocess.PIPE)
    n0, n1 = int(t0 * FPS), int(t1 * FPS)
    miss = sorted({s["id"] for s in scenes if s.get("missing")})
    print(f"{VID}: {DUR:.1f}s, {len(scenes)} escenas, faltan {len(miss)} imágenes", flush=True)
    for fi in range(n0, n1):
        p.stdin.write(render(fi / FPS).tobytes())
        if (fi - n0) % 900 == 0: print(f"  {fi / FPS:6.1f}s", flush=True)
    p.stdin.close(); p.wait(); os.remove(tmpa)
    print("Listo:", out)
