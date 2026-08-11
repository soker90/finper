// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { fireEvent, waitFor } from '@testing-library/react'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import CreditCards from './index'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CreditCards />
    </SWRConfig>
  )

const CARDS_LIST = [
  {
    _id: 'c1',
    id: 'c1',
    name: 'Visa Pass',
    accountId: 'a1',
    account: { _id: 'a1', id: 'a1', name: 'Cuenta Nómina', bank: 'BBVA', balance: 1000 },
    limit: 2000,
    currentDebt: 150,
    user: 'testuser'
  }
]

const MOVEMENTS_LIST = [
  {
    _id: 'm1',
    id: 'm1',
    creditCardId: 'c1',
    date: 1700000000000,
    amount: 150,
    type: 'expense',
    categoryId: 'cat-1',
    category: { _id: 'cat-1', id: 'cat-1', name: 'Supermercado', type: 'expense' },
    status: 'pending',
    user: 'testuser'
  }
]

const ACCOUNTS_LIST = [{ id: 'a1', _id: 'a1', name: 'Cuenta Nómina', bank: 'BBVA', balance: 1000 }]
const CATEGORIES_LIST = [{ id: 'cat-1', _id: 'cat-1', name: 'Supermercado', type: 'expense' }]

describe('CreditCards Page', () => {
  it('renders title and empty state when there are no cards', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/No tienes ninguna tarjeta de crédito registrada/i)).toBeDefined()
  })

  it('renders credit cards list and debt summary', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json([]))
    )
    const { findByText, findAllByText } = renderFresh()

    expect(await findByText('Visa Pass')).toBeDefined()
    const elements = await findAllByText(/150/)
    expect(elements.length).toBeGreaterThan(0)
  })

  it('renders an error alert when credit cards fail to load', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json({ message: 'Server error' }, { status: 500 }))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/No se han podido cargar las tarjetas/i)).toBeDefined()
  })

  it('opens new card modal, creates a card and closes on success', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json([])),
      http.get('*/accounts', () => HttpResponse.json(ACCOUNTS_LIST)),
      http.post('*/credit-cards', () => HttpResponse.json({ id: 'c2', _id: 'c2', name: 'Nueva', accountId: 'a1', currentDebt: 0 }, { status: 201 }))
    )
    const { findByRole, findByText, queryByText, getByLabelText } = renderFresh()
    const btn = await findByRole('button', { name: /nueva tarjeta/i })
    fireEvent.click(btn)
    expect(await findByText('Nueva tarjeta de crédito')).toBeDefined()

    fireEvent.change(getByLabelText('Nombre de la tarjeta'), { target: { value: 'Nueva' } })
    fireEvent.change(getByLabelText('Cuenta asociada para el cobro'), { target: { value: 'a1' } })

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(queryByText('Nueva tarjeta de crédito')).toBeNull())
  })

  it('opens edit card modal from the card menu with prefilled values', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json([])),
      http.get('*/accounts', () => HttpResponse.json(ACCOUNTS_LIST))
    )
    const { findByText, getByDisplayValue } = renderFresh()
    await findByText('Visa Pass')

    const menuButtons = document.querySelectorAll('button')
    const moreButton = Array.from(menuButtons).find((button) => button.querySelector('.anticon-more'))
    fireEvent.click(moreButton!)
    fireEvent.click(await findByText('Editar tarjeta'))

    expect(await findByText('Editar tarjeta de crédito')).toBeDefined()
    expect(getByDisplayValue('Visa Pass')).toBeDefined()
  })

  it('deletes a credit card when confirmed', async () => {
    let deleteCalled = false
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json([])),
      http.delete('*/credit-cards/c1', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    const originalConfirm = window.confirm
    window.confirm = () => true
    const { findByText } = renderFresh()
    await findByText('Visa Pass')

    const menuButtons = document.querySelectorAll('button')
    const moreButton = Array.from(menuButtons).find((button) => button.querySelector('.anticon-more'))
    fireEvent.click(moreButton!)
    const deleteMenuItem = await findByText('Eliminar tarjeta')
    fireEvent.click(deleteMenuItem)

    await waitFor(() => expect(deleteCalled).toBe(true))
    window.confirm = originalConfirm
  })

  it('opens add movement modal, creates a movement and closes on success', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json([])),
      http.get('*/categories', () => HttpResponse.json(CATEGORIES_LIST)),
      http.get('*/stores', () => HttpResponse.json([])),
      http.post('*/credit-cards/c1/movements', () => HttpResponse.json({ id: 'm2', _id: 'm2', creditCardId: 'c1', amount: 10, type: 'expense', status: 'pending' }, { status: 201 }))
    )
    const { findByText, getByLabelText, findByRole, queryByText } = renderFresh()
    await findByText('Visa Pass')

    const movementBtn = await findByRole('button', { name: /movimiento/i })
    fireEvent.click(movementBtn)
    expect(await findByText('Nuevo movimiento con tarjeta')).toBeDefined()

    fireEvent.change(getByLabelText('Importe (€)'), { target: { value: '25.5' } })
    fireEvent.change(document.querySelector('#categoryId')!, { target: { value: 'cat-1' } })
    fireEvent.change(getByLabelText('Fecha'), { target: { value: '2024-01-15' } })

    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(queryByText('Nuevo movimiento con tarjeta')).toBeNull())
  })

  it('deletes a movement from the movements table when confirmed', async () => {
    let deleteCalled = false
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json(MOVEMENTS_LIST)),
      http.delete('*/credit-cards/c1/movements/m1', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    const originalConfirm = window.confirm
    window.confirm = () => true
    const { findByText, findByLabelText } = renderFresh()
    await findByText('Visa Pass')
    await findByText('Supermercado')

    const deleteButton = await findByLabelText('Eliminar movimiento')
    fireEvent.click(deleteButton.closest('button')!)

    await waitFor(() => expect(deleteCalled).toBe(true))
    window.confirm = originalConfirm
  })

  it('pays the total debt of a card', async () => {
    let payPayload: any = null
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json(MOVEMENTS_LIST)),
      http.post('*/credit-cards/c1/pay-debt', async ({ request }) => {
        payPayload = await request.json()
        return HttpResponse.json({ card: { ...CARDS_LIST[0], currentDebt: 0 }, paidCount: 1, totalPaid: 150 })
      })
    )
    const { findByText, findByRole, queryByText } = renderFresh()
    await findByText('Visa Pass')

    const payBtn = await findByRole('button', { name: /pagar deuda/i })
    fireEvent.click(payBtn)
    expect(await findByText(/Pagar deuda - Visa Pass/)).toBeDefined()

    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(queryByText(/Pagar deuda - Visa Pass/)).toBeNull())
    expect(payPayload).toEqual({ all: true })
  })

  it('blocks paying a custom amount greater than the current debt', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/credit-cards/c1/movements', () => HttpResponse.json(MOVEMENTS_LIST))
    )
    const { findByText, findByRole, findByLabelText } = renderFresh()
    await findByText('Visa Pass')

    const payBtn = await findByRole('button', { name: /pagar deuda/i })
    fireEvent.click(payBtn)
    await findByText(/Pagar deuda - Visa Pass/)

    fireEvent.click(await findByText('Pagar un importe específico'))
    const amountInput = await findByLabelText('Importe a pagar (€)')
    fireEvent.change(amountInput, { target: { value: '999999' } })

    fireEvent.submit(document.querySelector('form')!)

    expect(await findByText(/no puede superar la deuda actual/i)).toBeDefined()
  })
})
