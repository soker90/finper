// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { waitFor, fireEvent } from '@testing-library/react'
import { useParams, useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import SupplyDetail from './index'
import {
  SUPPLY_WATER_ID,
  SUPPLY_ELEC_ID,
  READINGS_LIST
} from '../../mock/handlers/supplies'

vi.mock('react-router', async (importOriginal) => {
  const mod = await importOriginal<typeof import('react-router')>()
  return {
    ...mod,
    useParams: vi.fn(),
    useNavigate: vi.fn()
  }
})

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <SupplyDetail />
    </SWRConfig>
  )

describe('SupplyDetail — initial state and rendering', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ supplyId: SUPPLY_WATER_ID })
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
  })

  it('shows spinner while supplies are loading', () => {
    const { container } = renderFresh()
    expect(container.querySelector('.MuiCircularProgress-root')).not.toBeNull()
  })

  it('shows "not found" message with an invalid supplyId', async () => {
    vi.mocked(useParams).mockReturnValue({ supplyId: 'nonexistent-id' })
    const { findByText } = renderFresh()
    expect(await findByText(/suministro no encontrado/i)).toBeDefined()
  })

  it('renders the supply type chip', async () => {
    const { findAllByText } = renderFresh()
    const chips = await findAllByText('Agua')
    expect(chips.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the reading rows for the current year', async () => {
    const { findByText } = renderFresh()
    const formatted = dayjs(READINGS_LIST[0].startDate).format('DD/MM/YYYY')
    expect(await findByText(formatted)).toBeDefined()
  })

  it('shows the reading count', async () => {
    const { findByText } = renderFresh()
    expect(await findByText(`${READINGS_LIST.length} lecturas`)).toBeDefined()
  })

  it('renders electricity column headers for an electricity supply', async () => {
    vi.mocked(useParams).mockReturnValue({ supplyId: SUPPLY_ELEC_ID })
    server.use(
      http.get('/supplies/readings/supply/:supplyId', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Punta (kWh)')).toBeDefined()
    expect(await findByText('Llano (kWh)')).toBeDefined()
    expect(await findByText('Valle (kWh)')).toBeDefined()
  })

  it('shows empty state when there are no readings for the selected year', async () => {
    server.use(
      http.get('/supplies/readings/supply/:supplyId', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/sin lecturas registradas/i)).toBeDefined()
  })

  it('"Volver" button navigates to /suministros', async () => {
    const navigateSpy = vi.fn()
    vi.mocked(useNavigate).mockReturnValue(navigateSpy)
    const { findByText } = renderFresh()
    ;(await findByText('Volver')).click()
    expect(navigateSpy).toHaveBeenCalledWith('/suministros')
  })
})

// ── Flow: reading CRUD ────────────────────────────────────────────────────────
describe('Flow: reading CRUD in SupplyDetail', () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ supplyId: SUPPLY_WATER_ID })
    vi.mocked(useNavigate).mockReturnValue(vi.fn())
  })

  it('"Añadir lectura" button opens the form in creation mode', async () => {
    const { findByText } = renderFresh()
    await findByText(`${READINGS_LIST.length} lecturas`)
    ;(await findByText('Añadir lectura')).click()
    expect(await findByText('Nueva lectura')).toBeDefined()
  })

  it('click edit reading button opens form in edit mode with pre-filled values', async () => {
    const { findByText, findAllByRole } = renderFresh()
    await findByText(dayjs(READINGS_LIST[0].startDate).format('DD/MM/YYYY'))

    const editBtns = await findAllByRole('button', { name: /editar lectura/i })
    editBtns[0].click()

    expect(await findByText('Editar lectura')).toBeDefined()
    expect(await findByText(String(READINGS_LIST[0].consumption))).toBeDefined()
  })

  it('edit reading → submit → modal closes', async () => {
    const { findByText, findAllByRole, queryByText } = renderFresh()
    await findByText(dayjs(READINGS_LIST[0].startDate).format('DD/MM/YYYY'))

    const editBtns = await findAllByRole('button', { name: /editar lectura/i })
    editBtns[0].click()
    await findByText('Editar lectura')

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(queryByText('Editar lectura')).toBeNull())
  })

  it('delete reading → confirm → row disappears from the table', async () => {
    const { findByText, findByRole, findAllByRole, queryByText } = renderFresh()
    const firstDate = dayjs(READINGS_LIST[0].startDate).format('DD/MM/YYYY')
    // Wait for initial load before overriding the handler
    await findByText(firstDate)

    server.use(
      http.delete('/supplies/readings/:id', () => new HttpResponse(null, { status: 204 })),
      http.get('/supplies/readings/supply/:supplyId', () => HttpResponse.json(READINGS_LIST.slice(1)))
    )

    const deleteBtns = await findAllByRole('button', { name: /eliminar lectura/i })
    deleteBtns[0].click()

    await findByText('¿Eliminar lectura?')
    ;(await findByRole('button', { name: /^Eliminar$/ })).click()

    await waitFor(() => expect(queryByText(firstDate)).toBeNull())
  })

  it('delete reading error → reading remains in the table', async () => {
    server.use(
      http.delete('/supplies/readings/:id', () => HttpResponse.json({}, { status: 500 }))
    )
    const { findByText, findByRole, findAllByRole } = renderFresh()
    const firstDate = dayjs(READINGS_LIST[0].startDate).format('DD/MM/YYYY')
    await findByText(firstDate)

    const deleteBtns = await findAllByRole('button', { name: /eliminar lectura/i })
    deleteBtns[0].click()

    await findByText('¿Eliminar lectura?')
    ;(await findByRole('button', { name: /^Eliminar$/ })).click()

    await waitFor(() => expect(document.body.textContent).toContain(firstDate))
  })
})
