"""Mes 1 (26 nov – 18 dic 2026): guiones de los Shorts S12–S31 (sin sábados) y archivo de prompts para ElevenLabs.
Uso (desde canal/): python3 herramientas/mes1.py"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLAY = ("Claymation stop-motion style: handmade plasticine characters with visible fingerprints and clay texture, miniature handcrafted set made of clay, "
        "cardboard and fabric, soft warm studio lighting, shallow depth of field, slightly exaggerated proportions, original character design. "
        "The key element is rendered in vivid golden yellow: {oro}. No text, no letters, no logos.")
FONDO = "Empty background plate, no people: {d}. " + CLAY
PJ = "Character cut-out on a plain flat light grey background, nothing else: {d}, shown from the waist up in the lower two thirds of the frame. " + CLAY
CLIPIMG = "{d}. " + CLAY
MOV = "Stop-motion claymation animation: {m}. Keep the handmade plasticine look and miniature set."
COL = {'HISTORIAS QUE PARECEN MENTIRA': '#FFC93C', 'MISTERIOS SIN RESOLVER': '#3FB27F', 'DESASTRES INSÓLITOS': '#E0483B',
       'CRÍMENES Y ESTAFAS LEGENDARIAS': '#8E5BD9', 'TU CUERPO ES INCREÍBLE': '#3D8BFF', 'ANIMALES EXTREMOS': '#9BD34B',
       'EL ORIGEN DE…': '#FF8A3D', 'DETRÁS DEL JUEGO': '#2BD4E0', '¿QUÉ PASARÍA SI…?': '#F3E9D2', 'SUPERVIVIENTES IMPOSIBLES': '#E86A92'}
TAGS = {'HISTORIAS QUE PARECEN MENTIRA': '#historia #historiareal', 'MISTERIOS SIN RESOLVER': '#misterio #historia',
        'DESASTRES INSÓLITOS': '#desastres #historia', 'CRÍMENES Y ESTAFAS LEGENDARIAS': '#estafas #historia',
        'TU CUERPO ES INCREÍBLE': '#cuerpohumano #ciencia', 'ANIMALES EXTREMOS': '#animales #ciencia', 'EL ORIGEN DE…': '#inventos #historia',
        'DETRÁS DEL JUEGO': '#videojuegos #gaming', '¿QUÉ PASARÍA SI…?': '#ciencia #espacio', 'SUPERVIVIENTES IMPOSIBLES': '#supervivencia #historiareal'}
INI = "[playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.\n"
FIN = " [warm] Esto es... ¿Acaso lo sabías?"

S = []


def short(id, f, publicar, serie, titulo, lugar, miniatura, descripcion, comentario, datos, gancho, cuerpo, pregunta, clip, capas):
    S.append(dict(id=id, f=f, publicar=publicar, serie=serie, color=COL[serie], titulo=titulo, lugar=lugar, miniatura=miniatura,
                  hashtags=f"{TAGS[serie]} #sabiasque #curiosidades #acasolosabias #shorts", descripcion=descripcion, comentario=comentario,
                  datos=datos, narr=f"[curious] {gancho} {INI}{cuerpo}\n[playful] {pregunta}{FIN}", clip=clip, capas=capas))


C = lambda desde, efecto, d, oro, m: dict(desde=desde, efecto=efecto, d=d, oro=oro, m=m)
K = lambda desde, mov, efecto, f, oro, p, po: dict(desde=desde, mov=mov, efecto=efecto, f=f, oro=oro, p=p, po=po)

# ───────────────────────── SEMANA 2 ─────────────────────────
short('S12', 'S12_lago_nyos', '2026-11-26 19:00', 'DESASTRES INSÓLITOS', 'Un lago "EXHALÓ" y dejó sin vida a todo un valle 😶‍🌫️',
      'LAGO NYOS, CAMERÚN | 21 DE AGOSTO DE 1986', 'UN LAGO | ASESINO',
      'En 1986, el lago Nyos, en Camerún, liberó de golpe una enorme nube de dióxido de carbono que bajó por los valles en plena noche.',
      '¿Sabías que existían lagos así? 👇',
      'Lago Nyos (Camerún), noche del 21/08/1986: erupción límnica; se liberó una gran nube de CO₂ acumulado en el fondo; murieron unas 1.700 personas y miles de animales en aldeas a varios km. Desde 2001 hay tubos de desgasificación. Tono respetuoso.',
      '¿Sabías que un lago, una noche, "exhaló"... y dejó sin vida a todo un valle?',
      """[serious] Camerún, agosto de 1986. El lago Nyos parece tranquilo, rodeado de colinas y pequeñas aldeas.
[tense] Pero en el fondo guardaba un secreto: millones de toneladas de dióxido de carbono, acumuladas durante años bajo el agua.
[amazed] Esa noche, algo lo removió. El gas subió de golpe a la superficie, como una botella de refresco al abrirla.
[serious] Una nube invisible, más pesada que el aire, bajó por los valles en silencio. Unas mil setecientas personas no despertaron.
[amazed] Pero espera... hoy unos tubos gigantes sacan el gas poco a poco, para que nunca vuelva a pasar.""",
      '¿Sabías que existían lagos así? Te leo en los comentarios.',
      C('¿Sabías que', 'niebla', 'A calm crater lake at night surrounded by green hills and a small village with thatched huts, a strange pale mist rising from the water', 'the moonlight on the lake',
        'the pale mist slowly rises from the lake surface and flows down the hillside towards the huts, the water ripples, the moonlight flickers'),
      [K('Camerún', 'up', 'polvo', 'a peaceful green valley with a crater lake and small thatched-roof huts at sunset', 'the setting sun',
         'a cheerful Cameroonian farmer in colorful clothes carrying a basket of fruit', 'the basket of fruit'),
       K('Pero en el fondo', 'in', 'niebla', 'the dark bottom of a deep lake with countless bubbles trapped under the water', 'the trapped bubbles',
         'a curious scientist in a diving suit pointing at bubbles', 'his diving helmet'),
       K('Esa noche', 'in_fast', 'temblor salpicaduras', 'a lake surface erupting like a shaken soda bottle at night with a huge spray of water', 'the erupting water',
         'a frightened villager holding a lantern looking towards the lake', 'the lantern'),
       K('Una nube invisible', 'in', 'niebla', 'a misty valley at night with a heavy fog flowing between empty huts', 'a lantern left on a doorstep',
         'a worried elderly villager wrapped in a blanket standing in the fog', 'the blanket pattern'),
       K('Pero espera', 'out', 'polvo luz', 'a crater lake by day with a tall pipe in the middle spraying a fountain of water into the air', 'the fountain spray',
         'a smiling engineer in a hard hat giving a thumbs up', 'the hard hat')])

short('S13', 'S13_tardigrado', '2026-11-27 19:00', 'ANIMALES EXTREMOS', 'El animal que sobrevive hasta en el ESPACIO 🐻',
      '', 'CASI | INDESTRUCTIBLE',
      'El tardígrado u "osito de agua" mide menos de un milímetro y puede sobrevivir a frío extremo, radiación y hasta al vacío del espacio.',
      '¿Qué otro animal crees que es casi indestructible? 👇',
      'Tardígrados: 0,1–1,5 mm; en criptobiosis (estado "tun") resisten desecación, temperaturas cercanas al cero absoluto, radiación y el vacío espacial (misión FOTON-M3, 2007). En 2016 se revivieron tardígrados congelados durante unos 30 años (muestra antártica de 1983).',
      '¿Sabías que existe un animal que puede sobrevivir hasta en el espacio?',
      """[serious] Se llama tardígrado, aunque le dicen "osito de agua". Mide menos de un milímetro y vive en el musgo, en el mar... casi en cualquier parte.
