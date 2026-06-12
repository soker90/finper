import { type DB, schema, generateId } from '@soker90/finper-db'
import { eq, and } from 'drizzle-orm'
import { db as sqliteDb } from '../../db'
import { roundNumber } from '../../utils'

const { accounts } = schema

export interface IAccountsRepository {
  findByUser(user: string): Promise<any[]>
  findById(id: string, user: string): Promise<any | undefined>
  create(user: string, data: Record<string, any>): Promise<any>
  update(id: string, user: string, data: Record<string, any>): Promise<any | undefined>
}

export class AccountsRepository implements IAccountsRepository {
  constructor (private readonly db: DB = sqliteDb) {}

  public async findByUser (user: string): Promise<any[]> {
    return this.db.select()
      .from(accounts)
      .where(and(eq(accounts.user, user), eq(accounts.isActive, true)))
      .all()
  }

  public async findById (id: string, user: string): Promise<any | undefined> {
    return this.db.select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.user, user)))
      .get()
  }

  public async create (user: string, data: Record<string, any>): Promise<any> {
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

  public async update (id: string, user: string, data: Record<string, any>): Promise<any | undefined> {
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
}

export const accountsRepository = new AccountsRepository()
