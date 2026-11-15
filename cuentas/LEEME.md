# Apuntado

Todo lo que entra y sale, apuntado. (Antes «Sencillo» y «Cuentas Claras».)
El logo es una A hecha con dos flechas: sube por la izquierda (lo que entra,
azul), baja por la derecha (lo que sale, naranja), y el travesaño es la raya
de apuntar.

Libros de ingresos y gastos. Un solo archivo (`index.html`), sin librerías ni
nada que se descargue de internet.

**Dirección:** https://josearg0311-sudo.github.io/PAPOTAS/cuentas/
(se publica sola con cada cambio, igual que PAPOTAS).

## Cómo se ve

Papel y tinta: **azul** para lo que entra, **rojo** para lo que sale, como se
llevaban los libros a mano. De noche, una **pizarra** (botón de la luna).

- **El estante.** Cada libro es un lomo de color. Tócalo para abrirlo. El `+`
  pone un libro nuevo. Los cerrados se ven apagados.
- **La ecuación.** Arriba de cada libro: `saldo inicial + entró − salió = saldo`.
  Con un periodo elegido, es la cuenta de ese periodo.
- **Tres vistas:** *Diario* (cada asiento con su saldo acumulado), *Cuenta T*
  (Debe y Haber, con el saldo en el lado corto para que las sumas cuadren) y
  *Mayor* (por categoría, por medio y mes a mes).

## v8 · más funciones (la actual)

- **Seleccionar varios, a la vista**: botón «☑ Seleccionar» sobre la lista
  (también en modo simple). Tocas los movimientos o «Marcar los N», y la barra
  de abajo te deja **Borrar**, cambiar la **Categoría**, cambiar la **Fecha**,
  **Mover** a otro libro o **Duplicar**. Todo con Deshacer. Marcar es
  instantáneo (no redibuja la lista).
- **Borrar un libro**, fácil de encontrar: en el `⋯` del libro (arriba del
  todo dice su nombre y abajo «Borrar este libro»), manteniendo pulsada su
  tarjeta (clic derecho en la computadora) o en «Ordenar o borrar libros»,
  que ahora se ve siempre. Pide confirmación y se puede deshacer.
- **📅 Calendario** del mes: cada día con lo que entró y salió, más naranja
  cuanto más gastaste. Toca un día para ver sus movimientos.
- **Proyección**: «A este ritmo cerrarás noviembre con unos S/ 2,964 de gastos».
- **🎯 Meta de ahorro** por libro: cuánto llevas, el % y en cuántos meses
  llegas a tu ritmo de los últimos tres meses.
- **🔒 Candado con PIN** (menú ⋯): pide 4 números al abrir la app en ese
  aparato. Es privacidad, no cifrado: si lo olvidas, los datos siguen en la
  nube o en tu respaldo.

## v7 · Apuntado

- **Apunte rápido**: una barra donde escribes «-12.50 almuerzo», «+2500
  sueldo», «taxi 15 ayer» o «gasté 30 soles en pizza» y pulsas Enter. Debajo
  se ve cómo va a quedar antes de guardarlo. Entiende «ayer», «me pagaron»,
  «cobré», «12 con 50»… Tecla **A** para ir directo a la barra.
- **🎙️ Dictar por voz** en esa barra (donde el navegador lo permita, sobre todo
  Chrome en Android).
- **Categoría automática**: por lo que ya apuntaste con ese nombre y, si es
  nuevo, por palabras (taxi → Transporte, pizza → Comida, netflix → Servicios).
  También en el formulario normal, mientras escribes.
- **Más rápida**: con 5.000 movimientos cada pantalla pasa de ~470 ms a ~20 ms.
  El libro se suma una vez por cambio (caché) y la lista dibuja 150 y ofrece
  «Ver más».
- **Recordatorio de respaldo** si tus datos solo viven en ese aparato (sin nube
  y sin respaldo en 30 días). «Luego» lo calla dos semanas.

## v6 · Sencillo

- **Nombre y logo nuevos.** La dirección sigue siendo la misma (`/cuentas/`) y
  los datos guardados no se tocan: abres la app y está todo como lo dejaste.
