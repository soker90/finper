import { serializeYield, serializeYieldSummary, serializeYieldDetail, serializeYieldTransaction } from './yields.serializer'

type IYieldsRepository = ReturnType<typeof import('./yields.repository').createYieldsRepository>

export class YieldsService {
  constructor (private repository: IYieldsRepository) {}

  public getYields (user: string) {
    return this.repository.findByUser(user).map((y) => {
      const entries = this.repository.findTransactionsByYield(y.id, user)
      return serializeYieldSummary(y, entries)
    })
  }

  public getYield (id: string, user: string) {
    const y = this.repository.findByIdPopulated(id, user)
    if (!y) return null
    const entries = this.repository.findTransactionsByYield(id, user)
    return serializeYieldDetail(y, entries)
  }

  public addYield (params: { name: string, type: string, accountId: string, user: string }) {
    const created = this.repository.create(params)
    return serializeYield(created)
  }

  public editYield (id: string, value: any, user: string) {
    const updated = this.repository.update(id, user, value)
    return updated ? serializeYield(updated) : null
  }

  public deleteYield (id: string, user: string): void {
    this.repository.unlinkAllTransactions(id)
    this.repository.delete(id, user)
  }

  public getMatchingTransactions (id: string, user: string) {
    const y = this.repository.findByIdPopulated(id, user)
    if (!y) return []
    return this.repository.findMatchingTransactions(y.accountId, user).map(serializeYieldTransaction)
  }

  public linkTransactions (id: string, transactionIds: string[], user: string): void {
    this.repository.linkTransactions(id, transactionIds, user)
  }

  public unlinkTransaction (transactionId: string, user: string): void {
    this.repository.unlinkTransaction(transactionId, user)
  }
}
