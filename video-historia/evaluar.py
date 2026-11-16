"""Mide la calidad de una alineación: % de finales de frase/coma que caen en un silencio real,
y % de palabras cuyo inicio cae en silencio (debería ser bajo)."""
import json, re, sys, numpy as np
w = json.load(open(sys.argv[1]))
v = [float(l.split()[1]) for l in open("silencios.txt")]
sil = [(v[i], v[i + 1]) for i in range(0, len(v) - 1, 2)]
def in_sil(t, tol=0.12): return any(a - tol <= t <= b + tol for a, b in sil)
ok = tot = 0
for k in range(len(w) - 1):
    if re.search(r"[.?!…:,;]$", w[k]["w"]):
        tot += 1; mid = (w[k]["e"] + w[k + 1]["s"]) / 2
        ok += in_sil(w[k]["e"]) or in_sil(w[k + 1]["s"])
used = sum(1 for (a, b) in sil if b - a > 0.3 and any(abs(x["e"] - a) < 0.25 or abs(x["s"] - b) < 0.25 for x in w))
big = sum(1 for (a, b) in sil if b - a > 0.3)
print(f"{sys.argv[1]}: pausas en puntuación {ok}/{tot} ({100*ok/tot:.0f}%), silencios largos usados {used}/{big}")
