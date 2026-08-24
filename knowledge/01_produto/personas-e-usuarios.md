---
type: produto
titulo: Personas e usuários
ultima_atualizacao: 2026-08-21
---

# Personas e usuários

Modelo real do app e personas de comunicação. Sem inventar perfil além do que o marketing e o código já descrevem.

Visão: [`visao-do-produto.md`](./visao-do-produto.md). Jornadas: [`jornadas-de-usuario.md`](./jornadas-de-usuario.md).

---

## Modelo de usuário no produto

O Finto é **pessoal e individual**:

- Uma sessão = **um** usuário autenticado (e-mail e senha, Supabase Auth).
- Isolamento por conta: cada pessoa vê só os próprios dados (`auth.uid() = user_id` no banco).
- **Não há** perfis compartilhados, família, convite, papéis (admin/membro) nem multi-tenant na UI.
- Idioma da interface: português.

Isso vale para todas as personas abaixo: cada uma usa a **própria** conta, sozinha.

---

## Para quem o produto é

Quem quer uma relação mais consciente com o dinheiro — não só gráficos. Em especial quem:

- Aceita (ou deseja) o **registro manual** como parte do aprendizado
- Quer aplicar 50/30/20 na prática, não só na teoria
- Já usou app que importa o banco e **não mudou o comportamento**
- Precisa de espaço para refletir **antes** de comprar (desejos)
- Tem renda variável, vários cartões, ou várias contas e quer endereço para o dinheiro

**Não é o público principal:** quem busca Open Finance, extrato automático ou gestão compartilhada da casa.

---

## Personas (comunicação)

Origem: análise estratégica de produto (julho/2026). Usar em copy, aceite e priorização — não são contas no sistema.

### Marina — a organizada em formação

- **Contexto:** ~28 anos, CLT, mora sozinha, usa dois cartões.
- **Quer:** hábito financeiro; parar de estourar cartão; investir com consciência.
- **Dói:** o app do banco mostra extrato e o gasto continua igual; culpa no fim do mês.
- **No Finto:** ritual de registro, regra 50/30/20, fatura por cartão, lista de desejos.
- **Objeção:** “outro app importa tudo sozinho” → o manual **é** o método.

### Rafael — o autônomo em busca de consciência

- **Contexto:** ~35 anos, freelancer, renda variável.
- **Quer:** separar entradas por cliente/projeto; provisionar imposto e investimento.
- **Dói:** mês bom mascara mês ruim; não vê média real de gastos.
- **No Finto:** tags de entrada, visão anual, categorias próprias, repetição no ano civil.
- **Objeção:** “renda irregular quebra a regra?” → cada mês é uma nova reflexão.

### Camila — a consumidora consciente

- **Contexto:** ~32 anos, CLT, planeja compra grande (ex.: imóvel).
- **Quer:** refletir antes de comprar; alinhar desejo com prioridade.
- **Dói:** impulso; lista mental de “quero” vira dívida.
- **No Finto:** desejos com prazo e urgência, gastos fixos visíveis, regra financeira.
- **Objeção:** “wishlist de e-commerce?” → é reflexão antes da ação, fora do caixa até conquistar.

### André — o investidor que quer disciplina

- **Contexto:** ~40 anos, aporta em corretora / Tesouro.
- **Quer:** não pular aporte em mês apertado; não misturar contas.
- **Dói:** a corretora mostra posição, não o hábito de aportar.
- **No Finto:** seção de aportes + carteiras (movimentação vs. investimentos), origem→destino, visão anual.
- **Objeção:** “não substitui a corretora” → correto; o Finto constrói o **hábito**; a corretora guarda o ativo.

---

## Segmentos (resumo)

| Primário | Secundário |
| --- | --- |
| Construtor de hábitos | Autônomo / freelancer (várias entradas) |
| Aprendiz da regra 50/30/20 | Usuário de um ou mais cartões |
| Ex-usuário de apps automáticos | Ex-usuário de planilha |
| Consumidor impulsivo em recuperação | Multi-conta (corrente + poupança + corretora) |

---

## Implicação para o time

- Critérios de aceite e copy falam com **uma pessoa** na própria conta.
- Não projetar “convidar cônjuge” ou papéis sem decisão explícita de produto.
- Funcionalidades devem reforçar hábito e reflexão, não virar agregador passivo.
