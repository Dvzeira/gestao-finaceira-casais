# ============================================================
# Etapa 1: instala dependências (com devDependencies, necessárias para o build)
# ============================================================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ============================================================
# Etapa 2: gera o Prisma Client e compila a aplicação NestJS
# ============================================================
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prisma.config.ts exige DATABASE_URL definido para validar o env; o valor real
# só é necessário em runtime (migrate/connect), não para gerar o client.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"
RUN npx prisma generate
RUN npm run build

# ============================================================
# Etapa 3: imagem final, apenas com dependências de produção e dist
# ============================================================
FROM node:22-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Aplica as migrations pendentes antes de iniciar a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
