"""Semana 1 (19–25 nov 2026): crea los guiones y el archivo de prompts para ElevenLabs.
Uso (desde canal/): python3 herramientas/semana1.py"""
import json, os

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLAY = ("Claymation stop-motion style: handmade plasticine characters with visible fingerprints and clay texture, miniature handcrafted set made of clay, "
        "cardboard and fabric, soft warm studio lighting, shallow depth of field, slightly exaggerated proportions, original character design. "
        "The key element is rendered in vivid golden yellow: {oro}. No text, no letters, no logos.")
FONDO = "Empty background plate, no people: {d}. " + CLAY
PJ = "Character cut-out on a plain flat light grey background, nothing else: {d}, shown from the waist up in the lower two thirds of the frame. " + CLAY
CLIPIMG = "{d}. " + CLAY
MOV = "Stop-motion claymation animation: {m}. Keep the handmade plasticine look and miniature set."

S = []

S.append(dict(
    id='S01', f='S01_titanic_jessop', publicar='2026-11-19 19:00', serie='ESTRENO', color='#3D8BFF',
    titulo='Sobrevivió al TITANIC… y a sus dos barcos hermanos 😳', lugar='OCÉANO ATLÁNTICO | 15 DE ABRIL DE 1912',
    miniatura='SOBREVIVIÓ A | 3 BARCOS', hashtags='#titanic #historia #sabiasque #curiosidades #acasolosabias #shorts',
    descripcion='Violet Jessop estuvo en el choque del Olympic, en el hundimiento del Titanic y en el del Britannic… y sobrevivió a los tres.',
    comentario='¿Tú te volverías a subir a un barco? 👇',
    datos='El Olympic chocó con el crucero HMS Hawke el 20/09/1911; el Titanic se hundió el 15/04/1912 (Jessop se salvó en el bote 16); el Britannic, barco hospital, se hundió el 21/11/1916 tras chocar con una mina.',
    narr="""[curious] ¿Sabías que una mujer sobrevivió al Titanic... y también a sus dos barcos hermanos? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Se llamaba Violet Jessop y trabajaba como camarera en barcos de lujo. En 1911 estaba a bordo del Olympic cuando chocó contra un buque de guerra. El barco no se hundió.
[tense] Un año después, en 1912, subió al Titanic. Y ya sabes cómo terminó... pero Violet logró salvarse en un bote salvavidas.
[amazed] Pero espera... porque aquí viene lo más loco. Durante la Primera Guerra Mundial se fue de enfermera al tercer hermano, el Britannic. En 1916 chocó con una mina... y también se hundió.
[serious] Violet saltó de su bote, se golpeó la cabeza... y sobrevivió otra vez.
[playful] ¿Tú te volverías a subir a un barco? [warm] Esto es... ¿Acaso lo sabías?""",
    clip=dict(desde='¿Sabías que', efecto='niebla', d='A young stewardess in a 1912 uniform gripping the railing on the tilted deck of a giant four-funnel ocean liner at night, icy black sea, lifeboats hanging', oro="the ship's glowing lights",
              m='the deck slowly tilts, she grips the railing tighter, the lifeboats sway, her breath steams in the cold, the lights flicker'),
    capas=[dict(desde='Se llamaba Violet', mov='up', efecto='polvo luz', f='an elegant first-class corridor of a 1911 ocean liner with wood panels', oro='the brass wall lamps',
                p='a young stewardess in a 1911 white apron uniform and cap carrying a silver tray, kind confident smile', po='the silver tray'),
           dict(desde='chocó contra un buque', mov='out', efecto='temblor', f='a harbor where a huge ocean liner and a grey warship collide, splashing water and a dented hull', oro='flying sparks',
                p='the same young stewardess clinging to a doorframe with a shocked face', po='her brass name badge'),
           dict(desde='subió al Titanic', mov='in', efecto='niebla', f='an icy night sea with a giant iceberg and a sinking four-funnel ocean liner far away', oro="the ship's lights",
                p='the same young woman wrapped in a blanket sitting in a small wooden lifeboat, shivering', po='a small lantern in her hands'),
           dict(desde='Pero espera', mov='in_fast', efecto='polvo', f='a white hospital ship with red crosses on its hull sailing at sea in 1916', oro='the sunlight on the water',
                p='the same woman a few years older in a 1916 nurse uniform with a red cross armband, determined', po='her nurse badge'),
           dict(desde='chocó con una mina', mov='out', efecto='temblor salpicaduras', f='an explosion on the side of a white hospital ship with water bursting up', oro='the fiery explosion',
                p='the same nurse holding onto a railing with an alarmed face', po='her nurse badge'),
           dict(desde='Violet saltó', mov='in', efecto='niebla', f='an open sea with floating debris and small lifeboats in the morning light', oro='the rising sun',
                p='the same nurse soaking wet with a bandage on her head and a relieved half-smile', po='the rising sun reflected in her eyes')]))

