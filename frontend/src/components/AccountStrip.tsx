import { useState, useMemo, useEffect, memo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  Building2,
  PiggyBank,
  TrendingUp,
  Banknote,
  ArrowUpDown,
  MoreVertical,
  Loader2,
  DollarSign,
  AlertTriangle,
  HelpCircle,
  Link2Off,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CARD_COLORS, DEFAULT_ACCOUNT_TYPES } from '@/types/finance';
import { SectionSurface } from '@/components/layout/SectionSurface';
import type { Account, AccountBalance, AccountType, CreditCard } from '@/types/domain';
import type { MonthData } from '@/types/domain';
import {
  getAccountMonthTotals,
  getAccountDeclaredBalance,
  getAccountOpeningBalance,
  getAccountClosingBalance,
  getBalanceDeclarationWarning,
  getUnlinkedMonthTotals,
  getUnlinkedMovements,
} from '@/utils/business/accounts';
import { FinancialGlossaryDialog } from '@/components/FinancialGlossaryDialog';
import { UnlinkedMovementsDialog } from '@/components/UnlinkedMovementsDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AccountStripProps {
  accounts: Account[];
  accountBalances: AccountBalance[];
  accountHistoryMonths: Record<string, MonthData>;
  currentMonth: string;
  monthData: MonthData;
  creditCards: CreditCard[];
  cardMonthlyStatuses: Record<string, boolean>;
  onAdd: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account | null>;
  onUpdate: (id: string, updates: Partial<Omit<Account, 'id'>>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onUpsertBalance: (accountId: string, yearMonth: string, balance: number) => Promise<boolean>;
  accountNameExists: (name: string, excludeId?: string) => boolean;
  openAddDialog?: boolean;
  onAddDialogClose?: () => void;
}

type SortOption = 'default' | 'alphabetic' | 'highest';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatMonthLabel = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

const parseCurrencyInput = (raw: string): number => {
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'alphabetic', label: 'Ordem Alfabética' },
  { value: 'highest', label: 'Maior Movimentação' },
];

const TYPE_ICONS: Record<AccountType, React.ElementType> = {
  checking: Building2,
  savings: PiggyBank,
  investment: TrendingUp,
  cash: Banknote,
  other: Wallet,
};

