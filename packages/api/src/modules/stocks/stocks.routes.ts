import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware'
import { StockController } from './stocks.controller'
import { stockService } from './stocks.service'

export const stocksRouter = Router()

// Wrapper for async handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

const stocksController = new StockController(stockService)

stocksRouter.get('/summary', authMiddleware, asyncHandler(stocksController.summary.bind(stocksController)))
stocksRouter.get('/', authMiddleware, asyncHandler(stocksController.stocks.bind(stocksController)))
stocksRouter.post('/', authMiddleware, stocksController.create.bind(stocksController))
stocksRouter.delete('/:id', authMiddleware, stocksController.remove.bind(stocksController))
