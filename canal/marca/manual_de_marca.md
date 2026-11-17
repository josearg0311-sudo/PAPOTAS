# Manual de marca — "¿Acaso lo sabías?"

Objetivo: que cualquiera que vea 1 segundo de un Short, un vídeo o una miniatura piense **"esto es de ¿Acaso lo sabías?"**.

## Las 8 firmas del canal

| # | Firma | Qué es | Dónde |
|---|---|---|---|
| 1 | **Stop-motion de plastilina** | Personajes y maquetas que parecen hechos a mano (plastilina, cartón, tela). Movimiento "a pasos" de stop-motion: gancho y clímax con **clips animados por IA**; el resto en **capas** (fondo-maqueta + personaje de plastilina recortado que entra, respira y se balancea). El objeto clave de la historia, en **dorado** | Todas las escenas |
| 2 | **El sello "¿?"** | Sello dorado circular con "¿?" y el texto "¿ACASO LO SABÍAS?" alrededor, que golpea la pantalla con la frase de marca | Segundos 5–9 de cada Short, intro de los largos, esquina de las miniaturas |
| 3 | **El salto por la interrogación** | Un "?" dorado gigante crece hasta llenar la pantalla y nos lleva a la historia | Tras "…ahora te lo cuento" |
| 4 | **Rótulo de lugar y fecha** | Cinta negra con barra dorada, letras de máquina de escribir: "BOSTON, EE. UU. / 15 DE ENERO DE 1919" | Inicio de cada historia |
| 5 | **Subtítulos en cinta** | Cinta negra ligeramente inclinada con subrayado dorado; la palabra que se dice, en dorado | Todo el vídeo |
| 6 | **Transición de mancha de tinta** | La escena nueva aparece dentro de una mancha de tinta que se expande | Cambios de escena |
| 7 | **Marco de viñeta** | Borde negro con filo crema, textura de semitono y grano de papel | Todo el vídeo |
| 8 | **Logo sonoro** | Tres notas de campana ascendentes + golpe de sello; clics de máquina de escribir en el rótulo | Sello, cierre |

## Colores
| Nombre | Hex | Uso |
|---|---|---|
| Oro "¿Acaso?" | `#FFC93C` | Sello, palabra activa, interrogación, palabra clave de miniaturas |
| Tinta | `#0D0C0B` | Fondos, cintas, marcos |
| Crema papel | `#F3E9D2` | Textos, filo del marco |
| Color de serie | (ver abajo) | Solo la línea bajo la etiqueta de serie |

Colores de serie: Historias que parecen mentira `#FFC93C` · Misterios `#3FB27F` · Desastres `#E0483B` · Crímenes `#8E5BD9` · Cuerpo `#3D8BFF` · Animales `#9BD34B` · El origen de… `#FF8A3D` · Lugares prohibidos `#9AA3AD` · Detrás del juego `#2BD4E0` · ¿Qué pasaría si…? `#F3E9D2`.

## Tipografía
Montserrat 900 (titulares, subtítulos, sello) y 800 (textos secundarios). Siempre en MAYÚSCULAS en pantalla.

## Frases fijas del narrador
- Apertura: **"¿Sabías que…?"** (el dato en una frase)
- Marca: **"¿Acaso lo sabías? Pues si no lo sabías… ahora te lo cuento."**
- Giro a mitad: **"Pero espera… porque aquí viene lo más loco."**
- Cierre: pregunta concreta + **"Esto es… ¿Acaso lo sabías?"**
- Siempre la misma voz (ElevenLabs "David C – Viral Storytelling").

## Estructura del Short
| Tiempo | Qué pasa |
|---|---|
| 0–5 s | Imagen más fuerte a pantalla completa + dato en una frase |
| 5–9 s | Sello "¿?" + frase de marca (logo sonoro) |
| 9–10 s | Salto por la interrogación |
| 10–13 s | Rótulo de lugar y fecha |
| … | Historia: escena nueva cada 4–6 s con mancha de tinta, temblor en el clímax |
| últimos 3 s | Cierre de marca: logo + "¿Y TÚ, LO SABÍAS?" + SUSCRÍBETE |

## Miniaturas (vídeos largos)
Izquierda negra con semitono: etiqueta de serie, 1 línea crema + **1 palabra gigante dorada**. Derecha: la ilustración a color. Esquina: sello "¿?". Marco crema fino. (`marca_miniatura.py`)

## Regla para generar ilustraciones
Añadir siempre a cada prompt:
> "Dark 2D comic illustration for adults, thick black ink outlines, gritty paper texture, expressive caricatured faces, graphic-novel atmosphere. **The key element of the story is rendered in vivid golden yellow; everything else in muted dark tones.** No text, no letters, no logos."

Así el objeto clave de cada historia destaca siempre en dorado, el color del canal.


## Archivos
- `herramientas/fabricar.py` — guion → vídeo terminado (orquesta todo)
- `herramientas/render_marca.js` — montaje con todas las firmas (cámara viva, partículas, temblor)
- `herramientas/marca_audio.py` — logo sonoro, clics, transiciones y mezcla final (−14 LUFS)
- `herramientas/marca_miniatura.py` — plantilla de miniatura
- `Guiones/S00_boston_melaza.md` → `Vídeos listos/` — ejemplo completo
