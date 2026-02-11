/**
 * Componente Principal da Seção de Regra Financeira
 * 
 * Integra setup, display e gerenciamento da regra financeira
 */

import { useState, useMemo } from 'react';
import { Target, Settings, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FinancialRuleSetup } from './FinancialRuleSetup';
import { FinancialRuleDisplay } from './FinancialRuleDisplay';
import { useFinancialRule } from '@/hooks/useFinancialRule';
import type { MonthData, FinanceSettings, CreateFinancialRuleInput } from '@/types/domain';

interface FinancialRuleSectionProps {
  monthData: MonthData;
  settings: FinanceSettings;
}

export const FinancialRuleSection = ({ monthData, settings }: FinancialRuleSectionProps) => {
  const { rule, loading, createRule, updateRule } = useFinancialRule();
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Detectar categorias não mapeadas
  const unmappedCategories = useMemo(() => {
    if (!rule || !settings.expenseCategories) return [];
    const mappedCategories = Object.keys(rule.categoryMapping || {});
    return settings.expenseCategories.filter(
      (cat) => !mappedCategories.includes(cat)
    );
  }, [rule, settings.expenseCategories]);

  const hasUnmappedCategories = unmappedCategories.length > 0;

  const handleComplete = async (data: CreateFinancialRuleInput) => {
    if (rule) {
      await updateRule(data);
    } else {
      await createRule(data);
    }
    setIsSetupOpen(false);
    setIsEditMode(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setIsSetupOpen(true);
  };

  // Se não há regra configurada, mostrar botão para configurar
  if (!loading && !rule) {
    return (
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-4 rounded-xl bg-muted mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Regra Financeira não configurada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure sua regra financeira para acompanhar seus gastos e investimentos
          </p>
          <Button onClick={() => setIsSetupOpen(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Configurar Regra
          </Button>
        </div>

        <FinancialRuleSetup
          open={isSetupOpen}
          onOpenChange={setIsSetupOpen}
          onComplete={handleComplete}
          categories={settings.expenseCategories}
          initialRule={null}
        />
      </div>
    );
  }

  // Se está carregando
  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Se há regra configurada, mostrar display
  if (!rule) return null;

  return (
    <>
      <div className="bg-card rounded-2xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl gradient-primary shadow-glow">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold tracking-tight">Regra Financeira</h3>
              <p className="text-sm text-muted-foreground">
                {rule.isCustom
                  ? `Personalizada: ${rule.essentialsPercentage}% / ${rule.lifestylePercentage}% / ${rule.investmentsPercentage}%`
                  : 'Regra 50/30/20'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasUnmappedCategories && (
              <Badge
                variant="destructive"
                className="gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleEdit}
              >
                <AlertCircle className="h-3 w-3" />
                {unmappedCategories.length} nova(s) categoria(s) necessita de mapeamento
              </Badge>
            )}
            <Button
              variant="ghost"
              className="gap-2 rounded-lg hover:bg-muted"
              onClick={handleEdit}
            >
              <Settings className="h-4 w-4" />
              Configurar Regra
            </Button>
          </div>
        </div>
        <FinancialRuleDisplay rule={rule} monthData={monthData} />
      </div>

      <FinancialRuleSetup
        open={isSetupOpen}
        onOpenChange={(open) => {
          setIsSetupOpen(open);
          if (!open) setIsEditMode(false);
        }}
        onComplete={handleComplete}
        categories={settings.expenseCategories}
        initialRule={rule}
        unmappedCategories={hasUnmappedCategories ? unmappedCategories : undefined}
      />
    </>
  );
};
