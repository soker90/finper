// @vitest-environment happy-dom
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/testUtils'

import Login from './index'
import { LoginUsernames } from '../../mock/handlers/auth/login'
import { server } from '../../mock/server'

const user = userEvent.setup()

describe('Login', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterAll(() => server.close())
  afterEach(() => server.resetHandlers())

  it.skip('should redirect to dashboard', async () => {
    const { getByPlaceholderText, findByTestId, getByRole } = render(<Login/>)
    const inputUsername = getByPlaceholderText('Introduce tu nombre de usuario')
    const inputPassword = getByPlaceholderText('Introduce tu contraseña')

    await user.type(inputUsername, LoginUsernames.success)
    await user.type(inputPassword, 'password')

    const button = getByRole('button')
    await user.click(button)

    const dashboardBreadcrumb = await findByTestId('breadcrumbTitle')
    expect(dashboardBreadcrumb).toBe('dd')
  })
})
