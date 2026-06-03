import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createStoresRepository } from './stores.repository'
import { StoresService } from './stores.service'
import { StoresController } from './stores.controller'

// Router montable (patrón accounts). En tests se monta en /test-api/stores;
// en la transición atómica del core, en server.ts como '/api/stores'.
export const storesRoutes = Router()

const repository = createStoresRepository(db)
const storesService = new StoresService(repository)
const storesController = new StoresController({
  storesService,
  loggerHandler: loggerHandler('StoreController')
})

storesRoutes.get('/', authMiddleware, storesController.stores.bind(storesController))
