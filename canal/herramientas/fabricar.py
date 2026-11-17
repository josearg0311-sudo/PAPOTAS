"""Fábrica de "¿Acaso lo sabías?": convierte un guion en un Short terminado.

Uso (desde la carpeta canal/):
    python3 herramientas/fabricar.py Guiones/S01_onoda.md

Necesita, para un guion con id S01:
  - La voz:     "Pon aquí tu voz/S01.mp3" (o .wav/.m4a)  o  "En proceso/S01/voz.mp3"
  - Las imágenes en "En proceso/S01/":  escena_01.jpg, escena_02.jpg …
    y, para las escenas en viñetas (opcional): escena_02_b.jpg y escena_02_c.jpg (primer plano y detalle).
Entrega en "Vídeos listos/":  S01 - <título>.mp4,  S01 - youtube.txt  y  S01 - miniatura.jpg
"""
import difflib, glob, json, os, re, subprocess, sys, unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERR = os.path.join(RAIZ, 'herramientas')


def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z0-9ñ]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn'))


def leer_guion(ruta):
    txt = open(ruta, encoding='utf-8').read()
    g = {'titulo': re.search(r'^#\s+(.+)$', txt, re.M).group(1).strip()}
    for k, v in re.findall(r'^(\w+):\s*(.+)$', txt.split('##')[0], re.M):
        g[k.lower()] = v.strip()
    narr = re.search(r'##\s*Narraci[oó]n\s*\n(.*?)(?=\n##|\Z)', txt, re.S).group(1)
    g['narracion'] = re.sub(r'\[[^\]]*\]', '', narr).strip()
    filas = [l for l in re.search(r'##\s*Escenas\s*\n(.*?)(?=\n##|\Z)', txt, re.S).group(1).splitlines() if l.strip().startswith('|')]
    g['escenas'] = []
    for l in filas[2:]:  # salta cabecera y separador
        c = [x.strip() for x in l.strip().strip('|').split('|')]
        g['escenas'].append({'n': int(c[0]), 'desde': c[1], 'diseno': c[2].lower(), 'mov': c[3] or 'in', 'efecto': c[4].lower()})
    return g


def transcribir(voz, destino):
    if os.path.exists(destino) and os.path.getmtime(destino) > os.path.getmtime(voz):
        return json.load(open(destino))
    import numpy as np
    from faster_whisper import WhisperModel
    m = WhisperModel('Systran/faster-whisper-medium', device='cpu', compute_type='int8')
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', voz, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    segs, _ = m.transcribe(np.frombuffer(raw, np.int16).astype(np.float32) / 32768, language='es', word_timestamps=True,
                           beam_size=5, vad_filter=True, condition_on_previous_text=False)
    out = [{'w': w.word.strip(), 's': round(w.start, 3), 'e': round(w.end, 3)} for s in segs for w in s.words]
    json.dump(out, open(destino, 'w'), ensure_ascii=False)
    return out


def corregir(words, narracion):
    """Usa la ortografía del guion en los subtítulos cuando Whisper se equivoca (nombres, tildes)."""
    guion = narracion.split()
    a, b = [norm(w['w']) for w in words], [norm(x) for x in guion]
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op in ('equal', 'replace') and i2 - i1 == j2 - j1:
            for k in range(i2 - i1):
                if op == 'equal' or difflib.SequenceMatcher(None, a[i1 + k], b[j1 + k]).ratio() > .5:
                    words[i1 + k]['w'] = guion[j1 + k]
    return words


def buscar(words, frase, desde_t):
    f = [norm(x) for x in frase.split() if norm(x)]
    a = [norm(w['w']) for w in words]
    mejor, mi = 0, None
    for i in range(len(a)):
        if words[i]['s'] < desde_t - .01:
            continue
        r = difflib.SequenceMatcher(None, ' '.join(a[i:i + len(f)]), ' '.join(f)).ratio()
        if r > mejor + .01:
            mejor, mi = r, i
    if mi is None or mejor < .6:
        sys.exit(f'No encuentro en la voz la frase de la escena: "{frase}"')
    return words[mi]['s']


