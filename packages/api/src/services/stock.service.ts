import { type IStock, StockModel, STOCK_TYPE } from '@soker90/finper-models'
import { IStockPriceProvider, YahooPriceProvider } from './stock-price.provider'
import { roundNumber } from '../utils/roundNumber'

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
  purchases: IStock[]
}

export interface IStockService {
  getStocks(user: string): Promise<StockPosition[]>
  addStock(stock: IStock): Promise<IStock>
  deleteStock(id: string, user: string): Promise<void>
}

interface TickerAccumulator {
  totalShares: number
  dividendShares: number
  totalCost: number
  purchases: IStock[]
}

export default class StockService implements IStockService {
  constructor (private readonly priceProvider: IStockPriceProvider = new YahooPriceProvider()) {}

  // ── Public ───────────────────────────────────────────────────────────────────

  public async getStocks (user: string): Promise<StockPosition[]> {
    const operations = await StockModel.find({ user }).sort({ date: 1 })
    const grouped = this.groupByTicker(operations)

    const positions = await Promise.all(
      [...grouped.entries()].map(([ticker, ops]) => this.buildPosition(ticker, ops))
    )

    return positions.filter((pos): pos is StockPosition => pos !== null)
  }

  public async addStock (stock: IStock): Promise<IStock> {
    return StockModel.create(stock)
  }

  public async deleteStock (id: string, user: string): Promise<void> {
    await StockModel.findOneAndDelete({ _id: id, user })
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private groupByTicker (operations: IStock[]): Map<string, IStock[]> {
    return operations.reduce((map, op) => {
      const tickerOps = map.get(op.ticker) ?? []
      tickerOps.push(op)
      map.set(op.ticker, tickerOps)
      return map
    }, new Map<string, IStock[]>())
  }

  private accumulateOperations (ops: IStock[]): TickerAccumulator {
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

  private async buildPosition (ticker: string, ops: IStock[]): Promise<StockPosition | null> {
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
