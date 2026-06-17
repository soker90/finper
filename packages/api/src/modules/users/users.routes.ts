import { Router } from 'express'
import { usersController } from './users.controller'
import authMiddleware from '../../middlewares/auth.middleware'

import { registrationEnabledMiddleware } from '../../middlewares/registration-enabled.middleware'

export const usersRouter = Router()

usersRouter.post('/login', usersController.login.bind(usersController))
usersRouter.post('/register', registrationEnabledMiddleware, usersController.register.bind(usersController))
usersRouter.get('/me', authMiddleware, usersController.me.bind(usersController))
