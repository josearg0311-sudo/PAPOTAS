"""Mes 2 (21 dic 2026 – 16 ene 2027), VERSIÓN B: estilo 3D de dibujos animados.
- Short COMBINADO: escena 1 (gancho) y escena 5 (clímax) animadas con clip; las demás por capas.
- Short LIGERO y EXCLUSIVAS de los largos: las 6 escenas por capas (sin clip).
Uso (desde canal/): python3 herramientas/mes2.py → Guiones/S35…S61, En proceso/mes2_prompts.json, Largos/L05–L08.json"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mes1 import COL, TAGS, INI, FIN, R

TRES = ("Stylized 3D cartoon animation style: chunky toy-like characters with simple rounded shapes, big expressive eyes, smooth matte plastic textures, "
        "bright saturated colors, soft clean lighting, cinematic composition, original character design not resembling any existing franchise. "
        "The key element is rendered in vivid golden yellow: {oro}. No text, no letters, no logos.")
FONDO = "Empty background plate, no people: {d}. " + TRES
PJ = "Character cut-out on a plain flat light grey background, nothing else: {d}, shown from the waist up in the lower two thirds of the frame. " + TRES
CLIPIMG = "{d}. " + TRES
MOV = "3D cartoon animation: {m}. Keep the stylized 3D toy-like cartoon look, smooth motion."

S = []


def C(desde, efecto, d, oro, m, mov='in'):
    return dict(tipo='clip', desde=desde, mov=mov, efecto=efecto, d=d, oro=oro, m=m)


def K(desde, mov, efecto, f, oro, p, po):
    return dict(tipo='capas', desde=desde, mov=mov, efecto=efecto, f=f, oro=oro, p=p, po=po)


def short(id, f, publicar, serie, titulo, lugar, miniatura, descripcion, comentario, datos, gancho, cuerpo, pregunta, escenas, exclusiva=None):
    narr = f"[curious] {gancho} {INI}{cuerpo}\n[playful] {pregunta}{FIN}"
    lineas = [re.sub(r'\[[a-z ]+\]\s*', '', l).strip() for l in narr.splitlines()]
    for e in escenas:  # cada escena debe empezar justo al principio de una frase de la narración
        assert any(l.startswith(e['desde']) for l in lineas), (id, e['desde'])
    assert len(escenas) == 6, id
    clips = [i for i, e in enumerate(escenas) if e['tipo'] == 'clip']
    assert clips in ([], [0, 4]), (id, clips)
    S.append(dict(id=id, f=f, publicar=publicar, serie=serie, color=COL[serie], titulo=titulo, lugar=lugar, miniatura=miniatura,
                  hashtags=f"{TAGS[serie]} #sabiasque #curiosidades #acasolosabias #shorts", descripcion=descripcion, comentario=comentario,
                  datos=datos, narr=narr, escenas=escenas, exclusiva=exclusiva, tipo='combinado' if clips else ('exclusiva' if exclusiva else 'ligero')))


SUP, HIS, MIS, CRI, ORI = 'SUPERVIVIENTES IMPOSIBLES', 'HISTORIAS QUE PARECEN MENTIRA', 'MISTERIOS SIN RESOLVER', 'CRÍMENES Y ESTAFAS LEGENDARIAS', 'EL ORIGEN DE…'

# ═════════════════════════ SEMANA 1 (21–25 dic) ═════════════════════════
short('S35', 'S35_apolo8', '2026-12-21 19:00', HIS, 'Los primeros humanos que vieron "salir" la Tierra… en Nochebuena 🌍',
      'ÓRBITA DE LA LUNA | 24 DE DICIEMBRE DE 1968', 'LA TIERRA | SALIENDO',
      'En la Navidad de 1968, los astronautas del Apolo 8 fueron los primeros humanos en dar vueltas a la Luna y fotografiaron la Tierra asomando por el horizonte lunar.',
      '¿Te gustaría ver la Tierra desde el espacio? 👇',
      'Apolo 8 despegó el 21/12/1968 con Frank Borman, Jim Lovell y Bill Anders; primera misión tripulada en salir de la órbita terrestre y orbitar la Luna (10 órbitas, desde el 24/12); fueron los primeros en ver la cara oculta con sus ojos; Anders tomó la foto "Earthrise" (Salida de la Tierra) el 24/12; en Nochebuena hicieron una emisión de TV desde la órbita lunar, una de las más vistas de la época. Se publica el día del aniversario del despegue.',
      '¿Sabías que los primeros humanos que vieron la Tierra "salir" desde la Luna... lo hicieron en Nochebuena?',
      """[serious] Diciembre de 1968. Tres astronautas despegan en el Apolo 8 rumbo a la Luna.
[tense] Nadie había salido nunca de la órbita de la Tierra. Tardan unos tres días en llegar.
[amazed] El 24 de diciembre se convierten en los primeros humanos en dar vueltas a la Luna... y en ver su cara oculta con sus propios ojos.
[amazed] De pronto, por la ventanilla, la Tierra asoma por el horizonte lunar, azul y pequeñita. Anders saca la cámara: esa foto se llamó "Salida de la Tierra".
[warm] Pero espera... esa misma Nochebuena hablaron en directo por televisión desde la Luna. Fue una de las emisiones más vistas de la historia.""",
      '¿Te gustaría ver la Tierra desde el espacio? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'luz', 'the grey cratered surface of the Moon with the blue Earth rising over the horizon against a black starry sky', 'the sunlit edge of the Earth',
         'a cheerful 1960s astronaut in a white spacesuit with the helmet visor up, looking amazed', 'the helmet visor reflection'),
       K('Diciembre de 1968', 'up', 'polvo', 'a giant white Saturn V rocket on the launch pad at dawn with clouds of vapour at its base', 'the rocket engines flame',
         'three smiling 1960s astronauts in white spacesuits walking side by side', 'the mission patch'),
       K('Nadie había salido', 'in', 'polvo', 'a small cone-shaped spacecraft flying through black space with the blue Earth getting smaller behind it', 'the spacecraft hull',
         'a focused astronaut floating inside a cramped capsule full of switches', 'the control panel lights'),
       K('El 24 de diciembre', 'in', 'polvo', 'the dark far side of the Moon full of craters seen from orbit, lit by a thin sunlight', 'the crater rims',
         'an astronaut pressing his face to a small capsule window, eyes wide open', 'the window frame'),
       K('De pronto', 'in_fast', 'luz', 'a small round spacecraft window framing the blue and white Earth rising above the grey lunar horizon', 'the Earth glow',
         'an astronaut holding a big 1960s camera up to his eye', 'the camera'),
       K('Pero espera', 'out', 'luz', 'a cosy 1960s living room at Christmas with a decorated tree and an old television showing the Moon', 'the Christmas tree star',
         'a happy 1960s family in sweaters watching television together', 'the hot chocolate mugs')])

short('S36', 'S36_shackleton', '2026-12-22 19:00', SUP, '28 hombres atrapados en el hielo… y NO murió ninguno 🧊',
      'ANTÁRTIDA | 1915', '28 HOMBRES | EN EL HIELO',
      'En 1915 el barco Endurance de Ernest Shackleton quedó atrapado en el hielo de la Antártida y se hundió. Los 28 hombres sobrevivieron después de una aventura increíble.',
      '¿Tú habrías aguantado? 👇',
      'Expedición Imperial Transantártica: el Endurance quedó atrapado en el hielo del mar de Weddell en enero de 1915; el hielo lo aplastó y se hundió en noviembre de 1915; los 28 hombres acamparon sobre el hielo y en abril de 1916 llegaron en 3 botes a la isla Elefante; Shackleton y 5 hombres navegaron en el bote James Caird unos 1.300 km hasta Georgia del Sur, cruzaron sus montañas a pie hasta la estación ballenera de Stromness; el 30/08/1916 rescató a los 22 de la isla Elefante. No murió ninguno de los 28. El pecio se encontró en 2022 a unos 3.000 m.',
      '¿Sabías que veintiocho hombres quedaron atrapados en el hielo de la Antártida durante más de un año... y no murió ninguno?',
      """[serious] 1915. El barco Endurance, del explorador Ernest Shackleton, queda atrapado en el hielo del mar de Weddell, en la Antártida.
[tense] Durante meses, el hielo lo aprieta... hasta que lo aplasta y el barco se hunde. Los hombres acampan sobre el hielo.
[tense] Cuando el hielo empieza a romperse, reman en tres botes salvavidas hasta una isla helada y desierta: la isla Elefante.
[amazed] Desde allí, Shackleton y cinco hombres cruzan en un bote diminuto unos mil trescientos kilómetros del océano más bravo del mundo.
[amazed] Pero espera... al llegar, cruzó montañas heladas a pie y volvió a por los demás. En agosto de 1916 los rescató a todos. No murió ni uno.""",
      '¿Tú habrías aguantado? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A wooden three-masted ship trapped in a vast frozen sea of white ice under a pale polar sky, cartoon sailors in thick wool coats standing on the ice beside it', 'the ship lanterns',
         'the ice creaks and slowly presses against the hull, the sailors look up worried, snow drifts in the wind, the camera slowly pushes in'),
       K('1915', 'up', 'polvo', 'an old wooden sailing ship surrounded by flat white sea ice and icebergs in the Antarctic', 'the ship name board',
         'a determined 1910s polar explorer with a thick wool sweater and a scarf', 'his brass compass'),
       K('Durante meses', 'in_fast', 'temblor', 'a wooden ship crushed and tilted by huge blocks of ice, its masts leaning', 'the broken mast',
         'a worried 1910s sailor in a fur hat watching from the ice', 'his lantern'),
       K('Cuando el hielo', 'in', 'polvo', 'three small wooden lifeboats on a dark icy sea heading to a rocky snowy island', 'the oars',
         'a tired 1910s sailor rowing hard, snow on his beard', 'the oar handle'),
       C('Desde allí', 'salpicaduras', 'A tiny wooden lifeboat with a small sail climbing a gigantic grey ocean wave in a storm, cartoon sailors holding on tight', 'the small sail',
         'the tiny boat rises up the huge wave and slides down the other side, sea spray flies, the sailors hold on and the sail flaps in the wind'),
       K('Pero espera', 'out', 'luz', 'a rocky icy beach where a small steamship arrives in the bay under a clearing sky', 'the sunlight breaking through the clouds',
         'a group of happy bearded 1910s sailors waving their hats in celebration', 'their waving hats')])

short('S37', 'S37_joughin', '2026-12-23 19:00', SUP, 'El panadero del Titanic que aguantó 2 HORAS en el agua helada 🥶',
      'OCÉANO ATLÁNTICO | 15 DE ABRIL DE 1912', '2 HORAS EN EL | AGUA HELADA',
      'Charles Joughin, el jefe de panaderos del Titanic, pasó unas dos horas en el agua helada y sobrevivió. Él decía que fue gracias al whisky.',
      '¿Crees que el whisky le salvó o fue pura suerte? 👇',
      'Charles Joughin, jefe de panadería del Titanic, declaró que bebió whisky, lanzó sillas por la borda para que flotaran y se quedó en la popa hasta el final; estuvo unas dos horas en el agua hasta ser rescatado. Los médicos dicen que el alcohol no protege del frío: decirlo así. (Texto basado en el guion S05.)',
      '¿Sabías que el panadero del Titanic aguantó unas dos horas en el agua helada... y sobrevivió?',
      """[serious] Se llamaba Charles Joughin y era el jefe de panaderos. Cuando el barco empezó a hundirse, ayudó a subir gente a los botes.
