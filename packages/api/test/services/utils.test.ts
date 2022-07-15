import { faker } from '@faker-js/faker'
import { ITransaction, TransactionType } from '@soker90/finper-models'
import { getTransactionAmount } from '../../src/services/utils'

describe('getTransactionsAmount', () => {
  test('should return the amount without the sign', () => {
    const transaction = {
      amount: faker.datatype.number(),
      type: TransactionType.Income
    } as ITransaction

    const result = getTransactionAmount(transaction)

    expect(result).toBe(transaction.amount)
  })
  test('should return the amount with minus sign', () => {
    const transaction = {
      amount: faker.datatype.number(),
      type: TransactionType.Expense
    } as ITransaction

    const result = getTransactionAmount(transaction)

    expect(result).toBe(-transaction.amount)
  })

  test('should return the amount equal to 0', () => {
    const transaction = {
      amount: faker.datatype.number(),
      type: TransactionType.NotComputable
    } as ITransaction

    const result = getTransactionAmount(transaction)

    expect(result).toBe(0)
  })
})
