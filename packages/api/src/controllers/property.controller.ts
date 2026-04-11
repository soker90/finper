import { NextFunction, Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import { PropertyDocument } from '@soker90/finper-models'
import {
  validatePropertyParams,
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

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ body: req.body, user: req.user as string })
      .tap(({ body }) => this.logger.logInfo(`/create - property: ${body.name}`))
      .then(validatePropertyParams)
      .then(({ value }) => {
        return { ...value, user: req.user as string }
      })
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
    Promise.resolve({ params: req.params, body: req.body, user: req.user as string })
      .tap(({ body }) => this.logger.logInfo(`/edit - property: ${body.name}`))
      .then(validatePropertyParams)
      .then((validated) => this.propertyService.editProperty({ id: validated.id as string, value: validated.value }))
      .tap(({ _id }: PropertyDocument) => this.logger.logInfo(`Property ${_id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve({ id: req.params.id, user: req.user as string })
      .tap(({ id }) => this.logger.logInfo(`/delete - property: ${id}`))
      .tap(validatePropertyExist)
      .then(this.propertyService.deleteProperty.bind(this.propertyService))
      .then(() => {
        res.send({ deleted: true })
      })
      .catch((error) => {
        next(error)
      })
  }
}
