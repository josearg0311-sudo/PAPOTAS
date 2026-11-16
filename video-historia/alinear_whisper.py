"""Sincroniza el guion con el audio usando la transcripción de Whisper (whisper.json).
- Quita del audio los tramos sobrantes (toma repetida del dato 4 y el fragmento en inglés del final)
  -> audio_editado.wav
- Empareja cada palabra del guion con la palabra reconocida por Whisper (difflib); las que no
  coinciden (números escritos con cifras, etc.) se interpolan entre las vecinas.
-> palabras.json  [{w, s, e, par}] con tiempos del audio editado."""
import json, re, sys, subprocess, unicodedata, difflib

AUDIO = sys.argv[1]
CORTES = [(101.95, 119.97), (523.90, 1e9)]   # tramos a eliminar (segundos del audio original)

def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ]", "", s)
def edit_t(t):
    """tiempo original -> tiempo en el audio editado (None si cae en un corte)"""
    off = 0.0
    for a, b in CORTES:
        if a <= t < b: return None
        if t >= b: off += b - a
    return t - off

wh = [w for w in json.load(open("whisper.json", encoding="utf-8")) if edit_t(w["s"]) is not None]
for w in wh: w["s"], w["e"] = edit_t(w["s"]), edit_t(w["e"])
txt = open("guion.txt", encoding="utf-8").read().strip()
words = []
for pi, par in enumerate([p for p in txt.split("\n\n") if p.strip()]):
    for w in par.split(): words.append({"w": w, "par": pi})

A = [norm(w["w"]) for w in words]; B = [norm(w["w"]) for w in wh]
sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
for i, j, n in sm.get_matching_blocks():
    for k in range(n): words[i + k]["s"], words[i + k]["e"] = wh[j + k]["s"], wh[j + k]["e"]
# casi-coincidencias dentro de huecos del mismo tamaño (p. ej. "Nedía" ~ "Medía")
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "replace" and i2 - i1 == j2 - j1:
        for k in range(i2 - i1):
            if difflib.SequenceMatcher(None, A[i1 + k], B[j1 + k]).ratio() > .6:
                words[i1 + k]["s"], words[i1 + k]["e"] = wh[j1 + k]["s"], wh[j1 + k]["e"]
    if tag == "replace" and i2 - i1 != j2 - j1:   # números en cifras: repartir el tramo de Whisper
        s0, e0 = wh[j1]["s"], wh[j2 - 1]["e"]; tot = sum(len(A[k]) + 1 for k in range(i1, i2)); acc = 0
        for k in range(i1, i2):
            words[k]["s"] = s0 + (e0 - s0) * acc / tot; acc += len(A[k]) + 1; words[k]["e"] = s0 + (e0 - s0) * acc / tot
matched = sum(1 for w in words if "s" in w)
# interpolar lo que falte
idx = [k for k, w in enumerate(words) if "s" in w]
for k, w in enumerate(words):
    if "s" in w: continue
    a = max([i for i in idx if i < k], default=None); b = min([i for i in idx if i > k], default=None)
    ta = words[a]["e"] if a is not None else 0.0; tb = words[b]["s"] if b is not None else ta + 1
    na, nb = (a if a is not None else -1), (b if b is not None else len(words))
    f0 = (k - na - 1 + .1) / (nb - na - 1 + .2); f1 = (k - na - .1) / (nb - na - 1 + .2)
    w["s"], w["e"] = ta + (tb - ta) * f0, ta + (tb - ta) * f1
for k in range(1, len(words)):
    if words[k]["s"] < words[k - 1]["s"]: words[k]["s"] = words[k - 1]["s"]
    if words[k]["e"] <= words[k]["s"]: words[k]["e"] = words[k]["s"] + .08
out = [{"w": w["w"], "s": round(w["s"], 3), "e": round(w["e"], 3), "par": w["par"]} for w in words]
json.dump(out, open("palabras.json", "w"), ensure_ascii=False)
print(f"palabras {len(words)}, emparejadas con Whisper {matched} ({100 * matched / len(words):.0f}%)")

# audio editado
keep, t = [], 0.0
for a, b in CORTES: keep.append((t, a)); t = b
fc = "".join(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.03[a{i}];" for i, (a, b) in enumerate(keep))
fc += "".join(f"[a{i}]" for i in range(len(keep))) + f"concat=n={len(keep)}:v=0:a=1[o]"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", AUDIO, "-filter_complex", fc, "-map", "[o]", "-ar", "44100", "audio_editado.wav"], check=True)
print("audio_editado.wav listo")
