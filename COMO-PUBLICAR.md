# PAPOTAS · publicar, sincronizar e instalar

## 1. Qué subir

Sube estos **cuatro archivos juntos**, en la misma carpeta:

    index.html            el programa
    sw.js                 para que se instale y abra sin conexión
    manifest.webmanifest  nombre e iconos de la aplicación
    icon-192.png
    icon-512.png

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

3. Guarda. Si aún no has preparado la base, abre el programa una vez, ve a
   **Ajustes → Nube**, pulsa **Copiar SQL** y ejecútalo en Supabase
   (**SQL Editor → New query → Run**). Eso crea la tabla, las funciones, los
   permisos y activa el tiempo real. Solo hace falta una vez, no por
   dispositivo.
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

## 3. Cómo sincroniza

- Registro a registro: cada cliente, cuenta, venta e inversión viaja por
  separado. No se pisan bloques enteros.
- Los cambios llegan al instante (canal en vivo de Supabase) y, por si acaso,
  se comprueba cada 30 segundos y cada vez que vuelves a la pestaña.
- Las bajas también viajan: si borras en un móvil, desaparece en el otro.
- Si dos dispositivos tocan **el mismo** cliente en el mismo momento, gana el
  último que guardó. Tocando clientes distintos, no hay conflicto posible.
- Sin internet sigues trabajando con normalidad; al volver la conexión, sube.
- Tus claves de Supabase NO se suben a la nube: se quedan en cada dispositivo.

## 4. Instalar como aplicación

- **Android (Chrome)**: menú ⋮ → *Instalar aplicación*.
- **iPhone / iPad (Safari)**: Compartir → *Añadir a pantalla de inicio*.
- **Windows / Mac (Chrome o Edge)**: el icono de instalar en la barra de
  direcciones.

Queda con su icono, a pantalla completa y abre sin conexión.

## 5. Si actualizas el programa

Sube el `index.html` nuevo encima. La próxima vez que se abra con internet se
coge la versión nueva (la copia guardada solo se usa cuando no hay red).
