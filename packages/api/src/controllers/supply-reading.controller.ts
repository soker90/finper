import { Request, Response } from 'express'

import {
  validateReadingCreateParams,
  validateReadingEditParams,
  validateReadingExist
} from '../validators/supply-reading'
import { validateSupplyExist } from '../validators/supply'
import { ISupplyReadingService } from '../services/supply-reading.service'

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

  public async getReadings (req: Request, res: Response): Promise<void> {
    const { supplyId } = req.params
    this.logger.logInfo(`/supply/${supplyId} - list readings`)

    await validateSupplyExist({ id: supplyId, user: req.user })
    const response = await this.supplyReadingService.getSupplyReadings({ supplyId, user: req.user })

    res.send(response)
  }

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/create - supply-reading')

    const params = await validateReadingCreateParams({ ...req.body, user: req.user })
    const response = await this.supplyReadingService.addReading(params)
    this.logger.logInfo(`Supply Reading ${response._id} has been succesfully created`)

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - supply-reading: ${req.params.id}`)

    const { id, value } = await validateReadingEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.supplyReadingService.editReading({ id, value, user: req.user })
    this.logger.logInfo(`Supply Reading ${response._id} has been succesfully edited`)

    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - supply-reading: ${id}`)

    await validateReadingExist({ id, user: req.user })
    await this.supplyReadingService.deleteReading({ id, user: req.user })

    res.sendStatus(204)
  }
}
