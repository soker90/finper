import { Router } from 'express'
import loggerHandler from '../utils/logger'
import { GoalController } from '../controllers/goal.controller'
import { goalService } from '../services'
import authMiddleware from '../middlewares/auth.middleware'

export class GoalRoutes {
  router: Router
  private goalController = new GoalController({ goalService, loggerHandler: loggerHandler('GoalController') })

  constructor () {
    this.router = Router()
    this.routes()
  }

  routes () {
    this.router.post('/', authMiddleware, this.goalController.create.bind(this.goalController))
    this.router.get('/', authMiddleware, this.goalController.goals.bind(this.goalController))
    this.router.get('/:id', authMiddleware, this.goalController.goal.bind(this.goalController))
    this.router.put('/:id', authMiddleware, this.goalController.edit.bind(this.goalController))
    this.router.delete('/:id', authMiddleware, this.goalController.delete.bind(this.goalController))
    this.router.post('/:id/fund', authMiddleware, this.goalController.fund.bind(this.goalController))
    this.router.post('/:id/withdraw', authMiddleware, this.goalController.withdraw.bind(this.goalController))
  }
}
