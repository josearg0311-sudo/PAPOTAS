# CLAUDE.md · Agenda 5 (organizador personal)

Este repositorio contiene DOS cosas distintas:
- **PAPOTAS** (archivos de la raíz: `index.html`, `papotas-nuevo.html`, `sw.js`, `libro-de-cuentas/`…): otra app. **No se toca** salvo que el usuario lo pida.
- **La Agenda**, en `agenda/` (la versión nueva) y `agenda-v4.5-original/` (la versión publicada antes del rediseño, solo como referencia: **no editar**).

## Reglas del usuario (no negociables)
- Responder **siempre en español**, claro y sin tecnicismos innecesarios. El usuario vive en **Lima, Perú**.
- **Cero pérdida de datos.** Migración automática y probada, con copia del formato antiguo guardada antes de migrar. La versión nueva **nunca escribe ni borra** las claves de la v4.5 (salvo `agenda_pin`, compartida a propósito). `js/datos/almacen.js` lo impide a nivel de código: no quitar esa protección.
- Compatible con la nube: la versión nueva no debe subir datos rotos. **Antes de conectarse a la nube real del usuario, avisar y pedir confirmación.**
- No romper PIN, sincronización ni PWA. **Al publicar, subir `CACHE` en `agenda/sw.js` y `VERSION` en `agenda/js/version.js`.**
- Responsive real (primero celular, cómodo en laptop). Accesible: buen contraste y botones de 44 px mínimo.
- Trabajar **por fases**. Al terminar cada una: qué cambió, cómo probarlo, y esperar su OK. En cada fase verificar: sin errores en consola, datos migrados visibles, PIN y respaldo funcionando.
- Si algo no conviene o choca con la app, decirlo y proponer alternativa.
- Mantener este archivo actualizado al cerrar cada fase.

## Formato (toda la app)
- Español de Perú. Fechas `dd/mm/aaaa` y «lun 5 oct» (setiembre = «set»). Hora 24 h o 12 h según Ajustes («2:30 p. m.»).
- Moneda: `S/ 1,250.00` (es-PE). Montos se guardan en **céntimos enteros**.
- Zona horaria **America/Lima** siempre (`js/util/fechas.js`), no la del aparato.
- Textos cortos. **Nunca una pantalla en blanco**: cada lista vacía tiene un mensaje útil (`vacio()` en `js/util/dom.js`).
- Plazos: 🔴 vencido, ⚠️ vence en 3 días o menos; en Oficina el «plazo legal» va siempre primero.

## Cómo se publica y se prueba
- Sin compilación: módulos JavaScript nativos (`<script type="module">`). Se publica arrastrando **la carpeta `agenda/`** a Netlify (sitio fijo `agendaaaapersonal.netlify.app`, que hoy sirve la v4.5).
- ⚠️ **Aún no publicar `agenda/` en Netlify** (reemplazaría la v4.5 en el sitio real). Con la Fase 2 la v5 ya migra y muestra los datos, pero todavía no permite crear/editar (Fase 3) ni sincroniza con la nube (Fase 8). Decidir con el usuario cuándo publicar.
- Vista previa privada para el usuario (artifact multi-archivo, almacenamiento propio, sin service worker ni descargas): se arma copiando `agenda/` a una carpeta temporal y quitando `<!DOCTYPE>/<html>/<head>/<body>` del index. El usuario puede probar la migración real cargando su respaldo de la v4.5 en Ajustes → Respaldo → Cargar.
- Servidor local: `python3 -m http.server 8770` desde la raíz del repo → `http://localhost:8770/agenda/`. Los módulos **no** funcionan abriendo el archivo con doble clic.
- Pruebas automáticas: `http://localhost:8770/agenda/pruebas/` (deben pasar todas; cada fase suma las suyas y nunca se borra una prueba).
- Para probar con datos reales de la v4.5 en el mismo origen: abrir `http://localhost:8770/agenda-v4.5-original/index.html` → «Ver con ejemplos», y luego `/agenda/`.

