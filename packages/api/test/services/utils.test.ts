import { faker } from '@faker-js/faker'
import { ITransaction } from '@soker90/finper-models'
import { TRANSACTION } from '@soker90/finper-db'
import { getTransactionAmount } from '../../src/services/utils'

describe('getTransactionsAmount', () => {
  test('should return the amount without the sign', () => {
    const transaction = {
      amount: faker.number.int(),
      type: TRANSACTION.Income
    } as ITransaction

    const result = getTransactionAmount(transaction)

    expect(result).toBe(transaction.amount)
  })
  test('should return the amount with minus sign', () => {
    const transaction = {
      amount: faker.number.int(),
      type: TRANSACTION.Expense
    } as ITransaction

    const result = getTransactionAmount(transaction)

    expect(result).toBe(-transaction.amount)
  })

  test('should return the amount equal to 0', () => {
    const transaction = {
      amount: faker.number.int(),
      type: TRANSACTION.NotComputable
    } as ITransaction

    const result = getTransactionAmount(transaction)

    expect(result).toBe(0)
  })
})
