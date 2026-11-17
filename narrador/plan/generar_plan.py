"""Genera el plan de 2 meses (CSV + Markdown): python3 generar_plan.py"""
import csv, datetime as dt, os
D = os.path.dirname(os.path.abspath(__file__))
SHORT, LARGO, TOMMY_UNICA = 3400, 800, 0   # stop-motion mixto con 1 clip por Short          # créditos (voz ElevenLabs incluida)
SHORT_VP, LARGO_VP = 2500, 500                         # créditos si la voz la grabas tú
DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

LARGOS = [  # (fecha sábado, serie, título, [5 historias])
 ('2026-12-19', '🕰️ Historias que parecen mentira', '5 historias REALES que parecen inventadas',
  ['Peleó 29 AÑOS en una guerra que ya había terminado (Hiroo Onoda)', 'Sobrevivió a las DOS bombas atómicas (Tsutomu Yamaguchi)',
   'Una OLA DE CERVEZA mató a 8 personas en Londres (1814)', 'Un jinete MUERTO ganó una carrera (Frank Hayes, 1923)',
   'La guerra que duró 335 años… sin un solo disparo (islas Sorlingas)']),
 ('2026-12-26', '🔍 Misterios sin resolver', '5 misterios que NADIE ha podido explicar',
  ['El barco que apareció SIN NADIE a bordo (Mary Celeste, 1872)', '9 excursionistas huyeron de su tienda en plena noche (paso Dyatlov, 1959)',
   'Alguien vivía escondido en la casa de sus víctimas (Hinterkaifeck, 1922)', 'El libro que NADIE puede leer (manuscrito Voynich)',
   'La colonia que desapareció dejando una sola palabra (Roanoke)']),
 ('2027-01-02', '🌋 Desastres insólitos', '5 desastres tan raros que parecen mentira',
  ['Un lago "exhaló" y mató a 1.700 personas (lago Nyos, 1986)', 'La niebla que mató a miles en Londres (1952)',
   'El año en que NEVÓ en pleno verano (1816)', 'La explosión que arrasó una ciudad entera (Halifax, 1917)',
   'Una explosión derribó 80 millones de árboles… y nadie sabe qué fue (Tunguska, 1908)']),
 ('2027-01-09', '🕵️ Crímenes y estafas legendarias', 'Los 5 engaños más audaces de la historia',
  ['El hombre que "VENDIÓ" la Torre Eiffel (Victor Lustig)', 'Intentaron matarlo 5 veces para cobrar su seguro (Michael Malloy, 1933)',
   'El robo que hizo FAMOSA a la Mona Lisa (1911)', 'Secuestró un avión, cobró el rescate y saltó en paracaídas (D. B. Cooper, 1971)',
   'El falsificador que engañó a los nazis (Han van Meegeren)']),
 ('2027-01-16', '🧗 Supervivientes imposibles', '5 personas que NO deberían haber sobrevivido',
  ['Cayó de un avión sobre la selva y sobrevivió 11 días (Juliane Koepcke, 1971)', 'Le cayeron 7 RAYOS y sobrevivió (Roy Sullivan)',
   'Sobrevivió 133 días en una balsa en el océano (Poon Lim, 1942)', 'Atacado por un oso y abandonado… se arrastró kilómetros (Hugh Glass, 1823)',
   'El panadero del Titanic que aguantó horas en el agua helada (Charles Joughin)']),
 ('2027-01-23', '🧠 Tu cuerpo es increíble', '5 casos médicos que parecen IMPOSIBLES',
  ['Una barra de hierro le atravesó la cabeza… y siguió hablando (Phineas Gage, 1848)', 'Pintaban relojes que brillaban… y las mataba (las Chicas del Radio)',
   'El pollo que vivió 18 meses SIN CABEZA (Mike, 1945)', 'Se bebió una bacteria para demostrar que tenía razón… y ganó el Nobel (Barry Marshall)',
   'El hombre que no podía dejar de comer (Tarrare, siglo XVIII)']),
 ('2027-01-30', '🌍 Lugares prohibidos', '5 lugares donde casi NADIE puede entrar',
  ['La isla cuyos habitantes rechazan todo contacto (Sentinel del Norte)', 'La isla con miles de serpientes venenosas (Queimada Grande)',
   'La bóveda del fin del mundo (Bóveda Global de Semillas)', 'La cueva con pinturas de 17.000 años cerrada al público (Lascaux)',
   'Una isla nacida de un volcán en 1963 donde solo entran científicos (Surtsey)']),
 ('2027-02-06', '🤪 La historia más absurda', '5 momentos ABSURDOS de la historia',
  ['Desenterraron a un papa para JUZGARLO (Sínodo del Cadáver, 897)', 'Una guerra cuya única baja fue un CERDO (guerra del Cerdo, 1859)',
   'El hombre que se proclamó emperador de EE. UU. (Emperador Norton)', 'Pagaban una CASA por un bulbo de tulipán (1637)',
   'El verano en que Londres olía tan mal que el Parlamento casi huyó (Gran Hedor, 1858)']),
 ('2027-02-13', '💡 El origen de…', '5 inventos que nacieron por ACCIDENTE',
  ['El moho que salvó millones de vidas (penicilina, 1928)', 'Una chocolatina derretida inventó el microondas (1945)',
   'Unas semillas pegadas al perro inventaron el velcro (1941)', 'Una luz misteriosa descubrió los rayos X (1895)',
   'Un pegamento "fallido" creó las notas adhesivas']),
]
SUELTOS = {  # martes y viernes (series ligeras y especiales)
 '2026-12-17': ('🚢 Estreno (gancho)', 'Sobrevivió al TITANIC… y a sus dos barcos hermanos (Violet Jessop)'),
 '2026-12-22': ('🐾 Animales extremos', 'La medusa que puede volver a ser joven'),
 '2026-12-25': ('🎄 Especial Navidad', 'La Navidad en que dos ejércitos dejaron de pelear (1914)'),
 '2026-12-29': ('🧠 Tu cuerpo es increíble', 'Naces con unos 300 huesos… y de adulto tienes 206'),
 '2027-01-01': ('🎆 Especial Año Nuevo', '¿Por qué el año empieza el 1 de enero?'),
 '2027-01-05': ('🐾 Animales extremos', 'El tardígrado: el animal casi indestructible'),
 '2027-01-08': ('🎮 Detrás del juego', 'El videojuego más famoso del mundo nació en la Unión Soviética'),
 '2027-01-12': ('💡 El origen de…', 'Los jeans se inventaron para mineros'),
 '2027-01-15': ('❓ ¿Qué pasaría si…?', '¿Qué pasaría si la Luna desapareciera?'),
 '2027-01-19': ('🐾 Animales extremos', 'El tiburón que puede vivir siglos'),
 '2027-01-22': ('🎮 Detrás del juego', 'El primer videojuego de la historia (1958)'),
 '2027-01-26': ('🧠 Tu cuerpo es increíble', '¿Por qué nos da hipo?'),
 '2027-01-29': ('❓ ¿Qué pasaría si…?', '¿Qué pasaría si dejaras de dormir?'),
 '2027-02-02': ('💡 El origen de…', 'El chicle nació de la savia de un árbol mexicano'),
 '2027-02-05': ('🐾 Animales extremos', 'El pulpo: tres corazones y sangre azul'),
 '2027-02-09': ('❓ ¿Qué pasaría si…?', '¿Qué pasaría si la Tierra dejara de girar?'),
 '2027-02-12': ('💘 Especial San Valentín', 'La leyenda detrás de San Valentín'),
}
d0 = dt.date(2026, 12, 17); filas = []
largos = {dt.date.fromisoformat(f): (s, t, h) for f, s, t, h in LARGOS}
fechas_largo = sorted(largos)
# VARIEDAD: cada largo mantiene su tema, pero sus 5 historias se reparten como Shorts a lo largo de varias semanas,
# intercaladas con otras series. Cada día se elige la serie usada hace más tiempo (nunca dos días seguidos el mismo tema).
pend = {f: [(largos[f][0], x) for x in largos[f][2]] for f in fechas_largo}
uso = {}  # serie -> último día publicado
def pub(d, hora, serie, titulo, tipo='Short', c=None):
    filas.append((d.isoformat(), DIAS[d.weekday()], hora, tipo, serie, titulo, *(c or (SHORT, SHORT_VP)))); uso[serie] = d