## Arquitectura (`agenda/`)
```
index.html            esqueleto, sprite de íconos, tema antes de pintar
manifest.webmanifest  instalación (id "./", igual que la v4.5 en la raíz)
sw.js                 caché del programa (agenda-vNN) y clic en avisos
_headers              cabeceras de Netlify (no-cache para el programa)
css/  tokens.css (colores y letras) · base.css (armazón) · componentes.css · vistas.css
js/
  app.js              arranque, rutas por dirección (#hoy, #areas/estudios…), acciones
  version.js          versión visible en Ajustes
  util/   fechas.js (Lima) · dinero.js (soles, céntimos, leerMonto) · dom.js (esc, ico, vacio)
          ics.js (archivo .ics con zona America/Lima, alarma y repetición; enlace a Google Calendar)
          interpretar.js («llamar mañana 10am !! #oficina plazo legal» → título, fecha, hora, prioridad, área, etiquetas)
  datos/  almacen.js (localStorage seguro, claves agenda5_*, solo lectura de v4.5)
          modelo.js (formato v5, normalizar, fusionar) · migracion.js (puro: migrar/verificar/reconstruir)
          datos.js (ÚNICO que lee/cambia «agenda5_datos»; papelera; migrarDesdeV45)
          copias.js (copias automáticas en IndexedDB «agenda5») · respaldo.js (exportar/importar v5 y v4.5)
          pendientes.js (grupos hoy/más tarde/mañana/próximos/algún día/hecho, orden, repetir, urgentes, cerrar el día)
          calendario.js (ocurre, bloquesDelDia, todoElDia, minutosPorArea, vencenEl, delDia, resumenDia, pagos fijos)
          feriados.js (feriados nacionales del Perú, Semana Santa calculada) · preferencias.js · areas.js
  piezas/ candado.js (PIN) · hoja.js · aviso.js · tema.js · guia.js (modo guía y recorrido)
          agregar-rapido.js (2 toques: tipo → área → texto con vista previa; guarda recordatorio, evento, gasto, nota, hábito, meta)
          pendientes-ui.js (fila con casilla, Más tarde/Mañana/Día…, deslizar, editor, listas) · pomodoro.js (agenda5_foco)
          eventos-ui.js (crear/editar eventos, .ics, Google, marcar pago fijo → gasto en el libro)
          avisos.js (recordatorios a la hora y eventos «X min antes», sonido, notificaciones; agenda5_avisados) · migracion-ui.js · confirmar.js
  vistas/ hoy · recordatorios · agenda · areas · mas (Seguimiento/Finanzas/Notas) · datos (#datos, explorador) · papelera · ajustes · comun
fuentes/ iconos/ pruebas/
```
- Las acciones se declaran con `data-acc="nombre"`; cada vista exporta `acciones` y `app.js` las junta. Si una acción devuelve `true`, se repinta.
- Todo texto del usuario pasa por `esc()` antes de ir al HTML.
- Navegación: celular = barra inferior **Hoy · Recordatorios · Agenda · Áreas · Más** + botón `+`; laptop (≥980 px) = barra lateral.

## Sistema de diseño «Señal»
Estilo de la v4.5 (paleta «Negro») + toque técnico y didáctico. Todo color sale de `css/tokens.css`.
- Oscuro (por defecto): fondo `#000000`, tarjetas `#121214`, bordes `#26262A`, texto `#F5F5F7/#A1A1A6/#8A8A90`, acento `#1D45C4` (texto de acento `#7B9AF2`).
- Claro: fondo `#FFFFFF`, tarjetas `#F4F4F6`, acento `#1A3FB0`.
- Áreas (colores de los espacios de la v4.5): Personal azul `#5AA9FF`/`#1F6FEB`, Estudios turquesa `#2DD4BF`/`#0F8F80`, Oficina gris pizarra `#94A3B8`/`#56606B`, Deporte verde `#4ADE80`/`#1E8A4C` (oscuro/claro). Clase `area-<id>` define `--a`, `--as`, `--at`.
- Letras: **Plus Jakarta Sans** (todo; títulos 800 y apretados) y **Martian Mono** (etiquetas, horas, cifras).
- Tarjetas con radio 20 px, borde fino y brillo de color en la esquina superior derecha. Fondo con cuadrícula muy tenue.
- Lo didáctico: botón `?` = modo guía (`.explica` en cada bloque) y recorrido de bienvenida de 5 pasos.
- Muestra interactiva aprobada: https://claude.ai/artifact/FAdVxRKpo7NFwL93x1X9B4

