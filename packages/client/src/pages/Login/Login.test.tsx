// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

import { render } from '../../test/testUtils'

import Login from './index'
import { LoginUsernames } from '../../mock/handlers/auth/login'

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => ({
    register: vi.fn(),
    handleSubmit: vi.fn(),
    formState: {
      errors: {}
    }
  }))
}))

const user = userEvent.setup()

describe('Login', () => {
  // https://github.com/capricorn86/happy-dom/issues/467
  it.skip('should redirect to dashboard', async () => {
    const { getByPlaceholderText, findByTestId, getByRole } = render(<Login />)
    const inputUsername = getByPlaceholderText('Introduce tu nombre de usuario')
    const inputPassword = getByPlaceholderText('Introduce la contraseña')

    await user.type(inputUsername, LoginUsernames.success)
    await user.type(inputPassword, 'password')

    const button = getByRole('button')
    await user.click(button)

    const dashboardBreadcrumb = await findByTestId('breadcrumbTitle')
    expect(dashboardBreadcrumb).toBe('Dashboard')
  })
})
