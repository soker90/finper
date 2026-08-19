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
      http.get('*/pension-plans/p1/movements', () => HttpResponse.json([]))
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
      http.get('*/pension-plans/p1/movements', () => HttpResponse.json([])),
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

  it('opens edit plan modal from the plan menu with prefilled values', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/p1/movements', () => HttpResponse.json([]))
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
      http.get('*/pension-plans/p1/movements', () => HttpResponse.json([])),
      http.delete('*/pension-plans/p1', () => {
        deleteCalled = true
        return new HttpResponse(null, { status: 204 })
      })
    )
    const originalConfirm = window.confirm
    window.confirm = () => true
    const { findAllByText, findByText } = renderFresh()
    await findAllByText('Plan de pensiones')

    const menuButtons = document.querySelectorAll('button')
    const moreButton = Array.from(menuButtons).find((button) => button.querySelector('.anticon-more'))
    fireEvent.click(moreButton!)
    const deleteMenuItem = await findByText('Eliminar plan')
    fireEvent.click(deleteMenuItem)

    await waitFor(() => expect(deleteCalled).toBe(true))
    window.confirm = originalConfirm
  })

  it('opens the add movement modal from a plan card', async () => {
    server.use(
      http.get('*/pension-plans', () => HttpResponse.json(PLANS_LIST)),
      http.get('*/pension-plans/p1/movements', () => HttpResponse.json([]))
    )
    const { findAllByText, findByText, findByRole } = renderFresh()
    await findAllByText('Plan de pensiones')

    const movementBtn = await findByRole('button', { name: /movimiento/i })
    fireEvent.click(movementBtn)
    expect(await findByText('Nuevo Movimiento')).toBeDefined()
  })
})
