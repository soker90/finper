import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { SupplyDocument } from '@soker90/finper-models'
import {
  validateSupplyParams,
  validateSupplyExist
} from '../validators/supply'
import { ISupplyService } from '../services/supply.service'

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
    Promise.resolve({ body: req.body, user: req.user as string })
      .tap(({ body }) => this.logger.logInfo(`/create - supply: ${body.name}`))
      .then(validateSupplyParams)
      .then(({ value }) => {
        return { ...value, user: req.user as string }
      })
      .then(this.supplyService.addSupply.bind(this.supplyService))
      .tap(({ name }: SupplyDocument) => this.logger.logInfo(`Supply ${name} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ params: req.params, body: req.body, user: req.user as string })
      .tap(({ body }) => this.logger.logInfo(`/edit - supply: ${body.name}`))
      .then(validateSupplyParams)
      .then((validated) => this.supplyService.editSupply({ id: validated.id as string, value: validated.value }))
      .tap(({ _id }: SupplyDocument) => this.logger.logInfo(`Supply ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id, user: req.user as string })
      .tap(({ id }) => this.logger.logInfo(`/delete - supply: ${id}`))
      .tap(validateSupplyExist)
      .then(this.supplyService.deleteSupply.bind(this.supplyService))
      .then(() => {
        res.send({ deleted: true })
      })
      .catch((error) => {
        next(error)
      })
  }
}
