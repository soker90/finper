// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { render } from '../../../../test/testUtils'
import TransactionEdit from '.'
import type { Transaction } from 'types'

vi.mock('hooks', () => ({
  useGroupedCategories: () => ({
    categories: [{ _id: 'parent', name: 'Casa', children: [{ _id: 'cat1', name: 'Comida' }, { _id: 'cat2', name: 'Hogar' }] }]
  }),
  useAccounts: () => ({ accounts: [{ _id: 'acc1', name: 'Nómina' }] }),
  useStores: () => ({ stores: [] }),
  useAvailableTags: () => ({ tags: [] })
}))

const addTransaction = vi.fn<(params: unknown) => Promise<{ data: object }>>(async () => ({ data: {} }))
const editTransaction = vi.fn<(id: string, params: unknown) => Promise<{ data: object }>>(async () => ({ data: {} }))
const deleteTransaction = vi.fn<(id: string) => Promise<{ data: object }>>(async () => ({ data: {} }))

vi.mock('services/apiService', () => ({
  addTransaction: (params: unknown) => addTransaction(params),
  editTransaction: (id: string, params: unknown) => editTransaction(id, params),
  deleteTransaction: (id: string) => deleteTransaction(id)
}))

const TRANSACTION: Transaction = {
  _id: 'tx1',
  date: Date.UTC(2025, 2, 15),
  category: { _id: 'cat1', name: 'Comida' },
  amount: 100,
  type: 'expense',
  account: { _id: 'acc1', name: 'Nómina', bank: 'BBVA' },
  tags: []
}

const renderForm = (transaction: Transaction = TRANSACTION) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <TransactionEdit transaction={transaction} hideForm={() => {}} query='' />
    </SWRConfig>
  )

describe('TransactionEdit splits', () => {
  beforeEach(() => {
    addTransaction.mockClear()
    editTransaction.mockClear()
  })

  it('enters split mode from the divide button', () => {
    const { getByText } = renderForm()
    fireEvent.click(getByText('Dividir movimiento'))
    expect(getByText('Desglose')).toBeDefined()
    expect(getByText('Asignar resto')).toBeDefined()
  })

  it('assigns the remaining amount to the last split row', () => {
    const { getByText } = renderForm()
    fireEvent.click(getByText('Dividir movimiento'))
    const amountInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[id^="splits."][id$=".amount"]'))
    expect(amountInputs.length).toBeGreaterThan(0)
    fireEvent.change(amountInputs[0], { target: { value: '65' } })
    fireEvent.click(getByText('Asignar resto'))
    expect(Number(amountInputs[amountInputs.length - 1].value)).toBe(35)
  })

  it('submits splits when the remaining amount is zero', async () => {
    const { getByText } = renderForm()
    fireEvent.click(getByText('Dividir movimiento'))
    const amountInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[id^="splits."][id$=".amount"]'))
    const categoryInputs = Array.from(document.querySelectorAll<HTMLSelectElement>('select[id^="splits."][id$=".category"]'))
    fireEvent.change(categoryInputs[0], { target: { value: 'cat1' } })
    fireEvent.change(categoryInputs[1], { target: { value: 'cat2' } })
    fireEvent.change(amountInputs[0], { target: { value: '65' } })
    fireEvent.change(amountInputs[1], { target: { value: '35' } })
    fireEvent.click(getByText('Guardar'))
    await vi.waitFor(() => {
      expect(editTransaction).toHaveBeenCalled()
    })
    const payload = editTransaction.mock.calls[0][1] as { splits: Array<{ amount: number }> }
    expect(payload.splits).toHaveLength(2)
  })
})
