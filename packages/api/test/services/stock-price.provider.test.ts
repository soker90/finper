import { YahooPriceProvider } from '../../src/services/stock-price.provider'
import config from '../../src/config'

// ── Mock yahoo-finance2 ───────────────────────────────────────────────────────
const mockQuote = jest.fn()
jest.mock('yahoo-finance2', () => {
  return jest.fn().mockImplementation(() => ({
    quote: mockQuote
  }))
})

describe('YahooPriceProvider', () => {
  let provider: YahooPriceProvider

  beforeEach(() => {
    provider = new YahooPriceProvider()
    mockQuote.mockReset()
  })

  describe('getPrice', () => {
    test('returns the regularMarketPrice from yahoo-finance2', async () => {
      mockQuote.mockResolvedValue({ regularMarketPrice: 12.34 })

      const price = await provider.getPrice('TEF.MC')

      expect(price).toBe(12.34)
      expect(mockQuote).toHaveBeenCalledTimes(1)
      expect(mockQuote).toHaveBeenCalledWith('TEF.MC')
    })

    test('returns null when regularMarketPrice is missing', async () => {
      mockQuote.mockResolvedValue({})

      const price = await provider.getPrice('UNKNOWN')

      expect(price).toBeNull()
    })

    test('returns null when yahoo-finance2 throws', async () => {
      mockQuote.mockRejectedValue(new Error('network error'))

      const price = await provider.getPrice('ERROR')

      expect(price).toBeNull()
    })

    test('returns cached price without calling yahoo-finance2 again', async () => {
      mockQuote.mockResolvedValue({ regularMarketPrice: 5.0 })

      await provider.getPrice('ITX.MC')
      const price = await provider.getPrice('ITX.MC')

      expect(price).toBe(5.0)
      expect(mockQuote).toHaveBeenCalledTimes(1)
    })

    test('fetches again after cache duration expires', async () => {
      mockQuote
        .mockResolvedValueOnce({ regularMarketPrice: 1.0 })
        .mockResolvedValueOnce({ regularMarketPrice: 2.0 })

      // Date.now() se llama en 2 momentos:
      //  [1] al guardar en caché dentro del primer getPrice → ts = 1000
      //  [2] al comprobar si expiró dentro del segundo getPrice → 1000 + duration + 1 → expirado
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // [1] guarda ts = 1000
        .mockReturnValueOnce(1000 + config.stocks.cacheDurationMs + 1) // [2] comprobación → expirado
        .mockReturnValue(2000) // [3+] guarda nuevo ts (y cualquier llamada posterior)

      await provider.getPrice('ACS.MC')
      const price = await provider.getPrice('ACS.MC')

      expect(price).toBe(2.0)
      expect(mockQuote).toHaveBeenCalledTimes(2)

      jest.restoreAllMocks()
    })

    test('does not cache a null price', async () => {
      mockQuote
        .mockResolvedValueOnce({}) // primera → null
        .mockResolvedValueOnce({ regularMarketPrice: 7.5 }) // segunda → precio real

      await provider.getPrice('SAN.MC')
      const price = await provider.getPrice('SAN.MC')

      expect(price).toBe(7.5)
      expect(mockQuote).toHaveBeenCalledTimes(2)
    })

    test('different tickers are cached independently', async () => {
      mockQuote
        .mockResolvedValueOnce({ regularMarketPrice: 10 })
        .mockResolvedValueOnce({ regularMarketPrice: 20 })

      const p1 = await provider.getPrice('A')
      const p2 = await provider.getPrice('B')

      expect(p1).toBe(10)
      expect(p2).toBe(20)
      expect(mockQuote).toHaveBeenCalledTimes(2)

      // Segundo acceso para ambos → debe usar caché
      await provider.getPrice('A')
      await provider.getPrice('B')
      expect(mockQuote).toHaveBeenCalledTimes(2)
    })
  })
})
