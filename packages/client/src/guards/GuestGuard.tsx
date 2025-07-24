import { Navigate } from 'react-router'
import useAuth from 'hooks/useAuth'

const GuestGuard = ({ children }: any) => {
  const { hasToken } = useAuth()

  // TODO: check localStorage token previously in Auth component

  if (hasToken()) return <Navigate to='/' replace />

  return children
}

export default GuestGuard
