import axios from 'axios'
import { ACCOUNTS, BUDGETS, CATEGORIES, DEBTS, LOANS, LOAN_DETAIL, PENSIONS, TICKETS, TRANSACTIONS, SUBSCRIPTIONS, SUBSCRIPTION_CANDIDATES } from 'constants/api-paths'
import { Category, Transaction, TransactionType, Account, Pension, PensionTransaction, Debt, Loan, SubscriptionInput } from 'types'

export const editAccount = (id: string, params: {
  name?: string,
  bank?: string,
  balance?: number,
  isActive?: boolean
}): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.patch(`${ACCOUNTS}/${id}`, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}

export const addAccount = (params: { name?: string, bank?: string, balance?: number }): Promise<{
  data?: Account,
  error?: string | undefined
}> => {
  return axios.post(ACCOUNTS, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}

export const editCategory = (id: string, params: { name: string, type: string }): Promise<{
  data?: Category,
  error?: string | undefined
}> => {
  return axios.patch(`${CATEGORIES}/${id}`, params).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const addCategory = (params: { name?: string, type: string, balance?: number }): Promise<{
  data?: Category,
  error?: string | undefined
}> => {
  return axios.post(CATEGORIES, params).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const copyBudgets = async (params: {
  month: number | string,
  year: number | string,
  monthOrigin: number,
  yearOrigin: number
}): Promise<{ error?: string } | any> => {
  return axios.post(BUDGETS, params).catch((error) => ({ error: error.message }))
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
  return axios.patch(`${BUDGETS}/${category}/${year}/${month}`, { amount }).catch((error) => ({ error: error.message }))
}

export const deleteCategory = (id: string): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.delete(`${CATEGORIES}/${id}`).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const addTransaction = (params: {
  date: string,
  amount: number,
  category: string,
  account: string,
  note?: string,
  type: TransactionType
}): Promise<{ data?: any, error?: string }> => {
  return axios.post(`${TRANSACTIONS}`, params).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const editTransaction = (id: string, params: {
  date: string,
  amount: number,
  category: string,
  account: string,
  note?: string,
  type: TransactionType
}): Promise<{ data?: any, error?: string }> => {
  return axios.put(`${TRANSACTIONS}/${id}`, params).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const deleteTransaction = (id: string): Promise<{ data?: any, error?: string }> => {
  return axios.delete(`${TRANSACTIONS}/${id}`).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const addPensionApi = (params: PensionTransaction): Promise<{
  data?: any,
  error?: string
}> => {
  return axios.post(PENSIONS, params).then((data: any) => ({ data: data as Pension })).catch((error) => ({ error: error.message }))
}

export const editPensionApi = (id: string, params: PensionTransaction): Promise<{
  data?: any,
  error?: string
}> => {
  return axios.put(`${PENSIONS}/${id}`, params).then((data: any) => ({ data: data as Pension })).catch((error) => ({ error: error.message }))
}

export const editDebt = (id: string, params: Debt): Promise<{
  data?: Debt,
  error?: string | undefined
}> => {
  return axios.put(`${DEBTS}/${id}`, params).then((data: any) => ({ data: data as Debt })).catch((error) => ({ error: error.message }))
}

export const addDebt = (params: Debt): Promise<{
  data?: Debt,
  error?: string | undefined
}> => {
  return axios.post(DEBTS, params).then((data: any) => ({ data: data as Debt })).catch((error) => ({ error: error.message }))
}

export const deleteDebt = (id: string): Promise<{ data?: any, error?: string }> => {
  return axios.delete(`${DEBTS}/${id}`).then((data: any) => ({ data: data as Debt })).catch((error) => ({ error: error.message }))
}

export const reviewTicket = (id: string): Promise<{ error?: string }> => {
  return axios.patch(`${TICKETS}/${id}`).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

export const deleteTicket = (id: string): Promise<{ error?: string }> => {
  return axios.delete(`${TICKETS}/${id}`).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

export const addLoan = (params: Partial<Loan>): Promise<{ data?: Loan, error?: string }> => {
  return axios.post(LOANS, params).then((data: any) => ({ data: data as Loan })).catch((error: any) => ({ error: error.message }))
}

export const editLoan = (id: string, params: Partial<Loan>): Promise<{ data?: Loan, error?: string }> => {
  return axios.put(`${LOANS}/${id}`, params).then((data: any) => ({ data: data as Loan })).catch((error: any) => ({ error: error.message }))
}

export const deleteLoan = (id: string): Promise<{ error?: string }> => {
  return axios.delete(`${LOANS}/${id}`).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

export const payLoanOrdinary = (id: string, params?: { date?: number, amount?: number, addMovement?: boolean }): Promise<{ error?: string }> => {
  return axios.post(`${LOAN_DETAIL(id)}/pay`, params ?? {}).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

export const payLoanExtraordinary = (id: string, params: { amount: number, mode: 'reduceQuota' | 'reduceTerm', date?: number, addMovement?: boolean }): Promise<{ error?: string }> => {
  return axios.post(`${LOAN_DETAIL(id)}/amortize`, params).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

export const addLoanEvent = (id: string, params: { date: number, newRate: number, newPayment: number }): Promise<{ error?: string }> => {
  return axios.post(`${LOAN_DETAIL(id)}/events`, params).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

export const deleteLoanPayment = (loanId: string, paymentId: string): Promise<{ error?: string }> => {
  return axios.delete(`${LOAN_DETAIL(loanId)}/payments/${paymentId}`).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

export const editLoanPayment = (loanId: string, paymentId: string, params: {
  date?: number,
  amount?: number,
  interest?: number,
  principal?: number,
  type?: 'ordinary' | 'extraordinary'
}): Promise<{ error?: string }> => {
  return axios.put(`${LOAN_DETAIL(loanId)}/payments/${paymentId}`, params).then(() => ({})).catch((error: any) => ({ error: error.message }))
}

// Subscriptions
export const addSubscription = (params: SubscriptionInput): Promise<{ data?: any, error?: string }> =>
  axios.post(SUBSCRIPTIONS, params).then((data: any) => ({ data })).catch((error: any) => ({ error: error.message }))

export const editSubscription = (id: string, params: Partial<SubscriptionInput>): Promise<{ data?: any, error?: string }> =>
  axios.put(`${SUBSCRIPTIONS}/${id}`, params).then((data: any) => ({ data })).catch((error: any) => ({ error: error.message }))

export const deleteSubscription = (id: string): Promise<{ error?: string }> =>
  axios.delete(`${SUBSCRIPTIONS}/${id}`).then(() => ({})).catch((error: any) => ({ error: error.message }))

export const linkSubscriptionTransactions = (id: string, transactionIds: string[]): Promise<{ error?: string }> =>
  axios.post(`${SUBSCRIPTIONS}/${id}/link-transactions`, { transactionIds }).then(() => ({})).catch((error: any) => ({ error: error.message }))

// Candidates
export const assignSubscriptionCandidate = (candidateId: string, subscriptionId: string): Promise<{ error?: string }> =>
  axios.post(`${SUBSCRIPTION_CANDIDATES}/${candidateId}/assign`, { subscriptionId }).then(() => ({})).catch((error: any) => ({ error: error.message }))

export const dismissSubscriptionCandidate = (candidateId: string): Promise<{ error?: string }> =>
  axios.post(`${SUBSCRIPTION_CANDIDATES}/${candidateId}/dismiss`).then(() => ({})).catch((error: any) => ({ error: error.message }))