- **Ocultar el saldo** con el ojo 👁️ (para cuando alguien mira tu pantalla).
- **Todo · Ingresos · Gastos**: filtro de un toque sobre la lista.
- **¿En qué se fue el mes?**: una barra con tus categorías de gasto y cómo vas
  comparado con el mismo día del mes pasado («vas 12 % menos que en octubre»).
  Toca una categoría para ver solo esos gastos.
- **Deslizar en el celular**: ← borra (con Deshacer), → repite ese movimiento hoy.
- **Tu propio dibujito por categoría**: menú del libro → Categorías y medios →
  toca el dibujito.
- Una palomita animada (y una vibración corta) al guardar.

## v5 · simple

Lo principal es anotar un gasto en dos segundos, así que la app arranca en
**modo simple**:

- Una sola pantalla: **cuánto tienes**, lo que entró y salió **este mes**, dos
  botones grandes **＋ Ingreso** y **－ Gasto**, y la lista de movimientos.
  En el celular los dos botones quedan fijos abajo.
- Formulario rápido: monto (grande), en qué, categoría con dibujito, **Hoy /
  Ayer**, y Guardar. **Enter** guarda. Medio de pago, comprobante, nota y
  «fijo cada mes» quedan plegados en «Más detalles».
- Atajos: **G** gasto, **I** ingreso.
- Todo lo demás (tabla contable, cuenta T, análisis, presupuestos, varios a la
  vez…) sigue ahí: menú **⋯ → Modo completo**. Exportar PDF/Excel y pasar
  dinero a otro libro están en el **⋯** de cada libro.

Arreglado: el total de los movimientos marcados y el resumen del mes sumaban
mal (salía «NaN»).

## v4 · sobria y fuerte

- Paleta **azul marino, acero y grafito**, con **naranja** de acento.
  **Azul = entra, naranja = sale**: la pareja que mejor se distingue con
  daltonismo. Fondo con una rejilla técnica sutil; tarjetas de libro con chip
  dorado y textura de fibra.
- **Pasar dinero entre libros** (botón «Pasar» o tecla T): sale de uno y entra
  en otro en un solo paso, con los saldos de antes y después.
- **Presupuesto del mes** por categoría (menú Libro): tarjeta con barras de lo
  que llevas, aviso al 80 % y al pasarte, y aviso dentro del formulario antes
  de guardar.
- **Movimientos fijos** (sueldo, alquiler, luz…): cada mes aparecen como
  pendientes y se anotan con un toque. Se crean desde el menú Libro o marcando
  «Fijo cada mes» al anotar.
- **Tu nombre en el saludo** (menú ⋯), guardado solo en ese aparato.

## v3 · moderna y vibrante

Para uso personal, no de oficina:

- **Modo noche** por defecto (fondo oscuro profundo, con halos de color) y
  **modo día** con el botón del sol. Letras Manrope y Space Grotesk.
- **Saludo** según la hora (buenos días, buenas tardes, buenas noches).
- Cada libro es una **tarjeta** con degradado de color, su saldo y una mini
  línea de cómo va. Se deslizan de lado en el teléfono.
- El saldo en **grande**, con una gráfica de su evolución y la ecuación
  debajo («cómo sale ese número»).
- **Acciones rápidas** redondas: Entró, Salió, Varios, Cuadrar, Asentar.
- **Movimientos** agrupados por día (Hoy, Ayer, Vie 13 nov…), cada uno con el
  **dibujito** de su categoría (🍔 🚌 🏠 💡 💼…), adivinado por su nombre.
- Pestañas: Movimientos · Tabla (el diario contable completo) · Cuenta T · Análisis.
- Análisis con gráfico mes a mes y una **dona** de a dónde se fue el dinero.
- Cian para lo que entra y rosa para lo que sale: pareja comprobada para que se
  distinga también con daltonismo.

El PDF y el Excel se mantienen sobrios, pensados para imprimir.

## v2 · los detalles (versión anterior)

- Tipografía de imprenta: **Fraunces** para títulos, **IBM Plex** para texto y
  cifras (se guardan en el aparato la primera vez; sin internet usa las del sistema).
- Papel con grano, lomos con dorados y placa, altura según cuántos asientos
  tiene cada libro, sujetalibros, páginas apiladas y cinta marcapáginas del
  color del libro.
