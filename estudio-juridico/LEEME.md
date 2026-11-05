# Estudio Rodríguez y Rodríguez · gestión del estudio jurídico

Programa del Estudio Rodríguez y Rodríguez para que un abogado o un estudio pequeño del Perú lleve en un
solo sitio sus **clientes, expedientes, audiencias, plazos y honorarios**.
Es un solo archivo (`index.html`), funciona en el celular y en la
computadora, se instala como aplicación y no necesita servidor.

## Lo más nuevo

- **Diseño vino renovado**: cabecera vino, tarjetas limpias, portada con
  indicadores (casos, audiencias, plazos, por cobrar), agenda de hoy y
  mañana con colores por tipo, y modo oscuro.
- **Equipo**: abogados, asistentes y practicantes con su color. Cada caso
  tiene responsable y cada audiencia, plazo o tarea una persona asignada;
  filtros «sólo lo mío», pendientes propios en la portada y la carga de
  cada uno (casos, pendientes, horas) en la vista Equipo.
- **Nube (Supabase)**: todo el equipo trabaja sobre los mismos datos desde
  cualquier celular o computadora. Cada uno entra con su correo; sólo
  entran los correos que un administrador agregue en Equipo.
  1. Crea un proyecto gratis en supabase.com.
  2. En «SQL Editor» pega `supabase.sql` (de esta carpeta) y pulsa «Run».
  3. En «Project Settings → API» copia la URL y la clave «anon public».
  4. En el programa: Equipo → Nube y acceso → pégalas y crea tu cuenta
     (la primera cuenta del proyecto administra).
  Se sincroniza sola al guardar, cada 45 segundos y al volver a la app.
  Los documentos adjuntos y la clave de la IA no se suben.
- **Flujos por tipo de proceso**: civil (conocimiento, abreviado,
  sumarísimo, ejecución), laboral NLPT (ordinario y abreviado), penal NCPP,
  alimentos y genérico. El expediente muestra sus etapas; al registrar un
  hito («notificada la sentencia») se anota, se calcula y agenda el plazo
  en días hábiles (o la audiencia) y el caso pasa de etapa. Plazos
  referenciales y editables.
- **IA que actúa**: además de responder, el asistente busca, crea clientes,
  expedientes y prospectos, agenda audiencias y plazos (calculándolos con
  los feriados), registra actuaciones, pagos y gastos, cambia la etapa y
  genera documentos con los modelos. Cada respuesta muestra lo que hizo y
  tiene un botón para deshacerlo todo.
- **Gestión del negocio**: prospectos en tablero (con seguimiento, origen,
  conversión, propuesta de honorarios y conversión a cliente), gastos del
  estudio con gastos fijos mensuales, y flujo de caja con utilidad, margen
  y proyección de tres meses.

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

## Funciones avanzadas

- **Generador de documentos** (pestaña Documentos): 18 modelos en cinco
  grupos —escritos judiciales, cartas, contratos, poderes y declaraciones,
  y documentos para el cliente—. Eliges el modelo y el expediente, marcas
  las **opciones** (qué otrosíes van, qué cláusulas, forma de pago, quién
  firma…), llenas sólo lo que falta y ves el documento armándose al lado.
  Los datos del caso, del cliente y del estudio se ponen solos, los montos
  salen también en letras y los otrosíes se numeran solos. Sale a PDF,
  Word o se guarda para seguir editándolo.
- **Tus propios modelos**: «Crear mi modelo» o «Personalizar» uno de
  fábrica. Escribes el texto con marcas y el programa arma solo el
  formulario:
  - `{{dato}}` crea una casilla (si es un dato del expediente, se llena sola);
  - `{{monto_letras}}` escribe en letras el monto `{{monto}}`;
  - `{{#si opcion}}…{{/si}}` crea una casilla para incluir o no ese texto;
  - `{{#si forma=cuotas}}…{{/si}}` crea una lista para elegir;
  - `{{otrosi}}OTROSÍ DIGO` numera los otrosíes.
- **Asistente con IA** (Claude, de Anthropic): sube PDF, Word, fotos o
  texto y pregúntale qué resolvió el juzgado, qué plazo corre y cuándo
  vence, pídele un escrito, que revise uno tuyo o que le explique el caso
  al cliente. Si eliges un expediente, conoce sus datos, el seguimiento,
  la agenda y los honorarios. Las respuestas se copian, se guardan como
  documento, se anotan en el seguimiento o se envían por WhatsApp.
  Desde cada expediente: «Preguntar a la IA» y el botón «IA» de cada
  documento; desde cada escrito: «Revisar con IA».
  - Necesita una clave de la API de Anthropic (console.anthropic.com),
    que se pega una vez y queda sólo en ese aparato. Se cobra por uso a
    esa cuenta. Modelo y profundidad se eligen en Ajustes.
  - El SDK oficial va empaquetado en `anthropic-sdk.js` (Apache 2.0).
- **Subir tus modelos de Word**: en Documentos, «Subir mi modelo (Word)»
  convierte un .docx en modelo, y «Poner marcas con IA» reemplaza los
  datos concretos por marcas y opciones (se puede deshacer).
- **Cuotas**: plan de pagos (mensual, quincenal o semanal) con el
  cronograma a la vista; avisa las vencidas, recuerda al cliente por
  WhatsApp y «Cobrar» registra el pago y marca la cuota.
- **Recibos numerados** (N.° 0001, 0002…) con el monto en letras,
  listos para imprimir. Son un control interno, no comprobante de SUNAT.
- **Horas trabajadas**: cronómetro por expediente que sigue corriendo
  aunque cierres el programa, o registro a mano; con tarifa por hora se
  pasan a honorarios con un toque.
- **Documentos** adjuntos a cada expediente (PDF, fotos, Word), guardados
  en el aparato. Hay un «respaldo con documentos» aparte.
- **Reportes**: cobrado por mes, tasa de cobro, casos por materia y por
  estado, honorarios por cliente y horas por expediente.
- **Tablero** de expedientes por estado: se arrastran de una columna a
  otra (en el celular, con el selector de cada tarjeta) y el cambio queda
  anotado en el seguimiento.
- **Conflicto de intereses**: avisa si la contraparte de un caso nuevo se
  parece a un cliente tuyo, o si un cliente nuevo ya es contraparte.
- **Plazos frecuentes** en la calculadora (CPC, NLPT, NCPP), referenciales.
- **Dictado por voz** en el seguimiento y en los escritos (Chrome).
- **Resumen del día** por WhatsApp: hoy, mañana, atrasados y cuotas.
- **Avisos** en el aparato una hora antes de cada audiencia.
- **Bloqueo con PIN** con teclado, al abrir y tras minutos sin uso.
  Protege la vista, no cifra los datos.
- **Ctrl+K** o «/» abre el buscador, que ahora también busca en escritos.

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
