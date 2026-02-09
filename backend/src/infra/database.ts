/**
 * Configuração do banco de dados PostgreSQL
 * 
 * Usa connection pool para gerenciar conexões eficientemente
 */

import pg from 'pg';
import { logger } from '../utils/logger';

const { Pool } = pg;

// Pool lazy (criado apenas quando necessário)
let dbPool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!dbPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    // Validação básica do formato
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new Error('DATABASE_URL deve começar com postgresql:// ou postgres://');
    }

    // Log da URL (sem senha) para debug
    try {
      const urlObj = new URL(databaseUrl);
      const safeUrl = `${urlObj.protocol}//${urlObj.username}:***@${urlObj.host}${urlObj.pathname}`;
      logger.debug('Conectando ao banco de dados', { url: safeUrl });
    } catch (error) {
      logger.warn('Não foi possível parsear DATABASE_URL para log', { error });
    }

    // Supabase sempre requer SSL, mesmo em desenvolvimento
    dbPool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false, // Supabase usa certificado auto-assinado
      },
    });

    // Event listeners para monitoramento
    // Nota: 'connect' dispara para cada nova conexão no pool, não apenas na inicialização
    dbPool.on('error', (err: Error) => {
      logger.error('Erro no pool de conexões', err);
    });
  }

  return dbPool;
}

// Exporta getter para manter compatibilidade com código existente
export const pool = new Proxy({} as pg.Pool, {
  get(_target, prop) {
    const poolInstance = getPool();
    const value = poolInstance[prop as keyof pg.Pool];
    
    // Se for uma função, bind ao pool para manter o contexto
    if (typeof value === 'function') {
      return value.bind(poolInstance);
    }
    
    return value;
  },
});
