# Gestão Financeira para Casais

Sistema de gestão financeira para casais: controle de receitas, despesas, patrimônio e metas financeiras
com divisão de contribuição por percentual, além de dashboard e relatórios para acompanhar a saúde
financeira do casal.

## Tecnologias

### Backend (`/backend`)

- **NestJS** + **TypeScript** — framework e linguagem da API.
- **PostgreSQL** — banco de dados relacional.
- **Prisma ORM** — acesso a dados e migrations.
- **JWT** (`@nestjs/jwt`, `passport-jwt`) — autenticação via access/refresh tokens.
- **class-validator** / **class-transformer** — validação e transformação de DTOs.
- **bcryptjs** — hash de senhas.
- **Nodemailer** — envio de e-mails (confirmação de conta, reset de senha).
- **Jest** + **Supertest** — testes unitários, de integração e end-to-end.

### Frontend (`/frontend`)

- **React 19** + **TypeScript** — biblioteca e linguagem da interface.
- **Vite** — build tool e dev server.
- **TailwindCSS** + **Shadcn UI** (Radix UI) — estilização e componentes de interface.
- **React Query (TanStack Query)** — data fetching, cache e sincronização com o servidor.
- **React Hook Form** + **Zod** — formulários e validação.
- **React Router** — roteamento client-side.
- **Axios** — cliente HTTP.
- **Recharts** — gráficos do dashboard e relatórios.

### Infraestrutura

- **Docker** / **Docker Compose** — orquestração dos containers de backend, frontend e banco de dados.

## Estrutura do projeto

```
/backend   -> API NestJS (Clean Architecture: Controller -> Service -> Repository -> Prisma)
/frontend  -> SPA React (Vite + TailwindCSS + Shadcn UI)
```

Cada parte do projeto possui seu próprio `CLAUDE.md` com os padrões arquiteturais e de desenvolvimento
detalhados:

- [`/backend/CLAUDE.md`](./backend/CLAUDE.md)
- [`/frontend/CLAUDE.md`](./frontend/CLAUDE.md)

## Como rodar o projeto

### Pré-requisitos

- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- (Para desenvolvimento sem Docker) [Node.js](https://nodejs.org/) 22+ e um PostgreSQL acessível.

### Opção 1: usando Docker (recomendado)

1. Copie o arquivo de variáveis de ambiente de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Ajuste os valores em `.env` conforme necessário (segredos de JWT, credenciais de e-mail, etc.). Os
   valores padrão já funcionam para um ambiente local.

3. Suba todos os serviços (banco de dados, API e frontend):

   ```bash
   docker compose up --build
   ```

4. Acesse:

   - **Frontend**: http://localhost:5173
   - **Backend (API)**: http://localhost:3000
   - **PostgreSQL**: `localhost:5433`

A primeira inicialização do backend aplica automaticamente as migrations do Prisma
(`prisma migrate deploy`) antes de iniciar a API.

> Para parar os containers, use `docker compose down`. Para remover também os dados do banco, use
> `docker compose down -v`.

### Opção 2: desenvolvimento local (sem Docker para a aplicação)

1. Suba apenas o banco de dados via Docker:

   ```bash
   cp .env.example .env
   docker compose up -d postgres
   ```

2. **Backend**:

   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   npm run start:dev
   ```

   A API ficará disponível em http://localhost:3000.

3. **Frontend** (em outro terminal):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   A interface ficará disponível em http://localhost:5173.

## Variáveis de ambiente

As principais variáveis estão documentadas em [`.env.example`](./.env.example), incluindo configuração do
banco de dados, segredos de JWT, e-mail (SMTP) e URL do frontend usada pelo backend para CORS e links de
e-mail (confirmação de conta, reset de senha).
