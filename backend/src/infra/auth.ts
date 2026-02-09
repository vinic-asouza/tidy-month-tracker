/**
 * Middleware de autenticação
 * 
 * Valida tokens JWT do Supabase e extrai user_id
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Cliente Supabase lazy (criado apenas quando necessário)
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  return supabaseClient;
}

/**
 * Middleware para validar token de autenticação
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Tentativa de acesso sem token', { path: req.path });
      res.status(401).json({ error: 'Token de autenticação não fornecido' });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Obtém cliente Supabase (cria se necessário)
    const supabase = getSupabaseClient();

    // Valida token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Token inválido ou expirado', { path: req.path, error: error?.message });
      res.status(401).json({ error: 'Token inválido ou expirado' });
      return;
    }

    // Adiciona user_id à requisição
    req.userId = user.id;
    // Log removido - apenas logar erros para evitar poluição de logs
    next();
  } catch (error) {
    logger.error('Erro na autenticação', error instanceof Error ? error : undefined, {
      path: req.path,
    });
    res.status(500).json({ error: 'Erro ao validar autenticação' });
  }
}
