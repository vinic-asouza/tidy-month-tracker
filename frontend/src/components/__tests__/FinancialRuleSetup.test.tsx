import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FinancialRuleSetup } from '@/components/FinancialRuleSetup';

function Harness({
  onAddCategory,
  onDeleteCategory,
}: {
  onAddCategory?: (category: string) => void;
  onDeleteCategory?: (category: string) => void;
}) {
  const [categories, setCategories] = useState(['Moradia', 'Lazer']);

  return (
    <FinancialRuleSetup
      open
      onOpenChange={() => {}}
      onComplete={async () => {}}
      categories={categories}
      unmappedCategories={['Moradia']}
      onAddCategory={async (category) => {
        onAddCategory?.(category);
        setCategories((current) => [...current, category]);
      }}
      onDeleteCategory={async (category) => {
        onDeleteCategory?.(category);
        setCategories((current) => current.filter((item) => item !== category));
      }}
    />
  );
}

describe('FinancialRuleSetup categorias', () => {
  it('inclui categoria sem mapeamento e exclui outra', async () => {
    const onAddCategory = vi.fn();
    const onDeleteCategory = vi.fn();
    render(<Harness onAddCategory={onAddCategory} onDeleteCategory={onDeleteCategory} />);

    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Nova categoria'), { target: { value: 'Saúde' } });
    fireEvent.click(screen.getByRole('button', { name: 'Incluir' }));

    expect(onAddCategory).toHaveBeenCalledWith('Saúde');
    expect(await screen.findByText('Saúde')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Lazer' }));
    expect(onDeleteCategory).toHaveBeenCalledWith('Lazer');
    expect(screen.queryByText('Lazer')).not.toBeInTheDocument();
  });

  it('não inclui nome que já existe', () => {
    const onAddCategory = vi.fn();
    render(<Harness onAddCategory={onAddCategory} />);

    fireEvent.change(screen.getByLabelText('Nova categoria'), { target: { value: ' Moradia ' } });
    const include = screen.getByRole('button', { name: 'Incluir' });
    expect(include).toBeDisabled();
    fireEvent.click(include);
    expect(onAddCategory).not.toHaveBeenCalled();
  });
});
