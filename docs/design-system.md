# Design System — Finto

Referência consolidada de tokens visuais do produto para uso em ferramentas externas (Figma, Canva, apresentações, etc.).

| Campo | Valor |
|-------|-------|
| **Produto** | Finto |
| **Stack** | Tailwind CSS 3 + shadcn/ui + CSS Variables (HSL) |
| **Tema** | Light (padrão) + Dark (classe `.dark` no `<html>`) |

---

## 1. Tipografia

### Família

| Token | Valor |
|-------|-------|
| **Primária** | Plus Jakarta Sans |
| **Fallback** | system-ui, sans-serif |
| **Google Fonts** | `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap` |
| **Pesos usados** | 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (ExtraBold) |

### Escala tipográfica (Tailwind)

| Classe | Tamanho | Line-height | Uso típico |
|--------|---------|-------------|------------|
| `text-2xs` | 10px (0.625rem) | 14px | Badges compactos, contadores |
| `text-xs` | 12px | 16px | Labels secundários, metadados |
| `text-sm` | 14px | 20px | Corpo secundário, botões, inputs (desktop) |
| `text-base` | 16px | 24px | Corpo principal, inputs (mobile) |
| `text-lg` | 18px | 28px | Subtítulos, descrições de seção |
| `text-xl` | 20px | 28px | Títulos de diálogo |
| `text-2xl` | 24px | 32px | Títulos de card |
| `text-3xl` | 30px | 36px | Hero (mobile) |
| `text-4xl` | 36px | 40px | Hero (tablet) |
| `text-5xl` | 48px | 1 | Hero (desktop) |

### Pesos e estilo

| Classe | Peso | Uso |
|--------|------|-----|
| `font-medium` | 500 | Botões, labels, badges |
| `font-semibold` | 600 | Títulos de seção, diálogos |
| `font-bold` | 700 | Valores monetários, hero, marca |
| `tracking-tight` | -0.025em | Títulos e wordmark |
| `tabular-nums` | — | Valores financeiros (alinhamento de dígitos) |
| `antialiased` | — | Aplicado globalmente no `body` |

---

## 2. Cores — formato dos tokens

No código, as cores são definidas como **componentes HSL sem a função**:

```
--token: H S% L%
```

No CSS/Tailwind, usam-se como `hsl(var(--token))` ou `hsl(var(--token) / 0.5)` para opacidade.

Neste documento, cada cor aparece em três formatos para facilitar importação externa:

- **HSL** — valor canônico do código
- **CSS** — pronto para colar em stylesheets
- **HEX** — aproximação para Figma/Canva

---

## 3. Cores — tema claro (Light)

### Superfícies e texto

| Token | HSL | CSS | HEX | Uso |
|-------|-----|-----|-----|-----|
| `background` | 225 25% 97% | `hsl(225, 25%, 97%)` | `#F5F6F9` | Fundo da aplicação |
| `foreground` | 225 25% 8% | `hsl(225, 25%, 8%)` | `#0F121A` | Texto principal |
| `card` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Cards, painéis elevados |
| `card-foreground` | 225 25% 8% | `hsl(225, 25%, 8%)` | `#0F121A` | Texto em cards |
| `popover` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Dropdowns, popovers |
| `popover-foreground` | 225 25% 8% | `hsl(225, 25%, 8%)` | `#0F121A` | Texto em popovers |

### Ações e estados

| Token | HSL | CSS | HEX | Uso |
|-------|-----|-----|-----|-----|
| `primary` | 0 0% 12% | `hsl(0, 0%, 12%)` | `#1F1F1F` | Botões primários, CTAs |
| `primary-foreground` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Texto sobre primary |
| `secondary` | 225 20% 94% | `hsl(225, 20%, 94%)` | `#EDEEF3` | Botões secundários, fundos suaves |
| `secondary-foreground` | 225 25% 20% | `hsl(225, 25%, 20%)` | `#262D40` | Texto sobre secondary |
| `muted` | 225 15% 92% | `hsl(225, 15%, 92%)` | `#E8E9EE` | Fundos desabilitados, tracks |
| `muted-foreground` | 225 12% 48% | `hsl(225, 12%, 48%)` | `#6C7389` | Texto auxiliar, placeholders |
| `accent` | 0 0% 96% | `hsl(0, 0%, 96%)` | `#F5F5F5` | Hover em ghost/outline |
| `accent-foreground` | 0 0% 12% | `hsl(0, 0%, 12%)` | `#1F1F1F` | Texto sobre accent |
| `destructive` | 0 84% 60% | `hsl(0, 84%, 60%)` | `#EF4343` | Exclusão, erros críticos |
| `destructive-foreground` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Texto sobre destructive |

