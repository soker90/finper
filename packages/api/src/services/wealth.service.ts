import { TransactionModel, TRANSACTION } from '@soker90/finper-models'
import { roundNumber } from '../utils/roundNumber'

export interface ProjectionPoint {
  year: number
  netWorth: number
  contributions: number
  interest: number
  fireTarget: number
  isFireReached: boolean
}

export interface FireProjectionParams {
  currentBalance: number
  monthlyContribution: number
  annualReturnRate: number
  withdrawalRate: number
  annualExpenses: number
  totalDebts: number
  totalLoansPending: number
  totalReceivable: number
  user: string
}

export interface FireProjectionResult {
  netWorth: number
  fireTarget: number
  yearsToFire: number | null
  projectionPoints: ProjectionPoint[]
}

export interface IWealthService {
  getFireProjection: (params: FireProjectionParams) => Promise<FireProjectionResult>
}

export default class WealthService implements IWealthService {
  private calculateNetWorth (params: Pick<FireProjectionParams, 'currentBalance' | 'totalDebts' | 'totalLoansPending' | 'totalReceivable'>): number {
    const { currentBalance, totalDebts, totalLoansPending, totalReceivable } = params
    return roundNumber(currentBalance - totalDebts - totalLoansPending + totalReceivable)
  }

  private async getAverageMonthlySavings (user: string): Promise<number> {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const last6MonthsStart = new Date(currentYear, currentMonth - 5, 1).getTime()

    const results = await TransactionModel.aggregate([
      {
        $match: {
          user,
          date: { $gte: last6MonthsStart },
          type: { $in: [TRANSACTION.Income, TRANSACTION.Expense] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: { date: { $toDate: '$date' } } },
            month: { $month: { date: { $toDate: '$date' } } }
          },
          income: {
            $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Income] }, '$amount', 0] }
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$type', TRANSACTION.Expense] }, '$amount', 0] }
          }
        }
      }
    ])

    if (results.length === 0) return 0

    const totalSavings = results.reduce((accumulator, monthData) => {
      return accumulator + (monthData.income - monthData.expenses)
    }, 0)

    return roundNumber(totalSavings / results.length)
  }

  private calculateFireProjection (params: {
    netWorth: number
    monthlyContribution: number
    annualReturnRate: number
    withdrawalRate: number
    annualExpenses: number
  }): { yearsToFire: number | null; projectionPoints: ProjectionPoint[] } {
    const { netWorth, monthlyContribution, annualReturnRate, withdrawalRate, annualExpenses } = params

    const withdrawalRateDecimal = withdrawalRate / 100
    const fireTarget = roundNumber(annualExpenses / withdrawalRateDecimal)
    const annualContribution = monthlyContribution * 12

    const MAX_YEARS = 40
    const EXTRA_YEARS_AFTER_FIRE = 5

    const projectionPoints: ProjectionPoint[] = []
    let yearsToFire: number | null = null
    let currentNetWorth = netWorth
    let totalContributions = 0
    let totalInterest = 0
    let extraYearsCount = 0

    const currentYear = new Date().getFullYear()

    for (let yearIndex = 1; yearIndex <= MAX_YEARS; yearIndex++) {
      const previousNetWorth = currentNetWorth
      const yearlyInterest = roundNumber(previousNetWorth * (annualReturnRate / 100))
      const yearlyContribution = annualContribution

      currentNetWorth = roundNumber(previousNetWorth + yearlyInterest + yearlyContribution)
      totalContributions = roundNumber(totalContributions + yearlyContribution)
      totalInterest = roundNumber(totalInterest + yearlyInterest)

      const isFireReached = currentNetWorth >= fireTarget

      if (isFireReached && yearsToFire === null) {
        yearsToFire = yearIndex
      }

      projectionPoints.push({
        year: currentYear + yearIndex,
        netWorth: currentNetWorth,
        contributions: totalContributions,
        interest: totalInterest,
        fireTarget,
        isFireReached
      })

      if (yearsToFire !== null) {
        extraYearsCount++
        if (extraYearsCount >= EXTRA_YEARS_AFTER_FIRE) break
      }
    }

    return { yearsToFire, projectionPoints }
  }

  async getFireProjection (params: FireProjectionParams): Promise<FireProjectionResult> {
    const {
      currentBalance,
      monthlyContribution,
      annualReturnRate,
      withdrawalRate,
      annualExpenses,
      totalDebts,
      totalLoansPending,
      totalReceivable,
      user
    } = params

    const netWorth = this.calculateNetWorth({ currentBalance, totalDebts, totalLoansPending, totalReceivable })
    const withdrawalRateDecimal = withdrawalRate / 100
    const fireTarget = roundNumber(annualExpenses / withdrawalRateDecimal)

    const resolvedMonthlyContribution = monthlyContribution !== 0
      ? monthlyContribution
      : await this.getAverageMonthlySavings(user)

    const { yearsToFire, projectionPoints } = this.calculateFireProjection({
      netWorth,
      monthlyContribution: resolvedMonthlyContribution,
      annualReturnRate,
      withdrawalRate,
      annualExpenses
    })

    return {
      netWorth,
      fireTarget,
      yearsToFire,
      projectionPoints
    }
  }
}
