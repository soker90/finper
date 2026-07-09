import { Request, Response } from 'express'
import { YieldsService } from './yields.service'
import {
  validateYieldCreateParams,
  validateYieldEditParams,
  validateYieldExist,
  validateYieldLinkParams
} from './yields.validators'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'

export class YieldsController {
  private logger
  private yieldsService: YieldsService

  constructor ({ loggerHandler, yieldsService }: { loggerHandler: any, yieldsService: YieldsService }) {
    this.logger = loggerHandler
    this.yieldsService = yieldsService
  }

  public create (req: Request, res: Response): void {
    this.logger.logInfo('/create - new yield')
    const params = validateYieldCreateParams({ ...req.body, user: req.user })
    const response = this.yieldsService.addYield(params)
    res.send(response)
  }

  public list (req: Request, res: Response): void {
    this.logger.logInfo(`/yields - list for ${req.user}`)
    const response = this.yieldsService.getYields(req.user)
    res.send(response)
  }

  public detail (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/yields/${id} - detail`)
    validateYieldExist(id, req.user)
    const response = this.yieldsService.getYield(id, req.user)
    if (!response) throw Boom.notFound(ERROR_MESSAGE.YIELD.NOT_FOUND).output
    res.send(response)
  }

  public edit (req: Request, res: Response): void {
    this.logger.logInfo(`/edit - yield: ${req.params.id}`)
    const { id, value } = validateYieldEditParams({ params: req.params, body: req.body, user: req.user })
    const response = this.yieldsService.editYield({ id, value, user: req.user })
    res.send(response)
  }

  public delete (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/delete - yield: ${id}`)
    validateYieldExist(id, req.user)
    this.yieldsService.deleteYield(id, req.user)
    res.status(204).send()
  }

  public getMatchingTransactions (req: Request, res: Response): void {
    const { id } = req.params
    const categoryId = req.query.categoryId as string | undefined
    this.logger.logInfo(`/matching-transactions - yield: ${id}`)
    validateYieldExist(id, req.user)
    const response = this.yieldsService.getMatchingTransactions({ id, categoryId, user: req.user })
    res.send(response)
  }

  public linkTransactions (req: Request, res: Response): void {
    const { id } = req.params
    this.logger.logInfo(`/link-transactions - yield: ${id}`)
    validateYieldExist(id, req.user)
    const transactionIds = validateYieldLinkParams({ transactionIds: req.body.transactionIds })
    this.yieldsService.linkTransactions({ id, transactionIds, user: req.user })
    res.status(204).send()
  }

  public unlinkTransaction (req: Request, res: Response): void {
    const { id, transactionId } = req.params
    this.logger.logInfo(`/unlink-transaction - yield: ${id}, transaction: ${transactionId}`)
    validateYieldExist(id, req.user)
    this.yieldsService.unlinkTransaction(transactionId, req.user)
    res.status(204).send()
  }
}
