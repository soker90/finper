import { AccountModel, ITransaction, TransactionModel } from '@soker90/finper-models'
import { getTransactionAmount } from './utils'

export interface ITransactionService {
    addTransaction(transaction: ITransaction): Promise<ITransaction>

    editTransaction({ id, value }: { id: string, value: ITransaction }): Promise<ITransaction>

    deleteTransaction(id: string): Promise<void>

    getTransactions(params: {
        accountId?: string,
        categoryId?: string,
        startDate?: number,
        endDate?: number,
        type?: string,
        limit?: number,
        skip?: number,
    }): Promise<ITransaction[]>

}

const updateAcoountBalance = async (account: string, amount: number) => {
  if (amount !== 0) {
    await AccountModel.findByIdAndUpdate(account, {
      $inc: { balance: amount }
    })
  }
}

export default class TransactionService implements ITransactionService {
  public async addTransaction (params: ITransaction): Promise<ITransaction> {
    return TransactionModel.create(params).then(async transaction => {
      const amount = getTransactionAmount(transaction)
      await updateAcoountBalance(transaction.account.toString(), amount)

      return transaction
    })
  }

  public async editTransaction ({ id, value }: { id: string, value: ITransaction }): Promise<ITransaction> {
    const oldTransaction = await TransactionModel.findById(id) as unknown as ITransaction
    const oldAmount = getTransactionAmount(oldTransaction)

    const transaction = await TransactionModel.findByIdAndUpdate(id, value, { new: true }) as unknown as ITransaction
    const newAmount = getTransactionAmount(transaction)

    const amount = newAmount - oldAmount
    await updateAcoountBalance(transaction.account.toString(), amount)

    return transaction
  }

  public async deleteTransaction (id: string): Promise<void> {
    await TransactionModel.deleteOne({ _id: id })
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
    }): Promise<ITransaction[]> {
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
