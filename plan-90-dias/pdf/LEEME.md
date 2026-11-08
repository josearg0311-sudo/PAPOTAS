# PDF «Progresa · guía práctica»

Guía de orientación de 44 páginas, tipo revista, sin datos de ninguna
persona: lo básico de la alimentación, una hoja para calcular lo propio,
el plato y la mano, el semáforo, comer y entrenar, los alimentos de los
recetarios, combinaciones, ideas de comidas por momento del día, una
despensa base, 24 recetas paso a paso, las 254 comidas sugeridas, 9
lecciones en viñetas y hojas para registrar.

    node extraer.js   # saca los datos generales de ../index.html → datos.json
    node guia.js ../Progresa-guia.pdf

Necesita Playwright con Chromium. `guia.js` mide cada ficha y cada fila del
recetario en el navegador y las reparte en páginas para que nada se corte.
