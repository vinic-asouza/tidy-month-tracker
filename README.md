# Tidy Month Tracker

Sistema de controle financeiro pessoal para gerenciar receitas, despesas, investimentos e cartões de crédito de forma organizada e intuitiva.

## 📋 Sobre o Projeto

O Tidy Month Tracker é uma aplicação web que permite:

- **Gerenciar Receitas**: Registre suas entradas mensais com tags personalizáveis
- **Controlar Despesas**: Organize gastos fixos, variáveis e parcelados por categoria
- **Acompanhar Investimentos**: Registre seus investimentos com tags e datas
- **Gerenciar Cartões de Crédito**: Controle o status de pagamento dos cartões por mês
- **Visualizar Estatísticas**: Gráficos e análises do seu comportamento financeiro
- **Configurações Personalizadas**: Crie suas próprias tags, categorias e métodos de pagamento

## 🏗️ Arquitetura

Este projeto utiliza uma arquitetura **monorepo** com:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript (preservado para uso futuro)
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth

### Produção (atual)

Em produção, apenas o **frontend** é publicado ([Vercel](https://tidy-month-tracker.vercel.app)), acessando o Supabase diretamente via adaptadores (`VITE_DATA_PROVIDER=supabase`). O backend Express não é deployado nesta fase.

A camada de serviços em `frontend/src/services/adapters/` permite alternar entre acesso direto ao Supabase e API REST sem alterar os componentes.

📖 Veja [`docs/DEPLOY.md`](./docs/DEPLOY.md) para o guia completo de deploy.

## 🚀 Tecnologias

### Frontend
- **React 18.3** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **TanStack Query** - Gerenciamento de estado e cache
- **shadcn/ui** - Componentes UI baseados em Radix UI
- **Tailwind CSS** - Estilização
- **Zod** - Validação de schemas

### Backend
- **Node.js 20+** - Runtime
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados (via Supabase)
- **pg** - Cliente PostgreSQL
- **Zod** - Validação de schemas
- **Supabase Auth** - Validação de tokens JWT

### Banco de Dados
- **Supabase** - PostgreSQL gerenciado com Row Level Security (RLS)
- **Supabase Auth** - Autenticação de usuários

## 📦 Pré-requisitos

- **Node.js** 20+ (LTS) - Recomendado usar [nvm](https://github.com/nvm-sh/nvm)
- **npm** ou **yarn** ou **pnpm**
- Conta no **Supabase** (gratuita)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd tidy-month-tracker
```

### 2. Instale as dependências

```bash
npm install
```

Isso instalará as dependências de todos os workspaces (frontend e backend).

### 3. Configure o Banco de Dados no Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL completo:
   - Abra `supabase/setup-completo.sql`
   - Cole no **SQL Editor** do Supabase e execute
3. Em **Authentication → URL Configuration**, adicione as URLs de redirect do ambiente (local e produção)

### 4. Configure as variáveis de ambiente

#### Frontend (obrigatório)

```bash
cp frontend/.env.example frontend/.env.local
```

Edite `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable
VITE_DATA_PROVIDER=supabase
```

Com `VITE_DATA_PROVIDER=supabase`, o frontend acessa o banco diretamente — não é necessário subir o backend para desenvolvimento.

Para usar o backend local, defina `VITE_DATA_PROVIDER=api` e `VITE_API_URL=http://localhost:3000`.

#### Backend (opcional — apenas com `VITE_DATA_PROVIDER=api`)

```env
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
PORT=3000
CORS_ORIGIN=http://localhost:8080
NODE_ENV=development
```

**⚠️ Nunca exponha a `service_role` key no frontend ou em variáveis `VITE_*`.**

## 🏃 Execução

### Desenvolvimento

```bash
# Frontend apenas (porta 8080)
npm run dev

# Backend apenas (porta 3000)
npm run dev:backend

# Ambos simultaneamente
npm run dev:all
```

### Produção

O deploy de produção é feito na **Vercel** a partir da branch `main`. Cada push na `main` dispara build e publicação automáticos.

```bash
# Build local (validação)
npm run build

# Preview local do build
npm run preview --workspace=frontend
```

📖 Guia completo: [`docs/DEPLOY.md`](./docs/DEPLOY.md)

## 📁 Estrutura do Projeto

```
tidy-month-tracker/
├── frontend/          # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── services/      # Facades + adaptadores (supabase / api)
│   │   ├── hooks/         # React hooks
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilitários
│   └── package.json
├── backend/           # API REST Node.js
│   ├── src/
│   │   ├── routes/        # Rotas HTTP
│   │   ├── services/      # Lógica de negócio
│   │   ├── infra/         # Infraestrutura (DB, auth)
│   │   └── utils/         # Utilitários
│   └── package.json
├── supabase/         # Migrations do banco
└── package.json      # Workspace root
```

## 📡 API Endpoints

Veja [backend/README.md](./backend/README.md) para documentação completa da API.

## 🔐 Autenticação

O sistema usa **Supabase Auth** no frontend (`AuthContext`). Em produção, a sessão é gerenciada pelo `supabase-js` com RLS no banco.

No modo `api`, o backend valida tokens JWT do Supabase via header `Authorization: Bearer <token>`.

## 🧪 Testes

O projeto inclui testes unitários para lógica de negócio:

```bash
# Executar todos os testes do frontend
npm run test --workspace=frontend

# Executar testes em modo watch
npm run test:watch --workspace=frontend
```

### Cobertura de Testes

- ✅ Funções puras de lógica de negócio (`repeatMonths`, `installments`)
- ✅ Validações de dados
- ✅ Cálculos de parcelas e repetições mensais

**Total:** 24 testes passando ✅

## 📊 Logging

O backend utiliza logging estruturado simples:
- Logs formatados com timestamp, nível e contexto
- Debug logs apenas em desenvolvimento
- Stack traces apenas em desenvolvimento

**Exemplo:**
```
[2024-01-15T10:30:45.123Z] INFO  Servidor iniciado {"port":3000,"environment":"development"}
```

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [`docs/DEPLOY.md`](./docs/DEPLOY.md) | Deploy na Vercel, variáveis de ambiente e Supabase Auth |
| [`docs/PLANO_FRONTEND_DIRETO_SUPABASE.md`](./docs/PLANO_FRONTEND_DIRETO_SUPABASE.md) | Plano e decisões da fase frontend → Supabase |
| [`backend/README.md`](./backend/README.md) | API REST (modo `api`) |

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia frontend em desenvolvimento
- `npm run dev:backend` - Inicia backend em desenvolvimento
- `npm run dev:all` - Inicia ambos simultaneamente
- `npm run build` - Build do frontend
- `npm run build:backend` - Build do backend
- `npm run lint` - Lint do frontend

## 🛠️ Desenvolvimento

### Adicionar nova dependência

```bash
# Frontend
npm install <package> --workspace=frontend

# Backend
npm install <package> --workspace=backend
```

### Estrutura de Commits

Este projeto segue convenções de commits semânticos.

## 📄 Licença

[Definir licença]

## 🤝 Contribuindo

[Instruções de contribuição]
