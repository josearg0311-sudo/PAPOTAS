# Cuentas Claras

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