S.append(dict(
    id='S07', f='S07_medusa_inmortal', publicar='2026-11-20 19:00', serie='ANIMALES EXTREMOS', color='#9BD34B',
    titulo='La medusa que puede volver a ser JOVEN 🪼', lugar='MAR MEDITERRÁNEO | DESCUBIERTA EN LOS AÑOS 80',
    miniatura='LA MEDUSA | INMORTAL', hashtags='#animales #ciencia #sabiasque #curiosidades #acasolosabias #shorts',
    descripcion='La Turritopsis dohrnii, una medusa diminuta, puede volver a su etapa de pólipo cuando envejece o se lastima… y empezar su vida de nuevo.',
    comentario='Si pudieras volver a ser joven, ¿lo harías? 👇',
    datos='Turritopsis dohrnii mide unos 4–5 mm; ante estrés, daño o vejez puede transformarse de nuevo en pólipo (descrito a finales de los 80 y en los 90). Puede morir comida por otros animales o por enfermedad.',
    narr="""[curious] ¿Sabías que existe un animal que, cuando envejece... puede volver a ser joven? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Se llama Turritopsis dohrnii y es una medusa diminuta: mide menos que la uña de tu dedo meñique.
[amazed] Cuando está herida, enferma o se hace vieja, en lugar de morir hace algo increíble: vuelve atrás. Se transforma otra vez en pólipo, que es como su forma de bebé.
[tense] Y desde ahí empieza a crecer de nuevo... como si apretara el botón de reiniciar su vida.
[amazed] Por eso los científicos la llaman la medusa inmortal. Pero espera... porque no es invencible: un pez puede comérsela, o una enfermedad puede acabar con ella.
[playful] Si tú pudieras volver a ser joven, ¿lo harías? Te leo en los comentarios. [warm] Esto es... ¿Acaso lo sabías?""",
    clip=dict(desde='¿Sabías que', efecto='polvo', d='A tiny translucent jellyfish with a glowing red-orange core drifting in the deep blue sea, plankton particles floating', oro='the glowing jellyfish',
              m='the jellyfish pulses and drifts upward, its tentacles wave softly, plankton particles float through light rays'),
    capas=[dict(desde='Se llama', mov='up', efecto='polvo', f='an underwater Mediterranean reef with sun rays coming from the surface', oro='the sun rays',
                p='a tiny translucent jellyfish next to a giant human fingertip for scale', po='the jellyfish glow'),
           dict(desde='Cuando está herida', mov='in', efecto='niebla', f='the dim deep sea with dark rocks', oro='a faint glow on the rocks',
                p='an old tired wrinkled jellyfish with droopy tentacles and sleepy eyes', po='its dim glowing core'),
           dict(desde='Se transforma', mov='in_fast', efecto='polvo luz', f='a rocky sea floor with small shells', oro='a sparkling glow',
                p='a tiny new polyp stalk sprouting from a rock like a baby plant, glowing with energy', po='the glowing polyp'),
           dict(desde='Por eso los científicos', mov='in', efecto='polvo', f='a marine biology lab with aquariums and microscopes', oro='a glowing aquarium',
                p='an amazed scientist in a lab coat holding a magnifying glass', po='the magnifying glass'),
           dict(desde='Pero espera', mov='out', efecto='salpicaduras derecha', f='the open blue sea', oro='bubbles catching the light',
                p='a hungry fish with its mouth wide open chasing something', po='its shiny scales')]))

