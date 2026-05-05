import { BudgetModel, TransactionModel, TRANSACTION } from '@soker90/finper-models'

const TIMEZONE = 'Europe/Madrid'

/** Current month expenses grouped by child category, with name */
export const aggregateCurrentMonthByCategory = (
  user: string,
  from: number,
  to: number
) => TransactionModel.aggregate([
  { $match: { user, date: { $gte: from, $lt: to }, type: TRANSACTION.Expense } },
  { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
  { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
  { $unwind: '$cat' },
  { $project: { _id: 0, categoryId: '$_id', name: '$cat.name', total: 1, count: 1 } }
])

/** Monthly average expense per child category over the given range */
export const aggregateLast3MonthsByCategory = (
  user: string,
  from: number,
  to: number
) => TransactionModel.aggregate([
  { $match: { user, date: { $gte: from, $lt: to }, type: TRANSACTION.Expense } },
  {
    $group: {
      _id: {
        category: '$category',
        year: { $year: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
        month: { $month: { date: { $toDate: '$date' }, timezone: TIMEZONE } }
      },
      total: { $sum: '$amount' }
    }
  },
  { $group: { _id: '$_id.category', avgMonthly: { $avg: '$total' } } },
  { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
  { $unwind: '$cat' },
  { $project: { _id: 0, categoryId: '$_id', name: '$cat.name', avgMonthly: 1 } }
])

/** Individual expense transactions grouped by month, used for outlier filtering */
export const aggregateLast3MonthsTransactions = (
  user: string,
  from: number,
  to: number
) => TransactionModel.aggregate([
  { $match: { user, date: { $gte: from, $lt: to }, type: TRANSACTION.Expense } },
  {
    $group: {
      _id: {
        year: { $year: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
        month: { $month: { date: { $toDate: '$date' }, timezone: TIMEZONE } }
      },
      transactions: { $push: '$amount' },
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }
  }
])

/** Current month budgets with category name */
export const aggregateCurrentBudgets = (
  user: string,
  year: number,
  month: number   // 1-indexed
) => BudgetModel.aggregate([
  { $match: { user, year, month } },
  { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
  { $unwind: '$cat' },
  { $project: { _id: 0, categoryId: '$category', name: '$cat.name', amount: 1 } }
])
