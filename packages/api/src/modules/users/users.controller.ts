import { NextFunction, Request, Response } from 'express'
import Boom from '@hapi/boom'
import passport from 'passport'
import loggerHandler from '../../utils/logger'
import { validateLoginInput, validateRegisterInput } from './users.validators'
import { usersService } from './users.service'

import '../../auth/local-strategy-passport-handler'

export const createUsersController = (service: typeof usersService) => {
  const logger = loggerHandler('AuthController')

  return {
    register: (req: Request, res: Response) => {
      const username = req.body?.username
      logger.logInfo(`/register - username: ${username?.toLowerCase()}`)
      const user = validateRegisterInput(req.body)
      const created = service.createUser(user)
      logger.logInfo(`User ${created.username} has been succesfully created`)
      const token = service.signToken(created.username)
      res.send({ token })
    },

    login: (req: Request, res: Response, next: NextFunction) => {
      logger.logInfo(`/login - user: ${req.body?.username?.toLowerCase()}`)
      req.body = validateLoginInput(req.body)
      passport.authenticate('local', function (error: any, user: any) {
        if (error) return next(error)
        if (!user) return next(Boom.unauthorized().output)
        const token = service.signToken(user.username)
        res.send({ token })
      })(req, res, next)
    },

    me: (_req: Request, res: Response) => {
      res.status(204).send()
    }
  }
}

export const usersController = createUsersController(usersService)