### Bordas e foco

| Token | HSL | CSS | HEX | Uso |
|-------|-----|-----|-----|-----|
| `border` | 225 15% 88% | `hsl(225, 15%, 88%)` | `#DCDEE5` | Bordas de cards, divisores |
| `input` | 225 15% 88% | `hsl(225, 15%, 88%)` | `#DCDEE5` | Bordas de inputs |
| `ring` | 0 0% 12% | `hsl(0, 0%, 12%)` | `#1F1F1F` | Anel de foco (focus-visible) |

### Cores semânticas financeiras

| Token | HSL | CSS | HEX | Uso |
|-------|-----|-----|-----|-----|
| `income` | 160 84% 39% | `hsl(160, 84%, 39%)` | `#10B77F` | Entradas / receitas |
| `income-foreground` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Texto sobre income |
| `income-light` | 160 60% 95% | `hsl(160, 60%, 95%)` | `#EBFAF5` | Fundo suave de entradas |
| `income-muted` | 160 40% 88% | `hsl(160, 40%, 88%)` | `#D4EDE4` | Bordas/áreas muted de entradas |
| `expense` | 350 89% 60% | `hsl(350, 89%, 60%)` | `#F43E5C` | Gastos / despesas |
| `expense-foreground` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Texto sobre expense |
| `expense-light` | 350 70% 96% | `hsl(350, 70%, 96%)` | `#FCEEF0` | Fundo suave de gastos |
| `expense-muted` | 350 50% 90% | `hsl(350, 50%, 90%)` | `#F2D9DD` | Bordas/áreas muted de gastos |
| `investment` | 220 92% 60% | `hsl(220, 92%, 60%)` | `#3B7AF7` | Investimentos |
| `investment-foreground` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Texto sobre investment |
| `investment-light` | 220 80% 96% | `hsl(220, 80%, 96%)` | `#EDF2FD` | Fundo suave de investimentos |
| `investment-muted` | 220 50% 90% | `hsl(220, 50%, 90%)` | `#D9E1F2` | Bordas/áreas muted de investimentos |
| `credit` | 28 90% 58% | `hsl(28, 90%, 58%)` | `#F48D34` | Cartões de crédito |
| `credit-foreground` | 0 0% 100% | `hsl(0, 0%, 100%)` | `#FFFFFF` | Texto sobre credit |
| `credit-light` | 28 100% 96% | `hsl(28, 100%, 96%)` | `#FFF4EB` | Fundo suave de cartões |
| `credit-muted` | 28 80% 90% | `hsl(28, 80%, 90%)` | `#FAE4D1` | Bordas/áreas muted de cartões |

### Gráficos (paleta estendida)

| Token | HSL | HEX | Uso |
|-------|-----|-----|-----|
| `chart-1` | 0 0% 12% | `#1F1F1F` | Série neutra / saldo |
| `chart-2` | 160 84% 39% | `#10B77F` | Entradas |
| `chart-3` | 350 89% 60% | `#F43E5C` | Gastos |
| `chart-4` | 220 92% 60% | `#3B7AF7` | Investimentos |
| `chart-5` | 38 92% 50% | `#F59F0A` | Série adicional (âmbar) |
| `chart-6` | 280 70% 55% | `#A73CDD` | Série adicional (roxo) |
| `chart-7` | 180 70% 45% | `#22C3C3` | Série adicional (ciano) |
| `chart-8` | 30 90% 55% | `#F48C25` | Série adicional (laranja) |

### Sidebar

| Token | HSL | HEX |
|-------|-----|-----|
| `sidebar-background` | 0 0% 100% | `#FFFFFF` |
| `sidebar-foreground` | 225 25% 20% | `#262D40` |
| `sidebar-primary` | 0 0% 12% | `#1F1F1F` |
| `sidebar-primary-foreground` | 0 0% 100% | `#FFFFFF` |
| `sidebar-accent` | 0 0% 96% | `#F5F5F5` |
| `sidebar-accent-foreground` | 0 0% 12% | `#1F1F1F` |
| `sidebar-border` | 225 15% 90% | `#E3E5EB` |
| `sidebar-ring` | 0 0% 12% | `#1F1F1F` |

