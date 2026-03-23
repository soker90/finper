import { loginHandlers } from './auth/login'
import { accountsHandlers } from './accounts'
import { transactionsHandlers } from './transactions'
import { debtsHandlers } from './debts'
import { budgetsHandlers } from './budgets'
import { ticketsHandlers } from './tickets'
import { pensionsHandlers } from './pensions'

export const handlers = [
  ...loginHandlers,
  ...accountsHandlers,
  ...transactionsHandlers,
  ...debtsHandlers,
  ...budgetsHandlers,
  ...ticketsHandlers,
  ...pensionsHandlers
]
