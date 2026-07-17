// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import YieldDetail from './index'
import { YIELDS_LIST } from '../../mock/handlers/yields'

vi.mock('./components/YieldSettlementChart', () => {
  return {
    default: () => <div className='recharts-responsive-container'>Mocked Chart</div>
  }
})

vi.mock('react-router', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-router')>()
  return {
    ...original,
    useParams: () => ({ id: YIELDS_LIST[0]._id }),
    useNavigate: () => vi.fn()
  }
})

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <YieldDetail />
    </SWRConfig>
  )

/** Minimal interest settlement with no entries */
const makeInterestSettlement = (overrides: Record<string, any> = {}) => ({
  id: 'sett-default',
  settlementDate: null,
  grossIncome: 0,
  taxExpense: 0,
  net: 0,
  tae: null,
  averageBalance: null,
  taeSource: null,
  balanceSource: null,
  entries: [],
  ...overrides
})

/** Minimal cashback settlement with no entries */
const makeCashbackSettlement = (overrides: Record<string, any> = {}) => ({
  id: 'sett-cashback',
  settlementDate: null,
  status: 'pending',
  billsTotal: 0,
  cashbackAmount: 0,
  percentage: null,
  entries: [],
  ...overrides
})

/** Builds a full YieldDetail response to override the default MSW handler */
const makeMockDetail = (overrides: Record<string, any> = {}) => ({
  ...YIELDS_LIST[0],
  type: 'interest',
  entries: [],
  settlements: [],
  ...overrides
})

afterEach(() => server.resetHandlers())

describe('YieldDetail', () => {
  it('renders loading spinner while loading', () => {
    const { container } = render(<YieldDetail />)
    expect(container.querySelector('.MuiCircularProgress-root')).not.toBeNull()
  })

  it('renders yield detail elements after loading', async () => {
    const { findByText, findAllByText, container } = renderFresh()

    expect((await findAllByText(new RegExp(YIELDS_LIST[0].account.name))).length).toBeGreaterThanOrEqual(1)
    expect(await findByText('Saldo actual cuenta')).toBeDefined()
    expect(await findByText('Neto acumulado')).toBeDefined()
    expect(await findByText('Última liquidación')).toBeDefined()
    expect(await findByText('Movimientos enlazados')).toBeDefined()
    expect(await findByText('Mocked Chart')).toBeDefined()
    expect(container.querySelector('.recharts-responsive-container')).not.toBeNull()
    expect(await findByText('Detalle de Liquidaciones')).toBeDefined()
  })

  describe('settlement labels', () => {
    it('shows formatted date when settlementDate is set', async () => {
      server.use(
        http.get('/yields/:id', () =>
          HttpResponse.json(makeMockDetail({
            type: 'interest',
            settlements: [makeInterestSettlement({
              id: 'sett-with-date',
              settlementDate: new Date('2026-03-12').getTime()
            })]
          }))
        )
      )
      const { findByText } = renderFresh()
      // A numeric date like 2026-03-12 will always contain the year in any locale
      expect(await findByText(/2026/)).toBeDefined()
    })

    it('shows "Pendiente" as label when settlementDate is null', async () => {
      server.use(
        http.get('/yields/:id', () =>
          HttpResponse.json(makeMockDetail({
            type: 'interest',
            settlements: [makeInterestSettlement({ id: 'sett-no-date' })]
          }))
        )
      )
      const { findByText } = renderFresh()
      expect(await findByText('Pendiente')).toBeDefined()
    })
  })

  it('shows "Pendiente de abono" chip for a cashback settlement with no income', async () => {
    server.use(
      http.get('/yields/:id', () =>
        HttpResponse.json(makeMockDetail({
          type: 'cashback',
          settlements: [makeCashbackSettlement({
            id: 'sett-cashback-pending',
            billsTotal: 60
          })]
        }))
      )
    )
    const { findAllByText } = renderFresh()
    const chips = await findAllByText('Pendiente de abono')
    expect(chips.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Gasto pendiente" and estimated cashback instead of "Saldo actual cuenta" for cashback yields', async () => {
    server.use(
      http.get('/yields/:id', () =>
        HttpResponse.json(makeMockDetail({
          type: 'cashback',
          settlements: [
            makeCashbackSettlement({
              id: 'sett-cashback-pending',
              billsTotal: 100,
              status: 'pending'
            }),
            makeCashbackSettlement({
              id: 'sett-cashback-completed',
              billsTotal: 200,
              cashbackAmount: 10,
              percentage: 5,
              status: 'completed',
              settlementDate: new Date('2026-01-01').getTime()
            })
          ]
        }))
      )
    )
    const { findByText, queryByText } = renderFresh()
    expect(await findByText('Gasto pendiente')).toBeDefined()
    expect(await findByText(/Estimado:/)).toBeDefined()
    expect(queryByText('Saldo actual cuenta')).toBeNull()
  })

  it('shows estimated monthly interest in "Saldo actual cuenta" card for interest yields with TAE', async () => {
    server.use(
      http.get('/yields/:id', () =>
        HttpResponse.json(makeMockDetail({
          type: 'interest',
          settlements: [
            makeInterestSettlement({
              id: 'sett-interest-tae',
              tae: 3,
              taeSource: 'provided',
              settlementDate: new Date('2026-01-01').getTime()
            })
          ]
        }))
      )
    )
    const { findByText } = renderFresh()
    expect(await findByText('Saldo actual cuenta')).toBeDefined()
    expect(await findByText(/Est\. mensual:/)).toBeDefined()
  })

  it('shows "introd." and "calc." chips on an interest settlement with TAE and balance', async () => {
    server.use(
      http.get('/yields/:id', () =>
        HttpResponse.json(makeMockDetail({
          type: 'interest',
          settlements: [makeInterestSettlement({
            id: 'sett-chips',
            settlementDate: new Date('2026-03-12').getTime(),
            grossIncome: 100,
            taxExpense: 19,
            net: 81,
            tae: 2.5,
            taeSource: 'provided',
            averageBalance: 40000,
            balanceSource: 'calculated'
          })]
        }))
      )
    )
    const { findByText } = renderFresh()
    expect(await findByText('introd.')).toBeDefined()
    expect(await findByText('calc.')).toBeDefined()
  })

  it('clicking "+" button on a row opens link modal without RadioGroup (settlement pre-fixed)', async () => {
    server.use(
      http.get('/yields/:id', () =>
        HttpResponse.json(makeMockDetail({
          type: 'interest',
          settlements: [makeInterestSettlement({
            id: 'sett-fixed',
            settlementDate: new Date('2026-07-01').getTime(),
            grossIncome: 100,
            net: 100
          })]
        }))
      )
    )

    const { findByLabelText, findByText, queryByRole } = renderFresh()

    const addBtn = await findByLabelText(/Añadir movimiento/)
    addBtn.click()

    // Wait for the modal to open (title contains the yield name)
    await findByText(/Movimientos de/)

    // RadioGroup must NOT exist since the settlement is pre-fixed
    expect(queryByRole('radiogroup')).toBeNull()
  })

  it('click delete button opens confirmation modal and confirming removes the yield', async () => {
    const { findByRole, findByText, findAllByRole, queryByText } = renderFresh()
    const deleteBtn = await findByRole('button', { name: /eliminar/i })
    deleteBtn.click()
    expect(await findByText('¿Quieres borrar el rendimiento?')).toBeDefined()

    const confirmBtns = await findAllByRole('button', { name: 'Eliminar' })
    confirmBtns[0].click()
    await waitFor(() =>
      expect(queryByText('¿Quieres borrar el rendimiento?')).toBeNull()
    )
  })
})
