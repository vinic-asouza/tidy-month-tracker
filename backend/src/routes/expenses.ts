/**
 * Rotas de Despesas (Expenses)
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../infra/auth';
import * as expensesService from '../services/expenses';

const router = Router();

const createExpenseSchema = z.object({
  type: z.enum(['fixed', 'variable', 'installment']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  paymentMethod: z.string().min(1, 'Método de pagamento é obrigatório'),
  value: z.number().positive('Valor deve ser positivo'),
  paid: z.boolean().optional(),
  repeatAllMonths: z.boolean().optional(),
  currentInstallment: z.number().int().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),
});

const updateExpenseSchema = z.object({
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  paymentMethod: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  paid: z.boolean().optional(),
  repeatAllMonths: z.boolean().optional(),
});

// GET /api/expenses?month=2024-01
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const month = req.query.month as string;
    if (!month) {
      res.status(400).json({ error: 'Parâmetro month é obrigatório' });
      return;
    }

    const expenses = await expensesService.getExpenses(req.userId!, month);
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const month = req.query.month as string;
    if (!month) {
      res.status(400).json({ error: 'Parâmetro month é obrigatório' });
      return;
    }

    const data = createExpenseSchema.parse(req.body);
    const expense = await expensesService.createExpense(req.userId!, month, data);
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    next(error);
  }
});

// PUT /api/expenses/:id
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = updateExpenseSchema.parse(req.body);
    await expensesService.updateExpense(req.userId!, id, data);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    next(error);
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await expensesService.deleteExpense(req.userId!, id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/expenses/:id/installments
router.delete('/:id/installments', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await expensesService.deleteInstallmentExpense(req.userId!, id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses/reorder
router.post('/reorder', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { expenseIds } = req.body;

    if (!Array.isArray(expenseIds)) {
      res.status(400).json({ error: 'expenseIds deve ser um array' });
      return;
    }

    await expensesService.reorderExpenses(req.userId!, expenseIds);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as expensesRouter };
