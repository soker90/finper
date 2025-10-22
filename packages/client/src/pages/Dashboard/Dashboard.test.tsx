// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render } from '../../test/testUtils'
import Dashboard from './index'

describe('Dashboard', () => {
  it('renders loading state initially', () => {
    const { getByText } = render(<Dashboard />)

    const loadingText = getByText('Cargando dashboard...')
    expect(loadingText).toBeDefined()
  })
})
