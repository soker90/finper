import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware'
import { pensionPlansController } from './pension-plans.controller'

export const pensionPlansRoutes = Router()

pensionPlansRoutes.get('/', authMiddleware, pensionPlansController.getPlans.bind(pensionPlansController))
pensionPlansRoutes.post('/', authMiddleware, pensionPlansController.createPlan.bind(pensionPlansController))
pensionPlansRoutes.get('/:id', authMiddleware, pensionPlansController.getPlan.bind(pensionPlansController))
pensionPlansRoutes.patch('/:id', authMiddleware, pensionPlansController.editPlan.bind(pensionPlansController))
pensionPlansRoutes.delete('/:id', authMiddleware, pensionPlansController.deletePlan.bind(pensionPlansController))

pensionPlansRoutes.get('/:id/movements', authMiddleware, pensionPlansController.getMovements.bind(pensionPlansController))
pensionPlansRoutes.post('/:id/movements', authMiddleware, pensionPlansController.addMovement.bind(pensionPlansController))
pensionPlansRoutes.patch('/:id/movements/:movementId', authMiddleware, pensionPlansController.editMovement.bind(pensionPlansController))
pensionPlansRoutes.delete('/:id/movements/:movementId', authMiddleware, pensionPlansController.deleteMovement.bind(pensionPlansController))
