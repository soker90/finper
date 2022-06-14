import { NextFunction, Request, Response } from 'express'

import { IAccountService } from '../services/account.service'

import { validateAccountEditParams, validateAccountExist } from '../validators/account'
import '../auth/local-strategy-passport-handler'
import extractUser from '../helpers/extract-user'
import { RequestUser } from '../types'
import { validateCategoryCreateParams, validateCategoryEditParams } from '../validators/category'
import { ICategoryService } from '../services/category.service'
import { validateCategoryExist } from '../validators/category/validate-category-exist'

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

  public async create (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.body)
      .tap(({ name }) => this.logger.logInfo(`/create - category: ${name?.toLowerCase()}`))
      .then(validateCategoryCreateParams)
      .then(this.categoryService.addCategory.bind(this.categoryService))
      .tap(({ name }) => this.logger.logInfo(`Category ${name} has been succesfully created`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async categories (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req)
      .tap(() => this.logger.logInfo('/categories - list categories'))
      .then(this.categoryService.getCategories.bind(this.categoryService))
      .then(response => {
        res.send(response)
      }).catch(error => {
        next(error)
      })
  }

  public async edit (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req)
      .tap(({ body }) => this.logger.logInfo(`/edit - category: ${body.name}`))
      .then(validateCategoryEditParams)
      .then(this.categoryService.editCategory.bind(this.categoryService))
      .tap(({ id }) => this.logger.logInfo(`Category ${id} has been succesfully edited`))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }

  public async delete (req: Request, res: Response, next: NextFunction): Promise<void> {
    Promise.resolve(req.params as { id: string })
      .tap(({ id }) => this.logger.logInfo(`/delete - category: ${id}`))
      .tap(validateCategoryExist)
      .then(this.categoryService.deleteCategory.bind(this.categoryService))
      .then((response) => {
        res.send(response)
      })
      .catch((error) => {
        next(error)
      })
  }
}
