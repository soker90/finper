import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware'
import { debtsController } from './debts.controller'

export const debtsRouter = Router()

// Wrapper for async handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

debtsRouter.post('/', authMiddleware, asyncHandler(debtsController.create))
debtsRouter.get('/', authMiddleware, asyncHandler(debtsController.getAll))
debtsRouter.get('/from/:from', authMiddleware, asyncHandler(debtsController.getFrom))
debtsRouter.put('/:id', authMiddleware, asyncHandler(debtsController.edit))
debtsRouter.delete('/:id', authMiddleware, asyncHandler(debtsController.delete))
debtsRouter.post('/:id/pay', authMiddleware, asyncHandler(debtsController.pay))
