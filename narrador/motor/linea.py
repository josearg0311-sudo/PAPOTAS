"""Construye la línea de tiempo del Short de Tommy: python3 linea.py <carpeta_short>"""
import json, sys, os
D = sys.argv[1]
W = json.load(open(os.path.join(D, 'whisper.json')))
FIX = {'Chartered': 'Charted', 'olía': 'olía a'}
for i, w in enumerate(W):
    w['w'] = FIX.get(w['w'], w['w'])
    if w['w'] == 'hacer' and i + 1 < len(W) and W[i + 1]['w'].startswith('invierno'): w['w'] = 'ser'
chunks, cur = [], []
for i, w in enumerate(W):
    cur.append(w)
    gap = W[i + 1]['s'] - w['e'] if i + 1 < len(W) else 9
    if w['w'][-1] in '.,?!:' or len(cur) >= 3 or gap > .35:
        chunks.append({'s': cur[0]['s'], 'e': cur[-1]['e'], 'w': cur}); cur = []
if cur: chunks.append({'s': cur[0]['s'], 'e': cur[-1]['e'], 'w': cur})
esc = json.load(open(os.path.join(D, 'escenas.json')))
dur = esc.get('dur', W[-1]['e'] + 1.6)
json.dump({'dur': dur, 'chunks': chunks, 'scenes': esc['scenes'], 'fx': esc.get('fx', {})}, open(os.path.join(D, 'tl.json'), 'w'), ensure_ascii=False)
print('dur', round(dur, 2), 'chunks', len(chunks))
