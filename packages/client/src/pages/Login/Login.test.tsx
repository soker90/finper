import { describe, it } from 'vitest'
import Login from './index'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()

describe('Login', () => {
  it.skip('should redirect to dashboard', async () => {
    const { getByPlaceholderText } = render(<Login />)
    const inputUsername = getByPlaceholderText('Introduce tu nombre de usuario')
    const inputPassword = getByPlaceholderText('Introduce tu contraseña')

    await user.type(inputUsername, 'test')
    await user.type(inputPassword, 'password')
  })
})
