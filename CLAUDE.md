# CLAUDE.md — Gestão Financeira para Casais

Guia geral do projeto. Leia este arquivo antes de qualquer implementação. Para regras específicas de cada
parte do sistema, consulte também:

- [`/backend/CLAUDE.md`](./backend/CLAUDE.md) — padrões arquiteturais do backend (NestJS).
- [`/frontend/CLAUDE.md`](./frontend/CLAUDE.md) — padrões de interface e desenvolvimento do frontend (React).

## Visão geral

Sistema de gestão financeira para casais: receitas, despesas, patrimônio, metas financeiras com divisão de
contribuição por percentual, dashboard e relatórios.

Stack:
- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma ORM, JWT, Docker.
- **Frontend**: React, TypeScript, Vite, React Query, React Hook Form, TailwindCSS, Shadcn UI.

Estrutura de pastas na raiz:

```
/backend   -> API NestJS
/frontend  -> SPA React
```

## Regras gerais (válidas para backend e frontend)

### TypeScript

- Sempre finalizar statements com `;`.
- **Nunca usar `any`**. Se o tipo for genuinamente desconhecido, usar `unknown` e aplicar type guards, ou
  modelar um tipo/interface específico.
- Tipagem estrita habilitada (`strict: true` no `tsconfig.json`).
- Preferir `interface`/`type` explícitos para contratos entre camadas (DTOs, entidades de domínio, props
  de componentes).

### Segurança

Segurança é prioridade em qualquer implementação:

- Validar e sanitizar toda entrada de usuário (DTOs com `class-validator` no backend, `zod`/`react-hook-form`
  no frontend).
- Nunca confiar em IDs vindos do cliente sem checar que o recurso pertence ao usuário/casal autenticado.
- Senhas sempre com hash (bcrypt/argon2), nunca em texto puro ou logs.
- Tokens (JWT, reset de senha, confirmação de e-mail) sempre assinados e com expiração curta.
- Segredos (chaves JWT, credenciais de banco, SMTP) somente via variáveis de ambiente — nunca hardcoded
  ou commitados.
- Aplicar princípio do menor privilégio: cada endpoint/guard só libera o que é estritamente necessário.

### Arquitetura

- Seguir **Clean Architecture**: separação clara entre regras de negócio, casos de uso, infraestrutura
  (banco, e-mail, etc.) e camada de apresentação (HTTP/UI).
- Seguir os princípios **SOLID** em todas as camadas — em especial Single Responsibility e Dependency
  Inversion (dependa de interfaces/abstrações, não de implementações concretas).

### Organização de tarefas e código

- Toda tarefa de implementação deve ser dividida em passos pequenos e bem definidos (ex: "criar DTO",
  "criar repository", "criar service", "criar controller", "criar testes") em vez de uma entrega monolítica.
- Código não-trivial deve conter comentários curtos explicando **o objetivo e o contexto** da
  implementação (o "porquê"), não o "o quê" (que já deve ser óbvio pelos nomes).
- O código deve ser organizado para que múltiplos desenvolvedores e agentes de IA possam trabalhar em
  paralelo sem conflitos: um domínio por módulo/feature, arquivos pequenos e coesos, nomenclatura
  consistente.

### Convenções de nomenclatura

- `camelCase` para variáveis, funções e métodos.
- `PascalCase` para classes, interfaces, tipos, enums e componentes React.
- `kebab-case` para nomes de arquivos e pastas (ex: `expense-card.tsx`, `create-expense.dto.ts`).
- Sufixos padronizados no backend: `.module.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`,
  `.dto.ts`, `.entity.ts`.
