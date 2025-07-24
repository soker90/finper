import { createContext, useState, ReactNode } from 'react'
import authService from 'services/authService'

export type AuthContextParams = {
  hasToken: () => boolean;
  setAccessToken: (accessToken: string) => void;
  handleLogout: () => void;
}

const defaultParams = {
  hasToken: () => {
    return false
  },
  setAccessToken: (accessToken: string) => {
  },
  handleLogout: () => {
  }
}

const AuthContext = createContext<AuthContextParams>(defaultParams)

export default AuthContext

type ProviderProps = {
  children: ReactNode;
}

export const AuthProvider = ({ children }: ProviderProps) => {
  const [token, setToken] = useState<string | undefined>(undefined)

  const handleLogout = () => {
    authService.logout()
    setToken(undefined)
  }

  const setAccessToken = (token: string) => {
    setToken(token)
  }

  const hasToken = (): boolean => Boolean(token)

  const stateValues = {
    hasToken,
    setAccessToken,
    handleLogout
  }

  return (
    <AuthContext.Provider value={stateValues}>
      {children}
    </AuthContext.Provider>
  )
}
