import {
  DashboardOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  EuroOutlined,
  CalendarOutlined,
  ProfileOutlined,
  FileImageOutlined,
  BankOutlined,
  SyncOutlined,
  HomeOutlined,
  StockOutlined
} from '@ant-design/icons'
import { BeachIcon } from 'components'

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
      id: 'tickets',
      title: 'Tickets',
      type: 'item',
      url: '/tickets',
      icon: FileImageOutlined,
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
    },
    {
      id: 'pensions',
      title: 'Pensión',
      type: 'item',
      url: '/pension',
      icon: BeachIcon,
      breadcrumbs: true
    },
    {
      id: 'stocks',
      title: 'Acciones',
      type: 'item',
      url: '/acciones',
      icon: StockOutlined,
      breadcrumbs: true
    },
    {
      id: 'loans',
      title: 'Préstamos',
      type: 'item',
      url: '/prestamos',
      icon: BankOutlined,
      breadcrumbs: true
    },
    {
      id: 'subscriptions',
      title: 'Suscripciones',
      type: 'item',
      url: '/suscripciones',
      icon: SyncOutlined,
      breadcrumbs: true
    },
    {
      id: 'supplies',
      title: 'Suministros',
      type: 'item',
      url: '/suministros',
      icon: HomeOutlined,
      breadcrumbs: true
    }
  ]
}

export default dashboard
