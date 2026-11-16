"""Compone la música de fondo del canal (curiosa, aventurera, tipo dibujo animado) y el efecto 'pop'.
Uso: python3 musica.py <segundos> <salida.wav>      |   python3 musica.py pop pop.wav"""
import sys, wave, numpy as np

SR = 44100
def save(path, x):
    x = x / (np.max(np.abs(x)) + 1e-9) * .9
    st = np.stack([x, x], 1) if x.ndim == 1 else x
    with wave.open(path, "w") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

if sys.argv[1] == "pop":
    t = np.arange(int(.35 * SR)) / SR
    f = 380 + 900 * np.exp(-t * 18)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    x += .4 * np.sin(2 * np.pi * 1600 * t) * np.exp(-t * 40)
    save(sys.argv[2], x); sys.exit()

DUR = float(sys.argv[1]); N = int(DUR * SR) + SR
L = np.zeros(N); Rr = np.zeros(N)
BPM = 98; beat = 60 / BPM
rng = np.random.default_rng(7)

def add(sig, t0, pan=0.0, vol=1.0):
    i = int(t0 * SR); n = min(len(sig), N - i)
    if n <= 0: return
    L[i:i + n] += sig[:n] * vol * (1 - max(0, pan)); Rr[i:i + n] += sig[:n] * vol * (1 + min(0, pan))
def marimba(m, d=.6):
    t = np.arange(int(d * SR)) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)) * np.exp(-t * 7) * (1 - np.exp(-t * 400))
def pluck(m, d=.5):   # Karplus-Strong (pizzicato)
    f = hz(m); p = int(SR / f); buf = rng.uniform(-1, 1, p); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % p]; buf[i % p] = .5 * (buf[i % p] + buf[(i + 1) % p]) * .994
    return out * np.exp(-np.arange(len(out)) / SR * 3)
def pad(ms, d):
    t = np.arange(int(d * SR)) / SR; x = np.zeros_like(t)
    for m in ms:
        for det in (-.08, .08): x += np.sin(2 * np.pi * hz(m + det) * t) + .3 * np.sin(2 * np.pi * hz(m + det) * 2 * t)
    env = np.minimum(1, t / .4) * np.minimum(1, (d - t) / .4); return x * env / len(ms)
def shaker(d=.08):
    x = rng.normal(0, 1, int(d * SR)); x = np.diff(np.concatenate([[0], x]))   # brillante
    return x * np.exp(-np.arange(len(x)) / SR * 60)
def kick():
    t = np.arange(int(.25 * SR)) / SR; return np.sin(2 * np.pi * np.cumsum(55 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 14)

# progresión curiosa: Am - F - C - G / Dm - F - E - E (modo aventura)
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [50, 53, 57], [53, 57, 60], [52, 56, 59], [52, 56, 59]]
MEL = [[69, None, 72, 71, 69, None, 67, None], [65, None, 69, None, 72, 74, 72, None], [67, None, 64, 67, 72, None, 71, 69], [67, None, None, 71, 74, None, 71, None],
       [69, 72, 74, None, 72, None, 69, None], [65, None, 69, 72, 77, None, 76, 74], [71, None, 68, None, 64, None, 68, 71], [76, None, 74, None, 71, None, 68, None]]
bar = beat * 4; t0 = 0.0; b = 0
while t0 < DUR:
    ch = PROG[b % 8]; sec = (b // 8) % 4          # 4 secciones que varían la textura
    add(pad([m + 12 for m in ch], bar + .3), t0, 0, .05)
    for q in range(4):                              # bajo pizzicato
        add(pluck(ch[0] - 12 + (7 if q == 2 else 0), .5), t0 + q * beat, -.2, .35)
    for e in range(8):                              # marimba arpegiada / melodía
        tt = t0 + e * beat / 2
        if sec in (1, 3):
            m = MEL[b % 8][e]
            if m: add(marimba(m + (12 if sec == 3 and e % 4 == 0 else 0)), tt, .25, .32)
        add(marimba(ch[e % 3] + 12, .35), tt, -.3 if e % 2 else .3, .12 if sec in (1, 3) else .2)
        add(shaker(), tt + (.02 if e % 2 else 0), .4, .06 if e % 2 else .1)
    if sec >= 2:
        for q in (0, 2): add(kick(), t0 + q * beat, 0, .35)
    t0 += bar; b += 1
mix = np.stack([L, Rr], 1)[:int(DUR * SR)]
fade = np.minimum(1, np.minimum(np.arange(len(mix)) / SR / 2, (len(mix) - np.arange(len(mix))) / SR / 3))[:, None]
save(sys.argv[2], mix * fade)
print("música lista:", sys.argv[2])
