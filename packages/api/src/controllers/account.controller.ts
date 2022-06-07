/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express'

import { IAccountService } from '../services/account.service'
import validateAccountInputParams from '../validators/validate-account-input-params'

import '../auth/local-strategy-passport-handler'
import extractUser from '../helpers/extract-user'

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
      .then(validateAccountInputParams)
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
}