---

## 4. Cores — tema escuro (Dark)

Ativado com a classe `dark` no elemento raiz.

| Token | HSL | HEX | Nota |
|-------|-----|-----|------|
| `background` | 0 0% 4% | `#0A0A0A` | Fundo principal |
| `foreground` | 0 0% 96% | `#F5F5F5` | Texto principal |
| `card` | 0 0% 8% | `#141414` | Cards |
| `primary` | 0 0% 90% | `#E6E6E6` | Inverte relação do light |
| `primary-foreground` | 0 0% 9% | `#171717` | |
| `secondary` | 0 0% 13% | `#212121` | |
| `muted` | 0 0% 13% | `#212121` | |
| `muted-foreground` | 0 0% 58% | `#949494` | |
| `accent` | 0 0% 16% | `#292929` | |
| `destructive` | 0 72% 50% | `#DB2424` | |
| `border` / `input` | 0 0% 16% | `#292929` | |
| `ring` | 0 0% 90% | `#E6E6E6` | |
| `income` | 160 70% 50% | `#26D99D` | Mais claro que no light |
| `expense` | 350 80% 62% | `#EC516A` | |
| `investment` | 220 85% 65% | `#5A8CF2` | |
| `credit` | 28 90% 60% | `#F5933D` | |

Variantes `-light` e `-muted` no dark usam tons escuros saturados (ex.: `income-light`: 160 15% 13%).

---

## 5. Bordas e raios (Border Radius)

| Token | Valor | px | Uso |
|-------|-------|-----|-----|
| `--radius-sm` | 0.375rem | 6px | Elementos compactos |
| `--radius-md` | 0.5rem | 8px | Botões, inputs (padrão shadcn) |
| `--radius-lg` | 0.625rem | 10px | Cards |
| `--radius-xl` | 0.75rem | 12px | Modais, painéis grandes |
| `--radius` (base) | 0.625rem | 10px | Referência global no app |
| `rounded-full` | 9999px | — | Badges, pills, avatares |
| `rounded-2xl` | calc(radius-xl + 0.25rem) | 16px | Containers especiais |

### Espessura de borda

| Contexto | Valor |
|----------|-------|
| Padrão global | `1px solid` via `border-border` |
| Cards | `border` (1px) |
| Inputs / outline buttons | `border border-input` (1px) |
| Glass border (utilitário) | `1px solid white/10` |

---

## 6. Espaçamento e layout

### Container

| Propriedade | Valor |
|-------------|-------|
| Max-width (`2xl`) | 1400px |
| Padding horizontal | 1.5rem (24px) |
| Centralizado | sim |

### Espaçamentos frequentes (Tailwind → px)

| Classe | px | Uso |
|--------|-----|-----|
| `p-6` | 24px | Padding interno de cards |
| `px-4` | 16px | Padding horizontal de botões |
| `px-3` | 12px | Padding horizontal de inputs |
| `gap-2` | 8px | Gap em botões com ícone |
| `gap-3` | 12px | Grupos de ações |
| `space-y-1.5` | 6px | Espaço entre título e descrição em cards |

### Breakpoints (Tailwind padrão)

| Prefixo | Min-width |
|---------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1400px (container) |

---

## 7. Sombras

### Tailwind (`boxShadow`)

| Token | Valor |
|-------|-------|
| `shadow-sm` | Sombra padrão de cards shadcn |
| `shadow-glow` | `0 0 16px -4px hsl(var(--primary) / 0.2)` |
| `shadow-glow-income` | `0 0 16px -4px hsl(var(--income) / 0.2)` |
| `shadow-glow-expense` | `0 0 16px -4px hsl(var(--expense) / 0.2)` |
| `shadow-glow-investment` | `0 0 16px -4px hsl(var(--investment) / 0.2)` |
| `shadow-glow-credit` | `0 0 16px -4px hsl(var(--credit) / 0.22)` |

### Utilitários customizados

