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

const fillTransfer = (getByLabelText: (label: string) => HTMLElement, units = '200', value = '24.75') => {
  fireEvent.change(getByLabelText('Plan destino'), { target: { value: 'destination' } })
  fireEvent.change(getByLabelText('Unidades en destino'), { target: { value: units } })
  fireEvent.change(getByLabelText('Valor de la unidad en destino'), { target: { value } })
}

describe('PensionTransferModal', () => {
  it('shows the full source balance and previews the manually entered destination movement', () => {
    const { getByLabelText, getByRole } = renderModal()

    fillTransfer(getByLabelText)

    const preview = getByRole('alert')
    const previewText = preview.textContent?.replace(/\s+/g, ' ') ?? ''
    expect(previewText).toMatch(/5[.]?000,00\s*€/)
    expect(previewText).toMatch(/200/)
    expect(previewText).toMatch(/24,75\s*€/)
    expect(previewText).toMatch(/Se registrará un movimiento en el plan destino/i)
  })

  it('sends the full source balance and the exact destination units and unit value', async () => {
    let requestBody: any
    server.use(
      http.post('*/pension-plans/source/transfer', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({})
      })
    )

    const { getByLabelText, getByRole, onClose } = renderModal()
    fillTransfer(getByLabelText)
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requestBody).toMatchObject({
      destinationPlanId: 'destination',
      destinationUnits: 200,
      destinationValue: 24.75
    })
    expect(requestBody.date).toEqual(expect.any(Number))
  })

  it('does not depend on a previous destination valuation', async () => {
    let requestBody: any
    server.use(
      http.post('*/pension-plans/source/transfer', async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json({})
      })
    )
    const plans = [SOURCE_PLAN, { ...PLANS[1], units: 0, total: 0 }]
    const { getByLabelText, getByRole, onClose } = renderModal(plans as any)

    fillTransfer(getByLabelText, '250', '20')
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requestBody).toMatchObject({ destinationUnits: 250, destinationValue: 20 })
  })

  it('keeps the modal open and displays the API error when the transfer fails', async () => {
    server.use(
      http.post('*/pension-plans/source/transfer', () =>
        HttpResponse.json({ message: 'No se pudo realizar el traspaso' }, { status: 400 })
      )
    )

    const { getByLabelText, getByRole, findByText, onClose } = renderModal()
    fillTransfer(getByLabelText)
    fireEvent.click(getByRole('button', { name: 'Aceptar' }))

    expect(await findByText('No se pudo realizar el traspaso')).toBeDefined()
    expect(onClose).not.toHaveBeenCalled()
  })
})
