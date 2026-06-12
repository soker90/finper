export interface MonthTransactionsRow {
  transactions: number[]
  total: number
  count: number
}

const OUTLIER_MULTIPLE = 3    // > 3x the mean transaction amount for the month → outlier
const OUTLIER_SHARE = 0.30    // > 30% of the month's total expense → outlier
const MIN_TRANSACTIONS_FOR_OUTLIER = 5  // skip outlier filtering for months with fewer transactions

/**
 * Returns true when a single transaction should be considered an outlier.
 * A transaction is an outlier if it exceeds 3x the monthly mean OR 30% of the monthly total.
 */
export const isOutlier = (
  amount: number,
  monthTotal: number,
  meanPerTransaction: number
): boolean =>
  amount > meanPerTransaction * OUTLIER_MULTIPLE ||
  amount > monthTotal * OUTLIER_SHARE

/**
 * Returns the sum of non-outlier transactions for a single month.
 * - Months with fewer than MIN_TRANSACTIONS_FOR_OUTLIER transactions are returned as-is
 *   to avoid the edge case where every transaction looks like an outlier.
 * - If filtering removes all transactions, falls back to the full total.
 */
export const filterMonthOutliers = (month: MonthTransactionsRow): number => {
  const { transactions, total, count } = month
  if (count === 0 || total === 0) return 0
  if (count < MIN_TRANSACTIONS_FOR_OUTLIER) return total

  const meanPerTransaction = total / count
  const filtered = transactions
    .filter(amount => !isOutlier(amount, total, meanPerTransaction))
    .reduce((sum, amount) => sum + amount, 0)

  // If every transaction was flagged as an outlier, fall back to the full total
  // to avoid a 0 average that would make the cash runway look infinite.
  return filtered > 0 ? filtered : total
}

/**
 * Computes the average monthly expense after removing outlier transactions.
 * Falls back to the provided value when there is no valid monthly data.
 */
export const computeFilteredAvgMonthlyExpense = (
  monthlyData: MonthTransactionsRow[],
  fallback: number
): number => {
  const filteredTotals = monthlyData
    .filter(m => m.count > 0 && m.total > 0)
    .map(filterMonthOutliers)

  return filteredTotals.length > 0
    ? filteredTotals.reduce((sum, t) => sum + t, 0) / filteredTotals.length
    : fallback
}
