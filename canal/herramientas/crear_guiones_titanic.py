"""Crea los guiones del lanzamiento del Titanic (S01–S05 y L01). Uso: python3 herramientas/crear_guiones_titanic.py (desde canal/)"""
import os

D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'Guiones')
CAB = """# {titulo}
id: {id}
serie: TITANIC: LO QUE NO TE CONTARON
estilo: stopmotion
publicar: {publicar}
color: #3D8BFF
lugar: {lugar}
miniatura: {mini}
descripcion: {desc} ¿Acaso lo sabías? 🕰️ Historias reales que no te enseñaron en el colegio.
hashtags: #titanic #historia #sabiasque #curiosidades #acasolosabias #shorts
comentario: {com}

> {nota}

## Narración
{narr}

## Escenas
| # | Desde la frase | Diseño | Movimiento | Efecto | Imagen (plastilina) | Notas |
|---|---|---|---|---|---|---|
{tabla}
"""

G = [
    dict(id='S01', f='S01_titanic_jessop', titulo='Sobrevivió al TITANIC… y a sus dos barcos hermanos 😳', publicar='2026-12-17 19:00',
         lugar='OCÉANO ATLÁNTICO | 15 DE ABRIL DE 1912', mini='SOBREVIVIÓ A | 3 BARCOS',
         desc='Violet Jessop estuvo en el choque del Olympic, en el hundimiento del Titanic y en el del Britannic… y sobrevivió a los tres.',
         com='¿Tú te volverías a subir a un barco? 👇',
         nota='ESTRENO DEL CANAL. Datos: el Olympic chocó con el crucero HMS Hawke el 20/09/1911; el Titanic se hundió el 15/04/1912 (Jessop se salvó en el bote 16); el Britannic, convertido en barco hospital, se hundió el 21/11/1916 tras chocar con una mina.',
         narr="""[curious] ¿Sabías que una mujer sobrevivió al Titanic... y también a sus dos barcos hermanos? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Se llamaba Violet Jessop y trabajaba como camarera en barcos de lujo. En 1911 estaba a bordo del Olympic cuando chocó contra un buque de guerra. El barco no se hundió.
[tense] Un año después, en 1912, subió al Titanic. Y ya sabes cómo terminó... pero Violet logró salvarse en un bote salvavidas.
[amazed] Pero espera... porque aquí viene lo más loco. Durante la Primera Guerra Mundial se fue de enfermera al tercer hermano, el Britannic. En 1916 chocó con una mina... y también se hundió.
[serious] Violet saltó de su bote, se golpeó la cabeza... y sobrevivió otra vez.
[playful] ¿Tú te volverías a subir a un barco? [warm] Esto es... ¿Acaso lo sabías?""",
         escenas=[('1', '¿Sabías que', 'clip', 'in', 'niebla', 'Violet en la cubierta inclinada del Titanic de noche, luces doradas del barco; clip: el barco se inclina y ella se agarra a la baranda'),
                  ('2', 'Se llamaba Violet', 'capas', 'up', 'polvo', 'Fondo: pasillo de primera clase de un transatlántico de 1911 · Personaje: Violet joven con uniforme de camarera'),
                  ('3', 'chocó contra un buque', 'capas', 'out', 'temblor salpicaduras', 'Fondo: el Olympic y un buque de guerra chocando en el puerto · Personaje: Violet sorprendida agarrándose'),
                  ('4', 'subió al Titanic', 'capas', 'in', 'niebla', 'Fondo: el Titanic en el mar helado con un iceberg · Personaje: Violet en un bote salvavidas con una manta'),
                  ('5', 'Pero espera', 'capas', 'in_fast', 'polvo luz', 'Fondo: barco hospital blanco con cruces rojas · Personaje: Violet con uniforme de enfermera'),
                  ('6', 'chocó con una mina', 'clip', 'out', 'temblor salpicaduras', 'Explosión en el costado del barco hospital; clip: el agua entra y el barco se inclina'),
                  ('7', 'Violet saltó', 'capas', 'in', 'niebla', 'Fondo: mar con restos y botes · Personaje: Violet empapada pero viva, mirando al frente')]),
    dict(id='S02', f='S02_titanic_binoculares', titulo='El Titanic NO tenía binoculares… por una llave olvidada 🔑', publicar='2026-12-18 19:00',
         lugar='SOUTHAMPTON, INGLATERRA | ABRIL DE 1912', mini='UNA LLAVE | OLVIDADA',
         desc='Los vigías del Titanic buscaban icebergs a simple vista. Los binoculares estaban guardados… y la llave se fue con un oficial que bajó del barco.',
         com='¿Crees que con binoculares se habría salvado? 👇',
         nota='Datos: el oficial David Blair fue retirado de la tripulación justo antes del viaje y se llevó la llave del armario de los binoculares; el vigía Frederick Fleet declaró que con binoculares habrían visto antes el iceberg; la llave se subastó en 2007 por unas 90.000 libras.',
         narr="""[curious] ¿Sabías que los vigías del Titanic buscaban icebergs... sin binoculares? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Southampton, abril de 1912. Justo antes del viaje, cambian a un oficial llamado David Blair. Se va del barco... y sin darse cuenta se lleva en el bolsillo una pequeña llave.
[tense] Era la llave del armario donde estaban los binoculares de los vigías.
[serious] Así que la noche del 14 de abril, en el puesto más alto del barco, los vigías miraban el mar helado... a simple vista.
[amazed] Cuando vieron el iceberg, ya era demasiado tarde. Uno de ellos dijo después que con binoculares lo habrían visto antes.
[amazed] ¿Y la llave? Casi cien años después se vendió en una subasta... por unas noventa mil libras.
[playful] ¿Crees que con binoculares se habría salvado? [warm] Esto es... ¿Acaso lo sabías?""",
         escenas=[('1', '¿Sabías que', 'clip', 'in', 'niebla', 'Vigía en la cofa del Titanic de noche mirando la oscuridad helada; clip: su aliento se congela y entrecierra los ojos'),
                  ('2', 'Southampton', 'capas', 'up', 'polvo', 'Fondo: puerto de Southampton con el Titanic atracado · Personaje: oficial bajando por la pasarela con una maleta'),
                  ('3', 'Era la llave', 'capas', 'in_fast', 'polvo luz', 'Fondo: armario de madera cerrado con candado · Personaje: mano sosteniendo una pequeña llave dorada'),
                  ('4', 'Así que la noche', 'capas', 'in', 'niebla', 'Fondo: el mar helado de noche bajo las estrellas · Personaje: dos vigías tiritando en la cofa'),
                  ('5', 'Cuando vieron', 'clip', 'out', 'temblor', 'Un iceberg gigante aparece en la niebla delante del barco; clip: el vigía toca la campana con desesperación'),
                  ('6', 'Y la llave', 'capas', 'in', 'polvo luz', 'Fondo: sala de subastas · Personaje: subastador con el mazo levantado y la llave dorada en una vitrina')]),
    dict(id='S03', f='S03_titanic_bote1', titulo='El bote del Titanic que salió con 12 personas… y tenía sitio para 40 🚣', publicar='2026-12-19 12:00',
         lugar='OCÉANO ATLÁNTICO | 15 DE ABRIL DE 1912', mini='12 PERSONAS EN UN BOTE | PARA 40',
         desc='Mientras más de 1.500 personas morían, varios botes salvavidas del Titanic se alejaron casi vacíos. El bote 1 llevaba solo 12 personas.',
         com='¿Por qué crees que no volvieron a por más gente? 👇',
         nota='Datos: el bote 1 (capacidad 40) se arrió con 12 personas; el Titanic llevaba 20 botes (más de lo que exigía la ley de la época) con capacidad para unas 1.178 personas, de unas 2.224 a bordo; murieron más de 1.500.',
         narr="""[curious] ¿Sabías que uno de los botes del Titanic se fue con doce personas... cuando cabían cuarenta? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Esa noche había a bordo unas dos mil doscientas personas. Pero los botes salvavidas solo tenían sitio para unas mil ciento setenta.
[tense] Y lo peor: al principio nadie creía que el barco se iba a hundir. Mucha gente no quería subir a los botes, y algunos bajaron al agua medio vacíos.
[amazed] El bote número uno tenía capacidad para cuarenta personas... y se alejó con solo doce.
[serious] Más de mil quinientas personas murieron esa noche en el agua helada.
[amazed] Lo más increíble: el Titanic llevaba más botes de los que exigía la ley de su época. La ley estaba pensada para barcos mucho más pequeños.
[playful] ¿Por qué crees que no volvieron a por más gente? [warm] Esto es... ¿Acaso lo sabías?""",
         escenas=[('1', '¿Sabías que', 'clip', 'in', 'niebla', 'Bote salvavidas casi vacío alejándose del Titanic iluminado; clip: los remos se mueven, el barco inclinado al fondo'),
                  ('2', 'Esa noche', 'capas', 'up', 'polvo luz', 'Fondo: cubierta del Titanic con los botes colgados · Personaje: grupo de pasajeros con abrigos'),
                  ('3', 'Y lo peor', 'capas', 'in', 'niebla', 'Fondo: cubierta de noche · Personaje: pasajeros elegantes negándose a subir, uno se ríe'),
                  ('4', 'El bote número uno', 'capas', 'in_fast', 'niebla', 'Fondo: mar oscuro · Personaje: bote con pocas personas y muchos asientos vacíos'),
                  ('5', 'Más de mil quinientas', 'clip', 'out', 'niebla', 'El Titanic se hunde con las luces apagándose; clip: la popa se levanta lentamente'),
                  ('6', 'Lo más increíble', 'capas', 'in', 'polvo', 'Fondo: oficina de 1912 con libros de leyes · Personaje: funcionario leyendo un reglamento dorado')]),
    dict(id='S04', f='S04_titanic_ballard', titulo='Encontraron el TITANIC… durante una misión SECRETA 🕵️', publicar='2026-12-20 19:00',
         lugar='OCÉANO ATLÁNTICO NORTE | 1 DE SEPTIEMBRE DE 1985', mini='UNA MISIÓN | SECRETA',
         desc='En 1985 Robert Ballard encontró el Titanic. Pero su verdadera misión, pagada por la Marina de EE. UU., era otra… y fue secreta durante años.',
         com='¿Qué otros secretos crees que esconde el fondo del mar? 👇',
         nota='Datos: la Marina de EE. UU. financió la expedición de Ballard para inspeccionar los restos de los submarinos nucleares Thresher y Scorpion; con el tiempo restante buscó el Titanic, que encontró el 1 de septiembre de 1985 a unos 3.800 m; la misión se hizo pública en 2008.',
         narr="""[curious] ¿Sabías que el Titanic se encontró... durante una misión secreta militar? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Durante setenta y tres años nadie supo dónde estaba el Titanic. El explorador Robert Ballard soñaba con encontrarlo, pero no tenía dinero.
[tense] Entonces la Marina de Estados Unidos le hizo una oferta: le pagaba la expedición... si primero inspeccionaba en secreto los restos de dos submarinos nucleares hundidos.
[serious] Ballard aceptó. Terminó la misión secreta y le quedaron solo unos días para buscar el barco.
[amazed] Y el uno de septiembre de 1985, a casi cuatro kilómetros de profundidad, la cámara mostró una enorme caldera... Era el Titanic.
[amazed] Pero la verdadera misión se mantuvo en secreto durante más de veinte años.
[playful] ¿Qué otros secretos crees que esconde el fondo del mar? [warm] Esto es... ¿Acaso lo sabías?""",
         escenas=[('1', '¿Sabías que', 'clip', 'in', 'niebla', 'Proa del Titanic oxidada en el fondo del mar iluminada por un foco; clip: el foco recorre el casco y flotan partículas'),
                  ('2', 'Durante setenta', 'capas', 'up', 'polvo luz', 'Fondo: despacho con mapas del Atlántico · Personaje: explorador con barba mirando un mapa'),
                  ('3', 'Entonces la Marina', 'capas', 'in', 'polvo', 'Fondo: despacho militar · Personaje: almirante entregando una carpeta sellada'),
                  ('4', 'Ballard aceptó', 'capas', 'in_fast', 'niebla', 'Fondo: barco de investigación en el océano · Personaje: equipo bajando un robot submarino'),
                  ('5', 'Y el uno de septiembre', 'clip', 'out', 'temblor', 'Monitor en el barco mostrando una caldera gigante en el fondo; clip: el equipo salta de alegría'),
                  ('6', 'Pero la verdadera', 'capas', 'in', 'polvo luz', 'Fondo: archivo militar · Personaje: carpeta dorada abriéndose con documentos')]),
    dict(id='S05', f='S05_titanic_joughin', titulo='El panadero del Titanic que aguantó 2 HORAS en el agua helada 🥶', publicar='2026-12-21 19:00',
         lugar='OCÉANO ATLÁNTICO | 15 DE ABRIL DE 1912', mini='2 HORAS EN EL | AGUA HELADA',
         desc='Charles Joughin, el jefe de panaderos del Titanic, pasó unas dos horas en el agua helada y sobrevivió. Él decía que fue gracias al whisky.',
         com='¿Crees que el whisky le salvó o fue pura suerte? 👇',
         nota='Datos: Joughin, jefe de panadería, declaró que bebió whisky, lanzó sillas al agua para que flotaran y se quedó en la popa hasta el final; estuvo unas dos horas en el agua hasta ser rescatado. Los médicos dicen que el alcohol no protege del frío: decirlo así.',
         narr="""[curious] ¿Sabías que el panadero del Titanic aguantó unas dos horas en el agua helada... y sobrevivió? [playful] ¿Acaso lo sabías? [confident] Pues si no lo sabías... ahora te lo cuento.
[serious] Se llamaba Charles Joughin y era el jefe de panaderos. Cuando el barco empezó a hundirse, ayudó a subir gente a los botes.
[tense] Después, según contó, bajó a su camarote... y se tomó un buen trago de whisky.
[amazed] Luego empezó a lanzar sillas por la borda para que la gente tuviera algo a lo que agarrarse. Y se quedó en la popa hasta el último momento.
[serious] Cuando el barco desapareció, Joughin quedó flotando en un agua a menos de cero grados... durante unas dos horas, hasta que lo rescataron.
[amazed] Él siempre dijo que el whisky le salvó. Pero ojo: los médicos dicen que el alcohol no protege del frío. Fue pura suerte... y mucha resistencia.
[playful] ¿Tú qué crees que le salvó? [warm] Esto es... ¿Acaso lo sabías?""",
         escenas=[('1', '¿Sabías que', 'clip', 'in', 'niebla', 'Hombre flotando en el mar helado de noche con el aliento congelado; clip: tirita y mira al cielo estrellado'),
                  ('2', 'Se llamaba Charles', 'capas', 'up', 'polvo luz', 'Fondo: panadería del barco con hornos encendidos · Personaje: panadero robusto con gorro blanco'),
                  ('3', 'Después, según contó', 'capas', 'in', 'luz', 'Fondo: camarote pequeño de tripulación · Personaje: panadero bebiendo de una petaca dorada'),
                  ('4', 'Luego empezó', 'clip', 'out', 'temblor', 'Cubierta inclinada; clip: el panadero lanza sillas de madera por la borda'),
                  ('5', 'Cuando el barco', 'capas', 'in', 'niebla', 'Fondo: mar helado lleno de restos · Personaje: panadero flotando agarrado a una silla'),
                  ('6', 'Él siempre dijo', 'capas', 'in_fast', 'polvo', 'Fondo: sala de hospital · Personaje: médico negando con el dedo mientras sostiene una botella')]),
]