[tense] Después, según contó, bajó a su camarote... y se tomó un buen trago de whisky.
[amazed] Luego empezó a lanzar sillas por la borda para que la gente tuviera algo a lo que agarrarse. Y se quedó en la popa hasta el último momento.
[serious] Cuando el barco desapareció, Joughin quedó flotando en un agua a menos de cero grados... durante unas dos horas, hasta que lo rescataron.
[amazed] Él siempre dijo que el whisky le salvó. Pero ojo: los médicos dicen que el alcohol no protege del frío. Fue pura suerte... y mucha resistencia.""",
      '¿Tú qué crees que le salvó?',
      [C('¿Sabías que', 'niebla', 'A huge 1912 ocean liner sinking at night with its stern rising out of a calm black sea, a stocky cartoon baker in a white chef hat holding the railing at the very top', 'the ship lights',
         'the stern slowly tilts higher, the ship lights flicker, the baker holds the railing tight and looks down, mist drifts over the water'),
       K('Se llamaba Charles', 'up', 'polvo', 'the warm bakery of a 1912 ocean liner with big bread ovens glowing and loaves on racks', 'the oven glow',
         'a sturdy 1912 baker with a white chef hat and apron, smiling', 'a loaf of bread'),
       K('Después, según contó', 'in', 'luz', 'a small 1912 ship crew cabin with a bunk bed, a porthole and a tilting lamp', 'the lamp',
         'a baker in a white chef hat drinking from a small metal flask', 'the flask'),
       K('Luego empezó', 'in_fast', 'temblor', 'the tilted wooden deck of a 1912 ocean liner at night with deck chairs sliding', 'the deck lamps',
         'a baker in a white chef hat throwing a wooden deck chair over the side', 'the deck chair'),
       C('Cuando el barco', 'niebla', 'A man in a white chef hat and a life jacket floating alone in a dark icy sea at night under the stars, his breath steaming, a lifeboat with a lantern far away', 'the lifeboat lantern',
         'the man floats and shivers, his breath steams in the cold air, small waves move him, the distant lantern slowly comes closer'),
       K('Él siempre dijo', 'out', 'polvo luz', 'the warm deck of a rescue ship at dawn with blankets and steaming mugs', 'the rising sun',
         'a smiling baker wrapped in a thick blanket holding a hot drink', 'the hot drink mug')])

short('S38', 'S38_luces_navidad', '2026-12-24 19:00', ORI, '¿Quién inventó las luces del árbol de Navidad? 🎄',
      'NUEVA YORK | DICIEMBRE DE 1882', 'LAS PRIMERAS | LUCES',
      'Antes de las luces eléctricas, los árboles de Navidad se iluminaban con velas. En 1882, Edward H. Johnson, socio de Thomas Edison, encendió el primer árbol con bombillas eléctricas.',
      '¿Tú ya pusiste las luces? 👇',
      'Durante mucho tiempo se usaron velas en los árboles, con riesgo de incendio. En diciembre de 1882 Edward H. Johnson, socio de Edison, decoró el árbol de su casa en Nueva York con 80 bombillas rojas, blancas y azules cableadas a mano; el árbol giraba sobre una base con motor; un periodista de Detroit lo describió. Las luces eléctricas fueron muy caras durante décadas (kits desde 1903) hasta popularizarse.',
      '¿Sabías que antes de las luces eléctricas, los árboles de Navidad se iluminaban... con velas de verdad?',
      """[serious] Durante mucho tiempo, en muchas casas se adornaba el árbol con velitas encendidas. Bonito... pero muy peligroso: provocaban incendios.
[curious] En 1882, en Nueva York, Edward Johnson, socio del inventor Thomas Edison, tiene una idea.
[amazed] Conecta a mano ochenta bombillas pequeñas, rojas, blancas y azules, y las coloca en el árbol de su casa.
[amazed] Y no solo eso: el árbol giraba sobre una base con motor. Un periodista lo vio y lo contó maravillado.
[serious] Pero espera... al principio eran tan caras que solo las tenían los ricos. Hicieron falta décadas para que llegaran a todas las casas.""",
      '¿Tú ya pusiste las luces? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'luz', 'a Victorian living room at night with a Christmas tree covered in small lit candles', 'the candle flames',
         'a surprised Victorian girl in a lace dress looking at the tree', 'her ribbon'),
       K('Durante mucho tiempo', 'up', 'brasas', 'a Christmas tree with candles where one branch has caught fire, smoke rising', 'the small flame',
         'a worried Victorian father running with a bucket of water', 'the bucket'),
       K('En 1882', 'in', 'polvo', 'a busy New York street in the 1880s at night with gas lamps and snow', 'the gas lamps',
         'a smart 1880s inventor in a waistcoat with a thick moustache holding a light bulb', 'the light bulb'),
       K('Conecta a mano', 'in', 'luz', 'a workbench with many small glass light bulbs, wires and tools', 'the glowing bulbs',
         'a focused 1880s inventor twisting wires with pliers', 'the bulb in his hand'),
       K('Y no solo eso', 'in_fast', 'luz', 'an elegant 1880s parlor with a Christmas tree covered in red, white and blue electric bulbs turning on a round base', 'the star on top',
         'an amazed 1880s journalist with a notebook and a bowler hat', 'his pencil'),
       K('Pero espera', 'out', 'polvo luz', 'a modern street at night with many houses decorated with colorful Christmas lights and snow', 'the window lights',
         'a smiling family in winter coats hanging a string of lights', 'the string of lights')])

short('S39', 'S39_callahan', '2026-12-25 19:00', SUP, '76 días a la deriva en una balsa… y SOBREVIVIÓ 🌊',
      'OCÉANO ATLÁNTICO | 1982', '76 DÍAS | A LA DERIVA',
      'En 1982, el navegante Steven Callahan sobrevivió 76 días en una balsa hinchable en medio del Atlántico, pescando con un arpón y sacando agua dulce del mar.',
      '¿Cuántos días crees que aguantarías tú? 👇',
      'Steven Callahan salió de las islas Canarias en su pequeño velero Napoleon Solo a finales de enero de 1982; unos días después algo (probablemente una ballena) golpeó el casco y el barco se hundió; sobrevivió 76 días en una balsa hinchable pescando doradas con un arpón y obteniendo agua con destiladores solares; vio pasar barcos que no lo vieron; la balsa sufrió pinchazos; derivó unos 2.900 km y unos pescadores lo rescataron cerca de Marie-Galante (Guadalupe, Caribe) el 20/04/1982.',
      '¿Sabías que un hombre sobrevivió setenta y seis días a la deriva en una balsa hinchable... en medio del océano?',
      """[serious] 1982. Steven Callahan cruza el océano Atlántico solo, en un pequeño velero, desde las islas Canarias.
[tense] Una noche, algo golpea el casco, probablemente una ballena. El barco se inunda y él apenas logra saltar a una balsa hinchable.
[amazed] Para sobrevivir, pesca con un arpón y saca agua dulce del mar con unos pequeños aparatos que funcionan con el sol.
[tense] Pasan semanas. Los tiburones rondan la balsa, que pierde aire... y ve pasar barcos que nunca lo ven.
[amazed] Pero espera... setenta y seis días después, unos pescadores lo encuentran cerca de las islas del Caribe. Había recorrido casi tres mil kilómetros.""",
      '¿Cuántos días crees que aguantarías tú? Te leo en los comentarios.',
      [C('¿Sabías que', 'salpicaduras', 'A small round orange inflatable life raft alone in the middle of a huge blue ocean under a blazing sun, a skinny bearded cartoon sailor inside shading his eyes', 'the raft canopy',
         'the raft gently bobs up and down on the waves, the sailor shades his eyes and looks around the empty horizon, the camera slowly circles'),
       K('1982', 'up', 'polvo', 'a small white sailboat leaving a sunny volcanic island harbour towards the open ocean', 'the sail',
         'a confident young 1980s sailor with a beard and a cap at the helm', 'the cap'),
       K('Una noche', 'in_fast', 'temblor salpicaduras', 'the inside of a small sailboat cabin at night flooding with sea water', 'the emergency lamp',
         'a frightened sailor in a life vest jumping out', 'the life vest'),
       K('Para sobrevivir', 'in', 'luz', 'the inside of an orange life raft with a fishing spear, small plastic water stills and a sea full of fish around', 'the fish scales',
         'a thin bearded sailor proudly holding a fishing spear', 'the spear tip'),
       C('Pasan semanas', 'salpicaduras', 'An orange life raft on the open sea with grey shark fins circling it and a big cargo ship passing far away on the horizon', 'the ship on the horizon',
         'the shark fins circle slowly around the raft, the bearded sailor waves his arms desperately at the distant ship, which keeps sailing away'),
       K('Pero espera', 'out', 'luz', 'a tropical Caribbean beach with palm trees and a small fishing boat arriving at sunset', 'the sunset',
         'a smiling Caribbean fisherman in a straw hat offering a hand', 'the straw hat')])

# ═════════════════════════ SEMANA 2 (27 dic – 1 ene) ═════════════════════════
short('S40', 'S40_cueva_tailandia', '2026-12-27 19:00', SUP, '12 niños atrapados en una cueva inundada… y los sacaron BUCEANDO 🤿',
      'CHIANG RAI, TAILANDIA | JULIO DE 2018', 'ATRAPADOS EN | LA CUEVA',
      'En 2018, doce niños de un equipo de fútbol y su entrenador quedaron atrapados en una cueva inundada de Tailandia. Buzos de todo el mundo los sacaron con vida.',
      '¿Recuerdas esta noticia? 👇',
      'Tham Luang (Chiang Rai, Tailandia): el 23/06/2018 los 12 niños del equipo Jabalíes Salvajes y su entrenador entraron en la cueva y la lluvia la inundó; el 2/07, a los 9 días, los encontraron los buzos británicos John Volanthen y Rick Stanton, a unos 4 km de la entrada ("How many of you?" "Thirteen"); entre el 8 y el 10/07 los sacaron buzos internacionales, sedados y con máscaras; el exbuzo de la Marina tailandesa Saman Kunan murió durante la operación. Los 13 sobrevivieron. Tono respetuoso.',
      '¿Sabías que doce niños quedaron atrapados en una cueva inundada... y los sacaron buceando?',
      """[serious] Tailandia, junio de 2018. Doce niños de un equipo de fútbol y su entrenador entran en una cueva después de entrenar.
[tense] Empieza a llover con fuerza. El agua inunda los túneles y los deja atrapados a kilómetros de la entrada, a oscuras.
[amazed] Nueve días después, dos buzos británicos los encuentran vivos, sentados en una roca. "¿Cuántos sois?". "¡Trece!".
[tense] Para sacarlos, buzos de todo el mundo los llevan uno a uno por túneles llenos de agua, con máscaras de oxígeno.
[serious] El rescate tuvo un precio: un exbuzo de la Marina, Saman Kunan, murió ayudando. Pero al final... los trece salieron con vida.""",
      '¿Recuerdas esta noticia? Te leo en los comentarios.',
      [C('¿Sabías que', 'niebla', 'A dark cave with a group of cartoon boys in red football shirts sitting on a muddy rock ledge above dark water, lit by the beam of a diver flashlight', 'the flashlight beam',
         'the flashlight beam sweeps across the cave and finds the boys, they slowly stand up and wave, the water ripples'),
       K('Tailandia', 'up', 'polvo', 'a green jungle hill in Thailand with the big mouth of a limestone cave and a few bicycles parked outside', 'the bicycles',
         'a smiling young football coach in a red tracksuit with a whistle', 'the whistle'),
       K('Empieza a llover', 'in_fast', 'lluvia', 'a narrow cave tunnel flooding with brown muddy water, rain pouring at the entrance', 'the last light at the entrance',
         'a worried boy in a red football shirt holding a small torch', 'the torch'),
       K('Nueve días después', 'in', 'niebla', 'a muddy rock ledge in a dark cave above still dark water', 'the diver light',
         'a kind British cave diver in a black wetsuit with a head torch smiling', 'the head torch'),
       C('Para sacarlos', 'niebla', 'An underwater flooded cave tunnel with a guide rope, a cartoon diver in black gear gently guiding a small wrapped figure in a full face mask', 'the guide rope',
         'the diver swims slowly through the narrow tunnel following the guide rope, bubbles rise, lights flicker on the rock walls'),
       K('El rescate tuvo', 'out', 'luz', 'the mouth of a cave at sunrise with ambulances and many rescuers cheering', 'the sunrise',
         'a grateful Thai mother in a blue dress with her hands together', 'her bracelet')])

short('S41', 'S41_vuelo19', '2026-12-28 19:00', MIS, '5 aviones desaparecieron en el Triángulo de las Bermudas… y el que fue a buscarlos TAMBIÉN ✈️',
      'FLORIDA, EE. UU. | 5 DE DICIEMBRE DE 1945', 'EL VUELO | 19',
      'En 1945, cinco aviones de la Marina de Estados Unidos desaparecieron durante un vuelo de entrenamiento. El hidroavión que salió a buscarlos también desapareció.',
      '¿Crees en el misterio del Triángulo? 👇',
      'Vuelo 19: 5 bombarderos torpederos TBM Avenger despegaron de Fort Lauderdale el 5/12/1945 en un vuelo de entrenamiento con 14 hombres; el jefe, el teniente Charles Taylor, dijo por radio que sus brújulas fallaban y se creía sobre los cayos de Florida; volaron perdidos horas; la última transmisión hablaba de amerizar juntos cuando se acabara el combustible; un hidroavión PBM Mariner con 13 tripulantes salió a buscarlos y también desapareció (un petrolero vio llamas: probablemente explotó). Nunca se encontraron los restos de los 5 aviones. La explicación más aceptada: se quedaron sin combustible y cayeron al mar.',
      '¿Sabías que cinco aviones desaparecieron en el Triángulo de las Bermudas... y el avión que fue a buscarlos también?',
      """[serious] Florida, 5 de diciembre de 1945. Cinco aviones de la Marina de Estados Unidos despegan para un vuelo de entrenamiento. A bordo van catorce hombres.
