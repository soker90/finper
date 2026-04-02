import { HydratedDocument } from 'mongoose'
import { AccountModel, IAccount } from '@soker90/finper-models'

export interface IAccountService {
  addAccount(account: IAccount): Promise<HydratedDocument<IAccount>>;

  editAccount({ id, value }: { id: string, value: IAccount }): Promise<HydratedDocument<IAccount>>;

  deleteAccount(account: HydratedDocument<IAccount>): Promise<any>;

  getAccounts(user: string): Promise<HydratedDocument<IAccount>[]>;

  getAccount({ id }: { id: string }): Promise<HydratedDocument<IAccount> | null>;
}

export default class AccountService implements IAccountService {
  public async addAccount (account: IAccount): Promise<HydratedDocument<IAccount>> {
    return AccountModel.create(account)
  }

  public async editAccount ({ id, value }: { id: string, value: IAccount }): Promise<HydratedDocument<IAccount>> {
    return AccountModel.findByIdAndUpdate(id, value, { new: true }) as unknown as HydratedDocument<IAccount>
  }

  public async deleteAccount (account: HydratedDocument<IAccount>): Promise<any> {
    return AccountModel.updateOne({ _id: account._id }, { $set: { isActive: false } })
  }

  public async getAccounts (user: string): Promise<HydratedDocument<IAccount>[]> {
    return AccountModel.find({ user, isActive: true }, '_id name bank balance')
  }

  public async getAccount ({ id }: { id: string }): Promise<HydratedDocument<IAccount> | null> {
    return AccountModel.findOne({ _id: id }, '_id name bank balance')
  }
}
