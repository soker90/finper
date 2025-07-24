import { type JSX, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import SplashScreen from 'components/SplashScreen'
import authService from 'services/authService'
import useAuth from 'hooks/useAuth'

const Auth = ({ children }: { children: any }): JSX.Element => {
  const [isLoading, setLoading] = useState(true)
  const { handleLogout, setAccessToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const initAuth = async () => {
      authService.setAxiosInterceptors({
        onLogout: () => {
          handleLogout()
          navigate('/login')
        }
      })

      authService.handleAuthentication()

      if (authService.isAuthenticated()) {
        const token = await authService.loginInWithToken()
        setAccessToken(token)
        // initialize dashboard
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  if (isLoading) return <SplashScreen />

  return children
}

export default Auth
