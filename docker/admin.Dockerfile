# Build multi-stage: compila el Panel de Administracion de UniWheels y lo sirve
# con un Nginx minimo propio (distinto del gateway, que enruta peticiones hacia
# los microservicios y este contenedor estatico).
FROM docker.io/library/node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM docker.io/library/nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.admin.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
