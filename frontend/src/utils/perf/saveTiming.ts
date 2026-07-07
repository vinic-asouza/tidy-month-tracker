const isDev = import.meta.env.DEV;

export type SaveTimingPhase = 'start' | 'apiDone' | 'syncDone';

export interface SaveTimingSession {
  operation: string;
  mark(phase: SaveTimingPhase): void;
  end(): void;
}

export function startSaveTiming(operation: string): SaveTimingSession {
  const id = `save:${operation}:${Date.now()}`;
  const phases: Record<string, number> = {};

  if (isDev && typeof performance !== 'undefined') {
    performance.mark(`${id}:start`);
    phases.start = performance.now();
  }

  return {
    operation,
    mark(phase: SaveTimingPhase) {
      if (!isDev || typeof performance === 'undefined') return;
      const label = `${id}:${phase}`;
      performance.mark(label);
      phases[phase] = performance.now();
      if (phase === 'apiDone' && phases.start != null) {
        performance.measure(`${id}:api`, `${id}:start`, label);
      }
      if (phase === 'syncDone' && phases.apiDone != null) {
        performance.measure(`${id}:sync`, `${id}:apiDone`, label);
      }
    },
    end() {
      if (!isDev || typeof performance === 'undefined') return;
      performance.mark(`${id}:end`);
      if (phases.start != null) {
        performance.measure(`${id}:total`, `${id}:start`, `${id}:end`);
      }
      const total = phases.start != null ? Math.round(performance.now() - phases.start) : 0;
      const api = phases.apiDone != null ? Math.round(phases.apiDone - phases.start) : null;
      const sync =
        phases.syncDone != null && phases.apiDone != null
          ? Math.round(phases.syncDone - phases.apiDone)
          : null;
      console.debug(
        `[save-timing] ${operation} total=${total}ms` +
          (api != null ? ` api=${api}ms` : '') +
          (sync != null ? ` sync=${sync}ms` : '')
      );
    },
  };
}
