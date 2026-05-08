// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import CostCenters from './index'

const TAG_YEARS = [2026, 2025]

const TAG_STATS = [
  {
    tag: 'viaje-japon',
    totalAmount: 3400.00,
    transactionCount: 24,
    byCategory: [
      { categoryId: '1', categoryName: 'Viajes', amount: 2000.00, count: 10 },
      { categoryId: '2', categoryName: 'Comida', amount: 1400.00, count: 14 }
    ]
  },
  {
    tag: 'juan',
    totalAmount: 1250.50,
    transactionCount: 15,
    byCategory: [
      { categoryId: '3', categoryName: 'Educación', amount: 1250.50, count: 15 }
    ]
  }
]

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CostCenters />
    </SWRConfig>
  )

describe('CostCenters', () => {
  it('renders the page title', () => {
    server.use(
      http.get('*/stats/tags/years', () => HttpResponse.json([])),
      http.get('*/stats/tags', () => HttpResponse.json([]))
    )
    const { getByText } = renderFresh()
    expect(getByText('Centros de Coste')).toBeDefined()
  })

  it('shows empty state when user has no tagged transactions', async () => {
    server.use(
      http.get('*/stats/tags/years', () => HttpResponse.json([])),
      http.get('*/stats/tags', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/no hay etiquetas en ningún año/i)).toBeDefined()
  })

  it('renders a card for each tag once data is loaded', async () => {
    server.use(
      http.get('*/stats/tags/years', () => HttpResponse.json(TAG_YEARS)),
      http.get('*/stats/tags', () => HttpResponse.json(TAG_STATS))
    )
    const { findByText } = renderFresh()
    expect(await findByText('viaje-japon')).toBeDefined()
    expect(await findByText('juan')).toBeDefined()
  })

  it('shows empty state for the selected year when no tags match', async () => {
    server.use(
      http.get('*/stats/tags/years', () => HttpResponse.json(TAG_YEARS)),
      http.get('*/stats/tags', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/no hay etiquetas para este año/i)).toBeDefined()
  })

  it('renders the year selector when years are available', async () => {
    server.use(
      http.get('*/stats/tags/years', () => HttpResponse.json(TAG_YEARS)),
      http.get('*/stats/tags', () => HttpResponse.json(TAG_STATS))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Año')).toBeDefined()
  })
})
