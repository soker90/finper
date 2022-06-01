import { DashboardOutlined } from '@ant-design/icons'

const icons = {
  DashboardOutlined
}

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
      icon: icons.DashboardOutlined,
      breadcrumbs: true
    }
  ]
}

export default dashboard
