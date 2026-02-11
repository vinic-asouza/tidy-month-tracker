# Plano de Desenvolvimento - Regra Financeira (50/30/20)

## 📋 Visão Geral

Implementação de funcionalidade de Regra Financeira personalizável (50/30/20 ou customizada) no módulo de Estatísticas, permitindo que usuários configurem percentuais e mapeiem categorias de gastos para acompanhar seu desempenho financeiro.

---

## ✅ Status de Implementação

- [x] **FASE 1: Banco de Dados** - ✅ CONCLUÍDA
- [x] **FASE 2: Backend** - ✅ CONCLUÍDA
- [x] **FASE 3: Frontend** - ✅ CONCLUÍDA
- [x] **FASE 4: Cálculos e Lógica** - ✅ CONCLUÍDA
- [ ] **FASE 5: Design e Refinamentos** - 🔄 PENDENTE

---

## 🎯 Objetivos

1. Permitir configuração de regra financeira (50/30/20 padrão ou personalizada)
2. Mapear categorias de gastos para Essenciais e Estilo de Vida
3. Calcular e exibir desempenho atual vs. meta
4. Mostrar projeções baseadas em padrões semanais
5. Fornecer feedback visual claro sobre o status da regra

---

## 🗄️ FASE 1: Banco de Dados

### 1.1 Criar Tabela `financial_rule`

**Arquivo:** `supabase/migrations/XXXX_create_financial_rule.sql`

```sql
-- Tabela de regra financeira do usuário
CREATE TABLE IF NOT EXISTS public.financial_rule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Configuração da regra (percentuais)
  essentials_percentage DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  lifestyle_percentage DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  investments_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  
  -- Mapeamento de categorias (JSONB)
  -- Formato: {"Moradia": "essentials", "Roupas": "lifestyle", ...}
  category_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Flag para indicar se está usando regra padrão ou personalizada
  is_custom BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Validação: soma dos percentuais deve ser 100
  CONSTRAINT check_percentages_sum CHECK (
    essentials_percentage + lifestyle_percentage + investments_percentage = 100.00
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_financial_rule_user_id ON public.financial_rule(user_id);

-- RLS Policies
ALTER TABLE public.financial_rule ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só podem ver suas próprias regras
CREATE POLICY "Users can view own financial rule"
  ON public.financial_rule FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Usuários só podem inserir suas próprias regras
CREATE POLICY "Users can insert own financial rule"
  ON public.financial_rule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários só podem atualizar suas próprias regras
CREATE POLICY "Users can update own financial rule"
  ON public.financial_rule FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Usuários só podem deletar suas próprias regras
CREATE POLICY "Users can delete own financial rule"
  ON public.financial_rule FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_financial_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER financial_rule_updated_at
  BEFORE UPDATE ON public.financial_rule
  FOR EACH ROW
  EXECUTE FUNCTION update_financial_rule_updated_at();
```

### 1.2 Atualizar Setup Completo

**Arquivo:** `supabase/setup-completo.sql`

- Adicionar criação da tabela `financial_rule` no script principal

---

## 🔧 FASE 2: Backend

### 2.1 Criar Interface TypeScript

**Arquivo:** `backend/src/services/financialRule.ts`

```typescript
export interface FinancialRule {
  id: string;
  userId: string;
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFinancialRuleInput {
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
}

export interface UpdateFinancialRuleInput {
  essentialsPercentage?: number;
  lifestylePercentage?: number;
  investmentsPercentage?: number;
  categoryMapping?: Record<string, 'essentials' | 'lifestyle'>;
  isCustom?: boolean;
}
```

### 2.2 Implementar Serviços

**Arquivo:** `backend/src/services/financialRule.ts`

Funções a implementar:
- `getFinancialRule(userId: string): Promise<FinancialRule | null>`
- `createFinancialRule(userId: string, data: CreateFinancialRuleInput): Promise<FinancialRule>`
- `updateFinancialRule(userId: string, data: UpdateFinancialRuleInput): Promise<FinancialRule>`
- `deleteFinancialRule(userId: string): Promise<void>`

### 2.3 Criar Rotas API

**Arquivo:** `backend/src/routes/financialRule.ts`

Endpoints:
- `GET /api/financial-rule` - Obter regra do usuário
- `POST /api/financial-rule` - Criar regra
- `PUT /api/financial-rule` - Atualizar regra
- `DELETE /api/financial-rule` - Deletar regra

### 2.4 Integrar Rotas no App

**Arquivo:** `backend/src/index.ts`

- Adicionar rota `/api/financial-rule` ao router

### 2.5 Validações

- Validar que soma dos percentuais = 100
- Validar que todas as categorias estão mapeadas
- Validar tipos de dados (percentuais entre 0-100)

