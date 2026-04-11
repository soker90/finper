import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { SupplyReadingDocument } from '@soker90/finper-models'
import {
  validateReadingParams,
  validateReadingExist
} from '../validators/supply-reading'
import { validateSupplyExist } from '../validators/supply'
import { ISupplyReadingService } from '../services/supply-reading.service'
import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'

type ISupplyReadingController = {
  loggerHandler: any,
  supplyReadingService: ISupplyReadingService,
}

export class SupplyReadingController {
  private logger
  private supplyReadingService

  constructor ({ loggerHandler, supplyReadingService }: ISupplyReadingController) {
    this.logger = loggerHandler
    this.supplyReadingService = supplyReadingService
  }

  public async getReadings (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params as { supplyId: string })
      .tap(() => this.logger.logInfo('/supply/:supplyId - list readings'))
      .tap(({ supplyId }) => validateSupplyExist({ id: supplyId, user: req.user as string }))
      .then(({ supplyId }) => this.supplyReadingService.getSupplyReadings({ supplyId, user: req.user as string }))
      .then((response) => {
        res.send(response)
      })
      .catch(next)
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(() => this.logger.logInfo('/create - supply-reading'))
      .then(validateReadingParams.bind(null, req as unknown as RequestUser))
      .then(({ value }) => value)
      .then(extractUser(req))
      .then(this.supplyReadingService.addReading.bind(this.supplyReadingService))
      .tap(({ _id }: SupplyReadingDocument) => this.logger.logInfo(`Supply Reading ${_id} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch(next)
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as unknown as RequestUser)
      .tap(() => this.logger.logInfo(`/edit - supply-reading: ${req.params.id}`))
      .then(validateReadingParams)
      .then(this.supplyReadingService.editReading.bind(this.supplyReadingService))
      .tap(({ _id }: SupplyReadingDocument) => this.logger.logInfo(`Supply Reading ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch(next)
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params as { id: string })
      .tap(({ id }) => this.logger.logInfo(`/delete - supply-reading: ${id}`))
      .tap(validateReadingExist.bind(null, { id: req.params.id, user: req.user as string }))
      .then(this.supplyReadingService.deleteReading.bind(this.supplyReadingService))
      .then(() => {
        res.sendStatus(204)
      })
      .catch(next)
  }
}
