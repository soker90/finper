import Boom from '@hapi/boom'
import { ERROR_MESSAGE } from '../../i18n'
import { isValidId } from '../../utils'
import { db as sqliteDb } from '../../db'
import type { IAccountsRepository } from './accounts.repository'
import { accountsRepository } from './accounts.repository'
import { schema } from '@soker90/finper-db'
import { eq, and, sql } from 'drizzle-orm'

export class AccountsService {
  constructor (private readonly repo: IAccountsRepository = accountsRepository) {}

  public async getAccounts (user: string): Promise<any[]> {
    return this.repo.findByUser(user)
  }

  public async getAccount ({ id, user }: { id: string, user: string }): Promise<any> {
    if (!isValidId(id)) {
      throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
    }
    const account = await this.repo.findById(id, user)
    if (!account) {
      throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
    }
    return account
  }

  public async addAccount (user: string, data: Record<string, any>): Promise<any> {
    return this.repo.create(user, data)
  }

  // Existencia validada en el validador (validateAccountEditParams); aquí se asume.
  public async editAccount ({ id, user, value }: { id: string, user: string, value: Record<string, any> }): Promise<any> {
    return this.repo.update(id, user, value)
  }

  public async transfer ({ sourceId, destinationId, amount, user }: { sourceId: string, destinationId: string, amount: number, user: string }): Promise<void> {
    if (!isValidId(sourceId) || !isValidId(destinationId)) {
      throw Boom.badRequest(ERROR_MESSAGE.COMMON.INVALID_ID).output
    }

    sqliteDb.transaction((tx) => {
      const { accounts } = schema

      const sourceAccount = tx.select().from(accounts).where(and(eq(accounts.id, sourceId), eq(accounts.user, user))).get()
      if (!sourceAccount) {
        throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
      }

      const destinationAccount = tx.select().from(accounts).where(and(eq(accounts.id, destinationId), eq(accounts.user, user))).get()
      if (!destinationAccount) {
        throw Boom.notFound(ERROR_MESSAGE.ACCOUNT.NOT_FOUND).output
      }

      if (sourceAccount.balance < amount) {
        throw Boom.badRequest('Insufficient balance').output
      }

      const balanceExpressionSource = sql`ROUND(${accounts.balance} + ${-amount}, 2)`
      tx.update(accounts).set({ balance: balanceExpressionSource }).where(eq(accounts.id, sourceId)).run()

      const balanceExpressionDest = sql`ROUND(${accounts.balance} + ${amount}, 2)`
      tx.update(accounts).set({ balance: balanceExpressionDest }).where(eq(accounts.id, destinationId)).run()
    })
  }
}

export const accountsService = new AccountsService()
