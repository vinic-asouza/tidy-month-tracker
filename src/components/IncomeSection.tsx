import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IncomeEntry } from '@/types/finance';

interface IncomeSectionProps {
  incomes: IncomeEntry[];
  tags: string[];
  onAdd: (income: Omit<IncomeEntry, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<IncomeEntry>) => void;
  onDelete: (id: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const IncomeSection = ({
  incomes,
  tags,
  onAdd,
  onUpdate,
  onDelete,
  onAddTag,
}: IncomeSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const resetForm = () => {
    setDescription('');
    setValue('');
    setSelectedTags([]);
    setEditingId(null);
    setNewTag('');
  };

  const handleSubmit = () => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (!description || isNaN(numValue)) return;

    if (editingId) {
      onUpdate(editingId, { description, value: numValue, tags: selectedTags });
    } else {
      onAdd({
        description,
        value: numValue,
        tags: selectedTags,
        date: new Date().toISOString(),
      });
    }
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (income: IncomeEntry) => {
    setEditingId(income.id);
    setDescription(income.description);
    setValue(income.value.toString());
    setSelectedTags(income.tags);
    setIsOpen(true);
  };

  const handleAddNewTag = () => {
    if (newTag && !tags.includes(newTag)) {
      onAddTag(newTag);
      setSelectedTags([...selectedTags, newTag]);
      setNewTag('');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const total = incomes.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="bg-card rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-income rounded-full" />
          <h3 className="text-lg font-semibold">Entradas</h3>
          <span className="text-sm text-muted-foreground">
            ({formatCurrency(total)})
          </span>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-income hover:bg-income/90 text-income-foreground">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Entrada' : 'Nova Entrada'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Salário janeiro"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Valor (R$)</label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0,00"
                  type="text"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Nova tag..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddNewTag}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full bg-income hover:bg-income/90 text-income-foreground">
                {editingId ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {incomes.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">
          Nenhuma entrada registrada
        </p>
      ) : (
        <div className="space-y-2">
          {incomes.map((income) => (
            <div
              key={income.id}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group hover:bg-secondary transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{income.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {income.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="font-semibold text-income whitespace-nowrap">
                  {formatCurrency(income.value)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(income)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(income.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
