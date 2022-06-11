import { NextFunction, Request, Response } from 'express'

import { IAccountService } from '../services/account.service'

import { validateAccountCreateParams, validateAccountEditParams, validateAccountExist } from '../validators/account'
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
      .tap(({ id }) => this.logger.logInfo(`Account ${id} has been succesfully edited`))
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
}