S.append(dict(
    id='S06', f='S06_onoda', publicar='2026-11-21 19:00', serie='HISTORIAS QUE PARECEN MENTIRA', color='#FFC93C',
    titulo='Peleó 29 AÑOS en una guerra que ya había terminado 😳', lugar='ISLA DE LUBANG, FILIPINAS | DICIEMBRE DE 1944',
    miniatura='PELEÓ 29 AÑOS EN UNA | GUERRA', hashtags='#historia #sabiasque #curiosidades #acasolosabias #shorts',
    descripcion='En 1945 terminó la Segunda Guerra Mundial… pero Hiroo Onoda siguió escondido en la selva de Filipinas hasta 1974. ¿Por qué nadie pudo convencerlo?',
    comentario='¿Tú habrías creído los panfletos? 👇',
    datos='Onoda llegó a Lubang en dic. 1944 con orden de no rendirse; desde 1945 se lanzaron panfletos que tomó por propaganda; asaltó granjas y se enfrentó a habitantes (hubo víctimas); feb. 1974 lo encontró el viajero Norio Suzuki; mar. 1974 su antiguo superior, el mayor Taniguchi, le relevó del servicio.',
    narr="""[curious] ¿Sabías que un soldado siguió peleando una guerra durante veintinueve años... porque nadie le dijo que había terminado? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Isla de Lubang, Filipinas. Diciembre de 1944. Un joven teniente japonés llamado Hiroo Onoda recibe una orden muy clara: nunca rendirse.
[tense] En 1945 la guerra termina. Le lanzan panfletos para avisarle... [whispering] pero él cree que son una trampa del enemigo.
[serious] Pasan los años. Diez... veinte... Onoda sigue escondido en la selva, asaltando granjas y enfrentándose a los habitantes de la isla, convencido de que la guerra continúa.
[amazed] En 1974, un joven viajero japonés por fin lo encuentra. Pero Onoda solo se rendirá si se lo ordena su comandante. Y así fue: su antiguo jefe tuvo que viajar hasta la isla para decirle que la guerra había terminado... hacía casi treinta años.
[playful] ¿Tú habrías creído los panfletos? Te leo en los comentarios. [warm] Esto es... ¿Acaso lo sabías?""",
    clip=dict(desde='¿Sabías que', efecto='lluvia', d='A gaunt soldier in a ragged 1940s uniform and cap aiming an old rifle out of dense tropical jungle in the rain', oro='a beam of sunlight across his eyes',
              m='heavy rain falls, the jungle leaves sway, the soldier slowly narrows his eyes and shifts his rifle'),
    capas=[dict(desde='Isla de Lubang', mov='up', efecto='polvo', f='a tropical island beach at dusk in 1944 with palm trees and a small wooden boat', oro='the setting sun',
                p='a young Japanese army lieutenant in a clean 1944 uniform standing at attention, determined, holding folded orders', po='the folded paper of orders'),
           dict(desde='la guerra termina', mov='out', efecto='polvo', f='a jungle canopy with an old propeller plane dropping hundreds of paper leaflets', oro='the falling leaflets',
                p='the same soldier looking up at the sky with suspicion', po='a leaflet stuck on his shoulder'),
           dict(desde='pero él cree', mov='in_fast', efecto='polvo nervio', f='dense jungle undergrowth with giant leaves', oro='a sunbeam through the leaves',
                p='the same soldier crouching and crumpling a leaflet with a sneer', po='the crumpled leaflet'),
           dict(desde='Pasan los años', mov='in', efecto='lluvia niebla', f='a dark jungle at night in heavy rain, a thick tree trunk covered with dozens of carved tally marks', oro='the carved tally marks',
                p='the same soldier years older, thin and weathered, rain-soaked patched uniform, holding his rifle and looking over his shoulder', po='raindrops catching the light'),
           dict(desde='un joven viajero', mov='in', efecto='brasas luz derecha', f='a jungle clearing at night with a small campfire and a backpack on the ground', oro='the campfire',
                p='a young 1970s Japanese backpacker raising his hands with a surprised face', po='the firelight on his face'),
           dict(desde='Y así fue', mov='out', efecto='niebla', f='a quiet misty jungle clearing in soft morning light', oro='the morning light',
                p='the old soldier in a faded patched uniform saluting with tears in his eyes', po='the paper order in his hand')]))