**`.card-shadow`** (cards em repouso):
```css
box-shadow:
  0 0 0 1px hsl(var(--border) / 0.5),
  0 1px 2px 0 hsl(var(--foreground) / 0.03),
  0 4px 8px -2px hsl(var(--foreground) / 0.04);
```

**`.card-shadow-hover`** (hover):
```css
box-shadow:
  0 0 0 1px hsl(var(--border) / 0.6),
  0 4px 6px -1px hsl(var(--foreground) / 0.06),
  0 10px 20px -5px hsl(var(--foreground) / 0.08);
```

**`.card-shadow-lg`** (elevação alta):
```css
box-shadow:
  0 0 0 1px hsl(var(--border) / 0.4),
  0 8px 16px -4px hsl(var(--foreground) / 0.08),
  0 20px 40px -8px hsl(var(--foreground) / 0.1);
```

---

## 8. Gradientes

| Classe | Direção | Cores |
|--------|---------|-------|
| `.gradient-income` | 135deg | `income` → `hsl(160, 84%, 50%)` |
| `.gradient-expense` | 135deg | `expense` → `hsl(350, 89%, 70%)` |
| `.gradient-investment` | 135deg | `investment` → `hsl(220, 92%, 70%)` |
| `.gradient-credit` | 135deg | `credit` → `hsl(28, 95%, 68%)` |
| `.gradient-subtle` | 180deg | `background` → `muted/30%` |
| `.text-gradient` | 135deg | `primary` → `hsl(0, 0%, 28%)` (texto com clip) |

---

## 9. Efeitos e superfícies

| Utilitário | Descrição |
|------------|-----------|
| `.glass` | `bg-background/90 backdrop-blur-md` (app) |
| `.glass` (landing) | `bg-card/80 backdrop-blur-xl` |
| `.glass-border` | Borda `white/10` |
| `.dot-pattern` | Pontos `muted-foreground/15%`, grid 20×20px |
| `.hover-lift` | `translateY(-2px)` no hover, transição 300ms ease-out |

### Scrollbar customizada

| Parte | Estilo |
|-------|--------|
| Largura/altura | 8px |
| Track | `hsl(var(--muted))`, radius 4px |
| Thumb | `muted-foreground/30%`, radius 4px |
| Thumb hover | `muted-foreground/50%` |

---

## 10. Componentes base (shadcn/ui)

