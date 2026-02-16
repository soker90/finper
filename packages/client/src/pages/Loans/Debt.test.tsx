// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { render } from '../../test/testUtils'
import Debts from './index'

describe('Debts', () => {
  it('renders without crashing', () => {
    const { container } = render(<Debts/>)

    expect(container).toMatchSnapshot()
  })
})
