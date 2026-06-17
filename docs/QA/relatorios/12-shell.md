# Relatório QA — 12 Shell / Preferências

| Campo | Valor |
|-------|-------|
| **Módulo** | Shell / Preferências |
| **Data** | 2026-06-17 |
| **Arquivos analisados** | `frontend/src/pages/Index.tsx` (header, tema, menu, footer), `frontend/src/pages/NotFound.tsx`, `frontend/src/components/brand/BrandMark.tsx` |

---

## Resumo executivo

**Veredito geral:** Aprovado com ressalvas — shell polido em PT-BR exceto 404.

| Severidade | Quantidade |
|------------|------------|
| Crítico | 0 |
| Alto | 0 |
| Médio | 2 |
| Baixo | 2 |

---

## Mapa de fluxos validados

| # | Item | Status |
|---|------|--------|
| 1 | Header sticky com logo e navegação | OK |
| 2 | Tema claro/escuro | OK |
| 3 | Menu mobile (Sheet) | OK |
| 4 | Footer | OK |
| 5 | Página 404 | Achado (idioma) |

---

## Achados

### Página 404 em inglês

**Severidade:** Médio

**Evidência:** `NotFound.tsx` L7-9 — "Oops! Page not found", "Return to Home".

**Recomendação:** Traduzir; usar `Link` do react-router em vez de `<a href>`.

---

### Rota 404 acessível sem autenticação com link para `/`

**Severidade:** Médio

**Evidência:** `App.tsx` L34 — `NotFound` fora de `ProtectedRoute`. Link para `/` redireciona não autenticados para `/auth` — OK, mas mensagem confusa.

---

### Sheet mobile com `modal={false}`

**Severidade:** Baixo

**Evidência:** `Index.tsx` L319 — permite interação com conteúdo atrás do menu.

---

### Overlay de tema bloqueia UI por 400ms fixos

**Severidade:** Baixo

**Evidência:** `Index.tsx` L236-242 — pode parecer lentidão desnecessária.

---

## Itens sem achado

- `storageKey` tema persistente
- Navegação Mensal/Anual desktop
- Logout no menu mobile
- BrandMark responsivo

## Referências cruzadas

- Módulo 01 (auth redirect de `/`)
