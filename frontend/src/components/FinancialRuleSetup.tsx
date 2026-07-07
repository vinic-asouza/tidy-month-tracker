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
  const [categorySearch, setCategorySearch] = useState('');

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.trim().toLowerCase())
  );
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
      setCategorySearch('');
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
      <DialogContent className="max-w-xl w-[min(100vw-1.5rem,36rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-5">
        <DialogHeader className="space-y-1 sm:space-y-1.5 text-left">
          <DialogTitle className="text-base sm:text-lg">
            Configurar Regra Financeira
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Configure sua regra financeira personalizada para acompanhar seus gastos
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de progresso */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-3 sm:py-4">
          <div className={cn('flex items-center gap-1.5 sm:gap-2', step >= 1 && 'text-primary')}>
            <div
              className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0',
                step === 1
                  ? 'bg-primary text-primary-foreground'
                  : step > 1
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {step > 1 ? <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : '1'}
            </div>
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Escolher Modelo</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-muted shrink-0" />
          <div className={cn('flex items-center gap-1.5 sm:gap-2', step >= 2 && 'text-primary')}>
            <div
              className={cn(
                'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shrink-0',
                step === 2
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              2
            </div>
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Mapear Categorias</span>
          </div>
        </div>

        {/* Conteúdo do passo 1 */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            <div>
              <Label className="text-sm sm:text-base font-semibold mb-3 sm:mb-4 block">
                Escolha o modelo de regra
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                50% necessidades, 30% desejos, 20% investimentos — sobre o que você já recebeu.
              </p>
              <RadioGroup
                value={ruleModel}
                onValueChange={(value) => setRuleModel(value as RuleModel)}
                className="space-y-2"
              >
                <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer min-h-[3.5rem]">
                  <RadioGroupItem value="default" id="default" className="mt-0.5 sm:mt-0 shrink-0" />
                  <Label htmlFor="default" className="flex-1 cursor-pointer min-w-0">
                    <div className="font-semibold text-sm sm:text-base">
                      Regra 50/30/20 (Padrão)
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      50% Essenciais, 30% Estilo de Vida, 20% Investimentos
                    </div>
                  </Label>
                </div>
                <div className="flex items-start sm:items-center gap-3 p-3 sm:p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors cursor-pointer min-h-[3.5rem]">
                  <RadioGroupItem value="custom" id="custom" className="mt-0.5 sm:mt-0 shrink-0" />
                  <Label htmlFor="custom" className="flex-1 cursor-pointer min-w-0">
                    <div className="font-semibold text-sm sm:text-base">
                      Personalizar Regra
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Defina seus próprios percentuais
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {ruleModel === 'custom' && (
              <div className="mt-2 space-y-3 rounded-md border bg-muted/20 px-3 py-3">
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
                      className={cn('h-9 text-sm', errors.essentials && 'border-destructive')}
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
                      className={cn('h-9 text-sm', errors.lifestyle && 'border-destructive')}
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
                      className={cn('h-9 text-sm', errors.investments && 'border-destructive')}
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
                <div className="text-xs text-muted-foreground tabular-nums">
                  Soma:{' '}
                  {(
                    parseFloat(essentialsPercentage || '0') +
                    parseFloat(lifestylePercentage || '0') +
                    parseFloat(investmentsPercentage || '0')
                  ).toFixed(2)}
                  %
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conteúdo do passo 2 */}
        {step === 2 && (
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div>
              <Label className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2 block">
                Mapeie as categorias de gastos
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Defina quais categorias são Essenciais e quais são Estilo de Vida. Exemplos:
                Essenciais — moradia, contas; Estilo de vida — lazer, assinaturas.
              </p>
            </div>

            {errors.mapping && (
              <Alert variant="destructive" className="py-2 sm:py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  {errors.mapping}
                </AlertDescription>
              </Alert>
            )}

            {unmappedCategories && unmappedCategories.length > 0 && (
              <Alert variant="destructive" className="mb-3 sm:mb-4 py-2 sm:py-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  {unmappedCategories.length} categoria(s) nova(s) precisa(m) ser mapeada(s)
                </AlertDescription>
              </Alert>
            )}

            {categories.length > 8 && (
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Buscar categoria..."
                className="h-9"
              />
            )}

            <div className="space-y-2 max-h-[45vh] sm:max-h-96 overflow-y-auto overscroll-contain">
              {filteredCategories.map((category) => {
                const isUnmapped = unmappedCategories?.includes(category);
                return (
                  <div
                    key={category}
                    className={cn(
                      'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 p-2.5 sm:p-2 rounded-lg border text-sm transition-colors min-h-[3rem] sm:min-h-0',
                      isUnmapped
                        ? 'border-destructive bg-destructive/10'
                        : 'bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Label className="font-medium truncate text-xs sm:text-sm">
                        {category}
                      </Label>
                      {isUnmapped && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] sm:text-xs h-5 px-1.5 shrink-0"
                        >
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
                      <SelectTrigger className="w-full sm:w-32 h-9 sm:h-8 text-xs">
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
              <Alert className="py-2 sm:py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <AlertDescription className="text-xs sm:text-sm">
                  Todas as categorias foram mapeadas!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="mt-2 pt-4 border-t border-border/50">
          <div className="flex justify-between w-full gap-2 flex-col sm:flex-row">
            {step === 2 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 mr-2 shrink-0" />
                Voltar
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto w-full sm:w-auto">
              {step === 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2 shrink-0" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !allCategoriesMapped}
                  className="flex-1 sm:flex-initial"
                >
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
