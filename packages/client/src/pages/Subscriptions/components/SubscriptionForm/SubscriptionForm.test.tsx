// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { SWRConfig } from 'swr'
import { fireEvent, waitFor } from '@testing-library/react'
import { render as customRender } from '../../../../test/testUtils'
import SubscriptionForm from '.'
import { Subscription, SubscriptionInput, SUBSCRIPTION_CYCLE } from 'types'

// Mock the data hooks so selects have options and validation can pass on submit.
// Arrays are defined inside the factory closure (not inside the returned hook
// function) so every hook call returns the SAME reference → no infinite loop
// from useEffect deps that include accounts/categories.
vi.mock('hooks/useAccounts', () => {
  const accounts = [{ _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA', balance: 1000 }]
  return { useAccounts: () => ({ accounts, isLoading: false, error: null }) }
})
vi.mock('hooks/useCategories', () => {
  const categories = [{ _id: 'cat-1', name: 'Ocio' }]
  return { useCategories: () => ({ categories, isLoading: false, error: null }) }
})

const mockSubscription: Subscription = {
  _id: 'sub-form-1',
  name: 'HBO Max',
  amount: 8.99,
  cycle: SUBSCRIPTION_CYCLE.MONTHLY,
  nextPaymentDate: null,
  categoryId: { _id: 'cat-1', name: 'Ocio' },
  accountId: { _id: 'acc-1', name: 'Mi cuenta', bank: 'BBVA' }
}

type FormWrapperProps = {
  subscription?: Subscription
  onSubmit?: (data: SubscriptionInput) => Promise<{ error?: string }>
  onClose?: () => void
}

// Wrapper with a sentinel "READY" element so tests can wait for Auth
// to finish its async init before interacting with the form.
const FormWrapper = ({ subscription, onSubmit, onClose }: FormWrapperProps) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div>READY</div>
      <button onClick={() => setOpen(true)}>Abrir</button>
      {open && (
        <SubscriptionForm
          subscription={subscription}
          onSubmit={onSubmit ?? (async () => ({}))}
          onClose={onClose ?? (() => setOpen(false))}
        />
      )}
    </>
  )
}

const renderAndOpen = async (props: FormWrapperProps = {}, editMode = false) => {
  const utils = customRender(
    <SWRConfig value={{ provider: () => new Map() }}>
      <FormWrapper {...props} />
    </SWRConfig>
  )
  await utils.findByText('READY')
  utils.getByText('Abrir').click()
  await utils.findByText(editMode ? 'Editar suscripción' : 'Nueva suscripción')
  return utils
}

describe('SubscriptionForm', () => {
  it('shows "Nueva suscripción" title in creation mode', async () => {
    const { findByText } = await renderAndOpen()
    expect(await findByText('Nueva suscripción')).toBeDefined()
  })

  it('shows "Editar suscripción" title in edit mode', async () => {
    const { findByText } = await renderAndOpen({ subscription: mockSubscription }, true)
    expect(await findByText('Editar suscripción')).toBeDefined()
  })

  it('renders name and amount fields', async () => {
    const { findByLabelText } = await renderAndOpen()
    expect(await findByLabelText('Nombre')).toBeDefined()
    expect(await findByLabelText('Importe (€)')).toBeDefined()
  })

  it('shows cancel and accept buttons', async () => {
    const { findByText } = await renderAndOpen()
    expect(await findByText('Cancelar')).toBeDefined()
    expect(await findByText('Aceptar')).toBeDefined()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn()
    const { findByText } = await renderAndOpen({ onClose })
    const cancelBtn = await findByText('Cancelar')
    cancelBtn.click()
    expect(onClose).toHaveBeenCalled()
  })

  it('shows cycle options Mensual and Anual', async () => {
    const { findByText } = await renderAndOpen()
    expect(await findByText('Mensual')).toBeDefined()
    expect(await findByText('Anual')).toBeDefined()
  })

  it('pre-fills name field in edit mode', async () => {
    const { findByDisplayValue } = await renderAndOpen({ subscription: mockSubscription }, true)
    expect(await findByDisplayValue('HBO Max')).toBeDefined()
  })

  it('pre-fills amount field in edit mode', async () => {
    const { findByDisplayValue } = await renderAndOpen({ subscription: mockSubscription }, true)
    expect(await findByDisplayValue('8.99')).toBeDefined()
  })

  it('calls onSubmit when form is submitted', async () => {
    // Use edit mode so all required fields are pre-filled with valid data.
    const onSubmit = vi.fn().mockResolvedValue({})
    const utils = await renderAndOpen({ subscription: mockSubscription, onSubmit }, true)

    // Confirm fields are stable before submitting
    await utils.findByDisplayValue('HBO Max')

    // Submit via the form element directly to avoid portal/userEvent issues
    const form = document.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })

  // ── Validación ────────────────────────────────────────────────────────────
  it('shows validation error when name is empty and form is submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    await renderAndOpen({ onSubmit })
    fireEvent.submit(document.querySelector('form')!)
    // react-hook-form prevents submit and shows error text
    await waitFor(() => expect(document.body.textContent).toContain('El nombre es obligatorio'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when amount is zero or negative', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    const { findByLabelText } = await renderAndOpen({ onSubmit })
    const nameInput = await findByLabelText('Nombre')
    fireEvent.change(nameInput, { target: { value: 'Test sub' } })
    const amountInput = await findByLabelText('Importe (€)')
    fireEvent.change(amountInput, { target: { value: '0' } })
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(document.body.textContent).toContain('El importe debe ser mayor que 0'))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows error alert when onSubmit returns an error and keeps the form open', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ error: 'Error del servidor' })
    const onClose = vi.fn()
    const utils = await renderAndOpen({ subscription: mockSubscription, onSubmit, onClose }, true)
    await utils.findByDisplayValue('HBO Max')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(await utils.findByText('Error del servidor')).toBeDefined()
    // Modal should NOT have closed
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables the submit button while the form is submitting', async () => {
    let resolveSubmit!: (v: {}) => void
    const onSubmit = vi.fn().mockImplementation(() => new Promise(resolve => { resolveSubmit = resolve }))
    const utils = await renderAndOpen({ subscription: mockSubscription, onSubmit }, true)
    await utils.findByDisplayValue('HBO Max')
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => {
      const btn = utils.getByText('Aceptar').closest('button')
      expect(btn?.hasAttribute('disabled')).toBe(true)
    })
    resolveSubmit({})
  })
})
