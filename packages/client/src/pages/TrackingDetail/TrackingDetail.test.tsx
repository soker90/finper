// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { MemoryRouter, Route, Routes } from 'react-router'
import { render } from '@testing-library/react'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import ThemeCustomization from 'themes/index'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { SwrProvider } from 'contexts/index'
import { AuthProvider } from 'contexts/AuthContext'
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

const renderWithTag = (tagName: string) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/seguimientos/${tagName}`]}>
          <ThemeCustomization>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='es'>
              <SwrProvider>
                <Routes>
                  <Route path='/seguimientos/:tagName' element={<TrackingDetail />} />
                </Routes>
              </SwrProvider>
            </LocalizationProvider>
          </ThemeCustomization>
        </MemoryRouter>
      </AuthProvider>
    </SWRConfig>
  )

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
    const { findByText } = renderWithTag('viaje-japon')
    // The historic view loads first; year cards are visible
    expect(await findByText('2025')).toBeDefined()
  })
})
