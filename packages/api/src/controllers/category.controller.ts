import { Request, Response } from 'express'

import '../auth/local-strategy-passport-handler'
import {
  validateCategoryCreateParams,
  validateCategoryEditParams,
  validateCategoryExist
} from '../validators/category'
import { ICategoryService } from '../services/category.service'

type ICategoryController = {
  loggerHandler: any,
  categoryService: ICategoryService,
}

export class CategoryController {
  private logger

  private categoryService

  constructor ({ loggerHandler, categoryService }: ICategoryController) {
    this.logger = loggerHandler
    this.categoryService = categoryService
  }

  public async create (req: Request, res: Response): Promise<void> {
    const { name } = req.body
    this.logger.logInfo(`/create - category: ${name?.toLowerCase()}`)

    const params = await validateCategoryCreateParams({ body: req.body, user: req.user })
    const response = await this.categoryService.addCategory({ ...params, user: req.user })

    this.logger.logInfo(`Category ${response.name} has been succesfully created`)
    res.send(response)
  }

  public async categories (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/categories - list categories of ${req.user}`)

    const response = await this.categoryService.getCategories(req.user)
    res.send(response)
  }

  public async categoriesGrouped (_req: Request, res: Response): Promise<void> {
    this.logger.logInfo('/categories - list categories')

    const response = await this.categoryService.getGroupedCategories()
    res.send(response)
  }

  public async edit (req: Request, res: Response): Promise<void> {
    this.logger.logInfo(`/edit - category: ${req.body.name}`)

    const params = await validateCategoryEditParams(req)
    const response = await this.categoryService.editCategory(params)

    this.logger.logInfo(`Category ${response._id} has been succesfully edited`)
    res.send(response)
  }

  // TODO validar que no es padre de ninguna categoria
  public async delete (req: Request, res: Response): Promise<void> {
    const { id } = req.params
    this.logger.logInfo(`/delete - category: ${id}`)

    await validateCategoryExist({ id, user: req.user })
    const response = await this.categoryService.deleteCategory({ id })

    res.send(response)
  }
}