[amazed] Cuando las cosas se ponen feas, hace algo increíble: expulsa casi toda el agua de su cuerpo y se convierte en una bolita seca. Así puede esperar años.
[tense] En ese estado aguanta un frío cercano al cero absoluto, calor extremo y una radiación que mataría a cualquier persona.
[amazed] En 2007 lo mandaron al espacio, sin traje ni protección... y muchos volvieron vivos.
[serious] Pero espera... en 2016, unos científicos despertaron tardígrados que llevaban unos treinta años congelados.""",
      '¿Qué otro animal crees que es casi indestructible? Te leo en los comentarios.',
      C('¿Sabías que', 'polvo', 'A chubby microscopic tardigrade with eight stubby legs floating in outer space in front of a small planet Earth, stars all around', 'the tardigrade',
        'the tardigrade slowly paddles its eight stubby legs while floating and turning in space, stars twinkle, Earth rotates gently'),
      [K('Se llama', 'up', 'polvo', 'a giant close-up of green moss with tiny water droplets like a jungle', 'the water droplets',
         'a cute chubby tardigrade with eight stubby legs waving hello', 'a water droplet on its head'),
       K('Cuando las cosas', 'in', 'polvo', 'dry cracked ground under a hot sun', 'the hot sun',
         'a tardigrade curled up into a tiny dry wrinkled ball, sleeping', 'the sleeping ball'),
       K('En ese estado', 'in_fast', 'temblor', 'a laboratory freezer full of ice and frost', 'a warning light',
         'the curled-up tardigrade ball covered in frost but smiling', 'the frost crystals'),
       K('En 2007', 'out', 'polvo luz', 'a small satellite capsule orbiting Earth', 'the satellite solar panels',
         'a proud tardigrade wearing a tiny astronaut patch, floating', 'the astronaut patch'),
       K('Pero espera', 'in', 'polvo', 'a laboratory bench with a microscope and petri dishes', 'the microscope light',
         'an amazed scientist looking at a petri dish with a magnifying glass', 'the petri dish')])

short('S14', 'S14_hinterkaifeck', '2026-11-29 19:00', 'MISTERIOS SIN RESOLVER', 'Alguien vivía ESCONDIDO en la casa… y nadie lo sabía 😨',
      'HINTERKAIFECK, ALEMANIA | MARZO DE 1922', 'ALGUIEN VIVÍA | ESCONDIDO',
      'En 1922, en una granja de Baviera, el dueño encontró huellas en la nieve que llegaban a su casa… pero ninguna que saliera. Días después ocurrió uno de los crímenes más misteriosos de la historia.',
      '¿Tú qué crees que pasó? 👇',
      'Granja de Hinterkaifeck (Baviera), 1922: Andreas Gruber contó a vecinos que vio huellas en la nieve que llegaban del bosque y no salían, oía ruidos en el ático, faltaban llaves y apareció un periódico desconocido; la criada anterior se fue meses antes diciendo que la casa estaba "embrujada". El 31/03/1922 fueron asesinadas las seis personas de la granja; en los días siguientes alguien alimentó al ganado y salió humo de la chimenea. Sigue sin resolverse. Sin detalles violentos.',
      '¿Sabías que en una granja alguien vivió escondido en el ático... sin que nadie lo supiera?',
      """[serious] Alemania, marzo de 1922. En la granja de Hinterkaifeck, el dueño empieza a notar cosas raras.
[tense] Unas huellas en la nieve llegan desde el bosque hasta la casa... pero ninguna sale. Por las noches se oyen pasos en el ático. Desaparecen unas llaves.
[whispering] Meses antes, la criada se había ido asustada, diciendo que la casa estaba embrujada.
[serious] A finales de marzo, las seis personas que vivían allí fueron asesinadas.
[amazed] Lo más inquietante: durante días, alguien siguió dando de comer a los animales... y de la chimenea salía humo. Nunca se supo quién fue.""",
      '¿Tú qué crees que pasó?',
      C('¿Sabías que', 'niebla', 'A lonely old farmhouse in the Bavarian countryside at night in winter, snow on the roof, one small window lit in the attic', 'the lit attic window',
        'snow falls softly, the attic window light flickers, a shadow passes behind the window, fog drifts over the field'),
      [K('Alemania', 'up', 'niebla', 'a snowy farmyard with a wooden barn and fence in 1922', 'a lantern on the fence',
         'a worried old farmer in a 1920s wool coat and hat looking around', 'the lantern in his hand'),
       K('Unas huellas', 'in', 'niebla nervio', 'fresh footprints in the snow leading from a dark forest to a farmhouse door, none going back', 'the footprints catching the light',
         'the same farmer kneeling and staring at the footprints', 'his lantern'),
       K('Meses antes', 'in_fast', 'polvo', 'a dim farmhouse kitchen with an old wood stove', 'a candle on the table',
         'a scared young 1920s maid carrying a suitcase and looking over her shoulder', 'the suitcase handle'),
       K('A finales de marzo', 'in', 'niebla', 'an empty snowy farmhouse at dawn with the door slightly open', 'the dawn sky',
         'a solemn 1920s rural policeman holding his hat to his chest', 'his badge'),
       K('Lo más inquietante', 'out', 'niebla', 'the farmhouse at night with smoke rising from the chimney and cows in the barn', 'the chimney smoke',
         'a puzzled village neighbor peeking from behind a fence', 'the moonlight on his face')])

short('S15', 'S15_niebla_londres', '2026-11-30 19:00', 'DESASTRES INSÓLITOS', 'La NIEBLA que paralizó Londres durante 5 días 🌫️',
      'LONDRES, REINO UNIDO | DICIEMBRE DE 1952', 'LA NIEBLA | ASESINA',
      'En diciembre de 1952, una niebla mezclada con humo de carbón cubrió Londres durante cinco días. Fue tan espesa que la gente no se veía los pies.',
      '¿Alguna vez viste una niebla muy espesa? 👇',
      'Gran Smog de Londres, 5–9/12/1952: niebla con humo de carbón por anticiclón e inversión térmica; visibilidad de pocos metros; se suspendieron autobuses y ambulancias, se cancelaron funciones porque el público no veía el escenario; se estimaron unas 4.000 muertes en los primeros días y estudios posteriores hablan de 10.000–12.000. Llevó a la Ley de Aire Limpio de 1956.',
      '¿Sabías que una niebla paralizó Londres durante cinco días?',
      """[serious] Londres, diciembre de 1952. Hace frío y todo el mundo quema carbón en casa para calentarse.
[tense] Una mañana, una niebla amarillenta, mezclada con el humo, se queda atrapada sobre la ciudad... y no se va.
[amazed] Era tan espesa que la gente no se veía los pies. Los autobuses se detuvieron y en los teatros se cancelaron funciones: el público no veía el escenario.
[serious] Durante cinco días, miles de personas enfermaron. Hoy se calcula que murieron más de diez mil.
[amazed] Pero espera... gracias a esa tragedia, el país aprobó una de las primeras leyes para limpiar el aire.""",
      '¿Alguna vez viste una niebla muy espesa? Te leo en los comentarios.',
      C('¿Sabías que', 'niebla', 'A 1952 London street drowned in thick yellow fog, a red double-decker bus with its headlights on, old street lamps glowing', 'the street lamps',
        'the thick yellow fog rolls slowly through the street, the bus headlights flicker, the lamps glow and fade'),
      [K('Londres', 'up', 'niebla', 'London rooftops with dozens of chimneys puffing black smoke on a cold winter morning', 'the warm window lights',
         'a 1950s London man in a coat shovelling coal into a stove', 'the glowing coal'),
       K('Una mañana', 'in', 'niebla', 'a foggy London bridge with the river barely visible', 'a glowing street lamp',
         'a 1950s woman with a scarf covering her mouth and nose', 'her scarf'),
       K('Era tan espesa', 'in_fast', 'niebla nervio', 'an old theatre interior filled with fog so the stage is invisible', 'the stage lights',
         'a confused theatre usher holding a flashlight', 'the flashlight'),
       K('Durante cinco días', 'in', 'niebla', 'a foggy hospital corridor in the 1950s with benches', 'a lamp in the corridor',
         'a tired 1950s nurse with a mask', 'her nurse badge'),
       K('Pero espera', 'out', 'polvo luz', 'a clear sunny London skyline with blue sky', 'the sunshine',
         'a smiling 1950s politician holding up a document', 'the document seal')])

short('S16', 'S16_tetris', '2026-12-01 19:00', 'DETRÁS DEL JUEGO', 'El videojuego más famoso nació en la URSS 🧱',
      'MOSCÚ, UNIÓN SOVIÉTICA | 1984', 'NACIÓ EN | LA URSS',
      'Tetris lo creó en 1984 Alexéi Pázhitnov, un investigador soviético, en un ordenador que ni siquiera tenía gráficos… y durante años no cobró nada por él.',
      '¿Cuál es tu récord en Tetris? 👇',
      'Tetris: creado en 1984 por Alexéi Pázhitnov en el Centro de Computación Dorodnitsyn de la Academia de Ciencias de la URSS (Moscú), en un Electrónika 60 que solo mostraba caracteres de texto; nombre de "tetra" + "tenis"; los derechos pertenecían al Estado; la versión de Game Boy (1989) vendió unos 35 millones; Pázhitnov empezó a cobrar regalías en 1996 al fundar The Tetris Company.',
      '¿Sabías que el videojuego más famoso del mundo nació en la Unión Soviética?',
      """[serious] Moscú, 1984. Un investigador llamado Alexéi Pázhitnov trabaja con un ordenador tan viejo que ni siquiera puede mostrar dibujos: solo letras y símbolos.
