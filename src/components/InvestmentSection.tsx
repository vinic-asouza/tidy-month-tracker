import { useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Investment } from '@/types/finance';

interface InvestmentSectionProps {
  investments: Investment[];
  tags: string[];
  onAdd: (investment: Omit<Investment, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Investment>) => void;
  onDelete: (id: string) => void;
  onReorder: (investments: Investment[]) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatValueForInput = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const InvestmentSection = ({
  investments,
  tags,
  onAdd,
  onUpdate,
  onDelete,
  onReorder,
}: InvestmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const resetForm = () => {
    setDescription('');
    setValue('');
    setSelectedTag('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    const numValue = parseCurrencyToNumber(value);
    if (!description || numValue <= 0 || !selectedTag) return;

    if (editingId) {
      onUpdate(editingId, { description, value: numValue, tag: selectedTag });
    } else {
      onAdd({
        description,
        value: numValue,
        tag: selectedTag,
        date: new Date().toISOString(),
      });
    }
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (investment: Investment) => {
    setEditingId(investment.id);
    setDescription(investment.description);
    setValue(formatValueForInput(investment.value));
    setSelectedTag(investment.tag);
    setIsOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newInvestments = [...investments];
    const draggedItem = newInvestments[draggedIndex];
    newInvestments.splice(draggedIndex, 1);
    newInvestments.splice(index, 0, draggedItem);
    onReorder(newInvestments);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const total = investments.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-investment shadow-glow-investment">
            <PiggyBank className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Investimentos</h3>
            <p className="text-base font-bold text-investment">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="rounded-xl gradient-investment shadow-glow-investment hover:opacity-90 transition-opacity text-white border-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingId ? 'Editar Investimento' : 'Novo Investimento'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              {/* Tag Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Instituição
                </label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {tags.map((tag) => (
                      <SelectItem key={tag} value={tag} className="rounded-lg">
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description and Value on same line */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3">
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Descrição
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Tesouro Direto, CDB..."
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-2 block text-muted-foreground">
                    Valor
                  </label>
                  <CurrencyInput
                    value={value}
                    onValueChange={setValue}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full h-11 rounded-xl gradient-investment shadow-glow-investment hover:opacity-90 transition-opacity text-white border-0"
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Investimento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {investments.length === 0 ? (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-investment-light mb-3">
            <PiggyBank className="h-6 w-6 text-investment" />
          </div>
          <p className="text-muted-foreground text-sm">
            Nenhum investimento registrado
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {investments.map((investment, index) => (
            <div
              key={investment.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group flex items-center gap-2 py-2.5 px-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all duration-200 cursor-default ${
                draggedIndex === index ? 'opacity-50' : ''
              }`}
            >
              {/* Drag Handle */}
              <div className="w-0 overflow-hidden group-hover:w-5 transition-all duration-200 flex-shrink-0">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
              </div>

              {/* Tag */}
              <Badge 
                variant="secondary" 
                className="text-xs bg-investment-light text-investment border-0 rounded-md px-2 py-0.5 flex-shrink-0"
              >
                {investment.tag}
              </Badge>

              {/* Description */}
              <span className="flex-1 text-sm font-medium truncate text-foreground">
                {investment.description}
              </span>

              {/* Value */}
              <span className="font-bold text-investment whitespace-nowrap text-sm flex-shrink-0 transition-all duration-200">
                {formatCurrency(investment.value)}
              </span>

              {/* Actions */}
              <div className="flex gap-1 w-0 overflow-hidden group-hover:w-16 transition-all duration-200 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-muted"
                  onClick={() => handleEdit(investment)}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg hover:bg-muted"
                  onClick={() => setDeleteId(investment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir investimento"
        description="Tem certeza que deseja excluir este investimento? Esta ação não pode ser desfeita."
      />
    </div>
  );
};
