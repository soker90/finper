import { AccountModel, ITransaction, TransactionModel, TransactionDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { getTransactionAmount } from './utils'
import { roundNumber } from '../utils'
import SubscriptionCandidateService from './subscription-candidate.service'
import SubscriptionService from './subscription.service'
import { ERROR_MESSAGE } from '../i18n'

const subscriptionService = new SubscriptionService()
const subscriptionCandidateService = new SubscriptionCandidateService(subscriptionService)

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
    /* istanbul ignore next — account existence guaranteed by validator and transaction creation flow */
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
      subscriptionCandidateService.detectCandidates(transaction).catch(/* istanbul ignore next */() => {})

      return transaction
    })
  }

  public async editTransaction ({ id, value }: { id: string, value: ITransaction }): Promise<TransactionDocument> {
    const oldTransaction = await TransactionModel.findById<TransactionDocument>(id)
    /* istanbul ignore next — validator validateTransactionExist runs before this method via route */
    if (!oldTransaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
    const oldAmount = getTransactionAmount(oldTransaction)

    const transaction = await TransactionModel.findByIdAndUpdate<TransactionDocument>(id, value, { returnDocument: 'after' })
    /* istanbul ignore next — race condition only: document was found moments before */
    if (!transaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
    const newAmount = getTransactionAmount(transaction)

    const amount = newAmount - oldAmount
    await updateAcoountBalance(transaction.account.toString(), amount)

    return transaction
  }

  public async deleteTransaction (id: string): Promise<void> {
    const transaction = await TransactionModel.findByIdAndDelete<TransactionDocument>(id)
    /* istanbul ignore next — validator validateTransactionExist runs before this method via route */
    if (!transaction) throw Boom.notFound(ERROR_MESSAGE.TRANSACTION.NOT_FOUND).output
    const amount = getTransactionAmount(transaction)
    if (amount !== 0) {
      await updateAcoountBalance(transaction.account.toString(), -amount)
    }
    // If it was a subscription payment, recalculate the next payment date (fire-and-forget)
    if (transaction.subscriptionId) {
      subscriptionService.recalculateNextPaymentDate(transaction.subscriptionId.toString()).catch(/* istanbul ignore next */() => {})
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
    // startDate/endDate are intentionally blocked by the route validator — ignored for coverage
    /* istanbul ignore next */
    const dateFilter = (startDate || endDate)
      ? { date: { ...(startDate && { $gte: startDate }), ...(endDate && { $lte: endDate }) } }
      : {}

    const query = { ...dateFilter, ...params }

    return TransactionModel.find(query)
      .populate('category store', 'name')
      .populate('account', 'name bank')
      .sort({ date: -1 })
      .skip(page * limit).limit(limit)
  }
}
