import { Request, Response } from 'express'
import { accountsService } from './accounts.service'
import {
  validateAccountCreateParams,
  validateAccountEditParams,
  validateAccountTransferParams
} from './accounts.validators'
import { accountSummarySerializer, accountFullSerializer } from './accounts.serializer'
import loggerHandler from '../../utils/logger'
import '../../auth/local-strategy-passport-handler'

const logger = loggerHandler('AccountController')

export class AccountsController {
  public async create (req: Request, res: Response): Promise<void> {
    logger.logInfo(`/create - account: ${req.body.name?.toLowerCase()}`)
    const value = validateAccountCreateParams(req.body)

    const account = await accountsService.addAccount(req.user, value)
    const response = accountFullSerializer(account)

    logger.logInfo(`Account ${response.name} has been succesfully created`)
    res.send(response)
  }

  public async accounts (req: Request, res: Response): Promise<void> {
    logger.logInfo(`/accounts - list accounts of ${req.user}`)
    const accounts = await accountsService.getAccounts(req.user)
    res.send(accounts.map(accountSummarySerializer))
  }

  public async edit (req: Request, res: Response): Promise<void> {
    logger.logInfo(`/edit - account: ${req.body.name?.toLowerCase()}`)
    const { id, value } = await validateAccountEditParams({ params: req.params, body: req.body, user: req.user })

    const account = await accountsService.editAccount({ id, user: req.user, value })
    const response = accountFullSerializer(account)

    logger.logInfo(`Account ${response._id} has been succesfully edited`)
    res.send(response)
  }

  public async account (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    logger.logInfo(`/account - account: ${id}`)

    const account = await accountsService.getAccount({ id, user: req.user })
    res.send(accountSummarySerializer(account))
  }

  public async transfer (req: Request, res: Response): Promise<void> {
    logger.logInfo('/transfer - account transfer')
    const { sourceId, destinationId, amount } = validateAccountTransferParams(req.body)

    await accountsService.transfer({ sourceId, destinationId, amount, user: req.user })

    logger.logInfo('Account transfer has been successfully processed')
    res.status(200).send({ message: 'Transfer successful' })
  }
}

export const accountsController = new AccountsController()
