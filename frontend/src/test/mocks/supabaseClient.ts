/**
 * Harness de mock do client Supabase para testes de adaptadores.
 *
 * Objetivo: permitir testar `src/services/adapters/supabase/*` sem rede e sem
 * inicializar o client real. O mock reproduz o encadeamento do PostgREST
 * (`from().select().eq().single()`), incluindo builders "thenable" — usados
 * pelos adaptadores em inserts sem `.select()` e em queries de contagem
 * (`select('*', { count: 'exact', head: true })`).
 *
 * Uso:
 * ```ts
 * const mock = await vi.hoisted(async () => {
 *   const { createSupabaseMock } = await import('@/test/mocks/supabaseClient');
 *   return createSupabaseMock();
 * });
 *
 * vi.mock('@/integrations/supabase/client', () => ({ supabase: mock.supabase }));
 * ```
 * O `vi.hoisted` assíncrono é obrigatório: o Vitest eleva `vi.mock`/`vi.hoisted`
 * acima dos imports estáticos, então o harness precisa ser carregado por
 * `await import()` dentro do próprio bloco elevado.
 */

export type MockResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

export type MockOpKind = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

export type MockTerminal = 'single' | 'maybeSingle' | 'await';

/** Um elo do encadeamento, na ordem em que foi chamado. */
export interface MockCall {
  table: string;
  method: string;
  args: unknown[];
}

/** Uma query completa: tabela, operação, payload e filtros aplicados. */
export interface MockOperation {
  table: string;
  op: MockOpKind;
  /** Primeiro argumento da operação (row/rows de insert, update ou upsert). */
  payload: unknown;
  /** Todos os argumentos da operação, incluindo opções (ex.: `onConflict`). */
  args: unknown[];
  filters: Array<{ method: string; args: unknown[] }>;
  terminal: MockTerminal | null;
}

/** Métodos de filtro/modificador que apenas devolvem o próprio builder. */
const CHAINABLE_METHODS = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'is',
  'in',
  'or',
  'not',
  'filter',
  'match',
  'contains',
  'order',
  'limit',
  'range',
  'returns',
  'throwOnError',
] as const;

type ChainableMethod = (typeof CHAINABLE_METHODS)[number];

type QueryResult = { data: unknown; error: { message: string } | null; count: number | null };

