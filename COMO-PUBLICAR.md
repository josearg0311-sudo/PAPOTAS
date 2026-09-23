# Publicar PAPOTAS

El programa es **un solo archivo**: `papotas-nuevo.html`. Lo sueltas en
cualquier sitio que sirva direcciones `https://` y ya está. El icono, el
logo y todo lo que hace falta para instalarlo van metidos dentro del
archivo, así que no necesita nada al lado.

---

## Con Netlify (lo que ya usas)

1. Entra a **https://app.netlify.com/drop**
2. Arrastra el archivo `papotas-nuevo.html`, o mejor la **carpeta
   descomprimida del ZIP** (ver más abajo por qué).
3. Te da una dirección tipo `https://algo-random-123.netlify.app`.
4. Ábrela en el celular. Chrome pone **«Instalar»** al costado de la barra.

### La trampa: cada vez que sueltas, te da una dirección NUEVA

Y ahí está el problema de verdad, porque no es obvio:

> **Los datos se guardan por dirección, no dentro del archivo.**
> Tus clientes, tus cuentas y tus cobros viven en el navegador, atados a
> la dirección donde los metiste. Si publicas una versión nueva y Netlify
> te da otra dirección, el programa se muda y los datos se quedan.
> **No se borran** —vuelves al link viejo y ahí están— pero en el nuevo
> no aparecen.

Dos maneras de que no te pase:

**a) Sitio fijo (lo recomendado).** Crea una cuenta gratis en Netlify y
haz el primer Drop desde ella. Entonces el sitio es *tuyo*, tiene nombre
fijo, y para actualizar arrastras el archivo nuevo **sobre ese mismo
sitio** (Deploys → arrastra aquí). La dirección no cambia y los datos
siguen donde estaban.

**b) Respaldo a mano.** Antes de publicar una versión nueva:
Ajustes → Tus datos → **Descargar respaldo**. Y en la dirección nueva:
Ajustes → Tus datos → **Cargar un respaldo**.

**c) La nube.** Si conectas Supabase (Ajustes → La nube), los datos dejan
de depender de la dirección: se sincronizan solos entre cualquier
dirección y cualquier aparato. Es el único arreglo que no hay que
acordarse de hacer.

Si abres PAPOTAS en una dirección y sale vacío, el propio programa te lo
explica y te lleva a cargar el respaldo. No te asustes: no se perdió nada.

---

## El archivo solo, o el ZIP entero

| | Archivo solo | ZIP descomprimido |
|---|---|---|
| Se instala como aplicación | Sí | Sí |
| Funciona sin internet | No | **Sí** |
| Abre más rápido la segunda vez | No | **Sí** |

El ZIP trae el `sw.js`, que es lo que guarda el programa en el celular
para abrirlo sin datos. Si vas a usarlo a diario, sube el ZIP.

Qué lleva el ZIP:

```
index.html              el programa (portada)
papotas-nuevo.html      el mismo, por si enlazas a él por nombre
sw.js                   para que funcione sin internet
manifest.webmanifest    para instalarlo
icono.svg  icon-192.png  icon-512.png
icon-maskable-192.png  icon-maskable-512.png  apple-touch-icon.png
```

---

## Otras maneras

- **Cloudflare Pages** (`pages.cloudflare.com`): igual que Netlify,
  también con arrastrar y soltar, también gratis.
- **GitHub Pages**: el repositorio ya trae el publicador montado
  (`.github/workflows/publicar.yml`). Publica solo en cada cambio, en la
  rama `gh-pages`. Solo hay que encenderlo una vez en
  `Settings → Pages → Source: Deploy from a branch → gh-pages → /(root)`.
  La ventaja frente a Netlify Drop: la dirección **nunca cambia**, así que
  el problema de arriba no existe. Está ahí por si algún día quieres
  dejarlo fijo sin crear cuenta en ningún sitio.

---

## Lo que NO funciona

Abrir el archivo desde el gestor de archivos del celular. La dirección
empieza por `content://` y el navegador no considera eso un sitio: no
ofrece instalar, no funciona sin internet, y Android puede darle una
dirección distinta cada vez —así que lo que metas un día puede no estar
al siguiente. El programa te avisa cuando lo abres así.
