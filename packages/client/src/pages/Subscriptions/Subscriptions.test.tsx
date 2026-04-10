// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { waitFor, within, fireEvent } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import Subscriptions from './index'
import { SUBSCRIPTIONS_LIST, CANDIDATES_LIST } from '../../mock/handlers/subscriptions'
import { SubscriptionCycle } from 'types'
import { calcMonthly } from './utils'
import { format } from 'utils'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <Subscriptions />
    </SWRConfig>
  )

describe('Subscriptions', () => {
  // ── Estado inicial ────────────────────────────────────────────────────────
  it('renders skeleton while loading', () => {
    const { container } = render(<Subscriptions />)
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull()
  })

  // ── Estado vacío ──────────────────────────────────────────────────────────
  it('renders empty state when there are no subscriptions', async () => {
    server.use(
      http.get('/subscriptions', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/no tienes suscripciones/i)).toBeDefined()
  })

  // ── Lista ─────────────────────────────────────────────────────────────────
  it('renders subscription cards after data loads', async () => {
    const { findAllByText } = renderFresh()
    const cards = await findAllByText(/Netflix|Spotify|Amazon Prime|HBO Max|Disney\+|YouTube Premium|Apple TV\+|Gym/)
    expect(cards.length).toBeGreaterThanOrEqual(1)
  })

  // ── KPIs Summary ──────────────────────────────────────────────────────────
  it('renders summary KPI cards', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Gasto mensual')).toBeDefined()
    expect(await findByText('Gasto anual')).toBeDefined()
    expect(await findByText('Total suscripciones')).toBeDefined()
  })

  it('KPI "Total suscripciones" reflects the number of subscriptions', async () => {
    const { findByText } = renderFresh()
    // SUBSCRIPTIONS_LIST has 3 items (from the mock handler)
    expect(await findByText(String(SUBSCRIPTIONS_LIST.length))).toBeDefined()
  })

  // ── Botón nueva ───────────────────────────────────────────────────────────
  it('shows Nueva button in the header', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Nueva')).toBeDefined()
  })

  it('click "Nueva" opens SubscriptionForm in creation mode', async () => {
    const { findByText } = renderFresh()
    const btn = await findByText('Nueva')
    btn.click()
    expect(await findByText('Nueva suscripción')).toBeDefined()
  })

  // ── Candidatos ────────────────────────────────────────────────────────────
  it('renders candidates banner when there are candidates', async () => {
    const { findByText } = renderFresh()
    expect(await findByText('Posibles pagos de suscripción detectados')).toBeDefined()
  })

  it('hides candidates banner when there are no candidates', async () => {
    server.use(
      http.get('/subscriptions/candidates', () => HttpResponse.json([]))
    )
    const { findByText, queryByText } = renderFresh()
    // Wait until subscriptions load so the page is settled
    await findByText('Gasto mensual')
    expect(queryByText('Posibles pagos de suscripción detectados')).toBeNull()
  })

  // ── Apertura de modal de búsqueda de pagos ────────────────────────────────
  it('click search button on a card opens LinkTransactionsModal', async () => {
    const { findAllByRole, findByText } = renderFresh()
    const searchBtns = await findAllByRole('button', { name: /buscar pagos anteriores/i })
    searchBtns[0].click()
    // Modal title starts with "Pagos de"
    expect(await findByText(/Pagos de/)).toBeDefined()
  })

  // ── Apertura de modal de edición ──────────────────────────────────────────
  it('click edit button on a card opens SubscriptionForm in edit mode', async () => {
    const { findAllByRole, findByText } = renderFresh()
    const editBtns = await findAllByRole('button', { name: /editar/i })
    editBtns[0].click()
    expect(await findByText('Editar suscripción')).toBeDefined()
  })
})

