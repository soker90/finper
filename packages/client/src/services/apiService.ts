import axios from 'axios'
import { ACCOUNTS, BUDGETS, CATEGORIES, PENSIONS, TRANSACTIONS } from 'constants/api-paths'
import { Category, Transaction, TransactionType, Account, Pension } from 'types'

export const editAccount = (id: string, params: { name?: string, bank?: string, balance?: number, isActive?: boolean }): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.patch(`${ACCOUNTS}/${id}`, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}

export const addAccount = (params: { name?: string, bank?: string, balance?: number }): Promise<{ data?: Account, error?: string | undefined }> => {
  return axios.post(ACCOUNTS, params).then((data: any) => ({ data: data as Account })).catch((error) => ({ error: error.message }))
}

export const editCategory = (id: string, params: { name: string, type: string }): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.patch(`${CATEGORIES}/${id}`, params).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const addCategory = (params: { name?: string, type: string, balance?: number }): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.post(CATEGORIES, params).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const copyBudgets = async (params: { month: number | string, year: number | string, monthOrigin: number, yearOrigin: number }): Promise<{ error?: string } | any> => {
  return axios.post(BUDGETS, params).catch((error) => ({ error: error.message }))
}

export const editBudget = async ({
  category,
  year,
  month,
  amount
}: { category: string, year: number | string, month: number | string, amount: number }): Promise<any> => {
  return axios.patch(`${BUDGETS}/${category}/${year}/${month}`, { amount }).catch((error) => ({ error: error.message }))
}

export const deleteCategory = (id: string): Promise<{ data?: Category, error?: string | undefined }> => {
  return axios.delete(`${CATEGORIES}/${id}`).then((data: any) => ({ data: data as Category })).catch((error) => ({ error: error.message }))
}

export const addTransaction = (params: { date: string, amount: number, category: string, account: string, note?: string, type: TransactionType }): Promise<{ data?: any, error?: string }> => {
  return axios.post(`${TRANSACTIONS}`, params).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const editTransaction = (id: string, params: { date: string, amount: number, category: string, account: string, note?: string, type: TransactionType }): Promise<{ data?: any, error?: string }> => {
  return axios.put(`${TRANSACTIONS}/${id}`, params).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const deleteTransaction = (id: string): Promise<{ data?: any, error?: string }> => {
  return axios.delete(`${TRANSACTIONS}/${id}`).then((data: any) => ({ data: data as Transaction })).catch((error) => ({ error: error.message }))
}

export const addPensionApi = (params: { amount: number, category: string, account: string }): Promise<{ data?: any, error?: string }> => {
  return axios.post(PENSIONS, params).then((data: any) => ({ data: data as Pension })).catch((error) => ({ error: error.message }))
}

export const editPensionApi = () => {

}
