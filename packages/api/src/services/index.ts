import config from '../config'
import AccountService from './account.service'
import AuthService from './auth.service'
import BudgetService from './budget.service'
import CategoryService from './category.service'
import DashboardService from './dashboard'
import DebtService from './debt.service'
import LoanService from './loan.service'
import PensionService from './pension.service'
import StoreService from './stores.service'
import TicketService from './ticket.service'
import TransactionService from './transaction.service'
import UserService from './user.service'
import SubscriptionService from './subscription.service'
import SubscriptionCandidateService from './subscription-candidate.service'
import PropertyService from './property.service'
import SupplyService from './supply.service'
import SupplyReadingService from './supply-reading.service'
import TariffsService from './tariffs.service'
import StockService from './stock.service'
import GoalService from './goal.service'
import WealthService from './wealth.service'

export const accountService = new AccountService()
export const authService = new AuthService(config.jwt)
export const budgetService = new BudgetService()
export const categoryService = new CategoryService()
export const dashboardService = new DashboardService()
export const debtService = new DebtService()
export const loanService = new LoanService()
export const pensionService = new PensionService()
export const storeService = new StoreService()
export const ticketService = new TicketService()
export const transactionService = new TransactionService()
export const userService = new UserService()
export const subscriptionService = new SubscriptionService()
export const subscriptionCandidateService = new SubscriptionCandidateService(subscriptionService)
export const propertyService = new PropertyService()
export const supplyService = new SupplyService()
export const supplyReadingService = new SupplyReadingService()
export const tariffsService = new TariffsService()
export const stockService = new StockService()
export const goalService = new GoalService()
export const wealthService = new WealthService()
