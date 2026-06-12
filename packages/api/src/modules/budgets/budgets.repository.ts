import { eq, and, gte, lt, isNotNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { type DB, schema, generateId } from '@soker90/finper-db'

const { budgets, categories, transactions } = schema

export type BudgetRow = typeof budgets.$inferSelect

export interface ChildCategoryRow {
  id: string
  name: string
  type: string
  budgetRuleClass: string
  parentBudgetRuleClass: string | null
}

export interface BudgetItemRow {
  categoryId: string
  month: number
  amount: number
  year: number
}

export interface TxSumRow {
  date: number
  categoryId: string
  amount: number
}

export const createBudgetsRepository = (db: DB) => ({
  // Categorías hijas (con padre) del user + el budgetRuleClass del padre (self-join).
  findChildCategories: (user: string): ChildCategoryRow[] => {
    const parent = alias(categories, 'parent')
    return db.select({
      id: categories.id,
      name: categories.name,
      type: categories.type,
      budgetRuleClass: categories.budgetRuleClass,
      parentBudgetRuleClass: parent.budgetRuleClass
    })
      .from(categories)
      .leftJoin(parent, eq(categories.parentId, parent.id))
      .where(and(eq(categories.user, user), isNotNull(categories.parentId)))
      .all()
  },

  // Budgets del user para un año (y opcionalmente un mes).
  findBudgets: (user: string, year: number, month?: number): BudgetItemRow[] => {
    const conditions = [eq(budgets.user, user), eq(budgets.year, year)]
    if (month !== undefined && !isNaN(month)) conditions.push(eq(budgets.month, month))
    return db.select({
      categoryId: budgets.categoryId,
      month: budgets.month,
      amount: budgets.amount,
      year: budgets.year
    }).from(budgets).where(and(...conditions)).all()
  },

  // Transacciones en [from, to) del user (todas; el tipo se resuelve luego por categoría).
  findTransactionsInRange: (user: string, from: number, to: number): TxSumRow[] =>
    db.select({ date: transactions.date, categoryId: transactions.categoryId, amount: transactions.amount })
      .from(transactions)
      .where(and(eq(transactions.user, user), gte(transactions.date, from), lt(transactions.date, to)))
      .all(),

  findBudget: (categoryId: string, year: number, month: number, user: string): BudgetRow | undefined =>
    db.select().from(budgets)
      .where(and(
        eq(budgets.categoryId, categoryId), eq(budgets.year, year), eq(budgets.month, month), eq(budgets.user, user)
      )).get(),

  insertBudget: (data: { categoryId: string, year: number, month: number, amount: number, user: string }): BudgetRow =>
    db.insert(budgets).values({ ...data, id: generateId() }).returning().get(),

  updateBudgetAmount: (id: string, amount: number): BudgetRow =>
    db.update(budgets).set({ amount }).where(eq(budgets.id, id)).returning().get(),

  findBudgetsForCopy: (user: string, month: number, year: number): Array<{ categoryId: string, amount: number }> =>
    db.select({ categoryId: budgets.categoryId, amount: budgets.amount }).from(budgets)
      .where(and(eq(budgets.user, user), eq(budgets.month, month), eq(budgets.year, year)))
      .all()
})
