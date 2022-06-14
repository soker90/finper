import { Router } from 'express'

import loggerHandler from '../utils/logger'
import { CategoryController } from '../controllers/category.controller'
import { categoryService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class CategoryRoutes {
  router: Router

  public categoryController: CategoryController = new CategoryController({
    categoryService,
    loggerHandler: loggerHandler('CategoryController')
  })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post(
      '/',
      authMiddleware,
      this.categoryController.create.bind(this.categoryController)
    )

    this.router.get(
      '/',
      authMiddleware,
      this.categoryController.categories.bind(this.categoryController)
    )

    this.router.patch(
      '/:id',
      authMiddleware,
      this.categoryController.edit.bind(this.categoryController)
    )

    this.router.delete(
      '/:id',
      authMiddleware,
      this.categoryController.delete.bind(this.categoryController)
    )
  }
}