## Datos de la v4.5 (inventario: nada se puede perder)
Claves en el navegador: `agenda_datos_v1` (agenda: perfil + 25 colecciones), `ledger_finanzas_simple_v1` y `ledger_oficina_v1` (libros `{transactions:[{id,date,desc,type,amount,cat}]}`, con copias `…_base`), `agenda_pref`, `agenda_tema`, `agenda_paleta`, `agenda_pin` `{sal,hash,largo}` (SHA-256 de «sal:pin»), `agenda_nube_cfg` y `libro_cuentas_db_cfg`/`oficina_cuentas_db_cfg` (jsonbin.io: `{key,bin}`), `agenda_foco`, `agenda_reloj`, `agenda_palabras`, `agenda_avisados`, `agenda_sync_estado`, `agenda_respaldo_ult`, `agenda_desde`, `agenda_errores`, `agenda_qh_oculto`, `agenda_ejemplos*`.
Colecciones de la agenda (todas con `id`, `upd`, `del/delEn`, y casi todas `esp` = área): tareas, eventos, recordatorios, notas, listas, habitos, metas, pagos, diario, enfoque, cursos, entrenos, rutinas, medidas, bienestar, cobros, deudas, proyectos, horas, clientes, casa, menu, docs, fichas, revisiones. Detalle de campos: ver el código de `agenda-v4.5-original/agenda-completa.html` (editores `editar*` y `cargarEjemplos`).
Nube v4.5: **jsonbin.io** (no Supabase), 3 bins (agenda + 2 libros), mezcla por elemento según `upd`.
Fallos conocidos de la v4.5 que la v5 corrige: PIN nunca se releía al abrir (y no había botón); Pomodoro inaccesible; «1,250» se guardaba como 1.25; respaldo reemplazaba los libros; borrados olvidados a los 60 días podían revivir.

## Modelo de datos v5 (implementado en la Fase 2)
Se guarda en `agenda5_datos`: `{ v, creado, perfil:{nombre, presupuesto(céntimos), antiguo}, items:[…], migracion:{fecha, informe, verificacion, copia} }`.
Cada elemento (ver `js/datos/modelo.js`): `{ id, tipo, area, titulo, prioridad: 'alta'|'media'|'baja', estado: 'pendiente'|'en_curso'|'hecho'|'cancelado', fechas: { inicio, fin, vence, hora, horaFin }, todoElDia, etiquetas: [], plazoLegal, repetir, aviso, lista, notas, monto (céntimos), extra: {…valores del tipo ya en formato nuevo…}, creado, actualizado, borrado, datos: {…lo original de la v4.5 que el modelo no usa, INTACTO…}, origen: { coleccion, id, indice, quitados } }`.
- Tipos: pendiente, lista (extra.clase: recordatorios | checklist | proyecto), evento, nota, habito, meta, pago, movimiento (extra.libro, extra.ingreso, extra.categoria), diario, enfoque, curso, entreno, rutina, medida, bienestar, cobro, prestamo, horas, cliente, casa, menu, documento, ficha, revision, otro (colecciones desconocidas).
- Ids nuevos deterministas: `<coleccion>_<idViejo>` (p. ej. `tareas_abc`, `mov_personal_xyz`, `listas_l1_i1`), así migrar o importar dos veces no duplica. Listas del sistema: `lista_recordatorios`, `lista_tareas` (actualizado 0).
- Pendientes: `fechas.inicio` = día en que se hace (vacío = algún día), `fechas.hora` (si es más tarde que ahora → grupo «Más tarde»), `fechas.vence` = plazo; `extra.hechoEn`, `extra.historial` (fechas en que se hizo uno que se repite), `extra.subtareas`, `extra.minutos` (foco). Lista «para marcar» = `extra.clase:'checklist'` (no entra en «Todos» salvo que tenga fecha).
- Enfoque del día: id `enfoque_AAAA-MM-DD`, `extra.prioridades [{t,ok,ref}]`, `extra.minutosArea`, `extra.pomos` (lo de la v4.5 queda en `datos.items/pomos/pomosEsp` y se lee si no hay lo nuevo).
- Lo nuevo es la fuente de verdad; `datos` es histórico (no se mantiene sincronizado al editar).
- **Tareas y recordatorios se unen en «pendientes»**, agrupados en **listas** (Recordatorios) y vistos en el calendario (Agenda). Las listas antiguas (Compras…) se vuelven listas con sus ítems como pendientes; los recordatorios sueltos van a la lista «Recordatorios».
- Áreas = lista editable (nombre, color, ícono). `esp` → `area`; la etiqueta libre `area` → `etiquetas`. Prioridad 3→Alta, 2→Media, 1 y 0→Baja (se guarda la original).
- Movimientos de los dos libros entran al mismo almacén (céntimos).
- Migración (automática al abrir, después del PIN): 1) copia literal de todas las claves antiguas en IndexedDB, releída para comprobarla (si no se puede, se exige descargarla antes); 2) conversión; 3) verificación: `reconstruir(item)` debe dar EXACTO cada objeto original (orden, conteos, ids, campos desconocidos incluidos) — si uno falla, se cancela y no se guarda nada; 4) se guarda y se relee; 5) las claves antiguas no se borran nunca. «Traer de nuevo» (Ajustes) repite el proceso y junta.
- Respaldo: exporta `{app:'agenda', formato:'agenda5', version:1, exportadoEn, datos}`. Importa v5, respaldo completo v4.5 (`{app:'agenda', version:2, agenda, cuentas, oficina}`), agenda sola y libro suelto (nombre con «oficina» → libro de oficina). Siempre JUNTA (gana `actualizado` mayor) tras guardar copia automática. Aviso si pasan más de 7 días sin respaldo.
- Papelera: `borrado` = fecha; 30 días; borrar una lista se lleva sus elementos (extra.conLista) y restaurarlos los devuelve; se purga sola al cargar.
- Nube: la v5 usará **bins nuevos** y nunca escribirá los antiguos (solo los lee una vez para migrar).