[tense] En pleno vuelo, el jefe de la escuadrilla dice por radio que sus brújulas no funcionan... y que no sabe dónde están.
[tense] Vuelan perdidos durante horas sobre el océano. El combustible se acaba. Por radio dicen que bajarán al mar todos juntos.
[amazed] Esa noche sale un hidroavión a buscarlos con trece tripulantes... y también desaparece.
[serious] Pero espera... nunca se encontraron los cinco aviones. Seguramente cayeron al mar sin combustible, pero así nació la leyenda del Triángulo.""",
      '¿Crees en el misterio del Triángulo? Te leo en los comentarios.',
      [C('¿Sabías que', 'niebla', 'Five chunky 1940s navy torpedo bomber planes flying in formation over a dark stormy ocean at dusk, clouds closing in', 'the plane propellers',
         'the five planes fly forward in formation and slowly disappear one by one into a thick bank of clouds, the propellers spin'),
       K('Florida', 'up', 'polvo', 'a sunny 1940s navy airfield with five torpedo bomber planes lined up on the runway', 'the hangar sign light',
         'a cheerful young 1940s navy pilot in a leather flight jacket and goggles', 'his goggles'),
       K('En pleno vuelo', 'in_fast', 'temblor', 'the cockpit of a 1940s plane with a spinning compass and many round gauges', 'the spinning compass',
         'a worried 1940s pilot speaking into a radio microphone', 'the radio microphone'),
       K('Vuelan perdidos', 'in', 'niebla', 'an endless grey ocean seen from above with low clouds and no land in sight', 'the fuel gauge needle',
         'a tense 1940s pilot tapping on a fuel gauge', 'the fuel gauge'),
       C('Esa noche', 'niebla', 'A big 1940s navy flying boat seaplane taking off from the water at night with its search lights on', 'the search light',
         'the seaplane lifts off the dark water and flies away into the night, its search lights sweep the sea, then it fades into the darkness'),
       K('Pero espera', 'out', 'niebla', 'a calm blue ocean map-like view with a mysterious triangle-shaped area of mist over the sea', 'the mist glow',
         'a curious 1940s navy officer looking through binoculars', 'the binoculars')])

short('S42', 'S42_ponzi', '2026-12-29 19:00', CRI, 'El estafador que DIO NOMBRE a una estafa 💸',
      'BOSTON, EE. UU. | 1920', 'EL ESQUEMA | PONZI',
      'En 1920, Charles Ponzi prometió duplicar el dinero de la gente en 90 días. En realidad pagaba a los primeros inversores con el dinero de los nuevos.',
      '¿Conocías el origen de este nombre? 👇',
      'Charles Ponzi, inmigrante italiano en Boston, en 1920 prometía un 50 % en 45 días o duplicar en 90 días; decía que ganaba con los cupones internacionales de respuesta postal (comprados baratos en un país y canjeados más caros en otro); en realidad pagaba a los antiguos con el dinero de los nuevos; reunió millones de dólares en pocos meses y vivió con lujo (mansión); en agosto de 1920 una investigación del periódico Boston Post y las autoridades destaparon el fraude; fue a prisión. Desde entonces se llama "esquema Ponzi".',
      '¿Sabías que hay una estafa muy famosa que lleva el nombre de un hombre de verdad?',
      """[serious] Boston, 1920. Un inmigrante italiano, Charles Ponzi, promete algo increíble: duplicar tu dinero en noventa días.
[curious] Su truco decía basarse en unos cupones de correo que se compraban baratos en un país y se cambiaban más caros en otro.
[tense] La gente hace cola en la calle para darle sus ahorros. Y al principio, cobran. ¿El secreto? Pagaba a los primeros... con el dinero de los nuevos.
[amazed] En pocos meses reúne millones de dólares y vive como un millonario, con mansión y coche de lujo.
[serious] Pero espera... un periódico investigó, descubrió el engaño y todo se derrumbó. Desde entonces, a esa estafa se le llama "esquema Ponzi".""",
      '¿Conocías el origen de este nombre? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A smiling cartoon 1920s con man in a white suit and a straw boater hat standing in front of an office door with a long queue of people holding money', 'the straw boater hat',
         'the man tips his hat and smiles, the queue of people waves dollar bills, bills fly in the air, the camera slowly pushes in'),
       K('Boston', 'up', 'polvo', 'a 1920s Boston street with brick buildings, old cars and a small office with a big window', 'the office window',
         'a charming 1920s man with a thin moustache, white suit and straw boater hat', 'the boater hat band'),
       K('Su truco', 'in', 'luz', 'a desk covered with small postal coupons, stamps and an old world map', 'the coupons',
         'a smiling 1920s salesman holding up a postal coupon', 'the coupon'),
       K('La gente hace cola', 'in', 'polvo', 'a crowded 1920s street with a long queue of people in hats in front of an office', 'the money bags',
         'an excited 1920s woman in a cloche hat holding her savings', 'her purse'),
       C('En pocos meses', 'luz', 'A 1920s mansion with a shiny vintage limousine in front, the cartoon con man in a white suit sitting in the back seat surrounded by money bags', 'the limousine',
         'the limousine slowly drives forward, the man waves from the window, dollar bills flutter out of the money bags'),
       K('Pero espera', 'out', 'polvo', 'a 1920s newspaper office with typewriters and stacks of newspapers', 'the printing press',
         'a determined 1920s reporter with a pencil behind his ear holding a newspaper', 'the pencil')])

short('S43', 'S43_desmond_doss', '2026-12-30 19:00', HIS, 'Salvó a 75 soldados… SIN disparar un arma 🎖️',
      'OKINAWA, JAPÓN | MAYO DE 1945', 'SALVÓ A 75 | SIN UN ARMA',
      'Desmond Doss se negó a llevar armas en la Segunda Guerra Mundial. Como médico de combate en Okinawa, salvó a unos 75 soldados y recibió la Medalla de Honor.',
      '¿Habías oído hablar de él? 👇',
      'Desmond Doss (EE. UU.), adventista, objetor de conciencia, se negó a portar armas y sirvió como médico de combate; sus compañeros se burlaban de él. En Okinawa, en la escarpa de Maeda (Hacksaw Ridge), a primeros de mayo de 1945, su unidad tuvo que retirarse y él se quedó y bajó a unos 75 heridos por el acantilado con una cuerda; se le atribuye la frase "Señor, ayúdame a salvar uno más". El presidente Truman le entregó la Medalla de Honor el 12/10/1945; primer objetor de conciencia en recibirla. Tono respetuoso, sin violencia gráfica.',
      '¿Sabías que un soldado salvó a setenta y cinco compañeros en plena batalla... sin disparar ni una sola vez?',
      """[serious] Segunda Guerra Mundial. Desmond Doss se alista en el ejército de Estados Unidos, pero por sus creencias se niega a tocar un arma.
[tense] Sus compañeros se burlan de él y lo llaman cobarde. Aun así, se convierte en médico de combate.
[tense] Mayo de 1945, isla de Okinawa, en Japón. Su unidad tiene que retirarse de un acantilado enorme. Muchos heridos se quedan arriba.
[amazed] Doss se queda. Uno a uno, baja a los heridos por el acantilado, atados con una cuerda. Dicen que repetía: "Señor, ayúdame a salvar a uno más".
[amazed] Pero espera... salvó a unos setenta y cinco hombres, y el presidente Truman le dio la Medalla de Honor.""",
      '¿Habías oído hablar de él? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A brave cartoon 1940s army medic with a white helmet with a red cross and no weapon, running through a smoky battlefield on a rocky ridge, carrying a medical bag', 'the medical bag',
         'the medic runs forward through drifting smoke, ducks, then kneels down and opens his medical bag, smoke drifts past'),
       K('Segunda Guerra Mundial', 'up', 'polvo', 'a 1940s army training camp with tents, wooden barracks and a flag', 'the flag',
         'a gentle young 1940s soldier with a kind face holding a small book instead of a rifle', 'the small book'),
       K('Sus compañeros', 'in', 'polvo', 'the inside of a 1940s army barracks with bunk beds and lockers', 'the locker lamp',
         'a calm young soldier with a medic armband with a red cross', 'the armband'),
       K('Mayo de 1945', 'in_fast', 'temblor', 'a huge rocky cliff on a green island covered in smoke, with cargo nets hanging down its face', 'the cargo net ropes',
         'a determined medic in a helmet with a red cross looking up at the cliff', 'the helmet'),
       C('Doss se queda', 'polvo', 'A tall rocky cliff at dusk, a cartoon army medic at the top carefully lowering a wounded soldier tied to a stretcher with a long rope', 'the rope',
         'the medic slowly lets the rope slide through his hands, the stretcher descends down the cliff, smoke drifts, he wipes his forehead and looks for the next one'),
       K('Pero espera', 'out', 'luz', 'the lawn of the White House on a sunny day with flags and a small stage', 'the medal',
         'a humble 1940s soldier in dress uniform wearing a medal around his neck', 'the medal')])

short('S44', 'S44_diomedes', '2026-12-31 19:00', HIS, 'Dos islas a 4 km… pero con CASI UN DÍA de diferencia 🕛',
      'ESTRECHO DE BERING | RUSIA Y ALASKA', 'LA ISLA DEL | MAÑANA',
      'Las islas Diómedes están a menos de 4 km, pero entre ellas pasa la línea internacional de cambio de fecha: la rusa va unas 21 horas por delante de la americana.',
      '¿Te gustaría visitar el futuro? 👇',
      'Islas Diómedes en el estrecho de Bering: Diómedes Mayor (Rusia) y Diómedes Menor (EE. UU., Alaska), separadas por unos 3,8 km; entre ellas pasa la línea internacional de cambio de fecha; la diferencia horaria es de 21 horas (UTC+12 y UTC−9); apodos "isla del mañana" e "isla del ayer"; en invierno puede formarse un puente de hielo, pero cruzar está prohibido. Comprobación del final (se publica el 31/12): la isla rusa recibe el Año Nuevo a las 6:00 de México del 31/12 y la americana a las 3:00 de México del 1/1.',
      '¿Sabías que hay dos islas separadas por menos de cuatro kilómetros... pero con casi un día entero de diferencia?',
      """[serious] En el estrecho de Bering hay dos islas: la Diómedes Mayor, rusa, y la Diómedes Menor, de Estados Unidos.
[amazed] Entre ellas pasa la línea internacional de cambio de fecha. Por eso, la isla rusa va unas veintiuna horas por delante.
[curious] Las llaman "la isla del mañana" y "la isla del ayer". Desde una, ves literalmente el mañana.
[tense] En invierno, el mar se congela y a veces se forma un puente de hielo entre las dos... pero cruzarlo está prohibido.
[amazed] Pero espera... esta noche, cuando celebres el Año Nuevo, en la isla rusa ya lo habrán celebrado hace horas... y en la americana todavía no habrá llegado.""",
      '¿Te gustaría visitar el futuro? Te leo en los comentarios. ¡Feliz Año Nuevo!',
      [K('¿Sabías que', 'in', 'niebla', 'two rocky islands facing each other across a narrow icy sea strait, one big and one small, under a pink arctic sky', 'the sun on the horizon',
         'a curious arctic explorer in a fur-hooded parka holding binoculars', 'the binoculars'),
       K('En el estrecho', 'up', 'polvo', 'a big flat-topped rocky island covered in snow next to a smaller island with a tiny village of wooden houses', 'the village windows',
         'a friendly Inupiat fisherman in a warm parka waving', 'the fur trim'),
       K('Entre ellas', 'in', 'luz', 'an icy sea between two islands with a glowing dotted line drawn on the water', 'the glowing line',
         'an amazed cartoon man holding two big alarm clocks showing different times', 'the alarm clocks'),
       K('Las llaman', 'in', 'luz', 'a small arctic island at dawn looking across the water to another island already in bright daylight', 'the daylight on the far island',
         'a kid in a puffy jacket looking through a telescope', 'the telescope'),
       K('En invierno', 'in_fast', 'polvo', 'a frozen sea forming a white ice bridge between two islands with a warning sign post', 'the warning post',
         'a stern border guard in a fur hat holding up a hand to stop', 'the badge on his hat'),
       K('Pero espera', 'out', 'brasas', 'two small arctic islands at night with fireworks bursting over one of them while the other is dark', 'the fireworks',
         'a happy family in winter coats celebrating with party hats', 'the party hats')])

short('S45', 'S45_pildoras_cometa', '2027-01-01 19:00', HIS, 'En 1910 la gente compró "píldoras anti-cometa"… para no morir ☄️',
      'EL MUNDO | MAYO DE 1910', 'PÍLDORAS | ANTI-COMETA',
      'En 1910, la Tierra iba a atravesar la cola del cometa Halley y se habló de un gas venenoso. Hubo pánico, máscaras de gas y hasta "píldoras anti-cometa". No pasó nada.',
      '¿Tú habrías comprado las píldoras? 👇',
      'En 1910 el cometa Halley se acercó y la Tierra atravesó su cola el 18–19 de mayo; los astrónomos habían detectado cianógeno (gas venenoso) en la cola; algunos periódicos y comentaristas dijeron que podría envenenar la atmósfera; hubo pánico: gente que tapó ventanas, compró máscaras de gas, y vendedores que ofrecieron "píldoras anti-cometa" (comet pills); no ocurrió nada porque el gas estaba extremadamente disperso.',
      '¿Sabías que en 1910 mucha gente compró "píldoras anti-cometa"... para no morir por culpa de un cometa?',
      """[serious] 1910. El cometa Halley se acerca a la Tierra, y los astrónomos anuncian que nuestro planeta va a atravesar su cola.
