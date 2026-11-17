"""Rehace plan_2_meses.md (cabecera + calendario) y pone las fechas en los guiones. Ejecutar después de generar_plan.py"""
import csv, re, os
D = os.path.dirname(os.path.abspath(__file__))
filas = list(csv.reader(open(os.path.join(D, 'plan_2_meses.csv'), encoding='utf-8-sig')))[1:]
fecha = {r[5]: (r[0], r[2]) for r in filas if r[3] == 'Short'}
mapa = {'S01_titanic_jessop': 'Sobrevivió al TITANIC… y a sus dos barcos hermanos (Violet Jessop)', 'S02_titanic_binoculares': 'El Titanic NO tenía binoculares… por una llave olvidada',
        'S03_titanic_bote1': 'El bote que salió con 12 personas… y tenía sitio para 40', 'S04_titanic_ballard': 'Encontraron el TITANIC… durante una misión SECRETA (1985)',
        'S05_titanic_joughin': 'El panadero que aguantó 2 HORAS en el agua helada (Charles Joughin)', 'S06_onoda': 'Peleó 29 AÑOS en una guerra que ya había terminado (Hiroo Onoda)'}
G = os.path.join(D, '../../canal/Guiones/')
for f, t in mapa.items():
    d, h = fecha.get(t, ('reserva', '')); p = G + f + '.md'; s = open(p, encoding='utf-8').read()
    open(p, 'w', encoding='utf-8').write(re.sub(r'^publicar: .*$', f'publicar: {d} {h}'.strip(), s, count=1, flags=re.M)); print(f, d, h)
sem = [(r[0], r[4], r[5]) for r in filas if r[3] != 'Short']
suma = lambda col, a, b: sum(int(r[col]) for r in filas if a <= r[0] <= b)
f_ = lambda n: f'{n:,}'.replace(',', '.')
semana = '\n'.join(f'| {r[0][8:]}/{r[0][5:7]} {r[2]} | {r[4]} | {r[5]} |' for r in filas if r[0] <= '2026-11-25')
largos = '\n'.join(f'{i + 1}. {s} — {d[8:]}/{d[5:7]}: **{t}**' for i, (d, s, t) in enumerate(sem))
cab = f"""# Plan de lanzamiento — Temporada 1 (19 nov 2026 → 18 ene 2027)

**Estilo:** stop-motion de plastilina (clip animado con IA en el gancho + escenas por capas).
**Ritmo:** 1 Short diario (19:00) + 1 vídeo largo cada sábado (18:00), hora de México.
**Variedad:** cada día un tema distinto. Cada vídeo largo del sábado tiene su tema, pero sus 5 historias salen como Shorts repartidas en varias semanas, intercaladas con las demás series (nunca dos días seguidos el mismo tema).
**Arranque:** un solo Short de gancho sobre el **Titanic** (tema conocidísimo) el jueves 19 de noviembre; desde el viernes, variedad total. Los otros guiones del Titanic quedan en reserva (`canal/Guiones/`, `publicar: reserva`).
**Total:** {sum(1 for r in filas if r[3] == 'Short')} Shorts + {len(sem)} vídeos largos.

## 🚀 Primera semana
| Fecha | Serie | Publicación |
|---|---|---|
{semana}

## 📺 Los vídeos largos (sábados 18:00)
{largos}

## 💰 Créditos (1 clip animado por Short)
| | Mes 1 (19 nov–18 dic) | Mes 2 (19 dic–18 ene) |
|---|---|---|
| Con voz de ElevenLabs | ~{f_(suma(6, '2026-11-19', '2026-12-18'))} | ~{f_(suma(6, '2026-12-19', '2027-01-18'))} |
| Con tu propia voz | ~{f_(suma(7, '2026-11-19', '2026-12-18'))} | ~{f_(suma(7, '2026-12-19', '2027-01-18'))} |

Short ≈ 3.400 créditos · vídeo largo ≈ 800 (reutiliza sus 5 historias).
**Plan Creator (121.000/mes) ✅** — va justo con un Short diario; si algún mes aprieta, grabas tú la voz de algunos Shorts o se usa un clip menos.

## ⚙️ Cómo se produce
- Cada lunes produzco lo de la semana siguiente (Shorts + el largo del sábado) con su `youtube.txt`.
- Tú lo programas siguiendo `canal/GUIA_PUBLICAR.md`.
- Domingo: revisión de métricas → la serie que más funcione gana espacio.

## 📅 Calendario día a día
"""
tabla = os.path.join(D, 'calendario_tabla.md')
open(os.path.join(D, 'plan_2_meses.md'), 'w', encoding='utf-8').write(cab + open(tabla, encoding='utf-8').read()); os.remove(tabla)
