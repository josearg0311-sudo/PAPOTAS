# Agenda · tu organización personal

Un solo archivo (`index.html`) con todo dentro: la agenda, tus **gastos
personales**, las **cuentas de la oficina**, el logo y lo necesario para
instalarla en el celular. Funciona en el teléfono y en el ordenador.

## Qué trae

**Organizar**

| Sección | Para qué |
|---|---|
| **Hoy** | Saludo con la frase del día y el avance de tus tareas, lo que toca hoy por horas, el *enfoque del día* (las 3 cosas que importan), tareas pendientes (con «pasar las atrasadas a hoy»), hábitos, cómo te sientes, pagos por vencer, metas, próximos cumpleaños, la semana, el dinero del mes de los dos libros y las notas fijadas. |
| **Tareas** | Con fecha, hora, prioridad, área (#trabajo…), subtareas, notas y repetición. Botón → para pasar una tarea a mañana. Filtros: Hoy, Próximas, Pendientes, Algún día, Hechas. |
| **Calendario** | Mes completo o vista Agenda. Eventos de uno o varios días, con lugar, color, aviso y repetición. **Cumpleaños**: se repiten solos cada año y, si pones el año, dice cuántos cumple. |
| **Recordatorios** | Suenan a su hora, se posponen, se repiten. |
| **Listas** | Para marcar: compras, maleta, limpieza… con plantillas y «desmarcar todo». |
| **Notas** | Con color, buscador y fijadas en Hoy. Se guardan solas. |

**Crecer**

| Sección | Para qué |
|---|---|
| **Hábitos** | Marca cada día, elige qué días tocan, mira la racha 🔥. |
| **Metas** | Un número que alcanzar (ahorrar S/ 2000, leer 12 libros…). Se suma de a poco; te dice cuánto falta y a qué ritmo ir para llegar a la fecha. Confeti al lograrla. |
| **Enfoque** | Temporizador pomodoro (25 / 5 / 15 min, ajustables). Elige una tarea, concéntrate y descansa. Sigue contando aunque cambies de sección, y se ve en la cabecera. |
| **Diario** | Cómo te sientes (😢 a 😄) y unas líneas del día. El mes entero en caritas. |
| **Progreso** | Tareas hechas en 14 días, racha, sesiones de enfoque, ánimo del mes, hábitos y metas. |

**Dinero**

| Sección | Para qué |
|---|---|
| **Dinero** | Los dos libros de un vistazo: lo que quedó este mes, cuánto entró y salió, si gastas más o menos que el mes pasado *a estas alturas*, tu mayor gasto, hacia dónde vas a fin de mes, presupuesto mensual con lo que te queda por día, los últimos 6 meses en gráfica, en qué se te va el dinero y los últimos movimientos. Y un formulario para **anotar un gasto o ingreso en segundos** en Personal u Oficina (se guarda en ese libro y en su nube). |
| **Pagos fijos** | Luz, agua, internet, alquiler, tarjeta… Monto y día de vencimiento. Cada mes los marcas pagados; avisa 2 días antes y el mismo día. Total del mes, pagado y lo que falta. |
| **Gastos personales** | Tu Libro de Cuentas de siempre, ya con el diseño y el logo de la agenda. Lo que ya tenías en Cuentas aparece aquí tal cual. |
| **Oficina** | Otro libro igual pero **aparte**: sus propios movimientos, su propia nube, sus Excel y PDF con el nombre de la oficina. |

Además: buscador que mira en todo, botón **+** que añade según dónde estés,
**PIN** para que nadie cotillee (Ajustes → Privacidad), tema claro u oscuro y
cuatro paletas de color, y atajos de teclado (`n` añadir, `/` buscar, `1`–`9`).

## Escribir como hablas

- `pagar la luz el viernes a las 6 !!` → viernes, 18:00, prioridad media
- `dentista 15/10 9:30 #salud` → 15 de octubre, 9:30, área Salud
- `reunión pasado mañana 4pm`, `llamar en 3 días`, `cena hoy a las 8 de la noche`

## Instalarla en el celular (con su logo)

Tiene que abrirse desde una dirección **https**:

- **GitHub Pages** (ya montado en el repositorio): se publica sola en
  `https://josearg0311-sudo.github.io/PAPOTAS/agenda/`. La dirección no cambia
  nunca, así que los datos no se "mudan".
- **Netlify**: arrastra la carpeta `agenda` (o solo el `index.html`) sobre tu sitio.

Luego: Android (Chrome) → menú ⋮ → *Instalar aplicación*; iPhone (Safari) →
Compartir → *Añadir a pantalla de inicio*. Sale con el logo del calendario y
el check verde.

`index.html` solo ya se instala con su logo. `sw.js` al lado hace además que
abra sin internet.

## Sobre los avisos

Una página web solo avisa mientras está viva (abierta o en segundo plano
reciente). Para lo que no puede fallar, cada evento y recordatorio tiene los
botones **Google** y **.ics** que lo pasan al calendario del teléfono, que
suena siempre.

## Tus datos

- Viven en el navegador de cada aparato. **Respaldo** (Ajustes → Tus datos)
  guarda en un archivo la agenda y los dos libros.
- **Sincronizar**: la agenda con tu cuenta gratuita de jsonbin.io (Ajustes);
  cada libro de cuentas tiene su propia nube en su menú ⋯.
- El PIN tapa la agenda, no cifra los datos. Si lo olvidas no se puede
  recuperar: guarda un respaldo.

## Para quien toque el código

`index.html` se **genera**: no lo edites a mano. Edita `fuente/estilo.css`,
`fuente/cuerpo.html` o `fuente/app.js` y ejecuta:

    python3 agenda/construir.py

Eso mete también dentro el Libro de Cuentas (`../libro-de-cuentas/index.html`)
y los iconos. Si cambias Cuentas, vuelve a ejecutarlo.
