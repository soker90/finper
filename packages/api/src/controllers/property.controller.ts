import { Request, Response } from 'express'

import {
  validatePropertyCreateParams,
  validatePropertyEditParams,
  validatePropertyExist
} from '../validators/property'
import { IPropertyService } from '../services/property.service'

type IPropertyController = {
  loggerHandler: any,
  propertyService: IPropertyService,
}

export class PropertyController {
  private logger
  private propertyService

  constructor ({ loggerHandler, propertyService }: IPropertyController) {
    this.logger = loggerHandler
    this.propertyService = propertyService
  }

  public async create (req: Request, res: Response): Promise<void> {
    const { name } = req.body
    this.logger.logInfo(`/create - property: ${name}`)

    const params = await validatePropertyCreateParams({ ...req.body, user: req.user })
    const response = await this.propertyService.addProperty(params)
    this.logger.logInfo(`Property ${response.name} has been succesfully created`)

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - property: ${req.body.name}`)

    const { id, value } = await validatePropertyEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.propertyService.editProperty({ id, value, user: req.user })
    this.logger.logInfo(`Property ${response._id} has been succesfully edited`)

    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - property: ${id}`)

    await validatePropertyExist({ id, user: req.user })
    await this.propertyService.deleteProperty({ id, user: req.user })

    res.sendStatus(204)
  }
}