[tense] En esa cola habían detectado un gas venenoso, el cianógeno. Y algunos periódicos empiezan a decir que podría envenenar el aire.
[amazed] Se desata el pánico. Hay quien tapa puertas y ventanas con papel, y quien compra máscaras de gas.
[amazed] Y aparecen vendedores muy listos con un invento: las "píldoras anti-cometa", que supuestamente te protegían. Se vendieron muy bien.
[playful] Pero espera... en mayo, la Tierra atravesó la cola... y no pasó absolutamente nada. El gas estaba tan disperso que era inofensivo.""",
      '¿Tú habrías comprado las píldoras? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'luz', 'a night sky over an old 1910 town with a bright comet with a long glowing tail', 'the comet tail',
         'a nervous 1910 gentleman in a bowler hat pointing at the sky', 'his pocket watch'),
       K('1910', 'up', 'polvo', 'an old astronomical observatory with a big dome and a brass telescope under the stars', 'the telescope',
         'an excited 1910 astronomer with round glasses and a white beard', 'his glasses'),
       K('En esa cola', 'in', 'niebla', 'a 1910 street corner with a newspaper stand full of newspapers', 'the newspaper stand lamp',
         'a shouting 1910 newsboy in a flat cap waving a newspaper', 'the newspaper'),
       K('Se desata el pánico', 'in_fast', 'temblor', 'a 1910 house with windows covered in paper and tape', 'the paper on the windows',
         'a frightened 1910 woman wearing an old gas mask', 'the gas mask lenses'),
       K('Y aparecen vendedores', 'in', 'polvo', 'a 1910 market stall with little bottles and boxes of pills', 'the pill bottles',
         'a sly 1910 street salesman with a striped vest holding up a bottle of pills', 'the pill bottle'),
       K('Pero espera', 'out', 'luz', 'a peaceful 1910 town at sunrise with birds and a clear sky', 'the sunrise',
         'a relieved 1910 family laughing on their porch in pajamas', 'the coffee pot')])

# ═════════════════════════ SEMANA 3 (3–8 ene) ═════════════════════════
short('S46', 'S46_senal_wow', '2027-01-03 19:00', MIS, 'Una señal del espacio tan rara que escribieron "¡WOW!" 📡',
      'OHIO, EE. UU. | 15 DE AGOSTO DE 1977', 'LA SEÑAL | WOW!',
      'En 1977, el radiotelescopio Big Ear captó una señal muy potente que duró 72 segundos. El astrónomo Jerry Ehman escribió "Wow!" al lado. Nunca se volvió a detectar.',
      '¿Qué crees que fue? 👇',
      'Señal Wow!: captada el 15/08/1977 por el radiotelescopio Big Ear ("Gran Oreja") de la Universidad Estatal de Ohio, que buscaba señales de otras civilizaciones; el astrónomo voluntario Jerry Ehman la vio días después en el papel impreso, rodeó "6EQUJ5" y escribió "Wow!"; duró 72 segundos (lo que tardaba el haz en pasar por esa zona del cielo) y venía de la constelación de Sagitario; nunca se ha repetido pese a muchas búsquedas. Hay explicaciones naturales propuestas (por ejemplo, una nube de hidrógeno iluminada por una estrella), ninguna confirmada.',
      '¿Sabías que en 1977 un telescopio captó una señal del espacio tan extraña... que alguien escribió "¡Wow!" al lado?',
      """[serious] Ohio, agosto de 1977. Un radiotelescopio gigante, apodado "Gran Oreja", busca señales de otras civilizaciones.
[tense] Días después, el astrónomo Jerry Ehman revisa en papel los números que ha registrado el ordenador... y se queda helado.
[amazed] Había una señal muy potente, que duró setenta y dos segundos y venía de la constelación de Sagitario. Él la rodeó con un círculo y escribió: "¡Wow!".
[tense] Desde entonces, la han buscado una y otra vez apuntando al mismo lugar. Nunca se ha repetido.
[serious] Pero espera... se han propuesto explicaciones naturales, como una nube de gas iluminada por una estrella. Pero ninguna está confirmada. Sigue siendo un misterio.""",
      '¿Qué crees que fue? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'luz', 'a starry night sky over a huge flat radio telescope field with the Milky Way above', 'a bright star',
         'an amazed 1970s scientist with big glasses and a wide collar shirt', 'his glasses'),
       K('Ohio', 'up', 'polvo', 'a giant 1970s radio telescope made of huge flat metal reflectors on a green field', 'the metal reflector',
         'a cheerful 1970s radio engineer in a cardigan with headphones', 'the headphones'),
       K('Días después', 'in', 'polvo', 'a 1970s kitchen table covered with long folded computer printouts full of columns', 'the desk lamp',
         'a focused 1970s astronomer reading a long paper printout', 'the printout'),
       K('Había una señal', 'in_fast', 'luz', 'a close-up of an old computer printout with one column circled in red pen', 'the red circle',
         'an astonished 1970s astronomer holding a red pen with his mouth open', 'the red pen'),
       K('Desde entonces', 'in', 'polvo', 'a modern radio telescope dish pointing at a starry sky at night', 'the dish',
         'a patient modern scientist with headphones listening carefully', 'the headphones'),
       K('Pero espera', 'out', 'niebla', 'a colorful glowing gas cloud in deep space near a bright star', 'the glowing gas',
         'a thoughtful scientist scratching her head in front of a chalkboard', 'the chalk')])

short('S47', 'S47_mauro_prosperi', '2027-01-04 19:00', SUP, 'Perdido 9 días en el Sáhara… y apareció en OTRO PAÍS 🏜️',
      'DESIERTO DEL SÁHARA | 1994', 'PERDIDO EN | EL SÁHARA',
      'En 1994, el corredor italiano Mauro Prosperi se perdió en una tormenta de arena durante el Maratón de las Arenas y sobrevivió nueve días en el desierto.',
      '¿Tú habrías sobrevivido? 👇',
      'Mauro Prosperi, policía italiano y atleta, corría el Marathon des Sables (Marruecos) en 1994 (más de 200 km por etapas); una tormenta de arena le hizo perderse; se refugió en un pequeño santuario (marabout) abandonado donde comió murciélagos; caminaba de noche y descansaba de día; vio aviones de búsqueda que no lo vieron; tras unos 9 días una familia nómada lo encontró; estaba en Argelia, a cientos de km de la ruta; perdió más de 15 kg. (No mencionar su intento de quitarse la vida.)',
      '¿Sabías que un corredor se perdió en el desierto del Sáhara durante nueve días... y apareció en otro país?',
      """[serious] Marruecos, 1994. Mauro Prosperi, un policía italiano, corre el Maratón de las Arenas: más de doscientos kilómetros por el desierto.
[tense] En plena carrera, se levanta una tormenta de arena. No ve nada. Cuando por fin pasa, ya no encuentra el camino.
[amazed] Casi sin agua, se refugia en un pequeño santuario abandonado. Allí sobrevive comiendo... murciélagos.
[tense] Camina de noche y descansa de día. Ve pasar aviones de búsqueda, pero ellos no lo ven.
[amazed] Pero espera... al noveno día, una familia nómada lo encuentra. Estaba en Argelia, a cientos de kilómetros de la ruta, y había perdido más de quince kilos.""",
      '¿Tú habrías sobrevivido? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A lone cartoon runner with a number bib and a backpack walking across endless orange sand dunes under a burning sun', 'the burning sun',
         'the runner trudges up a sand dune, sand blows off the crest, heat waves shimmer, he stops and wipes his forehead and looks around'),
       K('Marruecos', 'up', 'polvo', 'the start line of a desert ultramarathon with flags and tents among orange dunes', 'the start banner flags',
         'a fit Italian runner with a cap, sunglasses and a number bib', 'the sunglasses'),
       K('En plena carrera', 'in_fast', 'temblor polvo', 'a huge orange sandstorm wall rolling over the desert dunes', 'the hidden sun',
         'a runner covering his face with a scarf against the wind', 'the scarf'),
       K('Casi sin agua', 'in', 'polvo', 'a small abandoned white domed desert shrine among dunes with bats under its roof', 'the dome',
         'an exhausted runner sitting in the shade with an empty water bottle', 'the empty bottle'),
       C('Camina de noche', 'polvo', 'A starry night over the desert dunes with a small plane flying high above and a tiny runner far below waving his arms', 'the plane lights',
         'the small plane flies across the sky without turning, the runner waves his arms and jumps, then lowers his arms sadly as the plane disappears'),
       K('Pero espera', 'out', 'luz', 'a nomad camp with tents and camels at sunset in the desert', 'the sunset',
         'a kind Tuareg nomad in an indigo turban offering a bowl of water', 'the water bowl')])

short('S48', 'S48_parker_puente', '2027-01-05 19:00', CRI, 'El hombre que "VENDIÓ" el puente de Brooklyn 🌉',
      'NUEVA YORK | PRINCIPIOS DEL SIGLO XX', 'VENDIÓ EL | PUENTE',
      'George C. Parker fue un estafador de Nueva York famoso por "vender" el puente de Brooklyn a turistas e inmigrantes, que intentaban luego cobrar peaje.',
      '¿Tú te lo habrías creído? 👇',
      'George C. Parker (1860–1936), estafador neoyorquino de principios del siglo XX; famoso por "vender" el puente de Brooklyn muchas veces, sobre todo a recién llegados, con documentos falsos, prometiendo ganancias por cobrar peaje; varios compradores intentaron montar casetas de peaje y la policía los retiró; se dice que también "vendió" la Estatua de la Libertad y otros monumentos; en 1928 fue condenado a cadena perpetua (prisión de Sing Sing). De ahí la expresión inglesa "si te crees eso, te vendo un puente".',
      '¿Sabías que un hombre "vendió" el puente de Brooklyn... y no una vez, sino muchas?',
      """[serious] Nueva York, principios del siglo veinte. George C. Parker es un estafador con una labia increíble.
[curious] Sus víctimas favoritas: los recién llegados a la ciudad. Les cuenta que es el dueño del puente de Brooklyn... y que se lo vende.
[amazed] Hasta les enseña papeles falsos. Les promete que se harán ricos cobrando peaje a todo el que cruce.
[amazed] Más de un comprador llegó al puente a montar su caseta de peaje... hasta que la policía le explicó que lo habían engañado.
[serious] Pero espera... en 1928 acabó en prisión de por vida. Y de él viene una frase en inglés: "si te crees eso, te vendo un puente".""",
      '¿Tú te lo habrías creído? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A sly cartoon early 1900s con man in a top hat and a striped suit proudly presenting the Brooklyn Bridge with an open arm to a naive visitor holding a suitcase', 'the top hat',
         'the con man sweeps his arm across the bridge with a big grin, the visitor looks up amazed and nods, the camera slowly pulls back to show the huge bridge'),
       K('Nueva York', 'up', 'polvo', 'a busy early 1900s New York street with horse carriages and old buildings', 'the street clock',
         'a charming early 1900s con man in a top hat with a waxed moustache', 'the top hat'),
       K('Sus víctimas', 'in', 'polvo', 'an early 1900s harbour with a big steamship and newly arrived travelers with suitcases', 'the steamship funnel',
         'a hopeful early 1900s immigrant with a suitcase and a cap', 'the suitcase'),
       K('Hasta les enseña', 'in', 'luz', 'an early 1900s office desk with fancy fake documents with seals and a fountain pen', 'the wax seal',
         'a con man holding up an official-looking paper with a big smile', 'the paper'),
       C('Más de un comprador', 'polvo', 'The entrance of a huge stone suspension bridge in the early 1900s, a happy cartoon man building a small wooden toll booth, a police officer in a blue uniform walking towards him', 'the toll booth sign',
         'the man hammers the last board of his toll booth and smiles, the police officer arrives and taps him on the shoulder, the man\'s smile drops'),
       K('Pero espera', 'out', 'luz', 'the Statue of Liberty on its island at sunset seen from the harbour', 'the torch',
         'a con man in a striped prison uniform shrugging with a grin', 'the prison number badge')])

short('S49', 'S49_balto', '2027-01-06 19:00', HIS, 'Unos perros salvaron a todo un pueblo corriendo MIL KILÓMETROS 🐕',
      'ALASKA | ENERO DE 1925', 'LA CARRERA | DEL SUERO',
      'En 1925, una epidemia de difteria amenazó al pueblo de Nome, en Alaska. Unos 20 conductores y unos 150 perros de trineo llevaron el medicamento por relevos a través de la nieve.',
      '¿Conocías a Balto o a Togo? 👇',
      'Carrera del suero a Nome (Alaska), 1925: epidemia de difteria; el suero (antitoxina) llegó en tren hasta Nenana y desde allí unos 20 conductores y unos 150 perros lo llevaron por relevos unos 1.085 km en unos 5 días y medio, con temperaturas de hasta −40 °C y ventiscas; el último relevo, de Gunnar Kaasen con el perro guía Balto, llegó a Nome el 2/02/1925; el tramo más largo y peligroso lo hizo Leonhard Seppala con su perro Togo; Balto tiene una estatua en Central Park (Nueva York) desde 1925.',
      '¿Sabías que unos perros de trineo salvaron a todo un pueblo... corriendo más de mil kilómetros por la nieve?',
      """[serious] Alaska, enero de 1925. En el pueblo de Nome estalla una epidemia de difteria, muy peligrosa para los niños.
