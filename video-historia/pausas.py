"""Detecta pausas por energía RMS (10 ms) -> silencios.txt"""
import numpy as np, subprocess, sys
F = sys.argv[1]
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", F, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = 160; n = len(x) // hop
db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-10))
sil = db < -42
out = []; i = 0
while i < n:
    if sil[i]:
        j = i
        while j < n and sil[j]: j += 1
        if (j - i) >= 15 or i == 0 or j == n: out.append((i / 100, j / 100))
        i = j
    else: i += 1
with open("silencios.txt", "w") as f:
    for a, b in out: f.write(f"silence_start: {a}\nsilence_end: {b}\n")
print(len(out))
