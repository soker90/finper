import { stocksRepository } from './stocks.repository'
import { IStockPriceProvider, YahooPriceProvider } from './stock-price.provider'
import { roundNumber } from '../../utils/roundNumber'
import { STOCK_TYPE } from './stocks.validators'
import { schema } from '@soker90/finper-db'

type StockRecord = typeof schema.stocks.$inferSelect
type StockInsert = Omit<typeof schema.stocks.$inferInsert, 'id'>

export interface StockPosition {
  ticker: string
  name: string
  shares: number
  dividendShares: number
  avgCost: number
  currentPrice: number | null
  totalCost: number
  currentValue: number | null
  gainLoss: number | null
  gainLossPct: number | null
  purchases: StockRecord[]
}

export interface StocksSummary {
  totalCost: number
  totalValue: number | null
}

export interface IStockService {
  getStocks(user: string): Promise<StockPosition[]>
  getStocksSummary(user: string): Promise<StocksSummary>
  addStock(stock: StockInsert): StockRecord
  deleteStock(id: string, user: string): void
}

interface TickerAccumulator {
  totalShares: number
  dividendShares: number
  totalCost: number
  purchases: StockRecord[]
}

export class StockService implements IStockService {
  constructor (
    private readonly priceProvider: IStockPriceProvider = new YahooPriceProvider(),
    private readonly repository = stocksRepository
  ) {}

  // ── Public ───────────────────────────────────────────────────────────────────

  public async getStocks (user: string): Promise<StockPosition[]> {
    const operations = this.repository.findAllByUser(user)
    const grouped = this.groupByTicker(operations)

    const positions = await Promise.all(
      [...grouped.entries()].map(([ticker, ops]) => this.buildPosition(ticker, ops))
    )

    return positions.filter((pos): pos is StockPosition => pos !== null)
  }

  public addStock (stock: StockInsert): StockRecord {
    return this.repository.create(stock)
  }

  public deleteStock (id: string, user: string): void {
    this.repository.delete(id, user)
  }

  public async getStocksSummary (user: string): Promise<StocksSummary> {
    const positions = await this.getStocks(user)
    const totalCost = roundNumber(positions.reduce((acc, p) => acc + p.totalCost, 0))
    const hasNullPrice = positions.some(p => p.currentValue === null)
    const totalValue = hasNullPrice
      ? null
      : roundNumber(positions.reduce((acc, p) => acc + (p.currentValue ?? 0), 0))
    return { totalCost, totalValue }
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private groupByTicker (operations: StockRecord[]): Map<string, StockRecord[]> {
    return operations.reduce((map, op) => {
      const tickerOps = map.get(op.ticker) ?? []
      tickerOps.push(op)
      map.set(op.ticker, tickerOps)
      return map
    }, new Map<string, StockRecord[]>())
  }

  private accumulateOperations (ops: StockRecord[]): TickerAccumulator {
    return ops.reduce<TickerAccumulator>(
      (acc, op) => {
        if (op.type === STOCK_TYPE.Buy || op.type === STOCK_TYPE.Dividend) {
          return {
            totalShares: acc.totalShares + op.shares,
            dividendShares: acc.dividendShares + (op.type === STOCK_TYPE.Dividend ? op.shares : 0),
            totalCost: acc.totalCost + op.shares * op.price,
            purchases: [...acc.purchases, op]
          }
        }

        // Sell: subtract shares and proportional cost (simplified weighted-average)
        const remainingShares = Math.max(acc.totalShares - op.shares, 0)
        const avgCost = acc.totalShares > 0 ? acc.totalCost / acc.totalShares : 0
        const remainingCost = remainingShares > 0 ? Math.max(acc.totalCost - op.shares * avgCost, 0) : 0

        return { totalShares: remainingShares, dividendShares: acc.dividendShares, totalCost: remainingCost, purchases: acc.purchases }
      },
      { totalShares: 0, dividendShares: 0, totalCost: 0, purchases: [] }
    )
  }

  /** Rounds shares to 6 decimal places (e.g. fractional shares) */
  private round4 (n: number): number {
    return Math.round((Math.abs(n) + Number.EPSILON) * 1000000) / 1000000
  }

  private async buildPosition (ticker: string, ops: StockRecord[]): Promise<StockPosition | null> {
    const { totalShares, dividendShares, totalCost, purchases } = this.accumulateOperations(ops)

    if (totalShares <= 0) return null

    const avgCost = totalCost / totalShares
    const currentPrice = await this.priceProvider.getPrice(ticker)
    const currentValue = currentPrice !== null ? currentPrice * totalShares : null
    const gainLoss = currentValue !== null ? currentValue - totalCost : null
    const gainLossPct = gainLoss !== null && totalCost > 0
      ? roundNumber((gainLoss / totalCost) * 100)
      : null

    return {
      ticker,
      name: ops[ops.length - 1].name,
      shares: this.round4(totalShares),
      dividendShares: this.round4(dividendShares),
      avgCost: roundNumber(avgCost),
      totalCost: roundNumber(totalCost),
      currentPrice,
      currentValue: currentValue !== null ? roundNumber(currentValue) : null,
      gainLoss: gainLoss !== null ? roundNumber(gainLoss) : null,
      gainLossPct,
      purchases
    }
  }
}

export const stockService = new StockService()
