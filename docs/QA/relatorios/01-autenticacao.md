# Relatório QA — 01 Autenticação

| Campo | Valor |
|-------|-------|
| **Módulo** | Autenticação |
| **Data** | 2026-06-17 |
| **Metodologia** | Auditoria estática de código |
| **Referência** | [ANALISE_FRONTEND_QA.md](../ANALISE_FRONTEND_QA.md) — Módulo: Autenticação |
| **Arquivos analisados** | `frontend/src/pages/Auth.tsx`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/App.tsx`, `frontend/src/integrations/supabase/client.ts`, `frontend/src/pages/Index.tsx` (logout) |

---

## Resumo executivo

**Objetivo do módulo:** Permitir cadastro, login, logout e persistência de sessão via Supabase Auth, protegendo a rota principal (`/`).

**Veredito geral:** Aprovado com ressalvas — fluxos principais estão implementados com validação client-side e guard de rota, mas há fragilidade no mapeamento de erros, lacunas de UX (recuperação de senha) e ausência de tratamento de falha no logout.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 1 |
| Médio | 3 |
| Baixo | 4 |

---

## Mapa de fluxos validados

| # | Fluxo / Checklist | Status | Observação |
|---|-------------------|--------|------------|
| 1 | Cadastro com e-mail válido e senha ≥ 6 caracteres | OK | Zod em `Auth.tsx` L12-13, L33-58 |
| 2 | Cadastro rejeita senhas diferentes | OK | L52-54 |
| 3 | Login com credenciais válidas redireciona para `/` | OK | L79-80 + `useEffect` L27-31 |
| 4 | Login com credenciais inválidas exibe toast | OK com ressalva | Depende de string em inglês (Achado #1) |
| 5 | Login sem e-mail confirmado exibe mensagem | OK com ressalva | Achado #1; config Supabase não verificável |
| 6 | Logout retorna à tela de auth | OK | `signOut` → `user=null` → `ProtectedRoute` redireciona |
| 7 | Recarregar `/` mantém sessão | Não verificável | `persistSession: true` + `localStorage` em `client.ts` |
| 8 | Acessar `/` sem sessão redireciona para `/auth` | OK | `ProtectedRoute.tsx` L21-23 |
| 9 | Recarregar `/auth` não causa 404 (SPA) | Não verificável | Config Vercel fora do escopo de código |
| 10 | Persistência e refresh de token | OK | `AuthContext.tsx` L25-63, anti-deslogar em `TOKEN_REFRESHED` |
| 11 | Usuário logado em `/auth` redireciona para `/` | OK | `Auth.tsx` L27-31 |

---

## Áreas obrigatórias de validação

### 1. Fluxo do usuário

Jornada login/cadastro em tela única com toggle. Passos mínimos (e-mail, senha, submit). Cadastro adiciona confirmação de senha. Feedback via toasts Sonner e erros inline. Loading bloqueia formulário.

**Fricção:** não há link "Esqueci minha senha". Ao alternar login/cadastro, campos de senha permanecem preenchidos.

### 2. Regras de negócio

- Senha mínima 6 caracteres — implementada (Zod).
- E-mail válido — implementada (Zod `.email()`).
- Confirmação de senha no cadastro — implementada.
- `emailRedirectTo` no signup aponta para `window.location.origin + '/'` — correto para confirmação pós-e-mail.

### 3. Validações

Frontend: e-mail, senha mínima, confirmação. **Ausente:** trim de e-mail, senha máxima, complexidade de senha (não exigida pela análise).

Backend/Supabase: validações de auth delegadas ao Supabase; não há validação adicional no adaptador.

### 4. Tratamento de erros

Login e cadastro mapeiam 3 erros conhecidos por substring em `error.message`. Demais erros exibem mensagem bruta do Supabase (geralmente em inglês). `signOut` não trata erro nem exibe feedback.

### 5. Estados da interface

| Estado | Implementação |
|--------|---------------|
| Loading auth inicial | Spinner em `Auth.tsx` L100-106 e `ProtectedRoute` L13-18 |
| Loading submit | Botão desabilitado + spinner L204-207 |
| Erros de campo | Borda vermelha + texto abaixo do campo |
| Sucesso login | Toast + navigate |
| Sucesso cadastro | Toast + volta ao modo login |

### 6. Consistência da experiência

Textos em português na UI de auth. Toasts alinhados ao restante do app (Sonner). Spinner igual ao dashboard.

### 7. Persistência e dados

Sessão em `localStorage` via supabase-js. `sessionRef` evita re-renders desnecessários. Signup dispara trigger DB (`profiles`, `finance_settings`) — fora do frontend.

### 8. Código e implementação

Estrutura clara: Context + Page + ProtectedRoute. Sem código morto no módulo. `QueryClientProvider` em `App.tsx` não é usado por auth.

### 9. Casos de borda

- `TOKEN_REFRESHED` com session null: tratado com `getSession()` — bom.
- Env vars ausentes: `createClient(undefined, undefined)` — falha em runtime sem mensagem amigável (Achado #4).
- Duplo redirect no login: `navigate` em submit e `useEffect` quando `user` muda — redundante, sem impacto funcional.

### 10. Segurança funcional

- Rota `/` protegida por `user` truthy.
- Chave anon no client — esperado para SPA com RLS.
- Sem exposição de `service_role`.
- Sem rate limiting no frontend (esperado; Supabase limita no servidor).

---

## Achados

### Mapeamento de erros depende de strings em inglês do Supabase

**Severidade:** Alto

**Módulo:** Autenticação

**Fluxo afetado:** Login e cadastro — tratamento de erros

**Evidência:**

Arquivos:
- `frontend/src/pages/Auth.tsx` (L71-77, L85-88)

```typescript
if (error.message.includes('Invalid login credentials')) { ... }
else if (error.message.includes('Email not confirmed')) { ... }
if (error.message.includes('User already registered')) { ... }
```

**Comportamento atual:** Mensagens amigáveis em PT-BR só aparecem se o Supabase retornar exatamente essas strings em inglês. Qualquer mudança de idioma, código de erro ou versão da API pode fazer o usuário ver mensagem técnica em inglês via `toast.error(error.message)`.

**Comportamento esperado:** Mapear por `error.status` / `error.code` (ex.: `AuthApiError`) ou enum estável, com fallback genérico em português.

**Impacto:** Usuário confuso; suporte difícil; regressão silenciosa em atualizações do Supabase.

**Recomendação:** Substituir `includes()` em mensagens por códigos documentados do `@supabase/supabase-js`. Manter fallback PT-BR genérico.

---

### Ausência de recuperação de senha ("Esqueci minha senha")

**Severidade:** Médio

**Módulo:** Autenticação

**Fluxo afetado:** Login — usuário que esqueceu a senha

**Evidência:** `Auth.tsx` não contém chamada a `supabase.auth.resetPasswordForEmail` nem link/UI correspondente. `AuthContext` expõe apenas `signUp`, `signIn`, `signOut`.

**Comportamento atual:** Usuário sem alternativa no app além de criar nova conta (se permitido) ou contato externo.

**Comportamento esperado:** Fluxo de reset por e-mail, padrão em apps com Supabase Auth.

**Impacto:** Bloqueio de acesso para usuários que esquecem senha; aumento de abandono.

**Recomendação:** Adicionar link e tela/fluxo de reset usando API Supabase, com redirect URL configurada no dashboard.

---

### E-mail não normalizado (sem trim) antes do envio

**Severidade:** Médio

**Módulo:** Autenticação

**Fluxo afetado:** Login e cadastro

**Evidência:** `Auth.tsx` — `signIn(email, password)` e `signUp(email, password)` usam valor bruto do input (L69, L83). Zod valida formato mas não aplica `.trim()`.

**Comportamento atual:** E-mail com espaços leading/trailing pode falhar login ou criar conta com e-mail inválido aparente.

**Comportamento esperado:** Normalizar e-mail (trim + lowercase opcional) antes de validar e enviar.

**Impacto:** Falsos negativos no login; contas duplicadas com variação de espaços.

**Recomendação:** Aplicar `email.trim().toLowerCase()` na fronteira do submit ou no `AuthContext`.

---

### Logout sem tratamento de erro nem feedback de falha

**Severidade:** Médio

**Módulo:** Autenticação

**Fluxo afetado:** Logout

**Evidência:**
- `AuthContext.tsx` L103-105: `signOut` apenas `await supabase.auth.signOut()` sem try/catch.
- `Index.tsx` L172-175: `handleSignOut` mostra toast de sucesso incondicional após `await signOut()`.

**Comportamento atual:** Se `signOut` falhar (rede), usuário pode ver "Logout realizado com sucesso!" permanecendo logado.

**Comportamento esperado:** Toast de erro em falha; sucesso só após confirmação.

**Impacto:** Estado inconsistente percebido pelo usuário; falsa confirmação de logout.

**Recomendação:** Retornar `{ error }` de `signOut` e condicionar toast em `Index.tsx`.

---

### Alternar login/cadastro não limpa campos sensíveis

**Severidade:** Baixo

**Módulo:** Autenticação

**Fluxo afetado:** Toggle "Cadastre-se" / "Faça login"

**Evidência:** `Auth.tsx` L222 — `setIsLogin(!isLogin); setErrors({})` — não reseta `password`, `confirmPassword`, `email`.

**Comportamento atual:** Senha digitada no cadastro permanece visível ao voltar ao login.

**Comportamento esperado:** Limpar campos de senha (e opcionalmente e-mail) ao alternar modo.

**Impacto:** Confusão leve; risco em dispositivo compartilhado.

**Recomendação:** Resetar `password` e `confirmPassword` no toggle.

---

### Variáveis de ambiente Supabase sem validação na inicialização

**Severidade:** Baixo

**Módulo:** Autenticação (infraestrutura)

**Fluxo afetado:** Qualquer operação de auth na inicialização

**Evidência:** `client.ts` L5-11 — `createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)` sem checagem se valores existem.

**Comportamento atual:** Build pode passar; runtime falha com erro opaco se env ausente.

**Comportamento esperado:** Falha rápida com mensagem clara em dev/build.

**Impacto:** Dificuldade de diagnóstico em deploy mal configurado.

**Recomendação:** Guard clause no `client.ts` ou validação no bootstrap do app.

---

### Redundância de navegação pós-login

**Severidade:** Baixo

**Módulo:** Autenticação

**Fluxo afetado:** Login bem-sucedido

**Evidência:** `Auth.tsx` L80 `navigate('/')` e L27-31 `useEffect` redireciona quando `user` definido.

**Comportamento atual:** Dois caminhos para o mesmo destino.

**Comportamento esperado:** Um único mecanismo (preferir reação ao `user` no context).

**Impacto:** Nenhum funcional relevante; possível flash duplo em edge cases.

**Recomendação:** Remover `navigate` explícito no submit ou o `useEffect` — manter apenas um.

---

### Ausência de limite máximo de senha no frontend

**Severidade:** Baixo

**Módulo:** Autenticação

**Fluxo afetado:** Cadastro

**Evidência:** `passwordSchema` só define `.min(6)` (`Auth.tsx` L13).

**Comportamento atual:** Senhas muito longas aceitas no client (Supabase pode ter limite próprio).

**Comportamento esperado:** Alinhar com limites do Supabase se documentados.

**Impacto:** Baixo; edge case raro.

**Recomendação:** Documentar ou adicionar `.max()` se houver limite conhecido.

---

## Itens sem achado

- Guard de rota com loading state antes de redirect
- Validação Zod de e-mail e senha mínima no client
- Confirmação de senha no cadastro
- Persistência de sessão configurada (`persistSession`, `autoRefreshToken`)
- Tratamento defensivo de `TOKEN_REFRESHED` com session null
- Prevenção de re-render desnecessário via `sessionRef` e comparação de `access_token`
- UI de loading durante verificação inicial de sessão
- Desabilitar formulário durante submit
- Redirect de usuário autenticado longe de `/auth`
- Uso exclusivo de chave publishable (não service role)

---

## Riscos residuais (não verificáveis estaticamente)

- Comportamento com confirmação de e-mail habilitada/desabilitada no dashboard Supabase
- Persistência de sessão após reload e entre abas
- SPA rewrite em `/auth` na Vercel
- Rate limiting e proteção de senha vazada (config Supabase)
- Isolamento RLS entre dois usuários (módulo transversal)
- Comportamento com `VITE_SUPABASE_*` inválidos em produção

---

## Referências cruzadas

- **Dashboard:** depende de `user` do `AuthContext` para carregar dados (`useSupabaseFinance`)
- **Shell:** logout implementado em `Index.tsx`, não em `AuthContext` consumers genéricos
- **Transversal:** modo `api` usa JWT da mesma sessão Supabase em `api/client.ts`
