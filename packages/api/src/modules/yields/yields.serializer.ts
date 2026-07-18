import { roundMoney, TRANSACTION } from '@soker90/finper-db'
import type { YieldRow, YieldTransactionRow, YieldSettlement } from './yields.repository'

type Yield = { id: string, type: string, accountId: string, categoryIds: string[], taxCategoryId?: string | null, user: string }

export const serializeYield = (y: Yield) => ({
  _id: y.id,
  type: y.type,
  accountId: y.accountId,
  categoryIds: y.categoryIds,
  taxCategoryId: y.taxCategoryId ?? null
})

export const serializeYieldTransaction = (row: YieldTransactionRow) => {
  const result: Record<string, any> = {
    _id: row.id,
    date: row.date,
    amount: row.amount,
    type: row.type,
    category: { _id: row.categoryId, name: row.categoryName }
  }
  if (row.note !== null) result.note = row.note
  return result
}

export interface SettlementRow {
  id: string
  settlementDate: number | null
  net: number
  entries: ReturnType<typeof serializeYieldTransaction>[]
  // interest-only
  grossIncome?: number
  taxExpense?: number
  tae?: number | null
  averageBalance?: number | null
  taeSource?: 'provided' | 'calculated' | null
  balanceSource?: 'provided' | 'calculated' | null
  warning?: 'no_income' | null
  // cashback-only
  billsTotal?: number
  cashbackAmount?: number
  percentage?: number | null
  status?: 'pending' | 'completed'
}

const buildInterestSettlementRow = ({ settlement, settlementEntries, income, expense, settlementDate }: {
  settlement: YieldSettlement
  settlementEntries: YieldTransactionRow[]
  income: number
  expense: number
  settlementDate: number | null
}): SettlementRow => {
  // Interest-only fallback: an all-expense settlement (e.g. only the withheld
  // tax linked so far) still needs a date to sort/group by.
  if (settlementDate === null && settlementEntries.length > 0) {
    settlementDate = Math.max(...settlementEntries.map((e) => e.date))
  }
  const net = income - expense

  let calculatedTae: number | null = null
  let calculatedBalance: number | null = null
  let taeSource: 'provided' | 'calculated' | null = null
  let balanceSource: 'provided' | 'calculated' | null = null

  const taeVal = settlement.tae
  const balanceVal = settlement.averageBalance

  if (taeVal !== undefined && taeVal !== null) {
    calculatedTae = taeVal
    taeSource = 'provided'
  }
  if (balanceVal !== undefined && balanceVal !== null) {
    calculatedBalance = balanceVal
    balanceSource = 'provided'
  }

  if (calculatedTae !== null && calculatedBalance === null) {
    if (calculatedTae !== 0) {
      const monthlyRate = Math.pow(1 + calculatedTae / 100, 1 / 12) - 1
      calculatedBalance = net / monthlyRate
      balanceSource = 'calculated'
    } else {
      calculatedBalance = null
      balanceSource = null
    }
  } else if (calculatedBalance !== null && calculatedTae === null) {
    if (calculatedBalance !== 0) {
      const monthlyRate = net / calculatedBalance
      if (1 + monthlyRate > 0) {
        calculatedTae = (Math.pow(1 + monthlyRate, 12) - 1) * 100
        taeSource = 'calculated'
      } else {
        calculatedTae = null
        taeSource = null
      }
    } else {
      calculatedTae = null
      taeSource = null
    }
  }

  return {
    id: settlement.id,
    settlementDate,
    grossIncome: roundMoney(income),
    taxExpense: roundMoney(expense),
    net: roundMoney(net),
    tae: calculatedTae !== null ? roundMoney(calculatedTae) : null,
    averageBalance: calculatedBalance !== null ? roundMoney(calculatedBalance) : null,
    taeSource,
    balanceSource,
    warning: income === 0 ? 'no_income' as const : null,
    entries: settlementEntries.map(serializeYieldTransaction)
  }
}

const buildCashbackSettlementRow = ({ settlement, settlementEntries, income, settlementDate, taxCategoryId }: {
  settlement: YieldSettlement
  settlementEntries: YieldTransactionRow[]
  income: number
  settlementDate: number | null
  taxCategoryId?: string | null
}): SettlementRow => {
  // The tax withheld on the cashback itself (if tracked via taxCategoryId) is
  // kept separate from the real receipts that generated it: only receipts
  // count towards billsTotal/percentage, while tax reduces the net like interest.
  const expenseEntries = settlementEntries.filter((e) => e.type === TRANSACTION.Expense)
  const taxExpense = taxCategoryId
    ? expenseEntries.filter((e) => e.categoryId === taxCategoryId).reduce((sum, e) => sum + e.amount, 0)
    : 0
  const billsTotal = expenseEntries.filter((e) => e.categoryId !== taxCategoryId).reduce((sum, e) => sum + e.amount, 0)
  const cashbackAmount = income
  const net = cashbackAmount - taxExpense
  const percentage = (billsTotal > 0 && cashbackAmount > 0)
    ? roundMoney((cashbackAmount / billsTotal) * 100)
    : null
  const status = (billsTotal > 0 && cashbackAmount === 0) ? 'pending' as const : 'completed' as const

  return {
    id: settlement.id,
    settlementDate,
    billsTotal: roundMoney(billsTotal),
    taxExpense: roundMoney(taxExpense),
    cashbackAmount: roundMoney(cashbackAmount),
    net: roundMoney(net),
    percentage,
    status,
    entries: settlementEntries.map(serializeYieldTransaction)
  }
}

