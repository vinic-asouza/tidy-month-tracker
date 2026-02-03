import { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon, CheckCircle2 } from 'lucide-react';
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

// Card brand colors
const CARD_COLORS = [
  { bg: 'from-violet-500 to-purple-600', accent: 'bg-violet-400' },
  { bg: 'from-orange-500 to-red-500', accent: 'bg-orange-400' },
  { bg: 'from-emerald-500 to-teal-600', accent: 'bg-emerald-400' },
  { bg: 'from-blue-500 to-indigo-600', accent: 'bg-blue-400' },
  { bg: 'from-pink-500 to-rose-600', accent: 'bg-pink-400' },
  { bg: 'from-amber-500 to-orange-600', accent: 'bg-amber-400' },
];

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
    <div className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-primary shadow-glow">
            <CreditCardIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Cartões</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(totalInvoices)}
            </p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="rounded-xl gradient-primary shadow-glow hover:opacity-90 transition-opacity text-white border-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingId ? 'Editar Cartão' : 'Novo Cartão'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Nome do Cartão
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nubank, Inter, C6..."
                  className="rounded-xl h-11"
                />
              </div>
              <Button 
                onClick={handleSubmit} 
                className="w-full h-11 rounded-xl gradient-primary shadow-glow hover:opacity-90 transition-opacity text-white border-0"
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Cartão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards Grid */}
      {creditCards.length === 0 ? (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-3">
            <CreditCardIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Nenhum cartão cadastrado
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {creditCards.map((card, index) => {
            const total = getCardTotal(card.name);
            const colors = CARD_COLORS[index % CARD_COLORS.length];
            
            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover-lift ${
                  card.paid ? 'opacity-70' : ''
                }`}
              >
                {/* Card Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-90`} />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-12 -translate-x-12" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="h-5 w-5 text-white/80" />
                      <span className="font-semibold text-white">{card.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
                        onClick={() => handleEdit(card)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
                        onClick={() => onDelete(card.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Fatura atual</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-white/20">
                    <Checkbox
                      id={`card-paid-${card.id}`}
                      checked={card.paid}
                      onCheckedChange={(checked) => onUpdate(card.id, { paid: !!checked })}
                      className="h-5 w-5 rounded-md border-2 border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
                    />
                    <label
                      htmlFor={`card-paid-${card.id}`}
                      className="text-sm text-white/80 cursor-pointer flex items-center gap-1.5"
                    >
                      {card.paid && <CheckCircle2 className="h-4 w-4" />}
                      Fatura paga
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
