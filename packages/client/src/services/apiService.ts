import axios from 'axios'
import { ACCOUNTS, BUDGETS, CATEGORIES, DEBTS, LOANS, LOAN_DETAIL, PENSIONS, TICKETS, TRANSACTIONS, SUBSCRIPTIONS, SUBSCRIPTION_CANDIDATES, SUPPLIES, SUPPLIES_PROPERTIES, SUPPLIES_READINGS, STOCKS, GOALS } from 'constants/api-paths'
import { Category, Transaction, TransactionType, Account, Pension, PensionTransaction, Debt, Loan, SubscriptionInput, SupplyReadingInput, StockPurchase, Goal } from 'types'

const extractError = (error: any) => error.response?.data?.message || error.message

export const editAccount = (id: string, params: {
  name?: string,
  bank?: string,
  balance?: number,
  isActive?: boolean
}): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.patch(`${ACCOUNTS}/${id}`, params).then((data: any) => ({ data: data as Account })).catch((error: any) => ({ error: extractError(error) }))
}

export const addAccount = (params: { name?: string, bank?: string, balance?: number }): Promise<{
  data?: Account,
  error?: string | undefined
}> => {
  return axios.post(ACCOUNTS, params).then((data: any) => ({ data: data as Account })).catch((error: any) => ({ error: extractError(error) }))
}

export const transferAccountMoney = (params: { sourceId: string, destinationId: string, amount: number }): Promise<{
  error?: string | undefined
}> => {
  return axios.post(`${ACCOUNTS}/transfer`, params).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const editCategory = (id: string, params: { name: string, type: string }): Promise<{
  data?: Category,
  error?: string | undefined
}> => {
  return axios.patch(`${CATEGORIES}/${id}`, params).then((data: any) => ({ data: data as Category })).catch((error: any) => ({ error: extractError(error) }))
}

export const addCategory = (params: { name?: string, type: string, balance?: number }): Promise<{
  data?: Category,
  error?: string | undefined
}> => {
  return axios.post(CATEGORIES, params).then((data: any) => ({ data: data as Category })).catch((error: any) => ({ error: extractError(error) }))
}

export const copyBudgets = async (params: {
  month: number | string,
  year: number | string,
  monthOrigin: number,
  yearOrigin: number
}): Promise<{ error?: string } | any> => {
  return axios.post(BUDGETS, params).catch((error: any) => ({ error: extractError(error) }))
}

export const editBudget = async ({
  category,
  year,
  month,
  amount
}: {
  category: string,
  year: number | string,
  month: number | string,
  amount: number
}): Promise<any> => {
  return axios.patch(`${BUDGETS}/${category}/${year}/${month}`, { amount }).catch((error: any) => ({ error: extractError(error) }))
}

export const deleteCategory = (id: string): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.delete(`${CATEGORIES}/${id}`).then((data: any) => ({ data: data as Category })).catch((error: any) => ({ error: extractError(error) }))
}

export const addTransaction = (params: {
  date: string,
  amount: number,
  category: string,
  account: string,
  note?: string,
  type: TransactionType
}): Promise<{ data?: any, error?: string }> => {
  return axios.post(`${TRANSACTIONS}`, params).then((data: any) => ({ data: data as Transaction })).catch((error: any) => ({ error: extractError(error) }))
}

export const editTransaction = (id: string, params: {
  date: string,
  amount: number,
  category: string,
  account: string,
  note?: string,
  type: TransactionType
}): Promise<{ data?: any, error?: string }> => {
  return axios.put(`${TRANSACTIONS}/${id}`, params).then((data: any) => ({ data: data as Transaction })).catch((error: any) => ({ error: extractError(error) }))
}

export const deleteTransaction = (id: string): Promise<{ data?: any, error?: string }> => {
  return axios.delete(`${TRANSACTIONS}/${id}`).then((data: any) => ({ data: data as Transaction })).catch((error: any) => ({ error: extractError(error) }))
}

export const addPensionApi = (params: PensionTransaction): Promise<{
  data?: any,
  error?: string
}> => {
  return axios.post(PENSIONS, params).then((data: any) => ({ data: data as Pension })).catch((error: any) => ({ error: extractError(error) }))
}

export const editPensionApi = (id: string, params: PensionTransaction): Promise<{
  data?: any,
  error?: string
}> => {
  return axios.put(`${PENSIONS}/${id}`, params).then((data: any) => ({ data: data as Pension })).catch((error: any) => ({ error: extractError(error) }))
}

