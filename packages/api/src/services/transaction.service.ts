import { HydratedDocument } from 'mongoose'
import { AccountModel, IAccount, ITransaction, TransactionModel } from '@soker90/finper-models'
import { getTransactionAmount } from './utils'
import { roundNumber } from '../utils'

export interface ITransactionService {
  addTransaction(transaction: ITransaction): Promise<HydratedDocument<ITransaction>>

  editTransaction({ id, value }: { id: string, value: ITransaction }): Promise<HydratedDocument<ITransaction>>

  deleteTransaction(id: string): Promise<void>

  getTransactions(params: {
    accountId?: string,
    categoryId?: string,
    startDate?: number,
    endDate?: number,
    type?: string,
    limit?: number,
    skip?: number,
  }): Promise<HydratedDocument<ITransaction>[]>
}

const updateAcoountBalance = async (account: string, amount: number) => {
  if (amount !== 0) {
    const accountModel = await AccountModel.findById(account) as IAccount // Problems with round...
    await AccountModel.updateOne({ _id: account }, {
      balance: roundNumber(accountModel.balance + amount)
    })
  }
}

export default class TransactionService implements ITransactionService {
  public async addTransaction (params: ITransaction): Promise<HydratedDocument<ITransaction>> {
    return TransactionModel.create(params).then(async transaction => {
      const amount = getTransactionAmount(transaction)
      await updateAcoountBalance(transaction.account.toString(), amount)

      return transaction
    })
  }

  public async editTransaction ({ id, value }: { id: string, value: ITransaction }): Promise<HydratedDocument<ITransaction>> {
    const oldTransaction = await TransactionModel.findById(id) as unknown as HydratedDocument<ITransaction>
    const oldAmount = getTransactionAmount(oldTransaction as any)

    const transaction = await TransactionModel.findByIdAndUpdate(id, value, { new: true }) as unknown as HydratedDocument<ITransaction>
    const newAmount = getTransactionAmount(transaction)

    const amount = newAmount - oldAmount
    await updateAcoountBalance(transaction.account.toString(), amount)

    return transaction
  }

  public async deleteTransaction (id: string): Promise<void> {
    const transaction = await TransactionModel.findByIdAndDelete(id) as unknown as HydratedDocument<ITransaction>
    const amount = getTransactionAmount(transaction as any)
    if (amount !== 0) {
      await updateAcoountBalance(transaction.account.toString(), -amount)
    }
  }

  public async getTransactions ({ page = 0, limit = 50, startDate, endDate, ...params }: {
    user: string,
    accountId?: string,
    categoryId?: string,
    startDate?: number,
    endDate?: number,
    type?: string,
    limit?: number,
    page?: number,
  }): Promise<HydratedDocument<ITransaction>[]> {
    const query = {
      ...((startDate || endDate) && {
        date: {
          ...(startDate && { $gte: startDate }),
          ...(endDate && { $lte: endDate })
        }
      }),
      ...params
    }

    return TransactionModel.find(query)
      .populate('category store', 'name')
      .populate('account', 'name bank')
      .sort({ date: -1 })
      .skip(page * limit).limit(limit)
  }
}
