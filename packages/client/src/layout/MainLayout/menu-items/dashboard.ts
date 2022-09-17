import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  EuroOutlined,
  CalendarOutlined,
  ProfileOutlined
} from '@ant-design/icons'

const date = new Date()

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
      id: 'transactions',
      title: 'Movimientos',
      type: 'item',
      url: '/movimientos',
      icon: CreditCardOutlined,
      breadcrumbs: true
    },
    {
      id: 'budgets',
      title: 'Presupuesto',
      type: 'item',
      url: `/presupuestos/${date.getFullYear()}/${date.getMonth()}`,
      icon: ProfileOutlined,
      breadcrumbs: true
    },
    {
      id: 'year',
      title: 'Años',
      type: 'item',
      url: `/anual/${date.getFullYear()}`,
      icon: CalendarOutlined,
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
      id: 'debts',
      title: 'Deudas',
      type: 'item',
      url: '/deudas',
      icon: EuroOutlined,
      breadcrumbs: true
    }
  ]
}

export default dashboard
