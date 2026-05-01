import { AccountModel, IAccount, AccountDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

export interface IAccountService {
  addAccount(account: IAccount): Promise<AccountDocument>;

  editAccount({ id, value }: { id: string, value: IAccount }): Promise<AccountDocument>;

  deleteAccount(account: AccountDocument): Promise<void>;

  getAccounts(user: string): Promise<AccountDocument[]>;

  getAccount({ id }: { id: string }): Promise<AccountDocument | null>;

  transfer({ sourceId, destinationId, amount }: { sourceId: string, destinationId: string, amount: number }): Promise<void>;
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
}
