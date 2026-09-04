import { useCallback, useMemo, useState } from 'react';
import { FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { Account, Expense, CreditCard } from '@/types/domain';
import { DEFAULT_PAYMENT_METHODS } from '@/types/finance';
import { filterMovementAccounts } from '@/utils/business/accountRoles';
import {
  EFFECTUATE_WALLET_FREE,
  getDefaultEffectuateAccountId,
} from '@/utils/effectuateWalletDefaults';
import {
  applyColumnMapping,
  parseCsvText,
  type CsvColumnMapping,
  type CsvFieldKey,
} from '@/utils/business/csvParse';
import {
  buildReviewRows,
  resolveRowMonth,
  type ImportReviewRow,
} from '@/utils/business/csvImportBuild';
import type { SuggestedImportAction } from '@/utils/business/expenseMatch';
import { CurrencyInput, parseCurrencyToNumber } from '@/components/ui/currency-input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function formatValueForInput(value: number): string {
  if (!value || value <= 0) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type OriginMode = 'account' | 'card';

export type ImportAddHandler = (
  expense: Omit<Expense, 'id'>,
  yearMonth?: string
) => Promise<Expense | null>;

export type ImportUpdateHandler = (
  id: string,
  updates: Partial<Expense>
) => Promise<boolean>;

interface ImportExpensesCsvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonth: string;
  categories: string[];
  creditCards: CreditCard[];
  expenses: Expense[];
  accounts: Account[];
  onAdd: ImportAddHandler;
  onUpdate: ImportUpdateHandler;
}

type Step = 1 | 2 | 3 | 4;

const FIELD_OPTIONS: { value: CsvFieldKey; label: string }[] = [
  { value: 'ignore', label: 'Ignorar' },
  { value: 'date', label: 'Data' },
  { value: 'value', label: 'Valor' },
  { value: 'description', label: 'Descrição' },
];

const ACTION_LABELS: Record<SuggestedImportAction, string> = {
  create_variable: 'Novo variável',
  create_installment: 'Novo parcelado',
  create_fixed: 'Tornar fixo',
  link_existing: 'Associar existente',
  ignore: 'Ignorar',
  review: 'Revisar',
};

