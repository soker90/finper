import YahooFinance from 'yahoo-finance2'
import config from '../config'

interface PriceCache {
  price: number
  ts: number
}

export interface IStockPriceProvider {
  getPrice(ticker: string): Promise<number | null>
}

export class YahooPriceProvider implements IStockPriceProvider {
  private cache = new Map<string, PriceCache>()
  private yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

  public async getPrice (ticker: string): Promise<number | null> {
    const cached = this.cache.get(ticker)
    if (cached && Date.now() - cached.ts < config.stocks.cacheDurationMs) {
      return cached.price
    }

    try {
      const quote = await this.yahooFinance.quote(ticker)
      const price = (quote as any)?.regularMarketPrice ?? null
      if (price !== null) {
        this.cache.set(ticker, { price, ts: Date.now() })
      }
      return price
    } catch {
      return null
    }
  }
}
