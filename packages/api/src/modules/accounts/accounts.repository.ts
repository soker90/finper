import { type DB, schema, generateId } from '@soker90/finper-db'
import { eq, and, sql } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { roundNumber } from '../../utils'

const { accounts } = schema

export interface IAccountsRepository {
  findByUser(user: string): Promise<any[]>
  findById(id: string, user: string): Promise<any | undefined>
  create(user: string, data: Record<string, any>): Promise<any>
  update(id: string, user: string, data: Record<string, any>): Promise<any | undefined>
  getTotalBalanceByUser(user: string): Promise<number>
  adjustBalance(accountId: string, amount: number, opts?: { round?: boolean }, db?: DB): Promise<any | undefined>
}

export class AccountsRepository implements IAccountsRepository {
  constructor(private readonly db: DB = sqliteDb) {}

  public async findByUser(user: string): Promise<any[]> {
    return this.db.select()
      .from(accounts)
      .where(and(eq(accounts.user, user), eq(accounts.isActive, true)))
      .all()
  }

  public async findById(id: string, user: string): Promise<any | undefined> {
    return this.db.select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.user, user)))
      .get()
  }

  public async create(user: string, data: Record<string, any>): Promise<any> {
    const id = generateId()
    const balance = data.balance !== undefined ? roundNumber(data.balance) : 0
    const newAccount = {
      id,
      user,
      name: data.name,
      bank: data.bank,
      balance,
      isActive: true
    }

    return this.db.insert(accounts)
      .values(newAccount)
      .returning()
      .get()
  }

  public async update(id: string, user: string, data: Record<string, any>): Promise<any | undefined> {
    const updateData: Record<string, any> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.bank !== undefined) updateData.bank = data.bank
    if (data.balance !== undefined) updateData.balance = roundNumber(data.balance)
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (Object.keys(updateData).length === 0) return this.findById(id, user)

    return this.db.update(accounts)
      .set(updateData)
      .where(and(eq(accounts.id, id), eq(accounts.user, user)))
      .returning()
      .get()
  }

  public async getTotalBalanceByUser(user: string): Promise<number> {
    const result = await this.db.select({ total: sql<number>`SUM(${accounts.balance})` })
      .from(accounts)
      .where(and(eq(accounts.user, user), eq(accounts.isActive, true)))
      .get()
    
    return result?.total ?? 0
  }

  public async adjustBalance(accountId: string, amount: number, opts: { round?: boolean } = { round: true }, tx?: DB): Promise<any | undefined> {
    const db = tx ?? this.db
    
    // SQLite ROUND function allows to specify precision
    const balanceExpression = opts.round !== false 
      ? sql`ROUND(${accounts.balance} + ${amount}, 2)`
      : sql`${accounts.balance} + ${amount}`

    return db.update(accounts)
      .set({ balance: balanceExpression })
      .where(eq(accounts.id, accountId))
      .returning()
      .get()
  }
}

export const accountsRepository = new AccountsRepository()