---

## 🎨 FASE 3: Frontend

### 3.1 Criar Tipos TypeScript

**Arquivo:** `frontend/src/types/financialRule.ts`

```typescript
export interface FinancialRule {
  id: string;
  userId: string;
  essentialsPercentage: number;
  lifestylePercentage: number;
  investmentsPercentage: number;
  categoryMapping: Record<string, 'essentials' | 'lifestyle'>;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialRuleStats {
  essentials: {
    target: number; // percentual
    current: number; // percentual
    targetValue: number; // valor em R$
    currentValue: number; // valor em R$
    difference: number; // diferença percentual
    differenceValue: number; // diferença em R$
  };
  lifestyle: {
    target: number;
    current: number;
    targetValue: number;
    currentValue: number;
    difference: number;
    differenceValue: number;
  };
  investments: {
    target: number;
    current: number;
    targetValue: number;
    currentValue: number;
    difference: number;
    differenceValue: number;
  };
  projection?: {
    essentials: number;
    lifestyle: number;
    investments: number;
  };
}
```

### 3.2 Criar Serviço de API

**Arquivo:** `frontend/src/services/financialRule.ts`

Funções:
- `getFinancialRule(): Promise<FinancialRule | null>`
- `createFinancialRule(data: CreateFinancialRuleInput): Promise<FinancialRule>`
- `updateFinancialRule(data: UpdateFinancialRuleInput): Promise<FinancialRule>`
- `deleteFinancialRule(): Promise<void>`

### 3.3 Criar Hook Customizado

**Arquivo:** `frontend/src/hooks/useFinancialRule.ts`

Hook que:
- Gerencia estado da regra
- Carrega regra do backend
- Fornece funções para criar/atualizar/deletar
- Calcula estatísticas baseadas em `monthData`

### 3.4 Criar Componente de Setup (Wizard)

**Arquivo:** `frontend/src/components/FinancialRuleSetup.tsx`

**Estrutura:**
- Modal/Dialog com 2 passos
- **Passo 1:** Escolher modelo (50/30/20 ou personalizado)
  - Radio buttons ou Toggle
  - Se personalizado: inputs para percentuais com validação (soma = 100)
- **Passo 2:** Mapear categorias
  - Lista de todas as categorias de `settings.expenseCategories`
  - Para cada categoria: Select com opções "Essenciais" ou "Estilo de Vida"
  - Validação: todas devem estar mapeadas
  - Botão "Concluir" só habilitado quando tudo mapeado

**UX/UI:**
- Indicador de progresso (1/2, 2/2)
- Botões "Voltar" e "Próximo"
- Feedback visual de validação
- Mensagens de erro claras

### 3.5 Criar Componente de Exibição

**Arquivo:** `frontend/src/components/FinancialRuleDisplay.tsx`

**Bloco 1: Comparação Percentual**
- Título: "Sua Regra: X% / Y% / Z%"
- 3 cards (Essenciais, Estilo de Vida, Investimentos)
- Cada card mostra:
  - Meta: X%
  - Atual: Y% (cor verde/vermelha)
  - Diferença: ±Z%
- Barra de progresso horizontal:
  - Verde até a meta
  - Vermelho se ultrapassar
  - Linha indicadora da meta

**Bloco 2: Baseado na Renda**
- Título: "Renda do mês: R$ X.XXX,XX"
- 3 cards mostrando:
  - "Deveriam ser: R$ X.XXX,XX"
  - "Você gastou: R$ X.XXX,XX"
  - "Diferença: R$ ±X.XXX,XX" (verde/vermelho)

**Bloco 3: Modo Projeção**
- Só exibe se mês não acabou
- Título: "Se você continuar nesse ritmo, terminará o mês com:"
- Cards com percentuais projetados
- Cálculo baseado em padrões semanais

### 3.6 Criar Componente Principal

**Arquivo:** `frontend/src/components/FinancialRuleSection.tsx`

- Seção colapsável (similar ao Resumo Anual)
- Se não houver regra configurada: exibir botão "Configurar Regra"
- Se houver regra: exibir `FinancialRuleDisplay`
- Botão de editar configuração

### 3.7 Integrar em Statistics

**Arquivo:** `frontend/src/components/Statistics.tsx`

- Adicionar `FinancialRuleSection` como nova seção
- Passar `monthData` como prop
- Passar `settings.expenseCategories` para mapeamento

### 3.8 Atualizar useSupabaseFinance (se necessário)

**Arquivo:** `frontend/src/hooks/useSupabaseFinance.ts`

- Verificar se precisa integrar com hook de regra financeira

---

## 📊 FASE 4: Cálculos e Lógica

### 4.1 Cálculo de Estatísticas

