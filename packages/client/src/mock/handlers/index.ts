import { loginHandlers } from './auth/login'
import { accountsHandlers } from './accounts'
import { categoriesHandlers } from './categories'
import { dashboardHandlers } from './dashboard'
import { transactionsHandlers } from './transactions'
import { debtsHandlers } from './debts'
import { budgetsHandlers } from './budgets'
import { ticketsHandlers } from './tickets'
import { pensionsHandlers } from './pensions'
import { loansHandlers } from './loans'
import { subscriptionsHandlers } from './subscriptions'
import { suppliesHandlers } from './supplies'

import { stocksHandlers } from './stocks'
import { goalsHandlers } from './goals'
import { statsHandlers } from './stats'

export const handlers = [
  ...loginHandlers,
  ...accountsHandlers,
  ...categoriesHandlers,
  ...dashboardHandlers,
  ...transactionsHandlers,
  ...debtsHandlers,
  ...budgetsHandlers,
  ...ticketsHandlers,
  ...pensionsHandlers,
  ...loansHandlers,
  ...subscriptionsHandlers,
  ...suppliesHandlers,
  ...stocksHandlers,
  ...goalsHandlers,
  ...statsHandlers
]
