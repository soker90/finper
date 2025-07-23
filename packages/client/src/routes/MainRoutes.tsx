import { lazy } from 'react'

import MainLayout from '../layout/MainLayout'
import { Navigate } from 'react-router'

const Accounts = lazy(() => import('../pages/Accounts'))
const Budgets = lazy(() => import('../pages/Budgets'))
const Categories = lazy(() => import('../pages/Categories'))
const DashboardDefault = lazy(() => import('../pages/Dashboard'))
const Debts = lazy(() => import('../pages/Debts'))
const Pensions = lazy(() => import('../pages/Pensions'))
const Transactions = lazy(() => import('../pages/Transactions'))
const Year = lazy(() => import('../pages/Year'))

const MainRoutes = {
  path: '/',
  element: <MainLayout/>,
  children: [
    {
      path: '/',
      element: <Navigate to='/dashboard/default'/>
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault/>
        }
      ]
    },
    {
      path: 'cuentas',
      element: <Accounts/>
    },
    {
      path: 'categorias',
      element: <Categories/>
    },
    {
      path: 'movimientos',
      element: <Transactions/>
    },
    {
      path: 'deudas',
      element: <Debts/>
    },
    {
      path: 'anual/:year',
      element: <Year/>
    },
    {
      path: 'presupuestos/:year/:month',
      element: <Budgets/>
    },
    {
      path: 'pension',
      element: <Pensions/>
    }
  ]
}

export default MainRoutes
