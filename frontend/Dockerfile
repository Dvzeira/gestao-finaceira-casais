# ============================================================
# Etapa 1: instala dependências e gera o build estático (Vite)
# ============================================================
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL base da API consumida pelo frontend, definida em build-time pelo Vite
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ============================================================
# Etapa 2: serve os arquivos estáticos com Nginx
# ============================================================
FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
