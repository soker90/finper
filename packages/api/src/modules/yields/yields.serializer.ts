import { roundMoney, TRANSACTION } from '@soker90/finper-db'
import type { YieldRow, YieldTransactionRow } from './yields.repository'

type Yield = { id: string, name: string, type: string, accountId: string, user: string }

export const serializeYield = (y: Yield) => ({
  _id: y.id,
  name: y.name,
  type: y.type,
  accountId: y.accountId
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

/**
 * Calcula el neto acumulado a partir de los movimientos enlazados. El
 * significado de un movimiento de gasto enlazado depende del tipo de
 * rendimiento:
 *   - 'interest': es el impuesto retenido sobre el abono → se resta.
 *   - 'cashback' (y cualquier otro tipo futuro): es solo contexto (p. ej.
 *     el recibo que generó el cashback) → no se resta.
 */
export const calcNetAmount = (type: string, entries: YieldTransactionRow[]): number => {
  const income = entries.filter((e) => e.type === TRANSACTION.Income).reduce((total, e) => total + e.amount, 0)
  const expense = entries.filter((e) => e.type === TRANSACTION.Expense).reduce((total, e) => total + e.amount, 0)

  return roundMoney(type === 'interest' ? income - expense : income)
}

export const serializeYieldSummary = (y: YieldRow, entries: YieldTransactionRow[]) => {
  const paymentsCount = entries.filter((e) => e.type === TRANSACTION.Income).length

  return {
    _id: y.id,
    name: y.name,
    type: y.type,
    account: { _id: y.accountId, name: y.accountName, bank: y.accountBank },
    netAccumulated: calcNetAmount(y.type, entries),
    entriesCount: entries.length,
    paymentsCount
  }
}

export const serializeYieldDetail = (y: YieldRow, entries: YieldTransactionRow[]) => ({
  ...serializeYieldSummary(y, entries),
  entries: entries.map(serializeYieldTransaction)
})
