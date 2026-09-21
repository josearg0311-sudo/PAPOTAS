# PAPOTAS · publicarlo e instalarlo

## Lo primero: por qué hay que publicarlo

Abrir el archivo desde el gestor de archivos del celular **funciona, pero es
frágil**, y conviene saber por qué antes de meter ochenta clientes a mano:

- **Los datos se pueden perder.** Android puede dar una dirección distinta
  cada vez que abre el mismo archivo. El navegador guarda por dirección, así
  que lo que metiste ayer puede no aparecer hoy. No se borró: quedó en una
  dirección a la que ya no se llega.
- **No se puede instalar** en la pantalla de inicio.
- **No funciona sin internet.**

Las tres cosas las concede el navegador solo a una dirección **https** de
verdad. No es algo que el programa pueda arreglar por su cuenta.

Publicarlo es gratis y se hace una vez.

---

## La forma más rápida: GitHub Pages (tu repositorio ya está listo)

El repositorio ya trae preparado el publicador automático. Solo falta
encenderlo, y es **un clic**:

1. Entra a tu repositorio en GitHub.
2. **Settings** (arriba) → **Pages** (menú de la izquierda).
3. En **Source**, elige **GitHub Actions**.

Ya está. Cada vez que se suba un cambio, se publica solo. A los dos minutos
tendrás la dirección, con esta forma:

    https://TU-USUARIO.github.io/PAPOTAS/

Abre esa dirección **en el celular**, y verás que el navegador te ofrece
«Añadir a pantalla de inicio» o «Instalar aplicación». Acéptalo: a partir de
ahí se abre como una aplicación, con su icono, sin barra de navegador, y
funciona sin cobertura.

En esa dirección la portada es el programa nuevo. El de siempre queda en
`/anterior.html` por si alguna vez hace falta volver a él.

---

## Si prefieres otro sitio

Sirve cualquier alojamiento con **https**. Por ejemplo Netlify: entras a
`app.netlify.com/drop` y arrastras la carpeta. En diez segundos tienes
dirección.

Sube estos archivos **juntos, en la misma carpeta**:

    papotas-nuevo.html        el programa
    index.html                el de siempre (opcional)
    sw.js                     para instalarlo y abrirlo sin conexión
    manifest.webmanifest      nombre e iconos
    icono.svg
    icon-192.png
    icon-512.png
    icon-maskable-192.png     estos dos son los que usa Android, que recorta
    icon-maskable-512.png     el icono en círculo
    apple-touch-icon.png      el del iPhone

Si subes solo algunos, te queda el icono viejo en unos sitios y el nuevo en
otros.

---

## Pasar tus datos al programa publicado

Si ya metiste datos abriendo el archivo suelto, **no se copian solos**: para
el navegador son dos sitios distintos. Se hace así:

1. En el programa donde tienes los datos: **Ajustes → Tus datos → Bajar
   respaldo**. Se descarga un archivo.
2. Abre la dirección publicada.
3. **Ajustes → Tus datos → Restaurar** y elige ese archivo.

Hazlo **antes** de seguir metiendo clientes, para no tener que hacerlo dos
veces.

---

## Que se vea igual en el celular y en la laptop

Con la dirección publicada ya tienes el programa en los dos sitios, pero
cada aparato guarda lo suyo. Para que compartan los mismos datos hay que
conectar la nube, y eso está explicado más abajo.

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
