// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { server } from '../../../../mock/server'
import { render } from '../../../../test/testUtils'
import LinkTransactionsModal from '.'
import { Subscription, TRANSACTION } from 'types'

const NOW = Date.now()

const mockSubscription: Subscription = {
  _id: 'sub-lm-1',
  name: 'Spotify',
  amount: 4.99,
  cycle: 1,
  nextPaymentDate: null,
  categoryId: { _id: 'cat-1', name: 'Ocio' },
  accountId: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
}

const mockTransactions = [
  {
    _id: 'tx-1',
    date: NOW - 30 * 86400000,
    amount: 4.99,
    type: TRANSACTION.Expense,
    category: { _id: 'cat-1', name: 'Ocio' },
    account: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
  },
  {
    _id: 'tx-2',
    date: NOW - 60 * 86400000,
    amount: 4.99,
    type: TRANSACTION.Expense,
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

const withTransactions = () =>
  server.use(
    http.get('/subscriptions/sub-lm-1/matching-transactions', () =>
      HttpResponse.json(mockTransactions)
    )
  )

describe('LinkTransactionsModal', () => {
  // ── Título ────────────────────────────────────────────────────────────────
  it('renders the modal title synchronously before data loads', () => {
    // getByText (no findByText) verifica que el título está presente sin esperar la API
    const { getByText } = renderModal()
    expect(getByText('Pagos de Spotify')).toBeDefined()
  })

  // ── Estado vacío ──────────────────────────────────────────────────────────
  it('shows empty state when there are no matching transactions', async () => {
    const { findByText } = renderModal()
    expect(await findByText(/No hay movimientos sin asignar/i)).toBeDefined()
  })

  // ── Lista de transacciones ────────────────────────────────────────────────
  it('renders a row per matching transaction', async () => {
    withTransactions()
    const { findAllByRole } = renderModal()
    const rows = await findAllByRole('checkbox')
    expect(rows.length).toBe(2)
  })

  // ── Interacción ───────────────────────────────────────────────────────────
  it('submit button is disabled when no transaction is selected', async () => {
    withTransactions()
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

  // ── Selección y submit ────────────────────────────────────────────────────
  it('enables the submit button when a transaction is selected', async () => {
    withTransactions()
    const { findAllByRole, findByText } = renderModal()
    const checkboxes = await findAllByRole('checkbox')
    const listItem = checkboxes[0].closest('li')
    if (listItem) listItem.click()
    const submitBtn = await findByText('Aceptar')
    await waitFor(() => expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false))
  })

  it('calls link endpoint with selected ids and closes modal on success', async () => {
    withTransactions()
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

    const checkboxes = await findAllByRole('checkbox')
    const listItem = checkboxes[0].closest('li')
    if (listItem) listItem.click()

    const submitBtn = await findByText('Aceptar')
    await waitFor(() => expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false))
    submitBtn.closest('button')!.click()

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(onLinked).toHaveBeenCalled()
    expect(capturedBody).toMatchObject({ transactionIds: ['tx-1'] })
  })

  it('shows error alert when the link operation fails', async () => {
    withTransactions()
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

    await waitFor(() => expect(document.querySelector('[role="alert"][class*="MuiAlert"]')).not.toBeNull())
    expect(onClose).not.toHaveBeenCalled()
  })
})