- La ecuación cuenta hacia su nuevo valor al cambiar, muestra qué parte de lo
  movido fue entrada o salida, y una línea con la evolución del saldo.
- El Diario se agrupa por **mes** con sus subtotales, enseña el día de la
  semana, deja elegir el orden (antiguo o nuevo arriba) y tiene duplicar y
  borrar a mano en cada fila.
- Cada categoría lleva siempre su punto de color.
- Mayor con un **gráfico mes a mes** (entró / salió), con detalle al pasar por encima.
- El monto es **calculadora**: `12.50+3.80` o `3x12.50`.
- Barra de avance de las cinco preguntas, y un pie con el estado del aparato.

## Anotar sin equivocarse

El asiento se hace en cinco preguntas — entra o sale, cuánto, por qué, cuándo y
por dónde, comprobante — y arriba se va escribiendo la frase:
*«El 15 de noviembre de 2026 salieron S/ 1,234.50 de Efectivo por
«Reparación de la refri», en Vivienda.»* con el efecto en el saldo.

- El monto se escribe **en letras**, como en un cheque, para notar un cero de más.
- Entiende `1250.50` y `1.250,50`. Si algo es dudoso (`12.345`), **pregunta**
  en vez de adivinar.
- Avisa de: asiento repetido el mismo día, fecha futura, fecha anterior a la
  apertura, saldo que queda en negativo y montos fuera de lo normal.
- Todo el dinero se guarda en **céntimos enteros**: las sumas son exactas.
- **Cuadrar la caja** (menú Libro): cuentas lo que tienes de verdad y te dice
  si sobra o falta, y te ofrece asentar el ajuste.

## Varios a la vez

- **Asentar varios:** una tabla; se puede **pegar desde Excel** o una nota
  (fecha, entra/sale, monto, concepto, categoría, medio).
- **Borrar, duplicar o mover a otro libro** varios asientos: márcalos (en el
  teléfono, «Seleccionar» o mantener pulsado). Siempre hay *Deshacer*.
- **Categorías y medios:** agregar varias de una vez (separadas por comas),
  borrar varias marcadas, renombrar (se cambia en todos los asientos). Opción de
  aplicarlo a todos los libros abiertos.
- **Organizar estante:** ordenar libros y marcar varios para renovarlos,
  exportarlos o borrarlos juntos.

## Renovar

Cierra el libro y abre uno nuevo que **arranca con el saldo final** del viejo.
Los asientos desde la fecha elegida se mudan al nuevo. El viejo queda cerrado
para consultarlo y exportarlo, y se puede reabrir.

## PDF y Excel

- **PDF:** texto real y seleccionable, varias páginas: ecuación, diario con
  saldo, sumas, comprobación, categorías y mes a mes. Con varios libros, una
  portada con el resumen.
- **Excel (.xlsx):** hoja *Diario* con el saldo como **fórmula** (si corriges
  un monto en Excel, se recalcula todo), hoja *Mayor* con `SUMIFS`. Con varios
  libros, una hoja de resumen y una por libro.

Con un periodo elegido, el PDF y el Excel del libro abierto salen de ese periodo.

## Sincronizar con JSONBin

Menú `⋯` → **Sincronizar entre dispositivos**.

1. Crea una cuenta gratis en jsonbin.io y copia tu **X-Master-Key** (API Keys).
2. Pégala y toca **Crear la base y conectar**.
3. En el otro aparato: **Ya tengo un código** y pega el código que te muestra el primero.

Cada aparato **mezcla asiento por asiento** (gana el cambio más reciente; un
borrado cuenta como cambio), así que se puede anotar en dos aparatos a la vez
sin pisarse. Pregunta cada 20 s mientras lo usas y se calla si la pestaña está
escondida o llevas 3 minutos sin tocarlo.

Límites del plan gratis de JSONBin: unas 10.000 peticiones al mes y ~100 KB por
bin (el programa te dice cuánto ocupas). Cuando te acerques, renueva y borra
libros cerrados ya exportados.

**Ojo:** tiene que abrirse desde su dirección https; como archivo suelto el
navegador no deja hablar con JSONBin.
