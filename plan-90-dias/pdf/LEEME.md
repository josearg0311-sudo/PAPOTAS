# PDF «Progresa · guía práctica»

Guía de orientación de ~100 páginas, tipo revista, sin datos de ninguna
persona. Incluye completos los dos recetarios:

- **Libro 1 · 100 desayunos peruanos saludables**: las 100 fichas, por
  capítulo, más sus páginas de medidas, despensa, conservación, preparación
  anticipada y el ejemplo «Siete mañanas ya organizadas».
- **Libro 2 · 100 almuerzos peruanos saludables y económicos**: fichas 1–66
  (cantidades llevadas a 1 porción) y los títulos y páginas de las 67–100,
  más sus guías de porciones, cocina económica y conservación segura.

Además: lo básico, una hoja para calcular lo propio, el plato y la mano, el
semáforo, comer y entrenar, los alimentos, combinaciones, ideas por momento
del día, despensa, índice de 308 comidas, 9 lecciones en viñetas y hojas
para registrar.

    node extraer.js   # datos generales de ../index.html → datos.json
    node guia.js ../Progresa-guia.pdf

`libros.json` tiene las fichas sacadas del texto de los dos libros. El texto
del Libro 2 que se pudo leer llega hasta su página 80; para sumar las fichas
67–100, vuelve a extraerlo desde el PDF completo.

Necesita Playwright con Chromium. `guia.js` mide cada bloque en el navegador
y reparte las páginas para que nada se corte.
