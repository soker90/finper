// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { server } from '../../../mock/server'
import { render } from '../../../test/testUtils'
import { MOCK_SIMULATION_RESULT } from '../../../mock/fixtures/loan-simulation'
import LoanSimulator from './LoanSimulator'

const renderSimulator = (props: Partial<Parameters<typeof LoanSimulator>[0]> = {}) => {
  const defaultProps = {
    loanId: 'loan1',
    monthlyPayment: 200,
    pendingAmount: 10000,
    ...props
  }
  return render(<LoanSimulator {...defaultProps} />)
}

const getAmountInput = (): HTMLInputElement => screen.getByRole('spinbutton', { name: 'Importe' })

describe('LoanSimulator', () => {
  it('renders the simulator title', () => {
    renderSimulator()
    expect(screen.getByText('Simulador de amortización')).toBeDefined()
  })

  it('renders the slider and input', () => {
    renderSimulator()
    expect(getAmountInput()).toBeDefined()
  })

  it('does not call API when lumpSum is 0', () => {
    let called = false
    server.use(
      http.post('/loans/loan1/simulate-payoff', () => {
        called = true
        return HttpResponse.json(MOCK_SIMULATION_RESULT)
      })
    )
    renderSimulator()
    expect(called).toBe(false)
  })

  it('calls the API with debounced value after input interaction', async () => {
    let capturedBody: { lumpSum?: number } | null = null
    server.use(
      http.post('/loans/loan1/simulate-payoff', async ({ request }) => {
        capturedBody = await request.json() as { lumpSum?: number }
        return HttpResponse.json(MOCK_SIMULATION_RESULT)
      })
    )

    renderSimulator()
    fireEvent.change(getAmountInput(), { target: { value: '2000' } })

    await waitFor(() => {
      expect(capturedBody).toEqual({ lumpSum: 2000 })
    }, { timeout: 2000 })
  })

  it('displays both options after successful API call', async () => {
    server.use(
      http.post('/loans/loan1/simulate-payoff', () => {
        return HttpResponse.json(MOCK_SIMULATION_RESULT)
      })
    )

    renderSimulator()
    fireEvent.change(getAmountInput(), { target: { value: '2000' } })

    await waitFor(() => {
      expect(screen.getByText('Reducir tiempo')).toBeDefined()
      expect(screen.getByText('Reducir cuota')).toBeDefined()
      expect(screen.getByText(/1 año/)).toBeDefined()
      expect(screen.getByText(/500/)).toBeDefined()
      expect(screen.getByText(/30.*mes/)).toBeDefined()
      expect(screen.getByText(/300/)).toBeDefined()
    }, { timeout: 2000 })
  })

  it('displays error when API call fails', async () => {
    server.use(
      http.post('/loans/loan1/simulate-payoff', () => {
        return HttpResponse.json({ message: 'Error' }, { status: 422 })
      })
    )

    renderSimulator()
    fireEvent.change(getAmountInput(), { target: { value: '2000' } })

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeDefined()
    }, { timeout: 2000 })
  })

  it('syncs slider and input values', () => {
    renderSimulator()
    fireEvent.change(getAmountInput(), { target: { value: '2500' } })
    expect(getAmountInput().value).toBe('2500')
  })

  it('clamps input value to pendingAmount maximum', () => {
    renderSimulator()
    fireEvent.change(getAmountInput(), { target: { value: '15000' } })
    expect(getAmountInput().value).toBe('10000')
  })

  it('sets lumpSum to 0 when input is cleared', () => {
    renderSimulator()
    fireEvent.change(getAmountInput(), { target: { value: '2000' } })
    fireEvent.change(getAmountInput(), { target: { value: '' } })
    expect(getAmountInput().value).toBe('0')
  })
})
