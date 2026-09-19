import { roundMoney } from '@soker90/finper-db'
import { serializeStatsTransaction } from './stats.serializer'
import { TagSummary, TagHistoric, TagDetail, TagCategoryBreakdown } from './stats.types'

type IStatsRepository = ReturnType<typeof import('./stats.repository').createStatsRepository>

const NO_CATEGORY = 'Sin categoría'
const yearOf = (date: number): number => new Date(date).getUTCFullYear()
const yearRange = (year: number) => ({ from: Date.UTC(year, 0, 1), to: Date.UTC(year + 1, 0, 1) - 1 })

interface CategoryAccumulator {
  categoryId: string
  categoryName: string
  amount: number
  countedIds: Set<string>
}

const toCategoryBreakdown = (categories: Map<string, CategoryAccumulator>): TagCategoryBreakdown[] =>
  Array.from(categories.values(), category => ({
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    amount: roundMoney(category.amount),
    count: category.countedIds.size
  })).toSorted((first, second) => second.amount - first.amount)

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
    return [...years].sort((firstYear, secondYear) => secondYear - firstYear)
  }

  public getTagsSummary (user: string, year: number): TagSummary[] {
    const rows = this.repository.findExpenses(user, yearRange(year))

    const byTag = new Map<string, { totalAmount: number, countedIds: Set<string>, categories: Map<string, CategoryAccumulator> }>()

    for (const row of rows) {
      if (!row.tags || row.tags.length === 0) continue
      for (const tag of row.tags) {
        let entry = byTag.get(tag)
        if (!entry) {
          entry = { totalAmount: 0, countedIds: new Set(), categories: new Map() }
          byTag.set(tag, entry)
        }
        entry.totalAmount += row.amount
        entry.countedIds.add(row.id)

        let categoryEntry = entry.categories.get(row.categoryId)
        if (!categoryEntry) {
          categoryEntry = { categoryId: row.categoryId, categoryName: row.categoryName ?? NO_CATEGORY, amount: 0, countedIds: new Set() }
          entry.categories.set(row.categoryId, categoryEntry)
        }
        categoryEntry.amount += row.amount
        categoryEntry.countedIds.add(row.id)
      }
    }

    return Array.from(byTag, ([tag, entry]) => ({
      tag,
      totalAmount: roundMoney(entry.totalAmount),
      transactionCount: entry.countedIds.size,
      byCategory: toCategoryBreakdown(entry.categories)
    })).toSorted((first, second) => second.totalAmount - first.totalAmount)
  }

  public getTagHistoric (user: string, tagName: string): TagHistoric {
    const byYear = new Map<number, { totalAmount: number, countedIds: Set<string> }>()

    for (const row of this.repository.findExpenses(user)) {
      if (!row.tags?.includes(tagName)) continue
      const year = yearOf(row.date)
      let entry = byYear.get(year)
      if (!entry) {
        entry = { totalAmount: 0, countedIds: new Set() }
        byYear.set(year, entry)
      }
      entry.totalAmount += row.amount
      entry.countedIds.add(row.id)
    }

    const years = [...byYear.entries()]
      .map(([year, entry]) => ({ year, totalAmount: roundMoney(entry.totalAmount), transactionCount: entry.countedIds.size }))
      .sort((firstItem, secondItem) => secondItem.year - firstItem.year)

    const totalAmount = roundMoney(years.reduce((sum, yearItem) => sum + yearItem.totalAmount, 0))
    return { tag: tagName, totalAmount, years }
  }

  public getTagDetail (user: string, tagName: string, year: number): TagDetail {
    const { from, to } = yearRange(year)
    const rows = this.repository.findExpenseDetails(user, from, to)
    const tagged = rows.filter(row => row.tags?.includes(tagName))

    const byCat = new Map<string, CategoryAccumulator>()
    for (const row of tagged) {
      let categoryEntry = byCat.get(row.categoryId)
      if (!categoryEntry) {
        categoryEntry = { categoryId: row.categoryId, categoryName: row.categoryName ?? NO_CATEGORY, amount: 0, countedIds: new Set() }
        byCat.set(row.categoryId, categoryEntry)
      }
      categoryEntry.amount += row.amount
      categoryEntry.countedIds.add(row.id)
    }

    const byCategory = toCategoryBreakdown(byCat)

    const totalAmount = roundMoney(byCategory.reduce((sum, categoryItem) => sum + categoryItem.amount, 0))

    return {
      tag: tagName,
      year,
      totalAmount,
      transactionCount: new Set(tagged.map(row => row.id)).size,
      byCategory,
      transactions: tagged.map(serializeStatsTransaction)
    }
  }
}
