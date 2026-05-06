// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { fireEvent } from '@testing-library/react'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Goals from './index'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Goals />
    </SWRConfig>
  )

const GOALS_LIST = [
  { _id: 'g1', name: 'Coche', targetAmount: 10000, currentAmount: 4000, color: '#2196F3', icon: 'CarOutlined' },
  { _id: 'g2', name: 'Vacaciones', targetAmount: 2000, currentAmount: 500, color: '#4CAF50', icon: 'RocketOutlined' }
]

const ACCOUNTS_LIST = [
  { _id: 'a1', name: 'Main', bank: 'Bank', balance: 5000, isActive: true }
]

describe('Goals', () => {
  it('renders the loading list while goals are being fetched', () => {
    server.use(
      http.get('/goals', () => HttpResponse.json([])),
      http.get('/accounts', () => HttpResponse.json([]))
    )
    const { container } = renderFresh()
    // LoadingList renders MUI skeletons while data is in flight
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull()
  })

  it('renders the empty state when there are no goals', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json([])),
      http.get('/accounts', () => HttpResponse.json(ACCOUNTS_LIST))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Define tu primera meta y empieza a ahorrar para lo que más te importa')).toBeDefined()
  })

  it('renders one row per goal once data is loaded', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json(GOALS_LIST)),
      http.get('/accounts', () => HttpResponse.json(ACCOUNTS_LIST))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Coche')).toBeDefined()
    expect(await findByText('Vacaciones')).toBeDefined()
  })

  it('renders the TotalCard summary with allocated and unassigned balances', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json(GOALS_LIST)),
      http.get('/accounts', () => HttpResponse.json(ACCOUNTS_LIST))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Saldo disponible para metas')).toBeDefined()
    // 5000 balance - (4000 + 500) allocated = 500 unassigned
    expect(await findByText(/sin asignar/i)).toBeDefined()
  })

  it('clicking the new-goal button shows an empty GoalItem in creation mode', async () => {
    server.use(
      http.get('/goals', () => HttpResponse.json(GOALS_LIST)),
      http.get('/accounts', () => HttpResponse.json(ACCOUNTS_LIST))
    )
    const { findByRole, findByText } = renderFresh()
    const newBtn = await findByRole('button', { name: /nueva meta/i })
    fireEvent.click(newBtn)
    // The GoalEdit form renders the "Cancelar" button when isNew is true
    expect(await findByText('Cancelar')).toBeDefined()
  })
})
