# Build multi-stage: compila la Landing de UniWheels y la sirve con un Nginx
# mínimo propio (distinto del gateway, que solo enruta hacia los microservicios
# y la landing — este únicamente sirve los archivos estáticos ya construidos).
FROM docker.io/library/node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM docker.io/library/nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.landing.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
