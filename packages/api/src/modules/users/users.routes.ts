import { Router } from 'express'
import { usersController } from './users.controller'
import authMiddleware from '../../middlewares/auth.middleware'

export const usersRouter = Router()

usersRouter.post('/login', usersController.login)
usersRouter.post('/register', usersController.register)
usersRouter.get('/me', authMiddleware, usersController.me)
