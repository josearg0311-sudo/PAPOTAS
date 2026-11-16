"""Alineamiento forzado del guion con el audio (técnica tipo aeneas):
1. se sintetiza el guion palabra a palabra con espeak-ng (sabemos dónde empieza cada palabra),
2. se compara con la voz real mediante MFCC + DTW (alineamiento temporal dinámico),
3. el camino DTW traslada el tiempo de cada palabra sintética al audio real.
Pasada gruesa (todo el audio, 50 ms) + pasada fina por párrafo (10 ms).
Uso: python3 alinear_dtw.py <audio.wav>   -> palabras.json"""
import sys, re, json, subprocess, io, wave
import numpy as np, librosa

SR, HOP = 16000, 160
AUDIO = sys.argv[1]
txt = open("guion.txt", encoding="utf-8").read().strip()
words = []
for pi, par in enumerate([p for p in txt.split("\n\n") if p.strip()]):
    for w in par.split():
        words.append({"w": w, "par": pi})

def tts(text):
    out = subprocess.run(["espeak-ng", "-v", "es-419", "-s", "230", "--stdout", text], capture_output=True).stdout
    y, sr = librosa.load(io.BytesIO(out), sr=SR)
    y, _ = librosa.effects.trim(y, top_db=35)
    return y

# 1) voz sintética palabra a palabra
cache, synth, pos = {}, [], 0
for k, w in enumerate(words):
    clean = re.sub(r"[¿¡\"“”()]", "", w["w"]).strip(".,;:…!?")
    if clean not in cache: cache[clean] = tts(clean) if clean else np.zeros(1)
    y = cache[clean]
    w["ss"] = pos / SR; synth.append(y); pos += len(y); w["se"] = pos / SR
    nxt = words[k + 1] if k + 1 < len(words) else None
    gap = 0.03
    if re.search(r"[,;]$", w["w"]): gap = 0.25
    if re.search(r"[.?!…:]$", w["w"]): gap = 0.5
    if nxt and nxt["par"] != w["par"]: gap = 0.8
    synth.append(np.zeros(int(gap * SR))); pos += int(gap * SR)
syn = np.concatenate(synth)
real, _ = librosa.load(AUDIO, sr=SR)
print(f"sintético {len(syn)/SR:.1f}s, real {len(real)/SR:.1f}s", flush=True)

def feats(y, hop):
    m = librosa.feature.mfcc(y=y, sr=SR, n_mfcc=20, hop_length=hop, n_fft=512)[1:]
    m = np.vstack([m, librosa.feature.delta(m)])
    return (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)

# 2) pasada gruesa (50 ms)
HC = 800
A, B = feats(syn, HC), feats(real, HC)
_, wp = librosa.sequence.dtw(X=A, Y=B, metric="cosine")
wp = wp[::-1]
def coarse(ts):
    i = int(ts * SR / HC); j = wp[np.searchsorted(wp[:, 0], min(i, wp[-1, 0])), 1]
    return j * HC / SR

# 3) pasada fina por párrafo
pars = sorted({w["par"] for w in words})
for p in pars:
    ws = [w for w in words if w["par"] == p]
    s0, s1 = max(0.0, ws[0]["ss"] - 0.05), ws[-1]["se"] + 0.05
    r0 = max(0, coarse(s0) - 1.5); r1 = min(len(real) / SR, coarse(s1) + 1.5)
    a = feats(syn[int(s0 * SR):int(s1 * SR)], HOP)
    b = feats(real[int(r0 * SR):int(r1 * SR)], HOP)
    _, path = librosa.sequence.dtw(X=a, Y=b, metric="cosine", subseq=True)
    path = path[::-1]
    def m(ts):
        i = int((ts - s0) * SR / HOP); i = min(max(i, 0), path[-1, 0])
        js = path[path[:, 0] == i, 1]
        return r0 + (js.min() if len(js) else path[np.searchsorted(path[:, 0], i), 1]) * HOP / SR
    for w in ws:
        w["s"] = round(m(w["ss"]), 3); w["e"] = round(max(m(w["se"]), w["s"] + 0.05), 3)

# limpieza: monotonía
for k in range(1, len(words)):
    if words[k]["s"] < words[k - 1]["s"]: words[k]["s"] = words[k - 1]["s"]
    if words[k]["e"] < words[k]["s"] + 0.05: words[k]["e"] = words[k]["s"] + 0.05
out = [{"w": w["w"], "s": w["s"], "e": w["e"], "par": w["par"]} for w in words]
json.dump(out, open("palabras.json", "w"), ensure_ascii=False)
for p in pars:
    ws = [w for w in out if w["par"] == p]
    print(f"{p:2d} {ws[0]['s']:7.2f}-{ws[-1]['e']:7.2f} {' '.join(x['w'] for x in ws)[:60]}")
