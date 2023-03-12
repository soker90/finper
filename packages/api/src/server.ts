import 'dotenv/config'
import express from 'express'

import cors from 'cors'
import compression from 'compression'

import db from './config/db'
import config from './config'

import { MonitRoutes } from './routes/monit.routes'
import handleError from './middlewares/handle-error'
import { AuthRoutes } from './routes/auth.routes'
import { AccountRoutes } from './routes/account.routes'
import { BudgetRoutes } from './routes/budget.routes'
import { CategoryRoutes } from './routes/category.routes'
import { DebtRoutes } from './routes/debt.routes'
import { PensionRoutes } from './routes/pension.routes'
import { TransactionRoutes } from './routes/transaction.routes'
import { StoreRoutes } from './routes/store.routes'

global.Promise = require('bluebird')

class Server {
  public app: express.Application

  constructor () {
    this.app = express()
    this.preMiddlewareConfig()
    this.routes()
    this.postMiddlewareConfig()
    this.mongo()
  }

  public routes (): void {
    this.app.use('/api/monit', new MonitRoutes().router)
    this.app.use('/api/auth', new AuthRoutes().router)
    this.app.use('/api/accounts', new AccountRoutes().router)
    this.app.use('/api/budgets', new BudgetRoutes().router)
    this.app.use('/api/debts', new DebtRoutes().router)
    this.app.use('/api/categories', new CategoryRoutes().router)
    this.app.use('/api/pensions', new PensionRoutes().router)
    this.app.use('/api/transactions', new TransactionRoutes().router)
    this.app.use('/api/stores', new StoreRoutes().router)
  }

  public preMiddlewareConfig (): void {
    this.app.set('port', config.port)
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(compression())
    this.app.use(cors())
  }

  public postMiddlewareConfig (): void {
    this.app.use(handleError)
  }

  private mongo () {
    db.connect(config.mongo)
  }

  public start (): void {
    this.app.listen(this.app.get('port'), () => {
      console.log(`API is running at http://localhost:${this.app.get('port')}`)
    })
  }
}

export const server = new Server()

if (process.env.NODE_ENV !== 'test') {
  server.start()
}
