"""Mejora el vídeo: quita la marca de agua, sube a 1080p y da movimiento a la galaxia.
Uso: python3 mejorar.py <entrada.mp4> <salida.mp4>"""
import sys, subprocess, numpy as np
import quitar_marca as q

src, dst = sys.argv[1], sys.argv[2]
params = q.load("marca_params.npz")
W, H = 1280, 720
G0, G1 = 17.1, 31.2          # plano de la galaxia (intro)
zoom = (f"if(lt(in,1),1,1+0.18*(1-cos(PI*min(in/{(G1-G0)*30:.0f},1)))/2)")
fc = (f"[0:v]split=3[a][b][c];"
      f"[a]trim=end={G0},setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,unsharp=5:5:0.6[va];"
      f"[b]trim=start={G0}:end={G1},setpts=PTS-STARTPTS,scale=3840:2160:flags=lanczos,"
      f"zoompan=z='{zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,unsharp=5:5:0.6[vb];"
      f"[c]trim=start={G1},setpts=PTS-STARTPTS,scale=1920:1080:flags=lanczos,unsharp=5:5:0.6[vc];"
      f"[va][vb][vc]concat=n=3:v=1:a=0,format=yuv420p[v]")
dec = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-i", src, "-f", "rawvideo",
                        "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                        "-s", f"{W}x{H}", "-r", "30", "-i", "-", "-i", src,
                        "-filter_complex", fc, "-map", "[v]", "-map", "1:a",
                        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                        "-c:a", "copy", "-movflags", "+faststart", dst], stdin=subprocess.PIPE)
n = 0; fs = W * H * 3
while True:
    buf = dec.stdout.read(fs)
    if len(buf) < fs: break
    fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
    enc.stdin.write(q.fix(fr, params).tobytes()); n += 1
    if n % 1500 == 0: print(f"{n/30:.0f} s", flush=True)
enc.stdin.close(); enc.wait(); print("Listo", n, "frames")
