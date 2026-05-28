import { Request, Response } from 'express'
import { PensionsService } from './pensions.service'
import { validatePensionCreateParams, validatePensionEditParams } from './pensions.schema'

export class PensionsController {
  private logger
  private pensionsService: PensionsService

  constructor ({ loggerHandler, pensionsService }: { loggerHandler: any, pensionsService: PensionsService }) {
    this.logger = loggerHandler
    this.pensionsService = pensionsService
  }

  public async create (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/create - pension')

    const params = validatePensionCreateParams(req.body)
    const response = this.pensionsService.addPension({ ...params, user: req.user })
    
    this.logger.logInfo(`Pension ${new Date(response.date).toISOString()} has been succesfully created`)

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/pensions edit')

    const value = validatePensionEditParams(req.body)
    const response = this.pensionsService.editPension({ id: req.params.id, value, user: req.user as string })
    
    this.logger.logInfo(`Pension ${new Date(response.date).toISOString()} has been succesfully edited`)

    res.send(response)
  }

  public async pensions (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/pensions - list pension transactions of ${req.user}`)

    const response = this.pensionsService.getPensions(req.user as string)

    res.send(response)
  }
}
