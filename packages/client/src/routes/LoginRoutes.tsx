import { lazy } from 'react'
import AuthLayout from '../layout/AuthLayout'

// render - login
const Login = lazy(() => import('../pages/Login'))

// ==============================|| AUTH ROUTING ||============================== //

const LoginRoutes = {
  path: '/',
  element: <AuthLayout />,
  children: [
    {
      path: 'login',
      element: <Login />
    }
  ]
}

export default LoginRoutes
