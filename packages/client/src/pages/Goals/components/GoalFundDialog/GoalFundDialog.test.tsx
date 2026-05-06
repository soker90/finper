// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { server } from '../../../../mock/server'
import { render } from '../../../../test/testUtils'
import GoalFundDialog from './index'

const GOAL = {
  _id: 'g1',
  name: 'Coche',
  targetAmount: 10000,
  currentAmount: 1000,
  color: '#2196F3',
  icon: 'CarOutlined'
}

const renderDialog = (props: Partial<Parameters<typeof GoalFundDialog>[0]> = {}) => {
  const onClose = vi.fn()
  const utils = render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <GoalFundDialog goal={GOAL as any} open mode='fund' onClose={onClose} {...props} />
    </SWRConfig>
  )
  return { ...utils, onClose }
}

describe('GoalFundDialog', () => {
  it('renders the title in fund mode with current and target amounts', () => {
    const { getByText } = renderDialog()
    expect(getByText(/Añadir fondos — Coche/)).toBeDefined()
  })

  it('renders the title in withdraw mode', () => {
    const { getByText } = renderDialog({ mode: 'withdraw' })
    expect(getByText(/Retirar fondos — Coche/)).toBeDefined()
  })

  it('does not render content when "open" is false', () => {
    const { queryByText } = renderDialog({ open: false })
    expect(queryByText(/Añadir fondos — Coche/)).toBeNull()
  })

  it('calls onClose when the cancel button is clicked', () => {
    const { getByText, onClose } = renderDialog()
    fireEvent.click(getByText('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('submits a fund request and closes the dialog on success', async () => {
    let captured: any = null
    server.use(
      http.post('/goals/g1/fund', async ({ request }) => {
        captured = await request.json()
        return HttpResponse.json({ ...GOAL, currentAmount: 1500 })
      })
    )
    const { getByText, onClose } = renderDialog()
    const amountInput = (await screen.findByLabelText(/cantidad/i)) as HTMLInputElement
    fireEvent.change(amountInput, { target: { value: '500' } })
    fireEvent.click(getByText('Aceptar'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(captured).toEqual({ amount: 500 })
  })

  it('submits a withdraw request when mode is "withdraw"', async () => {
    let hit = false
    server.use(
      http.post('/goals/g1/withdraw', async ({ request }) => {
        hit = true
        const body = (await request.json()) as { amount: number }
        return HttpResponse.json({ ...GOAL, currentAmount: GOAL.currentAmount - body.amount })
      })
    )
    const { getByText, onClose } = renderDialog({ mode: 'withdraw' })
    const amountInput = (await screen.findByLabelText(/cantidad/i)) as HTMLInputElement
    fireEvent.change(amountInput, { target: { value: '200' } })
    fireEvent.click(getByText('Aceptar'))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(hit).toBe(true)
  })

  it('keeps the dialog open when the API responds with an error', async () => {
    server.use(
      http.post('/goals/g1/fund', () => HttpResponse.json({ message: 'fail' }, { status: 400 }))
    )
    const { getByText, onClose } = renderDialog()
    const amountInput = (await screen.findByLabelText(/cantidad/i)) as HTMLInputElement
    fireEvent.change(amountInput, { target: { value: '500' } })
    fireEvent.click(getByText('Aceptar'))
    await waitFor(() => {
      // Give the promise time to settle without closing
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
