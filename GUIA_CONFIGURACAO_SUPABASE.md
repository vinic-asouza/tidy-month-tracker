# Guia Completo de Configuração do Banco de Dados - Supabase

Este guia fornece instruções passo a passo para configurar o banco de dados do Tidy Month Tracker no Supabase do zero.

---

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Acesso ao projeto Supabase criado

---

## 🚀 Passo a Passo

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name**: `tidy-month-tracker` (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte e **anote-a** (você precisará dela)
   - **Region**: Escolha a região mais próxima
4. Clique em **"Create new project"**
5. Aguarde alguns minutos enquanto o projeto é criado

---

### 2. Obter Credenciais do Projeto

Após o projeto ser criado:

1. Vá em **Settings** → **API** (menu lateral esquerdo)
2. Anote as seguintes informações:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: Chave pública (começa com `eyJ...`)
   - **service_role** key: Chave de serviço (mantenha segura!)

3. Para obter a **DATABASE_URL**:
   - Vá em **Settings** → **Database**
   - Role até **Connection string**
   - Selecione **URI**
   - Copie a string de conexão
   - **IMPORTANTE**: Substitua `[YOUR-PASSWORD]` pela senha que você criou

**Exemplo de DATABASE_URL:**
```
postgresql://postgres:[SUA-SENHA]@db.xxxxx.supabase.co:5432/postgres
```

---

### 3. Executar Script SQL

1. No menu lateral do Supabase, clique em **SQL Editor**
2. Clique em **"New query"**
3. Abra o arquivo `supabase/setup-completo.sql` deste projeto
4. Copie **TODO** o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

**✅ Verificação:**
- Você deve ver a mensagem "Success. No rows returned"
- Se houver erros, verifique se o projeto foi criado corretamente

---

### 4. Verificar Tabelas Criadas

1. No menu lateral, clique em **Table Editor**
2. Você deve ver as seguintes tabelas:
   - ✅ `profiles`
   - ✅ `credit_cards`
   - ✅ `incomes`
   - ✅ `expenses`
   - ✅ `investments`
   - ✅ `finance_settings`
   - ✅ `credit_card_monthly_status`

---

### 5. Verificar Row Level Security (RLS)

1. No **Table Editor**, clique em qualquer tabela
2. Vá na aba **Policies** (ao lado de "Data")
3. Você deve ver políticas criadas para cada operação (SELECT, INSERT, UPDATE, DELETE)

**✅ Verificação:**
- Todas as tabelas devem ter RLS habilitado
- Todas as políticas devem estar criadas

---

### 6. Configurar Variáveis de Ambiente

#### Frontend (`.env` na pasta `frontend/`)

Crie o arquivo `frontend/.env` com:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ... (anon public key)
VITE_API_URL=http://localhost:3000
```

#### Backend (`.env` na pasta `backend/`)

Crie o arquivo `backend/.env` com:

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
- Substitua `xxxxx` pelo ID do seu projeto
- Substitua as chaves `eyJ...` pelas chaves reais do seu projeto

---

## 🔍 Verificações Finais

### 1. Testar Conexão do Backend

```bash
# Na raiz do projeto
cd backend
npm run dev
```

**✅ Esperado:**
- Servidor inicia sem erros
- Log: "✅ Conectado ao banco de dados PostgreSQL"
- Log: "🚀 Servidor rodando na porta 3000"

### 2. Testar Autenticação

1. Inicie o frontend: `npm run dev`
2. Acesse `http://localhost:8080`
3. Tente criar uma conta
4. Verifique se o perfil e configurações foram criados automaticamente

**✅ Verificação no Supabase:**
- Vá em **Table Editor** → `profiles`
- Deve aparecer um registro com o `user_id` do usuário criado
- Vá em **Table Editor** → `finance_settings`
- Deve aparecer um registro com as configurações padrão

---

## 🛠️ Troubleshooting

### Erro: "relation does not exist"

**Causa:** Tabelas não foram criadas

**Solução:**
1. Verifique se executou o script SQL completo
2. Verifique se não houve erros no SQL Editor
3. Execute o script novamente (é seguro, usa `CREATE TABLE IF NOT EXISTS`)

### Erro: "permission denied for table"

**Causa:** RLS não está configurado ou políticas não foram criadas

**Solução:**
1. Verifique se RLS está habilitado em todas as tabelas
2. Verifique se as políticas foram criadas (aba "Policies" no Table Editor)
3. Execute novamente a seção de políticas do script SQL

### Erro: "password authentication failed"

**Causa:** Senha incorreta na DATABASE_URL

**Solução:**
1. Verifique a senha do banco de dados
2. Certifique-se de que substituiu `[YOUR-PASSWORD]` na DATABASE_URL
3. Se necessário, redefina a senha em **Settings** → **Database** → **Reset database password**

### Erro: "function handle_new_user() does not exist"

**Causa:** Função não foi criada

**Solução:**
1. Execute novamente a seção de funções do script SQL
2. Verifique se a função foi criada em **Database** → **Functions**

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **profiles** - Perfis de usuário
2. **credit_cards** - Cartões de crédito (globais)
3. **incomes** - Receitas (por mês)
4. **expenses** - Despesas (por mês)
5. **investments** - Investimentos (por mês)
6. **finance_settings** - Configurações do usuário
7. **credit_card_monthly_status** - Status mensal de cartões

### Relacionamentos

- Todas as tabelas referenciam `auth.users(id)` via `user_id`
- `incomes` pode referenciar `incomes(id)` via `base_income_id` (repetições)
- `expenses` pode referenciar `expenses(id)` via `base_expense_id` (repetições/parcelas)
- `credit_card_monthly_status` referencia `credit_cards(id)` via `credit_card_id`

### Segurança

- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Políticas garantem que usuários só acessam seus próprios dados
- ✅ Função `handle_new_user()` cria perfil e configurações automaticamente

---

## ✅ Checklist Final

Antes de considerar a configuração completa, verifique:

- [ ] Projeto Supabase criado
- [ ] Script SQL executado sem erros
- [ ] Todas as 7 tabelas criadas
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas criadas para todas as tabelas
- [ ] Funções criadas (`update_updated_at_column`, `handle_new_user`)
- [ ] Triggers criados
- [ ] Variáveis de ambiente configuradas (frontend e backend)
- [ ] Backend conecta ao banco sem erros
- [ ] Frontend conecta ao Supabase sem erros
- [ ] Criação de usuário cria perfil e configurações automaticamente

---

## 📝 Notas Importantes

1. **Senha do Banco**: Anote a senha do banco em local seguro. Você precisará dela para a `DATABASE_URL`.

2. **Service Role Key**: Mantenha a `SUPABASE_SERVICE_ROLE_KEY` segura. Ela tem acesso total ao banco e não deve ser exposta no frontend.

3. **RLS**: O Row Level Security garante que usuários só acessem seus próprios dados, mesmo que o código tenha bugs.

4. **Triggers**: Os triggers garantem que `updated_at` seja atualizado automaticamente e que novos usuários tenham perfil e configurações criados.

5. **Índices**: Os índices melhoram a performance das consultas por `user_id` e `year_month`.

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do backend (`npm run dev:backend`)
2. Verifique o console do navegador (F12)
3. Verifique os logs do Supabase em **Logs** → **Postgres Logs**
4. Consulte a documentação do Supabase: [docs.supabase.com](https://docs.supabase.com)

---

**Pronto!** Seu banco de dados está configurado e pronto para uso! 🎉