export const editDebt = (id: string, params: Debt): Promise<{
  data?: Debt,
  error?: string | undefined
}> => {
  return axios.put(`${DEBTS}/${id}`, params).then((data: any) => ({ data: data as Debt })).catch((error: any) => ({ error: extractError(error) }))
}

export const addDebt = (params: Debt): Promise<{
  data?: Debt,
  error?: string | undefined
}> => {
  return axios.post(DEBTS, params).then((data: any) => ({ data: data as Debt })).catch((error: any) => ({ error: extractError(error) }))
}

export const deleteDebt = (id: string): Promise<{ data?: any, error?: string }> => {
  return axios.delete(`${DEBTS}/${id}`).then((data: any) => ({ data: data as Debt })).catch((error: any) => ({ error: extractError(error) }))
}

export const payDebt = (id: string, amount: number): Promise<{ data?: Debt | null, error?: string }> => {
  return axios.post(`${DEBTS}/${id}/pay`, { amount }).then((data: any) => ({ data: data as Debt })).catch((error: any) => ({ error: extractError(error) }))
}

export const reviewTicket = (id: string): Promise<{ error?: string }> => {
  return axios.patch(`${TICKETS}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const deleteTicket = (id: string): Promise<{ error?: string }> => {
  return axios.delete(`${TICKETS}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const addLoan = (params: Partial<Loan>): Promise<{ data?: Loan, error?: string }> => {
  return axios.post(LOANS, params).then((data: any) => ({ data: data as Loan })).catch((error: any) => ({ error: extractError(error) }))
}

export const editLoan = (id: string, params: Partial<Loan>): Promise<{ data?: Loan, error?: string }> => {
  return axios.put(`${LOANS}/${id}`, params).then((data: any) => ({ data: data as Loan })).catch((error: any) => ({ error: extractError(error) }))
}

export const deleteLoan = (id: string): Promise<{ error?: string }> => {
  return axios.delete(`${LOANS}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const payLoanOrdinary = (id: string, params?: { date?: number, amount?: number, addMovement?: boolean }): Promise<{ error?: string }> => {
  return axios.post(`${LOAN_DETAIL(id)}/pay`, params ?? {}).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const payLoanExtraordinary = (id: string, params: { amount: number, mode: 'reduceQuota' | 'reduceTerm', date?: number, addMovement?: boolean }): Promise<{ error?: string }> => {
  return axios.post(`${LOAN_DETAIL(id)}/amortize`, params).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const addLoanEvent = (id: string, params: { date: number, newRate: number, newPayment: number }): Promise<{ error?: string }> => {
  return axios.post(`${LOAN_DETAIL(id)}/events`, params).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const deleteLoanPayment = (loanId: string, paymentId: string): Promise<{ error?: string }> => {
  return axios.delete(`${LOAN_DETAIL(loanId)}/payments/${paymentId}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

export const editLoanPayment = (loanId: string, paymentId: string, params: {
  date?: number,
  amount?: number,
  interest?: number,
  principal?: number,
  type?: 'ordinary' | 'extraordinary'
}): Promise<{ error?: string }> => {
  return axios.put(`${LOAN_DETAIL(loanId)}/payments/${paymentId}`, params).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))
}

// Subscriptions
export const addSubscription = (params: SubscriptionInput): Promise<{ data?: any, error?: string }> =>
  axios.post(SUBSCRIPTIONS, params).then((data: any) => ({ data })).catch((error: any) => ({ error: extractError(error) }))

export const editSubscription = (id: string, params: Partial<SubscriptionInput>): Promise<{ data?: any, error?: string }> =>
  axios.put(`${SUBSCRIPTIONS}/${id}`, params).then((data: any) => ({ data })).catch((error: any) => ({ error: extractError(error) }))

export const deleteSubscription = (id: string): Promise<{ error?: string }> =>
  axios.delete(`${SUBSCRIPTIONS}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

export const linkSubscriptionTransactions = (id: string, transactionIds: string[]): Promise<{ error?: string }> =>
  axios.post(`${SUBSCRIPTIONS}/${id}/link-transactions`, { transactionIds }).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

export const unlinkSubscriptionTransaction = (id: string, transactionId: string): Promise<{ error?: string }> =>
  axios.delete(`${SUBSCRIPTIONS}/${id}/unlink-transactions/${transactionId}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

// Candidates
export const assignSubscriptionCandidate = (candidateId: string, subscriptionId: string): Promise<{ error?: string }> =>
  axios.post(`${SUBSCRIPTION_CANDIDATES}/${candidateId}/assign`, { subscriptionId }).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

export const dismissSubscriptionCandidate = (candidateId: string): Promise<{ error?: string }> =>
  axios.post(`${SUBSCRIPTION_CANDIDATES}/${candidateId}/dismiss`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

// Properties
export const addProperty = (params: { name: string }): Promise<{ data?: any, error?: string }> =>
  axios.post(SUPPLIES_PROPERTIES, params).then((data: any) => ({ data })).catch((error: any) => ({ error: extractError(error) }))

export const editProperty = (id: string, params: { name: string }): Promise<{ data?: any, error?: string }> =>
  axios.put(`${SUPPLIES_PROPERTIES}/${id}`, params).then((data: any) => ({ data })).catch((error: any) => ({ error: extractError(error) }))

export const deleteProperty = (id: string): Promise<{ error?: string }> =>
  axios.delete(`${SUPPLIES_PROPERTIES}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

// Supplies
export const addSupply = (params: { name?: string, type: string, propertyId: string }): Promise<{ data?: any, error?: string }> =>
  axios.post(`${SUPPLIES}`, params).then((data: any) => ({ data })).catch((error: any) => ({ error: extractError(error) }))

export const editSupply = (id: string, params: { name?: string, type: string, propertyId: string }): Promise<{ data?: any, error?: string }> =>
  axios.put(`${SUPPLIES}/${id}`, params).then((data: any) => ({ data })).catch((error: any) => ({ error: extractError(error) }))

export const deleteSupply = (id: string): Promise<{ error?: string }> =>
  axios.delete(`${SUPPLIES}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

// Supply Readings
export const addSupplyReading = (params: SupplyReadingInput): Promise<{ data?: any, error?: string }> =>
  axios.post(SUPPLIES_READINGS, params)
    .then((data: any) => ({ data }))
    .catch((error: any) => ({ error: extractError(error) }))

export const editSupplyReading = (id: string, params: SupplyReadingInput): Promise<{ data?: any, error?: string }> =>
  axios.put(`${SUPPLIES_READINGS}/${id}`, params)
    .then((data: any) => ({ data }))
    .catch((error: any) => ({ error: extractError(error) }))

export const deleteSupplyReading = (id: string): Promise<{ error?: string }> =>
  axios.delete(`${SUPPLIES_READINGS}/${id}`)
    .then(() => ({}))
    .catch((error: any) => ({ error: extractError(error) }))

// Stocks
export const addStockApi = (params: Omit<StockPurchase, '_id'>): Promise<{ data?: StockPurchase, error?: string }> =>
  axios.post(STOCKS, params).then((data: any) => ({ data })).catch((error: any) => ({ error: extractError(error) }))

export const deleteStockApi = (id: string): Promise<{ error?: string }> =>
  axios.delete(`${STOCKS}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

export const addGoal = (params: { name: string, targetAmount: number, deadline?: string | null, color: string, icon: string }): Promise<{ data?: Goal, error?: string }> =>
  axios.post(GOALS, params).then((data: any) => ({ data: data as Goal })).catch((error: any) => ({ error: extractError(error) }))

export const editGoal = (id: string, params: { name?: string, targetAmount?: number, currentAmount?: number, deadline?: string | null, color?: string, icon?: string }): Promise<{ data?: Goal, error?: string }> =>
  axios.put(`${GOALS}/${id}`, params).then((data: any) => ({ data: data as Goal })).catch((error: any) => ({ error: extractError(error) }))

export const deleteGoal = (id: string): Promise<{ error?: string }> =>
  axios.delete(`${GOALS}/${id}`).then(() => ({})).catch((error: any) => ({ error: extractError(error) }))

export const fundGoal = (id: string, amount: number): Promise<{ data?: Goal, error?: string }> =>
  axios.post(`${GOALS}/${id}/fund`, { amount }).then((data: any) => ({ data: data as Goal })).catch((error: any) => ({ error: extractError(error) }))

export const withdrawGoal = (id: string, amount: number): Promise<{ data?: Goal, error?: string }> =>
  axios.post(`${GOALS}/${id}/withdraw`, { amount }).then((data: any) => ({ data: data as Goal })).catch((error: any) => ({ error: extractError(error) }))
