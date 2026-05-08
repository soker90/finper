// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { Route, Routes } from 'react-router'
import { render } from '../../test/testUtils'
// test helpers are provided by the repo wrapper in testUtils — this file uses that wrapper via render
import { server } from '../../mock/server'
import TrackingDetail from './index'
import 'dayjs/locale/es'

const TAG_HISTORIC = {
  tag: 'viaje-japon',
  totalAmount: 5300.00,
  years: [
    { year: 2025, totalAmount: 3400.00, transactionCount: 24 },
    { year: 2024, totalAmount: 1900.00, transactionCount: 29 }
  ]
}

const TAG_DETAIL = {
  tag: 'viaje-japon',
  year: 2025,
  totalAmount: 3400.00,
  transactionCount: 24,
  byCategory: [
    { categoryId: '1', categoryName: 'Viajes', amount: 2000.00, count: 10 },
    { categoryId: '2', categoryName: 'Comida', amount: 1400.00, count: 14 }
  ],
  transactions: []
}

const renderWithTag = (tagName: string, initialEntry?: string) => {
  // set the browser location so the BrowserRouter wrapper in testUtils uses it
  window.history.pushState({}, 'Test page', initialEntry ?? `/seguimientos/${tagName}`)
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Routes>
        <Route path='/seguimientos/:tagName/:year' element={<TrackingDetail />} />
        <Route path='/seguimientos/:tagName' element={<TrackingDetail />} />
      </Routes>
    </SWRConfig>
  )
}

describe('TrackingDetail', () => {
  it('renders the tag name as page title', () => {
    server.use(
      http.get('*/stats/tags/viaje-japon', () => HttpResponse.json(TAG_HISTORIC))
    )
    const { getByText } = renderWithTag('viaje-japon')
    expect(getByText(/viaje-japon/i)).toBeDefined()
  })

  it('renders historic total amount once data loads', async () => {
    server.use(
      http.get('*/stats/tags/viaje-japon', () => HttpResponse.json(TAG_HISTORIC))
    )
    const { findByText } = renderWithTag('viaje-japon')
    expect(await findByText(/total acumulado/i)).toBeDefined()
  })

  it('renders a card for each year in the historic view', async () => {
    server.use(
      http.get('*/stats/tags/viaje-japon', () => HttpResponse.json(TAG_HISTORIC))
    )
    const { findByText } = renderWithTag('viaje-japon')
    expect(await findByText('2025')).toBeDefined()
    expect(await findByText('2024')).toBeDefined()
  })

  it('renders the back button to navigate back', () => {
    server.use(
      http.get('*/stats/tags/viaje-japon', () => HttpResponse.json(TAG_HISTORIC))
    )
    const { getByText } = renderWithTag('viaje-japon')
    expect(getByText(/volver/i)).toBeDefined()
  })

  it('shows detail view when year detail data is available', async () => {
    server.use(
      http.get('*/stats/tags/viaje-japon', () => HttpResponse.json(TAG_HISTORIC)),
      http.get('*/stats/tags/viaje-japon/2025', () => HttpResponse.json(TAG_DETAIL))
    )
    const { findByText } = renderWithTag('viaje-japon/2025')
    // Year detail should show the year as chip and total (formatted as "3400 €")
    expect(await findByText('2025')).toBeDefined()
    expect(await findByText(/3400/)).toBeDefined()
  })

  it('shows collapsible historic card when on year detail view with multiple years', async () => {
    server.use(
      http.get('*/stats/tags/viaje-japon', () => HttpResponse.json(TAG_HISTORIC)),
      http.get('*/stats/tags/viaje-japon/2025', () => HttpResponse.json(TAG_DETAIL))
    )
    const { findByText } = renderWithTag('viaje-japon/2025')
    // Wait for the year detail to load, then check for "Histórico completo" card header
    expect(await findByText('Histórico completo')).toBeDefined()
  })
})
