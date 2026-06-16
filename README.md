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

## Arquitetura

### Visão geral

O projeto segue **Clean Architecture** em ambas as camadas, com separação clara entre regras de negócio,
casos de uso, infraestrutura e apresentação. Os princípios **SOLID** guiam todas as decisões de design —
em especial Single Responsibility e Dependency Inversion.

### Backend — NestJS

Cada domínio (Auth, Couples, Incomes, Expenses, Goals, Reports, etc.) é um **Module** NestJS com as
seguintes camadas, sempre na mesma ordem de dependência:

```
Controller → Service → Repository → Prisma (banco de dados)
                 ↑
               DTOs (entrada e saída)
```

| Camada | Responsabilidade |
|---|---|
| **Controller** | Recebe a requisição HTTP, valida o DTO de entrada e delega ao Service. Sem regra de negócio. |
| **Service** | Contém toda a regra de negócio do domínio. Depende apenas de interfaces de Repository (Dependency Inversion). |
| **Repository** | Implementa a interface de persistência via Prisma. Apenas queries, sem lógica de negócio. |
| **DTOs** | Toda entrada e saída usa DTOs explícitos com `class-validator`. Entidades Prisma nunca são retornadas "cruas". |

Repositories são injetados nos Services via **token/interface** (ex: `EXPENSE_REPOSITORY`), permitindo
substituição por mocks em testes sem alterar o Service.

### Frontend — React

A interface segue uma arquitetura orientada a **features**, com cada domínio isolado em sua própria pasta:

```
features/
├── auth/
├── couples/
├── incomes/
├── expenses/      ← ex: components/, hooks/, services/
├── goals/
├── dashboard/
└── reports/
```

- **React Query** é a fonte de verdade para dados do servidor (queries + mutations com cache).
- **React Hook Form + Zod** para formulários e validação declarativa.
- Componentes de apresentação são separados de containers que lidam com dados/estado.

### Segurança

- Todas as rotas protegidas por `JwtAuthGuard`, exceto endpoints públicos de auth.
- Recursos de um casal sempre filtrados por `coupleId` derivado do usuário autenticado — nunca recebido
  diretamente do cliente.
- Rate limiting em endpoints sensíveis (login, registro, reset de senha).
- Senhas com hash via `bcryptjs`; tokens JWT com expiração curta.
- Segredos apenas via variáveis de ambiente, nunca hardcoded.

## Estrutura do projeto

```
/backend   -> API NestJS (Clean Architecture: Controller -> Service -> Repository -> Prisma)
/frontend  -> SPA React (Vite + TailwindCSS + Shadcn UI)
```

## Arquitetura de IA

Este projeto foi desenvolvido com IA como ferramenta central de produtividade, mas com uma abordagem
estruturada, não como "vibe coding".

Toda a arquitetura do sistema, as decisões técnicas, os padrões de código, as regras de segurança e a
organização em camadas foram definidos e projetados pelo desenvolvedor. A IA (Claude Code) atua como um
executor dentro de um contexto cuidadosamente construído: ela recebe as regras, entende os limites de
cada camada e implementa seguindo os padrões estabelecidos — sem autonomia para subverter a arquitetura
ou tomar decisões de design por conta própria.

Para isso, foram criados arquivos `CLAUDE.md` em três níveis do repositório, que funcionam como um
**contrato técnico entre o desenvolvedor e o agente de IA**:

| Arquivo | Escopo |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Regras gerais: TypeScript, segurança, Clean Architecture, SOLID, convenções de nomenclatura. |
| [`backend/CLAUDE.md`](./backend/CLAUDE.md) | Padrões do NestJS: responsabilidades de cada camada, DTOs, testes, estrutura de pastas. |
| [`frontend/CLAUDE.md`](./frontend/CLAUDE.md) | Padrões do React: design, componentização, React Query, formulários, estrutura de features. |

Esses arquivos são carregados automaticamente pelo Claude Code ao iniciar uma sessão, garantindo que o
agente opere dentro das mesmas restrições e expectativas que um desenvolvedor humano sênior seguiria no
projeto. O resultado é uma colaboração onde a IA acelera a execução, mas as decisões de arquitetura,
segurança e design permanecem sob controle do desenvolvedor.

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
