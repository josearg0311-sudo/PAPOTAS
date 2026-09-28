# Agenda · tu organización personal

Un solo programa con todo lo que hace falta para organizarse, y con el
**Libro de Cuentas dentro**. Funciona en el teléfono y en el ordenador, se
instala como aplicación y abre sin internet.

## Qué trae

| Sección | Para qué |
|---|---|
| **Hoy** | Tu día de un vistazo: saludo, lo que toca hoy en orden de hora, tareas pendientes, el *enfoque del día* (las 3 cosas que importan), hábitos por marcar, la semana, el dinero del mes y las notas fijadas. |
| **Tareas** | Actividades por hacer con fecha, hora, prioridad, área (#trabajo, #casa…), subtareas, notas y repetición. Filtros: Hoy, Próximas, Pendientes, Algún día y Hechas. |
| **Calendario** | Mes completo con lo que hay cada día, o vista *Agenda* con los próximos 90 días. Eventos de un día o de varios, de todo el día o con hora, con lugar, color, aviso y repetición (cumpleaños cada año, gimnasio de lunes a viernes…). |
| **Recordatorios** | Te avisan a la hora (aviso en pantalla, sonido y notificación del sistema). Se pueden posponer, repetir y marcar como hechos. |
| **Listas** | Listas para marcar: compras, maleta, limpieza, pelis… Con plantillas, y se desmarcan enteras para reutilizarlas. |
| **Hábitos** | Marca cada día lo que cumples, elige qué días de la semana tocan, y mira la racha 🔥 y el porcentaje del mes. |
| **Notas** | Ideas y datos sueltos, con color, buscador y la opción de fijarlas en Hoy. Se guardan solas mientras escribes. |
| **Cuentas** | Tu libro de ingresos y gastos de siempre, entero, con su resumen, Excel, PDF y nube. |

Además: **buscador** que mira en todo, **botón +** que añade lo que toque
según dónde estés, **tema claro u oscuro** y las **cuatro paletas** de Cuentas
(se cambian en un sitio y cambian en los dos), y atajos de teclado en el
ordenador (`n` añadir, `/` buscar, `1`–`8` secciones).

## Escribir como hablas

En la caja de *Añadir*, la agenda entiende fechas y horas en español:

- `pagar la luz el viernes a las 6 !!` → viernes, 18:00, prioridad media
- `dentista 15/10 9:30 #salud` → 15 de octubre, 9:30, área Salud
- `reunión pasado mañana 4pm`, `llamar en 3 días`, `cena hoy a las 8 de la noche`
- `!` baja, `!!` media, `!!!` alta · `#palabra` pone el área

Debajo de la caja se ve cómo lo ha entendido antes de guardarlo.

## Sobre los avisos (léelo)

Una página web **solo puede avisar mientras está viva**: abierta, o en
segundo plano desde hace poco. Con la aplicación instalada y los avisos
activados (Ajustes → Avisos) funciona bien en el día a día.

Para lo que **no puede fallar** —citas, pagos, medicinas— cada evento y
recordatorio tiene un botón **Google** (lo pasa a Google Calendar, que en
Android abre la app) y otro **.ics** (iPhone lo abre en su Calendario). Ahí
suena siempre, aunque el teléfono esté bloqueado. En Ajustes también se puede
descargar todo junto en un solo `.ics`.

## Tus datos

- Viven en el navegador de cada aparato, igual que los de Cuentas.
- **Sincronizar**: Ajustes → *Sincronizar entre aparatos*. Usa tu misma cuenta
  gratuita de jsonbin.io de Cuentas (si ya la tienes puesta en Cuentas, la
  llave aparece rellena) y crea una base aparte para la agenda. En el segundo
  aparato se pega el código que da el primero. Si cambias cosas en dos
  aparatos a la vez, se juntan: gana el cambio más reciente de cada cosa, no
  el de un aparato entero.
- **Respaldo**: Ajustes → *Descargar* guarda en un archivo la agenda **y**
  las cuentas. *Cargar* lo junta con lo que ya hay.

## Archivos

    index.html              la agenda
    cuentas.html            el Libro de Cuentas (copia de ../libro-de-cuentas/index.html)
    sw.js                   para instalarla y que abra sin conexión
    manifest.webmanifest    nombre, iconos y accesos directos de la aplicación
    icono.svg, icon-*.png, apple-touch-icon.png

## Publicar

Sube **la carpeta `agenda` entera** al mismo sitio de siempre (Netlify: arrastra
la carpeta sobre tu sitio fijo → Deploys). Tiene que ser `https` para poder
instalarla y recibir avisos.

- **Android (Chrome)**: menú ⋮ → *Instalar aplicación*, o Ajustes → Instalar.
- **iPhone (Safari)**: Compartir → *Añadir a pantalla de inicio*.
- **Ordenador (Chrome/Edge)**: el icono de instalar en la barra de direcciones.

Ojo: si la publicas en una dirección **distinta** de donde tenías Cuentas, tus
cuentas no aparecerán solas (los datos se guardan por dirección). Pásalas con
el respaldo de Cuentas (Cuentas → ⋯ → Descargar respaldo, y en la nueva
dirección Cargar respaldo), o conecta la misma nube de jsonbin.

Si algún día cambias el Libro de Cuentas en `libro-de-cuentas/index.html`,
copia ese archivo encima de `agenda/cuentas.html` para que la agenda lo lleve.
