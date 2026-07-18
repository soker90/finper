// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Yields from './index'
import { YIELDS_LIST } from '../../mock/handlers/yields'
import { calcTotalNet } from './utils'
import { format } from 'utils'

const navigateMock = vi.fn()
vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>()
  return { ...original, useNavigate: () => navigateMock }
})

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <Yields />
    </SWRConfig>
  )

describe('Yields', () => {
  it('renders skeleton while loading', () => {
    const { container } = render(<Yields />)
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull()
  })

  it('renders empty state when there are no yields', async () => {
    server.use(
      http.get('/yields', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/todavía no tienes ningún rendimiento/i)).toBeDefined()
  })

  it('renders yield cards after data loads', async () => {
    const { findAllByText } = renderFresh()
    const cards = await findAllByText(new RegExp(YIELDS_LIST[0].account.name))
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  it('renders summary KPI cards', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Neto acumulado')).toBeDefined()
    expect(await findByText('Rendimientos')).toBeDefined()
    expect(await findByText('Movimientos enlazados')).toBeDefined()
  })

  it('KPI "Rendimientos" reflects the number of yields', async () => {
    const { findByText } = renderFresh()
    expect(await findByText(String(YIELDS_LIST.length))).toBeDefined()
  })

  it('KPI "Neto acumulado" reflects the sum of all yields', async () => {
    const { findAllByText } = renderFresh()
    const total = calcTotalNet(YIELDS_LIST as any)
    const expected = format.euro(total).replace(/\s/g, '\\s')
    const matches = await findAllByText(new RegExp(expected))
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows Nuevo button in the header', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Nuevo')).toBeDefined()
  })

  it('click "Nuevo" opens YieldForm in creation mode', async () => {
    const { findByText } = renderFresh()
    const btn = await findByText('Nuevo')
    btn.click()
    expect(await findByText('Nuevo rendimiento')).toBeDefined()
  })

  it('click the search icon opens the link-transactions modal', async () => {
    const { findAllByLabelText, findAllByText, findByText } = renderFresh()
    await findAllByText(new RegExp(YIELDS_LIST[0].account.name))
    const buttons = await findAllByLabelText('Enlazar movimientos')
    buttons[0].click()
    expect(await findByText(/Movimientos de/)).toBeDefined()
  })

  it('shows a link to the existing yield when editing conflicts with another (same account+type)', async () => {
    const existingYieldId = 'other-yield-id'
    server.use(
      // The account dropdown only lists accounts from /accounts, so it must
      // include the edited yield's own account for the native <select> to
      // keep it selected (and pass the "required" validation on submit).
      http.get('/accounts', () => HttpResponse.json([{
        _id: YIELDS_LIST[0].accountId,
        name: YIELDS_LIST[0].account.name,
        bank: YIELDS_LIST[0].account.bank,
        balance: 100
      }])),
      http.put('/yields/:id', () => HttpResponse.json({ message: 'Ya existe un rendimiento de este tipo para esta cuenta', existingYieldId }, { status: 422 }))
    )
    const { findAllByLabelText, findAllByText, findByText, findByRole } = renderFresh()
    await findAllByText(new RegExp(YIELDS_LIST[0].account.name))
    const editButtons = await findAllByLabelText('Editar')
    editButtons[0].click()
    await findByText('Editar rendimiento')

    const submitBtn = await findByRole('button', { name: 'Aceptar' })
    submitBtn.click()

    const linkBtn = await findByText('Ver rendimiento')
    linkBtn.click()
    expect(navigateMock).toHaveBeenCalledWith(`/rendimientos/${existingYieldId}`)
  })

  it('shows the tax-category select when editing a cashback yield with more than one category', async () => {
    const catA = { _id: 'cat-a', name: 'Intereses', type: 'income' }
    const catB = { _id: 'cat-b', name: 'Comisiones', type: 'expense' }
    const cashbackYield = { ...YIELDS_LIST[0], type: 'cashback', categoryIds: [catA._id, catB._id] }
    server.use(
      http.get('/categories', () => HttpResponse.json([catA, catB])),
      http.get('/yields', () => HttpResponse.json([cashbackYield]))
    )
    const { findAllByText, findAllByLabelText, findByText } = renderFresh()
    await findAllByText(new RegExp(cashbackYield.account.name))
    const editButtons = await findAllByLabelText('Editar')
    editButtons[0].click()
    await findByText('Editar rendimiento')

    expect(await findByText('Categoría de impuesto (opcional)')).toBeDefined()
    expect(document.querySelector('#taxCategoryId')).not.toBeNull()
  })

  it('click delete icon opens confirmation modal and confirming removes the yield', async () => {
    const { findAllByLabelText, findAllByText, findByText, findAllByRole, queryByText } = renderFresh()
    await findAllByText(new RegExp(YIELDS_LIST[0].account.name))
    const deleteButtons = await findAllByLabelText('Eliminar')
    deleteButtons[0].click()
    expect(await findByText('¿Quieres borrar el rendimiento?')).toBeDefined()

    const confirmBtns = await findAllByRole('button', { name: 'Eliminar' })
    confirmBtns[0].click()
    await waitFor(() =>
      expect(queryByText('¿Quieres borrar el rendimiento?')).toBeNull()
    )
  })
})