S.append(dict(
    id='S08', f='S08_mary_celeste', publicar='2026-11-22 19:00', serie='MISTERIOS SIN RESOLVER', color='#3FB27F',
    titulo='Encontraron un barco navegando SOLO… sin nadie a bordo 👻', lugar='OCÉANO ATLÁNTICO | DICIEMBRE DE 1872',
    miniatura='UN BARCO | FANTASMA', hashtags='#misterio #historia #sabiasque #curiosidades #acasolosabias #shorts',
    descripcion='En 1872 hallaron el Mary Celeste navegando a la deriva, con comida, agua y pertenencias intactas… pero sin ninguna de las 10 personas que viajaban en él.',
    comentario='¿Tú qué crees que pasó? 👇',
    datos='El bergantín Mary Celeste fue hallado por el Dei Gratia el 4/12/1872 entre las Azores y Portugal; a bordo iban el capitán Benjamin Briggs, su esposa, su hija de 2 años y 7 tripulantes; había provisiones para meses y la carga (más de 1.700 barriles de alcohol) casi intacta; faltaba el bote salvavidas. Nunca se resolvió.',
    narr="""[curious] ¿Sabías que en 1872 encontraron un barco navegando solo... sin nadie a bordo? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Océano Atlántico, diciembre de 1872. Los marineros de otro barco ven un velero que avanza sin rumbo. Se llama Mary Celeste.
[tense] Suben a bordo... y no hay nadie. Ni el capitán, ni su esposa, ni su hija de dos años, ni los siete tripulantes.
[amazed] Lo extraño: había comida y agua para meses, las pertenencias seguían en su sitio y la carga, cientos de barriles de alcohol, estaba casi intacta. Solo faltaba el bote salvavidas.
[serious] Nunca se supo qué pasó. Una teoría dice que temieron que el alcohol explotara y huyeron al bote... que jamás volvió a aparecer.
[playful] ¿Tú qué crees que pasó? Te leo en los comentarios. [warm] Esto es... ¿Acaso lo sabías?""",
    clip=dict(desde='¿Sabías que', efecto='niebla', d='An empty old sailing ship drifting alone on a grey stormy Atlantic, torn sails, nobody on deck', oro='a lantern swinging on deck',
              m='the torn sails flap in the wind, the ship rolls on the waves, the lantern swings, fog drifts across'),
    capas=[dict(desde='Los marineros', mov='up', efecto='niebla', f='a grey sea with a distant drifting sailing ship', oro='a gap of sunlight in the clouds',
                p='an 1870s sailor with a striped shirt looking through a spyglass and pointing, surprised', po='the brass spyglass'),
           dict(desde='Suben a bordo', mov='in', efecto='niebla nervio', f='the empty deck of an old sailing ship with coiled ropes and an open hatch', oro='a hanging lantern',
                p='two cautious 1870s sailors stepping forward, one holding a lantern', po='the lantern'),
           dict(desde='Lo extraño', mov='in_fast', efecto='polvo luz', f="a ship captain's cabin with a set table, plates, a sewing machine and personal belongings", oro='an oil lamp on the table',
                p='a sailor holding up an oil lamp with an astonished face', po='the oil lamp'),
           dict(desde='Solo faltaba', mov='out', efecto='polvo', f="the side of a ship's deck with empty ropes hanging where a lifeboat used to be", oro='the dangling ropes',
                p='a worried sailor pointing at something missing', po='his pointing hand catching the light'),
           dict(desde='Nunca se supo', mov='in', efecto='niebla', f='a misty sea with a tiny rowing boat disappearing into the fog', oro='a lantern on the tiny boat',
                p='a bearded 1870s sea captain with a worried face holding a compass', po='the compass')]))