for g in G:
    tabla = '\n'.join('| ' + ' | '.join(e[:5]) + ' | ' + e[5] + ' | |' for e in g['escenas'])
    datos = {k: v for k, v in g.items() if k not in ('escenas', 'f')}
    with open(os.path.join(D, g['f'] + '.md'), 'w', encoding='utf-8') as fh:
        fh.write(CAB.format(tabla=tabla, **datos))

with open(os.path.join(D, 'L01_titanic.md'), 'w', encoding='utf-8') as fh:
    fh.write("""# 5 SECRETOS del TITANIC que casi nadie conoce
id: L01
tipo: vídeo largo (≈5 min, horizontal 16:9)
serie: TITANIC: LO QUE NO TE CONTARON
publicar: 2026-12-19 18:00
miniatura: 5 SECRETOS DEL | TITANIC

> Vídeo de lanzamiento del canal. Se monta con las 5 historias de los Shorts S01–S05 (mismas imágenes y voz) + intro y cierre propios.
> Pendiente técnico (sin coste): adaptar la fábrica al formato horizontal 16:9 para los vídeos largos.

## Estructura
| Capítulo | Contenido |
|---|---|
| 0:00 | Intro: "Todo el mundo cree conocer la historia del Titanic… pero hay cosas que casi nadie te contó. ¿Acaso lo sabías?" |
| 0:20 | 1. Los binoculares que nadie pudo usar (S02) |
| 1:15 | 2. El bote que salió casi vacío (S03) |
| 2:10 | 3. El panadero que aguantó 2 horas en el agua helada (S05) |
| 3:05 | 4. La mujer que sobrevivió a 3 barcos (S01) |
| 4:00 | 5. La misión secreta que encontró el Titanic (S04) |
| 4:55 | Cierre: "¿Cuál te sorprendió más? Te leo en los comentarios… Esto es ¿Acaso lo sabías?" |

## Descripción
El Titanic es el naufragio más famoso de la historia… pero detrás hay historias reales que casi nadie conoce: una llave olvidada, un bote casi vacío, un panadero que desafió al frío, una mujer que sobrevivió a tres barcos y una misión militar secreta. ¿Acaso lo sabías? 🕰️
#titanic #historia #curiosidades #sabiasque #acasolosabias
""")
print('ok')
