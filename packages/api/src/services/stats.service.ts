import { TransactionModel, TRANSACTION } from '@soker90/finper-models'
import { TagSummary, TagHistoric, TagDetail, TagYearSummary } from '../types/stats.types'
import { roundNumber } from '../utils/roundNumber'

export interface IStatsService {
  getAvailableTags(user: string): Promise<string[]>
  getAvailableYears(user: string): Promise<number[]>
  getTagsSummary(user: string, year: number): Promise<TagSummary[]>
  getTagHistoric(user: string, tagName: string): Promise<TagHistoric>
  getTagDetail(user: string, tagName: string, year: number): Promise<TagDetail>
}

export default class StatsService implements IStatsService {
  public async getAvailableTags (user: string): Promise<string[]> {
    const results = await TransactionModel.aggregate([
      { $match: { user, type: TRANSACTION.Expense, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, tag: '$_id' } }
    ])

    return results.map((r: { tag: string }) => r.tag)
  }

  public async getAvailableYears (user: string): Promise<number[]> {
    const results = await TransactionModel.aggregate([
      { $match: { user, type: TRANSACTION.Expense, tags: { $exists: true, $ne: [] } } },
      { $group: { _id: { $year: { $toDate: { $toLong: '$date' } } } } },
      { $sort: { _id: -1 } },
      { $project: { _id: 0, year: '$_id' } }
    ])

    return results.map((r: { year: number }) => r.year)
  }

  public async getTagsSummary (user: string, year: number): Promise<TagSummary[]> {
    const startOfYear = Date.UTC(year, 0, 1)
    const endOfYear = Date.UTC(year + 1, 0, 1) - 1

    const categoryBreakdown = await TransactionModel.aggregate([
      {
        $match: {
          user,
          type: TRANSACTION.Expense,
          tags: { $exists: true, $ne: [] },
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: { tag: '$tags', category: '$category' },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.category',
          foreignField: '_id',
          as: 'categoryDoc'
        }
      },
      { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$_id.tag',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: '$count' },
          byCategory: {
            $push: {
              categoryId: { $toString: '$_id.category' },
              categoryName: { $ifNull: ['$categoryDoc.name', 'Sin categoría'] },
              amount: { $round: ['$amount', 2] },
              count: '$count'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          totalAmount: { $round: ['$totalAmount', 2] },
          transactionCount: 1,
          byCategory: 1
        }
      },
      { $sort: { totalAmount: -1 } }
    ])

    return categoryBreakdown
  }

  public async getTagHistoric (user: string, tagName: string): Promise<TagHistoric> {
    const results = await TransactionModel.aggregate([
      {
        $match: {
          user,
          type: TRANSACTION.Expense,
          tags: tagName
        }
      },
      {
        $group: {
          _id: { $year: { $toDate: { $toLong: '$date' } } },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ])

    const years: TagYearSummary[] = results.map((r: any) => ({
      year: r._id,
      totalAmount: roundNumber(r.totalAmount),
      transactionCount: r.transactionCount
    }))

    const totalAmount = years.reduce((sum, y) => sum + y.totalAmount, 0)

    return {
      tag: tagName,
      totalAmount: roundNumber(totalAmount),
      years
    }
  }

  public async getTagDetail (user: string, tagName: string, year: number): Promise<TagDetail> {
    const startOfYear = Date.UTC(year, 0, 1)
    const endOfYear = Date.UTC(year + 1, 0, 1) - 1

    const [categoryResults, transactions] = await Promise.all([
      TransactionModel.aggregate([
        {
          $match: {
            user,
            type: TRANSACTION.Expense,
            tags: tagName,
            date: { $gte: startOfYear, $lte: endOfYear }
          }
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $project: {
            _id: 0,
            categoryId: { $toString: '$_id' },
            categoryName: '$category.name',
            amount: { $round: ['$amount', 2] },
            count: 1
          }
        },
        { $sort: { amount: -1 } }
      ]),
      TransactionModel.find({
        user,
        type: TRANSACTION.Expense,
        tags: tagName,
        date: { $gte: startOfYear, $lte: endOfYear }
      })
        .populate('category store', 'name')
        .populate('account', 'name bank')
        .sort({ date: -1 })
    ])

    const totalAmount = categoryResults.reduce((sum: number, c: any) => sum + c.amount, 0)
    const transactionCount = transactions.length

    return {
      tag: tagName,
      year,
      totalAmount: roundNumber(totalAmount),
      transactionCount,
      byCategory: categoryResults,
      transactions
    }
  }
}
