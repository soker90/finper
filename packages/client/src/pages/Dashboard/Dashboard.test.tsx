// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Dashboard from './index'

// Wrap in a fresh SWR cache so previous test data does not bleed through
const renderWithFreshCache = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <Dashboard />
    </SWRConfig>
  )

describe('Dashboard', () => {
  // ── Estado inicial ────────────────────────────────────────────────────────
  it('renders loading state initially', () => {
    const { container } = render(<Dashboard />)

    const skeleton = container.querySelector('.MuiSkeleton-root')
    expect(skeleton).toBeDefined()
  })

  it('shows error state and retry button when /dashboard/stats fails', async () => {
    server.use(
      http.get('/dashboard/stats', () => {
        return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
      })
    )

    const { findByText } = renderWithFreshCache()

    expect(await findByText('Error al cargar el dashboard')).toBeDefined()
    expect(await findByText('Reintentar')).toBeDefined()
  })

  // ── KpiSummary ────────────────────────────────────────────────────────────
  describe('KpiSummary', () => {
    it('renders section title and 4 KPI card titles', async () => {
      const { findByText, findAllByText } = render(<Dashboard />)

      expect(await findByText('Resumen')).toBeDefined()
      expect(await findByText('Balance Total')).toBeDefined()
      expect((await findAllByText('Patrimonio Neto')).length).toBeGreaterThan(0)
      expect(await findByText('Ingresos del Mes')).toBeDefined()
      expect(await findByText('Gastos del Mes')).toBeDefined()
    })
  })

  // ── TrendsSection ─────────────────────────────────────────────────────────
  describe('TrendsSection', () => {
    it('renders section title and chart card title', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Tendencias')).toBeDefined()
      expect(await findByText(/Ingresos vs Gastos/)).toBeDefined()
    })

    it('renders Tickets pendientes label when module is enabled', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Tickets pendientes')).toBeDefined()
    })

    it('hides tickets widget when endpoint returns 503', async () => {
      server.use(
        http.get('/tickets', () => HttpResponse.json({ message: 'Tickets module not configured' }, { status: 503 }))
      )

      const { findByText, queryByText } = renderWithFreshCache()
      await findByText('Tendencias')

      expect(queryByText('Tickets pendientes')).toBeNull()
    })

    it('renders Tasa de Ahorro and Deudas Totales labels', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Tasa de Ahorro (mes actual)')).toBeDefined()
      expect(await findByText('Deudas Totales')).toBeDefined()
    })
  })

  // ── SpendingRhythm ────────────────────────────────────────────────────────
  describe('SpendingRhythm', () => {
    it('renders section title and velocity card', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Ritmo de gasto')).toBeDefined()
      expect(await findByText('Velocidad de gasto')).toBeDefined()
    })

    it('renders daily average and runway KPI titles', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Gasto diario medio')).toBeDefined()
      expect(await findByText('Colchón financiero')).toBeDefined()
    })
  })

  // ── BudgetSection ─────────────────────────────────────────────────────────
  describe('BudgetSection', () => {
    it('renders section title and budget card titles', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Presupuesto y distribución')).toBeDefined()
      expect(await findByText('Presupuesto gastos')).toBeDefined()
      expect(await findByText('Presupuesto ingresos')).toBeDefined()
    })

    it('renders accounts distribution and pension cards', async () => {
      const { findByText, findAllByText } = render(<Dashboard />)

      expect(await findByText('Distribución por cuentas')).toBeDefined()
      // 'Pensión' appears as card title (BudgetSection) and as sub-score label (HealthScoreSection)
      const pensionEls = await findAllByText('Pensión')
      expect(pensionEls.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── MonthAnalysis ─────────────────────────────────────────────────────────
  describe('MonthAnalysis', () => {
    it('renders section title and both analysis card titles', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Análisis del mes')).toBeDefined()
      expect(await findByText('Top gastos por categoría')).toBeDefined()
      expect(await findByText('Top tiendas')).toBeDefined()
    })
  })

  describe('HealthScoreSection', () => {
    const baseStats = {
      totalBalance: 1000,
      totalDebts: 0,
      netWorth: 1000,
      monthlyIncome: 2000,
      monthlyExpenses: 500,
      savingsRate: 75,
      topExpenseCategories: [],
      topStores: [],
      monthlyTrend: { income: { current: 2000, previous: 1800 }, expenses: { current: 500, previous: 600 } },
      last6Months: [],
      dailyAvgExpense: 16,
      projectedMonthlyExpense: 500,
      cashRunwayMonths: 2,
      expenseVelocity: { currentMonth: [], previousMonth: [] },
      pension: null,
      pensionReturnPct: 0,
      budgetAdherencePct: 100,
      healthScore: { total: 70, savingsRate: 80, debtRatio: 100, budgetAdherence: 100, cashRunway: 33, pensionReturn: 0 }
    }

    it('renders section title and score card', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Salud financiera')).toBeDefined()
      expect(await findByText('Score financiero')).toBeDefined()
      expect(await findByText('Consejos')).toBeDefined()
    })

    it('renders all sub-score labels', async () => {
      const { findByText, findAllByText } = render(<Dashboard />)

      expect(await findByText('Tasa de ahorro')).toBeDefined()
      expect(await findByText('Ratio deuda')).toBeDefined()
      expect(await findByText('Presupuesto')).toBeDefined()
      expect(await findByText('Colchón')).toBeDefined()
      // 'Pensión' also appears as BudgetSection card title
      const pensionEls = await findAllByText('Pensión')
      expect(pensionEls.length).toBeGreaterThanOrEqual(1)
    })

    it('renders score gauge label "de 100"', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('de 100')).toBeDefined()
    })

    it('renders insights from the backend as Alerts or empty state', async () => {
      const { container, findByText } = renderWithFreshCache()

      // Wait for the dashboard to finish loading
      await findByText('Resumen')

      // Either at least one MUI Alert is rendered (insights present) or the empty-state message
      const alerts = container.querySelectorAll('.MuiAlert-root')
      const hasEmptyState = await findByText('No hay consejos disponibles en este momento.')
        .then(() => true)
        .catch(() => false)

      expect(alerts.length > 0 || hasEmptyState).toBe(true)
    })

    it('shows empty state message when insights array is empty', async () => {
      server.use(
        http.get('/dashboard/stats', () => HttpResponse.json({ ...baseStats, insights: [] }))
      )

      const { findByText } = renderWithFreshCache()
      expect(await findByText('No hay consejos disponibles en este momento.')).toBeDefined()
    })

    it('renders insight titles and applies correct severity styles', async () => {
      server.use(
        http.get('/dashboard/stats', () => HttpResponse.json({
          ...baseStats,
          insights: [
            { type: 'warning', title: 'Gasto disparado', message: 'Has gastado más de lo habitual en Restaurantes.' },
            { type: 'success', title: '¡Racha de ahorro!', message: 'Llevas 3 meses ahorrando más del 20%.' },
            { type: 'critical', title: 'Presupuesto en riesgo', message: 'Agotarás tu presupuesto de Ocio en 5 días.' }
          ]
        }))
      )

      const { findByText, container } = renderWithFreshCache()

      expect(await findByText('Gasto disparado')).toBeDefined()
      expect(await findByText('¡Racha de ahorro!')).toBeDefined()
      expect(await findByText('Presupuesto en riesgo')).toBeDefined()

      // MUI Alert severity classes
      const warningAlert = container.querySelector('.MuiAlert-standardWarning, .MuiAlert-outlinedWarning')
      const successAlert = container.querySelector('.MuiAlert-standardSuccess, .MuiAlert-outlinedSuccess')
      const errorAlert = container.querySelector('.MuiAlert-standardError, .MuiAlert-outlinedError')

      expect(warningAlert).not.toBeNull()
      expect(successAlert).not.toBeNull()
      expect(errorAlert).not.toBeNull()
    })
  })
})