S.append(dict(
    id='S09', f='S09_yamaguchi', publicar='2026-11-23 19:00', serie='HISTORIAS QUE PARECEN MENTIRA', color='#FFC93C',
    titulo='Sobrevivió a las DOS bombas atómicas 😳', lugar='HIROSHIMA, JAPÓN | 6 DE AGOSTO DE 1945',
    miniatura='SOBREVIVIÓ A | DOS BOMBAS', hashtags='#historia #sabiasque #curiosidades #acasolosabias #shorts',
    descripcion='Tsutomu Yamaguchi estaba en Hiroshima el 6 de agosto de 1945… y en Nagasaki el 9 de agosto. Sobrevivió a las dos bombas y dedicó su vida a pedir la paz.',
    comentario='¿Fue el hombre más afortunado o el más desafortunado? 👇',
    datos='Yamaguchi, ingeniero, estaba en Hiroshima por trabajo el 6/08/1945 (a unos 3 km de la explosión); volvió a Nagasaki y el 9/08 estaba en su oficina cuando estalló la segunda bomba; reconocido oficialmente como doble superviviente en 2009; murió en 2010 a los 93 años. Tono respetuoso, sin heridas explícitas.',
    narr="""[curious] ¿Sabías que un hombre sobrevivió a la bomba atómica de Hiroshima... y tres días después, a la de Nagasaki? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Se llamaba Tsutomu Yamaguchi y era ingeniero. En agosto de 1945 estaba en Hiroshima por un viaje de trabajo.
[tense] La mañana del seis de agosto, el cielo se volvió blanco. Yamaguchi sufrió quemaduras graves... pero sobrevivió.
[serious] Poco después tomó un tren de regreso a su ciudad: Nagasaki. Y el nueve de agosto, vendado, volvió a la oficina.
[amazed] Le estaba contando a su jefe lo que había visto... cuando otra luz blanca entró por la ventana.
[serious] Sobrevivió otra vez. Vivió hasta los noventa y tres años y dedicó su vida a pedir que nunca más se usaran armas nucleares.
[playful] ¿Fue el hombre más afortunado... o el más desafortunado? [warm] Esto es... ¿Acaso lo sabías?""",
    clip=dict(desde='¿Sabías que', efecto='polvo', d='A man in 1940s office clothes standing in a street, seen from behind, looking at a blinding white flash on the far horizon', oro='the glow of the distant flash',
              m='the light on the horizon grows, a strong wind blows his clothes and dust across the street'),
    capas=[dict(desde='Se llamaba', mov='up', efecto='polvo', f='a quiet street of a Japanese city in 1945 with wooden houses on a summer morning', oro='the morning sun',
                p='a Japanese engineer in his late twenties with round glasses, a neat suit and a briefcase', po='his briefcase handle'),
           dict(desde='La mañana', mov='out', efecto='polvo', f='a white glowing sky over a city skyline covered in dust', oro='the white glowing sky',
                p='the same man in torn clothes with bandaged arms, standing in shock', po='the light on his glasses'),
           dict(desde='Poco después', mov='in', efecto='niebla', f='a crowded 1945 railway platform with a steam train', oro="the train's headlamp",
                p='the same man with a bandaged arm holding a train ticket, exhausted', po='the train ticket'),
           dict(desde='Le estaba contando', mov='in_fast', efecto='luz temblor', f='a 1940s office with desks and a big window', oro='the bright light through the window',
                p='the same bandaged man talking and gesturing with his hands, worried', po='the light on his face'),
           dict(desde='Sobrevivió otra vez', mov='in', efecto='polvo', f='a peaceful Japanese garden with a small pond and folded paper cranes', oro='a paper crane',
                p='an elderly Japanese man with a serene smile and a walking cane', po='a paper crane in his hand')]))

