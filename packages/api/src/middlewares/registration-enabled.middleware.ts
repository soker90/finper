import { Request, Response, NextFunction } from 'express'
import Boom from '@hapi/boom'
import config from '../config'

export const registrationEnabledMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!config.allowRegistration) {
    return next(Boom.forbidden('Registration is disabled').output)
  }
  next()
}
