export const ACCOUNTS = 'accounts'
export const CATEGORIES = 'categories'
export const GROUPED_CATEGORIES = 'categories/grouped'
export const DASHBOARD_STATS = 'dashboard/stats'
export const TRANSACTIONS = 'transactions'
export const STORES = 'stores'
export const DEBTS = 'debts'
export const BUDGETS = 'budgets'
export const PENSION_PLANS = 'pension-plans'
export const PENSION_PLAN_DETAIL = (id: string) => `pension-plans/${id}`
export const PENSION_PLAN_MOVEMENTS = (id: string) => `pension-plans/${id}/movements`
export const TICKETS = 'tickets'
export const LOANS = 'loans'
export const LOAN_DETAIL = (id: string) => `loans/${id}`
export const LOAN_SIMULATE = (id: string) => `loans/${id}/simulate-payoff`
export const SUBSCRIPTIONS = 'subscriptions'
export const SUBSCRIPTION_CANDIDATES = 'subscriptions/candidates'
export const SUPPLIES = 'supplies'
export const SUPPLIES_PROPERTIES = 'supplies/properties'
export const SUPPLIES_READINGS = 'supplies/readings'
export const TARIFFS_COMPARISON = (id: string) => `supplies/${id}/tariffs-comparison`
export const STOCKS = 'stocks'
export const STOCKS_SUMMARY = 'stocks/summary'
export const GOALS = 'goals'
export const YIELDS = 'yields'
export const YIELD_DETAIL = (id: string) => `${YIELDS}/${id}`
export const YIELD_MATCHING_TRANSACTIONS = (id: string) => `${YIELD_DETAIL(id)}/matching-transactions`
export const STATS_TAGS_BY_YEAR = (year: number) => `stats/tags?year=${year}`
export const STATS_TAGS_AVAILABLE = 'stats/tags/available'
export const STATS_TAGS_YEARS = 'stats/tags/years'
export const STATS_TAG_HISTORIC = (tagName: string) => `stats/tags/${tagName}`
export const STATS_TAG_DETAIL = (tagName: string, year: number) => `stats/tags/${tagName}/${year}`
export const CREDIT_CARDS = 'credit-cards'
export const CREDIT_CARD_DETAIL = (id: string) => `credit-cards/${id}`
export const CREDIT_CARD_MOVEMENTS = (id: string) => `credit-cards/${id}/movements`
export const CREDIT_CARD_PAY_DEBT = (id: string) => `credit-cards/${id}/pay-debt`
