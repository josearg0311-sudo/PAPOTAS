# Cuentas y Personal

Dos aplicaciones nuevas, hechas desde cero, cada una en su carpeta. Cada carpeta
se publica tal cual y se instala como app por separado.

| | Carpeta | Dirección (GitHub Pages) |
|---|---|---|
| **Cuentas** | `cuentas/` | https://josearg0311-sudo.github.io/PAPOTAS/cuentas/ |
| **Personal** | `personal/` | https://josearg0311-sudo.github.io/PAPOTAS/personal/ |

Con Netlify Drop: arrastra la carpeta `cuentas` (o `personal`) entera.

## Cuentas: ingresos y gastos, personales y de oficina
- Cada movimiento se marca como **Personal** u **Oficina**. Arriba eliges ver
  **Todo**, solo **Personal** o solo **Oficina**; resumen, movimientos,
  pendientes y la exportación a Excel siguen esa elección.
- En «Todo», una tabla compara este mes lo personal con la oficina: ingresos, gastos y resultado.
- Categorías separadas para personal y oficina (oficina: alquiler, sueldos,
  proveedores, impuestos…). Se editan en Ajustes.
- Cuentas (efectivo, banco, caja de oficina…) marcadas como personales, de oficina o de las dos.
- Transferencias entre cuentas, y pendientes por cobrar o por pagar.

## Personal: agenda y recordatorios
- **Hoy**: agenda del día, recordatorios pendientes y atrasados, y lo que viene en los próximos 7 días.
- **Agenda**: calendario del mes con puntos en los días ocupados. Eventos con
  hora de inicio y fin, lugar, color, notas, aviso previo y repetición
  (diaria, semanal, mensual o anual). En los que se repiten se puede borrar solo un día.
- **Recordatorios**: con día, hora y repetición. Al marcar uno que se repite, pasa solo a la próxima vez.
- **Avisos**: notificación a la hora de cada cosa mientras la app está abierta
  o en segundo plano. Para que suene aunque la app esté cerrada, usa
  **«Al calendario del teléfono»**: lo guarda en el calendario del móvil con su alarma.
- **Notas**, que se pueden fijar en la pantalla Hoy.

## Sincronización entre aparatos (opcional)
En **Ajustes → Sincronización** de cada app hay dos maneras:

**jsonbin.io (X-Master-Key)**: la más sencilla.
1. Entra en jsonbin.io → **API Keys** y copia tu **X-Master-Key**.
2. Pégala en la app y pulsa **Conectar**. Se crea sola una caja privada
   (`cuentas-sync` o `personal-sync`) con tus datos.
3. En el otro aparato pega la misma X-Master-Key: encuentra la misma caja.
   Si no la encuentra, usa **«Conectar otro aparato»** (copia un enlace para
   abrir allí) o pega el **código de la caja** que aparece en Ajustes.

Con jsonbin se sincroniza al guardar, al volver a la app y cada 2 minutos,
para gastar pocas peticiones del plan gratis. Ese plan limita las peticiones
y el tamaño de cada caja; si se llega al límite, la app lo dice en Ajustes y
todo sigue funcionando en el aparato.

**Supabase**: la misma nube que PAPOTAS (botón «Usar la misma nube que
PAPOTAS») u otra, en la tabla `papotas_sync_records` con colecciones
`cuentas.*` y `personal.*`, que PAPOTAS ignora.

En las dos maneras, sin internet todo sigue funcionando y se sube al volver
la conexión. Si dos aparatos tenían cosas distintas al conectarse, se juntan.
El enlace de «Conectar otro aparato» lleva tu clave: no se lo pases a nadie.

## Los datos
Se guardan en el navegador del teléfono, no en internet. Nadie más los ve, pero
si se borran los datos del navegador se pierden: usa **Ajustes → Descargar
respaldo** de vez en cuando. Borrar cualquier cosa se puede deshacer durante unos segundos.
