import { AccountModel, ITransaction, TransactionModel, TransactionDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { getTransactionAmount } from './utils'
import { roundNumber } from '../utils'
import SubscriptionCandidateService from './subscription-candidate.service'
import SubscriptionService from './subscription.service'
import { ERROR_MESSAGE } from '../i18n'

const subscriptionCandidateService = new SubscriptionCandidateService()
const subscriptionService = new SubscriptionService()

export interface ITransactionService {
  addTransaction(transaction: ITransaction): Promise<TransactionDocument>

  editTransaction({ id, value }: { id: string, value: ITransaction }): Promise<TransactionDocument>

  deleteTransaction(id: string): Promise<void>

  getTransactions(params: {
    user: string,
    account?: string,
    category?: string,
    startDate?: number,
    endDate?: number,
    type?: string,
    limit?: number,
    page?: number,
  }): Promise<TransactionDocument[]>
}

const updateAcoountBalance = async (account: string, amount: number) => {
  if (amount !== 0) {
    const accountModel = await AccountModel.findById(account)
    if (!accountModel) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
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

      // Fire-and-forget: detect if this transaction matches any pending subscription
      subscriptionCandidateService.detectCandidates(transaction).catch(() => {})

      return transaction
    })
  }

  public async editTransaction ({ id, value }: { id: string, value: ITransaction }): Promise<TransactionDocument> {
    const oldTransaction = await TransactionModel.findById<TransactionDocument>(id)
    if (!oldTransaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
    const oldAmount = getTransactionAmount(oldTransaction)

    const transaction = await TransactionModel.findByIdAndUpdate<TransactionDocument>(id, value, { new: true })
    if (!transaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
    const newAmount = getTransactionAmount(transaction)

    const amount = newAmount - oldAmount
    await updateAcoountBalance(transaction.account.toString(), amount)

    return transaction
  }

  public async deleteTransaction (id: string): Promise<void> {
    const transaction = await TransactionModel.findByIdAndDelete<TransactionDocument>(id)
    if (!transaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
    const amount = getTransactionAmount(transaction)
    if (amount !== 0) {
      await updateAcoountBalance(transaction.account.toString(), -amount)
    }
    // If it was a subscription payment, recalculate the next payment date (fire-and-forget)
    if (transaction.subscriptionId) {
      subscriptionService.recalculateNextPaymentDate(transaction.subscriptionId.toString()).catch(() => {})
    }
  }

  public async getTransactions ({ page = 0, limit = 50, startDate, endDate, ...params }: {
    user: string,
    account?: string,
    category?: string,
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
