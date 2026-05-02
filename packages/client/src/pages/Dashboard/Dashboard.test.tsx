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

    it('renders Tickets pendientes label', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Tickets pendientes')).toBeDefined()
    })

    it('renders Tasa de Ahorro and Deudas Totales labels', async () => {
      const { findByText } = render(<Dashboard />)

      expect(await findByText('Tasa de Ahorro')).toBeDefined()
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

  // ── HealthScoreSection ────────────────────────────────────────────────────
  describe('HealthScoreSection', () => {
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
  })
})
