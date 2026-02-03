import { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreditCard } from '@/types/finance';

interface CreditCardSectionProps {
  creditCards: CreditCard[];
  onAdd: (card: Omit<CreditCard, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<CreditCard>) => void;
  onDelete: (id: string) => void;
  getCardTotal: (cardName: string) => number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const CreditCardSection = ({
  creditCards,
  onAdd,
  onUpdate,
  onDelete,
  getCardTotal,
}: CreditCardSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const resetForm = () => {
    setName('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!name) return;

    if (editingId) {
      onUpdate(editingId, { name });
    } else {
      onAdd({ name, paid: false });
    }
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (card: CreditCard) => {
    setEditingId(card.id);
    setName(card.name);
    setIsOpen(true);
  };

  const totalInvoices = creditCards.reduce((sum, card) => sum + getCardTotal(card.name), 0);

  return (
    <div className="bg-card rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h3 className="text-lg font-semibold">Cartões de Crédito</h3>
          <span className="text-sm text-muted-foreground">
            ({formatCurrency(totalInvoices)})
          </span>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="default">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Cartão' : 'Novo Cartão'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome do Cartão</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingId ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {creditCards.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">
          Nenhum cartão cadastrado
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {creditCards.map((card) => {
            const total = getCardTotal(card.name);
            return (
              <div
                key={card.id}
                className={`p-4 rounded-lg border-2 transition-all group ${
                  card.paid
                    ? 'border-income/30 bg-income-light'
                    : 'border-border bg-secondary/30 hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{card.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(card)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onDelete(card.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className={`text-xl font-bold mt-2 ${total > 0 ? 'text-expense' : 'text-muted-foreground'}`}>
                  {formatCurrency(total)}
                </p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <Checkbox
                    id={`card-paid-${card.id}`}
                    checked={card.paid}
                    onCheckedChange={(checked) => onUpdate(card.id, { paid: !!checked })}
                  />
                  <label
                    htmlFor={`card-paid-${card.id}`}
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Fatura paga
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
