"""Transcribe el audio con Whisper (tiempos por palabra) -> whisper.json"""
import sys, json
from faster_whisper import WhisperModel
m = WhisperModel("Systran/faster-whisper-medium", device="cpu", compute_type="int8")
import subprocess, numpy as np
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", sys.argv[1], "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True).stdout
audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
segs, info = m.transcribe(audio, language="es", word_timestamps=True, beam_size=5,
                          initial_prompt=open("guion.txt", encoding="utf-8").read()[:600])
out = []
for s in segs:
    for w in s.words: out.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
    print(f"{s.start:7.2f} {s.text}", flush=True)
json.dump(out, open("whisper.json", "w"), ensure_ascii=False)
