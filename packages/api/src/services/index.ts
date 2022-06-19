import config from '../config'
import AccountService from './account.service'
import AuthService from './auth.service'
import CategoryService from './category.service'
import StoreService from './stores.service'
import TransactionService from './transaction.service'
import UserService from './user.service'

export const accountService = new AccountService()
export const authService = new AuthService(config.jwt)
export const categoryService = new CategoryService()
export const storeService = new StoreService()
export const transactionService = new TransactionService()
export const userService = new UserService()
