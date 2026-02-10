/**
 * Rotas de Configurações (Settings)
 */

import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../infra/auth';
import * as settingsService from '../services/settings';

const router = Router();

// GET /api/settings
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.userId!);
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/investment-tags
router.put('/investment-tags', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      res.status(400).json({ error: 'tags deve ser um array' });
      return;
    }

    await settingsService.updateInvestmentTags(req.userId!, tags);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/investment-tags/update
router.put('/investment-tags/update', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { oldTag, newTag } = req.body;

    if (!oldTag || !newTag) {
      res.status(400).json({ error: 'oldTag e newTag são obrigatórios' });
      return;
    }

    await settingsService.updateInvestmentTagInInvestments(req.userId!, oldTag, newTag);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/income-tags
router.put('/income-tags', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      res.status(400).json({ error: 'tags deve ser um array' });
      return;
    }

    await settingsService.updateIncomeTags(req.userId!, tags);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/income-tags/update
router.put('/income-tags/update', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { oldTag, newTag } = req.body;

    if (!oldTag || !newTag) {
      res.status(400).json({ error: 'oldTag e newTag são obrigatórios' });
      return;
    }

    await settingsService.updateIncomeTagInIncomes(req.userId!, oldTag, newTag);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/expense-categories
router.put('/expense-categories', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      res.status(400).json({ error: 'categories deve ser um array' });
      return;
    }

    await settingsService.updateExpenseCategories(req.userId!, categories);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/expense-categories/update
router.put('/expense-categories/update', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { oldCategory, newCategory } = req.body;

    if (!oldCategory || !newCategory) {
      res.status(400).json({ error: 'oldCategory e newCategory são obrigatórios' });
      return;
    }

    await settingsService.updateExpenseCategoryInExpenses(req.userId!, oldCategory, newCategory);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as settingsRouter };
