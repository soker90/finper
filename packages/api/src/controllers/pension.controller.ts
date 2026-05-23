import { Request, Response } from 'express'

import { IPensionService } from '../services/pension.service'
import { validatePensionCreateParams, validatePensionEditParams } from '../validators/pension'

type IPensionController = {
  loggerHandler: any,
  pensionService: IPensionService,
}

export class PensionController {
  private logger

  private pensionService

  constructor ({ loggerHandler, pensionService }: IPensionController) {
    this.logger = loggerHandler
    this.pensionService = pensionService
  }

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/create - pension')

    const params = await validatePensionCreateParams(req.body)
    const response = await this.pensionService.addPension({ ...params, user: req.user })
    this.logger.logInfo(`Pension ${new Date(response.date).toISOString()} has been succesfully created`)

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/pensions edit')

    const { id, value } = await validatePensionEditParams({ params: { id: req.params.id }, body: req.body, user: req.user })
    const response = await this.pensionService.editPension({ id, value })
    this.logger.logInfo(`Pension ${new Date(response.date).toISOString()} has been succesfully edited`)

    res.send(response)
  }

  public async pensions (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/pensions - list pension transactions of ${req.user}`)

    const response = await this.pensionService.getPensions(req.user)

    res.send(response)
  }
}
