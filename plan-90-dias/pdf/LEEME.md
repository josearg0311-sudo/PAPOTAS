# PDF «Progresa · mi plan»

Revista de 37 páginas armada con los datos reales de la app (perfil, etapas,
proyección, recetas, fichas, alimentos y lecciones).

    node extraer.js   # saca los datos del motor de ../index.html → datos.json
    node gen.js ../Progresa-mi-plan.pdf

Necesita Playwright con Chromium. `gen.js` mide cada ficha y cada fila del
recetario en el navegador y las reparte en páginas para que nada se corte.
