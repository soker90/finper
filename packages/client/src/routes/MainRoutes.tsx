import { lazy } from 'react'

import MainLayout from '../layout/MainLayout'

const DashboardDefault = lazy(() => import('../pages/Dashboard'))

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    }
  ]
}

export default MainRoutes
