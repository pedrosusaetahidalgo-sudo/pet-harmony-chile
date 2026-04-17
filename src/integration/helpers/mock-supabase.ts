/**
 * Mock Supabase client factory for integration tests.
 * Returns a chainable mock that mimics the real Supabase JS client API.
 */
import { vi } from 'vitest';

type MockData = Record<string, unknown>[] | Record<string, unknown> | null;

export interface MockOverrides {
  /** Table → data returned by .select() queries */
  tables?: Record<
    string,
    { data?: MockData; error?: { message: string; code?: string } | null; count?: number }
  >;
  /** RPC name → return value */
  rpcs?: Record<string, { data?: unknown; error?: { message: string } | null }>;
  /** Auth user returned by getUser() */
  authUser?: { id: string; email?: string } | null;
  authError?: { message: string } | null;
  /** Functions invoke results */
  functions?: Record<string, { data?: unknown; error?: { message: string } | null }>;
  /** Storage upload results */
  storage?: { publicUrl?: string; uploadError?: { message: string } | null };
}

function createChainableQuery(tableData: {
  data?: MockData;
  error?: { message: string; code?: string } | null;
  count?: number;
}) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'in',
    'is',
    'order',
    'limit',
    'range',
    'filter',
    'match',
    'not',
    'or',
    'contains',
    'containedBy',
    'textSearch',
  ];

  for (const method of methods) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }

  // Terminal methods
  chain.single = vi.fn().mockResolvedValue({
    data: Array.isArray(tableData.data) ? (tableData.data[0] ?? null) : tableData.data,
    error: tableData.error ?? null,
  });
  chain.maybeSingle = vi.fn().mockResolvedValue({
    data: Array.isArray(tableData.data) ? (tableData.data[0] ?? null) : tableData.data,
    error: tableData.error ?? null,
  });

  // Make select/insert/update/delete also resolve as promises (for non-terminal queries)
  const thenHandler = (_resolve: (v: unknown) => void) => {
    _resolve({
      data: tableData.data ?? [],
      error: tableData.error ?? null,
      count: tableData.count,
    });
  };
  chain.then = thenHandler;

  // Override select to also be awaitable
  const originalSelect = chain.select as ReturnType<typeof vi.fn>;
  chain.select = vi
    .fn()
    .mockImplementation((_cols?: string, opts?: { count?: string; head?: boolean }) => {
      if (opts?.head) {
        return {
          ...chain,
          then: (_r: (v: unknown) => void) =>
            _r({ count: tableData.count ?? 0, data: null, error: null }),
        };
      }
      return chain;
    });

  return chain;
}

export function createMockSupabase(overrides: MockOverrides = {}) {
  const defaultTableData = { data: [], error: null };

  const supabase = {
    from: vi.fn().mockImplementation((table: string) => {
      const tableData = overrides.tables?.[table] ?? defaultTableData;
      return createChainableQuery(tableData);
    }),

    rpc: vi.fn().mockImplementation((name: string, _params?: Record<string, unknown>) => {
      const rpcResult = overrides.rpcs?.[name] ?? { data: null, error: null };
      return Promise.resolve({ data: rpcResult.data ?? null, error: rpcResult.error ?? null });
    }),

    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: overrides.authUser ?? null },
        error: overrides.authError ?? null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: overrides.authUser
            ? {
                user: overrides.authUser,
                access_token: 'mock-token',
                refresh_token: 'mock-refresh',
              }
            : null,
        },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: overrides.authUser
          ? { user: overrides.authUser, session: { access_token: 'mock-token' } }
          : { user: null, session: null },
        error: overrides.authError ?? null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        generateLink: vi.fn().mockResolvedValue({
          data: { properties: { action_link: 'https://pawfriend.cl/auth?token=mock' } },
          error: null,
        }),
        inviteUserByEmail: vi.fn().mockResolvedValue({ error: null }),
      },
    },

    functions: {
      invoke: vi.fn().mockImplementation((name: string) => {
        const fnResult = overrides.functions?.[name] ?? { data: null, error: null };
        return Promise.resolve({ data: fnResult.data ?? null, error: fnResult.error ?? null });
      }),
    },

    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock/path.jpg' },
          error: overrides.storage?.uploadError ?? null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: {
            publicUrl:
              overrides.storage?.publicUrl ??
              'https://mock.supabase.co/storage/v1/object/public/mock.jpg',
          },
        }),
        remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
  };

  return supabase;
}

export type MockSupabase = ReturnType<typeof createMockSupabase>;
