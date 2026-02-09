/**
 * Rotas de Investimentos (Investments)
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../infra/auth';
import * as investmentsService from '../services/investments';

const router = Router();

const createInvestmentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  value: z.number().positive('Valor deve ser positivo'),
  tag: z.string().min(1, 'Tag é obrigatória'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  repeatAllMonths: z.boolean().optional(),
});

const updateInvestmentSchema = z.object({
  description: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  tag: z.string().min(1).optional(),
  invested: z.boolean().optional(),
  repeatAllMonths: z.boolean().optional(),
});

// GET /api/investments?month=2024-01
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const month = req.query.month as string;
    if (!month) {
      res.status(400).json({ error: 'Parâmetro month é obrigatório' });
      return;
    }

    const investments = await investmentsService.getInvestments(req.userId!, month);
    res.json(investments);
  } catch (error) {
    next(error);
  }
});

// POST /api/investments
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const month = req.query.month as string;
    if (!month) {
      res.status(400).json({ error: 'Parâmetro month é obrigatório' });
      return;
    }

    const data = createInvestmentSchema.parse(req.body);
    const investment = await investmentsService.createInvestment(req.userId!, month, data);
    res.status(201).json(investment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    next(error);
  }
});

// PUT /api/investments/:id
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { applyToAllMonths, ...data } = req.body;
    const validatedData = updateInvestmentSchema.parse(data);
    const applyToAll = applyToAllMonths === true || applyToAllMonths === 'true';
    await investmentsService.updateInvestment(req.userId!, id, validatedData, applyToAll);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    next(error);
  }
});

// DELETE /api/investments/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const applyToAllMonths = req.query.applyToAllMonths === 'true';
    await investmentsService.deleteInvestment(req.userId!, id, applyToAllMonths);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/investments/reorder
router.post('/reorder', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { investmentIds } = req.body;

    if (!Array.isArray(investmentIds)) {
      res.status(400).json({ error: 'investmentIds deve ser um array' });
      return;
    }

    await investmentsService.reorderInvestments(req.userId!, investmentIds);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as investmentsRouter };
