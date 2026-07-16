import { roundMoney, TRANSACTION } from '@soker90/finper-db'
import type { YieldRow, YieldTransactionRow } from './yields.repository'

type Yield = { id: string, name?: string | null, type: string, accountId: string, categoryIds: string[], user: string }

export const serializeYield = (y: Yield) => ({
  _id: y.id,
  name: y.name || null,
  type: y.type,
  accountId: y.accountId,
  categoryIds: y.categoryIds
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

export const groupEntriesBySettlement = ({ type, entries, settlements }: { type: string, entries: YieldTransactionRow[], settlements: any[] }) => {
  const mapped = settlements.map((settlement) => {
    const settlementEntries = entries.filter((e) => e.yieldSettlementId === settlement.id)
    const income = settlementEntries.filter((e) => e.type === TRANSACTION.Income).reduce((sum, e) => sum + e.amount, 0)
    const expense = settlementEntries.filter((e) => e.type === TRANSACTION.Expense).reduce((sum, e) => sum + e.amount, 0)

    const incomeEntries = settlementEntries.filter((e) => e.type === TRANSACTION.Income)
    const settlementDate = incomeEntries.length > 0
      ? Math.max(...incomeEntries.map((e) => e.date))
      : null

    if (type === 'interest') {
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
        entries: settlementEntries.map(serializeYieldTransaction)
      }
    } else {
      const billsTotal = expense
      const cashbackAmount = income
      const percentage = (billsTotal > 0 && cashbackAmount > 0)
        ? roundMoney((cashbackAmount / billsTotal) * 100)
        : null
      const status = (billsTotal > 0 && cashbackAmount === 0) ? 'pending' : 'completed'

      return {
        id: settlement.id,
        settlementDate,
        billsTotal: roundMoney(billsTotal),
        cashbackAmount: roundMoney(cashbackAmount),
        percentage,
        status,
        entries: settlementEntries.map(serializeYieldTransaction)
      }
    }
  })

  // Sort: most recent settlementDate first; null (no income yet) goes last
  return mapped.sort((rowA, rowB) => {
    if (rowA.settlementDate === null && rowB.settlementDate === null) return 0
    if (rowA.settlementDate === null) return 1
    if (rowB.settlementDate === null) return -1
    return rowB.settlementDate - rowA.settlementDate
  })
}

export const serializeYieldSummary = (y: YieldRow, entries: YieldTransactionRow[], settlements: any[]) => {
  const paymentsCount = entries.filter((e) => e.type === TRANSACTION.Income).length

  const settlementRows = groupEntriesBySettlement({ type: y.type, entries, settlements })
  const netAccumulated = settlementRows.reduce((sum, row) => {
    if (y.type === 'interest') {
      return sum + (row.net ?? 0)
    } else {
      return sum + (row.cashbackAmount ?? 0)
    }
  }, 0)

  const defaultName = `${y.accountName ?? 'Cuenta'} - ${y.type === 'interest' ? 'Intereses' : 'Cashback'}`
  const name = y.name || defaultName

  return {
    _id: y.id,
    name,
    type: y.type,
    accountId: y.accountId,
    categoryIds: y.categoryIds,
    account: { _id: y.accountId, name: y.accountName, bank: y.accountBank },
    netAccumulated: roundMoney(netAccumulated),
    entriesCount: entries.length,
    paymentsCount
  }
}

export const serializeYieldDetail = (y: YieldRow, entries: YieldTransactionRow[], settlements: any[]) => {
  const summary = serializeYieldSummary(y, entries, settlements)
  const settlementRows = groupEntriesBySettlement({ type: y.type, entries, settlements })
  return {
    ...summary,
    entries: entries.map(serializeYieldTransaction),
    settlements: settlementRows
  }
}