export const groupEntriesBySettlement = ({ type, entries, settlements, taxCategoryId }: { type: string, entries: YieldTransactionRow[], settlements: YieldSettlement[], taxCategoryId?: string | null }): SettlementRow[] => {
  const mapped = settlements.map((settlement) => {
    const settlementEntries = entries.filter((e) => e.yieldSettlementId === settlement.id)
    const income = settlementEntries.filter((e) => e.type === TRANSACTION.Income).reduce((sum, e) => sum + e.amount, 0)
    const expense = settlementEntries.filter((e) => e.type === TRANSACTION.Expense).reduce((sum, e) => sum + e.amount, 0)

    const incomeEntries = settlementEntries.filter((e) => e.type === TRANSACTION.Income)
    const settlementDate = incomeEntries.length > 0
      ? Math.max(...incomeEntries.map((e) => e.date))
      : null

    return type === 'interest'
      ? buildInterestSettlementRow({ settlement, settlementEntries, income, expense, settlementDate })
      : buildCashbackSettlementRow({ settlement, settlementEntries, income, settlementDate, taxCategoryId })
  })

  // Sort: pending (settlementDate null) first, then most recent settlementDate first
  return mapped.sort((rowA, rowB) => {
    if (rowA.settlementDate === null && rowB.settlementDate === null) return 0
    if (rowA.settlementDate === null) return -1
    if (rowB.settlementDate === null) return 1
    return rowB.settlementDate - rowA.settlementDate
  })
}

const aggregateInterestYear = (rows: SettlementRow[]): { weightedTae: number | null } => {
  const validRows = rows.filter(
    (r): r is SettlementRow & { tae: number, averageBalance: number } =>
      r.tae !== null && r.tae !== undefined && r.averageBalance !== null && r.averageBalance !== undefined
  )
  if (validRows.length === 0) return { weightedTae: null }

  const totalBalance = validRows.reduce((sum, r) => sum + r.averageBalance, 0)
  if (totalBalance === 0) return { weightedTae: null }

  const weightedSum = validRows.reduce((sum, r) => sum + r.tae * r.averageBalance, 0)
  return { weightedTae: roundMoney(weightedSum / totalBalance) }
}

const aggregateCashbackYear = (billsTotal: number, cashbackAmount: number): { percentage: number | null } => {
  if (billsTotal > 0 && cashbackAmount > 0) {
    return { percentage: roundMoney((cashbackAmount / billsTotal) * 100) }
  }
  return { percentage: null }
}

export const serializeYieldSummary = (y: YieldRow, entries: YieldTransactionRow[], settlements: YieldSettlement[], settlementRows?: SettlementRow[]) => {
  const paymentsCount = entries.filter((e) => e.type === TRANSACTION.Income).length

  const rows = settlementRows ?? groupEntriesBySettlement({ type: y.type, entries, settlements, taxCategoryId: y.taxCategoryId })
  const netAccumulated = rows.reduce((sum, row) => sum + (row.net ?? 0), 0)

  // Pending settlements (no settlementDate yet) don't belong to a closed year:
  // counting them under the current calendar year would distort past years'
  // historical totals as time passes.
  const rowsByYear = new Map<number, SettlementRow[]>()
  for (const row of rows) {
    if (row.settlementDate === null) continue
    const year = new Date(row.settlementDate).getFullYear()
    const list = rowsByYear.get(year) ?? []
    list.push(row)
    rowsByYear.set(year, list)
  }

  const annualBreakdown = Array.from(rowsByYear.entries())
    .map(([year, yearRows]) => {
      const net = yearRows.reduce((sum, r) => sum + (r.net ?? 0), 0)
      const grossIncome = yearRows.reduce((sum, r) => sum + (r.grossIncome ?? 0), 0)
      const taxExpense = yearRows.reduce((sum, r) => sum + (r.taxExpense ?? 0), 0)
      const billsTotal = yearRows.reduce((sum, r) => sum + (r.billsTotal ?? 0), 0)
      const cashbackAmount = yearRows.reduce((sum, r) => sum + (r.cashbackAmount ?? 0), 0)
      const settlementsCount = yearRows.length

      const { weightedTae } = y.type === 'interest' ? aggregateInterestYear(yearRows) : { weightedTae: null }
      const { percentage } = y.type === 'cashback' ? aggregateCashbackYear(billsTotal, cashbackAmount) : { percentage: null }

      return {
        year,
        net: roundMoney(net),
        grossIncome: roundMoney(grossIncome),
        taxExpense: roundMoney(taxExpense),
        billsTotal: roundMoney(billsTotal),
        cashbackAmount: roundMoney(cashbackAmount),
        settlementsCount,
        weightedTae,
        percentage
      }
    })
    .sort((a, b) => b.year - a.year)

  return {
    _id: y.id,
    type: y.type,
    accountId: y.accountId,
    categoryIds: y.categoryIds,
    taxCategoryId: y.taxCategoryId ?? null,
    account: { _id: y.accountId, name: y.accountName, bank: y.accountBank },
    netAccumulated: roundMoney(netAccumulated),
    annualBreakdown,
    entriesCount: entries.length,
    paymentsCount
  }
}

export const serializeYieldDetail = (y: YieldRow, entries: YieldTransactionRow[], settlements: YieldSettlement[]) => {
  const settlementRows = groupEntriesBySettlement({ type: y.type, entries, settlements, taxCategoryId: y.taxCategoryId })
  const summary = serializeYieldSummary(y, entries, settlements, settlementRows)
  return {
    ...summary,
    entries: entries.map(serializeYieldTransaction),
    settlements: settlementRows
  }
}
