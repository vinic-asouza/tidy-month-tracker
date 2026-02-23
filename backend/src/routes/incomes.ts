/**
 * Rotas de Receitas (Incomes)
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../infra/auth';
import * as incomesService from '../services/incomes';

const router = Router();

// Validação de schemas
const createIncomeSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  value: z.number().positive('Valor deve ser positivo'),
  tag: z.string().min(1, 'Tag é obrigatória'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  repeatAllMonths: z.boolean().optional(),
});

const updateIncomeSchema = z.object({
  description: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  tag: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional().nullable(),
  received: z.boolean().optional(),
  repeatAllMonths: z.boolean().optional(),
});

// GET /api/incomes?month=2024-01
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const month = req.query.month as string;
    if (!month) {
      res.status(400).json({ error: 'Parâmetro month é obrigatório' });
      return;
    }

    const incomes = await incomesService.getIncomes(req.userId!, month);
    res.json(incomes);
  } catch (error) {
    next(error);
  }
});

// POST /api/incomes
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const month = req.query.month as string;
    if (!month) {
      res.status(400).json({ error: 'Parâmetro month é obrigatório' });
      return;
    }

    const data = createIncomeSchema.parse(req.body);
    const income = await incomesService.createIncome(req.userId!, month, data);
    res.status(201).json(income);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    next(error);
  }
});

// PUT /api/incomes/:id
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { applyToAllMonths, ...data } = req.body;
    const validatedData = updateIncomeSchema.parse(data);
    const applyToAll = applyToAllMonths === true || applyToAllMonths === 'true';
    await incomesService.updateIncome(req.userId!, id, validatedData, applyToAll);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    next(error);
  }
});

// DELETE /api/incomes/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const applyToAllMonths = req.query.applyToAllMonths === 'true';
    await incomesService.deleteIncome(req.userId!, id, applyToAllMonths);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/incomes/reorder
router.post('/reorder', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { month, incomeIds } = req.body;

    if (!month || !Array.isArray(incomeIds)) {
      res.status(400).json({ error: 'month e incomeIds são obrigatórios' });
      return;
    }

    await incomesService.reorderIncomes(req.userId!, month, incomeIds);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as incomesRouter };
