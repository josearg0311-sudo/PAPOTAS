"""Historias exclusivas de los vídeos largos (no salen como Short): S32 Halifax (L03, 12 dic) y S33 D. B. Cooper (L04, 19 dic).
Todas las escenas son por capas (sin clip animado, para ahorrar créditos). Los fondos se generan YA en 16:9.
Uso (desde canal/): python3 herramientas/exclusivas.py  → Guiones/S32_*.md, S33_*.md y En proceso/exclusivas_prompts.json"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mes1
from mes1 import R, FONDO, PJ, K

mes1.S.clear()
short = mes1.short

short('S32', 'S32_halifax', '2026-12-12 18:00', 'DESASTRES INSÓLITOS', 'La mayor explosión antes de la bomba atómica 💥',
      'HALIFAX, CANADÁ | 6 DE DICIEMBRE DE 1917', 'LA GRAN | EXPLOSIÓN',
      'En 1917, un barco cargado de explosivos chocó en el puerto de Halifax y provocó la mayor explosión causada por el ser humano antes de la bomba atómica.',
      '¿Conocías esta historia? 👇',
      'Halifax (Nueva Escocia, Canadá), 6/12/1917: el carguero francés Mont-Blanc, lleno de explosivos, chocó con el noruego Imo en el estrecho del puerto; se incendió y estalló a las 9:04; murieron unas 2.000 personas y unas 9.000 resultaron heridas; considerada la mayor explosión no nuclear provocada por el ser humano de su época; el telegrafista Vince Coleman avisó a un tren que se acercaba y murió en su puesto; Boston envió ayuda y desde entonces Nueva Escocia regala cada año un gran árbol de Navidad a Boston. Tono respetuoso.',
      '¿Sabías que la mayor explosión antes de la bomba atómica empezó con un simple choque entre dos barcos?',
      """[serious] Canadá, diciembre de 1917. En el puerto de Halifax, un barco francés navega cargado hasta arriba de explosivos para la guerra.
[tense] En el paso más estrecho del puerto, choca con otro barco. Salta una chispa... y empieza un incendio.
[tense] Desde el muelle, la gente se acerca a mirar el humo. Nadie sabe lo que lleva dentro.
[amazed] A las nueve y cuatro de la mañana, el barco estalla. La explosión arrasa barrios enteros y se siente a kilómetros.
[serious] Un telegrafista, Vince Coleman, se quedó en su puesto para avisar a un tren que llegaba. Salvó a cientos de pasajeros.
[amazed] Pero espera... la ciudad de Boston envió ayuda enseguida. Y desde entonces, cada Navidad, Halifax le regala a Boston un enorme árbol como agradecimiento.""",
      '¿Conocías esta historia? Te leo en los comentarios.',
      None,
      [K('¿Sabías que', 'in', 'niebla', 'a busy 1917 harbour with wooden piers, steamships and a snowy town on the hills behind, early morning', 'the morning sun on the water',
         'a curious 1917 dock worker in a flat cap looking at the harbour', 'his flat cap'),
       K('Canadá', 'up', 'polvo', 'the deck of a 1917 cargo steamship loaded with crates and barrels in a grey harbour', 'the warning flag',
         'a nervous 1917 French sailor in a striped shirt checking the cargo', 'the lantern in his hand'),
       K('En el paso más estrecho', 'in_fast', 'temblor brasas', 'two old steamships colliding in a narrow harbour channel with sparks and smoke', 'the sparks',
         'a shocked 1917 ship captain gripping the wheel', 'the ship wheel'),
       K('Desde el muelle', 'in', 'brasas', 'a wooden pier crowded with empty space in front of a burning ship sending black smoke into the sky', 'the flames',
         'a curious 1917 boy in a wool coat pointing at the smoke', 'his scarf'),
       K('Un telegrafista', 'in', 'polvo', 'a small 1917 railway telegraph office with a desk, a telegraph key and a window to the harbour', 'the telegraph key',
         'a brave 1917 railway dispatcher with sleeve garters tapping a telegraph key', 'the telegraph key'),
       K('Pero espera', 'out', 'luz', 'a snowy city square at night with a giant decorated Christmas tree full of lights', 'the star on top of the tree',
         'a smiling family in winter coats looking up at the tree', 'the wrapped gift box')])

short('S33', 'S33_db_cooper', '2026-12-19 18:00', 'MISTERIOS SIN RESOLVER', 'Secuestró un avión, saltó en paracaídas… y NUNCA lo encontraron 🪂',
      'PORTLAND → SEATTLE, EE. UU. | 24 DE NOVIEMBRE DE 1971', 'DESAPARECIÓ | EN EL AIRE',
      'En 1971, un hombre que se hizo llamar Dan Cooper secuestró un avión, cobró 200.000 dólares y saltó en paracaídas en plena noche. Nunca se supo quién era.',
      '¿Quién crees que era? 👇',
      'Vuelo 305 de Northwest Orient, Portland–Seattle, 24/11/1971: un pasajero que se registró como "Dan Cooper" (la prensa lo llamó "D. B. Cooper") dijo llevar una bomba; en Seattle recibió 200.000 dólares y paracaídas a cambio de liberar a los pasajeros; con el avión de nuevo en el aire hacia México, saltó por la escalera trasera de noche sobre el suroeste de Washington; en 1980 un niño encontró 5.800 dólares de ese dinero junto al río Columbia; el FBI cerró la investigación activa en 2016 sin identificarlo. Sin glorificar el delito.',
      '¿Sabías que un hombre secuestró un avión, saltó en paracaídas... y nunca más se supo de él?',
      """[serious] Estados Unidos, noviembre de 1971. En un vuelo de Portland a Seattle, un hombre tranquilo, con traje y corbata, pide una bebida.
