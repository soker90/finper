import Boom from '@hapi/boom'
import { serializeYield, serializeYieldSummary, serializeYieldDetail, serializeYieldTransaction } from './yields.serializer'
import { ERROR_MESSAGE } from '../../i18n'

type IYieldsRepository = ReturnType<typeof import('./yields.repository').createYieldsRepository>

// SQLite reports the violated columns, not the index name (e.g. "UNIQUE
// constraint failed: yields.user, yields.account_id, yields.type"). Since
// create/update only ever write to the `yields` table, the error code alone
// is specific enough to identify this constraint.
const isDuplicateYieldError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE'

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

  public addYield (params: { type: string, accountId: string, categoryIds: string[], taxCategoryId?: string | null, user: string }) {
    try {
      const created = this.repository.create(params)
      return serializeYield(created)
    } catch (error) {
      // Defense in depth: the app-level duplicate check (assertNoDuplicateYield)
      // can race between two concurrent requests; the DB unique index is the
      // real guard, so its violation is translated to the same user-facing error.
      if (isDuplicateYieldError(error)) throw Boom.badData(ERROR_MESSAGE.YIELD.ALREADY_EXISTS).output
      throw error
    }
  }

  public editYield ({ id, value, user }: { id: string, value: Partial<{ type: string, accountId: string, categoryIds: string[], taxCategoryId: string | null }>, user: string }) {
    try {
      const updated = this.repository.update(id, user, value)
      return updated ? serializeYield(updated) : null
    } catch (error) {
      if (isDuplicateYieldError(error)) throw Boom.badData(ERROR_MESSAGE.YIELD.ALREADY_EXISTS).output
      throw error
    }
  }

  public deleteYield (id: string, user: string): void {
    this.repository.unlinkAllTransactions(id, user)
    this.repository.deleteSettlementsByYield(id, user)
    this.repository.delete(id, user)
  }

  public getMatchingTransactions ({ id, user, categoryId, dateFrom, dateTo }: { id: string, user: string, categoryId?: string, dateFrom?: number, dateTo?: number }) {
    const y = this.repository.findByIdPopulated(id, user)
    if (!y) return []
    // Ignore a categoryId outside this yield's own categories rather than erroring.
    const validCategoryId = categoryId && y.categoryIds.includes(categoryId) ? categoryId : undefined
    return this.repository.findMatchingTransactions({
      accountId: y.accountId,
      categoryIds: y.categoryIds,
      user,
      categoryId: validCategoryId,
      dateFrom,
      dateTo
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

  public unlinkTransaction ({ yieldId, transactionId, user }: { yieldId: string, transactionId: string, user: string }): void {
    const settlementId = this.repository.findTransactionSettlementId(transactionId, user)
    this.repository.unlinkTransaction(yieldId, transactionId, user)
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

  /** Unlinks every transaction in the settlement, then removes it. */
  public deleteSettlement ({ settlementId, user }: { settlementId: string, user: string }): void {
    this.repository.unlinkTransactionsBySettlement(settlementId, user)
    this.repository.deleteSettlement(settlementId, user)
  }
}