S.append(dict(
    id='S10', f='S10_huesos', publicar='2026-11-24 19:00', serie='TU CUERPO ES INCREÍBLE', color='#3D8BFF',
    titulo='Naciste con casi 100 HUESOS más que ahora 🦴', lugar='',
    miniatura='300 | HUESOS', hashtags='#cuerpohumano #ciencia #sabiasque #curiosidades #acasolosabias #shorts',
    descripcion='Un bebé nace con unos 300 huesos y partes de cartílago; un adulto tiene 206. No desaparecen: se van uniendo mientras creces.',
    comentario='¿Cuántos huesos creías que tenías? 👇',
    datos='Recién nacido: unos 270–300 huesos y piezas cartilaginosas; adulto: 206. Se fusionan con el crecimiento (cráneo con fontanelas; algunas fusiones terminan pasados los 20–25 años).',
    narr="""[curious] ¿Sabías que cuando naciste tenías casi cien huesos más que ahora? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Un bebé nace con unos trescientos huesos y partes de cartílago. Un adulto tiene solo doscientos seis.
[amazed] ¿Y dónde se van los demás? No desaparecen: se van uniendo, como piezas de un rompecabezas, mientras creces.
[tense] El cráneo, por ejemplo, empieza dividido en varias placas, con zonas blandas entre ellas para poder nacer. Con el tiempo se sueldan.
[amazed] Y algunos huesos terminan de unirse... ¡pasados los veinte años!
[serious] O sea: tu esqueleto ha estado construyéndose durante toda tu vida.
[playful] ¿Cuántos huesos creías que tenías? Te leo en los comentarios. [warm] Esto es... ¿Acaso lo sabías?""",
    clip=dict(desde='¿Sabías que', efecto='polvo luz', d='A sleeping newborn baby in a crib with a glowing x-ray view showing a tiny skeleton inside, cozy nursery at night', oro='the glowing skeleton',
              m='the baby breathes and stretches its little arms, the glowing skeleton pulses softly, a mobile turns above the crib'),
    capas=[dict(desde='Un bebé nace', mov='up', efecto='polvo', f='a cozy hospital nursery with small cribs and soft light', oro='a warm lamp',
                p='a newborn baby wrapped in a blanket, yawning', po='a tiny bracelet on its wrist'),
           dict(desde='Y dónde se van', mov='in', efecto='polvo', f='a wooden table with scattered puzzle pieces', oro='the puzzle pieces',
                p='a curious young girl putting together puzzle pieces shaped like bones', po='the bone-shaped puzzle pieces'),
           dict(desde='El cráneo', mov='in_fast', efecto='polvo luz', f="a doctor's office with anatomy posters on the wall", oro='the anatomy poster frame',
                p='a friendly doctor holding a model of a baby skull divided into plates', po='the skull model'),
           dict(desde='Y algunos huesos', mov='out', efecto='polvo derecha', f='a sunny university campus with trees', oro='the sunlight',
                p='a young adult stretching happily with a backpack', po='his backpack zipper'),
           dict(desde='O sea', mov='in', efecto='polvo', f='a miniature construction site with scaffolding and cranes', oro='the construction lights',
                p='a friendly skeleton wearing a hard hat holding a wrench, building itself', po='the hard hat')]))

