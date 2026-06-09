import {
  isOutlier,
  filterMonthOutliers,
  computeFilteredAvgMonthlyExpense,
  type MonthTransactionsRow
} from '../cash-runway'

describe('cash-runway', () => {
  describe('isOutlier', () => {
    test('excluye outliers (>3x media por transaccion)', () => {
      // amount=400, monthTotal=1000, meanPerTransaction=100
      // 400 > 300 -> true
      expect(isOutlier(400, 1000, 100)).toBe(true)
      expect(isOutlier(100, 1000, 100)).toBe(false)
    })

    test('excluye outliers (>30% del total mensual)', () => {
      // amount=310, monthTotal=1000, meanPerTransaction=100
      // 310 > 300 -> true
      expect(isOutlier(310, 1000, 100)).toBe(true)
      expect(isOutlier(200, 1000, 100)).toBe(false)
    })
  })

  describe('filterMonthOutliers', () => {
    test('NO filtra meses con <5 transacciones', () => {
      const month: MonthTransactionsRow = {
        transactions: [400, 100, 100, 100], // 4 transacciones
        total: 700,
        count: 4
      }
      expect(filterMonthOutliers(month)).toBe(700)
    })

    test('sin outliers coincide con calculo esperado', () => {
      const month: MonthTransactionsRow = {
        transactions: [100, 100, 100, 100, 100],
        total: 500,
        count: 5
      }
      expect(filterMonthOutliers(month)).toBe(500)
    })

    test('filtra los outliers correctamente', () => {
      const month: MonthTransactionsRow = {
        // total = 1000, count = 5, mean = 200
        // >3x media (600) o >30% total (300) -> outlier > 300
        transactions: [400, 150, 150, 150, 150],
        total: 1000,
        count: 5
      }
      // 400 is outlier
      expect(filterMonthOutliers(month)).toBe(600)
    })
  })

  describe('computeFilteredAvgMonthlyExpense', () => {
    test('returns fallback when no valid monthly data', () => {
      expect(computeFilteredAvgMonthlyExpense([], 1000)).toBe(1000)
    })

    test('calculates average over filtered months', () => {
      const months: MonthTransactionsRow[] = [
        { transactions: [400, 150, 150, 150, 150], total: 1000, count: 5 }, // filtered to 600
        { transactions: [100, 100, 100, 100, 100], total: 500, count: 5 } // filtered to 500
      ]
      expect(computeFilteredAvgMonthlyExpense(months, 0)).toBe(550) // (600+500)/2
    })
  })
})
