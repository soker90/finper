import { Router } from 'express'
import passport from 'passport'
import { debtsController } from './debts.controller'

export const debtsRouter = Router()

// Wrapper for async handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

const auth = passport.authenticate('jwt', { session: false })

debtsRouter.post('/', auth, asyncHandler(debtsController.create))
debtsRouter.get('/', auth, asyncHandler(debtsController.getAll))
debtsRouter.get('/from/:from', auth, asyncHandler(debtsController.getFrom))
debtsRouter.put('/:id', auth, asyncHandler(debtsController.edit))
debtsRouter.delete('/:id', auth, asyncHandler(debtsController.delete))
debtsRouter.post('/:id/pay', auth, asyncHandler(debtsController.pay))
