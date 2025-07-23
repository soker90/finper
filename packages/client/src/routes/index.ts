import { useRoutes } from 'react-router'

import LoginRoutes from './LoginRoutes'
import MainRoutes from './MainRoutes'

// ==============================|| ROUTING RENDER ||============================== //

export default function Routes () {
  return useRoutes([MainRoutes, LoginRoutes])
}
