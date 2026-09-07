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

## Qué necesitas

Un servidor con Evolution API. Es gratis y de código abierto. En una máquina
con Docker:

    docker run -d --name evolution -p 8080:8080 \
      -e AUTHENTICATION_API_KEY=inventate-una-clave-larga \
      -e CORS_ORIGIN='*' \
      atendai/evolution-api:latest

Tres avisos importantes:

1. **Tiene que ser https** si PAPOTAS está publicado en https. Un navegador
   no deja que una página https llame a un servidor http. Ponle un dominio
   con certificado (Caddy o Nginx delante lo resuelven en dos líneas).
2. **CORS**: el servidor tiene que permitir llamadas desde la dirección de
   PAPOTAS. Eso es lo que hace `CORS_ORIGIN`. Sin ello el navegador corta la
   llamada y no llega ni a salir.
3. **La API Key viaja en el navegador.** Cualquiera que abra tu PAPOTAS
   publicado puede leerla y mandar mensajes con tu WhatsApp. No publiques el
   archivo con la clave dentro en una dirección que reparta a nadie.

Luego, en Evolution, crea una instancia (por ejemplo `papotas`) y escanea el
QR con el WhatsApp desde el que quieres escribir.

## Cómo se configura en PAPOTAS

**Ajustes → Disparador Automático**, tres casillas:

| Casilla | Qué va |
|---|---|
| URL del servidor | `https://tu-evolution.tudominio.com` (sin nada más detrás) |
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
