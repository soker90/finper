// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'

import { render } from '../../test/testUtils'

import Budgets from './index'

vi.mock('react-router', async (importActual) => {
  const actual = await importActual<typeof import('react-router')>()
  return {
    ...actual,
    useParams: vi.fn(() => ({
      year: '2022',
      month: '8'
    }))
  }
})

describe('Budgets', () => {
  it('Show title success', async () => {
    const { findByText } = render(<Budgets />)
    const monthLabel = await findByText('Septiembre 2022')

    expect(monthLabel).toBeDefined()
  })
})
