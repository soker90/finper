import { DashboardOutlined, TeamOutlined, ShoppingCartOutlined, CreditCardOutlined } from '@ant-design/icons'

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
    },
    {
      id: 'transactions',
      title: 'Movimientos',
      type: 'item',
      url: '/movimientos',
      icon: CreditCardOutlined,
      breadcrumbs: true
    }
  ]
}

export default dashboard
