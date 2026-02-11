/**
 * Componente de Setup da Regra Financeira (Wizard)
 * 
 * Wizard de 2 passos:
 * 1. Escolher modelo (50/30/20 ou personalizado)
 * 2. Mapear categorias
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import type { CreateFinancialRuleInput, FinancialRule } from '@/types/domain';
import { cn } from '@/lib/utils';

interface FinancialRuleSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: CreateFinancialRuleInput) => Promise<void>;
  categories: string[];
  initialRule?: FinancialRule | null;
  unmappedCategories?: string[];
}

type RuleModel = 'default' | 'custom';

export const FinancialRuleSetup = ({
  open,
  onOpenChange,
  onComplete,
  categories,
  initialRule,
  unmappedCategories,
}: FinancialRuleSetupProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [ruleModel, setRuleModel] = useState<RuleModel>('default');
  const [essentialsPercentage, setEssentialsPercentage] = useState('50');
  const [lifestylePercentage, setLifestylePercentage] = useState('30');
  const [investmentsPercentage, setInvestmentsPercentage] = useState('20');
  const [categoryMapping, setCategoryMapping] = useState<Record<string, 'essentials' | 'lifestyle'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset / inicialização ao abrir
  useEffect(() => {
    if (open) {
      // Se houver categorias não mapeadas, ir direto para o passo 2
      setStep(unmappedCategories && unmappedCategories.length > 0 ? 2 : 1);
      setErrors({});

      if (initialRule) {
        // Modo edição: carregar dados existentes
        if (initialRule.isCustom) {
          setRuleModel('custom');
          setEssentialsPercentage(String(initialRule.essentialsPercentage));
          setLifestylePercentage(String(initialRule.lifestylePercentage));
          setInvestmentsPercentage(String(initialRule.investmentsPercentage));
        } else {
          setRuleModel('default');
          setEssentialsPercentage('50');
          setLifestylePercentage('30');
          setInvestmentsPercentage('20');
        }

        // Carrega mapeamento salvo
        setCategoryMapping(initialRule.categoryMapping || {});
      } else {
        // Primeira configuração
        setRuleModel('default');
        setEssentialsPercentage('50');
        setLifestylePercentage('30');
        setInvestmentsPercentage('20');
        setCategoryMapping({});
      }

      setErrors({});
    }
  }, [open, initialRule, unmappedCategories]);

  // Validação do passo 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (ruleModel === 'custom') {
      const essentials = parseFloat(essentialsPercentage);
      const lifestyle = parseFloat(lifestylePercentage);
      const investments = parseFloat(investmentsPercentage);

      if (isNaN(essentials) || essentials < 0 || essentials > 100) {
        newErrors.essentials = 'Percentual deve ser entre 0 e 100';
      }
      if (isNaN(lifestyle) || lifestyle < 0 || lifestyle > 100) {
        newErrors.lifestyle = 'Percentual deve ser entre 0 e 100';
      }
      if (isNaN(investments) || investments < 0 || investments > 100) {
        newErrors.investments = 'Percentual deve ser entre 0 e 100';
      }

      const sum = essentials + lifestyle + investments;
      if (Math.abs(sum - 100) > 0.01) {
        newErrors.sum = `A soma dos percentuais deve ser 100%. Atual: ${sum.toFixed(2)}%`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validação do passo 2
  const validateStep2 = (): boolean => {
    const mappedCategories = Object.keys(categoryMapping);
    const unmappedCategories = categories.filter((cat) => !mappedCategories.includes(cat));

    if (unmappedCategories.length > 0) {
      setErrors({
        mapping: `Todas as categorias devem estar mapeadas. Faltam: ${unmappedCategories.join(', ')}`,
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    try {
      const data: CreateFinancialRuleInput = {
        essentialsPercentage: ruleModel === 'default' ? 50 : parseFloat(essentialsPercentage),
        lifestylePercentage: ruleModel === 'default' ? 30 : parseFloat(lifestylePercentage),
        investmentsPercentage: ruleModel === 'default' ? 20 : parseFloat(investmentsPercentage),
        categoryMapping,
        isCustom: ruleModel === 'custom',
      };

      await onComplete(data);
      onOpenChange(false);
    } catch (error) {
      // Erro já tratado no onComplete
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryMappingChange = (category: string, type: 'essentials' | 'lifestyle') => {
    setCategoryMapping((prev) => ({
      ...prev,
      [category]: type,
    }));
    // Limpar erro de mapeamento ao fazer mudança
    if (errors.mapping) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.mapping;
        return newErrors;
      });
    }
  };

  const allCategoriesMapped = categories.every((cat) => categoryMapping[cat] !== undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Regra Financeira</DialogTitle>
          <DialogDescription>
            Configure sua regra financeira personalizada para acompanhar seus gastos
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de progresso */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className={cn('flex items-center gap-2', step >= 1 && 'text-primary')}>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                step === 1
                  ? 'bg-primary text-primary-foreground'
                  : step > 1
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium hidden sm:inline">Escolher Modelo</span>
          </div>
          <div className="w-12 h-0.5 bg-muted" />
          <div className={cn('flex items-center gap-2', step >= 2 && 'text-primary')}>
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                step === 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Mapear Categorias</span>
          </div>
        </div>

        {/* Conteúdo do passo 1 */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-base font-semibold mb-4 block">Escolha o modelo de regra</Label>
              <RadioGroup value={ruleModel} onValueChange={(value) => setRuleModel(value as RuleModel)}>
                <div className="flex items-center space-x-2 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="default" id="default" />
                  <Label htmlFor="default" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Regra 50/30/20 (Padrão)</div>
                    <div className="text-sm text-muted-foreground">
                      50% Essenciais, 30% Estilo de Vida, 20% Investimentos
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Personalizar Regra</div>
                    <div className="text-sm text-muted-foreground">
                      Defina seus próprios percentuais
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {ruleModel === 'custom' && (
              <div className="mt-2 space-y-3 rounded-xl border bg-muted/20 px-3 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="essentials" className="text-xs font-medium">
                      Essenciais (%)
                    </Label>
                    <Input
                      id="essentials"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={essentialsPercentage}
                      onChange={(e) => setEssentialsPercentage(e.target.value)}
                      className={cn(
                        'h-9 text-sm',
                        errors.essentials && 'border-destructive'
                      )}
                    />
                    {errors.essentials && (
                      <p className="text-xs text-destructive">{errors.essentials}</p>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="lifestyle" className="text-xs font-medium">
                      Estilo de Vida (%)
                    </Label>
                    <Input
                      id="lifestyle"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={lifestylePercentage}
                      onChange={(e) => setLifestylePercentage(e.target.value)}
                      className={cn(
                        'h-9 text-sm',
                        errors.lifestyle && 'border-destructive'
                      )}
                    />
                    {errors.lifestyle && (
                      <p className="text-xs text-destructive">{errors.lifestyle}</p>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="investments" className="text-xs font-medium">
                      Investimentos (%)
                    </Label>
                    <Input
                      id="investments"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={investmentsPercentage}
                      onChange={(e) => setInvestmentsPercentage(e.target.value)}
                      className={cn(
                        'h-9 text-sm',
                        errors.investments && 'border-destructive'
                      )}
                    />
                    {errors.investments && (
                      <p className="text-xs text-destructive">{errors.investments}</p>
                    )}
                  </div>
                </div>
                {errors.sum && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.sum}</AlertDescription>
                  </Alert>
                )}
                <div className="text-xs text-muted-foreground">
                  Soma: {(
                    parseFloat(essentialsPercentage || '0') +
                    parseFloat(lifestylePercentage || '0') +
                    parseFloat(investmentsPercentage || '0')
                  ).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo do passo 2 */}
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-base font-semibold mb-2 block">
                Mapeie as categorias de gastos
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                Defina quais categorias são Essenciais e quais são Estilo de Vida
              </p>
            </div>

            {errors.mapping && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.mapping}</AlertDescription>
              </Alert>
            )}

            {unmappedCategories && unmappedCategories.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {unmappedCategories.length} categoria(s) nova(s) precisa(m) ser mapeada(s)
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.map((category) => {
                const isUnmapped = unmappedCategories?.includes(category);
                return (
                  <div
                    key={category}
                    className={cn(
                      'flex items-center justify-between gap-3 p-2 rounded-lg border text-sm transition-colors',
                      isUnmapped
                        ? 'border-destructive bg-destructive/10'
                        : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Label className="font-medium truncate">{category}</Label>
                      {isUnmapped && (
                        <Badge variant="destructive" className="text-xs h-5 px-1.5">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <Select
                      value={categoryMapping[category]}
                      onValueChange={(value) =>
                        handleCategoryMappingChange(category, value as 'essentials' | 'lifestyle')
                      }
                    >
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essentials">Essenciais</SelectItem>
                        <SelectItem value="lifestyle">Estilo de Vida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            {allCategoriesMapped && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Todas as categorias foram mapeadas!</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <div className="flex justify-between w-full">
            {step === 2 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              {step === 1 ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting || !allCategoriesMapped}>
                  {isSubmitting ? 'Salvando...' : 'Concluir'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
