// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { render } from '../../test/testUtils'

import Budgets from './index'

describe('Budgets', async () => {
  beforeEach(() => {
    vi.mock('react-router', async () => {
      const reactRouterDom = await vi.importActual('react-router')
      return ({
        ...reactRouterDom as any,
        useParams: vi.fn(() => ({
          year: '2022',
          month: '8'
        }))
      })
    })
  })
  it('Show title success', async () => {
    const { findByText } = render(<Budgets />)
    const monthLabel = await findByText('Septiembre 2022')

    expect(monthLabel).toBeDefined()
  })
})
