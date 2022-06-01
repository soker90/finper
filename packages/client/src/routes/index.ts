import { useRoutes } from 'react-router-dom'

import LoginRoutes from './LoginRoutes'
import MainRoutes from './MainRoutes'

// ==============================|| ROUTING RENDER ||============================== //

export default function Routes () {
  return useRoutes([MainRoutes, LoginRoutes])
}
