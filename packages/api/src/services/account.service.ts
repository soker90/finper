import { AccountModel, IAccount, AccountDocument } from '@soker90/finper-models'

export interface IAccountService {
  addAccount(account: IAccount): Promise<AccountDocument>;

  editAccount({ id, value }: { id: string, value: IAccount }): Promise<AccountDocument>;

  deleteAccount(account: AccountDocument): Promise<any>;

  getAccounts(user: string): Promise<AccountDocument[]>;

  getAccount({ id }: { id: string }): Promise<AccountDocument | null>;
}

export default class AccountService implements IAccountService {
  public async addAccount (account: IAccount): Promise<AccountDocument> {
    return AccountModel.create(account)
  }

  public async editAccount ({ id, value }: { id: string, value: IAccount }): Promise<AccountDocument> {
    return AccountModel.findByIdAndUpdate(id, value, { new: true }) as unknown as AccountDocument
  }

  public async deleteAccount (account: AccountDocument): Promise<any> {
    return AccountModel.updateOne({ _id: account._id }, { $set: { isActive: false } })
  }

  public async getAccounts (user: string): Promise<AccountDocument[]> {
    return AccountModel.find({ user, isActive: true }, '_id name bank balance')
  }

  public async getAccount ({ id }: { id: string }): Promise<AccountDocument | null> {
    return AccountModel.findOne({ _id: id }, '_id name bank balance')
  }
}
