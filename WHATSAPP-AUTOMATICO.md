# El disparador de WhatsApp

## Lo que había

El panel guardaba una URL y un token y **no los usaba jamás**. Ni una línea
del programa los leía. Prometía "envío 100% en segundo plano sin abrir
pestañas manuales" y seguía abriendo una pestaña de WhatsApp por cliente,
que tú tenías que enviar a mano.

## Lo que hay ahora

PAPOTAS habla directo con una instancia de **Evolution API** (que por dentro
usa Baileys). Con eso:

- Un mensaje a un cliente sale **sin abrir ninguna pestaña**.
- Una tanda entera sale sola, uno detrás de otro, con su ritmo, una barra de
  progreso, un botón de **Parar** y, al final, la lista de quién no recibió y
  por qué.

## Lo que NO puede hacer, y no hay manera

**Enviar con PAPOTAS cerrado.** Una página web no se ejecuta cuando no está
abierta. Para disparar recordatorios de madrugada sin tocar nada haría falta
un servicio corriendo en un servidor (un cron que lea tus datos y llame a
Evolution). Eso ya no es PAPOTAS: es otro programa al lado.

El texto del panel se corrigió para que no prometa eso.

## Qué necesitas: Evolution API. En tu propia laptop, gratis.

Evolution es gratis y de código abierto. Lo que suele costar es *dónde*
ponerlo — pero si envías unas pocas veces al mes, **no hace falta pagar
ningún servidor: se ejecuta en tu laptop, solo cuando lo vas a usar.**

Comprobado: PAPOTAS puede hablar con un Evolution en `localhost` tanto
abierto como archivo suelto (`file://`) como desde una dirección **https**
publicada. Los navegadores tratan `localhost` como de confianza, así que no
lo bloquean por mezclar https con http.

### Una sola vez

1. Instala **Docker Desktop** (docker.com, gratis para uso personal).
2. Abre una terminal y pega esto, cambiando la clave por una tuya:

        docker run -d --name evolution --restart unless-stopped -p 8080:8080 -v evolution_datos:/evolution/instances -e "AUTHENTICATION_API_KEY=pon-aqui-una-clave-larga" -e "AUTHENTICATION_TYPE=apikey" -e "DATABASE_ENABLED=false" -e "CORS_ORIGIN=*" -e "LOG_LEVEL=ERROR" evoapicloud/evolution-api:v1.8.7

   Tres detalles que importan:

   - **`evoapicloud/evolution-api`**, no `atendai/...`. El proyecto movió la
     imagen y la vieja ya no existe: `pull access denied`.
   - **`v1.8.7`, no `latest`.** La `latest` es la rama 2, que exige un
     PostgreSQL y un Redis aparte. La 1.8.7 se apaña sola con archivos, que
     es justo lo que quieres en una laptop.
   - El `-v` guarda la sesión de WhatsApp, para no reescanear el QR en cada
     arranque.

3. Abre `http://localhost:8080/manager` en el navegador, entra con tu clave,
   crea una instancia llamada `papotas` y **escanea el QR** con el WhatsApp
   desde el que quieras escribir.

### Cada vez que vayas a enviar

Enciende Docker Desktop y comprueba que el contenedor `evolution` está en
marcha. Si lo paraste:

        docker start evolution

Y ya. Con `--restart unless-stopped` arranca solo al encender la laptop.

### Lo que hay que saber

- **Solo envía desde esa laptop.** Desde el móvil no, porque el móvil no
  llega al `localhost` de tu laptop. Si algún día lo necesitas desde el
  móvil, ahí sí haría falta un servidor de verdad.
- **Con la laptop apagada no sale nada.** Es un programa en tu máquina.
- **La clave viaja en el navegador.** Como PAPOTAS lo usas solo tú y el
  servidor vive en tu propia laptop, no sale a internet: nadie de fuera
  puede llegar a `localhost`. Riesgo bajo.
- **WhatsApp puede bloquear números que mandan ráfagas.** Esto usa tu número
  normal, no una cuenta de empresa. Unas pocas decenas de mensajes al mes,
  espaciados, no llaman la atención. Mandar cientos de golpe, sí.

### Si algún día lo quieres siempre encendido

Entonces sí toca un servidor (un VPS de unos S/ 18 al mes), con un dominio y
certificado https delante. Mismo `docker run`, pero con Caddy o Nginx por
delante. No hace falta hasta que lo necesites.

## Cómo se configura en PAPOTAS

**Ajustes → Disparador Automático**, tres casillas:

| Casilla | Qué va |
|---|---|
| URL del servidor | `http://localhost:8080` si lo corres en tu laptop |
| API Key | la `AUTHENTICATION_API_KEY` que pusiste |
| Nombre de la instancia | `papotas`, o como la hayas llamado |

**Guardar** y luego **Probar conexión**. Te dice exactamente qué pasa:

- *Conectado* — la instancia está enlazada, ya puedes enviar.
- *No existe esa instancia* — el nombre no coincide.
- *La API Key no vale* — la clave está mal.
- *El servidor responde, pero WhatsApp no está enlazado* — falta escanear
  el QR.
- *No se pudo llegar al servidor* — está apagado, no es https, o no permite
  llamadas desde esta página (CORS).

Mientras no diga **Conectado**, PAPOTAS sigue abriendo pestañas como siempre.
No se queda a medias.

## El ritmo de envío

Por defecto, un mensaje cada 2,5 segundos. WhatsApp bloquea cuentas que
mandan ráfagas. Si quieres cambiarlo, en la consola:

    ajustes.apiPausaMs = 4000

y guarda. Cuanto más lento, más seguro.
