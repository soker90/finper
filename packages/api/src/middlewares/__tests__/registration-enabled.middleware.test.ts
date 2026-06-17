import { Request, Response, NextFunction } from 'express'
import Boom from '@hapi/boom'
import { registrationEnabledMiddleware } from '../registration-enabled.middleware'
import config from '../../config'

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    allowRegistration: false
  }
}))

describe('registrationEnabledMiddleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock<NextFunction>

  beforeEach(() => {
    req = {}
    res = {}
    next = jest.fn()
  })

  test('should call next with Boom.forbidden when allowRegistration is false', () => {
    config.allowRegistration = false
    registrationEnabledMiddleware(req as Request, res as Response, next as NextFunction)
    expect(next).toHaveBeenCalledWith(Boom.forbidden('Registration is disabled').output)
  })

  test('should call next without arguments when allowRegistration is true', () => {
    config.allowRegistration = true
    registrationEnabledMiddleware(req as Request, res as Response, next as NextFunction)
    expect(next).toHaveBeenCalledWith()
  })
})
