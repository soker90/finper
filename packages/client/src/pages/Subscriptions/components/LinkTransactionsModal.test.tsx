// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { server } from '../../../mock/server'
import { render } from '../../../test/testUtils'
import LinkTransactionsModal from './LinkTransactionsModal'
import { Subscription, SubscriptionCycle, TransactionType } from 'types'

const NOW = Date.now()

const mockSubscription: Subscription = {
  _id: 'sub-lm-1',
  name: 'Spotify',
  amount: 4.99,
  cycle: SubscriptionCycle.MONTHLY,
  nextPaymentDate: null,
  categoryId: { _id: 'cat-1', name: 'Ocio' },
  accountId: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
}

const mockTransactions = [
  {
    _id: 'tx-1',
    date: NOW - 30 * 86400000,
    amount: 4.99,
    type: TransactionType.Expense,
    category: { _id: 'cat-1', name: 'Ocio' },
    account: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
  },
  {
    _id: 'tx-2',
    date: NOW - 60 * 86400000,
    amount: 4.99,
    type: TransactionType.Expense,
    category: { _id: 'cat-1', name: 'Ocio' },
    account: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
  }
]

const renderModal = (props = {}) =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <LinkTransactionsModal
        subscription={mockSubscription}
        onClose={vi.fn()}
        onLinked={vi.fn()}
        {...props}
      />
    </SWRConfig>
  )

describe('LinkTransactionsModal', () => {
  // ── Estado de carga ───────────────────────────────────────────────────────
  it('renders the modal title immediately without waiting for data', () => {
    // Verifies the modal mounts synchronously with the subscription name
    const { getByText } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <LinkTransactionsModal
          subscription={mockSubscription}
          onClose={vi.fn()}
          onLinked={vi.fn()}
        />
      </SWRConfig>
    )
    expect(getByText('Pagos de Spotify')).toBeDefined()
  })

  // ── Estado vacío ──────────────────────────────────────────────────────────
  it('shows empty state when there are no matching transactions', async () => {
    const { findByText } = renderModal()
    expect(await findByText(/No hay movimientos sin asignar/i)).toBeDefined()
  })

  // ── Lista de transacciones ────────────────────────────────────────────────
  it('renders a row per matching transaction', async () => {
    server.use(
      http.get('/subscriptions/sub-lm-1/matching-transactions', () =>
        HttpResponse.json(mockTransactions)
      )
    )
    const { findAllByRole } = renderModal()
    const rows = await findAllByRole('checkbox')
    expect(rows.length).toBe(2)
  })

  it('shows category and account for each transaction', async () => {
    server.use(
      http.get('/subscriptions/sub-lm-1/matching-transactions', () =>
        HttpResponse.json(mockTransactions)
      )
    )
    const { findAllByText } = renderModal()
    const ocioLabels = await findAllByText(/Ocio.*Mi cuenta|Mi cuenta.*Ocio/)
    expect(ocioLabels.length).toBeGreaterThanOrEqual(1)
  })

  // ── Interacción ───────────────────────────────────────────────────────────
  it('submit button is disabled when no transaction is selected', async () => {
    server.use(
      http.get('/subscriptions/sub-lm-1/matching-transactions', () =>
        HttpResponse.json(mockTransactions)
      )
    )
    const { findByText } = renderModal()
    const submitBtn = await findByText('Aceptar')
    expect(submitBtn.closest('button')).toHaveProperty('disabled', true)
  })

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn()
    const { findByText } = renderModal({ onClose })
    const cancelBtn = await findByText('Cancelar')
    cancelBtn.click()
    expect(onClose).toHaveBeenCalled()
  })

  it('shows modal title with subscription name', async () => {
    const { findByText } = renderModal()
    expect(await findByText('Pagos de Spotify')).toBeDefined()
  })

  // ── Selección y submit ────────────────────────────────────────────────────
  it('enables the submit button when a transaction is selected', async () => {
    server.use(
      http.get('/subscriptions/sub-lm-1/matching-transactions', () => HttpResponse.json(mockTransactions))
    )
    const { findAllByRole, findByText } = renderModal()
    const checkboxes = await findAllByRole('checkbox')
    const listItem = checkboxes[0].closest('li')
    if (listItem) listItem.click()
    const submitBtn = await findByText('Aceptar')
    await waitFor(() => expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false))
  })

  it('calls link endpoint with selected ids and closes modal on success', async () => {
    server.use(
      http.get('/subscriptions/sub-lm-1/matching-transactions', () => HttpResponse.json(mockTransactions))
    )
    let capturedBody: any
    server.use(
      http.post('/subscriptions/sub-lm-1/link-transactions', async ({ request }) => {
        capturedBody = await request.json()
        return new HttpResponse(null, { status: 204 })
      })
    )
    const onClose = vi.fn()
    const onLinked = vi.fn()
    const { findAllByRole, findByText } = renderModal({ onClose, onLinked })

    // Select first transaction
    const checkboxes = await findAllByRole('checkbox')
    const listItem = checkboxes[0].closest('li')
    if (listItem) listItem.click()

    // Wait for button to enable and click it
    const submitBtn = await findByText('Aceptar')
    await waitFor(() => expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false))
    submitBtn.closest('button')!.click()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onLinked).toHaveBeenCalled()
    expect(capturedBody).toMatchObject({ transactionIds: ['tx-1'] })
  })

  it('shows error alert when the link operation fails', async () => {
    server.use(
      http.get('/subscriptions/sub-lm-1/matching-transactions', () => HttpResponse.json(mockTransactions))
    )
    server.use(
      http.post('/subscriptions/sub-lm-1/link-transactions', () =>
        HttpResponse.json({}, { status: 500 })
      )
    )
    const onClose = vi.fn()
    const { findAllByRole, findByText } = renderModal({ onClose })

    const checkboxes = await findAllByRole('checkbox')
    const listItem = checkboxes[0].closest('li')
    if (listItem) listItem.click()

    const submitBtn = await findByText('Aceptar')
    await waitFor(() => expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false))
    submitBtn.closest('button')!.click()

    // Error alert should appear and modal should stay open
    await waitFor(() => expect(document.querySelector('[role="alert"][class*="MuiAlert"]')).not.toBeNull())
    expect(onClose).not.toHaveBeenCalled()
  })
})
