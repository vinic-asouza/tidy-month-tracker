import { toast } from 'sonner';

const STORAGE_KEY = 'tidy-selection-hint-seen';

export function showSelectionHintIfNeeded(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  localStorage.setItem(STORAGE_KEY, 'true');
  toast.info('Toque na linha para selecionar. Os totais aparecem na barra inferior.', {
    duration: 5000,
  });
}
