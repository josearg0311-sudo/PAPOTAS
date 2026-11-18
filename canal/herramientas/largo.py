"""Vídeo largo "7 cosas que (seguro) no sabías" A PANTALLA COMPLETA (1920×1080) a partir de los Shorts de la semana.

Uso:  python3 herramientas/largo.py Largos/L01.json [--prueba SEGUNDOS]

Reaprovecha de cada Short (En proceso/<id>/): la mezcla de audio (voz+música), los subtítulos con tiempos (tl.json),
los personajes recortados y el clip animado. Usa fondos NUEVOS en horizontal: "ancho_NN.jpg" (NN = número de escena).
Si falta un fondo ancho, usa el vertical recortado (solo para pruebas).
La voz de presentación y los puentes salen de un único audio (voz_largo) que se trocea por frases.

L01.json: {"id": "L01", "titulo": "7 cosas que (seguro) no sabías", "historias": ["S10", ...] (de #7 a #1),
           "voz": "En proceso/L01/voz.mp3" (opcional), "frases": {"intro": "...", "S10": "...", ..., "cierre": "..."},
           "clip_intro": "En proceso/L01/intro.mp4" (opcional)}
"""
import glob, json, math, os, re, subprocess, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EP, VL, REC = os.path.join(R, 'En proceso'), os.path.join(R, 'Vídeos listos'), os.path.join(R, 'recursos')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from recopilatorio import cortes, guion  # mismos cortes que el Express

W, H, FPS = 1920, 1080, 30
ORO, TINTA, CREMA = (255, 201, 60), (13, 12, 11), (243, 233, 210)
F = lambda peso, tam: ImageFont.truetype(os.path.join(REC, 'fuentes', f'montserrat-latin-{peso}-normal.woff'), tam)
TMP = tempfile.mkdtemp(prefix='largo_')


def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def cubrir(im, w, h):
    r = max(w / im.width, h / im.height); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def ease(x): x = min(max(x, 0), 1); return 1 - (1 - x) ** 3