## Fases
1. ✅ **Cimientos**: carpetas, diseño Señal, navegación, formato Lima/soles, PIN arreglado y compatible, bloqueo automático, Ajustes (preferencias, seguridad, ayuda), modo guía y recorrido, manifiesto.
2. ✅ **Datos**: modelo v5, migración automática con copia (IndexedDB) y verificación exacta, explorador «Tus datos», respaldo exportar/importar (v5 y v4.5, junta sin duplicar), copias automáticas descargables, papelera 30 días, aviso de respaldo >7 días, áreas con conteos reales. SW `agenda-v28`. 42 pruebas (incl. ejemplos v4.5 y datos «raros» en `pruebas/datos/`).
3. ✅ **Hoy + Recordatorios**: Hoy con avance, urgente (plazo legal primero, 🔴/⚠️), recordatorios de hoy, 3 prioridades (escribir o elegir), día en bloques (eventos con repetición, clases, pendientes con hora), Pomodoro vinculado (suma minutos al pendiente y al área; modo prueba), balance y aviso de sobrecarga (>85 %). Recordatorios con listas (recordatorios / para marcar), grupos por cuándo, crear varios por líneas entendiendo fechas, editor completo, deslizar, cerrar el día con deshacer. Agregar rápido guarda. Avisos a la hora (Ajustes → Avisos). SW `agenda-v29`. 54 pruebas.
4. ✅ **Agenda**: Día (línea de tiempo con carriles solo donde algo se pisa; tocar una hora crea evento), Semana y Mes (puntos por área, 🔴/⚖️), filtro por área, «Vence este día» (pagos fijos con casilla que anota el gasto, cobros, documentos; plazo legal primero), feriados del Perú (se pueden ocultar), crear/editar eventos (tipo, área, varios días, repetir, aviso), avisos de eventos, pasar al calendario del teléfono (.ics y Google). SW `agenda-v30`. 59 pruebas.
5. Áreas: 4 paneles y sus herramientas (sesiones de estudio para exámenes, entrenos como hábito con racha y aviso).
6. Seguimiento: hábitos, metas, rachas, revisión semanal, balance y sobrecarga.
7. Finanzas y Notas (libros integrados, informes).
8. Ajustes/Administración completo (áreas, etiquetas, respaldo con aviso a los 7 días, papelera, estado de nube) + nube (con permiso del usuario).
9. Teclado propio mejorado + autocorrector (el usuario pidió mantenerlo y mejorarlo mucho).
10. Pulido, accesibilidad, rendimiento y publicación.
