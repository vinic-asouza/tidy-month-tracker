export const ONBOARDING_LAST_STEP = 3;

export type OnboardingPrimaryAction = 'next' | 'open-rule' | 'open-expenses' | 'complete';

export type OnboardingStepContent = {
  id: 'purpose' | 'rule' | 'entry' | 'summary';
  title: string;
  body: string;
  primaryLabel: string;
  primaryAction: OnboardingPrimaryAction;
};

export const ONBOARDING_STEPS: readonly OnboardingStepContent[] = [
  {
    id: 'purpose',
    title: 'O Finto é o mês, visto com calma',
    body: 'Aqui você registra o que entrou, o que saiu e o que separou para investir. O registro é manual de propósito: é o momento de olhar para o dinheiro antes de seguir o mês.',
    primaryLabel: 'Próximo',
    primaryAction: 'next',
  },
  {
    id: 'rule',
    title: 'A regra financeira é a sua combinação',
    body: 'A meta usual é 50% essenciais, 30% estilo de vida e 20% investimentos. Você pode ajustar e mapear as categorias. Se quiser lançar primeiro, pule este passo — a regra não é obrigatória para usar o Finto.',
    primaryLabel: 'Configurar regra',
    primaryAction: 'open-rule',
  },
  {
    id: 'entry',
    title: 'O primeiro lançamento é uma linha do mês',
    body: 'Entrada, gasto ou investimento nascem planejados. Você marca como recebido, pago ou aportado quando acontece. Desejo fica de fora do caixa até virar gasto.',
    primaryLabel: 'Ir para gastos',
    primaryAction: 'open-expenses',
  },
  {
    id: 'summary',
    title: 'O resumo lê o que já aconteceu',
    body: 'Por padrão o mês mostra o efetivado: o que você marcou como ocorrido. O modo Planejados mostra a intenção. A regra, quando existe, compara os gastos efetivados com a combinação que você salvou.',
    primaryLabel: 'Concluir',
    primaryAction: 'complete',
  },
];

export function clampOnboardingStep(step: number): number {
  if (!Number.isFinite(step) || step < 0) return 0;
  if (step > ONBOARDING_LAST_STEP) return ONBOARDING_LAST_STEP;
  return Math.floor(step);
}

export function shouldOfferOnboarding(input: {
  completedAt: string | null;
  step: number;
  hasFinancialRule: boolean;
  hasLancamento: boolean;
}): boolean {
  if (input.completedAt) return false;
  const step = clampOnboardingStep(input.step);
  if (step === 0 && (input.hasFinancialRule || input.hasLancamento)) return false;
  return true;
}