[amazed] Aun así, en sus ratos libres crea un juego de piezas que caen. Le pone un nombre mezclando "tetra", que significa cuatro, y su deporte favorito: el tenis. Tetris.
[tense] El juego se copia de ordenador en ordenador por todo el país... pero como trabajaba para el Estado, los derechos no eran suyos.
[amazed] En 1989 llega a la Game Boy y vende decenas de millones de copias.
[serious] Pero espera... Pázhitnov no recibió dinero por su juego hasta 1996, doce años después de crearlo.""",
      '¿Cuál es tu récord en Tetris? Te leo en los comentarios.',
      C('¿Sabías que', 'polvo luz', 'A 1980s Soviet computer lab at night with an old green monochrome screen showing falling blocks made of brackets, a desk lamp, papers', 'the glowing green screen',
        'falling block shapes slowly drop on the green screen, the lamp flickers, papers flutter slightly'),
      [K('Moscú', 'up', 'polvo', 'a snowy 1984 Moscow street with an old research institute building', 'the lit windows',
         'a thoughtful 1980s Soviet programmer with a mustache and a sweater', 'his pencil'),
       K('Aun así', 'in', 'polvo luz', 'a cluttered 1980s office with an old computer terminal', 'the screen glow',
         'the same programmer happily playing with colorful toy blocks', 'the toy blocks'),
       K('El juego se copia', 'in_fast', 'polvo', 'a row of 1980s computer terminals with people playing', 'the floppy disks',
         'an excited young Soviet student holding a floppy disk', 'the floppy disk'),
       K('En 1989', 'out', 'polvo luz', 'a cozy 1989 living room with a TV and a sofa', 'a glowing handheld console screen',
         'a happy kid holding a grey handheld game console', 'the console screen'),
       K('Pero espera', 'in', 'polvo', 'a quiet office with a calendar on the wall', 'a single gold coin on the desk',
         'the programmer older with grey hair, smiling and holding one coin', 'the gold coin')])

short('S17', 'S17_frank_hayes', '2026-12-02 19:00', 'HISTORIAS QUE PARECEN MENTIRA', 'Ganó una carrera de caballos… sin estar VIVO 🏇',
      'NUEVA YORK, EE. UU. | 4 DE JUNIO DE 1923', 'GANÓ UNA | CARRERA',
      'En 1923, el jinete Frank Hayes sufrió un infarto en plena carrera… y su caballo cruzó primero la meta con él todavía en la silla.',
      '¿Conocías esta historia? 👇',
      'Belmont Park (Nueva York), 4/06/1923: Frank Hayes, mozo de cuadra que nunca había ganado como jinete, montaba a Sweet Kiss en una carrera de obstáculos; sufrió un infarto durante la carrera y la yegua ganó con él en la silla; lo descubrieron al llegar a la meta. Es el único jinete conocido que ganó una carrera después de morir.',
      '¿Sabías que un jinete ganó una carrera de caballos... después de morir?',
      """[serious] Nueva York, 1923. Frank Hayes es un mozo de cuadra que sueña con ganar una carrera. Nunca lo ha conseguido.
[tense] Ese día le dejan montar a una yegua llamada Sweet Kiss. Las apuestas no daban nada por ellos.
[amazed] A mitad de carrera, el corazón de Frank se detiene... pero su cuerpo sigue sujeto en la silla.
[tense] La yegua no se entera. Sigue corriendo, salta los obstáculos... y cruza la meta en primer lugar.
[serious] Al llegar a felicitarlo descubrieron la verdad. Frank ganó la única carrera de su vida... sin estar vivo para verlo.""",
      '¿Conocías esta historia? Te leo en los comentarios.',
      C('¿Sabías que', 'polvo', 'A 1920s horse race at a grassy steeplechase track, a brown mare jumping a hurdle with a jockey in silk colors slumped forward in the saddle, crowd in the stands', 'the jockey silk colors',
        'the mare gallops and leaps over the hurdle, dust and grass fly, the crowd waves hats, the jockey stays slumped in the saddle'),
      [K('Nueva York', 'up', 'polvo', 'a 1920s horse stable with hay and wooden stalls', 'a lantern on a hook',
         'a young 1920s stable hand with a cap brushing a horse, dreaming', 'the horse brush'),
       K('Ese día', 'in', 'polvo', 'a 1920s racetrack paddock with a betting board', 'the betting board numbers',
         'the same young man proudly wearing jockey silks and a riding helmet', 'his silk jockey shirt'),
       K('A mitad de carrera', 'in_fast', 'temblor', 'a racetrack mid-race with a blur of horses and dust', 'the dust cloud',
         'a surprised race commentator with a megaphone', 'the megaphone'),
       K('La yegua no se entera', 'out', 'polvo luz', 'a racetrack finish line with a ribbon and a cheering crowd', 'the finish ribbon',
         'a proud brown mare with a garland of flowers around her neck', 'the flower garland'),
       K('Al llegar', 'in', 'niebla', 'an empty racetrack at sunset', 'the setting sun',
         'a sad 1920s trainer holding a jockey helmet in his hands', 'the helmet')])

short('S18', 'S18_torre_eiffel', '2026-12-03 19:00', 'CRÍMENES Y ESTAFAS LEGENDARIAS', 'El hombre que "VENDIÓ" la Torre Eiffel 🗼',
      'PARÍS, FRANCIA | 1925', 'VENDIÓ LA | TORRE EIFFEL',
      'En 1925, el estafador Victor Lustig convenció a un empresario de que el gobierno iba a vender la Torre Eiffel como chatarra… y se la "vendió".',
      '¿Tú habrías caído en el engaño? 👇',
      'Victor Lustig, 1925: leyó que mantener la Torre Eiffel era caro; se hizo pasar por alto funcionario del Ministerio de Correos y Telégrafos, reunió a chatarreros en el hotel Crillon y "vendió" la torre a André Poisson; Poisson, avergonzado, no denunció. Según se cuenta, Lustig intentó repetirlo y huyó. Más tarde fue detenido en EE. UU. por falsificar dinero y murió en 1947.',
      '¿Sabías que un hombre vendió la Torre Eiffel... y ni siquiera era suya?',
      """[serious] París, 1925. Un estafador llamado Victor Lustig lee en el periódico que mantener la Torre Eiffel cuesta una fortuna.
[amazed] Se le ocurre una idea loca: se hace pasar por un alto funcionario del gobierno y reúne en secreto a varios empresarios de chatarra.
[tense] Les dice que la torre se va a desmontar... y que el gobierno la venderá al mejor postor.
[amazed] Un empresario se lo cree, le paga, y Lustig desaparece con el dinero. El hombre sintió tanta vergüenza que ni lo denunció.
[serious] Pero espera... se dice que Lustig volvió a intentarlo con otro comprador. Esta vez lo descubrieron y tuvo que huir.""",
      '¿Tú habrías caído en el engaño?',
      C('¿Sabías que', 'polvo luz', 'The Eiffel Tower in 1925 Paris at dusk, seen from a cobblestone street with old cars and lamp posts', 'the lights of the tower',
        'the tower lights twinkle on one by one, an old car drives by slowly, pigeons fly across the sky'),
      [K('París', 'up', 'polvo', 'a 1920s Parisian café terrace with small tables', 'a coffee cup',
         'an elegant 1920s con man with a thin mustache, a top hat and a newspaper, smirking', 'his gold watch chain'),
       K('Se le ocurre', 'in', 'polvo luz', 'a luxurious 1920s hotel meeting room with chandeliers', 'the chandelier',
         'the same con man in an official suit with a fake badge, speaking confidently', 'the fake badge'),
       K('Les dice', 'in_fast', 'polvo', 'a meeting table with blueprints of the Eiffel Tower', 'the blueprints',
         'a group of three 1920s businessmen listening with wide eyes', 'a briefcase'),
       K('Un empresario', 'out', 'polvo', 'a rainy Paris street at night', 'a suitcase full of banknotes',
         'an embarrassed businessman hiding his face behind his hat', 'his hat band'),
       K('Pero espera', 'in', 'polvo derecha', 'a 1920s train station platform with steam', 'the train lamp',
         'the con man running with a suitcase, holding his top hat', 'the suitcase')])

short('S19', 'S19_jeans', '2026-12-04 19:00', 'EL ORIGEN DE…', 'Los jeans se inventaron para TRABAJAR en las minas 👖',
      'NEVADA, EE. UU. | 1873', 'HECHOS PARA | MINEROS',
      'Los jeans nacieron en 1873, cuando un sastre y un vendedor de telas patentaron unos pantalones reforzados con remaches para trabajadores.',
      '¿Cuántos jeans tienes? 👇',
      'Jacob Davis, sastre de Reno (Nevada), reforzó con remaches de cobre unos pantalones de trabajo; se asoció con Levi Strauss, que le vendía la tela, y patentaron el 20/05/1873 los pantalones con remaches. Eran ropa de trabajo para mineros, leñadores y obreros; el bolsillo pequeño se pensó para el reloj de bolsillo.',
      '¿Sabías que los jeans se inventaron como ropa de trabajo para mineros?',
      """[serious] Estados Unidos, siglo diecinueve. Los mineros y los obreros rompen sus pantalones en pocos días.
