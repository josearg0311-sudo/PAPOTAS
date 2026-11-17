"""Efectos de sonido de marca + mezcla final: python3 marca_audio.py <carpeta>
Usa voz.mp3 (o voz_recortada.wav), tl.json y la música del canal. Escribe mezcla.wav."""
import json, os, sys, subprocess
import numpy as np
D = sys.argv[1]; SR = 44100; TL = json.load(open(os.path.join(D, 'tl.json'))); fx = TL['fx']; N = int((TL['dur'] + 1) * SR)
sfx = np.zeros(N); R = np.random.default_rng(3)
def add(sig, t, g=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i < N: sfx[i:j] += sig[:j - i] * g
def campana(f, d=1.4):
    t = np.arange(int(d * SR)) / SR
    return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * (3 + 2 * m)) for m, a in [(1, 1), (2.01, .45), (3.02, .25), (4.1, .12)])
def golpe(d=.6):
    t = np.arange(int(d * SR)) / SR; return (np.sin(2 * np.pi * (70 - 40 * t) * t) * np.exp(-t * 9) + R.normal(0, .3, len(t)) * np.exp(-t * 40))
def logo_sonoro(t0, g=.5):  # firma sonora: tres notas ascendentes + golpe de sello
    for k, f in enumerate([523.25, 659.25, 987.77]): add(campana(f), t0 + k * .11, g * (.8 if k < 2 else 1))
    add(golpe(), t0 + .3, g * 1.3)
def click():
    n = int(.018 * SR); return R.normal(0, 1, n) * np.exp(-np.arange(n) / SR * 400)
def swish(d=.45):
    n = int(d * SR); w = np.convolve(R.normal(0, 1, n), np.ones(30) / 30, 'same'); return w * np.sin(np.linspace(0, np.pi, n)) ** 2
if 'sello' in fx: logo_sonoro(fx['sello'] - .02)
if 'salto' in fx: add(swish(.7), fx['salto'] - .25, .9)
if fx.get('lugar'):
    L = fx['lugar']; n = len(L['l1']) + 3 + len(L['l2'])
    for k in range(n): add(click(), L['t'] + .15 + k / 24, .35)
for sc in TL['scenes'][1:]:
    if abs(sc['t'] - fx.get('salto', -9)) > .05: add(swish(), sc['t'] - .1, .45)
for sh in fx.get('shake', []): add(golpe(1.2), sh - .02, 1.1)
if fx.get('fin'): logo_sonoro(fx['fin'] + .12, .55)
sfx = np.clip(sfx, -1, 1); st = np.stack([sfx, sfx], 1)
import wave
with wave.open(os.path.join(D, 'sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767 * .8).astype('<i2').tobytes())
voz = os.path.join(D, 'voz_recortada.wav') if os.path.exists(os.path.join(D, 'voz_recortada.wav')) else os.path.join(D, 'voz.mp3')
mus = os.path.join(os.path.dirname(__file__), '../../video-historia/sonido/musica_v2.wav')
fin = fx.get('fin', TL['dur']); dur = TL['dur']
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', voz, '-stream_loop', '-1', '-i', mus, '-i', os.path.join(D, 'sfx.wav'), '-filter_complex',
  f"[0]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={dur},asplit=2[v][sc];"
  f"[1]atrim=0:{dur},volume=0.28,afade=t=out:st={fin}:d=0.6[m];[m][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md];"
  f"[v][md][2]amix=3:normalize=0:duration=first,afade=t=out:st={dur - .6}:d=0.6,loudnorm=I=-14:TP=-1.5:LRA=11", '-ar', str(SR), os.path.join(D, 'mezcla.wav')], check=True)
print('mezcla lista')
