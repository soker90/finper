import { loginHandlers } from './auth/login'
import * as debtsHandlers from './debts'

export const handlers = [
  ...loginHandlers,
  debtsHandlers
]
