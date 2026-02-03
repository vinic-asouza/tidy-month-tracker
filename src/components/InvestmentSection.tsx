import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Investment } from '@/types/finance';

interface InvestmentSectionProps {
  investments: Investment[];
  tags: string[];
  onAdd: (investment: Omit<Investment, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Investment>) => void;
  onDelete: (id: string) => void;
  onAddTag: (tag: string) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const InvestmentSection = ({
  investments,
  tags,
  onAdd,
  onUpdate,
  onDelete,
  onAddTag,
}: InvestmentSectionProps) => {
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

  const handleEdit = (investment: Investment) => {
    setEditingId(investment.id);
    setDescription(investment.description);
    setValue(investment.value.toString());
    setSelectedTags(investment.tags);
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

  const total = investments.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="bg-card rounded-xl p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 bg-investment rounded-full" />
          <h3 className="text-lg font-semibold">Investimentos</h3>
          <span className="text-sm text-muted-foreground">
            ({formatCurrency(total)})
          </span>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-investment hover:bg-investment/90 text-investment-foreground">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Investimento' : 'Novo Investimento'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Tesouro Direto"
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
              <Button onClick={handleSubmit} className="w-full bg-investment hover:bg-investment/90 text-investment-foreground">
                {editingId ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {investments.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-6">
          Nenhum investimento registrado
        </p>
      ) : (
        <div className="space-y-2">
          {investments.map((investment) => (
            <div
              key={investment.id}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg group hover:bg-secondary transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{investment.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {investment.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="font-semibold text-investment whitespace-nowrap">
                  {formatCurrency(investment.value)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(investment)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(investment.id)}
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
