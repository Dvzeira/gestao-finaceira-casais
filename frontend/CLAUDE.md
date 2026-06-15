# Frontend CLAUDE.md — Gestão Financeira para Casais (React)

Este arquivo define os padrões de interface e desenvolvimento do frontend. Leia também o
[`CLAUDE.md`](../CLAUDE.md) da raiz para as regras gerais do projeto (TypeScript, segurança).

## Design

O sistema deve transmitir **organização, confiança e planejamento financeiro para casais**. Diretrizes:

- **Visual light**: fundo claro, contraste suave, evitar dark mode como padrão (pode existir como opção
  futura, não prioridade).
- **Clean**: bastante espaço em branco, hierarquia visual clara, poucos elementos por tela.
- **Moderno**: usar os componentes do **Shadcn UI** como base, customizados com **TailwindCSS**.
- Paleta sugerida: tons neutros (cinza/branco) como base, com uma cor primária que remeta a confiança/
  estabilidade (ex: azul ou verde), e cores semânticas claras para receitas (verde), despesas (vermelho/
  laranja) e metas (azul/roxo).
- Tipografia legível, números financeiros com destaque (peso de fonte maior, alinhamento à direita em
  tabelas).
- Gráficos (dashboard/relatórios) devem usar a mesma paleta semântica de forma consistente.

## Componentização

- **Nunca sobrecarregar arquivos**: cada arquivo deve ter um propósito claro.
- **Sempre componentizar** quando uma parte da UI tiver responsabilidade própria ou for potencialmente
  reutilizável (cards, formulários, listas, gráficos, badges de status, etc.).
- Cada componente deve ter **responsabilidade única** (Single Responsibility) — se um componente está
  fazendo fetch de dados, renderizando UI e tratando formulário ao mesmo tempo, deve ser dividido.
- Componentes de apresentação (puramente visuais) devem ser separados de componentes "container" que
  lidam com dados/estado.

## React

- **Sempre componentes funcionais**. Não utilizar componentes de classe.
- Usar hooks (`useState`, `useEffect`, hooks customizados) para estado e efeitos.
- **Priorizar reutilização de componentes**: antes de criar um novo componente, verificar se um existente
  em `components/ui` ou `components/shared` pode ser reaproveitado/estendido via props.
- Manter arquivos pequenos e organizados:
  - **Limite de referência: ~200 linhas por arquivo.** Se um componente/hook se aproximar ou passar disso,
    avaliar extrair:
    - lógica de estado/efeitos → **hook customizado** (`use-xxx.ts`);
    - partes da UI → **subcomponentes** em arquivos próprios.

## Dados, formulários e estado

- **React Query** para todo data fetching/cache de dados do servidor (queries e mutations), com chaves de
  query bem definidas por domínio (ex: `['expenses', coupleId, filters]`).
- **React Hook Form** + `zod` (via `@hookform/resolvers`) para formulários e validação no cliente — nunca
  validar manualmente campo a campo sem schema.
- Estado local de UI (modais abertos, abas ativas) com `useState`/`useReducer`; evitar estado global
  desnecessário — preferir cache do React Query como fonte de verdade para dados de servidor.

## Estrutura de pastas sugerida

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/                 # definição de rotas
│   ├── components/
│   │   ├── ui/                 # componentes Shadcn (button, card, dialog, etc.)
│   │   └── shared/              # componentes compartilhados entre features
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/        # chamadas à API (auth)
│   │   ├── couples/
│   │   ├── incomes/
│   │   ├── expenses/
│   │   │   ├── components/
│   │   │   │   ├── expense-list.tsx
│   │   │   │   ├── expense-form.tsx
│   │   │   │   └── expense-card.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-expenses.ts
│   │   │   │   └── use-create-expense.ts
│   │   │   └── services/
│   │   │       └── expenses.api.ts
│   │   ├── goals/
│   │   ├── dashboard/
│   │   └── reports/
│   ├── hooks/                   # hooks globais (use-auth, use-debounce, etc.)
│   ├── lib/                      # utils, formatação de moeda/data, schemas zod
│   ├── services/                 # cliente HTTP base (axios/fetch + interceptors)
│   └── types/                     # tipos compartilhados (espelham DTOs do backend)
```

## Convenções

- TypeScript com `;` sempre, **nunca `any`** — tipar respostas da API com tipos espelhando os DTOs do
  backend (em `src/types`).
- Nomes de arquivo em `kebab-case` (`expense-form.tsx`), componentes exportados em `PascalCase`.
- Sempre tratar estados de loading/erro/empty nas telas que consomem dados (usar os estados do React Query).
- Formatação de valores monetários e datas centralizada em helpers (`src/lib/format.ts`) — nunca duplicar
  lógica de formatação em componentes.
