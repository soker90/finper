import { useContext } from 'react'
import AuthContext, { AuthContextParams } from 'contexts/AuthContext'

export default function useAuth (): AuthContextParams {
  const context = useContext(AuthContext)

  return context
}
