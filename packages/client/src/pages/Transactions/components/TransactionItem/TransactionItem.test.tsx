// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { render } from '../../../../test/testUtils'
import TransactionItem from '.'
import type { Transaction } from 'types'

const TRANSACTION: Transaction = {
  _id: 'tx1',
  date: Date.UTC(2025, 2, 15),
  category: { _id: 'cat1', name: 'Comida' },
  amount: 100,
  type: 'expense',
  account: { _id: 'acc1', name: 'Nómina', bank: 'BBVA' },
  tags: []
}

const renderItem = (transaction: Transaction = TRANSACTION) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ul>
        <TransactionItem transaction={transaction} query='' />
      </ul>
    </SWRConfig>
  )

describe('TransactionItem', () => {
  it('renders the main category without a split badge', async () => {
    const { getByText, queryByText } = renderItem()
    await waitFor(() => {
      expect(getByText('Comida')).toBeDefined()
    })
    expect(queryByText(/Dividida/)).toBeNull()
  })

  it('shows tags from split lines in the row', async () => {
    const { getByText, queryByText } = renderItem({
      ...TRANSACTION,
      tags: [],
      splits: [
        { _id: 's1', category: { _id: 'cat1', name: 'Comida' }, amount: 65, tags: ['comida'] },
        { _id: 's2', category: { _id: 'cat2', name: 'Hogar' }, amount: 35, tags: ['hogar'] }
      ]
    })
    await waitFor(() => {
      expect(getByText('comida')).toBeDefined()
      expect(getByText('hogar')).toBeDefined()
    })
    expect(queryByText('carrefour')).toBeNull()
  })

  it('shows a split badge when the transaction has multiple categories', async () => {
    const { getByText } = renderItem({
      ...TRANSACTION,
      splits: [
        { _id: 's1', category: { _id: 'cat1', name: 'Comida' }, amount: 65 },
        { _id: 's2', category: { _id: 'cat2', name: 'Hogar' }, amount: 35 }
      ]
    })
    await waitFor(() => {
      expect(getByText('Dividida (2 categorías)')).toBeDefined()
    })
  })
})
