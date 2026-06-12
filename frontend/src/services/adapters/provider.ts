export type DataProvider = 'api' | 'supabase';

export function getDataProvider(): DataProvider {
  const provider = import.meta.env.VITE_DATA_PROVIDER;
  return provider === 'supabase' ? 'supabase' : 'api';
}