[tense] Le pasa una nota a la azafata: dice que lleva una bomba. Quiere doscientos mil dólares y cuatro paracaídas.
[tense] En Seattle le dan todo. Él deja bajar a los pasajeros... y el avión vuelve a despegar.
[amazed] En plena noche, sobre los bosques, abre la escalera trasera y salta al vacío, bajo la lluvia.
[serious] Nunca encontraron al hombre. Ni su paracaídas.
[amazed] Pero espera... nueve años después, un niño encontró junto a un río unos billetes podridos. Eran parte de aquel dinero. El misterio sigue abierto.""",
      '¿Quién crees que era? Te leo en los comentarios.',
      None,
      [K('¿Sabías que', 'in', 'niebla', 'a 1970s passenger jet flying over dark pine forests at night in the rain', 'the plane window lights',
         'a mysterious man in a dark suit, tie and sunglasses sitting calmly', 'his tie clip'),
       K('Estados Unidos', 'up', 'polvo', 'the cabin of a 1970s passenger airplane with rows of seats and small round windows', 'the reading lights',
         'a calm 1970s businessman in a suit holding a drink', 'the drink glass'),
       K('Le pasa una nota', 'in_fast', 'temblor', 'a 1970s airplane galley with trays and cups', 'a folded note',
         'a surprised 1970s flight attendant reading a folded note', 'the folded note'),
       K('En Seattle', 'in', 'lluvia', 'a rainy 1970s airport runway at night with a parked jet and its rear stairs lowered', 'the runway lights',
         'a nervous 1970s airport worker carrying a money bag', 'the money bag'),
       K('En plena noche', 'in_fast', 'lluvia temblor', 'the open rear stairs of a jet in flight at night with rain and dark forest far below', 'the open stairway',
         'a man in a suit wearing a parachute pack seen from behind', 'the parachute pack'),
       K('Pero espera', 'out', 'polvo luz', 'a sandy river bank by a wide river with trees, calm afternoon', 'the old banknotes in the sand',
         'an amazed 8-year-old boy in a 1980 striped t-shirt holding old banknotes', 'the old banknotes')])


def tabla(s):
    return '\n'.join(f"| {i} | {c['desde']} | capas | {c['mov']} | {c['efecto']} | Fondo: {c['f']} · Personaje: {c['p']} | |"
                     for i, c in enumerate(s['capas'], 1))


if __name__ == '__main__':
    prompts = {}
    for s in mes1.S:
        md = f"""# {s['titulo']}
id: {s['id']}
serie: {s['serie']}
estilo: stopmotion
publicar: {s['publicar']}
color: {s['color']}
lugar: {s['lugar']}
miniatura: {s['miniatura']}
portada: {s['miniatura']}
descripcion: {s['descripcion']} ¿Acaso lo sabías? 🕰️ Historias reales que no te enseñaron en el colegio.
hashtags: {s['hashtags']}
comentario: {s['comentario']}

> EXCLUSIVA del vídeo largo (no se publica como Short). Datos verificados: {s['datos']}

## Narración
{s['narr']}

## Escenas
| # | Desde la frase | Diseño | Movimiento | Efecto | Imagen (plastilina) | Notas |
|---|---|---|---|---|---|---|
{tabla(s)}
"""
        open(os.path.join(R, 'Guiones', s['f'] + '.md'), 'w', encoding='utf-8').write(md)
        prompts[s['id']] = {'capas': [{'fondo': FONDO.format(d=c['f'], oro=c['oro']), 'pj': PJ.format(d=c['p'], oro=c['po'])} for c in s['capas']],
                            'voz': s['narr']}
    json.dump(prompts, open(os.path.join(R, 'En proceso', 'exclusivas_prompts.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(mes1.S), 'exclusivas ·', sum(len(v['capas']) for v in prompts.values()), 'capas')
