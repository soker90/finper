import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware'
import { creditCardsController } from './credit-cards.controller'

export const creditCardsRoutes = Router()

creditCardsRoutes.get('/', authMiddleware, (req, res, next) => {
  creditCardsController.getCreditCards(req, res).catch(next)
})

creditCardsRoutes.post('/', authMiddleware, (req, res, next) => {
  creditCardsController.createCreditCard(req, res).catch(next)
})

creditCardsRoutes.get('/:id', authMiddleware, (req, res, next) => {
  creditCardsController.getCreditCard(req, res).catch(next)
})

creditCardsRoutes.patch('/:id', authMiddleware, (req, res, next) => {
  creditCardsController.editCreditCard(req, res).catch(next)
})

creditCardsRoutes.delete('/:id', authMiddleware, (req, res, next) => {
  creditCardsController.deleteCreditCard(req, res).catch(next)
})

creditCardsRoutes.get('/:id/movements', authMiddleware, (req, res, next) => {
  creditCardsController.getMovements(req, res).catch(next)
})

creditCardsRoutes.post('/:id/movements', authMiddleware, (req, res, next) => {
  creditCardsController.addMovement(req, res).catch(next)
})

creditCardsRoutes.patch('/:id/movements/:movementId', authMiddleware, (req, res, next) => {
  creditCardsController.editMovement(req, res).catch(next)
})

creditCardsRoutes.delete('/:id/movements/:movementId', authMiddleware, (req, res, next) => {
  creditCardsController.deleteMovement(req, res).catch(next)
})

creditCardsRoutes.post('/:id/pay-debt', authMiddleware, (req, res, next) => {
  creditCardsController.payDebt(req, res).catch(next)
})
