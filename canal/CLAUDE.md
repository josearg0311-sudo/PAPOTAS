# Fábrica de vídeos "¿Acaso lo sabías?" — instrucciones para Claude

Canal de YouTube en español de curiosidades e historias reales. El dueño del canal no es técnico: háblale en español, claro y breve.

## Estilo fijo (no cambiar sin que el usuario lo pida)
- **STOP-MOTION DE PLASTILINA** (elegido por el usuario; el cómic oscuro 2D quedó descartado): personajes y decorados que parecen hechos a mano en plastilina, cartón y tela, con huellas y textura. El motor anima "a pasos" (12 por segundo) con un leve temblor hecho a mano (`estilo: stopmotion`, ya es el predeterminado). Estructura MIXTA: gancho y clímax = **clips animados con IA** (`clip`); el resto = **animación por capas 2.5D** (`capas`: fondo sin personas + personaje recortado que entra, respira, se balancea). Cámara viva, partículas de ambiente, temblor en el clímax. Ver `marca/manual_de_marca.md`.
- El usuario rechazó las "fotos que solo se mueven": evitar escenas `completa` salvo emergencia.
- **No usar viñetas con recortes de la misma imagen**: al usuario le pareció raro. (Viñetas solo si él lo pide y con imágenes de detalle propias.)
- **Sin personaje narrador** (Tommy descartado). Narrador en off, voz ElevenLabs "David C – Viral Storytelling" (`qRUgOhnxGASxirG4fKjv`), modelo `eleven_v4`.
- Nada de blanco y negro. Nada de estilo infantil.
- Frases fijas: "¿Sabías que…?" · "¿Acaso lo sabías? Pues si no lo sabías… ahora te lo cuento." · cierre "Esto es… ¿Acaso lo sabías?".

## Flujo para hacer un Short
1. Copiar `Guiones/_plantilla.md` → `Guiones/S0X_tema.md`. Guion de 45–55 s, en tercera persona, datos **verificados** (fechas, cifras, nombres). Temas sensibles: tono respetuoso, sin violencia explícita.
2. Escenas: 7–9. Diseño `clip` (2 por Short: gancho + clímax) o `capas` (el resto). Efecto: `polvo`, `lluvia`, `brasas`, `salpicaduras`, `niebla` (ambiente), `luz`, `temblor` (clímax), `nervio` (personaje tiembla), `derecha` (personaje entra por la derecha).
3. Por escena `capas`: un **fondo** ("Empty background plate, no people: …") y un **personaje** ("Character cut-out on a plain flat light grey background, nothing else: … shown in the lower two thirds of the frame") + nodo `birefnet-v2-bg-removal` conectado al personaje (~30 créditos). Por escena `clip`: una imagen + nodo `ltx-v2-fast` (6 s, 1080p, sin audio, ~1.450 créditos) con un prompt de movimiento que acabe en "Keep the 2D comic art style.". Imágenes con `gpt-image-2.5-sunburst`, 9:16, 1K, `medium` (~63 créditos), terminando SIEMPRE en:
   "Claymation stop-motion style: handmade plasticine characters with visible fingerprints and clay texture, miniature handcrafted set made of clay, cardboard and fabric, soft warm studio lighting, shallow depth of field, slightly exaggerated proportions, original character design. The key element is rendered in vivid golden yellow: <objeto clave>. No text, no letters, no logos."
   Clips: prompt que empiece por "Stop-motion claymation animation:" y acabe en "Keep the handmade plasticine look and miniature set.". Personajes siempre originales (no parecidos a personajes de estudios o series existentes).
   Prueba de estilo pendiente (≈1.674 créditos): nodos `PRUEBA_plastilina_*` en el flujo. Los nodos de S01 siguen en estilo cómic: rehacer sus prompts en plastilina antes de generarlos.
4. **Antes de generar, estimar créditos** (`creative_run_flow_nodes` con `estimate_only`) y decírselo al usuario. Nunca usar modelos caros (gemini-3-pro-image, vídeo) sin su permiso. Un Short mixto ≈ 4.850 créditos (2 clips + 5 escenas en capas + voz). Ver S01 como ejemplo de nodos.
5. Descargar a `En proceso/S0X/`: clips como `escena_01.mp4`; capas como `escena_02_fondo.jpg` + `escena_02_personaje.png` (el recorte con transparencia); y la voz como `voz.mp3` (o usar `Pon aquí tu voz/S0X.mp3` si existe).
6. Ejecutar `python3 herramientas/fabricar.py Guiones/S0X_tema.md` desde `canal/`.
7. Revisar fotogramas del resultado (subtítulos, sello, rótulo, cierre) y entregar desde `Vídeos listos/`.
8. **Publicación: la hace el usuario** (no hay conexión con YouTube). Cada guion lleva `publicar: AAAA-MM-DD HH:MM` (según `../narrador/plan/plan_2_meses.md`); el `youtube.txt` incluye fecha, lista y checklist. Entregar un paquete semanal (7 Shorts + largo) y recordarle `GUIA_PUBLICAR.md`.

## Plan del canal
`../narrador/estrategia.md` y `../narrador/plan/plan_2_meses.md` (1 Short diario 19:00, 1 vídeo largo los sábados 18:00, series y calendario).
Flujo de ElevenLabs: `KDrAk6ZHNGEx01qJibzF`.