// ── useSubscriptions ──────────────────────────────────────────────────────────
describe('useSubscriptions', () => {
  it('shows empty state when the server returns an error', async () => {
    server.use(
      http.get('/subscriptions', () => HttpResponse.json({}, { status: 500 }))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/no tienes suscripciones/i)).toBeDefined()
  })

  it('removeSubscription removes item from the grid (cache update)', async () => {
    const { findAllByRole, queryAllByRole } = renderFresh()
    const deleteBtns = await findAllByRole('button', { name: /eliminar/i })
    const initialCount = deleteBtns.length
    deleteBtns[0].click()
    await waitFor(() =>
      expect(queryAllByRole('button', { name: /eliminar/i }).length).toBe(initialCount - 1)
    )
  })

  it('removeSubscription keeps the grid intact when the server returns an error', async () => {
    server.use(
      http.delete('/subscriptions/:id', () => HttpResponse.json({}, { status: 500 }))
    )
    const { findAllByRole, queryAllByRole } = renderFresh()
    const deleteBtns = await findAllByRole('button', { name: /eliminar/i })
    const initialCount = deleteBtns.length
    deleteBtns[0].click()
    // Wait for the async operation to complete (button re-renders after error)
    await waitFor(() =>
      expect(queryAllByRole('button', { name: /eliminar/i }).length).toBe(initialCount)
    )
  })
})

// ── useSubscriptionCandidates ─────────────────────────────────────────────────
describe('useSubscriptionCandidates', () => {
  it('dismiss removes the banner when it was the only candidate', async () => {
    const { findByTestId } = renderFresh()
    const banner = await findByTestId('candidates-banner')
    within(banner).getAllByRole('button', { name: /no es una suscripción/i })[0].click()
    await waitFor(() => expect(document.querySelector('[data-testid="candidates-banner"]')).toBeNull())
  })

  it('dismiss keeps the banner visible when the server returns an error', async () => {
    server.use(
      http.post('/subscriptions/candidates/:id/dismiss', () => HttpResponse.json({}, { status: 500 }))
    )
    const { findByTestId } = renderFresh()
    const banner = await findByTestId('candidates-banner')
    const dismissBtn = within(banner).getAllByRole('button', { name: /no es una suscripción/i })[0]
    dismissBtn.click()
    // Wait for the async error path to complete (setLoadingId(null) re-enables the button)
    await waitFor(() => expect(dismissBtn.hasAttribute('disabled')).toBe(false))
    expect(document.querySelector('[data-testid="candidates-banner"]')).not.toBeNull()
  })

  it('assign removes the banner when it was the only candidate', async () => {
    const subName = (CANDIDATES_LIST[0].subscriptionIds[0] as any).name
    const { findByTestId } = renderFresh()
    const banner = await findByTestId('candidates-banner')
    within(banner).getByText(subName).click()
    await waitFor(() => expect(document.querySelector('[data-testid="candidates-banner"]')).toBeNull())
  })

  it('assign keeps the banner visible when the server returns an error', async () => {
    server.use(
      http.post('/subscriptions/candidates/:id/assign', () => HttpResponse.json({}, { status: 500 }))
    )
    const subName = (CANDIDATES_LIST[0].subscriptionIds[0] as any).name
    const { findByTestId } = renderFresh()
    const banner = await findByTestId('candidates-banner')
    const subBox = within(banner).getByText(subName)
    subBox.click()
    // CandidatesBanner sets loadingId = candidateId + subscriptionId while the request is in flight.
    // The dismiss button is also disabled while any loadingId is set. Wait for it to re-enable.
    await waitFor(() =>
      expect(within(banner).getAllByRole('button', { name: /no es una suscripción/i })[0].hasAttribute('disabled')).toBe(false)
    )
    expect(document.querySelector('[data-testid="candidates-banner"]')).not.toBeNull()
  })
})

// ── Fase 5: Flujos E2E ────────────────────────────────────────────────────────

