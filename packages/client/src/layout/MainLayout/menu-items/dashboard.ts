import { DashboardOutlined, TeamOutlined, ShoppingCartOutlined } from '@ant-design/icons'

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
    },
    {
      id: 'categories',
      title: 'Categorías',
      type: 'item',
      url: '/categorias',
      icon: ShoppingCartOutlined,
      breadcrumbs: true
    }
  ]
}

export default dashboard
