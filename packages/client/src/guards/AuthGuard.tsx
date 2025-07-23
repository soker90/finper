import { Navigate } from 'react-router'
import useAuth from 'hooks/useAuth'

const AuthGuard = ({ children }: any) => {
  const { hasToken } = useAuth()

  if (!hasToken()) return <Navigate to='/login' replace/>

  return children
}

export default AuthGuard
