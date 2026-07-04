import 'dotenv/config'
import express from 'express'
import type { Database as SqliteConnection } from 'better-sqlite3'

import cors from 'cors'
import compression from 'compression'
import helmet from 'helmet'

import config from './config'
import { db as sqliteDb } from './db'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'

import { MonitRoutes } from './modules/monit/monit.routes'
import handleError from './middlewares/handle-error'
import { usersRouter } from './modules/users/users.routes'
import { accountsRoutes } from './modules/accounts/accounts.routes'
import { budgetsRoutes } from './modules/budgets/budgets.routes'
import { categoriesRoutes } from './modules/categories/categories.routes'
import { dashboardRoutes } from './modules/dashboard/dashboard.routes'
import { debtsRouter } from './modules/debts/debts.routes'
import { PensionsRoutes } from './modules/pensions/pensions.routes'
import { transactionsRoutes } from './modules/transactions/transactions.routes'
import { storesRoutes } from './modules/stores/stores.routes'
import { TicketRoutes } from './modules/ticket/ticket.routes'
import { loansRoutes } from './modules/loans/loans.routes'
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes'
import { PropertyRoutes } from './modules/property/property.routes'
import { SupplyRoutes } from './modules/supply/supply.routes'
import { SupplyReadingRoutes } from './modules/supply-reading/supply-reading.routes'
import { stocksRouter } from './modules/stocks/stocks.routes'
import { goalsRouter } from './modules/goals/goals.routes'
import { statsRoutes } from './modules/stats/stats.routes'

interface WalCheckpointResult {
  busy: number
  log: number
  checkpointed: number
}

interface ShutdownOptions {
  reason: string
  // Skips waiting for the HTTP server to drain in-flight requests. Must be
  // used for uncaughtException/unhandledRejection, where the process state
  // may be corrupted and should not keep serving traffic.
  immediate?: boolean
}

const SHUTDOWN_TIMEOUT_MS = 8_000

/**
 * Consolidates the WAL journal into the main database file and closes the
 * SQLite connection. Extracted as a standalone function (instead of inline
 * inside Server.shutdown) so it can be unit tested by injecting a fake
 * better-sqlite3 client, without needing to simulate OS signals or spin up
 * an HTTP server.
 *
 * Returns the process exit code that should be used: 0 on success, 1 if the
 * checkpoint or the close itself failed.
 */
export function checkpointAndCloseDatabase (sqliteClient: SqliteConnection): number {
  if (!sqliteClient.open) {
    console.log('[finper-api] SQLite connection already closed, skipping checkpoint.')
    return 0
  }

  let exitCode = 0

  try {
    console.log('[finper-api] Consolidating WAL journal to database file...')
    const [{ busy, log, checkpointed }] = sqliteClient.pragma('wal_checkpoint(TRUNCATE)') as WalCheckpointResult[]

    if (busy) {
      console.warn(`[finper-api] WAL checkpoint could not fully complete (busy=${busy}, checkpointed=${checkpointed}/${log} pages).`)
    } else {
      console.log(`[finper-api] WAL journal consolidated successfully (${checkpointed}/${log} pages).`)
    }
  } catch (error) {
    console.error('[finper-api] Error during database checkpoint:', error)
    exitCode = 1
  } finally {
    try {
      sqliteClient.close()
      console.log('[finper-api] SQLite database closed.')
    } catch (error) {
      console.error('[finper-api] Error closing SQLite database:', error)
      exitCode = 1
    }
  }

  return exitCode
}

class Server {
  public app: express.Application
  public httpServer: import('node:http').Server | null = null
  private isShuttingDown = false

  constructor () {
    this.app = express()
    this.preMiddlewareConfig()
    this.routes()
    this.postMiddlewareConfig()
    this.sqlite()
  }

