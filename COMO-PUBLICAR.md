# PAPOTAS · publicar, sincronizar e instalar

## 1. Qué subir

Sube estos archivos juntos, en la misma carpeta:

    index.html            el programa
    sw.js                 para que se instale y abra sin conexión
    manifest.webmanifest  nombre e iconos de la aplicación
    icon-192.png
    icon-512.png
    respaldo.json         opcional: tus datos de partida (ver punto 3)

Y aparte, para preparar Supabase una sola vez (no se sube al sitio):

    supabase.sql          lo pegas en el SQL Editor de Supabase

Sirve cualquier alojamiento gratuito con **https** (Netlify arrastrando la
carpeta, GitHub Pages, Vercel). Tiene que ser https: sin él el navegador no
deja instalar ni funcionar sin conexión.

`index.html` sigue funcionando solo, sin los demás archivos, como hasta ahora.

## 2. Conectar Supabase (una sola vez, para TODOS los dispositivos)

La forma cómoda: escribir la conexión dentro del propio `index.html`. Así
cualquier dispositivo que lo abra entra ya sincronizado, sin tocar Ajustes.

1. En supabase.com, tu proyecto: **Settings → API**. Copia:
   - **Project URL** (`https://xxxxxxxx.supabase.co`)
   - **anon public** (la clave larga; la `service_role` NUNCA)
2. Abre `index.html` con el Bloc de notas y busca, cerca del principio,
   `TU CONEXIÓN A SUPABASE`. Rellena las dos líneas:

       window.PAPOTAS_NUBE = {
         url:  "https://xxxxxxxx.supabase.co",
         anon: "eyJ...la clave larga..."
       };

3. Guarda. Si aún no has preparado la base, ejecuta el SQL una vez en
   Supabase: **SQL Editor → New query**, pega el contenido de `supabase.sql`
   (viene en esta carpeta; el botón **Copiar SQL** de Ajustes → Nube da lo
   mismo) y pulsa **Run**. Eso crea la tabla, las funciones, los permisos y
   activa el tiempo real. Se puede ejecutar las veces que quieras sin romper
   nada, y hace falta una sola vez para todos los dispositivos, no uno por
   aparato.
4. Ya está. Ese mismo archivo, abierto en el móvil o subido a tu enlace, entra
   solo y con todos los datos.

Si en un dispositivo escribes a mano otra conexión distinta en Ajustes, ese
dispositivo se queda con la tuya y deja de hacer caso a la del archivo.

Aviso, una vez: la clave anon viaja dentro del archivo. Quien tenga el archivo
o la dirección donde lo publiques puede leer y escribir tus datos. Para uso
personal con un enlace que no repartes, va bien. Si subes el archivo a un
repositorio público, la clave queda a la vista de cualquiera.

### La forma manual (si prefieres no escribir nada en el archivo)

1. Crea un proyecto en supabase.com.
2. En el proyecto: **Settings → API**. Copia dos cosas:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** (la clave larga; la `service_role` NO se usa nunca aquí)
3. En PAPOTAS: **Ajustes → Nube**, pega las dos en sus casillas y pulsa
   **Copiar SQL**.
4. En Supabase: **SQL Editor → New query**, pega lo copiado y **Run**.
   Eso crea la tabla, las dos funciones, los permisos y activa el tiempo real.
5. Vuelve a PAPOTAS y pulsa **Guardar**. Verás "🟢 Sincronizado" y subirá lo
   que ya tengas. Antes de subir nada guarda una copia local de seguridad.
6. En el segundo dispositivo: abre la misma dirección, pega **la misma URL y
   la misma clave**, Guardar. Se traerá todo.

**Probar conexión** te dice si la tabla y las funciones están bien.

### El enlace de emparejamiento (la forma rápida desde el móvil)

Sirve para no volver a escribir la URL ni la clave nunca más.

1. En el dispositivo que YA está conectado: **Ajustes → Nube → Enlace para
   otro dispositivo**. Se copia un enlace al portapapeles (si el navegador no
   deja copiar, sale en pantalla para copiarlo a mano).
2. Mándate ese enlace por WhatsApp, correo o como quieras, y ábrelo en el otro
   dispositivo. Con abrirlo basta: queda conectado y se trae todos los datos.
