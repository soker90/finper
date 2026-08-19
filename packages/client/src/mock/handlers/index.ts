import { loginHandlers } from './auth/login'
import { passkeysHandlers } from './auth/passkeys'
import { accountsHandlers } from './accounts'
import { categoriesHandlers } from './categories'
import { dashboardHandlers } from './dashboard'
import { transactionsHandlers } from './transactions'
import { debtsHandlers } from './debts'
import { budgetsHandlers } from './budgets'
import { ticketsHandlers } from './tickets'
import { pensionPlansHandlers } from './pensionPlans'
import { loansHandlers } from './loans'
import { subscriptionsHandlers } from './subscriptions'
import { suppliesHandlers } from './supplies'

import { stocksHandlers } from './stocks'
import { goalsHandlers } from './goals'
import { statsHandlers } from './stats'
import { yieldsHandlers } from './yields'
import { creditCardHandlers } from './creditCards'

export const handlers = [
  ...loginHandlers,
  ...passkeysHandlers,
  ...accountsHandlers,
  ...categoriesHandlers,
  ...dashboardHandlers,
  ...transactionsHandlers,
  ...debtsHandlers,
  ...budgetsHandlers,
  ...ticketsHandlers,
  ...pensionPlansHandlers,
  ...loansHandlers,
  ...subscriptionsHandlers,
  ...suppliesHandlers,
  ...stocksHandlers,
  ...goalsHandlers,
  ...statsHandlers,
  ...yieldsHandlers,
  ...creditCardHandlers
]
