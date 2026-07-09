import { roundMoney, TRANSACTION } from '@soker90/finper-db'
import type { YieldRow, YieldTransactionRow } from './yields.repository'

type Yield = { id: string, name: string, type: string, accountId: string, categoryId: string, user: string }

export const serializeYield = (y: Yield) => ({
  _id: y.id,
  name: y.name,
  type: y.type,
  accountId: y.accountId,
  categoryId: y.categoryId
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

export const groupEntriesByMonth = (type: string, entries: YieldTransactionRow[]) => {
  const groups: Record<string, YieldTransactionRow[]> = {}
  for (const entry of entries) {
    const dateObj = new Date(entry.date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const key = `${year}-${month}`
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }

  const keys = Object.keys(groups).sort().reverse() // Newest first

  return keys.map((month) => {
    const monthEntries = groups[month]
    const income = monthEntries.filter((e) => e.type === TRANSACTION.Income).reduce((sum, e) => sum + e.amount, 0)
    const expense = monthEntries.filter((e) => e.type === TRANSACTION.Expense).reduce((sum, e) => sum + e.amount, 0)

    if (type === 'interest') {
      return {
        month,
        grossIncome: roundMoney(income),
        taxExpense: roundMoney(expense),
        net: roundMoney(income - expense),
        entries: monthEntries.map(serializeYieldTransaction)
      }
    } else {
      const percentage = expense > 0 ? roundMoney((income / expense) * 100) : null
      return {
        month,
        billsTotal: roundMoney(expense),
        cashbackAmount: roundMoney(income),
        percentage,
        entries: monthEntries.map(serializeYieldTransaction)
      }
    }
  })
}

export const serializeYieldSummary = (y: YieldRow, entries: YieldTransactionRow[]) => {
  const paymentsCount = entries.filter((e) => e.type === TRANSACTION.Income).length

  const monthlyRows = groupEntriesByMonth(y.type, entries)
  const netAccumulated = monthlyRows.reduce((sum, row) => {
    if (y.type === 'interest') {
      return sum + (row.net ?? 0)
    } else {
      return sum + (row.cashbackAmount ?? 0)
    }
  }, 0)

  return {
    _id: y.id,
    name: y.name,
    type: y.type,
    accountId: y.accountId,
    categoryId: y.categoryId,
    account: { _id: y.accountId, name: y.accountName, bank: y.accountBank },
    netAccumulated: roundMoney(netAccumulated),
    entriesCount: entries.length,
    paymentsCount
  }
}

export const serializeYieldDetail = (y: YieldRow, entries: YieldTransactionRow[]) => {
  const summary = serializeYieldSummary(y, entries)
  const monthlyRows = groupEntriesByMonth(y.type, entries)
  return {
    ...summary,
    entries: entries.map(serializeYieldTransaction),
    monthlyRows
  }
}