export type SupabaseMockBuilder = {
  [K in ChainableMethod]: (...args: unknown[]) => SupabaseMockBuilder;
} & {
  select(...args: unknown[]): SupabaseMockBuilder;
  insert(payload: unknown, ...args: unknown[]): SupabaseMockBuilder;
  update(payload: unknown, ...args: unknown[]): SupabaseMockBuilder;
  upsert(payload: unknown, ...args: unknown[]): SupabaseMockBuilder;
  delete(...args: unknown[]): SupabaseMockBuilder;
  single(): Promise<QueryResult>;
  maybeSingle(): Promise<QueryResult>;
  then<TResult1 = QueryResult, TResult2 = never>(
    onFulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2>;
};

export interface SupabaseMock {
  /** Objeto injetado no lugar de `supabase`. */
  supabase: {
    from(table: string): SupabaseMockBuilder;
    auth: {
      getUser(): Promise<{
        data: { user: { id: string } | null };
        error: { message: string } | null;
      }>;
      getSession(): Promise<{
        data: { session: { user: { id: string } } | null };
        error: { message: string } | null;
      }>;
    };
  };
  /** Enfileira resultados consumidos por `single`/`maybeSingle`/`await`, em ordem. */
  enqueue(...results: MockResult[]): void;
  /** Zera fila, chamadas e operações; restaura o usuário autenticado padrão. */
  clear(): void;
  /** Define (ou remove) o usuário retornado por `auth.getUser()`. */
  setAuthUser(user: { id: string } | null, error?: { message: string } | null): void;
  /** Todos os elos encadeados, na ordem de chamada. */
  getCalls(): MockCall[];
  /** Uma entrada por `from()`, na ordem em que as queries foram montadas. */
  getOperations(): MockOperation[];
  /** Operações de uma tabela, opcionalmente filtradas por tipo. */
  getOperationsFor(table: string, op?: MockOpKind): MockOperation[];
  /** Quantidade de resultados ainda não consumidos (útil para detectar sobra). */
  pendingResults(): number;
}

const DEFAULT_AUTH_USER = { id: 'user-1' };

export function createSupabaseMock(): SupabaseMock {
  const queue: MockResult[] = [];
  const calls: MockCall[] = [];
  const operations: MockOperation[] = [];
  let authUser: { id: string } | null = { ...DEFAULT_AUTH_USER };
  let authError: { message: string } | null = null;

  function nextResult(): QueryResult {
    const result = queue.shift() ?? {};
    return {
      data: result.data === undefined ? null : result.data,
      error: result.error ?? null,
      count: result.count === undefined ? null : result.count,
    };
  }

  function createBuilder(table: string): SupabaseMockBuilder {
    const operation: MockOperation = {
      table,
      op: 'select',
      payload: undefined,
      args: [],
      filters: [],
      terminal: null,
    };
    operations.push(operation);

    let opAssigned = false;
    let settled = false;

    function record(method: string, args: unknown[]): void {
      calls.push({ table, method, args });
    }

    function settle(terminal: MockTerminal): QueryResult {
      if (settled) {
        throw new Error(
          `Query em "${table}" finalizada mais de uma vez (${operation.terminal} + ${terminal})`
        );
      }
      settled = true;
      operation.terminal = terminal;
      return nextResult();
    }

    function assignOp(op: MockOpKind, payload: unknown, args: unknown[]): void {
      record(op, args);
      if (opAssigned) {
        operation.filters.push({ method: op, args });
        return;
      }
      opAssigned = true;
      operation.op = op;
      operation.payload = payload;
      operation.args = args;
    }

    const builder = {} as SupabaseMockBuilder;

    for (const method of CHAINABLE_METHODS) {
      builder[method] = (...args: unknown[]) => {
        record(method, args);
        operation.filters.push({ method, args });
        return builder;
      };
    }

    builder.select = (...args: unknown[]) => {
      assignOp('select', undefined, args);
      return builder;
    };
    builder.insert = (payload: unknown, ...args: unknown[]) => {
      assignOp('insert', payload, [payload, ...args]);
      return builder;
    };
    builder.update = (payload: unknown, ...args: unknown[]) => {
      assignOp('update', payload, [payload, ...args]);
      return builder;
    };
    builder.upsert = (payload: unknown, ...args: unknown[]) => {
      assignOp('upsert', payload, [payload, ...args]);
      return builder;
    };
    builder.delete = (...args: unknown[]) => {
      assignOp('delete', undefined, args);
      return builder;
    };

    builder.single = () => Promise.resolve(settle('single'));
    builder.maybeSingle = () => Promise.resolve(settle('maybeSingle'));
    builder.then = (onFulfilled, onRejected) =>
      Promise.resolve(settle('await')).then(onFulfilled, onRejected);

    return builder;
  }

  return {
    supabase: {
      from: (table: string) => createBuilder(table),
      auth: {
        getUser: () => Promise.resolve({ data: { user: authUser }, error: authError }),
        getSession: () =>
          Promise.resolve({
            data: { session: authUser ? { user: authUser } : null },
            error: authError,
          }),
      },
    },
    enqueue(...results: MockResult[]) {
      queue.push(...results);
    },
    clear() {
      queue.length = 0;
      calls.length = 0;
      operations.length = 0;
      authUser = { ...DEFAULT_AUTH_USER };
      authError = null;
    },
    setAuthUser(user, error = null) {
      authUser = user;
      authError = error;
    },
    getCalls: () => [...calls],
    getOperations: () => [...operations],
    getOperationsFor: (table, op) =>
      operations.filter((entry) => entry.table === table && (op ? entry.op === op : true)),
    pendingResults: () => queue.length,
  };
}
