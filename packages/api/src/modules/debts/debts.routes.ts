/* eslint-disable @typescript-eslint/no-unused-vars */
// packages/api/src/modules/debts/debts.routes.ts
import { Router } from 'express'
import { debtsController } from './debts.controller'

const router = Router()

// TODO: añadir middlewares de auth y Joi en Sesión B
// router.get('/', passport.authenticate('jwt', { session: false }), debtsController.getAll)
// router.get('/:id', debtsController.getOne)

export default router
