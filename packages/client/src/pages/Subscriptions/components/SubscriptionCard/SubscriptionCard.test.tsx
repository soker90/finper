// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { server } from '../../../../mock/server'
import { render } from '../../../../test/testUtils'
import SubscriptionCard from '.'
import { Subscription, SUBSCRIPTION_CYCLE, TRANSACTION } from 'types'

const NOW = Date.now()
const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000

const mockSubscription: Subscription = {
  _id: 'sub-test-1',
  name: 'Netflix',
  amount: 9.99,
  cycle: SUBSCRIPTION_CYCLE.MONTHLY,
  nextPaymentDate: NOW + FIVE_DAYS,
  categoryId: { _id: 'cat-1', name: 'Ocio' },
  accountId: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
}

const defaultProps = {
  subscription: mockSubscription,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onSearchPayments: vi.fn(),
  onUnlinkTransaction: vi.fn()
}

const renderCard = (props = {}) =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <SubscriptionCard {...defaultProps} {...props} />
    </SWRConfig>
  )

describe('SubscriptionCard', () => {
  // ── Contenido básico ──────────────────────────────────────────────────────
  it('shows the subscription name', () => {
    const { getByText } = renderCard()
    expect(getByText('Netflix')).toBeDefined()
  })

  it('shows the amount', () => {
    const { getByText } = renderCard()
    expect(getByText(/9,99\s*€/)).toBeDefined()
  })

  it('shows the cycle label', () => {
    const { getByText } = renderCard()
    expect(getByText(/Mensual/i)).toBeDefined()
  })

  it('shows initials avatar when no logoUrl', () => {
    const { getByText } = renderCard()
    // Avatar renders the initial as text when src is absent/empty
    expect(getByText('N')).toBeDefined()
  })

  // ── Chip de próximo pago ──────────────────────────────────────────────────
  it('shows future days chip when nextPaymentDate is in the future', () => {
    const { getByText } = renderCard()
    expect(getByText('En 5d')).toBeDefined()
  })

  it('shows "Vencida" chip when nextPaymentDate is in the past', () => {
    const { getByText } = renderCard({
      subscription: { ...mockSubscription, nextPaymentDate: NOW - FIVE_DAYS }
    })
    expect(getByText(/Vencida hace/)).toBeDefined()
  })

  it('shows "Sin pagos registrados" when nextPaymentDate is null', () => {
    const { getByText } = renderCard({
      subscription: { ...mockSubscription, nextPaymentDate: null }
    })
    expect(getByText('Sin pagos registrados')).toBeDefined()
  })

  // ── Sección de pagos vinculados ───────────────────────────────────────────
  it('does not show payments section when no transactions are linked', () => {
    const { queryByText } = renderCard()
    expect(queryByText('Últimos pagos')).toBeNull()
  })

  it('shows up to 3 linked payments', async () => {
    const transactions = [1, 2, 3, 4].map((i) => ({
      _id: `tx-${i}`,
      date: NOW - i * 24 * 60 * 60 * 1000,
      amount: 9.99,
      type: TRANSACTION.Expense,
      category: { _id: 'cat-1', name: 'Ocio' },
      account: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
    }))
    server.use(
      http.get('/subscriptions/sub-test-1/transactions', () =>
        HttpResponse.json(transactions)
      )
    )
    const { findByText, queryAllByRole } = renderCard()
    expect(await findByText('Últimos pagos')).toBeDefined()
    // 4 transactions exist but only max 3 should be rendered
    const unlinkButtons = queryAllByRole('button', { name: /desvincular/i })
    expect(unlinkButtons.length).toBeLessThanOrEqual(3)
  })

  // ── Callbacks ────────────────────────────────────────────────────────────
  it('calls onSearchPayments when search button is clicked', async () => {
    const onSearchPayments = vi.fn()
    const { getByRole } = renderCard({ onSearchPayments })
    getByRole('button', { name: /buscar pagos anteriores/i }).click()
    expect(onSearchPayments).toHaveBeenCalledWith(mockSubscription)
  })

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    const { getByRole } = renderCard({ onEdit })
    getByRole('button', { name: /editar/i }).click()
    expect(onEdit).toHaveBeenCalledWith(mockSubscription)
  })

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn()
    const { getByRole } = renderCard({ onDelete })
    getByRole('button', { name: /eliminar/i }).click()
    expect(onDelete).toHaveBeenCalledWith(mockSubscription)
  })

  it('calls onUnlinkTransaction with correct ids when unlink button is clicked', async () => {
    const onUnlinkTransaction = vi.fn()
    const transactions = [
      {
        _id: 'tx-unlink',
        date: NOW - 86400000,
        amount: 9.99,
        type: TRANSACTION.Expense,
        category: { _id: 'cat-1', name: 'Ocio' },
        account: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
      }
    ]
    server.use(
      http.get('/subscriptions/sub-test-1/transactions', () =>
        HttpResponse.json(transactions)
      )
    )
    const { findAllByRole } = renderCard({ onUnlinkTransaction })
    const unlinkButtons = await findAllByRole('button', { name: /desvincular/i })
    unlinkButtons[0].click()
    expect(onUnlinkTransaction).toHaveBeenCalledWith('sub-test-1', 'tx-unlink')
  })
})
