import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag, PiggyBank } from 'lucide-react';
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
    <div className="bg-card rounded-2xl p-6 card-shadow hover:card-shadow-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-investment shadow-glow-investment">
            <PiggyBank className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Investimentos</h3>
            <p className="text-sm text-muted-foreground">
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
              <div>
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
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Valor (R$)
                </label>
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0,00"
                  type="text"
                  className="rounded-xl h-11 text-lg font-medium"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className={`cursor-pointer rounded-lg px-3 py-1 transition-all ${
                        selectedTags.includes(tag) 
                          ? 'bg-investment text-investment-foreground hover:bg-investment/90' 
                          : 'hover:bg-investment-light hover:text-investment hover:border-investment/30'
                      }`}
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
                    className="flex-1 rounded-xl h-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddNewTag}
                    className="rounded-xl h-10 w-10"
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
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
        <div className="space-y-2">
          {investments.map((investment, index) => (
            <div
              key={investment.id}
              className="group flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-all duration-200"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-foreground">{investment.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {investment.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-2xs bg-investment-light text-investment border-0 rounded-md px-2 py-0.5"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="font-bold text-investment whitespace-nowrap text-lg">
                  {formatCurrency(investment.value)}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-muted"
                    onClick={() => handleEdit(investment)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                    onClick={() => onDelete(investment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
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
