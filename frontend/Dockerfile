# Build multi-stage: compila la SPA y la sirve con un Nginx mínimo propio (distinto
# del gateway, que solo enruta hacia los microservicios — este únicamente sirve los
# archivos estáticos ya construidos).
FROM docker.io/library/node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Las variables VITE_* de producción (dominio real de los microservicios, DSN de
# Sentry, llave de TomTom) se inyectan como build args para que Vite las embeba en
# el bundle — deben pasarse en el `docker build`/`docker compose build`, no leerse
# del .env de desarrollo que solo vive en este repo para uso local.
ARG VITE_API_URL
ARG VITE_VEHICLE_API_URL
ARG VITE_ROUTE_API_URL
ARG VITE_TOMTOM_API_KEY
ARG VITE_SENTRY_DSN
# Vite solo embebe lo que está en process.env real al momento del build — un ARG
# por sí solo no basta, hay que promoverlo a ENV explícitamente.
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_VEHICLE_API_URL=${VITE_VEHICLE_API_URL} \
    VITE_ROUTE_API_URL=${VITE_ROUTE_API_URL} \
    VITE_TOMTOM_API_KEY=${VITE_TOMTOM_API_KEY} \
    VITE_SENTRY_DSN=${VITE_SENTRY_DSN}
RUN npm run build

FROM docker.io/library/nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
