import { use } from 'react'
import AuthContext, { AuthContextParams } from 'contexts/AuthContext'

export default function useAuth (): AuthContextParams {
  const context = use(AuthContext)

  return context
}
