// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { fireEvent } from '@testing-library/react'
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

  it('opens new card modal on button click', async () => {
    server.use(
      http.get('*/credit-cards', () => HttpResponse.json(CARDS_LIST)),
      http.get('*/accounts', () => HttpResponse.json([{ id: 'a1', name: 'Cuenta Nómina', bank: 'BBVA' }]))
    )
    const { findByRole, findByText } = renderFresh()
    const btn = await findByRole('button', { name: /nueva tarjeta/i })
    fireEvent.click(btn)
    expect(await findByText('Nueva Tarjeta de Crédito')).toBeDefined()
  })
})
