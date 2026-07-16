import { serializeYield, serializeYieldSummary, serializeYieldDetail, serializeYieldTransaction } from './yields.serializer'

type IYieldsRepository = ReturnType<typeof import('./yields.repository').createYieldsRepository>

export class YieldsService {
  constructor (private repository: IYieldsRepository) {}

  public getYields (user: string) {
    return this.repository.findByUser(user).map((y) => {
      const entries = this.repository.findTransactionsByYield(y.id, user)
      const settlements = this.repository.findSettlementsByYieldId(y.id, user)
      return serializeYieldSummary(y, entries, settlements)
    })
  }

  public getYield (id: string, user: string) {
    const y = this.repository.findByIdPopulated(id, user)
    if (!y) return null
    const entries = this.repository.findTransactionsByYield(id, user)
    const settlements = this.repository.findSettlementsByYieldId(id, user)
    return serializeYieldDetail(y, entries, settlements)
  }

  public addYield (params: { name?: string | null, type: string, accountId: string, categoryIds: string[], user: string }) {
    const created = this.repository.create(params)
    return serializeYield(created)
  }

  public editYield ({ id, value, user }: { id: string, value: any, user: string }) {
    const updated = this.repository.update(id, user, value)
    return updated ? serializeYield(updated) : null
  }

  public deleteYield (id: string, user: string): void {
    this.repository.unlinkAllTransactions(id)
    this.repository.deleteSettlementsByYield(id)
    this.repository.delete(id, user)
  }

  public getMatchingTransactions ({ id, user }: { id: string, user: string }) {
    const y = this.repository.findByIdPopulated(id, user)
    if (!y) return []
    return this.repository.findMatchingTransactions({
      accountId: y.accountId,
      categoryIds: y.categoryIds,
      user
    }).map(serializeYieldTransaction)
  }

  public linkTransactions ({ id, transactionIds, settlementId, tae, averageBalance, user }: { id: string, transactionIds: string[], settlementId?: string | null, tae?: number | null, averageBalance?: number | null, user: string }): void {
    let targetSettlementId = settlementId
    if (!targetSettlementId) {
      // Create a new settlement
      const settlement = this.repository.createSettlement({
        yieldId: id,
        user,
        tae: tae ?? null,
        averageBalance: averageBalance ?? null
      })
      targetSettlementId = settlement.id
    }
    this.repository.linkTransactions(id, targetSettlementId, transactionIds, user)
  }

  public unlinkTransaction (transactionId: string, user: string): void {
    const settlementId = this.repository.findTransactionSettlementId(transactionId, user)
    this.repository.unlinkTransaction(transactionId, user)
    if (settlementId) {
      const isEmpty = this.repository.isSettlementEmpty(settlementId)
      if (isEmpty) {
        this.repository.deleteSettlement(settlementId, user)
      }
    }
  }

  public editSettlement ({ settlementId, value, user }: { settlementId: string, value: { tae?: number | null, averageBalance?: number | null }, user: string }) {
    const updated = this.repository.updateSettlement(settlementId, user, {
      tae: value.tae !== undefined ? value.tae : undefined,
      averageBalance: value.averageBalance !== undefined ? value.averageBalance : undefined
    })
    return updated || null
  }
}
