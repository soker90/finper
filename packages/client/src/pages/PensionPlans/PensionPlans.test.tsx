// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { SWRConfig } from 'swr'
import { fireEvent, waitFor } from '@testing-library/react'
import { server } from '../../mock/server'
import { render } from '../../test/testUtils'
import PensionPlans from './index'

const renderFresh = () =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <PensionPlans />
    </SWRConfig>
  )

const PLANS_LIST = [
  {
    _id: 'p1',
    id: 'p1',
    name: 'Plan de pensiones',
    amount: 500,
    units: 50,
    employeeAmount: 200,
    companyAmount: 300,
    total: 550,
    user: 'testuser'
  }
]

describe('PensionPlans Page', () => {
  it('renders title and empty state when there are no plans', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/No tienes ningún plan de pensiones registrado/i)).toBeDefined()
  })

  it('renders pension plans list and summary', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/movements', () => HttpResponse.json([]))
    )
    const { findAllByText } = renderFresh()

    expect((await findAllByText('Plan de pensiones')).length).toBeGreaterThan(0)
    const elements = await findAllByText(/550/)
    expect(elements.length).toBeGreaterThan(0)
  })

  it('renders an error alert when pension plans fail to load', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json({ message: 'Server error' }, { status: 500 }))
    )
    const { findByText } = renderFresh()
    expect(await findByText(/No se han podido cargar los planes de pensiones/i)).toBeDefined()
  })

  it('opens new plan modal, creates a plan and closes on success', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/movements', () => HttpResponse.json([])),
      http.post('*/pension-plans', () => HttpResponse.json({ id: 'p2', _id: 'p2', name: 'Nuevo plan', amount: 0, units: 0, employeeAmount: 0, companyAmount: 0, total: 0 }, { status: 201 }))
    )
    const { findByRole, findByText, queryByText, getByLabelText } = renderFresh()
    const btn = await findByRole('button', { name: /nuevo plan/i })
    fireEvent.click(btn)
    expect(await findByText('Nuevo plan de pensiones')).toBeDefined()

    fireEvent.change(getByLabelText('Nombre del plan'), { target: { value: 'Nuevo plan' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(queryByText('Nuevo plan de pensiones')).toBeNull())
  })

  it('sends the selected color when creating a plan', async () => {
    let capturedBody: any = null
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/movements', () => HttpResponse.json([])),
      http.post('*/pension-plans', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ id: 'p2', _id: 'p2', ...capturedBody, amount: 0, units: 0, employeeAmount: 0, companyAmount: 0, total: 0 }, { status: 201 })
      })
    )
    const { findByRole, findByText, queryByText, getByLabelText } = renderFresh()
    const btn = await findByRole('button', { name: /nuevo plan/i })
    fireEvent.click(btn)
    expect(await findByText('Nuevo plan de pensiones')).toBeDefined()

    fireEvent.change(getByLabelText('Nombre del plan'), { target: { value: 'Nuevo plan' } })
    fireEvent.change(getByLabelText('Color'), { target: { value: '#2196F3' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(queryByText('Nuevo plan de pensiones')).toBeNull())
    expect(capturedBody).toMatchObject({ name: 'Nuevo plan', color: '#2196F3' })
  })

  it('opens edit plan modal from the plan menu with prefilled values', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/movements', () => HttpResponse.json([]))
    )
    const { findAllByText, findByText, getByDisplayValue } = renderFresh()
    await findAllByText('Plan de pensiones')

    const menuButtons = document.querySelectorAll('button')
    const moreButton = Array.from(menuButtons).find((button) => button.querySelector('.anticon-more'))
    fireEvent.click(moreButton!)
    fireEvent.click(await findByText('Editar plan'))

    expect(await findByText('Editar plan de pensiones')).toBeDefined()
    expect(getByDisplayValue('Plan de pensiones')).toBeDefined()
  })

  it('deletes a pension plan when confirmed', async () => {
    let deleteCalled = false
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/movements', () => HttpResponse.json([])),
      http.delete('*/pension-plans/p1', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    const originalConfirm = window.confirm
    window.confirm = () => true
    try {
      const { findAllByText, findByText } = renderFresh()
      await findAllByText('Plan de pensiones')

      const menuButtons = document.querySelectorAll('button')
      const moreButton = Array.from(menuButtons).find((button) => button.querySelector('.anticon-more'))
      fireEvent.click(moreButton!)
      const deleteMenuItem = await findByText('Eliminar plan')
      fireEvent.click(deleteMenuItem)

      await waitFor(() => expect(deleteCalled).toBe(true))
    } finally {
      window.confirm = originalConfirm
    }
  })

  it('opens the add movement modal from a plan card', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/movements', () => HttpResponse.json([]))
    )
    const { findAllByText, findByText, findByRole } = renderFresh()
    await findAllByText('Plan de pensiones')

    const movementBtn = await findByRole('button', { name: /movimiento/i })
    fireEvent.click(movementBtn)
    expect(await findByText('Nuevo Movimiento')).toBeDefined()
  })

  it('shows recent movements from every plan together, with no per-plan filter', async () => {
    const TWO_PLANS = [
      { ...PLANS_LIST[0] },
      { _id: 'p2', id: 'p2', name: 'Plan de empleo', amount: 100, units: 10, employeeAmount: 40, companyAmount: 60, total: 120, user: 'testuser' }
    ]
    const MOVEMENTS = [
      { _id: 'm1', id: 'm1', planId: 'p1', date: 2000, employeeAmount: 50, employeeUnits: 5, companyAmount: 0, companyUnits: 0, value: 10 },
      { _id: 'm2', id: 'm2', planId: 'p2', date: 1000, employeeAmount: 20, employeeUnits: 2, companyAmount: 0, companyUnits: 0, value: 10 }
    ]
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(TWO_PLANS)),
      http.get('*/pension-plans/movements', () => HttpResponse.json(MOVEMENTS))
    )
    const { findAllByText, queryByRole } = renderFresh()

    // Both plans' movements render together in the same table (once in the
    // plan card grid, once in the "Plan" column of the movements row)...
    await waitFor(async () => expect((await findAllByText('Plan de empleo')).length).toBe(2))
    expect((await findAllByText('Plan de pensiones')).length).toBe(2)
    // ...and there is no dropdown to filter the list down to a single plan.
    expect(queryByRole('combobox', { name: /plan/i })).toBeNull()
  })

  it('shows return % per plan and a combined return % that is not the average of the per-plan ones', async () => {
    const PLANS = [
      { _id: 'pa', id: 'pa', name: 'Plan A', amount: 1000, units: 10, employeeAmount: 1000, companyAmount: 0, total: 1100, user: 'testuser' },
      { _id: 'pb', id: 'pb', name: 'Plan B', amount: 5000, units: 50, employeeAmount: 5000, companyAmount: 0, total: 4500, user: 'testuser' }
    ]
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS)),
      http.get('*/pension-plans/movements', () => HttpResponse.json([]))
    )
    const { findByText } = renderFresh()

    // Plan A is up 10%, Plan B is down 10% — a simple average would hide this and read 0%.
    expect(await findByText('+10.00%')).toBeDefined()
    expect(await findByText('-10.00%')).toBeDefined()
    // Combined: (1100 + 4500 - 1000 - 5000) / (1000 + 5000) = -6.67%, driven by Plan B's larger weight.
    expect(await findByText('-6.67%')).toBeDefined()
  })
})
