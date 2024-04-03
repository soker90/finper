import config from '../config'
import AccountService from './account.service'
import AuthService from './auth.service'
import BudgetService from './budget.service'
import CategoryService from './category.service'
import DebtService from './debt.service'
import PensionService from './pension.service'
import StoreService from './stores.service'
import TransactionService from './transaction.service'
import UserService from './user.service'

export const accountService = new AccountService()
export const authService = new AuthService(config.jwt)
export const budgetService = new BudgetService()
export const categoryService = new CategoryService()
export const debtService = new DebtService()
export const pensionService = new PensionService()
export const storeService = new StoreService()
export const transactionService = new TransactionService()
export const userService = new UserService()
