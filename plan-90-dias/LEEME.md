# Progresa · nutrición peruana a tu medida

App web de un solo archivo (`index.html`) para planificar comidas peruanas y
seguir tu progreso. Funciona sin conexión: el recetario, las fichas de los
libros y las fuentes van dentro del archivo.

- **Personalizada:** al abrirla por primera vez un asistente pregunta sexo,
  edad, estatura, peso, objetivo (bajar, mantener o ganar), ritmo, trabajo,
  deportes, comidas al día, frutas favoritas y lo que no comes. Con eso
  calcula calorías de días de entreno y descanso, proteína, agua y porciones.
- **Progresión por etapas:** cada 4 semanas empieza una etapa nueva y las
  calorías se recalculan con el peso real. El motor de ajustes compara tu
  promedio semanal con lo proyectado y propone ±100 kcal (con un botón para
  aplicarlo y otro para deshacerlo).
- **Varios perfiles:** cada persona tiene sus datos aparte en el mismo
  aparato (botón ⬇ → Perfiles). Los datos de la versión «plan 90 días» se
  migran solos a un perfil con sus calorías originales.
- **Usarla:** abre `index.html`, o la dirección publicada
  `https://josearg0311-sudo.github.io/PAPOTAS/plan-90-dias/`.
- **Datos:** viven en el navegador (localStorage). Exporta un respaldo JSON
  por perfil desde el botón ⬇.
- **Contenido:** `recetario.json` (254 recetas) y `fichas.json`
  (ingredientes, pasos y macros de 146 recetas de los libros 1 y 2).
- **Editar:** cambia `src.html`, `recetario.json` o `fichas.json` y ejecuta
  `node build.js`. Para probar otra fecha: `index.html?hoy=2026-12-15`.

Fórmulas: gasto basal Mifflin-St Jeor × factor de trabajo + deporte (MET);
déficit o superávit = ritmo × 7700 / 7, con tope del 25 % y un mínimo de
calorías; proteína 1,8 g/kg (2 g/kg al ganar músculo).

Guía general para personas sanas y activas; no reemplaza a un profesional de salud.