[tense] El medicamento está a más de mil kilómetros, y con ese frío no llega ni en avión ni en barco.
[amazed] La solución: una carrera de relevos con perros de trineo. Unos ciento cincuenta perros se pasan el medicamento de equipo en equipo.
[tense] Corren día y noche, a cuarenta grados bajo cero. El último equipo, guiado por el perro Balto, llega a Nome en plena ventisca.
[amazed] Pero espera... el perro que hizo el tramo más largo y peligroso fue otro: Togo. Pero Balto se llevó la fama... y una estatua en Nueva York.""",
      '¿Conocías a Balto o a Togo? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A team of fluffy cartoon husky sled dogs pulling a wooden sled across a snowy plain at night, a musher in a fur parka behind them, northern lights above', 'the sled lantern',
         'the dogs run towards the camera kicking up snow, the musher shouts encouragement, the northern lights wave in the sky'),
       K('Alaska', 'up', 'polvo', 'a small snowy 1920s gold rush town with wooden houses by a frozen sea', 'the window lights',
         'a worried 1920s town doctor with round glasses and a fur hat', 'his doctor bag'),
       K('El medicamento', 'in', 'polvo', 'a frozen white sea with an old steamship stuck in the ice under a grey sky', 'the steamship lights',
         'a 1920s telegraph operator sending an urgent message', 'the telegraph key'),
       K('La solución', 'in', 'polvo', 'a snowy trail checkpoint with a cabin, sled dogs resting and a small wrapped package', 'the package',
         'a proud 1920s musher in a fur parka handing over a wrapped package', 'the package'),
       C('Corren día y noche', 'polvo', 'A heroic black cartoon husky leading a dog sled team through a fierce blizzard at night, a musher holding on tight', 'the dog harness',
         'the lead dog pushes forward against the blowing snow, the team follows in a line, the musher leans into the wind, snow whirls everywhere'),
       K('Pero espera', 'out', 'luz', 'a snowy city park with a bronze statue of a husky dog on a rock, sunny winter day', 'the statue',
         'a smiling kid in a winter hat petting a husky', 'the hat pompom')])

short('S50', 'S50_amelia_earhart', '2027-01-07 19:00', MIS, 'La aviadora que DESAPARECIÓ en pleno vuelo ✈️',
      'OCÉANO PACÍFICO | 2 DE JULIO DE 1937', 'DESAPARECIÓ | EN EL AIRE',
      'En 1937, Amelia Earhart intentaba dar la vuelta al mundo en avión cuando desapareció sobre el océano Pacífico junto a su navegante, Fred Noonan.',
      '¿Qué crees que le pasó? 👇',
      'Amelia Earhart fue la primera mujer en cruzar el Atlántico volando sola (1932). En 1937 intentó la vuelta al mundo en un Lockheed Electra con el navegante Fred Noonan; el 2/07/1937 despegaron de Lae (Nueva Guinea) hacia la diminuta isla Howland, donde los esperaba el guardacostas Itasca; últimos mensajes de radio: "We must be on you but cannot see you... gas is running low"; desaparecieron. Hipótesis: cayeron al mar sin combustible, o aterrizaron en la isla Nikumaroro. No se ha encontrado el avión.',
      '¿Sabías que una de las aviadoras más famosas de la historia desapareció en pleno vuelo... y nunca la encontraron?',
      """[serious] Amelia Earhart fue la primera mujer en cruzar el Atlántico volando sola. En 1937 quiere lograr algo aún mayor: dar la vuelta al mundo.
[tense] Con su navegante, Fred Noonan, solo le falta lo más difícil: el océano Pacífico.
[tense] Tienen que encontrar una isla diminuta, la isla Howland, en medio del océano. Un barco los espera allí para guiarlos por radio.
[amazed] Su último mensaje decía algo así: "Debemos estar encima de ustedes, pero no los vemos... y nos queda poco combustible". Después, silencio.
[serious] Pero espera... el avión nunca apareció. Unos creen que cayó al mar; otros, que aterrizó en una isla desierta cercana. El misterio sigue abierto.""",
      '¿Qué crees que le pasó? Te leo en los comentarios.',
      [C('¿Sabías que', 'niebla', 'A shiny silver twin-engine 1930s airplane flying low over an endless blue Pacific ocean with scattered clouds', 'the propellers',
         'the plane flies past the camera and slowly disappears into a white cloud over the ocean, the propellers spin'),
       K('Amelia Earhart', 'up', 'polvo', 'a 1930s airfield with a silver twin-engine airplane and a crowd waving flags', 'the airplane',
         'a confident 1930s female aviator with short curly hair, a leather jacket and a scarf', 'her scarf'),
       K('Con su navegante', 'in', 'polvo', 'the inside of a 1930s airplane cockpit with maps, a compass and the ocean outside', 'the compass',
         'a serious 1930s navigator with a map and a pencil', 'the map'),
       K('Tienen que encontrar', 'in', 'polvo', 'a tiny flat island in the middle of a huge ocean with a navy ship anchored nearby', 'the island',
         'a 1930s navy radio operator with big headphones', 'the radio dial'),
       C('Su último mensaje', 'niebla', 'The cockpit of a 1930s airplane over the ocean, a cartoon aviator with short curly hair speaking into a radio microphone, the fuel gauge almost empty', 'the fuel gauge',
         'the aviator speaks into the microphone and looks out of the window, the fuel needle trembles near empty, clouds pass outside, the radio light flickers off'),
       K('Pero espera', 'out', 'polvo luz', 'a tiny deserted tropical island with palm trees and a coral reef from above', 'the coral reef',
         'a curious modern explorer in a sun hat with a metal detector', 'the metal detector')])

short('S51', 'S51_harrison_okene', '2027-01-08 19:00', SUP, '3 días atrapado en un barco hundido… y SALIÓ VIVO 🌊',
      'COSTA DE NIGERIA | MAYO DE 2013', 'ATRAPADO BAJO | EL MAR',
      'En 2013, el cocinero Harrison Okene sobrevivió casi tres días en una bolsa de aire dentro de un barco hundido a unos 30 metros de profundidad.',
      '¿Te imaginas el susto del buzo? 👇',
      'El 26/05/2013 el remolcador Jascon-4 volcó por el mal tiempo frente a la costa de Nigeria y se hundió boca abajo a unos 30 m de profundidad; el cocinero Harrison Okene quedó atrapado en una bolsa de aire, a oscuras y con agua fría, unas 60 horas; los buzos (de una empresa contratada para recuperar cuerpos) lo encontraron vivo: uno vio su mano moverse; pasó después muchas horas en una cámara de descompresión. Fue el único superviviente de los 12 tripulantes. Tono respetuoso.',
      '¿Sabías que un hombre pasó casi tres días atrapado en un barco hundido en el fondo del mar... y salió vivo?',
      """[serious] Nigeria, mayo de 2013. Harrison Okene es el cocinero de un remolcador. Una madrugada, el mar vuelca el barco.
[tense] El barco se hunde boca abajo hasta unos treinta metros de profundidad. Harrison queda atrapado dentro, a oscuras.
[amazed] Pero encuentra una pequeña bolsa de aire. Rodeado de agua helada, hace lo único que puede: esperar... y respirar despacio.
[tense] Pasan casi tres días, a oscuras, y el aire se va acabando. Hasta que oye unos golpes... y ve una luz.
[amazed] Pero espera... los buzos no buscaban supervivientes. Cuando uno vio una mano moverse, se llevó el susto de su vida. Harrison fue el único superviviente.""",
      '¿Te imaginas el susto del buzo? Te leo en los comentarios.',
      [C('¿Sabías que', 'niebla', 'An upside-down sunken tugboat resting on the dark sea floor, a faint glow coming from a small air pocket inside a cabin window, bubbles rising', 'the faint glow',
         'small bubbles rise from the hull, fish swim slowly past, the faint glow in the window flickers, the camera slowly moves closer'),
       K('Nigeria', 'up', 'lluvia', 'a stormy sea at night with big waves and a small tugboat rocking', 'the tugboat lights',
         'a friendly Nigerian ship cook in a white apron and cap', 'the cooking spoon'),
       K('El barco se hunde', 'in_fast', 'temblor', 'the inside of a flooded upside-down ship cabin with furniture on the ceiling', 'a floating lamp',
         'a scared man in a t-shirt holding onto a pipe', 'the pipe'),
       K('Pero encuentra', 'in', 'niebla', 'a tiny pocket of air in the corner of a dark flooded cabin with water up to the top', 'the air bubble surface',
         'a calm man with his head just above the water breathing slowly', 'the water reflection'),
       C('Pasan casi tres días', 'niebla', 'A dark flooded ship corridor with a cartoon diver in yellow gear and a bright helmet light swimming slowly forward', 'the helmet light',
         'the diver swims slowly into the dark corridor, his helmet light sweeps over the walls, a hand rises out of the darkness into the light, the diver jumps back startled'),
       K('Pero espera', 'out', 'luz', 'the deck of a diving support ship on a sunny calm sea', 'the sun',
         'a relieved man wrapped in a blanket giving a thumbs up', 'the blanket')])

# ═════════════════════════ SEMANA 4 (10–15 ene) ═════════════════════════
short('S52', 'S52_ejercito_fantasma', '2027-01-10 19:00', HIS, 'El ejército de tanques… ¡HINCHABLES! 🎈',
      'EUROPA | 1944–1945', 'TANQUES | HINCHABLES',
      'En la Segunda Guerra Mundial, el Ejército Fantasma de Estados Unidos engañó al ejército alemán con tanques hinchables, sonidos grabados y mensajes de radio falsos.',
      '¿Habrías caído en el engaño? 👇',
      'Ejército Fantasma: 23.º Cuartel General de Tropas Especiales de EE. UU., unos 1.100 hombres, muchos artistas, diseñadores y técnicos; usaban tanques, camiones y cañones de goma hinchables, efectos de sonido con grandes altavoces y tráfico de radio falso para hacerse pasar por otras unidades; hicieron más de 20 operaciones en Europa en 1944–45; fue secreto hasta los años 90 (unos 50 años); entre sus miembros, el diseñador de moda Bill Blass y el pintor Ellsworth Kelly; recibieron la Medalla de Oro del Congreso en 2022.',
      '¿Sabías que en la Segunda Guerra Mundial hubo un ejército entero de tanques... hinchables?',
      """[serious] 1944. Estados Unidos crea una unidad secreta de unos mil cien soldados. Muchos no eran guerreros: eran artistas, diseñadores y técnicos de sonido.
[amazed] Su arma: tanques, camiones y cañones de goma, que se inflaban en poco tiempo. Desde lejos parecían de verdad.
[tense] Por la noche ponían altavoces enormes con ruidos grabados de motores y soldados trabajando, y mandaban mensajes de radio falsos.
[amazed] Así engañaron al ejército alemán una y otra vez, haciéndole creer que había tropas donde no había casi nadie.
[serious] Pero espera... todo fue secreto durante unos cincuenta años. Y entre aquellos soldados había artistas que luego fueron famosos, como el diseñador de moda Bill Blass.""",
      '¿Habrías caído en el engaño? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'Four cheerful cartoon 1940s soldiers easily lifting a full-size green inflatable army tank over their heads in a field', 'the tank star emblem',
         'the soldiers walk forward carrying the light inflatable tank above their heads, one of them balances it with one finger and grins'),
       K('1944', 'up', 'polvo', 'a 1940s army camp in a French countryside with tents and painting easels', 'the paint brushes',
         'a creative 1940s soldier artist with a beret over his helmet holding a sketchbook', 'the sketchbook'),
       K('Su arma', 'in', 'polvo', 'a green field with a row of inflatable army tanks being pumped up with air hoses', 'the air pump',
         'a soldier pumping a foot pump with a big smile', 'the foot pump'),
       K('Por la noche', 'in', 'niebla', 'a dark forest at night with huge loudspeakers mounted on a truck', 'the loudspeakers',
         'a 1940s sound technician with headphones turning knobs', 'the knobs'),
       C('Así engañaron', 'niebla', 'A misty field at dawn with a long row of army tanks, a cartoon enemy scout lying on a hill looking at them through binoculars', 'the binoculars',
         'the scout looks through his binoculars and counts the tanks nervously, then he lowers them and runs away, behind him one tank slowly deflates and sags'),
       K('Pero espera', 'out', 'luz', 'a 1950s fashion studio with mannequins, fabric rolls and sketches', 'the fabric roll',
         'an elegant 1950s fashion designer with a measuring tape around his neck', 'the measuring tape')])

short('S53', 'S53_piedras_valle_muerte', '2027-01-11 19:00', MIS, 'Piedras que se MUEVEN SOLAS en el desierto 🪨',
      'VALLE DE LA MUERTE, EE. UU.', 'LAS PIEDRAS | QUE CAMINAN',
      'En el Valle de la Muerte hay piedras que dejan largos surcos en el suelo, como si caminaran. Durante décadas fue un misterio, hasta que unos científicos las grabaron moviéndose.',
      '¿Qué teoría te habrías creído tú? 👇',
      'Racetrack Playa (Valle de la Muerte, California): piedras de hasta cientos de kilos con surcos detrás; durante décadas se propusieron vientos fuertes, magnetismo, bromas, etc.; entre 2013 y 2014 un equipo (Norris y colaboradores) colocó piedras con GPS y cámaras y las grabó moviéndose: tras lluvias se forma una capa fina de hielo que se congela de noche, con el sol se rompe en placas y el viento suave las empuja, arrastrando las piedras despacio. Publicado en 2014.',
      '¿Sabías que en el Valle de la Muerte hay piedras que se mueven solas... y dejan un rastro en el suelo?',
      """[serious] California, Estados Unidos. En un lago seco del Valle de la Muerte, llamado Racetrack, hay piedras repartidas por el suelo.
