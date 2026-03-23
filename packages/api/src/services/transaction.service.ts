import { AccountModel, IAccount, ITransaction, TransactionModel, TransactionType } from '@soker90/finper-models'
import { getTransactionAmount } from './utils'
import { roundNumber } from '../utils'

export interface MonthlySummary {
  year: number
  month: number
  income: number
  expenses: number
}

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

  getMonthlySummary(params: { user: string, months?: number }): Promise<MonthlySummary[]>
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
    const transaction = await TransactionModel.findByIdAndDelete(id) as unknown as ITransaction
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

  public async getMonthlySummary ({ user, months = 6 }: { user: string, months?: number }): Promise<MonthlySummary[]> {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).getTime()

    const results = await TransactionModel.aggregate([
      {
        $match: {
          user,
          date: { $gte: startDate },
          type: { $in: [TransactionType.Income, TransactionType.Expense] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: { date: { $toDate: '$date' }, timezone: 'Europe/Madrid' } },
            month: { $month: { date: { $toDate: '$date' }, timezone: 'Europe/Madrid' } }
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', TransactionType.Income] }, '$amount', 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', TransactionType.Expense] }, '$amount', 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          income: 1,
          expenses: 1
        }
      }
    ])

    return results
  }
}
