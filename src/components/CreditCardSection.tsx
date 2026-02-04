import { useState } from 'react';
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { CreditCard, CARD_COLORS } from '@/types/finance';
import { toast } from '@/hooks/use-toast';

interface CreditCardSectionProps {
  creditCards: CreditCard[];
  onAdd: (card: Omit<CreditCard, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<CreditCard>) => void;
  onDelete: (id: string) => void;
  getCardTotal: (cardName: string) => number;
  canDeleteCard: (cardName: string) => boolean;
  cardNameExists: (name: string, excludeId?: string) => boolean;
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
  canDeleteCard,
  cardNameExists,
}: CreditCardSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].id);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSelectedColor(CARD_COLORS[0].id);
    setEditingId(null);
    setNameError(null);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('Nome do cartão é obrigatório');
      return;
    }

    if (cardNameExists(name.trim(), editingId || undefined)) {
      setNameError('Já existe um cartão com este nome');
      return;
    }

    if (editingId) {
      onUpdate(editingId, { name: name.trim(), color: selectedColor });
    } else {
      onAdd({ name: name.trim(), color: selectedColor, paid: false });
    }
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (card: CreditCard) => {
    setEditingId(card.id);
    setName(card.name);
    setSelectedColor(card.color || CARD_COLORS[0].id);
    setIsOpen(true);
  };

  const handleDeleteAttempt = (card: CreditCard) => {
    if (!canDeleteCard(card.name)) {
      setDeleteError(`Não é possível excluir o cartão "${card.name}" pois existem gastos vinculados a ele. Remova os gastos primeiro.`);
      return;
    }
    setDeleteId(card.id);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getColorClass = (colorId: string) => {
    return CARD_COLORS.find(c => c.id === colorId)?.class || CARD_COLORS[0].class;
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
            <h3 className="text-lg font-semibold tracking-tight">Cartões de Crédito</h3>
            <p className="text-base font-bold text-primary">
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
                  onChange={(e) => { setName(e.target.value); setNameError(null); }}
                  placeholder="Ex: Nubank, Inter, C6..."
                  className={`rounded-xl h-11 ${nameError ? 'border-destructive' : ''}`}
                />
                {nameError && (
                  <p className="text-destructive text-sm mt-1">{nameError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Cor do Cartão
                </label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${getColorClass(selectedColor)}`} />
                        <span>{CARD_COLORS.find(c => c.id === selectedColor)?.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CARD_COLORS.map((color) => (
                      <SelectItem key={color.id} value={color.id} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${color.class}`} />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        <div className="grid gap-3 sm:grid-cols-2">
          {creditCards.map((card) => {
            const total = getCardTotal(card.name);
            const colorClass = getColorClass(card.color);
            
            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 hover-lift ${
                  card.paid ? 'opacity-70' : ''
                }`}
              >
                {/* Card Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-90`} />
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-10 translate-x-10" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="h-4 w-4 text-white/80" />
                      <span className="font-semibold text-white text-sm">{card.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
                        onClick={() => handleEdit(card)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-lg text-white/80 hover:text-white hover:bg-white/20"
                        onClick={() => handleDeleteAttempt(card)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-0.5">Fatura</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                    <Checkbox
                      id={`card-paid-${card.id}`}
                      checked={card.paid}
                      onCheckedChange={(checked) => onUpdate(card.id, { paid: !!checked })}
                      className="h-4 w-4 rounded-md border-2 border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-gray-900"
                    />
                    <label
                      htmlFor={`card-paid-${card.id}`}
                      className="text-xs text-white/80 cursor-pointer flex items-center gap-1"
                    >
                      {card.paid && <CheckCircle2 className="h-3 w-3" />}
                      Fatura paga
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir cartão"
        description="Tem certeza que deseja excluir este cartão? Esta ação não pode ser desfeita."
      />

      {/* Error Dialog - Cannot Delete */}
      <AlertDialog open={!!deleteError} onOpenChange={(open) => !open && setDeleteError(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Não é possível excluir
            </AlertDialogTitle>
            <AlertDialogDescription>{deleteError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setDeleteError(null)}
              className="rounded-xl"
            >
              Entendi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};