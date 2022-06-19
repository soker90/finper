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

  public async getTransactions (params: {
        accountId?: string,
        categoryId?: string,
        startDate?: number,
        endDate?: number,
        type?: string,
        limit?: number,
        skip?: number,
    }): Promise<ITransaction[]> {
    return TransactionModel.find(params)
  }
}