def main():
    ruta = sys.argv[1]; g = leer_guion(ruta); vid = g['id']
    trabajo = os.path.join(RAIZ, 'En proceso', vid); os.makedirs(trabajo, exist_ok=True)
    voces = glob.glob(os.path.join(RAIZ, 'Pon aquí tu voz', vid + '.*')) + glob.glob(os.path.join(trabajo, 'voz.*'))
    voces = [v for v in voces if v.lower().endswith(('.mp3', '.wav', '.m4a'))]
    if not voces:
        sys.exit(f'Falta la voz: pon "{vid}.mp3" en "Pon aquí tu voz/" o "voz.mp3" en "En proceso/{vid}/".')
    voz = voces[0]; print('Voz:', os.path.relpath(voz, RAIZ))
    for e in g['escenas']:
        f = os.path.join(trabajo, f"escena_{e['n']:02d}.jpg")
        if not os.path.exists(f):
            sys.exit(f'Falta la imagen {os.path.relpath(f, RAIZ)}')
    print('Transcribiendo y sincronizando…')
    words = corregir(transcribir(voz, os.path.join(trabajo, 'whisper.json')), g['narracion'])
    a = [norm(w['w']) for w in words]
    sello = next(w['s'] for w, n in zip(words, a) if n == 'acaso')
    salto = next(w['e'] for w, n in zip(words, a) if n == 'cuento' and w['s'] > sello) + .05
    fin = words[-1]['e'] + .35
    scenes, t_prev, shakes = [], 0, []
    for e in g['escenas']:
        t = 0 if e['n'] == 1 else buscar(words, e['desde'], t_prev) - .15
        if 0 < t - salto < 1.2 or abs(t - salto) < .4:
            t = salto
        t_prev = t + .1
        sc = {'t': round(t, 3), 'img': f"escena_{e['n']:02d}.jpg", 'move': e['mov']}
        det = [f"escena_{e['n']:02d}_{x}.jpg" for x in 'bc']
        if e['diseno'].startswith('vi') and all(os.path.exists(os.path.join(trabajo, d)) for d in det):
            sc['layout'] = 'vinetas'; sc['det'] = det   # viñetas solo con imágenes de detalle reales (nunca recortes repetidos)
        for amb in ('polvo', 'lluvia', 'brasas', 'salpicaduras'):
            if amb in e['efecto']: sc['amb'] = amb
        if 'luz' in e['efecto']: sc['luz'] = True
        if 'temblor' in e['efecto']:
            shakes.append(sc['t'])
        scenes.append(sc)
    fx = {'sello': sello, 'salto': salto, 'serie': g.get('serie', ''), 'color': g.get('color', '#FFC93C'), 'shake': shakes, 'fin': round(fin, 3)}
    if g.get('lugar'):
        l1, _, l2 = g['lugar'].partition('|'); fx['lugar'] = {'t': round(salto + .65, 3), 'l1': l1.strip(), 'l2': l2.strip()}
    chunks, cur = [], []
    for i, w in enumerate(words):
        cur.append(w); gap = words[i + 1]['s'] - w['e'] if i + 1 < len(words) else 9
        if w['w'][-1] in '.,?!:;…' or len(cur) >= 3 or gap > .35:
            chunks.append({'s': cur[0]['s'], 'e': cur[-1]['e'], 'w': cur}); cur = []
    json.dump({'dur': round(fin + 3.3, 3), 'estilo': g.get('estilo', 'vivo'), 'chunks': chunks, 'scenes': scenes, 'fx': fx},
              open(os.path.join(trabajo, 'tl.json'), 'w'), ensure_ascii=False)
    if not voz.startswith(trabajo):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', voz, os.path.join(trabajo, 'voz.mp3')], check=True)
    print('Mezclando audio…'); subprocess.run([sys.executable, os.path.join(HERR, 'marca_audio.py'), trabajo], check=True)
    listos = os.path.join(RAIZ, 'Vídeos listos'); os.makedirs(listos, exist_ok=True)
    titulo = re.sub(r'[\\/:*?"<>|]', '', g['titulo'])
    salida = os.path.join(listos, f'{vid} - {titulo}.mp4')
    print('Montando el vídeo (tarda unos minutos)…')
    subprocess.run(['node', os.path.join(HERR, 'render_marca.js'), trabajo, salida], check=True)
    if g.get('miniatura'):
        m1, _, m2 = g['miniatura'].partition('|')
        subprocess.run([sys.executable, os.path.join(HERR, 'marca_miniatura.py'), os.path.join(trabajo, 'escena_01.jpg'), m1.strip(), m2.strip(),
                        g.get('serie', ''), g.get('color', '#FFC93C'), os.path.join(listos, f'{vid} - miniatura.jpg')], check=True)
    with open(os.path.join(listos, f'{vid} - youtube.txt'), 'w', encoding='utf-8') as f:
        f.write(f"TÍTULO:\n{g['titulo']}\n\nDESCRIPCIÓN:\n{g.get('descripcion', '')}\n\n{g.get('hashtags', '')}\n\nCOMENTARIO FIJADO:\n{g.get('comentario', '')}\n")
    print('✅ Listo:', os.path.relpath(salida, RAIZ))


if __name__ == '__main__':
    main()