[amazed] Detrás de cada una hay un largo surco, como si la piedra hubiera caminado. Algunas pesan muchísimo... y nadie las había visto moverse.
[curious] Durante décadas se habló de todo: vientos, imanes, bromas... incluso extraterrestres.
[tense] Hasta que unos científicos pusieron GPS en algunas piedras y cámaras alrededor... y por fin las pillaron en movimiento.
[amazed] Pero espera... la culpa era del hielo. De noche se forma una capa fina de hielo. Con el sol se rompe en placas, y el viento las empuja... llevándose las piedras.""",
      '¿Qué teoría te habrías creído tú? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'polvo', 'a flat cracked dry lakebed in the desert with a single rock and a long curved trail behind it, mountains in the distance', 'the rock',
         'a puzzled hiker with a wide-brim hat scratching his head', 'the hat'),
       K('California', 'up', 'polvo', 'a vast desert valley with dry cracked earth and dark mountains under a blue sky', 'the sun',
         'a friendly desert park ranger with a ranger hat', 'the ranger badge'),
       K('Detrás de cada una', 'in', 'polvo', 'several rocks on a cracked dry lakebed each with long trails, some zigzagging', 'the trails',
         'an amazed tourist kneeling and pointing at a trail', 'the camera around his neck'),
       K('Durante décadas', 'in', 'luz', 'a desert at night with a starry sky and a small flying saucer far away', 'the flying saucer lights',
         'a funny conspiracy fan with a tin foil hat', 'the tin foil hat'),
       K('Hasta que', 'in_fast', 'polvo', 'a dry lakebed with a small weather station, a camera on a tripod and rocks with little GPS devices', 'the GPS device',
         'an excited scientist in a field vest looking at a tablet', 'the tablet'),
       K('Pero espera', 'out', 'luz', 'a shallow sheet of thin ice floating on a lakebed at sunrise, cracking into plates around rocks', 'the ice plates',
         'a smiling scientist holding up a thin plate of ice', 'the ice plate')])

short('S54', 'S54_van_meegeren', '2027-01-12 19:00', CRI, 'El falsificador que ENGAÑÓ a un jefe nazi 🖼️',
      'PAÍSES BAJOS | 1937–1945', 'EL FALSO | VERMEER',
      'Han van Meegeren falsificó cuadros de Vermeer que engañaron a los expertos y vendió uno a Hermann Göring. Para librarse de la acusación de traición, pintó otro "Vermeer" delante de testigos.',
      '¿Lo consideras un villano o un héroe? 👇',
      'Han van Meegeren, pintor neerlandés despreciado por los críticos, falsificó cuadros de Johannes Vermeer (s. XVII) usando lienzos antiguos y trucos para envejecerlos; los expertos lo dieron por auténtico ("La cena de Emaús", comprado por el museo Boijmans en 1937); vendió "Cristo y la adúltera" a Hermann Göring a cambio de unos 137 cuadros; en 1945 lo arrestaron por vender un tesoro nacional al enemigo (colaboración/traición); confesó que era falso y, para probarlo, pintó un nuevo "Vermeer" delante de testigos; en 1947 lo condenaron a un año por falsificación y fraude; murió ese mismo año antes de cumplirla.',
      '¿Sabías que un pintor tuvo que pintar un cuadro delante de testigos... para demostrar que era un falsificador y no un traidor?',
      """[serious] Países Bajos, años treinta. Han van Meegeren es un pintor despreciado por los críticos.
[amazed] Pinta cuadros imitando a Vermeer, un genio del siglo diecisiete, con lienzos viejos y trucos para envejecerlos. Los expertos dicen que son auténticos.
[tense] Vende varios por fortunas. Uno acaba en manos de Hermann Göring, uno de los jefes nazis, a cambio de más de cien cuadros.
[amazed] Al acabar la guerra lo arrestan por vender un tesoro nacional a los nazis, algo que se consideraba traición. Y él confiesa: "¡Ese cuadro lo pinté yo!".
[amazed] Pero espera... nadie le creía. Así que pintó otro "Vermeer" delante de testigos. Lo condenaron... pero solo por falsificador.""",
      '¿Lo consideras un villano o un héroe? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A cartoon 1940s painter with a thin moustache standing at an easel painting an old-master style portrait while serious men in suits and a policeman watch him closely', 'the paint brush',
         'the painter makes confident brush strokes, the watching men lean in closer with wide eyes, one of them drops his notebook'),
       K('Países Bajos', 'up', 'polvo', 'a 1930s Dutch canal street with narrow brick houses and bicycles', 'the canal reflection',
         'a proud 1930s Dutch painter with a thin moustache and a paint-stained smock', 'the palette'),
       K('Pinta cuadros', 'in', 'luz', 'a secret painter studio with old canvases, an oven and jars of pigment', 'the pigment jar',
         'a sneaky painter carefully baking a canvas in an oven', 'the canvas frame'),
       K('Vende varios', 'in', 'polvo', 'a grand 1940s art gallery hall with golden frames on the walls', 'the golden frames',
         'a greedy 1940s art collector in a fancy uniform with medals admiring a painting', 'the painting frame'),
       C('Al acabar la guerra', 'polvo', 'A 1945 interrogation room with a desk and a lamp, a cartoon painter with a thin moustache standing up and pointing at himself while two officers stare in shock', 'the desk lamp',
         'the painter stands up, slams his hand on the desk and points at himself, the officers look at each other in disbelief, the lamp swings'),
       K('Pero espera', 'out', 'luz', 'a courtroom in 1947 with wooden benches and a judge bench', 'the judge gavel',
         'a cheeky painter in a suit shrugging with a little smile', 'his tie')])

short('S55', 'S55_ann_hodges', '2027-01-13 19:00', SUP, 'Le cayó un METEORITO encima… mientras dormía la siesta ☄️',
      'ALABAMA, EE. UU. | 30 DE NOVIEMBRE DE 1954', 'LE CAYÓ UN | METEORITO',
      'En 1954, un meteorito atravesó el techo de la casa de Ann Hodges, en Alabama, y le golpeó mientras dormía. Es el primer caso bien documentado de una persona herida por un meteorito.',
      '¿Qué habrías hecho con el meteorito? 👇',
      'El 30/11/1954 en Sylacauga (Alabama, EE. UU.) un meteorito de unos 4 kg atravesó el techo de la casa de Ann Hodges, rebotó en una radio y le golpeó en la cadera mientras dormía en el sofá; sufrió un gran moratón; es el primer caso bien documentado de una persona herida por un meteorito; acudieron periodistas, curiosos y la Fuerza Aérea se lo llevó para examinarlo; la casera reclamó la piedra y hubo pleito; Ann se lo quedó (llegaron a un acuerdo) y en 1956 lo donó al Museo de Historia Natural de Alabama.',
      '¿Sabías que a una mujer le cayó un meteorito encima... mientras dormía la siesta?',
      """[serious] Alabama, Estados Unidos, noviembre de 1954. Ann Hodges está durmiendo la siesta en el sofá de su casa.
[tense] De repente, una roca del espacio atraviesa el techo, rebota en la radio... y le golpea en la cadera.
[amazed] Era un meteorito de unos cuatro kilos. Ann solo sufrió un enorme moratón. Es el primer caso bien documentado de una persona herida por un meteorito.
[tense] La noticia corre como la pólvora. Llegan periodistas, curiosos, militares... y la casera de Ann, que reclama la piedra porque cayó en su casa.
[amazed] Pero espera... tras un pleito, Ann se quedó el meteorito, y después lo donó a un museo, donde todavía se puede ver.""",
      '¿Qué habrías hecho con el meteorito? Te leo en los comentarios.',
      [C('¿Sabías que', 'brasas', 'A cosy 1950s living room with a woman napping on a sofa under a blanket, a glowing rock bursting through the ceiling in a cloud of plaster dust', 'the glowing rock',
         'the glowing rock crashes through the ceiling, bounces off an old wooden radio, plaster dust falls, the woman wakes up with a jump'),
       K('Alabama', 'up', 'polvo', 'a small 1950s wooden house in a quiet American town on a sunny afternoon', 'the porch light',
         'a sleepy 1950s housewife with curlers in her hair yawning', 'the curlers'),
       K('De repente', 'in_fast', 'temblor brasas', 'a fiery meteor streaking across a blue afternoon sky over a small town', 'the meteor',
         'a shocked 1950s neighbor dropping his garden hose', 'the garden hose'),
       K('Era un meteorito', 'in', 'luz', 'a 1950s doctor office with a black rock on the desk next to a stethoscope', 'the black rock',
         'a 1950s woman proudly showing a big bruise on her hip with a brave smile', 'the bandage'),
       C('La noticia corre', 'polvo', 'The front yard of a 1950s house crowded with cartoon reporters with old flash cameras, curious neighbors and a stern landlady in a hat', 'the camera flash bulbs',
         'the camera flashes pop again and again, reporters push forward with notebooks, the landlady crosses her arms and taps her foot'),
       K('Pero espera', 'out', 'luz', 'a natural history museum hall with a black meteorite displayed in a glass case', 'the glass case',
         'a fascinated kid with glasses pressing his face against a glass case', 'his glasses')])

short('S56', 'S56_napoleon_bajito', '2027-01-14 19:00', HIS, 'Napoleón NO era bajito 🤯',
      'FRANCIA | 1769–1821', 'NAPOLEÓN NO | ERA BAJITO',
      'Napoleón medía alrededor de 1,68 metros, algo más que la media de su época. El mito viene de la confusión entre pulgadas francesas e inglesas y de las caricaturas británicas.',
      '¿Tú también creías que era bajito? 👇',
      'En su autopsia (1821) Napoleón midió "5 pies 2 pulgadas" en unidades francesas (la pulgada francesa ≈ 2,71 cm frente a 2,54 de la inglesa), lo que equivale a unos 1,68–1,69 m; la media de los franceses de la época rondaba 1,64–1,65 m; las caricaturas británicas (James Gillray, "Little Boney") lo dibujaban diminuto; iba rodeado de su Guardia Imperial, con requisitos de estatura altos; el apodo "le petit caporal" (el pequeño cabo) era cariñoso.',
      '¿Sabías que Napoleón no era bajito... en realidad era más o menos normal para su época?',
      """[serious] Durante dos siglos nos han contado que Napoleón Bonaparte era muy bajito. Hasta existe el famoso "complejo de Napoleón".
