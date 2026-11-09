// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fireEvent, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'

import { server } from '../../../mock/server'
import { render } from '../../../test/testUtils'
import PensionTransferModal from './PensionTransferModal'

const SOURCE_PLAN = {
  id: 'source',
  _id: 'source',
  name: 'Plan origen',
  amount: 4000,
  units: 400,
  employeeAmount: 3000,
  companyAmount: 1000,
  total: 5000
}

const PLANS = [
  SOURCE_PLAN,
  {
    id: 'destination',
    _id: 'destination',
    name: 'Plan destino',
    amount: 100,
    units: 5,
    employeeAmount: 60,
    companyAmount: 40,
    total: 125
  }
]

const renderModal = (plans = PLANS) => {
  const onClose = vi.fn()
  const utils = render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <PensionTransferModal
        sourcePlan={SOURCE_PLAN as any}
        plans={plans as any}
        show
        onClose={onClose}
      />
    </SWRConfig>
  )
  return { ...utils, onClose }
}

describe('PensionTransferModal', () => {
  it('explains that the full source balance will be transferred and calculates destination units', () => {
    const { getByLabelText, getByText, queryByLabelText } = renderModal()

    expect(getByLabelText('Plan destino')).toBeDefined()
    expect(queryByLabelText('Unidades en destino')).toBeNull()
    expect(queryByLabelText('Valor unidad destino')).toBeNull()

    fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })

    expect(getByText(/5\.000,00\s*€/)).toBeDefined()
    expect(getByText(/200/)).toBeDefined()
    expect(getByText(/25,00\s*€/)).toBeDefined()
  })

  it('sends the complete balance converted using the destination plan latest unit value', async () => {
    let requestBody: any
    server.use(
      http.post('*/pension-plans/source/transfer', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({})
      })
    )

    const { getByLabelText, getByRole, onClose } = renderModal()
    fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requestBody).toMatchObject({
      destinationPlanId: 'destination',
      destinationUnits: 200,
      destinationValue: 25
    })
    expect(requestBody.date).toEqual(expect.any(Number))
  })

  it('prevents transferring when the destination has no current unit valuation', () => {
    const plans = [
      SOURCE_PLAN,
      { ...PLANS[1], units: 0, total: 0 }
    ]
    const { getByLabelText, getByRole, getByText } = renderModal(plans as any)

    fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })

    expect(getByText(/no tiene una valoración actual/i)).toBeDefined()
    expect((getByRole('button', { name: 'Aceptar' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('keeps the modal open and displays the API error when the transfer fails', async () => {
    server.use(
      http.post('*/pension-plans/source/transfer', () =>
        HttpResponse.json({ message: 'No se pudo realizar el traspaso' }, { status: 400 })
      )
    )

    const { getByLabelText, getByRole, findByText, onClose } = renderModal()
    fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    expect(await findByText('No se pudo realizar el traspaso')).toBeDefined()
    expect(onClose).not.toHaveBeenCalled()
  })
})