function guessMapping(headers: string[]): CsvColumnMapping {
  const mapping: CsvColumnMapping = {};
  headers.forEach((h, i) => {
    const n = h.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    if (/data|date/.test(n)) mapping[i] = 'date';
    else if (/us\$|usd|dolar/.test(n)) mapping[i] = 'ignore';
    else if (/valor.*r\$|r\$.*valor|valor \(em r|value|amount|quantia|(^| )valor($| )/.test(n)) {
      mapping[i] = 'value';
    } else if (/descric|desc|historico|memo|estabelecimento|lancamento/.test(n)) {
      mapping[i] = 'description';
    } else mapping[i] = 'ignore';
  });
  return mapping;
}

function mappingComplete(mapping: CsvColumnMapping): boolean {
  const values = Object.values(mapping);
  return (
    values.includes('date') && values.includes('value') && values.includes('description')
  );
}

export function ImportExpensesCsvDialog({
  open,
  onOpenChange,
  currentMonth,
  categories,
  creditCards,
  expenses,
  accounts,
  onAdd,
  onUpdate,
}: ImportExpensesCsvDialogProps) {
  const movementAccounts = useMemo(() => filterMovementAccounts(accounts), [accounts]);

  const [step, setStep] = useState<Step>(1);
  const [originMode, setOriginMode] = useState<OriginMode>('account');
  const [cardId, setCardId] = useState<string>(creditCards[0]?.id ?? '');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [parseError, setParseError] = useState<string | null>(null);

  const [rows, setRows] = useState<ImportReviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [report, setReport] = useState<{ ok: number; fail: number; ignored: number } | null>(
    null
  );

  const selectedCard = creditCards.find((c) => c.id === cardId);
  const accountPaymentMethods = DEFAULT_PAYMENT_METHODS;
  const seedCategory = categories[0] ?? 'Outros';
  const seedPaymentMethod = DEFAULT_PAYMENT_METHODS[1] ?? 'Pix';

  const reset = useCallback(() => {
    setStep(1);
    setOriginMode('account');
    setCardId(creditCards[0]?.id ?? '');
    setFileName('');
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setParseError(null);
    setRows([]);
    setImporting(false);
    setProgress({ done: 0, total: 0 });
    setReport(null);
  }, [creditCards]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onFile = async (file: File | null) => {
    setParseError(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCsvText(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setParseError('Arquivo vazio ou sem linhas de dados.');
        return;
      }
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setMapping(guessMapping(parsed.headers));
    } catch {
      setParseError('Não foi possível ler o arquivo.');
    }
  };

  const goToReview = () => {
    if (!mappingComplete(mapping)) {
      toast.error('Mapeie as colunas Data, Valor e Descrição.');
      return;
    }
    try {
      const mapped = applyColumnMapping(rawRows, mapping);
      const payment =
        originMode === 'card' && selectedCard
          ? selectedCard.name
          : seedPaymentMethod;
      const built = buildReviewRows({
        mapped,
        uiYearMonth: currentMonth,
        defaultCategory: seedCategory,
        defaultPaymentMethod: payment,
        existingExpenses: expenses,
      });
      // Origem cartão: trava paymentMethod
      const withOrigin =
        originMode === 'card' && selectedCard
          ? built.map((r) => ({
              ...r,
              paymentMethod: selectedCard.name,
              effectuate: false,
              accountId: undefined,
            }))
          : built;
      setRows(withOrigin);
      setStep(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro no mapeamento');
    }
  };

  const updateRow = (id: string, patch: Partial<ImportReviewRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const resolveAllPendingMonths = (choice: 'csv' | 'ui') => {
    setRows((prev) =>
      prev.map((r) =>
        r.monthDiverges && r.monthResolution === 'pending'
          ? resolveRowMonth(r, choice, currentMonth)
          : r
      )
    );
  };

  const pendingMonthCount = rows.filter(
    (r) => !r.ineligible && r.monthDiverges && r.monthResolution === 'pending'
  ).length;

  const importable = rows.filter(
    (r) =>
      r.selected &&
      !r.ineligible &&
      r.action !== 'ignore' &&
      r.action !== 'review' &&
      r.monthResolution !== 'pending'
  );

  const runImport = async () => {
    if (pendingMonthCount > 0) {
      toast.error('Resolva o mês das linhas divergentes antes de importar.');
      return;
    }
    if (importable.length === 0) {
      toast.error('Nenhuma linha elegível selecionada.');
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: importable.length });
    let ok = 0;
    let fail = 0;
    const ignored = rows.filter((r) => r.action === 'ignore' || r.ineligible).length;

    const concurrency = 5;
    let index = 0;

    const worker = async () => {
      while (index < importable.length) {
        const current = importable[index++];
        const success = await importOne(current);
        if (success) ok += 1;
        else fail += 1;
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, importable.length) }, () => worker()));

    setReport({ ok, fail, ignored });
    setImporting(false);
    setStep(4);
    if (ok > 0) toast.success(`${ok} gasto(s) importado(s)`);
    if (fail > 0) toast.error(`${fail} linha(s) falharam`);
  };

  const importOne = async (row: ImportReviewRow): Promise<boolean> => {
    try {
      if (!row.category?.trim() || !row.description?.trim() || row.value <= 0) {
        return false;
      }
      if (!row.paymentMethod?.trim()) return false;

      const isCard = originMode === 'card';
      const shouldEffectuate = !isCard && row.effectuate;

      if (shouldEffectuate && row.accountId === undefined) {
        return false;
      }

      if (row.action === 'link_existing') {
        if (!row.linkExpenseId) return false;
        const updates: Partial<Expense> = {
          description: row.description,
          value: row.value,
          category: row.category,
          paymentMethod: row.paymentMethod,
          date: row.date,
        };
        if (shouldEffectuate) {
          updates.paid = true;
          updates.accountId =
            row.accountId === null
              ? (null as unknown as string)
              : row.accountId;
        }
        return onUpdate(row.linkExpenseId, updates);
      }

      let type: Expense['type'] = 'variable';
      let currentInstallment: number | undefined;
      let totalInstallments: number | undefined;
      let repeatAllMonths = false;

      if (row.action === 'create_installment') {
        type = 'installment';
        currentInstallment = row.currentInstallment ?? 1;
        totalInstallments = row.totalInstallments ?? 2;
        if (
          currentInstallment < 1 ||
          totalInstallments < 2 ||
          currentInstallment > totalInstallments
        ) {
          return false;
        }
      } else if (row.action === 'create_fixed') {
        type = 'fixed';
        repeatAllMonths = row.repeatAllMonths;
      }

      const payload: Omit<Expense, 'id'> = {
        type,
        category: row.category,
        description: row.description,
        paymentMethod: row.paymentMethod,
        value: row.value,
        paid: shouldEffectuate,
        date: row.date,
        repeatAllMonths: type === 'fixed' ? repeatAllMonths : undefined,
        currentInstallment,
        totalInstallments,
        accountId: shouldEffectuate
          ? row.accountId === null
            ? (null as unknown as string)
            : row.accountId
          : undefined,
      };

      const created = await onAdd(payload, row.yearMonth);
      return created != null;
    } catch {
      return false;
    }
  };

  const previewRows = rawRows.slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[min(96vw,72rem)] max-w-[72rem] max-h-[90vh] flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-expense" />
            Revisar e importar gastos
          </DialogTitle>
          <DialogDescription>
            O arquivo só propõe linhas. Nada é gravado até você confirmar a importação.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 text-xs text-muted-foreground">
          {[1, 2, 3, 4].map((s) => (
            <Badge
              key={s}
              variant={step === s ? 'default' : 'outline'}
              className={cn(step === s && 'bg-expense text-white')}
            >
              {s === 1 && 'Origem'}
              {s === 2 && 'Colunas'}
              {s === 3 && 'Revisão'}
              {s === 4 && 'Resultado'}
            </Badge>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Origem do extrato / fatura</Label>
              <Select
                value={originMode === 'card' ? `card:${cardId}` : 'account'}
                onValueChange={(v) => {
                  if (v === 'account') {
                    setOriginMode('account');
                  } else {
                    setOriginMode('card');
                    setCardId(v.replace('card:', ''));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">Conta (Pix, débito, boleto…)</SelectItem>
                  {creditCards.map((c) => (
                    <SelectItem key={c.id} value={`card:${c.id}`}>
                      Cartão: {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {originMode === 'card' && (
                <p className="text-xs text-muted-foreground">
                  Linhas entram na fatura do cartão. Sem efetivar no item (RN-X04).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-file">Arquivo CSV</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              />
              {fileName && (
                <p className="text-xs text-muted-foreground">
                  {fileName} — {rawRows.length} linha(s)
                </p>
              )}
              {parseError && (
                <Alert variant="destructive">
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-expense hover:bg-expense/90"
                disabled={!fileName || rawRows.length === 0 || !!parseError}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 min-h-0 flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground">
              Associe cada coluna do CSV aos campos do Finto. Data, valor e descrição são
              obrigatórios.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] gap-4 min-h-0 flex-1">
              <ScrollArea className="max-h-[min(50vh,420px)] rounded-md border p-3">
                <div className="grid gap-2 pr-2">
                  {headers.map((h, i) => (
                    <div key={`${h}-${i}`} className="flex items-center gap-2">
                      <span className="text-sm flex-1 min-w-0 truncate font-medium" title={h}>
                        {h || `Coluna ${i + 1}`}
                      </span>
                      <Select
                        value={mapping[i] ?? 'ignore'}
                        onValueChange={(v) =>
                          setMapping((m) => ({ ...m, [i]: v as CsvFieldKey }))
                        }
                      >
                        <SelectTrigger className="w-[7.5rem] shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="rounded-md border p-3 min-w-0 flex flex-col max-h-[min(50vh,420px)]">
                <p className="text-xs font-medium mb-2 shrink-0">Preview (5 primeiras linhas)</p>
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="text-xs w-max min-w-full border-collapse">
                    <thead>
                      <tr>
                        {headers.map((h, i) => (
                          <th
                            key={i}
                            className="text-left p-1.5 border-b whitespace-nowrap font-medium sticky top-0 bg-background"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((cells, ri) => (
                        <tr key={ri}>
                          {headers.map((_, ci) => (
                            <td key={ci} className="p-1.5 border-b whitespace-nowrap max-w-[14rem] truncate">
                              {cells[ci]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                className="bg-expense hover:bg-expense/90"
                disabled={!mappingComplete(mapping)}
                onClick={goToReview}
              >
                Ir para revisão
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 min-h-0 flex-1 flex flex-col">
            {pendingMonthCount > 0 && (
              <Alert>
                <AlertDescription className="flex flex-wrap items-center gap-2">
                  {pendingMonthCount} linha(s) com data fora de {currentMonth}.
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAllPendingMonths('csv')}
                  >
                    Usar data do CSV
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAllPendingMonths('ui')}
                  >
                    Usar mês aberto
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[min(55vh,480px)] border rounded-md">
              <div className="p-2 space-y-1.5">
                {rows.map((row) => (
                  <ReviewRowCard
                    key={row.id}
                    row={row}
                    categories={categories}
                    paymentMethods={
                      originMode === 'card' && selectedCard
                        ? [selectedCard.name]
                        : accountPaymentMethods
                    }
                    originMode={originMode}
                    movementAccounts={movementAccounts}
                    lockPayment={originMode === 'card'}
                    onChange={(patch) => updateRow(row.id, patch)}
                    onResolveMonth={(choice) =>
                      updateRow(row.id, resolveRowMonth(row, choice, currentMonth))
                    }
                  />
                ))}
              </div>
            </ScrollArea>

            <p className="text-xs text-muted-foreground">
              {importable.length} pronta(s) para importar
              {rows.some((r) => r.action === 'review')
                ? ' · linhas em Revisar ficam de fora até você escolher'
                : ''}
            </p>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)} disabled={importing}>
                Voltar
              </Button>
              <Button
                className="bg-expense hover:bg-expense/90 text-white"
                disabled={importing || importable.length === 0}
                onClick={runImport}
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {progress.done}/{progress.total}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2 text-white" />
                    Importar selecionados
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 4 && report && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Importação concluída: <strong>{report.ok}</strong> ok,{' '}
                <strong>{report.fail}</strong> falha(s), <strong>{report.ignored}</strong>{' '}
                ignorada(s).
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                className="bg-expense hover:bg-expense/90"
                onClick={() => handleOpenChange(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewRowCard({
  row,
  categories,
  paymentMethods,
  originMode,
  movementAccounts,
  lockPayment,
  onChange,
  onResolveMonth,
}: {
  row: ImportReviewRow;
  categories: string[];
  paymentMethods: string[];
  originMode: OriginMode;
  movementAccounts: Account[];
  lockPayment: boolean;
  onChange: (patch: Partial<ImportReviewRow>) => void;
  onResolveMonth: (choice: 'csv' | 'ui') => void;
}) {
  const walletValue =
    row.accountId === null
      ? EFFECTUATE_WALLET_FREE
      : row.accountId ??
        getDefaultEffectuateAccountId('expense', movementAccounts);

  const hasExtras =
    row.ineligible ||
    row.action === 'review' ||
    row.action === 'link_existing' ||
    row.action === 'create_installment' ||
    row.action === 'create_fixed' ||
    (originMode === 'account' && row.effectuate) ||
    (row.monthDiverges && row.monthResolution === 'pending');

  return (
    <div
      className={cn(
        'rounded-md border px-2 py-1.5 text-sm transition-colors',
        row.ineligible && 'opacity-60 bg-muted/40',
        row.action === 'review' && 'border-amber-500/50',
        row.selected &&
          !row.ineligible &&
          'bg-muted/55 border-border/80 dark:bg-muted/40'
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Checkbox
          className="shrink-0"
          checked={row.selected && !row.ineligible}
          disabled={row.ineligible || row.action === 'review'}
          onCheckedChange={(c) => onChange({ selected: c === true })}
        />

        <Input
          className="h-8 flex-1 min-w-[10rem] basis-[40%] text-sm"
          value={row.description}
          disabled={row.ineligible}
          title={row.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />

        <CurrencyInput
          className="h-8 w-[6.75rem] shrink-0 text-sm"
          value={formatValueForInput(row.value)}
          disabled={row.ineligible}
          onValueChange={(v) => onChange({ value: parseCurrencyToNumber(v) })}
        />

        <Input
          className="h-8 w-[9.25rem] shrink-0 text-sm"
          type="date"
          value={row.date}
          disabled={row.ineligible}
          onChange={(e) => onChange({ date: e.target.value })}
        />

        <Select
          value={row.category}
          disabled={row.ineligible}
          onValueChange={(v) => onChange({ category: v })}
        >
          <SelectTrigger className="h-8 w-[9.5rem] shrink-0 text-sm">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={row.paymentMethod}
          disabled={row.ineligible || lockPayment}
          onValueChange={(v) => onChange({ paymentMethod: v })}
        >
          <SelectTrigger className="h-8 w-[7.5rem] shrink-0 text-sm">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={row.action}
          disabled={row.ineligible}
          onValueChange={(v) => {
            const action = v as SuggestedImportAction;
            const patch: Partial<ImportReviewRow> = { action };
            if (action === 'link_existing' && row.candidates[0]) {
              patch.linkExpenseId = row.candidates[0].expense.id;
            }
            if (action === 'review') patch.selected = false;
            onChange(patch);
          }}
        >
          <SelectTrigger className="h-8 w-[8.75rem] shrink-0 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(
              [
                'create_variable',
                'create_installment',
                'create_fixed',
                'link_existing',
                'ignore',
                'review',
              ] as SuggestedImportAction[]
            ).map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {originMode === 'account' && !row.ineligible && row.action !== 'ignore' && (
          <label
            className="flex items-center gap-1 text-xs shrink-0 whitespace-nowrap text-muted-foreground"
            title="Efetivar ao importar"
          >
            <Checkbox
              checked={row.effectuate}
              onCheckedChange={(c) => {
                const on = c === true;
                onChange({
                  effectuate: on,
                  accountId: on
                    ? getDefaultEffectuateAccountId('expense', movementAccounts) ===
                      EFFECTUATE_WALLET_FREE
                      ? null
                      : getDefaultEffectuateAccountId('expense', movementAccounts)
                    : undefined,
                });
              }}
            />
            Efet.
          </label>
        )}
      </div>

      {hasExtras && (
        <div className="flex flex-wrap items-center gap-2 mt-1.5 pl-6">
          {row.ineligible && (
            <Badge variant="destructive">{row.ineligibleReason}</Badge>
          )}
          {row.action === 'review' && (
            <span className="text-xs text-muted-foreground">{row.suggestionReason}</span>
          )}
          {row.monthDiverges && (
            <Badge variant="secondary">Mês CSV: {row.csvYearMonth}</Badge>
          )}

          {row.action === 'link_existing' && row.candidates.length > 0 && (
            <Select
              value={row.linkExpenseId}
              onValueChange={(v) => onChange({ linkExpenseId: v, action: 'link_existing' })}
            >
              <SelectTrigger className="h-8 w-56 text-sm">
                <SelectValue placeholder="Escolha o existente" />
              </SelectTrigger>
              <SelectContent>
                {row.candidates.map((c) => (
                  <SelectItem key={c.expense.id} value={c.expense.id}>
                    {c.kind}: {c.expense.description} ({c.expense.value})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {row.action === 'create_installment' && (
            <div className="flex items-center gap-1">
              <Input
                className="h-8 w-14 text-sm"
                type="number"
                min={1}
                value={row.currentInstallment ?? 1}
                onChange={(e) =>
                  onChange({ currentInstallment: Number(e.target.value) || 1 })
                }
                title="Parcela atual"
              />
              <span className="text-xs">/</span>
              <Input
                className="h-8 w-14 text-sm"
                type="number"
                min={2}
                value={row.totalInstallments ?? 2}
                onChange={(e) =>
                  onChange({ totalInstallments: Number(e.target.value) || 2 })
                }
                title="Total"
              />
            </div>
          )}

          {row.action === 'create_fixed' && (
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={row.repeatAllMonths}
                onCheckedChange={(c) => onChange({ repeatAllMonths: c === true })}
              />
              Repetir nos meses do ano
            </label>
          )}

          {originMode === 'account' && row.effectuate && (
            <Select
              value={walletValue}
              onValueChange={(v) =>
                onChange({
                  accountId: v === EFFECTUATE_WALLET_FREE ? null : v,
                })
              }
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="Carteira" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EFFECTUATE_WALLET_FREE}>Saldo Livre</SelectItem>
                {movementAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {row.monthDiverges && row.monthResolution === 'pending' && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => onResolveMonth('csv')}
              >
                Data CSV
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7"
                onClick={() => onResolveMonth('ui')}
              >
                Mês aberto
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
