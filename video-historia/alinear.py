"""Sincroniza el guion con el audio sin reconocimiento de voz.
Empareja las pausas del audio (silencios) con los signos de puntuación del guion
mediante programación dinámica, e interpola el tiempo de cada palabra entre pausas.
Salida: palabras.json  [{w, s, e, par}]"""
import re, json, subprocess, sys, bisect
import numpy as np

AUDIO = sys.argv[1]
txt = open("guion.txt", encoding="utf-8").read().strip()
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "csv=p=0", AUDIO], capture_output=True, text=True).stdout)
vals = [float(l.split()[1]) for l in open("silencios.txt")]
sil = [(vals[i], vals[i + 1]) for i in range(0, len(vals) - 1, 2)]
lead = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
tail = sil[-1][0] if sil and sil[-1][1] > dur - 0.05 else dur
gaps = [g for g in sil if g[0] > lead + 0.01 and g[1] < tail - 0.01]

# palabras con párrafo
words = []
for pi, par in enumerate([p for p in txt.split("\n\n") if p.strip()]):
    for w in par.split():
        words.append({"w": w, "par": pi})
def weight(w):
    w = re.sub(r"[^a-záéíóúüñ]", "", w.lower())
    return max(1, len(re.findall(r"[iuü]?[aeoáéóíú][iuy]?|[iu]", w))) + 0.15 if w else 0.15
cum = [0.0]
for w in words: cum.append(cum[-1] + weight(w["w"]))
total = cum[-1]
# rupturas posibles (después de la palabra k)
brk = []
for k, w in enumerate(words[:-1]):
    nxt = words[k + 1]
    if nxt["par"] != w["par"]: s = 4
    elif re.search(r"[.?!]$", w["w"]): s = 3
    elif re.search(r"(…|:|;)$", w["w"]) : s = 2.5
    elif w["w"].endswith(","): s = 1.5
    else: s = 0
    brk.append((k, cum[k + 1], s))
speech = []  # tiempo de voz acumulado hasta el inicio de cada pausa
t_prev, acc = lead, 0.0
for g in gaps:
    acc += g[0] - t_prev; speech.append(acc); t_prev = g[1]
acc_total = acc + (tail - t_prev)
rate = total / acc_total
exp = [s * rate for s in speech]

INF = 1e18
import math
G, B = len(gaps), len(brk)
# nodo final virtual
speechE = speech + [acc_total]
cE = [b[1] for b in brk] + [total]
def pair_cost(i, j):
    k, c, s = brk[j]; L = gaps[i][1] - gaps[i][0]
    if s == 0: return 4.0 + 4 * L
    cost = -0.5 * s
    if L > 0.45 and s < 2.5: cost += 2.0
    if L < 0.25 and s >= 3: cost += 0.8
    return cost
def skip_b(s): return {0: 0, 1.5: 0.3, 2.5: 1.2, 3: 2.2, 4: 3.5}[s]
SKIP_G = 2.5
PK = list(np.load("picos.npy"))
RATIO = len(PK) / total
def npk(a, b): return bisect.bisect_left(PK, b) - bisect.bisect_left(PK, a)
gs = [g[0] for g in gaps] + [tail]; ge = [g[1] for g in gaps]
def rate_cost(ds, dc, pi, i):
    if ds <= 0.05: return INF
    a = ge[pi] if pi >= 0 else lead
    p = npk(a, gs[i]); exp_p = RATIO * dc
    return 4.0 * abs(math.log((dc / ds) / rate)) + 2.5 * abs(p - exp_p) / math.sqrt(exp_p + 3)
# prefijos de coste de saltar rupturas
pre = [0.0]
for b in brk: pre.append(pre[-1] + skip_b(b[2]))
best = {}; back = {}
best[(-1, -1)] = 0.0
MAXGI, MAXBJ = 5, 12
states = [(-1, -1)]
nodes = [(i, j) for i in range(G) for j in range(B)]
for i in range(G + 1):
    for j in range(B + 1) if i == G else range(B):
        if i == G and j != B: continue
        bestv, arg = INF, None
        for pi in range(max(-1, i - MAXGI), i):
            for pj in range(max(-1, j - MAXBJ), j):
                v0 = best.get((pi, pj))
                if v0 is None: continue
                s0 = speech[pi] if pi >= 0 else 0.0
                c0 = brk[pj][1] if pj >= 0 else 0.0
                v = v0 + rate_cost(speechE[i] - s0, cE[j] - c0, pi, i) \
                    + SKIP_G * (i - pi - 1) + (pre[j] - pre[pj + 1])
                if v < bestv: bestv, arg = v, (pi, pj)
        if arg is None: continue
        if i < G: bestv += pair_cost(i, j)
        best[(i, j)] = bestv; back[(i, j)] = arg
pairs = []; cur = back[(G, B)]
while cur != (-1, -1):
    pairs.append(cur); cur = back[cur]
pairs.reverse()
# anclas: (indice palabra frontera, tiempo fin de palabra, tiempo inicio siguiente)
anchors = [(-1, None, lead)]
for gi, bj in pairs:
    anchors.append((brk[bj][0], gaps[gi][0], gaps[gi][1]))
anchors.append((len(words) - 1, tail, None))
for a, b in zip(anchors, anchors[1:]):
    k0, k1 = a[0] + 1, b[0]
    t0, t1 = a[2], b[1]
    c0, c1 = cum[k0], cum[k1 + 1]
    for k in range(k0, k1 + 1):
        words[k]["s"] = round(t0 + (t1 - t0) * (cum[k] - c0) / (c1 - c0), 3)
        words[k]["e"] = round(t0 + (t1 - t0) * (cum[k + 1] - c0) / (c1 - c0), 3)
json.dump(words, open("palabras.json", "w"), ensure_ascii=False)
um = G - len(pairs)
print(f"pausas {G}, emparejadas {len(pairs)}, sin emparejar {um}, ritmo {rate:.1f} car/s")
# control: ritmo de cada tramo entre anclas
bad = 0
for a, b in zip(anchors, anchors[1:]):
    k0, k1 = a[0] + 1, b[0]; d = b[1] - a[2]
    r = (cum[k1 + 1] - cum[k0]) / d if d > 0 else 99
    if r < rate * 0.6 or r > rate * 1.5:
        bad += 1; print(f"  raro: {a[2]:.2f}-{b[1]:.2f} r={r:.1f} «{' '.join(w['w'] for w in words[k0:k1+1])[:70]}»")
print("tramos raros:", bad)
