import { Request, Response } from 'express'
import { PensionsService } from './pensions.service'
import { validatePensionCreateParams, validatePensionEditParams } from './pensions.validators'

export class PensionsController {
  private logger
  private pensionsService: PensionsService

  constructor ({ loggerHandler, pensionsService }: { loggerHandler: any, pensionsService: PensionsService }) {
    this.logger = loggerHandler
    this.pensionsService = pensionsService
  }

  public create (req: Request, res: Response): void {
    this.logger.logInfo('/create - pension')

    const params = validatePensionCreateParams(req.body)
    const response = this.pensionsService.addPension({ ...params, user: req.user })

    this.logger.logInfo(`Pension ${new Date(response.date).toISOString()} has been succesfully created`)

    res.send(response)
  }

  public edit (req: Request, res: Response): void {
    this.logger.logInfo('/pensions edit')

    const { id, value } = validatePensionEditParams({ params: req.params, body: req.body, user: req.user })
    const response = this.pensionsService.editPension(id, value, req.user)

    this.logger.logInfo(`Pension ${new Date(response.date).toISOString()} has been succesfully edited`)

    res.send(response)
  }

  public pensions (req: Request, res: Response): void {
    this.logger.logInfo(`/pensions - list pension transactions of ${req.user}`)

    const response = this.pensionsService.getPensions(req.user)

    res.send(response)
  }
}