[curious] Al morir, lo midieron: cinco pies y dos pulgadas. Pero ojo... eran pies y pulgadas franceses, más largos que los ingleses.
[amazed] Pasado a centímetros, medía alrededor de un metro sesenta y ocho. Algo más que la media de los franceses de su época.
[playful] Entonces, ¿de dónde sale el mito? En parte, de los caricaturistas británicos, que lo dibujaban como un hombrecillo enfadado.
[amazed] Pero espera... además, siempre iba rodeado de su guardia imperial, soldados elegidos por ser altos. A su lado, cualquiera parecía pequeño.""",
      '¿Tú también creías que era bajito? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'polvo', 'a grand French palace hall with golden decorations and a big map table', 'the golden decorations',
         'a confident cartoon French emperor with a bicorne hat and hand in his coat', 'the bicorne hat cockade'),
       K('Durante dos siglos', 'up', 'polvo', 'a modern classroom with a history book open on a desk', 'the history book',
         'a cheeky student laughing and holding his hand low to show someone short', 'the pencil'),
       K('Al morir', 'in', 'polvo', 'an old wooden table with antique measuring rulers marked in French and English units', 'the ruler',
         'a careful 1820s doctor holding a long measuring tape', 'the measuring tape'),
       K('Pasado a centímetros', 'in', 'luz', 'a row of cartoon early 1800s French men lined up against a height chart wall', 'the height chart',
         'a satisfied French emperor standing straight next to a height chart', 'the bicorne hat'),
       K('Entonces', 'in', 'polvo', 'an 1800s British printing shop with caricature drawings hanging to dry', 'the ink',
         'a mischievous 1800s British cartoonist drawing with a quill pen', 'the quill pen'),
       K('Pero espera', 'out', 'luz', 'a parade ground with very tall soldiers in tall bearskin hats standing in a row', 'the bearskin hats',
         'a normal-sized French emperor looking up at the tall guards, amused', 'his medal')])

short('S57', 'S57_guerra_zanzibar', '2027-01-15 19:00', HIS, 'La guerra más corta de la historia: ¡38 MINUTOS! ⏱️',
      'ZANZÍBAR | 27 DE AGOSTO DE 1896', 'LA GUERRA DE | 38 MINUTOS',
      'La guerra anglo-zanzibariana de 1896 duró entre 38 y 45 minutos. Es considerada la guerra más corta de la historia.',
      '¿Conocías esta guerra? 👇',
      'Guerra anglo-zanzibariana, 27/08/1896: tras la muerte del sultán Hamad (25/08), Khalid bin Barghash ocupó el palacio sin el permiso británico; ultimátum para irse antes de las 9:00; los barcos británicos abrieron fuego hacia las 9:02 y el alto el fuego llegó unos 38–45 minutos después; el palacio quedó destruido; Khalid se refugió en el consulado alemán; murieron unas 500 personas del bando zanzibarí (un marinero británico herido); Gran Bretaña obligó a Zanzíbar a pagar el coste de la munición. Tono respetuoso.',
      '¿Sabías que la guerra más corta de la historia duró menos que un partido de fútbol?',
      """[serious] Zanzíbar, una isla frente a África, agosto de 1896. Muere el sultán, y su pariente Khalid ocupa el palacio sin permiso de los británicos.
[tense] Gran Bretaña le da un ultimátum: o se va antes de las nueve de la mañana, o habrá guerra. Khalid se encierra en el palacio.
[tense] A las nueve, varios barcos de guerra británicos esperan frente a la costa. Y pocos minutos después... empiezan a disparar.
[amazed] Unos treinta y ocho minutos más tarde, el palacio está en ruinas y la bandera del sultán cae. La guerra ha terminado.
[serious] Pero espera... aunque fue cortísima, murieron unas quinientas personas. Y encima, Zanzíbar tuvo que pagar la munición que le dispararon.""",
      '¿Conocías esta guerra? Te leo en los comentarios.',
      [C('¿Sabías que', 'polvo', 'A big old clock tower by a tropical harbour with old steam warships anchored in the turquoise sea, the clock showing nine', 'the clock face',
         'the clock hands tick forward, seagulls fly away, the camera slowly pulls back to reveal the warships waiting in the bay'),
       K('Zanzíbar', 'up', 'polvo', 'a white 1890s palace with wooden balconies by a turquoise sea with dhow boats and palm trees', 'the palace flag',
         'a proud young 1890s sultan in a white robe and embroidered turban', 'the turban jewel'),
       K('Gran Bretaña', 'in', 'polvo', 'an 1890s colonial office with a desk, a map of Africa and a pocket watch', 'the pocket watch',
         'a stern 1890s British admiral with white side whiskers holding a letter', 'the letter seal'),
       K('A las nueve', 'in_fast', 'temblor', 'old steam warships with tall funnels in a tropical bay with smoke rising', 'the funnels',
         'a nervous 1890s sailor holding a big pocket watch', 'the pocket watch'),
       C('Unos treinta y ocho', 'brasas', 'A palace flag on a tall pole over a smoking damaged white palace by the sea, a big pocket watch in the foreground showing thirty eight minutes past nine', 'the flag',
         'the flag slowly slides down the pole and falls, smoke drifts across, the pocket watch hands tick, the camera slowly pushes in'),
       K('Pero espera', 'out', 'polvo', 'an 1890s accountant desk with a long bill, coins and an ink pot', 'the coins',
         'a grumpy 1890s clerk handing over a very long bill', 'the long bill')])

# ═════════════════════════ EXCLUSIVAS DE LOS LARGOS (solo capas, fondos en 16:9) ═════════════════════════
short('S58', 'S58_mineros_chile', '2026-12-26 18:00', SUP, '33 mineros, 69 días bajo tierra… y salieron TODOS ⛏️',
      'MINA SAN JOSÉ, CHILE | 2010', '69 DÍAS BAJO | TIERRA',
      'En 2010, 33 mineros quedaron atrapados a unos 700 metros de profundidad en la mina San José, en Chile. Tras 69 días, todos fueron rescatados con la cápsula Fénix.',
      '¿Recuerdas esta noticia? 👇',
      'Mina San José (cerca de Copiapó, desierto de Atacama, Chile): derrumbe el 5/08/2010; 33 mineros atrapados a unos 700 m; 17 días sin contacto, racionando la comida (dos cucharaditas de atún cada 48 horas); el 22/08 una sonda subió con la nota "Estamos bien en el refugio los 33"; les bajaron comida, agua y cartas por tubos estrechos ("palomas"); rescate con la cápsula Fénix el 12–13/10/2010 (69 días); unos mil millones de personas lo siguieron en directo.',
      '¿Sabías que treinta y tres mineros pasaron sesenta y nueve días atrapados a setecientos metros bajo tierra... y salieron todos vivos?',
      """[serious] Chile, agosto de 2010. En la mina San José, en pleno desierto de Atacama, se derrumba la roca. Treinta y tres mineros quedan atrapados.
[tense] Durante diecisiete días nadie sabe si siguen vivos. Abajo, se reparten la poca comida que hay: dos cucharaditas de atún cada dos días.
[amazed] Arriba perforan sin descanso. Hasta que una sonda vuelve a la superficie con un papel atado: "Estamos bien en el refugio los 33".
[tense] Por un tubo estrecho les bajan comida, agua y cartas de sus familias, mientras construyen una cápsula para sacarlos: la Fénix.
[amazed] Pero espera... en octubre, uno a uno, los treinta y tres salieron a la superficie. Se calcula que unos mil millones de personas lo vieron en directo.""",
      '¿Recuerdas esta noticia? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'polvo', 'a deep dark mine tunnel lit by helmet lamps with rocky walls', 'the helmet lamps',
         'a tough Chilean miner with a hard hat, a headlamp and a dusty face', 'the headlamp'),
       K('Chile', 'in_fast', 'temblor polvo', 'a mine entrance in a dry rocky desert with a cloud of dust coming out', 'the warning light',
         'a worried mine worker in an orange vest running', 'the orange vest stripes'),
       K('Durante diecisiete días', 'in', 'polvo', 'a small underground shelter room in a mine with benches and a few cans of food', 'the can of tuna',
         'a calm shift leader miner sharing a small spoon of food', 'the spoon'),
       K('Arriba perforan', 'up', 'polvo', 'a big drilling rig in the desert with a crowd of families and flags', 'the drill bit',
         'a joyful engineer holding up a small paper note', 'the paper note'),
       K('Por un tubo estrecho', 'in', 'luz', 'a desert rescue camp at night with a narrow metal rescue capsule hanging from a winch', 'the rescue capsule',
         'a hopeful woman in a scarf holding a letter to her husband', 'the letter'),
       K('Pero espera', 'out', 'luz', 'a desert rescue site at night with spotlights, cameras and a happy crowd cheering', 'the spotlights',
         'a smiling miner with dark sunglasses stepping out with his arms up', 'the sunglasses')],
      exclusiva='L05')

short('S59', 'S59_anastasia', '2027-01-02 18:00', MIS, 'La princesa que muchos creyeron VIVA… hasta que habló el ADN 👑',
      'RUSIA | 1918', 'EL MISTERIO DE | ANASTASIA',
      'Durante décadas mucha gente creyó que Anastasia Romanov había sobrevivido. Las pruebas de ADN demostraron que murió con su familia en 1918.',
      '¿Habías oído esta historia? 👇',
      'Tras la Revolución rusa, el zar Nicolás II, la zarina Alejandra y sus cinco hijos fueron retenidos en la casa Ipátiev de Ekaterimburgo y asesinados por los bolcheviques en julio de 1918; los cuerpos se ocultaron y surgió el rumor de que Anastasia (la hija menor) había sobrevivido; Anna Anderson afirmó ser ella desde los años 20 y muchos la creyeron; los restos de la familia se exhumaron en 1991 pero faltaban dos hijos; en 2007 aparecieron (Alexéi y una hermana) y el ADN confirmó que murió toda la familia; el ADN de Anna Anderson (1994) mostró que era Franziska Schanzkowska, una obrera polaca. Tono respetuoso, sin detalles violentos.',
      '¿Sabías que durante décadas mucha gente creyó que una princesa rusa había sobrevivido... hasta que habló el ADN?',
      """[serious] Rusia, 1918. Tras la revolución, el último zar, Nicolás segundo, y toda su familia son llevados presos a una casa en la ciudad de Ekaterimburgo.
[tense] En julio, la familia entera es asesinada en secreto. Pero los cuerpos no aparecen... y nace un rumor: la hija menor del zar, Anastasia, habría escapado.
[amazed] Años después, en Alemania, una mujer asegura ser ella. Se hace llamar Anna Anderson, y durante décadas muchos le creen.
[tense] En 1991 por fin encuentran los restos de la familia... pero faltan dos de los hijos. El misterio sigue vivo.
[amazed] Pero espera... en 2007 aparecen los dos que faltaban, y el ADN lo confirma: Anastasia murió con su familia. Y Anna Anderson era en realidad una obrera polaca.""",
      '¿Habías oído esta historia? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'niebla', 'a grand snowy Russian palace with golden onion domes at dusk', 'the golden domes',
         'a young Russian princess in an elegant white 1910s dress with a pearl necklace', 'the pearl necklace'),
       K('Rusia', 'up', 'polvo', 'a plain two-story house with a tall wooden fence in a Russian town in 1918', 'the window light',
         'a sad bearded 1910s Russian tsar in a plain military tunic', 'his buttons'),
       K('En julio', 'in', 'niebla', 'a dark misty forest road at night in 1918 with an old truck far away', 'the truck headlights',
         'a whispering 1918 villager in a headscarf telling a secret', 'her headscarf'),
       K('Años después', 'in', 'polvo', 'a 1920s Berlin street with a hospital building and old cars', 'the street lamp',
         'a mysterious 1920s woman with short wavy hair and a cloche hat', 'her brooch'),
       K('En 1991', 'in', 'polvo', 'a forest clearing with an archaeological dig site, tape and small flags', 'the small flags',
         'a careful archaeologist in a cap kneeling with a brush', 'the brush'),
       K('Pero espera', 'out', 'luz', 'a modern DNA laboratory with microscopes, test tubes and a glowing DNA helix on a screen', 'the DNA helix',
         'a smiling geneticist in a lab coat holding up a test tube', 'the test tube')],
      exclusiva='L06')

short('S60', 'S60_kaspar_hauser', '2027-01-09 18:00', MIS, 'El chico que apareció de la NADA 🕯️',
      'NÚREMBERG, ALEMANIA | 1828', 'EL CHICO | MISTERIOSO',
      'En 1828 apareció en Núremberg un muchacho que apenas sabía hablar, llamado Kaspar Hauser. Contó que había vivido encerrado en una celda oscura. Su origen sigue siendo un misterio.',
      '¿Quién crees que era? 👇',
      'Kaspar Hauser apareció el 26/05/1828 en Núremberg (Alemania), con unos 16 años y una carta; apenas sabía decir unas frases, pero escribió su nombre; contó que había vivido encerrado en una celda oscura, alimentado con pan y agua y con un caballito de madera; corrió el rumor de que era el príncipe heredero de Baden escondido al nacer; en diciembre de 1833, en Ansbach, apareció con una herida de arma blanca, dijo que lo atacó un desconocido y murió días después (algunos sospechan que se la hizo él); análisis de ADN (el más reciente en 2024) descartan el vínculo con la casa de Baden.',
      '¿Sabías que en 1828 apareció en una ciudad alemana un chico que casi no sabía hablar... y nadie supo nunca de dónde salió?',
      """[serious] Núremberg, Alemania, mayo de 1828. En una plaza aparece un muchacho de unos dieciséis años, con una carta en la mano.
