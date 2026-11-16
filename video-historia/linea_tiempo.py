"""Prepara la línea de tiempo de cada vídeo (escenas, subtítulos, insignias) y su audio.
Uso: python3 linea_tiempo.py v1|v2   -> motor2d/tl_v1.json + motor2d/audio_v1.wav"""
import sys, os, re, json, subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(AQUI, "audio_editado.wav")
VID = sys.argv[1]
words = json.load(open(os.path.join(AQUI, "palabras.json"), encoding="utf-8"))
norm = lambda s: re.sub(r"[^\wáéíóúñü]", "", s.lower())
toks = [norm(w["w"]) for w in words]
def find(phrase, start=0):
    p = [t for t in (norm(x) for x in phrase.split()) if t]
    for i in range(start, len(toks)):
        if toks[i:i + len(p)] == p: return i
    raise ValueError("no encuentro: " + phrase)
first = lambda p: next(i for i, w in enumerate(words) if w["par"] == p)
last = lambda p: max(i for i, w in enumerate(words) if w["par"] == p)
dur_audio = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", AUDIO],
                                 capture_output=True, text=True).stdout)
END = words[-1]["e"] + 1.2
if VID == "v1":
    PRE = 0.0
    SEGS = [(0.0, words[last(17)]["e"] + 0.5), (words[first(31)]["s"] - 0.3, min(END, dur_audio))]
    TITLE = "20 datos históricos que no te enseñaron en el colegio"
else:
    PRE = 3.0
    SEGS = [(words[first(2)]["s"] - 0.25, words[last(2)]["e"] + 0.45), (words[first(18)]["s"] - 0.3, min(END, dur_audio))]
    TITLE = "20 datos históricos que no te enseñaron en el colegio · PARTE 2"
def a2v(t):
    off = PRE
    for a, b in SEGS:
        if a <= t <= b: return off + t - a
        off += b - a
    return None
DUR = PRE + sum(b - a for a, b in SEGS)

rows = [[c.strip() for c in l.split("|")] for l in open(os.path.join(AQUI, "escenas2d.txt"), encoding="utf-8")
        if l.strip() and not l.startswith("#")]
scenes, pos = [], 0
for sid, anchor, key in rows:
    if not sid.startswith(VID): continue
    if VID == "v2" and anchor.startswith("Dato número once"): pos = first(18)
    if key in ("logo_comments", "logo_subscribe"): pos = max(pos, first(31))
    i = find(anchor, pos); pos = i
    t = a2v(words[i]["s"])
    if t is not None: scenes.append({"id": sid, "key": key, "t": round(max(0, t - 0.12), 3)})
scenes[0]["t"] = PRE
if VID == "v2": scenes.insert(0, {"id": "v2_00", "key": "title_card", "t": 0.0})
for k, s in enumerate(scenes): s["end"] = scenes[k + 1]["t"] if k + 1 < len(scenes) else DUR

vw = []
for w in words:
    s, e = a2v(w["s"]), a2v(w["e"])
    if s is not None and e is not None: vw.append({"w": w["w"], "s": round(s, 3), "e": round(e, 3), "par": w["par"]})
chunks, cur = [], []
for k, w in enumerate(vw):
    cur.append(w); nxt = vw[k + 1] if k + 1 < len(vw) else None
    txt = " ".join(x["w"] for x in cur)
    if (re.search(r"[.?!…:,;]$", w["w"]) or len(cur) >= 5 or len(txt) > 28 or nxt is None
            or nxt["par"] != w["par"] or nxt["s"] - w["e"] > 0.5):
        chunks.append(cur); cur = []
CH = []
for k, c in enumerate(chunks):
    nxt = chunks[k + 1][0]["s"] if k + 1 < len(chunks) else c[-1]["e"] + 0.6
    CH.append({"s": round(c[0]["s"] - 0.06, 3), "e": round(min(nxt - 0.02, c[-1]["e"] + 0.5), 3), "w": c})
NUM = {w: i + 1 for i, w in enumerate("uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece "
                                      "catorce quince dieciséis diecisiete dieciocho diecinueve veinte".split())}
datos = []
for k, w in enumerate(vw):
    if norm(w["w"]) == "dato" and k + 2 < len(vw) and norm(vw[k + 1]["w"]) == "número":
        n = NUM.get(norm(vw[k + 2]["w"]))
        if n: datos.append([w["s"], n])
like = next((w["s"] for w in vw if norm(w["w"]) == "like"), None)
tl = {"vid": VID, "dur": round(DUR, 3), "pre": PRE, "title": TITLE, "scenes": scenes, "chunks": CH, "datos": datos,
      "like": like, "outro": a2v(words[first(31)]["s"])}
json.dump(tl, open(os.path.join(AQUI, f"motor2d/tl_{VID}.json"), "w"), ensure_ascii=False)

fc = "".join(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.06,afade=t=out:st={b - a - 0.1}:d=0.1[a{i}];"
             for i, (a, b) in enumerate(SEGS))
fc += "".join(f"[a{i}]" for i in range(len(SEGS))) + f"concat=n={len(SEGS)}:v=0:a=1[c];[c]adelay={int(PRE * 1000)}:all=1[o]"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", AUDIO, "-filter_complex", fc, "-map", "[o]", "-ar", "44100",
                os.path.join(AQUI, f"motor2d/audio_{VID}.wav")], check=True)
print(f"{VID}: {DUR:.1f}s, {len(scenes)} escenas, {len(CH)} subtítulos, datos {[n for _, n in datos]}")
