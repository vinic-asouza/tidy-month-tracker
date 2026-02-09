/**
 * Middleware centralizado de tratamento de erros
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
}

/**
 * Middleware de tratamento de erros
 */
export function errorHandler(
  err: Error | ApiError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erro de validação Zod
  if (err instanceof ZodError) {
    logger.warn('Erro de validação', {
      path: req.path,
      method: req.method,
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });

    res.status(400).json({
      error: 'Erro de validação',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Erro de API com status code
  const apiError = err as ApiError;
  const statusCode = apiError.statusCode || 500;
  const message = apiError.message || 'Erro interno do servidor';

  // Log do erro
  logger.error('Erro na requisição', err instanceof Error ? err : undefined, {
    path: req.path,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
