import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { PropertyDocument } from '@soker90/finper-models'
import {
  validatePropertyCreateParams,
  validatePropertyEditParams,
  validatePropertyExist
} from '../validators/property'
import { IPropertyService } from '../services/property.service'
import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'

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

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ name }) => this.logger.logInfo(`/create - property: ${name}`))
      .then(extractUser(req))
      .then(validatePropertyCreateParams)
      .then(this.propertyService.addProperty.bind(this.propertyService))
      .tap(({ name }: PropertyDocument) => this.logger.logInfo(`Property ${name} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req as unknown as RequestUser)
      .tap(({ body }) => this.logger.logInfo(`/edit - property: ${body.name}`))
      .then(validatePropertyEditParams)
      .then(this.propertyService.editProperty.bind(this.propertyService))
      .tap(({ _id }: PropertyDocument) => this.logger.logInfo(`Property ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params as { id: string })
      .tap(({ id }) => this.logger.logInfo(`/delete - property: ${id}`))
      .then(extractUser(req))
      .tap(validatePropertyExist)
      .then(this.propertyService.deleteProperty.bind(this.propertyService))
      .then(() => {
        res.sendStatus(204)
      })
      .catch((error) => {
        next(error)
      })
  }
}