3. El enlace lleva la clave dentro, así que el programa la borra de la barra de
   direcciones nada más entrar. Aun así, trátalo como una contraseña: no lo
   publiques en ningún sitio abierto.

## 3. Que el sitio abra ya con tus datos

Al publicar, el navegador ve una dirección nueva y el programa abre vacío: tus
datos siguen guardados bajo el archivo viejo, no se han perdido. Para no tener
que importarlos a mano en cada aparato:

1. En el dispositivo que tiene los datos buenos: **Ajustes → Exportar
   respaldo**. Te baja un `papotas_respaldo_completo_….json`.
2. Renómbralo a **`respaldo.json`** y déjalo dentro de la carpeta, al lado de
   `index.html`.
3. Sube la carpeta. Listo.

A partir de ahí, cada dispositivo que abra el sitio por primera vez entra ya
con todo: clientes, cuentas, ventas, inversiones, ajustes y notas.

Las reglas, para que no te lleves sustos:

- Solo actúa si ese dispositivo está **completamente vacío**. Nunca pisa datos
  que ya tengas.
- Lo hace **una sola vez** por dispositivo. Si borras algo a propósito, no
  vuelve en la siguiente recarga.
- El primer arranque se recarga solo una vez. Es normal, dura un parpadeo.
- Si no pones `respaldo.json`, no pasa nada: el programa abre como siempre.
- Cuando quieras cambiar el punto de partida, exporta un respaldo nuevo y
  súbelo con el mismo nombre encima del anterior.

Y ojo con lo mismo de siempre: ese `respaldo.json` lleva tus datos dentro y
queda accesible para quien conozca la dirección del sitio. Es la contrapartida
de la comodidad. Si prefieres no dejarlo publicado, bórralo del sitio en cuanto
hayas sembrado tus dispositivos: los que ya entraron conservan todo.

## 4. Cómo sincroniza

- Registro a registro: cada cliente, cuenta, venta e inversión viaja por
  separado. No se pisan bloques enteros.
- Los cambios llegan al instante (canal en vivo de Supabase) y, por si acaso,
  se comprueba cada 30 segundos y cada vez que vuelves a la pestaña.
- Las bajas también viajan: si borras en un móvil, desaparece en el otro.
- Si dos dispositivos tocan **el mismo** cliente en el mismo momento, gana el
  último que guardó. Tocando clientes distintos, no hay conflicto posible.
- Sin internet sigues trabajando con normalidad; al volver la conexión, sube.
- Tus claves de Supabase NO se suben a la nube: se quedan en cada dispositivo.

## 5. Instalar como aplicación

- **Android (Chrome)**: menú ⋮ → *Instalar aplicación*.
- **iPhone / iPad (Safari)**: Compartir → *Añadir a pantalla de inicio*.
- **Windows / Mac (Chrome o Edge)**: el icono de instalar en la barra de
  direcciones.

Queda con su icono, a pantalla completa y abre sin conexión.

## 6. Si actualizas el programa

Sube el `index.html` nuevo encima. La próxima vez que se abra con internet se
coge la versión nueva (la copia guardada solo se usa cuando no hay red).

## 7. El programa nuevo (`papotas-nuevo.html`)

Es un segundo programa, con un diseño hecho de cero, que **convive** con el de
siempre. Los dos se suben juntos y cada uno tiene su dirección:

- `tusitio.netlify.app/` → el de siempre (`index.html`)
- `tusitio.netlify.app/papotas-nuevo.html` → el nuevo

Comparten los datos de verdad, no una copia:

- **En el mismo dispositivo** leen y escriben las mismas claves del navegador
  (`pap_clientes`, `pap_servicios`, `pap_ventas`…). Lo que cobras en uno, el
  otro lo ve al abrirlo.
- **El respaldo** es el mismo archivo `PAPOTAS_BACKUP_V10`: el que descargas de
  uno se carga en el otro sin tocar nada.
- **Supabase** es la misma tabla `papotas_sync_records` con las mismas
  funciones y los mismos nombres de colección, así que se sincronizan entre
  ellos igual que dos teléfonos.

Puedes usar el que quieras, o los dos, sin decidir nada todavía. Si un día te
quedas solo con el nuevo, basta con renombrarlo a `index.html`.