[amazed] Un sastre llamado Jacob Davis tiene una idea: poner remaches de metal en las esquinas de los bolsillos, donde la tela siempre se rompía.
[tense] Funciona tan bien que no da abasto... pero no tiene dinero para patentar el invento.
[amazed] Así que se asocia con el comerciante que le vendía la tela: Levi Strauss. En 1873 patentan juntos los pantalones con remaches.
[serious] Pero espera... ¿y ese bolsillito pequeño que nadie usa? Se pensó para guardar el reloj de bolsillo.""",
      '¿Cuántos jeans tienes? Te leo en los comentarios.',
      C('¿Sabías que', 'polvo', 'An 1870s gold mine entrance in the American West with a wooden cart full of rocks, pickaxes and a pair of sturdy blue work trousers hanging on a beam', 'the copper rivets on the trousers',
        'dust drifts through the air, the mine cart rolls slowly, the trousers sway gently on the beam'),
      [K('Estados Unidos', 'up', 'polvo', 'a dusty 1870s mining camp with tents and wooden shacks', 'a lantern',
         'a dusty 1870s miner showing his torn trousers with a frustrated face', 'the hole in his trousers'),
       K('Un sastre', 'in', 'polvo luz', 'an 1870s tailor shop with fabric rolls and an old sewing table', 'the scissors',
         'a bearded 1870s tailor with spectacles holding a tiny metal rivet', 'the copper rivet'),
       K('Funciona tan bien', 'in_fast', 'polvo', 'a tailor shop with a long line of miners at the door', 'the shop sign frame',
         'the same tailor overwhelmed, holding a stack of trousers', 'the trousers'),
       K('Así que se asocia', 'out', 'polvo luz', 'an 1870s fabric warehouse with rolls of blue denim cloth', 'the denim rolls',
         'a friendly 1870s merchant in a suit shaking hands with the tailor', 'the handshake'),
       K('Pero espera', 'in', 'polvo', 'a wooden table with a pocket watch and a pair of jeans', 'the pocket watch',
         'a smiling cowboy pulling a pocket watch out of his small jeans pocket', 'the pocket watch')])

# ───────────────────────── SEMANA 3 ─────────────────────────
short('S20', 'S20_ano_sin_verano', '2026-12-06 19:00', 'DESASTRES INSÓLITOS', 'El año en que NEVÓ en pleno verano ❄️',
      'EUROPA Y NORTEAMÉRICA | 1816', 'EL AÑO SIN | VERANO',
      'En 1816 nevó en junio y hubo heladas en pleno verano. La causa: la erupción de un volcán en Indonesia el año anterior.',
      '¿Te imaginas nieve en julio? 👇',
      'Erupción del Tambora (Sumbawa, Indonesia), abril de 1815, la mayor de la historia registrada; sus cenizas y aerosoles enfriaron el clima; en 1816 hubo nevadas en junio en Nueva Inglaterra y heladas en julio y agosto; malas cosechas y hambrunas en Europa. Ese verano, encerrada por el mal tiempo junto al lago de Ginebra, Mary Shelley empezó "Frankenstein".',
      '¿Sabías que hubo un año en el que nevó en pleno verano?',
      """[serious] Indonesia, abril de 1815. El volcán Tambora entra en erupción. Es la mayor explosión volcánica de la historia registrada.
[tense] Sus cenizas suben tan alto que se extienden por todo el planeta, como una cortina que tapa el sol.
[amazed] Al año siguiente, en 1816, nieva en pleno junio en Estados Unidos. En Europa hiela en julio y las cosechas se pierden.
[serious] Por eso lo llamaron "el año sin verano".
[amazed] Pero espera... ese verano, una joven escritora, encerrada por las tormentas junto a un lago en Suiza, empezó a escribir una historia de terror: Frankenstein.""",
      '¿Te imaginas nieve en julio? Te leo en los comentarios.',
      C('¿Sabías que', 'niebla', 'A huge volcano erupting with a giant ash cloud over a tropical island and the sea, seen from far away', 'the glowing lava',
        'the volcano erupts, the ash cloud rises and spreads across the sky, the sea waves ripple, lightning flashes inside the cloud'),
      [K('Indonesia', 'up', 'brasas', 'a tropical island village with palm trees and a smoking volcano behind', 'the volcano glow',
         'a startled Indonesian fisherman in 1815 clothes holding a fishing net', 'the fishing net'),
       K('Sus cenizas', 'in', 'niebla', 'planet Earth seen from space covered by a thin grey veil of ash', 'the faint sun',
         'a worried 1810s astronomer looking through a brass telescope', 'the brass telescope'),
       K('Al año siguiente', 'in_fast', 'polvo', 'a snowy 1816 New England farm in summer with green trees covered in snow', 'the snow on the leaves',
         'a shocked 1810s farmer in a straw hat holding a frozen corn cob', 'the frozen corn cob'),
       K('Por eso lo llamaron', 'in', 'niebla', 'a grey frozen wheat field under a dark sky', 'a lonely lantern',
         'a sad 1810s European peasant woman holding an empty basket', 'the basket'),
       K('Pero espera', 'out', 'lluvia luz', 'a stormy lake in Switzerland at night with a candle-lit villa window', 'the candle-lit window',
         'a young 1816 woman writer with a quill pen and a notebook, inspired', 'the quill pen')])

short('S21', 'S21_vesna_vulovic', '2026-12-07 19:00', 'SUPERVIVIENTES IMPOSIBLES', 'Cayó desde 10.000 metros SIN paracaídas… y sobrevivió 😱',
      'CHECOSLOVAQUIA | 26 DE ENERO DE 1972', 'CAYÓ 10.000 | METROS',
      'En 1972, la azafata Vesna Vulović sobrevivió a la caída de su avión desde unos 10.000 metros. Tiene el récord Guinness de la caída más alta sin paracaídas.',
      '¿Cómo crees que sobrevivió? 👇',
      'Vuelo 367 de JAT, 26/01/1972: el avión se partió en el aire sobre Checoslovaquia (cerca de Srbská Kamenice); Vesna Vulović, azafata de 22 años, fue la única superviviente; récord Guinness de caída sin paracaídas (10.160 m). Estuvo en coma, con fracturas de cráneo, piernas y vértebras; volvió a caminar y no recordaba la caída. Algunos periodistas han cuestionado la altura; el récord sigue reconocido.',
      '¿Sabías que una mujer cayó desde diez mil metros sin paracaídas... y sobrevivió?',
      """[serious] Enero de 1972. Vesna Vulović tiene veintidós años y trabaja como azafata. Ese día ni siquiera le tocaba volar: la confundieron con otra compañera.
