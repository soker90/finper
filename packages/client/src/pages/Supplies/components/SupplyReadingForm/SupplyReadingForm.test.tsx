// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { SWRConfig } from 'swr'
import { fireEvent, waitFor, act } from '@testing-library/react'
import { render } from '../../../../test/testUtils'
import SupplyReadingForm from '.'
import type { Supply, SupplyReading } from 'types'

const mockWaterSupply: Supply = {
  _id: 'supply-water-1',
  type: 'water',
  propertyId: 'prop-1'
}

const mockElecSupply: Supply = {
  _id: 'supply-elec-1',
  type: 'electricity',
  propertyId: 'prop-1'
}

const NOW = new Date(new Date().getFullYear(), 0, 1).getTime()

const mockReading: SupplyReading = {
  _id: 'reading-1',
  supplyId: 'supply-water-1',
  startDate: NOW,
  endDate: NOW + 30 * 24 * 60 * 60 * 1000,
  amount: 45.25,
  consumption: 150
}

const renderForm = (supply: Supply, reading?: SupplyReading, onSubmit?: (data: any) => Promise<{ error?: string }>, onClose?: () => void) =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <SupplyReadingForm
        supply={supply}
        reading={reading}
        onClose={onClose ?? vi.fn()}
        onSubmit={onSubmit ?? vi.fn().mockResolvedValue({})}
      />
    </SWRConfig>
  )

describe('SupplyReadingForm', () => {
  // ── Titles ────────────────────────────────────────────────────────────────
  it('shows "Nueva lectura" title in creation mode', () => {
    const { getByText } = renderForm(mockWaterSupply)
    expect(getByText('Nueva lectura')).toBeDefined()
  })

  it('shows "Editar lectura" title in edit mode', () => {
    const { getByText } = renderForm(mockWaterSupply, mockReading)
    expect(getByText('Editar lectura')).toBeDefined()
  })

  // ── Fields by type ────────────────────────────────────────────────────────
  it('water supply → shows the "Consumo (m³)" field', () => {
    const { getByLabelText } = renderForm(mockWaterSupply)
    expect(getByLabelText(/consumo/i)).toBeDefined()
  })

  it('electricity supply → shows 3 consumption fields', () => {
    const { getByLabelText } = renderForm(mockElecSupply)
    expect(getByLabelText(/punta/i)).toBeDefined()
    expect(getByLabelText(/llano/i)).toBeDefined()
    expect(getByLabelText(/valle/i)).toBeDefined()
  })

  it('electricity supply → does NOT show the generic "Consumo" field', () => {
    const { queryByLabelText } = renderForm(mockElecSupply)
    expect(queryByLabelText(/^Consumo/i)).toBeNull()
  })

  // ── Pre-fill in edit mode ─────────────────────────────────────────────────
  it('pre-fills the consumption field in edit mode', () => {
    const { getByDisplayValue } = renderForm(mockWaterSupply, mockReading)
    expect(getByDisplayValue('150')).toBeDefined()
  })

  // ── Buttons ───────────────────────────────────────────────────────────────
  it('shows "Cancelar" and "Aceptar" buttons', () => {
    const { getByText } = renderForm(mockWaterSupply)
    expect(getByText('Cancelar')).toBeDefined()
    expect(getByText('Aceptar')).toBeDefined()
  })

  it('calls onClose when the Cancel button is clicked', () => {
    const onClose = vi.fn()
    const { getByText } = renderForm(mockWaterSupply, undefined, undefined, onClose)
    getByText('Cancelar').click()
    expect(onClose).toHaveBeenCalled()
  })

  // ── Submit in edit mode (dates pre-filled) ────────────────────────────────
  it('calls onSubmit when the form is submitted in edit mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    renderForm(mockWaterSupply, mockReading, onSubmit)
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 45.25 }))
  })

  it('parses decimal amount with comma', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    const { getByLabelText } = renderForm(mockWaterSupply, mockReading, onSubmit)

    fireEvent.change(getByLabelText('Importe (€)'), { target: { value: '12,34' } })
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 12.34 }))
  })

  it('closes the form after a successful submit', async () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue({})
    renderForm(mockWaterSupply, mockReading, onSubmit, onClose)
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('keeps the form open when onSubmit returns an error', async () => {
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue({ error: 'Server error' })
    renderForm(mockWaterSupply, mockReading, onSubmit, onClose)
    fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('disables the "Aceptar" button while the form is submitting', async () => {
    let resolveSubmit!: (v: object) => void
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise(resolve => { resolveSubmit = resolve })
    )
    const { getByText } = renderForm(mockWaterSupply, mockReading, onSubmit)
    fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      const btn = getByText('Aceptar').closest('button')
      expect(btn?.hasAttribute('disabled')).toBe(true)
    })

    await act(async () => { resolveSubmit({}) })
  })
})
