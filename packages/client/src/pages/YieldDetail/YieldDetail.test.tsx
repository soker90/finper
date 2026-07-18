// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { waitFor, fireEvent } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import YieldDetail from './index'
import { YIELDS_LIST } from '../../mock/handlers/yields'
import { format } from 'utils'

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

  it('shows the "Impuesto Retenido" column and after-tax net for a cashback settlement', async () => {
    server.use(
      http.get('/yields/:id', () =>
        HttpResponse.json(makeMockDetail({
          type: 'cashback',
          settlements: [makeCashbackSettlement({
            id: 'sett-cashback-tax',
            billsTotal: 100,
            taxExpense: 4,
            cashbackAmount: 20,
            net: 16,
            percentage: 20,
            status: 'completed',
            settlementDate: new Date('2026-01-01').getTime()
          })]
        }))
      )
    )
    const { findByText, findAllByText } = renderFresh()
    expect(await findByText('Impuesto Retenido')).toBeDefined()
    // The "Cashback Neto" column shows the after-tax net (16), not the gross cashback (20).
    // "Neto acumulado" (KPI) coincides with the same value here (single settlement), so
    // there can be more than one match — assert presence, not uniqueness.
    const expectedNet = format.euro(16).replace(/\s/g, '\\s')
    const matches = await findAllByText(new RegExp(expectedNet))
    expect(matches.length).toBeGreaterThanOrEqual(1)
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
    const { findAllByRole, findByText, queryByText } = renderFresh()
    // The header "Eliminar" button (icon + text) is distinguished from the
    // per-settlement "Eliminar liquidación X" buttons (icon-only, name via
    // aria-label) by having visible text content.
    const deleteBtn = (await findAllByRole('button', { name: /eliminar/i })).find((btn) => btn.textContent?.trim() === 'Eliminar')!
    deleteBtn.click()
    expect(await findByText('¿Quieres borrar el rendimiento?')).toBeDefined()

    const confirmBtns = await findAllByRole('button', { name: 'Eliminar' })
    confirmBtns[0].click()
    await waitFor(() =>
      expect(queryByText('¿Quieres borrar el rendimiento?')).toBeNull()
    )
  })

  it('shows an error and keeps the confirmation modal open when deleting fails', async () => {
    server.use(
      http.delete('/yields/:id', () => HttpResponse.json({ message: 'No se pudo borrar' }, { status: 400 }))
    )
    const { findByText, findAllByRole } = renderFresh()
    const deleteBtn = (await findAllByRole('button', { name: /eliminar/i })).find((btn) => btn.textContent?.trim() === 'Eliminar')!
    deleteBtn.click()
    await findByText('¿Quieres borrar el rendimiento?')

    const confirmBtns = await findAllByRole('button', { name: 'Eliminar' })
    confirmBtns[0].click()
    expect(await findByText('No se pudo borrar')).toBeDefined()
    expect(await findByText('¿Quieres borrar el rendimiento?')).toBeDefined()
  })

  it('shows a not-found message when the yield does not exist', async () => {
    server.use(
      http.get('/yields/:id', () => HttpResponse.json({ message: 'Yield not found' }, { status: 404 }))
    )
    const { findByText } = renderFresh()
    expect(await findByText('Rendimiento no encontrado.')).toBeDefined()
  })

  describe('edit yield', () => {
    // The account dropdown only shows accounts returned by /accounts, so the
    // edited yield's accountId must match one of them for the native <select>
    // to have it selected (and pass the "required" validation on submit).
    const editAccount = { _id: 'acc-edit-1', name: 'Cuenta Edit', bank: 'Banco Edit', balance: 100 }

    it('closes the form after a successful edit', async () => {
      server.use(
        http.get('/accounts', () => HttpResponse.json([editAccount])),
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({ accountId: editAccount._id, settlements: [] }))),
        http.put('/yields/:id', () => HttpResponse.json(makeMockDetail({ accountId: editAccount._id, settlements: [] })))
      )
      const { findByRole, findByText, queryByText } = renderFresh()
      const editBtn = await findByRole('button', { name: /editar/i })
      editBtn.click()
      await findByText('Editar rendimiento')

      const submitBtn = await findByRole('button', { name: 'Aceptar' })
      submitBtn.click()
      await waitFor(() => expect(queryByText('Editar rendimiento')).toBeNull())
    })

    it('keeps the form open and shows the error on failure', async () => {
      server.use(
        http.get('/accounts', () => HttpResponse.json([editAccount])),
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({ accountId: editAccount._id, settlements: [] }))),
        http.put('/yields/:id', () => HttpResponse.json({ message: 'No se pudo editar' }, { status: 400 }))
      )
      const { findByRole, findByText } = renderFresh()
      const editBtn = await findByRole('button', { name: /editar/i })
      editBtn.click()
      await findByText('Editar rendimiento')

      const submitBtn = await findByRole('button', { name: 'Aceptar' })
      submitBtn.click()
      expect(await findByText('No se pudo editar')).toBeDefined()
      expect(await findByText('Editar rendimiento')).toBeDefined()
    })
  })

  describe('link transactions', () => {
    const matchingTx = {
      _id: 'tx-match-1',
      date: new Date('2026-06-01').getTime(),
      amount: 42,
      type: 'income',
      category: { _id: 'cat1', name: 'Intereses' },
      note: 'Abono junio'
    }

    it('links the selected transaction and closes the modal on success', async () => {
      server.use(
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({ settlements: [] }))),
        http.get('/yields/:id/matching-transactions', () => HttpResponse.json([matchingTx])),
        http.post('/yields/:id/link-transactions', () => new HttpResponse(null, { status: 204 }))
      )
      const { findByRole, findByText, queryByText } = renderFresh()
      const linkBtn = await findByRole('button', { name: /enlazar movimientos/i })
      linkBtn.click()
      const item = await findByText(/Abono junio/)
      item.click()

      const submitBtn = await findByRole('button', { name: 'Aceptar' })
      submitBtn.click()
      await waitFor(() => expect(queryByText(/Movimientos de/)).toBeNull())
    })

    it('shows an error and keeps the modal open on failure', async () => {
      server.use(
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({ settlements: [] }))),
        http.get('/yields/:id/matching-transactions', () => HttpResponse.json([matchingTx])),
        http.post('/yields/:id/link-transactions', () => HttpResponse.json({ message: 'No se pudo enlazar' }, { status: 400 }))
      )
      const { findByRole, findByText } = renderFresh()
      const linkBtn = await findByRole('button', { name: /enlazar movimientos/i })
      linkBtn.click()
      const item = await findByText(/Abono junio/)
      item.click()

      const submitBtn = await findByRole('button', { name: 'Aceptar' })
      submitBtn.click()
      expect(await findByText('No se pudo enlazar')).toBeDefined()
      expect(await findByText(/Movimientos de/)).toBeDefined()
    })

    it('shows a category filter when the yield tracks more than one category, and narrows results by it', async () => {
      const catA = { _id: 'cat-a', name: 'Intereses', type: 'income' }
      const catB = { _id: 'cat-b', name: 'Comisiones', type: 'expense' }
      server.use(
        http.get('/categories', () => HttpResponse.json([catA, catB])),
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({ settlements: [], categoryIds: [catA._id, catB._id] }))),
        http.get('/yields/:id/matching-transactions', ({ request }) => {
          const categoryId = new URL(request.url).searchParams.get('categoryId')
          return HttpResponse.json(categoryId === catB._id ? [] : [matchingTx])
        })
      )
      const { findByRole, findByText, queryByText } = renderFresh()
      const linkBtn = await findByRole('button', { name: /enlazar movimientos/i })
      linkBtn.click()
      await findByText(/Abono junio/)

      const categorySelect = document.getElementById('categoryFilter') as HTMLSelectElement
      fireEvent.change(categorySelect, { target: { value: catB._id } })

      await waitFor(() => expect(queryByText(/Abono junio/)).toBeNull())
    })
  })

  describe('unlink transaction', () => {
    const entryTx = {
      _id: 'tx-unlink-1',
      date: new Date('2026-05-01').getTime(),
      amount: 30,
      type: 'income',
      category: { _id: 'cat1', name: 'Intereses' },
      note: 'Abono mayo'
    }

    it('removes the entry row after a successful unlink', async () => {
      let unlinked = false
      server.use(
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({
          settlements: unlinked
            ? []
            : [makeInterestSettlement({
                id: 'sett-unlink',
                settlementDate: new Date('2026-05-01').getTime(),
                entries: [entryTx]
              })]
        }))),
        http.delete('/yields/:id/unlink-transactions/:transactionId', () => {
          unlinked = true
          return new HttpResponse(null, { status: 204 })
        })
      )
      const { findByText, findByLabelText, queryByLabelText } = renderFresh()
      const row = await findByText(/2026/)
      row.click()

      const unlinkBtn = await findByLabelText('Desenlazar movimiento')
      unlinkBtn.click()
      await waitFor(() => expect(queryByLabelText('Desenlazar movimiento')).toBeNull())
    })
  })

  describe('edit settlement', () => {
    it('closes the modal after a successful edit', async () => {
      server.use(
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({
          settlements: [makeInterestSettlement({ id: 'sett-edit', settlementDate: new Date('2026-04-01').getTime() })]
        }))),
        http.put('/yields/:id/settlements/:settlementId', () => HttpResponse.json({ id: 'sett-edit', tae: 3, averageBalance: 40000 }))
      )
      const { findByLabelText, findByText, findByRole, queryByText } = renderFresh()
      const editBtn = await findByLabelText(/Editar liquidación/)
      editBtn.click()
      await findByText('Editar Liquidación')

      const submitBtn = await findByRole('button', { name: 'Aceptar' })
      submitBtn.click()
      await waitFor(() => expect(queryByText('Editar Liquidación')).toBeNull())
    })

    it('shows the error and keeps the modal open on failure', async () => {
      server.use(
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({
          settlements: [makeInterestSettlement({ id: 'sett-edit-fail', settlementDate: new Date('2026-04-01').getTime() })]
        }))),
        http.put('/yields/:id/settlements/:settlementId', () => HttpResponse.json({ message: 'No se pudo editar la liquidación' }, { status: 400 }))
      )
      const { findByLabelText, findByText, findByRole } = renderFresh()
      const editBtn = await findByLabelText(/Editar liquidación/)
      editBtn.click()
      await findByText('Editar Liquidación')

      const submitBtn = await findByRole('button', { name: 'Aceptar' })
      submitBtn.click()
      expect(await findByText('No se pudo editar la liquidación')).toBeDefined()
      expect(await findByText('Editar Liquidación')).toBeDefined()
    })
  })

  describe('delete settlement', () => {
    it('closes the confirmation modal after a successful delete', async () => {
      server.use(
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({
          settlements: [makeInterestSettlement({ id: 'sett-delete', settlementDate: new Date('2026-04-01').getTime() })]
        }))),
        http.delete('/yields/:id/settlements/:settlementId', () => new HttpResponse(null, { status: 204 }))
      )
      const { findByLabelText, findByText, findAllByRole, queryByText } = renderFresh()
      const deleteBtn = await findByLabelText(/Eliminar liquidación/)
      deleteBtn.click()
      await findByText('¿Quieres borrar esta liquidación?')

      const confirmBtns = await findAllByRole('button', { name: 'Eliminar' })
      confirmBtns[0].click()
      await waitFor(() => expect(queryByText('¿Quieres borrar esta liquidación?')).toBeNull())
    })

    it('shows the error and keeps the modal open on failure', async () => {
      server.use(
        http.get('/yields/:id', () => HttpResponse.json(makeMockDetail({
          settlements: [makeInterestSettlement({ id: 'sett-delete-fail', settlementDate: new Date('2026-04-01').getTime() })]
        }))),
        http.delete('/yields/:id/settlements/:settlementId', () => HttpResponse.json({ message: 'No se pudo eliminar la liquidación' }, { status: 400 }))
      )
      const { findByLabelText, findByText, findAllByRole } = renderFresh()
      const deleteBtn = await findByLabelText(/Eliminar liquidación/)
      deleteBtn.click()
      await findByText('¿Quieres borrar esta liquidación?')

      const confirmBtns = await findAllByRole('button', { name: 'Eliminar' })
      confirmBtns[0].click()
      expect(await findByText('No se pudo eliminar la liquidación')).toBeDefined()
      expect(await findByText('¿Quieres borrar esta liquidación?')).toBeDefined()
    })
  })
})
