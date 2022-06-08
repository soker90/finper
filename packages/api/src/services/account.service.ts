import { AccountModel, IAccount } from '@soker90/finper-models'

interface IAccountUser extends IAccount {
    user: string
}

export interface IAccountService {
    addAccount(account: IAccount): Promise<IAccount>;

    editAccount({ id, account }: { id: string, value: IAccount }): Promise<IAccount>;

    deleteAccount(account: IAccount): Promise<IAccount>;

    getAccounts(user: string): Promise<IAccount[]>;

    getAccount(id: string): Promise<IAccount | null>;
}

export default class AccountService implements IAccountService {
  public async addAccount (account: IAccount): Promise<IAccount> {
    return AccountModel.create(account)
  }

  public async editAccount ({ id, value }: { id: string, value: IAccount }): Promise<IAccount> {
    return AccountModel.findByIdAndUpdate(id, value, { new: true }) as unknown as IAccount
  }

  public async deleteAccount (account: IAccount): Promise<any> {
    return AccountModel.updateOne({ _id: account._id }, { $set: { isActive: false } })
  }

  public async getAccounts (user: string): Promise<IAccount[]> {
    return AccountModel.find({ user, isActive: true }, '_id name bank balance')
  }

  public async getAccount (id: string): Promise<IAccount | null> {
    return AccountModel.findOne({ _id: id })
  }
}