[curious] Apenas sabe decir unas pocas frases. Pero cuando le dan papel y lápiz, escribe un nombre: Kaspar Hauser.
[tense] Con el tiempo cuenta que pasó toda su vida encerrado en una celda oscura, sin ver a nadie, comiendo solo pan y agua, y jugando con un caballito de madera.
[amazed] Pronto corre un rumor: que era un príncipe escondido al nacer. Años después aparece con una herida grave, dice que lo atacó un desconocido... y muere.
[serious] Pero espera... en 2024, un análisis de ADN descartó que fuera ese príncipe. Su verdadero origen sigue siendo un misterio.""",
      '¿Quién crees que era? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'niebla', 'a medieval German town square with half-timbered houses and cobblestones at dawn', 'the street lantern',
         'a confused teenage boy in ragged 1820s clothes and a felt hat holding a letter', 'the letter'),
       K('Núremberg', 'up', 'polvo', 'a cobblestone square with a fountain and half-timbered houses in 1828', 'the fountain',
         'a surprised 1820s shoemaker in an apron looking at someone', 'his hammer'),
       K('Apenas sabe decir', 'in', 'luz', 'a 1820s police office desk with a candle, paper and an ink pot', 'the candle',
         'a curious 1820s police captain with a tall hat watching closely', 'the quill pen'),
       K('Con el tiempo', 'in', 'niebla', 'a tiny dark stone cell with a straw bed, a jug of water and a loaf of bread', 'a small wooden toy horse',
         'a sad boy hugging a small wooden toy horse', 'the toy horse'),
       K('Pronto corre un rumor', 'in', 'polvo', 'a royal 1810s palace bedroom with a baby cradle and golden curtains', 'the crown on the cradle',
         'two gossiping 1820s ladies with fans whispering', 'the fans'),
       K('Pero espera', 'out', 'luz', 'a modern genetics lab with test tubes and a computer showing DNA', 'the DNA on the screen',
         'a thoughtful scientist holding a strand of old hair in tweezers', 'the tweezers')],
      exclusiva='L07')

short('S61', 'S61_andes_571', '2027-01-16 18:00', SUP, '72 días en la cordillera de los Andes tras un accidente de avión 🏔️',
      'CORDILLERA DE LOS ANDES | 1972', '72 DÍAS EN | LOS ANDES',
      'En 1972, un avión con un equipo de rugby uruguayo se estrelló en los Andes. 16 personas sobrevivieron 72 días hasta que dos de ellos cruzaron las montañas en busca de ayuda.',
      '¿Conocías esta historia? 👇',
      'Vuelo 571 de la Fuerza Aérea Uruguaya: el 13/10/1972 se estrelló en los Andes (lado argentino, cerca de la frontera con Chile) con un equipo de rugby (Old Christians), familiares y amigos (45 personas); estaban a unos 3.600 m; oyeron por radio que se suspendía la búsqueda; una avalancha (29/10) mató a varios más; para sobrevivir tomaron decisiones extremas (no dar detalles); Nando Parrado y Roberto Canessa caminaron unos 10 días por las montañas hasta Chile; encontraron al arriero Sergio Catalán al otro lado de un río, que les lanzó papel y lápiz atados a una piedra y Nando le devolvió una nota; rescate el 22–23/12/1972; sobrevivieron 16 tras 72 días. Tono muy respetuoso.',
      '¿Sabías que dieciséis personas sobrevivieron setenta y dos días en la cordillera de los Andes... después de un accidente de avión?',
      """[serious] Octubre de 1972. Un avión que lleva a un equipo de rugby uruguayo, con familiares y amigos, se estrella en plena cordillera de los Andes.
[tense] Están a más de tres mil quinientos metros, rodeados de nieve, sin ropa de abrigo ni comida suficiente. Por una radio escuchan que han dejado de buscarlos.
[serious] Para seguir vivos tuvieron que tomar decisiones durísimas, que los marcaron para siempre. Y una avalancha empeoró todavía más la situación.
[amazed] Al final, dos de ellos, Nando Parrado y Roberto Canessa, deciden cruzar las montañas a pie. Caminan unos diez días sin equipo de montaña.
[amazed] Pero espera... al otro lado de un río ven a un arriero chileno, Sergio Catalán. Él les lanza papel y lápiz atados a una piedra... y Nando le devuelve una nota pidiendo ayuda. Dieciséis volvieron a casa.""",
      '¿Conocías esta historia? Te leo en los comentarios.',
      [K('¿Sabías que', 'in', 'niebla', 'huge snowy Andes mountains under a grey sky with the broken fuselage of a small airplane half buried in the snow', 'the sunlight on the peaks',
         'a young 1970s rugby player in a thick wool sweater looking at the mountains', 'his scarf'),
       K('Octubre de 1972', 'up', 'polvo', 'a 1970s airport runway with a small twin-propeller airplane and a group of young men with sports bags', 'the airplane',
         'a cheerful 1970s Uruguayan rugby player holding a rugby ball', 'the rugby ball'),
       K('Están a más', 'in', 'polvo', 'the inside of a damaged airplane fuselage in the snow with blankets and seats', 'the small radio',
         'a worried young man listening to a small transistor radio', 'the radio'),
       K('Para seguir vivos', 'in', 'niebla', 'a snowy mountain slope with a broken fuselage under heavy grey clouds', 'the fuselage window',
         'a serious young man with a beard wrapped in a blanket looking down', 'the blanket'),
       K('Al final', 'in', 'polvo', 'an endless chain of snowy mountain peaks with two tiny figures climbing a ridge', 'the sunrise behind the peaks',
         'two determined young men with beards and makeshift backpacks walking in the snow', 'the makeshift backpack'),
       K('Pero espera', 'out', 'luz', 'a green Chilean mountain valley with a fast river and a horse on the other side', 'the river',
         'a kind Chilean muleteer on horseback in a poncho and a wide hat', 'the wide hat')],
      exclusiva='L08')

# ═════════════════════════ VÍDEOS LARGOS (orden #7 → #1; la #1 es la exclusiva) ═════════════════════════
LARGOS = {
    'L05': ('2026-12-26 18:00', ['S38', 'S35', 'S39', 'S37', 'S34', 'S36', 'S58'], {
        'intro': '¡Hola! Hoy te traigo siete historias reales increíbles, y la última es exclusiva de este vídeo. Quédate hasta el final, porque es la número uno.',
        'S38': 'Empezamos con algo que seguro tienes en casa estos días: las luces del árbol de Navidad.',
        'S35': 'Ahora, tres astronautas que pasaron la Nochebuena dando vueltas a la Luna.',
        'S39': 'Un hombre solo, una balsa hinchable... y setenta y seis días en medio del océano.',
        'S37': 'El panadero del Titanic que aguantó horas en el agua helada.',
        'S34': 'Ya en el podio: una Navidad en la que los enemigos dejaron las armas.',
        'S36': 'Casi en lo más alto: veintiocho hombres atrapados en el hielo de la Antártida.',
        'S58': 'Y la número uno, una historia exclusiva que no verás en nuestros Shorts: treinta y tres mineros atrapados bajo tierra.',
        'cierre': '¿Cuál te sorprendió más? Déjame el número en los comentarios, y suscríbete para descubrir algo nuevo cada día.'}),
    'L06': ('2027-01-02 18:00', ['S45', 'S44', 'S42', 'S41', 'S40', 'S43', 'S59'], {
        'intro': '¡Feliz año! Para empezar, siete historias reales que parecen mentira. La última es exclusiva de este vídeo, así que quédate hasta el final.',
        'S45': 'Empezamos con un fin del mundo que nunca llegó... y unas píldoras muy curiosas.',
        'S44': 'Ahora, dos islas vecinas que viven en días distintos.',
        'S42': 'El estafador que le dio su nombre a una estafa.',
        'S41': 'Cinco aviones que desaparecieron en el Triángulo de las Bermudas.',
        'S40': 'Ya en el podio: doce niños atrapados en una cueva inundada.',
        'S43': 'Casi en lo más alto: el soldado que salvó a setenta y cinco compañeros sin disparar.',
        'S59': 'Y la número uno, un misterio exclusivo que no verás en nuestros Shorts: la princesa que muchos creyeron viva.',
        'cierre': '¿Cuál te sorprendió más? Déjame el número en los comentarios, y suscríbete para descubrir algo nuevo cada día.'}),
    'L07': ('2027-01-09 18:00', ['S46', 'S48', 'S47', 'S50', 'S49', 'S51', 'S60'], {
        'intro': '¡Hola! Hoy te traigo siete historias reales increíbles, y la última es un misterio exclusivo de este vídeo. Quédate hasta el final.',
        'S46': 'Empezamos con una señal del espacio que nunca se repitió.',
        'S48': 'Ahora, el hombre que "vendió" el puente de Brooklyn.',
        'S47': 'Un corredor perdido nueve días en el Sáhara.',
        'S50': 'La aviadora que desapareció en pleno vuelo.',
        'S49': 'Ya en el podio: unos perros que salvaron a todo un pueblo.',
        'S51': 'Casi en lo más alto: tres días atrapado en un barco hundido.',
        'S60': 'Y la número uno, un misterio exclusivo que no verás en nuestros Shorts: el chico que apareció de la nada.',
        'cierre': '¿Cuál te sorprendió más? Déjame el número en los comentarios, y suscríbete para descubrir algo nuevo cada día.'}),
    'L08': ('2027-01-16 18:00', ['S56', 'S53', 'S55', 'S57', 'S54', 'S52', 'S61'], {
        'intro': '¡Hola! Hoy te traigo siete historias reales increíbles, y la última es exclusiva de este vídeo. Quédate hasta el final, porque es la número uno.',
        'S56': 'Empezamos desmontando un mito: la altura de Napoleón.',
        'S53': 'Ahora, unas piedras que se mueven solas en el desierto.',
        'S55': 'La mujer a la que le cayó un meteorito encima.',
        'S57': 'La guerra más corta de la historia.',
        'S54': 'Ya en el podio: el falsificador que engañó a un jefe nazi.',
        'S52': 'Casi en lo más alto: un ejército de tanques hinchables.',
        'S61': 'Y la número uno, una historia exclusiva que no verás en nuestros Shorts: setenta y dos días en la cordillera de los Andes.',
        'cierre': '¿Cuál te sorprendió más? Déjame el número en los comentarios, y suscríbete para descubrir algo nuevo cada día.'}),
}


def tabla(s):
    filas = []
    for i, e in enumerate(s['escenas'], 1):
        if e['tipo'] == 'clip': filas.append(f"| {i} | {e['desde']} | clip | {e['mov']} | {e['efecto']} | {e['d']} | |")
        else: filas.append(f"| {i} | {e['desde']} | capas | {e['mov']} | {e['efecto']} | Fondo: {e['f']} · Personaje: {e['p']} | |")
    return '\n'.join(filas)


if __name__ == '__main__':
    prompts = {}
    for s in S:
        nota = (f"> EXCLUSIVA del vídeo largo {s['exclusiva']} (no se publica como Short). Fondos en 16:9. Datos verificados: {s['datos']}" if s['exclusiva']
                else f"> MES 2 · estilo 3D · Short {s['tipo'].upper()}. Datos verificados: {s['datos']}")
        md = f"""# {s['titulo']}
id: {s['id']}
serie: {s['serie']}
estilo: vivo
publicar: {s['publicar']}
color: {s['color']}
lugar: {s['lugar']}
miniatura: {s['miniatura']}
portada: {s['miniatura']}
descripcion: {s['descripcion']} ¿Acaso lo sabías? 🕰️ Historias reales que no te enseñaron en el colegio.
hashtags: {s['hashtags']}
comentario: {s['comentario']}

{nota}

## Narración
{s['narr']}

## Escenas
| # | Desde la frase | Diseño | Movimiento | Efecto | Imagen (3D) | Notas |
|---|---|---|---|---|---|---|
{tabla(s)}
"""
        open(os.path.join(R, 'Guiones', s['f'] + '.md'), 'w', encoding='utf-8').write(md)
        esc = []
        for e in s['escenas']:
            if e['tipo'] == 'clip': esc.append({'clip_img': CLIPIMG.format(d=e['d'], oro=e['oro']), 'clip_mov': MOV.format(m=e['m'])})
            else: esc.append({'fondo': FONDO.format(d=e['f'], oro=e['oro']), 'pj': PJ.format(d=e['p'], oro=e['po'])})
        prompts[s['id']] = {'tipo': s['tipo'], 'formato_fondo': '16:9' if s['exclusiva'] else '9:16', 'escenas': esc, 'voz': s['narr']}
    json.dump(prompts, open(os.path.join(R, 'En proceso', 'mes2_prompts.json'), 'w'), ensure_ascii=False, indent=1)
    for lid, (pub, hist, frases) in LARGOS.items():
        assert set(frases) == set(hist) | {'intro', 'cierre'}, lid
        json.dump({'id': lid, 'titulo': '7 cosas que (seguro) no sabías', 'publicar': pub, 'historias': hist,
                   'voz': f'En proceso/{lid}/voz.mp3', 'frases': frases}, open(os.path.join(R, 'Largos', f'{lid}.json'), 'w'), ensure_ascii=False, indent=1)
    from collections import Counter
    tipos = Counter(s['tipo'] for s in S)
    imgs = sum(2 if e['tipo'] == 'capas' else 1 for s in S for e in s['escenas'])
    clips = sum(e['tipo'] == 'clip' for s in S for e in s['escenas'])
    recortes = sum(e['tipo'] == 'capas' for s in S for e in s['escenas'])
    coste = imgs * 63 + recortes * 30 + clips * 1454 + len(S) * 1000 + len(LARGOS) * (16 * 63 + 1400)
    print(dict(tipos), f'· {imgs} imágenes · {recortes} recortes · {clips} clips · ≈ {coste:,} créditos estimados'.replace(',', '.'))
