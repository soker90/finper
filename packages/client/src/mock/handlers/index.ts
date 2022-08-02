import { loginHandlers } from './auth/login'
import { debtsHandlers } from './debts'

export const handlers = [
  ...loginHandlers,
  ...debtsHandlers
]
