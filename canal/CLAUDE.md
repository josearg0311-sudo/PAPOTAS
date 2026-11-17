# Fábrica de vídeos "¿Acaso lo sabías?" — instrucciones para Claude

Canal de YouTube en español de curiosidades e historias reales. El dueño del canal no es técnico: háblale en español, claro y breve.

## Estilo fijo (no cambiar sin que el usuario lo pida)
- **Cómic oscuro 2D a todo color**, cada escena **a pantalla completa con cámara viva** (deriva suave, golpe de zoom al entrar, partículas de ambiente, temblor en el clímax). Ver `marca/manual_de_marca.md`.
- **No usar viñetas con recortes de la misma imagen**: al usuario le pareció raro. (Viñetas solo si él lo pide y con imágenes de detalle propias.)
- **Sin personaje narrador** (Tommy descartado). Narrador en off, voz ElevenLabs "David C – Viral Storytelling" (`qRUgOhnxGASxirG4fKjv`), modelo `eleven_v4`.
- Nada de blanco y negro. Nada de estilo infantil.
- Frases fijas: "¿Sabías que…?" · "¿Acaso lo sabías? Pues si no lo sabías… ahora te lo cuento." · cierre "Esto es… ¿Acaso lo sabías?".

## Flujo para hacer un Short
1. Copiar `Guiones/_plantilla.md` → `Guiones/S0X_tema.md`. Guion de 45–55 s, en tercera persona, datos **verificados** (fechas, cifras, nombres). Temas sensibles: tono respetuoso, sin violencia explícita.
2. Escenas: 7–9, todas `completa`. En la columna Efecto: `polvo`, `lluvia`, `brasas` o `salpicaduras` (ambiente), `luz` (parpadeo de lámpara) y `temblor` (clímax).
3. Prompts de imagen (ElevenLabs, `gpt-image-2.5-sunburst`, 9:16, 1K, calidad `medium`, ~63 créditos) terminando SIEMPRE en:
   "Dark 2D comic illustration for adults, thick black ink outlines, gritty paper texture, expressive caricatured faces, graphic-novel atmosphere. The key element is rendered in vivid golden yellow: <objeto clave>; everything else in muted dark tones. No text, no letters, no logos."
4. **Antes de generar, estimar créditos** (`creative_run_flow_nodes` con `estimate_only`) y decírselo al usuario. Nunca usar modelos caros (gemini-3-pro-image, vídeo) sin su permiso. Un Short ≈ 1.450 créditos (8 imágenes + voz).
5. Descargar a `En proceso/S0X/` como `escena_01.jpg`, `escena_02.jpg`…, y la voz como `voz.mp3` (o usar `Pon aquí tu voz/S0X.mp3` si existe).
6. Ejecutar `python3 herramientas/fabricar.py Guiones/S0X_tema.md` desde `canal/`.
7. Revisar fotogramas del resultado (subtítulos, sello, rótulo, cierre) y entregar desde `Vídeos listos/`.

## Plan del canal
`../narrador/estrategia.md` y `../narrador/plan/plan_2_meses.md` (1 Short diario 19:00, 1 vídeo largo los sábados 18:00, series y calendario).
Flujo de ElevenLabs: `KDrAk6ZHNGEx01qJibzF`.