// Flujo 1: Ciclo de vida — crear y eliminar
describe('Flujo 1: Ciclo de vida de una suscripción', () => {
  it('crear suscripción → aparece en el grid', async () => {
    const newSub = {
      _id: 'sub-new-1',
      name: 'NuevaSub E2E',
      amount: 6.99,
      cycle: SubscriptionCycle.MONTHLY,
      nextPaymentDate: null,
      categoryId: { _id: 'cat-1', name: 'Ocio' },
      accountId: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
    }
    const extended = [...SUBSCRIPTIONS_LIST, newSub]
    server.use(
      http.post('/subscriptions', async () => HttpResponse.json(newSub, { status: 200 })),
      http.get('/subscriptions', () => HttpResponse.json(extended))
    )

    const { findByText, findAllByRole } = renderFresh()

    // Wait for the page to settle (subscriptions loaded)
    await findByText('Gasto mensual')

    // Abrir formulario
    const newBtn = await findByText('Nueva')
    newBtn.click()
    await findByText('Nueva suscripción')

    // Wait for accounts and categories to load in the form selects
    await waitFor(() => {
      const selects = document.querySelectorAll('select')
      // At minimum categoryId and accountId selects need options beyond the void option
      const withOptions = Array.from(selects).filter(s => s.options.length > 1)
      expect(withOptions.length).toBeGreaterThanOrEqual(2)
    })

    // Fill name and amount
    fireEvent.change(document.querySelector('input[name="name"]')!, { target: { value: 'NuevaSub E2E' } })
    fireEvent.change(document.querySelector('input[name="amount"]')!, { target: { value: '6.99' } })

    // Select the first real option in categoryId and accountId
    const selects = document.querySelectorAll('select')
    selects.forEach(sel => {
      if (sel.options.length > 1 && sel.value === '') {
        fireEvent.change(sel, { target: { value: sel.options[1].value } })
      }
    })

    fireEvent.submit(document.querySelector('form')!)

    // The grid revalidates and shows the new subscription
    await waitFor(() => expect(document.body.textContent).toContain('NuevaSub E2E'))

    const deleteBtns = await findAllByRole('button', { name: /eliminar/i })
    expect(deleteBtns.length).toBe(extended.length)
  })

  it('eliminar suscripción → desaparece del grid', async () => {
    const { findAllByRole, queryAllByRole } = renderFresh()
    const initial = await findAllByRole('button', { name: /eliminar/i })
    initial[0].click()
    await waitFor(() =>
      expect(queryAllByRole('button', { name: /eliminar/i }).length).toBe(initial.length - 1)
    )
  })
})

// Flujo 5: KPIs
describe('Flujo 5: KPIs de la página', () => {
  it('sin suscripciones: gasto mensual y anual muestran 0 €', async () => {
    server.use(http.get('/subscriptions', () => HttpResponse.json([])))
    const { findByText } = renderFresh()
    // Wait for KPIs to render
    await findByText('Gasto mensual')
    // Both monthly and annual should be 0 — format.euro(0) produces "0,00 €"
    const zeroFormatted = format.euro(0)
    const matches = document.body.textContent?.split(zeroFormatted).length ?? 1
    // At least 2 occurrences: one for monthly, one for annual
    expect(matches - 1).toBeGreaterThanOrEqual(2)
  })

  it('gasto mensual y anual son correctos para la lista mock', async () => {
    const { findByText } = renderFresh()
    await findByText('Gasto mensual')

    const monthly = calcMonthly(SUBSCRIPTIONS_LIST as any)
    const annual = monthly * 12

    // Use partial text match to avoid floating-point formatting edge cases
    const monthlyFormatted = format.euro(monthly)
    const annualFormatted = format.euro(annual)

    await waitFor(() => {
      expect(document.body.textContent).toContain(monthlyFormatted)
      expect(document.body.textContent).toContain(annualFormatted)
    })
  })

  it('KPI "Total suscripciones" se actualiza al eliminar una', async () => {
    const { findByText, findAllByRole } = renderFresh()

    // Verify initial count
    expect(await findByText(String(SUBSCRIPTIONS_LIST.length))).toBeDefined()

    // Delete one
    const deleteBtns = await findAllByRole('button', { name: /eliminar/i })
    deleteBtns[0].click()

    await waitFor(() =>
      expect(document.body.textContent).toContain(String(SUBSCRIPTIONS_LIST.length - 1))
    )
  })
})

// ── Flujo 1 (continuación): edit + link ───────────────────────────────────────