# ───────────── capas fijas (grano, viñeta, logo) ─────────────
rng = np.random.default_rng(7)
VIG = Image.new('L', (W, H), 0)
_yy, _xx = np.mgrid[0:H, 0:W]
_d = np.sqrt(((_xx - W / 2) / (W / 2)) ** 2 + ((_yy - H / 2) / (H / 2)) ** 2)
VIG = Image.fromarray((np.clip((_d - 0.55) / 0.75, 0, 1) * 150).astype('uint8'))
NEGRO = Image.new('RGB', (W, H), TINTA)
GRANOS = [Image.fromarray(rng.integers(0, 28, (H // 2, W // 2), dtype='uint8')).resize((W, H)) for _ in range(4)]
LOGO = Image.open(os.path.join(REC, 'logo.png')).convert('RGBA'); LOGO.thumbnail((120, 120))


def acabado(im, paso):
    im = Image.composite(NEGRO, im, VIG)                                   # viñeta
    g = GRANOS[paso % 4]
    im = Image.blend(im, Image.merge('RGB', (g, g, g)), 0.06)              # grano de película
    return im


# ───────────── historia (escenas de un Short en horizontal) ─────────────
class Historia:
    def __init__(self, vid, num):
        self.vid, self.num = vid, num
        d = os.path.join(EP, vid); self.d = d
        self.tl = json.load(open(os.path.join(d, 'tl.json')))
        self.info = guion(vid)
        if self.info['serie'].upper() == 'ESTRENO': self.info.update(serie='HISTORIAS QUE PARECEN MENTIRA', color='#FFC93C')
        self.cortes = cortes(vid)
        self.dur = sum(b - a for a, b in self.cortes)
        self.col = hexrgb(self.info['color'] or '#FFC93C')
        self.cache = {}

    def fondo(self, i, sc):
        k = ('f', i)
        if k not in self.cache:
            ancho = os.path.join(self.d, f'ancho_{i + 1:02d}.jpg')
            src = ancho if os.path.exists(ancho) else os.path.join(self.d, sc.get('fondo') or sc['img'])
            self.cache[k] = cubrir(Image.open(src).convert('RGB'), int(W * 1.1), int(H * 1.1))
        return self.cache[k]

    def personaje(self, sc):
        k = ('p', sc['pj'])
        if k not in self.cache:
            p = Image.open(os.path.join(self.d, sc['pj'])).convert('RGBA')
            bb = p.getbbox() or (0, 0, p.width, p.height); p = p.crop(bb)
            r = min(H * 0.86 / p.height, W * 0.45 / p.width); p = p.resize((round(p.width * r), round(p.height * r)), Image.LANCZOS)
            sombra = Image.new('RGBA', p.size, (0, 0, 0, 0)); a = p.getchannel('A').point(lambda v: int(v * 0.55))
            sombra.putalpha(a.filter(ImageFilter.GaussianBlur(18)))
            self.cache[k] = (p, sombra)
        return self.cache[k]

    def clip(self, sc, idx):
        k = ('c', idx)
        if k not in self.cache:
            fr = sc['frames'][min(idx, len(sc['frames']) - 1)]
            im = Image.open(os.path.join(self.d, fr)).convert('RGB')
            bg = cubrir(im, W, H).filter(ImageFilter.GaussianBlur(26)).point(lambda v: int(v * 0.55))
            ph = int(H * 0.86); pw = round(ph * im.width / im.height)
            panel = Image.new('RGB', (pw + 24, ph + 24), CREMA); panel.paste(im.resize((pw, ph), Image.LANCZOS), (12, 12))
            panel = panel.convert('RGBA').rotate(-2.5, expand=True, resample=Image.BICUBIC)
            if len(self.cache) > 60: self.cache = {kk: v for kk, v in self.cache.items() if kk[0] != 'c'}
            self.cache[k] = (bg, panel)
        return self.cache[k]

    def escena(self, s):
        scs = self.tl['scenes']; i = max(j for j, sc in enumerate(scs) if sc['t'] <= s + 1e-6)
        fin = scs[i + 1]['t'] if i + 1 < len(scs) else self.tl['dur']
        return i, scs[i], fin

    def frame(self, s):
        """s = tiempo dentro del Short original."""
        paso = math.floor(s * 12); sq = paso / 12                     # stop-motion: 12 pasos por segundo
        rj = np.random.default_rng(paso + 3); jx, jy = rj.integers(-3, 4, 2)
        i, sc, fin = self.escena(sq); ls = sq - sc['t']; dur = max(fin - sc['t'], 0.5); p = min(ls / dur, 1)
        if 'pj' in sc or 'fondo' in sc:
            bg = self.fondo(i, sc); mv = sc.get('move', 'in')
            z = {'in': 1 + 0.06 * p, 'in_fast': 1 + 0.1 * ease(p), 'out': 1.06 - 0.06 * p}.get(mv, 1.03)
            cw, ch = int(W * 1.1 / z), int(H * 1.1 / z)
            ox = (bg.width - cw) // 2 + jx; oy = (bg.height - ch) // 2 + jy
            if mv == 'up': oy = int((bg.height - ch) * (1 - p)) + jy
            ox = max(0, min(ox, bg.width - cw)); oy = max(0, min(oy, bg.height - ch))
            im = bg.crop((ox, oy, ox + cw, oy + ch)).resize((W, H), Image.BILINEAR)
            if 'pj' in sc:
                pj, sombra = self.personaje(sc)
                izq = sc.get('entra', 'izq') != 'der'
                x0 = 140 if izq else W - pj.width - 140
                e = ease(ls / 0.45); desde = -pj.width if izq else W
                x = int(desde + (x0 - desde) * e) + jx
                b = 1 + 0.012 * math.sin(sq * 2.1)
                if sc.get('nervio'): x += int(rj.integers(-5, 6))
                pw, ph = int(pj.width * b), int(pj.height * b)
                y = H - ph + 10 + jy
                im.paste(sombra.resize((pw, ph)), (x + 18, y + 14), sombra.resize((pw, ph)))
                im.paste(pj.resize((pw, ph)), (x, y), pj.resize((pw, ph)))
        else:  # clip animado del Short: se ve como una foto de plastilina sobre su propio fondo
            bg, panel = self.clip(sc, int(ls * 12))
            im = bg.copy(); im.paste(panel, ((W - panel.width) // 2 + jx, (H - panel.height) // 2 + jy), panel)
        return acabado(im, paso), s

    def rotulos(self, im, s, t_hist):
        d = ImageDraw.Draw(im)
        im.paste(LOGO, (34, 30), LOGO)
        # número y serie
        f = F(900, 54); txt = f'#{self.num}'; w = d.textlength(txt, font=f)
        d.rounded_rectangle((34, 168, 34 + w + 44, 168 + 78), radius=20, fill=ORO, outline=TINTA, width=4)
        d.text((56, 207), txt, font=f, fill=TINTA, anchor='lm')
        fs = F(800, 28); sw = d.textlength(self.info['serie'], font=fs)
        d.rectangle((W - sw - 70, 40, W - 34, 92), fill=TINTA); d.rectangle((W - sw - 70, 92, W - 34, 98), fill=self.col)
        d.text((W - sw - 52, 66), self.info['serie'], font=fs, fill=CREMA, anchor='lm')
        # lugar (máquina de escribir)
        lg = self.tl['fx'].get('lugar')
        if lg and lg['t'] <= s <= lg['t'] + 4:
            k = (s - lg['t']) / 0.9; l1 = lg['l1'][:int(len(lg['l1']) * min(k, 1))]; l2 = lg['l2'][:int(len(lg['l2']) * min(max(k - 0.6, 0), 1))]
            d.rectangle((34, 270, 34 + 10, 360), fill=ORO)
            d.text((60, 270), l1, font=F(900, 40), fill=CREMA, stroke_width=4, stroke_fill=TINTA)
            d.text((60, 322), l2, font=F(800, 30), fill=ORO, stroke_width=3, stroke_fill=TINTA)
        # subtítulos (cinta)
        for ch in self.tl['chunks']:
            if ch['s'] - 0.05 <= s < ch['e'] + 0.12:
                f = F(900, 66); pal = [x['w'].upper() for x in ch['w']]
                ws = [d.textlength(p, font=f) for p in pal]; tot = sum(ws) + 22 * (len(pal) - 1)
                x = (W - tot) / 2; y = H - 170
                d.rectangle((x - 28, y - 16, x + tot + 28, y + 86), fill=TINTA); d.rectangle((x - 28, y + 86, x + tot + 28, y + 94), fill=ORO)
                for p, wd, wo in zip(pal, ws, ch['w']):
                    d.text((x, y), p, font=f, fill=ORO if wo['s'] <= s < wo['e'] + 0.08 else CREMA); x += wd + 22
                break
        return im


# ───────────── tarjetas (intro, puentes, cierre) ─────────────
def tarjeta(fondo, lineas, t, dur, paso):
    k = min(t / 0.35, 1)
    im = fondo.copy(); d = ImageDraw.Draw(im)
    tot = sum(f.size + 26 for _, f, _ in lineas); y = (H - tot) / 2
    for i, (txt, f, c) in enumerate(lineas):
        a = ease((t - 0.12 * i) / 0.35)
        if a <= 0: y += f.size + 26; continue
        w = d.textlength(txt, font=f)
        d.text(((W - w) / 2, y + (1 - a) * 40), txt, font=f, fill=c, stroke_width=5 if f.size > 80 else 3, stroke_fill=TINTA)
        y += f.size + 26
    im.paste(LOGO, (W - 160, 34), LOGO)
    if t > dur - 0.25: im = Image.blend(im, NEGRO, min((t - (dur - 0.25)) / 0.25, 1) * 0.6)
    return acabado(im, paso)


def fondo_tarjeta(h):
    i = next((j for j, sc in enumerate(h.tl['scenes']) if 'fondo' in sc), 0)
    return h.fondo(i, h.tl['scenes'][i]).resize((W, H)).filter(ImageFilter.GaussianBlur(22)).point(lambda v: int(v * 0.42))


# ───────────── voz de presentación troceada ─────────────
def trozos_voz(cfg):
    """Devuelve {clave: (inicio, fin)} dentro de cfg['voz'], localizando cada frase con Whisper."""
    from faster_whisper import WhisperModel
    m = WhisperModel('medium', device='cpu', compute_type='int8')
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', cfg['voz'], '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(audio, language='es', word_timestamps=True, vad_filter=True)
    pal = [(w.word.strip().lower().strip('¿?¡!.,…"'), w.start, w.end) for s in segs for w in s.words]
    claves = list(cfg['frases']); res = {}; j = 0
    norm = lambda x: re.sub(r'[^a-záéíóúñü0-9 ]', '', x.lower())
    for n, k in enumerate(claves):
        primeras = norm(cfg['frases'][k]).split()[:3]
        while j < len(pal) and [p[0] for p in pal[j:j + 3]] != primeras[:len(pal[j:j + 3])]: j += 1
        ini = pal[j][1] if j < len(pal) else 0
        res[k] = [max(ini - 0.08, 0), None]
        if n: res[claves[n - 1]][1] = max(ini - 0.15, res[claves[n - 1]][0] + 0.5)
        j += 1
    res[claves[-1]][1] = pal[-1][2] + 0.25
    return {k: tuple(v) for k, v in res.items()}


def main(ruta, prueba=None):
    cfg = json.load(open(ruta)); n = len(cfg['historias'])
    hs = [Historia(v, n - i) for i, v in enumerate(cfg['historias'])]
    voz = trozos_voz(cfg) if cfg.get('voz') and os.path.exists(cfg['voz']) else {}
    plan = []                              # (tipo, dur, datos)
    dv = lambda k, defecto: (voz[k][1] - voz[k][0] + 0.5) if k in voz else defecto
    plan.append(('intro', max(dv('intro', 5), 5), None))
    for h in hs:
        plan.append(('puente', max(dv(h.vid, 2.4), 2.4), h))
        for a, b in h.cortes: plan.append(('hist', b - a, (h, a)))
    plan.append(('cierre', max(dv('cierre', 5), 5), hs[-1]))
    total = sum(p[1] for p in plan)
    if prueba: total = min(total, prueba)
    print(f'Duración: {total / 60:.1f} min', flush=True)

    # ── textos para YouTube con capítulos ──
    tt, caps = 0.0, []
    for tipo, dur, dat in plan:
        if tipo == 'intro': caps.append((tt, 'Intro'))
        elif tipo == 'puente':
            tit = open(glob.glob(os.path.join(R, 'Guiones', dat.vid + '_*.md'))[0], encoding='utf-8').readline().lstrip('# ').strip()
            caps.append((tt, f'#{dat.num} · {tit}'))
        elif tipo == 'cierre': caps.append((tt, '¿Cuál te sorprendió más?'))
        tt += dur
    fmt = lambda s: f'{int(s // 60)}:{int(s % 60):02d}'
    resumen = ', '.join(open(glob.glob(os.path.join(R, 'Guiones', h.vid + '_*.md'))[0], encoding='utf-8').readline().lstrip('# ').strip() for h in hs[::-1][:3])
    open(os.path.join(VL, f"{cfg['id']} - youtube.txt"), 'w', encoding='utf-8').write(
        f"PUBLICAR: {cfg.get('publicar', '')} (programar en YouTube Studio)\n"
        f"LISTA: Recopilatorios · 7 cosas que no sabías\n"
        f"MINIATURA: '{cfg['id']} - miniatura A.jpg' o '{cfg['id']} - miniatura B.jpg' (puedes probar las dos con 'Probar y comparar')\n\n"
        f"TÍTULO:\n7 cosas que (seguro) NO sabías 🤯 Historias reales increíbles\n\n"
        f"DESCRIPCIÓN:\n7 historias reales que parecen inventadas: {resumen}... ¿Cuál te sorprendió más? Déjame el número en los comentarios 👇\n\n"
        + '\n'.join(f'{fmt(t)} {c}' for t, c in caps) +
        "\n\n¿Acaso lo sabías? 🕰️ Historias reales que no te enseñaron en el colegio. Suscríbete para descubrir algo nuevo cada día.\n"
        "#sabiasque #curiosidades #historiasreales #acasolosabias\n\n"
        "COMENTARIO FIJADO:\n¿Cuál te sorprendió más: del #7 al #1? 👇\n\n"
        "CHECKLIST: subir · título · descripción (con los capítulos) · miniatura · lista · 'No es para niños' · Contenido alterado: No · programar\n")
    if '--textos' in sys.argv: print('textos ok'); return

    # ── audio ──
    mus = os.path.join(REC, 'musica.mp3'); partes = []
    for k, (tipo, dur, dat) in enumerate(plan):
        out = os.path.join(TMP, f'a{k:03d}.wav')
        if tipo == 'hist':
            h, a = dat
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{dur:.3f}', '-i', os.path.join(h.d, 'mezcla.wav'),
                            '-af', f'afade=t=in:d=0.06,afade=t=out:st={dur - 0.1:.3f}:d=0.1', '-ar', '44100', '-ac', '2', out], check=True)
        else:
            clave = {'intro': 'intro', 'cierre': 'cierre'}.get(tipo) or dat.vid
            ins = ['-stream_loop', '-1', '-i', mus]; fc = f"[0:a]atrim=0:{dur:.3f},volume=0.30,afade=t=in:d=0.3,afade=t=out:st={dur - 0.4:.3f}:d=0.4[m]"
            if clave in voz:
                a0, a1 = voz[clave]
                ins += ['-ss', f'{a0:.3f}', '-t', f'{a1 - a0:.3f}', '-i', cfg['voz']]
                fc += f";[1:a]adelay=250|250,apad[v];[m][v]amix=2:normalize=0:duration=first"
            else: fc += ";[m]anull"
            subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-ar', '44100', '-ac', '2', out], check=True)
        partes.append(out)
    lista = os.path.join(TMP, 'a.txt'); open(lista, 'w').write(''.join(f"file '{p}'\n" for p in partes))
    audio = os.path.join(TMP, 'audio.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '44100', audio], check=True)

    # ── vídeo ──
    salida = os.path.join(VL, f"{cfg['id']} - {cfg['titulo']}.mp4")
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
                           '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', salida], stdin=subprocess.PIPE)
    fondos = {h.vid: fondo_tarjeta(h) for h in hs}
    intro_fondo = fondos[hs[-1].vid]
    clip_intro = None
    if cfg.get('clip_intro') and os.path.exists(cfg['clip_intro']):
        cd = os.path.join(TMP, 'intro'); os.makedirs(cd)
        subprocess.run(['ffmpeg', '-v', 'error', '-i', cfg['clip_intro'], '-vf', f'fps=12,scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}', f'{cd}/%04d.jpg'], check=True)
        clip_intro = sorted(glob.glob(f'{cd}/*.jpg'))
    t0 = 0.0; fnum = 0; total_frames = int(total * FPS)
    for tipo, dur, dat in plan:
        nf = int(round(dur * FPS))
        for k in range(nf):
            if fnum >= total_frames: break
            t = k / FPS; paso = math.floor(t * 12)
            if tipo == 'intro':
                if clip_intro: base = Image.open(clip_intro[min(paso, len(clip_intro) - 1)]).convert('RGB')
                else: base = hs[(paso // 18) % len(hs)].frame(hs[(paso // 18) % len(hs)].tl['scenes'][1]['t'] + 1)[0]
                base = Image.blend(base, NEGRO, 0.35)
                im = tarjeta(base, [(f'{n} COSAS QUE', F(800, 64), CREMA), ('(SEGURO)', F(800, 64), CREMA), ('NO SABÍAS', F(900, 150), ORO),
                                    ('Y la número 1 es la más increíble…', F(800, 44), CREMA)], t, dur, paso)
            elif tipo == 'puente':
                h = dat; a, b = (h.info['mini'].split('|') + [''])[:2]
                im = tarjeta(fondos[h.vid], [(f'#{h.num}', F(900, 230), ORO), (h.info['serie'], F(800, 40), h.col),
                                            (f'{a.strip()} {b.strip()}'.strip(), F(900, 76), CREMA)], t, dur, paso)
            elif tipo == 'cierre':
                im = tarjeta(intro_fondo, [('¿CUÁL TE SORPRENDIÓ MÁS?', F(900, 92), ORO), ('Déjame el número en los comentarios', F(800, 52), CREMA),
                                           ('SUSCRÍBETE PARA MÁS', F(900, 64), CREMA)], t, dur, paso)
            else:
                h, a = dat; s = a + t
                im, _ = h.frame(s); im = h.rotulos(im, s, t)
                if t < 0.2: im = Image.blend(NEGRO, im, t / 0.2)
            ff.stdin.write(im.tobytes()); fnum += 1
        t0 += dur
        print('ok', tipo, getattr(dat, 'vid', '') if tipo != 'hist' else dat[0].vid, flush=True)
        if fnum >= total_frames: break
    ff.stdin.close(); ff.wait()
    print('✅', salida)


if __name__ == '__main__':
    pr = None
    if '--prueba' in sys.argv: pr = float(sys.argv[sys.argv.index('--prueba') + 1])
    main(sys.argv[1], pr)
