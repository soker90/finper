import { AccountModel, CategoryModel, TransactionModel, IAccount, AccountDocument, TRANSACTION } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

const ADJUST_CATEGORY_NAME = 'Ajuste de Descuadre'

export interface IAccountService {
  addAccount(account: IAccount): Promise<AccountDocument>;

  editAccount({ id, value }: { id: string, value: IAccount }): Promise<AccountDocument>;

  deleteAccount(account: AccountDocument): Promise<void>;

  getAccounts(user: string): Promise<AccountDocument[]>;

  getAccount({ id }: { id: string }): Promise<AccountDocument | null>;

  transfer({ sourceId, destinationId, amount }: { sourceId: string, destinationId: string, amount: number }): Promise<void>;

  adjustBalance({ id, realBalance, user }: { id: string, realBalance: number, user: string }): Promise<AccountDocument>;
}

export default class AccountService implements IAccountService {
  public async addAccount (account: IAccount): Promise<AccountDocument> {
    return AccountModel.create(account)
  }

  public async editAccount ({ id, value }: { id: string, value: IAccount }): Promise<AccountDocument> {
    const updated = await AccountModel.findByIdAndUpdate<AccountDocument>(id, value, { returnDocument: 'after' })
    /* istanbul ignore next — validator validateAccountExist runs before this method via route */
    if (!updated) throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
    return updated
  }

  /* istanbul ignore next — no route endpoint calls deleteAccount */
  public async deleteAccount (account: AccountDocument): Promise<void> {
    await AccountModel.updateOne({ _id: account._id }, { $set: { isActive: false } })
  }

  public async getAccounts (user: string): Promise<AccountDocument[]> {
    return AccountModel.find({ user, isActive: true }, '_id name bank balance')
  }

  public async getAccount ({ id }: { id: string }): Promise<AccountDocument | null> {
    return AccountModel.findOne({ _id: id }, '_id name bank balance')
  }

  public async transfer ({ sourceId, destinationId, amount }: { sourceId: string, destinationId: string, amount: number }): Promise<void> {
    const session = await AccountModel.startSession()
    session.startTransaction()

    try {
      const sourceAccount = await AccountModel.findById(sourceId).session(session)
      const destinationAccount = await AccountModel.findById(destinationId).session(session)

      /* istanbul ignore next — validator validateAccountExist runs before this method via route */
      if (!sourceAccount || !destinationAccount) {
        throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
      }

      sourceAccount.balance -= amount
      destinationAccount.balance += amount

      await sourceAccount.save({ session })
      await destinationAccount.save({ session })

      await session.commitTransaction()
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }

  public async adjustBalance ({ id, realBalance, user }: { id: string, realBalance: number, user: string }): Promise<AccountDocument> {
    const session = await AccountModel.startSession()
    session.startTransaction()

    try {
      const account = await AccountModel.findById(id).session(session)

      /* istanbul ignore next — validator validateAccountExist runs before this method via route */
      if (!account) {
        throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
      }

      const diff = Math.round((realBalance - account.balance) * 100) / 100

      if (diff !== 0) {
        // Get or create the system adjustment category for this user
        let adjustCategory = await CategoryModel.findOne({ user, isSystem: true, name: ADJUST_CATEGORY_NAME })
        if (!adjustCategory) {
          adjustCategory = await CategoryModel.create([{
            name: ADJUST_CATEGORY_NAME,
            type: diff > 0 ? TRANSACTION.Income : TRANSACTION.Expense,
            user,
            isSystem: true
          }], { session }).then(docs => docs[0])
        }

        await TransactionModel.create([{
          date: Date.now(),
          amount: Math.abs(diff),
          type: diff > 0 ? TRANSACTION.Income : TRANSACTION.Expense,
          category: adjustCategory!._id,
          account: account._id,
          user,
          note: `Ajuste de saldo: ${account.balance} → ${realBalance}`
        }], { session })

        account.balance = realBalance
        await account.save({ session })
      }

      await session.commitTransaction()
      return account
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      await session.endSession()
    }
  }
}
