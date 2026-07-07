import { useCallback, useState } from 'react';
import type { SummaryViewMode } from '@/utils/business/monthTotals';

const STORAGE_KEY = 'tidy-summary-view-mode';

function readStoredMode(): SummaryViewMode {
  if (typeof window === 'undefined') return 'effective';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'planned' ? 'planned' : 'effective';
}

export function useSummaryViewMode() {
  const [viewMode, setViewModeState] = useState<SummaryViewMode>(readStoredMode);

  const setViewMode = useCallback((mode: SummaryViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  return { viewMode, setViewMode };
}
