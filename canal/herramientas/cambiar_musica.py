"""Vuelve a mezclar el audio de Shorts ya montados con la música actual de recursos/musica.mp3
y lo sustituye en el vídeo de YouTube y en el de TikTok, sin volver a montar la imagen (0 créditos).
Uso: python3 herramientas/cambiar_musica.py S01 S06 …
"""
import glob, os, shutil, subprocess, sys

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
EP, VL = os.path.join(R, 'En proceso'), os.path.join(R, 'Vídeos listos')

for vid in sys.argv[1:]:
    d = os.path.join(EP, vid)
    subprocess.run([sys.executable, os.path.join(R, 'herramientas', 'marca_audio.py'), d], check=True)
    mezcla = os.path.join(d, 'mezcla.wav')
    for mp4 in glob.glob(os.path.join(VL, f'{vid} - *.mp4')) + glob.glob(os.path.join(VL, 'TikTok', f'{vid} - *.mp4')):
        tmp = mp4 + '.tmp.mp4'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-i', mezcla, '-map', '0:v', '-map', '1:a',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', tmp], check=True)
        shutil.move(tmp, mp4)
    print('ok', vid, flush=True)
