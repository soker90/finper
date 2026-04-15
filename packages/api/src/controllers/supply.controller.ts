import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { SupplyDocument } from '@soker90/finper-models'
import {
  validateSupplyCreateParams,
  validateSupplyEditParams,
  validateSupplyExist
} from '../validators/supply'
import { ISupplyService } from '../services/supply.service'
import extractUser from '../helpers/extract-user'
import { ITariffsService } from '../services/tariffs.service'
import { RequestUser } from '../types'

type ISupplyController = {
  loggerHandler: any,
  supplyService: ISupplyService,
  tariffsService: ITariffsService
}

export class SupplyController {
  private logger
  private supplyService
  private tariffsService

  constructor ({ loggerHandler, supplyService, tariffsService }: ISupplyController) {
    this.logger = loggerHandler
    this.supplyService = supplyService
    this.tariffsService = tariffsService
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
      .then(extractUser(req))
      .then(validateSupplyCreateParams)
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
    Promise.resolve(req as unknown as RequestUser)
      .tap(({ body }) => this.logger.logInfo(`/edit - supply: ${body.name}`))
      .then(validateSupplyEditParams)
      .then(this.supplyService.editSupply.bind(this.supplyService))
      .tap(({ _id }: SupplyDocument) => this.logger.logInfo(`Supply ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params as { id: string })
      .tap(({ id }) => this.logger.logInfo(`/delete - supply: ${id}`))
      .then(extractUser(req))
      .tap(validateSupplyExist)
      .then(this.supplyService.deleteSupply.bind(this.supplyService))
      .then(() => {
        res.sendStatus(204)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async compareTariffs (req: Request, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params
    Promise.resolve(req.user as string)
      .tap((user) => this.logger.logInfo(`/supplies/${id}/tariffs-comparison - compare tariffs for ${user}`))
      .then((user) => this.tariffsService.compareTariffs(id, user))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }
}
