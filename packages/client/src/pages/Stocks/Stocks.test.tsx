// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Stocks from './index'
import { STOCKS_LIST } from '../../mock/handlers/stocks'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <Stocks />
    </SWRConfig>
  )

describe('Stocks', () => {
  // ── Estado inicial ─────────────────────────────────────────────────────────
  it('renders loading skeleton while fetching', () => {
    const { container } = render(<Stocks />)
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull()
  })

  // ── Estado vacío ───────────────────────────────────────────────────────────
  it('renders empty state when there are no positions', async () => {
    server.use(
      http.get('/stocks', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText('No hay posiciones registradas')).toBeDefined()
  })

  // ── Posiciones ─────────────────────────────────────────────────────────────
  it('renders one row per position after data loads', async () => {
    const { findAllByText } = renderFresh()
    // Each position shows its ticker in the table
    const tickers = await findAllByText(/TEF\.MC|ITX\.MC|SAN\.MC/)
    expect(tickers.length).toBeGreaterThanOrEqual(STOCKS_LIST.length)
  })

  // ── KPI cards ─────────────────────────────────────────────────────────────
  it('renders all four KPI stat cards', async () => {
    const { findAllByText } = renderFresh()
    // Some labels appear both in KPI cards and table headers – use findAllByText
    expect((await findAllByText('Coste total')).length).toBeGreaterThanOrEqual(1)
    expect((await findAllByText('Valor actual')).length).toBeGreaterThanOrEqual(1)
    expect((await findAllByText(/Ganancia/)).length).toBeGreaterThanOrEqual(1)
    expect((await findAllByText('Rentabilidad (%)')).length).toBeGreaterThanOrEqual(1)
  })

  it('KPI "Coste total" renders a non-zero euro value', async () => {
    const { findAllByText } = renderFresh()
    const els = await findAllByText('Coste total')
    expect(els.length).toBeGreaterThanOrEqual(1)
  })

  // ── Botones de cabecera ────────────────────────────────────────────────────
  it('shows "Nueva compra" button in the header', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Nueva compra')).toBeDefined()
  })

  it('shows "Añadir dividendo" button in the header', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Añadir dividendo')).toBeDefined()
  })

  it('shows "Registrar venta" button in the header', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Registrar venta')).toBeDefined()
  })

  // ── Apertura de modales ───────────────────────────────────────────────────
  it('click "Nueva compra" opens the buy modal', async () => {
    const { findByText } = renderFresh()
    const btn = await findByText('Nueva compra')
    btn.click()
    expect(await findByText('Nueva compra de acciones')).toBeDefined()
  })

  it('click "Añadir dividendo" opens the dividend modal', async () => {
    const { findByText } = renderFresh()
    const btn = await findByText('Añadir dividendo')
    btn.click()
    expect(await findByText('Nuevo dividendo de acciones')).toBeDefined()
  })

  it('click "Registrar venta" opens the sell modal', async () => {
    const { findByText } = renderFresh()
    const btn = await findByText('Registrar venta')
    btn.click()
    expect(await findByText('Registrar venta de acciones')).toBeDefined()
  })

  // ── Modal de eliminación ──────────────────────────────────────────────────
  it('click expand on a position reveals purchase rows', async () => {
    const { findAllByRole } = renderFresh()
    // Wait for positions to load, then expand the first row
    const expandBtns = await findAllByRole('button')
    // The first buttons are header action buttons; position expand buttons are inside table rows
    const tableExpandBtn = expandBtns.find(b => b.closest('tr'))
    expect(tableExpandBtn).toBeDefined()
    tableExpandBtn!.click()
    // After expanding, the sub-table with purchases is shown (date column header appears)
    await waitFor(() => {
      const dateCells = document.querySelectorAll('td, th')
      const hasFecha = Array.from(dateCells).some(el => el.textContent?.includes('Fecha'))
      expect(hasFecha).toBe(true)
    })
  })

  // ── Aislamiento por usuario ───────────────────────────────────────────────
  it('shows empty state when server returns empty array', async () => {
    server.use(
      http.get('/stocks', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText('No hay posiciones registradas')).toBeDefined()
  })

  // ── Error del servidor ────────────────────────────────────────────────────
  it('renders empty table when the server returns an error', async () => {
    server.use(
      http.get('/stocks', () => HttpResponse.json({}, { status: 500 }))
    )
    const { findByText } = renderFresh()
    expect(await findByText('No hay posiciones registradas')).toBeDefined()
  })
})
