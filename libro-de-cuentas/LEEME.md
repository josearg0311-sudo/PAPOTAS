# Libro de Cuentas · rediseño

Reescritura completa a partir del `index.html` original, que se conserva aquí
como `original.html` para poder comparar.

## Lo que se mantiene intacto

- **La nube es la misma**: jsonbin.io, cabecera `X-Master-Key`, la misma URL
  (`/v3/b/<bin>`), el mismo cuerpo (un array pelado de movimientos) y la misma
  clave de configuración local (`libro_cuentas_db_cfg`).
- **El respaldo JSON no cambia de formato**: `{app, version, exportedAt,
  transactions}`. Comprobado en las dos direcciones: esta versión abre los
  respaldos de la anterior, y la anterior abre los de ésta.
- **Los datos guardados** siguen en `ledger_finanzas_simple_v1`, así que al
  abrir esta versión encima de la otra no se pierde nada.
- El código de sincronización entre dispositivos usa la misma codificación.

## Lo que cambia

### Cero dependencias externas
El original descargaba Chart.js, html2pdf y Google Fonts de internet. Si la red
bloqueaba un CDN, no había gráfico ni PDF. Ahora no se descarga nada: el
gráfico se dibuja en SVG, el PDF y el Excel se generan a mano, y la tipografía
es la del sistema.

### Excel de verdad
Antes era un CSV. Ahora es un `.xlsx` real, escrito byte a byte (ZIP + OOXML),
con tres hojas —Movimientos, Resumen por mes y Categorías—, cabeceras fijas,
autofiltro, formato de moneda y fecha, y fórmulas `SUM` vivas.

### PDF vectorial
Antes se hacía una captura con html2canvas y se pegaba dentro de un PDF: texto
borroso, no seleccionable, una sola página. Ahora el PDF se escribe
directamente: texto real y buscable, multipágina con cabecera y numeración,
y unas decenas de KB. 240 movimientos → 7 páginas en 132 ms.

### Diseño
De una columna de teléfono perdida en medio de una pantalla ancha, a un libro
contable: barra lateral con el balance y el periodo, tabla con columnas y
reglas horizontales en pantalla grande, fichas en el teléfono. Tema claro y
oscuro.

### Funciones nuevas
- Categorías (campo opcional; los lectores antiguos lo ignoran).
- Filtro por periodo: mes, mes pasado, año, 90 días o rango de fechas.
- Búsqueda por descripción, categoría, monto o fecha.
- Orden por fecha o por monto.
- Deshacer los borrados.
- Resumen con tasa de ahorro, promedios mensuales, mayor gasto y desglose
  por categoría.
- Atajos de teclado: `n` nuevo, `/` buscar, `1` y `2` cambiar de hoja.

## Archivos

    index.html      el programa
    original.html   la versión de partida, para comparar
    salidas/        ejemplos generados por el propio programa (xlsx, pdf, csv)
