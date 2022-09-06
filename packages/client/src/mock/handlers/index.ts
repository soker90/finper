import { loginHandlers } from './auth/login'
import { debtsHandlers } from './debts'
import { budgetsHandlers } from './budgets'

export const handlers = [
  ...loginHandlers,
  ...debtsHandlers,
  ...budgetsHandlers
]
