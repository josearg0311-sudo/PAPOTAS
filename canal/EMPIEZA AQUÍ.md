# 🎬 Fábrica de "¿Acaso lo sabías?" — EMPIEZA AQUÍ

Todos los vídeos del canal salen de esta carpeta con **el mismo estilo**: cómic en color, viñetas, sello "¿?", rótulo de lugar, subtítulos en cinta, logo sonoro y cierre.

## Carpetas
| Carpeta | Para qué sirve |
|---|---|
| `Guiones/` | Un archivo por vídeo (copia `_plantilla.md`). Aquí va el texto, las escenas y los datos para YouTube |
| `Pon aquí tu voz/` | (Opcional) Si grabas tú la narración: `S01.mp3`, `S02.mp3`… con el mismo nombre que el id del guion |
| `En proceso/` | Carpeta de trabajo de cada vídeo: imágenes (`escena_01.jpg`…) y archivos intermedios |
| `Vídeos listos/` | El resultado: el vídeo, la miniatura y el texto para YouTube |
| `herramientas/` | Los programas que montan el vídeo (no hace falta tocarlos) |
| `recursos/` | Logo, fuentes y música del canal |

## Cómo se hace un vídeo (con Claude)
1. **Pide a Claude:** "Haz el Short S0X sobre ___". Claude escribe el guion en `Guiones/`, comprueba los datos y te dice cuántos créditos costará.
2. Claude genera las imágenes y la voz en ElevenLabs y las deja en `En proceso/S0X/`.
3. Claude ejecuta la fábrica:
   ```
   python3 herramientas/fabricar.py Guiones/S0X_tema.md
   ```
4. Revisas en `Vídeos listos/` el vídeo, la miniatura y `youtube.txt`, y lo programas en YouTube Studio.

## Ejemplo
`Guiones/S00_boston_melaza.md` es un guion de prueba ya fabricado: mira el resultado en `Vídeos listos/`.

## Reglas de marca
Están en `marca/manual_de_marca.md` y en `CLAUDE.md` (Claude las sigue automáticamente).
