import { NextFunction, Request, Response } from 'express'

import { IAccountService } from '../services/account.service'
import { AccountDocument } from '@soker90/finper-models'
import { validateAccountCreateParams, validateAccountEditParams, validateAccountExist, validateAccountTransferParams } from '../validators/account'
import '../auth/local-strategy-passport-handler'
import extractUser from '../helpers/extract-user'
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

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ name }) => this.logger.logInfo(`/create - account: ${name?.toLowerCase()}`))
      .then(validateAccountCreateParams)
      .then(extractUser(req))
      .then(this.accountService.addAccount.bind(this.accountService))
      .tap(({ name }) => this.logger.logInfo(`Account ${name} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async accounts (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap(() => this.logger.logInfo(`/accounts - list accounts of ${req.user}`))
      .then(this.accountService.getAccounts.bind(this.accountService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as RequestUser)
      .tap(({ body }) => this.logger.logInfo(`/edit - account: ${body.name?.toLowerCase()}`))
      .then(validateAccountEditParams)
      .then(this.accountService.editAccount.bind(this.accountService))
      .tap(({ _id }: AccountDocument) => this.logger.logInfo(`Account ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async account (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params)
      .tap(({ id }) => this.logger.logInfo(`/account - account: ${id}`))
      .then(extractUser(req))
      .tap(({ user, id }) => validateAccountExist(id, user))
      .then(this.accountService.getAccount.bind(this.accountService))
      .then(response => {
        res.send(response)
      }).catch((error) => {
        next(error)
      })
  }

  public async transfer (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo('/transfer - account transfer'))
      .then(validateAccountTransferParams)
      .then(extractUser(req))
      .tap(({ user, sourceId, destinationId }) => Promise.all([
        validateAccountExist(sourceId as string, user),
        validateAccountExist(destinationId as string, user)
      ]))
      .then(this.accountService.transfer.bind(this.accountService))
      .tap(() => this.logger.logInfo('Account transfer has been successfully processed'))
      .then(() => {
        res.status(200).send({ message: 'Transfer successful' })
      })
      .catch((error) => {
        next(error)
      })
  }
}
