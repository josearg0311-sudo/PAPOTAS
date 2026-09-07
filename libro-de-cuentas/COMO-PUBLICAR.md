# Cuentas · publicar e instalar

## Qué subir

Sube estos seis archivos juntos, en la misma carpeta:

    index.html              el programa
    sw.js                   para instalarlo y que abra sin conexión
    manifest.webmanifest    nombre e iconos de la aplicación
    icon-192.png
    icon-512.png
    icon-maskable-512.png   el que recorta Android

Vale cualquier alojamiento gratuito con **https**: Netlify arrastrando la
carpeta, GitHub Pages, Vercel. Tiene que ser https — sin él el navegador no
deja instalar ni funcionar sin conexión.

`index.html` sigue funcionando solo, sin los demás archivos: pierde el
"Instalar" de Android y el modo sin conexión, nada más.

## Instalar

- **Android (Chrome)**: te sale solo, o desde **Opciones → Instalar en este
  dispositivo**.
- **iPhone / iPad (Safari)**: Compartir → *Añadir a pantalla de inicio*.
  Safari nunca ofrece el aviso automático; hay que hacerlo a mano.
- **Windows / Mac (Chrome o Edge)**: el icono de instalar en la barra de
  direcciones, o el mismo botón de Opciones.

Queda con su icono, a pantalla completa y abre aunque no haya red.

## Los datos

Viven en el navegador de cada aparato. Para tenerlos en todos:

1. **Opciones → Sincronizar entre dispositivos**.
2. Crea una cuenta gratis en jsonbin.io, copia tu **X-Master-Key** y pégala.
3. **Crear la base automáticamente**.
4. En el otro aparato: **Opciones → Ver código de sincronización** en el
   primero, y pegar ese código en el segundo.

Y aparte, **Opciones → Descargar respaldo JSON** guarda una copia completa
cuando quieras.

## Al actualizar

Sube el `index.html` nuevo encima. La próxima vez que se abra con internet se
coge la versión nueva; la copia guardada solo se usa cuando no hay red.