[tense] Sobre Checoslovaquia, el avión se parte en el aire, a unos diez mil metros de altura.
[amazed] Vesna queda atrapada en un trozo del avión que cae... y choca contra una ladera nevada llena de árboles.
[serious] Un vecino la encuentra con vida. Pasa días en coma, con muchísimos huesos rotos. Y de los veintiocho ocupantes, solo ella sobrevive.
[amazed] Pero espera... volvió a caminar, entró en el récord Guinness... y no recordaba nada de la caída.""",
      '¿Cómo crees que sobrevivió?',
      C('¿Sabías que', 'niebla', 'A 1970s passenger jet flying high above snowy mountains and clouds at sunset', 'the sunset light on the wings',
        'the jet flies slowly through the clouds, the clouds drift past, the sunset light shimmers on the wings'),
      [K('Enero de 1972', 'up', 'polvo luz', 'a 1970s airport gate with a passenger jet through the window', 'the airport lights',
         'a smiling young 1970s flight attendant in a blue uniform and cap', 'her wing badge'),
       K('Sobre Checoslovaquia', 'in_fast', 'temblor', 'a sky full of clouds with a tail section of a plane falling', 'a flash in the sky',
         'the same flight attendant gripping her seat with closed eyes', 'the seat buckle'),
       K('Vesna queda', 'in', 'niebla', 'a snowy forested mountain slope with broken branches', 'the snow sparkle',
         'a brave 1970s villager in a wool hat running through the snow', 'his lantern'),
       K('Un vecino', 'in', 'polvo', 'a 1970s hospital room with a window and flowers', 'the flowers',
         'the flight attendant in a hospital bed with bandages, a doctor beside her', "the doctor's stethoscope"),
       K('Pero espera', 'out', 'polvo luz', 'a sunny city park in the 1970s', 'the sunshine',
         'the same woman walking with a cane and smiling proudly', 'a golden medal around her neck')])

short('S22', 'S22_sin_luna', '2026-12-08 19:00', '¿QUÉ PASARÍA SI…?', '¿Qué pasaría si la LUNA desapareciera? 🌙',
      '', 'SI LA LUNA | DESAPARECIERA',
      'Si la Luna desapareciera, las mareas serían mucho más pequeñas, las noches mucho más oscuras y, a largo plazo, el clima de la Tierra se volvería inestable.',
      '¿Qué echarías más de menos de la Luna? 👇',
      'Sin la Luna: las mareas quedarían en torno a un tercio de su tamaño (solo las del Sol); las noches serían mucho más oscuras; muchos animales que se guían por la luz lunar o sus ciclos (corales que desovan con la luna llena, por ejemplo) se verían afectados; y la Luna estabiliza la inclinación del eje terrestre: sin ella, a lo largo de millones de años podría variar mucho y cambiar el clima. Es un escenario hipotético.',
      '¿Sabías lo que pasaría si la Luna desapareciera de repente?',
      """[serious] Imagina que esta noche miras al cielo... y la Luna ya no está.
[tense] Lo primero que notarías serían las noches: muchísimo más oscuras.
[amazed] Luego, el mar. La Luna tira del agua y provoca las mareas. Sin ella, las mareas serían mucho más pequeñas, unas tres veces menores.
[serious] Muchos animales se guían por la Luna. Algunos corales, por ejemplo, se reproducen todos a la vez cuando hay luna llena. Se quedarían sin calendario.
[amazed] Pero espera... lo más serio llegaría muy despacio: la Luna mantiene estable la inclinación de la Tierra. Sin ella, en millones de años, el clima podría volverse un caos.""",
      '¿Qué echarías más de menos de la Luna? Te leo en los comentarios.',
      C('¿Sabías', 'polvo luz', 'A night sky over a calm sea with a big glowing full moon, a small lighthouse on the shore', 'the full moon',
        'the full moon slowly fades and disappears from the sky, the sea becomes darker, the lighthouse beam keeps turning'),
      [K('Imagina', 'up', 'polvo', 'a rooftop at night with an empty dark sky full of stars', 'a small telescope',
         'a curious kid in pajamas pointing at the empty sky', 'the telescope'),
       K('Lo primero', 'in', 'niebla', 'a very dark countryside road at night', "a lantern's small light",
         'a surprised man holding a lantern in total darkness', 'the lantern'),
       K('Luego, el mar', 'in_fast', 'salpicaduras', 'a beach with very small calm waves and boats stuck on the sand', 'the sunlight on the water',
         'a puzzled old fisherman scratching his head next to his boat', 'his fishing hat'),
       K('Muchos animales', 'in', 'polvo luz', 'a coral reef at night releasing tiny colorful eggs into the water', 'the glowing coral eggs',
         'a confused sea turtle looking up at the dark sky', 'its shell pattern'),
       K('Pero espera', 'out', 'polvo', 'planet Earth in space slowly wobbling on its axis', 'the sun in the distance',
         'a scientist holding a spinning globe and looking worried', 'the globe')])

short('S23', 'S23_michael_malloy', '2026-12-09 19:00', 'CRÍMENES Y ESTAFAS LEGENDARIAS', 'El hombre al que NO pudieron eliminar 😳',
      'NUEVA YORK, EE. UU. | 1933', 'EL HOMBRE | IRROMPIBLE',
      'En 1933, un grupo de hombres aseguró la vida de Michael Malloy para cobrar el seguro. Lo intentaron todo… y él seguía volviendo al bar.',
      '¿Conocías a "Mike el Duradero"? 👇',
      'Michael Malloy, Nueva York, 1932–1933: cinco hombres (el "Murder Trust") contrataron seguros de vida a su nombre; intentaron acabar con él dándole alcohol sin límite, alcohol adulterado con anticongelante y aguarrás, comida en mal estado, dejándolo en la nieve una noche helada y atropellándolo; sobrevivió a todo. Murió el 22/02/1933 por gas; los implicados fueron detenidos y condenados. Sin detalles crueles.',
      '¿Sabías que unos hombres intentaron acabar con otro cinco veces... y él siempre volvía?',
      """[serious] Nueva York, 1932. En un bar, cinco hombres tienen un plan terrible: contratar un seguro de vida a nombre de un cliente y cobrarlo cuando muera.
[tense] Eligen a Michael Malloy. Primero le dan alcohol gratis, todo el que quiera. Él feliz... y al día siguiente vuelve al bar.
[amazed] Le sirven bebidas adulteradas, comida en mal estado... y nada. Lo dejan una noche helada en la nieve... y al día siguiente aparece pidiendo otra copa.
[tense] Hasta lo atropellan con un coche. Semanas después, Malloy vuelve al bar como si nada.
[serious] Lo apodaron "Mike el Duradero". Al final, la policía descubrió el plan y los responsables acabaron en prisión.""",
      '¿Conocías esta historia?',
      C('¿Sabías que', 'polvo luz', 'A smoky 1930s New York speakeasy bar with wooden counter, bottles on shelves and dim lamps', 'the bottles glowing on the shelves',
        'smoke curls in the air, the lamps sway slightly, a glass slides along the bar counter'),
      [K('Nueva York', 'up', 'polvo', 'a 1930s bar interior at night', 'a lamp over the table',
         'three shady 1930s men in fedora hats whispering around a table', 'a paper document on the table'),
       K('Eligen a', 'in', 'polvo luz', 'a 1930s bar counter with glasses', 'a glass of drink',
         'a cheerful scruffy old man with a red nose raising a glass', 'his glass'),
       K('Le sirven', 'in_fast', 'polvo nervio', 'a snowy 1930s New York street at night', 'a street lamp',
         'the same old man waking up in the snow, yawning and stretching', 'the snowflakes on his hat'),
       K('Hasta lo atropellan', 'out', 'polvo', 'a 1930s bar door with a neon sign shape without letters', 'the neon glow',
         'the same old man with a bandage on his head walking in happily', 'the bandage'),
       K('Lo apodaron', 'in', 'polvo luz', 'a 1930s police station with a desk and files', 'the police badge on the desk',
         'a serious 1930s detective in a trench coat holding handcuffs', 'the handcuffs')])

short('S24', 'S24_juliane_koepcke', '2026-12-10 19:00', 'SUPERVIVIENTES IMPOSIBLES', 'Cayó de un avión sobre la selva… y sobrevivió 11 días 🌴',
      'SELVA AMAZÓNICA, PERÚ | 24 DE DICIEMBRE DE 1971', 'SOBREVIVIÓ | 11 DÍAS',
      'En 1971, Juliane Koepcke, de 17 años, cayó atada a su asiento sobre la selva peruana. Sola y herida, caminó 11 días siguiendo el agua hasta encontrar ayuda.',
      '¿Qué habrías hecho tú en su lugar? 👇',
      'Vuelo 508 de LANSA, 24/12/1971: un rayo alcanzó el avión durante una tormenta sobre la Amazonía peruana; Juliane Koepcke, de 17 años, cayó unos 3.000 m atada a su fila de asientos y fue la única superviviente; con heridas, caminó 11 días siguiendo un arroyo río abajo (consejo de su padre, biólogo) hasta un refugio donde la encontraron unos madereros.',
      '¿Sabías que una chica cayó de un avión sobre la selva... y sobrevivió once días sola?',
      """[serious] Perú, Nochebuena de 1971. Juliane Koepcke, de diecisiete años, vuela con su madre sobre la selva amazónica.
