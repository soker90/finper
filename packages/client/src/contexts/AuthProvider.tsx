import { createContext, useEffect, useState, ReactNode } from 'react'

export type AuthContextParams = {
    accessToken?: string;
    setAccessToken: (accessToken: string) => void;
    handleLogout: () => void;
    authIsLoading: boolean;
};
const AuthContext = createContext<AuthContextParams | null>(null)

export default AuthContext

type ProviderProps = {
    children: ReactNode;
};
export const CurrentUserProvider = ({ children }: ProviderProps) => {
  const [token, setToken] = useState<string>('')
  const [authIsLoading, setAuthIsLoading] = useState(true)

  useEffect(() => {
    setAuthIsLoading(true)
    const token = localStorage.getItem('token')
    if (token) {
      setToken(token)
    }
    setAuthIsLoading(false)
  }, [])

  const checkLogin = () => {

  }

  const handleLogout = () => {
    localStorage.removeItem('bottega_workshop_token')
    setToken('')
  }

  const setAccessToken = (token: string) => {
    localStorage.setItem('bottega_workshop_token', token)
    setToken(token)
  }

  const stateValues = {
    accessToken: token,
    setAccessToken,
    checkLogin,
    authIsLoading,
    handleLogout
  }

  return (
        <AuthContext.Provider value={stateValues}>
            {children}
        </AuthContext.Provider>
  )
}
