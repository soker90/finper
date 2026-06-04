import { Router } from 'express'
import loggerHandler from '../../utils/logger'
import authMiddleware from '../../middlewares/auth.middleware'
import { db } from '../../db'
import { createStatsRepository } from './stats.repository'
import { StatsService } from './stats.service'
import { StatsController } from './stats.controller'

export const statsRoutes = Router()

const repository = createStatsRepository(db)
const statsService = new StatsService(repository)
const c = new StatsController({ statsService, loggerHandler: loggerHandler('StatsController') })

// Orden: estáticas (/tags/available, /tags/years) y exacta (/tags) antes que la
// dinámica /tags/:tagName, y esta antes que /tags/:tagName/:year.
statsRoutes.get('/tags/available', authMiddleware, c.getAvailableTags.bind(c))
statsRoutes.get('/tags/years', authMiddleware, c.getAvailableYears.bind(c))
statsRoutes.get('/tags', authMiddleware, c.getTagsSummary.bind(c))
statsRoutes.get('/tags/:tagName', authMiddleware, c.getTagHistoric.bind(c))
statsRoutes.get('/tags/:tagName/:year', authMiddleware, c.getTagDetail.bind(c))
