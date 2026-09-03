// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { render } from '../../../test/testUtils'
import { CreditCardMovementEdit } from './CreditCardMovementEdit'
import type { CreditCardMovement } from 'types'

vi.mock('hooks', () => ({
  useGroupedCategories: () => ({
    categories: [{ _id: 'parent', name: 'Casa', children: [{ _id: 'cat1', name: 'Comida' }, { _id: 'cat2', name: 'Hogar' }] }]
  }),
  useStores: () => ({ stores: [] }),
  useAvailableTags: () => ({ tags: [] })
}))

vi.mock('../hooks/useCreditCards', () => ({
  useCreditCardMutate: () => () => {}
}))

const editCreditCardMovement = vi.fn<(creditCardId: string, movementId: string, params: unknown) => Promise<{ data: object }>>(async () => ({ data: {} }))
const deleteCreditCardMovement = vi.fn<(creditCardId: string, movementId: string) => Promise<{ data: object }>>(async () => ({ data: {} }))

vi.mock('services/apiService', () => ({
  editCreditCardMovement: (creditCardId: string, movementId: string, params: unknown) =>
    editCreditCardMovement(creditCardId, movementId, params),
  deleteCreditCardMovement: (creditCardId: string, movementId: string) =>
    deleteCreditCardMovement(creditCardId, movementId)
}))

const MOVEMENT: CreditCardMovement = {
  _id: 'm1',
  id: 'm1',
  creditCardId: 'c1',
  date: Date.UTC(2025, 2, 15),
  amount: 100,
  type: 'expense',
  categoryId: 'cat1',
  category: { _id: 'cat1', name: 'Comida', type: 'expense' },
  status: 'pending',
  tags: [],
  user: 'testuser'
}

const renderForm = (movement: CreditCardMovement = MOVEMENT) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <CreditCardMovementEdit movement={movement} hideForm={() => {}} />
    </SWRConfig>
  )

describe('CreditCardMovementEdit splits', () => {
  beforeEach(() => {
    editCreditCardMovement.mockClear()
    deleteCreditCardMovement.mockClear()
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
    const { getByText, container } = renderForm()
    fireEvent.click(getByText('Dividir movimiento'))
    const amountInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[id^="splits."][id$=".amount"]'))
    const categoryInputs = Array.from(document.querySelectorAll<HTMLSelectElement>('select[id^="splits."][id$=".categoryId"]'))
    fireEvent.change(categoryInputs[0], { target: { value: 'cat1' } })
    fireEvent.change(categoryInputs[1], { target: { value: 'cat2' } })
    fireEvent.change(amountInputs[0], { target: { value: '65' } })
    fireEvent.click(getByText('Asignar resto'))
    fireEvent.submit(container.querySelector('form')!)
    await vi.waitFor(() => {
      expect(editCreditCardMovement).toHaveBeenCalled()
    })
    const payload = editCreditCardMovement.mock.calls[0][2] as { splits: Array<{ amount: number, categoryId: string }>, tags: string[] }
    expect(payload.splits).toHaveLength(2)
    expect(payload.splits[0].categoryId).toBe('cat1')
    expect(payload.tags).toEqual([])
  })
})
