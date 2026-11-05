# Plan 90 días

App web de un solo archivo (`index.html`) para seguir el plan de alimentación
del 4 nov 2026 al 2 feb 2027. Funciona sin conexión: el recetario (254 recetas)
y las fuentes (Poppins e Inter) van dentro del archivo.

- **Usarla:** abre `index.html` en el navegador, o la dirección publicada
  `https://josearg0311-sudo.github.io/PAPOTAS/plan-90-dias/`.
- **Datos:** se guardan en el navegador (localStorage). Exporta un respaldo
  JSON desde el botón ⬇ de arriba a la derecha.
- **Editar:** cambia `src.html` o `recetario.json` y ejecuta `node build.js`,
  que vuelve a generar `index.html`.
- **Probar otra fecha:** `index.html?hoy=2026-12-15`.

Guía general para una persona sana y activa; no reemplaza a un profesional de salud.
