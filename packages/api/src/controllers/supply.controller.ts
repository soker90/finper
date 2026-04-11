import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { SupplyDocument } from '@soker90/finper-models'
import {
  validateSupplyParams,
  validateSupplyExist
} from '../validators/supply'
import { ISupplyService } from '../services/supply.service'
import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'

type ISupplyController = {
  loggerHandler: any,
  supplyService: ISupplyService,
}

export class SupplyController {
  private logger
  private supplyService

  constructor ({ loggerHandler, supplyService }: ISupplyController) {
    this.logger = loggerHandler
    this.supplyService = supplyService
  }

  public async group (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.user as string)
      .tap((user) => this.logger.logInfo(`/ - list grouped supplies for ${user}`))
      .then(this.supplyService.getSuppliesGroupedByProperty.bind(this.supplyService))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ name }) => this.logger.logInfo(`/create - supply: ${name}`))
      .then(validateSupplyParams.bind(null, req as unknown as RequestUser))
      .then(({ value }) => value)
      .then(extractUser(req))
      .then(this.supplyService.addSupply.bind(this.supplyService))
      .tap(({ name }: SupplyDocument) => this.logger.logInfo(`Supply ${name} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch(next)
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as unknown as RequestUser)
      .tap(({ body }) => this.logger.logInfo(`/edit - supply: ${body.name}`))
      .then(validateSupplyParams)
      .then(this.supplyService.editSupply.bind(this.supplyService))
      .tap(({ _id }: SupplyDocument) => this.logger.logInfo(`Supply ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch(next)
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params as { id: string })
      .tap(({ id }) => this.logger.logInfo(`/delete - supply: ${id}`))
      .tap(validateSupplyExist.bind(null, { id: req.params.id, user: req.user as string }))
      .then(this.supplyService.deleteSupply.bind(this.supplyService))
      .then(() => {
        res.sendStatus(204)
      })
      .catch(next)
  }
}
