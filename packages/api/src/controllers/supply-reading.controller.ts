import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { SupplyReadingDocument } from '@soker90/finper-models'
import {
  validateReadingCreateParams,
  validateReadingEditParams,
  validateReadingExist
} from '../validators/supply-reading'
import { validateSupplyExist } from '../validators/supply'
import { ISupplyReadingService } from '../services/supply-reading.service'
import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'
import { tap } from '../utils/promise'

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
    Promise.resolve({ supplyId: req.params.supplyId })
      .then(tap(() => this.logger.logInfo(`/supply/${req.params.supplyId} - list readings`)))
      .then(extractUser(req))
      .then(tap(({ supplyId, user }) => validateSupplyExist({ id: supplyId as string, user: user as string })))
      .then(this.supplyReadingService.getSupplyReadings.bind(this.supplyReadingService))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .then(tap(() => this.logger.logInfo('/create - supply-reading')))
      .then(extractUser(req))
      .then(validateReadingCreateParams)
      .then(this.supplyReadingService.addReading.bind(this.supplyReadingService))
      .then(tap(({ _id }: SupplyReadingDocument) => this.logger.logInfo(`Supply Reading ${_id} has been succesfully created`)))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as unknown as RequestUser)
      .then(tap(() => this.logger.logInfo(`/edit - supply-reading: ${req.params.id}`)))
      .then(validateReadingEditParams)
      .then(this.supplyReadingService.editReading.bind(this.supplyReadingService))
      .then(tap(({ _id }: SupplyReadingDocument) => this.logger.logInfo(`Supply Reading ${_id} has been succesfully edited`)))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params as { id: string })
      .then(tap(({ id }) => this.logger.logInfo(`/delete - supply-reading: ${id}`)))
      .then(extractUser(req))
      .then(tap(validateReadingExist))
      .then(this.supplyReadingService.deleteReading.bind(this.supplyReadingService))
      .then(() => {
        res.sendStatus(204)
      })
      .catch((error) => {
        next(error)
      })
  }
}
