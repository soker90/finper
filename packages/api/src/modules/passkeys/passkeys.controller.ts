import type { Request, Response } from 'express'
import loggerHandler from '../../utils/logger'
import { passkeysService } from './passkeys.service'
import {
  validateAuthenticationOptionsInput,
  validateAuthenticationVerifyInput,
  validateRegistrationVerifyInput
} from './passkeys.validators'

const logger = loggerHandler('PasskeysController')

export const createPasskeysController = (service: typeof passkeysService) => ({
  async registrationOptions (req: Request, res: Response) {
    const username = req.user
    logger.logInfo(`/registration-options - user: ${username}`)

    const { options, challengeToken } = await service.getRegistrationOptions(username)
    res.send({ options, challengeToken })
  },

  async registrationVerify (req: Request, res: Response) {
    const username = req.user
    const { response, challengeToken, deviceLabel } = validateRegistrationVerifyInput(req.body)
    logger.logInfo(`/registration-verify - user: ${username}`)

    await service.verifyRegistration({ username, response, challengeToken, deviceLabel })
    res.status(204).send()
  },

  async authenticationOptions (req: Request, res: Response) {
    const { username } = validateAuthenticationOptionsInput(req.body)
    logger.logInfo(`/authentication-options - user: ${username}`)

    const { options, challengeToken } = await service.getAuthenticationOptions(username)
    res.send({ options, challengeToken })
  },

  async authenticationVerify (req: Request, res: Response) {
    const { response, challengeToken } = validateAuthenticationVerifyInput(req.body)
    logger.logInfo('/authentication-verify')

    const token = await service.verifyAuthentication(response, challengeToken)
    res.send({ token })
  }
})

export const passkeysController = createPasskeysController(passkeysService)
