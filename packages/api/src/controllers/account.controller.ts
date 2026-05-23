import { Request, Response } from 'express'

import { IAccountService } from '../services/account.service'
import { validateAccountCreateParams, validateAccountEditParams, validateAccountExist, validateAccountTransferParams, validateAccountTransferExist } from '../validators/account'
import '../auth/local-strategy-passport-handler'
import { RequestUser } from '../types'

type IAccountController = {
  loggerHandler: any,
  accountService: IAccountService,
}

export class AccountController {
  private logger

  private accountService

  constructor ({ loggerHandler, accountService }: IAccountController) {
    this.logger = loggerHandler
    this.accountService = accountService
  }

  public async create (req: Request, res: Response): Promise<void> {
    const { name } = req.body
    this.logger.logInfo(`/create - account: ${name?.toLowerCase()}`)

    const params = validateAccountCreateParams(req.body)
    const response = await this.accountService.addAccount({ ...params, user: req.user as string })

    this.logger.logInfo(`Account ${response.name} has been succesfully created`)
    res.send(response)
  }

  public async accounts (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/accounts - list accounts of ${req.user}`)

    const response = await this.accountService.getAccounts(req.user as string)
    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - account: ${req.body.name?.toLowerCase()}`)

    const params = await validateAccountEditParams(req as RequestUser)
    const response = await this.accountService.editAccount(params)

    this.logger.logInfo(`Account ${response._id} has been succesfully edited`)
    res.send(response)
  }

  public async account (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const user = req.user as string
    this.logger.logInfo(`/account - account: ${id}`)

    await validateAccountExist(id, user)
    const response = await this.accountService.getAccount({ id })

    res.send(response)
  }

  public async transfer (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/transfer - account transfer')

    const params = validateAccountTransferParams(req.body)
    await validateAccountTransferExist({ ...params, user: req.user as string })
    await this.accountService.transfer(params)

    this.logger.logInfo('Account transfer has been successfully processed')
    res.status(200).send({ message: 'Transfer successful' })
  }
}
