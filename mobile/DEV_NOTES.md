# Notas de desarrollo — app móvil

## Probar en un iPhone físico con Expo Go: por qué no basta con la IP LAN

Apuntar `EXPO_PUBLIC_*_API_URL` a la IP local de la máquina de desarrollo
(`http://192.168.x.x:800X/api/v1`) **no funciona en un iPhone físico dentro de
Expo Go**, aunque el teléfono esté en la misma WiFi y el permiso de "Red Local"
esté activado. Falla con `ERR_NETWORK` / "Network Error" sin respuesta HTTP —
confirmado en vivo (Safari sí carga esa misma URL, la app no).

**Causa real**: iOS bloquea por defecto las conexiones HTTP sin cifrar hacia
direcciones IP (`NSAllowsLocalNetworking` es `NO` por defecto en App Transport
Security). Expo Go es un binario pre-compilado distribuido por Apple — no
podemos tocar su `Info.plist`, así que ningún cambio en `app.json` de este
proyecto tiene efecto ahí (los plugins de configuración nativa solo aplican en
un *development build* propio, no en Expo Go).

**Solución usada (gratis, sin Mac ni cuenta de Apple Developer)**: exponer el
gateway local por HTTPS real con un túnel de Cloudflare, en vez de la IP LAN
directa por HTTP:

```bash
# 1. Levantar el gateway Nginx ya construido (gateway/nginx.conf) escuchando
#    en un puerto no privilegiado, en la red del host:
sed 's/listen 80;/listen 8080;/' ../gateway/nginx.conf > /tmp/nginx-dev-tunnel.conf
podman run -d --name uniwheels_dev_gateway --network host \
  -v /tmp/nginx-dev-tunnel.conf:/etc/nginx/nginx.conf:ro,Z \
  docker.io/library/nginx:1.27-alpine

# 2. Túnel HTTPS gratuito, sin cuenta (cloudflared "quick tunnel"):
cloudflared tunnel --url http://localhost:8080
# imprime algo como https://palabras-random.trycloudflare.com
```

Luego, en `mobile/.env`, las 5 variables `EXPO_PUBLIC_*_API_URL` apuntan a
**la misma** URL del túnel + `/api/v1` (el gateway ya enruta por path a cada
microservicio, así que una sola URL basta).

**Limitación real**: el túnel gratuito de Cloudflare sin cuenta es efímero — la
URL cambia cada vez que se reinicia `cloudflared`, y no hay garantía de uptime
(ver el aviso que imprime el propio comando). Sirve para desarrollo/pruebas
puntuales en un dispositivo físico, no como solución permanente. Para algo más
estable sin salir de Expo Go tocaría una cuenta de Cloudflare con un túnel
nombrado (sigue siendo gratis) o, para producción real, ya existe
`docker/DEPLOY.md` con el plan completo de despliegue.

**Nota**: el simulador de iOS (si algún día se usa desde un Mac) no tiene este
problema — corre en la misma máquina, así que `http://localhost:800X` funciona
directo sin ATS de por medio. Este workaround solo es necesario para un
dispositivo físico real.
