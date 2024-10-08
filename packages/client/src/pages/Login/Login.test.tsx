// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

import { render } from '../../test/testUtils'

import Login from './index'
import { LoginUsernames } from '../../mock/handlers/auth/login'

const user = userEvent.setup()
let handleSubmit: any

describe('Login', async () => {
  beforeEach(() => {
    handleSubmit = vi.fn()
    vi.mock('react-hook-form', () => ({
      useForm: vi.fn(() => ({
        register: vi.fn(),
        handleSubmit,
        formState: {
          errors: {}
        }
      }))
    }))
  })

  it('button login works', async () => {
    const { getByPlaceholderText, getByTestId } = render(<Login/>)
    const inputUsername = getByPlaceholderText('Introduce tu nombre de usuario')
    const inputPassword = getByPlaceholderText('Introduce la contraseña')

    await user.type(inputUsername, LoginUsernames.success)
    await user.type(inputPassword, 'password')
    await userEvent.type(inputUsername, LoginUsernames.success)
    await userEvent.type(inputPassword, 'password')

    const button = getByTestId('login-button')
    await userEvent.click(button)
    await user.click(button)

    expect(handleSubmit).toHaveBeenCalled()
  })
})
