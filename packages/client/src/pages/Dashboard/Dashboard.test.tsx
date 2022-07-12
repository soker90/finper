// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render } from '../../test/testUtils'
import Dashboard from './index'

describe('Dashboard', () => {
  it('renders without crashing', () => {
    const { getByText } = render(<Dashboard />)

    const dashboardText = getByText('dashboard')
    expect(dashboardText).toBeDefined()
  })
})
