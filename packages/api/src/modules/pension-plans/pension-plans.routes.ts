import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import authMiddleware from '../../middlewares/auth.middleware'
import { SQLiteRateLimitStore } from '../../middlewares/pension-transfer-rate-limit.middleware'
import { pensionPlansController } from './pension-plans.controller'

const pensionTransferRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.user as string,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Has alcanzado el límite de traspasos. Inténtalo de nuevo dentro de un minuto.' },
  store: new SQLiteRateLimitStore()
})

export const pensionPlansRoutes = Router()

pensionPlansRoutes.get('/', authMiddleware, pensionPlansController.getPlans.bind(pensionPlansController))
pensionPlansRoutes.post('/', authMiddleware, pensionPlansController.createPlan.bind(pensionPlansController))
pensionPlansRoutes.get('/movements', authMiddleware, pensionPlansController.getAllMovements.bind(pensionPlansController))
pensionPlansRoutes.get('/:id', authMiddleware, pensionPlansController.getPlan.bind(pensionPlansController))
pensionPlansRoutes.patch('/:id', authMiddleware, pensionPlansController.editPlan.bind(pensionPlansController))
pensionPlansRoutes.delete('/:id', authMiddleware, pensionPlansController.deletePlan.bind(pensionPlansController))

pensionPlansRoutes.post('/:id/transfer', authMiddleware, pensionTransferRateLimit, pensionPlansController.transferAssets.bind(pensionPlansController))

pensionPlansRoutes.get('/:id/movements', authMiddleware, pensionPlansController.getMovements.bind(pensionPlansController))
pensionPlansRoutes.post('/:id/movements', authMiddleware, pensionPlansController.addMovement.bind(pensionPlansController))
pensionPlansRoutes.patch('/:id/movements/:movementId', authMiddleware, pensionPlansController.editMovement.bind(pensionPlansController))
pensionPlansRoutes.delete('/:id/movements/:movementId', authMiddleware, pensionPlansController.deleteMovement.bind(pensionPlansController))
