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

const renderModal = () => {
  const onClose = vi.fn()
  const utils = render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <PensionTransferModal
        sourcePlan={SOURCE_PLAN as any}
        plans={PLANS as any}
        show
        onClose={onClose}
      />
    </SWRConfig>
  )
  return { ...utils, onClose }
}

describe('PensionTransferModal', () => {
  it('shows the destination plan and the two manually entered destination values', () => {
    const { getByLabelText, getByText } = renderModal()

    expect(getByLabelText('Plan destino')).toBeDefined()
    expect(getByLabelText('Unidades en destino')).toBeDefined()
    expect(getByLabelText('Valor unidad destino')).toBeDefined()
    expect(getByText(/se registrarán exactamente esos datos/i)).toBeDefined()

    const destinationSelect = getByLabelText('Plan destino') as HTMLSelectElement
    expect(Array.from(destinationSelect.options).map(option => option.value)).toEqual(['', 'destination'])
  })

  it('requires positive destination units and unit value before submitting', async () => {
    const { getByLabelText, getByRole, findByText } = renderModal()

    fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    expect(await findByText('Indica las unidades que recibes')).toBeDefined()
    expect(await findByText('Indica el valor de cada unidad')).toBeDefined()

    fireEvent.change(getByLabelText('Unidades en destino'), { target: { value: '0' } })
    fireEvent.change(getByLabelText('Valor unidad destino'), { target: { value: '-1' } })
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    expect(await findByText('Introduce un número de unidades mayor que 0')).toBeDefined()
    expect(await findByText('Introduce un valor mayor que 0')).toBeDefined()
  })

  it('sends the exact units and unit value entered and closes after a successful transfer', async () => {
    let requestBody: any
    server.use(
      http.post('*/pension-plans/source/transfer', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({})
      })
    )

    const { getByLabelText, getByRole, onClose } = renderModal()
    fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })
    fireEvent.change(getByLabelText('Unidades en destino'), { target: { value: '123.456' } })
    fireEvent.change(getByLabelText('Valor unidad destino'), { target: { value: '18.75' } })
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requestBody).toMatchObject({
      destinationPlanId: 'destination',
      destinationUnits: 123.456,
      destinationValue: 18.75
    })
    expect(requestBody.date).toEqual(expect.any(Number))
  })

  it('keeps the modal open and displays the API error when the transfer fails', async () => {
    server.use(
      http.post('*/pension-plans/source/transfer', () =>
        HttpResponse.json({ message: 'No se pudo realizar el traspaso' }, { status: 400 })
      )
    )

    const { getByLabelText, getByRole, findByText, onClose } = renderModal()
    fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })
    fireEvent.change(getByLabelText('Unidades en destino'), { target: { value: '100' } })
    fireEvent.change(getByLabelText('Valor unidad destino'), { target: { value: '20' } })
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    expect(await findByText('No se pudo realizar el traspaso')).toBeDefined()
    expect(onClose).not.toHaveBeenCalled()
  })
})
