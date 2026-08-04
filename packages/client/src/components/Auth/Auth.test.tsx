// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

import Auth from './index'

const { handleLogout, setAccessToken } = vi.hoisted(() => ({
  handleLogout: vi.fn(),
  setAccessToken: vi.fn()
}))

vi.mock('hooks/useAuth', () => ({
  default: () => ({ handleLogout, setAccessToken, hasToken: () => false })
}))

const authServiceMock = vi.hoisted(() => ({
  setAxiosInterceptors: vi.fn(),
  handleAuthentication: vi.fn(),
  isAuthenticated: vi.fn(),
  loginInWithToken: vi.fn(),
  getAccessToken: vi.fn(),
  isValidToken: vi.fn(),
  logout: vi.fn()
}))

vi.mock('services/authService', () => ({ default: authServiceMock }))

const renderAuth = () => render(
  <MemoryRouter>
    <Auth>
      <div>protected content</div>
    </Auth>
  </MemoryRouter>
)

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children and stores the refreshed token when authentication succeeds', async () => {
    authServiceMock.isAuthenticated.mockReturnValue(true)
    authServiceMock.loginInWithToken.mockResolvedValue('valid-token')

    renderAuth()

    await screen.findByText('protected content')
    expect(setAccessToken).toHaveBeenCalledWith('valid-token')
    expect(authServiceMock.logout).not.toHaveBeenCalled()
    expect(handleLogout).not.toHaveBeenCalled()
  })

  it('logs out when the user is not authenticated', async () => {
    authServiceMock.isAuthenticated.mockReturnValue(false)

    renderAuth()

    await screen.findByText('protected content')

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1)
    expect(handleLogout).toHaveBeenCalledTimes(1)
    expect(setAccessToken).not.toHaveBeenCalled()
  })

  it('logs out when refreshing the token fails with a 401 error', async () => {
    authServiceMock.isAuthenticated.mockReturnValue(true)
    authServiceMock.loginInWithToken.mockRejectedValue({ statusCode: 401 })

    renderAuth()

    await screen.findByText('protected content')

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1)
    expect(handleLogout).toHaveBeenCalledTimes(1)
    expect(setAccessToken).not.toHaveBeenCalled()
  })

  it('keeps the session using the locally stored token when the refresh fails for a non-401 reason', async () => {
    authServiceMock.isAuthenticated.mockReturnValue(true)
    authServiceMock.loginInWithToken.mockRejectedValue(new Error('Network Error'))
    authServiceMock.getAccessToken.mockReturnValue('local-token')
    authServiceMock.isValidToken.mockReturnValue(true)

    renderAuth()

    await screen.findByText('protected content')

    expect(setAccessToken).toHaveBeenCalledWith('local-token')
    expect(authServiceMock.logout).not.toHaveBeenCalled()
    expect(handleLogout).not.toHaveBeenCalled()
  })

  it('logs out when the refresh fails for a non-401 reason and there is no valid local token', async () => {
    authServiceMock.isAuthenticated.mockReturnValue(true)
    authServiceMock.loginInWithToken.mockRejectedValue(new Error('Network Error'))
    authServiceMock.getAccessToken.mockReturnValue(null)

    renderAuth()

    await screen.findByText('protected content')

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1)
    expect(handleLogout).toHaveBeenCalledTimes(1)
    expect(setAccessToken).not.toHaveBeenCalled()
  })

  it('logs out and does not crash when initialization throws unexpectedly', async () => {
    authServiceMock.setAxiosInterceptors.mockImplementation(() => {
      throw new Error('unexpected failure')
    })

    renderAuth()

    await screen.findByText('protected content')

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1)
    expect(handleLogout).toHaveBeenCalledTimes(1)
  })
})
