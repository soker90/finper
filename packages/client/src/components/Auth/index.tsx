import { type JSX, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import SplashScreen from 'components/SplashScreen'
import authService from 'services/authService'
import useAuth from 'hooks/useAuth'

const Auth = ({ children }: { children: any }): JSX.Element => {
  const [isInitialized, setInitialized] = useState(false)
  const isLoadingRef = useRef(true)
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

      isLoadingRef.current = false
      setInitialized(true)
    }

    initAuth()
  }, [])

  if (!isInitialized) return <SplashScreen />

  return children
}

export default Auth
