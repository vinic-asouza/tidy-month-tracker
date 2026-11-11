---
type: regras-modulo
modulo: exportacao-portabilidade
ultima_atualizacao: 2026-11-11
---

# Regras — Exportação / Portabilidade

Módulo: [`../../04_modulos/exportacao-portabilidade.md`](../../04_modulos/exportacao-portabilidade.md).  
Plano: [ADR-013](../../07_decisoes-tecnicas/ADR-013-exportacao-portabilidade.md). Export anual agregado permanece em RN-R07.

| ID | Regra | Onde |
| --- | --- | --- |
| RN-EXP-01 | Exportação linha a linha só do usuário autenticado; CSV UTF-8 BOM `;`; sem gravação no Storage; Blob local | `dataExportCsv.ts`, `ExportMyDataDialog.tsx` |
| RN-EXP-02 | PDF complementar (quando existir) é sumário da janela, não dump linha a linha | Fora do MVP DEV-187 — follow-up |
| RN-EXP-03 | Naming e entrada de UI distintos de “Exportar anual” e “Importar CSV” (“Exportar meus dados”) | `Index.tsx`, `ExportMyDataDialog.tsx` |