Baseado em [shadcn/ui](https://ui.shadcn.com/) estilo `default`, `baseColor: slate`, com CSS variables.

### Botão

| Propriedade | Valor |
|-------------|-------|
| Fonte | `text-sm font-medium` |
| Radius | `rounded-md` (8px) |
| Focus | `ring-2 ring-ring ring-offset-2` |
| Ícones | 16×16px (`size-4`) |

| Variante | Estilo |
|----------|--------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` |
| `destructive` | `bg-destructive text-destructive-foreground` |
| `outline` | `border border-input bg-background hover:bg-accent` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `ghost` | `hover:bg-accent` |
| `link` | `text-primary underline-offset-4` |

| Tamanho | Dimensões |
|---------|-----------|
| `default` | h-40px, px-16px |
| `sm` | h-36px, px-12px |
| `lg` | h-44px, px-32px |
| `icon` | 40×40px |

### Input

| Propriedade | Valor |
|-------------|-------|
| Altura | 40px (`h-10`) |
| Radius | `rounded-md` |
| Borda | `border-input` |
| Padding | `px-3 py-2` |
| Texto | `text-base` mobile / `text-sm` desktop |
| Placeholder | `text-muted-foreground` |

### Card

| Parte | Estilo |
|-------|--------|
| Container | `rounded-lg border bg-card shadow-sm` |
| Header padding | `p-6` |
| Title | `text-2xl font-semibold tracking-tight` |
| Description | `text-sm text-muted-foreground` |
| Content | `p-6 pt-0` |

### Badge

| Propriedade | Valor |
|-------------|-------|
| Forma | `rounded-full` |
| Padding | `px-2.5 py-0.5` |
| Texto | `text-xs font-semibold` |

### Dialog

| Parte | Estilo |
|-------|--------|
| Title | `text-lg font-semibold tracking-tight` |
| Description | `text-sm text-muted-foreground` |
| Animação abertura | fade 300ms `cubic-bezier(0.16, 1, 0.3, 1)` |
| Animação fechamento | fade 250ms `cubic-bezier(0.4, 0, 0.2, 1)` |

---

## 11. Animações e transições

| Nome | Duração | Easing | Uso |
|------|---------|--------|-----|
| `animate-in` | 200ms | ease-out | Entrada de elementos (opacity + translateY 4px) |
| `expand-in` | 350ms | ease-out | Listas expandidas |
| `collapse-out` | 300ms | ease-in | Colapso de listas |
| `fade-in` | 300–400ms | ease-out | Landing, seções |
| `scale-in` | 200ms | ease-out | Modais compactos |
| `slide-up` | 400ms | ease-out | Conteúdo ascendente |
| `pulse-soft` | 2s | ease-in-out infinite | Indicadores sutis |
| `float` (landing) | 4s | ease-in-out infinite | Elementos flutuantes |
| `progress-fill` | 800ms | cubic-bezier(0.4, 0, 0.2, 1) | Barras de progresso |
| Sheet (direita) | 300ms / 250ms | custom cubic-bezier | Painéis laterais |

### Curvas de easing usadas

| Nome | Valor |
|------|-------|
| Entrada suave | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Saída padrão | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Sheet slide | `cubic-bezier(0.32, 0.72, 0, 1)` |

---

## 12. Ícones

| Biblioteca | [Lucide React](https://lucide.dev/) |
|------------|-------------------------------------|
| Tamanho padrão em botões | 16×16px |
| Tamanho médio | 20×20px (`h-5 w-5`) |
| Cor | Herda `currentColor` do texto pai |

---

## 13. Marca (Brand)

| Asset | Caminho |
|-------|---------|
| Logo | `landing/public/brand/logo.png` |
| OG Image | `landing/public/og-image.png` |
| Wordmark | "Finto" — `font-bold tracking-tight` |
| Tamanhos do ícone | 32×32px (sm), 36×36px (md) |

Screenshot de referência do produto: `landing/public/screenshots/dashboard-light.png`

---

## 14. Paleta rápida para ferramentas externas

Copie estas cores principais para Figma, Canva ou apresentações:

```
Marca / Primary:     #1F1F1F
Background:          #F5F6F9
Foreground:          #0F121A
Muted text:          #6C7389
Border:              #DCDEE5
Card:                #FFFFFF

Entradas (verde):    #10B77F
Gastos (rosa):       #F43E5C
Investimentos (azul):#3B7AF7
Cartões (laranja):   #F48D34
Erro / Delete:       #EF4343
```

### Fonte para importar

```
Plus Jakarta Sans
```

Pesos recomendados: Regular (400), Medium (500), Semibold (600), Bold (700)

---

## 15. Export JSON (design tokens)

```json
{
  "name": "Finto",
  "fontFamily": {
    "sans": ["Plus Jakarta Sans", "system-ui", "sans-serif"]
  },
  "colors": {
    "light": {
      "background": "#F5F6F9",
      "foreground": "#0F121A",
      "card": "#FFFFFF",
      "primary": "#1F1F1F",
      "primaryForeground": "#FFFFFF",
      "secondary": "#EDEEF3",
      "muted": "#E8E9EE",
      "mutedForeground": "#6C7389",
      "border": "#DCDEE5",
      "destructive": "#EF4343",
      "income": "#10B77F",
      "incomeLight": "#EBFAF5",
      "expense": "#F43E5C",
      "expenseLight": "#FCEEF0",
      "investment": "#3B7AF7",
      "investmentLight": "#EDF2FD",
      "credit": "#F48D34",
      "creditLight": "#FFF4EB"
    },
    "dark": {
      "background": "#0A0A0A",
      "foreground": "#F5F5F5",
      "card": "#141414",
      "primary": "#E6E6E6",
      "primaryForeground": "#171717",
      "border": "#292929",
      "income": "#26D99D",
      "expense": "#EC516A",
      "investment": "#5A8CF2",
      "credit": "#F5933D"
    }
  },
  "borderRadius": {
    "sm": "6px",
    "md": "8px",
    "lg": "10px",
    "xl": "12px",
    "full": "9999px"
  },
  "spacing": {
    "containerPadding": "24px",
    "containerMaxWidth": "1400px"
  }
}
```