const AccountStripComponent = ({
  accounts,
  accountBalances,
  accountHistoryMonths,
  currentMonth,
  monthData,
  creditCards,
  cardMonthlyStatuses,
  onAdd,
  onUpdate,
  onDelete,
  onUpsertBalance,
  accountNameExists,
  openAddDialog,
  onAddDialogClose,
}: AccountStripProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType>('checking');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].id);
  const [initialBalance, setInitialBalance] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Balance declaration dialog state
  const [balanceDialogAccount, setBalanceDialogAccount] = useState<Account | null>(null);
  const [balanceInput, setBalanceInput] = useState('');
  const [isSavingBalance, setIsSavingBalance] = useState(false);
  const [unlinkedDialogOpen, setUnlinkedDialogOpen] = useState(false);

  const unlinkedTotals = useMemo(
    () => getUnlinkedMonthTotals(monthData, creditCards, cardMonthlyStatuses),
    [monthData, creditCards, cardMonthlyStatuses]
  );

  const unlinkedMovements = useMemo(
    () => getUnlinkedMovements(monthData, creditCards, cardMonthlyStatuses),
    [monthData, creditCards, cardMonthlyStatuses]
  );

  const hasUnlinkedMovements = unlinkedTotals.inflow > 0 || unlinkedTotals.outflow > 0;

  const balanceDeclarationWarning = useMemo(() => {
    if (!balanceDialogAccount) return null;
    return getBalanceDeclarationWarning(
      balanceDialogAccount.id,
      currentMonth,
      accountBalances,
      monthData,
      accountHistoryMonths,
      creditCards,
      cardMonthlyStatuses
    );
  }, [
    balanceDialogAccount,
    currentMonth,
    accountBalances,
    monthData,
    accountHistoryMonths,
    creditCards,
    cardMonthlyStatuses,
  ]);

  const parsedBalanceInput = parseCurrencyInput(balanceInput);

  const showReplaceCarryForwardAlert =
    balanceDeclarationWarning?.kind === 'replace_carry_forward';

  const showUpdateDeclarationAlert =
    balanceDeclarationWarning?.kind === 'update_declaration' &&
    balanceInput.trim() !== '' &&
    parsedBalanceInput !== balanceDeclarationWarning.previousDeclared;

  const showBalanceDeclarationAlert =
    showReplaceCarryForwardAlert || showUpdateDeclarationAlert;

  const projectedClosingAfterDeclare =
    showBalanceDeclarationAlert && balanceInput.trim() !== '' && balanceDeclarationWarning
      ? parsedBalanceInput + balanceDeclarationWarning.monthVariation
      : null;

  useEffect(() => {
    if (openAddDialog) setIsOpen(true);
  }, [openAddDialog]);

  const getTotalMovement = (accountId: string) => {
    const { inflow, outflow, invested } = getAccountMonthTotals(
      accountId,
      monthData,
      creditCards,
      cardMonthlyStatuses
    );
    return inflow + outflow + invested;
  };

  const sortedAccounts = useMemo(() => {
    const sorted = [...accounts];
    if (sortOption === 'alphabetic') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }
    if (sortOption === 'highest') {
      return sorted.sort((a, b) => getTotalMovement(b.id) - getTotalMovement(a.id));
    }
    return sorted;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, sortOption, monthData, creditCards, cardMonthlyStatuses]);

  const resetForm = () => {
    setName('');
    setSelectedType('checking');
    setSelectedColor(CARD_COLORS[0].id);
    setInitialBalance('');
    setEditingId(null);
    setNameError(null);
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Nome da carteira é obrigatório');
      return;
    }
    if (accountNameExists(trimmed, editingId || undefined)) {
      setNameError('Já existe uma carteira com este nome');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const success = await onUpdate(editingId, { name: trimmed, type: selectedType, color: selectedColor });
        if (success === false) return;
      } else {
        const created = await onAdd({ name: trimmed, type: selectedType, color: selectedColor });
        if (!created) return;

        if (initialBalance.trim()) {
          const balance = parseCurrencyInput(initialBalance);
          const balanceSaved = await onUpsertBalance(created.id, currentMonth, balance);
          if (!balanceSaved) {
            toast.error('Carteira criada, mas não foi possível salvar o saldo inicial.');
          }
        }
      }

      resetForm();
      setIsOpen(false);
      onAddDialogClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setName(account.name);
    setSelectedType(account.type);
    setSelectedColor(account.color || CARD_COLORS[0].id);
    setIsOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const openBalanceDialog = (account: Account) => {
    const existing = getAccountDeclaredBalance(account.id, currentMonth, accountBalances);
    setBalanceDialogAccount(account);
    setBalanceInput(existing ? String(existing.balance) : '');
  };

  const handleSaveBalance = async () => {
    if (!balanceDialogAccount) return;
    const value = parseCurrencyInput(balanceInput);
    setIsSavingBalance(true);
    try {
      const success = await onUpsertBalance(balanceDialogAccount.id, currentMonth, value);
      if (success) {
        setBalanceDialogAccount(null);
        setBalanceInput('');
      }
    } finally {
      setIsSavingBalance(false);
    }
  };

  const getColorClass = (colorId: string | null) =>
    CARD_COLORS.find((c) => c.id === colorId)?.class || CARD_COLORS[0].class;

  const getTypeLabel = (type: AccountType) =>
    DEFAULT_ACCOUNT_TYPES.find((t) => t.value === type)?.label || type;

  const renderChip = (account: Account) => {
    const { inflow, outflow, invested } = getAccountMonthTotals(
      account.id,
      monthData,
      creditCards,
      cardMonthlyStatuses
    );
    const colorClass = getColorClass(account.color);
    const TypeIcon = TYPE_ICONS[account.type] ?? Wallet;
    const hasMovements = inflow > 0 || outflow > 0 || invested > 0;

    const declaredBalance = getAccountDeclaredBalance(account.id, currentMonth, accountBalances);
    const openingBalance = getAccountOpeningBalance(
      account.id,
      currentMonth,
      accountBalances,
      accountHistoryMonths,
      creditCards,
      cardMonthlyStatuses
    );
    const closingBalance = getAccountClosingBalance(
      account.id,
      currentMonth,
      accountBalances,
      accountHistoryMonths,
      creditCards,
      cardMonthlyStatuses
    );
    const isDeclaredOpening = !!declaredBalance;
    const isCarriedForward = !isDeclaredOpening && openingBalance !== 0;
    const showBalance =
      isDeclaredOpening || openingBalance !== 0 || closingBalance !== 0 || hasMovements;

    return (
      <div
        key={account.id}
        className="relative flex-shrink-0 w-[168px] sm:w-[184px] overflow-hidden rounded-lg snap-start"
      >
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', colorClass)} />
        <div className="relative z-10 p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <TypeIcon className="h-3 w-3 flex-shrink-0 text-white/80" />
              <span className="font-semibold text-white text-xs truncate">{account.name}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-md text-white/80 hover:text-white hover:bg-white/20 flex-shrink-0"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-md">
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer gap-2"
                  onClick={() => openBalanceDialog(account)}
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Declarar saldo
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer gap-2"
                  onClick={() => handleEdit(account)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-lg cursor-pointer gap-2 text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(account)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-[10px] text-white/80 uppercase tracking-wide truncate">
            {getTypeLabel(account.type)}
          </p>

          {showBalance ? (
            <>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">Saldo estimado</p>
              <p className="text-sm font-bold text-white tabular-nums leading-tight">
                {formatCurrency(closingBalance)}
              </p>
              <p className="text-xs text-white/90 tabular-nums leading-snug">
                <span className="text-white/70">Início </span>
                <span className="font-semibold">{formatCurrency(openingBalance)}</span>
                {isDeclaredOpening && (
                  <span className="block text-[10px] text-white/60 mt-0.5">declarado</span>
                )}
                {isCarriedForward && (
                  <span className="block text-[10px] text-white/60 mt-0.5">↳ estimado do mês anterior</span>
                )}
              </p>
            </>
          ) : !hasMovements ? (
            <p className="text-xs text-white/50 italic">Sem movimentos</p>
          ) : null}

          {hasMovements && (
            <div className={cn('space-y-1', showBalance && 'border-t border-white/20 pt-1.5')}>
              {inflow > 0 && (
                <p className="text-xs text-white/90 leading-none">
                  <span className="text-white/70">Entrou </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(inflow)}</span>
                </p>
              )}
              {outflow > 0 && (
                <p className="text-xs text-white/90 leading-none">
                  <span className="text-white/70">Saiu </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(outflow)}</span>
                </p>
              )}
              {invested > 0 && (
                <p className="text-xs text-white/90 leading-none">
                  <span className="text-white/70">Aportado </span>
                  <span className="font-semibold tabular-nums">{formatCurrency(invested)}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUnlinkedChip = () => {
    const { inflow, outflow } = unlinkedTotals;

    return (
      <button
        type="button"
        onClick={() => setUnlinkedDialogOpen(true)}
        className="relative flex-shrink-0 w-[168px] sm:w-[184px] overflow-hidden rounded-lg snap-start border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        aria-label="Ver movimentos não vinculados"
      >
        <div className="p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 min-w-0">
            <Link2Off className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
            <span className="font-semibold text-foreground text-xs truncate">Não vinculados</span>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            Sem carteira
          </p>
          <div className="space-y-1 pt-0.5">
            {inflow > 0 && (
              <p className="text-xs text-foreground/90 leading-none">
                <span className="text-muted-foreground">Entrou </span>
                <span className="font-semibold tabular-nums">{formatCurrency(inflow)}</span>
              </p>
            )}
            {outflow > 0 && (
              <p className="text-xs text-foreground/90 leading-none">
                <span className="text-muted-foreground">Saiu </span>
                <span className="font-semibold tabular-nums">{formatCurrency(outflow)}</span>
              </p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Toque para ver detalhes</p>
        </div>
      </button>
    );
  };

  const sortMenu =
    accounts.length > 0 ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span className="hidden sm:inline">
              {SORT_OPTIONS.find((o) => o.value === sortOption)?.label || 'Ordenar'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-md">
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setSortOption(option.value)}
              className={cn(
                'rounded-lg cursor-pointer hover:bg-muted hover:text-foreground',
                sortOption === option.value && 'bg-muted text-foreground'
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null;

  const headerActions = (
    <div className="flex items-center gap-1 shrink-0">
      <FinancialGlossaryDialog
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <HelpCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Glossário</span>
          </Button>
        }
      />
      {sortMenu}
    </div>
  );

  return (
    <SectionSurface
      id="account-strip"
      title="Carteiras"
      subtitle={
        accounts.length === 0
          ? 'Organize seus movimentos por conta'
          : `${accounts.length} carteira${accounts.length > 1 ? 's' : ''} · saldos estimados · movimentações efetivadas do mês`
      }
      icon={Wallet}
      iconVariant="primary"
      actions={headerActions}
    >
      {accounts.length === 0 ? (
        <button
          type="button"
          onClick={() => { resetForm(); setIsOpen(true); }}
          className="w-full flex items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors text-sm"
        >
          <Wallet className="h-4 w-4" />
          Adicionar carteira
        </button>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-thin">
          {sortedAccounts.map(renderChip)}
          {hasUnlinkedMovements && renderUnlinkedChip()}
          <button
            type="button"
            onClick={() => { resetForm(); setIsOpen(true); }}
            className="flex-shrink-0 w-[60px] sm:w-[72px] flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors snap-start"
            aria-label="Adicionar carteira"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Novo</span>
          </button>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            resetForm();
            onAddDialogClose?.();
          }
        }}
      >
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingId ? 'Editar Carteira' : 'Nova Carteira'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Nome da Carteira
              </label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(null); }}
                placeholder="Ex: Nubank, Itaú, Inter..."
                className={cn(
                  'rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  nameError && 'border-destructive'
                )}
              />
              {nameError && <p className="text-destructive text-sm mt-1">{nameError}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Tipo de Conta
              </label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as AccountType)}>
                <SelectTrigger className="rounded-md h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {DEFAULT_ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="rounded-lg">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Cor da Carteira
              </label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger className="rounded-md h-10">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-5 h-5 rounded-md bg-gradient-to-br', getColorClass(selectedColor))} />
                      <span>{CARD_COLORS.find((c) => c.id === selectedColor)?.name}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  {CARD_COLORS.map((color) => (
                    <SelectItem key={color.id} value={color.id} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-5 h-5 rounded-md bg-gradient-to-br', color.class)} />
                        <span>{color.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingId && (
              <div>
                <label className="text-sm font-medium mb-2 block text-muted-foreground">
                  Saldo inicial <span className="text-muted-foreground/60 font-normal">(opcional)</span>
                </label>
                <Input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className="rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <p className="text-[11px] text-muted-foreground/70 mt-1">
                  Será registrado como saldo declarado em {formatMonthLabel(currentMonth)}.
                </p>
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-10 rounded-md gradient-primary hover:opacity-90 transition-opacity text-primary-foreground border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                'Salvar Alterações'
              ) : (
                'Adicionar Carteira'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Declare Balance Dialog */}
      <Dialog
        open={!!balanceDialogAccount}
        onOpenChange={(open) => {
          if (!open) {
            setBalanceDialogAccount(null);
            setBalanceInput('');
          }
        }}
      >
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Declarar saldo</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            {balanceDialogAccount && (
              <>
                <p className="text-sm text-muted-foreground">
                  Quanto você tinha em <strong>{balanceDialogAccount.name}</strong> no início de{' '}
                  <strong>{formatMonthLabel(currentMonth)}</strong>?
                </p>
                <p className="text-xs text-muted-foreground">
                  Este valor ancora o saldo estimado da carteira nos meses seguintes.
                </p>
              </>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block text-muted-foreground">
                Valor (R$)
              </label>
              <Input
                type="number"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                autoFocus
                className="rounded-md h-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {showBalanceDeclarationAlert && balanceDeclarationWarning && (
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  {balanceDeclarationWarning.kind === 'replace_carry_forward'
                    ? 'Saldo inicial será redefinido'
                    : 'Alterar saldo declarado'}
                </AlertTitle>
                <AlertDescription className="text-sm text-amber-900/90 dark:text-amber-100/90 space-y-2">
                  {balanceDeclarationWarning.kind === 'replace_carry_forward' ? (
                    <>
                      <p>
                        Esta carteira já tem movimentações em{' '}
                        <strong>{formatMonthLabel(currentMonth)}</strong>.
                      </p>
                      <p>
                        O valor informado será o <strong>saldo no início do mês</strong> e substitui
                        o saldo calculado automaticamente (
                        <strong>{formatCurrency(balanceDeclarationWarning.calculatedOpening)}</strong>, ↳
                        estimado do mês anterior).
                      </p>
                      <p>
                        As movimentações do mês <strong>continuam valendo</strong> e serão somadas
                        sobre esse valor.
                      </p>
                    </>
                  ) : (
                    <p>
                      A alteração recalcula o saldo atual com base nas movimentações já registradas
                      neste mês.
                    </p>
                  )}
                  {projectedClosingAfterDeclare !== null && (
                    <p>
                      Saldo atual estimado após salvar:{' '}
                      <strong>{formatCurrency(projectedClosingAfterDeclare)}</strong>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={handleSaveBalance}
              disabled={isSavingBalance}
              className="w-full h-10 rounded-md gradient-primary hover:opacity-90 transition-opacity text-primary-foreground border-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {isSavingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir carteira "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Os movimentos vinculados a esta carteira serão desvinculados, mas não serão excluídos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UnlinkedMovementsDialog
        open={unlinkedDialogOpen}
        onOpenChange={setUnlinkedDialogOpen}
        movements={unlinkedMovements}
      />
    </SectionSurface>
  );
};

export const AccountStrip = memo(AccountStripComponent);
