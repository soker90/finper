import { Request, Response } from 'express'
import { CategoriesService } from './categories.service'

export class CategoriesController {
  private logger
  private categoriesService: CategoriesService

  constructor ({ loggerHandler, categoriesService }: { loggerHandler: any, categoriesService: CategoriesService }) {
    this.logger = loggerHandler
    this.categoriesService = categoriesService
  }

  public async create (req: Request, res: Response): Promise<void> {
    const { name } = req.body
    this.logger.logInfo(`/create - category: ${name?.toLowerCase()}`)

    const response = this.categoriesService.addCategory({ body: req.body, user: req.user as string })

    this.logger.logInfo(`Category ${response.name} has been succesfully created`)
    res.send(response)
  }

  public async categories (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/categories - list categories of ${req.user}`)

    const response = this.categoriesService.getCategories(req.user as string)
    res.send(response)
  }

  public async categoriesGrouped (req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/categories/grouped - list grouped categories')

    const response = this.categoriesService.getGroupedCategories(req.user as string)
    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - category: ${req.body.name}`)

    const response = this.categoriesService.editCategory({ id: req.params.id, body: req.body, user: req.user as string })

    this.logger.logInfo(`Category ${response._id} has been succesfully edited`)
    res.send(response)
  }

  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - category: ${id}`)

    this.categoriesService.deleteCategory({ id, user: req.user as string })
    res.send()
  }
}
