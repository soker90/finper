import 'dotenv/config'
import express from 'express'

import cors from 'cors'
import compression from 'compression'

import db from './config/db'
import config from './config'
import { db as sqliteDb } from './db'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'

import { MonitRoutes } from './routes/monit.routes'
import handleError from './middlewares/handle-error'
import { AuthRoutes } from './routes/auth.routes'
import { AccountRoutes } from './routes/account.routes'
import { BudgetRoutes } from './routes/budget.routes'
import { CategoryRoutes } from './routes/category.routes'
import { DashboardRoutes } from './routes/dashboard.routes'
import { debtsRouter } from './modules/debts/debts.routes'
import { PensionRoutes } from './routes/pension.routes'
import { TransactionRoutes } from './routes/transaction.routes'
import { StoreRoutes } from './routes/store.routes'
import { TicketRoutes } from './routes/ticket.routes'
import { LoanRoutes } from './routes/loan.routes'
import { SubscriptionRoutes } from './routes/subscription.routes'
import { PropertyRoutes } from './routes/property.routes'
import { SupplyRoutes } from './routes/supply.routes'
import { SupplyReadingRoutes } from './routes/supply-reading.routes'
import { stocksRouter } from './modules/stocks/stocks.routes'
import { goalsRouter } from './modules/goals/goals.routes'
import { StatsRoutes } from './routes/stats.routes'

class Server {
  public app: express.Application

  constructor () {
    this.app = express()
    this.preMiddlewareConfig()
    this.routes()
    this.postMiddlewareConfig()
    this.mongo()
    this.sqlite()
  }

  public routes (): void {
    this.app.use('/api/monit', new MonitRoutes().router)
    this.app.use('/api/auth', new AuthRoutes().router)
    this.app.use('/api/accounts', new AccountRoutes().router)
    this.app.use('/api/budgets', new BudgetRoutes().router)
    this.app.use('/api/dashboard', new DashboardRoutes().router)
    this.app.use('/api/debts', debtsRouter)
    this.app.use('/api/categories', new CategoryRoutes().router)
    this.app.use('/api/pensions', new PensionRoutes().router)
    this.app.use('/api/transactions', new TransactionRoutes().router)
    this.app.use('/api/stores', new StoreRoutes().router)
    this.app.use('/api/tickets', new TicketRoutes().router)
    this.app.use('/api/loans', new LoanRoutes().router)
    this.app.use('/api/subscriptions', new SubscriptionRoutes().router)
    this.app.use('/api/supplies/properties', new PropertyRoutes().router)
    this.app.use('/api/supplies/readings', new SupplyReadingRoutes().router)
    this.app.use('/api/supplies', new SupplyRoutes().router)
    this.app.use('/api/stocks', stocksRouter)
    this.app.use('/api/goals', goalsRouter)
    this.app.use('/api/stats', new StatsRoutes().router)
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

  private sqlite () {
    migrate(sqliteDb as any, {
      migrationsFolder: path.resolve(__dirname, '../../db/drizzle')
    })
    console.log('[finper-api] Drizzle SQLite migrations applied')
  }

  /* istanbul ignore next — start() is only called outside of test env */
  public start (): void {
    this.app.listen(this.app.get('port'), () => {
      console.log(`API is running at http://localhost:${this.app.get('port')}`)
    })
  }
}

export const server = new Server()

/* istanbul ignore next — server.start() is skipped in test env */
if (process.env.NODE_ENV !== 'test') {
  server.start()
}