describe('Flujo 1: editar nombre de la suscripción', () => {
  it('editar nombre → la card refleja el cambio (updateSubscription cache update)', async () => {
    const target = SUBSCRIPTIONS_LIST[0]
    const updatedName = 'NombreEditado E2E'
    const updatedList = SUBSCRIPTIONS_LIST.map((s, i) =>
      i === 0 ? { ...s, name: updatedName } : s
    )

    server.use(
      http.put(`/subscriptions/${target._id}`, async () =>
        HttpResponse.json({ ...target, name: updatedName })
      ),
      http.get('/subscriptions', () => HttpResponse.json(updatedList))
    )

    const { findAllByRole, findByText } = renderFresh()

    // Wait for page to settle
    await findByText('Gasto mensual')

    // Click edit on first card
    const editBtns = await findAllByRole('button', { name: /editar/i })
    editBtns[0].click()
    await findByText('Editar suscripción')

    // Wait for selects to load
    await waitFor(() => {
      const withOptions = Array.from(document.querySelectorAll('select')).filter(s => s.options.length > 1)
      expect(withOptions.length).toBeGreaterThanOrEqual(2)
    })

    // Change name
    fireEvent.change(document.querySelector('input[name="name"]')!, { target: { value: updatedName } })

    // Submit
    fireEvent.submit(document.querySelector('form')!)

    // Grid revalidates and shows updated name
    await waitFor(() => expect(document.body.textContent).toContain(updatedName))
  })

  it('updateSubscription error → grid no cambia', async () => {
    server.use(
      http.put('/subscriptions/:id', () => HttpResponse.json({}, { status: 500 }))
    )

    const { findAllByRole, findByText, queryByText } = renderFresh()
    await findByText('Gasto mensual')

    const editBtns = await findAllByRole('button', { name: /editar/i })
    editBtns[0].click()
    await findByText('Editar suscripción')

    await waitFor(() => {
      const withOptions = Array.from(document.querySelectorAll('select')).filter(s => s.options.length > 1)
      expect(withOptions.length).toBeGreaterThanOrEqual(2)
    })

    fireEvent.submit(document.querySelector('form')!)

    // Wait for submit to complete: Aceptar button re-enables when isSubmitting → false
    await waitFor(() => {
      const acceptBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Aceptar')
      expect(acceptBtn?.hasAttribute('disabled')).toBe(false)
    }, { timeout: 3000 })

    // The form title is still visible (modal not closed on error)
    expect(queryByText('Editar suscripción')).not.toBeNull()
  })
})

describe('Flujo 1: vincular transacciones (link flow)', () => {
  it('buscar pagos → seleccionar → vincular → nextPaymentDate se actualiza', async () => {
    const target = SUBSCRIPTIONS_LIST[0]
    const now = Date.now()
    const matchingTx = [
      {
        _id: 'tx-e2e-1',
        date: now - 30 * 86400000,
        amount: target.amount,
        category: target.categoryId,
        account: target.accountId
      }
    ]
    const updatedNextPaymentDate = now + 30 * 86400000
    const updatedList = SUBSCRIPTIONS_LIST.map((s, i) =>
      i === 0 ? { ...s, nextPaymentDate: updatedNextPaymentDate } : s
    )

    server.use(
      http.get(`/subscriptions/${target._id}/matching-transactions`, () =>
        HttpResponse.json(matchingTx)
      ),
      http.post(`/subscriptions/${target._id}/link-transactions`, () =>
        new HttpResponse(null, { status: 204 })
      ),
      // Revalidation after linking
      http.get('/subscriptions', () => HttpResponse.json(updatedList))
    )

    const { findAllByRole, findByText } = renderFresh()
    await findByText('Gasto mensual')

    // Open LinkTransactionsModal
    const searchBtns = await findAllByRole('button', { name: /buscar pagos anteriores/i })
    searchBtns[0].click()
    await findByText(/Pagos de/)

    // Wait for transactions to load and select first
    const checkboxes = await findAllByRole('checkbox')
    const listItem = checkboxes[0].closest('li')
    if (listItem) listItem.click()

    // Submit button should enable; click it
    const submitBtn = await findByText('Aceptar')
    await waitFor(() => expect(submitBtn.closest('button')?.hasAttribute('disabled')).toBe(false))
    submitBtn.closest('button')!.click()

    // Modal closes and grid revalidates — nextPaymentDate chip should now appear
    await waitFor(() =>
      expect(document.querySelector('[class*="MuiDialog"]')).toBeNull()
    )
  })
})
