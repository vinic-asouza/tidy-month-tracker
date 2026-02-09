/**
 * Rotas de Cartões de Crédito (Credit Cards)
 */

import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../infra/auth';
import * as creditCardsService from '../services/creditCards';

const router = Router();

const createCreditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
  paid: z.boolean().optional(),
});

const updateCreditCardSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  paid: z.boolean().optional(),
});

// GET /api/credit-cards
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const cards = await creditCardsService.getCreditCards(req.userId!);
    res.json(cards);
  } catch (error) {
    next(error);
  }
});

// POST /api/credit-cards
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const data = createCreditCardSchema.parse(req.body);
    const card = await creditCardsService.createCreditCard(req.userId!, data);
    res.status(201).json(card);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    next(error);
  }
});

// PUT /api/credit-cards/:id
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = updateCreditCardSchema.parse(req.body);
    await creditCardsService.updateCreditCard(req.userId!, id, data);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação', details: error.errors });
      return;
    }
    // Se for um erro de validação de negócio (nome duplicado, cartão não encontrado)
    if (error instanceof Error && (error.message.includes('Já existe') || error.message.includes('não encontrado'))) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/credit-cards/:id
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await creditCardsService.deleteCreditCard(req.userId!, id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /api/credit-cards/:id/status?month=2024-01
router.get('/:id/status', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const month = req.query.month as string;
    if (!month) {
      res.status(400).json({ error: 'Parâmetro month é obrigatório' });
      return;
    }

    const paid = await creditCardsService.getCardMonthlyStatus(
      req.userId!,
      id,
      month
    );
    res.json({ paid });
  } catch (error) {
    next(error);
  }
});

// PUT /api/credit-cards/:id/status
router.put('/:id/status', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { month, paid } = req.body;

    if (!month || typeof paid !== 'boolean') {
      res.status(400).json({ error: 'month e paid são obrigatórios' });
      return;
    }

    await creditCardsService.setCardMonthlyStatus(
      req.userId!,
      id,
      month,
      paid
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as creditCardsRouter };