[tense] Un rayo alcanza el avión, que se rompe en pleno vuelo. Juliane cae unos tres mil metros, todavía atada a su asiento.
[amazed] Despierta en el suelo de la selva, herida y sola. Pero recuerda un consejo de su padre: si te pierdes en la selva, sigue el agua río abajo.
[tense] Camina y nada durante once días, con insectos, lluvia y casi sin comida.
[amazed] Pero espera... al final encuentra un refugio de madereros. Fue la única superviviente del vuelo.""",
      '¿Qué habrías hecho tú en su lugar? Te leo en los comentarios.',
      C('¿Sabías que', 'lluvia', 'A dense Amazon rainforest under a dark stormy sky with lightning, a small 1970s propeller airliner flying above the trees', 'the lightning bolt',
        'lightning flashes, heavy rain falls, the plane shakes between the clouds, the treetops sway in the wind'),
      [K('Perú', 'up', 'polvo luz', 'the inside cabin of a 1970s airliner with small windows', 'the Christmas decoration',
         'a cheerful 17-year-old girl in a 1970s dress sitting by a plane window', 'a small Christmas gift box'),
       K('Un rayo', 'in_fast', 'temblor lluvia', 'a stormy sky over the jungle with dark clouds', 'the lightning',
         'the same girl strapped in her seat with her eyes closed, falling', 'the seatbelt buckle'),
       K('Despierta', 'in', 'niebla', 'a misty jungle floor with giant leaves and a small stream', 'a sunbeam on the stream',
         'the same girl with scratches and one shoe, looking around bravely', 'her glasses'),
       K('Camina', 'in', 'lluvia', 'a jungle river with muddy banks in the rain', 'the river reflections',
         'the girl wading through river water, determined', 'the water drops'),
       K('Pero espera', 'out', 'polvo luz', 'a wooden hut by a jungle river with a canoe', 'the hut lamp',
         'two kind Peruvian lumberjacks with machetes and hats looking surprised', 'their lantern')])

short('S25', 'S25_tiburon_groenlandia', '2026-12-11 19:00', 'ANIMALES EXTREMOS', 'El tiburón que puede vivir MÁS DE 270 AÑOS 🦈',
      'OCÉANO ÁRTICO', 'VIVE MÁS DE | 270 AÑOS',
      'El tiburón de Groenlandia es el vertebrado más longevo conocido: se calcula que puede vivir entre 270 y 500 años.',
      '¿Qué le preguntarías a un tiburón de 400 años? 👇',
      'Tiburón de Groenlandia (Somniosus microcephalus): estudio de 2016 (Nielsen et al., Science) con datación por radiocarbono del cristalino; el mayor ejemplar se estimó en unos 392 años (rango ~272–512); crece alrededor de 1 cm al año; alcanzaría la madurez hacia los 150 años; nada muy despacio en aguas heladas.',
      '¿Sabías que hay un tiburón que puede vivir más de doscientos setenta años?',
      """[serious] En las aguas heladas del Ártico vive un gigante lento y misterioso: el tiburón de Groenlandia.
[amazed] Nada tan despacio que parece dormido. Y crece apenas un centímetro al año.
[tense] En 2016, unos científicos calcularon su edad mirando dentro de sus ojos. El resultado los dejó sin palabras.
[amazed] El ejemplar más viejo podría tener unos cuatrocientos años. O sea: ya nadaba cuando Galileo miraba las estrellas.
[serious] Pero espera... estos tiburones no tienen crías hasta los ciento cincuenta años, más o menos. Un tiburón de cien años... todavía es un adolescente.""",
      '¿Qué le preguntarías a un tiburón de cuatrocientos años? Te leo en los comentarios.',
      C('¿Sabías que', 'polvo', 'A huge old grey Greenland shark swimming slowly under arctic sea ice, dim blue light filtering through the ice', 'the light through the ice',
        'the shark glides very slowly, its tail sways gently, small particles float in the water, light flickers through the ice'),
      [K('En las aguas', 'up', 'polvo', 'icebergs floating on a dark arctic sea under a grey sky', 'a ray of sunlight',
         'a bundled-up arctic fisherman with a fur hood and a fishing line', 'the fishing line'),
       K('Nada tan despacio', 'in', 'polvo', 'deep dark arctic water with snow-like particles falling', 'the floating particles',
         'a sleepy old Greenland shark with tiny eyes and a calm smile', 'its tiny eyes'),
       K('En 2016', 'in_fast', 'polvo luz', 'a cold research ship laboratory with sample jars', 'a glowing sample jar',
         'an amazed marine biologist in a warm jacket holding a test tube', 'the test tube'),
       K('El ejemplar más viejo', 'out', 'polvo luz', 'an old 1600s astronomer tower room with a window to the stars', 'the stars',
         'a 1600s astronomer with a beard looking through a small telescope', 'the telescope'),
       K('Pero espera', 'in', 'polvo derecha', 'an underwater arctic seabed with rocks', 'a glowing plankton',
         'a young Greenland shark wearing a tiny cap like a teenager', 'the cap')])

# ───────────────────────── SEMANA 4 ─────────────────────────
short('S26', 'S26_roanoke', '2026-12-13 19:00', 'MISTERIOS SIN RESOLVER', 'Una colonia entera DESAPARECIÓ y solo dejó una palabra 🪵',
      'ISLA ROANOKE, EE. UU. | 1590', 'DESAPARECIÓ | SIN RASTRO',
      'En 1590, el gobernador John White volvió a la colonia de Roanoke y no encontró a nadie. Solo una palabra tallada en un poste: CROATOAN.',
      '¿Tú qué crees que les pasó? 👇',
      'Colonia de Roanoke (actual Carolina del Norte): en 1587 llegaron unos 115 colonos; allí nació Virginia Dare, primera niña inglesa nacida en América; el gobernador John White volvió a Inglaterra por provisiones y la guerra con España retrasó su regreso hasta 1590; encontró el asentamiento vacío, sin señales de lucha, y la palabra "CROATOAN" tallada en un poste ("CRO" en un árbol). Nunca se supo su destino.',
      '¿Sabías que una colonia entera desapareció... y solo dejó una palabra?',
      """[serious] Año 1587. Más de cien colonos ingleses se instalan en la isla de Roanoke, en América. Allí nace la primera niña inglesa del continente: Virginia Dare.
[tense] El gobernador, John White, vuelve a Inglaterra a buscar provisiones. Promete regresar pronto.
[amazed] Pero estalla una guerra en el mar... y tarda tres años en volver.
[tense] Cuando por fin llega, no hay nadie. Ni rastro de lucha. Solo una palabra tallada en un poste: "Croatoan".
[serious] Era el nombre de una isla cercana... pero allí tampoco los encontraron. Más de cuatro siglos después, sigue siendo un misterio.""",
      '¿Tú qué crees que les pasó?',
      C('¿Sabías que', 'niebla', 'An abandoned 1500s wooden fort settlement in a misty forest by the sea, a wooden post with mysterious carved marks', 'the carved marks on the post',
        'fog drifts slowly through the empty settlement, leaves blow across the ground, the forest trees sway'),
      [K('Año 1587', 'up', 'polvo luz', 'a 1580s wooden sailing ship arriving at a sandy island beach', 'the ship lantern',
         'a happy 1580s English colonist family, the mother holding a baby', 'the baby blanket'),
       K('El gobernador', 'in', 'polvo', 'a wooden dock with a ship ready to sail', 'the sails in the sunlight',
         'a bearded 1580s governor in a doublet and hat waving goodbye', 'his hat feather'),
       K('Pero estalla', 'in_fast', 'temblor salpicaduras', 'old wooden warships firing cannons at sea', 'the cannon fire',
         'the same governor at a ship rail looking worried at the sea', 'his spyglass'),
       K('Cuando por fin', 'in', 'niebla nervio', 'an empty abandoned wooden fort overgrown with grass in the fog', 'a lantern left on the ground',
         'the same governor older, kneeling and touching a carved wooden post', 'the carved post'),
       K('Era el nombre', 'out', 'niebla', 'a misty island coastline with dense forest', 'the setting sun',
         'a thoughtful historian holding an old map and a magnifying glass', 'the magnifying glass')])

short('S27', 'S27_mona_lisa', '2026-12-14 19:00', 'CRÍMENES Y ESTAFAS LEGENDARIAS', 'El robo que hizo FAMOSA a la Mona Lisa 🖼️',
      'PARÍS, FRANCIA | 21 DE AGOSTO DE 1911', 'EL ROBO DE LA | MONA LISA',
      'Antes de 1911, la Mona Lisa no era el cuadro más famoso del mundo. Todo cambió cuando un empleado del Louvre la robó escondida bajo su bata.',
      '¿Sabías que había sido robada? 👇',
      'Robo del 21/08/1911: Vincenzo Peruggia, que había trabajado en el Louvre instalando vitrinas, se escondió y salió con el cuadro bajo su bata de trabajo; tardaron más de un día en notar la ausencia; hubo sospechas sobre Apollinaire y Picasso; miles de personas iban a ver el hueco vacío; en 1913 Peruggia intentó venderla en Florencia y fue detenido. El robo la convirtió en el cuadro más famoso del mundo.',
      '¿Sabías que la Mona Lisa se hizo famosa... porque la robaron?',
      """[serious] París, agosto de 1911. La Mona Lisa cuelga en el museo del Louvre... pero no es tan famosa como hoy.
