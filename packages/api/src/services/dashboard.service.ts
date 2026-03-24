import { AccountModel, DebtModel, TransactionModel, TransactionType } from '@soker90/finper-models'

export interface DailyExpense {
  day: number
  amount: number
}

export interface MonthlyData {
  month: number   // 1-indexed
  year: number
  income: number
  expenses: number
}

export interface DashboardStatsResult {
  // Cuentas y deudas
  totalBalance: number
  totalDebts: number
  netWorth: number

  // Mes actual
  monthlyIncome: number
  monthlyExpenses: number
  savingsRate: number

  // Tendencia vs mes anterior
  monthlyTrend: {
    income: { current: number; previous: number }
    expenses: { current: number; previous: number }
  }

  // Últimos 6 meses (para la gráfica de barras)
  last6Months: MonthlyData[]

  // Velocidad de gasto (acumulado diario)
  expenseVelocity: {
    currentMonth: DailyExpense[]
    previousMonth: DailyExpense[]
  }

  // Medias y proyecciones
  dailyAvgExpense: number
  projectedMonthlyExpense: number
  cashRunwayMonths: number

  // Rankings del mes
  topExpenseCategories: Array<{ name: string; amount: number }>
  topStores: Array<{ name: string; amount: number }>
}

export interface IDashboardService {
  getStats(params: { user: string }): Promise<DashboardStatsResult>
}

const TIMEZONE = 'Europe/Madrid'

/** Construye el array de gasto acumulado diario a partir de un mapa día→importe */
const buildCumulativeDailyExpenses = (
  dailyMap: Map<number, number>,
  daysInMonth: number
): DailyExpense[] => {
  const result: DailyExpense[] = []
  let cumulative = 0
  for (let d = 1; d <= daysInMonth; d++) {
    cumulative += dailyMap.get(d) ?? 0
    result.push({ day: d, amount: Math.round(cumulative * 100) / 100 })
  }
  return result
}

export default class DashboardService implements IDashboardService {
  public async getStats ({ user }: { user: string }): Promise<DashboardStatsResult> {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()        // 0-indexed
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear

    // ── Fechas en epoch ms para los $match ──────────────────────────────────
    const currentMonthStart = new Date(currentYear, currentMonth, 1).getTime()
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 1).getTime()
    const previousMonthStart = new Date(previousYear, previousMonth, 1).getTime()
    const previousMonthEnd = new Date(currentYear, currentMonth, 1).getTime()
    const last6MonthsStart = new Date(currentYear, currentMonth - 5, 1).getTime()

    // ── Paralelo: balance de cuentas, suma de deudas, agregaciones de transacciones ──
    const [
      accountsResult,
      debtsResult,
      currentMonthAgg,
      previousMonthAgg,
      last6MonthsAgg,
      currentVelocityAgg,
      previousVelocityAgg,
      topCategoriesAgg,
      topStoresAgg
    ] = await Promise.all([
      // 1. Suma de saldos de cuentas activas
      AccountModel.aggregate([
        { $match: { user, isActive: true } },
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),

      // 2. Suma de deudas sin fecha de pago (pendientes)
      DebtModel.aggregate([
        { $match: { user, paymentDate: { $exists: false } } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: {
                  if: { $eq: ['$type', 'to'] },
                  then: '$amount',
                  else: 0
                }
              }
            }
          }
        }
      ]),

