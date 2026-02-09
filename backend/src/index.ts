/**
 * Entry point do backend
 * 
 * Servidor Express simples para API REST
 */

// ⚠️ IMPORTANTE: Carregar variáveis de ambiente ANTES de qualquer importação
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Resolve o caminho do .env relativo ao diretório atual (necessário para ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { incomesRouter } from './routes/incomes';
import { expensesRouter } from './routes/expenses';
import { investmentsRouter } from './routes/investments';
import { creditCardsRouter } from './routes/creditCards';
import { settingsRouter } from './routes/settings';
import { errorHandler } from './infra/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080';

// Middlewares
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/incomes', incomesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/credit-cards', creditCardsRouter);
app.use('/api/settings', settingsRouter);

// Tratamento de erros (deve ser o último middleware)
app.use(errorHandler);

// Inicia servidor
app.listen(PORT, () => {
  logger.info('Servidor iniciado', { port: PORT, environment: process.env.NODE_ENV || 'development' });
});
