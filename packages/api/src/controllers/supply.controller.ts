import { Request, Response } from 'express'

import {
  validateSupplyCreateParams,
  validateSupplyEditParams,
  validateSupplyExist,
  validateSupplyForTariffComparison
} from '../validators/supply'
import { ISupplyService } from '../services/supply.service'
import { ITariffsService } from '../services/tariffs.service'

type ISupplyController = {
  loggerHandler: any,
  supplyService: ISupplyService,
  tariffsService: ITariffsService
}

export class SupplyController {
  private logger
  private supplyService
  private tariffsService

  constructor ({ loggerHandler, supplyService, tariffsService }: ISupplyController) {
    this.logger = loggerHandler
    this.supplyService = supplyService
    this.tariffsService = tariffsService
  }

  public async group (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/ - list grouped supplies for ${req.user}`)

    const response = await this.supplyService.getSuppliesGroupedByProperty(req.user)

    res.send(response)
  }

  public async create (req: Request, res: Response): Promise<void> {
    const { name } = req.body
    this.logger.logInfo(`/create - supply: ${name}`)

    const params = await validateSupplyCreateParams({ ...req.body, user: req.user })
    const response = await this.supplyService.addSupply(params)
    this.logger.logInfo(`Supply ${response.name} has been succesfully created`)

    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - supply: ${req.body.name}`)

    const { id, value } = await validateSupplyEditParams({ params: req.params, body: req.body, user: req.user })
    const response = await this.supplyService.editSupply({ id, value, user: req.user })
    this.logger.logInfo(`Supply ${response._id} has been succesfully edited`)

    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - supply: ${id}`)

    await validateSupplyExist({ id, user: req.user })
    await this.supplyService.deleteSupply({ id, user: req.user })

    res.sendStatus(204)
  }

  public async compareTariffs (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/supplies/${id}/tariffs-comparison - compare tariffs for ${req.user}`)

    await validateSupplyForTariffComparison({ id, user: req.user })
    const response = await this.tariffsService.compareTariffs(id, req.user)

    res.send(response)
  }
}
