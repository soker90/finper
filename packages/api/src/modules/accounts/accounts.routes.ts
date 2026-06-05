import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware'
import { accountsController } from './accounts.controller'

export const accountsRoutes = Router()

// Express expects request handlers to have signature (req, res, next).
// We bind the methods to ensure 'this' context if it was needed,
// though we're using imported singletons inside the controller methods so it's safe either way.
accountsRoutes.post('/', authMiddleware, accountsController.create.bind(accountsController))
accountsRoutes.get('/', authMiddleware, accountsController.accounts.bind(accountsController))
accountsRoutes.patch('/:id', authMiddleware, accountsController.edit.bind(accountsController))
accountsRoutes.get('/:id', authMiddleware, accountsController.account.bind(accountsController))
accountsRoutes.post('/transfer', authMiddleware, accountsController.transfer.bind(accountsController))
