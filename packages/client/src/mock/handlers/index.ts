import { loginHandlers } from './auth/login'
import { accountsHandlers } from './accounts'
import { dashboardHandlers } from './dashboard'
import { transactionsHandlers } from './transactions'
import { debtsHandlers } from './debts'
import { budgetsHandlers } from './budgets'
import { ticketsHandlers } from './tickets'
import { pensionsHandlers } from './pensions'
import { loansHandlers } from './loans'

export const handlers = [
  ...loginHandlers,
  ...accountsHandlers,
  ...dashboardHandlers,
  ...transactionsHandlers,
  ...debtsHandlers,
  ...budgetsHandlers,
  ...ticketsHandlers,
  ...pensionsHandlers,
  ...loansHandlers
]
