import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OnboardingDialog } from '@/components/OnboardingDialog';

function renderDialog(step: number) {
  const handlers = {
    onPause: vi.fn(),
    onSkip: vi.fn(),
    onDismiss: vi.fn(),
    onPrimary: vi.fn(),
  };
  render(
    <OnboardingDialog
      open
      step={step}
      saving={false}
      {...handlers}
    />
  );
  return handlers;
}

describe('OnboardingDialog', () => {
  it('explica o propósito e deixa pular ou dispensar', () => {
    const handlers = renderDialog(0);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /O Finto é o mês/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pular este passo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }));
    expect(handlers.onSkip).toHaveBeenCalledOnce();
    expect(handlers.onDismiss).toHaveBeenCalledOnce();
  });

  it('no último passo conclui e não oferece pular o passo', () => {
    const handlers = renderDialog(3);
    expect(screen.getByRole('heading', { name: /O resumo lê o que já aconteceu/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pular este passo' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(handlers.onPrimary).toHaveBeenCalledOnce();
  });
});
