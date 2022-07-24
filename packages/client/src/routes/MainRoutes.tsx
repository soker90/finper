import { lazy } from 'react'

import MainLayout from '../layout/MainLayout'
import { Navigate } from 'react-router-dom'

const Accounts = lazy(() => import('../pages/Accounts'))
const DashboardDefault = lazy(() => import('../pages/Dashboard'))
const Debts = lazy(() => import('../pages/Debts'))
const Categories = lazy(() => import('../pages/Categories'))
const Transactions = lazy(() => import('../pages/Transactions'))

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <Navigate to='/dashboard/default' />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'cuentas',
      element: <Accounts />
    },
    {
      path: 'categorias',
      element: <Categories />
    },
    {
      path: 'movimientos',
      element: <Transactions />
    },
    {
      path: 'deudas',
      element: <Debts />
    }
  ]
}

export default MainRoutes
