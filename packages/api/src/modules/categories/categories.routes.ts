import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createCategoriesRepository } from './categories.repository'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'

// Patrón de accounts.routes: se exporta un Router montable directamente.
// Esto permite montarlo en /test-api/categories en los tests (modo "construir
// sin activar", Camino 2b) y, en la transición atómica del core, montarlo en
// server.ts como this.app.use('/api/categories', categoriesRoutes).
export const categoriesRoutes = Router()

const repository = createCategoriesRepository(db)
const categoriesService = new CategoriesService(repository)
const categoriesController = new CategoriesController({
  categoriesService,
  loggerHandler: loggerHandler('CategoryController')
})

categoriesRoutes.post(
  '/',
  authMiddleware,
  categoriesController.create.bind(categoriesController)
)

categoriesRoutes.get(
  '/',
  authMiddleware,
  categoriesController.categories.bind(categoriesController)
)

// /grouped declarado ANTES de /:id para que Express no lo capture como id.
categoriesRoutes.get(
  '/grouped',
  authMiddleware,
  categoriesController.categoriesGrouped.bind(categoriesController)
)

categoriesRoutes.patch(
  '/:id',
  authMiddleware,
  categoriesController.edit.bind(categoriesController)
)

categoriesRoutes.delete(
  '/:id',
  authMiddleware,
  categoriesController.delete.bind(categoriesController)
)
