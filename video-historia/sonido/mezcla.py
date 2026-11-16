"""Mezcla final: voz + música con ducking + whoosh en transiciones + pop en insignias, a -14 LUFS.
Uso: python3 mezcla.py v1|v2   -> ../motor2d/audio_v1_mix.wav"""
import sys, os, json, subprocess
AQ = os.path.dirname(os.path.abspath(__file__)); M = os.path.join(AQ, "../motor2d")
vid = sys.argv[1]; tl = json.load(open(f"{M}/tl_{vid}.json"))
voz = f"{M}/audio_{vid}.wav"; mus = f"{AQ}/musica_{vid}.wav"
if not os.path.exists(mus): subprocess.run(["python3", f"{AQ}/musica.py", str(tl["dur"] + 1), mus], check=True)
if not os.path.exists(f"{AQ}/pop.wav"): subprocess.run(["python3", f"{AQ}/musica.py", "pop", f"{AQ}/pop.wav"], check=True)
whoosh = [max(0, a - .45) for a, _ in tl["datos"]] + [s["t"] - .2 for s in tl["scenes"] if s["key"] in ("logo_intro", "logo_subscribe")]
pops = [a + .05 for a, _ in tl["datos"]] + ([tl["like"]] if tl["like"] else [])
ins = ["-i", voz, "-i", mus, "-i", f"{AQ}/whoosh.mp3", "-i", f"{AQ}/pop.wav"]
fc = f"[2:a]asplit={len(whoosh)}" + "".join(f"[w{i}]" for i in range(len(whoosh))) + ";"
fc += f"[3:a]asplit={len(pops)}" + "".join(f"[p{i}]" for i in range(len(pops))) + ";"
fc += "".join(f"[w{i}]adelay={int(t * 1000)}:all=1,volume=0.55[W{i}];" for i, t in enumerate(whoosh))
fc += "".join(f"[p{i}]adelay={int(t * 1000)}:all=1,volume=0.35[P{i}];" for i, t in enumerate(pops))
fc += "[0:a]aformat=channel_layouts=stereo,asplit=2[v1][v2];"
fc += "[1:a]volume=0.36[m];[m][v2]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[md];"
fc += "[v1][md]" + "".join(f"[W{i}]" for i in range(len(whoosh))) + "".join(f"[P{i}]" for i in range(len(pops)))
fc += f"amix=inputs={2 + len(whoosh) + len(pops)}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[o]"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", fc, "-map", "[o]", "-ar", "44100", "-ac", "2", f"{M}/audio_{vid}_mix.wav"], check=True)
print("mezcla lista:", f"audio_{vid}_mix.wav")
