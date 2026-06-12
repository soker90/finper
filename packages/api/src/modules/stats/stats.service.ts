import { roundMoney } from '@soker90/finper-db'
import { serializeStatsTransaction } from './stats.serializer'
import { TagSummary, TagHistoric, TagDetail, TagCategoryBreakdown } from './stats.types'

type IStatsRepository = ReturnType<typeof import('./stats.repository').createStatsRepository>

const NO_CATEGORY = 'Sin categoría'
const yearOf = (date: number): number => new Date(date).getUTCFullYear()
const yearRange = (year: number) => ({ from: Date.UTC(year, 0, 1), to: Date.UTC(year + 1, 0, 1) - 1 })

export class StatsService {
  constructor (private repository: IStatsRepository) {}

  public getAvailableTags (user: string): string[] {
    const tags = new Set<string>()
    for (const row of this.repository.findExpenses(user)) {
      for (const tag of row.tags ?? []) tags.add(tag)
    }
    return [...tags].sort()
  }

  public getAvailableYears (user: string): number[] {
    const years = new Set<number>()
    for (const row of this.repository.findExpenses(user)) {
      if (!row.tags || row.tags.length === 0) continue
      years.add(yearOf(row.date))
    }
    return [...years].sort((a, b) => b - a)
  }

  public getTagsSummary (user: string, year: number): TagSummary[] {
    const rows = this.repository.findExpenses(user, yearRange(year))

    const byTag = new Map<string, { totalAmount: number, transactionCount: number, categories: Map<string, TagCategoryBreakdown> }>()

    for (const row of rows) {
      if (!row.tags || row.tags.length === 0) continue
      for (const tag of row.tags) {
        let entry = byTag.get(tag)
        if (!entry) {
          entry = { totalAmount: 0, transactionCount: 0, categories: new Map() }
          byTag.set(tag, entry)
        }
        entry.totalAmount += row.amount
        entry.transactionCount += 1

        let cat = entry.categories.get(row.categoryId)
        if (!cat) {
          cat = { categoryId: row.categoryId, categoryName: row.categoryName ?? NO_CATEGORY, amount: 0, count: 0 }
          entry.categories.set(row.categoryId, cat)
        }
        cat.amount += row.amount
        cat.count += 1
      }
    }

    return [...byTag.entries()]
      .map(([tag, entry]) => ({
        tag,
        totalAmount: roundMoney(entry.totalAmount),
        transactionCount: entry.transactionCount,
        byCategory: [...entry.categories.values()].map(c => ({ ...c, amount: roundMoney(c.amount) }))
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
  }

  public getTagHistoric (user: string, tagName: string): TagHistoric {
    const byYear = new Map<number, { totalAmount: number, transactionCount: number }>()

    for (const row of this.repository.findExpenses(user)) {
      if (!row.tags?.includes(tagName)) continue
      const year = yearOf(row.date)
      let entry = byYear.get(year)
      if (!entry) {
        entry = { totalAmount: 0, transactionCount: 0 }
        byYear.set(year, entry)
      }
      entry.totalAmount += row.amount
      entry.transactionCount += 1
    }

    const years = [...byYear.entries()]
      .map(([year, e]) => ({ year, totalAmount: roundMoney(e.totalAmount), transactionCount: e.transactionCount }))
      .sort((a, b) => b.year - a.year)

    const totalAmount = roundMoney(years.reduce((sum, y) => sum + y.totalAmount, 0))
    return { tag: tagName, totalAmount, years }
  }

  public getTagDetail (user: string, tagName: string, year: number): TagDetail {
    const { from, to } = yearRange(year)
    const rows = this.repository.findExpenseDetails(user, from, to)
    const tagged = rows.filter(row => row.tags?.includes(tagName))

    const byCat = new Map<string, TagCategoryBreakdown>()
    for (const row of tagged) {
      let cat = byCat.get(row.categoryId)
      if (!cat) {
        cat = { categoryId: row.categoryId, categoryName: row.categoryName ?? NO_CATEGORY, amount: 0, count: 0 }
        byCat.set(row.categoryId, cat)
      }
      cat.amount += row.amount
      cat.count += 1
    }

    const byCategory = [...byCat.values()]
      .map(c => ({ ...c, amount: roundMoney(c.amount) }))
      .sort((a, b) => b.amount - a.amount)

    const totalAmount = roundMoney(byCategory.reduce((sum, c) => sum + c.amount, 0))

    return {
      tag: tagName,
      year,
      totalAmount,
      transactionCount: tagged.length,
      byCategory,
      transactions: tagged.map(serializeStatsTransaction)
    }
  }
}
