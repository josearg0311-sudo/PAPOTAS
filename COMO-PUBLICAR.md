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

## 2. Conectar Supabase (una sola vez)

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
