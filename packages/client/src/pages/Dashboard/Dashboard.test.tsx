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
  it('renders loading state initially', () => {
    const { container } = render(<Dashboard />)

    const skeleton = container.querySelector('.MuiSkeleton-root')
    expect(skeleton).toBeDefined()
  })

  it('renders KPI cards after data loads', async () => {
    const { findByText } = render(<Dashboard />)

    // These titles are rendered by KpiCard components once all hooks resolve
    expect(await findByText('Balance Total')).toBeDefined()
    expect(await findByText('Patrimonio Neto')).toBeDefined()
    expect(await findByText('Ingresos del Mes')).toBeDefined()
    expect(await findByText('Gastos del Mes')).toBeDefined()
  })

  it('renders section headings after data loads', async () => {
    const { findByText } = render(<Dashboard />)

    expect(await findByText('Tendencias')).toBeDefined()
    expect(await findByText('Salud financiera')).toBeDefined()
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
})
