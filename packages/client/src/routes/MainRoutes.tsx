import { lazy } from 'react'

import MainLayout from '../layout/MainLayout'
import { Navigate } from 'react-router-dom'

const DashboardDefault = lazy(() => import('../pages/Dashboard'))

// ==============================|| MAIN ROUTING ||============================== //

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
    }
  ]
}

export default MainRoutes
