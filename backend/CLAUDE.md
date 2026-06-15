# Backend CLAUDE.md — Gestão Financeira para Casais (NestJS)

Este arquivo define os padrões arquiteturais e responsabilidades de cada camada do backend. Leia também o
[`CLAUDE.md`](../CLAUDE.md) da raiz para as regras gerais do projeto (TypeScript, segurança, SOLID).

## Padrão arquitetural por módulo

Cada domínio (Auth, Couples, Incomes, Expenses, Goals, Notifications, Reports, etc.) é um **Module** NestJS
organizado nas seguintes camadas, sempre na mesma ordem de dependência:

```
Controller -> Service -> Repository -> Prisma (banco de dados)
                 ^
                 |
               DTOs (entrada e saída)
```

### Module

- Agrupa Controller, Service(s), Repository(ies) e providers do domínio.
- Declara explicitamente os `imports`, `controllers`, `providers` e `exports`.
- Repositories são injetados via **interface/token** (ex: `EXPENSE_REPOSITORY`), nunca via implementação
  concreta diretamente — permite trocar a implementação (ex: para testes) sem alterar o Service.

### Controller

Responsabilidades **exclusivas**:

- Receber a requisição HTTP (rota, método, params, query, body).
- Validar o DTO de entrada (via `ValidationPipe` + `class-validator`).
- Chamar o método correspondente do Service, passando os dados já validados e o contexto do usuário
  autenticado (`@CurrentUser()`).
- Retornar o DTO de resposta.

**Proibido no Controller**:
- Conter regra de negócio (cálculos, validações de domínio, decisões de fluxo).
- Acessar o banco de dados (Prisma) direta ou indiretamente.
- Conhecer detalhes de persistência.

### Service

Responsabilidades:

- Conter **toda a regra de negócio** do domínio (ex: cálculo de progresso de meta, validação de soma de
  percentuais = 100%, regras de despesas recorrentes/parceladas).
- Orquestrar o fluxo da aplicação (ex: criar despesa parcelada → gerar N registros de parcela →
  disparar notificação).
- Depender apenas de **interfaces de Repository** (Dependency Inversion) — nunca importar o
  `PrismaService` diretamente.
- Lançar exceções de domínio (`NotFoundException`, `ForbiddenException`, `BadRequestException` do Nest, ou
  exceptions customizadas) quando regras de negócio forem violadas.

**Proibido no Service**:
- Acesso direto ao Prisma/SQL.
- Lógica de apresentação HTTP (status codes, headers).

### Repository

Responsabilidades:

- Implementar a interface definida pelo domínio (ex: `ExpenseRepository implements IExpenseRepository`).
- Conter **apenas** queries/persistência via Prisma (`findUnique`, `create`, `update`, `delete`,
  agregações, etc).
- Receber e retornar entidades/tipos de domínio (não objetos brutos do Prisma quando houver diferença de
  forma).

**Proibido no Repository**:
- Regra de negócio (cálculos, validações de domínio).
- Decisões de fluxo da aplicação.

### DTOs

- **Toda** entrada (`CreateXDto`, `UpdateXDto`, query params) e **toda** saída (`XResponseDto`) usa DTO
  explícito.
- DTOs de entrada usam `class-validator`/`class-transformer` (`@IsString()`, `@IsNumber()`, `@IsUUID()`,
  `@IsEnum()`, etc.) — nunca aceitar `any`/objetos não tipados.
- DTOs de saída controlam exatamente o que é exposto ao cliente (nunca retornar entidades Prisma "cruas",
  especialmente para evitar leak de campos sensíveis como `passwordHash`).
- Mapeamento entidade → DTO de resposta feito no Service (ou em um `mapper` dedicado), não no Controller.

## Estrutura de pastas sugerida

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── shared/                  # utilitários cross-cutting
│   │   ├── decorators/          # @CurrentUser(), etc.
│   │   ├── guards/               # JwtAuthGuard, CoupleMemberGuard
│   │   ├── filters/               # exception filters
│   │   ├── pipes/
│   │   └── interfaces/
│   ├── infra/
│   │   ├── prisma/               # PrismaService, PrismaModule
│   │   ├── mail/                 # EmailService (confirmação, reset de senha)
│   │   └── storage/               # exportação PDF/Excel
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   │   ├── register.dto.ts
│       │   │   ├── login.dto.ts
│       │   │   └── ...
│       │   └── strategies/        # JwtStrategy, RefreshTokenStrategy
│       ├── users/
│       ├── couples/
│       ├── incomes/
│       ├── expenses/
│       │   ├── expense.module.ts
│       │   ├── expense.controller.ts
│       │   ├── expense.service.ts
│       │   ├── expense.repository.ts
│       │   ├── interfaces/
│       │   │   └── expense-repository.interface.ts
│       │   └── dto/
│       ├── expense-categories/
│       ├── goals/
│       ├── notifications/
│       └── reports/
└── test/
    ├── unit/
    └── e2e/
```

## Segurança

- Todas as rotas (exceto auth público: register/login/confirm-email/reset-password) protegidas por
  `JwtAuthGuard`.
- Recursos pertencentes a um casal (despesas, receitas, metas) sempre filtrados por `coupleId` derivado do
  usuário autenticado — nunca recebido diretamente do cliente sem validação.
- `CoupleMemberGuard` (ou verificação equivalente no Service) garante que o usuário autenticado pertence ao
  casal do recurso acessado, antes de qualquer leitura/escrita.
- Rate limiting em endpoints sensíveis (login, reset de senha, registro).

## Granularidade de tarefas e comentários

- Cada feature deve ser implementada em etapas pequenas e sequenciais: schema/migration → interface de
  repository → repository → DTOs → service → controller → testes.
- Cada arquivo deve começar (quando não-trivial) com um comentário curto explicando o objetivo do arquivo
  dentro do domínio (ex: "Calcula o progresso mensal de uma meta financeira com base nas contribuições
  registradas").
- Funções com regras de negócio não-óbvias (ex: cálculo de parcelas, rateio de metas) devem ter comentário
  explicando a fórmula/raciocínio.

## Estratégia de testes

- **Unit tests**: Services e regras de negócio (ex: cálculo de meta, geração de parcelas), com Repositories
  mockados via interface.
- **Integration tests**: Controllers + Repositories reais contra um banco Postgres de teste (via
  Docker/Prisma).
- **E2E tests**: fluxos completos via Supertest (ex: registro → login → criar despesa → ver no dashboard).
- Cobertura mínima recomendada: regras de negócio críticas (metas, despesas recorrentes/parceladas,
  autenticação) com 100% dos cenários principais e de borda.
