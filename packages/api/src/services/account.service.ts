import { AccountModel, IAccount } from '@soker90/finper-models'

export interface IAccountService {
    addAccount(account: IAccount): Promise<IAccount>;

    editAccount(account: IAccount): Promise<IAccount>;

    deleteAccount(account: IAccount): Promise<IAccount>;

    getAccounts(username: string): Promise<IAccount[]>;

    getAccount(id: string): Promise<IAccount| null>;
}

export default class AccountService implements IAccountService {
  public async addAccount (account: IAccount): Promise<IAccount> {
    return AccountModel.create(account)
  }

  public async editAccount (account: IAccount): Promise<IAccount> {
    return AccountModel.findByIdAndUpdate(account._id, account, { new: true }) as any
  }

  public async deleteAccount (account: IAccount): Promise<any> {
    return AccountModel.updateOne({ _id: account._id }, { $set: { isActive: true } })
  }

  public async getAccounts (username: string): Promise<IAccount[]> {
    return AccountModel.find({ username })
  }

  public async getAccount (id: string): Promise<IAccount | null> {
    return AccountModel.findOne({ _id: id })
  }
}