      // 3. Ingresos y gastos del mes actual
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: { $in: [TransactionType.Income, TransactionType.Expense] }
          }
        },
        {
          $group: {
            _id: null,
            income: {
              $sum: { $cond: [{ $eq: ['$type', TransactionType.Income] }, '$amount', 0] }
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', TransactionType.Expense] }, '$amount', 0] }
            }
          }
        }
      ]),

      // 4. Ingresos y gastos del mes anterior
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: previousMonthStart, $lt: previousMonthEnd },
            type: { $in: [TransactionType.Income, TransactionType.Expense] }
          }
        },
        {
          $group: {
            _id: null,
            income: {
              $sum: { $cond: [{ $eq: ['$type', TransactionType.Income] }, '$amount', 0] }
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', TransactionType.Expense] }, '$amount', 0] }
            }
          }
        }
      ]),

      // 5. Resumen mensual últimos 6 meses
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: last6MonthsStart },
            type: { $in: [TransactionType.Income, TransactionType.Expense] }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
              month: { $month: { date: { $toDate: '$date' }, timezone: TIMEZONE } }
            },
            income: {
              $sum: { $cond: [{ $eq: ['$type', TransactionType.Income] }, '$amount', 0] }
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', TransactionType.Expense] }, '$amount', 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
          $project: {
            _id: 0,
            year: '$_id.year',
            month: '$_id.month',
            income: 1,
            expenses: 1
          }
        }
      ]),

      // 6. Gasto diario acumulado mes actual
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: TransactionType.Expense
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 7. Gasto diario acumulado mes anterior
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: previousMonthStart, $lt: previousMonthEnd },
            type: TransactionType.Expense
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: { date: { $toDate: '$date' }, timezone: TIMEZONE } },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 8. Top 5 categorías de gasto del mes actual
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: TransactionType.Expense
          }
        },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { amount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryDoc'
          }
        },
        {
          $project: {
            _id: 0,
            name: { $ifNull: [{ $arrayElemAt: ['$categoryDoc.name', 0] }, 'Sin categoría'] },
            amount: 1
          }
        }
      ]),

      // 9. Top 5 tiendas de gasto del mes actual
      TransactionModel.aggregate([
        {
          $match: {
            user,
            date: { $gte: currentMonthStart, $lt: currentMonthEnd },
            type: TransactionType.Expense,
            store: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$store',
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { amount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'stores',
            localField: '_id',
            foreignField: '_id',
            as: 'storeDoc'
          }
        },
        {
          $project: {
            _id: 0,
            name: { $ifNull: [{ $arrayElemAt: ['$storeDoc.name', 0] }, 'Sin tienda'] },
            amount: 1
          }
        }
      ])
    ])

    // ── Extraer escalares ────────────────────────────────────────────────────
    const totalBalance = Math.round((accountsResult[0]?.total ?? 0) * 100) / 100
    const totalDebts = Math.round((debtsResult[0]?.total ?? 0) * 100) / 100
    const netWorth = Math.round((totalBalance - totalDebts) * 100) / 100

    const monthlyIncome = Math.round((currentMonthAgg[0]?.income ?? 0) * 100) / 100
    const monthlyExpenses = Math.round((currentMonthAgg[0]?.expenses ?? 0) * 100) / 100
    const prevIncome = Math.round((previousMonthAgg[0]?.income ?? 0) * 100) / 100
    const prevExpenses = Math.round((previousMonthAgg[0]?.expenses ?? 0) * 100) / 100

    const savingsRate = monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 10000) / 100
      : 0

    // ── Velocidad de gasto ───────────────────────────────────────────────────
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysInPreviousMonth = new Date(previousYear, previousMonth + 1, 0).getDate()

    const currentVelocityMap = new Map<number, number>(
      currentVelocityAgg.map((e: { _id: number; amount: number }) => [e._id, e.amount])
    )
    const previousVelocityMap = new Map<number, number>(
      previousVelocityAgg.map((e: { _id: number; amount: number }) => [e._id, e.amount])
    )

    const expenseVelocity = {
      currentMonth: buildCumulativeDailyExpenses(currentVelocityMap, daysInCurrentMonth),
      previousMonth: buildCumulativeDailyExpenses(previousVelocityMap, daysInPreviousMonth)
    }

    // ── Gasto diario medio y proyección ─────────────────────────────────────
    const dayOfMonth = now.getDate()
    const dailyAvgExpense = dayOfMonth > 0
      ? Math.round((monthlyExpenses / dayOfMonth) * 100) / 100
      : 0
    const projectedMonthlyExpense = Math.round(dailyAvgExpense * daysInCurrentMonth * 100) / 100

    // ── Colchón financiero: media de gastos de los últimos 3 meses con datos ─
    const last3Expenses = last6MonthsAgg
      .slice(-3)
      .map((m: MonthlyData) => m.expenses)
      .filter((e: number) => e > 0)

    const avgMonthlyExpense = last3Expenses.length > 0
      ? last3Expenses.reduce((s: number, e: number) => s + e, 0) / last3Expenses.length
      : monthlyExpenses

    const cashRunwayMonths = avgMonthlyExpense > 0
      ? Math.round((totalBalance / avgMonthlyExpense) * 10) / 10
      : 0

    // ── Top categorías: solo las que tienen importe neto positivo ────────────
    const topExpenseCategories = (topCategoriesAgg as Array<{ name: string; amount: number }>)
      .filter(c => c.amount > 0)

    // ── Top tiendas: solo las que tienen importe neto positivo ───────────────
    const topStores = (topStoresAgg as Array<{ name: string; amount: number }>)
      .filter(s => s.amount > 0)

    return {
      totalBalance,
      totalDebts,
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      monthlyTrend: {
        income: { current: monthlyIncome, previous: prevIncome },
        expenses: { current: monthlyExpenses, previous: prevExpenses }
      },
      last6Months: last6MonthsAgg,
      expenseVelocity,
      dailyAvgExpense,
      projectedMonthlyExpense,
      cashRunwayMonths,
      topExpenseCategories,
      topStores
    }
  }
}
