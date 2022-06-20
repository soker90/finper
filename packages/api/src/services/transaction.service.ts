import { TransactionModel, ITransaction } from '@soker90/finper-models'

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

export default class TransactionService implements ITransactionService {
  public async addTransaction (params: ITransaction): Promise<ITransaction> {
    return TransactionModel.create(params)
  }

  public async editTransaction ({ id, value }: { id: string, value: ITransaction }): Promise<ITransaction> {
    return TransactionModel.findByIdAndUpdate(id, value, { new: true }) as unknown as ITransaction
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
      .populate('category account store', 'name')
      .sort({ date: -1 })
      .skip(page * limit).limit(limit)
  }
}
