import { TRANSACTION } from '@soker90/finper-db'
import { getCategoryAccountingAmount } from '../category-accounting'

describe('getCategoryAccountingAmount', () => {
  it('counts expenses positively in expense categories', () => {
    expect(getCategoryAccountingAmount({
      categoryType: TRANSACTION.Expense,
      type: TRANSACTION.Expense,
      amount: 42.5
    })).toBe(42.5)
  })

  it('subtracts income refunds from expense categories', () => {
    expect(getCategoryAccountingAmount({
      categoryType: TRANSACTION.Expense,
      type: TRANSACTION.Income,
      amount: 12.5
    })).toBe(-12.5)
  })

  it('counts income positively in income categories', () => {
    expect(getCategoryAccountingAmount({
      categoryType: TRANSACTION.Income,
      type: TRANSACTION.Income,
      amount: 100
    })).toBe(100)
  })

  it('subtracts expense transactions from income categories', () => {
    expect(getCategoryAccountingAmount({
      categoryType: TRANSACTION.Income,
      type: TRANSACTION.Expense,
      amount: 20
    })).toBe(-20)
  })

  it('ignores non-computable transactions', () => {
    expect(getCategoryAccountingAmount({
      categoryType: TRANSACTION.Expense,
      type: TRANSACTION.NotComputable,
      amount: 100
    })).toBe(0)
  })

  it('ignores transactions without a recognized category type', () => {
    expect(getCategoryAccountingAmount({
      categoryType: null,
      type: TRANSACTION.Expense,
      amount: 100
    })).toBe(0)
  })
})
