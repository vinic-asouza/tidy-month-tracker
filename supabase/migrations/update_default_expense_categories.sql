-- Lista padrão de categorias de gasto para contas novas.
-- Não reescreve finance_settings já gravado.

ALTER TABLE public.finance_settings
  ALTER COLUMN expense_categories SET DEFAULT ARRAY[
    'Moradia', 'Compras Gerais', 'Vestuário', 'Assinaturas',
    'Trabalho', 'Serviços Gerais', 'Mercado', 'Lanches',
    'Transporte', 'Presentes', 'Lazer', 'Saúde', 'Bem Estar', 'Internet/Telefone',
    'Educação', 'Viagem', 'Empréstimos', 'Doação', 'Taxas'
  ]::text[];
