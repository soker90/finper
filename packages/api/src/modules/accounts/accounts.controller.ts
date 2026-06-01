import { Request, Response } from 'express'
import { accountsService } from './accounts.service'
import { createParamsSchema, editParamsSchema, transferParamsSchema } from './accounts.schema'
import { accountSummarySerializer, accountFullSerializer } from './accounts.serializer'
import { isValidId } from '../../utils'
import { ERROR_MESSAGE } from '../../i18n'
import Boom from '@hapi/boom'
import loggerHandler from '../../utils/logger'
import '../../auth/local-strategy-passport-handler'

const logger = loggerHandler('AccountController')

export class AccountsController {
  public async create(req: Request, res: Response): Promise<void> {
    logger.logInfo(`/create - account: ${req.body.name?.toLowerCase()}`)
    const { error, value } = createParamsSchema.validate(req.body)
    if (error) throw Boom.badData(error.message).output

    const account = await accountsService.addAccount(req.user as string, value)
    const response = accountFullSerializer(account)

    logger.logInfo(`Account ${response.name} has been succesfully created`)
    res.send(response)
  }

  public async accounts(req: Request, res: Response): Promise<void> {
    logger.logInfo(`/accounts - list accounts of ${req.user}`)
    const accounts = await accountsService.getAccounts(req.user as string)
    res.send(accounts.map(accountSummarySerializer))
  }

  public async edit(req: Request, res: Response): Promise<void> {
    logger.logInfo(`/edit - account: ${req.body.name?.toLowerCase()}`)
    
    // Check ID validity to maintain parity with legacy validation
    if (!isValidId(req.params.id)) {
      throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
    }
    // Check existence before body validation
    await accountsService.getAccount({ id: req.params.id, user: req.user as string })

    const { error, value } = editParamsSchema.validate(req.body)
    if (error) throw Boom.badData(error.message).output

    const account = await accountsService.editAccount({ id: req.params.id, user: req.user as string, value })
    const response = accountFullSerializer(account)

    logger.logInfo(`Account ${response._id} has been succesfully edited`)
    res.send(response)
  }

  public async account(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    logger.logInfo(`/account - account: ${id}`)
    
    const account = await accountsService.getAccount({ id, user: req.user as string })
    res.send(accountSummarySerializer(account))
  }

  public async transfer(req: Request, res: Response): Promise<void> {
    logger.logInfo('/transfer - account transfer')
    
    // Parity: check ID before body
    if (req.body.sourceId && !isValidId(req.body.sourceId)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
    if (req.body.destinationId && !isValidId(req.body.destinationId)) throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output

    const { error, value } = transferParamsSchema.validate(req.body)
    if (error) throw Boom.badData(error.message).output

    await accountsService.transfer({ ...value, user: req.user as string })
    
    logger.logInfo('Account transfer has been successfully processed')
    res.status(200).send({ message: 'Transfer successful' })
  }
}

export const accountsController = new AccountsController()
