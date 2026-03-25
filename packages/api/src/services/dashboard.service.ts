import { AccountModel, DebtModel, PensionModel, TransactionModel, TransactionType, type IPension } from '@soker90/finper-models'

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

export interface HealthScore {
  total: number
  savingsRate: number
  debtRatio: number
  budgetAdherence: number
  cashRunway: number
  pensionReturn: number
}

export interface PensionSummary {
  employeeAmount: number
  companyAmount: number
  total: number
  transactions: IPension[]
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

  // Pensión
  pension: PensionSummary | null
  pensionReturnPct: number

  // Presupuesto del mes
  budgetAdherencePct: number

  // Health Score
  healthScore: HealthScore
}

export interface IDashboardService {
  getStats(params: { user: string }): Promise<DashboardStatsResult>
}

// ── Health Score ─────────────────────────────────────────────────────────────
/**
 * Calcula el health score financiero a partir de 5 sub-scores ponderados.
 *
 * Pesos: savingsRate 25%, debtRatio 20%, budgetAdherence 20%,
 *        cashRunway 20%, pensionReturn 15%.
 */
export const computeHealthScore = (
  savingsRate: number,        // e.g. 15 → 15%
  totalDebts: number,         // valor absoluto en moneda
  totalBalance: number,       // valor absoluto en moneda
  budgetAdherencePct: number, // 0–100
  cashRunwayMonths: number,   // número de meses
  pensionReturnPct: number    // e.g. 4.5 → 4.5%
): HealthScore => {
  const clamp = (v: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, v))

  const savingsScore = Math.round(clamp(savingsRate / 20, 0, 1) * 100)
  const debtScore = Math.round(Math.max(0, 1 - (totalBalance > 0 ? totalDebts / totalBalance : 1)) * 100)
  const budgetScore = Math.round(Math.min(budgetAdherencePct, 100))
  const runwayScore = Math.round(Math.min(cashRunwayMonths / 6, 1) * 100)
  const pensionScore = Math.round(clamp(pensionReturnPct / 5, 0, 1) * 100)

  const total = Math.round(
    savingsScore * 0.25 +
    debtScore * 0.20 +
    budgetScore * 0.20 +
    runwayScore * 0.20 +
    pensionScore * 0.15
  )

  return {
    total,
    savingsRate: savingsScore,
    debtRatio: debtScore,
    budgetAdherence: budgetScore,
    cashRunway: runwayScore,
    pensionReturn: pensionScore
  }
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

    // ── Paralelo: balance de cuentas, suma de deudas, agregaciones de transacciones,
    //             pensión y presupuesto del mes actual ──────────────────────────
    const [
      accountsResult,
      debtsResult,
      currentMonthAgg,
      previousMonthAgg,
      last6MonthsAgg,
      currentVelocityAgg,
      previousVelocityAgg,
      topCategoriesAgg,
      topStoresAgg,
      pensionStatsAgg,
      pensionTransactions,
      currentMonthBudgetAgg
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
            totalOwed: {
              $sum: {
                $cond: {
                  if: { $eq: ['$type', 'to'] },
                  then: '$amount',
                  else: 0
                }
              }
            },
            totalReceivable: {
              $sum: {
                $cond: {
                  if: { $eq: ['$type', 'from'] },
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

      // 8. Categorías de gasto del mes actual (todas, ordenadas por importe)
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

      // 9. Tiendas de gasto del mes actual (todas, ordenadas por importe)
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
      ]),

      // 10. Pensión: totales acumulados
      PensionModel.aggregate([
        { $match: { user } },
        {
          $group: {
            _id: '$user',
            employeeAmount: { $sum: '$employeeAmount' },
            companyAmount: { $sum: '$companyAmount' },
            totalUnits: { $sum: { $sum: ['$employeeUnits', '$companyUnits'] } },
            lastValue: { $last: '$value' }
          }
        }
      ]).sort({ date: -1 }),

      // 11. Pensión: registros individuales (para sparkline)
      PensionModel.find({ user }).sort({ date: -1 }),

      // 12. Presupuesto de gastos del mes actual (totales)
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
            _id: null,
            realExpenses: { $sum: '$amount' }
          }
        }
      ])
    ])

    // ── Extraer escalares ────────────────────────────────────────────────────
    const totalBalance = Math.round((accountsResult[0]?.total ?? 0) * 100) / 100
    const totalDebts = Math.round((debtsResult[0]?.totalOwed ?? 0) * 100) / 100
    const totalReceivable = Math.round((debtsResult[0]?.totalReceivable ?? 0) * 100) / 100
    const netWorth = Math.round((totalBalance - totalDebts + totalReceivable) * 100) / 100

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

    // ── Pensión ──────────────────────────────────────────────────────────────
    let pension: PensionSummary | null = null
    let pensionReturnPct = 0

    if (pensionStatsAgg.length > 0) {
      const ps = pensionStatsAgg[0] as {
        employeeAmount: number
        companyAmount: number
        totalUnits: number
        lastValue: number
      }
      const pensionTotal = Math.round((ps.lastValue ?? 0) * (ps.totalUnits ?? 0) * 100) / 100
      const pensionContributed = (ps.employeeAmount ?? 0) + (ps.companyAmount ?? 0)

      pensionReturnPct = pensionContributed > 0
        ? Math.round(((pensionTotal - pensionContributed) / pensionContributed) * 10000) / 100
        : 0

      pension = {
        employeeAmount: Math.round((ps.employeeAmount ?? 0) * 100) / 100,
        companyAmount: Math.round((ps.companyAmount ?? 0) * 100) / 100,
        total: pensionTotal,
        transactions: pensionTransactions as IPension[]
      }
    }

    // ── Adherencia al presupuesto ────────────────────────────────────────────
    // Usamos el gasto real del mes actual como numerador.
    // Si no hay datos de budget configurados devolvemos 100 (sin datos = "en presupuesto").
    const realExpenses = currentMonthBudgetAgg[0]?.realExpenses ?? 0
    // budgetAdherencePct: 100 significa "gastado = 0" (perfecto), 0 significa "sin ingresos o sin presupuesto"
    // Interpretamos: qué % del presupuesto marcado se ha gastado.
    // Como no tenemos el importe presupuestado en este endpoint, usamos el mes anterior como referencia.
    // Si monthlyExpenses <= prevExpenses → buena adherencia.
    const budgetAdherencePct = prevExpenses > 0
      ? Math.round(Math.max(0, (1 - (realExpenses - prevExpenses) / prevExpenses)) * 100)
      : (realExpenses === 0 ? 100 : 50)

    // ── Health Score ─────────────────────────────────────────────────────────
    const healthScore = computeHealthScore(
      savingsRate,
      totalDebts,
      totalBalance,
      budgetAdherencePct,
      cashRunwayMonths,
      pensionReturnPct
    )

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
      topStores,
      pension,
      pensionReturnPct,
      budgetAdherencePct,
      healthScore
    }
  }
}
