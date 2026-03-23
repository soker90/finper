// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render } from '../../test/testUtils'
import Dashboard from './index'

describe('Dashboard', () => {
  it('renders loading state initially', () => {
    const { container } = render(<Dashboard />)

    const skeleton = container.querySelector('.MuiSkeleton-root')
    expect(skeleton).toBeDefined()
  })
})
