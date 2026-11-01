# Causa · gestión para estudios jurídicos

Programa para que un abogado o un estudio pequeño del Perú lleve en un
solo sitio sus **clientes, expedientes, audiencias, plazos y honorarios**.
Es un solo archivo (`index.html`), funciona en el celular y en la
computadora, se instala como aplicación y no necesita servidor.

## Qué hace

- **Inicio**: expedientes activos, audiencias y plazos de los próximos 7
  días, lo que falta cobrar, y la lista de los próximos 14 días con
  semáforo (rojo: hoy, mañana o vencido; ámbar: en 3 días).
- **Clientes**: nombre, DNI/RUC, celular, correo. Botón de WhatsApp,
  sus expedientes, sus pagos y un **estado de cuenta imprimible** (o en PDF).
- **Expedientes**: número tal como sale en el CEJ, órgano jurisdiccional,
  distrito judicial, materia, pretensión, contraparte, juez, especialista
  y estado. Cada uno tiene su agenda, sus honorarios y un **seguimiento**
  donde se anota cada escrito, resolución o notificación. «Ver en CEJ»
  copia el número y abre la consulta del Poder Judicial.
- **Agenda**: calendario del mes con audiencias, plazos, tareas y
  reuniones; los feriados se ven en el calendario. Desde un evento se
  puede **avisar al cliente por WhatsApp** con el mensaje ya escrito, y
  toda la agenda se exporta a Google Calendar o al calendario del celular
  (archivo `.ics`, con aviso un día antes).
- **Calculadora de plazos**: días hábiles desde el día siguiente a la
  notificación, sin fines de semana ni feriados nacionales (Jueves y
  Viernes Santo incluidos, calculados cada año). Se pueden añadir días
  inhábiles propios en Ajustes. El vencimiento se agenda con un toque.
- **Honorarios**: lo pactado, los gastos y tasas, y los pagos (efectivo,
  transferencia, Yape, Plin…). Saldo por cliente y por expediente.
- **Portales**: accesos al CEJ, SINOE, Mesa de Partes Electrónica, TC,
  El Peruano, SPIJ, Ministerio Público, SUNARP, SUNAT e INDECOPI.
- **Buscar** en todo, **respaldo** en JSON, exportación a **Excel (CSV)**,
  modo claro y oscuro, y **datos de ejemplo** para probarlo.

## Dónde quedan los datos

En el navegador del aparato donde se usa, como PAPOTAS. No salen de ahí.
Por eso: **Ajustes → Descargar respaldo** de vez en cuando, y
**Cargar respaldo** para pasarlos a otro celular.

## Publicarlo

Se publica solo junto con PAPOTAS, en
`https://josearg0311-sudo.github.io/PAPOTAS/estudio-juridico/`.
También se puede soltar esta carpeta en Netlify Drop.

## Ojo

La calculadora es una ayuda: confirma siempre el plazo con la norma
aplicable y los días inhábiles que declare tu Corte Superior.
