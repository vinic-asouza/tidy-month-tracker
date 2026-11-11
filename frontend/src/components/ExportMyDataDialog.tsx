import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentYearMonth } from '@/utils/business/creditCards';
import {
  buildDataExportFiles,
  collectDataExportPayload,
  downloadDataExportFiles,
  isValidExportYearMonth,
} from '@/utils/business/dataExportCsv';

interface ExportMyDataDialogProps {
  trigger?: ReactNode;
  /** Controle externo (ex.: botão dentro do Sheet mobile). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Mês de referência para default do intervalo (ex.: mês atual da UI). */
  referenceMonth?: string;
}

function defaultRange(referenceMonth?: string): { from: string; to: string } {
  const anchor =
    referenceMonth && isValidExportYearMonth(referenceMonth)
      ? referenceMonth
      : getCurrentYearMonth();
  const year = anchor.slice(0, 4);
  return { from: `${year}-01`, to: `${year}-12` };
}

export function ExportMyDataDialog({
  trigger,
  open: openProp,
  onOpenChange,
  referenceMonth,
}: ExportMyDataDialogProps) {
  const { user } = useAuth();
  const controlled = openProp !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlled ? openProp : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const initial = useMemo(() => defaultRange(referenceMonth), [referenceMonth]);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const range = defaultRange(referenceMonth);
    setFrom(range.from);
    setTo(range.to);
  }, [open, referenceMonth]);

  const canExport =
    Boolean(user?.id) &&
    isValidExportYearMonth(from) &&
    isValidExportYearMonth(to) &&
    from <= to &&
    !exporting;

  const handleExport = async () => {
    if (!user?.id || !canExport) return;
    setExporting(true);
    try {
      const payload = await collectDataExportPayload(user.id, from, to);
      const files = buildDataExportFiles(payload);
      await downloadDataExportFiles(files);
      toast.success('Exportação concluída. Baixamos um CSV por tipo de dado.');
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível exportar seus dados.';
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="rounded-lg max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar meus dados</DialogTitle>
          <DialogDescription>
            Baixa CSVs linha a linha (entradas, gastos, investimentos, cartões e status de fatura)
            do intervalo escolhido. Diferente da exportação anual agregada. Os arquivos ficam só no
            seu dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="export-from">De (mês)</Label>
            <Input
              id="export-from"
              type="month"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              disabled={exporting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="export-to">Até (mês)</Label>
            <Input
              id="export-to"
              type="month"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              disabled={exporting}
            />
          </div>
          {from && to && from > to ? (
            <p className="text-sm text-destructive">
              O mês inicial deve ser anterior ou igual ao final.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={exporting}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleExport} disabled={!canExport} className="gap-2">
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Baixar CSVs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
