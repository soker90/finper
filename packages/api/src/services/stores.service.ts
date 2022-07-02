import { IAccount, IStore, ITransaction, StoreModel } from '@soker90/finper-models'

export interface IStoreService {
    getAndReplaceStore(transaction: ITransaction): Promise<ITransaction>

    getStores(user: string): Promise<IAccount[]>;
}

export default class StoreService implements IStoreService {
  public async getAndReplaceStore (transaction: ITransaction): Promise<ITransaction> {
    if (transaction.store) {
      const store = await StoreModel.findOneAndUpdate({ name: transaction.store }, { name: transaction.store }, {
        new: true,
        upsert: true
      }) as unknown as IStore
      transaction.store = store._id
    }
    return transaction
  }

  public async getStores (user: string): Promise<IAccount[]> {
    return StoreModel.find({ user }, '_id name')
  }
}
