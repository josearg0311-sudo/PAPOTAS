# Cuentas · rediseño

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
reglas horizontales en pantalla grande, fichas en el teléfono. **Arranca en
oscuro**; el botón del sol cambia a claro y la elección queda guardada.

### Entra o sale: cuatro señales a la vez
No basta con el color de la cifra. Cada movimiento lleva, apuntando todas al
mismo sitio: una banda de color de alto completo a la izquierda, el fondo de
la fila teñido, un disco con una flecha (arriba entra, abajo sale) y el signo
más el color del monto. Al ser cuatro señales redundantes, quien no distingue
el rojo del verde sigue sabiendo cuál es cuál por la flecha. La ficha de alta
también se tiñe según lo que estés anotando, y las barras del desglose de
gastos van todas en rojo, con la intensidad marcando el orden.

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

## Más ágil de usar, y con movimiento

**Anotar cuesta menos.** La ficha ofrece *Repetir algo de siempre*: los cuatro
movimientos que más repites, con su monto, para dejarlos puestos de un toque.
Y si escribes una descripción que ya usaste, se completan solos el monto, la
categoría y el tipo, como la última vez — solo lo que esté vacío, nunca pisa
lo que hayas escrito tú, y un rótulo te dice qué completó.

**Deslizar para borrar.** En el teléfono, arrastra una fila hacia la izquierda.
Hay que pasar de la mitad para que cuente, así que un roce al hacer scroll no
borra nada, y siempre queda el *Deshacer*.

**El gráfico es un atajo.** Toca el mes que te llame la atención y saltas
directo a sus movimientos, con un *Ver todo* para volver.

**Se ve lo que cambia.** Las cifras suben contando hasta su valor en vez de
saltar; las filas entran en cascada; la que acabas de anotar se enciende un
segundo; las barras crecen desde el suelo. Nada se mueve porque sí, y todo se
apaga si el sistema pide menos movimiento.

## Se llama Cuentas

El nombre visible cambia en todas partes: pestaña, cabecera, aplicación
instalada, informe PDF y nombres de los archivos que descarga
(`cuentas_2026-09-07.xlsx`). Lo **interno no se toca**: la clave de
almacenamiento, la de la nube y el campo `app` del respaldo siguen igual,
para no romper la compatibilidad con lo que ya tienes guardado.

## Cuatro paletas, y eliges tú

En **Opciones → Colores** hay cuatro juegos de color, todos pensados en
oscuro y cada uno con su propio par de entra/sale:

| Paleta | Acento | Entra | Sale |
|---|---|---|---|
| Medianoche | índigo | menta | coral |
| Carbón | ámbar | lima | naranja quemado |
| Violeta | violeta | turquesa | magenta |
| Bosque | verde | esmeralda | rojo |

Cambian el programa entero —gráfico, barras y tintes de las filas incluidos—
porque todo se dibuja leyendo los mismos tokens. La elección se guarda.

## Y otro estilo

Menos cuaderno y más panel: superficies elevadas sobre un fondo profundo con
un halo tenue del acento, esquinas más suaves, tipografía más apretada, y el
balance como pieza central con una línea de acento que va del color de
ingreso al de gasto. La cifra del balance se mide y se ajusta sola para caber
en su caja, den lo que den las cuentas.

## Marca propia

Una **C partida en dos**: la mitad que sube es lo que entra, la que baja lo
que sale. Es el mismo código de color que usa todo el programa, así que el
logo cambia con la paleta y nunca queda descolgado. Se usa en la cabecera, en
la pestaña del navegador, en la pantalla de bienvenida y en los iconos de la
aplicación instalada, que se dibujan con la misma figura.

## Instalable de verdad

Manifiesto en archivo (no un blob: Android no acepta blobs para instalar),
trabajador de servicio con manejador de descargas, e iconos de 192, 512 y uno
recortable para Android. Botón **Instalar en este dispositivo** en Opciones,
que usa el aviso del navegador cuando existe y explica los pasos cuando no —
en iPhone nunca existe. Comprobado servido por http: manifiesto y sw
registrados, los tres iconos respondiendo, y la aplicación abriendo con la
red cortada.

## Primera vez

En vez de un cartel de "no hay nada", una bienvenida que dice en tres pasos
para qué sirve el programa y ofrece dos maneras de empezar: anotar en serio, o
cargar un ejemplo. Mientras el libro está en blanco se ocultan el buscador,
los filtros y el selector de periodo, que no tienen nada que filtrar.

## Tendencia

Bajo el balance, una línea con el saldo acumulado de los últimos nueve meses.
Ocupa 34 px y contesta de un vistazo si vas hacia arriba o hacia abajo, sin
tener que entrar al resumen.
