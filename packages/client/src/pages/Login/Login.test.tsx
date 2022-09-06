// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

import { render, fireEvent } from '../../test/testUtils'

import Login from './index'
import { LoginUsernames } from '../../mock/handlers/auth/login'

const user = userEvent.setup()

describe('Login', async () => {
  let handleSubmit: any

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
    fireEvent.change(inputUsername, { target: { value: LoginUsernames.success } })
    fireEvent.change(inputPassword, { target: { value: 'password' } })

    const button = getByTestId('login-button')
    fireEvent.click(button)
    await user.click(button)

    expect(handleSubmit).toHaveBeenCalled()
  })
})
