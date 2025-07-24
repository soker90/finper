import { IAccount, IStore, ITransaction, StoreModel } from '@soker90/finper-models'
import { ObjectId } from 'mongoose'

export interface IStoreService {
  getAndReplaceStore(transaction: ITransaction): Promise<ITransaction>

  getStores(user: string): Promise<IAccount[]>;

  replaceShopValue(transaction: { value: ITransaction }): Promise<any>
}

export default class StoreService implements IStoreService {
  public async getAndReplaceStore (transaction: ITransaction): Promise<ITransaction> {
    if (transaction.store) {
      const store = await StoreModel.findOneAndUpdate({
        name: transaction.store,
        user: transaction.user
      }, { name: transaction.store, user: transaction.user }, {
        new: true,
        upsert: true
      }) as unknown as IStore
      transaction.store = store._id as ObjectId
    }
    return transaction
  }

  public async replaceShopValue ({ value, ...rest }: { value: ITransaction }): Promise<any> {
    return {
      ...rest,
      value: await this.getAndReplaceStore(value)
    }
  }

  public async getStores (user: string): Promise<IAccount[]> {
    return StoreModel.find({ user }, '_id name')
  }
}
