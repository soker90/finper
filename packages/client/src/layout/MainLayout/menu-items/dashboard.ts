import { DashboardOutlined, TeamOutlined } from '@ant-design/icons'

const dashboard = {
  id: 'group-dashboard',
  title: 'Navegación',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: DashboardOutlined,
      breadcrumbs: true
    },
    {
      id: 'accounts',
      title: 'Cuentas',
      type: 'item',
      url: '/cuentas',
      icon: TeamOutlined,
      breadcrumbs: true
    }
  ]
}

export default dashboard
