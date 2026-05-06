// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { fireEvent, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { server } from '../../../../mock/server'
import { render } from '../../../../test/testUtils'
import GoalEdit from './index'

const EXISTING_GOAL = {
  _id: 'g1',
  name: 'Coche',
  targetAmount: 10000,
  currentAmount: 1000,
  color: '#2196F3',
  icon: 'CarOutlined'
}

const NEW_GOAL = {
  name: '',
  targetAmount: 0,
  currentAmount: 0,
  color: '#2196F3',
  icon: 'DollarOutlined'
}

const renderEdit = (props: Partial<Parameters<typeof GoalEdit>[0]> = {}) => {
  const hideForm = vi.fn()
  const utils = render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <GoalEdit goal={EXISTING_GOAL as any} hideForm={hideForm} {...props} />
    </SWRConfig>
  )
  return { ...utils, hideForm }
}

describe('GoalEdit', () => {
  it('renders the form pre-filled with the goal data', () => {
    const { container } = renderEdit()
    const nameInput = container.querySelector('#name') as HTMLInputElement
    const targetInput = container.querySelector('#targetAmount') as HTMLInputElement
    expect(nameInput.value).toBe('Coche')
    expect(targetInput.value).toBe('10000')
  })

  it('shows "Eliminar" button on existing goals and "Cancelar" on new ones', () => {
    const { getByText, rerender } = renderEdit()
    expect(getByText('Eliminar')).toBeDefined()

    rerender(
      <SWRConfig value={{ provider: () => new Map() }}>
        <GoalEdit goal={NEW_GOAL as any} hideForm={vi.fn()} isNew />
      </SWRConfig>
    )
    expect(getByText('Cancelar')).toBeDefined()
  })

  it('calls hideForm without making any API call when "Cancelar" is clicked on a new goal', () => {
    const hideForm = vi.fn()
    const { getByText } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <GoalEdit goal={NEW_GOAL as any} hideForm={hideForm} isNew />
      </SWRConfig>
    )
    fireEvent.click(getByText('Cancelar'))
    expect(hideForm).toHaveBeenCalledTimes(1)
  })

  it('submits the form via PUT and hides itself when editing succeeds', async () => {
    server.use(
      http.put('/goals/g1', () => HttpResponse.json({ ...EXISTING_GOAL, name: 'Coche nuevo' }))
    )
    const { getByText, hideForm } = renderEdit()
    fireEvent.click(getByText('Guardar'))
    await waitFor(() => expect(hideForm).toHaveBeenCalledTimes(1))
  })

  it('keeps the form open and shows the API error message when the request fails', async () => {
    server.use(
      http.put('/goals/g1', () => HttpResponse.json({ message: 'No puedes' }, { status: 400 }))
    )
    const { getByText, findByText, hideForm } = renderEdit()
    fireEvent.click(getByText('Guardar'))
    expect(await findByText('No puedes')).toBeDefined()
    expect(hideForm).not.toHaveBeenCalled()
  })

  it('deletes the goal via DELETE and hides itself when the request succeeds', async () => {
    server.use(
      http.delete('/goals/g1', () => HttpResponse.json({}))
    )
    const { getByText, hideForm } = renderEdit()
    fireEvent.click(getByText('Eliminar'))
    await waitFor(() => expect(hideForm).toHaveBeenCalledTimes(1))
  })
})
