// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
// import userEvent from '@testing-library/user-event'

import { render } from '../../test/testUtils'

import Budgets from './index'
// import { BUDGETS_LIST } from '../../mock/handlers/budgets'
// import { euro } from 'utils/format'
//
// const user = userEvent.setup()

describe('Budgets', async () => {
  // let handleSubmit: any

  beforeEach(() => {
    // handleSubmit = vi.fn()
    // vi.mock('react-hook-form', () => ({
    //   useForm: vi.fn(() => ({
    //     register: vi.fn(),
    //     handleSubmit,
    //     formState: {
    //       errors: {}
    //     }
    //   }))
    // })

    vi.mock('react-router-dom', async () => {
      const reactRouterDom = await vi.importActual('react-router-dom')
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
    const { getByText } = render(<Budgets/>)
    const monthLabel = getByText('Septiembre 2022')

    expect(monthLabel).toBeDefined()
  })

  // it('Card data is valid', async () => {
  //   const { getByTestId, findByText, container } = render(<Budgets/>)
  //   await findByText(BUDGETS_LIST.expenses[0].name)
  //   const totalExpensesDom = getByTestId('total-expenses')
  //
  //   const expensesTotal: number = BUDGETS_LIST.expenses.reduce(
  //     (previousValue, currentValue) => previousValue + currentValue.budgets[0].real,
  //     0
  //   )
  //
  //   const incomesTotal: number = BUDGETS_LIST.incomes.reduce(
  //     (previousValue, currentValue) => previousValue + currentValue.budgets[0].real,
  //     0
  //   )
  //
  //   expect(container).toBe(3)
  //   expect(totalExpensesDom.textContent).toBe(euro(expensesTotal))
  //   expect(totalExpensesDom.textContent).toBe(euro(incomesTotal))
  // })
})