for n in range(61):
    d = d0 + dt.timedelta(n); iso = d.isoformat()
    if d in largos and pend[d]:            # sábado: avance del largo a las 12:00 + el largo a las 18:00
        s, t = pend[d].pop(0); pub(d, '12:00', s, t); pub(d, '18:00', largos[d][0], largos[d][1], 'LARGO (5 min)', (LARGO, LARGO_VP)); continue
    if iso in SUELTOS:
        s, t = SUELTOS[iso]; pub(d, '19:00', s, t); continue
    disp = [f for f in fechas_largo if f - dt.timedelta(16) <= d and pend[f]]
    if not disp: continue
    ayer = filas[-1][4] if filas else None
    f = min(disp, key=lambda f: (largos[f][0] == ayer, uso.get(largos[f][0], dt.date(2000, 1, 1)), f))
    s, t = pend[f].pop(0); pub(d, '19:00', s, t)
banco = [(largos[f][0], t) for f in fechas_largo for _, t in pend[f]]
with open(os.path.join(D, 'plan_2_meses.csv'), 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(['Fecha', 'Día', 'Hora (México)', 'Tipo', 'Serie', 'Título / historia', 'Créditos (voz ElevenLabs)', 'Créditos (voz propia)'])
    w.writerows(filas)
mes = lambda a, b: (sum(x[6] for x in filas if a <= x[0] <= b), sum(x[7] for x in filas if a <= x[0] <= b))
m1, m2 = mes('2026-12-10', '2027-01-16'), mes('2027-01-10', '2027-02-22')
nS = sum(1 for x in filas if x[3] == 'Short'); nL = sum(1 for x in filas if x[3] != 'Short')
with open(os.path.join(D, 'calendario_tabla.md'), 'w', encoding='utf-8') as f:
    f.write('| Fecha | Día | Hora | Tipo | Serie | Título | Créditos |\n|---|---|---|---|---|---|---|\n')
    for x in filas:
        b = '**' if x[3] != 'Short' else ''
        f.write(f'| {x[0][8:]}/{x[0][5:7]} | {x[1]} | {x[2]} | {b}{x[3]}{b} | {x[4]} | {b}{x[5]}{b} | ' + f'{x[6]:,}'.replace(',', '.') + ' |\n')
open(os.path.join(D, 'banco.txt'), 'w', encoding='utf-8').write('\n'.join(f'{a} — {b}' for a, b in banco))
print('Banco', len(banco), 'Shorts', nS, 'Largos', nL, 'Mes1', m1, 'Mes2', m2, 'Total', m1[0] + m2[0], m1[1] + m2[1])
