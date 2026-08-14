// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

import PasskeyLogin from './PasskeyLogin'

const { setAccessToken } = vi.hoisted(() => ({ setAccessToken: vi.fn() }))

vi.mock('hooks/useAuth', () => ({
  default: () => ({ setAccessToken, hasToken: () => false, handleLogout: vi.fn() })
}))

const authServiceMock = vi.hoisted(() => ({
  hasPasskey: vi.fn(),
  getLastUsername: vi.fn(),
  loginWithPasskey: vi.fn(),
  forgetPasskeyDevice: vi.fn()
}))

vi.mock('services/authService', () => ({ default: authServiceMock }))

const renderPasskeyLogin = () => render(
  <MemoryRouter>
    <PasskeyLogin>
      <div>formulario de contraseña</div>
    </PasskeyLogin>
  </MemoryRouter>
)

describe('PasskeyLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the password form directly when the device has no passkey', () => {
    authServiceMock.hasPasskey.mockReturnValue(false)
    authServiceMock.getLastUsername.mockReturnValue(null)

    renderPasskeyLogin()

    expect(screen.getByText('formulario de contraseña')).toBeDefined()
  })

  it('offers the "entrar con huella" screen when the device has a registered passkey', () => {
    authServiceMock.hasPasskey.mockReturnValue(true)
    authServiceMock.getLastUsername.mockReturnValue('eduardo')

    renderPasskeyLogin()

    expect(screen.getByTestId('use-passkey-login-button')).toBeDefined()
    expect(screen.queryByText('formulario de contraseña')).toBeNull()
  })

  it('falls back to the password form when clicking "usar contraseña"', async () => {
    authServiceMock.hasPasskey.mockReturnValue(true)
    authServiceMock.getLastUsername.mockReturnValue('eduardo')

    renderPasskeyLogin()
    await userEvent.click(screen.getByTestId('use-password-instead-button'))

    expect(screen.getByText('formulario de contraseña')).toBeDefined()
  })

  it('logs in and stores the session on a successful passkey login', async () => {
    authServiceMock.hasPasskey.mockReturnValue(true)
    authServiceMock.getLastUsername.mockReturnValue('eduardo')
    authServiceMock.loginWithPasskey.mockResolvedValue('a-jwt-token')

    renderPasskeyLogin()
    await userEvent.click(screen.getByTestId('use-passkey-login-button'))

    await waitFor(() => expect(setAccessToken).toHaveBeenCalledWith('a-jwt-token'))
    expect(authServiceMock.forgetPasskeyDevice).not.toHaveBeenCalled()
  })

  it('self-heals by forgetting the device when the credential no longer exists server-side', async () => {
    authServiceMock.hasPasskey.mockReturnValue(true)
    authServiceMock.getLastUsername.mockReturnValue('eduardo')
    authServiceMock.loginWithPasskey.mockRejectedValue({ statusCode: 404 })

    renderPasskeyLogin()
    await userEvent.click(screen.getByTestId('use-passkey-login-button'))

    await waitFor(() => expect(authServiceMock.forgetPasskeyDevice).toHaveBeenCalled())
    expect(screen.getByText(/ya no tiene una huella registrada/i)).toBeDefined()
    expect(screen.getByTestId('use-password-instead-button')).toBeDefined()
  })

  it('shows a cancellation message without forgetting the device when the OS prompt is dismissed', async () => {
    authServiceMock.hasPasskey.mockReturnValue(true)
    authServiceMock.getLastUsername.mockReturnValue('eduardo')
    authServiceMock.loginWithPasskey.mockRejectedValue({ name: 'NotAllowedError' })

    renderPasskeyLogin()
    await userEvent.click(screen.getByTestId('use-passkey-login-button'))

    await waitFor(() => expect(screen.queryByText('Operación cancelada.')).not.toBeNull())
    expect(authServiceMock.forgetPasskeyDevice).not.toHaveBeenCalled()
  })
})