[tense] Un lunes, con el museo cerrado, un empleado llamado Vincenzo Peruggia la descuelga, la esconde bajo su bata de trabajo y sale tranquilamente.
[amazed] Nadie se da cuenta hasta el día siguiente. El escándalo es mundial: hasta el pintor Pablo Picasso fue interrogado.
[amazed] Lo más curioso: miles de personas hacían cola para ver... el hueco vacío en la pared.
[serious] Pero espera... dos años después, Peruggia intentó venderla en Florencia y lo atraparon. Cuando el cuadro volvió, ya era el más famoso del planeta.""",
      '¿Sabías que había sido robada?',
      C('¿Sabías que', 'polvo luz', 'A grand 1911 museum gallery with gold frames on red walls and an empty space on the wall where a painting is missing, four iron hooks left', 'the empty iron hooks',
        'light beams move slowly across the gallery, dust floats in the air, a guard shadow passes along the wall'),
      [K('París', 'up', 'polvo', 'a 1911 Paris street with the Louvre palace facade', 'the gas lamps',
         'an elegant 1911 museum visitor with a mustache admiring a small painting in a gold frame', 'the gold frame'),
       K('Un lunes', 'in', 'polvo nervio', 'an empty museum staircase at dawn', 'a skylight',
         'a nervous 1911 workman in a white work smock hiding a flat package under it', 'the package edge'),
       K('Nadie se da cuenta', 'in_fast', 'polvo', 'a 1911 newsroom with printing presses', 'the hot printing press',
         'a shouting 1911 newspaper boy holding up a newspaper', 'the newspaper'),
       K('Lo más curioso', 'in', 'polvo luz', 'a museum wall with an empty space and a long line of people', 'the empty hooks',
         'a curious 1911 lady with a big hat peering at an empty wall', 'her hat flower'),
       K('Pero espera', 'out', 'polvo derecha', 'a 1913 Florence gallery office with a desk', 'the painting frame',
         'a proud Italian police officer in a 1913 uniform holding a framed painting wrapped in cloth', 'the frame')])

short('S28', 'S28_primer_videojuego', '2026-12-15 19:00', 'DETRÁS DEL JUEGO', 'Uno de los PRIMEROS videojuegos se jugaba en un osciloscopio 🎾',
      'NUEVA YORK, EE. UU. | 18 DE OCTUBRE DE 1958', 'EL PRIMER | VIDEOJUEGO',
      'En 1958, el físico William Higinbotham creó "Tennis for Two" para entretener a los visitantes de un laboratorio. Se jugaba en la pantalla de un osciloscopio.',
      '¿Cuál fue tu primer videojuego? 👇',
      'Tennis for Two: creado por William Higinbotham y Robert Dvorak en el Laboratorio Nacional de Brookhaven (Nueva York) para la jornada de puertas abiertas del 18/10/1958; usaba un ordenador analógico y un osciloscopio de unos 13 cm; mandos con un botón y una rueda; nunca se patentó. Hubo experimentos anteriores (OXO, 1952), por eso se dice "uno de los primeros".',
      '¿Sabías que uno de los primeros videojuegos se jugaba en un aparato de laboratorio?',
      """[serious] Nueva York, 1958. En un laboratorio científico van a abrir las puertas al público, pero las exposiciones son muy aburridas.
[amazed] Un físico, William Higinbotham, tiene una idea: conecta un pequeño ordenador a un osciloscopio, una pantalla redonda para medir señales eléctricas.
[tense] En la pantalla aparece una pelota de luz que rebota sobre una red. Con una rueda y un botón, dos personas pueden jugar al tenis.
[amazed] Los visitantes hacían colas larguísimas solo para probarlo. Lo llamó "Tennis for Two".
[serious] Pero espera... nunca lo patentó. Pensó que no era nada especial.""",
      '¿Cuál fue tu primer videojuego? Te leo en los comentarios.',
      C('¿Sabías que', 'polvo luz', 'A 1958 science lab with a small round oscilloscope screen showing a glowing ball bouncing over a net line, knobs and wires around', 'the glowing ball of light',
        'the glowing ball bounces across the round screen in an arc, the needles on the dials twitch, cables sway slightly'),
      [K('Nueva York', 'up', 'polvo', 'a 1950s science laboratory open house with boring display tables', 'a ceiling lamp',
         'a bored 1950s family looking at a display, the kid yawning', "the kid's lollipop"),
       K('Un físico', 'in', 'polvo luz', 'a lab workbench with wires, tubes and a small round screen', 'the screen glow',
         'a friendly 1950s physicist with glasses and a bow tie holding a wire', 'his bow tie'),
       K('En la pantalla', 'in_fast', 'polvo luz', 'a lab table with two small controller boxes with a knob and a button', 'the knobs',
         'two excited 1950s teenagers turning knobs and laughing', 'the button'),
       K('Los visitantes', 'out', 'polvo', 'a long queue of 1950s visitors in a lab hallway', 'the hallway lights',
         'a happy 1950s grandmother waiting in line with a ticket', 'the ticket'),
       K('Pero espera', 'in', 'polvo', 'a quiet 1950s office with a filing cabinet', 'a paper on the desk',
         'the same physicist shrugging with a modest smile', 'his glasses')])

short('S29', 'S29_roy_sullivan', '2026-12-16 19:00', 'SUPERVIVIENTES IMPOSIBLES', 'Le cayeron 7 RAYOS… y sobrevivió a todos ⚡',
      'PARQUE SHENANDOAH, EE. UU. | 1942–1977', '7 RAYOS | 1 HOMBRE',
      'Roy Sullivan, guarda forestal en Virginia, fue alcanzado por rayos siete veces entre 1942 y 1977. Tiene el récord Guinness.',
      '¿Saldrías a pasear con él en una tormenta? 👇',
      'Roy Sullivan, guarda forestal del Parque Nacional Shenandoah (Virginia): alcanzado por rayos 7 veces entre 1942 y 1977; récord Guinness de más rayos sobrevividos; sufrió quemaduras y en varias ocasiones se le quemó el pelo; sobrevivió a todos.',
      '¿Sabías que a un hombre le cayeron siete rayos... y sobrevivió a todos?',
      """[serious] Estados Unidos. Roy Sullivan es guarda forestal en un enorme parque nacional de Virginia, entre montañas y tormentas.
