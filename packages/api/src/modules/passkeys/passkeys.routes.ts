import { Router } from 'express'
import authMiddleware from '../../middlewares/auth.middleware'
import { passkeysController } from './passkeys.controller'

export const passkeysRouter = Router()

// Wrapper for async handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Authenticated — called right after a successful password login
passkeysRouter.post('/registration-options', authMiddleware, asyncHandler(passkeysController.registrationOptions.bind(passkeysController)))
passkeysRouter.post('/registration-verify', authMiddleware, asyncHandler(passkeysController.registrationVerify.bind(passkeysController)))

// Public — no JWT exists yet at this point of the login flow
passkeysRouter.post('/authentication-options', asyncHandler(passkeysController.authenticationOptions.bind(passkeysController)))
passkeysRouter.post('/authentication-verify', asyncHandler(passkeysController.authenticationVerify.bind(passkeysController)))
