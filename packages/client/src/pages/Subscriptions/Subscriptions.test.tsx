// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Subscriptions from './index'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <Subscriptions />
    </SWRConfig>
  )

describe('Subscriptions', () => {
  // ── Estado inicial ────────────────────────────────────────────────────────
  it('renders skeleton while loading', () => {
    const { container } = render(<Subscriptions />)
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull()
  })

  // ── Estado vacío ──────────────────────────────────────────────────────────
  it('renders empty state when there are no subscriptions', async () => {
    server.use(
      http.get('/subscriptions', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/no tienes suscripciones/i)).toBeDefined()
  })

  // ── Lista ─────────────────────────────────────────────────────────────────
  it('renders subscription cards after data loads', async () => {
    const { findAllByText } = renderFresh()
    const cards = await findAllByText(/Netflix|Spotify|Amazon Prime|HBO Max|Disney\+|YouTube Premium|Apple TV\+|Gym/)
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  // ── KPIs Summary ──────────────────────────────────────────────────────────
  it('renders summary KPI cards', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Gasto mensual')).toBeDefined()
    expect(await findByText('Gasto anual')).toBeDefined()
    expect(await findByText('Total suscripciones')).toBeDefined()
  })

  // ── Botón nueva ───────────────────────────────────────────────────────────
  it('shows Nueva button in the header', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Nueva')).toBeDefined()
  })

  // ── Candidatos ────────────────────────────────────────────────────────────
  it('renders candidates banner when there are candidates', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Posibles pagos de suscripción detectados')).toBeDefined()
  })
})