[tense] En 1942 le cae su primer rayo. Sobrevive. Años después, le cae otro... y otro.
[amazed] Un rayo le quemó las cejas. Otro le prendió fuego al pelo. Y aun así, siempre se levantaba.
[amazed] En total, siete rayos en treinta y cinco años. Ninguna otra persona conocida ha sobrevivido a tantos.
[serious] Pero espera... la gente empezó a tener miedo de estar cerca de él durante las tormentas. Por si acaso.""",
      '¿Saldrías a pasear con él en una tormenta? Te leo en los comentarios.',
      C('¿Sabías que', 'lluvia', 'A forest ranger standing on a mountain trail during a thunderstorm, a bright lightning bolt striking the trees behind him', 'the lightning bolt',
        'lightning flashes several times, rain pours down, the trees bend in the wind, the ranger holds his hat'),
      [K('Estados Unidos', 'up', 'polvo', 'green forested mountains with a ranger lookout tower', 'the sun over the mountains',
         'a friendly 1940s park ranger in a uniform and wide-brimmed hat', 'his ranger badge'),
       K('En 1942', 'in_fast', 'temblor', 'a lookout tower on a mountain top during a storm', 'the lightning',
         'the same ranger with his hair standing up and a surprised face', 'the sparks in his hair'),
       K('Un rayo le quemó', 'in', 'brasas', 'a forest trail after a storm with smoke rising', 'the smoke glow',
         'the same ranger with singed eyebrows and a smoking hat, still smiling', 'the smoking hat'),
       K('En total', 'out', 'polvo luz', 'a wall with seven framed lightning bolt pictures', 'the lightning pictures',
         'the ranger older, proudly holding up seven fingers', 'his badge'),
       K('Pero espera', 'in', 'lluvia derecha', 'a picnic area with dark storm clouds coming', 'a lightning flash',
         'a group of worried hikers stepping away with umbrellas', 'the umbrellas')])

short('S30', 'S30_phineas_gage', '2026-12-17 19:00', 'TU CUERPO ES INCREÍBLE', 'Una barra de hierro le ATRAVESÓ la cabeza… y siguió hablando 😳',
      'VERMONT, EE. UU. | 13 DE SEPTIEMBRE DE 1848', 'SIGUIÓ | HABLANDO',
      'En 1848, una barra de hierro atravesó la cabeza del obrero Phineas Gage. Sobrevivió, habló al momento… y su caso cambió lo que sabemos del cerebro.',
      '¿Conocías el caso de Phineas Gage? 👇',
      'Phineas Gage, capataz ferroviario en Vermont, 13/09/1848: una explosión lanzó una barra de hierro (unos 1,1 m y 6 kg) que entró por la mejilla izquierda y salió por la parte superior de la cabeza; estuvo consciente y habló; vivió unos 12 años más; su médico (John Harlow) describió cambios de personalidad; historiadores modernos señalan que luego se adaptó y trabajó como cochero en Chile. La barra y su cráneo están en un museo de Harvard. Sin detalles gráficos.',
      '¿Sabías que una barra de hierro atravesó la cabeza de un hombre... y él siguió hablando?',
      """[serious] Estados Unidos, 1848. Phineas Gage dirige a los obreros que abren camino para el ferrocarril, usando pólvora para romper rocas.
[tense] Un día, la pólvora explota antes de tiempo y lanza una barra de hierro de más de un metro... que le atraviesa la cabeza.
[amazed] Lo increíble: Phineas no pierde el conocimiento. Se sienta, habla con sus compañeros y hasta le cuenta al médico lo que pasó.
[serious] Sobrevivió. Pero sus amigos decían que su forma de ser había cambiado: "ya no es Gage".
[amazed] Pero espera... su caso ayudó a los científicos a entender que cada parte del cerebro tiene su función. Hoy la barra se guarda en un museo.""",
      '¿Conocías el caso de Phineas Gage?',
      C('¿Sabías que', 'polvo', 'An 1840s railroad construction site in the Vermont hills with rocks, wooden tools, a dust cloud and workers in the distance', 'a long iron rod on the ground',
        'dust swirls through the air, the workers in the distance swing their tools, the trees sway in the wind'),
      [K('Estados Unidos', 'up', 'polvo', 'a rocky hill with railroad tracks being built and a small steam engine', 'the steam engine lamp',
         'a confident 1840s railroad foreman with a hat and suspenders holding a long iron rod', 'the iron rod'),
       K('Un día', 'in_fast', 'temblor polvo', 'a rocky cut with a puff of dust and flying pebbles', 'the dust flash',
         'two shocked 1840s railroad workers jumping back with their hats flying', 'their hats'),
       K('Lo increíble', 'in', 'polvo', 'an 1840s ox cart on a dirt road', 'the lantern on the cart',
         'the foreman sitting in an ox cart with a bandage around his head, calmly talking', 'the bandage'),
       K('Sobrevivió', 'in', 'polvo', 'a small 1840s village street', 'a shop window',
         'two 1840s villagers whispering to each other with puzzled faces', 'their lantern'),
       K('Pero espera', 'out', 'polvo luz', 'a museum display case with an old iron rod and a model of a skull', 'the iron rod in the case',
         'a smiling modern neuroscientist pointing at a brain model', 'the brain model')])

short('S31', 'S31_hipo', '2026-12-18 19:00', 'TU CUERPO ES INCREÍBLE', '¿Por qué nos da HIPO? Un hombre lo tuvo 68 años 😵',
      '', '68 AÑOS CON | HIPO',
      'El hipo es un espasmo del diafragma seguido de un cierre brusco de las cuerdas vocales. Y un hombre, Charles Osborne, lo tuvo durante 68 años.',
      '¿Cuál es tu truco para quitar el hipo? 👇',
      'El hipo: contracción involuntaria del diafragma seguida del cierre súbito de la glotis, que produce el sonido "hip"; lo desencadenan comer rápido, bebidas con gas o emociones; los fetos ya tienen hipo en el útero; su función no está clara (hay hipótesis evolutivas). Charles Osborne (EE. UU.) tuvo hipo de 1922 a 1990, unos 68 años; récord Guinness.',
      '¿Sabías por qué nos da hipo... y que un hombre lo tuvo durante sesenta y ocho años?',
      """[serious] Debajo de los pulmones tienes un músculo con forma de cúpula: el diafragma. Es el que te ayuda a respirar.
[tense] A veces se contrae de golpe, sin avisar. Entra aire de repente... y las cuerdas vocales se cierran de un portazo. Ese portazo es el "hip".
[amazed] ¿Por qué pasa? Por comer muy rápido, por las bebidas con gas, por los nervios... Incluso los bebés tienen hipo antes de nacer.
[amazed] Y el récord es de locos: un hombre de Estados Unidos, Charles Osborne, tuvo hipo durante sesenta y ocho años seguidos.
[serious] Pero espera... un día, sin más, se le quitó. Y los científicos todavía discuten para qué sirve el hipo.""",
      '¿Cuál es tu truco para quitar el hipo? Te leo en los comentarios.',
      C('¿Sabías', 'polvo luz', 'A cozy kitchen with a glass of fizzy soda bubbling on a table next to a half-eaten sandwich', 'the soda bubbles',
        'the soda bubbles rise and fizz, the glass trembles slightly on the table, a curtain moves in the breeze'),
      [K('Debajo de los pulmones', 'up', 'polvo luz', 'a colorful cozy model of a human torso made of clay showing lungs and a dome-shaped muscle', 'the dome-shaped muscle',
         'a friendly doctor pointing at an anatomy model', 'the pointer stick'),
       K('A veces', 'in_fast', 'temblor', 'a dining table with plates', 'a glass of water',
         'a surprised man jumping in his chair with a hiccup, cheeks puffed', 'his puffed cheeks'),
       K('Por qué pasa', 'in', 'polvo', 'a fast food table with soda and burgers', 'the soda cup',
         'a boy eating very fast with a burger in his hand, then hiccuping', 'the burger'),
       K('Y el récord', 'out', 'polvo luz', 'a 1950s American farmhouse porch', 'a calendar on the wall',
         'an old American farmer in overalls with a hiccup bubble, patient smile', 'his overalls buckle'),
       K('Pero espera', 'in', 'polvo', 'a science lab with notes and a brain model', 'a question mark shaped lamp',
         'two scientists arguing politely with notebooks', 'their notebooks')])


def tabla(s):
    filas = [f"| 1 | {s['clip']['desde']} | clip | in | {s['clip']['efecto']} | {s['clip']['d']} | |"]
    for i, c in enumerate(s['capas'], 2):
        filas.append(f"| {i} | {c['desde']} | capas | {c['mov']} | {c['efecto']} | Fondo: {c['f']} · Personaje: {c['p']} | |")
    return '\n'.join(filas)


if __name__ == '__main__':
    prompts = {}
    for s in S:
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

> Datos verificados: {s['datos']}

## Narración
{s['narr']}

## Escenas
| # | Desde la frase | Diseño | Movimiento | Efecto | Imagen (plastilina) | Notas |
|---|---|---|---|---|---|---|
{tabla(s)}
"""
        open(os.path.join(R, 'Guiones', s['f'] + '.md'), 'w', encoding='utf-8').write(md)
        prompts[s['id']] = {
            'clip_img': CLIPIMG.format(d=s['clip']['d'], oro=s['clip']['oro']),
            'clip_mov': MOV.format(m=s['clip']['m']),
            'capas': [{'fondo': FONDO.format(d=c['f'], oro=c['oro']), 'pj': PJ.format(d=c['p'], oro=c['po'])} for c in s['capas']],
            'voz': s['narr'],
        }
    json.dump(prompts, open(os.path.join(R, 'En proceso', 'mes1_prompts.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(S), 'Shorts ·', sum(len(v['capas']) for v in prompts.values()), 'capas')