**Função:** `calculateFinancialRuleStats(rule, monthData)`

**Lógica:**
1. Calcular renda total: `sum(monthData.incomes.map(i => i.value))`
2. Calcular essenciais: 
   - Filtrar `monthData.expenses` onde `category` está mapeada para "essentials"
   - Somar valores
3. Calcular estilo de vida:
   - Filtrar `monthData.expenses` onde `category` está mapeada para "lifestyle"
   - Somar valores
4. Calcular investimentos: `sum(monthData.investments.map(i => i.value))`
5. Calcular percentuais: `(valor / renda_total) * 100`
6. Calcular valores esperados: `(renda_total * percentual_meta) / 100`
7. Calcular diferenças

### 4.2 Cálculo de Projeção

**Função:** `calculateProjection(rule, monthData, currentDate)`

**Lógica:**
1. Verificar se mês não acabou
2. Calcular dias passados no mês
3. Calcular dias totais do mês
4. Calcular semanas passadas (padrão semanal)
5. Calcular semanas totais do mês
6. Para cada tipo (essenciais, lifestyle, investments):
   - Calcular média semanal atual
   - Projetar: `media_semanal * semanas_totais`
   - Calcular percentual projetado

---

## 🎨 FASE 5: Design e UX

### 5.1 Componentes Visuais

- **Barras de Progresso:**
  - Usar componente customizado ou criar novo
  - Cores: verde (dentro da meta), vermelho (acima da meta)
  - Indicador de meta (linha vertical ou marcador)

- **Cards:**
  - Seguir padrão de `StatCard` existente
  - Cores: `bg-income-light`, `bg-expense-light`, `bg-investment-light`
  - Textos: `text-income`, `text-expense`, `text-investment`

- **Wizard:**
  - Modal com backdrop
  - Indicador de progresso no topo
  - Animações suaves entre passos
  - Validação em tempo real

### 5.2 Feedback Visual

- Ícones para status (✓ verde, ⚠️ amarelo, ✗ vermelho)
- Animações de transição
- Mensagens de sucesso/erro com toast

---

## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Criar migration SQL
- [ ] Criar tabela `financial_rule`
- [ ] Configurar RLS policies
- [ ] Criar triggers
- [ ] Testar no Supabase

### Backend
- [ ] Criar interface TypeScript
- [ ] Implementar `getFinancialRule`
- [ ] Implementar `createFinancialRule`
- [ ] Implementar `updateFinancialRule`
- [ ] Implementar `deleteFinancialRule`
- [ ] Criar rotas API
- [ ] Integrar rotas no app
- [ ] Adicionar validações
- [ ] Testar endpoints

### Frontend - Serviços
- [ ] Criar tipos TypeScript
- [ ] Criar serviço de API
- [ ] Testar chamadas

### Frontend - Hooks
- [ ] Criar `useFinancialRule`
- [ ] Integrar com serviços
- [ ] Testar hook

### Frontend - Componentes
- [ ] Criar `FinancialRuleSetup` (Wizard)
  - [ ] Passo 1: Escolher modelo
  - [ ] Passo 2: Mapear categorias
  - [ ] Validações
- [ ] Criar `FinancialRuleDisplay`
  - [ ] Bloco 1: Comparação percentual
  - [ ] Bloco 2: Baseado na renda
  - [ ] Bloco 3: Projeção
- [ ] Criar `FinancialRuleSection`
- [ ] Integrar em `Statistics.tsx`

### Frontend - Lógica
- [ ] Implementar `calculateFinancialRuleStats`
- [ ] Implementar `calculateProjection`
- [ ] Testar cálculos

### Testes e Refinamentos
- [ ] Testar fluxo completo
- [ ] Ajustar UX/UI
- [ ] Otimizar performance
- [ ] Adicionar loading states
- [ ] Adicionar error handling
- [ ] Documentar código

---

## 📝 Notas Importantes

1. **Primeira vez:** Exibir wizard automaticamente se não houver regra configurada
2. **Mapeamento obrigatório:** Todas as categorias devem estar mapeadas antes de concluir
3. **Validação:** Soma dos percentuais deve ser exatamente 100%
4. **Projeções:** Usar padrões semanais (não diários)
5. **Cálculos:** Considerar TODOS os itens (não apenas marcados)
6. **Design:** Seguir padrões visuais existentes do projeto

---

## 🚀 Próximos Passos

1. Executar FASE 1 (Banco de Dados)
2. Executar FASE 2 (Backend)
3. Executar FASE 3 (Frontend)
4. Executar FASE 4 (Cálculos)
5. Executar FASE 5 (Refinamentos)

---

**Data de Criação:** 2024
**Status:** Planejamento Completo - Pronto para Implementação
