# Backend - Tidy Month Tracker

Backend Node.js com Express para API REST do Tidy Month Tracker.

## 🚀 Tecnologias

- **Node.js 20+** (LTS)
- **Express** - Framework web
- **TypeScript** - Tipagem estática
- **PostgreSQL** - Banco de dados (via Supabase)
- **pg** - Cliente PostgreSQL
- **Zod** - Validação de schemas
- **Supabase Auth** - Validação de tokens JWT

## 📦 Instalação

```bash
# Instalar dependências (na raiz do projeto)
npm install

# Ou instalar apenas dependências do backend
cd backend
npm install
```

## ⚙️ Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp backend/.env.example backend/.env
```

2. Configure as variáveis no arquivo `.env`:
   - `DATABASE_URL`: URL de conexão do PostgreSQL (Supabase)
   - `SUPABASE_URL`: URL do projeto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key do Supabase (para validar tokens)
   - `PORT`: Porta do servidor (padrão: 3000)
   - `CORS_ORIGIN`: Origem permitida para CORS (padrão: http://localhost:8080)

## 🏃 Execução

```bash
# Desenvolvimento (com hot reload)
npm run dev:backend

# Produção
npm run build:backend
npm start
```

## 📡 Endpoints

### Receitas (Incomes)
- `GET /api/incomes?month=2024-01` - Lista receitas do mês
- `POST /api/incomes?month=2024-01` - Cria receita
- `PUT /api/incomes/:id` - Atualiza receita
- `DELETE /api/incomes/:id` - Deleta receita
- `POST /api/incomes/reorder` - Reordena receitas

### Despesas (Expenses)
- `GET /api/expenses?month=2024-01` - Lista despesas do mês
- `POST /api/expenses?month=2024-01` - Cria despesa
- `PUT /api/expenses/:id` - Atualiza despesa
- `DELETE /api/expenses/:id` - Deleta despesa
- `DELETE /api/expenses/:id/installments` - Deleta todas as parcelas
- `POST /api/expenses/reorder` - Reordena despesas

### Investimentos (Investments)
- `GET /api/investments?month=2024-01` - Lista investimentos do mês
- `POST /api/investments?month=2024-01` - Cria investimento
- `PUT /api/investments/:id` - Atualiza investimento
- `DELETE /api/investments/:id` - Deleta investimento
- `POST /api/investments/reorder` - Reordena investimentos

### Cartões de Crédito (Credit Cards)
- `GET /api/credit-cards` - Lista cartões
- `POST /api/credit-cards` - Cria cartão
- `PUT /api/credit-cards/:id` - Atualiza cartão
- `DELETE /api/credit-cards/:id` - Deleta cartão
- `GET /api/credit-cards/:id/status?month=2024-01` - Status mensal do cartão
- `PUT /api/credit-cards/:id/status` - Atualiza status mensal

### Configurações (Settings)
- `GET /api/settings` - Busca configurações do usuário
- `PUT /api/settings/investment-tags` - Atualiza tags de investimento
- `PUT /api/settings/investment-tags/update` - Atualiza tag em investimentos

## 🔐 Autenticação

Todas as rotas (exceto `/health`) requerem autenticação via token JWT do Supabase.

**Header necessário:**
```
Authorization: Bearer <token>
```

O middleware `authenticate` valida o token e adiciona `userId` à requisição.

## 🏗️ Estrutura

```
backend/
├── src/
│   ├── routes/      # Rotas HTTP
│   ├── services/    # Lógica de negócio
│   ├── infra/       # Infraestrutura (DB, auth, errors)
│   ├── utils/        # Utilitários
│   └── index.ts      # Entry point
├── package.json
└── tsconfig.json
```

## 📝 Decisões Técnicas

- **Estrutura simples**: routes → services → infra (DB)
- **SQL direto**: Usa `pg` sem ORM (simplicidade)
- **Validação**: Zod para validação de inputs
- **Autenticação**: Valida tokens Supabase, não cria sistema próprio
- **Erros**: Middleware centralizado de tratamento de erros
- **Logging**: Logger estruturado simples (pode evoluir para Winston/Pino quando necessário)

## 🧪 Testes

```bash
# Executar testes do frontend
npm run test --workspace=frontend

# Executar testes em modo watch
npm run test:watch --workspace=frontend
```

## 📊 Logging

O backend utiliza um logger estruturado simples que formata logs com:
- Timestamp ISO
- Nível (info, warn, error, debug)
- Mensagem
- Contexto opcional (objeto JSON)
- Stack trace (apenas em desenvolvimento para erros)

Exemplo de log:
```
[2024-01-15T10:30:45.123Z] INFO  Servidor iniciado {"port":3000,"environment":"development"}
```