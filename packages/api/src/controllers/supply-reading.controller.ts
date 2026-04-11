import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { SupplyReadingDocument } from '@soker90/finper-models'
import {
  validateReadingParams,
  validateReadingExist
} from '../validators/supply-reading'
import { validateSupplyExist } from '../validators/supply'
import { ISupplyReadingService } from '../services/supply-reading.service'
import { ERROR_MESSAGE } from '../i18n'

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
    const user = req.user as string
    const supplyId = req.params.supplyId

    Promise.resolve({ id: supplyId, user })
      .tap(() => this.logger.logInfo('/supply/:supplyId - list readings'))
      .tap(() => validateSupplyExist({ id: supplyId, user, message: ERROR_MESSAGE.SUPPLY.NOT_FOUND }))
      .then(() => this.supplyReadingService.getSupplyReadings({ supplyId, user }))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ body: req.body, user: req.user as string })
      .tap(() => this.logger.logInfo('/create - supply-reading'))
      .then(validateReadingParams)
      .then(({ value }) => {
        return { ...value, user: req.user as string }
      })
      .then(this.supplyReadingService.addReading.bind(this.supplyReadingService))
      .tap(({ _id }: SupplyReadingDocument) => this.logger.logInfo(`Supply Reading ${_id} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ params: req.params, body: req.body, user: req.user as string })
      .tap(() => this.logger.logInfo(`/edit - supply-reading: ${req.params.id}`))
      .then(validateReadingParams)
      .then((validated) => this.supplyReadingService.editReading({ id: validated.id as string, value: validated.value }))
      .tap(({ _id }: SupplyReadingDocument) => this.logger.logInfo(`Supply Reading ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id, user: req.user as string })
      .tap(({ id }) => this.logger.logInfo(`/delete - supply-reading: ${id}`))
      .tap(validateReadingExist)
      .then(this.supplyReadingService.deleteReading.bind(this.supplyReadingService))
      .then(() => {
        res.send({ deleted: true })
      })
      .catch((error) => {
        next(error)
      })
  }
}
