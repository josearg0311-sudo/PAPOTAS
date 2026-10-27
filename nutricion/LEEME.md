# Balanza & Plato

App de nutrición y control de peso para la familia: perfiles, cuestionario inicial,
recetas peruanas, plan semanal, lista de compras con costo, ejercicio, ayuno,
progreso, fotos y escáner de códigos de barras.

Se publica sola en **https://josearg0311-sudo.github.io/PAPOTAS/nutricion/** cada vez
que se sube un cambio (ver `.github/workflows/publicar.yml`). Ábrela en Chrome y pulsa
«Instalar» para tenerla como app y que funcione sin internet.

## Sincronizar los celulares de la familia (Supabase)

1. En supabase.com abre tu proyecto (puede ser el mismo de PAPOTAS).
2. En **SQL Editor** pega el contenido de `supabase.sql` y pulsa **Run**.
3. En **Project Settings → API** copia la URL y la clave pública.
4. En la app: **Mi perfil → Sincronizar entre celulares**, pega la URL y la clave,
   pulsa **Generar uno nuevo** (código de familia) y **Conectar**.
5. Pulsa **Copiar datos para otro celular** y mándalo por WhatsApp. En cada celular,
   en la pantalla de entrada pulsa **Conectar con mi familia** y pega el mensaje.

El código de familia es la llave: quien lo tenga ve los datos. Las fotos no se suben;
se quedan en el celular donde se tomaron.

## Pruebas

```
node nutricion/pruebas/prueba.js
```

Abre la app en un navegador real (Playwright con Chromium), simula dos celulares y una
base de Supabase de prueba, y revisa perfiles, cuestionario, unidades, deshacer, escáner,
sincronización, recetas para la familia, presupuesto, gasto real y la vista de celular.

## Archivos

- `index.html`: toda la app.
- `zxing.min.js`: lector de códigos de barras (ZXing, licencia Apache 2.0).
- `supabase.sql`: preparación de la base para sincronizar.
- `sw.js`, `manifest.webmanifest`, iconos: lo necesario para instalarla.
