import { AccountModel, IAccount, AccountDocument } from '@soker90/finper-models'
import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../i18n'

export interface IAccountService {
  addAccount(account: IAccount): Promise<AccountDocument>;

  editAccount({ id, value }: { id: string, value: IAccount }): Promise<AccountDocument>;

  deleteAccount(account: AccountDocument): Promise<void>;

  getAccounts(user: string): Promise<AccountDocument[]>;

  getAccount({ id }: { id: string }): Promise<AccountDocument | null>;
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
}
