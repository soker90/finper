// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { render } from '../../../../test/testUtils'
import GoalItem from '.'

const GOAL = {
  _id: 'g1',
  name: 'Coche nuevo',
  targetAmount: 10000,
  currentAmount: 2500,
  color: '#2196F3',
  icon: 'CarOutlined'
}

const renderItem = (props: Partial<Parameters<typeof GoalItem>[0]> = {}) =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <ul>
        <GoalItem goal={GOAL as any} {...props} />
      </ul>
    </SWRConfig>
  )

describe('GoalItem', () => {
  it('renders the name and the formatted current amount', () => {
    const { getByText, getAllByText } = renderItem()
    expect(getByText('Coche nuevo')).toBeDefined()
    // Default Spanish euro format includes the symbol; the amount appears
    // both in the header and in the progress caption.
    expect(getAllByText(/2\.500.*€|2500.*€/).length).toBeGreaterThan(0)
  })

  it('shows the progress percentage relative to the target', () => {
    const { getByText } = renderItem()
    // 2500 / 10000 = 25%
    expect(getByText(/25%/)).toBeDefined()
  })

  it('shows fund and withdraw buttons when the goal already exists', () => {
    const { getByTitle } = renderItem()
    expect(getByTitle('Añadir fondos')).toBeDefined()
    expect(getByTitle('Retirar fondos')).toBeDefined()
  })

  it('hides fund and withdraw buttons for goals that have not been saved yet', () => {
    const newGoal = { ...GOAL, _id: undefined }
    const { queryByTitle } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <ul>
          <GoalItem goal={newGoal as any} forceExpand />
        </ul>
      </SWRConfig>
    )
    expect(queryByTitle('Añadir fondos')).toBeNull()
    expect(queryByTitle('Retirar fondos')).toBeNull()
  })

  it('opens the fund dialog when the add-funds button is clicked', async () => {
    const { getByTitle, findByText } = renderItem()
    fireEvent.click(getByTitle('Añadir fondos'))
    expect(await findByText(/Añadir fondos:/)).toBeDefined()
  })

  it('opens the withdraw dialog when the remove-funds button is clicked', async () => {
    const { getByTitle, findByText } = renderItem()
    fireEvent.click(getByTitle('Retirar fondos'))
    expect(await findByText(/Retirar fondos:/)).toBeDefined()
  })

  it('caps the progress at 100% when currentAmount exceeds targetAmount', () => {
    const overGoal = { ...GOAL, currentAmount: 50000 }
    const { getByText } = render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <ul>
          <GoalItem goal={overGoal as any} />
        </ul>
      </SWRConfig>
    )
    expect(getByText(/100%/)).toBeDefined()
  })

  it('expands the edit form when the row is clicked', () => {
    const { container, getByText } = renderItem()
    // ItemContent renders a <ul> that owns the click handler
    const row = container.querySelector('li > ul')!
    fireEvent.click(row)
    // GoalEdit renders both action buttons inside its form
    expect(getByText('Eliminar')).toBeDefined()
    expect(getByText('Guardar')).toBeDefined()
  })
})
