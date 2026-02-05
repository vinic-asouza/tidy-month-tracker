import { useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { Investment } from '@/types/finance';

interface InvestmentSectionProps {
  investments: Investment[];
  tags: string[];
  onAdd: (investment: Omit<Investment, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Investment>) => void;
  onDelete: (id: string) => void;
  onAddTag: (tag: string) => void;
  onUpdateTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
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
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  selectedIds,
  onSelectionChange,
}: InvestmentSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Tag management
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [valueError, setValueError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);

  const resetForm = () => {
    setDescription('');
    setValue('');
    setSelectedTag('');
    setEditingId(null);
    setDescriptionError(null);
    setValueError(null);
    setTagError(null);
  };

  const handleSubmit = () => {
    const numValue = parseCurrencyToNumber(value);
    let hasError = false;
    
    if (!description.trim()) {
      setDescriptionError('Descrição é obrigatória');
      hasError = true;
    }
    if (numValue <= 0) {
      setValueError('Valor deve ser maior que zero');
      hasError = true;
    }
    if (!selectedTag) {
      setTagError('Selecione uma instituição');
      hasError = true;
    }
    
    if (hasError) return;

    if (editingId) {
      onUpdate(editingId, { description: description.trim(), value: numValue, tag: selectedTag });
    } else {
      onAdd({
        description: description.trim(),
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
      const newSet = new Set(selectedIds);
      newSet.delete(deleteId);
      onSelectionChange(newSet);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    onSelectionChange(newSet);
  };
  
  // Tag management handlers
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };
  
  const handleSaveTagEdit = () => {
    if (editingTag && editingTagValue.trim() && editingTagValue !== editingTag) {
      onUpdateTag(editingTag, editingTagValue.trim());
    }
    setEditingTag(null);
    setEditingTagValue('');
  };
  
  const handleDeleteTag = (tag: string) => {
    // Check if any investment uses this tag
    const hasInvestments = investments.some(i => i.tag === tag);
    if (hasInvestments) {
      return; // Don't delete if in use
    }
    onDeleteTag(tag);
  };

  const total = investments.reduce((sum, i) => sum + i.value, 0);
  const selectedTotal = investments
    .filter(i => selectedIds.has(i.id))
    .reduce((sum, i) => sum + i.value, 0);

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
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-investment">
                {formatCurrency(total)}
              </p>
              {selectedIds.size > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">| Investido:</span>
                  <p className="text-base font-bold text-investment">
                    {formatCurrency(selectedTotal)}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Tag Management Popover */}
          <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
            <PopoverTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                className="rounded-xl"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 rounded-xl p-4" align="end">
              <h4 className="font-semibold mb-3 text-sm">Gerenciar Instituições</h4>
              
              {/* Add new tag */}
              <div className="flex gap-2 mb-3">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Nova instituição..."
                  className="rounded-lg h-9 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button 
                  size="sm" 
                  onClick={handleAddTag}
                  className="rounded-lg h-9 px-3"
                  disabled={!newTag.trim() || tags.includes(newTag.trim())}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* List of tags */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {tags.map((tag) => {
                  const isUsed = investments.some(i => i.tag === tag);
                  const isEditing = editingTag === tag;
                  
                  return (
                    <div 
                      key={tag} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted"
                    >
                      {isEditing ? (
                        <Input
                          value={editingTagValue}
                          onChange={(e) => setEditingTagValue(e.target.value)}
                          className="h-7 text-sm rounded-md flex-1"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveTagEdit()}
                          onBlur={handleSaveTagEdit}
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 text-sm truncate">{tag}</span>
                      )}
                      
                      {!isEditing && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md"
                            onClick={() => {
                              setEditingTag(tag);
                              setEditingTagValue(tag);
                            }}
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md"
                            onClick={() => handleDeleteTag(tag)}
                            disabled={isUsed}
                            title={isUsed ? 'Esta instituição está em uso' : 'Excluir'}
                          >
                            <Trash2 className={`h-3 w-3 ${isUsed ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          
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
                  <Select value={selectedTag} onValueChange={(v) => { setSelectedTag(v); setTagError(null); }}>
                    <SelectTrigger className={`rounded-xl h-11 ${tagError ? 'border-destructive' : ''}`}>
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
                  {tagError && (
                    <p className="text-destructive text-sm mt-1">{tagError}</p>
                  )}
                </div>

                {/* Description and Value on same line */}
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Descrição
                    </label>
                    <Input
                      value={description}
                      onChange={(e) => { setDescription(e.target.value); setDescriptionError(null); }}
                      placeholder="Ex: Tesouro Direto, CDB..."
                      className={`rounded-xl h-11 ${descriptionError ? 'border-destructive' : ''}`}
                    />
                    {descriptionError && (
                      <p className="text-destructive text-sm mt-1">{descriptionError}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-2 block text-muted-foreground">
                      Valor
                    </label>
                    <CurrencyInput
                      value={value}
                      onValueChange={(v) => { setValue(v); setValueError(null); }}
                      className={`rounded-xl h-11 ${valueError ? 'border-destructive' : ''}`}
                    />
                    {valueError && (
                      <p className="text-destructive text-sm mt-1">{valueError}</p>
                    )}
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
          {investments.map((investment) => {
            const isSelected = selectedIds.has(investment.id);
            return (
              <div
                key={investment.id}
                className={`group flex items-center gap-2 py-2.5 px-3 rounded-xl transition-all duration-200 cursor-default ${
                  isSelected ? 'bg-investment-light' : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(investment.id)}
                  className="h-4 w-4 rounded-md border-2 border-investment/50 data-[state=checked]:bg-investment data-[state=checked]:border-investment data-[state=checked]:text-white flex-shrink-0"
                />

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
            );
          })}
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