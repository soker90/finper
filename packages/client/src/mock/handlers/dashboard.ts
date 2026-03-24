import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { DashboardStats } from 'hooks/useDashboardStats'

const now = new Date()

const last6Months = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1, // 1-indexed
    income: faker.number.float({ min: 1000, max: 3000, multipleOf: 0.01 }),
    expenses: faker.number.float({ min: 500, max: 2500, multipleOf: 0.01 })
  }
})

const currentMonth = last6Months[5]
const previousMonth = last6Months[4]

const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

const DASHBOARD_STATS_DATA: DashboardStats = {
  totalBalance: faker.number.float({ min: 5000, max: 50000, multipleOf: 0.01 }),
  totalDebts: faker.number.float({ min: 0, max: 5000, multipleOf: 0.01 }),
  netWorth: faker.number.float({ min: 1000, max: 45000, multipleOf: 0.01 }),
  monthlyIncome: currentMonth.income,
  monthlyExpenses: currentMonth.expenses,
  savingsRate: faker.number.float({ min: 0, max: 100, multipleOf: 0.01 }),
  topExpenseCategories: Array.from({ length: 5 }, () => ({
    name: faker.commerce.department(),
    amount: faker.number.float({ min: 50, max: 500, multipleOf: 0.01 })
  })),
  topStores: Array.from({ length: 5 }, () => ({
    name: faker.company.name(),
    amount: faker.number.float({ min: 30, max: 400, multipleOf: 0.01 })
  })),
  monthlyTrend: {
    income: { current: currentMonth.income, previous: previousMonth.income },
    expenses: { current: currentMonth.expenses, previous: previousMonth.expenses }
  },
  last6Months,
  dailyAvgExpense: faker.number.float({ min: 20, max: 100, multipleOf: 0.01 }),
  projectedMonthlyExpense: faker.number.float({ min: 600, max: 3000, multipleOf: 0.01 }),
  cashRunwayMonths: faker.number.float({ min: 1, max: 24, multipleOf: 0.1 }),
  expenseVelocity: {
    currentMonth: Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      amount: faker.number.float({ min: 0, max: 2000, multipleOf: 0.01 })
    })),
    previousMonth: Array.from({ length: new Date(now.getFullYear(), now.getMonth(), 0).getDate() }, (_, i) => ({
      day: i + 1,
      amount: faker.number.float({ min: 0, max: 2000, multipleOf: 0.01 })
    }))
  }
}

export const dashboardHandlers = [
  http.get('/dashboard/stats', () => {
    return HttpResponse.json(DASHBOARD_STATS_DATA)
  })
]
