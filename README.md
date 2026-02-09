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
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: PostgreSQL (Supabase)
- **Autenticação**: Supabase Auth

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

**📖 IMPORTANTE:** Siga o guia completo em [`GUIA_CONFIGURACAO_SUPABASE.md`](./GUIA_CONFIGURACAO_SUPABASE.md)

**Resumo rápido:**

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o script SQL completo:
   - Abra o arquivo `supabase/setup-completo.sql`
   - Copie todo o conteúdo
   - Cole no **SQL Editor** do Supabase
   - Execute o script
3. Obtenha as credenciais (veja guia completo para detalhes)

### 4. Configure as variáveis de ambiente

#### Frontend

1. Crie o arquivo `.env` na pasta `frontend/`:
```bash
cd frontend
# Crie o arquivo .env manualmente
```

2. Edite `frontend/.env` e preencha:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJ... (anon public key)
   VITE_API_URL=http://localhost:3000
   ```

#### Backend

1. Crie o arquivo `.env` na pasta `backend/`:
```bash
cd backend
# Crie o arquivo .env manualmente
```

2. Edite `backend/.env` e preencha:
   ```env
   DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.xxxxx.supabase.co:5432/postgres
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role key)
   PORT=3000
   CORS_ORIGIN=http://localhost:8080
   NODE_ENV=development
   ```

**⚠️ IMPORTANTE:**
- Substitua `[SUA-SENHA]` pela senha do banco que você criou
- Substitua `xxxxx` pelo ID do seu projeto Supabase
- Substitua as chaves `eyJ...` pelas chaves reais do seu projeto

**📖 Para instruções detalhadas, veja [`GUIA_CONFIGURACAO_SUPABASE.md`](./GUIA_CONFIGURACAO_SUPABASE.md)**

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

```bash
# Build
npm run build
npm run build:backend

# Executar
npm run preview  # Frontend
npm start        # Backend (após build)
```

## 📁 Estrutura do Projeto

```
tidy-month-tracker/
├── frontend/          # Aplicação React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── services/      # Camada de serviços (API)
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

O sistema usa **Supabase Auth** para autenticação. O backend valida tokens JWT do Supabase.

**Header necessário para requisições:**
```
Authorization: Bearer <token>
```

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