S.append(dict(
    id='S11', f='S11_dyatlov', publicar='2026-11-25 19:00', serie='MISTERIOS SIN RESOLVER', color='#3FB27F',
    titulo='9 excursionistas HUYERON de su tienda en plena noche helada 🏔️', lugar='MONTES URALES | FEBRERO DE 1959',
    miniatura='HUYERON DE | SU TIENDA', hashtags='#misterio #historia #sabiasque #curiosidades #acasolosabias #shorts',
    descripcion='En 1959, nueve excursionistas soviéticos cortaron su tienda desde dentro y huyeron a la nieve. Durante décadas nadie supo por qué… hasta que la ciencia propuso una explicación.',
    comentario='¿Tú qué crees que pasó? 👇',
    datos='Paso Diatlov, Urales, feb. 1959: 9 excursionistas liderados por Igor Diatlov; tienda cortada desde dentro; varios salieron sin calzado con temperaturas de unos −25 a −30 °C; ninguno sobrevivió; la investigación soviética habló de una "fuerza natural irresistible"; en 2020 la fiscalía rusa y en 2021 un estudio científico (Gaume y Puzrin) apoyaron una pequeña avalancha de placa. Tono respetuoso.',
    narr="""[curious] ¿Sabías que nueve excursionistas huyeron de su tienda en plena noche helada... y durante décadas nadie supo por qué? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Montes Urales, febrero de 1959. Un grupo de nueve jóvenes excursionistas, guiados por Igor Diatlov, acampa en la ladera de una montaña.
[tense] Esa noche, algo los hizo salir corriendo. Cortaron la tienda desde dentro... y salieron a la nieve, varios sin botas, a casi treinta grados bajo cero.
[serious] Semanas después los encontraron. Ninguno sobrevivió.
[amazed] Durante sesenta años hubo de todo: teorías de pruebas militares, de animales... hasta de extraterrestres.
[serious] Pero espera... estudios recientes apuntan a algo más simple: una pequeña avalancha de nieve que los obligó a huir en la oscuridad.
[playful] ¿Tú qué crees que pasó? [warm] Esto es... ¿Acaso lo sabías?""",
    clip=dict(desde='¿Sabías que', efecto='niebla', d='A torn tent on a snowy mountain slope at night under the stars, snow blowing', oro='a lantern glowing inside the tent',
              m='the wind whips the torn tent fabric, snow blows across the slope, the lantern flickers'),
    capas=[dict(desde='Montes Urales', mov='up', efecto='polvo', f='a snowy mountain slope with a pine forest below at dusk and a small camp', oro='the last sunlight on the peaks',
                p='a group of young 1950s hikers with backpacks and wool hats smiling', po='a lantern one of them holds'),
           dict(desde='Esa noche', mov='in_fast', efecto='niebla nervio', f='a tent cut open from the inside on a snowy slope at night', oro='a lantern lying in the snow',
                p='a frightened young hiker in a wool sweater running, without boots', po='the moonlight on his face'),
           dict(desde='Semanas después', mov='in', efecto='niebla', f='a snowy forest with many footprints in the snow', oro='a lantern hanging from a branch',
                p='a 1959 rescuer in a fur hat and heavy coat with a grim face', po='his lantern'),
           dict(desde='Durante sesenta años', mov='out', efecto='polvo luz', f='a dark office full of files, maps and newspaper clippings', oro='a desk lamp',
                p='a puzzled investigator with a pipe holding a thick folder', po='the folder'),
           dict(desde='Pero espera', mov='in', efecto='niebla derecha', f='a snowy mountain slope under the moon with a slab of snow sliding down', oro='the moonlight on the snow',
                p='a scientist in a modern parka holding a tablet and explaining', po='the glowing tablet')]))


def tabla(s):
    filas = [f"| 1 | {s['clip']['desde']} | clip | in | {s['clip']['efecto']} | {s['clip']['d']} | |"]
    for i, c in enumerate(s['capas'], 2):
        filas.append(f"| {i} | {c['desde']} | capas | {c['mov']} | {c['efecto']} | Fondo: {c['f']} · Personaje: {c['p']} | |")
    return '\n'.join(filas)


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
json.dump(prompts, open(os.path.join(R, 'En proceso', 'semana1_prompts.json'), 'w'), ensure_ascii=False, indent=1)
print({k: len(v['capas']) for k, v in prompts.items()}, 'capas totales', sum(len(v['capas']) for v in prompts.values()))