  public routes (): void {
    this.app.use('/api/monit', new MonitRoutes().router)
    this.app.use('/api/auth', usersRouter)
    this.app.use('/api/accounts', accountsRoutes)
    this.app.use('/api/budgets', budgetsRoutes)
    this.app.use('/api/dashboard', dashboardRoutes)
    this.app.use('/api/debts', debtsRouter)
    this.app.use('/api/categories', categoriesRoutes)
    this.app.use('/api/pensions', new PensionsRoutes().router)
    this.app.use('/api/transactions', transactionsRoutes)
    this.app.use('/api/stores', storesRoutes)
    this.app.use('/api/tickets', new TicketRoutes().router)
    this.app.use('/api/loans', loansRoutes)
    this.app.use('/api/subscriptions', subscriptionsRoutes)
    this.app.use('/api/supplies/properties', new PropertyRoutes().router)
    this.app.use('/api/supplies/readings', new SupplyReadingRoutes().router)
    this.app.use('/api/supplies', new SupplyRoutes().router)
    this.app.use('/api/stocks', stocksRouter)
    this.app.use('/api/goals', goalsRouter)
    this.app.use('/api/stats', statsRoutes)
  }

  public preMiddlewareConfig (): void {
    this.app.set('port', config.port)
    this.app.use(helmet())
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: false }))
    this.app.use(compression())

    const extraOrigins = process.env.CORS_EXTRA_ORIGINS
      ? process.env.CORS_EXTRA_ORIGINS.split(',').map((o) => o.trim())
      : []

    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true)
          if (extraOrigins.includes(origin)) return callback(null, true)
          const isAllowed = config.cors.allowedOrigins.some((pattern: RegExp) => pattern.test(origin))
          if (isAllowed) return callback(null, true)
          callback(new Error('Not allowed by CORS'))
        },
        credentials: true
      })
    )
  }

  public postMiddlewareConfig (): void {
    this.app.use(handleError)
  }

  private sqlite () {
    migrate(sqliteDb as any, {
      migrationsFolder: path.resolve(__dirname, '../../db/drizzle')
    })
    console.log('[finper-api] Drizzle SQLite migrations applied')
  }

  /* istanbul ignore next — start() is only called outside of test env */
  public start (): void {
    this.httpServer = this.app.listen(this.app.get('port'), () => {
      console.log(`API is running at http://localhost:${this.app.get('port')}`)
    })
  }

  /* istanbul ignore next — only invoked on SIGTERM/SIGINT/uncaught errors */
  public shutdown ({ reason, immediate = false }: ShutdownOptions): void {
    if (this.isShuttingDown) {
      console.log('[finper-api] Shutdown already in progress, ignoring duplicate trigger.')
      return
    }
    this.isShuttingDown = true

    console.log(`\n[finper-api] Received ${reason}, starting graceful shutdown...`)

    setTimeout(() => {
      console.error('[finper-api] Graceful shutdown timed out, forcing exit.')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS).unref()

    const closeDatabaseAndExit = () => {
      process.exit(checkpointAndCloseDatabase(sqliteDb.$client))
    }

    // Node.js explicitly warns against resuming normal operation after
    // 'uncaughtException'/'unhandledRejection': the process state may be
    // corrupted. In that case we skip waiting for in-flight HTTP requests to
    // finish (which would keep serving traffic on a potentially broken
    // state) and go straight to the SQLite checkpoint before exiting.
    if (immediate || !this.httpServer) {
      if (immediate) console.log('[finper-api] Fatal error detected, skipping graceful HTTP close.')
      closeDatabaseAndExit()
      return
    }

    console.log('[finper-api] Closing HTTP server...')
    // Drop idle keep-alive sockets immediately; in-flight requests are
    // still allowed to finish before the close() callback below fires.
    this.httpServer.closeIdleConnections()
    this.httpServer.close((closeError) => {
      if (closeError) console.error('[finper-api] Error closing HTTP server:', closeError)
      else console.log('[finper-api] HTTP server closed.')
      closeDatabaseAndExit()
    })
  }
}

export const server = new Server()

/* istanbul ignore next — server.start() and process-level handlers are skipped in test env */
if (process.env.NODE_ENV !== 'test') {
  server.start()

  process.on('SIGTERM', () => server.shutdown({ reason: 'SIGTERM' }))
  process.on('SIGINT', () => server.shutdown({ reason: 'SIGINT' }))

  process.on('uncaughtException', (error) => {
    console.error('[finper-api] Uncaught exception:', error)
    server.shutdown({ reason: 'uncaughtException', immediate: true })
  })

  process.on('unhandledRejection', (reason) => {
    console.error('[finper-api] Unhandled promise rejection:', reason)
    server.shutdown({ reason: 'unhandledRejection', immediate: true })
  })
}
