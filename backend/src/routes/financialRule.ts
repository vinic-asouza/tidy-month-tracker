/**
 * Rotas de Regra Financeira (Financial Rule)
 */

import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../infra/auth';
import * as financialRuleService from '../services/financialRule';

const router = Router();

// GET /api/financial-rule
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const rule = await financialRuleService.getFinancialRule(req.userId!);
    res.json(rule);
  } catch (error) {
    next(error);
  }
});

// POST /api/financial-rule
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      essentialsPercentage,
      lifestylePercentage,
      investmentsPercentage,
      categoryMapping,
      isCustom,
    } = req.body;

    // Validações básicas
    if (
      essentialsPercentage === undefined ||
      lifestylePercentage === undefined ||
      investmentsPercentage === undefined
    ) {
      res.status(400).json({
        error: 'essentialsPercentage, lifestylePercentage e investmentsPercentage são obrigatórios',
      });
      return;
    }

    if (typeof essentialsPercentage !== 'number' || essentialsPercentage < 0 || essentialsPercentage > 100) {
      res.status(400).json({
        error: 'essentialsPercentage deve ser um número entre 0 e 100',
      });
      return;
    }

    if (typeof lifestylePercentage !== 'number' || lifestylePercentage < 0 || lifestylePercentage > 100) {
      res.status(400).json({
        error: 'lifestylePercentage deve ser um número entre 0 e 100',
      });
      return;
    }

    if (typeof investmentsPercentage !== 'number' || investmentsPercentage < 0 || investmentsPercentage > 100) {
      res.status(400).json({
        error: 'investmentsPercentage deve ser um número entre 0 e 100',
      });
      return;
    }

    if (!categoryMapping || typeof categoryMapping !== 'object') {
      res.status(400).json({
        error: 'categoryMapping é obrigatório e deve ser um objeto',
      });
      return;
    }

    if (typeof isCustom !== 'boolean') {
      res.status(400).json({
        error: 'isCustom deve ser um booleano',
      });
      return;
    }

    const rule = await financialRuleService.createFinancialRule(req.userId!, {
      essentialsPercentage,
      lifestylePercentage,
      investmentsPercentage,
      categoryMapping,
      isCustom,
    });

    res.status(201).json(rule);
  } catch (error) {
    next(error);
  }
});

// PUT /api/financial-rule
router.put('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const {
      essentialsPercentage,
      lifestylePercentage,
      investmentsPercentage,
      categoryMapping,
      isCustom,
    } = req.body;

    // Validações opcionais (apenas se fornecidos)
    if (essentialsPercentage !== undefined) {
      if (typeof essentialsPercentage !== 'number' || essentialsPercentage < 0 || essentialsPercentage > 100) {
        res.status(400).json({
          error: 'essentialsPercentage deve ser um número entre 0 e 100',
        });
        return;
      }
    }

    if (lifestylePercentage !== undefined) {
      if (typeof lifestylePercentage !== 'number' || lifestylePercentage < 0 || lifestylePercentage > 100) {
        res.status(400).json({
          error: 'lifestylePercentage deve ser um número entre 0 e 100',
        });
        return;
      }
    }

    if (investmentsPercentage !== undefined) {
      if (typeof investmentsPercentage !== 'number' || investmentsPercentage < 0 || investmentsPercentage > 100) {
        res.status(400).json({
          error: 'investmentsPercentage deve ser um número entre 0 e 100',
        });
        return;
      }
    }

    if (categoryMapping !== undefined && typeof categoryMapping !== 'object') {
      res.status(400).json({
        error: 'categoryMapping deve ser um objeto',
      });
      return;
    }

    if (isCustom !== undefined && typeof isCustom !== 'boolean') {
      res.status(400).json({
        error: 'isCustom deve ser um booleano',
      });
      return;
    }

    const rule = await financialRuleService.updateFinancialRule(req.userId!, {
      essentialsPercentage,
      lifestylePercentage,
      investmentsPercentage,
      categoryMapping,
      isCustom,
    });

    res.json(rule);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/financial-rule
router.delete('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await financialRuleService.deleteFinancialRule(req.userId!);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export { router as financialRuleRouter };
