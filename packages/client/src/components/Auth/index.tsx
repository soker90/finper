import { type ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import SplashScreen from 'components/SplashScreen'
import authService from 'services/authService'
import useAuth from 'hooks/useAuth'

const isUnauthorizedError = (error: unknown): boolean => {
  const { status, statusCode } = (error ?? {}) as { status?: number, statusCode?: number }
  return status === 401 || statusCode === 401
}

const Auth = ({ children }: { children: ReactNode }): ReactNode => {
  const [isInitialized, setInitialized] = useState(false)
  const { handleLogout, setAccessToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const forceLogout = () => {
      authService.logout()
      handleLogout()
    }

    const refreshSessionToken = async () => {
      try {
        const token = await authService.loginInWithToken()
        setAccessToken(token)
      } catch (authError) {
        if (isUnauthorizedError(authError)) {
          forceLogout()
          return
        }

        const currentToken = authService.getAccessToken()
        if (currentToken && authService.isValidToken(currentToken)) {
          setAccessToken(currentToken)
        } else {
          forceLogout()
        }
      }
    }

    const initAuth = async () => {
      try {
        authService.setAxiosInterceptors({
          onLogout: () => {
            handleLogout()
            navigate('/login')
          }
        })

        authService.handleAuthentication()

        if (authService.isAuthenticated()) {
          await refreshSessionToken()
        } else {
          forceLogout()
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error)
        forceLogout()
      }

      setInitialized(true)
    }

    initAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional bootstrap effect: runs once on mount to init auth interceptors
  }, [])

  if (!isInitialized) return <SplashScreen />

  return children
}

export default Auth
