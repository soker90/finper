import { spanishCompare } from '@soker90/finper-db'
import { serializeStore } from './stores.serializer'

type IStoresRepository = ReturnType<typeof import('./stores.repository').createStoresRepository>

export class StoresService {
  constructor (private repository: IStoresRepository) {}

  public getStores (user: string) {
    return this.repository.findByUser(user).map(serializeStore)
  }

  // Upsert "parásito": se invoca al crear/editar una transacción cuyo `store`
  // es un string (nombre). Búsqueda insensible a mayúsculas y tildes
  // (spanishCompare, sensitivity 'base'). Si existe, se reutiliza manteniendo
  // su name original; si no, se crea. Reemplaza transaction.store por el id.
  public getAndReplaceStore (transaction: any): any {
    if (transaction.store && typeof transaction.store === 'string') {
      const storeName = transaction.store
      const existing = this.repository.findByUser(transaction.user)
        .find(s => spanishCompare(s.name, storeName) === 0)
      const store = existing ?? this.repository.create({ name: storeName, user: transaction.user })
      transaction.store = store.id
    }
    return transaction
  }

  public replaceShopValue ({ value, ...rest }: { value: any }): any {
    return { ...rest, value: this.getAndReplaceStore(value) }
  }
}
