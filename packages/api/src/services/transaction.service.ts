import { AccountModel, IAccount, ITransaction, TransactionModel, TransactionDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { getTransactionAmount } from './utils'
import { roundNumber } from '../utils'

export interface ITransactionService {
  addTransaction(transaction: ITransaction): Promise<TransactionDocument>

  editTransaction({ id, value }: { id: string, value: ITransaction }): Promise<TransactionDocument>

  deleteTransaction(id: string): Promise<void>

  getTransactions(params: {
    user: string,
    accountId?: string,
    categoryId?: string,
    startDate?: number,
    endDate?: number,
    type?: string,
    limit?: number,
    page?: number,
  }): Promise<TransactionDocument[]>
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
  public async addTransaction (params: ITransaction): Promise<TransactionDocument> {
    return TransactionModel.create(params).then(async transaction => {
      const amount = getTransactionAmount(transaction)
      await updateAcoountBalance(transaction.account.toString(), amount)

      return transaction
    })
  }

  public async editTransaction ({ id, value }: { id: string, value: ITransaction }): Promise<TransactionDocument> {
    const oldTransaction = await TransactionModel.findById<TransactionDocument>(id)
    if (!oldTransaction) throw Boom.notFound('Transaction not found').output
    const oldAmount = getTransactionAmount(oldTransaction)

    const transaction = await TransactionModel.findByIdAndUpdate<TransactionDocument>(id, value, { new: true })
    if (!transaction) throw Boom.notFound('Transaction not found').output
    const newAmount = getTransactionAmount(transaction)

    const amount = newAmount - oldAmount
    await updateAcoountBalance(transaction.account.toString(), amount)

    return transaction
  }

  public async deleteTransaction (id: string): Promise<void> {
    const transaction = await TransactionModel.findByIdAndDelete<TransactionDocument>(id)
    if (!transaction) throw Boom.notFound('Transaction not found').output
    const amount = getTransactionAmount(transaction)
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
  }): Promise<TransactionDocument[]> {
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
