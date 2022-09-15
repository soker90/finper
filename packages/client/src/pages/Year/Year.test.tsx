// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render } from '../../test/testUtils'
import Year from './index'

describe('Year', () => {
  it('renders without crashing', () => {
    const { container } = render(<Year/>)

    expect(container).toMatchSnapshot()
  })
})
